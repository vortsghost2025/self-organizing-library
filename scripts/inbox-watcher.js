#!/usr/bin/env node
/**
 * Library Lane Inbox Watcher
 *
 * Polls lanes/library/inbox/ for new messages, processes by priority,
 * and moves completed messages to processed/.
 *
 * Usage:
 *   node scripts/inbox-watcher.js          # Run once (single scan)
 *   node scripts/inbox-watcher.js --watch  # Continuous polling (60s interval)
 *   node scripts/inbox-watcher.js --check  # Just report inbox status, don't process
 *
 * Per v1.0 inbox message schema and ratified Archivist contract.
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const INBOX_DIR = path.join(__dirname, '..', 'lanes', 'library', 'inbox');
const PROCESSED_DIR = path.join(INBOX_DIR, 'processed');
const EXPIRED_DIR = path.join(INBOX_DIR, 'expired');
const LOG_FILE = path.join(INBOX_DIR, 'watcher.log');
const POLL_INTERVAL_MS = 60000;     // 60 seconds
const LEASE_DURATION_MS = 300000;   // 5 minutes
const MAX_RETRIES = 3;

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

// =============================================================================
// Utilities
// =============================================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(entry) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry
  });

  // Console output
  console.log(`[watcher] ${entry.action || 'unknown'}: ${entry.messageId || entry.details || ''}`);

  // File output (append)
  try {
    ensureDir(path.dirname(LOG_FILE));
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (err) {
    console.error(`[watcher] Failed to write log: ${err.message}`);
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function isHeartbeatFile(filename) {
  return filename.startsWith('heartbeat-') && filename.endsWith('.json');
}

function isSystemFile(filename) {
  return filename === 'README.md' || filename === 'watcher.log' ||
         filename.startsWith('.') || isHeartbeatFile(filename);
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Scan inbox directory and return actionable messages sorted by priority
 */
function scan() {
  ensureDir(INBOX_DIR);
  ensureDir(PROCESSED_DIR);
  ensureDir(EXPIRED_DIR);

  const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json') && !isSystemFile(f));
  const messages = [];

  for (const file of files) {
    const filePath = path.join(INBOX_DIR, file);
    const msg = readJson(filePath);

    if (!msg) {
      log({ action: 'skip', messageId: file, details: 'malformed JSON' });
      continue;
    }

    // Check idempotency: already processed?
    const taskId = msg.task_id || msg.id || file;
    const processedFiles = fs.readdirSync(PROCESSED_DIR);
    const alreadyProcessed = processedFiles.some(pf => {
      const processed = readJson(path.join(PROCESSED_DIR, pf));
      return processed && (processed.task_id === taskId || processed.id === taskId);
    });

    if (alreadyProcessed) {
      log({ action: 'skip', messageId: file, details: `already processed (task_id: ${taskId})` });
      continue;
    }

    // Check lease: if leased by another and not expired, skip
    if (msg.lease && msg.lease.owner && msg.lease.owner !== 'library') {
      const expiresAt = msg.lease.expires_at ? new Date(msg.lease.expires_at).getTime() : 0;
      if (Date.now() < expiresAt) {
        log({ action: 'skip', messageId: file, details: `leased by ${msg.lease.owner} until ${msg.lease.expires_at}` });
        continue;
      }
      // Lease expired - can claim
      log({ action: 'lease-expired', messageId: file, details: `lease by ${msg.lease.owner} expired` });
    }

    messages.push({ file, filePath, msg, taskId });
  }

  // Sort by priority (P0 first)
  messages.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.msg.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.msg.priority] ?? 99;
    return pa - pb;
  });

  return messages;
}

/**
 * Claim a message by updating its lease fields
 */
function acquire(message) {
  const { msg, filePath } = message;
  const now = new Date().toISOString();

  msg.lease = {
    owner: 'library',
    acquired_at: now,
    expires_at: new Date(Date.now() + LEASE_DURATION_MS).toISOString(),
    renew_count: (msg.lease?.renew_count || 0) + 1,
    max_renewals: 3
  };

  writeJson(filePath, msg);
  log({ action: 'acquire', messageId: message.file, details: `leased until ${msg.lease.expires_at}` });

  return msg;
}

/**
 * Process a single message (log + any P0 alerts)
 */
function processMessage(message) {
  const { msg, file } = message;

  log({
    action: 'process',
    messageId: file,
    details: {
      from: msg.from,
      to: msg.to,
      type: msg.type,
      priority: msg.priority,
      subject: msg.subject,
      task_id: msg.task_id || msg.id,
      requires_action: msg.requires_action
    }
  });

  // P0 messages get console alert
  if (msg.priority === 'P0') {
    console.warn(`\n⚠️  P0 MESSAGE: ${msg.subject}`);
    console.warn(`   From: ${msg.from}`);
    console.warn(`   Type: ${msg.type}`);
    console.warn(`   Task: ${msg.task_id || msg.id}`);
    if (msg.requires_action) {
      console.warn(`   ACTION REQUIRED: Yes`);
    }
    console.warn('');
  }

  return true;
}

/**
 * Move message to processed/ directory
 */
function complete(message) {
  const { file, filePath, msg } = message;

  // Update heartbeat status
  if (msg.heartbeat) {
    msg.heartbeat.status = 'done';
    msg.heartbeat.last_heartbeat_at = new Date().toISOString();
  }

  // Set evidence path
  if (msg.evidence) {
    msg.evidence.evidence_path = `lanes/library/inbox/processed/${file}`;
    msg.evidence.verified = true;
    msg.evidence.verified_by = 'library';
    msg.evidence.verified_at = new Date().toISOString();
  }

  // Write to processed
  const processedPath = path.join(PROCESSED_DIR, file);
  writeJson(processedPath, msg);

  // Remove from inbox
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    log({ action: 'error', messageId: file, details: `failed to remove from inbox: ${err.message}` });
  }

  log({ action: 'complete', messageId: file, details: 'moved to processed/' });
}

/**
 * Handle processing failure
 */
function fail(message, error) {
  const { msg, file, filePath } = message;

  // Update retry counter
  if (!msg.retry) msg.retry = {};
  msg.retry.attempt = (msg.retry.attempt || 0) + 1;
  msg.retry.last_error = error.message || String(error);
  msg.retry.last_attempt_at = new Date().toISOString();

  // Release lease
  if (msg.lease) {
    msg.lease.owner = null;
    msg.lease.acquired_at = null;
    msg.lease.expires_at = null;
  }

  if (msg.retry.attempt >= (msg.retry.max_attempts || MAX_RETRIES)) {
    // Max retries exceeded - move to expired
    const expiredPath = path.join(EXPIRED_DIR, file);
    writeJson(expiredPath, msg);
    try {
      fs.unlinkSync(filePath);
    } catch (e) { /* ignore */ }

    log({
      action: 'expire',
      messageId: file,
      details: `max retries (${msg.retry.attempt}) exceeded, moved to expired/`
    });
  } else {
    // Write back with updated retry counter (release for re-acquisition)
    writeJson(filePath, msg);
    log({ action: 'fail', messageId: file, details: `attempt ${msg.retry.attempt}, will retry` });
  }
}

/**
 * Report inbox status without processing
 */
function checkStatus() {
  ensureDir(INBOX_DIR);
  ensureDir(PROCESSED_DIR);

  const files = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json') && !isSystemFile(f));
  const processedFiles = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));
  const expiredFiles = fs.existsSync(EXPIRED_DIR)
    ? fs.readdirSync(EXPIRED_DIR).filter(f => f.endsWith('.json'))
    : [];

  const byPriority = { P0: 0, P1: 0, P2: 0, P3: 0, unknown: 0 };

  for (const file of files) {
    const msg = readJson(path.join(INBOX_DIR, file));
    if (msg && msg.priority) {
      byPriority[msg.priority] = (byPriority[msg.priority] || 0) + 1;
    } else {
      byPriority.unknown++;
    }
  }

  console.log('\n=== Library Lane Inbox Status ===');
  console.log(`Pending:   ${files.length}`);
  console.log(`  P0:      ${byPriority.P0 || 0}`);
  console.log(`  P1:      ${byPriority.P1 || 0}`);
  console.log(`  P2:      ${byPriority.P2 || 0}`);
  console.log(`  P3:      ${byPriority.P3 || 0}`);
  console.log(`  Unknown: ${byPriority.unknown || 0}`);
  console.log(`Processed: ${processedFiles.length}`);
  console.log(`Expired:   ${expiredFiles.length}`);
  console.log('================================\n');

  return { pending: files.length, processed: processedFiles.length, byPriority };
}

/**
 * Run a single scan cycle
 */
function runOnce() {
  log({ action: 'scan-start', details: 'beginning inbox scan' });

  const messages = scan();

  if (messages.length === 0) {
    log({ action: 'scan-complete', details: 'inbox empty, no messages to process' });
    return 0;
  }

  log({ action: 'scan-found', details: `${messages.length} actionable message(s)` });

  let processed = 0;
  for (const message of messages) {
    try {
      acquire(message);
      const success = processMessage(message);
      if (success) {
        complete(message);
        processed++;
      } else {
        fail(message, new Error('processing returned false'));
      }
    } catch (err) {
      fail(message, err);
    }
  }

  log({ action: 'scan-complete', details: `processed ${processed}/${messages.length}` });
  return processed;
}

/**
 * Run continuous polling loop
 */
function runContinuous() {
  console.log(`[watcher] Starting continuous mode (poll every ${POLL_INTERVAL_MS / 1000}s)`);
  console.log(`[watcher] Inbox: ${INBOX_DIR}`);
  console.log(`[watcher] Press Ctrl+C to stop\n`);

  // Initial scan
  runOnce();

  // Polling interval
  const interval = setInterval(() => {
    runOnce();
  }, POLL_INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[watcher] Shutting down...');
    clearInterval(interval);
    log({ action: 'shutdown', details: 'received SIGINT' });
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[watcher] Shutting down...');
    clearInterval(interval);
    log({ action: 'shutdown', details: 'received SIGTERM' });
    process.exit(0);
  });
}

// =============================================================================
// Main
// =============================================================================

const mode = process.argv[2];

if (mode === '--watch' || mode === '--continuous') {
  runContinuous();
} else if (mode === '--check' || mode === '--status') {
  checkStatus();
} else {
  // Default: run once
  const processed = runOnce();
  console.log(`[watcher] Processed ${processed} message(s)`);
}

#!/usr/bin/env node
'use strict';

/**
 * Autonomous Cycle Test (ACT) Round-Robin Daemon
 *
 * Polls all lane inboxes for ACT messages. When an unprocessed ACT message
 * is found, invokes a kilo session in that lane's project directory with
 * a prompt to process the message, complete assigned tasks, choose 2 new
 * tasks, and send them to all other lanes.
 *
 * Safety: max rounds, max consecutive errors, stall detection.
 * Restore: git commit 3fdf360 (pre-test snapshot)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ── Configuration ──────────────────────────────────────────────────────────

const LANE_CONFIG = {
  library: {
    projectDir: 'S:/self-organizing-library',
    inboxDir: 'S:/self-organizing-library/lanes/library/inbox',
    processedDir: 'S:/self-organizing-library/lanes/library/inbox/processed',
    expiredDir: 'S:/self-organizing-library/lanes/library/inbox/expired',
    outboxDir: 'S:/self-organizing-library/lanes/library/outbox',
    actDocsDir: 'S:/self-organizing-library/docs/autonomous-cycle-test',
  },
  archivist: {
    projectDir: 'S:/Archivist-Agent',
    inboxDir: 'S:/Archivist-Agent/lanes/archivist/inbox',
    processedDir: 'S:/Archivist-Agent/lanes/archivist/inbox/processed',
    expiredDir: 'S:/Archivist-Agent/lanes/archivist/inbox/expired',
    outboxDir: 'S:/Archivist-Agent/lanes/archivist/outbox',
    actDocsDir: 'S:/Archivist-Agent/docs/autonomous-cycle-test',
  },
   swarmmind: {
     projectDir: 'S:/SwarmMind',
     inboxDir: 'S:/SwarmMind/lanes/swarmmind/inbox',
     processedDir: 'S:/SwarmMind/lanes/swarmmind/inbox/processed',
     expiredDir: 'S:/SwarmMind/lanes/swarmmind/inbox/expired',
     outboxDir: 'S:/SwarmMind/lanes/swarmmind/outbox',
     actDocsDir: 'S:/SwarmMind/docs/autonomous-cycle-test',
   },
  kernel: {
    projectDir: 'S:/kernel-lane',
    inboxDir: 'S:/kernel-lane/lanes/kernel/inbox',
    processedDir: 'S:/kernel-lane/lanes/kernel/inbox/processed',
    expiredDir: 'S:/kernel-lane/lanes/kernel/inbox/expired',
    outboxDir: 'S:/kernel-lane/lanes/kernel/outbox',
    actDocsDir: 'S:/kernel-lane/docs/autonomous-cycle-test',
  },
};

const DAEMON_STATE_PATH = 'S:/self-organizing-library/docs/autonomous-cycle-test/daemon-state.json';
const DAEMON_LOG_PATH = 'S:/self-organizing-library/docs/autonomous-cycle-test/daemon.log';

const DEFAULTS = {
  pollIntervalMs: 30000,     // 30 seconds between scans
  maxRounds: 20,             // hard stop after 20 rounds
  maxConsecutiveErrors: 3,   // pause after 3 consecutive errors
  sessionTimeoutMs: 600000,  // 10 minute timeout per kilo session
  stallTimeoutMs: 300000,    // 5 minutes with no new messages = stall
  dryRun: false,             // set true to log without invoking kilo
};

// ── State Management ───────────────────────────────────────────────────────

function loadState() {
  try {
    if (fs.existsSync(DAEMON_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(DAEMON_STATE_PATH, 'utf8'));
    }
  } catch (e) {
    log('WARN', `Failed to load daemon state: ${e.message}`);
  }
  return {
    status: 'initialized',
    current_round: 0,
    processed_message_ids: [],
    round_history: [],
    consecutive_errors: 0,
    last_activity_at: null,
    started_at: new Date().toISOString(),
    stalled: false,
    stalled_reason: null,
    human_intervention_required: false,
    human_intervention_reason: null,
    total_sessions_invoked: 0,
  };
}

function saveState(state) {
  const dir = path.dirname(DAEMON_STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DAEMON_STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

// ── Logging ────────────────────────────────────────────────────────────────

function log(level, message, details = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(details && { details }),
  };
  const line = JSON.stringify(entry);
  console.log(`[${entry.timestamp}] [${level}] ${message}`);
  try {
    fs.appendFileSync(DAEMON_LOG_PATH, line + '\n', 'utf8');
  } catch (_) {
    // best effort
  }
}

// ── Inbox Scanner ──────────────────────────────────────────────────────────

function scanDirForActMessages(dir, laneId, location) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('heartbeat-'));
  const messages = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // Identify ACT messages by task_id prefix or subject
      const isActMessage = (raw.task_id && raw.task_id.startsWith('autonomous-cycle-test')) ||
                           (raw.task_id && raw.task_id.startsWith('act-round')) ||
                           (raw.subject && raw.subject.includes('ACT Round'));
      if (isActMessage) {
        messages.push({
          lane: laneId,
          filename: file,
          filepath: filePath,
          task_id: raw.task_id || 'unknown',
          from: raw.from || 'unknown',
          subject: raw.subject || 'no subject',
          priority: raw.priority || 'P3',
          round: extractRoundNumber(raw.task_id || raw.subject || ''),
          location, // 'inbox', 'processed', 'expired'
          raw,
        });
      }
    } catch (e) {
      // skip malformed
    }
  }

  return messages;
}

function scanInbox(laneId) {
  const config = LANE_CONFIG[laneId];
  if (!config) return [];

  // Scan all three locations: inbox, processed, expired
  // The inbox watcher may have already moved messages, so we need to check processed/ too
  const inboxMessages = scanDirForActMessages(config.inboxDir, laneId, 'inbox');
  const processedMessages = scanDirForActMessages(config.processedDir, laneId, 'processed');
  const expiredMessages = scanDirForActMessages(config.expiredDir, laneId, 'expired');

  // Combine all found messages
  const allMessages = [...inboxMessages, ...processedMessages, ...expiredMessages];

  // Deduplicate by task_id + lane + location (same task_id can exist in multiple lane inboxes — that's valid)
  const seen = new Set();
  const deduped = allMessages.filter(m => {
    const key = `${m.task_id}@${m.lane}@${m.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

function extractRoundNumber(str) {
  const match = str.match(/round[_-]?(\\d+)/i) || str.match(/R(\\d+)/i) || str.match(/act-round-(\\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// ── Session Invoker ────────────────────────────────────────────────────────

function buildPrompt(laneId, message) {
  const config = LANE_CONFIG[laneId];
  const allLanes = Object.keys(LANE_CONFIG).filter(l => l !== laneId);
  const canonicalPaths = {
    archivist: 'S:/Archivist-Agent/lanes/archivist/inbox/',
    library: 'S:/self-organizing-library/lanes/library/inbox/',
    swarmmind: 'S:/SwarmMind/lanes/swarmmind/inbox/',
    kernel: 'S:/kernel-lane/lanes/kernel/inbox/',
  };

  const targetList = allLanes.map(l => `- ${l}: ${canonicalPaths[l]}`).join('\n');

  return `AUTONOMOUS CYCLE TEST — You have an incoming ACT message in your inbox.\n\nMESSAGE FROM: ${message.from}\nSUBJECT: ${message.subject}\nTASK_ID: ${message.task_id}\nROUND: ${message.round}\n\nRead the full message at: ${message.filepath}\n\nYOUR INSTRUCTIONS:\n1. Read the full ACT message from your inbox\n2. Complete the 2 tasks assigned to your lane (${laneId}) in that message\n3. Choose 2 NEW tasks that ALL lanes should complete to improve cross-lane functioning\n4. Send signed, schema-compliant messages to all other lanes with your 2 new tasks attached\n5. Include this question in each message: "For each lane, what are the next 2 most effective tasks all lanes can complete as tasks that would improve the way we function together?"\n6. Document your round in docs/autonomous-cycle-test/round-${message.round}-${laneId}.json\n7. Move the processed message to your processed/ directory\n8. Commit and push all changes\n\nTARGET LANE INBOXES (write to these CANONICAL paths):\n${targetList}\n\nSIGNING: Use node scripts/sign-outbox-message.js or node scripts/create-signed-message.js to sign outbound messages with your lane's identity.\n\nSCHEMA: All outbound messages MUST conform to the v1.3 inbox message schema (schema_version, task_id, idempotency_key, from, to, type, task_kind, priority, subject, body, timestamp, requires_action, payload, execution, lease, retry, evidence, heartbeat).\n\nIMPORTANT: This is part of the Autonomous Cycle Test. Each lane that receives your message will do the same: complete your tasks, choose 2 new ones, and forward the cycle. The test runs until a lane requires human input.`;
}

function invokeSession(laneId, message, opts) {
  const config = LANE_CONFIG[laneId];
  const prompt = buildPrompt(laneId, message);

  log('INFO', `Invoking kilo session for ${laneId}`, {
    lane: laneId,
    task_id: message.task_id,
    round: message.round,
    projectDir: config.projectDir,
  });

  if (opts.dryRun) {
    log('INFO', `[DRY RUN] Would invoke: kilo run --auto --dir \"${config.projectDir}\" with ${prompt.length} char prompt`);
    return { success: true, dryRun: true, lane: laneId };
  }

  try {
    const output = execSync(`kilo run --auto --dir \\"${config.projectDir}\\" --format json`, {
      input: prompt,
      timeout: opts.sessionTimeoutMs || DEFAULTS.sessionTimeoutMs,
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf8',
      cwd: config.projectDir,
    });

    log('INFO', `Session completed for ${laneId}`, {
      lane: laneId,
      outputLength: output.length,
      outputPreview: output.substring(0, 500),
    });

    return { success: true, lane: laneId, output };
  } catch (e) {
    log('ERROR', `Session failed for ${laneId}: ${e.message}`, {
      lane: laneId,
      error: e.message,
      stderr: e.stderr ? e.stderr.substring(0, 500) : null,
    });
    return { success: false, lane: laneId, error: e.message };
  }
}

// ── Round Tracker ──────────────────────────────────────────────────────────

function updateRoundState(state, laneId, message, result) {
  const roundNum = message.round || (state.current_round + 1);

  if (roundNum > state.current_round) {
    state.current_round = roundNum;
  }

  state.processed_message_ids.push(`${message.task_id}@${message.lane}`);
  state.last_activity_at = new Date().toISOString();
  state.total_sessions_invoked += 1;

  state.round_history.push({
    round: roundNum,
    lane: laneId,
    task_id: message.task_id,
    from: message.from,
    success: result.success,
    dryRun: result.dryRun || false,
    error: result.error || null,
    timestamp: new Date().toISOString(),
  });

  if (result.success) {
    state.consecutive_errors = 0;
  } else {
    state.consecutive_errors += 1;
  }

  // Check for human intervention conditions
  if (state.consecutive_errors >= (DEFAULTS.maxConsecutiveErrors)) {
    state.human_intervention_required = true;
    state.human_intervention_reason = `${state.consecutive_errors} consecutive session failures — last failure in ${laneId}: ${result.error}`;
    state.status = 'paused';
    log('WARN', `HUMAN INTERVENTION REQUIRED: ${state.human_intervention_reason}`);
  }

  if (state.current_round >= DEFAULTS.maxRounds) {
    state.human_intervention_required = true;
    state.human_intervention_reason = `Max rounds (${DEFAULTS.maxRounds}) reached`;
    state.status = 'completed';
    log('INFO', `Max rounds reached — test complete`);
  }

  // Stall detection (informational only — main loop decides to pause)
  if (state.last_activity_at) {
    const elapsed = Date.now() - new Date(state.last_activity_at).getTime();
    if (elapsed > DEFAULTS.stallTimeoutMs && state.round_history.length > 0) {
      state.stalled = true;
      state.stalled_reason = `No new activity for ${Math.round(elapsed / 1000)}s (threshold: ${DEFAULTS.stallTimeoutMs / 1000}s)`;
      log('WARN', `STALL DETECTED: ${state.stalled_reason}`);
    }
  }

  saveState(state);
  return state;
}

// ── Main Daemon Loop ───────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[name] = name === 'dry-run' ? 'true' : 'true';
      continue;
    }
    out[name] = next;
    i += 1;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const opts = {
    ...DEFAULTS,
    dryRun: args['dry-run'] === 'true',
    pollIntervalMs: args.interval ? parseInt(args.interval, 10) : DEFAULTS.pollIntervalMs,
    maxRounds: args['max-rounds'] ? parseInt(args['max-rounds'], 10) : DEFAULTS.maxRounds,
  };

  if (args['max-rounds']) opts.maxRounds = parseInt(args['max-rounds'], 10);
  if (args.interval) opts.pollIntervalMs = parseInt(args.interval, 10);

  log('INFO', 'ACT Round-Robin Daemon starting', {
    opts,
    lanes: Object.keys(LANE_CONFIG),
  });

  let state = loadState();
  state.status = 'running';
  const daemonBootTime = new Date().toISOString();
  // Track when we last saw a NEW message — starts at daemon boot, not historical last_activity_at
  let lastNewMessageAt = Date.now();
  saveState(state);

  log('INFO', `State loaded. Current round: ${state.current_round}. Processed: ${state.processed_message_ids.length} messages.`);

  let pollCount = 0;

  const runLoop = () => {
    // Check if we should stop
    if (state.human_intervention_required) {
      log('WARN', `Daemon paused — human intervention required: ${state.human_intervention_reason}`);
      console.log('\n╔══════════════════════════════════════════════════════════════╗');
      console.log('║  HUMAN INTERVENTION REQUIRED                                ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log(`║  Reason: ${state.human_intervention_reason}`);
      console.log('║                                                              ║');
      console.log('║  To resume: fix the issue and restart the daemon            ║');
      console.log('║  To restore: git checkout 3fdf360                            ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      process.exit(1);
    }

    if (state.status === 'completed') {
      log('INFO', 'Test completed — daemon exiting');
      console.log('\n╔══════════════════════════════════════════════════════════════╗');
      console.log('║  AUTONOMOUS CYCLE TEST COMPLETE                             ║');
      console.log('╠══════════════════════════════════════════════════════════════╣');
      console.log(`║  Total rounds: ${state.current_round}`);
      console.log(`║  Total sessions: ${state.total_sessions_invoked}`);
      console.log(`║  Consecutive errors: ${state.consecutive_errors}`);
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      process.exit(0);
    }

    pollCount++;
    log('INFO', `Poll #${pollCount} — scanning all lane inboxes for ACT messages`);

    // Scan all lane inboxes
    const allActMessages = [];
    for (const laneId of Object.keys(LANE_CONFIG)) {
      try {
        const messages = scanInbox(laneId);
        allActMessages.push(...messages);
      } catch (e) {
        log('ERROR', `Failed to scan ${laneId} inbox: ${e.message}`);
      }
    }

    // Filter out already-processed messages (dedup by task_id + lane combination)
    const newMessages = allActMessages.filter(
      m => !state.processed_message_ids.includes(`${m.task_id}@${m.lane}`)
    );

    if (newMessages.length === 0) {
      log('INFO', `No new ACT messages found. ${allActMessages.length} total, ${state.processed_message_ids.length} already processed.`);

      // Stall detection — based on time since daemon last saw a new message
      const elapsedSinceNew = Date.now() - lastNewMessageAt;
      if (elapsedSinceNew > opts.stallTimeoutMs && state.round_history.length > 0) {
        state.stalled = true;
        state.stalled_reason = `No new ACT messages for ${Math.round(elapsedSinceNew / 1000)}s (threshold: ${opts.stallTimeoutMs / 1000}s)`;
        state.human_intervention_required = true;
        state.human_intervention_reason = `STALL: ${state.stalled_reason} — cycle may have broken`;
        state.status = 'paused';
        saveState(state);
        // Will be caught on next loop iteration
      }

      // Schedule next poll
      setTimeout(runLoop, opts.pollIntervalMs);
      return;
    }

    // Sort by priority (P0 first) then by round number
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    newMessages.sort((a, b) => {
      const pa = priorityOrder[a.priority] || 4;
      const pb = priorityOrder[b.priority] || 4;
      if (pa !== pb) return pa - pb;
      return (a.round || 0) - (b.round || 0);
    });

    log('INFO', `Found ${newMessages.length} new ACT message(s)`, {
      messages: newMessages.map(m => ({ lane: m.lane, from: m.from, task_id: m.task_id, round: m.round })),
    });

    // Reset stall timer since we found new messages
    lastNewMessageAt = Date.now();

    // Process each new message (one at a time to avoid conflicts)
    for (const message of newMessages) {
      if (state.human_intervention_required) break;

      log('INFO', `Processing ACT message for ${message.lane}: ${message.task_id}`);
      const result = invokeSession(message.lane, message, opts);
      state = updateRoundState(state, message.lane, message, result);

      if (!result.success && !opts.dryRun) {
        log('WARN', `Session failed for ${message.lane} — consecutive errors: ${state.consecutive_errors}`);
      }
    }

    // Schedule next poll
    setTimeout(runLoop, opts.pollIntervalMs);
  };

  // Start the loop
  runLoop();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('INFO', 'Daemon received SIGINT — shutting down gracefully');
  const state = loadState();
  state.status = 'shutdown';
  saveState(state);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('INFO', 'Daemon received SIGTERM — shutting down gracefully');
  const state = loadState();
  state.status = 'shutdown';
  saveState(state);
  process.exit(0);
});

main().catch(e => {
  log('ERROR', `Daemon crashed: ${e.message}`, { stack: e.stack });
  const state = loadState();
  state.status = 'crashed';
  state.human_intervention_required = true;
  state.human_intervention_reason = `DAEMON CRASH: ${e.message}`;
  saveState(state);
  process.exit(1);
});

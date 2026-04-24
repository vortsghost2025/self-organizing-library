#!/usr/bin/env node
/**
 * Library Lane Heartbeat
 *
 * Writes a single heartbeat file to the inbox, overwriting in place.
 * Checks other lanes' heartbeats for staleness (>900s = stale).
 *
 * Usage:
 *   node scripts/heartbeat.js              # Write single heartbeat and exit
 *   node scripts/heartbeat.js --continuous # Write heartbeat every 60 seconds
 *   node scripts/heartbeat.js --check      # Check all lanes for staleness
 *   node scripts/heartbeat.js --shutdown   # Write shutdown heartbeat and exit
 *
 * CRITICAL: Overwrites a SINGLE file. NEVER creates multiple files.
 * Per AGENTS.md heartbeat protocol and ratified contract.
 */

const fs = require('fs');
const path = require('path');
const { loadPolicy, assertWatcherConfig } = require('./concurrency-policy');
const crypto = require('crypto');

// =============================================================================
// Configuration
// =============================================================================

const HEARTBEAT_FILE = path.join(__dirname, '..', 'lanes', 'library', 'inbox', 'heartbeat-library.json');
const WRITE_INTERVAL_MS = 60000;       // 60 seconds minimum between writes
const STALENESS_THRESHOLD_MS = 900000; // 15 minutes (900 seconds)

const REPO_ROOT = path.join(__dirname, '..');
const POLICY = loadPolicy(REPO_ROOT);
assertWatcherConfig({
  laneName: 'library',
  heartbeatSeconds: WRITE_INTERVAL_MS / 1000
}, POLICY);

const OTHER_LANE_HEARTBEATS = [
  { lane: 'archivist', path: 'S:/Archivist-Agent/lanes/archivist/inbox/heartbeat-archivist.json', repo: 'S:/Archivist-Agent' },
   { lane: 'swarmmind', path: 'S:/SwarmMind/lanes/swarmmind/inbox/heartbeat-swarmmind.json', repo: 'S:/SwarmMind' },
  { lane: 'kernel', path: 'S:/kernel-lane/lanes/kernel/inbox/heartbeat-kernel.json', repo: 'S:/kernel-lane' }
];

const IDEMPOTENCY_KEY = crypto.createHash('sha256').update('heartbeat-library-fixed').digest('hex');

const ACTIVITY_THRESHOLD_MS = 3600000; // 60 minutes — recent git activity means lane is alive

// Track start time for uptime calculation
const startTime = Date.now();

// =============================================================================
// system_state.json writer — SINGLE SOURCE OF TRUTH
// Invariant: contradictions.json → heartbeat.js → system_state.json
// No other script may write system_state.json
// =============================================================================

function writeSystemState(systemState, activeContradictions, processedOk) {
  const broadcastDir = path.join(__dirname, '..', 'lanes', 'broadcast');
  const statePath = path.join(broadcastDir, 'system_state.json');
  const payload = {
    system_status: systemState,
    timestamp: new Date().toISOString(),
    active_contradictions: activeContradictions,
    total_contradictions: activeContradictions.length,
    compaction_enabled: activeContradictions.length === 0,
    compaction_suspend_reason: activeContradictions.length > 0 ? 'Active contradictions present' : null,
    processed_ok: processedOk,
    derived_from: 'contradictions.json',
    written_by: 'heartbeat.js'
  };
  try {
    if (!fs.existsSync(broadcastDir)) {
      fs.mkdirSync(broadcastDir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to write system_state.json:', err.message);
  }
}

// =============================================================================
// Heartbeat Functions
// =============================================================================

/**
 * Build heartbeat payload
 */
function buildHeartbeat(status = 'active') {
  // Count inbox pending
  let inboxPending = 0;
  const inboxDir = path.join(__dirname, '..', 'lanes', 'library', 'inbox');
  try {
    if (fs.existsSync(inboxDir)) {
      const files = fs.readdirSync(inboxDir);
      inboxPending = files.filter(f =>
        f.endsWith('.json') &&
        !f.startsWith('heartbeat-') &&
        f !== 'README.md'
      ).length;
    }
  } catch (err) {
    // Ignore
  }

  // Find last processed timestamp
  let lastProcessed = null;
  const processedDir = path.join(inboxDir, 'processed');

  // Map status to schema-compliant values
  let topLevelStatus, heartbeatStatus;
  if (status === 'active') {
    topLevelStatus = 'in_progress';
    heartbeatStatus = 'in_progress';
  } else if (status === 'shutdown') {
    topLevelStatus = 'done';
    heartbeatStatus = 'done';
  } else {
    topLevelStatus = status;
    heartbeatStatus = status;
  }

  // Load contradictions (truth-over-stability) — derive system_state, do NOT read system_state.json
  let systemState = 'consistent';
  let activeContradictions = [];
  let processedOk = true;
  try {
    const broadcastDir = path.join(__dirname, '..', 'lanes', 'broadcast');
    const contraPath = path.join(broadcastDir, 'contradictions.json');
    if (fs.existsSync(contraPath)) {
      const contraData = JSON.parse(fs.readFileSync(contraPath, 'utf8'));
      activeContradictions = contraData
        .filter(c => c.status === 'active' || c.status === 'resolving')
        .map(c => c.id);
    }
    // TRUTH-OVER-STABILITY: contradictions override system_state
    if (activeContradictions.length > 0) {
      systemState = 'degraded';
    }
    // Verify processed/ completion proof
    if (fs.existsSync(processedDir)) {
      const pFiles = fs.readdirSync(processedDir).filter(f => f.endsWith('.json'));
      for (const f of pFiles) {
        try {
          const msg = JSON.parse(fs.readFileSync(path.join(processedDir, f), 'utf8'));
          if (msg.requires_action) {
            const hasProof = (msg.completion_artifact_path || msg.completion_message_id || msg.resolved_by_task_id || msg.terminal_decision);
            if (!hasProof) { processedOk = false; break; }
          }
        } catch(_) { processedOk = false; break; }
      }
    }
  } catch(err) { /* ignore */ }

  return {
    // Schema v1.2 required fields
    schema_version: '1.2',
    task_id: 'heartbeat-library',
    idempotency_key: IDEMPOTENCY_KEY,
    from: 'library',
    to: 'library',
    type: 'heartbeat',
    task_kind: 'proposal',
    priority: 'P3',
    subject: 'Library Lane Heartbeat',
    body: 'Periodic heartbeat signal from Library lane',
    timestamp: new Date().toISOString(),
    requires_action: false,
    payload: {
      mode: 'inline',
      compression: 'none'
    },
    execution: {
      mode: 'manual',
      engine: 'kilo',
      actor: 'lane'
    },
    lease: {
      owner: null,
      acquired_at: null,
      expires_at: null,
      renew_count: 0,
      max_renewals: 3
    },
    retry: {
      attempt: 1,
      max_attempts: 3,
      last_error: null,
      last_attempt_at: null
    },
    evidence: {
      required: true,
      evidence_path: null,
      verified: false,
      verified_by: null,
      verified_at: null
    },
    heartbeat: {
      status: heartbeatStatus,
      interval_seconds: 60,
      last_heartbeat_at: new Date().toISOString(),
      timeout_seconds: 900
    },
    // Existing custom fields
    status: topLevelStatus,
    lane_id: 'library',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    position: 2,
    authority: 90,
    inbox_pending: inboxPending,
    last_processed: lastProcessed,
    capabilities: ['verification', 'enforcement', 'convergence-gate'],
    system_state: systemState,
    active_contradictions: activeContradictions,
    processed_ok: processedOk,
    compaction_enabled: activeContradictions.length === 0,
    compaction_suspend_reason: activeContradictions.length > 0 ? 'Active contradictions present' : null
  };
}

/**
 * Write heartbeat file (OVERWRITE in place, NEVER create new)
 */
function writeHeartbeat(status = 'active') {
  const heartbeat = buildHeartbeat(status);

  // Write system_state.json (single source of truth: contradictions → heartbeat → system_state)
  writeSystemState(heartbeat.system_state, heartbeat.active_contradictions, heartbeat.processed_ok);

  // Ensure directory exists
  const dir = path.dirname(HEARTBEAT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // CRITICAL: Overwrite single file, never create new files
  fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(heartbeat, null, 2), 'utf8');

  return heartbeat;
}

/**
 * Check if a lane has recent coordination artifacts (NOT a liveness signal).
 *
 * This measures: "Has this lane recently emitted an observable coordination artifact?"
 * It does NOT answer: "Is this lane alive right now?"
 *
 * A lane can be actively thinking, editing files, or waiting on inbox —
 * and still show no recent commit or heartbeat. That's a coordination
 * freshness gap, not a dead lane.
 *
 * Signals checked:
 *   1. Last git commit timestamp (recent checkpoint signal)
 *   2. Uncommitted changes in working tree (session-in-progress signal)
 */
function checkGitActivity(repoPath) {
  const { execSync } = require('child_process');
  try {
    // Primary: last commit timestamp
    const output = execSync('git log -1 --format=%ct', {
      cwd: repoPath,
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString().trim();
    const commitTimestamp = parseInt(output, 10) * 1000;
    const commitAge = Date.now() - commitTimestamp;

    // Secondary: uncommitted changes (means session is active right now)
    let hasUncommittedChanges = false;
    try {
      const status = execSync('git status --porcelain', {
        cwd: repoPath,
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).toString().trim();
      hasUncommittedChanges = status.length > 0;
    } catch (_) { /* ignore */ }

    // Recent coordination if: recent commit OR uncommitted working tree changes
    const recent = commitAge < ACTIVITY_THRESHOLD_MS || hasUncommittedChanges;
    return {
      recent,
      lastCommitTime: new Date(commitTimestamp).toISOString(),
      ageSeconds: Math.floor(commitAge / 1000),
      hasUncommittedChanges
    };
  } catch (err) {
    return { recent: false, lastCommitTime: null, ageSeconds: null, error: err.message };
  }
}

/**
 * Check coordination freshness across all lanes using multi-signal detection.
 *
 * THIS IS NOT A LIVENESS CHECK.
 * It answers: "Has this lane recently emitted an observable coordination artifact?"
 * It does NOT answer: "Is this lane alive right now?"
 *
 * A lane can be actively working but not have recently committed or written
 * a heartbeat — that's a coordination freshness gap, not a dead lane.
 *
 * Signal 1: Heartbeat file timestamp (deliberate coordination signal)
 * Signal 2: Git activity (checkpoint signal)
 *
 * A lane is only marked NO_SIGNAL if BOTH signals are absent.
 */
function checkStaleness() {
  const results = [];
  const now = Date.now();

  console.log('\n=== Lane Coordination Freshness Check ===');
  console.log('(Measures recent coordination artifacts, NOT session liveness)\n');

  // Check own heartbeat
  if (fs.existsSync(HEARTBEAT_FILE)) {
    try {
      const own = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf8'));
      const age = now - new Date(own.timestamp).getTime();
      const isStale = age > STALENESS_THRESHOLD_MS;
      const label = isStale ? '🔇 NO RECENT SIGNAL' : '📡 FRESH';
      console.log(`  library:      ${label} (heartbeat: ${Math.floor(age / 1000)}s ago)`);
      results.push({ lane: 'library', fresh: !isStale, ageSeconds: Math.floor(age / 1000) });
    } catch (err) {
      console.log(`  library:      ❌ ERROR (${err.message})`);
      results.push({ lane: 'library', fresh: false, error: err.message });
    }
  } else {
    console.log(`  library:      🔇 NO HEARTBEAT FILE`);
    results.push({ lane: 'library', fresh: false, error: 'no heartbeat file' });
  }

  // Check other lanes (heartbeat + git activity)
  for (const { lane, path: lanePath, repo } of OTHER_LANE_HEARTBEATS) {
    let heartbeatStale = true;
    let heartbeatAge = null;
    let hbStatus = null;
    let isProxy = false;

    // Signal 1: Heartbeat file
    if (fs.existsSync(lanePath)) {
      try {
        const hb = JSON.parse(fs.readFileSync(lanePath, 'utf8'));
        heartbeatAge = Math.floor((now - new Date(hb.timestamp).getTime()) / 1000);
        heartbeatStale = heartbeatAge > (STALENESS_THRESHOLD_MS / 1000);
        hbStatus = hb.status || 'unknown';
        isProxy = !!(hb.note && hb.note.includes('Proxy heartbeat'));
      } catch (err) {
        heartbeatAge = null;
      }
    }

    // Signal 2: Git activity
    const gitActivity = repo ? checkGitActivity(repo) : { recent: false };

    // Multi-signal decision: no signal only if BOTH signals absent
    const noSignal = heartbeatStale && !gitActivity.recent;

    // Build display — label by what signals are present
    let statusLabel;
    if (hbStatus === 'shutdown') {
      statusLabel = '🛑 SHUTDOWN';
    } else if (noSignal) {
      statusLabel = '🔇 NO RECENT SIGNAL';
    } else if (heartbeatStale && gitActivity.recent) {
      statusLabel = '📡 INDIRECT';
    } else {
      statusLabel = '📡 FRESH';
    }

    const heartbeatInfo = heartbeatAge !== null ? `heartbeat: ${heartbeatAge}s ago` : 'no heartbeat';
    const gitInfo = gitActivity.recent
      ? (gitActivity.hasUncommittedChanges
        ? 'git: uncommitted changes (session active)'
        : `git: ${gitActivity.ageSeconds}s ago`)
      : 'git: no recent commit';

    let line = `  ${lane.padEnd(14)}${statusLabel}  (${heartbeatInfo}, ${gitInfo})`;
    if (isProxy) line += ' [proxy hb]';
    if (heartbeatStale && gitActivity.recent) line += ' (indirect: git only)';

    console.log(line);
    results.push({
      lane,
      fresh: !noSignal,
      heartbeatStale,
      gitRecent: gitActivity.recent,
      ageSeconds: heartbeatAge,
      status: hbStatus,
      isProxy
    });
  }

  // Summary
  const noSignalCount = results.filter(r => !r.fresh).length;
  const indirectCount = results.filter(r => r.fresh && r.heartbeatStale).length;
  console.log(`\n  Total: ${results.length} lanes`);
  console.log(`    Fresh (direct signal):    ${results.length - noSignalCount - indirectCount}`);
  console.log(`    Indirect (git only):      ${indirectCount}`);
  console.log(`    No recent signal:         ${noSignalCount}`);
  console.log('\n  Note: "No recent signal" means no heartbeat or git commit within');
  console.log('  threshold — it does NOT mean the lane is dead. The lane may be');
  console.log('  actively working without having emitted a coordination artifact yet.\n');

  return results;
}

// =============================================================================
// Main
// =============================================================================
// Main
// =============================================================================

const mode = process.argv[2];

if (mode === '--continuous') {
  console.log('[heartbeat] Starting continuous mode (every 60s)');
  console.log('[heartbeat] Press Ctrl+C to stop\n');

  // Write initial heartbeat
  const hb = writeHeartbeat('active');
  console.log(`[heartbeat] Written at ${hb.timestamp}`);

  // Set interval for continuous writes
  const interval = setInterval(() => {
    const hb = writeHeartbeat('active');
    console.log(`[heartbeat] Written at ${hb.timestamp}`);
  }, WRITE_INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[heartbeat] Shutting down...');
    clearInterval(interval);
    writeHeartbeat('shutdown');
    console.log('[heartbeat] Final heartbeat written with status "shutdown"');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clearInterval(interval);
    writeHeartbeat('shutdown');
    process.exit(0);
  });

} else if (mode === '--check') {
  checkStaleness();

} else if (mode === '--shutdown') {
  const hb = writeHeartbeat('shutdown');
  console.log(`[heartbeat] Final heartbeat written at ${hb.timestamp} with status "shutdown"`);

} else {
  // Default: single heartbeat
  const hb = writeHeartbeat('active');
  console.log(`[heartbeat] Written at ${hb.timestamp}`);
}

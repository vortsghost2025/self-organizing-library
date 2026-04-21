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

// =============================================================================
// Configuration
// =============================================================================

const HEARTBEAT_FILE = path.join(__dirname, '..', 'lanes', 'library', 'inbox', 'heartbeat-library.json');
const WRITE_INTERVAL_MS = 60000;       // 60 seconds minimum between writes
const STALENESS_THRESHOLD_MS = 900000; // 15 minutes (900 seconds)

const OTHER_LANE_HEARTBEATS = [
  { lane: 'archivist', path: 'S:/Archivist-Agent/lanes/archivist/inbox/heartbeat-archivist.json' },
  { lane: 'swarmmind', path: 'S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/swarmmind/inbox/heartbeat-swarmmind.json' },
  { lane: 'kernel-lane', path: 'S:/kernel-lane/lanes/kernel-lane/inbox/heartbeat-kernel-lane.json' }
];

// Track start time for uptime calculation
const startTime = Date.now();

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
  try {
    if (fs.existsSync(processedDir)) {
      const processedFiles = fs.readdirSync(processedDir).filter(f => f.endsWith('.json'));
      if (processedFiles.length > 0) {
        // Sort by modification time, get newest
        let newest = null;
        for (const f of processedFiles) {
          const stat = fs.statSync(path.join(processedDir, f));
          if (!newest || stat.mtime > newest.mtime) {
            newest = stat;
          }
        }
        if (newest) {
          lastProcessed = newest.mtime.toISOString();
        }
      }
    }
  } catch (err) {
    // Ignore
  }

  return {
    schema_version: '1.0',
    type: 'heartbeat',
    from: 'library',
    lane_id: 'library',
    timestamp: new Date().toISOString(),
    status: status,
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    position: 2,
    authority: 90,
    inbox_pending: inboxPending,
    last_processed: lastProcessed,
    capabilities: ['verification', 'enforcement', 'convergence-gate']
  };
}

/**
 * Write heartbeat file (OVERWRITE in place, NEVER create new)
 */
function writeHeartbeat(status = 'active') {
  const heartbeat = buildHeartbeat(status);

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
 * Check all other lanes for staleness
 */
function checkStaleness() {
  const results = [];
  const now = Date.now();

  console.log('\n=== Lane Heartbeat Health Check ===\n');

  // Check own heartbeat
  if (fs.existsSync(HEARTBEAT_FILE)) {
    try {
      const own = JSON.parse(fs.readFileSync(HEARTBEAT_FILE, 'utf8'));
      const age = now - new Date(own.timestamp).getTime();
      const isStale = age > STALENESS_THRESHOLD_MS;
      console.log(`  library:      ${isStale ? '⚠️ STALE' : '✅ ACTIVE'} (age: ${Math.floor(age / 1000)}s)`);
      results.push({ lane: 'library', stale: isStale, ageSeconds: Math.floor(age / 1000) });
    } catch (err) {
      console.log(`  library:      ❌ ERROR (${err.message})`);
      results.push({ lane: 'library', stale: true, error: err.message });
    }
  } else {
    console.log(`  library:      ⚠️ NO HEARTBEAT FILE`);
    results.push({ lane: 'library', stale: true, error: 'no heartbeat file' });
  }

  // Check other lanes
  for (const { lane, path: lanePath } of OTHER_LANE_HEARTBEATS) {
    if (fs.existsSync(lanePath)) {
      try {
        const hb = JSON.parse(fs.readFileSync(lanePath, 'utf8'));
        const age = now - new Date(hb.timestamp).getTime();
        const isStale = age > STALENESS_THRESHOLD_MS;
        const statusLabel = hb.status === 'shutdown' ? '🛑 SHUTDOWN' : (isStale ? '⚠️ STALE' : '✅ ACTIVE');
        console.log(`  ${lane.padEnd(14)}${statusLabel} (age: ${Math.floor(age / 1000)}s, status: ${hb.status || 'unknown'})`);
        results.push({ lane, stale: isStale, ageSeconds: Math.floor(age / 1000), status: hb.status });
      } catch (err) {
        console.log(`  ${lane.padEnd(14)}❌ ERROR (${err.message})`);
        results.push({ lane, stale: true, error: err.message });
      }
    } else {
      console.log(`  ${lane.padEnd(14)}⚠️ NO HEARTBEAT FILE`);
      results.push({ lane, stale: true, error: 'no heartbeat file' });
    }
  }

  // Summary
  const staleCount = results.filter(r => r.stale).length;
  console.log(`\n  Total: ${results.length} lanes, ${staleCount} stale\n`);

  if (staleCount > 0) {
    console.warn('⚠️  Stale lanes detected! Report to Archivist if persistent.');
    console.log('');
  }

  return results;
}

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

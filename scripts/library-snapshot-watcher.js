#!/usr/bin/env node
/**
 * Library Snapshot Watcher
 *
 * Watches for new graph snapshots in evidence/graph-snapshots/ and runs
 * the Library lane analyzer automatically.
 *
 * Usage:
 *   node scripts/library-snapshot-watcher.js [--interval=30] [--once]
 *
 * Options:
 *   --interval N   Poll interval in seconds (default: 30)
 *   --once         Check once and exit
 *   --help         Show usage
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const snapshotDir = path.join(repoRoot, 'evidence', 'graph-snapshots');
const stateFile = path.join(repoRoot, '.cache', 'library-snapshot-watcher-state.json');
const DEFAULT_INTERVAL = 30;

function parseArgs() {
  const args = process.argv.slice(2);
  let interval = DEFAULT_INTERVAL;
  let once = false;

  for (const arg of args) {
    if (arg === '--once') once = true;
    else if (arg.startsWith('--interval=')) {
      interval = parseInt(arg.split('=')[1], 10) || DEFAULT_INTERVAL;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Library Snapshot Watcher

Usage:
  node scripts/library-snapshot-watcher.js [--interval=N] [--once]

Options:
  --interval N   Poll interval in seconds (default: 30)
  --once         Check once and exit
  --help, -h     Show this help

Description:
  Watches evidence/graph-snapshots/ for new graph snapshots and runs
  the Library lane analyzer on them. Results are written to
  lanes/library/evidence/findings-XXXX.json
`);
      process.exit(0);
    }
  }

  return { interval, once };
}

function loadState() {
  if (fs.existsSync(stateFile)) {
    try {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch (_) {}
  }
  return { processed: {} };
}

function saveState(state) {
  const cacheDir = path.dirname(stateFile);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function findNewSnapshots(state) {
  if (!fs.existsSync(snapshotDir)) return [];

  const files = fs.readdirSync(snapshotDir)
    .filter(f => f.endsWith('-reduced.json') || f.endsWith('-analysis.json'))
    .map(f => ({
      name: f,
      path: path.join(snapshotDir, f),
      mtime: fs.statSync(path.join(snapshotDir, f)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.filter(f => {
    return !state.processed[f.name] || state.processed[f.name] < f.mtime;
  });
}

function runAnalyzer(snapshotPath) {
  return new Promise((resolve, reject) => {
    const analyzer = path.join(__dirname, 'library-graph-analyzer.js');
    const proc = spawn('node', [analyzer, snapshotPath, '--output-dir=lanes/library/evidence'], {
      cwd: repoRoot,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => stdout += data.toString());
    proc.stderr.on('data', data => stderr += data.toString());

    proc.on('close', code => {
      if (code === 0 || code === null) {
        resolve({ success: true, stdout, stderr });
      } else {
        resolve({ success: false, stdout, stderr, code });
      }
    });

    proc.on('error', reject);
  });
}

async function processSnapshots() {
  const state = loadState();
  const newSnapshots = findNewSnapshots(state);

  if (newSnapshots.length === 0) {
    return { processed: 0, results: [] };
  }

  console.log(`[${new Date().toISOString()}] Found ${newSnapshots.length} new snapshot(s)`);

  const results = [];

  for (const snapshot of newSnapshots) {
    console.log(`[${new Date().toISOString()}] Analyzing: ${snapshot.name}`);

    try {
      const result = await runAnalyzer(snapshot.path);
      console.log(result.stdout || result.stderr || 'No output');

      state.processed[snapshot.name] = snapshot.mtime;
      results.push({ snapshot: snapshot.name, success: result.success });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error analyzing ${snapshot.name}:`, err.message);
      results.push({ snapshot: snapshot.name, success: false, error: err.message });
    }
  }

  saveState(state);
  return { processed: newSnapshots.length, results };
}

async function main() {
  const { interval, once } = parseArgs();

  console.log(`
╔══════════════════════════════════════════════════════════╗
║     LIBRARY SNAPSHOT WATCHER                             ║
║     Watching: ${snapshotDir}                      ║
╚══════════════════════════════════════════════════════════╝
`);

  if (once) {
    const result = await processSnapshots();
    console.log(`\nProcessed ${result.processed} snapshot(s)`);
    process.exit(0);
  }

  console.log(`Polling every ${interval}s. Press Ctrl+C to stop.\n`);

  let first = true;

  const poll = async () => {
    const result = await processSnapshots();
    if (first && result.processed === 0) {
      console.log(`[${new Date().toISOString()}] No new snapshots. Waiting...\n`);
      first = false;
    }
  };

  await poll();
  setInterval(poll, interval * 1000);

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
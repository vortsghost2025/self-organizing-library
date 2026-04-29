#!/usr/bin/env node
/**
 * library-watch.js — Inbox polling notifier for Library lane
 *
 * Watches inbox directories and prints summaries of new messages as they arrive.
 * Does NOT modify or process messages — lane-worker handles routing separately.
 *
 * Usage:
 *   node scripts/library-watch.js [--interval=30] [--once] [--verbose]
 *
 * Options:
 *   --interval SECONDS   Poll interval (default: 30)
 *   --once               Check once and exit
 *   --verbose            Include body preview (first 200 chars)
 *   --help               Show usage
 *
 * State file: .cache/library-watch-state.json (remembers seen task_ids)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.join(__dirname, '..');
const inboxDir = path.join(repoRoot, 'lanes/library/inbox');
const stateFile = path.join(repoRoot, '.cache/library-watch-state.json');
const POLL_INTERVAL = 30; // seconds

// CLI args
const args = process.argv.slice(2);
let interval = POLL_INTERVAL;
let once = false;
let verbose = false;

for (const a of args) {
  if (a === '--once') once = true;
  else if (a === '--verbose') verbose = true;
  else if (a.startsWith('--interval=')) interval = parseInt(a.split('=')[1], 10) || POLL_INTERVAL;
  else if (a === '--help') {
    console.log('Usage: node scripts/library-watch.js [--interval=30] [--once] [--verbose]');
    process.exit(0);
  }
}

// Ensure .cache exists
const cacheDir = path.join(repoRoot, '.cache');
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

// Load or init state
let state = { seen: {}, lastPoll: null };
if (fs.existsSync(stateFile)) {
  try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch (_) {}
}

function saveState() {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function nowISO() { return new Date().toISOString(); }

function scanInbox() {
  const found = [];
  // Scan root inbox for incoming files (pre-lane-worker)
  const rootFiles = fs.readdirSync(inboxDir).filter(f => f.endsWith('.json') && !f.startsWith('.'));
  for (const f of rootFiles) {
    const fp = path.join(inboxDir, f);
    try {
      const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (data.task_id && !state.seen[data.task_id]) {
        found.push({ path: fp, data, dir: 'root' });
      }
    } catch (e) { /* skip invalid */ }
  }

  // Also scan action-required (post-routing)
  const arDir = path.join(inboxDir, 'action-required');
  if (fs.existsSync(arDir)) {
    const arFiles = fs.readdirSync(arDir).filter(f => f.endsWith('.json'));
    for (const f of arFiles) {
      const fp = path.join(arDir, f);
      try {
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        if (data.task_id && !state.seen[data.task_id]) {
          found.push({ path: fp, data, dir: 'action-required' });
        }
      } catch (_) {}
    }
  }

  return found;
}

function formatSummary(item) {
  const d = item.data;
  const lines = [];
  lines.push(`[WATCH] ${nowISO()} — NEW MESSAGE`);
  lines.push(`  Task ID   : ${d.task_id}`);
  lines.push(`  From      : ${d.from} → ${d.to}`);
  lines.push(`  Type      : ${d.type}${d.task_kind ? ` (${d.task_kind})` : ''}`);
  lines.push(`  Priority  : ${d.priority}`);
  lines.push(`  Subject   : ${d.subject}`);
  lines.push(`  Timestamp : ${d.timestamp}`);
  if (verbose && d.body) {
    const preview = d.body.replace(/\n/g, ' ').slice(0, 200);
    lines.push(`  Body      : "${preview}${d.body.length>200?'…':''}"`);
  }
  lines.push(`  File      : ${item.path}`);
  if (d.requires_action) {
    lines.push(`  Action    : REQUIRES_ACTION — lane-worker will route accordingly`);
  } else {
    lines.push(`  Action    : informational (no action required)`);
  }
  lines.push(`  Dir       : ${item.dir}`);
  return lines.join('\n');
}

function markSeen(taskId) {
  state.seen[taskId] = Date.now();
  // keep only last 1000 to bound file size
  const ids = Object.keys(state.seen);
  if (ids.length > 1000) {
    const sorted = ids.sort((a,b) => state.seen[b] - state.seen[a]);
    for (let i=1000; i<sorted.length; i++) delete state.seen[sorted[i]];
  }
  saveState();
}

// Initial banner
console.log(`
╔══════════════════════════════════════════════════════════╗
║     LIBRARY LANE — INBOX WATCH DAEMON (v1.0)             ║
║     Polling every ${interval}s — watching for new mail    ║
║     Press Ctrl+C to stop                                  ║
╚══════════════════════════════════════════════════════════╝
`);

let firstRun = true;

function poll() {
  try {
    const newItems = scanInbox();
    if (newItems.length > 0) {
      console.log(`\n[WATCH] ${nowISO()} — ${newItems.length} new message(s) detected:\n`);
      for (const item of newItems) {
        console.log(formatSummary(item));
        console.log(''); // blank line between items
        markSeen(item.data.task_id);
      }
    } else if (firstRun) {
      console.log(`[WATCH] ${nowISO()} — Inbox clean. Watching...\n`);
      firstRun = false;
    }
    state.lastPoll = nowISO();
    saveState();
  } catch (err) {
    console.error(`[WATCH] Error: ${err.message}`);
  }

  if (!once) {
    setTimeout(poll, interval * 1000);
  }
}

// Start
poll();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[WATCH] Shutting down...');
  saveState();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[WATCH] Term signal received');
  saveState();
  process.exit(0);
});

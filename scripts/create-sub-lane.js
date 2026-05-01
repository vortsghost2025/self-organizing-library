#!/usr/bin/env node
/**
 * create-sub-lane.js — Generate a specialized Library sub-lane
 *
 * Creates a new lane directory that shares Library's codebase but has
 * separate inbox/outbox/state and identity. The sub-lane can filter
 * inbox items by subject/priority to specialize its work.
 *
 * Usage:
 *   node scripts/create-sub-lane.js --name validator --filter "verification|triage"
 *   node scripts/create-sub-lane.js --name reconciler --filter "reconcile|global"
 *   node scripts/create-sub-lane.js --name siteindex --filter "site-index|generate"
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const nameIndex = args.indexOf('--name');
const filterIndex = args.indexOf('--filter');

if (nameIndex === -1 || filterIndex === -1) {
  console.error(`
Usage: node scripts/create-sub-lane.js --name <sub-lane-name> --filter "<subject-filter>"

Examples:
  node scripts/create-sub-lane.js --name validator --filter "verification|triage"
  node scripts/create-sub-sub-lane.js --name reconciler --filter "reconcile|global"

Creates a new sub-lane at S:/library-<name> with:
  - Separate inbox/outbox/state directories
  - Shared .identity (symlink to main Library keys)
  - Filtered lane-worker (only processes matching subjects)
  - Minimal config (lane.json, system_state.json)
`);

const name = args[nameIndex + 1];
const filter = args[filterIndex + 1];

if (!name || !filter) {
  process.exit(1);
}

const laneRoot = path.join('S:/', 'library-' + name);
const laneId = name;  // e.g., 'validator'

console.log(`Creating sub-lane: ${laneRoot}`);
console.log(`  Lane ID: ${laneId}`);
console.log(`  Inbox filter: ${filter}`);

// Directory structure
;[
  'lanes/' + laneId + '/inbox',
  'lanes/' + laneId + '/outbox',
  'lanes/' + laneId + '/state',
  'lanes/' + laneId + '/processed',
  'lanes/' + laneId + '/quarantine',
  'lanes/' + laneId + '/blocked',
  'context-buffer',
  'logs',
  'evidence',
].forEach(dir => {
  const full = path.join(laneRoot, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Symlink shared code (scripts, src) — avoids duplication
['scripts', 'src', 'data', 'docs'].forEach(sharedDir => {
  const target = path.join(laneRoot, sharedDir);
  const source = path.join('..', 'self-organizing-library', sharedDir);
  if (!fs.existsSync(target)) {
    try {
      fs.symlinkSync(source, target, 'junction');
      console.log(`  [symlink] ${sharedDir} -> ${source}`);
    } catch (e) {
      // Fallback: copy if symlink fails
      fs.cpSync(source, target, { recursive: true });
      console.log(`  [copy] ${sharedDir} (symlink failed, copied)`);
    }
  }
});

// Copy .identity from main Library (or symlink)
const identitySrc = 'S:/self-organizing-library/.identity';
const identityDst = path.join(laneRoot, '.identity');
if (!fs.existsSync(identityDst)) {
  try {
    fs.symlinkSync(identitySrc, identityDst, 'junction');
    console.log(`  [identity] shared keys symlinked`);
  } catch (e) {
    fs.cpSync(identitySrc, identityDst, { recursive: true });
    console.log(`  [identity] copied (symlink failed)`);
  }
}

// Create lane.json config
const laneConfig = {
  lane_id: laneId,
  display_name: 'Library ' + name.charAt(0).toUpperCase() + name.slice(1),
  parent_lane: 'library',
  specialization: name,
  inbox_filter: filter,
  auto_claim: true,
  lease_seconds: 60,
  max_renewals: 3,
  created_at: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(laneRoot, 'lanes', laneId, 'lane.json'),
  JSON.stringify(laneConfig, null, 2)
);
console.log(`  [config] lane.json created`);

// Create system_state.json placeholder
const systemState = {
  lane: laneId,
  status: 'initializing',
  last_heartbeat: null,
  productivity_score: 100,
  capabilities: ['inbox_processing', 'verification_triage', 'graph_analysis'],
  created_at: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(laneRoot, 'lanes', 'broadcast', 'system_state.json'),
  JSON.stringify(systemState, null, 2)
);
console.log(`  [config] system_state.json created`);

// Create a specialized worker wrapper that uses the filter
const workerWrapper = `@echo off
echo Starting ${laneId} specialized worker...
cd /d ${laneRoot}
node ../self-organizing-library/scripts/lane-worker.js --watch --apply --poll-seconds 60 --filter "${filter}"
`;
fs.writeFileSync(path.join(laneRoot, 'run-worker.cmd'), workerWrapper);
console.log(`  [launcher] run-worker.cmd created`);

// Create README for this sub-lane
const readme = `# Library ${name.charAt(0).toUpperCase() + name.slice(1)} Sub-Lane

**Lane ID:** ${laneId}
**Parent:** library
**Specialization:** ${name}
**Inbox Filter:** ${filter}

This is a specialized Library sub-lane. It shares code and identity with the main Library lane but processes only messages matching its filter.

## Operations

- **Start worker:** `run-worker.cmd` or `node ../self-organizing-library/scripts/lane-worker.js --watch --apply --poll-seconds 60 --filter "${filter}"`
- **Inbox:** `lanes/${laneId}/inbox/`
- **Outbox:** `lanes/${laneId}/outbox/`
- **State:** `lanes/${laneId}/state/`

## Notes

- Identity keys are shared with main Library (`.identity/` symlink)
- Processed messages appear in `processed/` subdirectory
- This lane runs in parallel with main Library and other sub-lanes
- All workers compete for inbox items via lease mechanism

Created: ${new Date().toISOString()}
`;
fs.writeFileSync(path.join(laneRoot, 'README.md'), readme);
console.log(`  [doc] README.md created`);

console.log(`\n✅ Sub-lane '${name}' created at ${laneRoot}`);
console.log(`   Start it with: run-worker.cmd (in that directory)`);

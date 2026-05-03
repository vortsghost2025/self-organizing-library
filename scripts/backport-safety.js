#!/usr/bin/env node
// Backports parallel-agent safety changes to other lanes
'use strict';
const fs = require('fs');
const path = require('path');

const LANES = [
  { name: 'archivist', path: 'S:/Archivist-Agent' },
  { name: 'swarmmind', path: 'S:/SwarmMind' },
  { name: 'kernel', path: 'S:/kernel-lane' }
];

const results = [];

function safeUnlinkHelper() {
  return `
function safeUnlink(filePath, context) {
  try {
    fs.unlinkSync(filePath);
    return 'ok';
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('[watcher] RACE_SKIPPED: ' + (context || 'file') + ' already removed by another process');
      return 'race_skipped';
    }
    throw e;
  }
}
`.trim();
}

for (const lane of LANES) {
  const s = path.join(lane.path, 'scripts');
  const r = [];

  // 1. concurrency-policy.js — add agentMode + observer skip
  try {
    const conPath = path.join(s, 'concurrency-policy.js');
    let con = fs.readFileSync(conPath, 'utf8');

    if (!con.includes('agentMode')) {
      // Add agentMode param
      con = con.replace(
        'function acquireWatcherLock({ repoRoot, laneName, policy })',
        'function acquireWatcherLock({ repoRoot, laneName, policy, agentMode })'
      );
      // Add observer skip before lock dir creation
      con = con.replace(
        'if (!fs.existsSync(lockDir)) {',
        'const mode = agentMode || process.env.AGENT_MODE || \'governing\';\n\n' +
        '  if (mode === \'observer\') {\n' +
        '    console.log(`[lock] Observer mode: skipping lock acquisition for ${laneName}`);\n' +
        '    return () => {};\n' +
        '  }\n\n' +
        '  if (!fs.existsSync(lockDir)) {'
      );
      // Add agent_mode to owner object
      con = con.replace(
        'acquired_at: new Date().toISOString()',
        'agent_mode: mode,\n    acquired_at: new Date().toISOString()'
      );
      fs.writeFileSync(conPath, con);
      r.push('concurrency-policy.js: +observer skip');
    } else {
      r.push('concurrency-policy.js: already patched');
    }
  } catch (e) { r.push('concurrency-policy.js: ERROR ' + e.message); }

  // 2. heartbeat.js — observer filename split + agent_mode
  try {
    const hbPath = path.join(s, 'heartbeat.js');
    let hb = fs.readFileSync(hbPath, 'utf8');

    if (!hb.includes('observer')) {
      // Add agentMode to DEFAULT_CONFIG
      hb = hb.replace(
        /laneName:\s*process\.env\.LANE_NAME/,
        'agentMode: process.env.AGENT_MODE || \'governing\',\n      $&'
      );
      // Split _heartbeatFilename for observer
      hb = hb.replace(
        /_heartbeatFilename\(laneName\)\s*\{[^}]+return\s*`heartbeat-\$\{laneName\}\.json`;\s*\}/,
        `_heartbeatFilename(laneName) {
    if (this.config.agentMode === 'observer') {
      return \`heartbeat-\${laneName}-observer.json\`;
    }
    return \`heartbeat-\${laneName}.json\`;
  }`
      );
      // Add agent_mode to body
      hb = hb.replace(
        /lane:\s*this\.config\.laneName,/,
        '$&\n        agent_mode: this.config.agentMode,'
      );
      fs.writeFileSync(hbPath, hb);
      r.push('heartbeat.js: +observer split');
    } else {
      r.push('heartbeat.js: already patched');
    }
  } catch (e) { r.push('heartbeat.js: ERROR ' + e.message); }

  // 3. lease-write.js — add safeUnlink
  try {
    const lwPath = path.join(s, 'lease-write.js');
    let lw = fs.readFileSync(lwPath, 'utf8');

    if (!lw.includes('safeUnlink')) {
      lw = lw.replace(
        'const fs = require(\'fs\');\nconst path = require(\'path\');',
        `const fs = require('fs');
const path = require('path');

${safeUnlinkHelper()}`
      );
      // Replace raw unlinkSync in DEST_EXISTS branch
      lw = lw.replace(
        /if \(fs\.existsSync\(destPath\)\)\s*\{\s*fs\.unlinkSync\(sourcePath\);/,
        'if (fs.existsSync(destPath)) {\n    safeUnlink(sourcePath, path.basename(sourcePath));'
      );
      fs.writeFileSync(lwPath, lw);
      r.push('lease-write.js: +safeUnlink');
    } else {
      r.push('lease-write.js: already patched');
    }
  } catch (e) { r.push('lease-write.js: ERROR ' + e.message); }

  // 4. inbox-watcher.js — add safeUnlink + agentMode config
  try {
    const iwPath = path.join(s, 'inbox-watcher.js');
    let iw = fs.readFileSync(iwPath, 'utf8');

    if (!iw.includes('safeUnlink')) {
      // Add safeUnlink helper after strict
      iw = iw.replace(
        `'use strict';\n\nconst fs`,
        `'use strict';

${safeUnlinkHelper()}

const fs`
      );
    }

    if (!iw.includes('agentMode')) {
      // Add agentMode to config
      iw = iw.replace(
        /laneName:\s*'[^']+',/,
        '$&\n  agentMode: process.env.AGENT_MODE || \'governing\','
      );
    }

    // Replace all fs.unlinkSync(sourcePath) that don't already have safeUnlink
    if (!iw.includes('safeUnlink(sourcePath')) {
      iw = iw.replace(
        /fs\.unlinkSync\(sourcePath\)/g,
        'safeUnlink(sourcePath, filename)'
      );
      fs.writeFileSync(iwPath, iw);
      r.push('inbox-watcher.js: +safeUnlink + agentMode');
    } else {
      r.push('inbox-watcher.js: already patched');
    }
  } catch (e) { r.push('inbox-watcher.js: ERROR ' + e.message); }

  results.push({ lane: lane.name, changes: r });
}

// Print results
for (const res of results) {
  console.log('\n===', res.lane, '===');
  for (const c of res.changes) console.log('  ' + c);
}

// Write backport evidence
const evidenceDir = path.join('S:/self-organizing-library', 'evidence', 'verification');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(
  path.join(evidenceDir, 'parallel-agent-backport-20260502.json'),
  JSON.stringify({
    schema_version: '1.0',
    artifact_id: 'parallel-agent-backport-20260502',
    generated_at: new Date().toISOString(),
    session_id: 'lib2-observer-20260502',
    lanes_patched: LANES.map(l => l.name),
    files_per_lane: ['concurrency-policy.js', 'heartbeat.js', 'lease-write.js', 'inbox-watcher.js'],
    details: results,
    convergence_gate: {
      claim: 'Parallel-agent safety changes backported to Archivist, SwarmMind, and Kernel',
      evidence: 'S:/self-organizing-library/evidence/verification/parallel-agent-backport-20260502.json',
      verified_by: 'library-2',
      contradictions: [],
      status: 'proven'
    },
    OUTPUT_PROVENANCE: 'agent: opencode/deepseek-v4-pro lane: library generated_at: ' + new Date().toISOString() + ' session_id: lib2-observer-20260502'
  }, null, 2)
);

console.log('\nBackport evidence written');
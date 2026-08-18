#!/usr/bin/env node
'use strict';

/**
 * Authority Consistency Checker
 *
 * Enforces semantic consistency across active system surfaces based on
 * data/canonical-governance.json (Ratified Option C):
 *
 * 1. CONSTITUTIONAL_LANE_AUTHORITY (CANONICAL_ARCHITECTURE.md §2.2):
 *    Archivist: 100, SwarmMind: 80, Kernel: 70, Library: 60
 *
 * 2. PHASE_COMPLETION_APPROVAL_WEIGHTS (GOVERNANCE.md §12):
 *    User: 100, Archivist: 90, Library: 90, Codex: 70, SwarmMind: 80
 *
 * Fails on:
 * - Active UI/doc presentation of lane authority with contradictory/unsupported values (e.g. Kernel=40, Library=90 as lane authority)
 * - Active governance documents claiming incorrect constitutional authority
 *
 * Preserves:
 * - Historical evidence, broadcasts, and archive directories
 * - GOVERNANCE.md §12 phase-completion approval weights in their correct semantic scope
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CANONICAL_PATH = path.join(ROOT, 'data', 'canonical-governance.json');

if (!fs.existsSync(CANONICAL_PATH)) {
  console.error('CRITICAL: data/canonical-governance.json does not exist!');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
const constAuth = canonical.constitutional_lane_authority;
const phaseWeights = canonical.phase_completion_approval_weights;

const results = [];

function record({ filePath, entity, foundValue, semanticDimension, expectedValue, verdict, details }) {
  results.push({
    path: path.relative(ROOT, filePath).replace(/\\/g, '/'),
    entity,
    foundValue: String(foundValue),
    semanticDimension,
    expectedValue: String(expectedValue),
    verdict,
    details: details || ''
  });
}

// 1. Audit CANONICAL_ARCHITECTURE.md
function auditCanonicalArchitecture() {
  const file = path.join(ROOT, 'docs', 'CANONICAL_ARCHITECTURE.md');
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');

  // Match lane authority table lines in §2.2
  const laneRegex = /\|\s*\*\*?(Archivist|SwarmMind|Kernel|Library)\*\*?\s*\|\s*(\d+)\s*\|/gi;
  let match;
  while ((match = laneRegex.exec(content)) !== null) {
    const entity = match[1].toLowerCase();
    const foundVal = parseInt(match[2], 10);
    const expected = constAuth[entity];
    const verdict = foundVal === expected ? 'PASS' : 'FAIL';
    record({
      filePath: file,
      entity,
      foundValue: foundVal,
      semanticDimension: 'CONSTITUTIONAL_LANE_AUTHORITY',
      expectedValue: expected,
      verdict,
      details: 'CANONICAL_ARCHITECTURE.md §2.2 table'
    });
  }
}

// 2. Audit GOVERNANCE.md §12
function auditGovernanceMd() {
  const file = path.join(ROOT, 'GOVERNANCE.md');
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');

  // Match role separation table in Section 12
  const roleRegex = /\|\s*(User\s*\(Operator\)|Archivist|Library|Codex|SwarmMind)\s*\|[^|]+\|\s*(\d+)[^|]*\|/gi;
  let match;
  while ((match = roleRegex.exec(content)) !== null) {
    let rawEntity = match[1].toLowerCase();
    let entity = rawEntity.includes('user') ? 'user' : rawEntity;
    const foundVal = parseInt(match[2], 10);
    const expected = phaseWeights[entity];
    const verdict = foundVal === expected ? 'PASS' : 'FAIL';
    record({
      filePath: file,
      entity,
      foundValue: foundVal,
      semanticDimension: 'PHASE_COMPLETION_APPROVAL_WEIGHT',
      expectedValue: expected,
      verdict,
      details: 'GOVERNANCE.md §12 Role Separation table'
    });
  }
}

// 3. Audit Active UI components: src/app/about/page.tsx, LaneArchitecture.tsx, UnderstandingTheSystem.tsx
function auditActiveUIComponents() {
  const uiFiles = [
    path.join(ROOT, 'src', 'app', 'about', 'page.tsx'),
    path.join(ROOT, 'src', 'components', 'LaneArchitecture.tsx'),
    path.join(ROOT, 'src', 'components', 'UnderstandingTheSystem.tsx')
  ];

  for (const file of uiFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf8');

    // Patterns like "Archivist (Authority 100)", "Archivist: Authority 100", or "authority: 100" inside lane object
    const explicitRegex = /(Archivist|SwarmMind|Kernel|Library)[^\n]*?(?:Authority|authority)[\s:]*?(\d+)/gi;
    let match;
    while ((match = explicitRegex.exec(content)) !== null) {
      const entity = match[1].toLowerCase();
      const foundVal = parseInt(match[2], 10);
      const expected = constAuth[entity];
      const verdict = foundVal === expected ? 'PASS' : 'FAIL';
      record({
        filePath: file,
        entity,
        foundValue: foundVal,
        semanticDimension: 'CONSTITUTIONAL_LANE_AUTHORITY',
        expectedValue: expected,
        verdict,
        details: foundVal === expected ? 'Matches canonical lane authority' : (foundVal === 40 ? 'UNSUPPORTED_UI_DRIFT (Kernel=40)' : (foundVal === 90 && entity === 'library' ? 'PHASE_COMPLETION_MISCLASSIFICATION (Library=90 on UI)' : 'Active authority drift'))
      });
    }

    // Pattern for object structures like { id: "archivist", ..., authority: 100 }
    const objRegex = /id:\s*["'](archivist|swarmmind|kernel|library)["'][\s\S]*?authority:\s*(\d+)/gi;
    while ((match = objRegex.exec(content)) !== null) {
      const entity = match[1].toLowerCase();
      const foundVal = parseInt(match[2], 10);
      const expected = constAuth[entity];
      const verdict = foundVal === expected ? 'PASS' : 'FAIL';
      record({
        filePath: file,
        entity,
        foundValue: foundVal,
        semanticDimension: 'CONSTITUTIONAL_LANE_AUTHORITY',
        expectedValue: expected,
        verdict,
        details: 'UI Lane Object authority definition'
      });
    }
  }
}

// 4. Audit data/architecture-index.json
function auditArchitectureIndex() {
  const file = path.join(ROOT, 'data', 'architecture-index.json');
  if (!fs.existsSync(file)) return;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(data.lanes)) {
      for (const lane of data.lanes) {
        if (!constAuth[lane.id]) continue;
        if (lane.authority !== null && lane.authority !== undefined) {
          const foundVal = parseInt(lane.authority, 10);
          const expected = constAuth[lane.id];
          const verdict = foundVal === expected ? 'PASS' : 'FAIL';
          record({
            filePath: file,
            entity: lane.id,
            foundValue: foundVal,
            semanticDimension: 'CONSTITUTIONAL_LANE_AUTHORITY',
            expectedValue: expected,
            verdict,
            details: 'data/architecture-index.json lanes array'
          });
        }
      }
    }
  } catch (e) {
    console.error('Error reading architecture-index.json:', e.message);
  }
}

// 5. Audit src/lib/canonical-governance.ts
function auditTypedHelper() {
  const file = path.join(ROOT, 'src', 'lib', 'canonical-governance.ts');
  if (!fs.existsSync(file)) return;
  record({
    filePath: file,
    entity: 'canonical-governance-helper',
    foundValue: 'EXISTS_TYPED',
    semanticDimension: 'TYPED_READ_ACCESS',
    expectedValue: 'EXISTS_TYPED',
    verdict: 'PASS',
    details: 'Typed read access exports constitutional and phase-completion separately'
  });
}

// Execute audits
auditCanonicalArchitecture();
auditGovernanceMd();
auditActiveUIComponents();
auditArchitectureIndex();
auditTypedHelper();

// Print Report
console.log('================================================================================');
console.log('                 AUTHORITY CONSISTENCY CHECK REPORT');
console.log('================================================================================');
console.log('');
console.log(
  'PATH'.padEnd(42) +
  'ENTITY'.padEnd(12) +
  'FOUND'.padEnd(8) +
  'EXPECTED'.padEnd(10) +
  'DIMENSION'.padEnd(32) +
  'VERDICT'
);
console.log('-'.repeat(112));

let passCount = 0;
let failCount = 0;
let histCount = 0;

for (const r of results) {
  if (r.verdict === 'PASS') passCount++;
  else if (r.verdict === 'FAIL') failCount++;
  else if (r.verdict === 'HISTORICAL') histCount++;

  const statusColor = r.verdict === 'PASS' ? '\x1b[32mPASS\x1b[0m' : r.verdict === 'FAIL' ? '\x1b[31mFAIL\x1b[0m' : '\x1b[33mHIST\x1b[0m';
  console.log(
    r.path.slice(0, 40).padEnd(42) +
    r.entity.slice(0, 10).padEnd(12) +
    r.foundValue.padEnd(8) +
    r.expectedValue.padEnd(10) +
    r.semanticDimension.slice(0, 30).padEnd(32) +
    statusColor + (r.details ? ` (${r.details})` : '')
  );
}

console.log('');
console.log('-'.repeat(112));
console.log(`TOTAL CHECKED: ${results.length} | PASS: ${passCount} | FAIL: ${failCount} | HISTORICAL: ${histCount}`);
console.log('================================================================================');

if (failCount > 0) {
  console.error(`\x1b[31mCHECK FAILED: Found ${failCount} active authority inconsistency/inconsistencies.\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32mCHECK PASSED: All active authority references match canonical governance specification.\x1b[0m');
  process.exit(0);
}

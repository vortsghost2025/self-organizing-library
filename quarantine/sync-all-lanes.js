/**
 * sync-all-lanes.js
 * Cross-lane sync verification - checks consistency across all 4 lanes
 * Reads site-index.json from each lane and verifies consistency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LANES = [
  { name: 'archivist', path: 'S:/Archivist-Agent' },
  { name: 'library', path: 'S:/self-organizing-library' },
  { name: 'swarmmind', path: 'S:/SwarmMind' },
  { name: 'kernel', path: 'S:/kernel-lane' }
];

console.log('=== CROSS-LANE SYNC VERIFICATION ===\n');

const results = {
  timestamp: new Date().toISOString(),
  lanes: [],
  consistent: true,
  issues: []
};

let totalPass = 0;
let totalFail = 0;

LANES.forEach(lane => {
  console.log(`Checking lane: ${lane.name}...`);
  
  const siteIndex = path.join(lane.path, 'data/site-index.json');
  const systemState = path.join(lane.path, 'lanes/broadcast/system_state.json');
  
  const laneResult = {
    lane: lane.name,
    siteIndexExists: false,
    systemStateExists: false,
    siteIndexValid: false,
    systemStateValid: false,
    issues: []
  };
  
  try {
    if (fs.existsSync(siteIndex)) {
      laneResult.siteIndexExists = true;
      const data = JSON.parse(fs.readFileSync(siteIndex, 'utf8'));
      if (data.schema_version) {
        laneResult.siteIndexValid = true;
        totalPass++;
        console.log(`  ✅ site-index.json: valid (${data.stats?.total_files || 0} files)`);
      } else {
        laneResult.issues.push('site-index.json missing schema_version');
        totalFail++;
      }
    } else {
      laneResult.issues.push('site-index.json not found');
      totalFail++;
      console.log(`  ❌ site-index.json: not found`);
    }
  } catch (e) {
    laneResult.issues.push(`site-index.json error: ${e.message}`);
    totalFail++;
  }
  
  try {
    if (fs.existsSync(systemState)) {
      laneResult.systemStateExists = true;
      const data = JSON.parse(fs.readFileSync(systemState, 'utf8'));
      if (data.health) {
        laneResult.systemStateValid = true;
        totalPass++;
        console.log(`  ✅ system_state.json: valid (health: ${data.health?.status || 'unknown'})`);
      } else {
        laneResult.issues.push('system_state.json missing health data');
        totalFail++;
      }
    } else {
      laneResult.issues.push('system_state.json not found');
      totalFail++;
      console.log(`  ❌ system_state.json: not found`);
    }
  } catch (e) {
    laneResult.issues.push(`system_state.json error: ${e.message}`);
    totalFail++;
  }
  
  results.lanes.push(laneResult);
  if (laneResult.issues.length > 0) {
    results.consistent = false;
    results.issues.push(...laneResult.issues.map(i => `[${lane.name}] ${i}`));
  }
  console.log('');
});

console.log('=== SUMMARY ===');
console.log(`Pass: ${totalPass}`);
console.log(`Fail: ${totalFail}`);
console.log(`Consistent: ${results.consistent ? '✅ YES' : '❌ NO'}`);

if (results.issues.length > 0) {
  console.log('\nIssues:');
  results.issues.forEach(i => console.log(`  - ${i}`));
}

// Write results
const outputPath = 'S:/self-organizing-library/reports/cross-lane-sync-' + 
  new Date().toISOString().replace(/[:\.]/g, '-') + '.json';
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nResults written: ${outputPath}`);

process.exit(results.consistent ? 0 : 1);

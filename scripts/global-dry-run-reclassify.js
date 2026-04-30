const fs = require('fs');
const path = require('path');

// Determine snapshot path
let SNAPSHOT_PATH = 'C:/Users/seand/Downloads/graph-snapshot-2026-04-30-14-25-58-478.json';
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--graph' && process.argv[i+1]) {
    SNAPSHOT_PATH = process.argv[i+1];
    break;
  }
}

console.log('=== GLOBAL TAG-ARTIFACT RECLASSIFICATION — DRY RUN ===\n');

if (!fs.existsSync(SNAPSHOT_PATH)) {
  console.error(`ERROR: Snapshot not found: ${SNAPSHOT_PATH}`);
  console.error('Usage: node global-dry-run-reclassify.js --graph <path>');
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const nodes = graph.nodes || [];
const edges = graph.edges || [];

console.log(`Graph: ${nodes.length} nodes, ${edges.length} edges`);
console.log(`Status:`, graph.status_counts);

const contradicts = edges.filter(e => e.type === 'CONTRADICTS');
const nodesWithContra = new Set();
contradicts.forEach(e => { nodesWithContra.add(e.source); nodesWithContra.add(e.target); });

const conflicted = nodes.filter(n => n.status === 'CONFLICTED');
console.log(`\nConflicted: ${conflicted.length} total`);
console.log(`With CONTRADICTS edges: ${nodesWithContra.size}`);
console.log(`CONTRADICTS edges present: ${contradicts.length}`);

const classes = { artifact: [], direct: [], mixed: [], ambiguous: [] };
conflicted.forEach(node => {
  const hasContra = nodesWithContra.has(node.id);
  const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const sharedTagCount = nodeEdges.filter(e => e.type === 'shared-tag').length;
  const contraCount = node.contradictionCount || 0;

  if (!hasContra && contraCount >= 39) classes.artifact.push(node);
  else if (hasContra && sharedTagCount > 10) classes.mixed.push(node);
  else if (hasContra) classes.direct.push(node);
  else classes.ambiguous.push(node);
});

console.log('\nClassification:');
console.log(`  artifact (safe): ${classes.artifact.length}`);
console.log(`  direct (manual): ${classes.direct.length}`);
console.log(`  mixed (investigate): ${classes.mixed.length}`);
console.log(`  ambiguous: ${classes.ambiguous.length}`);

// Top candidates
const sorted = [...classes.artifact].sort((a,b) => (b.contradictionCount||0) - (a.contradictionCount||0));
if (sorted.length) {
  console.log('\nTop 10 artifact candidates:');
  sorted.slice(0,10).forEach((n,i) => {
    console.log(`  ${i+1}. ${n.id} | ${(n.title||'').substring(0,50)} | ${n.repo} | cnt=${n.contradictionCount}`);
  });
}

// Build preview
const preview = {
  snapshot_id: graph.snapshot_id,
  created_at: new Date().toISOString(),
  dry_run: true,
  summary: {
    total_conflicted: conflicted.length,
    proposed: classes.artifact.length,
    excluded: classes.direct.length + classes.mixed.length + classes.ambiguous.length
  },
  would_modify: [SNAPSHOT_PATH],
  projected_status: {
    conflicted: graph.status_counts.conflicted - classes.artifact.length,
    unverified: graph.status_counts.unverified + classes.artifact.length
  }
};

// Write outputs
const patchDir = 'S:/SwarmMind/context-buffer/graph-patches';
fs.mkdirSync(patchDir, { recursive: true });
const ts = new Date().toISOString().slice(0,10);
const patchPath = path.join(patchDir, `dry-run-global-reclassify-${ts}.json`);
fs.writeFileSync(patchPath, JSON.stringify(preview, null, 2));

const reportDir = 'S:/Archivist-Agent/docs/graph';
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, `GLOBAL_DRY_RUN_${ts}.md`);
fs.writeFileSync(reportPath, `# Global Dry-Run Reclassification Report\n\n**Generated**: ${new Date().toISOString()}\n\nConflicted nodes found: ${conflicted.length}\nSafe to reclassify: ${classes.artifact.length}\n\nTop candidate:\n${sorted[0] ? `- ${sorted[0].id}: ${sorted[0].title} (${sorted[0].repo}) cnt=${sorted[0].contradictionCount}` : 'None'}\n\nPatch preview saved to: ${patchPath}\n\nTo apply (after approval):\n  node global-dry-run-reclassify.js --apply --graph "${SNAPSHOT_PATH}"\n`);

console.log(`\nPatch: ${patchPath}`);
console.log(`Report: ${reportPath}`);
console.log(`\nCandidates: ${classes.artifact.length} nodes would be reclassified.`);
console.log('Review report. If satisfied, run with --apply.');

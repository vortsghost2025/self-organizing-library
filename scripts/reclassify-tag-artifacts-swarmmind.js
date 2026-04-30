const fs = require('fs');
const path = require('path');
const {
  enforceGraphWriteGuard,
  writeGuardAudit,
  writeSeal,
  getArgValue,
  loadJson
} = require('./graph-write-guard');

// ============ CONFIGURATION ============
const SNAPSHOT_PATH = 'S:/self-organizing-library/context-buffer/graphs/graph-snapshot-SwarmMind-Self-Optimizing-Multi-Agent-AI-System-2026-04-29-12-41-47-680.json';
const DRY_RUN = process.argv.includes('--dry-run');  // Set to false to apply changes
const args = process.argv.slice(2);
const adjudicationPath = getArgValue(args, '--adjudication');
// =========================================

console.log('=== SwarmMind Graph Auto-Reclassifier (Tag-Group Artifact Cleanup) ===\n');

// Load graph
const graph = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const nodes = graph.nodes || [];
const edges = graph.edges || [];

console.log(`Graph: ${nodes.length} nodes, ${edges.length} edges`);
console.log(`Status:`, graph.status_counts);

// Find CONTRADICTS edges
const contradicts = edges.filter(e => e.type === 'CONTRADICTS');
const contraByNode = {};
contradicts.forEach(e => {
  if (!contraByNode[e.source]) contraByNode[e.source] = 0;
  if (!contraByNode[e.target]) contraByNode[e.target] = 0;
  contraByNode[e.source] = (contraByNode[e.source] || 0) + 1;
  contraByNode[e.target] = (contraByNode[e.target] || 0) + 1;
});

// Find conflicted nodes with ZERO CONTRADICTS edges (tag-group artifacts)
const toReclassify = nodes.filter(n => {
  if (n.status !== 'CONFLICTED') return false;
  const hasContra = (contraByNode[n.id] || 0) > 0;
  return !hasContra;  // zero CONTRADICTS edges
});

console.log(`\nFound ${toReclassify.length} conflicted nodes with ZERO CONTRADICTS edges:`);
toReclassify.forEach((n, i) => {
  console.log(`  ${i+1}. ${n.id} | ${(n.title||'untitled').substring(0,60)} | tags: ${n.tags?.slice(0,4).join(',')} | contraCount: ${n.contradictionCount}`);
});

if (toReclassify.length === 0) {
  console.log('\n✅ No reclassification needed — all conflicted nodes have CONTRADICTS edges.');
  process.exit(0);
}

// Build patch
const patch = {
  snapshot_id: graph.snapshot_id,
  created_at: new Date().toISOString(),
  reclassify_count: toReclassify.length,
  reclassify_type: 'tag-group-artifact',
  changes: toReclassify.map(n => ({
    node_id: n.id,
    old_status: 'CONFLICTED',
    new_status: 'UNVERIFIED',
    reason: 'Zero CONTRADICTS edges; tag-cooccurrence artifact per 2026-04-30 analysis; contradictionCount=' + (n.contradictionCount||0),
    artifact_class: 'tag_group',
    tags_to_add: ['artifact_class:tag_group', 'reclassified:2026-04-30'],
    tags_to_remove: []
  }))
};

// Save patch file
const outDir = 'S:/self-organizing-library/context-buffer/graph-patches';
fs.mkdirSync(outDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0,19);
const patchFile = path.join(outDir, `reclassify-tag-artifacts-${timestamp}.json`);
fs.writeFileSync(patchFile, JSON.stringify(patch, null, 2));
console.log(`\n📄 Patch file written: ${patchFile}`);

// Summary table
console.log('\n=== PATCH SUMMARY ===');
console.log('Node ID'.padEnd(20) + 'Title'.padEnd(60) + 'Old→New');
patch.changes.forEach(c => {
  const node = toReclassify.find(n => n.id === c.node_id);
  console.log(c.node_id.padEnd(20) + (node?.title?.substring(0,60)||'').padEnd(60) + 'CONFLICTED→UNVERIFIED');
});

if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN — no changes applied. Remove --dry-run to apply.');
} else {
  const originalGraph = loadJson(SNAPSHOT_PATH);
  // Apply changes to graph
  toReclassify.forEach(n => {
    n.status = 'UNVERIFIED';
    if (!n.tags) n.tags = [];
    n.tags.push('artifact_class:tag_group');
    n.tags.push('reclassified:2026-04-30');
    n.reclassification_note = 'Auto-reclassified by tag-group artifact detector; zero CONTRADICTS edges; spurious contradictionCount';
    n.reclassified_at = new Date().toISOString();
    n.reclassified_by = 'swarmmind-automation';
  });

  // Update status counts
  graph.status_counts.conflicted -= toReclassify.length;
  graph.status_counts.unverified += toReclassify.length;

  // Write updated graph
  const backupPath = SNAPSHOT_PATH + '.backup-' + timestamp;
  fs.copyFileSync(SNAPSHOT_PATH, backupPath);
  const guardDecision = enforceGraphWriteGuard({
    operation: 'reclassify-tag-artifacts-swarmmind-apply',
    guardPath: 'S:/self-organizing-library/scripts/graph-write-guard.js',
    writePath: SNAPSHOT_PATH,
    beforeObject: originalGraph,
    afterObject: graph,
    adjudicationPath,
    mode: 'snapshot'
  });
  writeGuardAudit('S:/self-organizing-library', 'reclassify-tag-artifacts-swarmmind-apply', guardDecision, adjudicationPath);
  if (!guardDecision.allowWrite) {
    console.log('\n=== GRAPH WRITE GUARD ===');
    console.log(`STATUS: ${guardDecision.status}`);
    console.log(`guard_path: ${guardDecision.guard_path}`);
    console.log(`write_path: ${guardDecision.write_path}`);
    console.log(`blocked_case: ${guardDecision.blocked_case}`);
    console.log(`evidence_required: ${guardDecision.evidence_required}`);
    console.log(`bypass_notes: ${guardDecision.bypass_notes}`);
    process.exit(2);
  }
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(graph, null, 2));
  writeSeal(SNAPSHOT_PATH, graph, 'reclassify-tag-artifacts-swarmmind-apply', adjudicationPath);
  console.log(`✅ Graph updated in place (backup saved: ${backupPath})`);
  console.log(`   Conflicted: ${graph.status_counts.conflicted} → Unverified: ${graph.status_counts.unverified}`);
}

console.log('\nDone. The SwarmMind repo graph is now clean of tag-group artifact contradictions.');

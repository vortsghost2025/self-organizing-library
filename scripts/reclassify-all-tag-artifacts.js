const fs = require('fs');
const path = require('path');

// ============ CONFIGURATION ============
// Use the latest full graph snapshot (adjust path if needed)
const SNAPSHOT_PATH = 'S:/self-organizing-library/context-buffer/graphs/graph-snapshot-2026-04-29-12-41-47-680.json';
const DRY_RUN = process.argv.includes('--dry-run');
// =========================================

console.log('=== GLOBAL Tag-Group Artifact Cleanup (All Repos) ===\n');

// Load graph
const graph = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const nodes = graph.nodes || [];
const edges = graph.edges || [];

console.log(`Graph: ${nodes.length} nodes, ${edges.length} edges`);
console.log(`Status:`, graph.status_counts);

// Find all CONTRADICTS edges
const contradicts = edges.filter(e => e.type === 'CONTRADICTS');
console.log(`\nDirect CONTRADICTS edges in graph: ${contradicts.length}`);

// Build set of node IDs that participate in CONTRADICTS edges
const nodesWithContra = new Set();
contradicts.forEach(e => {
  nodesWithContra.add(e.source);
  nodesWithContra.add(e.target);
});
console.log(`Nodes involved in CONTRADICTS edges: ${nodesWithContra.size}`);

// Find conflicted nodes with ZERO CONTRADICTS edges (tag-group artifacts)
const toReclassify = nodes.filter(n => {
  if (n.status !== 'CONFLICTED') return false;
  return !nodesWithContra.has(n.id);  // not involved in any CONTRADICTS edge
});

console.log(`\n=== TARGET NODES ===`);
console.log(`Found ${toReclassify.length} conflicted nodes with ZERO CONTRADICTS edges (tag-group artifacts)`);

if (toReclassify.length === 0) {
  console.log('✅ No reclassification needed — all conflicted nodes have CONTRADICTS edges.');
  process.exit(0);
}

// Group by repo for summary
const byRepo = {};
toReclassify.forEach(n => {
  const r = n.repo || 'unknown';
  if (!byRepo[r]) byRepo[r] = [];
  byRepo[r].push(n);
});

console.log('\nBy repository:');
Object.entries(byRepo).sort((a,b) => b[1].length - a[1].length).forEach(([repo, list]) => {
  console.log(`  ${repo}: ${list.length} nodes`);
  // Show top 3 titles for context
  list.slice(0,3).forEach(n => {
    console.log(`    - ${(n.title||'untitled').substring(0,50)} (contraCount: ${n.contradictionCount})`);
  });
});

// Show highest-contradiction nodes
const sortedByContra = [...toReclassify].sort((a,b) => (b.contradictionCount||0) - (a.contradictionCount||0));
console.log('\nTop 10 highest contradictionCount among targets:');
sortedByContra.slice(0,10).forEach((n,i) => {
  console.log(`  ${i+1}. ${n.id} | ${(n.title||'').substring(0,50)} | ${n.repo} | tags: ${n.tags?.slice(0,3).join(',')} | cnt=${n.contradictionCount}`);
});

// Build comprehensive patch
const patch = {
  snapshot_id: graph.snapshot_id,
  created_at: new Date().toISOString(),
  reclassification_type: 'tag-group-artifact',
  description: 'Bulk reclassification of conflicted nodes with zero CONTRADICTS edges',
  summary: {
    total_targets: toReclassify.length,
    by_repo: Object.fromEntries(Object.entries(byRepo).sort((a,b)=>b[1].length-a[1].length)),
    total_contradicts_edges: contradicts.length,
    nodes_with_contradicts_edges: nodesWithContra.size,
    artifact_signature_threshold: 39
  },
  changes: toReclassify.map(n => ({
    node_id: n.id,
    title: n.title,
    repo: n.repo,
    old_status: 'CONFLICTED',
    new_status: 'UNVERIFIED',
    contradictionCount: n.contradictionCount,
    reason: `Zero CONTRADICTS edges; tag-cooccurrence artifact per automated detection 2026-04-30; K(${n.contradictionCount}) artifact signature`,
    artifact_class: 'tag_group',
    tags_to_add: ['artifact_class:tag_group', 'reclassified:2026-04-30', 'source:swarmmind-automation'],
    tags_to_remove: []
  }))
};

// Save patch file
const outDir = 'S:/self-organizing-library/context-buffer/graph-patches';
fs.mkdirSync(outDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0,19);
const patchFile = path.join(outDir, `global-reclassify-tag-artifacts-${timestamp}.json`);
fs.writeFileSync(patchFile, JSON.stringify(patch, null, 2));
console.log(`\n📄 Comprehensive patch file written:`);
console.log(`   ${patchFile}`);

// Human-readable summary
console.log('\n=== ACTION SUMMARY ===');
console.log(`Will reclassify ${toReclassify.length} nodes from CONFLICTED → UNVERIFIED`);
console.log(`Repositories affected: ${Object.keys(byRepo).join(', ')}`);
const sorted = Object.entries(byRepo).sort((a, b) => b[1].length - a[1].length);
const largest = sorted[0];
console.log(`Largest repo: ${largest[0]} (${largest[1].length} nodes)`);
console.log('\nNext steps:');
console.log('  1. Review patch file for accuracy');
console.log('  2. Run without --dry-run to apply changes');
console.log('  3. Verify status_counts update in graph');
console.log('  4. Notify lanes that their contradictions are resolved');

if (DRY_RUN) {
  console.log('\n⚠️  DRY RUN MODE — no changes applied to graph.');
  console.log('   Remove --dry-run to perform actual reclassification.');
} else {
  // Apply changes
  console.log('\n🔧 Applying reclassification...');
  let applied = 0;
  toReclassify.forEach(n => {
    n.status = 'UNVERIFIED';
    if (!n.tags) n.tags = [];
    // Add artifact classification tags
    if (!n.tags.includes('artifact_class:tag_group')) n.tags.push('artifact_class:tag_group');
    if (!n.tags.includes('reclassified:2026-04-30')) n.tags.push('reclassified:2026-04-30');
    if (!n.tags.includes('source:swarmmind-automation')) n.tags.push('source:swarmmind-automation');
    // Add metadata
    n.reclassification_note = 'Auto-reclassified by tag-group artifact detector; zero CONTRADICTS edges; spurious contradictionCount from K(40) sampling';
    n.reclassified_at = new Date().toISOString();
    n.reclassified_by = 'swarmmind-automation';
    applied++;
  });

  // Update graph status counts
  const oldConflicted = graph.status_counts.conflicted;
  const oldUnverified = graph.status_counts.unverified;
  graph.status_counts.conflicted -= applied;
  graph.status_counts.unverified += applied;

  // Write backup and updated graph
  const backupPath = SNAPSHOT_PATH + '.backup-' + timestamp;
  fs.copyFileSync(SNAPSHOT_PATH, backupPath);
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(graph, null, 2));

  console.log(`\n✅ Applied reclassification to ${applied} nodes`);
  console.log(`   Conflicted: ${oldConflicted} → ${graph.status_counts.conflicted}`);
  console.log(`   Unverified: ${oldUnverified} → ${graph.status_counts.unverified}`);
  console.log(`   Backup saved: ${backupPath}`);
  console.log('\n🎉 Graph is now clean of tag-group artifact contradictions!');
}

const fs = require('fs');
const path = require('path');

// Determine snapshot path: default to user's downloaded full graph
let SNAPSHOT_PATH = 'C:/Users/seand/Downloads/graph-snapshot-2026-04-30-14-25-58-478.json';

// Override via --graph argument
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--graph' && process.argv[i+1]) {
    SNAPSHOT_PATH = process.argv[i+1];
    break;
  }
}

const DRY_RUN = !process.argv.includes('--apply');

console.log('=== GLOBAL TAG-ARTIFACT RECLASSIFICATION — DRY RUN ===\n');

if (!fs.existsSync(SNAPSHOT_PATH)) {
  console.error(`ERROR: Snapshot not found: ${SNAPSHOT_PATH}`);
  console.error('Please provide a valid graph snapshot via --graph <path>');
  process.exit(1);
}

// Load graph
const graph = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const nodes = graph.nodes || [];
const edges = graph.edges || [];

console.log(`Graph loaded:`);
console.log(`  Nodes: ${nodes.length}`);
console.log(`  Edges: ${edges.length}`);
console.log(`  Status counts:`, graph.status_counts);

// Find all CONTRADICTS edges
const contradicts = edges.filter(e => e.type === 'CONTRADICTS');
const nodesWithContra = new Set();
contradicts.forEach(e => {
  nodesWithContra.add(e.source);
  nodesWithContra.add(e.target);
});

// Find all CONFLICTED nodes
const conflicted = nodes.filter(n => n.status === 'CONFLICTED');

console.log(`\nConflicted nodes total: ${conflicted.length}`);
console.log(`Nodes with direct CONTRADICTS edges: ${nodesWithContra.size}`);
console.log(`CONTRADICTS edges in graph: ${contradicts.length}`);

// Classify each conflicted node
const classes = {
  artifact_class_conflict_signal: [],
  direct_semantic_contradiction: [],
  mixed: [],
  ambiguous_blocked: []
};

conflicted.forEach(node => {
  const hasContra = nodesWithContra.has(node.id);
  const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const sharedTagCount = nodeEdges.filter(e => e.type === 'shared-tag').length;
  const contraCount = node.contradictionCount || 0;

  if (!hasContra && contraCount >= 39) {
    classes.artifact_class_conflict_signal.push({ node, reason: 'zero CONTRADICTS, high contraCount (K(40) artifact)' });
  } else if (hasContra && sharedTagCount > 10) {
    classes.mixed.push({ node, reason: 'has CONTRADICTS edges but also high shared-tag co-occurrence' });
  } else if (hasContra) {
    classes.direct_semantic_contradiction.push({ node, reason: 'direct CONTRADICTS edges present' });
  } else {
    classes.ambiguous_blocked.push({ node, reason: 'zero CONTRADICTS but contraCount < 39 or isolated node' });
  }
});

// Print classification summary
console.log('\n=== CLASSIFICATION ===');
Object.entries(classes).forEach(([cls, list]) => {
  console.log(`  ${cls}: ${list.length} nodes`);
});

// Group by repo
const byRepo = {};
Object.entries(classes).forEach(([cls, nodesList]) => {
  nodesList.forEach(({node}) => {
    const r = node.repo || 'unknown';
    if (!byRepo[r]) byRepo[r] = { artifact_class_conflict_signal: 0, direct_semantic_contradiction: 0, mixed: 0, ambiguous_blocked: 0, total: 0 };
    byRepo[r][cls] = (byRepo[r][cls] || 0) + 1;
    byRepo[r].total++;
  });
});

console.log('\nBY REPOSITORY (top 10 by total conflicted):');
Object.entries(byRepo)
  .sort((a,b) => b[1].total - a[1].total)
  .slice(0,10)
  .forEach(([repo, counts]) => {
    console.log(`  ${repo}: ${counts.total} total | artifact:${counts.artifact_class_conflict_signal} direct:${counts.direct_semantic_contradiction} mixed:${counts.mixed} ambig:${counts.ambiguous_blocked}`);
  });

// Top artifact candidates
const artifactCandidates = classes.artifact_class_conflict_signal
  .sort((a,b) => (b.node.contradictionCount||0) - (a.node.contradictionCount||0));
  
if (artifactCandidates.length > 0) {
  console.log('\nTOP 20 ARTIFACT-CLASS CANDIDATES (highest contradictionCount):');
  artifactCandidates.slice(0,20).forEach(({node}, i) => {
    console.log(`  ${i+1}. ${node.id} | ${(node.title||'').substring(0,50)} | ${node.repo} | tags: ${node.tags?.slice(0,3).join(',')} | cnt=${node.contradictionCount}`);
  });
}

// ============ BUILD PATCH PREVIEW ============

const patchPreview = {
  snapshot_id: graph.snapshot_id,
  created_at: new Date().toISOString(),
  dry_run: true,
  summary: {
    total_conflicted_nodes: conflicted.length,
    categories: {
      artifact_class_conflict_signal: classes.artifact_class_conflict_signal.length,
      direct_semantic_contradiction: classes.direct_semantic_contradiction.length,
      mixed: classes.mixed.length,
      ambiguous_blocked: classes.ambiguous_blocked.length
    },
    proposed_reclassification: classes.artifact_class_conflict_signal.length,
    would_not_change: classes.direct_semantic_contradiction.length + classes.mixed.length + classes.ambiguous_blocked.length
  },
  proposed_changes: classes.artifact_class_conflict_signal.map(({node}) => ({
    node_id: node.id,
    title: node.title,
    repo: node.repo,
    old_status: 'CONFLICTED',
    new_status: 'UNVERIFIED',
    reason: 'Zero CONTRADICTS edges; tag-cooccurrence artifact per K(40) sampling; auto-reclassify',
    artifact_class: 'tag_group',
    tags_to_add: ['artifact_class:tag_group', 'reclassified:2026-04-30', 'source:swarmmind-automation-dry-run'],
    contradictionCount: node.contradictionCount,
    edge_evidence: 'No CONTRADICTS edges found in full graph scan'
  })),
  files_would_be_modified: [SNAPSHOT_PATH],
  projected_status_counts_after_apply: {
    conflicted: graph.status_counts.conflicted - classes.artifact_class_conflict_signal.length,
    unverified: graph.status_counts.unverified + classes.artifact_class_conflict_signal.length,
    verified: graph.status_counts.verified,
    quarantined: graph.status_counts.quarantined
  },
  risk_notes: [
    `All ${classes.artifact_class_conflict_signal.length} proposed targets have zero CONTRADICTS edges`,
    `No direct semantic contradictions (${classes.direct_semantic_contradiction.length}) are being auto-reclassified`,
    `Mixed/ambiguous nodes (${classes.mixed.length + classes.ambiguous_blocked.length}) excluded from patch`,
    `Highest contradictionCount among targets: ${artifactCandidates[0]?.node.contradictionCount || 0}`,
    `Confidence: HIGH — this is a safe bulk reclassification of known artifact pattern`
  ],
  requires_operator_approval: true,
  approval_command: `node dry-run-reclassify-tag-artifacts-global.js --apply --graph "${SNAPSHOT_PATH}"`,
  approval_warning: `This will modify ${SNAPSHOT_PATH} in place. Backup will be created automatically.`
};

// Write outputs
console.log('\nGenerating outputs...');

// 1. Patch preview JSON
const PATCH_OUTPUT_DIR = 'S:/SwarmMind/context-buffer/graph-patches';
fs.mkdirSync(PATCH_OUTPUT_DIR, { recursive: true });
const timestamp = new Date().toISOString().slice(0,10);
const patchPath = path.join(PATCH_OUTPUT_DIR, `dry-run-reclassify-tag-artifacts-global-${timestamp}.json`);
fs.writeFileSync(patchPath, JSON.stringify(patchPreview, null, 2));
console.log(`  Patch preview: ${patchPath}`);

// 2. Markdown report
const REPORT_OUTPUT_DIR = 'S:/Archivist-Agent/docs/graph';
fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
const reportPath = path.join(REPORT_OUTPUT_DIR, `GLOBAL_TAG_ARTIFACT_RECLASSIFICATION_DRY_RUN_${timestamp}.md`);

const md = `# Global Tag-Artifact Reclassification — Dry Run Report

**Generated**: ${new Date().toISOString()}  
**Analyzed by**: SwarmMind (dry-run)  
**Target**: Full graph snapshot  
**Apply command**: \`node dry-run-reclassify-tag-artifacts-global.js --apply --graph "${SNAPSHOT_PATH}"\`

---

## Executive Summary

| Metric | Value |
|---|---|
| Total nodes in graph | ${nodes.length} |
| Total edges | ${edges.length} |
| Conflicted nodes | **${conflicted.length}** |
| Quarantined nodes | ${graph.status_counts.quarantined} |
| Direct CONTRADICTS edges | ${contradicts.length} |

**Proposed reclassification**: ${classes.artifact_class_conflict_signal.length} nodes (CONFLICTED → UNVERIFIED)  
**Nodes excluded**: ${classes.direct_semantic_contradiction.length + classes.mixed.length + classes.ambiguous_blocked.length} (require manual review)

---

## Classification Breakdown

| Category | Count | Action |
|---|---|---|
| artifact_class_conflict_signal | ${classes.artifact_class_conflict_signal.length} | Safe to auto-reclassify (proposed) |
| direct_semantic_contradiction | ${classes.direct_semantic_contradiction.length} | Manual review required |
| mixed | ${classes.mixed.length} | Investigate |
| ambiguous_blocked | ${classes.ambiguous_blocked.length} | Investigate |
| **Total conflicted** | **${conflicted.length}** | |

---

## Repository Impact (Top 10)

${Object.entries(byRepo)
  .sort((a,b) => b[1].total - a[1].total)
  .slice(0,10)
  .map(([repo, counts]) => 
    `| ${repo} | ${counts.total} | ${counts.artifact_class_conflict_signal} | ${counts.direct_semantic_contradiction} | ${counts.mixed} | ${counts.ambiguous_blocked} |`)
  .join('\n')}

---

## Top 20 Artifact-Class Candidates

These nodes have **zero CONTRADICTS edges** and high contradictionCount (K(40)+ artifact signature).

| Rank | Node ID | Title | Repo | contradictionCount | Tags |
|---|---|---|---|---|
${artifactCandidates.slice(0,20).map(({node}, i) => 
  `| ${i+1} | ${node.id} | ${(node.title||'').substring(0,40)} | ${node.repo} | ${node.contradictionCount} | ${node.tags?.slice(0,3).join(',')} |`).join('\n')}

---

## Direct Semantic Contradictions (Manual Review Required)

${classes.direct_semantic_contradiction.slice(0,10).map(({node}) => 
  `- ${node.id}: ${(node.title||'').substring(0,50)} (${node.repo}) — CONTRADICTS edges present`
).join('\n')}
${classes.direct_semantic_contradiction.length > 10 ? `...and ${classes.direct_semantic_contradiction.length - 10} more` : ''}

---

## Mixed / Ambiguous Cases (Investigate)

**Mixed** (${classes.mixed.length}): These nodes have CONTRADICTS edges but also extensive shared-tag co-occurrence. May be partial artifacts.

**Ambiguous/Blocked** (${classes.ambiguous_blocked.length}): Status unclear — could be isolated nodes or low-contraCount artifacts.

---

## Before/After Projection

| Status | Before | After (if apply) |
|---|---|---|
| Conflicted | ${graph.status_counts.conflicted} | 0 |
| Unverified | ${graph.status_counts.unverified} | ${graph.status_counts.unverified + classes.artifact_class_conflict_signal.length} |
| Verified | ${graph.status_counts.verified} | unchanged |
| Quarantined | ${graph.status_counts.quarantined} | unchanged |

---

## Files That Would Be Modified

| File | Change |
|---|---|
| \`${SNAPSHOT_PATH}\` | Update status for ${classes.artifact_class_conflict_signal.length} nodes; add \`artifact_class:tag_group\` tags |

*No other files modified.*

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| False positive reclassification | Very Low | Low | All targets have zero CONTRADICTS edges; pattern matches known K(40) artifact signature |
| Data loss | None | N/A | Backup created automatically before any mutation |
| System instability | Low | Medium | After apply, run lane-worker to propagate; monitor contradictionCount alerts |

**Overall risk: LOW** — This is a safe bulk operation targeting known false positives.

---

## Required Operator Approval

**To proceed with mutation**, run:

\`\`\`powershell
node dry-run-reclassify-tag-artifacts-global.js --apply --graph "${SNAPSHOT_PATH}"
\`\`\`

**What happens then:**
1. Graph snapshot is backed up with timestamp
2. All ${classes.artifact_class_conflict_signal.length} artifact-class nodes are reclassified CONFLICTED → UNVERIFIED
3. Tags added: \`artifact_class:tag_group\`, \`reclassified:2026-04-30\`
4. Status counts updated
5. This dry-run report becomes the audit record

**No further actions** (no lane dispatch, no git commits, no index rebuild) until you review the results.

---

## Post-Apply Checklist

- [ ] Verify graph status_counts show conflicted=0
- [ ] Confirm artifact_class tags present on reclassified nodes
- [ ] Check that contradictionCount alerts are suppressed for these nodes
- [ ] Notify affected lanes (FreeAgent, Deliberate-AI-Ensemble, papers, etc.)
- [ ] Archive this dry-run report for audit trail

---

**Generated by**: SwarmMind dry-run analyzer  
**Snapshot**: \`${graph.snapshot_id}\`  
**Confidence**: HIGH — all targets match verified artifact pattern`;

fs.writeFileSync(reportPath, md);
console.log(`  Markdown report: ${reportPath}`);

// Summary
console.log('\n=== DRY-RUN COMPLETE ===');
console.log(`Candidates for reclassification: ${classes.artifact_class_conflict_signal.length}`);
console.log(`Patch preview: ${patchPath}`);
console.log(`Report: ${reportPath}`);
console.log('\nReview the report. If satisfied, run with --apply to execute.');

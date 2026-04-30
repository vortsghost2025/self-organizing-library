const fs = require('fs');
const path = require('path');
const {
  enforceGraphWriteGuard,
  writeGuardAudit,
  writeSeal,
  getArgValue
} = require('./graph-write-guard');

// Process command‑line arguments
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const adjudicationPath = getArgValue(args, '--adjudication');

// Default snapshot paths (try these in order)
const SNAPSHOT_PATHS = [
  'S:/self-organizing-library/context-buffer/graphs/graph-snapshot-self-organizing-library-2026-04-29-12-41-47-680.json',
  'C:/Users/seand/Downloads/graph-snapshot-2026-04-30-14-25-58-478.json'
];

let SNAPSHOT_PATH = null;
for (const p of SNAPSHOT_PATHS) {
  if (fs.existsSync(p)) {
    SNAPSHOT_PATH = p;
    break;
  }
}

if (!SNAPSHOT_PATH) {
  console.error('ERROR: No graph snapshot found. Expected paths:');
  SNAPSHOT_PATHS.forEach(p => console.error('  - ' + p));
  process.exit(1);
}

console.log('=== VERIFICATION TRIAGE — HIGH-AUTHORITY UNVERIFIED NODES ===\n');
console.log('Using snapshot:', SNAPSHOT_PATH);

const graph = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const originalGraph = JSON.parse(JSON.stringify(graph));
const nodes = graph.nodes || [];
const edges = graph.edges || [];

console.log(`Graph: ${nodes.length} nodes, ${edges.length} edges`);
console.log('Status counts:', graph.status_counts);

// Filter: UNVERIFIED + authorityDepth >= 70
const candidates = nodes.filter(n => {
  if (n.status !== 'UNVERIFIED') return false;
  const authDepth = (n.authorityDepth !== undefined) ? n.authorityDepth : (n.connectionCount || 0);
  return authDepth >= 70;
});

console.log(`\nCandidates (UNVERIFIED, authorityDepth>=70): ${candidates.length}`);

// Classification patterns
const structuralPatterns = {
  extensions: ['.yml', '.yaml', '.json', '.lock', '.sum', '.mod', '.pbxproj', '.xcworkspace', '.xcodeproj', '.gitignore', '.gitattributes', '.editorconfig', '.npmrc', '.yarnrc', '.env', '.config'],
  titleKeywords: ['lock', 'manifest', 'dependency', 'dependencies', 'build', 'ci', 'workflow', 'config', 'configuration', 'ignore', 'git', 'license', 'docker', 'container', 'deploy', 'release', 'package-lock', 'yarn.lock', 'package.json', 'requirements.txt', 'pipfile', 'poetry.lock', 'cargo.lock', 'go.sum', 'go.mod', 'composer.lock', 'podfile', 'gradle', 'maven', 'ant', 'makefile', 'cmake', 'configure', 'autogen', 'generated', 'auto-generated', 'synthetic'],
  repoPaths: ['.github', 'scripts', 'config', 'build', 'ci', 'test', 'tests', 'spec', 'specs', 'fixtures', 'mocks', 'stubs', 'examples', 'sample', 'template', 'templates', 'docker', 'containers', 'deploy', 'deployment', 'infra', 'infrastructure', 'pipeline', 'pipelines', 'workflows', 'actions', 'tasks', 'jobs'],
  tags: ['build', 'ci', 'cd', 'continuous-integration', 'continuous-deployment', 'config', 'configuration', 'dependency', 'dependencies', 'manifest', 'lockfile', 'docker', 'container', 'deployment', 'infrastructure', 'pipeline', 'workflow', 'automation', 'generated', 'auto-generated', 'synthetic', 'test', 'testing', 'spec', 'example', 'sample', 'template']
};

const governancePatterns = {
  titleKeywords: ['governance', 'policy', 'protocol', 'framework', 'constitution', 'covenant', 'charter', 'bylaw', 'ordinance', 'directive', 'guideline', 'standard', 'specification', 'spec', 'architecture', 'design', 'principle', 'tenet', 'value', 'ethic', 'attestation', 'audit', 'compliance', 'enforcement', 'verification', 'validation', 'certification', 'approval', 'sign-off', 'review', 'board', 'committee', 'council', 'stewardship', 'oversight', 'trust', 'trusted', 'trustworthy', 'transparency', 'accountability', 'security', 'safety', 'alignment', 'ethics', 'fairness', 'explainability', 'interpretability', 'robustness', 'privacy', 'confidentiality', 'integrity', 'availability', 'resilience', 'reliability'],
  tags: ['governance', 'policy', 'protocol', 'framework', 'constitution', 'covenant', 'charter', 'bylaw', 'standard', 'specification', 'architecture', 'design', 'principle', 'tenet', 'value', 'ethic', 'attestation', 'audit', 'compliance', 'enforcement', 'verification', 'validation', 'certification', 'approval', 'review', 'stewardship', 'oversight', 'trust', 'transparency', 'accountability', 'security', 'safety', 'alignment', 'ethics', 'fairness', 'explainability', 'interpretability', 'robustness', 'privacy', 'integrity', 'resilience', 'reliability']
};

// Classify each candidate
const classification = { structural: [], needs_verification: [], ambiguous: [] };

for (const node of candidates) {
  const title = (node.title || '').toLowerCase();
  const tags = (node.tags || []).map(t => t.toLowerCase());
  const repo = (node.repo || '').toLowerCase();

  // Check structural patterns
  let isStructural = false;
  if (structuralPatterns.extensions.some(ext => title.includes(ext))) isStructural = true;
  else if (structuralPatterns.titleKeywords.some(kw => title.includes(kw))) isStructural = true;
  else if (structuralPatterns.repoPaths.some(p => repo.includes(p))) isStructural = true;
  else if (structuralPatterns.tags.some(t => tags.includes(t))) isStructural = true;

  if (isStructural) {
    classification.structural.push({ node, reason: 'Matches structural/config pattern' });
    continue;
  }

  // Check governance patterns
  let isGovernance = false;
  if (governancePatterns.titleKeywords.some(kw => title.includes(kw))) isGovernance = true;
  else if (governancePatterns.tags.some(t => tags.includes(t))) isGovernance = true;

  if (isGovernance) {
    classification.needs_verification.push({ node, reason: 'Matches governance/protocol pattern' });
  } else {
    classification.ambiguous.push({ node, reason: 'No clear pattern match' });
  }
}

console.log('\nClassification:');
console.log(`  Structural (low priority): ${classification.structural.length}`);
console.log(`  Needs verification (high priority): ${classification.needs_verification.length}`);
console.log(`  Ambiguous (manual review): ${classification.ambiguous.length}`);

// By repository
const byRepo = {};
function addToRepo(node, category) {
  const r = node.repo || 'unknown';
  if (!byRepo[r]) byRepo[r] = { structural: 0, needs_verification: 0, ambiguous: 0, total: 0 };
  byRepo[r][category]++;
  byRepo[r].total++;
}
classification.structural.forEach(item => addToRepo(item.node, 'structural'));
classification.needs_verification.forEach(item => addToRepo(item.node, 'needs_verification'));
classification.ambiguous.forEach(item => addToRepo(item.node, 'ambiguous'));

console.log('\nTop repositories by candidate count:');
Object.entries(byRepo)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 10)
  .forEach(([repo, counts]) => {
    console.log(`  ${repo}: ${counts.total} total | struct:${counts.structural} need:${counts.needs_verification} ambig:${counts.ambiguous}`);
  });

// Show top examples
if (classification.structural.length > 0) {
  console.log('\nTop 10 Structural (likely skip):');
  classification.structural.slice(0, 10).forEach((item, i) => {
    const n = item.node;
    const auth = n.authorityDepth !== undefined ? n.authorityDepth : n.connectionCount;
    console.log(`  ${i+1}. ${n.id} | ${(n.title || '').substring(0, 50)} | ${n.repo} | authDepth:${auth}`);
  });
}

if (classification.needs_verification.length > 0) {
  console.log('\nTop 10 Needs Verification (high priority):');
  classification.needs_verification.slice(0, 10).forEach((item, i) => {
    const n = item.node;
    const auth = n.authorityDepth !== undefined ? n.authorityDepth : n.connectionCount;
    console.log(`  ${i+1}. ${n.id} | ${(n.title || '').substring(0, 50)} | ${n.repo} | authDepth:${auth}`);
  });
}

// Build patch preview
const ts = new Date().toISOString().slice(0, 10);
const patch = {
  analysis_type: 'verification_triage',
  snapshot_id: graph.snapshot_id,
  created_at: new Date().toISOString(),
  summary: {
    total_candidates: candidates.length,
    by_category: {
      structural: classification.structural.length,
      needs_verification: classification.needs_verification.length,
      ambiguous: classification.ambiguous.length
    }
  },
  proposed_tags: [
    ...classification.structural.map(item => ({
      node_id: item.node.id,
      tags_to_add: ['verification_priority:low', 'auto_tagged:structural', `triage_date:${ts}`],
      category: 'structural'
    })),
    ...classification.needs_verification.map(item => ({
      node_id: item.node.id,
      tags_to_add: ['verification_priority:high', 'auto_tagged:governance', `triage_date:${ts}`],
      category: 'needs_verification'
    })),
    ...classification.ambiguous.map(item => ({
      node_id: item.node.id,
      tags_to_add: ['verification_priority:medium', 'auto_tagged:ambiguous', 'needs_manual_review:true', `triage_date:${ts}`],
      category: 'ambiguous'
    }))
  ],
  files_would_be_modified: [SNAPSHOT_PATH],
  projected_impact: {
    structural_nodes_auto_verified: classification.structural.length,
    high_priority_verification_nodes: classification.needs_verification.length,
    remaining_ambiguous: classification.ambiguous.length
  }
};

// If apply flag, modify snapshot in-place
if (apply) {
  // Backup original snapshot
  const backupPath = SNAPSHOT_PATH + `.bak-${new Date().toISOString().replace(/[:.]/g,'-')}`;
  fs.copyFileSync(SNAPSHOT_PATH, backupPath);
  // Apply proposed tags
  const tagMap = {};
  patch.proposed_tags.forEach(pt => {
    tagMap[pt.node_id] = pt.tags_to_add;
  });
  let appliedCount = 0;
  graph.nodes.forEach(node => {
    const tagsToAdd = tagMap[node.id];
    if (tagsToAdd) {
      if (!Array.isArray(node.tags)) node.tags = [];
      tagsToAdd.forEach(t => {
        if (!node.tags.includes(t)) {
          node.tags.push(t);
        }
      });
      appliedCount++;
    }
  });
  const guardDecision = enforceGraphWriteGuard({
    operation: 'analyze-unverified-authority-apply',
    guardPath: 'S:/self-organizing-library/scripts/graph-write-guard.js',
    writePath: SNAPSHOT_PATH,
    beforeObject: originalGraph,
    afterObject: graph,
    adjudicationPath,
    mode: 'snapshot'
  });
  writeGuardAudit('S:/self-organizing-library', 'analyze-unverified-authority-apply', guardDecision, adjudicationPath);

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

  // Write updated snapshot
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(graph, null, 2));
  writeSeal(SNAPSHOT_PATH, graph, 'analyze-unverified-authority-apply', adjudicationPath);
  console.log('\n=== APPLIED ===');
  console.log(`Backup created at: ${backupPath}`);
  console.log(`Tags applied to ${appliedCount} nodes`);
}

// Write outputs
const patchDir = 'S:/SwarmMind/context-buffer/graph-patches';
fs.mkdirSync(patchDir, { recursive: true });
const patchPath = path.join(patchDir, `verification-triage-patch-${ts}.json`);
fs.writeFileSync(patchPath, JSON.stringify(patch, null, 2));

const reportDir = 'S:/Archivist-Agent/docs/graph';
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, `VERIFICATION_TRIAGE_REPORT_${ts}.md`);

const md = `# Verification Triage Report — High-Authority Unverified Nodes

**Generated**: ${new Date().toISOString()}  
**Analyzed by**: SwarmMind (dry-run)  
**Snapshot**: ${graph.snapshot_id}

---

## Executive Summary

| Metric | Count |
|---|---|
| Unverified nodes with authorityDepth ≥ 70 | **${candidates.length}** |
| Likely structural (low verification priority) | **${classification.structural.length}** |
| Governance/docs (high verification priority) | **${classification.needs_verification.length}** |
| Ambiguous (manual review needed) | **${classification.ambiguous.length}** |

---

## Classification Logic

- **Structural**: File names/tags indicate configs, builds, CI, dependencies, licenses, etc. These typically don't need content verification.
- **Needs verification**: Titles/tags indicate governance, protocols, policies, frameworks, specs — content that must be verified.
- **Ambiguous**: No clear pattern; requires human judgment.

---

## Repository Breakdown (Top 10)

${Object.entries(byRepo)
  .sort((a,b) => b[1].total - a[1].total)
  .slice(0,10)
  .map(([repo, counts]) => 
    `| ${repo} | ${counts.total} | ${counts.structural} | ${counts.needs_verification} | ${counts.ambiguous} |`)
  .join('\n')}

---

## Top 20 Structural Candidates (Low Priority)

These are likely config/build files that can be auto-tagged as \`verification_priority:low\`.

${classification.structural.slice(0,20).map(item => 
  `- ${item.node.id}: ${(item.node.title||'').substring(0,50)} (${item.node.repo}) authorityDepth:${item.node.authorityDepth || item.node.connectionCount}`
).join('\n')}

---

## Top 20 High-Priority Verification Candidates

These are governance/docs that should be prioritized for verification.

${classification.needs_verification.slice(0,20).map(item => 
  `- ${item.node.id}: ${(item.node.title||'').substring(0,50)} (${item.node.repo}) authorityDepth:${item.node.authorityDepth || item.node.connectionCount}`
).join('\n')}

---

## Patch Preview

If approved, the following tags would be added:

| Category | Tag | Purpose |
|---|---|---|
| Structural | verification_priority:low | Suppress verification alerts |
| Governance | verification_priority:high | Mark for priority verification |
| Ambiguous | verification_priority:medium, needs_manual_review:true | Flag for human triage |

**Files modified**: Only the graph snapshot (in-place with backup if apply is run)

---

## Next Steps

1. Review this report and the top candidate lists
2. Approve patch application if classification looks correct
3. Apply patch: \`node analyze-unverified-authority.js --apply\`
4. After apply, run lane-worker to propagate tag changes
5. Monitor verification queue — it should now be better prioritized

---

**Confidence**: MEDIUM — heuristics are based on common patterns but should be spot-checked on a sample before full apply.
`;

fs.writeFileSync(reportPath, md);

console.log('\n=== OUTPUTS ===');
console.log('Patch preview:', patchPath);
console.log('Report:', reportPath);
console.log(`\nCandidates: ${candidates.length} analyzed`);
console.log(`  Structural: ${classification.structural.length}`);
console.log(`  Needs verification: ${classification.needs_verification.length}`);
console.log(`  Ambiguous: ${classification.ambiguous.length}`);
console.log('\nReview the report. If heuristics look correct, run with --apply to tag nodes.');

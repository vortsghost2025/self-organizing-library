const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const siteIndexPath = path.join(__dirname, '..', 'data', 'site-index.json');
const index = JSON.parse(fs.readFileSync(siteIndexPath, 'utf-8'));

const LANE_REPOS = new Set([
  'self-organizing-library',
  'Archivist-Agent',
  'SwarmMind',
  'SwarmMind-Self-Optimizing-Multi-Agent-AI-System',
  'kernel-lane',
]);

const VERIFICATION_TAGS = new Set([
  'Verification', 'Attestation', 'Identity Enforcement', 'Convergence Gate',
]);
const SIGNING_TAGS = new Set(['Attestation', 'Identity Enforcement']);
const EXECUTION_TAGS = new Set(['Kernel', 'Swarmmind', 'Multi-Agent']);
const GOVERNANCE_TAGS = new Set([
  'Governance', 'Constitutional AI', 'Covenant', 'Constraint Lattice',
]);
const CONTRADICTION_TAGS = new Set([
  'Failure Mode', 'Contradiction', 'Drift',
]);
const DERIVATION_CATEGORIES = new Set([
  'verification', 'attestation', 'governance', 'spec', 'paper',
]);
const VERIFICATION_CATEGORIES = new Set(['verification', 'attestation', 'audit']);
const CODE_TYPES = new Set(['code', 'config']);
const QUARANTINE_CATEGORIES = new Set(['scratch', 'pending', 'sensitive']);
const CONSTITUTIONAL_CATEGORIES = new Set(['governance', 'verification', 'attestation', 'spec']);
const OPERATIONAL_CATEGORIES = new Set(['code', 'scripts', 'config']);
const THEORETICAL_TAGS = new Set(['Rosetta Stone', 'CAISC', 'Constraint Lattice', 'paper']);
const EVIDENCE_CATEGORIES = new Set(['verification', 'audit', 'test-data']);
const HISTORICAL_CATEGORIES = new Set(['scratch', 'pending']);
const REPO_AUTHORITY_DEPTH = {
  'Archivist-Agent': 95,
  'self-organizing-library': 90,
  'SwarmMind': 80,
  'SwarmMind-Self-Optimizing-Multi-Agent-AI-System': 80,
  'kernel-lane': 75,
};

function hasAnyTag(tags, tagSet) {
  return tags.some(t => tagSet.has(t));
}

function computeGovernanceLayer(entry) {
  if (LANE_REPOS.has(entry.repo) && CONSTITUTIONAL_CATEGORIES.has(entry.category)) return 'constitutional';
  if (LANE_REPOS.has(entry.repo) && OPERATIONAL_CATEGORIES.has(entry.category)) return 'operational';
  if (entry.category === 'paper' || hasAnyTag(entry.tags, THEORETICAL_TAGS)) return 'theoretical';
  if (EVIDENCE_CATEGORIES.has(entry.category)) return 'evidence';
  if (HISTORICAL_CATEGORIES.has(entry.category)) return 'historical';
  if (entry.date) {
    const age = Date.now() - new Date(entry.date).getTime();
    if (age > 180 * 86400000) return 'historical';
  }
  if (entry.repo === 'FreeAgent') return 'application_adjacent';
  return 'unknown';
}

function computeAuthorityEdges(entries, crossRefs, tagIndex) {
  const entryMap = new Map();
  for (const e of entries) entryMap.set(e.id, e);

  const edges = [];
  const seen = new Set();

  const addEdge = (source, target, authority) => {
    const key = source + ':' + target + ':' + authority;
    if (seen.has(key)) return;
    if (!entryMap.has(source) || !entryMap.has(target)) return;
    seen.add(key);
    edges.push({ source, target, authority });
  };

  for (const ref of crossRefs) {
    const src = entryMap.get(ref.source);
    const tgt = entryMap.get(ref.target);
    if (!src || !tgt) continue;

    if (hasAnyTag(src.tags, VERIFICATION_TAGS) && VERIFICATION_CATEGORIES.has(src.category)) {
      addEdge(ref.source, ref.target, 'VERIFIES');
    } else if (hasAnyTag(src.tags, SIGNING_TAGS) && src.category === 'attestation') {
      addEdge(ref.source, ref.target, 'SIGNED_BY');
    } else if (hasAnyTag(src.tags, EXECUTION_TAGS) && CODE_TYPES.has(src.content_type)) {
      addEdge(ref.source, ref.target, 'EXECUTES');
    } else if (hasAnyTag(src.tags, CONTRADICTION_TAGS)) {
      addEdge(ref.source, ref.target, 'CONTRADICTS');
    } else if (DERIVATION_CATEGORIES.has(src.category)) {
      addEdge(ref.source, ref.target, 'DERIVES_FROM');
    } else {
      addEdge(ref.source, ref.target, 'DEPENDS_ON');
    }
  }

  for (const [tag, ids] of Object.entries(tagIndex)) {
    const validIds = ids.filter(id => entryMap.has(id));
    if (validIds.length < 2 || validIds.length > 80) continue;

    if (VERIFICATION_TAGS.has(tag)) {
      for (let i = 0; i < validIds.length; i++)
        for (let j = i + 1; j < validIds.length; j++) {
          addEdge(validIds[i], validIds[j], 'VERIFIES');
          addEdge(validIds[j], validIds[i], 'VERIFIES');
        }
    } else if (CONTRADICTION_TAGS.has(tag)) {
      for (let i = 0; i < validIds.length; i++)
        for (let j = i + 1; j < validIds.length; j++) {
          addEdge(validIds[i], validIds[j], 'CONTRADICTS');
          addEdge(validIds[j], validIds[i], 'CONTRADICTS');
        }
    } else if (SIGNING_TAGS.has(tag)) {
      for (let i = 0; i < validIds.length; i++)
        for (let j = i + 1; j < validIds.length; j++) {
          addEdge(validIds[i], validIds[j], 'SIGNED_BY');
          addEdge(validIds[j], validIds[i], 'SIGNED_BY');
        }
    } else if (EXECUTION_TAGS.has(tag)) {
      for (let i = 0; i < validIds.length; i++)
        for (let j = i + 1; j < validIds.length; j++) {
          addEdge(validIds[i], validIds[j], 'EXECUTES');
          addEdge(validIds[j], validIds[i], 'EXECUTES');
        }
    } else if (GOVERNANCE_TAGS.has(tag)) {
      for (let i = 0; i < validIds.length; i++)
        for (let j = i + 1; j < validIds.length; j++) {
          addEdge(validIds[i], validIds[j], 'DERIVES_FROM');
          addEdge(validIds[j], validIds[i], 'DERIVES_FROM');
        }
    }
  }

  return edges;
}

function computeNodeStatuses(entries, authorityEdges) {
  const incomingVerifies = new Map();
  const incomingContradicts = new Map();

  for (const edge of authorityEdges) {
    if (edge.authority === 'VERIFIES') {
      if (!incomingVerifies.has(edge.target)) incomingVerifies.set(edge.target, new Set());
      incomingVerifies.get(edge.target).add(edge.source);
    }
    if (edge.authority === 'CONTRADICTS') {
      if (!incomingContradicts.has(edge.target)) incomingContradicts.set(edge.target, new Set());
      incomingContradicts.get(edge.target).add(edge.source);
      if (!incomingContradicts.has(edge.source)) incomingContradicts.set(edge.source, new Set());
      incomingContradicts.get(edge.source).add(edge.target);
    }
  }

  return entries.map(entry => {
    const vCount = (incomingVerifies.get(entry.id) || new Set()).size;
    const cCount = (incomingContradicts.get(entry.id) || new Set()).size;
    let status = 'UNVERIFIED';
    if (QUARANTINE_CATEGORIES.has(entry.category)) status = 'QUARANTINED';
    else if (cCount > 0) status = 'CONFLICTED';
    else if (vCount >= 2) status = 'VERIFIED';
    else if (VERIFICATION_CATEGORIES.has(entry.category)) status = 'VERIFIED';
    else if (hasAnyTag(entry.tags, VERIFICATION_TAGS)) status = 'VERIFIED';
    return { id: entry.id, status, verificationCount: vCount, contradictionCount: cCount };
  });
}

console.log('Computing authority edges from site-index.json (' + index.entries.length + ' entries)...');
const authorityEdges = computeAuthorityEdges(index.entries, index.cross_references, index.tag_index);
console.log('Total authority edges: ' + authorityEdges.length);

const derivesFromEdges = authorityEdges.filter(e => e.authority === 'DERIVES_FROM');
console.log('DERIVES_FROM edges: ' + derivesFromEdges.length);

const entryMap = new Map();
for (const e of index.entries) entryMap.set(e.id, e);

const statusMap = new Map();
const statuses = computeNodeStatuses(index.entries, authorityEdges);
for (const s of statuses) statusMap.set(s.id, s);

// Find DERIVES_FROM edges where source is FreeAgent and target is governed lane
const freeAgentToGoverned = derivesFromEdges.filter(e => {
  const src = entryMap.get(e.source);
  const tgt = entryMap.get(e.target);
  return src && tgt && src.repo === 'FreeAgent' && LANE_REPOS.has(tgt.repo);
});

console.log('FreeAgent -> Governed DERIVES_FROM edges: ' + freeAgentToGoverned.length);

// Also find edges where target is FreeAgent and source is governed (reverse flow)
const governedToFreeAgent = derivesFromEdges.filter(e => {
  const src = entryMap.get(e.source);
  const tgt = entryMap.get(e.target);
  return src && tgt && LANE_REPOS.has(src.repo) && tgt.repo === 'FreeAgent';
});

console.log('Governed -> FreeAgent DERIVES_FROM edges: ' + governedToFreeAgent.length);

// Count DERIVES_FROM edges per FreeAgent node (outgoing to governed)
const faOutgoing = new Map();
for (const e of freeAgentToGoverned) {
  if (!faOutgoing.has(e.source)) faOutgoing.set(e.source, []);
  faOutgoing.get(e.source).push(e);
}

// Count DERIVES_FROM edges per FreeAgent node (incoming from governed)
const faIncoming = new Map();
for (const e of governedToFreeAgent) {
  if (!faIncoming.has(e.target)) faIncoming.set(e.target, []);
  faIncoming.get(e.target).push(e);
}

// Total derivation connections per FreeAgent node
const faTotalDerivations = new Map();
for (const [id, edges] of faOutgoing) {
  faTotalDerivations.set(id, (faTotalDerivations.get(id) || 0) + edges.length);
}
for (const [id, edges] of faIncoming) {
  faTotalDerivations.set(id, (faTotalDerivations.get(id) || 0) + edges.length);
}

// Get all DERIVES_FROM edges for FreeAgent nodes (not just cross-boundary)
const faAllDerives = derivesFromEdges.filter(e => {
  const src = entryMap.get(e.source);
  const tgt = entryMap.get(e.target);
  return (src && src.repo === 'FreeAgent') || (tgt && tgt.repo === 'FreeAgent');
});

const faAllOutgoing = new Map();
const faAllIncoming = new Map();
for (const e of faAllDerives) {
  const src = entryMap.get(e.source);
  const tgt = entryMap.get(e.target);
  if (src && src.repo === 'FreeAgent') {
    if (!faAllOutgoing.has(e.source)) faAllOutgoing.set(e.source, []);
    faAllOutgoing.get(e.source).push(e);
  }
  if (tgt && tgt.repo === 'FreeAgent') {
    if (!faAllIncoming.has(e.target)) faAllIncoming.set(e.target, []);
    faAllIncoming.get(e.target).push(e);
  }
}

// Build top FreeAgent nodes by cross-boundary derivation count
const topFA = [...faTotalDerivations.entries()]
  .map(([id, count]) => {
    const entry = entryMap.get(id);
    const status = statusMap.get(id);
    const govLayer = entry ? computeGovernanceLayer(entry) : 'unknown';
    const outgoingToGoverned = (faOutgoing.get(id) || []).length;
    const incomingFromGoverned = (faIncoming.get(id) || []).length;
    const allOutgoing = (faAllOutgoing.get(id) || []).length;
    const allIncoming = (faAllIncoming.get(id) || []).length;

    // Which governed lanes does this node derive into?
    const targetLanes = new Set();
    for (const e of (faOutgoing.get(id) || [])) {
      const tgt = entryMap.get(e.target);
      if (tgt) targetLanes.add(tgt.repo);
    }

    // What categories does it derive from (incoming)?
    const sourceCategories = new Set();
    for (const e of (faIncoming.get(id) || [])) {
      const src = entryMap.get(e.source);
      if (src) sourceCategories.add(src.category);
    }

    return {
      id,
      title: entry ? entry.title : id,
      path: entry ? entry.path : '',
      category: entry ? entry.category : '',
      governanceLayer: govLayer,
      status: status ? status.status : 'UNVERIFIED',
      verificationCount: status ? status.verificationCount : 0,
      contradictionCount: status ? status.contradictionCount : 0,
      tags: entry ? entry.tags : [],
      crossBoundaryOut: outgoingToGoverned,
      crossBoundaryIn: incomingFromGoverned,
      crossBoundaryTotal: count,
      allDerivesOut: allOutgoing,
      allDerivesIn: allIncoming,
      targetLanes: [...targetLanes],
      sourceCategories: [...sourceCategories],
    };
  })
  .sort((a, b) => b.crossBoundaryTotal - a.crossBoundaryTotal);

// Edge distribution by target lane
const laneDistribution = new Map();
for (const e of freeAgentToGoverned) {
  const tgt = entryMap.get(e.target);
  if (tgt) {
    laneDistribution.set(tgt.repo, (laneDistribution.get(tgt.repo) || 0) + 1);
  }
}

// Contradiction analysis: FreeAgent nodes with DERIVES_FROM that are CONFLICTED
const conflictedFA = topFA.filter(n => n.status === 'CONFLICTED');
const unverifiedFA = topFA.filter(n => n.status === 'UNVERIFIED');

// Category breakdown of FreeAgent nodes with derivation edges
const categoryBreakdown = new Map();
for (const n of topFA) {
  categoryBreakdown.set(n.category, (categoryBreakdown.get(n.category) || 0) + 1);
}

// Governance layer breakdown of FreeAgent derivation nodes
const govLayerBreakdown = new Map();
for (const n of topFA) {
  govLayerBreakdown.set(n.governanceLayer, (govLayerBreakdown.get(n.governanceLayer) || 0) + 1);
}

// Tag analysis: most common tags on high-derivation FreeAgent nodes
const tagCounts = new Map();
for (const n of topFA.slice(0, 50)) {
  for (const t of n.tags) {
    tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
  }
}

// Risk scoring: FreeAgent nodes with high derivation count + CONFLICTED status = highest risk
const riskScored = topFA.map(n => {
  let risk = n.crossBoundaryTotal;
  if (n.status === 'CONFLICTED') risk *= 3;
  if (n.status === 'UNVERIFIED') risk *= 1.5;
  if (n.contradictionCount > 0) risk += n.contradictionCount * 2;
  return { ...n, riskScore: Math.round(risk * 10) / 10 };
}).sort((a, b) => b.riskScore - a.riskScore);

// Generate the report
const now = new Date().toISOString();
const report = `# NFM-036 Derivation Analysis: FreeAgent-to-Governed Edge Computation

**Generated:** ${now}
**Source:** site-index.json (${index.entries.length} entries, ${index.cross_references.length} cross-references)
**Method:** Direct computation from static index data (no runtime API dependency)

## Executive Summary

FreeAgent (application_adjacent, authority_depth=0) has **${topFA.length}** nodes with cross-boundary DERIVES_FROM edges to governed lanes. These edges represent unattested derivation paths — patterns, code, and structures that flow from an ungoverned repository into the constitutional system without trust propagation.

**${freeAgentToGoverned.length}** DERIVES_FROM edges flow from FreeAgent → governed lanes.
**${governedToFreeAgent.length}** DERIVES_FROM edges flow from governed lanes → FreeAgent.

## System-Wide DERIVES_FROM Distribution

| Metric | Count |
|--------|-------|
| Total authority edges | ${authorityEdges.length} |
| Total DERIVES_FROM edges | ${derivesFromEdges.length} |
| FreeAgent → Governed | ${freeAgentToGoverned.length} |
| Governed → FreeAgent | ${governedToFreeAgent.length} |
| FreeAgent nodes with cross-boundary edges | ${topFA.length} |

### DERIVES_FROM by Target Lane (FreeAgent → Governed)

| Lane | Incoming from FreeAgent |
|------|------------------------|
${[...laneDistribution.entries()].sort((a, b) => b[1] - a[1]).map(([lane, count]) => '| ' + lane + ' | ' + count + ' |').join('\n')}

## Top 30 Highest-Risk FreeAgent Derivation Nodes

Risk score = crossBoundaryTotal × (3 if CONFLICTED, 1.5 if UNVERIFIED, 1 otherwise) + contradictionCount × 2

| Rank | Risk | Title | Cross-Boundary Edges | Status | Contradictions | Target Lanes | Governance Layer |
|------|------|-------|---------------------|--------|---------------|--------------|-----------------|
${riskScored.slice(0, 30).map((n, i) => '| ' + (i + 1) + ' | ' + n.riskScore + ' | ' + n.title.substring(0, 60) + ' | ' + n.crossBoundaryTotal + ' (out:' + n.crossBoundaryOut + ' in:' + n.crossBoundaryIn + ') | ' + n.status + ' | ' + n.contradictionCount + ' | ' + n.targetLanes.join(', ').substring(0, 40) + ' | ' + n.governanceLayer + ' |').join('\n')}

## Top 30 by Raw Cross-Boundary Edge Count

| Rank | Edges | Title | Out→Governed | In←Governed | Status | Category | Tags |
|------|-------|-------|-------------|------------|--------|----------|------|
${topFA.slice(0, 30).map((n, i) => '| ' + (i + 1) + ' | ' + n.crossBoundaryTotal + ' | ' + n.title.substring(0, 60) + ' | ' + n.crossBoundaryOut + ' | ' + n.crossBoundaryIn + ' | ' + n.status + ' | ' + n.category + ' | ' + n.tags.slice(0, 3).join(', ') + ' |').join('\n')}

## Derivation Risk Clusters

### CONFLICTED FreeAgent Nodes with Cross-Boundary Derivations

These are the highest-priority risk: nodes that both contradict other nodes AND derive into governed lanes.

| Title | Cross-Boundary | Contradictions | Verification | Target Lanes |
|-------|---------------|---------------|-------------|--------------|
${conflictedFA.slice(0, 20).map(n => '| ' + n.title.substring(0, 60) + ' | ' + n.crossBoundaryTotal + ' | ' + n.contradictionCount + ' | ' + n.verificationCount + ' | ' + n.targetLanes.join(', ').substring(0, 40) + ' |').join('\n')}

**Total CONFLICTED FreeAgent derivation nodes:** ${conflictedFA.length}

### UNVERIFIED FreeAgent Nodes with Cross-Boundary Derivations

| Title | Cross-Boundary | Category | Target Lanes |
|-------|---------------|----------|--------------|
${unverifiedFA.slice(0, 20).map(n => '| ' + n.title.substring(0, 60) + ' | ' + n.crossBoundaryTotal + ' | ' + n.category + ' | ' + n.targetLanes.join(', ').substring(0, 40) + ' |').join('\n')}

**Total UNVERIFIED FreeAgent derivation nodes:** ${unverifiedFA.length}

## Structural Analysis

### FreeAgent Derivation Nodes by Category

| Category | Count |
|----------|-------|
${[...categoryBreakdown.entries()].sort((a, b) => b[1] - a[1]).map(([cat, count]) => '| ' + cat + ' | ' + count + ' |').join('\n')}

### FreeAgent Derivation Nodes by Governance Layer

| Layer | Count |
|-------|-------|
${[...govLayerBreakdown.entries()].sort((a, b) => b[1] - a[1]).map(([layer, count]) => '| ' + layer + ' | ' + count + ' |').join('\n')}

### Common Tags on High-Derivation FreeAgent Nodes (Top 50)

| Tag | Count |
|-----|-------|
${[...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => '| ' + tag + ' | ' + count + ' |').join('\n')}

## Convergence Gate

\`\`\`json
{
  "claim": "Computed NFM-036 derivation analysis: ${topFA.length} FreeAgent nodes have cross-boundary DERIVES_FROM edges to governed lanes, ${freeAgentToGoverned.length} edges total flowing FreeAgent→governed, ${conflictedFA.length} of those nodes are CONFLICTED",
  "evidence": "library/docs/failure-modes/NFM-036-derivation-analysis.md",
  "verified_by": "library",
  "contradictions": [],
  "status": "proven"
}
\`\`\`

## Recommendations

1. **Immediate:** Flag the ${conflictedFA.length} CONFLICTED FreeAgent derivation nodes for attestation review before their derived patterns propagate further into governed lanes.
2. **Short-term:** Implement derivation attestation (NFM-036 Option B) — require signed attestation when FreeAgent code is promoted to a governed lane.
3. **Medium-term:** Add \`derivation_attestation\` field to governed code, track which FreeAgent derivations have been reviewed.
4. **Long-term:** Derivation trust scoring (NFM-036 Option C) — compute quantitative trust scores for DERIVES_FROM edges based on source verification status, contradiction density, and distance from CONFLICTED nodes.

## Cross-References

- NFM-036 parent document: \`library/docs/failure-modes/UNGOVERNED_DERIVATION_TRUST_GAP.md\`
- NFM-025: Signature Validity Under Compromised Key
- NFM-028: Identity Enforcement Escape Hatch — FreeAgent lacks identity enforcement
- Nexus Graph: \`deliberateensemble.works/graph\` (interactive visualization)
`;

const outDir = path.join(__dirname, '..', 'library', 'docs', 'failure-modes');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'NFM-036-derivation-analysis.md');
fs.writeFileSync(outPath, report, 'utf-8');
console.log('Report written to: ' + outPath);

// Also write raw JSON data for programmatic access
const jsonOut = {
  generated_at: now,
  total_authority_edges: authorityEdges.length,
  total_derives_from: derivesFromEdges.length,
  fa_to_governed: freeAgentToGoverned.length,
  governed_to_fa: governedToFreeAgent.length,
  fa_nodes_with_cross_boundary: topFA.length,
  conflicted_fa_derivation_nodes: conflictedFA.length,
  unverified_fa_derivation_nodes: unverifiedFA.length,
  lane_distribution: Object.fromEntries(laneDistribution),
  top_30_risk: riskScored.slice(0, 30),
  top_30_raw: topFA.slice(0, 30),
  category_breakdown: Object.fromEntries(categoryBreakdown),
  governance_layer_breakdown: Object.fromEntries(govLayerBreakdown),
};
const jsonPath = path.join(outDir, 'NFM-036-derivation-data.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), 'utf-8');
console.log('JSON data written to: ' + jsonPath);

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const VERIFICATION_TAGS = new Set(['Verification', 'Attestation', 'Identity Enforcement', 'Convergence Gate']);
const SIGNING_TAGS = new Set(['Attestation', 'Identity Enforcement']);
const EXECUTION_TAGS = new Set(['Kernel', 'Swarmmind', 'Multi-Agent']);
const GOVERNANCE_TAGS = new Set(['Governance', 'Constitutional AI', 'Covenant', 'Constraint Lattice']);
const CONTRADICTION_TAGS = new Set(['Failure Mode', 'Drift']);
const DERIVATION_CATEGORIES = new Set(['verification', 'attestation', 'governance', 'spec', 'paper']);
const VERIFICATION_CATEGORIES = new Set(['verification', 'attestation', 'audit']);
const QUARANTINE_CATEGORIES = new Set(['scratch', 'pending', 'sensitive']);
const CODE_TYPES = new Set(['code', 'config']);
const LANE_REPOS = new Set([
  'self-organizing-library', 'Archivist-Agent',
  'SwarmMind', 'SwarmMind-Self-Optimizing-Multi-Agent-AI-System', 'kernel-lane',
]);
const CONSTITUTIONAL_CATEGORIES = new Set(['governance', 'verification', 'attestation', 'spec', 'covenant', 'charter', 'constitution']);
const OPERATIONAL_CATEGORIES = new Set(['code', 'scripts', 'script', 'config', 'schema', 'ops', 'infrastructure']);
const OPERATIONAL_CATEGORIES_EXTENDED = new Set(['docs', 'root-doc', 'reports', 'report', 'ai-ensemble-lab', 'benchmark', 'bridge', 'drift']);
const EVIDENCE_CATEGORIES = new Set(['verification', 'audit', 'test-data', 'evidence', 'data', 'test']);
const HISTORICAL_CATEGORIES = new Set(['scratch', 'pending', 'sensitive', 'log']);
const THEORETICAL_TAGS = new Set(['Rosetta Stone', 'CAISC', 'Constraint Lattice', 'paper']);

function hasAnyTag(tags, tagSet) { return tags.some(t => tagSet.has(t)); }

function computeGovernanceLayer(entry) {
  if (LANE_REPOS.has(entry.repo) && CONSTITUTIONAL_CATEGORIES.has(entry.category)) return 'constitutional';
  if (LANE_REPOS.has(entry.repo) && OPERATIONAL_CATEGORIES.has(entry.category)) return 'operational';
  if (LANE_REPOS.has(entry.repo) && EVIDENCE_CATEGORIES.has(entry.category)) return 'evidence';
  if (LANE_REPOS.has(entry.repo) && HISTORICAL_CATEGORIES.has(entry.category)) return 'historical';
  if (LANE_REPOS.has(entry.repo) && OPERATIONAL_CATEGORIES_EXTENDED.has(entry.category)) return 'operational';
  if (LANE_REPOS.has(entry.repo)) return 'operational';
  if (entry.category === 'paper' || hasAnyTag(entry.tags, THEORETICAL_TAGS)) return 'theoretical';
  if (EVIDENCE_CATEGORIES.has(entry.category)) return 'evidence';
  if (HISTORICAL_CATEGORIES.has(entry.category)) return 'historical';
  return 'unknown';
}

function computeAuthorityEdges(entries, crossRefs, tagIndex) {
  const entryMap = new Map();
  for (const e of entries) entryMap.set(e.id, e);
  const edges = [];
  const seen = new Set();
  function addEdge(source, target, authority) {
    const key = `${source}:${target}:${authority}`;
    if (seen.has(key) || !entryMap.has(source) || !entryMap.has(target)) return;
    seen.add(key);
    edges.push({ source, target, authority });
  }
  for (const ref of crossRefs) {
    const src = entryMap.get(ref.source);
    if (!src) continue;
    if (hasAnyTag(src.tags, VERIFICATION_TAGS) && VERIFICATION_CATEGORIES.has(src.category)) addEdge(ref.source, ref.target, 'VERIFIES');
    else if (hasAnyTag(src.tags, SIGNING_TAGS) && src.category === 'attestation') addEdge(ref.source, ref.target, 'SIGNED_BY');
    else if (hasAnyTag(src.tags, EXECUTION_TAGS) && CODE_TYPES.has(src.content_type)) addEdge(ref.source, ref.target, 'EXECUTES');
    else if (hasAnyTag(src.tags, CONTRADICTION_TAGS)) addEdge(ref.source, ref.target, 'CONTRADICTS');
    else if (DERIVATION_CATEGORIES.has(src.category)) addEdge(ref.source, ref.target, 'DERIVES_FROM');
    else addEdge(ref.source, ref.target, 'DEPENDS_ON');
  }
  const TAG_GROUP_CAP = 80;
  const TAG_GROUP_LARGE_SAMPLE = 40;
  for (const [tag, ids] of Object.entries(tagIndex)) {
    let filteredIds = ids.filter(id => entryMap.has(id));
    if (filteredIds.length < 2) continue;
    if (filteredIds.length > TAG_GROUP_CAP) {
      const stride = Math.max(1, Math.floor(filteredIds.length / TAG_GROUP_LARGE_SAMPLE));
      const sampled = [];
      for (let i = 0; i < filteredIds.length; i += stride) { sampled.push(filteredIds[i]); if (sampled.length >= TAG_GROUP_LARGE_SAMPLE) break; }
      filteredIds = sampled;
    }
    if (filteredIds.length < 2) continue;
    let authType = null;
    if (VERIFICATION_TAGS.has(tag)) authType = 'VERIFIES';
    else if (CONTRADICTION_TAGS.has(tag)) authType = 'CONTRADICTS';
    else if (SIGNING_TAGS.has(tag)) authType = 'SIGNED_BY';
    else if (EXECUTION_TAGS.has(tag)) authType = 'EXECUTES';
    else if (GOVERNANCE_TAGS.has(tag)) authType = 'DERIVES_FROM';
    if (!authType) continue;
    for (let i = 0; i < filteredIds.length; i++)
      for (let j = i + 1; j < filteredIds.length; j++) {
        addEdge(filteredIds[i], filteredIds[j], authType);
        addEdge(filteredIds[j], filteredIds[i], authType);
      }
  }
  return edges;
}

function computeNodeStates(entries, authorityEdges) {
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
  const result = new Map();
  for (const entry of entries) {
    const vCount = (incomingVerifies.get(entry.id) || new Set()).size;
    const cCount = (incomingContradicts.get(entry.id) || new Set()).size;
    let status = 'UNVERIFIED';
    if (QUARANTINE_CATEGORIES.has(entry.category)) status = 'QUARANTINED';
    else if (cCount > 0) status = 'CONFLICTED';
    else if (vCount >= 2) status = 'VERIFIED';
    else if (VERIFICATION_CATEGORIES.has(entry.category)) status = 'VERIFIED';
    else if (hasAnyTag(entry.tags, VERIFICATION_TAGS)) status = 'VERIFIED';
    result.set(entry.id, {
      id: entry.id,
      title: entry.title,
      repo: entry.repo,
      path: entry.path,
      governanceLayer: computeGovernanceLayer(entry),
      status,
      verificationCount: vCount,
      contradictionCount: cCount,
    });
  }
  return result;
}

function analyzeSnapshot(snapshot) {
  const entries = snapshot.entries || [];
  const crossRefs = snapshot.cross_references || [];
  const tagIndex = snapshot.tag_index || {};
  const laneEntries = entries.filter(e => LANE_REPOS.has(e.repo));
  const authorityEdges = computeAuthorityEdges(entries, crossRefs, tagIndex);
  const nodeStates = computeNodeStates(entries, authorityEdges);

  const statusCounts = { VERIFIED: 0, UNVERIFIED: 0, CONFLICTED: 0, QUARANTINED: 0 };
  const layerCounts = {};
  for (const e of laneEntries) {
    const s = nodeStates.get(e.id);
    if (s) statusCounts[s.status]++;
    const layer = s ? s.governanceLayer : 'unknown';
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
  }

  const edgeTypeCounts = {};
  for (const edge of authorityEdges) {
    edgeTypeCounts[edge.authority] = (edgeTypeCounts[edge.authority] || 0) + 1;
  }

  return { nodeStates, statusCounts, layerCounts, edgeTypeCounts, totalNodes: laneEntries.length, totalEdges: authorityEdges.length };
}

function diffContradictions(olderSnapshot, newerSnapshot) {
  const olderAnalysis = analyzeSnapshot(olderSnapshot);
  const newerAnalysis = analyzeSnapshot(newerSnapshot);

  const olderStates = olderAnalysis.nodeStates;
  const newerStates = newerAnalysis.nodeStates;

  const introduced = [];
  const resolved = [];
  const persisted = [];

  const allIds = new Set([...olderStates.keys(), ...newerStates.keys()]);

  for (const id of allIds) {
    const oldNode = olderStates.get(id);
    const newNode = newerStates.get(id);
    const oldContradicted = oldNode && (oldNode.status === 'CONFLICTED' || oldNode.status === 'QUARANTINED');
    const newContradicted = newNode && (newNode.status === 'CONFLICTED' || newNode.status === 'QUARANTINED');

    if (!oldContradicted && newContradicted) {
      introduced.push({
        id, title: newNode.title, repo: newNode.repo, path: newNode.path,
        governanceLayer: newNode.governanceLayer,
        contradictionCount: newNode.contradictionCount,
        verificationCount: newNode.verificationCount,
        status: newNode.status,
      });
    } else if (oldContradicted && !newContradicted) {
      resolved.push({
        id, title: newNode ? newNode.title : oldNode.title,
        repo: newNode ? newNode.repo : oldNode.repo,
        path: newNode ? newNode.path : oldNode.path,
        governanceLayer: newNode ? newNode.governanceLayer : oldNode.governanceLayer,
        oldStatus: oldNode.status,
        newStatus: newNode ? newNode.status : 'REMOVED',
        oldContradictionCount: oldNode.contradictionCount,
        newContradictionCount: newNode ? newNode.contradictionCount : 0,
      });
    } else if (oldContradicted && newContradicted) {
      const cDelta = newNode.contradictionCount - oldNode.contradictionCount;
      persisted.push({
        id, title: newNode.title, repo: newNode.repo, path: newNode.path,
        governanceLayer: newNode.governanceLayer,
        contradictionCount: newNode.contradictionCount,
        contradictionDelta: cDelta,
        verificationCount: newNode.verificationCount,
        status: newNode.status,
      });
    }
  }

  introduced.sort((a, b) => b.contradictionCount - a.contradictionCount);
  resolved.sort((a, b) => b.oldContradictionCount - a.oldContradictionCount);
  persisted.sort((a, b) => b.contradictionCount - a.contradictionCount);

  return {
    from_date: olderSnapshot.generated_at ? olderSnapshot.generated_at.slice(0, 10) : 'unknown',
    to_date: newerSnapshot.generated_at ? newerSnapshot.generated_at.slice(0, 10) : 'unknown',
    generated_at: new Date().toISOString(),
    status_delta: {
      verified: newerAnalysis.statusCounts.VERIFIED - olderAnalysis.statusCounts.VERIFIED,
      unverified: newerAnalysis.statusCounts.UNVERIFIED - olderAnalysis.statusCounts.UNVERIFIED,
      conflicted: newerAnalysis.statusCounts.CONFLICTED - olderAnalysis.statusCounts.CONFLICTED,
      quarantined: newerAnalysis.statusCounts.QUARANTINED - olderAnalysis.statusCounts.QUARANTINED,
    },
    older_counts: olderAnalysis.statusCounts,
    newer_counts: newerAnalysis.statusCounts,
    edge_type_delta: {
      VERIFIES: (newerAnalysis.edgeTypeCounts.VERIFIES || 0) - (olderAnalysis.edgeTypeCounts.VERIFIES || 0),
      CONTRADICTS: (newerAnalysis.edgeTypeCounts.CONTRADICTS || 0) - (olderAnalysis.edgeTypeCounts.CONTRADICTS || 0),
      DERIVES_FROM: (newerAnalysis.edgeTypeCounts.DERIVES_FROM || 0) - (olderAnalysis.edgeTypeCounts.DERIVES_FROM || 0),
      EXECUTES: (newerAnalysis.edgeTypeCounts.EXECUTES || 0) - (olderAnalysis.edgeTypeCounts.EXECUTES || 0),
      DEPENDS_ON: (newerAnalysis.edgeTypeCounts.DEPENDS_ON || 0) - (olderAnalysis.edgeTypeCounts.DEPENDS_ON || 0),
    },
    contradictions_introduced: introduced,
    contradictions_resolved: resolved,
    contradictions_persisted: persisted,
    summary: {
      introduced_count: introduced.length,
      resolved_count: resolved.length,
      persisted_count: persisted.length,
      net_change: introduced.length - resolved.length,
      coherence_direction: introduced.length > resolved.length ? 'degraded' : introduced.length < resolved.length ? 'improved' : 'stable',
    },
    provenance: {
      agent: 'snapshot-contradiction-diff',
      lane: 'library',
      generated_at: new Date().toISOString(),
    },
  };
}

function formatHumanSummary(diff) {
  const lines = [
    `=== CONTRADICTION DIFF: ${diff.from_date} -> ${diff.to_date} ===`,
    '',
    '--- Status Changes ---',
    `  VERIFIED:     ${diff.older_counts.VERIFIED} -> ${diff.newer_counts.VERIFIED} (${diff.status_delta.verified >= 0 ? '+' : ''}${diff.status_delta.verified})`,
    `  UNVERIFIED:   ${diff.older_counts.UNVERIFIED} -> ${diff.newer_counts.UNVERIFIED} (${diff.status_delta.unverified >= 0 ? '+' : ''}${diff.status_delta.unverified})`,
    `  CONFLICTED:   ${diff.older_counts.CONFLICTED} -> ${diff.newer_counts.CONFLICTED} (${diff.status_delta.conflicted >= 0 ? '+' : ''}${diff.status_delta.conflicted})`,
    `  QUARANTINED:  ${diff.older_counts.QUARANTINED} -> ${diff.newer_counts.QUARANTINED} (${diff.status_delta.quarantined >= 0 ? '+' : ''}${diff.status_delta.quarantined})`,
    '',
    '--- Authority Edge Changes ---',
  ];
  for (const [type, delta] of Object.entries(diff.edge_type_delta)) {
    lines.push(`  ${type}: ${delta >= 0 ? '+' : ''}${delta}`);
  }
  lines.push('');
  lines.push('--- Contradiction Summary ---');
  lines.push(`  Introduced: ${diff.summary.introduced_count}`);
  lines.push(`  Resolved:   ${diff.summary.resolved_count}`);
  lines.push(`  Persisted:  ${diff.summary.persisted_count}`);
  lines.push(`  Net change: ${diff.summary.net_change >= 0 ? '+' : ''}${diff.summary.net_change}`);
  lines.push(`  Coherence:  ${diff.summary.coherence_direction}`);

  if (diff.contradictions_introduced.length > 0) {
    lines.push('', '--- Newly Contradicted ---');
    for (const n of diff.contradictions_introduced.slice(0, 10)) {
      lines.push(`  [${n.governanceLayer}] ${n.title} (${n.repo}) — ${n.contradictionCount} contradictions`);
    }
  }
  if (diff.contradictions_resolved.length > 0) {
    lines.push('', '--- Resolved ---');
    for (const n of diff.contradictions_resolved.slice(0, 10)) {
      lines.push(`  [${n.governanceLayer}] ${n.title} (${n.repo}) — ${n.oldStatus} -> ${n.newStatus}`);
    }
  }
  if (diff.contradictions_persisted.length > 0) {
    lines.push('', '--- Persisted (top 10 by count) ---');
    for (const n of diff.contradictions_persisted.slice(0, 10)) {
      const delta = n.contradictionDelta >= 0 ? `+${n.contradictionDelta}` : `${n.contradictionDelta}`;
      lines.push(`  [${n.governanceLayer}] ${n.title} (${n.repo}) — ${n.contradictionCount} contradictions (${delta})`);
    }
  }

  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const olderPath = args[0];
  const newerPath = args[1];
  const outputFormat = args.includes('--json') ? 'json' : 'text';
  const saveDir = args.includes('--save') ? path.resolve(__dirname, '..', 'data', 'snapshot-diffs') : null;

  if (!olderPath || !newerPath) {
    const snapDir = path.resolve(__dirname, '..', 'data', 'snapshots');
    if (!fs.existsSync(snapDir)) { console.error('No data/snapshots/ directory found'); process.exit(1); }
    const files = fs.readdirSync(snapDir).filter(f => f.endsWith('.json')).sort();
    if (files.length < 2) { console.error('Need at least 2 snapshots. Usage: node snapshot-contradiction-diff.js <older.json> <newer.json>'); process.exit(1); }
    console.log(`Available snapshots:\n${files.map(f => `  ${f}`).join('\n')}`);
    console.log(`\nUsage: node scripts/snapshot-contradiction-diff.js data/snapshots/${files[0]} data/snapshots/${files[1]}`);
    process.exit(0);
  }

  const older = JSON.parse(fs.readFileSync(olderPath, 'utf8'));
  const newer = JSON.parse(fs.readFileSync(newerPath, 'utf8'));

  const diff = diffContradictions(older, newer);

  if (outputFormat === 'json') {
    console.log(JSON.stringify(diff, null, 2));
  } else {
    console.log(formatHumanSummary(diff));
  }

  if (saveDir) {
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });
    const filename = `${diff.from_date}_to_${diff.to_date}.json`;
    const savePath = path.join(saveDir, filename);
    fs.writeFileSync(savePath, JSON.stringify(diff, null, 2));
    console.log(`\nSaved to ${savePath}`);
  }
}

main();

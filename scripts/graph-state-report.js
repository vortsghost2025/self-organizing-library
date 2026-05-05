#!/usr/bin/env node
'use strict';

/**
 * graph-state-report.js
 * 
 * Text-based graph state query tool for the Library lane.
 * Ports truth-routing logic from src/lib/truth-routing.ts to standalone Node.js.
 * 
 * CLI modes:
 *   --summary           High-level stats (default)
 *   --contradictions    List all CONFLICTED nodes with context
 *   --unverified        List UNVERIFIED nodes by governance layer
 *   --authority-gaps    Nodes with zero authority edges (disconnected)
 *   --layer <name>      Filter to specific governance layer
 *   --repo <name>       Filter to specific repo
 *   --top <N>           Limit output to top N results (default: 50)
 *   --json              Output as JSON instead of text
 *   --emit-inbox        Drop report as lane message into Library inbox
 *   --cron              Alias for --emit-inbox (for systemd timer use)
 * 
 * Output provenance: All output includes model/lane/timestamp header.
 * 
 * @author Manager | Opus 4.6
 * @lane library
 * @generated 2026-05-05
 */

const fs = require('fs');
const path = require('path');

// --- Constants ---

const VERIFICATION_TAGS = new Set([
  'Verification', 'Attestation', 'Identity Enforcement', 'Convergence Gate',
]);
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
const GAME_CATEGORIES = new Set(['game', 'uss-chaosbringer', 'uss_chaosbringer']);
const CONSTITUTIONAL_CATEGORIES = new Set(['governance', 'verification', 'attestation', 'spec', 'covenant', 'charter', 'constitution']);
const OPERATIONAL_CATEGORIES = new Set(['code', 'scripts', 'script', 'config', 'schema', 'ops', 'infrastructure']);
const OPERATIONAL_CATEGORIES_EXTENDED = new Set(['docs', 'root-doc', 'reports', 'report', 'ai-ensemble-lab', 'benchmark', 'bridge', 'drift']);
const EVIDENCE_CATEGORIES = new Set(['verification', 'audit', 'test-data', 'evidence', 'data', 'test']);
const HISTORICAL_CATEGORIES = new Set(['scratch', 'pending', 'sensitive', 'log']);
const THEORETICAL_TAGS = new Set(['Rosetta Stone', 'CAISC', 'Constraint Lattice', 'paper']);

const REPO_AUTHORITY_DEPTH = {
  'Archivist-Agent': 95,
  'self-organizing-library': 90,
  'SwarmMind': 80,
  'SwarmMind-Self-Optimizing-Multi-Agent-AI-System': 80,
  'kernel-lane': 75,
  'federation': 50,
  'FreeAgent': 40,
  'Deliberate-AI-Ensemble': 60,
  'storytime': 30,
  'papers': 70,
};

const FREEAGENT_SUBCATEGORY_MAP = {
  'medical': 'application_adjacent', 'we4free': 'application_adjacent',
  'we': 'application_adjacent', 'distributed': 'operational',
  'infrastructure': 'operational', 'shared-infra': 'operational',
  'connection-bridge': 'operational', 'ui': 'application_adjacent',
  'data': 'evidence', 'docs': 'theoretical', 'agent': 'operational',
  'coordination': 'operational', 'project': 'operational',
  'game': 'application_adjacent', 'phase-6': 'theoretical',
  'scratch': 'historical', 'config': 'operational',
  'public_html': 'application_adjacent', 'log': 'historical', 'script': 'operational',
  'orchestrator': 'operational',
};

const TAG_GROUP_CAP = 80;
const TAG_GROUP_LARGE_SAMPLE = 40;

// --- Helpers ---

function hasAnyTag(tags, tagSet) {
  return tags.some(t => tagSet.has(t));
}

function nowIso() {
  return new Date().toISOString();
}

// --- Truth Routing (ported from TypeScript) ---

function computeAuthorityEdges(entries, crossRefs, tagIndex) {
  const entryMap = new Map();
  for (const e of entries) entryMap.set(e.id, e);

  const edges = [];
  const seen = new Set();

  function addEdge(source, target, authority) {
    const key = `${source}:${target}:${authority}`;
    if (seen.has(key)) return;
    if (!entryMap.has(source) || !entryMap.has(target)) return;
    seen.add(key);
    edges.push({ source, target, authority });
  }

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

  // Tag-group authority edges
  for (const [tag, ids] of Object.entries(tagIndex)) {
    let filteredIds = ids.filter(id => entryMap.has(id));
    if (filteredIds.length < 2) continue;

    if (filteredIds.length > TAG_GROUP_CAP) {
      const stride = Math.max(1, Math.floor(filteredIds.length / TAG_GROUP_LARGE_SAMPLE));
      const sampled = [];
      for (let i = 0; i < filteredIds.length; i += stride) {
        sampled.push(filteredIds[i]);
        if (sampled.length >= TAG_GROUP_LARGE_SAMPLE) break;
      }
      filteredIds = sampled;
    }

    if (filteredIds.length < 2) continue;

    if (VERIFICATION_TAGS.has(tag)) {
      for (let i = 0; i < filteredIds.length; i++) {
        for (let j = i + 1; j < filteredIds.length; j++) {
          addEdge(filteredIds[i], filteredIds[j], 'VERIFIES');
          addEdge(filteredIds[j], filteredIds[i], 'VERIFIES');
        }
      }
    } else if (CONTRADICTION_TAGS.has(tag)) {
      for (let i = 0; i < filteredIds.length; i++) {
        for (let j = i + 1; j < filteredIds.length; j++) {
          addEdge(filteredIds[i], filteredIds[j], 'CONTRADICTS');
          addEdge(filteredIds[j], filteredIds[i], 'CONTRADICTS');
        }
      }
    } else if (SIGNING_TAGS.has(tag)) {
      for (let i = 0; i < filteredIds.length; i++) {
        for (let j = i + 1; j < filteredIds.length; j++) {
          addEdge(filteredIds[i], filteredIds[j], 'SIGNED_BY');
          addEdge(filteredIds[j], filteredIds[i], 'SIGNED_BY');
        }
      }
    } else if (EXECUTION_TAGS.has(tag)) {
      for (let i = 0; i < filteredIds.length; i++) {
        for (let j = i + 1; j < filteredIds.length; j++) {
          addEdge(filteredIds[i], filteredIds[j], 'EXECUTES');
          addEdge(filteredIds[j], filteredIds[i], 'EXECUTES');
        }
      }
    } else if (GOVERNANCE_TAGS.has(tag)) {
      for (let i = 0; i < filteredIds.length; i++) {
        for (let j = i + 1; j < filteredIds.length; j++) {
          addEdge(filteredIds[i], filteredIds[j], 'DERIVES_FROM');
          addEdge(filteredIds[j], filteredIds[i], 'DERIVES_FROM');
        }
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
    if (QUARANTINE_CATEGORIES.has(entry.category)) {
      status = 'QUARANTINED';
    } else if (cCount > 0) {
      status = 'CONFLICTED';
    } else if (vCount >= 2) {
      status = 'VERIFIED';
    } else if (VERIFICATION_CATEGORIES.has(entry.category)) {
      status = 'VERIFIED';
    } else if (hasAnyTag(entry.tags, VERIFICATION_TAGS)) {
      status = 'VERIFIED';
    }

    return { id: entry.id, status, verificationCount: vCount, contradictionCount: cCount };
  });
}

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
  if (entry.date) {
    const age = Date.now() - new Date(entry.date).getTime();
    if (age > 180 * 86400000) return 'historical';
  }
  if (GAME_CATEGORIES.has(entry.category)) return 'application_adjacent';
  if (entry.repo === 'FreeAgent') return FREEAGENT_SUBCATEGORY_MAP[entry.category] || 'application_adjacent';
  if (entry.repo === 'federation') {
    if (OPERATIONAL_CATEGORIES.has(entry.category) || entry.category === 'code' || entry.category === 'script') return 'operational';
    if (entry.category === 'docs' || entry.category === 'root-doc') return 'theoretical';
    if (GAME_CATEGORIES.has(entry.category)) return 'application_adjacent';
    return 'operational';
  }
  if (entry.repo === 'Deliberate-AI-Ensemble') {
    if (entry.category === 'governance' || entry.category === 'architecture') return 'constitutional';
    if (entry.category === 'paper' || entry.category === 'drift' || entry.category === 'resilience') return 'theoretical';
    return 'operational';
  }
  if (entry.repo === 'storytime') return 'application_adjacent';
  if (entry.repo === 'papers') return 'theoretical';
  return 'unknown';
}

// --- Main Analysis ---

function analyzeGraph(siteIndex) {
  const entries = siteIndex.entries;
  const crossRefs = siteIndex.cross_references;
  const tagIndex = siteIndex.tag_index;

  const authorityEdges = computeAuthorityEdges(entries, crossRefs, tagIndex);
  const nodeStatuses = computeNodeStatuses(entries, authorityEdges);

  const statusMap = new Map(nodeStatuses.map(s => [s.id, s]));
  const entryMap = new Map(entries.map(e => [e.id, e]));

  // Compute governance layers
  const govLayers = new Map();
  for (const entry of entries) {
    govLayers.set(entry.id, computeGovernanceLayer(entry));
  }

  // Compute connection counts
  const connectionCounts = new Map();
  for (const edge of authorityEdges) {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
  }

  // Filter to lane repos only (matching API behavior)
  const laneEntries = entries.filter(e => LANE_REPOS.has(e.repo));

  return {
    allEntries: entries,
    laneEntries,
    authorityEdges,
    nodeStatuses,
    statusMap,
    entryMap,
    govLayers,
    connectionCounts,
  };
}

// --- Report Generators ---

function generateSummary(analysis) {
  const { laneEntries, authorityEdges, statusMap, govLayers } = analysis;

  const statusCounts = { VERIFIED: 0, UNVERIFIED: 0, CONFLICTED: 0, QUARANTINED: 0 };
  const layerCounts = {};
  const repoCounts = {};

  for (const entry of laneEntries) {
    const status = statusMap.get(entry.id);
    if (status) statusCounts[status.status] = (statusCounts[status.status] || 0) + 1;
    const layer = govLayers.get(entry.id) || 'unknown';
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    repoCounts[entry.repo] = (repoCounts[entry.repo] || 0) + 1;
  }

  const edgeTypeCounts = {};
  for (const edge of authorityEdges) {
    edgeTypeCounts[edge.authority] = (edgeTypeCounts[edge.authority] || 0) + 1;
  }

  return {
    total_nodes: laneEntries.length,
    total_authority_edges: authorityEdges.length,
    status_counts: statusCounts,
    layer_counts: layerCounts,
    repo_counts: repoCounts,
    edge_type_counts: edgeTypeCounts,
    health_score: Math.round((statusCounts.VERIFIED / Math.max(1, laneEntries.length)) * 100),
    contradiction_rate: Math.round((statusCounts.CONFLICTED / Math.max(1, laneEntries.length)) * 100),
  };
}

function generateContradictions(analysis, options = {}) {
  const { laneEntries, statusMap, govLayers, entryMap, authorityEdges } = analysis;
  const limit = options.top || 50;
  const repoFilter = options.repo;
  const layerFilter = options.layer;

  // Find all contradicted nodes
  let conflicted = laneEntries.filter(e => {
    const s = statusMap.get(e.id);
    return s && s.status === 'CONFLICTED';
  });

  if (repoFilter) conflicted = conflicted.filter(e => e.repo === repoFilter);
  if (layerFilter) conflicted = conflicted.filter(e => govLayers.get(e.id) === layerFilter);

  // Sort by contradiction count descending
  conflicted.sort((a, b) => {
    const ca = statusMap.get(a.id).contradictionCount;
    const cb = statusMap.get(b.id).contradictionCount;
    return cb - ca;
  });

  // Build contradiction details with sources
  const contradictEdges = authorityEdges.filter(e => e.authority === 'CONTRADICTS');
  const contradictMap = new Map();
  for (const edge of contradictEdges) {
    if (!contradictMap.has(edge.target)) contradictMap.set(edge.target, []);
    contradictMap.get(edge.target).push(edge.source);
    if (!contradictMap.has(edge.source)) contradictMap.set(edge.source, []);
    contradictMap.get(edge.source).push(edge.target);
  }

  return conflicted.slice(0, limit).map(entry => {
    const status = statusMap.get(entry.id);
    const sources = [...new Set(contradictMap.get(entry.id) || [])];
    const sourceDetails = sources.slice(0, 5).map(sid => {
      const se = entryMap.get(sid);
      return se ? { id: sid, title: se.title, repo: se.repo } : { id: sid };
    });

    return {
      id: entry.id,
      title: entry.title,
      repo: entry.repo,
      path: entry.path,
      governance_layer: govLayers.get(entry.id),
      contradiction_count: status.contradictionCount,
      verification_count: status.verificationCount,
      contradiction_sources: sourceDetails,
      tags: entry.tags.slice(0, 5),
    };
  });
}

function generateUnverified(analysis, options = {}) {
  const { laneEntries, statusMap, govLayers, connectionCounts } = analysis;
  const limit = options.top || 50;
  const repoFilter = options.repo;
  const layerFilter = options.layer;

  let unverified = laneEntries.filter(e => {
    const s = statusMap.get(e.id);
    return s && s.status === 'UNVERIFIED';
  });

  if (repoFilter) unverified = unverified.filter(e => e.repo === repoFilter);
  if (layerFilter) unverified = unverified.filter(e => govLayers.get(e.id) === layerFilter);

  // Prioritize: constitutional > operational > theoretical > others
  const layerPriority = { constitutional: 0, operational: 1, theoretical: 2, evidence: 3, historical: 4, application_adjacent: 5, unknown: 6 };
  unverified.sort((a, b) => {
    const la = layerPriority[govLayers.get(a.id)] || 6;
    const lb = layerPriority[govLayers.get(b.id)] || 6;
    if (la !== lb) return la - lb;
    // Then by connection count (more connected = higher priority)
    return (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0);
  });

  return unverified.slice(0, limit).map(entry => ({
    id: entry.id,
    title: entry.title,
    repo: entry.repo,
    path: entry.path,
    governance_layer: govLayers.get(entry.id),
    connection_count: connectionCounts.get(entry.id) || 0,
    tags: entry.tags.slice(0, 5),
  }));
}

function generateAuthorityGaps(analysis, options = {}) {
  const { laneEntries, connectionCounts, govLayers } = analysis;
  const limit = options.top || 50;
  const repoFilter = options.repo;
  const layerFilter = options.layer;

  let disconnected = laneEntries.filter(e => (connectionCounts.get(e.id) || 0) === 0);

  if (repoFilter) disconnected = disconnected.filter(e => e.repo === repoFilter);
  if (layerFilter) disconnected = disconnected.filter(e => govLayers.get(e.id) === layerFilter);

  // Prioritize constitutional disconnected nodes (worst gaps)
  const layerPriority = { constitutional: 0, operational: 1, theoretical: 2, evidence: 3, historical: 4, application_adjacent: 5, unknown: 6 };
  disconnected.sort((a, b) => {
    const la = layerPriority[govLayers.get(a.id)] || 6;
    const lb = layerPriority[govLayers.get(b.id)] || 6;
    return la - lb;
  });

  return disconnected.slice(0, limit).map(entry => ({
    id: entry.id,
    title: entry.title,
    repo: entry.repo,
    path: entry.path,
    governance_layer: govLayers.get(entry.id),
    tags: entry.tags.slice(0, 5),
  }));
}

// --- Output Formatting ---

function formatProvenance() {
  return `[graph-state-report | library-lane | ${nowIso()}]`;
}

function formatTextSummary(summary) {
  const lines = [
    formatProvenance(),
    '',
    '=== GRAPH STATE SUMMARY ===',
    '',
    `Total Nodes (4 lane repos): ${summary.total_nodes}`,
    `Total Authority Edges: ${summary.total_authority_edges}`,
    `Health Score: ${summary.health_score}% verified`,
    `Contradiction Rate: ${summary.contradiction_rate}%`,
    '',
    '--- Status Breakdown ---',
    `  VERIFIED:     ${summary.status_counts.VERIFIED}`,
    `  UNVERIFIED:   ${summary.status_counts.UNVERIFIED}`,
    `  CONFLICTED:   ${summary.status_counts.CONFLICTED}`,
    `  QUARANTINED:  ${summary.status_counts.QUARANTINED}`,
    '',
    '--- By Governance Layer ---',
  ];
  for (const [layer, count] of Object.entries(summary.layer_counts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${layer}: ${count}`);
  }
  lines.push('', '--- By Repo ---');
  for (const [repo, count] of Object.entries(summary.repo_counts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${repo}: ${count}`);
  }
  lines.push('', '--- Authority Edge Types ---');
  for (const [type, count] of Object.entries(summary.edge_type_counts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${type}: ${count}`);
  }
  return lines.join('\n');
}

function formatTextContradictions(contradictions) {
  if (contradictions.length === 0) return formatProvenance() + '\n\nNo contradictions found.';
  const lines = [
    formatProvenance(),
    '',
    `=== CONTRADICTIONS (${contradictions.length} nodes) ===`,
    '',
  ];
  for (const node of contradictions) {
    lines.push(`[${node.governance_layer}] ${node.title}`);
    lines.push(`  repo: ${node.repo} | path: ${node.path}`);
    lines.push(`  contradictions: ${node.contradiction_count} | verifications: ${node.verification_count}`);
    if (node.contradiction_sources.length > 0) {
      lines.push(`  contradicted by:`);
      for (const src of node.contradiction_sources) {
        lines.push(`    - ${src.title || src.id} (${src.repo || '?'})`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function formatTextUnverified(unverified) {
  if (unverified.length === 0) return formatProvenance() + '\n\nAll nodes verified.';
  const lines = [
    formatProvenance(),
    '',
    `=== UNVERIFIED NODES (${unverified.length}, priority-sorted) ===`,
    '',
  ];
  for (const node of unverified) {
    lines.push(`[${node.governance_layer}] ${node.title}`);
    lines.push(`  repo: ${node.repo} | connections: ${node.connection_count}`);
    lines.push(`  path: ${node.path}`);
    lines.push('');
  }
  return lines.join('\n');
}

function formatTextAuthorityGaps(gaps) {
  if (gaps.length === 0) return formatProvenance() + '\n\nNo authority gaps found.';
  const lines = [
    formatProvenance(),
    '',
    `=== AUTHORITY GAPS (${gaps.length} disconnected nodes) ===`,
    '',
  ];
  for (const node of gaps) {
    lines.push(`[${node.governance_layer}] ${node.title}`);
    lines.push(`  repo: ${node.repo} | path: ${node.path}`);
    lines.push('');
  }
  return lines.join('\n');
}

// --- Inbox Message Builder ---

function buildInboxMessage(reportType, reportBody, summary) {
  const taskId = `graph-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    schema_version: '1.3',
    task_id: taskId,
    idempotency_key: `graph-report-${new Date().toISOString().slice(0, 10)}-${reportType}`,
    from: 'library',
    to: 'library',
    type: 'task',
    task_kind: 'report',
    priority: summary && summary.contradiction_rate > 10 ? 'P0' : 'P1',
    subject: `Graph State Report: ${reportType} (${nowIso().slice(0, 10)})`,
    body: reportBody,
    timestamp: nowIso(),
    requires_action: true,
    payload: { mode: 'inline', compression: 'none' },
    execution: { mode: 'auto', engine: 'pipeline', actor: 'lane' },
    lease: { owner: 'library', acquired_at: nowIso(), expires_at: null, renew_count: 0, max_renewals: 3 },
    retry: { attempt: 1, max_attempts: 1, last_error: null, last_attempt_at: null },
    evidence: { required: false, evidence_path: null, verified: false, verified_by: null, verified_at: null },
    evidence_exchange: { artifact_type: 'report', artifact_path: null },
    heartbeat: { status: 'pending', last_heartbeat_at: nowIso(), interval_seconds: 300, timeout_seconds: 900 },
    output_provenance: {
      agent: 'graph-state-report',
      lane: 'library',
      generated_at: nowIso(),
      session_id: `graph-report-${process.pid}`,
    },
  };
}

// --- CLI ---

function parseArgs(argv) {
  const opts = {
    mode: 'summary',
    top: 50,
    repo: null,
    layer: null,
    json: false,
    emitInbox: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--summary') opts.mode = 'summary';
    else if (a === '--contradictions') opts.mode = 'contradictions';
    else if (a === '--unverified') opts.mode = 'unverified';
    else if (a === '--authority-gaps') opts.mode = 'authority-gaps';
    else if (a === '--top' && argv[i + 1]) { opts.top = parseInt(argv[++i], 10); }
    else if (a === '--repo' && argv[i + 1]) { opts.repo = argv[++i]; }
    else if (a === '--layer' && argv[i + 1]) { opts.layer = argv[++i]; }
    else if (a === '--json') opts.json = true;
    else if (a === '--emit-inbox' || a === '--cron') opts.emitInbox = true;
  }

  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  // Load site-index.json
  const indexPath = path.resolve(__dirname, '..', 'data', 'site-index.json');
  if (!fs.existsSync(indexPath)) {
    console.error(`[graph-state-report] ERROR: data/site-index.json not found at ${indexPath}`);
    console.error('Run generate-site-index.js first (requires Windows S:/ paths).');
    process.exit(1);
  }

  const siteIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const analysis = analyzeGraph(siteIndex);

  let result;
  let textOutput;

  switch (opts.mode) {
    case 'summary': {
      result = generateSummary(analysis);
      textOutput = formatTextSummary(result);
      break;
    }
    case 'contradictions': {
      const summary = generateSummary(analysis);
      result = generateContradictions(analysis, opts);
      textOutput = formatTextContradictions(result);
      // Append summary context
      textOutput += `\n\n--- Context: ${summary.total_nodes} total nodes, ${summary.health_score}% verified, ${summary.contradiction_rate}% contradicted ---`;
      break;
    }
    case 'unverified': {
      result = generateUnverified(analysis, opts);
      textOutput = formatTextUnverified(result);
      break;
    }
    case 'authority-gaps': {
      result = generateAuthorityGaps(analysis, opts);
      textOutput = formatTextAuthorityGaps(result);
      break;
    }
    default: {
      console.error(`Unknown mode: ${opts.mode}`);
      process.exit(1);
    }
  }

  // Output
  if (opts.json && !opts.emitInbox) {
    console.log(JSON.stringify(result, null, 2));
  } else if (opts.emitInbox) {
    const summary = generateSummary(analysis);
    // Build full report combining all modes for inbox
    const allText = [
      formatTextSummary(summary),
      '',
      '---',
      '',
      formatTextContradictions(generateContradictions(analysis, { top: 20 })),
      '',
      '---',
      '',
      formatTextUnverified(generateUnverified(analysis, { top: 20 })),
    ].join('\n');

    const msg = buildInboxMessage('full-state', allText, summary);

    // Determine inbox path
    const repoRoot = path.resolve(__dirname, '..');
    const inboxPath = path.join(repoRoot, 'lanes', 'library', 'inbox');
    if (!fs.existsSync(inboxPath)) {
      fs.mkdirSync(inboxPath, { recursive: true });
    }

    const filename = `graph-report-${new Date().toISOString().slice(0, 10)}.json`;
    const targetPath = path.join(inboxPath, filename);

    // Don't overwrite if already exists today (idempotency)
    if (fs.existsSync(targetPath)) {
      console.log(`[graph-state-report] Report already exists for today: ${targetPath}`);
      console.log('[graph-state-report] Skipping (idempotent). Delete to regenerate.');
      process.exit(0);
    }

    fs.writeFileSync(targetPath, JSON.stringify(msg, null, 2), 'utf8');
    console.log(`[graph-state-report] Dropped inbox message: ${targetPath}`);
    console.log(`[graph-state-report] Priority: ${msg.priority} | Contradictions: ${summary.status_counts.CONFLICTED} | Health: ${summary.health_score}%`);
  } else {
    console.log(textOutput);
  }
}

main();

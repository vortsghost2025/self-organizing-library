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
  return 'unknown';
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
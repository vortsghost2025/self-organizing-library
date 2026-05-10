#!/usr/bin/env node
/**
 * Library Lane Graph Snapshot Analyzer
 *
 * Analysis adapter for Library lane responsibilities:
 * - Focus: Edge semantics, tag quality, graph structure
 * - Flags: Bad link edges, tag normalization issues, missing cross-repo edges
 * - Output: JSON findings with node_id, issue_type, severity, description, suggested_action
 *
 * Usage:
 *   node scripts/library-graph-analyzer.js <snapshot-path> [--output-dir=DIR]
 *
 * Integration: Designed to be called by file watcher on new snapshots
 */

const fs = require('fs');
const path = require('path');

const LIBRARY_LANE_REPO = 'self-organizing-library';
const EVIDENCE_DIR = 'lanes/library/evidence';

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Library Lane Graph Snapshot Analyzer

Usage:
  node scripts/library-graph-analyzer.js <snapshot-path> [--output-dir=DIR]

Options:
  --output-dir DIR   Write findings to custom directory (default: lanes/library/evidence)
  --help, -h       Show this help

Description:
  Analyzes graph snapshots for Library lane concerns:
  - Bad link edges (shared-tag edges without actual tag overlap)
  - Tag normalization issues (inconsistent casing, pluralization)
  - Missing cross-repo edges (nodes that should connect to other repos)
  - Isolated nodes (no meaningful connections)
`);
    process.exit(0);
  }

  let snapshotPath = null;
  let outputDir = EVIDENCE_DIR;

  for (const arg of args) {
    if (arg.startsWith('--output-dir=')) {
      outputDir = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      snapshotPath = arg;
    }
  }

  if (!snapshotPath) {
    console.error('ERROR: No snapshot path provided');
    process.exit(1);
  }

  if (!fs.existsSync(snapshotPath)) {
    console.error(`ERROR: Snapshot not found: ${snapshotPath}`);
    process.exit(1);
  }

  return { snapshotPath, outputDir };
}

function loadSnapshot(snapshotPath) {
  try {
    const data = fs.readFileSync(snapshotPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`ERROR: Failed to parse snapshot: ${e.message}`);
    process.exit(1);
  }
}

function createFinding(nodeId, issueType, severity, description, suggestedAction) {
  return {
    node_id: nodeId,
    issue_type: issueType,
    severity,
    description,
    suggested_action: suggestedAction,
    analyzer: 'library-lane-graph-analyzer',
    timestamp: new Date().toISOString()
  };
}

function analyzeBadLinkEdges(graph) {
  const findings = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const nodeTags = new Map();
  for (const node of nodes) {
    const tags = new Set((node.tags || []).map(t => t.toLowerCase()));
    nodeTags.set(node.id, tags);
  }

  for (const edge of edges) {
    if (edge.type === 'shared-tag') {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourceTags = nodeTags.get(edge.source) || new Set();
        const targetTags = nodeTags.get(edge.target) || new Set();

        const commonTags = [...sourceTags].filter(t => targetTags.has(t));

        if (commonTags.length === 0) {
          findings.push(createFinding(
            `${edge.source},${edge.target}`,
            'bad_link_edge',
            'high',
            `Shared-tag edge connects nodes with no matching tags. Edge: ${edge.source} -> ${edge.target}. Source tags: [${sourceNode.tags?.join(', ')}], Target tags: [${targetNode.tags?.join(', ')}]`,
            'Remove the shared-tag edge or verify tag overlap. Check if tags are normalized (same casing, no pluralization differences).'
          ));
        }
      }
    }
  }

  return findings;
}

function analyzeTagNormalization(graph) {
  const findings = [];
  const nodes = graph.nodes || [];

  function normalizeTag(tag) {
    return tag.toLowerCase().replace(/s$/, '');
  }

  const tagVariants = new Map();
  const tagNodeRefs = new Map();

  for (const node of nodes) {
    const tags = node.tags || [];
    for (const tag of tags) {
      const normalized = normalizeTag(tag);
      if (!tagVariants.has(normalized)) {
        tagVariants.set(normalized, []);
      }
      tagVariants.get(normalized).push(tag);

      if (!tagNodeRefs.has(normalized)) {
        tagNodeRefs.set(normalized, []);
      }
      tagNodeRefs.get(normalized).push(node.id);
    }
  }

  for (const [normalized, variants] of tagVariants) {
    const uniqueTags = [...new Set(variants)];
    if (uniqueTags.length > 1) {
      findings.push(createFinding(
        tagNodeRefs.get(normalized).join(','),
        'tag_normalization',
        'medium',
        `Inconsistent tag variants for '${normalized}': [${uniqueTags.join(', ')}]. This creates fragmented clusters.`,
        `Normalize tags to consistent form. Recommended: use singular lowercase form (e.g., '${normalized}'). Merge tag clusters after normalization.`
      ));
    }
  }

  return findings;
}

function analyzeMissingCrossRepoEdges(graph) {
  const findings = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const repoMap = new Map();
  for (const node of nodes) {
    if (!repoMap.has(node.repo)) {
      repoMap.set(node.repo, []);
    }
    repoMap.get(node.repo).push(node);
  }

  const repos = [...repoMap.keys()];
  if (repos.length < 2) return findings;

  const connectedPairs = new Set();
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode && sourceNode.repo !== targetNode.repo) {
      const pair = [sourceNode.repo, targetNode.repo].sort().join('|');
      connectedPairs.add(pair);
    }
  }

  for (let i = 0; i < repos.length; i++) {
    for (let j = i + 1; j < repos.length; j++) {
      const pair = [repos[i], repos[j]].sort().join('|');
      if (!connectedPairs.has(pair)) {
        findings.push(createFinding(
          `cross-repo:${repos[i]}<->${repos[j]}`,
          'missing_cross_repo_edges',
          'medium',
          `No cross-repo edges found between '${repos[i]}' and '${repos[j]}'`,
          'Review if nodes in different repos should be connected via shared concepts, dependencies, or references.'
        ));
      }
    }
  }

  return findings;
}

function analyzeIsolatedNodes(graph) {
  const findings = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const edgeNodes = new Set();
  for (const edge of edges) {
    edgeNodes.add(edge.source);
    edgeNodes.add(edge.target);
  }

  for (const node of nodes) {
    if (!edgeNodes.has(node.id)) {
      const totalNodes = nodes.length;
      const isolatedCount = nodes.filter(n => !edgeNodes.has(n.id)).length;
      const connectionCount = node.connectionCount || 0;

      // Library lane specific: flag nodes with connectionCount metadata but no edges
      // This indicates graph structure inconsistency
      if (connectionCount > 0) {
        findings.push(createFinding(
          node.id,
          'isolated_node',
          'medium',
          `Node '${node.title}' has connectionCount=${connectionCount} but no edges in graph. This indicates graph structure is out of sync with node metadata.`,
          'Run graph rebuild to synchronize connectionCount with actual edges, or investigate if edges were lost during snapshot.'
        ));
      } else {
        findings.push(createFinding(
          node.id,
          'isolated_node',
          'low',
          `Node '${node.title}' has no edges (isolated). Connection count: ${connectionCount}. ${isolatedCount} of ${totalNodes} nodes are isolated.`,
          'Review if this node should have edges to related nodes, or if it should be marked as intentionally isolated.'
        ));
      }
    }
  }

  return findings;
}

function analyzeEdgeSemantics(graph) {
  const findings = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const nodeRepoSref = new Map();
  for (const node of nodes) {
    nodeRepoSref.set(node.id, node.repo);
  }

  for (const edge of edges) {
    if (edge.type === 'shared-tag' || edge.type === 'DEPENDS_ON' || edge.type === 'DERIVES_FROM') {
      const sourceRepo = nodeRepoSref.get(edge.source);
      const targetRepo = nodeRepoSref.get(edge.target);

      if (sourceRepo && targetRepo && sourceRepo === targetRepo) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (sourceNode?.connectionCount > 200 || targetNode?.connectionCount > 200) {
          findings.push(createFinding(
            `${edge.source},${edge.target}`,
            'intra_repo_hub_edge',
            'info',
            `High-connection edge within same repo (${sourceRepo}): ${edge.source} <-> ${edge.target}`,
            'Verify this edge is meaningful. Consider if hub nodes need structure review.'
          ));
        }
      }
    }
  }

  return findings;
}

function analyzeAuthorityEdges(graph) {
  const findings = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  // Library lane focus: verify edge semantics are correctly applied
  const authorityEdges = ['VERIFIES', 'CONTRADICTS', 'SIGNED_BY', 'DERIVES_FROM', 'DEPENDS_ON', 'EXECUTES'];
  const foundAuthorities = new Set();

  for (const edge of edges) {
    const authority = String(edge.authority || edge.type || '').toUpperCase();
    if (authorityEdges.includes(authority)) {
      foundAuthorities.add(authority);

      // Check for VERIFIES edges pointing to unverified nodes
      if (authority === 'VERIFIES') {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.status === 'UNVERIFIED') {
          findings.push(createFinding(
            edge.target,
            'authority_edge_semantics',
            'medium',
            `VERIFIES edge points to unverified node '${targetNode.title}'. Authority edges should point to verified content.`,
            'Review the verification status of the target node, or investigate if this is an in-progress verification path.'
          ));
        }
      }

      // Check for SIGNED_BY on unverified nodes
      if (authority === 'SIGNED_BY') {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (sourceNode && targetNode) {
          if (sourceNode.status === 'VERIFIED' && targetNode.status !== 'VERIFIED') {
            findings.push(createFinding(
              edge.source,
              'authority_edge_semantics',
              'medium',
              `SIGNED_BY edge source is verified but target '${targetNode.title}' is not. Signature should establish verification.`,
              'Investigate the signing relationship - signatures typically imply verification.'
            ));
          }
        }
      }
    }
  }

  // Library lane: check for expected authority edges that are missing
  const nodesNeedingVerification = nodes.filter(n =>
    n.status === 'VERIFIED' && n.verificationCount === 0
  );

  for (const node of nodesNeedingVerification) {
    const hasVerificationEdge = edges.some(e =>
      (String(e.authority || '').toUpperCase() === 'VERIFIES' || String(e.type || '').toUpperCase() === 'VERIFIES') &&
      e.target === node.id
    );
    if (!hasVerificationEdge) {
      findings.push(createFinding(
        node.id,
        'missing_verification_proof',
        'info',
        `Verified node '${node.title}' has no incoming VERIFIES edges. Verification origin unclear.`,
        'Trace the verification path or add explicit verification edges for auditability.'
      ));
    }
  }

  return findings;
}

function runAnalysis(graph) {
  const allFindings = [];

  allFindings.push(...analyzeBadLinkEdges(graph));
  allFindings.push(...analyzeTagNormalization(graph));
  allFindings.push(...analyzeMissingCrossRepoEdges(graph));
  allFindings.push(...analyzeIsolatedNodes(graph));
  allFindings.push(...analyzeEdgeSemantics(graph));
  allFindings.push(...analyzeAuthorityEdges(graph));

  return allFindings;
}

function writeFindings(findings, snapshotPath, outputDir) {
  const snapshotName = path.basename(snapshotPath, '.json');
  const outputPath = path.join(outputDir, `findings-${snapshotName}.json`);

  const output = {
    analysis_timestamp: new Date().toISOString(),
    snapshot_path: snapshotPath,
    analyzer: 'library-lane-graph-analyzer-v1.0',
    total_findings: findings.length,
    by_severity: {
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length
    },
    by_issue_type: {},
    findings
  };

  for (const f of findings) {
    if (!output.by_issue_type[f.issue_type]) {
      output.by_issue_type[f.issue_type] = 0;
    }
    output.by_issue_type[f.issue_type]++;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  return outputPath;
}

function main() {
  const { snapshotPath, outputDir } = parseArgs();

  console.log(`=== Library Lane Graph Analysis ===`);
  console.log(`Snapshot: ${snapshotPath}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  const graph = loadSnapshot(snapshotPath);
  console.log(`Loaded graph: ${graph.nodes?.length || 0} nodes, ${graph.edges?.length || 0} edges`);

  const findings = runAnalysis(graph);
  console.log(`Found ${findings.length} issues`);

  const outputPath = writeFindings(findings, snapshotPath, outputDir);
  console.log(`Wrote findings to: ${outputPath}`);

  const summary = {
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length
  };

  console.log('');
  console.log('=== Summary ===');
  console.log(`High: ${summary.high}, Medium: ${summary.medium}, Low: ${summary.low}, Info: ${summary.info}`);

  if (findings.length > 0) {
    console.log('');
    console.log('=== Top Findings ===');
    const topFindings = findings.filter(f => f.severity === 'high' || f.severity === 'medium').slice(0, 10);
    for (const f of topFindings) {
      console.log(`[${f.severity.toUpperCase()}] ${f.issue_type}: ${f.description.slice(0, 100)}...`);
    }
  }

  process.exit(findings.filter(f => f.severity === 'high').length > 0 ? 1 : 0);
}

main();
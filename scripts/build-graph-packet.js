#!/usr/bin/env node
/**
 * BUILD GRAPH PACKET — Agent-readable graph summarizer
 * ================================================================
 * Purpose: Generate compressed, agent-readable graph analysis packets
 * from giant graph snapshots to prevent agents from drowning in raw JSON.
 *
 * Outputs (all read-only destinations):
 *   data/graph-analysis-packets.json
 *   data/website-section-index.json
 *   data/graph-packet-schema.json
 *   docs/AGENT_WEB_REVIEW_BRIEF.md
 *
 * Inputs:
 *   evidence/graph-snapshots/*-reduced.json
 *   evidence/graph-snapshots/*-analysis.json (optional, enriches packet)
 *
 * Design: WEBSITE_GRAPH_INDEXER_DESIGN
 */

const fs = require('fs');
const path = require('path');

// ---------- Configuration ----------
const SNAPSHOT_DIR = path.join(__dirname, '..', 'evidence', 'graph-snapshots');
const OUTPUT_DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DOCS_DIR = path.join(__dirname, '..', 'docs');

// Ensure output dirs exist
fs.mkdirSync(OUTPUT_DATA_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DOCS_DIR, { recursive: true });

// ---------- Utilities ----------
function readJson(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error(`Failed to read ${filepath}: ${e.message}`);
    return null;
  }
}

// Find the latest reduced snapshot by timestamp embedded in filename
function findLatestSnapshot() {
  const files = fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.endsWith('-reduced.json'))
    .map(f => {
      // Extract timestamp from filename: graph-snapshot-YYYY-MM-DDTHH-MM-SS-reduced.json
      const match = f.match(/graph-snapshot-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-reduced\.json/);
      return {
        name: f,
        sortKey: match ? match[1] : f // use extracted timestamp for sorting, fall back to filename
      };
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey)); // most recent first by filename timestamp
  if (files.length === 0) {
    throw new Error('No reduced snapshot found in ' + SNAPSHOT_DIR);
  }
  return path.join(SNAPSHOT_DIR, files[0].name);
}

// Derive analysis filename from reduced filename
function getAnalysisPath(reducedPath) {
  const dir = path.dirname(reducedPath);
  const base = path.basename(reducedPath, '-reduced.json');
  return path.join(dir, `${base}-analysis.json`);
}

// Extract snapshot_id from reduced filename: strip directory and "-reduced.json"
function extractSnapshotId(reducedPath) {
  const base = path.basename(reducedPath, '-reduced.json');
  return base;
}

// Compute status counts from nodes array (fallback if analysis missing)
function computeStatusCounts(nodes) {
  const counts = { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  for (const n of nodes) {
    const s = (n.status || 'UNVERIFIED').toLowerCase();
    if (counts[s] !== undefined) counts[s]++; else counts.unverified++;
  }
  return counts;
}

// ---------- Build per-snapshot packet ----------
function buildSnapshotPacket(reduced, analysis, snapshotId, reducedPath) {
  const nodes = reduced.nodes || [];
  const edges = reduced.edges || [];

  // Status counts
  const statusCounts = (analysis && analysis.status_counts) ? analysis.status_counts : computeStatusCounts(nodes);

  // Top nodes (reduced to top 5 to meet 1-3KB packet budget)
  const topByConnection = [...nodes]
    .sort((a, b) => (b.connectionCount || 0) - (a.connectionCount || 0))
    .slice(0, 5)
    .map(n => ({
      id: n.id,
      t: n.title.substring(0, 40), // truncated title
      r: n.repo || 'unknown',
      cc: n.connectionCount || 0,
      s: n.status || 'UNVERIFIED'
    }));

  const topByVerification = [...nodes]
    .sort((a, b) => (b.verificationCount || 0) - (a.verificationCount || 0))
    .slice(0, 5)
    .map(n => ({
      id: n.id,
      t: n.title.substring(0, 40),
      r: n.repo || 'unknown',
      vc: n.verificationCount || 0,
      s: n.status || 'UNVERIFIED'
    }));

  const topByContradiction = [...nodes]
    .filter(n => (n.contradictionCount || 0) > 0)
    .sort((a, b) => (b.contradictionCount || 0) - (a.contradictionCount || 0))
    .slice(0, 5)
    .map(n => ({
      id: n.id,
      t: n.title.substring(0, 40),
      r: n.repo || 'unknown',
      cdc: n.contradictionCount || 0
    }));

  const topByAuthority = [...nodes]
    .sort((a, b) => (b.authorityDepth || 0) - (a.authorityDepth || 0))
    .slice(0, 5)
    .map(n => ({
      id: n.id,
      t: n.title.substring(0, 40),
      r: n.repo || 'unknown',
      ad: n.authorityDepth || 0,
      gl: n.governanceLayer || 'unknown'
    }));

  // Anomaly detection
  const anomalies = [];
  if (edges.length === 0 && nodes.length > 0) {
    anomalies.push('zero_edges_filtered_view');
  }
  if (statusCounts.unverified + statusCounts.verified + statusCounts.conflicted + statusCounts.quarantined !== nodes.length) {
    anomalies.push('counter_mismatch');
  }
  if (statusCounts.conflicted > 0) {
    anomalies.push('conflicted_nodes_present');
  }
  if (statusCounts.quarantined > 0) {
    anomalies.push('quarantined_nodes_present');
  }
  if (nodes.length > 0 && (statusCounts.unverified / nodes.length) > 0.8) {
    anomalies.push('many_unverified_nodes');
  }

  // Interpretation
  const totalEdges = edges.length;
  const analysisTotalEdges = analysis ? Object.values(analysis.edge_types).reduce((a,b)=>a+b,0) : null;
  let interpretation = `Snapshot ${snapshotId} shows ${nodes.length} nodes and ${totalEdges} deduplicated edges (reduced view). `;
  interpretation += `Status: ${statusCounts.verified} verified, ${statusCounts.unverified} unverified, `;
  interpretation += `${statusCounts.conflicted} conflicted, ${statusCounts.quarantined} quarantined. `;
  if (analysisTotalEdges !== null && analysisTotalEdges !== totalEdges) {
    interpretation += `Full analysis has ${analysisTotalEdges} total edge instances across all types. `;
  }
  interpretation += `Top hub node has ${topByConnection[0] ? topByConnection[0].cc : 0} connections.`;

  // Claim status classification — tracks known issues and their resolution state
  const claimStatus = {
    known_bugs: [],
    fixes_in_progress: [],
    accepted_fixes: []
  };
  // Repo-filter edge hiding: known bug where strict both-endpoint filtering hides cross-lane edges
  if (anomalies.includes('zero_edges_filtered_view')) {
    claimStatus.known_bugs.push({
      id: 'repo-filter-edge-hiding',
      description: 'Strict both-endpoint repo filtering hides cross-lane edges',
      affected_nodes: nodes.length,
      detected_in: snapshotId
    });
  }
  // Dual edge-filter mode: fix in progress (neighbor inclusion + single-endpoint matching)
  if (anomalies.includes('zero_edges_filtered_view')) {
    claimStatus.fixes_in_progress.push({
      id: 'dual-edge-filter-mode',
      description: 'Include neighbor nodes and preserve edges where at least one endpoint belongs to filtered repo',
      status: 'implemented-pending-verification'
    });
  }
  // Many unverified nodes is a known state, not a bug
  if (anomalies.includes('conflicted_nodes_present')) {
    claimStatus.known_bugs.push({
      id: 'contradictionCount-spurious-artifact',
      description: 'contradictionCount=39 is a tag-grouping artifact (see GRAPH_SNAPSHOT_PROTOCOL.md), not genuine contradiction',
      affected_nodes: statusCounts.conflicted,
      detected_in: snapshotId
    });
  }

  // Next checks
  const nextChecks = [];
  if (anomalies.includes('zero_edges_filtered_view')) {
    nextChecks.push('Verify whether filter mode is hiding cross-lane edges; expand node set to include neighbors.');
  }
  if (anomalies.includes('many_unverified_nodes')) {
    nextChecks.push('Prioritize verification of high-connection nodes to reduce unverified ratio.');
  }
  if (anomalies.includes('conflicted_nodes_present')) {
    nextChecks.push('Review contradiction details for nodes with high contradictionCount.');
  }
  if (anomalies.includes('quarantined_nodes_present')) {
    nextChecks.push('Investigate quarantined nodes; they are excluded from active view.');
  }
  nextChecks.push('Cross-check visible_node_count and visible_edge_count with UI counters.');
  nextChecks.push('Validate that active meaning layers match edge types present.');

  return {
    identity: {
      snapshot_id: snapshotId,
      created_at: (analysis && analysis.overview && analysis.overview.snapshot_time) ? analysis.overview.snapshot_time : new Date().toISOString(),
      filters: {} // no filter metadata available in reduced snapshot
    },
    counts: {
      visible_nodes: nodes.length,
      visible_edges: edges.length,
      verified: statusCounts.verified,
      unverified: statusCounts.unverified,
      conflicted: statusCounts.conflicted,
      quarantined: statusCounts.quarantined
    },
    top_nodes: {
      by_connection_count: topByConnection,
      by_verification_count: topByVerification,
      by_contradiction_count: topByContradiction,
      by_authority_depth: topByAuthority
    },
      anomalies: anomalies,
      claim_status: claimStatus,
      interpretation: interpretation,
    next_checks: nextChecks
  };
}

// ---------- Per-repo summary ----------
function computePerRepoSummary(nodes) {
  const repoMap = {};
  for (const n of nodes) {
    const repo = n.repo || 'unknown';
    if (!repoMap[repo]) {
      repoMap[repo] = {
        node_count: 0,
        total_connections: 0,
        top_node: null,
        top_cc: -1
      };
    }
    repoMap[repo].node_count++;
    repoMap[repo].total_connections += (n.connectionCount || 0);
    const cc = n.connectionCount || 0;
    if (cc > repoMap[repo].top_cc) {
      repoMap[repo].top_cc = cc;
      repoMap[repo].top_node = { id: n.id, title: n.title, connectionCount: cc };
    }
  }
  return repoMap;
}

// Per-status summary (just pass-through counts)
function computePerStatusSummary(statusCounts) {
  return statusCounts;
}

// Per-contradiction summary
function computeContradictionSummary(analysis, nodes) {
  // Build a node lookup by id for repo resolution
  const nodeById = new Map();
  for (const n of nodes) {
    nodeById.set(n.id, n);
  }

  if (analysis && analysis.contradiction_nodes) {
    return analysis.contradiction_nodes.map(c => {
      const matched = nodeById.get(c.id);
      return {
        id: c.id,
        title: c.title,
        contradictionCount: c.cdc,
        tags: c.tags || [],
        category: c.cat || 'unknown',
        repo: (matched && matched.repo) || 'unknown',
        status: (matched && matched.status) || 'UNVERIFIED'
      };
    });
  }
  // Fallback: compute from nodes
  return nodes
    .filter(n => (n.contradictionCount || 0) > 0)
    .sort((a, b) => (b.contradictionCount || 0) - (a.contradictionCount || 0))
    .map(n => ({
      id: n.id,
      title: n.title,
      contradictionCount: n.contradictionCount || 0,
      repo: n.repo || 'unknown',
      status: n.status || 'UNVERIFIED'
    }));
}

// ---------- Website Section Index ----------
const ROUTE_METADATA = {
  '/': {
    section: 'Home',
    purpose: 'Landing page introducing the Deliberate Ensemble system and providing navigation to key sections.',
    audience: ['human operator', 'external reviewer', 'agent reviewer'],
    primary_claims: [
      'The system is a multi-agent AI governance lattice',
      'Every claim is verified, tracked, and challenged over time'
    ],
    known_confusions: [
      'System overview too dense; hard to grasp core idea quickly',
      'Graph context not explained on first view'
    ],
    agent_review_instructions: [
      'Check that primary CTAs are visible and linked',
      'Verify that the explanation is concise and accurate',
      'Ensure accessibility contrast ratios meet WCAG AA'
    ]
  },
  '/graph': {
    section: 'Nexus Graph',
    purpose: 'Interactive evidence graph visualizing governance, verification, contradiction, and execution state across all nodes.',
    audience: ['human operator', 'agent reviewer'],
    primary_claims: [
      'The graph maps claims, documents, repos, verification status, and contradictions',
      'Edges represent authority derivations and shared tags'
    ],
    known_confusions: [
      'Repo-filtered views may hide cross-lane edges',
      'Top counters may not match filtered status strip semantics'
    ],
    agent_review_instructions: [
      'Do not inspect raw graph JSON directly',
      'Use GRAPH_ANALYSIS_PACKETS for summary',
      'Separate UI bugs from data bugs'
    ]
  },
  '/start-here': {
    section: 'Start Here',
    purpose: 'Guided introduction for new users to understand the system gradually.',
    audience: ['new user', 'human operator'],
    primary_claims: ['Provides a step-by-step walkthrough', 'Explains core concepts in plain language'],
    known_confusions: ['May overlap with homepage content'],
    agent_review_instructions: ['Check for clarity and simplicity', 'Validate that links to deeper sections work']
  },
  '/about': {
    section: 'About',
    purpose: 'General information about the project and its goals.',
    audience: ['visitor', 'researcher'],
    primary_claims: ['Describes origin, mission, and core team'],
    known_confusions: ['Content may be outdated'],
    agent_review_instructions: ['Verify factual accuracy', 'Check links']
  },
  '/governance': {
    section: 'Governance',
    purpose: 'Governance rules, policies, and decision-making processes.',
    audience: ['operator', 'reviewer'],
    primary_claims: ['Defines what we follow', 'Documents enforcement mechanisms'],
    known_confusions: ['Governance layer semantics are subtle'],
    agent_review_instructions: ['Cross-check with GOVERNANCE.md in repo', 'Ensure all policies have corresponding enforcement']
  },
  '/governance/dual-plane-authority': {
    section: 'Dual Plane Authority',
    purpose: 'Deep dive into the dual-plane authority model.',
    audience: ['technical reviewer', 'governance analyst'],
    primary_claims: ['Authority operates across two orthogonal planes', 'Plane crossing requires explicit verification'],
    known_confusions: ['Terminology overlaps with other governance concepts'],
    agent_review_instructions: ['Validate examples', 'Check consistency with core governance docs']
  },
  '/swarmmind': {
    section: 'SwarmMind',
    purpose: 'SwarmMind lane overview and responsibilities.',
    audience: ['agent developer', 'system operator'],
    primary_claims: ['SwarmMind generates proposals and challenges', 'Autonomous improvement loops'],
    known_confusions: ['Proposal lifecycle not always clear'],
    agent_review_instructions: ['Verify proposal routing logic', 'Check challenge resolution records']
  },
  '/kernel': {
    section: 'Kernel',
    purpose: 'Kernel lane infrastructure and execution details.',
    audience: ['engineer', 'operator'],
    primary_claims: ['Kernel runs the core services', 'Manages inter-lane communication'],
    known_confusions: ['Kernel vs Library service boundaries'],
    agent_review_instructions: ['Confirm service health endpoints', 'Check log aggregation']
  },
  '/archivist': {
    section: 'Archivist',
    purpose: 'Archivist lane documentation and archival processes.',
    audience: ['archivist', 'reviewer'],
    primary_claims: ['Archivist preserves ratified artifacts', 'Maintains the canonical record'],
    known_confusions: ['Ratification vs archiving distinction'],
    agent_review_instructions: ['Verify that ratified artifacts are present', 'Check signature validity']
  },
  '/library': {
    section: 'Library',
    purpose: 'Library lane verification and enforcement surface.',
    audience: ['verifier', 'operator'],
    primary_claims: ['Library verifies claims', 'Enforces schema and identity'],
    known_confusions: ['Quarantine process is opaque'],
    agent_review_instructions: ['Review quarantine reports', 'Check schema compliance logs']
  },
  '/agents': {
    section: 'Agents',
    purpose: 'Agent registry and capabilities overview.',
    audience: ['agent developer'],
    primary_claims: ['Lists all active agents', 'Describes capabilities'],
    known_confusions: ['Agent role boundaries'],
    agent_review_instructions: ['Validate agent identity', 'Check capability declarations match behavior']
  },
  '/repos': {
    section: 'Repositories',
    purpose: 'List of all repositories in the system.',
    audience: ['developer', 'researcher'],
    primary_claims: ['Shows all code and document repos', 'Links to GitHub'],
    known_confusions: ['Repo purpose descriptions may be stale'],
    agent_review_instructions: ['Verify each repo URL', 'Cross-check with site-index repo_roots']
  },
  '/tags': {
    section: 'Tags',
    purpose: 'Tag index and usage statistics.',
    audience: ['content curator', 'developer'],
    primary_claims: ['All tags used across the site', 'Counts of tag mentions'],
    known_confusions: ['Case-sensitivity issues'],
    agent_review_instructions: ['Check for duplicate tags with different case', 'Verify tag normalization']
  },
  '/categories': {
    section: 'Categories',
    purpose: 'Content category taxonomy.',
    audience: ['content editor', 'developer'],
    primary_claims: ['Defines content types', 'Maps files to categories'],
    known_confusions: ['Category vs type confusion'],
    agent_review_instructions: ['Ensure every content file has a category', 'Review uncategorized entries']
  },
  '/services': {
    section: 'Services',
    purpose: 'External services and integrations status.',
    audience: ['operator'],
    primary_claims: ['Lists dependencies', 'Shows health'],
    known_confusions: ['Service downtime not always reflected'],
    agent_review_instructions: ['Check latest health timestamps', 'Validate service endpoints']
  },
  '/videos': {
    section: 'Videos',
    purpose: 'Video content library.',
    audience: ['learner'],
    primary_claims: ['Educational videos', 'Demonstrations'],
    known_confusions: ['Video descriptions may be minimal'],
    agent_review_instructions: ['Verify video links work', 'Check transcripts if available']
  },
  '/search': {
    section: 'Search',
    purpose: 'Full-text search across all content.',
    audience: ['all users'],
    primary_claims: ['Fast search', 'Relevant results'],
    known_confusions: ['Search ranking may be biased'],
    agent_review_instructions: ['Test common queries', 'Check for missing results']
  },
  '/logs': {
    section: 'Logs',
    purpose: 'System logs and event streams.',
    audience: ['operator', 'developer'],
    primary_claims: ['Real-time system events', 'Historical logs'],
    known_confusions: ['Logs may be overwhelming'],
    agent_review_instructions: ['Verify log completeness', 'Check for error spikes']
  },
  '/timeline': {
    section: 'Timeline',
    purpose: 'Chronological view of system evolution.',
    audience: ['researcher', 'operator'],
    primary_claims: ['Shows historical changes', 'Tracks governance events'],
    known_confusions: ['Timeline gaps may exist'],
    agent_review_instructions: ['Cross-check with git history', 'Validate timestamps']
  },
  '/understand': {
    section: 'Understand',
    purpose: 'Explanation of core concepts for first-time learners.',
    audience: ['newcomer'],
    primary_claims: ['Simplified overview', 'Builds mental model'],
    known_confusions: ['May oversimplify complex topics'],
    agent_review_instructions: ['Check for technical accuracy', 'Ensure links to deeper resources']
  },
  '/papers': {
    section: 'Papers',
    purpose: 'Research papers and publications related to the system.',
    audience: ['academic', 'researcher'],
    primary_claims: ['Peer-reviewed content', 'Theoretical foundations'],
    known_confusions: ['Paper versions may be outdated'],
    agent_review_instructions: ['Verify citations', 'Check for errata']
  },
  '/lanes': {
    section: 'Lanes',
    purpose: 'Explanation of the 4-lane governance architecture.',
    audience: ['all users'],
    primary_claims: ['Describes each lane role', 'Shows how they interact'],
    known_confusions: ['Lane responsibilities overlap'],
    agent_review_instructions: ['Cross-check with lane-specific pages', 'Ensure each lane description is accurate']
  },
  '/search-catalog': {
    section: 'Search Catalog',
    purpose: 'Browsable catalog of all indexed content with search and filtering.',
    audience: ['researcher', 'content curator'],
    primary_claims: ['Full catalog of site content', 'Filterable by type and category'],
    known_confusions: ['May overlap with /search full-text search'],
    agent_review_instructions: ['Verify catalog entries match site-index.json', 'Check filtering controls work']
  },
  '/collections': {
    section: 'Collections',
    purpose: 'Curated collections of related content grouped by theme.',
    audience: ['researcher', 'new user'],
    primary_claims: ['Thematic groupings of content', 'Curated by governance or agents'],
    known_confusions: ['Collection vs category distinction'],
    agent_review_instructions: ['Verify collection members are valid entries', 'Check for stale references']
  },
  '/sources': {
    section: 'Sources',
    purpose: 'Source documents and provenance tracking for all content.',
    audience: ['auditor', 'governance analyst'],
    primary_claims: ['Every piece of content has a source', 'Provenance chain is traceable'],
    known_confusions: ['Source vs origin distinction'],
    agent_review_instructions: ['Verify source links resolve', 'Check provenance chain completeness']
  },
  '/library/[id]': {
    section: 'Library Detail',
    purpose: 'Individual library entry detail page with full metadata and verification status.',
    audience: ['verifier', 'researcher'],
    primary_claims: ['Shows full entry metadata', 'Displays verification status and evidence'],
    known_confusions: ['Dynamic route — id parameter may be unstable', 'Not linked from main navigation'],
    agent_review_instructions: ['Test with known entry IDs', 'Verify back-navigation works']
  }
};

function generateWebsiteSectionIndex() {
  const entries = [];
  for (const [route, meta] of Object.entries(ROUTE_METADATA)) {
    // Determine source files: primary page.tsx and possibly layout
    let sourceFiles = [];
    if (route === '/') {
      sourceFiles.push('src/app/page.tsx');
      sourceFiles.push('src/app/layout.tsx');
    } else if (route.includes('[id]')) {
      // Dynamic route: convert [id] to the directory name
      const parts = route.split('/').filter(Boolean);
      const filePath = path.join('src', 'app', ...parts, 'page.tsx').replace(/\\/g, '/');
      sourceFiles.push(filePath);
    } else {
      // Convert route to path: e.g. /governance/dual-plane-authority -> src/app/governance/dual-plane-authority/page.tsx
      const parts = route.split('/').filter(Boolean); // remove empty first
      const filePath = path.join('src', 'app', ...parts, 'page.tsx');
      sourceFiles.push(filePath.replace(/\\/g, '/'));
      // Also include layout if at top level? e.g., /governance uses src/app/governance/layout.tsx
      if (parts.length === 1) {
        sourceFiles.push(path.join('src', 'app', parts[0], 'layout.tsx').replace(/\\/g, '/'));
      }
    }
    entries.push({
      page: route,
      section: meta.section,
      purpose: meta.purpose,
      audience: meta.audience,
      primary_claims: meta.primary_claims,
      known_confusions: meta.known_confusions,
      agent_review_instructions: meta.agent_review_instructions,
      source_files: sourceFiles,
      status: 'needs-indexed-review'
    });
  }
  // Sort by page path
  entries.sort((a, b) => a.page.localeCompare(b.page));
  return entries;
}

// ---------- Graph Packet Schema ----------
function generateGraphPacketSchema() {
  return {
    schema_version: "1.1.0",
    output_path: "data/graph-analysis-packets.json",
    description: "Schema for per-snapshot graph analysis packets and aggregates",
    top_level: {
      generated_at: "string (ISO 8601 datetime) — when the packet was generated",
      source_snapshot: "string — relative path to the reduced snapshot file from project root",
      per_snapshot: "array of packet_schema objects — one per snapshot",
      per_repo: "object — keys are repo names, values are { node_count, total_connections, top_node: { id, title, connectionCount }, top_cc }",
      per_status: "object — keys: verified, unverified, conflicted, quarantined with integer counts",
      per_contradiction: "array of { id, title, contradictionCount, tags, category, repo, status } — nodes with contradictionCount > 0"
    },
    packet_schema: {
      identity: {
        snapshot_id: "string",
        created_at: "string (ISO 8601 datetime)",
        filters: "object with filter parameters (may be empty if none applied)"
      },
      counts: {
        visible_nodes: "integer",
        visible_edges: "integer",
        verified: "integer",
        unverified: "integer",
        conflicted: "integer",
        quarantined: "integer"
      },
      top_nodes: {
        by_connection_count: "array of {id, title, repo, connectionCount, status}",
        by_verification_count: "array of {id, title, repo, verificationCount, status}",
        by_contradiction_count: "array of {id, title, repo, contradictionCount}",
        by_authority_depth: "array of {id, title, repo, authorityDepth, governanceLayer}"
      },
      anomalies: "array of strings from predefined set: zero_edges_filtered_view, counter_mismatch, conflicted_nodes_present, quarantined_nodes_present, many_unverified_nodes",
    claim_status: {
      known_bugs: "array of { id, description, affected_nodes, detected_in } — confirmed bugs awaiting fix",
      fixes_in_progress: "array of { id, description, status } — fixes implemented but pending verification",
      accepted_fixes: "array of { id, description, verified_at } — fixes verified and accepted"
    },
      interpretation: "string — human-readable summary of the snapshot",
      next_checks: "array of string — recommended next verification steps"
    },
    required_fields: ["identity", "counts", "top_nodes", "anomalies", "claim_status", "interpretation", "next_checks"],
    validation_rules: [
      "visible_nodes must equal sum of status counts (verified+unverified+conflicted+quarantined) unless some nodes are hidden by filter",
      "snapshot_id must be unique across all packets",
      "top_nodes arrays must be sorted descending by their respective metric",
      "anomalies must be from the predefined set",
      "interpretation length should be < 500 characters",
    "claim_status entries must have unique id within their array",
    "a claim_status item should not appear in both known_bugs and fixes_in_progress for the same issue"
    ]
  };
}

// ---------- Agent Web Review Brief ----------
function generateAgentWebReviewBrief() {
  const timestamp = new Date().toISOString();
  return `# Agent Web Review Brief

_Generated: ${timestamp}_

Start here. Do not open raw graph snapshots first.

## What this website is
A public evidence surface for a multi-lane constitutional AI governance system. It displays:
- Governance rules and their enforcement state
- Verification status of claims and documents
- Contradiction analysis and quarantine queues
- Agent coordination and execution evidence

## What to inspect first
1. **Homepage explanation** — Is the core idea clear in <10 seconds?
2. **Graph controls** — Do filter, mode, layer toggles work?
3. **Graph counters** — Do node/edge counts seem plausible?
4. **Repo-filter behavior** — Are cross-lane edges preserved?
5. **Contradiction/quarantine displays** — Are problem nodes visible?
6. **Accessibility cues** — Color, shape, labels for all user abilities

## Known current graph issue
Repo-filtered views may show nodes but zero edges because strict both-endpoint filtering hides cross-lane relationships. We now include neighbor nodes and preserve edges where at least one endpoint belongs to the filtered repo. Agents should still verify edge visibility when filter is active.

## Do not do
- Do NOT claim system correctness from visual density alone.
- Do NOT inspect 30k-line graph JSON directly; use GRAPH_ANALYSIS_PACKETS.
- Do NOT make governance decisions without cross-referencing source documents.
- Do NOT generalize from one filter mode; test multiple views.

## Using the packets
- Read \`data/graph-analysis-packets.json\` for concise graph summaries (counts, top nodes, anomalies, interpretation, next checks).
- Read \`data/website-section-index.json\` for per-route metadata (purpose, audience, claims, known confusions, review instructions, source file pointers).
- Cross-reference top nodes with their source files for ground truth.

## Review workflow
1. Load latest packet from \`data/graph-analysis-packets.json\` (per_snapshot[0]).
2. Load website section index from \`data/website-section-index.json\`.
3. Scan anomalies — if any present, investigate those first.
4. Check top nodes by connectionCount for hub risks.
5. Review per_repo balance: any repo completely disconnected?
6. For each website section, follow agent_review_instructions from the section index.
7. Validate next_checks against live UI.
8. Report findings with evidence paths, not impressions.
`;
}

// ---------- Main ----------
(function main() {
  console.log('Building graph index packets...');

  // Find latest snapshot
  const reducedPath = findLatestSnapshot();
  const snapshotId = extractSnapshotId(reducedPath);
  console.log(`Using snapshot: ${snapshotId}`);

  // Load data
  const reduced = readJson(reducedPath);
  const analysisPath = getAnalysisPath(reducedPath);
  let analysis = null;
  if (fs.existsSync(analysisPath)) {
    analysis = readJson(analysisPath);
    console.log(`Loaded analysis: ${analysisPath}`);
  } else {
    console.warn(`Analysis file not found: ${analysisPath}`);
  }

  // 1. Per-snapshot packet
  const snapshotPacket = buildSnapshotPacket(reduced, analysis, snapshotId, reducedPath);

  // 2. Per-repo summary
  const perRepo = computePerRepoSummary(reduced.nodes);

  // 3. Per-status summary
  const perStatus = computePerStatusSummary(snapshotPacket.counts);

  // 4. Per-contradiction summary
  const perContradiction = computeContradictionSummary(analysis, reduced.nodes);

  // Use relative path from project root for portability
  const projectRoot = path.join(__dirname, '..');
  const relativeSnapshotPath = path.relative(projectRoot, reducedPath).replace(/\\/g, '/');

  const packets = {
    generated_at: new Date().toISOString(),
    source_snapshot: relativeSnapshotPath,
    per_snapshot: [snapshotPacket],
    per_repo: perRepo,
    per_status: perStatus,
    per_contradiction: perContradiction
  };

  const outPacketsPath = path.join(OUTPUT_DATA_DIR, 'graph-analysis-packets.json');
  fs.writeFileSync(outPacketsPath, JSON.stringify(packets, null, 2));
  console.log(`Wrote: ${outPacketsPath}`);

  // 3. Website section index
  const websiteIndex = generateWebsiteSectionIndex();
  const outWebIndexPath = path.join(OUTPUT_DATA_DIR, 'website-section-index.json');
  fs.writeFileSync(outWebIndexPath, JSON.stringify(websiteIndex, null, 2));
  console.log(`Wrote: ${outWebIndexPath}`);

  // 4. Graph packet schema
  const schema = generateGraphPacketSchema();
  const outSchemaPath = path.join(OUTPUT_DATA_DIR, 'graph-packet-schema.json');
  fs.writeFileSync(outSchemaPath, JSON.stringify(schema, null, 2));
  console.log(`Wrote: ${outSchemaPath}`);

  // 5. Agent Web Review Brief
  const brief = generateAgentWebReviewBrief();
  const outBriefPath = path.join(OUTPUT_DOCS_DIR, 'AGENT_WEB_REVIEW_BRIEF.md');
  fs.writeFileSync(outBriefPath, brief);
  console.log(`Wrote: ${outBriefPath}`);

  console.log('All index files generated successfully.');
})();

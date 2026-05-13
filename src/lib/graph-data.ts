import siteIndex from "../../data/site-index.json";
import {
  computeAuthorityEdges,
  computeGovernanceDepths,
  computeNodeStatuses,
} from "@/lib/truth-routing";

export interface IndexEntry {
  id: string;
  repo: string;
  path: string;
  github_url: string | null;
  title: string;
  extension: string;
  content_type: string;
  category: string;
  breadcrumbs: string[];
  tags: string[];
  date: string | null;
  modified: string;
  size_bytes: number;
  description: string | null;
  content_snippet: string | null;
}

export interface CrossRef {
  source: string;
  target: string;
  type: string;
  label: string;
}

export interface RepoStats {
  total_files: number;
  total_size_bytes: number;
  by_content_type: Record<string, number>;
  by_category: Record<string, number>;
}

export interface SiteIndex {
  schema_version: string;
  generated_at: string;
  github_org: string;
  repo_roots: Record<string, string>;
  stats: {
    total_files: number;
    by_content_type: Record<string, number>;
    by_category: Record<string, number>;
    by_extension: Record<string, number>;
    total_size_bytes: number;
    by_repo: Record<string, RepoStats>;
  };
  tag_index: Record<string, string[]>;
  cross_references: CrossRef[];
  entries: IndexEntry[];
}

export type GraphLens =
  | "navigation"
  | "authority"
  | "governance"
  | "papers"
  | "repos"
  | "full"
  | "canonical";

export interface GraphNodeRecord {
  id: string;
  title: string;
  type: string;
  category: string;
  repo: string;
  connectionCount: number;
  tags: string[];
  status: string;
  verificationCount: number;
  contradictionCount: number;
  governanceLayer: string;
  authorityDepth: number;
  bridgeState: string;
}

export interface GraphEdgeRecord {
  source: string;
  target: string;
  type: string;
  authority?: string;
}

export interface GraphLensDefinitionSummary {
  purpose: string;
  includedNodeTypes: string[];
  includedEdgeTypes: string[];
  excludedNoise: string[];
  maxRecommendedNodes: number;
  maxRecommendedEdges: number;
  agentReviewInstruction: string;
}

export interface GraphDataPacket {
  lens: GraphLens;
  lensLabel: string;
  description: string;
  nodes: GraphNodeRecord[];
  edges: GraphEdgeRecord[];
  authorityEdges: GraphEdgeRecord[];
  meta: {
    lensNodeCount: number;
    lensEdgeCount: number;
    canonicalNodeCount: number;
    canonicalEdgeCount: number;
    includesTagInferences: boolean;
    edgePolicy: "explicit_only" | "explicit_plus_inference";
    lensDefinition: GraphLensDefinitionSummary;
  };
}

const index = siteIndex as SiteIndex;

const LANE_REPOS = new Set([
  "self-organizing-library",
  "Archivist-Agent",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
  "kernel-lane",
]);

const GOVERNANCE_CATEGORIES = new Set([
  "governance",
  "verification",
  "attestation",
  "spec",
  "audit",
]);

const CORE_GOVERNANCE_LAYERS = new Set([
  "constitutional",
  "operational",
  "evidence",
]);

const THEORETICAL_GOVERNANCE_LAYERS = new Set([
  "theoretical",
  "historical",
]);

const BRIDGED_STATES = new Set([
  "enforced",
  "verified",
  "partial",
  "contradicted",
]);

const PAPER_REPOS = new Set(["papers"]);
const NOISE_CATEGORIES = new Set(["scratch", "pending", "test-data"]);
const NOISE_TYPES = new Set(["config", "test-data"]);
const EXPLICIT_EDGE_TYPES = ["cross-reference", "authority"] as const;
const AUTHORITY_EDGE_TYPES = [
  "VERIFIES",
  "DERIVES_FROM",
  "CONTRADICTS",
  "SIGNED_BY",
  "EXECUTES",
  "DEPENDS_ON",
] as const;

const LENS_META: Record<GraphLens, { label: string; description: string }> = {
  navigation: {
    label: "Navigation Map",
    description: "Human-first overview of the core archive, key papers, and active contradictions.",
  },
  authority: {
    label: "Authority Map",
    description: "Constitutional, operational, and evidence-bearing nodes with explicit authority links.",
  },
  governance: {
    label: "Governance Map",
    description: "Governance, verification, bridge-state, and contradiction surfaces.",
  },
  papers: {
    label: "Paper Map",
    description: "Theory-to-implementation map connecting papers to live system artifacts.",
  },
  repos: {
    label: "Repository Map",
    description: "Cross-repo view of the four main lane repositories and their highest-signal artifacts.",
  },
  full: {
    label: "Full Explicit Graph",
    description: "All indexed nodes with explicit references and explicit authority edges only.",
  },
  canonical: {
    label: "Canonical Graph",
    description: "Full offline truth-routing graph including tag-derived inference edges.",
  },
};

type BuiltGraphData = {
  nodes: GraphNodeRecord[];
  crossRefEdges: GraphEdgeRecord[];
  authorityEdges: GraphEdgeRecord[];
  combinedEdges: GraphEdgeRecord[];
  nodeMap: Map<string, GraphNodeRecord>;
  neighborMap: Map<string, Set<string>>;
};

type LensDefinition = GraphLensDefinitionSummary & {
  selectNodeIds: (graph: BuiltGraphData) => Set<string>;
  edgeFilter?: (edge: GraphEdgeRecord) => boolean;
};

const baseNodeScore = (node: GraphNodeRecord): number => {
  let score = node.authorityDepth + node.verificationCount * 10 + node.connectionCount;
  if (node.status === "VERIFIED") score += 25;
  if (node.status === "CONFLICTED") score += 30;
  if (node.bridgeState === "enforced") score += 20;
  if (node.repo === "papers" || node.category === "paper") score += 10;
  if (LANE_REPOS.has(node.repo)) score += 15;
  return score;
};

function buildGraphData(includeTagInferences: boolean): BuiltGraphData {
  const authorityEdges = computeAuthorityEdges(
    index.entries,
    index.cross_references,
    index.tag_index,
    { includeTagInferences }
  );
  const nodeStatuses = computeNodeStatuses(index.entries, authorityEdges);
  const governanceDepths = computeGovernanceDepths(
    index.entries,
    authorityEdges,
    nodeStatuses
  );

  const statusMap = new Map(nodeStatuses.map((status) => [status.id, status]));
  const governanceMap = new Map(governanceDepths.map((depth) => [depth.id, depth]));

  const crossRefEdges = index.cross_references.map((ref) => ({
    source: ref.source,
    target: ref.target,
    type: "cross-reference",
  }));

  const normalizedAuthorityEdges: GraphEdgeRecord[] = [];
  const authorityEdgeSet = new Set<string>();
  for (const edge of authorityEdges) {
    const key = `${edge.source}:${edge.target}:${edge.authority}`;
    if (authorityEdgeSet.has(key)) continue;
    authorityEdgeSet.add(key);
    normalizedAuthorityEdges.push({
      source: edge.source,
      target: edge.target,
      type: "authority",
      authority: edge.authority,
    });
  }

  const combinedEdges = [...crossRefEdges, ...normalizedAuthorityEdges];
  const connectionCountMap = new Map<string, number>();
  const neighborMap = new Map<string, Set<string>>();

  for (const edge of combinedEdges) {
    connectionCountMap.set(edge.source, (connectionCountMap.get(edge.source) || 0) + 1);
    connectionCountMap.set(edge.target, (connectionCountMap.get(edge.target) || 0) + 1);

    if (!neighborMap.has(edge.source)) neighborMap.set(edge.source, new Set());
    if (!neighborMap.has(edge.target)) neighborMap.set(edge.target, new Set());
    neighborMap.get(edge.source)!.add(edge.target);
    neighborMap.get(edge.target)!.add(edge.source);
  }

  const nodes = index.entries.map((entry) => {
    const status = statusMap.get(entry.id);
    const governance = governanceMap.get(entry.id);
    return {
      id: entry.id,
      title: entry.title,
      type: entry.content_type,
      category: entry.category,
      repo: entry.repo,
      connectionCount: connectionCountMap.get(entry.id) || 0,
      tags: entry.tags,
      status: status?.status || "UNVERIFIED",
      verificationCount: status?.verificationCount || 0,
      contradictionCount: status?.contradictionCount || 0,
      governanceLayer: governance?.governanceLayer || "unknown",
      authorityDepth: governance?.authorityDepth || 0,
      bridgeState: governance?.bridgeState || "unknown",
    };
  });

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return {
    nodes,
    crossRefEdges,
    authorityEdges: normalizedAuthorityEdges,
    combinedEdges,
    nodeMap,
    neighborMap,
  };
}

const explicitGraph = buildGraphData(false);
const canonicalGraph = buildGraphData(true);

function limitRankedNodes(nodes: GraphNodeRecord[], limit: number): GraphNodeRecord[] {
  return [...nodes]
    .sort((left, right) => baseNodeScore(right) - baseNodeScore(left))
    .slice(0, limit);
}

function limitToSet(ids: Set<string>, limit: number, graph: BuiltGraphData): Set<string> {
  if (ids.size <= limit) return ids;
  const ranked = [...ids]
    .map((id) => graph.nodeMap.get(id))
    .filter((node): node is GraphNodeRecord => Boolean(node))
    .sort((left, right) => baseNodeScore(right) - baseNodeScore(left))
    .slice(0, limit);
  return new Set(ranked.map((node) => node.id));
}

function collectNodeIds(
  graph: BuiltGraphData,
  predicate: (node: GraphNodeRecord) => boolean
): Set<string> {
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (predicate(node)) ids.add(node.id);
  }
  return ids;
}

function expandByNeighbors(
  ids: Set<string>,
  graph: BuiltGraphData,
  predicate: (node: GraphNodeRecord) => boolean
): Set<string> {
  const expanded = new Set(ids);
  for (const id of ids) {
    for (const neighborId of graph.neighborMap.get(id) || []) {
      const neighbor = graph.nodeMap.get(neighborId);
      if (neighbor && predicate(neighbor)) expanded.add(neighborId);
    }
  }
  return expanded;
}

function collectEdgeBoundNodeIds(
  graph: BuiltGraphData,
  seedIds: Set<string>,
  edgeFilter: (edge: GraphEdgeRecord) => boolean,
  neighborPredicate?: (
    neighbor: GraphNodeRecord,
    edge: GraphEdgeRecord,
    source: GraphNodeRecord
  ) => boolean
): Set<string> {
  const ids = new Set<string>();
  for (const edge of graph.combinedEdges) {
    if (!edgeFilter(edge)) continue;
    const source = graph.nodeMap.get(edge.source);
    const target = graph.nodeMap.get(edge.target);
    if (!source || !target) continue;

    const sourceIsSeed = seedIds.has(source.id);
    const targetIsSeed = seedIds.has(target.id);
    if (!sourceIsSeed && !targetIsSeed) continue;

    const keepFromSource =
      sourceIsSeed && (!neighborPredicate || neighborPredicate(target, edge, source));
    const keepFromTarget =
      targetIsSeed && (!neighborPredicate || neighborPredicate(source, edge, target));

    if (keepFromSource || keepFromTarget) {
      ids.add(source.id);
      ids.add(target.id);
    }
  }
  return ids;
}

function pruneMostlyIsolatedNodes(
  nodes: GraphNodeRecord[],
  edges: GraphEdgeRecord[],
  isolatedAnchorLimit: number
): GraphNodeRecord[] {
  const degreeMap = new Map<string, number>();
  for (const node of nodes) degreeMap.set(node.id, 0);
  for (const edge of edges) {
    if (degreeMap.has(edge.source)) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    }
    if (degreeMap.has(edge.target)) {
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    }
  }

  const connected = nodes.filter((node) => (degreeMap.get(node.id) || 0) > 0);
  const isolated = nodes
    .filter((node) => (degreeMap.get(node.id) || 0) === 0)
    .sort((left, right) => baseNodeScore(right) - baseNodeScore(left))
    .slice(0, isolatedAnchorLimit);

  return [...connected, ...isolated].sort(
    (left, right) => baseNodeScore(right) - baseNodeScore(left)
  );
}

function createLensDefinitions(): Record<GraphLens, LensDefinition> {
  return {
    navigation: {
      purpose: "Give humans and agents a first-pass map of the system without archive-level noise.",
      includedNodeTypes: ["doc", "paper", "code"],
      includedEdgeTypes: [...EXPLICIT_EDGE_TYPES, "VERIFIES", "DERIVES_FROM", "CONTRADICTS", "SIGNED_BY"],
      excludedNoise: ["config files", "test data", "historical scratch artifacts", "tag-only inferred edges"],
      maxRecommendedNodes: 400,
      maxRecommendedEdges: 1400,
      agentReviewInstruction: "Use this lens to orient first. If a claim matters, jump from here into authority, governance, or papers.",
      selectNodeIds: (graph) => {
        const ids = collectNodeIds(graph, (node) =>
          (LANE_REPOS.has(node.repo) &&
            (CORE_GOVERNANCE_LAYERS.has(node.governanceLayer) ||
              node.status !== "UNVERIFIED" ||
              GOVERNANCE_CATEGORIES.has(node.category))) ||
          ((PAPER_REPOS.has(node.repo) || node.category === "paper") &&
            (BRIDGED_STATES.has(node.bridgeState) || node.status === "VERIFIED")) ||
          node.contradictionCount > 0 ||
          node.bridgeState === "enforced" ||
          node.connectionCount > 0
        );
        for (const node of limitRankedNodes(
          graph.nodes.filter((node) => !NOISE_CATEGORIES.has(node.category)),
          350
        )) {
          ids.add(node.id);
        }
        return expandByNeighbors(
          ids,
          graph,
          (node) => baseNodeScore(node) >= 20 && !NOISE_TYPES.has(node.type)
        );
      },
      edgeFilter: (edge) => edge.type === "authority" || edge.type === "cross-reference",
    },
    authority: {
      purpose: "Answer who verifies, signs, bridges, or contradicts whom using explicit authority-bearing artifacts.",
      includedNodeTypes: ["doc", "paper", "code", "data"],
      includedEdgeTypes: ["authority", ...AUTHORITY_EDGE_TYPES],
      excludedNoise: ["ordinary file references", "inactive unverified nodes", "tag-only inferred edges"],
      maxRecommendedNodes: 220,
      maxRecommendedEdges: 700,
      agentReviewInstruction: "Use this lens for trust, provenance, or ratification questions. Ignore ordinary archive traversal here.",
      selectNodeIds: (graph) => {
        const seedIds = collectNodeIds(graph, (node) =>
          CORE_GOVERNANCE_LAYERS.has(node.governanceLayer) ||
          BRIDGED_STATES.has(node.bridgeState) ||
          node.status === "VERIFIED" ||
          node.status === "CONFLICTED" ||
          (THEORETICAL_GOVERNANCE_LAYERS.has(node.governanceLayer) && node.authorityDepth >= 70)
        );

        const edgeBound = collectEdgeBoundNodeIds(
          graph,
          seedIds,
          (edge) => edge.type === "authority",
          (node) =>
            node.status === "VERIFIED" ||
            node.status === "CONFLICTED" ||
            BRIDGED_STATES.has(node.bridgeState) ||
            CORE_GOVERNANCE_LAYERS.has(node.governanceLayer)
        );
        return expandByNeighbors(edgeBound, graph, (node) =>
          node.status === "VERIFIED" || node.bridgeState === "enforced"
        );
      },
      edgeFilter: (edge) => edge.type === "authority",
    },
    governance: {
      purpose: "Show governance rules, enforcement evidence, contradiction surfaces, and bridge states.",
      includedNodeTypes: ["doc", "data", "code"],
      includedEdgeTypes: [...EXPLICIT_EDGE_TYPES, "VERIFIES", "CONTRADICTS", "SIGNED_BY", "DERIVES_FROM"],
      excludedNoise: ["application-adjacent assets", "low-signal operational files", "tag-only inferred edges"],
      maxRecommendedNodes: 240,
      maxRecommendedEdges: 850,
      agentReviewInstruction: "Use this lens for policy, enforcement, contradiction, and runtime-governance questions.",
      selectNodeIds: (graph) => {
        const ids = collectNodeIds(graph, (node) =>
          GOVERNANCE_CATEGORIES.has(node.category) ||
          CORE_GOVERNANCE_LAYERS.has(node.governanceLayer) ||
          THEORETICAL_GOVERNANCE_LAYERS.has(node.governanceLayer) ||
          node.contradictionCount > 0 ||
          node.bridgeState !== "unknown"
        );
        return expandByNeighbors(
          ids,
          graph,
          (node) => GOVERNANCE_CATEGORIES.has(node.category) || node.bridgeState === "enforced"
        );
      },
      edgeFilter: (edge) => edge.type === "authority" || edge.type === "cross-reference",
    },
    papers: {
      purpose: "Trace theory into implementation and evidence without dragging the whole archive in.",
      includedNodeTypes: ["paper", "doc", "code"],
      includedEdgeTypes: [...EXPLICIT_EDGE_TYPES, "DERIVES_FROM", "VERIFIES"],
      excludedNoise: ["pure repo plumbing", "test data", "tag-only inferred edges"],
      maxRecommendedNodes: 180,
      maxRecommendedEdges: 550,
      agentReviewInstruction: "Use this lens when asking which papers support which runtime artifacts, and what evidence bridges theory into practice.",
      selectNodeIds: (graph) => {
        const ids = collectNodeIds(graph, (node) =>
          PAPER_REPOS.has(node.repo) ||
          node.category === "paper" ||
          (node.tags || []).some((tag) => tag.toLowerCase().includes("paper")) ||
          (THEORETICAL_GOVERNANCE_LAYERS.has(node.governanceLayer) && BRIDGED_STATES.has(node.bridgeState))
        );
        return expandByNeighbors(
          ids,
          graph,
          (node) => LANE_REPOS.has(node.repo) && (node.status === "VERIFIED" || node.bridgeState === "enforced")
        );
      },
      edgeFilter: (edge) => edge.type === "authority" || edge.type === "cross-reference",
    },
    repos: {
      purpose: "Compare the four lane repositories through their highest-signal artifacts instead of raw file volume.",
      includedNodeTypes: ["doc", "code", "data"],
      includedEdgeTypes: [...EXPLICIT_EDGE_TYPES, "VERIFIES", "DERIVES_FROM", "EXECUTES"],
      excludedNoise: ["small local files", "historical scratch artifacts", "tag-only inferred edges"],
      maxRecommendedNodes: 240,
      maxRecommendedEdges: 750,
      agentReviewInstruction: "Use this lens to compare lane roles and repo-level structure. Do not use it for deep paper or contradiction analysis.",
      selectNodeIds: (graph) => {
        const seedIds = collectNodeIds(graph, (node) =>
          LANE_REPOS.has(node.repo) &&
          (node.status !== "UNVERIFIED" ||
            node.connectionCount >= 1 ||
            CORE_GOVERNANCE_LAYERS.has(node.governanceLayer))
        );
        const edgeBound = collectEdgeBoundNodeIds(
          graph,
          seedIds,
          (edge) => edge.type === "authority" || edge.type === "cross-reference",
          (node) =>
            LANE_REPOS.has(node.repo) ||
            PAPER_REPOS.has(node.repo) ||
            GOVERNANCE_CATEGORIES.has(node.category) ||
            CORE_GOVERNANCE_LAYERS.has(node.governanceLayer) ||
            node.status === "CONFLICTED"
        );
        const expanded = expandByNeighbors(edgeBound, graph, (node) =>
          LANE_REPOS.has(node.repo) ||
          PAPER_REPOS.has(node.repo) ||
          GOVERNANCE_CATEGORIES.has(node.category)
        );
        return limitToSet(expanded, 240, graph);
      },
      edgeFilter: (edge) => edge.type === "authority" || edge.type === "cross-reference",
    },
    full: {
      purpose: "Expose the full explicit graph for debugging, search, and expert exploration.",
      includedNodeTypes: ["doc", "paper", "code", "data", "config", "schema", "test-data"],
      includedEdgeTypes: [...EXPLICIT_EDGE_TYPES, ...AUTHORITY_EDGE_TYPES],
      excludedNoise: ["none beyond tag-only inferred edges"],
      maxRecommendedNodes: explicitGraph.nodes.length,
      maxRecommendedEdges: explicitGraph.combinedEdges.length,
      agentReviewInstruction: "Use only when scoped lenses are insufficient. Expect file-centric noise.",
      selectNodeIds: (graph) => new Set(graph.nodes.map((node) => node.id)),
      edgeFilter: () => true,
    },
    canonical: {
      purpose: "Preserve the audit-grade canonical graph including tag-derived inference edges.",
      includedNodeTypes: ["doc", "paper", "code", "data", "config", "schema", "test-data"],
      includedEdgeTypes: [...EXPLICIT_EDGE_TYPES, ...AUTHORITY_EDGE_TYPES, "tag-inference"],
      excludedNoise: ["none; this is the archive-complete audit surface"],
      maxRecommendedNodes: canonicalGraph.nodes.length,
      maxRecommendedEdges: canonicalGraph.combinedEdges.length,
      agentReviewInstruction: "Use for audits and forensic analysis only. This is not a first-pass navigation surface.",
      selectNodeIds: (graph) => new Set(graph.nodes.map((node) => node.id)),
      edgeFilter: () => true,
    },
  };
}

const LENS_DEFINITIONS = createLensDefinitions();

function createLensNodeIds(lens: GraphLens): Set<string> {
  const definition = LENS_DEFINITIONS[lens];
  const graph = lens === "canonical" ? canonicalGraph : explicitGraph;
  return definition.selectNodeIds(graph);
}

function buildPacketFromLens(lens: GraphLens): GraphDataPacket {
  const graph = lens === "canonical" ? canonicalGraph : explicitGraph;
  const definition = LENS_DEFINITIONS[lens];
  const rawNodeIds = createLensNodeIds(lens);
  const nodeIds = rawNodeIds.size > definition.maxRecommendedNodes
    ? limitToSet(rawNodeIds, definition.maxRecommendedNodes, graph)
    : rawNodeIds;

  const initialNodes = [...nodeIds]
    .map((id) => graph.nodeMap.get(id))
    .filter((node): node is GraphNodeRecord => Boolean(node))
    .sort((left, right) => baseNodeScore(right) - baseNodeScore(left));

  let allowedIds = new Set(initialNodes.map((node) => node.id));
  const filteredEdges = graph.combinedEdges.filter(
    (edge) =>
      allowedIds.has(edge.source) &&
      allowedIds.has(edge.target) &&
      (definition.edgeFilter ? definition.edgeFilter(edge) : true)
  );
  const filteredAuthorityEdges = graph.authorityEdges.filter(
    (edge) =>
      allowedIds.has(edge.source) &&
      allowedIds.has(edge.target) &&
      (definition.edgeFilter ? definition.edgeFilter(edge) : true)
  );
  const nodes =
    lens === "full" || lens === "canonical"
      ? initialNodes
      : pruneMostlyIsolatedNodes(
          initialNodes,
          filteredEdges,
          lens === "navigation" ? 40 : 8
        );
  allowedIds = new Set(nodes.map((node) => node.id));

  const authorityEdges = filteredAuthorityEdges.filter(
    (edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target)
  );
  const edges = filteredEdges.length > definition.maxRecommendedEdges
    ? filteredEdges
        .sort((left, right) => {
          const leftScore =
            (left.type === "authority" ? 100 : 0) +
            (left.authority === "CONTRADICTS" ? 50 : 0) +
            (left.authority === "VERIFIES" ? 30 : 0);
          const rightScore =
            (right.type === "authority" ? 100 : 0) +
            (right.authority === "CONTRADICTS" ? 50 : 0) +
            (right.authority === "VERIFIES" ? 30 : 0);
          return rightScore - leftScore;
        })
        .slice(0, definition.maxRecommendedEdges)
    : filteredEdges;
  const stabilizedEdges = edges.filter(
    (edge) => allowedIds.has(edge.source) && allowedIds.has(edge.target)
  );

  return {
    lens,
    lensLabel: LENS_META[lens].label,
    description: LENS_META[lens].description,
    nodes,
    edges: stabilizedEdges,
    authorityEdges,
    meta: {
      lensNodeCount: nodes.length,
      lensEdgeCount: stabilizedEdges.length,
      canonicalNodeCount: canonicalGraph.nodes.length,
      canonicalEdgeCount: canonicalGraph.combinedEdges.length,
      includesTagInferences: lens === "canonical",
      edgePolicy: lens === "canonical" ? "explicit_plus_inference" : "explicit_only",
      lensDefinition: {
        purpose: definition.purpose,
        includedNodeTypes: definition.includedNodeTypes,
        includedEdgeTypes: definition.includedEdgeTypes,
        excludedNoise: definition.excludedNoise,
        maxRecommendedNodes: definition.maxRecommendedNodes,
        maxRecommendedEdges: definition.maxRecommendedEdges,
        agentReviewInstruction: definition.agentReviewInstruction,
      },
    },
  };
}

const packetCache = new Map<GraphLens, GraphDataPacket>();

export function getGraphData(lens: GraphLens = "navigation"): GraphDataPacket {
  if (!packetCache.has(lens)) {
    packetCache.set(lens, buildPacketFromLens(lens));
  }
  return packetCache.get(lens)!;
}

export function getAvailableGraphLenses(): { id: GraphLens; label: string; description: string }[] {
  return (Object.keys(LENS_META) as GraphLens[]).map((id) => ({
    id,
    label: LENS_META[id].label,
    description: LENS_META[id].description,
  }));
}

export function getSiteIndex(): SiteIndex {
  return index;
}

export function getRepoRoots(): Record<string, string> {
  return index.repo_roots || {};
}

export function getRepoRoot(repoName: string): string | undefined {
  return index.repo_roots?.[repoName];
}

export function getRepos(): { name: string; fileCount: number; sizeBytes: number }[] {
  const byRepo = index.stats.by_repo || {};
  return Object.entries(byRepo)
    .map(([name, stats]) => ({
      name,
      fileCount: stats.total_files,
      sizeBytes: stats.total_size_bytes,
    }))
    .sort((left, right) => right.fileCount - left.fileCount);
}

export function getEntries(options?: {
  category?: string;
  contentType?: string;
  tag?: string;
  repo?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): IndexEntry[] {
  let filtered = index.entries;

  if (options?.category) {
    filtered = filtered.filter((entry) => entry.category === options.category);
  }
  if (options?.contentType) {
    filtered = filtered.filter((entry) => entry.content_type === options.contentType);
  }
  if (options?.repo) {
    filtered = filtered.filter((entry) => entry.repo === options.repo);
  }
  if (options?.tag) {
    const tagIds = index.tag_index[options.tag] || [];
    const tagIdSet = new Set(tagIds);
    filtered = filtered.filter((entry) => tagIdSet.has(entry.id));
  }
  if (options?.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter((entry) =>
      entry.title.toLowerCase().includes(query) ||
      entry.path.toLowerCase().includes(query) ||
      (entry.description && entry.description.toLowerCase().includes(query)) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  filtered.sort(
    (left, right) =>
      new Date(right.modified).getTime() - new Date(left.modified).getTime()
  );

  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  return filtered.slice(offset, offset + limit);
}

export function getEntryById(id: string): IndexEntry | undefined {
  return index.entries.find((entry) => entry.id === id);
}

export function getEntriesByTag(tag: string): IndexEntry[] {
  const ids = index.tag_index[tag] || [];
  const idSet = new Set(ids);
  return index.entries.filter((entry) => idSet.has(entry.id));
}

export function getCategories(): { category: string; count: number }[] {
  return Object.entries(index.stats.by_category)
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count);
}

export function getTopTags(limit = 30): { tag: string; count: number }[] {
  return Object.entries(index.tag_index)
    .map(([tag, ids]) => ({ tag, count: ids.length }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export function getStats() {
  return {
    totalFiles: index.stats.total_files,
    totalSize: index.stats.total_size_bytes,
    docCount: index.stats.by_content_type.doc || 0,
    codeCount: index.stats.by_content_type.code || 0,
    dataCount:
      (index.stats.by_content_type.data || 0) +
      (index.stats.by_content_type.schema || 0),
    tagCount: Object.keys(index.tag_index).length,
    categoryCount: Object.keys(index.stats.by_category).length,
    crossRefCount: index.cross_references.length,
    repoCount: Object.keys(index.stats.by_repo || {}).length,
    generatedAt: index.generated_at,
  };
}

import type { GraphNode, GraphEdge, Cluster, EntryPoint } from "./graph-types";

export interface GraphSnapshot {
  snapshot_id: string;
  created_at: string;
  created_by: string;
  graph_data_hash?: string;
  site_index_hash?: string;
  repo_filter: string[];
  type_filter?: string[];
  entry_point_filter?: string;
  meaning_layers_enabled?: string[];
  density_mode?: string;
  zoom_mode?: string;
  visible_node_cap?: number;
  visible_node_count: number;
  visible_edge_count: number;
  total_available_nodes?: number;
  total_available_edges?: number;
  status_counts?: {
    verified: number;
    unverified: number;
    conflicted: number;
    quarantined: number;
  };
  selected_node_ids: string[];
  selected_edge_ids: string[];
  interpretation_status: "observation";
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  entry_points: EntryPoint[];
}

export function generateSnapshotId(): string {
  const now = new Date();
  return `snapshot-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
}

export function createSnapshotFromGraphState(
  state: {
    repoFilter: string[];
    typeFilter?: string[];
    entryPointFilter?: string;
    meaningLayersEnabled?: string[];
    densityMode?: string;
    zoomMode?: string;
    visibleNodeCap?: number;
    visibleNodeCount: number;
    visibleEdgeCount: number;
    totalAvailableNodes?: number;
    totalAvailableEdges?: number;
    statusCounts?: { verified: number; unverified: number; conflicted: number; quarantined: number };
    selectedNodeIds: string[];
    selectedEdgeIds: string[];
    nodes: GraphNode[];
    edges: GraphEdge[];
    clusters: Cluster[];
    entryPoints: EntryPoint[];
  }
): GraphSnapshot {
  const now = new Date().toISOString();
  const snapshotId = generateSnapshotId();

  return {
    snapshot_id: snapshotId,
    created_at: now,
    created_by: "operator",
    repo_filter: state.repoFilter,
    type_filter: state.typeFilter,
    entry_point_filter: state.entryPointFilter,
    meaning_layers_enabled: state.meaningLayersEnabled,
    density_mode: state.densityMode,
    zoom_mode: state.zoomMode,
    visible_node_cap: state.visibleNodeCap,
    visible_node_count: state.visibleNodeCount,
    visible_edge_count: state.visibleEdgeCount,
    total_available_nodes: state.totalAvailableNodes,
    total_available_edges: state.totalAvailableEdges,
    status_counts: state.statusCounts,
    selected_node_ids: state.selectedNodeIds,
    selected_edge_ids: state.selectedEdgeIds,
    interpretation_status: "observation",
    nodes: state.nodes,
    edges: state.edges,
    clusters: state.clusters,
    entry_points: state.entryPoints,
  };
}

export function parseSnapshot(json: string): GraphSnapshot | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.snapshot_id || !parsed.nodes || !parsed.edges) return null;
    return parsed as GraphSnapshot;
  } catch {
    return null;
  }
}

export function createRepoSnapshot(
  repoName: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  clusters: Cluster[],
  entryPoints: EntryPoint[]
): GraphSnapshot {
  const repoNodes = nodes.filter(n => n.repo === repoName);
  const repoNodeIds = new Set(repoNodes.map(n => n.id));
  const repoEdges = edges.filter(e => repoNodeIds.has(e.source) || repoNodeIds.has(e.target));
  const repoClusterIds = new Set(repoNodes.map(n => n.clusterIds || []).flat());
  const repoClusters = clusters.filter(c => repoClusterIds.has(c.id));
  const repoEpIds = new Set(repoClusters.map(c => c.nodeIds || []).flat());
  const repoEntryPoints = entryPoints.filter(ep => {
    const epNodeIds = ep.nodeIds || [];
    return epNodeIds.some(id => repoNodeIds.has(id));
  });

  const statusCounts = { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  for (const n of repoNodes) {
    const key = n.status.toLowerCase() as keyof typeof statusCounts;
    if (key in statusCounts) statusCounts[key]++;
  }

  return createSnapshotFromGraphState({
    repoFilter: [repoName],
    visibleNodeCount: repoNodes.length,
    visibleEdgeCount: repoEdges.length,
    totalAvailableNodes: repoNodes.length,
    totalAvailableEdges: repoEdges.length,
    statusCounts,
    selectedNodeIds: [],
    selectedEdgeIds: [],
    nodes: repoNodes,
    edges: repoEdges,
    clusters: repoClusters,
    entryPoints: repoEntryPoints,
  });
}

export function downloadJson(data: object, filename: string): void {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', filename);
  link.click();
}

export interface ContradictionHubEntry {
  id: string;
  title: string;
  repo: string;
  connectionCount: number;
  contradictionCount: number;
  governanceLayer: string;
  authorityDepth: number;
  bridgeState: string;
  status: string;
  clusterIds: string[];
}

export function generateContradictionHubReport(nodes: GraphNode[]): ContradictionHubEntry[] {
  return nodes
    .filter(n => n.contradictionCount > 0)
    .sort((a, b) => b.contradictionCount - a.contradictionCount)
    .map(n => ({
      id: n.id,
      title: n.title,
      repo: n.repo,
      connectionCount: n.connectionCount,
      contradictionCount: n.contradictionCount,
      governanceLayer: n.governanceLayer,
      authorityDepth: n.authorityDepth,
      bridgeState: n.bridgeState,
      status: n.status,
      clusterIds: n.clusterIds || [],
    }));
}
import type { GraphNode, Cluster, EntryPoint, AuthorityEdgeType } from "./graph-types";

const REPO_COLORS: Record<string, string> = {
  "self-organizing-library": "#7C3AED",
  "Archivist-Agent": "#06B6D4",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": "#10B981",
  "kernel-lane": "#F59E0B",
  federation: "#EC4899",
  FreeAgent: "#8B5CF6",
};

const TAG_MIN_SIZE = 10;

export function computeClusters(nodes: GraphNode[]): Cluster[] {
  const clusters: Cluster[] = [];

  const repoGroups = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    if (!repoGroups.has(n.repo)) repoGroups.set(n.repo, []);
    repoGroups.get(n.repo)!.push(n);
  }

  for (const [repo, group] of repoGroups) {
    const sorted = [...group].sort((a, b) => b.connectionCount - a.connectionCount);
    clusters.push({
      id: `repo:${repo}`,
      label: repo.replace(/-/g, " ").replace(/SwarmMind Self Optimizing Multi Agent AI System/g, "SwarmMind"),
      nodeIds: group.map((n) => n.id),
      color: REPO_COLORS[repo] || "#6B7280",
      kind: "repo",
      representativeId: sorted[0]?.id || group[0].id,
    });
  }

  const tagGroups = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    for (const tag of n.tags) {
      if (!tagGroups.has(tag)) tagGroups.set(tag, []);
      tagGroups.get(tag)!.push(n);
    }
  }

  for (const [tag, group] of tagGroups) {
    if (group.length < TAG_MIN_SIZE) continue;
    const id = `tag:${tag}`;
    if (clusters.some((c) => c.id === id)) continue;
    const sorted = [...group].sort((a, b) => b.connectionCount - a.connectionCount);
    clusters.push({
      id,
      label: tag,
      nodeIds: group.map((n) => n.id),
      color: "#8B5CF6",
      kind: "tag",
      representativeId: sorted[0]?.id || group[0].id,
    });
  }

  return clusters;
}

export function computeEntryPoints(
  nodes: GraphNode[],
  clusters: Cluster[],
  authorityEdges: { source: string; target: string; authority: AuthorityEdgeType }[]
): EntryPoint[] {
  const entryPoints: EntryPoint[] = [];

  const topAuthority = [...nodes]
    .filter((n) => n.verificationCount >= 3)
    .sort((a, b) => b.verificationCount - a.verificationCount)
    .slice(0, 30);
  entryPoints.push({
    id: "ep:authority",
    label: "Top Authority",
    description: `${topAuthority.length} most-verified nodes`,
    nodeIds: topAuthority.map((n) => n.id),
    icon: "\u2713",
    kind: "authority",
  });

  const conflicted = nodes.filter((n) => n.status === "CONFLICTED" || n.status === "QUARANTINED");
  entryPoints.push({
    id: "ep:contradictions",
    label: "Contradictions",
    description: `${conflicted.length} conflicted or quarantined nodes`,
    nodeIds: conflicted.map((n) => n.id),
    icon: "\u26A0",
    kind: "contradictions",
  });

  for (const cluster of clusters) {
    if (cluster.nodeIds.length < 5) continue;
    entryPoints.push({
      id: `ep:${cluster.id}`,
      label: cluster.label,
      description: `${cluster.nodeIds.length} nodes in ${cluster.kind} cluster`,
      nodeIds: cluster.nodeIds,
      icon: cluster.kind === "repo" ? "\u25C7" : "#",
      kind: "cluster",
    });
  }

  return entryPoints;
}

export function assignClusterIds(nodes: GraphNode[], clusters: Cluster[]): GraphNode[] {
  const nodeClusterMap = new Map<string, string[]>();
  for (const cluster of clusters) {
    for (const nid of cluster.nodeIds) {
      if (!nodeClusterMap.has(nid)) nodeClusterMap.set(nid, []);
      nodeClusterMap.get(nid)!.push(cluster.id);
    }
  }
  return nodes.map((n) => ({
    ...n,
    clusterIds: nodeClusterMap.get(n.id) || [],
  }));
}

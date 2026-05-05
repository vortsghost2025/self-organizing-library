import type { GraphNode, Cluster, EntryPoint, AuthorityEdgeType, GovernanceLayer, BridgeState } from "./graph-types";

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
    .filter((n) => n.status === "VERIFIED" && (n.verificationCount >= 2 || n.authorityDepth >= 50))
    .sort((a, b) => (b.verificationCount + b.authorityDepth / 25) - (a.verificationCount + a.authorityDepth / 25))
    .slice(0, 60);
  entryPoints.push({
    id: "ep:authority",
    label: "Top Authority",
    description: `${topAuthority.length} verified high-authority nodes`,
    nodeIds: topAuthority.map((n) => n.id),
    icon: "\u2713",
    kind: "authority",
  });

  const allVerified = nodes.filter((n) => n.status === "VERIFIED");
  entryPoints.push({
    id: "ep:all-verified",
    label: "All Verified",
    description: `${allVerified.length} verified nodes across all repos`,
    nodeIds: allVerified.map((n) => n.id),
    icon: "\u2714",
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

  const unenforced = nodes.filter((n) =>
    (n.governanceLayer === "theoretical" || n.governanceLayer === "historical") &&
    (n.bridgeState === "documented_only" || n.bridgeState === "unknown")
  );
  entryPoints.push({
    id: "ep:gov-unenforced",
    label: "Unenforced Claims",
    description: `${unenforced.length} theoretical/historical with no bridge to core`,
    nodeIds: unenforced.map((n) => n.id),
    icon: "\u25C8",
    kind: "authority",
  });

  const core = nodes.filter((n) =>
    n.governanceLayer === "constitutional" || n.governanceLayer === "operational"
  );
  entryPoints.push({
    id: "ep:gov-core",
    label: "Governance Core",
    description: `${core.length} constitutional + operational nodes`,
    nodeIds: core.map((n) => n.id),
    icon: "\u25C9",
    kind: "authority",
  });

  const bridges = nodes.filter((n) =>
    n.bridgeState === "enforced" || n.bridgeState === "verified" || n.bridgeState === "partial"
  );
  entryPoints.push({
    id: "ep:gov-bridges",
    label: "Active Bridges",
    description: `${bridges.length} nodes with enforced/verified/partial bridges`,
    nodeIds: bridges.map((n) => n.id),
    icon: "\u2194",
    kind: "authority",
  });

  const contradicted = nodes.filter((n) => n.bridgeState === "contradicted");
  entryPoints.push({
    id: "ep:gov-contradicted",
    label: "Contradicted Claims",
    description: `${contradicted.length} nodes with contradicted bridge state`,
    nodeIds: contradicted.map((n) => n.id),
    icon: "\u2717",
    kind: "contradictions",
  });

  const authorityMismatch = nodes.filter((n) =>
    (n.governanceLayer === "theoretical" || n.governanceLayer === "historical") &&
    n.authorityDepth >= 75
  );
  entryPoints.push({
    id: "ep:gov-authority-mismatch",
    label: "Authority Mismatches",
    description: `${authorityMismatch.length} theoretical/historical with high authority depth`,
    nodeIds: authorityMismatch.map((n) => n.id),
    icon: "?",
    kind: "contradictions",
  });

  const evidence = nodes.filter((n) => n.governanceLayer === "evidence");
  entryPoints.push({
    id: "ep:gov-evidence",
    label: "Evidence Layer",
    description: `${evidence.length} evidence nodes`,
    nodeIds: evidence.map((n) => n.id),
    icon: "\u2713",
    kind: "authority",
  });

  const adjacent = nodes.filter((n) => n.governanceLayer === "application_adjacent");
  entryPoints.push({
    id: "ep:gov-adjacent",
    label: "Application Adjacent",
    description: `${adjacent.length} non-lane workspace nodes`,
    nodeIds: adjacent.map((n) => n.id),
    icon: "\u25BD",
    kind: "cluster",
  });

  const historical = nodes.filter((n) => n.governanceLayer === "historical");
  entryPoints.push({
    id: "ep:gov-historical",
    label: "Historical Layer",
    description: `${historical.length} historical/stale nodes`,
    nodeIds: historical.map((n) => n.id),
    icon: "\u25CB",
    kind: "cluster",
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

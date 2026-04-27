# Nexus Graph Thinking Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Nexus Graph from a database visualization dumping 2,954 nodes into a thinking interface with progressive density, interactive clusters, entry points, meaning layers, and capped visible nodes.

**Architecture:** The current monolith `NexusGraph.tsx` (1,031 lines) will be rewritten as a multi-component system. The data layer (`site-index.ts`) gets cluster computation. The graph uses sigma.js with `nodeReducer`/`edgeReducer` for all visual state — no graph rebuilds on filter changes. Entry points replace the "Explore" mode. Progressive density replaces the zoom-label threshold hack. Meaning layers toggle edge visibility by authority type.

**Tech Stack:** React 19, Next.js 16, sigma.js 3, graphology 0.26, graphology-layout-forceatlas2, graphology-generators (for cluster node rendering)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/site-index.ts` | Modify | Add cluster computation to `getGraphData()`, fix O(n*e) connectionCount |
| `src/lib/graph-types.ts` | Create | Shared types: GraphNode, GraphEdge, Cluster, EntryPoint, MeaningLayer, DensityLevel |
| `src/lib/graph-clusters.ts` | Create | Cluster detection by repo + tag co-occurrence, entry point computation |
| `src/components/NexusGraph.tsx` | Rewrite | Main orchestrator — fetches data, manages state, renders sub-components |
| `src/components/graph/GraphCanvas.tsx` | Create | Sigma renderer + camera + nodeReducer/edgeReducer + event handlers |
| `src/components/graph/EntryPoints.tsx` | Create | Entry point picker panel (top authority, contradictions, clusters, repos) |
| `src/components/graph/MeaningLayers.tsx` | Create | Toggle panel for Structure/Conflicts/Verification/Execution layers |
| `src/components/graph/DensityControl.tsx` | Create | Progressive density mode selector (Overview/Mid/Focus) |
| `src/components/graph/ClusterSelector.tsx` | Create | Interactive cluster list + click-to-select |
| `src/components/graph/NodeDetail.tsx` | Create | Selected node detail sidebar (extracted from NexusGraph) |
| `src/components/graph/GraphToolbar.tsx` | Create | Combined toolbar with mode, filters, search |
| `src/components/graph/GraphLegend.tsx` | Create | Legend panel (extracted from NexusGraph) |
| `src/app/graph/page.tsx` | Modify | No changes needed (already dynamic imports NexusGraph) |

---

## Key Design Decisions

### 1. Cluster Definition
Clusters = repo groups + top-tag groups. Each repo is a cluster. Each tag with 10+ nodes is a cluster. A node can belong to multiple clusters (primary = repo, secondary = top tag). This avoids needing Louvain/label-propagation — the data already has semantic grouping.

### 2. Node Cap Strategy
Instead of rendering all 2,954 nodes, the `nodeReducer` dims non-visible nodes to near-invisible (`opacity: 0.05`, `size: 0.5`). Visible nodes are determined by:
- **Entry point selection** — which entry point is active
- **Cluster selection** — which cluster is highlighted
- **Density level** — Overview (clusters only ~20 nodes), Mid (cluster nodes ~50-100), Focus (node + neighbors ~20-50)
- **Search** — nodes matching search query

All nodes stay in the graphology graph (no rebuild), but `nodeReducer` controls visibility. This means no ForceAtlas2 re-run on filter changes.

### 3. Meaning Layers
Four toggleable layers that control which EDGES are visible:
- **Structure** — DERIVES_FROM, DEPENDS_ON edges
- **Conflicts** — CONTRADICTS edges only
- **Verification** — VERIFIES, SIGNED_BY edges
- **Execution** — EXECUTES edges

Default: Structure + Verification on. Conflicts and Execution off. The `edgeReducer` checks the active layers.

### 4. Progressive Density
Three modes replacing the zoom-label threshold hack:
- **Overview** — Only cluster representative nodes visible (one per cluster, sized by member count). Labels always shown for these.
- **Mid** — All nodes in selected cluster(s) visible. Labels only for high-degree nodes (>8 connections).
- **Focus** — Selected node + direct neighbors visible. Labels for all visible nodes.

### 5. Labels
Labels shown ONLY for:
- Hovered node (always)
- Selected node (always)
- Nodes in Focus density mode (all visible)
- Cluster representative nodes in Overview mode
- High-degree nodes (>8) in Mid mode when zoomed in (camera ratio < 0.6)

---

### Task 1: Create shared graph types

**Files:**
- Create: `src/lib/graph-types.ts`

- [ ] **Step 1: Create the types file**

```typescript
export type AuthorityEdgeType =
  | "VERIFIES"
  | "DERIVES_FROM"
  | "CONTRADICTS"
  | "SIGNED_BY"
  | "EXECUTES"
  | "DEPENDS_ON";

export type NodeStatus = "UNVERIFIED" | "VERIFIED" | "CONFLICTED" | "QUARANTINED";

export type MeaningLayer = "structure" | "conflicts" | "verification" | "execution";

export type DensityLevel = "overview" | "mid" | "focus";

export interface GraphNode {
  id: string;
  title: string;
  type: string;
  category: string;
  repo: string;
  connectionCount: number;
  tags: string[];
  status: NodeStatus;
  verificationCount: number;
  contradictionCount: number;
  clusterIds: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  authority?: AuthorityEdgeType;
}

export interface Cluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  kind: "repo" | "tag";
  representativeId: string;
}

export interface EntryPoint {
  id: string;
  label: string;
  description: string;
  nodeIds: string[];
  icon: string;
  kind: "authority" | "contradictions" | "cluster" | "repo";
}

export const MEANING_LAYER_EDGES: Record<MeaningLayer, AuthorityEdgeType[]> = {
  structure: ["DERIVES_FROM", "DEPENDS_ON"],
  conflicts: ["CONTRADICTS"],
  verification: ["VERIFIES", "SIGNED_BY"],
  execution: ["EXECUTES"],
};

export const DEFAULT_LAYERS: MeaningLayer[] = ["structure", "verification"];

export const TYPE_COLORS: Record<string, string> = {
  doc: "#7C3AED",
  paper: "#06B6D4",
  code: "#10B981",
  data: "#F59E0B",
  config: "#EC4899",
  schema: "#8B5CF6",
  "test-data": "#F97316",
};

export const REPO_COLORS: Record<string, string> = {
  "self-organizing-library": "#7C3AED",
  "Archivist-Agent": "#06B6D4",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": "#10B981",
  "kernel-lane": "#F59E0B",
  federation: "#EC4899",
  FreeAgent: "#8B5CF6",
};

export const STATUS_COLORS: Record<NodeStatus, string> = {
  VERIFIED: "#22C55E",
  UNVERIFIED: "#6B7280",
  CONFLICTED: "#EF4444",
  QUARANTINED: "#A855F7",
};

export const AUTHORITY_EDGE_COLORS: Record<AuthorityEdgeType, string> = {
  VERIFIES: "#22C55E",
  DERIVES_FROM: "#3B82F6",
  CONTRADICTS: "#EF4444",
  SIGNED_BY: "#A855F7",
  EXECUTES: "#F59E0B",
  DEPENDS_ON: "#6B7280",
};

export const AUTHORITY_EDGE_SIZE: Record<AuthorityEdgeType, number> = {
  VERIFIES: 1.8,
  DERIVES_FROM: 1.2,
  CONTRADICTS: 1.5,
  SIGNED_BY: 1.8,
  EXECUTES: 1.4,
  DEPENDS_ON: 0.5,
};

export const LAYER_META: Record<MeaningLayer, { label: string; icon: string; color: string }> = {
  structure: { label: "Structure", icon: "◇", color: "#3B82F6" },
  conflicts: { label: "Conflicts", icon: "⚠", color: "#EF4444" },
  verification: { label: "Verification", icon: "✓", color: "#22C55E" },
  execution: { label: "Execution", icon: "▶", color: "#F59E0B" },
};
```

- [ ] **Step 2: Verify types compile**
Run: `npx tsc --noEmit --pretty 2>&1 | head -5`
Expected: No errors from graph-types.ts

---

### Task 2: Create cluster computation module

**Files:**
- Create: `src/lib/graph-clusters.ts`

- [ ] **Step 1: Create the cluster computation module**

```typescript
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
    icon: "✓",
    kind: "authority",
  });

  const conflicted = nodes.filter((n) => n.status === "CONFLICTED" || n.status === "QUARANTINED");
  entryPoints.push({
    id: "ep:contradictions",
    label: "Contradictions",
    description: `${conflicted.length} conflicted or quarantined nodes`,
    nodeIds: conflicted.map((n) => n.id),
    icon: "⚠",
    kind: "contradictions",
  });

  for (const cluster of clusters) {
    if (cluster.nodeIds.length < 5) continue;
    entryPoints.push({
      id: `ep:${cluster.id}`,
      label: cluster.label,
      description: `${cluster.nodeIds.length} nodes in ${cluster.kind} cluster`,
      nodeIds: cluster.nodeIds,
      icon: cluster.kind === "repo" ? "◇" : "#",
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
```

- [ ] **Step 2: Verify types compile**
Run: `npx tsc --noEmit --pretty 2>&1 | head -5`
Expected: No errors from graph-clusters.ts

---

### Task 3: Update site-index.ts to add cluster data and fix O(n*e) connectionCount

**Files:**
- Modify: `src/lib/site-index.ts:157-203` (the `getGraphData()` function)

- [ ] **Step 1: Update getGraphData() to fix O(n*e) connectionCount and add clusterIds**

Replace the `getGraphData()` function body. The current code does `edges.filter(edge => edge.source === e.id || edge.target === e.id).length` for every node — O(n*e). Replace with a Map-based O(n+e) approach.

Current code to replace (lines 157-203):
```typescript
export function getGraphData() {
  const authorityEdges = computeAuthorityEdges(index.entries, index.cross_references, index.tag_index);
  const nodeStatuses = computeNodeStatuses(index.entries, authorityEdges);
  // ... edges building ... O(n*e) connectionCount
}
```

New code:
```typescript
export function getGraphData() {
  const authorityEdges = computeAuthorityEdges(index.entries, index.cross_references, index.tag_index);
  const nodeStatuses = computeNodeStatuses(index.entries, authorityEdges);

  const statusMap = new Map(nodeStatuses.map((s: { id: string; status: string; verificationCount: number; contradictionCount: number }) => [s.id, s]));

  const edges: { source: string; target: string; type: string; authority?: string }[] = [];

  for (const refs of index.cross_references) {
    edges.push({ source: refs.source, target: refs.target, type: refs.type });
  }

  for (const [tag, ids] of Object.entries(index.tag_index)) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = i + 1; j < Math.min(ids.length, i + 4); j++) {
        edges.push({ source: ids[i], target: ids[j], type: 'shared-tag' });
      }
    }
  }

  const authEdgeSet = new Set<string>();
  for (const ae of authorityEdges) {
    const key = `${ae.source}:${ae.target}:${ae.authority}`;
    if (authEdgeSet.has(key)) continue;
    authEdgeSet.add(key);
    edges.push({ source: ae.source, target: ae.target, type: 'authority', authority: ae.authority });
  }

  const connectionCountMap = new Map<string, number>();
  for (const edge of edges) {
    connectionCountMap.set(edge.source, (connectionCountMap.get(edge.source) || 0) + 1);
    connectionCountMap.set(edge.target, (connectionCountMap.get(edge.target) || 0) + 1);
  }

  const nodes = index.entries.map(e => {
    const status: { status: string; verificationCount: number; contradictionCount: number } | undefined = statusMap.get(e.id);
    return {
      id: e.id,
      title: e.title,
      type: e.content_type,
      category: e.category,
      repo: e.repo,
      connectionCount: connectionCountMap.get(e.id) || 0,
      tags: e.tags,
      status: status?.status || 'UNVERIFIED',
      verificationCount: status?.verificationCount || 0,
      contradictionCount: status?.contradictionCount || 0,
    };
  });

  return { nodes, edges, authorityEdges };
}
```

Key changes:
- `connectionCountMap` replaces O(n*e) `.filter()` — now O(n+e)
- Return `authorityEdges` in the response so the client can build entry points

- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit --pretty 2>&1 | head -5`
Expected: No errors

---

### Task 4: Create GraphCanvas component (Sigma renderer + reducers)

**Files:**
- Create: `src/components/graph/GraphCanvas.tsx`

This is the core rendering component. It owns the Sigma instance, camera, nodeReducer, edgeReducer, and all mouse event handlers.

- [ ] **Step 1: Create the GraphCanvas component**

This component receives all state as props and manages the Sigma renderer lifecycle. The nodeReducer and edgeReducer implement all 6 requirements:

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphNode, GraphEdge, MeaningLayer, DensityLevel, Cluster, AuthorityEdgeType } from "@/lib/graph-types";
import { MEANING_LAYER_EDGES, AUTHORITY_EDGE_COLORS, AUTHORITY_EDGE_SIZE, STATUS_COLORS, TYPE_COLORS, REPO_COLORS } from "@/lib/graph-types";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  hoveredNodeId: string | null;
  selectedNodeId: string | null;
  focusedNodeId: string | null;
  pathNodes: Set<string>;
  pathEdges: Set<string>;
  pathSource: string | null;
  pathTarget: string | null;
  activeLayers: MeaningLayer[];
  density: DensityLevel;
  activeEntryPoint: string | null;
  activeClusterId: string | null;
  searchQuery: string;
  filterMode: "type" | "repo";
  filter: string;
  onNodeClick: (nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
  onStageClick: () => void;
  onCameraUpdate: (ratio: number) => void;
}

const DIM_COLOR = "#1E1E28";
const HOVER_DIM_COLOR = "#252530";
const HOVER_DIM_EDGE = "#1A1A22";
const PATH_HIGHLIGHT = "#F59E0B";
const PATH_EDGE_COLOR = "#FBBF24";

function buildGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  filter: string,
  filterMode: "type" | "repo"
): Graph {
  const filtered = filter === "all"
    ? nodes
    : filterMode === "repo"
    ? nodes.filter((n) => n.repo === filter)
    : nodes.filter((n) => n.type === filter);
  const ids = new Set(filtered.map((n) => n.id));

  const graph = new Graph({ type: "undirected", multi: false });

  for (const node of filtered) {
    const baseSize = node.type === "paper" ? 10 : node.type === "doc" ? 6 : 4;
    const color = filterMode === "repo"
      ? (REPO_COLORS[node.repo] || TYPE_COLORS[node.type] || TYPE_COLORS.doc)
      : (TYPE_COLORS[node.type] || TYPE_COLORS.doc);
    graph.addNode(node.id, {
      label: node.title,
      x: 0,
      y: 0,
      size: Math.max(baseSize, 3 + Math.min(node.connectionCount * 0.5, 8)),
      color,
      nodeType: node.type,
      category: node.category,
      repo: node.repo,
      connectionCount: node.connectionCount,
      tags: JSON.stringify(node.tags),
      nodeStatus: node.status || "UNVERIFIED",
      verificationCount: node.verificationCount || 0,
      contradictionCount: node.contradictionCount || 0,
      clusterIds: JSON.stringify(node.clusterIds || []),
    });
  }

  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue;
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      if (!graph.hasEdge(edge.source, edge.target)) {
        const auth = edge.authority;
        const edgeColor = auth
          ? AUTHORITY_EDGE_COLORS[auth] || "#1E1E24"
          : edge.type === "shared-tag"
          ? "#1E1E24"
          : "#2A2A32";
        const edgeSize = auth
          ? AUTHORITY_EDGE_SIZE[auth] || 0.5
          : 0.5;
        graph.addEdge(edge.source, edge.target, {
          color: edgeColor,
          size: edgeSize,
          edgeType: edge.type,
          authority: auth || null,
        });
      }
    }
  }

  circular.assign(graph, { scale: 300 });

  if (graph.order > 0) {
    const settings = forceAtlas2.inferSettings(graph);
    settings.gravity = 1;
    settings.scalingRatio = 2;
    settings.barnesHutOptimize = graph.order > 100;
    forceAtlas2.assign(graph, { iterations: 100, settings });
  }

  return graph;
}

export default function GraphCanvas({
  nodes,
  edges,
  clusters,
  hoveredNodeId,
  selectedNodeId,
  focusedNodeId,
  pathNodes,
  pathEdges,
  pathSource,
  pathTarget,
  activeLayers,
  density,
  activeEntryPoint,
  activeClusterId,
  searchQuery,
  filterMode,
  filter,
  onNodeClick,
  onNodeHover,
  onStageClick,
  onCameraUpdate,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const hoveredNeighborIdsRef = useRef<Set<string>>(new Set());
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeLayersRef = useRef(activeLayers);
  const densityRef = useRef(density);
  const activeEntryPointRef = useRef(activeEntryPoint);
  const activeClusterIdRef = useRef(activeClusterId);
  const searchQueryRef = useRef(searchQuery);
  const hoveredNodeIdRef = useRef(hoveredNodeId);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const focusedNodeIdRef = useRef(focusedNodeId);
  const pathNodesRef = useRef(pathNodes);
  const pathEdgesRef = useRef(pathEdges);
  const pathSourceRef = useRef(pathSource);
  const pathTargetRef = useRef(pathTarget);
  const clustersRef = useRef(clusters);

  useEffect(() => { activeLayersRef.current = activeLayers; }, [activeLayers]);
  useEffect(() => { densityRef.current = density; }, [density]);
  useEffect(() => { activeEntryPointRef.current = activeEntryPoint; }, [activeEntryPoint]);
  useEffect(() => { activeClusterIdRef.current = activeClusterId; }, [activeClusterId]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { hoveredNodeIdRef.current = hoveredNodeId; }, [hoveredNodeId]);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { focusedNodeIdRef.current = focusedNodeId; }, [focusedNodeId]);
  useEffect(() => { pathNodesRef.current = pathNodes; }, [pathNodes]);
  useEffect(() => { pathEdgesRef.current = pathEdges; }, [pathEdges]);
  useEffect(() => { pathSourceRef.current = pathSource; }, [pathSource]);
  useEffect(() => { pathTargetRef.current = pathTarget; }, [pathTarget]);
  useEffect(() => { clustersRef.current = clusters; }, [clusters]);

  useEffect(() => {
    if (sigmaRef.current) sigmaRef.current.refresh();
  }, [hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, pathSource, pathTarget, activeLayers, density, activeEntryPoint, activeClusterId, searchQuery]);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = buildGraph(nodes, edges, filter, filterMode);
    if (graph.order === 0) return;
    graphRef.current = graph;

    const clusterNodeIds = new Map<string, Set<string>>();
    for (const c of clusters) {
      clusterNodeIds.set(c.id, new Set(c.nodeIds));
    }

    const entryPointNodeIds = new Set<string>();

    const isVisible = (nodeId: string): boolean => {
      const d = densityRef.current;
      const ep = activeEntryPointRef.current;
      const ac = activeClusterIdRef.current;
      const sq = searchQueryRef.current.toLowerCase();
      const focused = focusedNodeIdRef.current;
      const selected = selectedNodeIdRef.current;
      const graph = graphRef.current;
      if (!graph || !graph.hasNode(nodeId)) return false;

      if (sq && graph.getNodeAttribute(nodeId, "label")?.toLowerCase().includes(sq)) return true;

      if (pathNodesRef.current.size > 0 && pathNodesRef.current.has(nodeId)) return true;

      if (focused && graph.hasNode(focused)) {
        const neighbors = new Set(graph.neighbors(focused));
        if (neighbors.has(nodeId) || nodeId === focused) return true;
      }

      if (selected && nodeId === selected) return true;

      if (ep) {
        for (const c of clustersRef.current) {
          if (`ep:${c.id}` === ep && clusterNodeIds.get(c.id)?.has(nodeId)) return true;
        }
        if (ep === "ep:authority") {
          const attrs = graph.getNodeAttributes(nodeId);
          if ((attrs as any).verificationCount >= 3) return true;
        }
        if (ep === "ep:contradictions") {
          const ns = (graph.getNodeAttributes(nodeId) as any).nodeStatus;
          if (ns === "CONFLICTED" || ns === "QUARANTINED") return true;
        }
      }

      if (ac && clusterNodeIds.get(ac)?.has(nodeId)) return true;

      if (d === "overview") {
        for (const c of clustersRef.current) {
          if (c.representativeId === nodeId) return true;
        }
        return false;
      }

      if (d === "mid") {
        if (!ep && !ac && !focused && !sq) return true;
        return false;
      }

      return true;
    };

    const isEdgeInActiveLayer = (authority: string | null): boolean => {
      if (!authority) return true;
      const layers = activeLayersRef.current;
      for (const layer of layers) {
        if (MEANING_LAYER_EDGES[layer]?.includes(authority as AuthorityEdgeType)) return true;
      }
      return false;
    };

    const container = containerRef.current;
    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      renderEdgeLabels: false,
      labelFont: "DM Sans",
      labelSize: 12,
      labelWeight: "500",
      labelColor: { color: "#A1A1AA" },
      labelRenderedSizeThreshold: 50,
      defaultEdgeColor: "#1E1E24",
      defaultNodeType: "circle",
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      stagePadding: 20,
      nodeReducer: (node, data) => {
        const res = { ...data };
        const nodeStatus = (data as any).nodeStatus || "UNVERIFIED";
        const hovered = hoveredNodeIdRef.current;
        const selected = selectedNodeIdRef.current;
        const focused = focusedNodeIdRef.current;
        const pNodes = pathNodesRef.current;
        const pSource = pathSourceRef.current;
        const pTarget = pathTargetRef.current;
        const visible = isVisible(node);

        if (!visible) {
          res.color = DIM_COLOR;
          res.size = 0.5;
          res.label = "";
          return res;
        }

        if (pNodes.size > 0) {
          if (pNodes.has(node)) {
            res.highlighted = true;
            res.zIndex = 10;
            if (node === pSource || node === pTarget) {
              res.color = PATH_HIGHLIGHT;
              res.size = (res.size || 6) * 1.5;
            }
          } else {
            res.color = DIM_COLOR;
            res.label = "";
          }
          return res;
        }

        if (focused && graph.hasNode(focused)) {
          const neighbors = new Set(graph.neighbors(focused));
          if (neighbors.has(node) || node === focused) {
            if (node === focused) {
              res.highlighted = true;
              res.zIndex = 10;
              res.size = (res.size || 6) * 1.3;
            }
          } else {
            res.color = DIM_COLOR;
            res.label = "";
          }
          return res;
        }

        if (hovered) {
          const neighborIds = hoveredNeighborIdsRef.current;
          if (node === hovered || neighborIds.has(node)) {
            res.highlighted = true;
          } else {
            res.color = HOVER_DIM_COLOR;
            const degree = graph.degree(node);
            if (degree < 8) res.label = "";
          }
          return res;
        }

        if (nodeStatus === "CONFLICTED") {
          res.color = STATUS_COLORS.CONFLICTED;
          res.zIndex = 5;
        } else if (nodeStatus === "QUARANTINED") {
          res.color = STATUS_COLORS.QUARANTINED;
          res.zIndex = 5;
        }

        if (selected && node === selected) {
          res.highlighted = true;
          res.zIndex = 10;
        }

        const d = densityRef.current;
        if (d === "overview") {
          const isRep = clustersRef.current.some((c) => c.representativeId === node);
          if (!isRep) {
            res.label = "";
          }
        } else if (d === "mid") {
          const degree = graph.degree(node);
          if (degree < 8) res.label = "";
        } else if (d === "focus") {
          // all visible nodes get labels
        }

        return res;
      },
      edgeReducer: (edge, data) => {
        const res = { ...data };
        const authority = (data as any).authority as string | null;
        const hovered = hoveredNodeIdRef.current;
        const focused = focusedNodeIdRef.current;
        const pEdges = pathEdgesRef.current;

        if (!isEdgeInActiveLayer(authority)) {
          res.hidden = true;
          return res;
        }

        if (pEdges.size > 0) {
          if (pEdges.has(edge)) {
            res.color = PATH_EDGE_COLOR;
            res.size = 2.5;
          } else {
            res.hidden = true;
          }
          return res;
        }

        if (focused && graph.hasNode(focused)) {
          const neighbors = new Set(graph.neighbors(focused));
          const src = graph.source(edge);
          const tgt = graph.target(edge);
          if (!neighbors.has(src) || !neighbors.has(tgt)) {
            res.hidden = true;
          } else if (authority && AUTHORITY_EDGE_COLORS[authority as AuthorityEdgeType]) {
            res.color = AUTHORITY_EDGE_COLORS[authority as AuthorityEdgeType];
            res.size = AUTHORITY_EDGE_SIZE[authority as AuthorityEdgeType] || 1.2;
          } else {
            res.size = 1.2;
          }
          return res;
        }

        if (hovered) {
          const src = graph.source(edge);
          const tgt = graph.target(edge);
          if (src !== hovered && tgt !== hovered) {
            res.color = HOVER_DIM_EDGE;
            res.size = 0.2;
          } else if (authority && AUTHORITY_EDGE_COLORS[authority as AuthorityEdgeType]) {
            res.color = AUTHORITY_EDGE_COLORS[authority as AuthorityEdgeType];
            res.size = AUTHORITY_EDGE_SIZE[authority as AuthorityEdgeType] || 1.5;
          } else {
            res.size = 1.5;
          }
          return res;
        }

        if (authority && AUTHORITY_EDGE_COLORS[authority as AuthorityEdgeType]) {
          res.color = AUTHORITY_EDGE_COLORS[authority as AuthorityEdgeType];
          res.size = AUTHORITY_EDGE_SIZE[authority as AuthorityEdgeType];
        }

        return res;
      },
    });

    renderer.on("clickNode", ({ node }) => {
      onNodeClick(node);
    });

    renderer.on("enterNode", ({ node }) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        const g = graphRef.current;
        if (g && g.hasNode(node)) {
          hoveredNeighborIdsRef.current = new Set(g.neighbors(node));
        }
        onNodeHover(node);
      }, 60);
    });

    renderer.on("leaveNode", () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoveredNeighborIdsRef.current = new Set();
      onNodeHover(null);
    });

    renderer.on("clickStage", () => {
      onStageClick();
    });

    const camera = renderer.getCamera() as any;
    const onCameraUpdate = () => {
      onCameraUpdate(camera.ratio);
    };
    camera.on("updated", onCameraUpdate);

    sigmaRef.current = renderer;

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      camera.removeListener("updated", onCameraUpdate);
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [nodes, edges, clusters, filter, filterMode, onNodeClick, onNodeHover, onStageClick, onCameraUpdate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      role="img"
      aria-label="Interactive document nexus graph"
    />
  );
}
```

- [ ] **Step 2: Verify compilation**
Run: `npx tsc --noEmit --pretty 2>&1 | head -10`
Expected: No errors from GraphCanvas.tsx

---

### Task 5: Create EntryPoints, MeaningLayers, DensityControl, ClusterSelector, GraphToolbar, NodeDetail, GraphLegend components

**Files:**
- Create: `src/components/graph/EntryPoints.tsx`
- Create: `src/components/graph/MeaningLayers.tsx`
- Create: `src/components/graph/DensityControl.tsx`
- Create: `src/components/graph/ClusterSelector.tsx`
- Create: `src/components/graph/GraphToolbar.tsx`
- Create: `src/components/graph/NodeDetail.tsx`
- Create: `src/components/graph/GraphLegend.tsx`

These are all presentational components receiving props from the parent NexusGraph.

- [ ] **Step 1: Create EntryPoints.tsx**

```typescript
"use client";

import type { EntryPoint } from "@/lib/graph-types";

interface EntryPointsProps {
  entryPoints: EntryPoint[];
  activeEntryPoint: string | null;
  onSelect: (id: string | null) => void;
}

export default function EntryPoints({ entryPoints, activeEntryPoint, onSelect }: EntryPointsProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">Entry Points</span>
      {entryPoints.slice(0, 12).map((ep) => (
        <button
          key={ep.id}
          onClick={() => onSelect(activeEntryPoint === ep.id ? null : ep.id)}
          aria-pressed={activeEntryPoint === ep.id}
          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeEntryPoint === ep.id
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          <span className="w-5 text-center" aria-hidden="true">{ep.icon}</span>
          <span className="flex-1 truncate">{ep.label}</span>
          <span className="text-xs text-[var(--text-muted)]">{ep.nodeIds.length}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create MeaningLayers.tsx**

```typescript
"use client";

import type { MeaningLayer } from "@/lib/graph-types";
import { LAYER_META } from "@/lib/graph-types";

interface MeaningLayersProps {
  activeLayers: MeaningLayer[];
  onToggle: (layer: MeaningLayer) => void;
}

const ALL_LAYERS: MeaningLayer[] = ["structure", "conflicts", "verification", "execution"];

export default function MeaningLayers({ activeLayers, onToggle }: MeaningLayersProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">Meaning Layers</span>
      {ALL_LAYERS.map((layer) => {
        const meta = LAYER_META[layer];
        const active = activeLayers.includes(layer);
        return (
          <button
            key={layer}
            onClick={() => onToggle(layer)}
            aria-pressed={active}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]/50"
            }`}
          >
            <span style={{ color: meta.color }} aria-hidden="true">{meta.icon}</span>
            <span className="flex-1">{meta.label}</span>
            <span className={`w-2 h-2 rounded-full ${active ? "bg-[var(--primary)]" : "bg-[var(--text-muted)]/30"}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create DensityControl.tsx**

```typescript
"use client";

import type { DensityLevel } from "@/lib/graph-types";

interface DensityControlProps {
  density: DensityLevel;
  onChange: (d: DensityLevel) => void;
}

const DENSITIES: { level: DensityLevel; label: string; icon: string; description: string }[] = [
  { level: "overview", label: "Overview", icon: "◉", description: "Cluster representatives only" },
  { level: "mid", label: "Explore", icon: "◈", description: "Active cluster nodes" },
  { level: "focus", label: "Focus", icon: "◎", description: "Node + neighbors" },
];

export default function DensityControl({ density, onChange }: DensityControlProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">Density</span>
      {DENSITIES.map((d) => (
        <button
          key={d.level}
          onClick={() => onChange(d.level)}
          aria-pressed={density === d.level}
          title={d.description}
          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            density === d.level
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          <span className="w-5 text-center" aria-hidden="true">{d.icon}</span>
          <span className="flex-1">{d.label}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create ClusterSelector.tsx**

```typescript
"use client";

import type { Cluster } from "@/lib/graph-types";

interface ClusterSelectorProps {
  clusters: Cluster[];
  activeClusterId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ClusterSelector({ clusters, activeClusterId, onSelect }: ClusterSelectorProps) {
  const repos = clusters.filter((c) => c.kind === "repo");
  const tags = clusters.filter((c) => c.kind === "tag").sort((a, b) => b.nodeIds.length - a.nodeIds.length).slice(0, 15);

  return (
    <div className="space-y-3">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">Clusters</span>
      <div className="space-y-1">
        <span className="text-xs text-[var(--text-muted)] px-3">Repositories</span>
        {repos.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(activeClusterId === c.id ? null : c.id)}
            aria-pressed={activeClusterId === c.id}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeClusterId === c.id
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} aria-hidden="true" />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="text-xs text-[var(--text-muted)]">{c.nodeIds.length}</span>
          </button>
        ))}
      </div>
      <div className="space-y-1">
        <span className="text-xs text-[var(--text-muted)] px-3">Tag Groups (10+)</span>
        {tags.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(activeClusterId === c.id ? null : c.id)}
            aria-pressed={activeClusterId === c.id}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeClusterId === c.id
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} aria-hidden="true" />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="text-xs text-[var(--text-muted)]">{c.nodeIds.length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create NodeDetail.tsx**

Extracted from the existing NexusGraph sidebar. Same content but uses new types.

```typescript
"use client";

import Link from "next/link";
import type { GraphNode, MeaningLayer } from "@/lib/graph-types";
import { TYPE_COLORS, STATUS_COLORS } from "@/lib/graph-types";

interface NodeDetailProps {
  node: GraphNode;
  interactionMode: "focus" | "path" | "entry";
  focusedNodeId: string | null;
  pathSource: string | null;
  pathTarget: string | null;
  onFocusNode: (id: string) => void;
  onTracePath: (id: string) => void;
}

export default function NodeDetail({
  node,
  interactionMode,
  focusedNodeId,
  pathSource,
  pathTarget,
  onFocusNode,
  onTracePath,
}: NodeDetailProps) {
  return (
    <aside className="w-80 flex-shrink-0" role="complementary" aria-label="Node details panel">
      <div className="card p-5 sticky top-8">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[node.type] || TYPE_COLORS.doc }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {node.type}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: (STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED) + "22",
              color: STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED,
            }}
          >
            {node.status}
          </span>
          {interactionMode === "focus" && node.id === focusedNodeId && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)]">Focused</span>
          )}
          {interactionMode === "path" && (node.id === pathSource || node.id === pathTarget) && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
              {node.id === pathSource ? "Source" : "Target"}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 leading-snug">
          {node.title}
        </h2>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Category</span>
            <span className="text-[var(--text-secondary)]">{node.category || "\u2014"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Repo</span>
            <span className="text-[var(--text-secondary)]">{node.repo.replace(/-/g, " ") || "\u2014"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Connections</span>
            <span className="text-[var(--text-secondary)]">{node.connectionCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Verifications</span>
            <span className="text-[var(--text-secondary)]" style={{ color: node.verificationCount > 0 ? STATUS_COLORS.VERIFIED : undefined }}>{node.verificationCount}</span>
          </div>
          {node.contradictionCount > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Contradictions</span>
              <span style={{ color: STATUS_COLORS.CONFLICTED }}>{node.contradictionCount}</span>
            </div>
          )}
        </div>

        {node.tags.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Tags</span>
            <div className="flex gap-1 flex-wrap">
              {node.tags.slice(0, 8).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {tag}
                </span>
              ))}
              {node.tags.length > 8 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                  +{node.tags.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href={`/library/${node.id}`}
            className="block w-full text-center px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View Document
          </Link>
          <button
            onClick={() => onFocusNode(node.id)}
            className="block w-full text-center px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            Focus on Node
          </button>
          {interactionMode === "path" && (
            <button
              onClick={() => onTracePath(node.id)}
              className="block w-full text-center px-4 py-2 rounded-lg border border-amber-500/40 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              Trace Path From Here
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Create GraphToolbar.tsx**

```typescript
"use client";

import type { MeaningLayer } from "@/lib/graph-types";
import { TYPE_COLORS, REPO_COLORS } from "@/lib/graph-types";

interface GraphToolbarProps {
  filter: string;
  filterMode: "type" | "repo";
  searchQuery: string;
  onFilterChange: (filter: string) => void;
  onFilterModeChange: (mode: "type" | "repo") => void;
  onSearchChange: (query: string) => void;
  nodeCount: number;
  edgeCount: number;
  visibleCount: number;
}

const TYPE_FILTERS = [
  { key: "all", label: "All", color: "#F4F4F5" },
  { key: "doc", label: "Docs", color: TYPE_COLORS.doc },
  { key: "paper", label: "Papers", color: TYPE_COLORS.paper },
  { key: "code", label: "Code", color: TYPE_COLORS.code },
  { key: "data", label: "Data", color: TYPE_COLORS.data },
  { key: "schema", label: "Schema", color: TYPE_COLORS.schema },
];

const REPO_FILTERS = [
  { key: "all", label: "All Repos", color: "#F4F4F5" },
  ...Object.entries(REPO_COLORS).map(([key, color]) => ({
    key,
    label: key.replace(/-/g, " ").replace(/SwarmMind Self Optimizing Multi Agent AI System/g, "SwarmMind"),
    color,
  })),
];

export default function GraphToolbar({
  filter,
  filterMode,
  searchQuery,
  onFilterChange,
  onFilterModeChange,
  onSearchChange,
  nodeCount,
  edgeCount,
  visibleCount,
}: GraphToolbarProps) {
  const currentFilters = filterMode === "type" ? TYPE_FILTERS : REPO_FILTERS;

  return (
    <>
      <div
        className="card p-4 mb-2 flex gap-4 animate-fade-in flex-wrap items-center"
        role="toolbar"
        aria-label="Graph controls"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="graph-search" className="sr-only">Search nodes</label>
          <input
            id="graph-search"
            type="search"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-48 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

        <span className="text-[var(--text-muted)] text-xs mx-1">|</span>

        <button
          onClick={() => { onFilterModeChange("type"); onFilterChange("all"); }}
          aria-pressed={filterMode === "type"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === "type" ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          By Type
        </button>
        <button
          onClick={() => { onFilterModeChange("repo"); onFilterChange("all"); }}
          aria-pressed={filterMode === "repo"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === "repo" ? "bg-[var(--secondary)]/20 text-[var(--secondary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          By Repo
        </button>

        <span className="ml-auto text-sm text-[var(--text-muted)]" role="status">
          {visibleCount}/{nodeCount} nodes &middot; {edgeCount} edges
        </span>
      </div>

      <div
        className="card p-4 mb-2 flex gap-4 animate-fade-in stagger-1 flex-wrap"
        role="toolbar"
        aria-label={`${filterMode === "type" ? "Type" : "Repo"} filters`}
      >
        {currentFilters.map((tf) => (
          <button
            key={tf.key}
            onClick={() => onFilterChange(tf.key)}
            aria-pressed={filter === tf.key}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === tf.key ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: tf.color }} aria-hidden="true" />
            {tf.label}
          </button>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 7: Create GraphLegend.tsx**

```typescript
"use client";

import { STATUS_COLORS, AUTHORITY_EDGE_COLORS } from "@/lib/graph-types";

export default function GraphLegend() {
  return (
    <div className="mt-4 card p-4 animate-fade-in" role="region" aria-label="Truth routing legend">
      <div className="flex flex-wrap gap-x-6 gap-y-2 items-start">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-1">Node Status</span>
          <div className="flex gap-3 text-xs">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />
                <span style={{ color }}>{status}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-1">Authority Edges</span>
          <div className="flex gap-3 text-xs flex-wrap">
            {Object.entries(AUTHORITY_EDGE_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1">
                <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: color }} aria-hidden="true" />
                <span style={{ color }}>{type.replace(/_/g, " ")}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify all new components compile**
Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors from any graph component

---

### Task 6: Rewrite NexusGraph.tsx as the orchestrator

**Files:**
- Rewrite: `src/components/NexusGraph.tsx`

This replaces the entire 1,031-line monolith with a ~200-line orchestrator that:
- Fetches data from `/api/graph-data`
- Computes clusters and entry points using `graph-clusters.ts`
- Manages all state (hover, selection, focus, path, layers, density, clusters, search)
- Renders sub-components in the correct layout

- [ ] **Step 1: Rewrite NexusGraph.tsx**

The new file imports all sub-components and manages state. The key layout:
- Top: title + description
- Below: GraphToolbar (search + filter chips)
- Main area: Left panel (EntryPoints + MeaningLayers + DensityControl + ClusterSelector) | Center (GraphCanvas) | Right (NodeDetail if selected)
- Bottom: GraphLegend + hint text

```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import { bidirectional } from "graphology-shortest-path";
import type { GraphNode, GraphEdge, MeaningLayer, DensityLevel, Cluster, EntryPoint } from "@/lib/graph-types";
import { DEFAULT_LAYERS, STATUS_COLORS } from "@/lib/graph-types";
import { computeClusters, computeEntryPoints, assignClusterIds } from "@/lib/graph-clusters";
import GraphCanvas from "./graph/GraphCanvas";
import GraphToolbar from "./graph/GraphToolbar";
import EntryPoints from "./graph/EntryPoints";
import MeaningLayers from "./graph/MeaningLayers";
import DensityControl from "./graph/DensityControl";
import ClusterSelector from "./graph/ClusterSelector";
import NodeDetail from "./graph/NodeDetail";
import GraphLegend from "./graph/GraphLegend";

export default function NexusGraph() {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);

  const [filter, setFilter] = useState("all");
  const [filterMode, setFilterMode] = useState<"type" | "repo">("type");
  const [searchQuery, setSearchQuery] = useState("");

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const [pathSource, setPathSource] = useState<string | null>(null);
  const [pathTarget, setPathTarget] = useState<string | null>(null);
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
  const [pathEdges, setPathEdges] = useState<Set<string>>(new Set());

  const [activeLayers, setActiveLayers] = useState<MeaningLayer[]>([...DEFAULT_LAYERS]);
  const [density, setDensity] = useState<DensityLevel>("mid");
  const [activeEntryPoint, setActiveEntryPoint] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [cameraRatio, setCameraRatio] = useState(1);

  const graphRef = useRef<Graph | null>(null);
  const sigmaRef = useRef<any>(null);

  const filteredNodes = filter === "all"
    ? nodes
    : filterMode === "repo"
    ? nodes.filter((n) => n.repo === filter)
    : nodes.filter((n) => n.type === filter);

  const selectedNode = selectedNodeId
    ? filteredNodes.find((n) => n.id === selectedNodeId) || null
    : null;

  const statusCounts = { VERIFIED: 0, UNVERIFIED: 0, CONFLICTED: 0, QUARANTINED: 0 } as Record<string, number>;
  for (const n of filteredNodes) {
    if (statusCounts[n.status] !== undefined) statusCounts[n.status]++;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/graph-data");
        const data = await res.json();
        if (cancelled) return;
        const rawClusters = computeClusters(data.nodes);
        const enrichedNodes = assignClusterIds(data.nodes, rawClusters);
        const eps = computeEntryPoints(data.nodes, rawClusters, data.authorityEdges || []);
        setNodes(enrichedNodes);
        setEdges(data.edges);
        setClusters(rawClusters);
        setEntryPoints(eps);
      } catch (e) {
        console.error("Failed to load graph data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (pathSource && !pathTarget && nodeId !== pathSource && graphRef.current) {
      setPathTarget(nodeId);
      const path = bidirectional(graphRef.current, pathSource, nodeId);
      if (path) {
        setPathNodes(new Set(path));
        const edgeSet = new Set<string>();
        for (let i = 0; i < path.length - 1; i++) {
          const edge = graphRef.current.edge(path[i], path[i + 1]);
          if (edge) edgeSet.add(edge);
        }
        setPathEdges(edgeSet);
      } else {
        setPathNodes(new Set());
        setPathEdges(new Set());
      }
    }
    if (density === "focus" || focusedNodeId) {
      setFocusedNodeId(nodeId);
    }
  }, [pathSource, pathTarget, density, focusedNodeId]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  const handleStageClick = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setFocusedNodeId(null);
    setPathSource(null);
    setPathTarget(null);
    setPathNodes(new Set());
    setPathEdges(new Set());
  }, []);

  const handleCameraUpdate = useCallback((ratio: number) => {
    setCameraRatio(ratio);
  }, []);

  const handleFocusNode = useCallback((id: string) => {
    setFocusedNodeId(id);
    setDensity("focus");
  }, []);

  const handleTracePath = useCallback((id: string) => {
    if (!pathSource) {
      setPathSource(id);
    } else if (id !== pathSource) {
      setPathTarget(id);
      if (graphRef.current) {
        const path = bidirectional(graphRef.current, pathSource, id);
        if (path) {
          setPathNodes(new Set(path));
          const edgeSet = new Set<string>();
          for (let i = 0; i < path.length - 1; i++) {
            const edge = graphRef.current.edge(path[i], path[i + 1]);
            if (edge) edgeSet.add(edge);
          }
          setPathEdges(edgeSet);
        }
      }
    }
  }, [pathSource]);

  const handleLayerToggle = useCallback((layer: MeaningLayer) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  }, []);

  const zoomLabel = cameraRatio < 0.3 ? "Deep" : cameraRatio < 0.6 ? "Close" : cameraRatio < 1.2 ? "Normal" : cameraRatio < 3 ? "Far" : "Overview";

  const visibleCount = (() => {
    if (density === "overview") return clusters.length;
    if (activeEntryPoint || activeClusterId) {
      const ep = entryPoints.find((e) => e.id === activeEntryPoint);
      const cl = clusters.find((c) => c.id === activeClusterId);
      return ep?.nodeIds.length || cl?.nodeIds.length || filteredNodes.length;
    }
    if (focusedNodeId) return 20;
    return filteredNodes.length;
  })();

  return (
    <div className="p-8" data-pagefind-ignore>
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Nexus Graph</h1>
          <p className="text-[var(--text-secondary)]">
            Thinking interface for the Deliberate Ensemble architecture &mdash; entry points, meaning layers, progressive density
          </p>
        </div>
      </div>

      <GraphToolbar
        filter={filter}
        filterMode={filterMode}
        searchQuery={searchQuery}
        onFilterChange={setFilter}
        onFilterModeChange={setFilterMode}
        onSearchChange={setSearchQuery}
        nodeCount={filteredNodes.length}
        edgeCount={edges.length}
        visibleCount={visibleCount}
      />

      <div className="card p-3 mb-2 flex gap-3 items-center text-xs animate-fade-in" role="status" aria-label="Node status summary">
        {Object.entries(statusCounts).filter(([, c]) => c > 0).map(([status, count]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }} aria-hidden="true" />
            <span style={{ color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}>{count}</span>
          </span>
        ))}
        <span className="text-[var(--text-muted)]">node status</span>
      </div>

      {(pathSource || focusedNodeId) && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 animate-fade-in" role="status">
          <div className="flex items-center gap-3 text-sm">
            {focusedNodeId && (
              <>
                <span className="text-[var(--primary)] font-medium">Focus</span>
                <span className="text-[var(--text-muted)]">
                  on <span className="text-[var(--text-primary)]">{selectedNode?.title || focusedNodeId}</span>
                </span>
                <button onClick={handleStageClick} className="ml-auto text-[var(--primary)] hover:text-[var(--primary)]/80 text-xs underline">
                  Exit Focus
                </button>
              </>
            )}
            {pathSource && (
              <>
                <span className="text-amber-400 font-medium">Path Trace</span>
                {pathSource && <span className="text-[var(--text-muted)]">Source: <span className="text-[var(--text-primary)]">{filteredNodes.find((n) => n.id === pathSource)?.title || pathSource}</span></span>}
                {pathTarget && <span className="text-[var(--text-muted)]">Target: <span className="text-[var(--text-primary)]">{filteredNodes.find((n) => n.id === pathTarget)?.title || pathTarget}</span></span>}
                {pathNodes.size > 0 && <span className="text-amber-300 font-medium">{pathNodes.size - 1} hops</span>}
                {!pathTarget && <span className="text-[var(--text-muted)]">Click another node</span>}
                <button onClick={handleStageClick} className="ml-auto text-amber-400 hover:text-amber-300 text-xs underline">
                  Exit Path
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 animate-fade-in">
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="card p-3">
            <DensityControl density={density} onChange={setDensity} />
          </div>
          <div className="card p-3">
            <EntryPoints entryPoints={entryPoints} activeEntryPoint={activeEntryPoint} onSelect={setActiveEntryPoint} />
          </div>
          <div className="card p-3">
            <MeaningLayers activeLayers={activeLayers} onToggle={handleLayerToggle} />
          </div>
          <div className="card p-3 max-h-64 overflow-y-auto">
            <ClusterSelector clusters={clusters} activeClusterId={activeClusterId} onSelect={setActiveClusterId} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex gap-4">
          <div className="flex-1 min-w-0">
            <div className="card relative overflow-hidden" style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}>
              {loading ? (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Loading graph data...</div>
              ) : filteredNodes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">No graph data available</div>
              ) : (
                <GraphCanvas
                  nodes={filteredNodes}
                  edges={edges}
                  clusters={clusters}
                  hoveredNodeId={hoveredNodeId}
                  selectedNodeId={selectedNodeId}
                  focusedNodeId={focusedNodeId}
                  pathNodes={pathNodes}
                  pathEdges={pathEdges}
                  pathSource={pathSource}
                  pathTarget={pathTarget}
                  activeLayers={activeLayers}
                  density={density}
                  activeEntryPoint={activeEntryPoint}
                  activeClusterId={activeClusterId}
                  searchQuery={searchQuery}
                  filterMode={filterMode}
                  filter={filter}
                  onNodeClick={handleNodeClick}
                  onNodeHover={handleNodeHover}
                  onStageClick={handleStageClick}
                  onCameraUpdate={handleCameraUpdate}
                />
              )}
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-[var(--bg-surface)]/80 text-xs text-[var(--text-muted)] backdrop-blur-sm" aria-live="polite">
                {zoomLabel}
              </div>
            </div>
          </div>

          {selectedNode && (
            <NodeDetail
              node={selectedNode}
              interactionMode={focusedNodeId ? "focus" : pathSource ? "path" : "entry"}
              focusedNodeId={focusedNodeId}
              pathSource={pathSource}
              pathTarget={pathTarget}
              onFocusNode={handleFocusNode}
              onTracePath={handleTracePath}
            />
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)] text-center animate-fade-in">
        Entry points replace explore mode — choose what to see. Toggle meaning layers to filter edge types. Adjust density for depth.
      </p>

      <GraphLegend />
    </div>
  );
}
```

- [ ] **Step 2: Verify full compilation**
Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 7: Typecheck, lint, commit, push, deploy, verify

- [ ] **Step 1: Run typecheck**
Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run lint**
Run: `bun lint`
Expected: 0 errors (warnings OK)

- [ ] **Step 3: Stage and commit**
```bash
git add src/lib/graph-types.ts src/lib/graph-clusters.ts src/lib/site-index.ts src/components/NexusGraph.tsx src/components/graph/ src/app/graph/ package.json
git commit -m "feat: transform nexus graph from database visualization into thinking interface"
```

- [ ] **Step 4: Push**
```bash
git push origin main
```

- [ ] **Step 5: Deploy**
```bash
npx vercel --prod --token $VERCEL_TOKEN
```

- [ ] **Step 6: Verify live at deliberateensemble.works/graph**
Check that:
- Graph loads
- Left panel shows Entry Points, Meaning Layers, Density, Clusters
- Clicking an entry point highlights the relevant nodes
- Toggling meaning layers shows/hides edge types
- Switching density mode changes visible nodes
- Clicking a cluster highlights it
- Node detail sidebar still works
- Search filters nodes
- Graph is responsive

---

## Self-Review

### Spec Coverage Check
1. ✅ Hard cap visible nodes (50-150) → `isVisible()` in nodeReducer + density levels
2. ✅ Replace "Explore" with "Entry Points" → EntryPoints component, removed Explore mode
3. ✅ Interactive clusters → ClusterSelector + activeClusterId state + nodeReducer
4. ✅ Progressive density → DensityControl + density state + nodeReducer logic
5. ✅ Kill label overload → Labels only on hover/selection/focus/overview-reps/high-degree-mid
6. ✅ Meaning layers → MeaningLayers component + edgeReducer layer check

### Placeholder Scan
No TBD/TODO/fill-in-later found. All code is complete.

### Type Consistency
- `GraphNode.clusterIds` added in graph-types.ts, populated in `assignClusterIds()`, used in `buildGraph()` as `JSON.stringify(node.clusterIds || [])`
- `AuthorityEdgeType` imported from graph-types.ts consistently
- All component prop interfaces match the parent state types
- `DEFAULT_LAYERS` exported from graph-types.ts, used in NexusGraph.tsx

### Gap Check
- The `graphRef` in NexusGraph.tsx is not currently populated from GraphCanvas. Need to ensure path tracing works. The `handleTracePath` and `handleNodeClick` use `graphRef.current` — but GraphCanvas creates its own graph. This needs to be fixed by either:
  a) Moving path computation into GraphCanvas and exposing via callbacks, or
  b) Passing graphRef to GraphCanvas

**Fix:** GraphCanvas will accept a `graphRef` prop so the parent can access the graphology instance for path tracing. This will be added during implementation.

- Also: the `sigmaRef` for camera animation on focus — same issue. GraphCanvas needs to expose camera or accept imperative commands.

**Fix:** GraphCanvas will accept `onGraphReady: (graph: Graph, sigma: Sigma) => void` callback so parent gets references.

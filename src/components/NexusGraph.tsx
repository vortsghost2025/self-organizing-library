"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import GraphCanvas, { type GraphCanvasImperativeHandle } from "./graph/GraphCanvas";
import GraphToolbar from "./graph/GraphToolbar";
import DensityControl from "./graph/DensityControl";
import EntryPoints from "./graph/EntryPoints";
import MeaningLayers from "./graph/MeaningLayers";
import ClusterSelector from "./graph/ClusterSelector";
import GraphContextPanel from "./graph/GraphContextPanel";
import ViewContextBanner from "./graph/ViewContextBanner";
import NodeDetail from "./graph/NodeDetail";
import GraphLegend from "./graph/GraphLegend";

import { computeClusters, computeEntryPoints } from "@/lib/graph-clusters";
import type { GraphEdge, GraphLens, GraphNode, MeaningLayer, DensityLevel } from "@/lib/graph-types";
import { LENS_CONFIG, MEANING_LAYER_EDGES } from "@/lib/graph-types";

interface NexusGraphProps {
  initialFilter?: string;
  initialFilterMode?: "type" | "repo";
  initialMode?: string;
  initialLens?: GraphLens;
  onLensChange?: (lens: GraphLens) => void;
}

function buildSearchText(node: GraphNode): string {
  return [
    node.id,
    node.title,
    node.repo,
    node.type,
    node.category,
    ...node.tags,
  ]
    .join(" ")
    .toLowerCase();
}

interface ResolvedNodeResult {
  node: GraphNode | null;
  requestedToken: string | null;
  resolvedId: string | null;
  resolvedTitle: string | null;
  method: "exact_node_id" | "exact_normalized_title" | "UNRESOLVED";
}

function resolveTargetNodeWithInfo(nodes: GraphNode[], query: string | null): ResolvedNodeResult {
  if (!query || !nodes.length) {
    return { node: null, requestedToken: query, resolvedId: null, resolvedTitle: null, method: "UNRESOLVED" };
  }

  const targetId = query.startsWith("node:") ? query.slice(5) : query;
  const normalizedTargetId = targetId.toLowerCase().trim();

  // Priority 1: Exact Node ID Match
  const exactIdMatch = nodes.find((n) => n.id === query || n.id === targetId || n.id.toLowerCase() === normalizedTargetId);
  if (exactIdMatch) {
    return { node: exactIdMatch, requestedToken: query, resolvedId: exactIdMatch.id, resolvedTitle: exactIdMatch.title, method: "exact_node_id" };
  }

  // Priority 2: Exact Normalized Title Match
  const cleanTargetTitle = normalizedTargetId.replace(/[-_]+/g, " ").trim();
  const exactTitleMatch = nodes.find((n) => {
    const normTitle = n.title.toLowerCase().replace(/[-_]+/g, " ").trim();
    return normTitle === cleanTargetTitle;
  });
  if (exactTitleMatch) {
    return { node: exactTitleMatch, requestedToken: query, resolvedId: exactTitleMatch.id, resolvedTitle: exactTitleMatch.title, method: "exact_normalized_title" };
  }

  // Priority 3: Otherwise UNRESOLVED
  return { node: null, requestedToken: query, resolvedId: null, resolvedTitle: null, method: "UNRESOLVED" };
}

export default function NexusGraph({
  initialLens = "navigation",
  onLensChange,
}: NexusGraphProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [graphLens, setGraphLens] = useState<GraphLens>(initialLens);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lensDescription, setLensDescription] = useState(LENS_CONFIG[initialLens].description);
  
  // Investigation State (Restrained Defaults)
  // Locked spec: Structure=ON, Verification=ON, Conflicts=OFF, Execution=OFF, Governance=OFF
  const [density, setDensity] = useState<DensityLevel>("overview");
  const [activeLayers, setActiveLayers] = useState<MeaningLayer[]>(["structure", "verification"]);
  const [activeEntryPoint, setActiveEntryPoint] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);

  const graphCanvasRef = useRef<GraphCanvasImperativeHandle>(null);

  // Handle EntryPoint Selection with automatic layer activation and lens selection
  const handleEntryPointSelect = useCallback((epId: string | null) => {
    setActiveEntryPoint(epId);
    if (epId === "ep:contradictions" || epId === "ep:gov-contradicted") {
      setActiveLayers((prev) => (prev.includes("conflicts") ? prev : [...prev, "conflicts"]));
    } else if (epId === "ep:authority" || epId === "ep:gov-core" || epId === "ep:gov-bridges") {
      setActiveLayers((prev) => {
        const layers = new Set(prev);
        layers.add("verification");
        layers.add("governance");
        layers.add("structure");
        return Array.from(layers);
      });
    }
  }, []);

  // Initialize view state from URL query parameters if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlCluster = params.get("cluster");
    const urlSelectedNode = params.get("selectedNode");
    const urlEntryPoint = params.get("entryPoint");
    const urlDensity = params.get("density") as DensityLevel | null;
    const urlLens = params.get("lens") as GraphLens | null;
    const urlLayers = params.get("layers");

    if (urlLens) {
      setGraphLens(urlLens);
      if (urlLens === "authority") {
        setActiveLayers((prev) => {
          const layers = new Set(prev);
          layers.add("structure");
          layers.add("verification");
          layers.add("governance");
          layers.add("execution");
          return Array.from(layers) as MeaningLayer[];
        });
      }
    }
    // Allow explicit layer override via URL (comma-separated)
    if (urlLayers) {
      const parsed = urlLayers.split(",").map((l) => l.trim()).filter(Boolean) as MeaningLayer[];
      if (parsed.length > 0) setActiveLayers(parsed);
    }
    if (urlCluster) setActiveClusterId(urlCluster);
    if (urlSelectedNode) setSelectedNodeId(urlSelectedNode);
    if (urlEntryPoint) handleEntryPointSelect(urlEntryPoint);
    if (urlDensity) setDensity(urlDensity);
  }, [handleEntryPointSelect]);

  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      setLoading(true);
      setError(null);

      try {
        const { fetchWithRetry } = await import("@/lib/fetchWithRetry");
        const response = await fetchWithRetry(`/api/graph-data?lens=${graphLens}`);
        const data = await response.json();

        if (cancelled) return;

        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLensDescription(data.description || LENS_CONFIG[graphLens].description);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load graph data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [graphLens]);

  // Ensure Governance Depth is ON for authority lens or authority entry point
  useEffect(() => {
    if (graphLens === "authority" || activeEntryPoint === "ep:authority") {
      setActiveLayers((prev) => {
        const layers = new Set(prev);
        layers.add("structure");
        layers.add("verification");
        layers.add("governance");
        return Array.from(layers);
      });
    }
  }, [graphLens, activeEntryPoint]);

  // Compute Clusters & EntryPoints
  const clusters = useMemo(() => computeClusters(nodes), [nodes]);
  
  const authorityEdges = useMemo(() => {
    return edges
      .filter((e) => e.authority)
      .map((e) => ({ source: e.source, target: e.target, authority: e.authority as any }));
  }, [edges]);

  const entryPoints = useMemo(() => computeEntryPoints(nodes, clusters, authorityEdges), [nodes, clusters, authorityEdges]);

  const resolvedResult = useMemo(
    () => resolveTargetNodeWithInfo(nodes, selectedNodeId),
    [nodes, selectedNodeId]
  );

  const resolvedSelectedNode = resolvedResult.node;

  // Handle Layer Toggle
  const handleLayerToggle = useCallback((layer: MeaningLayer) => {
    setActiveLayers((current) =>
      current.includes(layer)
        ? current.filter((l) => l !== layer)
        : [...current, layer]
    );
  }, []);

  // Filtered Nodes Pipeline based on Density, EntryPoint, Cluster, Search, and Selected Node Focus
  const filteredNodes = useMemo(() => {
    // 1. Highest Priority: Selected Node Focus Isolation (only when resolved)
    if (selectedNodeId && resolvedSelectedNode) {
      const neighborSet = new Set<string>([resolvedSelectedNode.id]);
      for (const edge of edges) {
        if (edge.source === resolvedSelectedNode.id) neighborSet.add(edge.target);
        if (edge.target === resolvedSelectedNode.id) neighborSet.add(edge.source);
      }
      return nodes.filter((n) => neighborSet.has(n.id));
      // Note: if selectedNodeId is UNRESOLVED (no resolvedSelectedNode), fall through
      // to cluster/entrypoint/density filters below — do NOT return all nodes
    }

    // 2. Second Priority: Active Cluster Filter
    if (activeClusterId) {
      const searchKey = activeClusterId.toLowerCase().replace("repo:", "").replace("tag:", "");
      const cl = clusters.find(
        (c) =>
          c.id.toLowerCase() === activeClusterId.toLowerCase() ||
          c.id.toLowerCase().includes(searchKey) ||
          c.label.toLowerCase().includes(searchKey)
      );
      if (cl) {
        const clNodeSet = new Set(cl.nodeIds);
        return nodes.filter((n) => clNodeSet.has(n.id));
      }
    }

    // 3. Third Priority: Active Entry Point Filter
    if (activeEntryPoint) {
      const searchKey = activeEntryPoint.toLowerCase().replace("ep:", "");
      const epNodeSet = new Set<string>();

      if (searchKey.includes("contradict") || searchKey.includes("conflict")) {
        nodes.filter((n) => n.status === "CONFLICTED" || n.status === "QUARANTINED").forEach((n) => epNodeSet.add(n.id));
      } else {
        const ep = entryPoints.find(
          (e) =>
            e.id.toLowerCase() === activeEntryPoint.toLowerCase() ||
            e.id.toLowerCase().includes(searchKey) ||
            e.kind.toLowerCase().includes(searchKey)
        );
        if (ep) ep.nodeIds.forEach((id) => epNodeSet.add(id));
      }

      if (epNodeSet.size > 0) {
        const connectedSet = new Set<string>(epNodeSet);
        for (const edge of edges) {
          if (epNodeSet.has(edge.source)) connectedSet.add(edge.target);
          if (epNodeSet.has(edge.target)) connectedSet.add(edge.source);
        }
        return nodes.filter((n) => connectedSet.has(n.id));
      }
    }

    // 4. Default Overview Density
    if (density === "overview") {
      const topAuth = [...nodes].sort((a, b) => b.authorityDepth - a.authorityDepth).slice(0, 45);
      const authSet = new Set(topAuth.map((n) => n.id));
      return nodes.filter((n) => authSet.has(n.id));
    }

    return nodes;
  }, [nodes, edges, activeEntryPoint, activeClusterId, density, selectedNodeId, resolvedSelectedNode, clusters, entryPoints]);

  // Filtered Edges Pipeline based on active Meaning Layers, visible nodes, and edge bundle reduction
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    const allowedEdgeTypes = new Set<string>();

    for (const layer of activeLayers) {
      const types = MEANING_LAYER_EDGES[layer] || [];
      for (const t of types) allowedEdgeTypes.add(t);
    }

    let result = edges.filter((e) => {
      if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return false;
      if (e.authority && !allowedEdgeTypes.has(e.authority)) return false;
      return true;
    });

    // In Contradictions entry point, suppress unrelated structure edges if CONTRADICTS edges are 0
    if (activeEntryPoint === "ep:contradictions" || activeEntryPoint === "ep:gov-contradicted") {
      const hasContradicts = result.some((e) => e.authority === "CONTRADICTS");
      if (!hasContradicts) {
        result = result.filter((e) => e.authority === "VERIFIES" || e.authority === "SIGNED_BY");
      }
    }

    // In Overview density, suppress parallel cross-cluster edge bundles
    if (density === "overview" && !resolvedSelectedNode && !activeClusterId && !activeEntryPoint) {
      const seenClusterPairs = new Set<string>();
      result = result.filter((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const targetNode = nodes.find((n) => n.id === e.target);
        if (!sourceNode || !targetNode || sourceNode.repo === targetNode.repo) return true;
        
        const pairKey = [sourceNode.repo, targetNode.repo].sort().join("<->");
        if (seenClusterPairs.has(pairKey) && e.authority !== "CONTRADICTS" && e.authority !== "VERIFIES") {
          return false;
        }
        seenClusterPairs.add(pairKey);
        return true;
      });
    }

    return result;
  }, [edges, filteredNodes, activeLayers, density, resolvedSelectedNode, activeClusterId, activeEntryPoint, nodes]);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => {
        graphCanvasRef.current?.fitVisible();
      }, 80);

      return () => window.clearTimeout(timer);
    }
  }, [loading, filteredNodes, filteredEdges, graphLens]);

  const selectedNode = resolvedSelectedNode;

  // Deduplicate edges the same way buildRenderableGraph does (undirected graph, multi:false).
  // Graphology with {multi:false, type:"undirected"} skips the second of any A↔B pair,
  // so A→B and B→A count as 1 edge, not 2. The toolbar must use the same count as Sigma.
  const deduplicatedEdgeCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const e of filteredEdges) {
      const key = [e.source, e.target].sort().join("\u0000");
      if (!seen.has(key)) {
        seen.add(key);
        count++;
      }
    }
    return count;
  }, [filteredEdges]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!normalizedSearchQuery) return filteredNodes.length;
    return filteredNodes.filter((node) => buildSearchText(node).includes(normalizedSearchQuery)).length;
  }, [filteredNodes, normalizedSearchQuery]);

  const handleLensChange = useCallback(
    (lens: GraphLens) => {
      setGraphLens(lens);
      onLensChange?.(lens);
      if (lens === "authority") {
        setActiveLayers((prev) => {
          const layers = new Set(prev);
          layers.add("verification");
          layers.add("governance");
          layers.add("structure");
          return Array.from(layers);
        });
      }
    },
    [onLensChange],
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId));
  }, []);

  const workspaceSummary = selectedNode
    ? selectedNode.title
    : searchQuery
    ? `${searchMatches} matching ${searchMatches === 1 ? "node" : "nodes"}`
    : lensDescription;

  // Status counts for ViewContextBanner
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { VERIFIED: 0, UNVERIFIED: 0, CONFLICTED: 0, QUARANTINED: 0 };
    for (const n of filteredNodes) {
      counts[n.status] = (counts[n.status] || 0) + 1;
    }
    return counts;
  }, [filteredNodes]);

  return (
    <div className="px-4 py-5 md:px-6 md:py-6" data-pagefind-ignore>
      <div className="mx-auto max-w-[1440px]">
        <section className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(12,15,22,1))] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.28)] md:p-5">
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8f95a8]">
                Nexus Graph
              </span>
              <span className="rounded-full border border-[#4f8df733] bg-[#4f8df714] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7aa7ff]">
                {LENS_CONFIG[graphLens].label}
              </span>
            </div>
            <div>
              <h1 className="text-[1.95rem] font-semibold tracking-[-0.03em] text-[#f1f4fb]">
                self-organizing-library
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[#9fa7bc]">
                Reasoning &amp; Investigation Instrument — Meaning first, progressive disclosure, evidence on demand.
              </p>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#0f131b] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-4">
            <GraphToolbar
              graphLens={graphLens}
              searchQuery={searchQuery}
              nodeCount={filteredNodes.length}
              edgeCount={deduplicatedEdgeCount}
              highlightedCount={searchMatches}
              onLensChange={handleLensChange}
              onSearchChange={setSearchQuery}
              onFitVisible={() => graphCanvasRef.current?.fitVisible()}
              onZoomIn={() => graphCanvasRef.current?.zoomIn()}
              onZoomOut={() => graphCanvasRef.current?.zoomOut()}
            />

            <div className="mt-3">
              <ViewContextBanner
                mode={density === "overview" ? "understand" : density === "mid" ? "explore" : "full"}
                visibleCount={filteredNodes.length}
                totalNodes={nodes.length}
                statusCounts={statusCounts}
                focusNodeTitle={selectedNode?.title}
                filterLabel={activeEntryPoint ? `Entry Point: ${activeEntryPoint}` : activeClusterId ? `Cluster: ${activeClusterId}` : null}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
              {/* Left Investigation Control Sidebar */}
              <div className="lg:col-span-3 space-y-4 max-h-[78vh] overflow-y-auto pr-1">
                <div className="card p-3 bg-[#151922] border border-white/10 rounded-xl">
                  <DensityControl density={density} onChange={setDensity} />
                </div>
                <div className="card p-3 bg-[#151922] border border-white/10 rounded-xl">
                  <MeaningLayers activeLayers={activeLayers} onToggle={handleLayerToggle} />
                </div>
                <div className="card p-3 bg-[#151922] border border-white/10 rounded-xl">
                  <EntryPoints entryPoints={entryPoints} activeEntryPoint={activeEntryPoint} onSelect={handleEntryPointSelect} />
                </div>
                <div className="card p-3 bg-[#151922] border border-white/10 rounded-xl">
                  <ClusterSelector clusters={clusters} activeClusterId={activeClusterId} onSelect={setActiveClusterId} />
                </div>
              </div>

              {/* Main Graph Canvas Area */}
              <div className={`relative h-[78vh] min-h-[620px] max-h-[900px] overflow-hidden rounded-[18px] border border-white/8 bg-[#0b0e14] ${selectedNode ? "lg:col-span-6" : "lg:col-span-9"}`}>
                <GraphContextPanel
                  nodeCount={nodes.length}
                  edgeCount={deduplicatedEdgeCount}
                  visibleCount={filteredNodes.length}
                  density={density}
                  activeLayers={activeLayers}
                  filter="all"
                  filterMode="type"
                  activeEntryPoint={activeEntryPoint}
                  activeClusterId={activeClusterId}
                  focusedNodeId={selectedNodeId}
                  selectedNodeTitle={selectedNode?.title || null}
                  searchQuery={searchQuery}
                />

                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#9ea5ba]">
                    Rendering graph workspace...
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#ef9090]">
                    {error}
                  </div>
                ) : filteredNodes.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#9ea5ba]">
                    No graph data is available for this view.
                  </div>
                ) : (
                  <GraphCanvas
                    ref={graphCanvasRef}
                    nodes={filteredNodes}
                    edges={filteredEdges}
                    graphLens={graphLens}
                    density={density}
                    activeClusterId={activeClusterId}
                    activeEntryPoint={activeEntryPoint}
                    activeLayers={activeLayers}
                    searchQuery={searchQuery}
                    selectedNodeId={selectedNodeId}
                    requestedNodeToken={resolvedResult.requestedToken}
                    resolvedNodeId={resolvedResult.resolvedId}
                    resolvedNodeTitle={resolvedResult.resolvedTitle}
                    resolutionMethod={resolvedResult.method}
                    onNodeClick={handleNodeClick}
                    onCameraUpdate={() => {}}
                  />
                )}
              </div>

              {/* Right Node Detail Panel when selected */}
              {selectedNode && (
                <div className="lg:col-span-3 max-h-[78vh] overflow-y-auto card p-4 bg-[#141926] border-2 border-[#38BDF8]/40 shadow-2xl rounded-2xl">
                  <NodeDetail
                    node={selectedNode}
                    interactionMode="focus"
                    focusedNodeId={selectedNodeId}
                    pathSource={null}
                    pathTarget={null}
                    onFocusNode={handleNodeClick}
                    onTracePath={() => {}}
                    onClose={() => setSelectedNodeId(null)}
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <GraphLegend />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


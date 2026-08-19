"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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
import { getFeaturedRepositories, getListedRepositories } from "@/lib/repo-registry";

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
  const [density, setDensity] = useState<DensityLevel>("overview");
  const [activeLayers, setActiveLayers] = useState<MeaningLayer[]>(["structure", "verification"]);
  const [activeEntryPoint, setActiveEntryPoint] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("overview");

  const graphCanvasRef = useRef<GraphCanvasImperativeHandle>(null);

  const featuredRepos = useMemo(() => getFeaturedRepositories(), []);
  const listedRepos = useMemo(() => getListedRepositories(), []);

  // Handle EntryPoint Selection
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

  // Guided View Preset Handler
  const applyPreset = useCallback((presetId: string) => {
    setActivePreset(presetId);
    setSelectedNodeId(null);
    setSearchQuery("");

    switch (presetId) {
      case "overview":
        setDensity("overview");
        setGraphLens("navigation");
        setActiveLayers(["structure", "verification"]);
        setActiveClusterId(null);
        setActiveEntryPoint(null);
        break;
      case "lanes":
        setDensity("overview");
        setGraphLens("authority");
        setActiveLayers(["structure", "verification", "governance"]);
        setActiveClusterId(null);
        setActiveEntryPoint("ep:authority");
        break;
      case "kernel":
        setDensity("overview");
        setGraphLens("navigation");
        setActiveLayers(["structure", "execution", "verification"]);
        setActiveClusterId("repo:kernel-lane");
        setActiveEntryPoint(null);
        break;
      case "swarmmind":
        setDensity("overview");
        setGraphLens("navigation");
        setActiveLayers(["structure", "verification"]);
        setActiveClusterId("repo:SwarmMind-Self-Optimizing-Multi-Agent-AI-System");
        setActiveEntryPoint(null);
        break;
      case "library":
        setDensity("overview");
        setGraphLens("navigation");
        setActiveLayers(["structure", "verification"]);
        setActiveClusterId("repo:self-organizing-library");
        setActiveEntryPoint(null);
        break;
    }
  }, []);

  // Filtered Nodes Pipeline
  const filteredNodes = useMemo(() => {
    // 1. Highest Priority: Selected Node Focus Isolation
    if (selectedNodeId && resolvedSelectedNode) {
      const neighborSet = new Set<string>([resolvedSelectedNode.id]);
      for (const edge of edges) {
        if (edge.source === resolvedSelectedNode.id) neighborSet.add(edge.target);
        if (edge.target === resolvedSelectedNode.id) neighborSet.add(edge.source);
      }
      return nodes.filter((n) => neighborSet.has(n.id));
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

  // Filtered Edges Pipeline
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

    if (activeEntryPoint === "ep:contradictions" || activeEntryPoint === "ep:gov-contradicted") {
      const hasContradicts = result.some((e) => e.authority === "CONTRADICTS");
      if (!hasContradicts) {
        result = result.filter((e) => e.authority === "VERIFIES" || e.authority === "SIGNED_BY");
      }
    }

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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { VERIFIED: 0, UNVERIFIED: 0, CONFLICTED: 0, QUARANTINED: 0 };
    for (const n of filteredNodes) {
      counts[n.status] = (counts[n.status] || 0) + 1;
    }
    return counts;
  }, [filteredNodes]);

  return (
    <div className="px-4 pt-20 pb-8 md:pt-6 md:px-8 max-w-7xl mx-auto space-y-8" data-pagefind-ignore>
      {/* 1. Header & Architectural Purpose */}
      <section className="space-y-3 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
            Interactive Architecture
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
            38 Core Subsystems • 4 Sovereign Lanes
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          Nexus Knowledge Graph &amp; Systems Architecture
        </h1>
        <p className="text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Interactive map of Sean David Ramsingh's multi-agent AI architecture, autonomous execution loops,
          cryptographic governance policies, and reproducible verification pipelines.
        </p>
      </section>

      {/* 2. Guided Exploration Presets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Guided Exploration Presets
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Click any preset to scope the graph</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => applyPreset("overview")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === "overview" && !selectedNodeId && !activeClusterId && !activeEntryPoint
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20"
                : "bg-[#141824] border-white/10 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="text-lg mb-1" aria-hidden="true">🌐</div>
            <div className="font-semibold text-xs text-white">Full Overview</div>
            <div className="text-[11px] opacity-80 mt-0.5 truncate">Global balanced map</div>
          </button>

          <button
            onClick={() => applyPreset("lanes")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === "lanes"
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20"
                : "bg-[#141824] border-white/10 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="text-lg mb-1" aria-hidden="true">🏛️</div>
            <div className="font-semibold text-xs text-white">4 Governance Lanes</div>
            <div className="text-[11px] opacity-80 mt-0.5 truncate">Authority &amp; policy roots</div>
          </button>

          <button
            onClick={() => applyPreset("kernel")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === "kernel"
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20"
                : "bg-[#141824] border-white/10 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="text-lg mb-1" aria-hidden="true">⚡</div>
            <div className="font-semibold text-xs text-white">GPU Runtime &amp; CUDA</div>
            <div className="text-[11px] opacity-80 mt-0.5 truncate">Kernel execution engine</div>
          </button>

          <button
            onClick={() => applyPreset("swarmmind")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === "swarmmind"
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20"
                : "bg-[#141824] border-white/10 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="text-lg mb-1" aria-hidden="true">🧠</div>
            <div className="font-semibold text-xs text-white">Multi-Agent Deliberation</div>
            <div className="text-[11px] opacity-80 mt-0.5 truncate">SwarmMind idea loops</div>
          </button>

          <button
            onClick={() => applyPreset("library")}
            className={`p-3 rounded-xl border text-left transition-all ${
              activePreset === "library"
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20"
                : "bg-[#141824] border-white/10 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
            }`}
          >
            <div className="text-lg mb-1" aria-hidden="true">📚</div>
            <div className="font-semibold text-xs text-white">Research &amp; Evidence</div>
            <div className="text-[11px] opacity-80 mt-0.5 truncate">Library &amp; proof systems</div>
          </button>
        </div>
      </section>

      {/* 3. Main Interactive Graph Workspace */}
      <section className="rounded-2xl border border-white/10 bg-[#0f131c] p-4 md:p-5 shadow-2xl space-y-4">
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

        <ViewContextBanner
          mode={density === "overview" ? "understand" : density === "mid" ? "explore" : "full"}
          visibleCount={filteredNodes.length}
          totalNodes={nodes.length}
          statusCounts={statusCounts}
          focusNodeTitle={selectedNode?.title}
          filterLabel={activeEntryPoint ? `Entry: ${activeEntryPoint}` : activeClusterId ? `Cluster: ${activeClusterId}` : null}
          activePresetLabel={
            activePreset === "lanes"
              ? "Four Constitutional Lanes"
              : activePreset === "kernel"
              ? "Kernel GPU & CUDA Subsystems"
              : activePreset === "swarmmind"
              ? "SwarmMind Deliberation Engine"
              : activePreset === "library"
              ? "Library Knowledge & Evidence Archive"
              : null
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Controls Sidebar */}
          <div className="lg:col-span-3 space-y-3 max-h-[76vh] overflow-y-auto pr-1">
            <div className="card p-3 bg-[#151924] border border-white/10 rounded-xl">
              <DensityControl density={density} onChange={setDensity} />
            </div>
            <div className="card p-3 bg-[#151924] border border-white/10 rounded-xl">
              <MeaningLayers activeLayers={activeLayers} onToggle={handleLayerToggle} />
            </div>
            <div className="card p-3 bg-[#151924] border border-white/10 rounded-xl">
              <EntryPoints entryPoints={entryPoints} activeEntryPoint={activeEntryPoint} onSelect={handleEntryPointSelect} />
            </div>
            <div className="card p-3 bg-[#151924] border border-white/10 rounded-xl">
              <ClusterSelector clusters={clusters} activeClusterId={activeClusterId} onSelect={setActiveClusterId} />
            </div>
          </div>

          {/* WebGL Graph Canvas */}
          <div className={`relative h-[76vh] min-h-[580px] max-h-[850px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0d14] ${selectedNode ? "lg:col-span-5" : "lg:col-span-9"}`}>
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
                Rendering interactive graph workspace...
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#ef9090]">
                {error}
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[#9ea5ba]">
                No nodes match the selected scope. Try resetting filters.
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
            <div className="lg:col-span-4 max-h-[76vh] overflow-y-auto card p-4 bg-[#141926] border border-[#38BDF8]/40 shadow-2xl rounded-xl">
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

        {/* Legend */}
        <GraphLegend />
      </section>

      {/* 4. Case Study Narrative: Deliberation Lifecycle */}
      <section className="card p-6 md:p-8 rounded-2xl bg-[#141824] border border-white/10 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1 block">
            Architectural Case Study — Conceptual Deliberation Model
          </span>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            How the Multi-Agent Deliberation Lifecycle Operates
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-3xl mt-1">
            Conceptual 5-stage sovereign consensus loop governing autonomous proposals, policy review, GPU execution, proof verification, and permanent ratification across the four lanes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="text-xl" aria-hidden="true">💡</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#38bdf8]">1. Proposal</div>
            <div className="text-sm font-bold text-slate-100">SwarmMind (80)</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Autonomous agent loops detect architectural drift or performance opportunities, signing structured JSON proposals.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="text-xl" aria-hidden="true">⚖️</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-400">2. Review</div>
            <div className="text-sm font-bold text-slate-100">Four-Lane Review</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Sovereign lanes evaluate the proposal against constitutional boundaries, authority weights, and safety policies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="text-xl" aria-hidden="true">⚡</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">3. Execution</div>
            <div className="text-sm font-bold text-slate-100">Kernel Lane (70)</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              GPU/CUDA worker nodes execute benchmarks, run integration tests, and isolate runtime processes with strict timeouts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="text-xl" aria-hidden="true">🔬</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">4. Verification</div>
            <div className="text-sm font-bold text-slate-100">Library Lane (60)</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Proof-of-evidence gatekeeper validates cryptographic hashes, test outputs, and reproducible evidence before ratification.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <div className="text-xl" aria-hidden="true">🔒</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-400">5. Ratification</div>
            <div className="text-sm font-bold text-slate-100">Archivist Lane (100)</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Constitutional root ratifies changes, inlines permanent records, and commits verifiable state to canonical storage.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Accessible Architecture Catalog (Text Equivalent for Screen Readers & Non-WebGL) */}
      <section className="card p-6 md:p-8 rounded-2xl bg-[#141824] border border-white/10 space-y-6" aria-label="Accessible Architecture Directory">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Subsystems &amp; Codebases Directory
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Direct access to all featured systems, source repositories, and verification records.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/repos"
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              All 40 Repositories →
            </Link>
            <Link
              href="/library"
              className="px-4 py-2 rounded-lg border border-white/10 text-xs text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-white transition-colors"
            >
              Browse Library →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredRepos.map((repo) => (
            <div
              key={repo.name}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{repo.name}</span>
                <span className="font-mono text-[10px] text-[#38BDF8] px-2 py-0.5 rounded bg-[#38BDF8]/10">
                  FEATURED
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                {repo.portfolio_summary || repo.description}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <Link
                  href={`/repos?tab=all&selected=${repo.name}`}
                  className="text-[var(--primary)] hover:underline"
                >
                  View Details →
                </Link>
                <a
                  href={repo.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#38BDF8] hover:underline"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

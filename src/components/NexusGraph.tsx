"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { bidirectional } from "graphology-shortest-path";
import type { GraphNode, GraphEdge, MeaningLayer, DensityLevel, Cluster, EntryPoint } from "@/lib/graph-types";
import { DEFAULT_LAYERS, STATUS_COLORS } from "@/lib/graph-types";
import { computeClusters, computeEntryPoints, assignClusterIds } from "@/lib/graph-clusters";
import GraphCanvas from "./graph/GraphCanvas";
import GraphToolbar from "./graph/GraphToolbar";
import EntryPoints from "./graph/EntryPoints";
import MeaningLayers from "./graph/MeaningLayers";
import DensityControl from "./graph/DensityControl";
import { ModeSelector } from "./graph/ModeSelector";
import { GraphMode, MODE_CONFIG, DEFAULT_MODE } from "@/lib/graph-types";
import ClusterSelector from "./graph/ClusterSelector";
import NodeDetail from "./graph/NodeDetail";
 import GraphLegend from "./graph/GraphLegend";
 import GraphContextPanel from "./graph/GraphContextPanel";
 import { createSnapshotFromGraphState, parseSnapshot, createRepoSnapshot, downloadJson, generateContradictionHubReport } from "@/lib/graph-snapshot";
 import type { GraphSnapshot } from "@/lib/graph-snapshot";
 import { compareSnapshots } from "@/lib/graph-snapshot-compare";
 import SystemInterpretation from "./graph/SystemInterpretation";

interface NexusGraphProps {
  initialMode?: GraphMode;
  initialFilter?: string;
  initialFilterMode?: "type" | "repo";
}

export default function NexusGraph(props: NexusGraphProps = {}) {
  const { initialMode = DEFAULT_MODE, initialFilter = "all", initialFilterMode = "type" } = props;
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);

  const [filter, setFilter] = useState(initialFilter);
  const [filterMode, setFilterMode] = useState<"type" | "repo">(initialFilterMode);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync filter state when URL query params change (client-side navigation)
  useEffect(() => {
    setFilter(initialFilter);
    setFilterMode(initialFilterMode);
  }, [initialFilter, initialFilterMode]);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const [pathSource, setPathSource] = useState<string | null>(null);
  const [pathTarget, setPathTarget] = useState<string | null>(null);
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
  const [pathEdges, setPathEdges] = useState<Set<string>>(new Set());

const [activeLayers, setActiveLayers] = useState<MeaningLayer[]>([...DEFAULT_LAYERS]);
  const [density, setDensity] = useState<DensityLevel>("mid");
  const [graphMode, setGraphMode] = useState<GraphMode>(initialMode);
  const [activeEntryPoint, setActiveEntryPoint] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
   const [cameraRatio, setCameraRatio] = useState(1);
   const [webglUnavailable, setWebglUnavailable] = useState(false);
   const [nodeLimit, setNodeLimit] = useState<number | null>(null);

   const graphRef = useRef<Graph | null>(null);
   const sigmaRef = useRef<Sigma | null>(null);

    // Sync density and layers when mode changes, and auto-select entry point
    useEffect(() => {
      const config = MODE_CONFIG[graphMode];
      setDensity(config.density);
      setActiveLayers(config.layers);

      // Auto-select appropriate entry point per mode
      if (graphMode === "understand") {
        // If a repo filter is active, select that repo's cluster; otherwise use authority
        if (filterMode === "repo" && filter !== "all") {
          const repoClusterId = `ep:repo:${filter}`;
          // Check if the cluster exists before selecting
          if (entryPoints.some(ep => ep.id === repoClusterId)) {
            setActiveEntryPoint(repoClusterId);
            setNodeLimit(null); // Show all nodes for a specific repo
          } else {
            setActiveEntryPoint("ep:authority");
            setNodeLimit(100);
          }
        } else {
          setActiveEntryPoint("ep:authority");
          setNodeLimit(100); // Default limit for understand mode
        }
      } else if (graphMode === "explore") {
        setActiveEntryPoint("ep:contradictions");
        setNodeLimit(null);
      } else {
        setActiveEntryPoint(null);
        setNodeLimit(null);
      }
    }, [graphMode, filterMode, filter, entryPoints]);

    // Compute core nodes for highlighting in understand mode (computed from full nodes list)
    const coreNodeIds = useMemo(() => {
      if (graphMode !== "understand") return new Set<string>();
      const scored = nodes
        .filter(n => n.status === "VERIFIED" && (n.authorityDepth >= 80 || n.verificationCount >= 5))
        .map(n => ({ id: n.id, score: n.authorityDepth + n.verificationCount }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => s.id);
      return new Set(scored);
    }, [graphMode, nodes]);

    // Compute base filtered set (all filters EXCEPT nodeLimit)
    const baseFilteredNodes = useMemo(() => {
      let result = nodes;

      // Apply type/repo filter
      if (filter === "all") {
        result = nodes;
      } else if (filterMode === "repo") {
        result = nodes.filter((n) => n.repo === filter);
      } else {
        result = nodes.filter((n) => n.type === filter);
      }

      // Apply data visibility policy based on mode
      const modeConfig = MODE_CONFIG[graphMode];
      if (!modeConfig.showUnverified) {
        result = result.filter((n) => n.status === "VERIFIED");
      }
      if (!modeConfig.showQuarantined) {
        result = result.filter((n) => n.status !== "QUARANTINED");
      }

      // Apply search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(n =>
          n.title.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q)) ||
          n.repo.toLowerCase().includes(q)
        );
      }

      // Apply entry point filter
      if (activeEntryPoint) {
        const ep = entryPoints.find(e => e.id === activeEntryPoint);
        if (ep) {
          result = result.filter(n => ep.nodeIds.includes(n.id));
        }
      }

      // Apply cluster filter
      if (activeClusterId) {
        const cluster = clusters.find(c => c.id === activeClusterId);
        if (cluster) {
          result = result.filter(n => cluster.nodeIds.includes(n.id));
        }
      }

      return result;
    }, [nodes, filter, filterMode, searchQuery, activeEntryPoint, activeClusterId, entryPoints, clusters, graphMode]);

    // Compute limited node IDs based on nodeLimit (top N by relevance score), applied to baseFiltered set
    const limitedNodeIds = useMemo(() => {
      if (!nodeLimit) return null;
      const scored = baseFilteredNodes
        .map(n => ({ id: n.id, score: n.authorityDepth + n.verificationCount }))
        .sort((a, b) => b.score - a.score)
        .slice(0, nodeLimit)
        .map(s => s.id);
      return new Set(scored);
    }, [nodeLimit, baseFilteredNodes]);

    // Final displayed nodes after all filters including optional node limit
    const displayedNodes = useMemo(() => {
      if (limitedNodeIds) {
        return baseFilteredNodes.filter(n => limitedNodeIds.has(n.id));
      }
      return baseFilteredNodes;
     }, [baseFilteredNodes, limitedNodeIds]);

   // Final nodes actually displayed (after all filters and optional limit)
   const filteredNodes = displayedNodes;

   const selectedNode = selectedNodeId
    ? filteredNodes.find((n) => n.id === selectedNodeId) || null
    : null;

   const statusCounts = { VERIFIED: 0, UNVERIFIED: 0, CONFLICTED: 0, QUARANTINED: 0 } as Record<string, number>;
   for (const n of displayedNodes) {
     if (statusCounts[n.status] !== undefined) statusCounts[n.status]++;
   }

   const primaryInstability = useMemo(() => {
     const sorted = [...displayedNodes].sort((a, b) => b.contradictionCount - a.contradictionCount);
     const top = sorted[0];
     if (!top) return null;
     return { title: top.title, contradictionCount: top.contradictionCount };
   }, [displayedNodes]);

  const viewModeLabel = useMemo(() => {
    if (graphMode === "explore") return "CONTRADICTION HUB" as const;
    if (graphMode === "understand") return "TRUSTED CORE" as const;
    return "FULL SYSTEM" as const;
  }, [graphMode]);

  const isFilteredView = useMemo(() => {
    return (
      graphMode !== "full" ||
      filter !== "all" ||
      searchQuery.trim().length > 0 ||
      activeEntryPoint !== null ||
      activeClusterId !== null
    );
  }, [graphMode, filter, searchQuery, activeEntryPoint, activeClusterId]);

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

  const handleGraphReady = useCallback((graph: Graph, sigma: Sigma) => {
    graphRef.current = graph;
    sigmaRef.current = sigma;
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

   // Calculate visibleCount for status display (how many nodes are actually rendered on screen)
   const visibleCount = (() => {
     // In overview mode: only cluster representatives are visible; count those that are in displayedNodes
     if (density === "overview") {
       const reps = new Set(clusters.map(c => c.representativeId));
       return displayedNodes.filter(n => reps.has(n.id)).length;
     }
     // Focus mode: approximate as displayedNodes (keeping it simple)
     if (focusedNodeId) {
       return displayedNodes.length;
     }
     // Entry point or cluster selection: all displayed nodes are in view
     return displayedNodes.length;
   })();

  const [importError, setImportError] = useState<string | null>(null);

  const handleExportSnapshot = useCallback(() => {
    // Get status counts
    const statusCounts = {
      verified: 0,
      unverified: 0,
      conflicted: 0,
      quarantined: 0,
    };
    
    for (const n of displayedNodes) {
      const nodeStatus = n.status.toLowerCase() as keyof typeof statusCounts;
      if (nodeStatus in statusCounts) {
        statusCounts[nodeStatus] += 1;
      }
    }

    // Create snapshot data from current graph state
    const snapshot = createSnapshotFromGraphState({
      repoFilter: filterMode === "repo" && filter !== "all" ? [filter] : [],
      typeFilter: filterMode === "type" && filter !== "all" ? [filter] : undefined,
      entryPointFilter: activeEntryPoint || undefined,
      meaningLayersEnabled: activeLayers,
      densityMode: density,
      zoomMode: cameraRatio.toString(),
      visibleNodeCap: undefined,
      visibleNodeCount: visibleCount,
      visibleEdgeCount: edges.length,
      totalAvailableNodes: nodes.length,
      totalAvailableEdges: edges.length,
      statusCounts: statusCounts,
      selectedNodeIds: selectedNodeId ? [selectedNodeId] : [],
      selectedEdgeIds: pathEdges.size > 0 ? Array.from(pathEdges) : [],
      nodes: filteredNodes,
      edges,
      clusters,
      entryPoints,
    });

    // Create download link
    const dataStr = JSON.stringify(snapshot, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const fileName = `graph-snapshot-${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '')}.json`;
    
    const exportFileDefaultName = fileName;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [filter, filterMode, activeEntryPoint, activeLayers, density, cameraRatio, filteredNodes, nodes, edges, selectedNodeId, pathEdges, visibleCount, clusters, entryPoints]);

  const handleImportSnapshot = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const snapshot = parseSnapshot(text);
        if (!snapshot) {
          setImportError("Invalid snapshot file: missing nodes, edges, or snapshot_id");
          return;
        }
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
        setClusters(snapshot.clusters);
        setEntryPoints(snapshot.entry_points);
        if (snapshot.repo_filter.length > 0) {
          setFilterMode("repo");
          setFilter(snapshot.repo_filter[0]);
        } else if (snapshot.type_filter?.length) {
          setFilterMode("type");
          setFilter(snapshot.type_filter[0]);
        }
        if (snapshot.meaning_layers_enabled) {
          setActiveLayers(snapshot.meaning_layers_enabled as MeaningLayer[]);
        }
        if (snapshot.density_mode) {
          setDensity(snapshot.density_mode as DensityLevel);
        }
        if (snapshot.selected_node_ids.length > 0) {
          setSelectedNodeId(snapshot.selected_node_ids[0]);
        }
        setImportError(null);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleExportAllRepos = useCallback(() => {
    const repoNames = [...new Set(nodes.map(n => n.repo))];
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '');
    for (const repoName of repoNames) {
      const snapshot = createRepoSnapshot(repoName, nodes, edges, clusters, entryPoints);
      const safeName = repoName.replace(/[^a-zA-Z0-9]/g, '-');
      downloadJson(snapshot, `graph-snapshot-${safeName}-${ts}.json`);
    }
  }, [nodes, edges, clusters, entryPoints]);

const handleExportContradictionHub = useCallback(() => {
 const report = generateContradictionHubReport(nodes);
 const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '');
 downloadJson(report, `contradiction-hub-report-${ts}.json`);
}, [nodes]);

const handleCompareSnapshots = useCallback(() => {
 let snapshotA: GraphSnapshot | null = null;

 const loadFileB = () => {
   const inputB = document.createElement("input");
   inputB.type = "file";
   inputB.accept = ".json";
   inputB.onchange = (e) => {
     const file = (e.target as HTMLInputElement).files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (ev) => {
       const text = ev.target?.result as string;
       const snapshotB = parseSnapshot(text);
       if (!snapshotB) {
         setImportError("Snapshot B is invalid: missing nodes, edges, or snapshot_id");
         return;
       }
       if (!snapshotA) return;
       const result = compareSnapshots(snapshotA, snapshotB);
       const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').replace('Z', '');
       downloadJson(result, `snapshot-compare-${ts}.json`);
       setImportError(null);
     };
     reader.readAsText(file);
   };
   document.body.appendChild(inputB);
   inputB.click();
   document.body.removeChild(inputB);
 };

 const inputA = document.createElement("input");
 inputA.type = "file";
 inputA.accept = ".json";
 inputA.onchange = (e) => {
   const file = (e.target as HTMLInputElement).files?.[0];
   if (!file) return;
   const reader = new FileReader();
   reader.onload = (ev) => {
     const text = ev.target?.result as string;
     const parsed = parseSnapshot(text);
     if (!parsed) {
       setImportError("Snapshot A is invalid: missing nodes, edges, or snapshot_id");
       return;
     }
     snapshotA = parsed;
     loadFileB();
   };
   reader.readAsText(file);
 };
 document.body.appendChild(inputA);
 inputA.click();
 document.body.removeChild(inputA);
}, []);

  const handleLayerToggle = useCallback((layer: MeaningLayer) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  }, []);

   // Simplified zoom level label (no counts — counts are in toolbar)
   const zoomLabel = cameraRatio < 0.3
     ? "Zoom: Deep"
     : cameraRatio < 0.6
     ? "Zoom: Close"
     : cameraRatio < 1.2
     ? "Zoom: Normal"
     : cameraRatio < 3
     ? "Zoom: Far"
     : "Zoom: Overview";

  return (
    <div className="p-8" data-pagefind-ignore>
      <a href="#nexus-graph-canvas" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded">
        Skip to graph canvas
      </a>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading ? "Loading graph data" : ""}
        {focusedNodeId ? "Focused on " + (selectedNode?.title || focusedNodeId) : ""}
        {pathSource && !pathTarget ? "Path trace: select target node" : ""}
        {pathSource && pathTarget ? "Path trace: " + (pathNodes.size - 1) + " hops" : ""}
      </div>
       <div className="mb-6 animate-fade-in">
         <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Nexus Graph</h1>
         <p className="text-[var(--text-secondary)] mb-4">
           This is a live system that:
           <br />• organizes knowledge
           <br />• detects contradictions
           <br />• verifies truth over time
           <br />Start with core nodes &rarr; explore connections &rarr; inspect conflicts.
         </p>
         <div className="text-sm text-[var(--text-secondary)]">
           <span className="font-medium">Legend:</span>{' '}
           <span className="text-[#22C55E]">Blue/Green</span> &rarr; Verified (trusted structure){' '}
           <span className="text-[#EF4444]">Red</span> &rarr; Contradictions (requires resolution){' '}
           <span className="text-[#9CA3AF]">Gray</span> &rarr; Unverified (untested)
         </div>
       </div>

       <div className="mb-4">
         <ModeSelector mode={graphMode} onChange={setGraphMode} />
       </div>
       {graphMode === "full" && (
         <div className="mb-4 text-sm text-amber-400 flex items-center gap-2" role="alert">
           <span aria-hidden="true">⚠</span>
           <span>Advanced Mode: Full system state (high density, may be noisy)</span>
         </div>
       )}

        <GraphToolbar
          filter={filter}
          filterMode={filterMode}
          searchQuery={searchQuery}
          onFilterChange={setFilter}
          onFilterModeChange={setFilterMode}
          onSearchChange={setSearchQuery}
          nodeCount={baseFilteredNodes.length}
          edgeCount={edges.length}
          visibleCount={visibleCount}
          nodeLimit={nodeLimit}
          onNodeLimitChange={setNodeLimit}
        />

         <SystemInterpretation
           viewModeLabel={viewModeLabel}
           visibleNodeCount={displayedNodes.length}
           conflictedCount={statusCounts.CONFLICTED}
           quarantinedCount={statusCounts.QUARANTINED}
          verifiedCount={statusCounts.VERIFIED}
          primaryInstability={primaryInstability}
          loading={loading}
        />

       <div className="card p-3 mb-2 flex gap-3 items-center text-sm animate-fade-in" role="status" aria-label="Node status summary">
        {Object.entries(statusCounts).filter(([, cnt]) => cnt > 0).map(([status, count]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">{status}: {count}</span>
          </span>
        ))}
      </div>

      {(pathSource || focusedNodeId) && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 animate-fade-in" role="status" aria-live="polite">
          <div className="flex items-center gap-3 text-sm">
            {focusedNodeId && (
              <>
                <span className="text-[var(--primary)] font-medium">Focus</span>
                <span className="text-[var(--text-muted)]">
                  on <span className="text-[var(--text-primary)]">{selectedNode?.title || focusedNodeId}</span>
                </span>
        <button onClick={handleStageClick} className="ml-auto text-[var(--primary)] hover:text-[var(--primary)]/80 text-sm underline focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 rounded">
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
                <button onClick={handleStageClick} className="ml-auto text-amber-400 hover:text-amber-300 text-sm underline focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1 rounded">
                  Exit Path
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 animate-fade-in">
        <nav aria-label="Graph sidebar controls" className="w-56 flex-shrink-0 space-y-4">
          {/* Density and MeaningLayers always visible */}
          <div className="card p-3">
            <DensityControl density={density} onChange={setDensity} />
          </div>
          <div className="card p-3">
            <MeaningLayers
              activeLayers={activeLayers}
              onToggle={handleLayerToggle}
              onExportSnapshot={handleExportSnapshot}
              onImportSnapshot={handleImportSnapshot}
              onExportAllRepos={handleExportAllRepos}
              onExportContradictionHub={handleExportContradictionHub}
              onCompareSnapshots={handleCompareSnapshots}
              importError={importError}
            />
          </div>

           {/* Start Here – Understand mode */}
           {graphMode === "understand" && (
             <section className="space-y-2">
               <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] px-1">Start Here</h3>
               <div className="card p-2">
                 <EntryPoints
                   entryPoints={entryPoints.filter(ep => {
                     // Always include the two curated entry points
                     if (ep.id === "ep:authority" || ep.id === "ep:gov-core") return true;
                     // When a repo filter is active in understand mode, show that repo's cluster
                     if (filterMode === "repo" && filter !== "all" && ep.id === `ep:repo:${filter}`) {
                       return true;
                     }
                     return false;
                   })}
                   activeEntryPoint={activeEntryPoint}
                   onSelect={setActiveEntryPoint}
                 />
               </div>
             </section>
           )}

          {/* Investigate – Explore mode */}
          {graphMode === "explore" && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] px-1">Investigate</h3>
              <div className="card p-2">
                <EntryPoints
                  entryPoints={entryPoints.filter(ep =>
                    ep.id === "ep:contradictions" ||
                    ep.id === "ep:gov-unenforced" ||
                    ep.id === "ep:gov-authority-mismatch"
                  )}
                  activeEntryPoint={activeEntryPoint}
                  onSelect={setActiveEntryPoint}
                />
              </div>
            </section>
          )}

          {/* Advanced – Full mode */}
          {graphMode === "full" && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] px-1">Advanced</h3>
              <div className="card p-3 max-h-64 overflow-y-auto">
                <ClusterSelector clusters={clusters} activeClusterId={activeClusterId} onSelect={setActiveClusterId} />
              </div>
            </section>
          )}
        </nav>

        <main className="flex-1 min-w-0 flex gap-4" id="nexus-graph-canvas">
          <div className="flex-1 min-w-0">
        <div className="card relative overflow-hidden" style={{ height: "calc(100vh - 300px)", minHeight: "500px" }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full text-[var(--text-muted)]" role="status" aria-live="polite">Loading graph data...</div>
                ) : filteredNodes.length === 0 && !webglUnavailable ? (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]" role="status">No graph data available</div>
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
                   visibleCount={visibleCount}
                   coreNodeIds={Array.from(coreNodeIds)}
                   onNodeClick={handleNodeClick}
                   onNodeHover={handleNodeHover}
                   onStageClick={handleStageClick}
                   onCameraUpdate={handleCameraUpdate}
                   onGraphReady={handleGraphReady}
           onWebGLUnavailable={() => setWebglUnavailable(true)}
                 />
              )}
              <GraphContextPanel
                nodeCount={filteredNodes.length}
                edgeCount={edges.length}
                visibleCount={visibleCount}
                density={density}
                activeLayers={activeLayers}
                filter={filter}
                filterMode={filterMode}
                activeEntryPoint={activeEntryPoint}
                activeClusterId={activeClusterId}
                focusedNodeId={focusedNodeId}
                selectedNodeTitle={selectedNode?.title || null}
                searchQuery={searchQuery}
              />
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-[var(--bg-surface)]/80 text-sm text-[var(--text-muted)] backdrop-blur-sm" aria-live="polite">
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
              onClose={handleStageClick}
            />
          )}
        </main>
      </div>

      <p className="mt-4 text-sm text-[var(--text-muted)] text-center animate-fade-in">
        Entry points replace explore mode &mdash; choose what to see. Toggle meaning layers to filter edge types. Adjust density for depth. Use Tab to focus the graph, arrow keys or WASD to pan, +/- to zoom, Escape to clear.
      </p>

      <GraphLegend />
    </div>
  );
}

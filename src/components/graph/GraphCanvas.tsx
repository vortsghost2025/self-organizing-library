"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphNode, GraphEdge, MeaningLayer, DensityLevel, Cluster, AuthorityEdgeType, GovernanceLayer, BridgeState } from "@/lib/graph-types";
import { MEANING_LAYER_EDGES, AUTHORITY_EDGE_COLORS, AUTHORITY_EDGE_SIZE, STATUS_COLORS, TYPE_COLORS, REPO_COLORS, GOVERNANCE_LAYER_COLORS, BRIDGE_STATE_COLORS } from "@/lib/graph-types";

let _webglAvailable: boolean | undefined;

function isWebGLAvailable(): boolean {
  if (_webglAvailable !== undefined) return _webglAvailable;
  if (typeof window === "undefined") { _webglAvailable = false; return false; }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    _webglAvailable = gl !== null;
    return _webglAvailable;
  } catch {
    _webglAvailable = false;
    return false;
  }
}

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
  visibleCount: number;
  coreNodeIds?: string[];
  onNodeClick: (nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
  onStageClick: () => void;
  onCameraUpdate: (ratio: number) => void;
  onGraphReady: (graph: Graph, sigma: Sigma) => void;
  onWebGLUnavailable?: () => void;
}

interface GraphCanvasImperativeHandle {
  fitVisible: () => void;
}

const DIM_COLOR = "#2A2A38";
const HOVER_DIM_COLOR = "#353540";
const HOVER_DIM_EDGE = "#252530";
const PATH_HIGHLIGHT = "#F59E0B";
const PATH_EDGE_COLOR = "#FBBF24";

function getReducedMotionDurations() {
  if (typeof window === "undefined") return { camera: 200, pan: 150 };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return { camera: reduced ? 0 : 200, pan: reduced ? 0 : 150 };
}

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
      governanceLayer: node.governanceLayer || "unknown",
      authorityDepth: node.authorityDepth || 0,
      bridgeState: node.bridgeState || "unknown",
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
    settings.gravity = 0.5;
    settings.scalingRatio = 4;
    settings.barnesHutOptimize = graph.order > 100;
    const iterations = graph.order > 200 ? 300 : graph.order > 50 ? 200 : 100;
    forceAtlas2.assign(graph, { iterations, settings });
  }

  return graph;
}

const GraphCanvas = forwardRef(function GraphCanvas(
  {
    nodes, edges, clusters, hoveredNodeId, selectedNodeId, focusedNodeId,
    pathNodes, pathEdges, pathSource, pathTarget, activeLayers, density,
    activeEntryPoint, activeClusterId, searchQuery, filterMode, filter,
    visibleCount, coreNodeIds, onNodeClick, onNodeHover, onStageClick, onCameraUpdate, onGraphReady,
    onWebGLUnavailable,
  }: GraphCanvasProps,
  ref: React.Ref<GraphCanvasImperativeHandle>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [baseLabelSize, setBaseLabelSize] = useState(() => {
    if (typeof window === "undefined") return 12;
    const zoomLevel = Math.round(window.devicePixelRatio * 100) / 100;
    return Math.round(12 * Math.max(1, zoomLevel));
  });

  const baseLabelSizeRef = useRef(baseLabelSize);

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
  const coreNodeIdsRef = useRef<string[]>(coreNodeIds || []);
  const visibleNodeIdsRef = useRef<Set<string>>(new Set());
  // Cluster Node IDs map ref (computed in fitVisible, but needed for quick check)
  const clusterNodeIdsRef = useRef<Map<string, Set<string>>>(new Map());
  const lastRefreshTimeRef = useRef<number | null>(null);
  const lastFitDiagnosticsRef = useRef<string>("none");
  
  // Callback refs to prevent unnecessary re-renders
  const onNodeClickRef = useRef(onNodeClick);
  const onNodeHoverRef = useRef(onNodeHover);
  const onStageClickRef = useRef(onStageClick);
  const onCameraUpdateRef = useRef(onCameraUpdate);
  const onGraphReadyRef = useRef(onGraphReady);
  const onWebGLUnavailableRef = useRef(onWebGLUnavailable);
  // Debug state for ?debugGraph=1 overlay
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);

  // Fit camera to visible nodes on demand
  const fitVisible = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) {
      console.debug("[fitVisible] sigma or graph missing");
      return;
    }

    const container = containerRef.current;
    if (!container) {
      console.debug("[fitVisible] container missing");
      return;
    }

    // Build clusterNodeIds map for visibility checks and store in ref for other effects
    const clusterNodeIds = new Map<string, Set<string>>();
    for (const cl of clustersRef.current) {
      clusterNodeIds.set(cl.id, new Set(cl.nodeIds));
    }
    clusterNodeIdsRef.current = clusterNodeIds;

    const d = densityRef.current;
    const ep = activeEntryPointRef.current;
    const ac = activeClusterIdRef.current;
    const sq = searchQueryRef.current.toLowerCase();
    const focused = focusedNodeIdRef.current;
    const selected = selectedNodeIdRef.current;
    const pNodes = pathNodesRef.current;

    const isNodeVisible = (nodeId: string): boolean => {
      if (!graph.hasNode(nodeId)) return false;
      if (sq && graph.getNodeAttribute(nodeId, "label")?.toLowerCase().includes(sq)) return true;
      if (pNodes.size > 0 && pNodes.has(nodeId)) return true;
      if (focused && graph.hasNode(focused)) {
        const neighbors = new Set(graph.neighbors(focused));
        if (neighbors.has(nodeId) || nodeId === focused) return true;
      }
      if (selected && nodeId === selected) return true;
      if (ep) {
        for (const cl of clustersRef.current) {
          if (("ep:" + cl.id) === ep && clusterNodeIds.get(cl.id)?.has(nodeId)) return true;
        }
        if (ep === "ep:authority") {
          const attrs = graph.getNodeAttributes(nodeId);
          if ((attrs as any).verificationCount >= 3) return true;
        }
        if (ep === "ep:contradictions") {
          const ns = (graph.getNodeAttributes(nodeId) as any).nodeStatus;
          if (ns === "CONFLICTED" || ns === "QUARANTINED") return true;
        }
        if (ep === "ep:gov-unenforced") {
          const gl = (graph.getNodeAttributes(nodeId) as any).governanceLayer;
          const bs = (graph.getNodeAttributes(nodeId) as any).bridgeState;
          if ((gl === "theoretical" || gl === "historical") && (bs === "documented_only" || bs === "unknown")) return true;
        }
        if (ep === "ep:gov-core") {
          const gl = (graph.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "constitutional" || gl === "operational") return true;
        }
        if (ep === "ep:gov-bridges") {
          const bs = (graph.getNodeAttributes(nodeId) as any).bridgeState;
          if (bs === "enforced" || bs === "verified" || bs === "partial") return true;
        }
        if (ep === "ep:gov-contradicted") {
          const bs = (graph.getNodeAttributes(nodeId) as any).bridgeState;
          if (bs === "contradicted") return true;
        }
        if (ep === "ep:gov-authority-mismatch") {
          const attrs = graph.getNodeAttributes(nodeId) as any;
          if ((attrs.governanceLayer === "theoretical" || attrs.governanceLayer === "historical") && attrs.authorityDepth >= 75) return true;
        }
        if (ep === "ep:gov-evidence") {
          const gl = (graph.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "evidence") return true;
        }
        if (ep === "ep:gov-adjacent") {
          const gl = (graph.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "application_adjacent") return true;
        }
        if (ep === "ep:gov-historical") {
          const gl = (graph.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "historical") return true;
        }
      }

      if (ac && clusterNodeIds.get(ac)?.has(nodeId)) return true;

      if (d === "overview") {
        for (const cl of clustersRef.current) {
          if (cl.representativeId === nodeId) return true;
        }
        return false;
      }
      if (d === "mid") {
        if (!ep && !ac && !focused && !sq) return true;
        return false;
      }
      return true;
    };

    const visibleNodeIds: string[] = [];
    for (const nodeId of graph.nodes()) {
      if (isNodeVisible(nodeId)) visibleNodeIds.push(nodeId);
    }
    if (visibleNodeIds.length === 0) {
      console.debug("[fitVisible] no visible nodes");
      return;
    }

    const xs: number[] = [];
    const ys: number[] = [];
    for (const id of visibleNodeIds) {
      const attrs = graph.getNodeAttributes(id);
      xs.push(attrs.x);
      ys.push(attrs.y);
    }
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    let width = maxX - minX;
    let height = maxY - minY;
    if (width <= 0 || height <= 0) {
      console.debug("[fitVisible] invalid bbox dimensions");
      return;
    }

    // Enforce minimum spread for small filtered views to prevent over-zoom collapse
    // Target: visible nodes should occupy at least 40% of the smaller container dimension
    const minScreenFraction = 0.4;
    const minWorldExtent = Math.min(container.clientWidth, container.clientHeight) * minScreenFraction;
    
    let adjMinX = minX, adjMaxX = maxX, adjMinY = minY, adjMaxY = maxY;
    
    if (width < minWorldExtent) {
      const diff = minWorldExtent - width;
      adjMinX -= diff / 2;
      adjMaxX += diff / 2;
    }
    if (height < minWorldExtent) {
      const diff = minWorldExtent - height;
      adjMinY -= diff / 2;
      adjMaxY += diff / 2;
    }
    
    const adjWidth = adjMaxX - adjMinX;
    const adjHeight = adjMaxY - adjMinY;
    const centerX = (adjMinX + adjMaxX) / 2;
    const centerY = (adjMinY + adjMaxY) / 2;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const padding = 0.85;
    const ratio = Math.min(
      (containerWidth * padding) / adjWidth,
      (containerHeight * padding) / adjHeight
    );

    // Debug logging for ?debugGraph=1
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (urlParams.has('debugGraph')) {
      console.log("[fitVisible] diagnostics:", {
        container: { width: containerWidth, height: containerHeight },
        visibleCount: visibleNodeIds.length,
        bbox: { minX, maxX, minY, maxY, width, height },
        adjBbox: { minX: adjMinX, maxX: adjMaxX, minY: adjMinY, maxY: adjMaxY, adjWidth, adjHeight },
        fit: { centerX, centerY, ratio },
        first5Visible: visibleNodeIds.slice(0, 5).map(id => ({
          id,
          x: graph.getNodeAttributes(id).x,
          y: graph.getNodeAttributes(id).y,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    const diag = `container=${container.clientWidth}x${container.clientHeight} adjWorld=${adjWidth.toFixed(0)}x${adjHeight.toFixed(0)} ratio=${ratio.toFixed(3)}`;
    console.debug("[fitVisible]", diag);
    lastFitDiagnosticsRef.current = diag;

    console.log("[fitVisible] RUNNING - container:", container.clientWidth, "x", container.clientHeight,
                "adjWorld:", { w: adjWidth, h: adjHeight },
                "computedRatio:", ratio.toFixed(4),
                "cameraBefore:", camera.getState ? camera.getState() : { x: camera.x, y: camera.y, ratio: camera.ratio });

    const camera = sigma.getCamera() as any;
    camera.animate({ x: centerX, y: centerY, ratio }, { duration: 200 });
   }, []);

  // Watchdog: ensure graph never drifts off-screen or stays blank
  useEffect(() => {
    let rafId: number;
    let lastCheck = Date.now();
    let consecutiveIssues = 0;
    let userHasInteracted = false;
    
    const checkGraphVisibility = () => {
      const sigma = sigmaRef.current;
      const container = containerRef.current;
      if (!sigma || !container) return;
      
      const camera = sigma.getCamera() as any;
      if (!camera) return;
      
      const now = Date.now();
      if (now - lastCheck < 2000) return;
      lastCheck = now;
      
      try {
        const state = camera.getState ? camera.getState() : { x: camera.x, y: camera.y, ratio: camera.ratio };
        
        // Skip auto-correction if user has interacted recently (last 10s)
        if (userHasInteracted) {
          // Reset flag after 10 seconds of inactivity
          setTimeout(() => { userHasInteracted = false; }, 10000);
          return;
        }
        
        // Condition 1: Extremely zoomed in or out
        if (state.ratio < 0.03 || state.ratio > 8) {
          console.debug("[watchdog] ratio out of range", state.ratio);
          fitVisible();
          consecutiveIssues = 0;
          return;
        }
        
        // Condition 2: Graph loaded but camera looking at wrong place
        if (graphRef.current && graphRef.current.order > 0) {
          const anyNode = graphRef.current.nodes()[0];
          if (anyNode) {
            const nodePos = graphRef.current.getNodeAttributes(anyNode);
            const screenX = (nodePos.x - state.x) * state.ratio + container.clientWidth / 2;
            const screenY = (nodePos.y - state.y) * state.ratio + container.clientHeight / 2;
            // Node exists but is far outside viewport
            if (screenX < -container.clientWidth || screenX > container.clientWidth * 2 ||
                screenY < -container.clientHeight || screenY > container.clientHeight * 2) {
              console.debug("[watchdog] node off-screen, recentering");
              fitVisible();
              consecutiveIssues = 0;
              return;
            }
          }
        }
        
        consecutiveIssues = 0;
      } catch (err) {
        console.debug("[watchdog] error", err);
        consecutiveIssues++;
        if (consecutiveIssues >= 3) {
          fitVisible();
          consecutiveIssues = 0;
        }
      }
    };
    
    rafId = window.setInterval(checkGraphVisibility, 2000);
    
    const handleInteraction = () => { userHasInteracted = true; };
    const containerForCleanup = containerRef.current;
    containerForCleanup?.addEventListener('wheel', handleInteraction, { passive: true });
    containerForCleanup?.addEventListener('mousedown', handleInteraction);
    containerForCleanup?.addEventListener('touchstart', handleInteraction);
    
    return () => {
      if (rafId) clearInterval(rafId);
      containerForCleanup?.removeEventListener('wheel', handleInteraction);
      containerForCleanup?.removeEventListener('mousedown', handleInteraction);
      containerForCleanup?.removeEventListener('touchstart', handleInteraction);
    };
  }, [fitVisible]);

  useImperativeHandle(ref, () => ({ fitVisible }), [fitVisible]);

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
  useEffect(() => { coreNodeIdsRef.current = coreNodeIds || []; }, [coreNodeIds]);

  // Sync callback refs to latest props (prevents main effect from depending on callbacks)
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { onNodeHoverRef.current = onNodeHover; }, [onNodeHover]);
  useEffect(() => { onStageClickRef.current = onStageClick; }, [onStageClick]);
  useEffect(() => { onCameraUpdateRef.current = onCameraUpdate; }, [onCameraUpdate]);
  useEffect(() => { onGraphReadyRef.current = onGraphReady; }, [onGraphReady]);
  useEffect(() => { onWebGLUnavailableRef.current = onWebGLUnavailable; }, [onWebGLUnavailable]);

  useEffect(() => {
    const update = () => {
      const zoomLevel = typeof window !== "undefined" ? Math.round(window.devicePixelRatio * 100) / 100 : 1;
      setBaseLabelSize(Math.round(12 * Math.max(1, zoomLevel)));
    };
    update();
    window.addEventListener("resize", update);
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (sigmaRef.current) {
      sigmaRef.current.refresh();
      lastRefreshTimeRef.current = Date.now();
    }
  }, [hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, pathSource, pathTarget, activeLayers, density, activeEntryPoint, activeClusterId, searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;
    const camera = sigma.getCamera() as any;
    const dur = getReducedMotionDurations();
    if (e.key === "Escape") {
      onStageClickRef.current?.();
      (e.target as HTMLElement).blur();
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      camera.animatedZoom({ duration: dur.camera });
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      camera.animatedUnzoom({ duration: dur.camera });
    } else if (e.key === "ArrowUp" || e.key === "w") {
      e.preventDefault();
      const state = camera.getState();
      camera.animate({ ...state, y: state.y - 50 / camera.ratio }, { duration: dur.pan });
    } else if (e.key === "ArrowDown" || e.key === "s") {
      e.preventDefault();
      const state = camera.getState();
      camera.animate({ ...state, y: state.y + 50 / camera.ratio }, { duration: dur.pan });
    } else if (e.key === "ArrowLeft" || e.key === "a") {
      e.preventDefault();
      const state = camera.getState();
      camera.animate({ ...state, x: state.x - 50 / camera.ratio }, { duration: dur.pan });
    } else if (e.key === "ArrowRight" || e.key === "d") {
      e.preventDefault();
      const state = camera.getState();
      camera.animate({ ...state, x: state.x + 50 / camera.ratio }, { duration: dur.pan });
    }
  }, []); // onStageClick is stable via ref

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    if (!isWebGLAvailable()) return;

    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = buildGraph(nodes, edges, filter, filterMode);
    if (graph.order === 0) {
      console.debug("[GraphCanvas] built graph has 0 nodes");
      return;
    }
    graphRef.current = graph;

    const clusterNodeIds = new Map<string, Set<string>>();
    for (const cl of clusters) {
      clusterNodeIds.set(cl.id, new Set(cl.nodeIds));
    }

    const isVisible = (nodeId: string): boolean => {
      const d = densityRef.current;
      const ep = activeEntryPointRef.current;
      const ac = activeClusterIdRef.current;
      const sq = searchQueryRef.current.toLowerCase();
      const focused = focusedNodeIdRef.current;
      const selected = selectedNodeIdRef.current;
      const g = graphRef.current;
      if (!g || !g.hasNode(nodeId)) return false;

      if (sq && g.getNodeAttribute(nodeId, "label")?.toLowerCase().includes(sq)) return true;
      if (pathNodesRef.current.size > 0 && pathNodesRef.current.has(nodeId)) return true;
      if (focused && g.hasNode(focused)) {
        const neighbors = new Set(g.neighbors(focused));
        if (neighbors.has(nodeId) || nodeId === focused) return true;
      }
      if (selected && nodeId === selected) return true;

      if (ep) {
        for (const cl of clustersRef.current) {
          if (("ep:" + cl.id) === ep && clusterNodeIds.get(cl.id)?.has(nodeId)) return true;
        }
        if (ep === "ep:authority") {
          const attrs = g.getNodeAttributes(nodeId);
          if ((attrs as any).verificationCount >= 3) return true;
        }
        if (ep === "ep:contradictions") {
          const ns = (g.getNodeAttributes(nodeId) as any).nodeStatus;
          if (ns === "CONFLICTED" || ns === "QUARANTINED") return true;
        }
        if (ep === "ep:gov-unenforced") {
          const gl = (g.getNodeAttributes(nodeId) as any).governanceLayer;
          const bs = (g.getNodeAttributes(nodeId) as any).bridgeState;
          if ((gl === "theoretical" || gl === "historical") && (bs === "documented_only" || bs === "unknown")) return true;
        }
        if (ep === "ep:gov-core") {
          const gl = (g.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "constitutional" || gl === "operational") return true;
        }
        if (ep === "ep:gov-bridges") {
          const bs = (g.getNodeAttributes(nodeId) as any).bridgeState;
          if (bs === "enforced" || bs === "verified" || bs === "partial") return true;
        }
        if (ep === "ep:gov-contradicted") {
          const bs = (g.getNodeAttributes(nodeId) as any).bridgeState;
          if (bs === "contradicted") return true;
        }
        if (ep === "ep:gov-authority-mismatch") {
          const attrs = g.getNodeAttributes(nodeId) as any;
          const gl = attrs.governanceLayer;
          const ad = attrs.authorityDepth;
          if ((gl === "theoretical" || gl === "historical") && ad >= 75) return true;
        }
        if (ep === "ep:gov-evidence") {
          const gl = (g.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "evidence") return true;
        }
        if (ep === "ep:gov-adjacent") {
          const gl = (g.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "application_adjacent") return true;
        }
        if (ep === "ep:gov-historical") {
          const gl = (g.getNodeAttributes(nodeId) as any).governanceLayer;
          if (gl === "historical") return true;
        }
      }

      if (ac && clusterNodeIds.get(ac)?.has(nodeId)) return true;

      if (d === "overview") {
        for (const cl of clustersRef.current) {
          if (cl.representativeId === nodeId) return true;
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

    // Compute effective label settings based on density
    const effectiveLabelSize = density === "overview"
      ? Math.round(baseLabelSizeRef.current * 1.5)
      : baseLabelSizeRef.current;
    const effectiveLabelThreshold = density === "overview" ? 20 : 50;
    
    // Compute initial camera bounds from graph node positions
    const nodeIdsArray = graph.nodes();
    let initCenterX = 0, initCenterY = 0;
    if (nodeIdsArray.length > 0) {
      let sumX = 0, sumY = 0;
      for (const id of nodeIdsArray) {
        const attrs = graph.getNodeAttributes(id);
        sumX += attrs.x;
        sumY += attrs.y;
      }
      initCenterX = sumX / nodeIdsArray.length;
      initCenterY = sumY / nodeIdsArray.length;
    }
    let renderer: Sigma;
    try {
      renderer = new Sigma(graph, containerRef.current, {
        renderLabels: true,
        renderEdgeLabels: false,
        labelFont: "DM Sans",
        labelSize: effectiveLabelSize,
        labelWeight: "500",
        labelColor: { color: "#A1A1AA" },
        labelRenderedSizeThreshold: effectiveLabelThreshold,
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

          // Core node highlighting for understand mode (initial load)
          const coreNodes = coreNodeIdsRef.current;
          const hasInteraction = hovered || selected || focused || pathNodesRef.current.size > 0;
          if (coreNodes.length > 0 && !hasInteraction) {
            if (coreNodes.includes(node)) {
              res.highlighted = true;
              res.zIndex = 9;
              res.color = "#FDE047"; // Yellow highlight for core nodes
              res.size = (res.size || 6) * 1.2;
            } else {
              // Fade non-core nodes on initial load
              res.color = "#2A2A38";
              res.label = "";
            }
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

        if (activeLayersRef.current.includes("governance")) {
          const gl = (data as any).governanceLayer as GovernanceLayer;
          const bs = (data as any).bridgeState as BridgeState;
          if (bs === "contradicted") {
            res.color = BRIDGE_STATE_COLORS.contradicted;
            res.zIndex = 6;
          } else if (bs === "enforced") {
            res.color = BRIDGE_STATE_COLORS.enforced;
            res.zIndex = 4;
          } else if (bs === "documented_only" || bs === "obsolete") {
            res.color = BRIDGE_STATE_COLORS[bs] || GOVERNANCE_LAYER_COLORS[gl] || res.color;
            res.zIndex = 1;
          } else if (gl && GOVERNANCE_LAYER_COLORS[gl]) {
            res.color = GOVERNANCE_LAYER_COLORS[gl];
          }
        }

          if (selected && node === selected) {
            res.highlighted = true;
            res.zIndex = 10;
          }

          const d = densityRef.current;
          if (d === "overview") {
            const isRep = clustersRef.current.some((cl) => cl.representativeId === node);
            if (!isRep) {
              res.label = "";
            }
          } else if (d === "mid") {
            const degree = graph.degree(node);
            if (degree < 8) res.label = "";
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

          // Boost edge visibility in overview/representative mode
          if (densityRef.current === "overview") {
            res.size = (res.size || 0.5) * 1.5;
          }

          return res;
        },
      });
      // Set initial camera position (Sigma v3: mutate camera object directly)
      const camera = renderer.getCamera();
      camera.x = initCenterX;
      camera.y = initCenterY;
      camera.ratio = 0.5;
      renderer.setCamera(camera);
      
      // Initial refresh and timestamp
      renderer.refresh();
      lastRefreshTimeRef.current = Date.now();
      
      // Debug: log initial state
      const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (urlParams.has('debugGraph')) {
        console.log("[GraphCanvas] init", {
          graphNodes: graph.order,
          container: containerRef.current ? { w: containerRef.current.clientWidth, h: containerRef.current.clientHeight } : null,
          camera: { x: camera.x, y: camera.y, ratio: camera.ratio },
          sigma: !!renderer,
        });
      }
    } catch (err) {
    console.error("Sigma renderer creation failed:", err);
    _webglAvailable = false;
    onWebGLUnavailableRef.current?.();
      return;
    }

    renderer.on("clickNode", ({ node }) => {
      onNodeClickRef.current?.(node);
    });

    renderer.on("enterNode", ({ node }) => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        const g = graphRef.current;
        if (g && g.hasNode(node)) {
          hoveredNeighborIdsRef.current = new Set(g.neighbors(node));
        }
        onNodeHoverRef.current?.(node);
      }, 60);
    });

    renderer.on("leaveNode", () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoveredNeighborIdsRef.current = new Set();
      onNodeHoverRef.current?.(null);
    });

    renderer.on("clickStage", () => {
      onStageClickRef.current?.();
    });

    const camera = renderer.getCamera() as any;
    const handleCameraUpdate = () => {
      onCameraUpdateRef.current?.(camera.ratio);
    };
    camera.on("updated", handleCameraUpdate);

     sigmaRef.current = renderer;
     onGraphReadyRef.current?.(graph, renderer);

     // Ensure container is laid out before fitting
     const container = containerRef.current;
     if (container && container.clientWidth > 0 && container.clientHeight > 0) {
       // Use ResizeObserver to wait for final layout, then fit
       const resizeObserver = new ResizeObserver(() => {
         fitVisible();
         renderer.refresh();
         resizeObserver.disconnect();
       });
       resizeObserver.observe(container);
       
       // Also try immediate fit after a short delay as fallback
       requestAnimationFrame(() => {
         requestAnimationFrame(() => {
           if (sigmaRef.current) {
             fitVisible();
             renderer.refresh();
           }
         });
       });
     }

     return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      camera.removeListener("updated", handleCameraUpdate);
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
   }, [nodes, edges, clusters, filter, filterMode, density]);
  // Note: density intentionally included because label size/threshold depend on it

  // Debug overlay for ?debugGraph=1
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const showDebug = urlParams.has('debugGraph');

  // Build debug info string
  useEffect(() => {
    if (!showDebug) return;
    const interval = setInterval(() => {
      const sigma = sigmaRef.current;
      const graph = graphRef.current;
      const container = containerRef.current;
      if (!sigma || !graph || !container) return;
      
      const camera = sigma.getCamera() as any;
      const state = camera?.getState ? camera.getState() : { x: camera?.x, y: camera?.y, ratio: camera?.ratio };
      
      // Recompute visible nodes using same logic as fitVisible
      const visibleNodeIds: string[] = [];
      for (const nodeId of graph.nodes()) {
        // Simplified visibility: node has valid position
        const attrs = graph.getNodeAttributes(nodeId);
        if (typeof attrs.x === 'number' && typeof attrs.y === 'number') {
          visibleNodeIds.push(nodeId);
        }
      }
      
      const bbox = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      for (const nid of visibleNodeIds) {
        const a = graph.getNodeAttributes(nid);
        if (a.x < bbox.minX) bbox.minX = a.x;
        if (a.x > bbox.maxX) bbox.maxX = a.x;
        if (a.y < bbox.minY) bbox.minY = a.y;
        if (a.y > bbox.maxY) bbox.maxY = a.y;
      }
      
      const dbg = {
        container: `${container.clientWidth}×${container.clientHeight}`,
        sigma: sigma ? 'yes' : 'no',
        nodes: graph.order,
        visible: visibleNodeIds.length,
        bbox: bbox.minX === Infinity ? 'none' : `${bbox.minX.toFixed(0)}-${bbox.maxX.toFixed(0)}, ${bbox.minY.toFixed(0)}-${bbox.maxY.toFixed(0)}`,
        camera: state ? `${state.x?.toFixed(0)},${state.y?.toFixed(0)} ratio=${state.ratio?.toFixed(3)}` : 'none',
        refresh: lastRefreshTimeRef.current ? new Date(lastRefreshTimeRef.current).toISOString().slice(11, 23) : 'never',
        lastFit: lastFitDiagnosticsRef.current,
      };
      setDebugInfo(dbg);
    }, 500);
    return () => clearInterval(interval);
  }, [showDebug]);

  const ariaLabel = [
    "Interactive nexus graph",
    density + " density",
    visibleCount + " visible nodes",
    focusedNodeId ? "focused on node" : "",
    pathSource ? "path trace active" : "",
    searchQuery ? "searching: " + searchQuery : "",
  ].filter(Boolean).join(", ");

  if (!isWebGLAvailable()) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8"
        role="alert"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">WebGL Not Available</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">
          The Nexus Graph requires WebGL to render. Your browser or device does not support WebGL,
          or it may be disabled. Try updating your browser, enabling hardware acceleration, or using
          a different device.
        </p>
        <Link href="/library" className="text-sm text-[var(--primary)] underline mt-2">
          Browse the Library instead
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-inset relative"
      role="application"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {/* Debug overlay */}
      {showDebug && debugInfo && (
        <div id="debug-overlay" style={{
          position: 'absolute', top: 8, right: 8, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', color: '#0f0', fontFamily: 'monospace',
          fontSize: 11, padding: 8, borderRadius: 4, pointerEvents: 'none',
          whiteSpace: 'pre-wrap', maxHeight: '90%', overflow: 'auto',
        }}>
          <div>── Graph Diagnostics ──</div>
          {Object.entries(debugInfo).map(([k,v]) => <div key={k}>{k}: {v}</div>)}
        </div>
      )}
    </div>
  );
});

export default GraphCanvas;
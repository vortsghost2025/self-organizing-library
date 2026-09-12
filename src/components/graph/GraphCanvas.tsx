"use client";

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphNode, GraphEdge, MeaningLayer, DensityLevel, Cluster, AuthorityEdgeType, GovernanceLayer, BridgeState } from "@/lib/graph-types";
import { MEANING_LAYER_EDGES, AUTHORITY_EDGE_COLORS, AUTHORITY_EDGE_SIZE, STATUS_COLORS, TYPE_COLORS, REPO_COLORS, GOVERNANCE_LAYER_COLORS, BRIDGE_STATE_COLORS } from "@/lib/graph-types";
import { NodeCircleProgram } from "sigma/rendering";

const NODE_PROGRAMS: Record<string, any> = {
  circle: NodeCircleProgram,
  default: NodeCircleProgram,
  node: NodeCircleProgram,
  point: NodeCircleProgram,
  doc: NodeCircleProgram,
  paper: NodeCircleProgram,
  code: NodeCircleProgram,
  data: NodeCircleProgram,
  config: NodeCircleProgram,
  schema: NodeCircleProgram,
  "test-data": NodeCircleProgram,
  "": NodeCircleProgram,
};


function drawCosmicNodeLabel(
  context: CanvasRenderingContext2D,
  data: any,
  settings: any
): void {
  if (!data.label) return;
  const size = settings.labelSize || 11;
  const font = settings.labelFont || "DM Sans, sans-serif";
  const weight = settings.labelWeight || "500";
  context.font = `${weight} ${size}px ${font}`;

  let text = data.label;
  if (text.length > 28) {
    text = text.slice(0, 26) + "…";
  }

  const x = Math.round(data.x + data.size + 4);
  const y = Math.round(data.y + size / 3);

  // Luminous dark halo behind text to make it extremely legible against dark cosmic backdrop
  context.save();
  context.shadowColor = "rgba(10, 15, 30, 0.95)";
  context.shadowBlur = 5;
  context.strokeStyle = "rgba(10, 15, 30, 0.9)";
  context.lineWidth = 3;
  context.strokeText(text, x, y);
  context.restore();

  context.fillStyle = "#E2E8F0";
  context.fillText(text, x, y);
}

function drawCosmicNodeHover(
  context: CanvasRenderingContext2D,
  data: any,
  settings: any
): void {
  const size = settings.labelSize || 12;
  const font = settings.labelFont || "DM Sans, sans-serif";

  // 1. Radiant orbital pulse ring around the active star node
  context.save();
  context.beginPath();
  context.arc(data.x, data.y, data.size + 4.5, 0, Math.PI * 2);
  context.strokeStyle = data.color || "#38BDF8";
  context.lineWidth = 2.5;
  context.shadowColor = data.color || "#06B6D4";
  context.shadowBlur = 16;
  context.stroke();

  // Inner white-hot core
  context.beginPath();
  context.arc(data.x, data.y, Math.max(1.5, data.size * 0.6), 0, Math.PI * 2);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.restore();

  // 2. High-Tech Glass HUD Card for Hover
  if (typeof data.label === "string" && data.label.trim().length > 0) {
    const labelText = data.label.length > 36 ? data.label.slice(0, 34) + "…" : data.label;
    context.font = `600 12px Outfit, ${font}`;
    const textWidth = context.measureText(labelText).width;

    const repoText = data.repo ? String(data.repo).replace(/-/g, " ") : "";
    const metaText = `${repoText ? repoText + " • " : ""}${data.connectionCount || 0} links`;
    context.font = `500 10px JetBrains Mono, monospace`;
    const metaWidth = context.measureText(metaText).width;

    const boxWidth = Math.round(Math.max(textWidth, metaWidth) + 24);
    const boxHeight = 44;
    const x = Math.round(data.x + data.size + 10);
    const y = Math.round(data.y - boxHeight / 2);
    const radius = 8;

    context.save();
    context.beginPath();
    if (typeof (context as any).roundRect === "function") {
      (context as any).roundRect(x, y, boxWidth, boxHeight, radius);
    } else {
      context.rect(x, y, boxWidth, boxHeight);
    }
    context.fillStyle = "rgba(7, 11, 24, 0.95)";
    context.shadowColor = "rgba(0, 0, 0, 0.85)";
    context.shadowBlur = 16;
    context.fill();
    context.strokeStyle = data.color ? `${data.color}99` : "rgba(56, 189, 248, 0.6)";
    context.lineWidth = 1.5;
    context.stroke();

    // Line 1: Title
    context.font = `600 12px Outfit, ${font}`;
    context.fillStyle = "#FFFFFF";
    context.textBaseline = "top";
    context.fillText(labelText, x + 12, y + 8);

    // Line 2: Meta (Repo & Connections)
    context.font = `500 10px JetBrains Mono, monospace`;
    context.fillStyle = data.color || "#38BDF8";
    context.fillText(metaText, x + 12, y + 25);
    context.restore();
  }
}

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
  activeEntryPointNodeIds?: string[];
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

export interface GraphCanvasImperativeHandle {
  fitVisible: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  focusCluster: (target: string) => void;
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

const DOMAIN_CENTROIDS: Record<string, { x: number; y: number }> = {
  "Archivist-Agent": { x: -210, y: -130 },
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": { x: 210, y: -130 },
  "self-organizing-library": { x: 0, y: 190 },
  "kernel-lane": { x: 0, y: -210 },
  "federation": { x: 250, y: 110 },
  "FreeAgent": { x: -250, y: 110 },
};

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

  // Base node set for the current filter (for repo mode: nodes in selected repo)
  const baseNodeIds = new Set(filtered.map((n) => n.id));

  // Expanded node set: base nodes + their neighbors (for repo mode cross-repo edges)
  const ids = new Set(baseNodeIds);
  if (filterMode === "repo" && filter !== "all") {
    for (const edge of edges) {
      if (baseNodeIds.has(edge.source) && !baseNodeIds.has(edge.target)) {
        ids.add(edge.target);
      } else if (baseNodeIds.has(edge.target) && !baseNodeIds.has(edge.source)) {
        ids.add(edge.source);
      }
    }
  }

  const graph = new Graph({ type: "undirected", multi: false });

  // Add all nodes in the expanded set
  for (const node of nodes) {
    if (!ids.has(node.id)) continue;
    // Celestial star sizing matching May 9: major landmark hubs shine bright, peripheral stars stay delicate
    const conn = node.connectionCount || 0;
    const isMajorHub = conn >= 8 || node.type === "paper";
    const baseSize = node.type === "paper" ? 8.5 : isMajorHub ? 7.0 : conn >= 3 ? 5.0 : 3.0;
    
    const color = REPO_COLORS[node.repo] || TYPE_COLORS[node.type] || "#06B6D4";
    
    graph.addNode(node.id, {
      label: node.title,
      type: "circle",
      x: 0,
      y: 0,
      size: baseSize,
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
    // Both endpoints must be in the expanded node set
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue;

    // In repo filter mode, only keep edges that touch the filtered repo
    if (filterMode === "repo" && filter !== "all") {
      if (!baseNodeIds.has(edge.source) && !baseNodeIds.has(edge.target)) continue;
    }

    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      if (!graph.hasEdge(edge.source, edge.target)) {
        const auth = edge.authority;
        const srcRepo = (graph.getNodeAttribute(edge.source, "repo") as string) || "";
        const tgtRepo = (graph.getNodeAttribute(edge.target, "repo") as string) || "";

        // Luminous edge coloring matching domain clusters or authority links
        let edgeColor = "rgba(148, 163, 184, 0.15)";
        if (auth && AUTHORITY_EDGE_COLORS[auth]) {
          edgeColor = AUTHORITY_EDGE_COLORS[auth];
        } else if (srcRepo && srcRepo === tgtRepo && REPO_COLORS[srcRepo]) {
          edgeColor = REPO_COLORS[srcRepo] + "44"; // Translucent glow matching repo nebula
        } else if (srcRepo !== tgtRepo) {
          edgeColor = "rgba(56, 189, 248, 0.25)"; // Radiant cross-cluster bridge
        }

        const edgeSize = auth ? (AUTHORITY_EDGE_SIZE[auth] || 1.0) : 0.6;
        graph.addEdge(edge.source, edge.target, {
          color: edgeColor,
          size: edgeSize,
          edgeType: edge.type,
          authority: auth || null,
        });
      }
    }
  }

  // Restore the May 9 / April 28 Celestial Circular Seeding + ForceAtlas2 Inward Gravity
  circular.assign(graph, { scale: 300 });

  if (graph.order > 0) {
    const settings = forceAtlas2.inferSettings(graph);
    settings.gravity = 0.5;
    settings.scalingRatio = 4.0;
    settings.barnesHutOptimize = graph.order > 80;
    settings.barnesHutTheta = 0.6;
    const iterations = graph.order > 500 ? 350 : graph.order > 100 ? 250 : 160;
    forceAtlas2.assign(graph, { iterations, settings });
  }

  return graph;
}

const GraphCanvas = forwardRef(function GraphCanvas(
  {
    nodes, edges, clusters, activeEntryPointNodeIds, hoveredNodeId, selectedNodeId, focusedNodeId,
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
  const activeEntryPointNodeIdsRef = useRef<Set<string>>(new Set(activeEntryPointNodeIds || []));
  const coreNodeIdsRef = useRef<string[]>(coreNodeIds || []);
  const visibleNodeIdsRef = useRef<Set<string>>(new Set());
  // Cluster Node IDs map ref (computed in fitVisible, but needed for quick check)
  const clusterNodeIdsRef = useRef<Map<string, Set<string>>>(new Map());
  const lastRefreshTimeRef = useRef<number | null>(null);
  const lastFitDiagnosticsRef = useRef<string>("none");
  const fitCountRef = useRef(0);
  const lastFitTimeRef = useRef<number | null>(null);
  
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
  const fitAllNodes = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;

    const camera = sigma.getCamera() as any;
    if (!camera) return;

    const dur = getReducedMotionDurations();
    if (typeof camera.animatedReset === "function") {
      camera.animatedReset({ duration: dur.camera });
    } else if (typeof camera.setState === "function") {
      camera.setState({ x: 0.5, y: 0.5, ratio: 1 });
    }
    sigma.refresh();
  }, []); // fitAllNodes

  const fitVisible = useCallback(() => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;

    const container = containerRef.current;
    if (!container) return;

    // Build clusterNodeIds map for visibility checks
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
        if (activeEntryPointNodeIdsRef.current.has(nodeId)) return true;
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

    const camera = sigma.getCamera() as any;
    if (!camera) return;
    const dur = getReducedMotionDurations();

    // Check if focused or selected node
    const targetNodeId = focusedNodeIdRef.current || selectedNodeIdRef.current;
    if (targetNodeId && graph.hasNode(targetNodeId)) {
      const nodeDisplay = (sigma as any).getNodeDisplayData?.(targetNodeId);
      if (nodeDisplay && typeof nodeDisplay.x === "number" && typeof nodeDisplay.y === "number") {
        if (typeof camera.animate === "function") {
          camera.animate({ x: nodeDisplay.x, y: nodeDisplay.y, ratio: 0.35 }, { duration: dur.camera });
        } else {
          camera.setState({ x: nodeDisplay.x, y: nodeDisplay.y, ratio: 0.35 });
        }
        try { sigma.refresh(); } catch (err) { console.warn("[GraphCanvas] fit focus refresh warning:", err); }
        return;
      }
    }

    const visibleNodeIds: string[] = [];
    for (const nodeId of graph.nodes()) {
      if (isNodeVisible(nodeId)) visibleNodeIds.push(nodeId);
    }
    if (visibleNodeIds.length === 0) {
      if (typeof camera.animatedReset === "function") {
        camera.animatedReset({ duration: dur.camera });
      } else {
        camera.setState({ x: 0.5, y: 0.5, ratio: 1 });
      }
      try { sigma.refresh(); } catch (err) { console.warn("[GraphCanvas] fit reset refresh warning:", err); }
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let count = 0;
    for (const id of visibleNodeIds) {
      const data = (sigma as any).getNodeDisplayData?.(id);
      if (data && typeof data.x === "number" && typeof data.y === "number") {
        if (data.x < minX) minX = data.x;
        if (data.x > maxX) maxX = data.x;
        if (data.y < minY) minY = data.y;
        if (data.y > maxY) maxY = data.y;
        count++;
      }
    }

    if (count === 0) {
      if (typeof camera.animatedReset === "function") {
        camera.animatedReset({ duration: dur.camera });
      } else {
        camera.setState({ x: 0.5, y: 0.5, ratio: 1 });
      }
      try { sigma.refresh(); } catch (err) { console.warn("[GraphCanvas] fit reset refresh warning:", err); }
      return;
    }

    if (count === 1) {
      // Exactly 1 visible node: center directly on it with a clear, comfortable zoom
      if (typeof camera.animate === "function") {
        camera.animate({ x: minX, y: minY, ratio: 0.35 }, { duration: dur.camera });
      } else {
        camera.setState({ x: minX, y: minY, ratio: 0.35 });
      }
      try { sigma.refresh(); } catch (err) { console.warn("[GraphCanvas] fit single node warning:", err); }
      return;
    }

    const cX = (minX + maxX) / 2;
    const cY = (minY + maxY) / 2;
    const spanX = Math.max(0.01, maxX - minX);
    const spanY = Math.max(0.01, maxY - minY);
    const aspect = container && container.clientHeight > 0
      ? container.clientWidth / container.clientHeight
      : 1.5;
    const effectiveSpan = Math.max(spanX, spanY * aspect);

    // Padding multiplier: small node sets (e.g. 4 nodes) get generous breathing room so they don't over-zoom
    const padding = count <= 6 ? 2.5 : count <= 16 ? 1.8 : 1.35;
    const targetRatio = Math.max(0.2, Math.min(effectiveSpan * padding, 2.0));

    if (typeof camera.animate === "function") {
      camera.animate({ x: cX, y: cY, ratio: targetRatio }, { duration: dur.camera });
    } else {
      camera.setState({ x: cX, y: cY, ratio: targetRatio });
    }
    try { sigma.refresh(); } catch (err) { console.warn("[GraphCanvas] fit refresh warning:", err); }
  }, []); // fitVisible (respects filters)

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
        
        // Check for NaN or extreme camera ratios
        if (isNaN(state.ratio) || state.ratio < 0.01 || state.ratio > 100) {
          fitVisible();
          consecutiveIssues = 0;
          return;
        }
        
        consecutiveIssues = 0;
      } catch (err) {
        consecutiveIssues++;
        if (consecutiveIssues >= 5) {
          try { fitVisible(); } catch {}
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

  const zoomIn = useCallback(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    const camera = sigma.getCamera() as any;
    const dur = getReducedMotionDurations();
    camera.animatedZoom({ duration: dur.camera });
  }, []);

  const zoomOut = useCallback(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    const camera = sigma.getCamera() as any;
    const dur = getReducedMotionDurations();
    camera.animatedUnzoom({ duration: dur.camera });
  }, []);

  const focusCluster = useCallback((targetKey: string) => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;
    const camera = sigma.getCamera() as any;
    const dur = getReducedMotionDurations();
    const key = targetKey.toLowerCase();
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let count = 0;
    
    // Check if targeting top authority hubs directly
    if (key === "core" || key === "hubs" || key === "authority") {
      const topNodes = graph.nodes()
        .filter(n => graph.degree(n) >= 8)
        .slice(0, 30);
      for (const node of topNodes) {
        const data = (sigma as any).getNodeDisplayData?.(node);
        if (data && typeof data.x === "number" && typeof data.y === "number") {
          if (data.x < minX) minX = data.x;
          if (data.x > maxX) maxX = data.x;
          if (data.y < minY) minY = data.y;
          if (data.y > maxY) maxY = data.y;
          count++;
        }
      }
    } else {
      for (const node of graph.nodes()) {
        const repo = ((graph.getNodeAttribute(node, "repo") as string) || "").toLowerCase();
        const type = ((graph.getNodeAttribute(node, "nodeType") as string) || "").toLowerCase();
        const isMatch =
          (key === "swarm" && repo.includes("swarm")) ||
          (key === "kernel" && (repo.includes("kernel") || repo.includes("deepseek") || repo.includes("deliberate"))) ||
          (key === "archivist" && repo.includes("archivist")) ||
          (key === "library" && (repo.includes("library") || repo.includes("self-organizing"))) ||
          (key === "lanes" && (repo.includes("archivist") || repo.includes("library") || repo.includes("self-organizing") || repo.includes("swarm") || repo.includes("kernel"))) ||
          repo === key ||
          type === key;

        if (isMatch) {
          const data = (sigma as any).getNodeDisplayData?.(node);
          if (data && !data.hidden && typeof data.x === "number" && typeof data.y === "number") {
            if (data.x < minX) minX = data.x;
            if (data.x > maxX) maxX = data.x;
            if (data.y < minY) minY = data.y;
            if (data.y > maxY) maxY = data.y;
            count++;
          }
        }
      }
    }
    
    if (count > 0 && typeof camera.animate === "function") {
      const cX = (minX + maxX) / 2;
      const cY = (minY + maxY) / 2;
      const spanX = Math.max(0.05, maxX - minX);
      const spanY = Math.max(0.05, maxY - minY);
      const effectiveSpan = Math.max(spanX, spanY);
      const targetRatio = Math.max(0.2, Math.min(effectiveSpan * 1.35, 1.0));
      camera.animate({ x: cX, y: cY, ratio: targetRatio }, { duration: dur.camera * 2 });
    }
  }, []);

  useImperativeHandle(ref, () => ({ fitVisible, zoomIn, zoomOut, focusCluster }), [fitVisible, zoomIn, zoomOut, focusCluster]);

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
    activeEntryPointNodeIdsRef.current = new Set(activeEntryPointNodeIds || []);
  }, [activeEntryPointNodeIds]);
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
        if (activeEntryPointNodeIdsRef.current.has(nodeId)) return true;
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

    // Compute effective label settings based on density: suppress overview stickers, highlight on hover/focus
    const effectiveLabelSize = density === "overview"
      ? Math.round(baseLabelSizeRef.current * 1.2)
      : Math.max(11, baseLabelSizeRef.current);
    const effectiveLabelThreshold = 35;
    
    let renderer: Sigma;
    try {
      renderer = new Sigma(graph, containerRef.current, {
        allowInvalidContainer: true,
        defaultNodeType: "circle",
        renderLabels: true,
        renderEdgeLabels: false,
        labelFont: "DM Sans, sans-serif",
        labelSize: effectiveLabelSize,
        labelWeight: "600",
        labelColor: { color: "#F1F5F9" },
        labelRenderedSizeThreshold: effectiveLabelThreshold,
        nodeProgramClasses: NODE_PROGRAMS,
        defaultDrawNodeLabel: drawCosmicNodeLabel,
        defaultDrawNodeHover: drawCosmicNodeHover,
        defaultEdgeColor: "rgba(148, 163, 184, 0.12)",
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
        stagePadding: 30,
        nodeReducer: (node, data) => {
          const res: any = { ...data, type: "circle" };
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

          // Ghost Bridge styling: when filtering by repo, external bridge nodes render as subtle ghost anchors
          if (filterMode === "repo" && filter !== "all" && (data as any).repo !== filter) {
            res.color = "rgba(148, 163, 184, 0.45)";
            res.size = Math.max(2.0, (res.size || 4) * 0.75);
            res.zIndex = 1;
            res.label = "";
            return res;
          }

          // Core node accent for understand mode: subtle size boost and zIndex, no permanent hover box
          const coreNodes = coreNodeIdsRef.current;
          if (coreNodes.length > 0 && coreNodes.includes(node)) {
            res.zIndex = 8;
            res.size = (res.size || 8) * 1.15;
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
            if (node === hovered) {
              res.highlighted = true;
              res.zIndex = 10;
            } else if (neighborIds.has(node)) {
              res.highlighted = true;
              res.label = "";
              res.zIndex = 9;
            } else {
              res.color = HOVER_DIM_COLOR;
              res.label = "";
            }
            return res;
          }

          // Only color nodes red if the Conflicts meaning layer is active!
          if (activeLayersRef.current.includes("conflicts")) {
            if (nodeStatus === "CONFLICTED") {
              res.color = STATUS_COLORS.CONFLICTED;
              res.zIndex = 5;
            } else if (nodeStatus === "QUARANTINED") {
              res.color = STATUS_COLORS.QUARANTINED;
              res.zIndex = 5;
            }
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

          const isHovered = hovered === node;
          const isSelected = selected === node;
          const isFocused = focused === node;

          // Pure celestial view: hide text labels on unselected/unhovered nodes in overview & mid densities
          if (!isSelected && !isFocused && !isHovered) {
            res.label = "";
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
      // Initial camera is initialized by Sigma normalized at { x: 0.5, y: 0.5, ratio: 1 }
      
      // Initial refresh and timestamp
      renderer.refresh();
      lastRefreshTimeRef.current = Date.now();
      if (typeof window !== "undefined") {
        (window as any).__sigma = renderer;
        (window as any).__graph = graph;
      }
      
      // Debug: log initial state
      const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      if (urlParams.has('debugGraph')) {
        console.log("[GraphCanvas] init", {
          graphNodes: graph.order,
          container: containerRef.current ? { w: containerRef.current.clientWidth, h: containerRef.current.clientHeight } : null,
          camera: renderer.getCamera().getState(),
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
      try {
        onCameraUpdateRef.current?.(camera.ratio);
      } catch (err) {
        console.warn("[GraphCanvas] camera update warning:", err);
      }
    };
    camera.on("updated", handleCameraUpdate);

    sigmaRef.current = renderer;
    if (typeof window !== "undefined") {
      (window as any).__sigma = renderer;
      (window as any).__graph = graph;
    }
    try {
      onGraphReadyRef.current?.(graph, renderer);
    } catch (err) {
      console.warn("[GraphCanvas] onGraphReady warning:", err);
    }

     // Ensure container is laid out before fitting
      const container = containerRef.current;
      if (container) {
        // Use ResizeObserver to wait for final layout, then fit
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              try {
                fitVisible();
                if (sigmaRef.current) sigmaRef.current.refresh();
              } catch (err) {
                console.warn("[GraphCanvas] resize fit error:", err);
              }
              resizeObserver.disconnect();
              break;
            }
          }
        });
        resizeObserver.observe(container);
        
        // Also try immediate fit after a short delay as fallback
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              if (sigmaRef.current && container.clientWidth > 0 && container.clientHeight > 0) {
                fitVisible();
                sigmaRef.current.refresh();
              }
            } catch (err) {
              console.warn("[GraphCanvas] initial fit error:", err);
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
   }, [nodes, edges, clusters, filter, filterMode, density, fitVisible]);
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
        fitCount: fitCountRef.current,
        lastFitTime: lastFitTimeRef.current ? new Date(lastFitTimeRef.current).toISOString().slice(11, 23) : 'never',
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
      className="w-full h-full outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-inset relative cosmic-canvas-wrapper"
      role="application"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={{ minHeight: "600px", width: "100%", height: "100%" }}
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

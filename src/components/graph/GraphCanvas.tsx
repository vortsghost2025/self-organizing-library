"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import type { GraphNode, GraphEdge, Cluster, DensityLevel } from "@/lib/graph-types";
import { STATUS_COLORS, TYPE_COLORS, REPO_COLORS } from "@/lib/graph-types";

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
  activeLayers: string[];
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

const DIM_COLOR = "#2A2A38";
const PATH_HIGHLIGHT = "#F59E0B";

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
  filterMode,
  filter,
  onNodeClick,
  onNodeHover,
  onStageClick,
  onCameraUpdate,
  onGraphReady,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [cameraRatio, setCameraRatio] = useState(1);

  // Refs to avoid closure staleness
  const refs = useRef({
    hoveredNodeId: hoveredNodeId,
    selectedNodeId,
    focusedNodeId,
    pathNodes,
    pathEdges,
    clusters,
  });
  refs.current = { hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, clusters };

  // Decide which nodes to render (LOD) — progressively disclose
  const visibleNodeIds = useMemo(() => {
    const n = nodes;

    // Zoomed in on cluster/entry: show all filtered nodes
    if (activeEntryPoint || activeClusterId) {
      return new Set(n.map(x => x.id));
    }

    // LOD by camera ratio: far (<0.55), mid (0.55–1.25), close (>=1.25)
    if (cameraRatio < 0.55) {
      // Far: only cluster representatives (map-level dots)
      const reps = new Set(clusters.map(c => c.representativeId).filter(Boolean));
      return new Set(n.filter(x => reps.has(x.id)).map(x => x.id));
    }

    if (cameraRatio < 1.25) {
      // Mid: high-importance + medium-importance
      // Medium-importance includes nodes connected to selection/context
      const activeIds = new Set<string>();
      if (focusedNodeId) activeIds.add(focusedNodeId);
      if (selectedNodeId) activeIds.add(selectedNodeId);
      if (hoveredNodeId) activeIds.add(hoveredNodeId);
      if (activeEntryPoint) activeIds.add(activeEntryPoint);
      if (activeClusterId) {
        const c = clusters.find(x => x.id === activeClusterId);
        if (c) c.nodeIds.forEach(id => activeIds.add(id));
      }

      const activeNeighbors = new Set<string>();
      for (const edge of edges) {
        if (activeIds.has(edge.source)) activeNeighbors.add(edge.target);
        if (activeIds.has(edge.target)) activeNeighbors.add(edge.source);
      }

      const important = new Set<string>();
      const medium    = new Set<string>();

      for (const node of n) {
        const isHigh = node.authorityDepth >= 40 ||
                       node.verificationCount >= 2 ||
                       node.connectionCount >= 4 ||
                       node.status === "CONFLICTED";
        if (isHigh) important.add(node.id);
      }

      for (const node of n) {
        if (important.has(node.id)) continue;
        const isMedium = node.authorityDepth >= 25 ||
                         node.verificationCount >= 1 ||
                         node.connectionCount >= 2 ||
                         activeNeighbors.has(node.id);
        if (isMedium) medium.add(node.id);
      }

      const combined = new Set<string>();
      important.forEach(id => combined.add(id));
      medium.forEach(id => combined.add(id));
      return combined;
    }

    // Close zoom: all nodes
    return new Set(n.map(x => x.id));
  }, [nodes, edges, clusters, activeEntryPoint, activeClusterId, cameraRatio, focusedNodeId, selectedNodeId, hoveredNodeId]);

  // Label policy per zoom: never global; far=none, mid=top-5 important, close=top-12 important
  const labelPermittedNodeIds = useMemo(() => {
    if (cameraRatio < 0.55) return new Set<string>();

    if (cameraRatio < 1.25) {
      // Mid: top 5 by importance among visible
      const scored = nodes
        .filter(n => visibleNodeIds.has(n.id))
        .map(n => ({
          id: n.id,
          importance: Math.sqrt(n.connectionCount) * 0.8 + n.verificationCount * 0.6 + n.authorityDepth / 40,
        }))
        .sort((a, b) => b.importance - a.importance);
      return new Set(scored.slice(0, 5).map(x => x.id));
    }

    // Close: top 12 by importance among visible
    const scored = nodes
      .filter(n => visibleNodeIds.has(n.id))
      .map(n => ({
        id: n.id,
        importance: Math.sqrt(n.connectionCount) * 0.8 + n.verificationCount * 0.6 + n.authorityDepth / 40,
      }))
      .sort((a, b) => b.importance - a.importance);
    return new Set(scored.slice(0, 12).map(x => x.id));
  }, [nodes, visibleNodeIds, cameraRatio]);

  // Build graph
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    }

    const graph = new Graph({ type: "undirected", multi: false });

     // Add nodes (with visual hierarchy)
     for (const node of nodes) {
       if (!visibleNodeIds.has(node.id)) continue;

       // Importance-based sizing: stronger spread
       // base + sqrt(connections)*0.8 + verification*0.6
       let base = node.type === "paper" ? 14 : node.type === "doc" ? 10 : 7;
       const spread = Math.sqrt(node.connectionCount) * 0.8 + node.verificationCount * 0.6;
       const size = Math.max(base, base + spread);

       // Color: by repo if filtered by repo; else by status
       let color: string;
       if (filterMode === "repo" && filter !== "all") {
         color = REPO_COLORS[filter] || "#6B7280";
       } else {
         color = STATUS_COLORS[node.status] || "#6B7280";
       }

       graph.addNode(node.id, {
         label: node.title,
         x: 0,
         y: 0,
         size,
         color,
       });
     }

    // Add edges (only between visible) — store source/target for reducer context
    for (const edge of edges) {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          color: edge.authority ? "#60A5FA" : "rgba(120,120,140,0.04)",
          size: edge.authority ? 0.7 : 0.2,
          authority: !!edge.authority,
          source: edge.source,
          target: edge.target,
        });
      }
    }

    // Layout: circular for clarity
    circular.assign(graph, { scale: Math.min(container.clientWidth, container.clientHeight) * 0.4 });

    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      labelFont: "Inter, DM Sans, sans-serif",
      labelSize: 13,
      labelWeight: "600",
      labelColor: { color: "#E5E7EB" },
      labelRenderedSizeThreshold: 0,
      defaultEdgeColor: "#1E1E24",
      defaultNodeType: "circle",
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      stagePadding: 20,
       nodeReducer: (node, data) => {
         const r = refs.current;
         const isActive = r.hoveredNodeId === node || r.selectedNodeId === node || r.focusedNodeId === node || r.pathNodes.has(node);
         const res = { ...data };

         if (isActive) {
           res.size = (data.size || 8) * 1.3;
           res.highlighted = true;
           res.zIndex = 99;
           // label stays (full)
         } else {
           // Non-active
           if (labelPermittedNodeIds.has(node)) {
             // Keep original size and color; label stays
             res.size = data.size;
             res.color = data.color;
           } else {
             // Dim aggressively and clear label
             res.color = DIM_COLOR;
             res.size = (data.size || 8) * 0.5;
             res.label = "";
           }
         }
         return res;
       },
       edgeReducer: (edge, data) => {
         const r = refs.current;
         const onPath = r.pathEdges.has(edge);
         const edgeSource = (data as any).source as string | undefined;
         const edgeTarget = (data as any).target as string | undefined;

         const connectedToActive =
           edgeSource && edgeTarget && (
             r.hoveredNodeId === edgeSource || r.hoveredNodeId === edgeTarget ||
             r.selectedNodeId === edgeSource || r.selectedNodeId === edgeTarget ||
             r.focusedNodeId === edgeSource || r.focusedNodeId === edgeTarget
           );

         if (onPath) {
           return { ...data, color: PATH_HIGHLIGHT, size: 0.8 };
         }

         if (connectedToActive) {
           const isAuthority = (data as any).authority;
           if (isAuthority) {
             return { ...data, size: 0.9 };
           }
           return { ...data, color: "rgba(120,120,140,0.25)", size: 0.35 };
         }

         // Background
         return { ...data, size: (data.size || 0.15) * 0.5 };
       },
    });

    sigmaRef.current = renderer;
    graphRef.current = graph;
    onGraphReady(graph, renderer);

    const updateRatio = () => {
      const ratio = renderer.getCamera().ratio;
      setCameraRatio(ratio);
      onCameraUpdate(ratio);
    };
    renderer.getCamera().addListener("updated", updateRatio);
    updateRatio();

    renderer.on("clickNode", (e) => onNodeClick(e.node));
    renderer.on("enterNode", (e) => onNodeHover(e.node));
    renderer.on("leaveNode", () => onNodeHover(null));

    return () => {
      renderer.kill();
    };
  }, [nodes, edges, clusters, filterMode, filter, visibleNodeIds, activeEntryPoint, activeClusterId]);

  return <div ref={containerRef} className="w-full h-full" aria-label="Interactive governance graph" />;
}

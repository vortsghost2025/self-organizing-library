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

  // Decide which nodes to render (LOD)
  const visibleNodeIds = useMemo(() => {
    // Zoomed in on cluster/entry: show all filtered nodes
    if (activeEntryPoint || activeClusterId) {
      return new Set(nodes.map(n => n.id));
    }

    // LOD by density/camera (fallback)
    if (density === "overview") {
      const reps = new Set(clusters.map(c => c.representativeId).filter(Boolean));
      return new Set(nodes.filter(n => reps.has(n.id)).map(n => n.id));
    }

    return new Set(nodes.map(n => n.id));
  }, [nodes, clusters, activeEntryPoint, activeClusterId, density]);

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

      // Importance-based sizing
      let base = node.type === "paper" ? 14 : node.type === "doc" ? 10 : 7;
      const bonus = Math.min(node.connectionCount * 0.3, 6) + (node.verificationCount * 0.4);
      const size = Math.max(base, base + bonus);

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

    // Add edges (only between visible)
    for (const edge of edges) {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          color: edge.authority ? "#60A5FA" : "rgba(120,120,140,0.1)",
          size: edge.authority ? 0.7 : 0.2,
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
        if (!isActive) {
          res.color = DIM_COLOR;
          res.size = (data.size || 8) * 0.5;
          res.label = "";
        } else {
          res.size = (data.size || 8) * 1.3;
          res.highlighted = true;
          res.zIndex = 99;
        }
        return res;
      },
      edgeReducer: (edge, data) => {
        const onPath = refs.current.pathEdges.has(edge);
        return {
          ...data,
          color: onPath ? PATH_HIGHLIGHT : "rgba(100,100,140,0.08)",
          size: onPath ? 0.8 : 0.15,
        };
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

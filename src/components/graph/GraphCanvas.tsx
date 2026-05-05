"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import type { GraphNode, GraphEdge, Cluster, DensityLevel, MeaningLayer, AuthorityEdgeType } from "@/lib/graph-types";
import { STATUS_COLORS, TYPE_COLORS, REPO_COLORS, MEANING_LAYER_EDGES, AUTHORITY_EDGE_COLORS, AUTHORITY_EDGE_SIZE } from "@/lib/graph-types";

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
  searchQuery,
  filterMode,
  filter,
  coreNodeIds,
  onNodeClick,
  onNodeHover,
  onStageClick,
  onCameraUpdate,
  onGraphReady,
  onWebGLUnavailable,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [cameraRatio, setCameraRatio] = useState(1);
  const coreNodeIdsSet = useMemo(() => new Set(coreNodeIds || []), [coreNodeIds]);

  const refs = useRef({
    hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, clusters, coreNodeIdsSet, activeLayers,
  });
  refs.current = { hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, clusters, coreNodeIdsSet, activeLayers };

  const visibleNodeIds = useMemo(() => {
    const n = nodes;

    if (activeEntryPoint || activeClusterId) {
      return new Set(n.map(x => x.id));
    }

    if (cameraRatio < 0.35) {
      const reps = new Set(clusters.map(c => c.representativeId).filter(Boolean));
      const topByImportance = n
        .filter(x => !reps.has(x.id))
        .sort((a, b) => (b.authorityDepth + b.verificationCount * 10 + b.connectionCount) - (a.authorityDepth + a.verificationCount * 10 + a.connectionCount))
        .slice(0, 20)
        .map(x => x.id);
      return new Set([...reps, ...topByImportance]);
    }

    if (cameraRatio < 0.8) {
      const activeIds = new Set<string>();
      if (focusedNodeId) activeIds.add(focusedNodeId);
      if (selectedNodeId) activeIds.add(selectedNodeId);
      if (hoveredNodeId) activeIds.add(hoveredNodeId);

      const activeNeighbors = new Set<string>();
      for (const edge of edges) {
        if (activeIds.has(edge.source)) activeNeighbors.add(edge.target);
        if (activeIds.has(edge.target)) activeNeighbors.add(edge.source);
      }

      const combined = new Set<string>();
      for (const node of n) {
        const isHigh = node.authorityDepth >= 40 || node.verificationCount >= 2 || node.connectionCount >= 4 || node.status === "CONFLICTED";
        const isMedium = node.authorityDepth >= 20 || node.verificationCount >= 1 || node.connectionCount >= 2 || activeNeighbors.has(node.id);
        if (isHigh || isMedium) combined.add(node.id);
      }
      return combined;
    }

    return new Set(n.map(x => x.id));
  }, [nodes, edges, clusters, activeEntryPoint, activeClusterId, cameraRatio, focusedNodeId, selectedNodeId, hoveredNodeId]);

  const labelPermittedNodeIds = useMemo(() => {
    if (cameraRatio < 0.35) {
      const reps = new Set(clusters.map(c => c.representativeId).filter(Boolean));
      return reps;
    }

    if (cameraRatio < 0.8) {
      const scored = nodes
        .filter(n => visibleNodeIds.has(n.id))
        .map(n => ({
          id: n.id,
          importance: Math.sqrt(n.connectionCount) * 0.8 + n.verificationCount * 0.6 + n.authorityDepth / 40,
        }))
        .sort((a, b) => b.importance - a.importance);
      return new Set(scored.slice(0, 8).map(x => x.id));
    }

    const scored = nodes
      .filter(n => visibleNodeIds.has(n.id))
      .map(n => ({
        id: n.id,
        importance: Math.sqrt(n.connectionCount) * 0.8 + n.verificationCount * 0.6 + n.authorityDepth / 40,
      }))
      .sort((a, b) => b.importance - a.importance);
    return new Set(scored.slice(0, 15).map(x => x.id));
  }, [nodes, visibleNodeIds, cameraRatio, clusters]);

  const visibleNodeIdsKey = useMemo(() => {
    return Array.from(visibleNodeIds).sort().join(",");
  }, [visibleNodeIds]);

  const allowedEdgeTypes = useMemo(() => {
    const allowed = new Set<string>();
    for (const layer of activeLayers) {
      const layerEdges = MEANING_LAYER_EDGES[layer];
      if (layerEdges) layerEdges.forEach(e => allowed.add(e));
    }
    return allowed.size > 0 ? allowed : null;
  }, [activeLayers]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isWebGLAvailable()) {
      onWebGLUnavailable?.();
      return;
    }

    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    }

    const graph = new Graph({ type: "undirected", multi: false });

    for (const node of nodes) {
      if (!visibleNodeIds.has(node.id)) continue;

      let base = node.type === "doc" ? 12 : node.type === "config" ? 9 : 7;
      const spread = Math.sqrt(node.connectionCount) * 0.8 + node.verificationCount * 0.6;
      let size = Math.max(base, base + spread);

      if (coreNodeIdsSet.has(node.id)) {
        size = size * 1.3;
      }

      let color: string;
      if (filterMode === "repo" && filter !== "all") {
        color = REPO_COLORS[filter] || "#6B7280";
      } else {
        color = STATUS_COLORS[node.status] || "#6B7280";
      }

      graph.addNode(node.id, {
        label: node.title,
        x: 0, y: 0,
        size,
        color,
        coreNode: coreNodeIdsSet.has(node.id),
      });
    }

    for (const edge of edges) {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;

      if (allowedEdgeTypes && edge.authority && !allowedEdgeTypes.has(edge.authority)) continue;

      if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
        const edgeColor = edge.authority ? (AUTHORITY_EDGE_COLORS[edge.authority] || "#60A5FA") : "rgba(120,120,140,0.04)";
        const edgeSize = edge.authority ? (AUTHORITY_EDGE_SIZE[edge.authority] || 0.5) : 0.15;

        graph.addEdge(edge.source, edge.target, {
          color: edgeColor,
          size: edgeSize,
          authority: !!edge.authority,
          authorityType: edge.authority || null,
          source: edge.source,
          target: edge.target,
        });
      }
    }

    circular.assign(graph, { scale: Math.min(container.clientWidth, container.clientHeight) * 0.4 });

    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      labelFont: "Inter, DM Sans, sans-serif",
      labelSize: 14,
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
        const isCore = r.coreNodeIdsSet.has(node);
        const res = { ...data };

        if (isActive) {
          res.size = (data.size || 8) * 1.4;
          res.highlighted = true;
          res.zIndex = 99;
        } else if (isCore) {
          res.size = (data.size || 8) * 1.15;
          res.zIndex = 50;
          res.color = data.color;
          if (!labelPermittedNodeIds.has(node)) {
            res.label = "";
          }
        } else {
          if (labelPermittedNodeIds.has(node)) {
            res.size = data.size;
            res.color = data.color;
          } else {
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
          return { ...data, color: PATH_HIGHLIGHT, size: 1.0 };
        }

        if (connectedToActive) {
          const isAuthority = (data as any).authority;
          if (isAuthority) {
          const authType = (data as any).authorityType as AuthorityEdgeType | null;
          if (authType && AUTHORITY_EDGE_COLORS[authType]) {
            return { ...data, color: AUTHORITY_EDGE_COLORS[authType], size: AUTHORITY_EDGE_SIZE[authType] || 0.9 };
            }
            return { ...data, size: 0.9 };
          }
          return { ...data, color: "rgba(120,120,140,0.25)", size: 0.35 };
        }

        return { ...data, size: (data.size || 0.15) * 0.4 };
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
    renderer.on("clickStage", () => onStageClick());

    return () => {
      renderer.kill();
    };
  }, [nodes, edges, clusters, filterMode, filter, visibleNodeIdsKey, activeEntryPoint, activeClusterId, coreNodeIds, allowedEdgeTypes, onGraphReady, onCameraUpdate, onNodeClick, onNodeHover, onStageClick, onWebGLUnavailable]);

  return <div ref={containerRef} className="w-full h-full" aria-label="Interactive governance graph" />;
}

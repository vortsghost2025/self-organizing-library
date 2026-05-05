"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphNode, GraphEdge, Cluster, DensityLevel, MeaningLayer, AuthorityEdgeType } from "@/lib/graph-types";
import { STATUS_COLORS, REPO_COLORS, MEANING_LAYER_EDGES, AUTHORITY_EDGE_COLORS, AUTHORITY_EDGE_SIZE } from "@/lib/graph-types";

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

const MIN_NODE_SIZE = 4;
const MAX_NODE_SIZE = 20;
const BASE_NODE_SIZE = 6;
const DIM_COLOR = "#2A2A38";
const PATH_HIGHLIGHT = "#F59E0B";
const EDGE_BG_OPACITY = 0.03;
const EDGE_BG_AUTHORITY_OPACITY = 0.08;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const REPO_REGIONS: Record<string, { angle: number; label: string }> = {
  "self-organizing-library": { angle: 0, label: "Library" },
  "Archivist-Agent": { angle: Math.PI / 2, label: "Archivist" },
  "kernel-lane": { angle: Math.PI, label: "Kernel" },
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": { angle: 3 * Math.PI / 2, label: "SwarmMind" },
};

function importanceScore(n: GraphNode): number {
  return Math.sqrt(n.connectionCount) * 0.6 + n.verificationCount * 0.4 + n.authorityDepth / 60;
}

function clampSize(base: number, spread: number): number {
  return Math.min(MAX_NODE_SIZE, Math.max(MIN_NODE_SIZE, base + spread));
}

export default function GraphCanvas({
  nodes, edges, clusters,
  hoveredNodeId, selectedNodeId, focusedNodeId,
  pathNodes, pathEdges, pathSource, pathTarget,
  activeLayers, density, activeEntryPoint, activeClusterId,
  searchQuery, filterMode, filter,
  coreNodeIds,
  onNodeClick, onNodeHover, onStageClick, onCameraUpdate, onGraphReady, onWebGLUnavailable,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [cameraRatio, setCameraRatio] = useState(1);
  const coreNodeIdsSet = useMemo(() => new Set(coreNodeIds || []), [coreNodeIds]);

  const refs = useRef({ hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, clusters, coreNodeIdsSet, activeLayers });
  refs.current = { hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, clusters, coreNodeIdsSet, activeLayers };

  const visibleNodeIds = useMemo(() => {
    if (activeEntryPoint || activeClusterId) return new Set(nodes.map(x => x.id));

    if (cameraRatio < 0.35) {
      const reps = new Set(clusters.map(c => c.representativeId).filter(Boolean));
      const top = nodes
        .filter(x => !reps.has(x.id))
        .sort((a, b) => importanceScore(b) - importanceScore(a))
        .slice(0, 20)
        .map(x => x.id);
      return new Set([...reps, ...top]);
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
      for (const node of nodes) {
        const isHigh = node.authorityDepth >= 40 || node.verificationCount >= 2 || node.connectionCount >= 4 || node.status === "CONFLICTED";
        const isMedium = node.authorityDepth >= 20 || node.verificationCount >= 1 || node.connectionCount >= 2 || activeNeighbors.has(node.id);
        if (isHigh || isMedium) combined.add(node.id);
      }
      return combined;
    }

    return new Set(nodes.map(x => x.id));
  }, [nodes, edges, clusters, activeEntryPoint, activeClusterId, cameraRatio, focusedNodeId, selectedNodeId, hoveredNodeId]);

  const labelPermittedNodeIds = useMemo(() => {
    if (cameraRatio < 0.35) return new Set<string>();
    if (cameraRatio < 0.8) {
      const scored = nodes
        .filter(n => visibleNodeIds.has(n.id))
        .map(n => ({ id: n.id, importance: importanceScore(n) }))
        .sort((a, b) => b.importance - a.importance);
      return new Set(scored.slice(0, 5).map(x => x.id));
    }
    const scored = nodes
      .filter(n => visibleNodeIds.has(n.id))
      .map(n => ({ id: n.id, importance: importanceScore(n) }))
      .sort((a, b) => b.importance - a.importance);
    return new Set(scored.slice(0, 10).map(x => x.id));
  }, [nodes, visibleNodeIds, cameraRatio, clusters]);

  const visibleNodeIdsKey = useMemo(() => Array.from(visibleNodeIds).sort().join(","), [visibleNodeIds]);

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

    if (!isWebGLAvailable()) { onWebGLUnavailable?.(); return; }

    if (sigmaRef.current) { sigmaRef.current.kill(); sigmaRef.current = null; graphRef.current = null; }

    const graph = new Graph({ type: "undirected", multi: false });
    const scale = Math.min(container.clientWidth, container.clientHeight) * 0.35;

    const repoGroups = new Map<string, string[]>();
    for (const node of nodes) {
      if (!visibleNodeIds.has(node.id)) continue;
      if (!repoGroups.has(node.repo)) repoGroups.set(node.repo, []);
      repoGroups.get(node.repo)!.push(node.id);
    }

    for (const node of nodes) {
      if (!visibleNodeIds.has(node.id)) continue;

      const spread = Math.sqrt(node.connectionCount) * 0.5 + node.verificationCount * 0.4;
      let size = clampSize(BASE_NODE_SIZE, spread);
      if (coreNodeIdsSet.has(node.id)) size = Math.min(MAX_NODE_SIZE, size * 1.15);

      let color: string;
      if (filterMode === "repo" && filter !== "all") {
        color = REPO_COLORS[filter] || "#6B7280";
      } else {
        color = STATUS_COLORS[node.status] || "#6B7280";
      }

      const region = REPO_REGIONS[node.repo];
      const regionAngle = region ? region.angle : Math.random() * Math.PI * 2;
      const importance = importanceScore(node);
      const radius = importance > 3 ? scale * (0.2 + Math.random() * 0.2) : scale * (0.5 + Math.random() * 0.4);

      const x = Math.cos(regionAngle) * radius + (Math.random() - 0.5) * scale * 0.15;
      const y = Math.sin(regionAngle) * radius + (Math.random() - 0.5) * scale * 0.15;

      graph.addNode(node.id, {
        label: node.title, x, y, size, color,
        coreNode: coreNodeIdsSet.has(node.id),
        repo: node.repo,
        importance,
      });
    }

    let authorityEdgeCount = 0;
    const MAX_AUTHORITY_EDGES = 200;

    const authorityEdges: GraphEdge[] = [];
    const nonAuthorityEdges: GraphEdge[] = [];
    for (const edge of edges) {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
      if (allowedEdgeTypes && edge.authority && !allowedEdgeTypes.has(edge.authority)) continue;
      if (edge.authority) authorityEdges.push(edge);
      else nonAuthorityEdges.push(edge);
    }

  for (const edge of authorityEdges) {
    if (authorityEdgeCount >= MAX_AUTHORITY_EDGES) break;
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
      const authType = edge.authority as AuthorityEdgeType;
      const authColor = AUTHORITY_EDGE_COLORS[authType] || "#60A5FA";
      graph.addEdge(edge.source, edge.target, {
        color: authColor,
        size: AUTHORITY_EDGE_SIZE[authType] || 0.5,
          authority: true,
          authorityType: edge.authority || null,
          source: edge.source, target: edge.target,
        });
        authorityEdgeCount++;
      }
    }

    for (const edge of nonAuthorityEdges.slice(0, 400)) {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          color: `rgba(120,120,140,${EDGE_BG_OPACITY})`,
          size: 0.1,
          authority: false,
          authorityType: null,
          source: edge.source, target: edge.target,
        });
      }
    }

    try {
      forceAtlas2.assign(graph, {
        iterations: 60,
        settings: {
          gravity: 8,
          scalingRatio: 4,
          barnesHutOptimize: true,
          slowDown: 1.5,
          linLogMode: true,
        },
      });
    } catch {
      // fallback: positions already set by region-based init
    }

    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      labelFont: "Inter, DM Sans, sans-serif",
      labelSize: 13,
      labelWeight: "600",
      labelColor: { color: "#D1D5DB" },
      labelRenderedSizeThreshold: 6,
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
          res.size = Math.min(MAX_NODE_SIZE, (data.size || BASE_NODE_SIZE) * 1.3);
          res.highlighted = true;
          res.zIndex = 99;
        } else if (isCore) {
          res.size = Math.min(MAX_NODE_SIZE, (data.size || BASE_NODE_SIZE) * 1.1);
          res.zIndex = 50;
          res.color = data.color;
          res.label = labelPermittedNodeIds.has(node) ? data.label : "";
        } else {
          if (labelPermittedNodeIds.has(node)) {
            res.size = data.size;
            res.color = data.color;
          } else {
            res.color = DIM_COLOR;
            res.size = Math.max(MIN_NODE_SIZE, (data.size || BASE_NODE_SIZE) * 0.55);
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
              return { ...data, color: AUTHORITY_EDGE_COLORS[authType], size: Math.min(1.5, AUTHORITY_EDGE_SIZE[authType] || 0.9) };
            }
            return { ...data, color: "#60A5FA", size: 0.7 };
          }
          return { ...data, color: "rgba(120,120,140,0.2)", size: 0.3 };
        }

        const isAuthority = (data as any).authority;
        if (isAuthority) {
          const authType = (data as any).authorityType as AuthorityEdgeType | null;
          const authColor = authType && AUTHORITY_EDGE_COLORS[authType] ? AUTHORITY_EDGE_COLORS[authType] : "#60A5FA";
          return { ...data, color: hexToRgba(authColor, EDGE_BG_AUTHORITY_OPACITY), size: 0.2 };
        }

        return { ...data, size: 0.05, color: `rgba(120,120,140,${EDGE_BG_OPACITY})` };
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

    return () => { renderer.kill(); };
  }, [nodes, edges, clusters, filterMode, filter, visibleNodeIdsKey, activeEntryPoint, activeClusterId, coreNodeIds, allowedEdgeTypes, onGraphReady, onCameraUpdate, onNodeClick, onNodeHover, onStageClick, onWebGLUnavailable]);

  return <div ref={containerRef} className="w-full h-full" aria-label="Interactive governance graph" />;
}

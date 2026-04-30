"use client";

import { useEffect, useRef, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphNode, GraphEdge, MeaningLayer, DensityLevel, Cluster, AuthorityEdgeType, GovernanceLayer, BridgeState } from "@/lib/graph-types";
import { MEANING_LAYER_EDGES, AUTHORITY_EDGE_COLORS, AUTHORITY_EDGE_SIZE, STATUS_COLORS, TYPE_COLORS, REPO_COLORS, GOVERNANCE_LAYER_COLORS, BRIDGE_STATE_COLORS } from "@/lib/graph-types";

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
  onNodeClick: (nodeId: string) => void;
  onNodeHover: (nodeId: string | null) => void;
  onStageClick: () => void;
  onCameraUpdate: (ratio: number) => void;
  onGraphReady: (graph: Graph, sigma: Sigma) => void;
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
    settings.gravity = 1;
    settings.scalingRatio = 2;
    settings.barnesHutOptimize = graph.order > 100;
    forceAtlas2.assign(graph, { iterations: 100, settings });
  }

  return graph;
}

export default function GraphCanvas({
  nodes, edges, clusters, hoveredNodeId, selectedNodeId, focusedNodeId,
  pathNodes, pathEdges, pathSource, pathTarget, activeLayers, density,
  activeEntryPoint, activeClusterId, searchQuery, filterMode, filter,
  visibleCount, onNodeClick, onNodeHover, onStageClick, onCameraUpdate, onGraphReady,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const baseLabelSizeRef = useRef(12);

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
    const updateBaseLabelSize = () => {
      const zoomLevel = typeof window !== "undefined" ? Math.round(window.devicePixelRatio * 100) / 100 : 1;
      baseLabelSizeRef.current = Math.round(12 * Math.max(1, zoomLevel));
    };
    updateBaseLabelSize();
    window.addEventListener("resize", updateBaseLabelSize);
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener("change", updateBaseLabelSize);
    return () => {
      window.removeEventListener("resize", updateBaseLabelSize);
      mq.removeEventListener("change", updateBaseLabelSize);
    };
  }, []);

  useEffect(() => {
    if (sigmaRef.current) sigmaRef.current.refresh();
  }, [hoveredNodeId, selectedNodeId, focusedNodeId, pathNodes, pathEdges, pathSource, pathTarget, activeLayers, density, activeEntryPoint, activeClusterId, searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const sigma = sigmaRef.current;
    const graph = graphRef.current;
    if (!sigma || !graph) return;
    const camera = sigma.getCamera() as any;
    const dur = getReducedMotionDurations();
    if (e.key === "Escape") {
      onStageClick();
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
  }, [onStageClick]);

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

    const container = containerRef.current;
  const renderer = new Sigma(graph, container, {
    renderLabels: true,
    renderEdgeLabels: false,
    labelFont: "DM Sans",
    labelSize: baseLabelSizeRef.current,
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
    const handleCameraUpdate = () => {
      onCameraUpdate(camera.ratio);
    };
    camera.on("updated", handleCameraUpdate);

    sigmaRef.current = renderer;
    onGraphReady(graph, renderer);

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      camera.removeListener("updated", handleCameraUpdate);
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [nodes, edges, clusters, filter, filterMode, onNodeClick, onNodeHover, onStageClick, onCameraUpdate, onGraphReady]);

  const ariaLabel = [
    "Interactive nexus graph",
    density + " density",
    visibleCount + " visible nodes",
    focusedNodeId ? "focused on node" : "",
    pathSource ? "path trace active" : "",
    searchQuery ? "searching: " + searchQuery : "",
  ].filter(Boolean).join(", ");

  return (
    <div
      ref={containerRef}
      className="w-full h-full outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-inset"
      role="application"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    />
  );
}

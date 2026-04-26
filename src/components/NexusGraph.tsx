"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { bidirectional } from "graphology-shortest-path";
import Link from "next/link";

type GraphNode = {
  id: string;
  title: string;
  type: string;
  category: string;
  repo: string;
  connectionCount: number;
  tags: string[];
};

type GraphEdge = {
  source: string;
  target: string;
  type: string;
};

type InteractionMode = "explore" | "focus" | "path";

const TYPE_COLORS: Record<string, string> = {
  doc: "#7C3AED",
  paper: "#06B6D4",
  code: "#10B981",
  data: "#F59E0B",
  config: "#EC4899",
  schema: "#8B5CF6",
  "test-data": "#F97316",
};

const REPO_COLORS: Record<string, string> = {
  "self-organizing-library": "#7C3AED",
  "Archivist-Agent": "#06B6D4",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": "#10B981",
  "kernel-lane": "#F59E0B",
  federation: "#EC4899",
  FreeAgent: "#8B5CF6",
};

const PATH_HIGHLIGHT = "#F59E0B";
const PATH_EDGE_COLOR = "#FBBF24";
const FOCUS_DIM_COLOR = "#1E1E28";
const HOVER_DIM_COLOR = "#252530";
const HOVER_DIM_EDGE_COLOR = "#1A1A22";
const HIGH_DEGREE_THRESHOLD = 8;
const HOVER_DEBOUNCE_MS = 60;

function buildGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  filter: string,
  filterMode: "type" | "repo"
): Graph {
  const filtered =
    filter === "all"
      ? nodes
      : filterMode === "repo"
        ? nodes.filter((n) => n.repo === filter)
        : nodes.filter((n) => n.type === filter);
  const ids = new Set(filtered.map((n) => n.id));

  const graph = new Graph({ type: "undirected", multi: false });

  for (const node of filtered) {
    const baseSize =
      node.type === "paper" ? 10 : node.type === "doc" ? 6 : 4;
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
    });
  }

  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue;
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      if (!graph.hasEdge(edge.source, edge.target)) {
        graph.addEdge(edge.source, edge.target, {
          color: edge.type === "shared-tag" ? "#1E1E24" : "#2A2A32",
          size: 0.5,
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

export default function NexusGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [filterMode, setFilterMode] = useState<"type" | "repo">("type");
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const allNodesRef = useRef<GraphNode[]>([]);
  const allEdgesRef = useRef<GraphEdge[]>([]);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("explore");
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [pathSource, setPathSource] = useState<string | null>(null);
  const [pathTarget, setPathTarget] = useState<string | null>(null);
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set());
  const [pathEdges, setPathEdges] = useState<Set<string>>(new Set());
  const [cameraRatio, setCameraRatio] = useState(1);

  const hoveredNodeRef = useRef<GraphNode | null>(null);
  const selectedNodeRef = useRef<GraphNode | null>(null);
  const interactionModeRef = useRef<InteractionMode>("explore");
  const focusedNodeIdRef = useRef<string | null>(null);
  const pathSourceRef = useRef<string | null>(null);
  const pathTargetRef = useRef<string | null>(null);
  const pathNodesRef = useRef<Set<string>>(new Set());
  const pathEdgesRef = useRef<Set<string>>(new Set());
  const cameraRatioRef = useRef(1);

  const hoveredNeighborIdsRef = useRef<Set<string>>(new Set());
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphVersionRef = useRef(0);

  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);
  useEffect(() => { hoveredNodeRef.current = hoveredNode; }, [hoveredNode]);
  useEffect(() => { interactionModeRef.current = interactionMode; }, [interactionMode]);
  useEffect(() => { focusedNodeIdRef.current = focusedNodeId; }, [focusedNodeId]);
  useEffect(() => { pathSourceRef.current = pathSource; }, [pathSource]);
  useEffect(() => { pathTargetRef.current = pathTarget; }, [pathTarget]);
  useEffect(() => { pathNodesRef.current = pathNodes; }, [pathNodes]);
  useEffect(() => { pathEdgesRef.current = pathEdges; }, [pathEdges]);
  useEffect(() => { cameraRatioRef.current = cameraRatio; }, [cameraRatio]);

  useEffect(() => {
    if (!sigmaRef.current) return;
    sigmaRef.current.setSetting("labelRenderedSizeThreshold", (() => {
      const r = cameraRatioRef.current;
      if (r < 0.3) return 3;
      if (r < 0.6) return 5;
      if (r < 1.2) return 8;
      if (r < 3) return 14;
      return 25;
    })());
  }, [cameraRatio]);

  useEffect(() => {
    if (sigmaRef.current) sigmaRef.current.refresh();
  }, [hoveredNode, selectedNode, interactionMode, focusedNodeId, pathNodes, pathEdges, pathSource, pathTarget]);

  const nodeFromGraph = useCallback(
    (nodeId: string): GraphNode | null => {
      const graph = graphRef.current;
      if (!graph || !graph.hasNode(nodeId)) return null;
      const attrs = graph.getNodeAttributes(nodeId);
      return {
        id: nodeId,
        title: attrs.label || nodeId,
        type: attrs.nodeType || "doc",
        category: attrs.category || "",
        repo: attrs.repo || "",
        connectionCount: attrs.connectionCount || 0,
        tags: attrs.tags ? JSON.parse(attrs.tags) : [],
      };
    },
    []
  );

  const getNeighborSet = useCallback((nodeId: string): Set<string> => {
    const graph = graphRef.current;
    if (!graph || !graph.hasNode(nodeId)) return new Set();
    const neighbors = new Set(graph.neighbors(nodeId));
    neighbors.add(nodeId);
    return neighbors;
  }, []);

  const computePathEdges = useCallback(
    (path: string[]): Set<string> => {
      const graph = graphRef.current;
      if (!graph) return new Set();
      const edgeSet = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) {
        const edge = graph.edge(path[i], path[i + 1]);
        if (edge) edgeSet.add(edge);
      }
      return edgeSet;
    },
    []
  );

  const exitFocus = useCallback(() => {
    setFocusedNodeId(null);
    setInteractionMode("explore");
    setSelectedNode(null);
  }, []);

  const exitPath = useCallback(() => {
    setPathSource(null);
    setPathTarget(null);
    setPathNodes(new Set());
    setPathEdges(new Set());
    setInteractionMode("explore");
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/graph-data");
        const data = await res.json();
        if (cancelled) return;
        allNodesRef.current = data.nodes;
        allEdgesRef.current = data.edges;
        setStats({ nodes: data.nodes.length, edges: data.edges.length });
      } catch (e) {
        console.error("Failed to load graph data:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || !containerRef.current || allNodesRef.current.length === 0)
      return;

    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = buildGraph(allNodesRef.current, allEdgesRef.current, filter, filterMode);
    if (graph.order === 0) return;
    graphRef.current = graph;
    graphVersionRef.current += 1;

    const labelThreshold = (() => {
      const r = cameraRatioRef.current;
      if (r < 0.3) return 3;
      if (r < 0.6) return 5;
      if (r < 1.2) return 8;
      if (r < 3) return 14;
      return 25;
    })();

    const container = containerRef.current;
    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      renderEdgeLabels: false,
      labelFont: "DM Sans",
      labelSize: 12,
      labelWeight: "500",
      labelColor: { color: "#A1A1AA" },
      labelRenderedSizeThreshold: labelThreshold,
      defaultEdgeColor: "#1E1E24",
      defaultNodeType: "circle",
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      stagePadding: 20,
      nodeReducer: (node, data) => {
        const res = { ...data };
        const mode = interactionModeRef.current;
        const hovered = hoveredNodeRef.current;
        const selected = selectedNodeRef.current;
        const focused = focusedNodeIdRef.current;
        const pNodes = pathNodesRef.current;
        const pSource = pathSourceRef.current;
        const pTarget = pathTargetRef.current;

        if (mode === "path" && pNodes.size > 0) {
          if (pNodes.has(node)) {
            res.highlighted = true;
            res.zIndex = 10;
            if (node === pSource || node === pTarget) {
              res.color = PATH_HIGHLIGHT;
              res.size = (res.size || 6) * 1.5;
            }
          } else {
            res.color = FOCUS_DIM_COLOR;
            res.label = "";
          }
          return res;
        }

        if (mode === "focus" && focused) {
          const neighbors = getNeighborSet(focused);
          if (neighbors.has(node)) {
            if (node === focused) {
              res.highlighted = true;
              res.zIndex = 10;
              res.size = (res.size || 6) * 1.3;
            }
          } else {
            res.color = FOCUS_DIM_COLOR;
            res.label = "";
          }
          return res;
        }

        if (hovered) {
          const neighborIds = hoveredNeighborIdsRef.current;
          if (
            node === hovered.id ||
            neighborIds.has(node)
          ) {
            res.highlighted = true;
          } else {
            res.color = HOVER_DIM_COLOR;
            const degree = graph.degree(node);
            if (degree < HIGH_DEGREE_THRESHOLD) {
              res.label = "";
            }
          }
        }
        if (selected && node === selected.id) {
          res.highlighted = true;
          res.zIndex = 10;
        }
        return res;
      },
      edgeReducer: (edge, data) => {
        const res = { ...data };
        const mode = interactionModeRef.current;
        const hovered = hoveredNodeRef.current;
        const focused = focusedNodeIdRef.current;
        const pEdges = pathEdgesRef.current;

        if (mode === "path" && pEdges.size > 0) {
          if (pEdges.has(edge)) {
            res.color = PATH_EDGE_COLOR;
            res.size = 2.5;
          } else {
            res.hidden = true;
          }
          return res;
        }

        if (mode === "focus" && focused) {
          const neighbors = getNeighborSet(focused);
          const src = graph.source(edge);
          const tgt = graph.target(edge);
          if (!neighbors.has(src) || !neighbors.has(tgt)) {
            res.hidden = true;
          } else {
            res.size = 1.2;
          }
          return res;
        }

        if (hovered) {
          const src = graph.source(edge);
          const tgt = graph.target(edge);
          if (src !== hovered.id && tgt !== hovered.id) {
            res.color = HOVER_DIM_EDGE_COLOR;
            res.size = 0.2;
          } else {
            res.size = 1.5;
          }
        }
        return res;
      },
    });

    renderer.on("clickNode", ({ node }) => {
      const mode = interactionModeRef.current;
      const pSource = pathSourceRef.current;

      if (mode === "path") {
        if (!pSource) {
          setPathSource(node);
          const n = nodeFromGraph(node);
          if (n) setSelectedNode(n);
        } else if (node !== pSource) {
          setPathTarget(node);
          const path = bidirectional(graph, pSource, node);
          if (path) {
            setPathNodes(new Set(path));
            setPathEdges(computePathEdges(path));
          } else {
            setPathNodes(new Set());
            setPathEdges(new Set());
          }
          const n = nodeFromGraph(node);
          if (n) setSelectedNode(n);
        }
        return;
      }

      const n = nodeFromGraph(node);
      if (n) setSelectedNode(n);

      if (mode === "focus") {
        setFocusedNodeId(node);
        const camera = renderer.getCamera() as any;
        const nodeAttrs = graph.getNodeAttributes(node);
        camera.animatedMoveTo({
          x: nodeAttrs.x,
          y: nodeAttrs.y,
          ratio: 0.5,
          angle: 0,
        });
      }
    });

    renderer.on("enterNode", ({ node }) => {
      const mode = interactionModeRef.current;
      if (mode !== "explore") return;
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        const n = nodeFromGraph(node);
        if (n) {
          const g = graphRef.current;
          if (g && g.hasNode(node)) {
            hoveredNeighborIdsRef.current = new Set(g.neighbors(node));
          }
          setHoveredNode(n);
        }
      }, HOVER_DEBOUNCE_MS);
    });

    renderer.on("leaveNode", () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoveredNeighborIdsRef.current = new Set();
      setHoveredNode(null);
    });

    renderer.on("clickStage", () => {
      const mode = interactionModeRef.current;
      if (mode === "focus") {
        exitFocus();
        (renderer.getCamera() as any).animatedReset();
      } else if (mode === "path") {
        exitPath();
      } else {
        setSelectedNode(null);
      }
    });

    const camera = renderer.getCamera() as any;
    const onCameraUpdate = () => {
      setCameraRatio(camera.ratio);
    };
    camera.on("updated", onCameraUpdate);

    sigmaRef.current = renderer;

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      camera.removeListener("updated", onCameraUpdate);
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [loading, filter, filterMode]);

  const typeFilters = [
    { key: "all", label: "All", color: "#F4F4F5" },
    { key: "doc", label: "Docs", color: TYPE_COLORS.doc },
    { key: "paper", label: "Papers", color: TYPE_COLORS.paper },
    { key: "code", label: "Code", color: TYPE_COLORS.code },
    { key: "data", label: "Data", color: TYPE_COLORS.data },
    { key: "schema", label: "Schema", color: TYPE_COLORS.schema },
  ];

  const repoFilters = [
    { key: "all", label: "All Repos", color: "#F4F4F5" },
    ...Object.entries(REPO_COLORS).map(([key, color]) => ({
      key,
      label: key.replace(/-/g, " ").replace(/SwarmMind Self Optimizing Multi Agent AI System/g, "SwarmMind"),
      color,
    })),
  ];

  const currentFilters = filterMode === "type" ? typeFilters : repoFilters;

  const filteredCount =
    filter === "all"
      ? stats.nodes
      : filterMode === "repo"
        ? allNodesRef.current.filter((n) => n.repo === filter).length
        : allNodesRef.current.filter((n) => n.type === filter).length;

  const neighborCount =
    focusedNodeId && graphRef.current?.hasNode(focusedNodeId)
      ? graphRef.current.neighbors(focusedNodeId).length
      : 0;

  const pathLength =
    interactionMode === "path" && pathNodes.size > 0
      ? pathNodes.size - 1
      : null;

  return (
    <div className="p-8" data-pagefind-ignore>
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Nexus Graph
          </h1>
          <p className="text-[var(--text-secondary)]">
            Interactive map of document connections &mdash; scroll to zoom, drag
            to pan, click nodes for details
          </p>
        </div>
      </div>

      <div
        className="card p-4 mb-2 flex gap-4 animate-fade-in stagger-1 flex-wrap items-center"
        role="toolbar"
        aria-label="Graph interaction mode"
      >
        <button
          onClick={() => {
            if (interactionMode === "focus") exitFocus();
            if (interactionMode === "path") exitPath();
            setInteractionMode("explore");
          }}
          aria-pressed={interactionMode === "explore"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            interactionMode === "explore"
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => {
            exitFocus();
            setInteractionMode("focus");
          }}
          aria-pressed={interactionMode === "focus"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            interactionMode === "focus"
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Focus Mode
        </button>
        <button
          onClick={() => {
            exitPath();
            setInteractionMode("path");
          }}
          aria-pressed={interactionMode === "path"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            interactionMode === "path"
              ? "bg-amber-500/20 text-amber-400"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Path Trace
        </button>

        <span className="text-[var(--text-muted)] text-xs mx-1">|</span>

        <button
          onClick={() => {
            setFilterMode("type");
            setFilter("all");
          }}
          aria-pressed={filterMode === "type"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === "type"
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Filter by Type
        </button>
        <button
          onClick={() => {
            setFilterMode("repo");
            setFilter("all");
          }}
          aria-pressed={filterMode === "repo"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterMode === "repo"
              ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          Filter by Repo
        </button>

        <span className="ml-auto text-sm text-[var(--text-muted)]" role="status">
          {filteredCount} nodes &middot; {stats.edges} edges
        </span>
      </div>

      <div
        className="card p-4 mb-2 flex gap-4 animate-fade-in stagger-2 flex-wrap"
        role="toolbar"
        aria-label={`${filterMode === "type" ? "Type" : "Repo"} filters`}
      >
        {currentFilters.map((tf) => (
          <button
            key={tf.key}
            onClick={() => {
              if (interactionMode === "focus") exitFocus();
              if (interactionMode === "path") exitPath();
              setFilter(tf.key);
            }}
            aria-pressed={filter === tf.key}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === tf.key
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: tf.color }}
              aria-hidden="true"
            />
            {tf.label}
          </button>
        ))}
      </div>

      {interactionMode === "path" && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-fade-in stagger-3" role="status">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-amber-400 font-medium">Path Trace</span>
            {pathSource && (
              <span className="text-[var(--text-muted)]">
                Source: <span className="text-[var(--text-primary)]">{nodeFromGraph(pathSource)?.title || pathSource}</span>
              </span>
            )}
            {pathTarget && (
              <span className="text-[var(--text-muted)]">
                Target: <span className="text-[var(--text-primary)]">{nodeFromGraph(pathTarget)?.title || pathTarget}</span>
              </span>
            )}
            {pathLength !== null && (
              <span className="text-amber-300 font-medium">
                {pathLength} hop{pathLength !== 1 ? "s" : ""} &middot; {pathNodes.size} nodes
              </span>
            )}
            {!pathSource && (
              <span className="text-[var(--text-muted)]">Click a node to set source</span>
            )}
            {pathSource && !pathTarget && (
              <span className="text-[var(--text-muted)]">Click another node to set target</span>
            )}
            {pathSource && pathTarget && pathNodes.size === 0 && (
              <span className="text-red-400">No path found</span>
            )}
            <button
              onClick={exitPath}
              className="ml-auto text-amber-400 hover:text-amber-300 text-xs underline"
            >
              Exit Path Trace
            </button>
          </div>
        </div>
      )}

      {interactionMode === "focus" && focusedNodeId && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 animate-fade-in stagger-3" role="status">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--primary)] font-medium">Focus Mode</span>
            <span className="text-[var(--text-muted)]">
              Focused on <span className="text-[var(--text-primary)]">{nodeFromGraph(focusedNodeId)?.title || focusedNodeId}</span>
            </span>
            <span className="text-[var(--text-muted)]">
              {neighborCount} neighbor{neighborCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                exitFocus();
                (sigmaRef.current?.getCamera() as any)?.animatedReset();
              }}
              className="ml-auto text-[var(--primary)] hover:text-[var(--primary)]/80 text-xs underline"
            >
              Exit Focus
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6 animate-fade-in stagger-3">
        <div className="flex-1 min-w-0">
          <div className="card relative overflow-hidden" style={{ height: "650px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                Loading graph data...
              </div>
            ) : allNodesRef.current.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                No graph data available
              </div>
            ) : (
              <div
                ref={containerRef}
                className="w-full h-full"
                role="img"
                aria-label="Interactive document nexus graph"
              />
            )}

            <div className="absolute top-3 right-3 px-2 py-1 rounded bg-[var(--bg-surface)]/80 text-xs text-[var(--text-muted)] backdrop-blur-sm" aria-live="polite">
              Zoom: {cameraRatio < 0.3 ? "Deep" : cameraRatio < 0.6 ? "Close" : cameraRatio < 1.2 ? "Normal" : cameraRatio < 3 ? "Far" : "Overview"}
            </div>
          </div>
        </div>

        {selectedNode && (
          <aside className="w-80 flex-shrink-0" role="complementary" aria-label="Node details panel">
            <div className="card p-5 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[selectedNode.type] || TYPE_COLORS.doc }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {selectedNode.type}
                </span>
                {interactionMode === "focus" && selectedNode.id === focusedNodeId && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)]">Focused</span>
                )}
                {interactionMode === "path" && (selectedNode.id === pathSource || selectedNode.id === pathTarget) && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    {selectedNode.id === pathSource ? "Source" : "Target"}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 leading-snug">
                {selectedNode.title}
              </h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Category</span>
                  <span className="text-[var(--text-secondary)]">{selectedNode.category || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Repo</span>
                  <span className="text-[var(--text-secondary)]">{selectedNode.repo.replace(/-/g, " ") || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Connections</span>
                  <span className="text-[var(--text-secondary)]">{selectedNode.connectionCount}</span>
                </div>
              </div>

              {selectedNode.tags.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Tags</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedNode.tags.slice(0, 8).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {selectedNode.tags.length > 8 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                        +{selectedNode.tags.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href={`/library/${selectedNode.id}`}
                  className="block w-full text-center px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View Document
                </Link>

                <button
                  onClick={() => {
                    setFocusedNodeId(selectedNode.id);
                    setInteractionMode("focus");
                    const g = graphRef.current;
                    const r = sigmaRef.current;
                    if (g && r && g.hasNode(selectedNode.id)) {
                      const attrs = g.getNodeAttributes(selectedNode.id);
                      (r.getCamera() as any).animatedMoveTo({ x: attrs.x, y: attrs.y, ratio: 0.5, angle: 0 });
                    }
                  }}
                  className="block w-full text-center px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  Focus on Node
                </button>

                {interactionMode === "path" && (
                  <button
                    onClick={() => {
                      if (!pathSource) {
                        setPathSource(selectedNode.id);
                      } else if (selectedNode.id !== pathSource) {
                        setPathTarget(selectedNode.id);
                        const g = graphRef.current;
                        if (g) {
                          const path = bidirectional(g, pathSource, selectedNode.id);
                          if (path) {
                            setPathNodes(new Set(path));
                            setPathEdges(computePathEdges(path));
                          } else {
                            setPathNodes(new Set());
                            setPathEdges(new Set());
                          }
                        }
                      }
                    }}
                    className="block w-full text-center px-4 py-2 rounded-lg border border-amber-500/40 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    Trace Path From Here
                  </button>
                )}

                {interactionMode === "focus" && selectedNode.id !== focusedNodeId && (
                  <button
                    onClick={() => {
                      setFocusedNodeId(selectedNode.id);
                      const g = graphRef.current;
                      const r = sigmaRef.current;
                      if (g && r && g.hasNode(selectedNode.id)) {
                        const attrs = g.getNodeAttributes(selectedNode.id);
                        (r.getCamera() as any).animatedMoveTo({ x: attrs.x, y: attrs.y, ratio: 0.5, angle: 0 });
                      }
                    }}
                    className="block w-full text-center px-4 py-2 rounded-lg border border-[var(--primary)]/40 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                  >
                    Re-focus Here
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)] text-center animate-fade-in stagger-4">
        {interactionMode === "explore" && "Explore mode: hover to highlight neighbors, click to select. Scroll to zoom, drag to pan."}
        {interactionMode === "focus" && "Focus mode: click any node to isolate its neighborhood. Click background to exit."}
        {interactionMode === "path" && "Path trace: click two nodes to find the shortest path between them. Click background to reset."}
        {" "}Zoom in for labels, out for clusters.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { circular } from "graphology-layout";
import forceAtlas2 from "graphology-layout-forceatlas2";
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [filterMode, setFilterMode] = useState<"type" | "repo">("type");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const allNodesRef = useRef<GraphNode[]>([]);
  const allEdgesRef = useRef<GraphEdge[]>([]);

  const killSigma = useCallback(() => {
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }
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

    killSigma();

    const graph = buildGraph(allNodesRef.current, allEdgesRef.current, filter, filterMode);
    if (graph.order === 0) return;

    const container = containerRef.current;
    const renderer = new Sigma(graph, container, {
      renderLabels: true,
      renderEdgeLabels: false,
      labelFont: "DM Sans",
      labelSize: 12,
      labelWeight: "500",
      labelColor: { color: "#A1A1AA" },
      labelRenderedSizeThreshold: 6,
      defaultEdgeColor: "#1E1E24",
      defaultNodeType: "circle",
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
      stagePadding: 20,
      nodeReducer: (node, data) => {
        const res = { ...data };
        if (hoveredNode) {
          if (
            node === hoveredNode.id ||
            graph.neighbors(hoveredNode.id).includes(node)
          ) {
            res.highlighted = true;
          } else {
            res.color = "#2A2A32";
            res.label = "";
          }
        }
        if (selectedNode && node === selectedNode.id) {
          res.highlighted = true;
          res.zIndex = 10;
        }
        return res;
      },
      edgeReducer: (edge, data) => {
        const res = { ...data };
        if (hoveredNode) {
          const src = graph.source(edge);
          const tgt = graph.target(edge);
          if (src !== hoveredNode.id && tgt !== hoveredNode.id) {
            res.hidden = true;
          }
        }
        return res;
      },
    });

  renderer.on("clickNode", ({ node }) => {
    const attrs = graph.getNodeAttributes(node);
    setSelectedNode({
      id: node,
      title: attrs.label || node,
      type: attrs.nodeType || "doc",
      category: attrs.category || "",
      repo: attrs.repo || "",
      connectionCount: attrs.connectionCount || 0,
      tags: attrs.tags ? JSON.parse(attrs.tags) : [],
    });
  });

  renderer.on("enterNode", ({ node }) => {
    const attrs = graph.getNodeAttributes(node);
    setHoveredNode({
      id: node,
      title: attrs.label || node,
      type: attrs.nodeType || "doc",
      category: attrs.category || "",
      repo: attrs.repo || "",
      connectionCount: attrs.connectionCount || 0,
      tags: attrs.tags ? JSON.parse(attrs.tags) : [],
    });
  });

    renderer.on("leaveNode", () => {
      setHoveredNode(null);
    });

    renderer.on("clickStage", () => {
      setSelectedNode(null);
    });

    sigmaRef.current = renderer;

    return () => {
      killSigma();
    };
  }, [loading, filter, filterMode, hoveredNode, selectedNode, killSigma]);

  useEffect(() => {
    return killSigma;
  }, [killSigma]);

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
        className="card p-4 mb-2 flex gap-4 animate-fade-in stagger-1 flex-wrap"
        role="toolbar"
        aria-label="Graph filter mode"
      >
        <button
          onClick={() => { setFilterMode("type"); setFilter("all"); }}
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
          onClick={() => { setFilterMode("repo"); setFilter("all"); }}
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
        className="card p-4 mb-6 flex gap-4 animate-fade-in stagger-2 flex-wrap"
        role="toolbar"
        aria-label={`${filterMode === "type" ? "Type" : "Repo"} filters`}
      >
        {currentFilters.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setFilter(tf.key)}
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

        {selectedNode && (
          <div
            className="absolute bottom-6 left-6 p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-w-sm"
            role="dialog"
            aria-label="Node details"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    TYPE_COLORS[selectedNode.type] || TYPE_COLORS.doc,
                }}
                aria-hidden="true"
              />
              <span className="text-sm text-[var(--text-muted)] uppercase">
              {selectedNode.type}
            </span>
            <span className="text-sm text-[var(--text-muted)]">&middot;</span>
            <span className="text-sm text-[var(--text-muted)]">
              {selectedNode.category}
            </span>
            {selectedNode.repo && (
              <>
                <span className="text-sm text-[var(--text-muted)]">&middot;</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {selectedNode.repo.replace(/-/g, " ")}
                </span>
              </>
            )}
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">
              {selectedNode.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              {selectedNode.connectionCount} connections
            </p>
            {selectedNode.tags.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {selectedNode.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/library/${selectedNode.id}`}
              className="text-[var(--primary)] text-sm hover:underline"
            >
              View Document &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

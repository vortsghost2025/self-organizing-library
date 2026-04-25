"use client";

import { useEffect, useRef, useState } from "react";

interface GraphNode {
  id: string;
  title: string;
  type: string;
  category: string;
  connectionCount: number;
  tags: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

const TYPE_COLORS: Record<string, string> = {
  doc: "#7C3AED",
  paper: "#06B6D4",
  code: "#10B981",
  data: "#F59E0B",
  config: "#EC4899",
  schema: "#8B5CF6",
  "test-data": "#F97316",
};

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const nodesRef = useRef<GraphNode[]>([]);
  const dirtyRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/graph-data");
        const data = await res.json();
        const canvas = canvasRef.current;
        if (canvas) {
          const width = (canvas.width = canvas.offsetWidth);
          const height = (canvas.height = canvas.offsetHeight);
          data.nodes.forEach((node: GraphNode) => {
            node.x = Math.random() * width;
            node.y = Math.random() * height;
            node.vx = 0;
            node.vy = 0;
          });
        }
        nodesRef.current = data.nodes;
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (e) {
        console.error("Failed to load graph data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let rafId: number | undefined;
    const simulate = () => {
      const current = nodesRef.current;
      if (!current.length) {
        rafId = requestAnimationFrame(simulate);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      for (const node of current) {
        if (node.x === undefined || node.y === undefined) continue;

        let fx = (centerX - node.x) * 0.001;
        let fy = (centerY - node.y) * 0.001;

        for (const other of current) {
          if (other.id === node.id || other.x === undefined || other.y === undefined) continue;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 80) {
            fx += (dx / dist) * 0.5;
            fy += (dy / dist) * 0.5;
          }
        }

        for (const edge of edges) {
          if (edge.source === node.id || edge.target === node.id) {
            const otherId = edge.source === node.id ? edge.target : edge.source;
            const other = current.find((n) => n.id === otherId);
            if (other && other.x !== undefined && other.y !== undefined) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              fx += dx * 0.0005;
              fy += dy * 0.0005;
            }
          }
        }

        node.vx = ((node.vx || 0) + fx) * 0.85;
        node.vy = ((node.vy || 0) + fy) * 0.85;
        node.x += node.vx;
        node.y += node.vy;

        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }

      dirtyRef.current = true;
      rafId = requestAnimationFrame(simulate);
    };
    rafId = requestAnimationFrame(simulate);
    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, [edges]);

  useEffect(() => {
    let syncId: number | undefined;
    const sync = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setNodes([...nodesRef.current]);
      }
      syncId = requestAnimationFrame(sync);
    };
    syncId = requestAnimationFrame(sync);
    return () => {
      if (syncId !== undefined) cancelAnimationFrame(syncId);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const filteredNodes = filter === "all" ? nodes : nodes.filter((n) => n.type === filter);
    const filteredIds = new Set(filteredNodes.map((n) => n.id));

    edges.forEach((edge) => {
      if (!filteredIds.has(edge.source) || !filteredIds.has(edge.target)) return;
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (source && target && source.x !== undefined && target.x !== undefined && source.y !== undefined && target.y !== undefined) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = edge.type === "shared-tag" ? "#1a1a24" : "#2A2A32";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });

    filteredNodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;

      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const radius = isHovered || isSelected ? 12 : 4 + Math.min(node.connectionCount, 8);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      const color = TYPE_COLORS[node.type] || TYPE_COLORS.doc;
      ctx.fillStyle = color;
      ctx.fill();

      if (isHovered || isSelected) {
        ctx.strokeStyle = "#F4F4F5";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    if (hoveredNode && hoveredNode.x !== undefined && hoveredNode.y !== undefined && filteredIds.has(hoveredNode.id)) {
      ctx.font = "13px DM Sans";
      ctx.fillStyle = "#F4F4F5";
      ctx.textAlign = "center";
      ctx.fillText(hoveredNode.title, hoveredNode.x, hoveredNode.y - 20);
    }
  }, [nodes, edges, hoveredNode, selectedNode, filter]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const filteredNodes = filter === "all" ? nodes : nodes.filter((n) => n.type === filter);
    const clickedNode = filteredNodes.find((node) => {
      if (node.x === undefined || node.y === undefined) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const filteredNodes = filter === "all" ? nodes : nodes.filter((n) => n.type === filter);
    const hovered = filteredNodes.find((node) => {
      if (node.x === undefined || node.y === undefined) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    setHoveredNode(hovered || null);
  };

  const typeFilters = [
    { key: "all", label: "All", color: "#F4F4F5" },
    { key: "doc", label: "Docs", color: TYPE_COLORS.doc },
    { key: "paper", label: "Papers", color: TYPE_COLORS.paper },
    { key: "code", label: "Code", color: TYPE_COLORS.code },
    { key: "data", label: "Data", color: TYPE_COLORS.data },
    { key: "schema", label: "Schema", color: TYPE_COLORS.schema },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Nexus Graph</h1>
          <p className="text-[var(--text-secondary)]">Interactive map of document connections</p>
        </div>
      </div>

      <div className="card p-4 mb-6 flex gap-4 animate-fade-in stagger-1 flex-wrap">
        {typeFilters.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setFilter(tf.key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === tf.key
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tf.color }} />
            {tf.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-[var(--text-muted)]">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>

      <div className="card relative overflow-hidden" style={{ height: "600px" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            Loading graph data...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
        )}
        {selectedNode && (
          <div className="absolute bottom-6 left-6 p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[selectedNode.type] || TYPE_COLORS.doc }}
              />
              <span className="text-sm text-[var(--text-muted)] uppercase">{selectedNode.type}</span>
              <span className="text-sm text-[var(--text-muted)]">·</span>
              <span className="text-sm text-[var(--text-muted)]">{selectedNode.category}</span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">{selectedNode.title}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-3">{selectedNode.connectionCount} connections</p>
            {selectedNode.tags.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {selectedNode.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <a href={`/library/${selectedNode.id}`} className="text-[var(--primary)] text-sm hover:underline">
              View Document →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

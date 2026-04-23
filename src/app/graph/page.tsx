"use client";

import { useEffect, useRef, useState } from "react";

interface GraphNode {
  id: string;
  title: string;
  type: string;
  connectionCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  context?: string;
}

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const nodesRef = useRef<GraphNode[]>([]);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const mockNodes: GraphNode[] = Array.from({ length: 50 }, (_, i) => ({
      id: `doc-${i}`,
      title: `Document ${i + 1}`,
      type: ["text", "code", "paper", "link", "note"][i % 5],
      connectionCount: Math.floor(Math.random() * 10) + 1,
    }));

    const mockEdges: GraphEdge[] = [];
    for (let i = 0; i < mockNodes.length; i++) {
      const numLinks = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numLinks; j++) {
        const target = Math.floor(Math.random() * mockNodes.length);
        if (target !== i) {
          mockEdges.push({ source: mockNodes[i].id, target: mockNodes[target].id });
        }
      }
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const width = canvas.width = canvas.offsetWidth;
      const height = canvas.height = canvas.offsetHeight;

      mockNodes.forEach(node => {
        node.x = Math.random() * width;
        node.y = Math.random() * height;
      });
    }

    nodesRef.current = mockNodes;
    setNodes(mockNodes);
    setEdges(mockEdges);
  }, []);

  useEffect(() => {
    let rafId: number | undefined;
    const sync = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setNodes([...nodesRef.current]);
      }
      rafId = requestAnimationFrame(sync);
    };
    rafId = requestAnimationFrame(sync);
    return () => { if (rafId !== undefined) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target && source.x !== undefined && target.x !== undefined && source.y !== undefined && target.y !== undefined) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "#2A2A32";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;

      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const radius = isHovered || isSelected ? 12 : 6 + node.connectionCount;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      let color = "#7C3AED";
      if (node.type === "paper") color = "#06B6D4";
      else if (node.type === "code") color = "#10B981";
      else if (node.type === "link") color = "#F59E0B";
      else if (node.type === "note") color = "#EC4899";

      ctx.fillStyle = color;
      ctx.fill();

      if (isHovered || isSelected) {
        ctx.strokeStyle = "#F4F4F5";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    if (hoveredNode && hoveredNode.x !== undefined && hoveredNode.y !== undefined) {
      ctx.font = "14px DM Sans";
      ctx.fillStyle = "#F4F4F5";
      ctx.textAlign = "center";
      ctx.fillText(hoveredNode.title, hoveredNode.x, hoveredNode.y - 20);
    }
  }, [nodes, edges, hoveredNode, selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
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

    const hovered = nodes.find(node => {
      if (node.x === undefined || node.y === undefined) return false;
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    setHoveredNode(hovered || null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Knowledge Graph</h1>
          <p className="text-[var(--text-secondary)]">Visualize connections between your documents</p>
        </div>
      </div>

      <div className="card p-4 mb-6 flex gap-4 animate-fade-in stagger-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--primary)]" />
          <span className="text-sm text-[var(--text-secondary)]">Text</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--secondary)]" />
          <span className="text-sm text-[var(--text-secondary)]">Paper</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--success)]" />
          <span className="text-sm text-[var(--text-secondary)]">Code</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--warning)]" />
          <span className="text-sm text-[var(--text-secondary)]">Link</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EC4899]" />
          <span className="text-sm text-[var(--text-secondary)]">Note</span>
        </div>
      </div>

      <div className="card relative overflow-hidden" style={{ height: "600px" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        />
        {selectedNode && (
          <div className="absolute bottom-6 left-6 p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${selectedNode.type === 'paper' ? 'bg-[var(--secondary)]' : selectedNode.type === 'code' ? 'bg-[var(--success)]' : selectedNode.type === 'link' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'}`} />
              <span className="text-sm text-[var(--text-muted)] uppercase">{selectedNode.type}</span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">{selectedNode.title}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-3">{selectedNode.connectionCount} connections</p>
            <a href={`/library/${selectedNode.id}`} className="text-[var(--primary)] text-sm hover:underline">
              View Document →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
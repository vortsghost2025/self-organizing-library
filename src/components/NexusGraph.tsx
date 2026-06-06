"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import GraphCanvas, { type GraphCanvasImperativeHandle } from "./graph/GraphCanvas";
import GraphToolbar from "./graph/GraphToolbar";
import type { GraphEdge, GraphLens, GraphNode } from "@/lib/graph-types";
import { LENS_CONFIG } from "@/lib/graph-types";

interface NexusGraphProps {
  initialFilter?: string;
  initialFilterMode?: "type" | "repo";
  initialMode?: string;
  initialLens?: GraphLens;
  onLensChange?: (lens: GraphLens) => void;
}

function formatRepoLabel(repo: string): string {
  return repo
    .replace(/SwarmMind-Self-Optimizing-Multi-Agent-AI-System/g, "SwarmMind")
    .replace(/-/g, " ");
}

function buildSearchText(node: GraphNode): string {
  return [
    node.id,
    node.title,
    node.repo,
    node.type,
    node.category,
    ...node.tags,
  ]
    .join(" ")
    .toLowerCase();
}

export default function NexusGraph({
  initialLens = "navigation",
  onLensChange,
}: NexusGraphProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [graphLens, setGraphLens] = useState<GraphLens>(initialLens);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lensDescription, setLensDescription] = useState(LENS_CONFIG[initialLens].description);
  const graphCanvasRef = useRef<GraphCanvasImperativeHandle>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      setLoading(true);
      setError(null);

      try {
        const { fetchWithRetry } = await import("@/lib/fetchWithRetry");
        const response = await fetchWithRetry(`/api/graph-data?lens=${graphLens}`);
        const data = await response.json();

        if (cancelled) return;

        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLensDescription(data.description || LENS_CONFIG[graphLens].description);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load graph data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [graphLens]);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [graphLens]);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => {
        graphCanvasRef.current?.fitVisible();
      }, 80);

      return () => window.clearTimeout(timer);
    }
  }, [loading, nodes, edges, graphLens]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!normalizedSearchQuery) return nodes.length;
    return nodes.filter((node) => buildSearchText(node).includes(normalizedSearchQuery)).length;
  }, [nodes, normalizedSearchQuery]);

  const handleLensChange = useCallback(
    (lens: GraphLens) => {
      setGraphLens(lens);
      onLensChange?.(lens);
    },
    [onLensChange],
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId));
  }, []);

  const workspaceSummary = selectedNode
    ? selectedNode.title
    : searchQuery
    ? `${searchMatches} matching ${searchMatches === 1 ? "node" : "nodes"}`
    : lensDescription;

  return (
    <div className="px-4 py-5 md:px-6 md:py-6" data-pagefind-ignore>
      <div className="mx-auto max-w-[1180px]">
        <section className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.98),rgba(12,15,22,1))] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.28)] md:p-5">
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8f95a8]">
                Nexus Graph
              </span>
              <span className="rounded-full border border-[#4f8df733] bg-[#4f8df714] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7aa7ff]">
                {LENS_CONFIG[graphLens].label}
              </span>
            </div>
            <div>
              <h1 className="text-[1.95rem] font-semibold tracking-[-0.03em] text-[#f1f4fb]">
                self-organizing-library
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[#9fa7bc]">
                Cleaner network view with straight-edge relationships and a quieter frame.
              </p>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-[#0f131b] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-4">
            <GraphToolbar
              graphLens={graphLens}
              searchQuery={searchQuery}
              nodeCount={nodes.length}
              edgeCount={edges.length}
              highlightedCount={searchMatches}
              onLensChange={handleLensChange}
              onSearchChange={setSearchQuery}
              onFitVisible={() => graphCanvasRef.current?.fitVisible()}
              onZoomIn={() => graphCanvasRef.current?.zoomIn()}
              onZoomOut={() => graphCanvasRef.current?.zoomOut()}
            />

            <div className="mb-3 mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f95a8]">
                  self-organizing-library network
                </div>
                <div className="mt-1.5 text-sm text-[#c3c8d9]">
                  {selectedNode
                    ? `${selectedNode.title} · ${selectedNode.connectionCount} connections`
                    : workspaceSummary}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[#dfe3ef]">
                  {nodes.length} nodes
                </span>
                <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[#dfe3ef]">
                  {edges.length} edges
                </span>
              </div>
            </div>

            <div className="h-[78vh] min-h-[620px] max-h-[900px] overflow-hidden rounded-[18px] border border-white/8 bg-[#0b0e14]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-[#9ea5ba]">
                  Rendering graph workspace...
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#ef9090]">
                  {error}
                </div>
              ) : nodes.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[#9ea5ba]">
                  No graph data is available for this view.
                </div>
              ) : (
                <GraphCanvas
                  ref={graphCanvasRef}
                  nodes={nodes}
                  edges={edges}
                  graphLens={graphLens}
                  searchQuery={searchQuery}
                  selectedNodeId={selectedNodeId}
                  onNodeClick={handleNodeClick}
                  onCameraUpdate={() => {}}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

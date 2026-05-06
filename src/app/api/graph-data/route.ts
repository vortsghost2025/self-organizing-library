import { getGraphData } from "@/lib/site-index";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const graphData = getGraphData();

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  // "overview" mode shows only the core four lane repos.
  // Default (no mode or any other value) returns the full graph, including papers, code, and docs.
  const LANE_REPOS = new Set([
    "self-organizing-library",
    "Archivist-Agent",
    "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
    "kernel-lane",
  ]);

  let nodes: typeof graphData.nodes = [];
  if (mode === "overview") {
    nodes = graphData.nodes.filter((n) => LANE_REPOS.has(n.repo));
  } else {
    // Return everything – do not filter out papers or code.
    nodes = graphData.nodes;
  }
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graphData.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  const authorityEdges = (graphData.authorityEdges || []).filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return NextResponse.json({ nodes, edges, authorityEdges });
}

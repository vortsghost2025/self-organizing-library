import { getGraphData } from "@/lib/site-index";
import { NextResponse } from "next/server";

export async function GET() {
  const graphData = getGraphData();

  // Temporary isolation mode: show only core 4 lane repos in graph views.
  const LANE_REPOS = new Set([
    "self-organizing-library",
    "Archivist-Agent",
    "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
    "kernel-lane",
  ]);

  const nodes = graphData.nodes.filter((n) => LANE_REPOS.has(n.repo));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graphData.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  const authorityEdges = (graphData.authorityEdges || []).filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return NextResponse.json({ nodes, edges, authorityEdges });
}

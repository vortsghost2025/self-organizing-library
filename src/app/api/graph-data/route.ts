import { getAvailableGraphLenses, getGraphData, type GraphLens } from "@/lib/site-index";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLens = url.searchParams.get("lens");
  const mode = url.searchParams.get("mode");
  const allowedLenses = new Set(getAvailableGraphLenses().map((lens) => lens.id));

  let lens: GraphLens = "authority";
  // Use authority lens by default to ensure graph has data
  if (requestedLens && allowedLenses.has(requestedLens as GraphLens)) {
    lens = requestedLens as GraphLens;
  } else if (mode === "overview") {
    lens = "repos";
  }

// Get graph data for the requested lens
let graphData = getGraphData(lens);

// If the requested lens yields no nodes, fall back to the authority lens which always has data.
if (!graphData.nodes?.length) {
  console.warn(`Lens "${lens}" produced no data; falling back to authority lens.`);
  graphData = getGraphData("authority");
}

return NextResponse.json(graphData);
}

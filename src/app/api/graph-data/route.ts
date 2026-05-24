import { getAvailableGraphLenses, getGraphData, type GraphLens } from "@/lib/site-index";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLens = url.searchParams.get("lens");
  const mode = url.searchParams.get("mode");
  const allowedLenses = new Set(getAvailableGraphLenses().map((lens) => lens.id));

  let lens: GraphLens = "navigation";
  if (requestedLens && allowedLenses.has(requestedLens as GraphLens)) {
    lens = requestedLens as GraphLens;
  } else if (mode === "overview") {
    lens = "repos";
  }

// Get graph data for the requested lens
let graphData = getGraphData(lens);

// Fallback to authority lens if navigation lens is empty
if (lens === "navigation" && (!graphData.nodes?.length || !graphData.edges?.length)) {
  console.warn("Navigation lens is empty. Falling back to authority lens.");
  graphData = getGraphData("authority");
}

return NextResponse.json(graphData);
}

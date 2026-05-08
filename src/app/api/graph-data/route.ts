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

  const graphData = getGraphData(lens);
  return NextResponse.json(graphData);
}

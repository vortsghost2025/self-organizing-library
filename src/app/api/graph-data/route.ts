import { getGraphData } from "@/lib/site-index";
import { NextResponse } from "next/server";

export async function GET() {
  const graphData = getGraphData();
  return NextResponse.json(graphData);
}

import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  const results = await searchDocuments(query, limit);
  return NextResponse.json({ results });
}
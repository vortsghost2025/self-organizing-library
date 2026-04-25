import { getEntries } from "@/lib/site-index";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20");

  const results = getEntries({ search: q, limit }).map((entry) => ({
    id: entry.id,
    title: entry.title,
    type: entry.content_type,
    excerpt: entry.description || entry.path,
  }));

  return NextResponse.json({ results });
}

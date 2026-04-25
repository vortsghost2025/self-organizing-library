import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const limit = searchParams.get("limit") || "50";
  const offset = searchParams.get("offset") || "0";
  const redirectUrl = `/api/search?q=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`;
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

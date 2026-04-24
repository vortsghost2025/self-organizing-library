import { NextRequest, NextResponse } from "next/server";
import { createDocument, getDocuments } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, sourceUrl, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const validTypes = ["text", "code", "paper", "link", "note"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const doc = await createDocument({
      title,
      content,
      type: type || "text",
      sourceUrl: sourceUrl || undefined,
      tags: tags || undefined,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create document" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || undefined;

    const documents = await getDocuments({ type, limit, offset, search });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

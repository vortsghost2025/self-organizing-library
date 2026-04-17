export const dynamic = "force-dynamic";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.isDeleted, false))
      .orderBy(desc(documents.updatedAt))
      .limit(100);

    return NextResponse.json(allDocs);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, type, sourceUrl } = body;

    // Calculate word count
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

    const [newDoc] = await db
      .insert(documents)
      .values({
        title,
        content,
        type: type || "text",
        sourceUrl,
        wordCount,
      })
      .returning();

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

import { eq } from "drizzle-orm";

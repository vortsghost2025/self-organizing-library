import { getEntryById } from "@/lib/site-index";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const REPO_ROOT = process.env.REPO_ROOT || "S:/self-organizing-library";

const RENDERABLE_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".css",
  ".sh",
]);

const MAX_CONTENT_SIZE = 500_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = getEntryById(id);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!RENDERABLE_EXTENSIONS.has(entry.extension)) {
    return NextResponse.json({
      content: null,
      renderable: false,
      message: `Files with ${entry.extension} extension are not rendered inline`,
    });
  }

  if (entry.size_bytes > MAX_CONTENT_SIZE) {
    return NextResponse.json({
      content: null,
      renderable: true,
      truncated: true,
      message: `File is ${(entry.size_bytes / 1024).toFixed(0)}KB — too large for inline rendering. View on GitHub.`,
    });
  }

  try {
    const filePath = join(REPO_ROOT, entry.path);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({
      content,
      renderable: true,
      extension: entry.extension,
      truncated: false,
    });
  } catch {
    return NextResponse.json({
      content: null,
      renderable: true,
      truncated: false,
      message:
        "File could not be read — it may exist only in the remote repository",
    });
  }
}

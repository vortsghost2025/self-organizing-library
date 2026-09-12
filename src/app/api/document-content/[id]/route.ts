import { getEntryById, getRepoRoots } from "@/lib/site-index";
import { NextResponse } from "next/server";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import { createRequire } from "module";

const req = createRequire(import.meta.url);
const path: any = req("path");
const fsPromises: any = req("fs/promises");
const safeJoin = (...parts: string[]): string => path.join(...parts);
const readLocalFile = (p: string): Promise<string> => fsPromises.readFile(p, "utf-8");

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

  const repoRoots = getRepoRoots();
  const repoRoot = repoRoots[entry.repo] || process.env.REPO_ROOT || "S:/self-organizing-library";

  try {
    let content: string | null = null;
    try {
      const filePath = safeJoin(repoRoot, entry.path);
      content = await readLocalFile(filePath);
    } catch {
      content = null;
    }

    // If local read fails or is unavailable on cloud serverless, fallback to GitHub raw
    if (content === null && entry.github_url) {
      try {
        const rawUrl = entry.github_url
          .replace("github.com", "raw.githubusercontent.com")
          .replace("/blob/", "/");
        const res = await fetch(rawUrl, { next: { revalidate: 3600 } });
        if (res.ok) {
          content = await res.text();
        }
      } catch {
        content = null;
      }
    }

    if (content === null) {
      return NextResponse.json({
        content: null,
        renderable: true,
        truncated: false,
        message:
          "File could not be read — it may exist only in the remote repository",
      });
    }

    let mdxSource: string | null = null;
    if (entry.extension === ".mdx") {
      try {
        const compiled = await serialize(content, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            format: "mdx",
          },
        });
        mdxSource = compiled.compiledSource;
      } catch {
        mdxSource = null;
      }
    }

    return NextResponse.json({
      content,
      mdxSource,
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

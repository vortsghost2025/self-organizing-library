import { getEntries, getCategories, getTopTags, getStats, getRepos } from "@/lib/site-index";
import type { Metadata } from "next";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Library - Deliberate Ensemble",
  description: "Browse and search the full document archive across all repositories",
};

export default function LibraryPage() {
  // Bandwidth: only ship the fields LibraryClient actually renders/filters on.
  const allEntries = getEntries({ limit: 10000 }).map((e) => ({
    id: e.id,
    repo: e.repo,
    path: e.path,
    title: e.title,
    content_type: e.content_type,
    category: e.category,
    tags: e.tags,
    modified: e.modified,
    description: e.description ? e.description.slice(0, 200) : null,
  })) as unknown as ReturnType<typeof getEntries>;
  const categories = getCategories();
  const topTags = getTopTags(12);
  const stats = getStats();
  const repos = getRepos();

  const typeCounts: { type: string; count: number }[] = [];
  const tcMap: Record<string, number> = {};
  for (const e of allEntries) {
    tcMap[e.content_type] = (tcMap[e.content_type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(tcMap)) {
    typeCounts.push({ type, count });
  }

  return (
    <LibraryClient
      entries={allEntries}
      categories={categories}
      topTags={topTags}
      repos={repos}
      typeCounts={typeCounts}
      totalFiles={stats.totalFiles}
    />
  );
}

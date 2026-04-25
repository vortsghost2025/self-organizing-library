import { getEntries, getCategories, getTopTags, getStats, getRepos } from "@/lib/site-index";
import type { Metadata } from "next";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Library - Deliberate Ensemble",
  description: "Browse and search the full document archive across all repositories",
};

export default function LibraryPage() {
  const allEntries = getEntries({ limit: 3000 });
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

import { getSiteIndex } from "@/lib/site-index";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Search Catalog - Deliberate Ensemble",
  description: "Full document catalog for search indexing",
};

export default function SearchCatalogPage() {
  const index = getSiteIndex();
  const entries = index.entries;

  return (
    <div className="p-8" data-pagefind-body>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Document Catalog</h1>
      <p className="text-[var(--text-muted)] mb-8" data-pagefind-ignore>
        {entries.length} indexed documents across {Object.keys(index.stats.by_repo).length} repositories
      </p>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="p-4 border border-[var(--border)] rounded-lg"
          >
            <Link
              href={`/library/${entry.id}`}
              className="text-[var(--text-primary)] font-semibold hover:text-[var(--primary)]"
              data-pagefind-meta="title"
            >
              {entry.title}
            </Link>
            {entry.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{entry.description}</p>
            )}
            {entry.content_snippet && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{entry.content_snippet}</p>
            )}
        <div className="flex gap-2 mt-2 flex-wrap text-xs">
            <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
              {entry.category}
            </span>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
              {entry.content_type}
            </span>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] mono">
              {entry.repo}
            </span>
            {entry.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary-text)]"
                data-pagefind-filter="tag"
              >
                {tag}
              </span>
            ))}
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { getSiteIndex, getCategories } from "@/lib/site-index";
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
  const categories = getCategories();

  return (
    <div className="p-8" data-pagefind-body>
      {/* Hero / Guidance */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Search the Governance Graph</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Search across {entries.length.toLocaleString()} documents from all 4 lanes (Library, Archivist, Kernel, SwarmMind).
          Try concepts like <strong className="text-[var(--text-primary)]">&ldquo;constitution&rdquo;</strong>, <strong className="text-[var(--text-primary)]">&ldquo;protocol&rdquo;</strong>, or <strong className="text-[var(--text-primary)]">&ldquo;verification&rdquo;</strong>.
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--text-muted)]">
          <span>Quick examples:</span>
          <code className="px-2 py-1 rounded bg-[var(--bg-surface)]">THE COVENANT</code>
          <code className="px-2 py-1 rounded bg-[var(--bg-surface)]">verification-domain-gate</code>
          <code className="px-2 py-1 rounded bg-[var(--bg-surface)]">driftScore</code>
          <code className="px-2 py-1 rounded bg-[var(--bg-surface)]">constraint lattice</code>
        </div>
      </div>

      {/* Category quick-links */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 10).map(cat => (
            <Link
              key={cat.category}
              href={`/library?category=${encodeURIComponent(cat.category)}`}
              className="px-3 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-sm text-[var(--text-secondary)] transition-colors"
            >
              {cat.category} ({cat.count})
            </Link>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[var(--text-muted)] mb-4">
        Showing {entries.length} indexed documents across {Object.keys(index.stats.by_repo).length} repositories
      </p>

      {/* Results list */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors"
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

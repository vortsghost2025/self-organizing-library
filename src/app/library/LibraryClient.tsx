"use client";

import { useState, useMemo, useCallback } from "react";
import type { IndexEntry } from "@/lib/site-index";

interface CategoryCount {
  category: string;
  count: number;
}

interface TagCount {
  tag: string;
  count: number;
}

interface RepoInfo {
  name: string;
  fileCount: number;
}

interface TypeCount {
  type: string;
  count: number;
}

interface LibraryClientProps {
  entries: IndexEntry[];
  categories: CategoryCount[];
  topTags: TagCount[];
  repos: RepoInfo[];
  typeCounts: TypeCount[];
  totalFiles: number;
}

export default function LibraryClient({
  entries,
  categories,
  topTags,
  repos,
  typeCounts,
  totalFiles,
}: LibraryClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = entries;

    if (activeCategory) {
      result = result.filter((e) => e.category === activeCategory);
    }
    if (activeType) {
      result = result.filter((e) => e.content_type === activeType);
    }
    if (activeRepo) {
      result = result.filter((e) => e.repo === activeRepo);
    }
    if (activeTag) {
      result = result.filter((e) => e.tags.includes(activeTag));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [entries, activeCategory, activeType, activeRepo, activeTag, search]);

  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setActiveTag(null);
    setActiveType(null);
    setActiveRepo(null);
    setSearch("");
  }, []);

  const hasFilters = activeCategory || activeTag || activeType || activeRepo || search;

  return (
    <div className="p-8" data-pagefind-body>
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Library</h1>
          <p className="text-[var(--text-secondary)]">
            {filtered.length} documents
            {activeCategory && ` in "${activeCategory}"`}
            {activeTag && ` tagged "${activeTag}"`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="search"
            placeholder="Filter documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none w-48"
            aria-label="Filter documents"
          />
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary text-sm">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6 animate-fade-in stagger-1 flex-wrap">
        <button
          onClick={() => setActiveType(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            !activeType
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          All <span className="opacity-70">{totalFiles}</span>
        </button>
        {typeCounts
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(({ type, count }) => (
            <button
              key={type}
              onClick={() => setActiveType(activeType === type ? null : type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                activeType === type
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              {type} <span className="opacity-70">{count}</span>
            </button>
          ))}
      </div>

      <div className="flex gap-2 mb-4 animate-fade-in stagger-2 flex-wrap">
        <button
          onClick={() => setActiveRepo(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            !activeRepo
              ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
              : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          All Repos
        </button>
        {repos.map((r) => (
          <button
            key={r.name}
            onClick={() => setActiveRepo(activeRepo === r.name ? null : r.name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeRepo === r.name
                ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            {r.name.replace(/-/g, " ")} <span className="opacity-70">{r.fileCount}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    activeCategory === cat.category
                      ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <span className="truncate">{cat.category}</span>
                  <span className="text-xs opacity-60 ml-2">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setActiveTag(activeTag === t.tag ? null : t.tag)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    activeTag === t.tag
                      ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
                      : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-1 gap-3">
            {filtered.length > 0 ? (
              filtered.slice(0, 100).map((doc, i) => (
                <a
                  key={doc.id}
                  href={`/library/${doc.id}`}
                  className={`card p-5 animate-fade-in stagger-${(i % 5) + 1} hover:border-[var(--primary)] flex items-start gap-4`}
                >
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      doc.content_type === "paper"
                        ? "bg-[var(--secondary)]"
                        : doc.content_type === "code"
                        ? "bg-[var(--success)]"
                        : doc.content_type === "data"
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--primary)]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1 truncate">{doc.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-2 line-clamp-1">
                      {doc.description || doc.path}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-[var(--text-muted)] mono">{doc.category}</span>
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-[var(--text-muted)] mono block">
                      {new Date(doc.modified).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] mono block mt-1">
                      {doc.content_type}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4 opacity-50">📚</div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No documents match</h3>
                <p className="text-[var(--text-muted)]">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

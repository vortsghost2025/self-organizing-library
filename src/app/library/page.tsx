import { getEntries, getCategories, getTopTags, getStats, getRepos } from "@/lib/site-index";
import Link from "next/link";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; type?: string; repo?: string; q?: string }>;
}) {
  const params = await searchParams;
  const allEntries = getEntries({
    category: params.category,
    tag: params.tag,
    contentType: params.type,
    repo: params.repo,
    search: params.q,
    limit: 100,
  });
  const categories = getCategories();
  const topTags = getTopTags(12);
  const stats = getStats();
  const repos = getRepos();

  const typeCounts: Record<string, number> = {};
  const allForCounts = getEntries({ limit: 1000 });
  for (const e of allForCounts) {
    typeCounts[e.content_type] = (typeCounts[e.content_type] || 0) + 1;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Library</h1>
          <p className="text-[var(--text-secondary)]">
            {allEntries.length} documents
            {params.category && ` in "${params.category}"`}
            {params.tag && ` tagged "${params.tag}"`}
          </p>
        </div>
        <Link href="/library" className="btn-secondary text-sm">
          Clear Filters
        </Link>
      </div>

      <div className="flex gap-3 mb-6 animate-fade-in stagger-1 flex-wrap">
        <Link
          href="/library"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            !params.type
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          All <span className="opacity-70">{stats.totalFiles}</span>
        </Link>
        {Object.entries(typeCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([type, count]) => (
            <Link
              key={type}
              href={`/library?type=${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                params.type === type
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              {type} <span className="opacity-70">{count}</span>
            </Link>
          ))}
      </div>

      <div className="flex gap-2 mb-4 animate-fade-in stagger-2 flex-wrap">
        <Link
          href="/library"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            !params.repo
              ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
              : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          All Repos
        </Link>
        {repos.map((r) => (
          <Link
            key={r.name}
            href={`/library?repo=${encodeURIComponent(r.name)}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              params.repo === r.name
                ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            {r.name.replace(/-/g, " ")} <span className="opacity-70">{r.fileCount}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.category}
                  href={`/library?category=${cat.category}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    params.category === cat.category
                      ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}
                >
                  <span className="truncate">{cat.category}</span>
                  <span className="text-xs opacity-60 ml-2">{cat.count}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map((t) => (
                <Link
                  key={t.tag}
                  href={`/library?tag=${encodeURIComponent(t.tag)}`}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    params.tag === t.tag
                      ? "bg-[var(--secondary)]/20 text-[var(--secondary)]"
                      : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t.tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3">
          <div className="grid grid-cols-1 gap-3">
            {allEntries.length > 0 ? (
              allEntries.map((doc, i) => (
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

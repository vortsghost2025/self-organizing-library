import { getStats, getEntries, getCategories, getTopTags } from "@/lib/site-index";
import Link from "next/link";
import { LaneArchitecture } from "@/components/LaneArchitecture";

export default async function Dashboard() {
  const stats = getStats();
  const recentDocs = getEntries({ limit: 8 });
  const categories = getCategories();
  const topTags = getTopTags(8);

  return (
    <div className="p-8" data-pagefind-body>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Deliberate Ensemble</h1>
        <p className="text-[var(--text-secondary)]">Living research archive for human-AI collaboration</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8" role="region" aria-label="Archive statistics">
  <div className="card p-6 animate-fade-in stagger-1" role="status">
    <div className="text-4xl font-bold text-[var(--primary)]" aria-label={`${stats.totalFiles} documents`}>{stats.totalFiles.toLocaleString()}</div>
    <div className="text-[var(--text-muted)] mt-1">Documents</div>
  </div>
  <div className="card p-6 animate-fade-in stagger-2" role="status">
    <div className="text-4xl font-bold text-[var(--secondary)]" aria-label={`${stats.tagCount} tags`}>{stats.tagCount}</div>
    <div className="text-[var(--text-muted)] mt-1">Tags</div>
  </div>
  <div className="card p-6 animate-fade-in stagger-3" role="status">
    <div className="text-4xl font-bold text-[var(--success)]" aria-label={`${stats.categoryCount} categories`}>{stats.categoryCount}</div>
    <div className="text-[var(--text-muted)] mt-1">Categories</div>
  </div>
  <div className="card p-6 animate-fade-in stagger-4" role="status">
    <div className="text-4xl font-bold text-[var(--warning)]" aria-label={`${stats.codeCount} code files`}>{stats.codeCount}</div>
    <div className="text-[var(--text-muted)] mt-1">Code Files</div>
  </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6 animate-fade-in stagger-5">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Recent Documents</h2>
          <div className="space-y-3">
            {recentDocs.map((doc) => (
              <a
                key={doc.id}
                href={`/library/${doc.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${doc.content_type === 'paper' ? 'bg-[var(--secondary)]' : doc.content_type === 'code' ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`} />
                  <span className="text-[var(--text-primary)] truncate max-w-[280px]">{doc.title}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)] mono">{doc.category}</span>
              </a>
            ))}
          </div>
          <Link href="/library" className="block mt-4 text-center text-[var(--primary)] text-sm hover:underline">View all documents →</Link>
        </div>

        <div className="card p-6 animate-fade-in stagger-5">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Categories</h2>
          <div className="space-y-2">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.category}
                href={`/library?category=${cat.category}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <span className="text-[var(--text-primary)] text-sm">{cat.category}</span>
                <span className="text-xs text-[var(--text-muted)] mono">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 mt-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Top Tags</h2>
        <div className="flex flex-wrap gap-2">
          {topTags.map((t) => (
            <Link
              key={t.tag}
              href={`/library?tag=${encodeURIComponent(t.tag)}`}
              className="px-3 py-1.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-sm hover:bg-[var(--primary)]/25 transition-colors"
            >
              {t.tag} <span className="opacity-60 ml-1">{t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <LaneArchitecture />

      <div className="card p-6 mt-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">About Deliberate Ensemble</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          Deliberate Ensemble is a living research archive documenting 12 weeks of empirical work on human-AI
          collaboration, multi-agent systems, and constitutional AI governance. It connects documents across
          repos, papers, and logs into a unified, searchable knowledge graph.
        </p>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
            {stats.totalFiles} indexed documents
          </span>
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" />
            {stats.tagCount} unique tags
          </span>
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
            4-lane governance system
          </span>
        </div>
      </div>
    </div>
  );
}

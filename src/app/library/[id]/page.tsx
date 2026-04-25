import { getEntryById, getEntriesByTag, getSiteIndex } from "@/lib/site-index";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarkdownContent from "@/components/MarkdownContent";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getEntryById(id);

  if (!entry) {
    notFound();
  }

  const relatedByTag = entry.tags.length > 0 ? getEntriesByTag(entry.tags[0]).filter((e) => e.id !== id).slice(0, 5) : [];
  const crossRefs = getSiteIndex().cross_references.filter(
    (ref) => ref.source === id || ref.target === id
  );

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-8">
        <div className="mb-6 animate-fade-in">
          <Link href="/library" className="text-[var(--text-muted)] hover:text-[var(--primary)] text-sm">
            ← Back to Library
          </Link>
        </div>

        <div className="card p-8 animate-fade-in stagger-1">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    entry.content_type === "paper"
                      ? "bg-[var(--secondary)]"
                      : entry.content_type === "code"
                      ? "bg-[var(--success)]"
                      : "bg-[var(--primary)]"
                  }`}
                />
                <span className="text-sm text-[var(--text-muted)] uppercase tracking-wide">{entry.content_type}</span>
                <span className="text-sm text-[var(--text-muted)]">·</span>
                <span className="text-sm text-[var(--text-muted)]">{entry.category}</span>
              </div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{entry.title}</h1>
            </div>
            <a
              href={entry.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 text-sm"
            >
              View on GitHub →
            </a>
          </div>

          {entry.tags.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {entry.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/library?tag=${encodeURIComponent(tag)}`}
                  className="text-sm px-3 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mb-8 text-sm text-[var(--text-muted)]">
            <span>
              Path: <strong className="text-[var(--text-secondary)] mono text-xs">{entry.path}</strong>
            </span>
            <span>
              Modified: <strong className="text-[var(--text-secondary)]">{new Date(entry.modified).toLocaleDateString()}</strong>
            </span>
            {entry.date && (
              <span>
                Created: <strong className="text-[var(--text-secondary)]">{new Date(entry.date).toLocaleDateString()}</strong>
              </span>
            )}
          </div>

          {entry.description && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Description</h2>
              <p className="text-[var(--text-secondary)]">{entry.description}</p>
            </div>
          )}

{entry.breadcrumbs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Location</h2>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="mono">self-organizing-library</span>
              {entry.breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span>/</span>
                  <span className="mono">{crumb}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Content</h2>
          <MarkdownContent entryId={entry.id} />
        </div>

          {crossRefs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Cross-References</h2>
              <div className="space-y-1">
                {crossRefs.map((ref, i) => {
                  const otherId = ref.source === id ? ref.target : ref.source;
                  const otherEntry = getEntryById(otherId);
                  return (
                    <Link
                      key={i}
                      href={`/library/${otherId}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" />
                      <span className="text-[var(--text-primary)] truncate">
                        {otherEntry?.title || otherId}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] ml-auto">{ref.type}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 pt-6 border-t border-[var(--border)]">
            <code className="text-xs text-[var(--text-muted)] mono bg-[var(--bg-base)] px-3 py-1 rounded">
              {entry.id}
            </code>
          </div>
        </div>
      </div>

      <aside className="w-[320px] border-l border-[var(--border)] p-6 bg-[var(--bg-surface)]">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">
            Related by Tag
          </h3>
          {relatedByTag.length > 0 ? (
            <div className="space-y-2">
              {relatedByTag.map((related) => (
                <Link
                  key={related.id}
                  href={`/library/${related.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]"
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                  <span className="text-sm text-[var(--text-primary)] truncate">{related.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No related documents</p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Metadata</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Extension</span>
              <span className="text-[var(--text-secondary)] mono">{entry.extension}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Size</span>
              <span className="text-[var(--text-secondary)] mono">
                {entry.size_bytes > 1024 ? `${(entry.size_bytes / 1024).toFixed(1)}KB` : `${entry.size_bytes}B`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Repo</span>
              <span className="text-[var(--text-secondary)] mono text-xs">{entry.repo}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Document ID</h3>
          <code className="text-xs text-[var(--text-muted)] mono bg-[var(--bg-base)] px-2 py-1 rounded block truncate">
            {entry.id}
          </code>
        </div>
      </aside>
    </div>
  );
}

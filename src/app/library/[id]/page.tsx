import { getDocumentById } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocumentById(id);

  if (!doc) {
    notFound();
  }

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
                <span className={`w-3 h-3 rounded-full ${doc.type === 'paper' ? 'bg-[var(--secondary)]' : doc.type === 'code' ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`} />
                <span className="text-sm text-[var(--text-muted)] uppercase tracking-wide">{doc.type}</span>
                {doc.isStarred && <span className="text-[var(--warning)]">★</span>}
              </div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{doc.title}</h1>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary px-4 py-2">Edit</button>
              <button className="btn-secondary px-4 py-2">Export</button>
            </div>
          </div>

          {doc.tags && doc.tags.length > 0 && (
            <div className="flex gap-2 mb-6">
              {doc.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 mb-8 text-sm text-[var(--text-muted)]">
            <span><strong className="text-[var(--text-secondary)]">{doc.wordCount.toLocaleString()}</strong> words</span>
            <span>Created: <strong className="text-[var(--text-secondary)]">{doc.createdAt.toLocaleDateString()}</strong></span>
            <span>Updated: <strong className="text-[var(--text-secondary)]">{doc.updatedAt.toLocaleDateString()}</strong></span>
            {doc.sourceUrl && (
              <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">
                View Original →
              </a>
            )}
          </div>

          <div className="prose prose-invert max-w-none mb-8">
            <pre className="whitespace-pre-wrap text-[var(--text-secondary)] font-sans bg-transparent p-0">
              {doc.content}
            </pre>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-[var(--border)]">
            <button className="btn-primary">Add Link</button>
            <button className="btn-secondary">Add Tag</button>
          </div>
        </div>
      </div>

      <aside className="w-[320px] border-l border-[var(--border)] p-6 bg-[var(--bg-surface)]">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Forward Links</h3>
          {doc.links && doc.links.length > 0 ? (
            <div className="space-y-2">
              {doc.links.map((link: any) => {
                const linkedDoc = doc.linkedDocuments?.find((d: any) => d.id === link.targetId);
                return linkedDoc ? (
                  <Link
                    key={link.id}
                    href={`/library/${link.targetId}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    <span className="text-sm text-[var(--text-primary)] truncate">{linkedDoc.title}</span>
                  </Link>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No links yet</p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Backlinks</h3>
          {doc.backlinks && doc.backlinks.length > 0 ? (
            <div className="space-y-2">
              {doc.backlinks.map((link: any) => {
                const sourceDoc = doc.linkedDocuments?.find((d: any) => d.id === link.sourceId);
                return sourceDoc ? (
                  <Link
                    key={link.id}
                    href={`/library/${link.sourceId}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" />
                    <span className="text-sm text-[var(--text-primary)] truncate">{sourceDoc.title}</span>
                  </Link>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No backlinks yet</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Document ID</h3>
          <code className="text-xs text-[var(--text-muted)] mono bg-[var(--bg-base)] px-2 py-1 rounded block truncate">
            {doc.id}
          </code>
          <p className="text-xs text-[var(--text-muted)] mt-2">Use [[{doc.id}]] to reference this document</p>
        </div>
      </aside>
    </div>
  );
}
import { getDocuments } from "@/lib/db";

export default async function LibraryPage() {
  const documents = await getDocuments({ limit: 50 });
  const typeCounts = {
    text: documents.filter(d => d.type === "text").length,
    code: documents.filter(d => d.type === "code").length,
    paper: documents.filter(d => d.type === "paper").length,
    link: documents.filter(d => d.type === "link").length,
    note: documents.filter(d => d.type === "note").length,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Library</h1>
          <p className="text-[var(--text-secondary)]">Browse and manage all your documents</p>
        </div>
        <button className="btn-primary">
          + Add Document
        </button>
      </div>

      <div className="flex gap-3 mb-6 animate-fade-in stagger-1">
        <button className="px-4 py-2 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] text-sm font-medium">
          All <span className="opacity-70">{documents.length}</span>
        </button>
        <button className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)]">
          Text <span className="opacity-70">{typeCounts.text}</span>
        </button>
        <button className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)]">
          Code <span className="opacity-70">{typeCounts.code}</span>
        </button>
        <button className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)]">
          Papers <span className="opacity-70">{typeCounts.paper}</span>
        </button>
        <button className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)]">
          Links <span className="opacity-70">{typeCounts.link}</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {documents.length > 0 ? (
          documents.map((doc: any, i: number) => (
            <a
              key={doc.id}
              href={`/library/${doc.id}`}
              className={`card p-5 animate-fade-in stagger-${(i % 5) + 1} hover:border-[var(--primary)]`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-3 h-3 rounded-full ${doc.type === 'paper' ? 'bg-[var(--secondary)]' : doc.type === 'code' ? 'bg-[var(--success)]' : doc.type === 'link' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'}`} />
                {doc.isStarred && <span className="text-[var(--warning)]">★</span>}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 truncate">{doc.title}</h3>
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">
                {doc.content.substring(0, 100)}...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {doc.tags?.slice(0, 2).map((tag: any) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-[var(--text-muted)] mono">{doc.wordCount.toLocaleString()} words</span>
              </div>
              {doc.linkCount > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--secondary)]">
                  <span>⟳</span>
                  <span>{doc.linkCount} connections</span>
                </div>
              )}
            </a>
          ))
        ) : (
          <div className="col-span-3 text-center py-16">
            <div className="text-6xl mb-4 opacity-50">📚</div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No documents yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Add your first document to start building your knowledge graph</p>
            <button className="btn-primary">+ Add Your First Document</button>
          </div>
        )}
      </div>
    </div>
  );
}
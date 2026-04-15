import { getStats, getDocuments } from "@/lib/db";
import Link from "next/link";

export default async function Dashboard() {
  const stats = await getStats();
  const recentDocs = await getDocuments({ limit: 5 });

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome to NexusGraph</h1>
        <p className="text-[var(--text-secondary)]">Your self-organizing knowledge library</p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card p-6 animate-fade-in stagger-1">
          <div className="text-4xl font-bold text-[var(--primary)]">{stats.documentCount.toLocaleString()}</div>
          <div className="text-[var(--text-muted)] mt-1">Documents</div>
        </div>
        <div className="card p-6 animate-fade-in stagger-2">
          <div className="text-4xl font-bold text-[var(--secondary)]">{stats.totalWords.toLocaleString()}</div>
          <div className="text-[var(--text-muted)] mt-1">Words</div>
        </div>
        <div className="card p-6 animate-fade-in stagger-3">
          <div className="text-4xl font-bold text-[var(--success)]">{stats.linkCount.toLocaleString()}</div>
          <div className="text-[var(--text-muted)] mt-1">Cross-links</div>
        </div>
        <div className="card p-6 animate-fade-in stagger-4">
          <div className="text-4xl font-bold text-[var(--warning)]">{stats.sourceCount}</div>
          <div className="text-[var(--text-muted)] mt-1">Sources</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6 animate-fade-in stagger-5">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Recent Documents</h2>
          <div className="space-y-3">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc: any) => (
                <a
                  key={doc.id}
                  href={`/library/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${doc.type === 'paper' ? 'bg-[var(--secondary)]' : doc.type === 'code' ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`} />
                    <span className="text-[var(--text-primary)] truncate max-w-[200px]">{doc.title}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] mono">{doc.wordCount.toLocaleString()} words</span>
                </a>
              ))
            ) : (
              <div className="text-[var(--text-muted)] text-center py-8">No documents yet. Add your first document!</div>
            )}
          </div>
          <Link href="/library" className="block mt-4 text-center text-[var(--primary)] text-sm hover:underline">View all documents →</Link>
        </div>

        <div className="card p-6 animate-fade-in stagger-5">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary text-center py-3">
              + Add Document
            </button>
            <button className="btn-secondary text-center py-3">
              Import from URL
            </button>
            <button className="btn-secondary text-center py-3">
              Connect Source
            </button>
            <button className="btn-secondary text-center py-3">
              View Graph
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 mt-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">About NexusGraph</h2>
        <p className="text-[var(--text-secondary)] mb-4">
          NexusGraph is your personal Rosetta Stone for knowledge. It connects documents across all your sources — 
          GitHub repos, Medium articles, DOI papers, and more — into a unified, searchable knowledge graph.
        </p>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" /> 5000 documents capacity
          </span>
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" /> Cross-reference links
          </span>
          <span className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" /> AI-ready exports
          </span>
        </div>
      </div>
    </div>
  );
}
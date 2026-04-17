import Link from "next/link";

export default function LibraryPage() {
  // TODO: Fetch documents from database
  const documents: any[] = [];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-[var(--border)] flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-semibold font-outfit text-[var(--primary)]">
            NexusGraph
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <h1 className="text-lg text-[var(--text-primary)]">Library</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-primary">+ Add Document</button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Filters Sidebar */}
        <aside className="w-64 border-r border-[var(--border)] p-4">
          <h3 className="text-sm uppercase text-[var(--text-muted)] mb-4">Filters</h3>
          
          <div className="mb-6">
            <label className="text-sm text-[var(--text-secondary)] mb-2 block">Type</label>
            <div className="space-y-2">
              {["text", "code", "paper", "link", "note"].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-[var(--primary)]" />
                  <span className="text-sm text-[var(--text-secondary)] capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-2 block">Sort By</label>
            <select className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
              <option>Recently Added</option>
              <option>Title A-Z</option>
              <option>Most Connected</option>
              <option>Word Count</option>
            </select>
          </div>
        </aside>

        {/* Document Grid */}
        <main className="flex-1 p-6">
          {documents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold mb-2">No documents yet</h2>
              <p className="text-[var(--text-muted)] mb-6">
                Add your first document to start building your knowledge library.
              </p>
              <button className="btn-primary">+ Add Document</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[var(--surface)] rounded-xl p-4 card-shadow hover:border-[var(--primary)] border border-transparent transition-colors cursor-pointer"
                >
                  <h3 className="font-semibold mb-2 truncate">{doc.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="px-2 py-1 bg-[var(--surface-hover)] rounded capitalize">
                      {doc.type}
                    </span>
                    <span className="mono">{doc.wordCount} words</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

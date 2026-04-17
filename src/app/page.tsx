import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold font-outfit text-[var(--primary)]">
            NexusGraph
          </h1>
          <span className="text-sm text-[var(--text-muted)]">
            Self-Organizing Knowledge Library
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-[var(--surface)] rounded-lg text-sm hover:bg-[var(--surface-hover)] transition-colors">
            ⌘K Search
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[var(--border)] p-4">
          <nav className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--surface)] text-[var(--primary)]"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
            >
              <span>📚</span>
              <span>Library</span>
            </Link>
            <Link
              href="/graph"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
            >
              <span>🔗</span>
              <span>Graph</span>
            </Link>
            <Link
              href="/sources"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
            >
              <span>🔌</span>
              <span>Sources</span>
            </Link>
            <Link
              href="/collections"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-secondary)] transition-colors"
            >
              <span>📁</span>
              <span>Collections</span>
            </Link>
          </nav>

          <div className="mt-8 pt-4 border-t border-[var(--border)]">
            <h3 className="text-xs uppercase text-[var(--text-muted)] mb-2">Quick Stats</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Documents</span>
                <span className="mono text-[var(--secondary)]">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Links</span>
                <span className="mono text-[var(--secondary)]">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Tags</span>
                <span className="mono text-[var(--secondary)]">0</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Dashboard */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6">Welcome to NexusGraph</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[var(--surface)] rounded-xl p-4 card-shadow">
                <div className="text-[var(--text-muted)] text-sm mb-1">Total Documents</div>
                <div className="text-3xl font-bold mono text-[var(--primary)]">0</div>
              </div>
              <div className="bg-[var(--surface)] rounded-xl p-4 card-shadow">
                <div className="text-[var(--text-muted)] text-sm mb-1">Connections</div>
                <div className="text-3xl font-bold mono text-[var(--secondary)]">0</div>
              </div>
              <div className="bg-[var(--surface)] rounded-xl p-4 card-shadow">
                <div className="text-[var(--text-muted)] text-sm mb-1">Sources</div>
                <div className="text-3xl font-bold mono text-[var(--success)]">0</div>
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-[var(--surface)] rounded-xl p-6 card-shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">🚀 Getting Started</h3>
              <div className="space-y-3 text-[var(--text-secondary)]">
                <p>NexusGraph helps you organize and visualize your knowledge library.</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Add documents manually or connect external sources</li>
                  <li>Create links between related documents</li>
                  <li>Visualize connections in the Graph view</li>
                  <li>Organize with collections and tags</li>
                </ol>
              </div>
              <div className="mt-4">
                <button className="btn-primary">+ Add Document</button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--surface)] rounded-xl p-6 card-shadow">
              <h3 className="text-lg font-semibold mb-4">📝 Recent Activity</h3>
              <div className="text-center py-8 text-[var(--text-muted)]">
                No documents yet. Add your first document to get started.
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

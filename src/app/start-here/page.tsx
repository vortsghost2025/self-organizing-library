import Link from "next/link";

export default function StartHerePage() {
  return (
    <div className="p-8 max-w-3xl mx-auto" data-pagefind-body>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Start Here</h1>
        <p className="text-[var(--text-secondary)]">Your guide to the Deliberate Ensemble archive</p>
      </div>

      <div className="space-y-6">
        <div className="card p-6 animate-fade-in stagger-1">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Browse the Library</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            The library contains all indexed documents from the project. Search by title, tag, or category.
          </p>
          <Link href="/library" className="text-[var(--primary)] hover:underline text-sm">
            Go to Library →
          </Link>
        </div>

        <div className="card p-6 animate-fade-in stagger-2">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. Read the Papers</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            The Rosetta Stone series (Papers 1–6) forms the theoretical backbone. Start with Paper 1 for
            the foundational concepts, then progress through the series.
          </p>
          <Link href="/papers" className="text-[var(--secondary)] hover:underline text-sm">
            Go to Papers →
          </Link>
        </div>

        <div className="card p-6 animate-fade-in stagger-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. Explore the Nexus Graph</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            The interactive graph is now split into lenses. Start with the Navigation Map, then switch to
            authority, governance, paper, or canonical views depending on the question you are asking.
          </p>
          <Link href="/graph" className="text-[var(--success)] hover:underline text-sm">
            Go to Graph →
          </Link>
        </div>

        <div className="card p-6 animate-fade-in stagger-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. Browse Repos</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Each repository in the organization is indexed. See what documents exist in each repo and
            navigate directly to GitHub.
          </p>
          <Link href="/repos" className="text-[var(--warning)] hover:underline text-sm">
            Go to Repos →
          </Link>
        </div>

        <div className="card p-6 animate-fade-in stagger-5">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Use Search</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-base)] rounded text-xs">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-[var(--bg-base)] rounded text-xs">Ctrl+K</kbd> to open
            search. Search across all documents by title, path, description, or tags.
          </p>
        </div>
      </div>
    </div>
  );
}

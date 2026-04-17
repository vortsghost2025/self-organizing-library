import Link from "next/link";

export default function SourcesPage() {
  // TODO: Implement source connectors
  
  const sourceTypes = [
    { type: "github", name: "GitHub", icon: "📦", description: "Connect repos, readmes, issues" },
    { type: "medium", name: "Medium", icon: "📝", description: "Fetch articles via RSS" },
    { type: "doi", name: "DOI", icon: "📄", description: "Fetch paper metadata from CrossRef" },
    { type: "twitter", name: "Twitter/X", icon: "🐦", description: "Fetch tweets (if API available)" },
    { type: "custom", name: "Custom URL", icon: "🌐", description: "Generic web scraper" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-[var(--border)] flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-semibold font-outfit text-[var(--primary)]">
            NexusGraph
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <h1 className="text-lg text-[var(--text-primary)]">Sources</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-primary">+ Add Source</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <h2 className="text-2xl font-semibold mb-6">External Source Connectors</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {sourceTypes.map((source) => (
            <div
              key={source.type}
              className="bg-[var(--surface)] rounded-xl p-6 card-shadow border border-transparent hover:border-[var(--primary)] transition-colors cursor-pointer"
            >
              <div className="text-4xl mb-3">{source.icon}</div>
              <h3 className="font-semibold mb-1">{source.name}</h3>
              <p className="text-sm text-[var(--text-muted)]">{source.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="px-2 py-1 bg-[var(--surface-hover)] rounded text-xs text-[var(--text-muted)]">
                  Not connected
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";

export default function GraphPage() {
  // TODO: Implement force-directed graph visualization
  // Will need D3.js or react-force-graph
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-[var(--border)] flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-semibold font-outfit text-[var(--primary)]">
            NexusGraph
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <h1 className="text-lg text-[var(--text-primary)]">Graph</h1>
        </div>
        <div className="flex items-center gap-4">
          <select className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
            <option>Cluster by Type</option>
            <option>Cluster by Tag</option>
            <option>Cluster by Source</option>
          </select>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-xl font-semibold mb-2">Graph Visualization</h2>
          <p className="text-[var(--text-muted)] mb-6 max-w-md">
            See your documents as a network of connections. Nodes sized by connection count, 
            colored by source type.
          </p>
          <div className="bg-[var(--surface)] rounded-lg p-4 inline-block">
            <p className="text-sm text-[var(--text-secondary)]">
              Add documents and create links to see them visualized here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

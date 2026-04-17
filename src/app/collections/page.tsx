import Link from "next/link";

export default function CollectionsPage() {
  // TODO: Implement collections management
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-[var(--border)] flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-semibold font-outfit text-[var(--primary)]">
            NexusGraph
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <h1 className="text-lg text-[var(--text-primary)]">Collections</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-primary">+ New Collection</button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <h2 className="text-2xl font-semibold mb-6">Your Collections</h2>
        
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
          <p className="text-[var(--text-muted)] mb-6 max-w-md">
            Collections let you group related documents together. 
            Create manual collections or set up auto-collections based on tags.
          </p>
          <button className="btn-primary">+ Create Collection</button>
        </div>
      </main>
    </div>
  );
}

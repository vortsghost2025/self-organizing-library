export default function CollectionsPage() {
  const mockCollections = [
    { id: "1", name: "AI Research", description: "Papers and notes on AI/ML", documentCount: 234, isAuto: false },
    { id: "2", name: "Code Snippets", description: "Useful code examples", documentCount: 89, isAuto: false },
    { id: "3", name: "Starred", description: "Pinned important documents", documentCount: 12, isAuto: true },
    { id: "4", name: "Recent", description: "Last 30 days activity", documentCount: 156, isAuto: true },
    { id: "5", name: "Unlinked", description: "Documents without connections", documentCount: 45, isAuto: true },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Collections</h1>
          <p className="text-[var(--text-secondary)]">Organize documents into groups</p>
        </div>
        <button className="btn-primary">
          + Create Collection
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {mockCollections.map((collection: any, i: number) => (
          <a
            key={collection.id}
            href={`/collections/${collection.id}`}
            className={`card p-6 animate-fade-in stagger-${(i % 5) + 1} hover:border-[var(--primary)]`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                {collection.isAuto ? "◉" : "◈"}
              </div>
              {collection.isAuto && (
                <span className="text-xs text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-base)] rounded">Auto</span>
              )}
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{collection.name}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{collection.description}</p>
            <div className="text-sm text-[var(--secondary)]">
              {collection.documentCount} documents
            </div>
          </a>
        ))}

        <div className="card p-6 border-dashed hover:border-[var(--primary)] cursor-pointer animate-fade-in">
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-hover)] flex items-center justify-center text-2xl text-[var(--text-muted)] mb-4">
              +
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">New Collection</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
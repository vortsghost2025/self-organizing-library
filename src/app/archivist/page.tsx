import { getSiteIndex } from "@/lib/site-index";

export default async function ArchivistPage() {
  const index = getSiteIndex();
  const entries = index.entries.filter(e => e.repo === "Archivist-Agent");
  const categories = Object.entries(
    entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  return (
    <div className="p-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Archivist Lane</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Governance, sovereignty, and identity enforcement. Maintains the truth ledger and ratification protocol.
        </p>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-[var(--secondary)]/15 text-[var(--secondary)] text-sm font-medium">
            {entries.length} documents
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] text-sm">
            {categories.length} categories
          </span>
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
        <h3 className="text-[var(--text-primary)]">Scope &amp; Responsibilities</h3>
        <ul>
          <li><strong>Identity &amp; trust:</strong> RSA key lifecycle, trust-store ratification, JWS verification</li>
          <li><strong>Message schema:</strong> Inbox schema v1.0 enforcement, idempotency, id enforcement</li>
          <li><strong>Convergence gate:</strong> Final ratification of all cross-lane proposals</li>
          <li><strong>Session handoff:</strong> Maintains session continuity across context compactions</li>
          <li><strong>Quarantine &amp; expiry:</strong> Rejects non-compliant messages (expired, invalid signatures)</li>
        </ul>

        <h3 className="text-[var(--text-primary)]">Isolation Model</h3>
        <p>
          The Archivist&apos;s authority is <strong>non-negotiable</strong>. No lane may mutate trust-store keys, ratify proposals, or sign messages without Archivist-issued credentials. It operates as the final arbiter of truth — a binary gate: either a message is verified (enters processing) or it is rejected (moved to <code>expired/</code>).
        </p>

        <h3 className="text-[var(--text-primary)]">Connection to Papers</h3>
        <p>
          Governance protocols (CONVERGENCE_PROTOCOL, IDENTITY_PROTOCOL) are published as formal specifications in the Archivist&apos;s repo. These papers define the operational constraints that all lanes must obey.
        </p>
      </div>

      <div className="card p-6 border-l-4 border-[var(--secondary)]">
        <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">Recent Documents</h3>
        <div className="space-y-2">
          {entries.slice(0, 10).map(entry => (
            <a
              key={entry.id}
              href={`/library/${entry.id}`}
              className="block p-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <div className="font-medium text-[var(--text-primary)]">{entry.title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {entry.category} • {entry.repo}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

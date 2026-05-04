import { getSiteIndex } from "@/lib/site-index";

export default async function SwarmMindPage() {
  const index = getSiteIndex();
  const entries = index.entries.filter(e => e.repo === "SwarmMind");
  const categories = Object.entries(
    entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  return (
    <div className="p-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">SwarmMind Lane</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Multi-agent drift detection and constraint verification. Autonomous oversight and validation.
        </p>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-[var(--warning)]/15 text-[var(--warning)] text-sm font-medium">
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
          <li><strong>Drift detection:</strong> Monitors all lanes for deviation from ratified state</li>
          <li><strong>Constraint verification:</strong> Recomputes drift scores and flags violations</li>
          <li><strong>Evidence collection:</strong> Gathers logs, verdicts, and state snapshots for audit</li>
          <li><strong>Escalation:</strong> Issues P0 escalations when contradictions or blockers detected</li>
          <li><strong>Health checks:</strong> Heartbeat monitoring, session validation, cross-lane consistency scans</li>
        </ul>

        <h3 className="text-[var(--text-primary)]">Isolation Model</h3>
        <p>
          SwarmMind is a <strong>read-only observer</strong>. It never mutates state directly. It only verifies and escalates. Its authority derives from being able to declare a &quot;blocker&quot; or &quot;conflicted&quot; state, which freezes all non-essential work across all lanes until resolved.
        </p>

        <h3 className="text-[var(--text-primary)]">Connection to Papers</h3>
        <p>
          SwarmMind&apos;s detection algorithms are documented in drift-detection papers and resilience analysis reports. These papers are published externally and referenced in the SwarmMind repo&apos;s verification docs.
        </p>
      </div>

      <div className="card p-6 border-l-4 border-[var(--warning)]">
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

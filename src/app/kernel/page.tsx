import { getSiteIndex } from "@/lib/site-index";

export default async function KernelPage() {
  const index = getSiteIndex();
  const entries = index.entries.filter(e => e.repo === "kernel-lane");
  const categories = Object.entries(
    entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  return (
    <div className="p-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Kernel Lane</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Runtime enforcement, constraint lattice, and OS-level policies. The operational control plane.
        </p>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-[var(--success)]/15 text-[var(--success)] text-sm font-medium">
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
          <li><strong>Constraint lattice:</strong> Declarative optimization problem: minimize drift subject to constraints</li>
          <li><strong>Runtime validation:</strong> Enforces output provenance, blob boundaries, convergence gate checks</li>
          <li><strong>Process supervision:</strong> Supervises agent lifecycle, heartbeat monitoring, stale-lane detection</li>
          <li><strong>OS-level policies:</strong> File-system layout, lane-directory enforcement, SMB mount validation</li>
          <li><strong>Drift score calc:</strong> Computes divergence between intended state and actual state</li>
        </ul>

        <h3 className="text-[var(--text-primary)]">Isolation Model</h3>
        <p>
          The Kernel runs <strong>closest to the metal</strong>. It can kill or restart agents, enforce read/write boundaries, and validate every output against provenance contracts. It does not make decisions — it enforces constraints defined by governance. Its authority is absolute but bounded by the Archivist-ratified constraint lattice.
        </p>

        <h3 className="text-[var(--text-primary)]">Connection to Papers</h3>
        <p>
          The constraint lattice formulation is documented in the Kernel&apos;s README and specification papers. These define the optimization objective (minimize drift) and hard constraints (identity, session-mode, lane-relay paths).
        </p>
      </div>

      <div className="card p-6 border-l-4 border-[var(--success)]">
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

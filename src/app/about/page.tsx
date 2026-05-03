export default function AboutPage() {
  return (
    <div className="p-8" data-pagefind-body>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">About</h1>
        <p className="text-[var(--text-secondary)]">The Deliberate Ensemble project</p>
      </div>

      <div className="card p-8 animate-fade-in">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">What is Deliberate Ensemble?</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Deliberate Ensemble is a 12-week empirical research project (Jan–Apr 2026) exploring human-AI
            collaboration, multi-agent systems, and constitutional AI governance. The project produced the
            Rosetta Stone paper series (Papers 1–6), a 4-lane constitutional governance system, and a
            CAISC 2026 conference paper.
          </p>

          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 mt-8">The 4-Lane System</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-[var(--bg-surface-hover)]">
              <h3 className="font-semibold text-[var(--primary)] mb-1">Archivist (Authority 100)</h3>
              <p className="text-sm text-[var(--text-muted)]">Governance root — ratification and policy</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-surface-hover)]">
              <h3 className="font-semibold text-[var(--success)] mb-1">SwarmMind (Authority 80)</h3>
              <p className="text-sm text-[var(--text-muted)]">Execution layer — task dispatch and agents</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-surface-hover)]">
              <h3 className="font-semibold text-[var(--secondary)] mb-1">Library (Authority 90)</h3>
              <p className="text-sm text-[var(--text-muted)]">Verification and enforcement — evidence-based proof</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-surface-hover)]">
              <h3 className="font-semibold text-[var(--warning)] mb-1">Kernel (Authority 40)</h3>
              <p className="text-sm text-[var(--text-muted)]">Runtime layer — system operations</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 mt-8">Links</h2>
          <div className="flex gap-4">
            <a
              href="https://github.com/vortsghost2025/Deliberate-AI-Ensemble"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline text-sm"
            >
              GitHub Repository →
            </a>
            <a
              href="https://osf.io/n3tya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--secondary)] hover:underline text-sm"
            >
              OSF Project →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

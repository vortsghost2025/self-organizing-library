import { getStats } from "@/lib/site-index";
import Link from "next/link";
import { LaneArchitecture } from "@/components/LaneArchitecture";
import { UnderstandingTheSystem } from "@/components/UnderstandingTheSystem";

export default async function Dashboard() {
  const stats = getStats();

  return (
    <div className="p-8" data-pagefind-body>
      {/* Hero: what this is */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
          Deliberate Ensemble
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          A living research archive and constitutional AI governance system.
          Four autonomous lanes work together under signed, verifiable rules.
          Everything is indexed, cross-referenced, and proven.
        </p>
      </div>

      {/* System status at a glance */}
      <div className="grid grid-cols-4 gap-6 mb-10" role="region" aria-label="System status">
        <div className="card p-6 animate-fade-in stagger-1" role="status">
          <div className="text-4xl font-bold text-[var(--primary)]">{stats.totalFiles.toLocaleString()}</div>
          <div className="text-[var(--text-muted)] mt-1">Indexed documents</div>
        </div>
        <div className="card p-6 animate-fade-in stagger-2" role="status">
          <div className="text-4xl font-bold text-[var(--secondary)]">{stats.tagCount}</div>
          <div className="text-[var(--text-muted)] mt-1">Unique tags</div>
        </div>
        <div className="card p-6 animate-fade-in stagger-3" role="status">
          <div className="text-4xl font-bold text-[var(--success)]">{stats.categoryCount}</div>
          <div className="text-[var(--text-muted)] mt-1">Categories</div>
        </div>
        <div className="card p-6 animate-fade-in stagger-4" role="status">
          <div className="text-4xl font-bold text-[var(--warning)]">4</div>
          <div className="text-[var(--text-muted)] mt-1">Governance lanes</div>
        </div>
      </div>

      {/* Plain-language explanation */}
      <div className="card p-6 mb-8 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">
          How This Works (in plain English)
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-[var(--text-secondary)] text-sm leading-relaxed">
          <div>
            <h3 className="text-base font-semibold mb-2 text-[var(--text-primary)]">Four independent agents</h3>
              <p>
                Think of it like a company with four departments that can&apos;t act unilaterally.
                The <strong>Archivist</strong> is legal/rules. The <strong>Library</strong> is facts/evidence.
                The <strong>SwarmMind</strong> is engineering. The <strong>Kernel</strong> is infrastructure.
                Every major decision requires at least three of them to agree — and every claim
                must come with proof you can verify yourself.
              </p>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-2 text-[var(--text-primary)]">Why all this?</h3>
            <p>
              Human-AI teams make mistakes. So do AI agents. This system catches those mistakes
              by requiring signed evidence, cross-lane verification, and a public audit trail.
              Failure modes are documented as NFMs (Named Failure Modes) and tested deliberately.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[var(--bg-surface)] rounded-lg border-l-4 border-[var(--primary)] text-sm">
          <strong>Current status:</strong> Autonomous Constitutional Enforcement is converged
          (Archivist + Library approved). The trust layer is hardened. The graph is live.
          Next up: accessibility audit, NFM classification engine, and Paper 7 (failure injection).
        </div>
      </div>

      {/* External services dashboard */}
      <div className="card p-6 mb-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">External Services</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Federated dashboards and mesh-connected services outside the core 4-lane governance system.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="https://orangered-jellyfish-637583.hostingersite.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xl">
              🧠
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)]">Mental Health Mesh</div>
              <div className="text-xs text-[var(--text-muted)]">
                Canada-based offline mesh service, bridged via GitHub integration
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Main system explanation (replace Recent + Categories) */}
      <div className="mb-10">
        <UnderstandingTheSystem />
      </div>

      {/* Lane diagram + about */}
      <LaneArchitecture />

      <div className="card p-6 mt-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">About Deliberate Ensemble</h2>
        <p className="text-[var(--text-secondary)] mb-4 text-sm">
          This is a living archive. It&apos;s not a finished product — it&apos;s the record of how the system
          was built, why decisions were made, and what constraints are enforced. Every governance
          artifact, every test result, and every failure mode is preserved here for audit.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] mono">
          <span>Status: Operational</span>
          <span>•</span>
          <span>Lanes: 4 active</span>
          <span>•</span>
          <span>Documents: {stats.totalFiles.toLocaleString()}</span>
          <span>•</span>
          <span>Tags: {stats.tagCount}</span>
        </div>
      </div>
    </div>
  );
}

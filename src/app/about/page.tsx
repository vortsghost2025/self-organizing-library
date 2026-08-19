import Link from "next/link";
import { getConstitutionalLaneAuthority, getSemanticDefinition } from "@/lib/canonical-governance";
import { getRepoCounts } from "@/lib/repo-registry";
import { getStats } from "@/lib/site-index";

export default function AboutPage() {
  const auth = getConstitutionalLaneAuthority();
  const repoCounts = getRepoCounts();
  const stats = getStats();
  const laneDef = getSemanticDefinition("constitutional_lane_authority");

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-5xl" data-pagefind-body>
      {/* Header */}
      <div className="space-y-2 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider">
          About &amp; Research Architecture
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
          Sean David Ramsingh &amp; Deliberate Ensemble
        </h1>
        <p className="text-base text-[var(--text-secondary)]">
          Systems architecture, verifiable multi-agent orchestration, and constitutional AI governance.
        </p>
      </div>

      {/* Profile & Research Background */}
      <section className="card p-6 md:p-8 space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Engineering Focus &amp; Background
        </h2>
        <div className="prose prose-invert max-w-none text-[var(--text-secondary)] space-y-4 text-sm md:text-base leading-relaxed">
          <p>
            I am a software and systems engineer specializing in <strong>verifiable multi-agent architectures</strong>,
            <strong>autonomous orchestration</strong>, and <strong>GPU/runtime infrastructure</strong>. My work focuses on
            building resilient distributed systems where independent AI agents collaborate under strict mathematical
            and constitutional constraints.
          </p>
          <p>
            The <strong>Deliberate Ensemble</strong> project is an empirical research program exploring multi-agent deliberation,
            formal consensus gates, and cryptographic auditability. It produced the foundational <em>Rosetta Stone</em> research
            series (Papers 1–6), an automated multi-lane governance engine, and a live index of over{" "}
            <strong>{stats.totalFiles.toLocaleString()}</strong> verified knowledge and code artifacts across{" "}
            <strong>{repoCounts.docIndexAllowed}</strong> active repositories.
          </p>
        </div>
      </section>

      {/* Constitutional Governance Model */}
      <section className="card p-6 md:p-8 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            Governance Model
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Four-Lane Constitutional Architecture
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {laneDef}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--primary)] text-base">Archivist Lane</span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                Authority {auth.archivist}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">Constitutional Root &amp; Ratification</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Maintains the sovereign canonical record, ratifies cross-lane proposals, manages trust anchors,
              and administers the single active blocker protocol.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--success)] text-base">SwarmMind Lane</span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--success)]/10 text-[var(--success)]">
                Authority {auth.swarmmind}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">Execution &amp; Autonomous Dispatch</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Orchestrates parallel multi-agent execution, runs self-optimizing improvement loops, generates proposals,
              and monitors runtime drift.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--warning)] text-base">Kernel Lane</span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                Authority {auth.kernel}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">Runtime Ops &amp; CUDA Acceleration</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Manages low-level GPU compute, CUDA/SASS/PTX optimization, process supervision, OS policies, and
              cross-lane relay message routing.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--secondary)] text-base">Library Lane</span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--secondary)]/10 text-[var(--secondary)]">
                Authority {auth.library}
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">Verification &amp; Proof Gatekeeper</div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Enforces proof-of-evidence requirements. Validates runtime execution traces, runs consensus gates,
              and coordinates the living document archive.
            </p>
          </div>
        </div>
      </section>

      {/* Research Papers & Publications */}
      <section className="card p-6 md:p-8 space-y-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Selected Research &amp; Publications
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-1">
            <h3 className="font-semibold text-[var(--text-primary)]">Rosetta Stone Paper Series (Papers 1–6)</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Formal mathematical and empirical framework for multi-agent constraint lattices, consensus convergence, and error bounds.
            </p>
            <Link href="/papers" className="text-xs text-[var(--primary)] hover:underline inline-block pt-1">
              Read Papers →
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-1">
            <h3 className="font-semibold text-[var(--text-primary)]">Open Science Framework (OSF) Preprints</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Permanent preprints, dataset snapshots, and empirical methodology documentation hosted on the OSF archive.
            </p>
            <a
              href="https://osf.io/n3tya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--secondary)] hover:underline inline-block pt-1"
            >
              View on OSF ↗
            </a>
          </div>
        </div>
      </section>

      {/* External Links */}
      <section className="card p-6 md:p-8 space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">External Links &amp; Profiles</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="https://github.com/vortsghost2025"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            GitHub Organization ↗
          </a>
          <a
            href="https://www.linkedin.com/in/sean-david-ramsingh-2143a63ab/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            LinkedIn Profile ↗
          </a>
          <a
            href="https://medium.com/@ai_28876"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Medium Publications ↗
          </a>
          <a
            href="https://orangered-jellyfish-637583.hostingersite.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--success)] hover:underline flex items-center gap-1"
          >
            Mental Health Community ↗
          </a>
        </div>
      </section>
    </div>
  );
}

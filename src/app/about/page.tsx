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
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Engineering Focus &amp; Background
        </h2>
        <div className="prose prose-invert max-w-none text-[var(--text-secondary)] space-y-4 text-base md:text-lg leading-relaxed">
          <p>
            I am a software and systems engineer specializing in <strong>verifiable multi-agent architectures</strong>,
            <strong>autonomous runtime safety</strong>, and <strong>GPU/runtime infrastructure</strong>. My work centers on
            constructing sovereign distributed systems where autonomous AI agents operate under strict mathematical constraints,
            cryptographic policy verification, and deterministic error boundaries.
          </p>
          <p>
            The <strong>Deliberate Ensemble</strong> initiative is an empirical research program exploring multi-agent deliberation,
            formal consensus convergence, and zero-trust verification. This ecosystem encompasses the foundational <em>Rosetta Stone</em> research
            series (Papers 1–6), an automated four-lane constitutional governance engine, and a live index of over{" "}
            <strong>{stats.totalFiles.toLocaleString()}</strong> verified knowledge artifacts across{" "}
            <strong>52 public repositories</strong>.
          </p>
        </div>

        {/* Core Competencies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="text-2xl">🛡️</div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Runtime Safety &amp; Guardrails</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Engineering deterministic interceptors (Doberman-Core) that sandbox inputs, outputs, and tool calls before execution.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Agentic Terminals &amp; Workspaces</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Windows-native multiplexing (wmux), agent-operable Wave Terminal runtimes with WSH streaming, and offline-first AI engines (Vortscore).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="text-2xl">💚</div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Offline Public Goods</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Building zero-tracking, offline-first digital resources for Canadian mental health crisis navigation (WE4FREE).
            </p>
          </div>
        </div>
      </section>

      {/* Constitutional Governance Model */}
      <section className="card p-6 md:p-8 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            Governance Model
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Four-Lane Constitutional Architecture
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)]">
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
      <section className="card p-6 md:p-8 space-y-6 animate-fade-in">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
            Theoretical Foundations
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Selected Research &amp; Publications
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Peer-reviewed literature, permanent preprints, and open-source specifications on multi-agent systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="inline-flex px-2 py-0.5 rounded text-xs font-mono bg-[var(--primary)]/10 text-[var(--primary)]">
              Foundational Series
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">Rosetta Stone Paper Series (Papers 1–6)</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Formal mathematical and empirical framework establishing multi-agent constraint lattices, consensus convergence gates, and deterministic error boundaries.
            </p>
            <div className="pt-2">
              <Link href="/papers" className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1">
                <span>Read Papers 1–6</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="inline-flex px-2 py-0.5 rounded text-xs font-mono bg-[var(--secondary)]/10 text-[var(--secondary)]">
              Permanent Archive
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">Open Science Framework (OSF) Preprints</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Permanent preprints, dataset snapshots, and empirical methodology documentation archived with persistent DOIs on the Open Science Framework.
            </p>
            <div className="pt-2">
              <a
                href="https://osf.io/n3tya"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[var(--secondary)] hover:underline inline-flex items-center gap-1"
              >
                <span>View on OSF Archive</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="inline-flex px-2 py-0.5 rounded text-xs font-mono bg-[var(--warning)]/10 text-[var(--warning)]">
              Technical Essays
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">Medium Engineering Series</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              In-depth essays analyzing runtime drift, AI agent failure modes, constitutional prompt architecture, and practical CUDA acceleration.
            </p>
            <div className="pt-2">
              <a
                href="https://medium.com/@ai_28876"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[var(--warning)] hover:underline inline-flex items-center gap-1"
              >
                <span>Read on Medium</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)] space-y-2">
            <div className="inline-flex px-2 py-0.5 rounded text-xs font-mono bg-purple-500/10 text-purple-400">
              Audio Media
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">MeshCast Audio Podcast</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Technical discussions, architecture breakdowns, and debates exploring modern multi-agent systems and governance.
            </p>
            <div className="pt-2">
              <Link href="/meshcast" className="text-xs font-semibold text-purple-400 hover:underline inline-flex items-center gap-1">
                <span>Listen to Episodes</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* External Links */}
      <section className="card p-6 md:p-8 space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">External Links &amp; Collaboration</h2>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <a
            href="https://github.com/vortsghost2025"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] text-[var(--primary)] hover:border-[var(--primary)] transition-all flex items-center gap-1.5"
          >
            <span>GitHub (@vortsghost2025)</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.linkedin.com/in/sean-david-ramsingh-2143a63ab/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] text-[var(--primary)] hover:border-[var(--primary)] transition-all flex items-center gap-1.5"
          >
            <span>LinkedIn Profile</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.youtube.com/@seandavidramsingh-s9z"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 hover:border-red-400 hover:text-white transition-all flex items-center gap-1.5 font-semibold shadow-sm"
          >
            <span>YouTube (@seandavidramsingh-s9z)</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.tiktok.com/@we4free"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-pink-950/40 border border-pink-500/40 text-pink-200 hover:border-pink-400 hover:text-white transition-all flex items-center gap-1.5 font-semibold shadow-sm"
          >
            <span>TikTok (@we4free)</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://osf.io/n3tya"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] text-[var(--primary)] hover:border-[var(--primary)] transition-all flex items-center gap-1.5"
          >
            <span>OSF Papers</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://medium.com/@ai_28876"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] text-[var(--warning)] hover:border-[var(--warning)] transition-all flex items-center gap-1.5"
          >
            <span>Medium Articles</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://github.com/vortsghost2025/WE4FREE"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border)] text-[var(--success)] hover:border-[var(--success)] transition-all flex items-center gap-1.5"
          >
            <span>WE4FREE Crisis Directory</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

    </div>
  );
}

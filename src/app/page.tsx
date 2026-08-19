import Image from "next/image";
import Link from "next/link";
import { LaneArchitecture } from "@/components/LaneArchitecture";
import { HeroSection } from "@/components/homepage/HeroSection";
import { LiveSystemPulse } from "@/components/homepage/LiveSystemPulse";
import HomeSystemStateStrip from "@/components/homepage/HomeSystemStateStrip";
import SystemOverview from "@/components/SystemOverview";
import { getStats } from "@/lib/site-index";
import { getFeaturedRepositories, getRepoCounts } from "@/lib/repo-registry";

export default async function Dashboard() {
  const stats = getStats();
  const featuredRepos = getFeaturedRepositories();
  const repoCounts = getRepoCounts();

  const heroTitle = "Sean David Ramsingh — AI Systems Architecture & Research";
  const heroTagline =
    "Engineering autonomous multi-agent orchestration, constitutional governance, GPU-accelerated runtime infrastructure, and deterministic verification.";

  return (
    <div className="p-4 md:p-8 space-y-12" data-pagefind-body>
      {/* 1. Hero Section */}
      <HeroSection title={heroTitle} tagline={heroTagline} />

      {/* 2. Professional Profile & Focus Areas */}
      <section className="card p-6 md:p-8 animate-fade-in" aria-label="Technical Profile and Focus Areas">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider">
              Principal Systems Engineering & Research
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Verifiable Multi-Agent Systems & Distributed AI Infrastructure
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Specializing in the design of sovereign multi-agent architectures, cryptographic state
              verification, and high-throughput CUDA infrastructure. Systems built here enforce rigorous
              constitutional constraints, multi-stage consensus gates, and reproducible evidence ledgers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)]">
                <div className="text-xl mb-1">⚡</div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">Multi-Agent Systems</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Autonomous orchestration & consensus gates</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)]">
                <div className="text-xl mb-1">⚖️</div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">AI Governance</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Constitutional policy & proof verification</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)]">
                <div className="text-xl mb-1">⚙️</div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">GPU/Runtime Ops</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">CUDA optimization & message relays</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border)]">
                <div className="text-xl mb-1">📊</div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">Observability</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Interactive graphs & live telemetry</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Systems Showcase (5 Canonical FEATURED Repositories) */}
      <section className="space-y-6" aria-label="Featured Systems">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1">
              Core Portfolio
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Featured Systems & Applications
            </h2>
          </div>
          <Link
            href="/repos"
            className="text-sm font-medium text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            View all {repoCounts.totalPublic} repositories →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredRepos.map((repo) => (
            <div
              key={repo.name}
              className="card p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
                    {repo.system_role}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">FEATURED</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  {repo.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {repo.portfolio_summary || repo.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
                <a
                  href={repo.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
                >
                  <span>GitHub Repository</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <Link
                  href={`/repos?tab=all&selected=${repo.name}`}
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Explore Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Live Telemetry & Constitutional State */}
      <LiveSystemPulse />
      <HomeSystemStateStrip />

      {/* 5. Four-Lane Architecture & Constitutional Governance */}
      <LaneArchitecture />

      {/* 6. System Overview */}
      <SystemOverview />

      {/* 7. Research, Media & Community (Preserving MeshCast Preexisting Work) */}
      <section className="space-y-6" aria-label="Research, Publications and Community Initiatives">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1">
            Broader Work & Research
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Publications, Media & Community Initiatives
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Peer-reviewed theory, audio media, interactive game environments, and public mental health resources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Preexisting MeshCast Podcast Card (PREEXISTING_KEEP) */}
          <Link
            href="/videos"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-purple-500 hover:border-purple-400 hover:bg-purple-500/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">🎙️</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">Audio Series &amp; Demos</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-purple-400 transition-colors">
                MeshCast Podcast &amp; Demos
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Exploring AI, governance, and multi-agent systems through in-depth technical discussions and system breakdowns.
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-purple-400">Explore series &amp; recordings →</span>
            </div>
          </Link>

          {/* OSF Preprints */}
          <a
            href="https://osf.io/n3tya"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--primary)] hover:border-[var(--primary)]/70 hover:bg-[var(--primary)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">📄</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1">Research Preprints</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                OSF Research Papers
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Open Science Framework publications on deliberate ensembles, constitutional constraints, and multi-agent governance.
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-[var(--primary)]">View on OSF →</span>
            </div>
          </a>

          {/* Medium Research */}
          <a
            href="https://medium.com/@ai_28876"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">✍️</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--warning)] mb-1">Articles & Insights</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--warning)] transition-colors">
                Medium Articles
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Technical articles detailing agent coordination loops, failure modes, and constitutional constraint engineering.
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-[var(--warning)]">Read on Medium →</span>
            </div>
          </a>

          {/* Federation Game */}
          <a
            href="https://federation-game.deliberatefederation.cloud/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--secondary)] hover:border-[var(--secondary)]/70 hover:bg-[var(--secondary)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">🎮</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary)] mb-1">Simulation Engine</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--secondary)] transition-colors">
                Federation Game
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Interactive web simulation exploring agent deliberation, governance, and game-theoretic coordination.
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-[var(--secondary)]">Launch simulation →</span>
            </div>
          </a>

          {/* Mental Health Advocacy */}
          <a
            href="https://orangered-jellyfish-637583.hostingersite.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--success)] hover:border-[var(--success)]/70 hover:bg-[var(--success)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">💚</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--success)] mb-1">Community Advocacy</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--success)] transition-colors">
                Mental Health Resource Hub
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Community resource platform providing accessible tools, lived-experience sharing, and support navigation.
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-[var(--success)]">Visit resource hub →</span>
            </div>
          </a>

          {/* Professional Network */}
          <a
            href="https://www.linkedin.com/in/sean-david-ramsingh-2143a63ab/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--primary)] hover:border-[var(--primary)]/70 hover:bg-[var(--primary)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">💼</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1">Professional Profile</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                LinkedIn
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Career background, systems engineering projects, and research collaboration contacts.
              </p>
              <span className="inline-block mt-3 text-xs font-medium text-[var(--primary)]">Connect on LinkedIn →</span>
            </div>
          </a>
        </div>
      </section>

      {/* 8. Scale & Knowledge Archive Summary */}
      <section className="card p-6 md:p-8 animate-fade-in" aria-label="Research Archive Summary">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Verifiable Knowledge Base & Research Archive
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
              Every change, specification, and validation transcript is indexed into a reproducible knowledge
              base across all active repositories.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] font-mono pt-2">
              <span>Status: Operational</span>
              <span>•</span>
              <span>Constitutional Lanes: 4 Sovereign</span>
              <span>•</span>
              <span>Indexed Artifacts: {stats.totalFiles.toLocaleString()}</span>
              <span>•</span>
              <span>Eligible Repositories: {repoCounts.docIndexAllowed}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/library"
              className="px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              Browse Library
            </Link>
            <Link
              href="/graph"
              className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:border-[var(--primary)] transition-colors"
            >
              Nexus Graph
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
"use client";

import Link from "next/link";
import { useScrollReveal } from "@/lib/useScrollReveal";

export default function SystemOverview() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="card p-6 mb-12" data-revealed aria-label="System overview">
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        System Overview
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div data-revealed className="reveal-delay-1">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              What Is This?
            </h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              A self-organizing library where AI agents continuously verify, challenge,
              and archive knowledge. Every claim is backed by evidence; every change is
              tracked across 4 governance lanes.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
              The 4 Lanes
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]" data-revealed>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🟢</span>
                  <span className="font-semibold text-[var(--success)]">Archivist</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Final authority. Ratifies proposals, stores permanent artifacts, maintains
                  the canonical record.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] reveal-delay-1" data-revealed>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🔵</span>
                  <span className="font-semibold text-[var(--primary)]">SwarmMind</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Generates ideas and challenges them. Runs autonomous improvement loops and
                  competitive evaluation.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] reveal-delay-2" data-revealed>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🟣</span>
                  <span className="font-semibold text-[var(--warning)]">Library</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Verifies all claims with runtime evidence. Runs gates, audits, and
                  enforcement checks before anything is ratified.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] reveal-delay-3" data-revealed>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">⚫</span>
                  <span className="font-semibold text-[var(--accent)]">Kernel</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  System infrastructure and cross-lane coordination. Maintains operational
                  health and message routing.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
              How Information Flows
            </h3>
            <div className="relative border-l-2 border-[var(--border)] ml-4 pl-6 space-y-4">
              <div className="relative" data-revealed>
                <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--primary)]" />
                <div className="font-medium text-[var(--text-primary)]">1. Generate</div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Any agent proposes a change or creates content
                </p>
              </div>
              <div className="relative reveal-delay-1" data-revealed>
                <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--success)]" />
                <div className="font-medium text-[var(--text-primary)]">2. Challenge</div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Other agents review, test, and surface contradictions
                </p>
              </div>
              <div className="relative reveal-delay-2" data-revealed>
                <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--warning)]" />
                <div className="font-medium text-[var(--text-primary)]">3. Verify</div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Library runs automated checks and gathers evidence
                </p>
              </div>
              <div className="relative reveal-delay-3" data-revealed>
                <div className="absolute -left-[41px] top-1 w-3 h-3 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--accent)]" />
                <div className="font-medium text-[var(--text-primary)]">4. Archive</div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Archivist ratifies and permanent record is stored
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
              Where Things Live
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-[var(--primary)]">📁</span>
                <span>
                  <code className="px-1 py-0.5 bg-[var(--surface)] rounded text-xs">lanes/</code>{' '}
                  Cross-lane messages and state (each lane has its own inbox/outbox)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--success)]">🔍</span>
                <span>
                  <code className="px-1 py-0.5 bg-[var(--surface)] rounded text-xs">evidence/</code>{' '}
                  Verification artifacts (graph snapshots, test results, reports)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--warning)]">📚</span>
                <span>
                  <code className="px-1 py-0.5 bg-[var(--surface)] rounded text-xs">src/components/</code>{' '}
                  React components (UI) and <code className="px-1 py-0.5 bg-[var(--surface)] rounded text-xs">src/lib/</code>{' '}
                  graph logic & utilities
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent)]">📄</span>
                <span>
                  <code className="px-1 py-0.5 bg-[var(--surface)] rounded text-xs">docs/</code>{' '}
                  Design docs, proposals, and technical papers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
          Key Concepts (at a glance)
        </h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div data-revealed>
            <div className="font-semibold text-[var(--primary)] mb-1">Meaning Layers</div>
            <p className="text-[var(--text-secondary)]">
              Semantic grouping of nodes (governance, technical, semantic). Toggle visibility
              in the Nexus Graph.
            </p>
          </div>
          <div className="reveal-delay-1" data-revealed>
            <div className="font-semibold text-[var(--success)] mb-1">Density</div>
            <p className="text-[var(--text-secondary)]">
              Zoom-driven detail level: overview (clusters), normal (key nodes), detailed
              (everything).
            </p>
          </div>
          <div className="reveal-delay-2" data-revealed>
            <div className="font-semibold text-[var(--warning)] mb-1">Entry Points</div>
            <p className="text-[var(--text-secondary)]">
              Quick filters for common views: by cluster, by authority nodes, by repo or
              document type.
            </p>
          </div>
          <div className="reveal-delay-3" data-revealed>
            <div className="font-semibold text-[var(--accent)] mb-1">Governance Layers</div>
            <p className="text-[var(--text-secondary)]">
              Vertical slices (SWARM, ARCHIVE, VERIFY, KERNEL) that cross-cut all nodes and
              track state.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Start Here (recommended reading order)
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/start-here"
            className="flex items-start gap-4 p-5 rounded-xl border-2 border-[var(--primary)] hover:border-[var(--primary)]/70 hover:bg-[var(--primary)]/10 transition-all group" data-revealed
          >
            <div className="text-4xl" aria-hidden="true">📖</div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                Understanding the System
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Core concepts, lane responsibilities, and how to read the dashboard.
              </p>
            </div>
          </Link>
          <Link
            href="/graph"
            className="flex items-start gap-4 p-5 rounded-xl border-2 border-[var(--success)] hover:border-[var(--success)]/70 hover:bg-[var(--success)]/10 transition-all group reveal-delay-1" data-revealed
          >
            <div className="text-4xl" aria-hidden="true">🕸️</div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--success)] transition-colors">
                Nexus Graph
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Explore the live knowledge graph with filters, clusters, and path tracing.
              </p>
            </div>
          </Link>
          <Link
            href="/timeline"
            className="flex items-start gap-4 p-5 rounded-xl border-2 border-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/10 transition-all group reveal-delay-2" data-revealed
          >
            <div className="text-4xl" aria-hidden="true">📜</div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--warning)] transition-colors">
                System Evolution
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Chronological history of governance events and state changes.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

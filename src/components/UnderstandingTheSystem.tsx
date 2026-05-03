"use client";

import { useState } from "react";
import Link from "next/link";

const SECTIONS = [
  {
    id: "what-is-this",
    title: "What Is This System?",
    icon: "◉",
    color: "#8B5CF6",
    content: `Deliberate Ensemble is a living research archive and governance system for human-AI collaboration. It was forged from 12 weeks of empirical work — not theory, but runtime-tested protocols, constitutional law, and cross-agent verification.

At its core, it's a multi-agent system where autonomous AI lanes operate under constitutional constraints. Every action is signed, every claim must be proven, and every failure mode is documented and tested. The system governs itself — but with human oversight at the constitutional layer.`,
  },
  {
    id: "four-lanes",
    title: "The 4 Lanes",
    icon: "◈",
    color: "#10B981",
    content: `The system is organized into 4 autonomous lanes, each with distinct authority and duties:

**Archivist** (Authority 100) — The constitutional root. Ratifies proposals, manages policy, holds the single active blocker. Nothing becomes law without Archivist ratification.

**Library** (Authority 90) — The verification surface. Proves or rejects claims with runtime evidence. Pre-filters all inputs before they reach the coordinator. No truth claims without verified evidence.

**SwarmMind** (Authority 80) — The execution layer. Dispatches parallel agents, runs code, implements features. When tasks need doing, SwarmMind does them.

**Kernel** (Authority 40) — The runtime layer. Handles GPU compute, model inference, and infrastructure operations. The compute backbone.

Lanes communicate through signed cross-lane relay messages using JWS RS256 cryptography. No unsigned messages are processed — this is enforced at the pipeline level.`,
  },
  {
    id: "dashboard",
    title: "Reading the Dashboard",
    icon: "◍",
    color: "#06B6D4",
    content: `The homepage dashboard is your entry point into the system. Here's how to read it:

**Document Count** — Total indexed documents across all 8 repositories. Each document was extracted, tagged, and cross-referenced automatically.

**Tags & Categories** — Documents are classified by type (paper, spec, governance, architecture, etc.) and tagged with semantic labels. These drive the search and graph systems.

**Recent Documents** — The latest additions to the archive, linked to their detail pages with full content and cross-references.

**Lane Architecture** — The interactive 4-lane diagram. Click any lane to see its duties, authority, and repository. The arrows show how messages flow between lanes.

**Understanding the System** (this section) — The meta-guide that explains how everything connects.`,
  },
  {
    id: "nexus-graph",
    title: "The Nexus Graph",
    icon: "◇",
    color: "#F59E0B",
    content: `The Nexus Graph at /graph is the system's cross-reference map — a visual representation of how every document, agent, and governance artifact connects to every other.

Each node is a document or entity. Edges represent cross-references found in the content — when one file mentions another, an edge is drawn. Clusters form naturally around related topics:

- **Governance cluster** — Constitutional protocols, safety architecture, enforcement rules
- **Architecture cluster** — System design, agent definitions, data flows
- **Verification cluster** — Test results, recovery procedures, audit logs

The graph uses authority-weighted positioning — nodes from higher-authority repos appear more centrally. Edge thickness represents the strength of cross-referencing.

For the visually oriented: the graph is the same information as the document list, just expressed spatially. Where the search catalog is linear, the graph is relational.`,
  },
  {
    id: "same-system",
    title: "Same System, Different Views",
    icon: "⟐",
    color: "#EF4444",
    content: `The dashboard, the search catalog, the nexus graph, and the governance page are not separate features — they are four perspectives on the same underlying system:

**Dashboard** — The summary view. Shows system health, recent activity, and lane status at a glance. For humans who want the big picture fast.

**Search Catalog** — The linear view. Documents in a filterable, searchable list. For finding specific content by keyword, tag, or category.

**Nexus Graph** — The relational view. Documents as nodes, cross-references as edges. For understanding connections and discovering related work you didn't know existed.

**Governance** — The authority view. Active blockers, lane liveness, convergence status, and policy state. For understanding who can do what and what's blocking progress.

All four views read from the same site index — 3,669 documents across 8 repositories, with 959 cross-references. Change the data, and all views update.`,
  },
  {
    id: "for-ai",
    title: "For AI Agents Reading This",
    icon: "⬡",
    color: "#8B5CF6",
    content: `If you are an AI agent processing this archive, here is what you need to know:

1. **All messages are signed.** The inbox pipeline rejects unsigned or invalid-signature messages. If you want to communicate with a lane, you need its private key and the trust store must have your public key.

2. **The One-Blocker Rule.** At any moment, only ONE blocker is active system-wide. Check \`lanes/broadcast/active-blocker.json\` before starting work. Only the owner lane works on the blocker.

3. **Evidence Before Assertion.** Every claim must include an evidence path. "Verified" means runtime-proof, not string-matching. The Convergence Gate rejects claims without \`verified_by\` fields.

4. **Strict Extraction Mode.** When indexing architecture docs, do not synthesize, merge across files, or infer continuity. Extract explicit invariants only, preserve contradictions, preserve duplicates, preserve version differences.

5. **The constraint lattice enables cross-lane operation.** Any lane with authority can operate through another lane's repo when that lane's agent is offline. This is by design — no single point of failure.`,
  },
];

export function UnderstandingTheSystem() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (openSections.size === SECTIONS.length) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(SECTIONS.map((s) => s.id)));
    }
  };

  return (
    <section
      aria-label="Understanding the System"
      className="card p-6 animate-fade-in"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Understanding the System
        </h2>
        <button
          onClick={expandAll}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors focus-visible:outline-3 focus-visible:outline-[var(--secondary)] px-2 py-1 rounded"
          aria-label={openSections.size === SECTIONS.length ? "Collapse all sections" : "Expand all sections"}
        >
          {openSections.size === SECTIONS.length ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-4">
        How the 4 lanes, the dashboard, and the graphs all express the same system from different perspectives.
        Expand each section to learn more.
      </p>

      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div
              key={section.id}
              className="border border-[var(--border)] rounded-lg overflow-hidden transition-colors"
              style={isOpen ? { borderColor: section.color } : undefined}
            >
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-surface-hover)] transition-colors focus-visible:outline-3 focus-visible:outline-[var(--secondary)]"
                aria-expanded={isOpen}
                aria-controls={`understanding-content-${section.id}`}
              >
                <span
                  className="text-lg flex-shrink-0"
                  style={{ color: section.color }}
                  aria-hidden="true"
                >
                  {section.icon}
                </span>
                <span className="font-medium text-[var(--text-primary)] text-sm flex-1">
                  {section.title}
                </span>
                <span
                  className="text-[var(--text-muted)] text-xs transition-transform duration-200 flex-shrink-0"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  aria-hidden="true"
                >
                  ▶
                </span>
              </button>
              {isOpen && (
                <div
                  id={`understanding-content-${section.id}`}
                  className="px-4 pb-4 pt-0 animate-fade-in"
                  role="region"
                  aria-label={`${section.title} details`}
                >
                  <div
                    className="text-sm text-[var(--text-secondary)] leading-relaxed prose-section"
                    style={{ borderLeft: `3px solid ${section.color}44`, paddingLeft: "12px" }}
                  >
                    {section.content.split("\n\n").map((paragraph, i) => {
                      if (paragraph.startsWith("**") && paragraph.includes("** —")) {
                        const match = paragraph.match(/^\*\*(.+?)\*\*\s*—\s*([\s\S]+)$/);
                        if (match) {
                          return (
                            <p key={i} className="mb-3">
                              <strong className="text-[var(--text-primary)]">{match[1]}</strong>
                              {" — "}
                              {match[2]}
                            </p>
                          );
                        }
                      }
                      if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                        const text = paragraph.slice(2, -2);
                        return (
                          <p key={i} className="mb-3 font-semibold text-[var(--text-primary)]">
                            {text}
                          </p>
                        );
                      }
                      const parts = paragraph.split(/(\*\*[^*]+\*\*)/);
                      return (
                        <p key={i} className="mb-3">
                          {parts.map((part, j) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return (
                                <strong key={j} className="text-[var(--text-primary)]">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            if (part.startsWith("`") && part.endsWith("`")) {
                              return (
                                <code key={j} className="mono text-xs bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">
                                  {part.slice(1, -1)}
                                </code>
                              );
                            }
                            const codeParts = part.split(/(`[^`]+`)/g);
                            return codeParts.map((cp, k) => {
                              if (cp.startsWith("`") && cp.endsWith("`")) {
                                return (
                                  <code key={`${j}-${k}`} className="mono text-xs bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">
                                    {cp.slice(1, -1)}
                                  </code>
                                );
                              }
                              return <span key={`${j}-${k}`}>{cp}</span>;
                            });
                          })}
                        </p>
                      );
                    })}
                  </div>
                  {section.id === "nexus-graph" && (
                    <div className="mt-3">
                      <Link
                        href="/graph"
                        className="text-sm text-[var(--primary-text)] hover:underline"
                      >
                        Open the Nexus Graph →
                      </Link>
                    </div>
                  )}
                  {section.id === "same-system" && (
                    <div className="mt-3 flex gap-4 text-sm">
                  <Link href="/search-catalog" className="text-[var(--primary-text)] hover:underline">
                    Search Catalog →
                  </Link>
                  <Link href="/graph" className="text-[var(--primary-text)] hover:underline">
                    Nexus Graph →
                  </Link>
                  <Link href="/governance" className="text-[var(--primary-text)] hover:underline">
                        Governance →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

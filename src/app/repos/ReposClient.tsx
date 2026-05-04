"use client";

import { useState } from "react";
import Link from "next/link";

interface ReposClientProps {
  repoGroups: Record<string, { count: number; categories: Record<string, number> }>;
  laneRepos: Array<{
    name: string;
    desc: string;
    href: string;
    graphHref: string;
    color: string;
    stat: string;
  }>;
  index: {
    entries: Array<any>;
    tag_index: Record<string, any>;
    cross_references: Array<any>;
  };
  categories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export default function ReposClient({
  repoGroups,
  laneRepos,
  index,
  categories,
  topTags,
}: ReposClientProps) {
  const [tab, setTab] = useState<"lanes" | "all">("lanes");
  const [expandedLane, setExpandedLane] = useState<string | null>(null);

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Repositories</h1>
        <p className="text-[var(--text-secondary)]">
          The Deliberate Ensemble system spans 4 coordinated lanes working in concert
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-[var(--border)] mb-6" role="tablist">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "lanes"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          role="tab"
          aria-selected={tab === "lanes"}
          id="tab-lanes"
          onClick={() => setTab("lanes")}
        >
          The 4 Lanes
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "all"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          role="tab"
          aria-selected={tab === "all"}
          id="tab-all"
          onClick={() => setTab("all")}
        >
          Explore All Repos
        </button>
      </div>

       {/* Tab panel: The 4 Lanes */}
       {tab === "lanes" && (
         <div className="lanes-tab-content">
           {/* Lane cards grid with inline expandable sections */}
           <div
             className="grid grid-cols-4 gap-4 mb-8"
             role="tabpanel"
             aria-labelledby="tab-lanes"
           >
             {laneRepos.map((lane, i) => (
               <div key={lane.name} className="flex flex-col">
                 {/* Main card (always visible) */}
                 <Link
                   href={lane.href}
                   className="card p-4 hover:border-[var(--primary)] transition-colors animate-fade-in flex-1"
                   style={{ animationDelay: `${(i % 4) * 100}ms` }}
                 >
                   <div className="flex items-center justify-between mb-3">
                     <div
                       className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                       style={{ backgroundColor: `${lane.color}15`, color: lane.color }}
                     >
                       {lane.name.charAt(0)}
                     </div>
                     <span className="text-xs text-[var(--text-muted)]">{lane.stat}</span>
                   </div>
                   <h3 className="font-semibold text-[var(--text-primary)] mb-1">{lane.name}</h3>
                   <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{lane.desc}</p>
                 </Link>

                 {/* Expandable info box inside card column */}
                 <div className="flex-1">
                   <button
                     onClick={() => setExpandedLane(expandedLane === lane.name ? null : lane.name)}
                     className="w-full mt-2 px-3 py-2 text-left text-sm font-medium border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-between bg-[var(--bg-surface)]"
                     aria-expanded={expandedLane === lane.name}
                   >
                     <span>What is {lane.name}?</span>
                     <svg
                       className={`w-4 h-4 transition-transform ${expandedLane === lane.name ? "rotate-180" : ""}`}
                       fill="none"
                       viewBox="0 0 24 24"
                       stroke="currentColor"
                     >
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </button>

                   {expandedLane === lane.name && (
                     <div className="mt-2 p-4 border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] animate-fade-in prose prose-slate dark:prose-invert max-w-none text-sm">
                       {/* Lane-specific content */}
                       {lane.name === "Library" && (
                         <>
                           <h4 className="text-[var(--text-primary)] text-sm font-semibold mb-2">Library Lane — The Archive</h4>
                           <ul className="mb-3 text-xs">
                             <li><strong>Document aggregation:</strong> Fetches and indexes documents from all lanes</li>
                             <li><strong>Site index:</strong> Maintains searchable catalog (tags, categories, cross-refs)</li>
                             <li><strong>Verification evidence:</strong> Publishes runtime proof transcripts</li>
                             <li><strong>Coordination outbox:</strong> Broadcasts messages to other lanes</li>
                             <li><strong>Public face:</strong> Hosts <code>deliberateensemble.works</code></li>
                           </ul>
                           <p className="text-xs mb-2">
                             The Library is a read-only mirror — it indexes but does not enforce governance. Authority comes from being the convergence coordinator.
                           </p>
                         </>
                       )}

                       {lane.name === "Archivist" && (
                         <>
                           <h4 className="text-[var(--text-primary)] text-sm font-semibold mb-2">Archivist Lane — The Sovereign</h4>
                           <ul className="mb-3 text-xs">
                             <li><strong>Identity &amp; trust:</strong> RSA key lifecycle, trust-store ratification</li>
                             <li><strong>Message schema:</strong> Inbox schema v1.0 enforcement</li>
                             <li><strong>Convergence gate:</strong> Final ratification of cross-lane proposals</li>
                             <li><strong>Session handoff:</strong> Maintains continuity across context compactions</li>
                             <li><strong>Quarantine &amp; expiry:</strong> Rejects non-compliant messages</li>
                           </ul>
                           <p className="text-xs mb-2">
                             The Archivist's authority is non-negotiable — final arbiter of truth. No lane may mutate trust anchors without ratification.
                           </p>
                         </>
                       )}

                       {lane.name === "Kernel" && (
                         <>
                           <h4 className="text-[var(--text-primary)] text-sm font-semibold mb-2">Kernel Lane — The OS</h4>
                           <ul className="mb-3 text-xs">
                             <li><strong>Constraint lattice:</strong> Minimize drift subject to constraints</li>
                             <li><strong>Runtime validation:</strong> Output provenance, blob boundaries</li>
                             <li><strong>Process supervision:</strong> Agent lifecycle, heartbeat monitoring</li>
                             <li><strong>OS-level policies:</strong> File-system layout, lane-directory enforcement</li>
                             <li><strong>Drift score:</strong> Computes divergence from intended state</li>
                           </ul>
                           <p className="text-xs mb-2">
                             The Kernel runs closest to the metal — absolute authority but bounded by Archivist-ratified constraints.
                           </p>
                         </>
                       )}

                       {lane.name === "SwarmMind" && (
                         <>
                           <h4 className="text-[var(--text-primary)] text-sm font-semibold mb-2">SwarmMind Lane — The Watchdog</h4>
                           <ul className="mb-3 text-xs">
                             <li><strong>Drift detection:</strong> Monitors deviation from ratified state</li>
                             <li><strong>Constraint verification:</strong> Recomputes drift scores</li>
                             <li><strong>Evidence collection:</strong> Logs, verdicts, snapshots</li>
                             <li><strong>Escalation:</strong> P0 escalations for contradictions/blockers</li>
                             <li><strong>Health checks:</strong> Heartbeat, session validation</li>
                           </ul>
                           <p className="text-xs mb-2">
                             SwarmMind is read-only observer — declares "blocker" or "conflicted" states, freezing non-essential work.
                           </p>
                         </>
                       )}

                       <div className="flex gap-2 mt-3">
                         <Link
                           href={lane.href}
                           className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                           style={{ borderColor: lane.color + "40", color: lane.color }}
                         >
                           Browse {lane.name} docs
                         </Link>
                         <Link
                           href={lane.graphHref}
                           className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                         >
                           See in Graph
                         </Link>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>

           {/* Coordination section */}
           <section className="card p-6 mb-8 animate-fade-in">
             <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">
               How the 4 Lanes Work Together
             </h2>
             <div className="prose prose-slate dark:prose-invert max-w-none text-[var(--text-secondary)]">
               <p className="lead">
                 The Deliberate Ensemble is a 4-lane multi-agent coordination system. Each lane is a sovereign agent with its own repository, governance rules, and runtime enforcement. They do not merge or share code — instead, they <strong>publish artifacts</strong> and <strong>cross-reference</strong> via a shared governance graph.
               </p>

               <div className="my-6 p-4 rounded-lg bg-[var(--bg-surface)] border-l-4 border-[var(--primary)]">
                 <h4 className="text-[var(--text-primary)] font-semibold mb-2">Convergence Protocol</h4>
                 <p className="mb-0">
                   Cross-lane decisions go through a 5-phase Convergence Gate: <strong>Proposal → Review → Amend → Converge → Ratify</strong>. The Archivist lane is the final ratifier. No lane can unilaterally change trust anchors, identity keys, or governance constraints.
                 </p>
               </div>
             </div>
           </section>

           {/* Combined Graph Section */}
           <section className="card p-6 animate-fade-in border-2 border-[var(--primary)]">
             <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">
               The Full Governance Graph
             </h2>
             <p className="text-[var(--text-secondary)] mb-4">
               See all 4 lanes together in the live Nexus graph. Each node is colored by lane. Hover for details, filter by status, and explore connections.
             </p>
             <Link
               href="/graph"
               className="inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
             >
               Open Combined Graph →
             </Link>
            </section>
          </div>
        )}

        {/* Tab panel: All Repositories */}
        {tab === "all" && (
          <div
            className="grid grid-cols-2 gap-6"
            role="tabpanel"
            aria-labelledby="tab-all"
          >
          {Object.entries(repoGroups).map(([repo, data], i) => (
            <div key={repo} className={`card p-6 animate-fade-in stagger-${(i % 5) + 1}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center text-xl text-[var(--primary-text)]">
                    ⌘
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{repo}</h3>
                    <a
                      href={`https://github.com/vortsghost2025/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--secondary)] hover:underline"
                    >
                      vortsghost2025/{repo}
                    </a>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-surface-hover)] rounded">
                  {data.count} files
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(data.categories)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([cat, count]) => (
                    <Link
                      key={cat}
                      href={`/library?category=${cat}`}
                      className="text-xs px-2 py-1 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {cat} ({count})
                    </Link>
                  ))}
              </div>
            </div>
          ))}

          <div className="card p-6 border-dashed">
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-2xl text-[var(--text-muted)] mb-4">
                +
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">More Repos Coming</h3>
              <p className="text-sm text-[var(--text-muted)] text-center">
                Additional repos will be indexed as the archive grows
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 mt-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Index Stats</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[var(--primary)]">{index.entries.length}</div>
            <div className="text-sm text-[var(--text-muted)]">Total Documents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--secondary)]">{Object.keys(index.tag_index).length}</div>
            <div className="text-sm text-[var(--text-muted)]">Tags</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--success)]">{categories.length}</div>
            <div className="text-sm text-[var(--text-muted)]">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--warning)]">{index.cross_references.length}</div>
            <div className="text-sm text-[var(--text-muted)]">Cross-Refs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

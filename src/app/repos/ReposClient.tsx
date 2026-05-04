"use client";

import { useState } from "react";
import Link from "next/link";

interface ReposClientProps {
  repoGroups: Record<string, { count: number; categories: Record<string, number> }>;
  laneRepos: Array<{
    name: string;
    desc: string;
    href: string;
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
        <div
          className="grid grid-cols-4 gap-4 mb-8"
          role="tabpanel"
          aria-labelledby="tab-lanes"
        >
          {laneRepos.map((lane, i) => (
            <Link
              key={lane.name}
              href={lane.href}
              className="card p-4 hover:border-[var(--primary)] transition-colors animate-fade-in stagger-${(i % 4) + 1}"
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
              <p className="text-sm text-[var(--text-secondary)]">{lane.desc}</p>
            </Link>
          ))}
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

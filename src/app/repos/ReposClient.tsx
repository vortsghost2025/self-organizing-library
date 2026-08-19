"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { RepositoryRecord } from "@/lib/repo-registry";

interface LaneRepoInfo {
  id: string;
  name: string;
  repo: string;
  authority: number;
  desc: string;
  href: string;
  graphHref: string;
  color: string;
  stat: string;
}

interface ReposClientProps {
  featured: RepositoryRecord[];
  listed: RepositoryRecord[];
  archive: RepositoryRecord[];
  allPublic: RepositoryRecord[];
  repoCounts: {
    totalPublic: number;
    featured: number;
    listed: number;
    archive: number;
    docIndexAllowed: number;
  };
  repoFileCounts: Record<string, number>;
  laneRepos: LaneRepoInfo[];
  totalIndexCount: number;
  categories: Array<{ category: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

export default function ReposClient({
  featured,
  listed,
  archive,
  allPublic,
  repoCounts,
  repoFileCounts,
  laneRepos,
  totalIndexCount,
}: ReposClientProps) {
  const [activeTab, setActiveTab] = useState<"featured" | "listed" | "archive" | "all">("featured");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRepos = useMemo(() => {
    let list: RepositoryRecord[] = [];
    if (activeTab === "featured") list = featured;
    else if (activeTab === "listed") list = listed;
    else if (activeTab === "archive") list = archive;
    else list = allPublic;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.system_role.toLowerCase().includes(q) ||
        r.portfolio_summary.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [activeTab, searchQuery, featured, listed, archive, allPublic]);

  return (
    <div className="p-4 md:p-8 space-y-8" data-pagefind-body>
      {/* Header */}
      <div className="animate-fade-in space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider">
          Systems &amp; Codebase Portfolio
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
          Repositories &amp; Technical Projects
        </h1>
        <p className="text-[var(--text-secondary)] max-w-3xl text-base">
          Engineering portfolio covering constitutional multi-agent systems, CUDA runtime infrastructure,
          financial simulation engines, and reproducible research archives.
        </p>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--primary)]">{repoCounts.featured}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">Featured Systems</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--success)]">{repoCounts.listed}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">More Original Work</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--secondary)]">{repoCounts.archive}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">Research Archive</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--warning)]">{totalIndexCount.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">Indexed Artifacts</div>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Repository Tiers">
          <button
            role="tab"
            aria-selected={activeTab === "featured"}
            onClick={() => setActiveTab("featured")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "featured"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Featured Systems ({repoCounts.featured})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "listed"}
            onClick={() => setActiveTab("listed")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "listed"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Additional Systems ({repoCounts.listed})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "archive"}
            onClick={() => setActiveTab("archive")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "archive"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Research Archive ({repoCounts.archive})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            All Public ({allPublic.length})
          </button>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search systems by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            aria-label="Search repositories"
          />
        </div>
      </div>

      {/* Featured Lanes Deep-Dive (When Featured tab is selected) */}
      {activeTab === "featured" && !searchQuery && (
        <section className="space-y-4" aria-label="Constitutional Lanes">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Four Constitutional Governance Lanes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {laneRepos.map((lane) => (
              <div key={lane.id} className="card p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: lane.color }}>
                      {lane.name} Lane
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                      Auth {lane.authority}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">{lane.repo}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{lane.desc}</p>
                </div>
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">{lane.stat}</span>
                  <Link href={lane.href} className="font-medium text-[var(--primary)] hover:underline">
                    View Lane →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Repository Cards Grid */}
      <section className="space-y-4" aria-label="Repository Catalog">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {activeTab === "featured"
            ? "Featured Repositories"
            : activeTab === "listed"
            ? "Additional Original Systems"
            : activeTab === "archive"
            ? "Research & Historical Tools Archive"
            : "All Public Repositories"}
        </h2>

        {filteredRepos.length === 0 ? (
          <div className="card p-12 text-center text-[var(--text-muted)]">
            No repositories found matching &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => {
              const fileCount = repoFileCounts[repo.name];
              return (
                <div
                  key={repo.name}
                  className="card p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          repo.public_site_class === "FEATURED"
                            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                            : repo.public_site_class === "LISTED"
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-[var(--secondary)]/10 text-[var(--secondary)]"
                        }`}
                      >
                        {repo.public_site_class}
                      </span>
                      {fileCount !== undefined && (
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {fileCount.toLocaleString()} files
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                      {repo.name}
                    </h3>

                    {repo.system_role && (
                      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                        {repo.system_role}
                      </div>
                    )}

                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {repo.portfolio_summary || repo.description || "System repository and codebase."}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <a
                      href={repo.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                    >
                      <span>GitHub</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                    {repo.doc_index_allowed && (
                      <Link
                        href={`/library?repo=${encodeURIComponent(repo.name)}`}
                        className="text-xs font-medium text-[var(--primary)] hover:underline"
                      >
                        Browse Docs →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

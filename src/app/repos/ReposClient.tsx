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
  const [activeTab, setActiveTab] = useState<"featured" | "listed" | "archive" | "all">("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRepos = useMemo(() => {
    let list: RepositoryRecord[] = [];
    if (activeTab === "featured") list = featured;
    else if (activeTab === "listed") list = listed;
    else if (activeTab === "archive") list = archive;
    else list = allPublic;

    if (selectedDomain !== "all") {
      list = list.filter((r) => r.domain_category === selectedDomain);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.system_role.toLowerCase().includes(q) ||
        r.portfolio_summary.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.tech_tags && r.tech_tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [activeTab, selectedDomain, searchQuery, featured, listed, archive, allPublic]);

  return (
    <div className="p-4 md:p-8 space-y-8" data-pagefind-body>
      {/* Header */}
      <div className="animate-fade-in space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary-text)] text-xs font-bold uppercase tracking-wider">
          Systems &amp; Codebase Portfolio
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Repositories &amp; Technical Projects
        </h1>
        <p className="text-[var(--text-secondary)] max-w-3xl text-base md:text-lg leading-relaxed">
          Comprehensive portfolio of 52 public repositories covering constitutional multi-agent systems,
          runtime safety guardrails, terminal multiplexers, CUDA GPU infrastructure, simulation engines, and public health resources.
        </p>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl font-extrabold text-[var(--primary)]">{repoCounts.featured}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Featured Core Systems</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-extrabold text-[var(--success)]">{repoCounts.listed}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Active Projects &amp; Tools</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-extrabold text-[var(--secondary)]">{allPublic.length}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Total Public Repos</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-extrabold text-[var(--warning)]">{totalIndexCount.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">Indexed Artifacts</div>
        </div>
      </div>

      {/* Domain Category Filter Pills */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Filter by Domain:
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Domains", icon: "✨" },
            { id: "safety_governance", label: "AI Safety & Guardrails", icon: "🛡️" },
            { id: "terminals_workspace", label: "Terminals & Workspaces", icon: "⚡" },
            { id: "swarm_consensus", label: "Swarm Orchestration", icon: "🌐" },
            { id: "simulation_research", label: "Simulation & Theory", icon: "🧬" },
            { id: "public_health", label: "Public Health Good", icon: "💚" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDomain(d.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                selectedDomain === d.id
                  ? "bg-[var(--primary)] text-white shadow"
                  : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{d.icon}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tiers & Search Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Repository Tiers">
          <button
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            All Repositories ({allPublic.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "featured"}
            onClick={() => setActiveTab("featured")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === "featured"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Featured ({repoCounts.featured})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "listed"}
            onClick={() => setActiveTab("listed")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === "listed"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Active Extensions ({repoCounts.listed})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "archive"}
            onClick={() => setActiveTab("archive")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === "archive"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            Historical Archive ({repoCounts.archive})
          </button>
        </div>

        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search systems by keyword, role, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            aria-label="Search repositories"
          />
        </div>
      </div>

      {/* Featured Lanes Deep-Dive (When Featured tab is selected) */}
      {activeTab === "featured" && !searchQuery && selectedDomain === "all" && (
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Showing {filteredRepos.length} {filteredRepos.length === 1 ? "Repository" : "Repositories"}
          </h2>
          {(selectedDomain !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDomain("all");
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {filteredRepos.length === 0 ? (
          <div className="card p-12 text-center text-[var(--text-muted)] space-y-2">
            <div className="text-3xl">🔍</div>
            <div className="font-semibold text-[var(--text-primary)]">No repositories found</div>
            <p className="text-sm">Try relaxing your search query or switching domain categories.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => {
              const fileCount = repoFileCounts[repo.name];
              const isFeatured = repo.public_site_class === "FEATURED";
              return (
                <div
                  key={repo.name}
                  className={`card p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group relative ${
                    isFeatured ? "border-l-4 border-l-[var(--primary)]" : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          repo.public_site_class === "FEATURED"
                            ? "bg-[var(--primary)]/20 text-[var(--primary-text)] border border-[var(--primary)]/30"
                            : repo.public_site_class === "LISTED"
                            ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30"
                            : "bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30"
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

                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {repo.name}
                      </h3>
                      {repo.system_role && (
                        <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mt-0.5">
                          {repo.system_role}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {repo.portfolio_summary || repo.description || "System repository and codebase."}
                    </p>

                    {repo.tech_tags && repo.tech_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {repo.tech_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border border-[var(--border)] font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <a
                      href={repo.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                    >
                      <span>GitHub</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                    {repo.doc_index_allowed && (
                      <Link
                        href={`/library?repo=${encodeURIComponent(repo.name)}`}
                        className="text-xs font-semibold text-[var(--primary)] hover:underline"
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

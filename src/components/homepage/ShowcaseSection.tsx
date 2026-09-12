"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { RepositoryRecord, DomainCategory } from "@/lib/repo-registry";

interface ShowcaseSectionProps {
  featured: RepositoryRecord[];
  listed: RepositoryRecord[];
  totalPublicCount: number;
}

type FilterCategory = "all" | DomainCategory;

interface CategoryTab {
  id: FilterCategory;
  label: string;
  icon: string;
  count: number;
}

const DOMAIN_LABELS: Record<DomainCategory, { label: string; icon: string; color: string; border: string }> = {
  safety_governance: {
    label: "AI Safety & Guardrails",
    icon: "🛡️",
    color: "var(--primary)",
    border: "rgba(139, 92, 246, 0.4)",
  },
  terminals_workspace: {
    label: "Terminals & Workspaces",
    icon: "⚡",
    color: "var(--secondary)",
    border: "rgba(6, 182, 212, 0.4)",
  },
  swarm_consensus: {
    label: "Swarm Orchestration",
    icon: "🌐",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.4)",
  },
  simulation_research: {
    label: "Simulation & Theory",
    icon: "🧬",
    color: "var(--warning)",
    border: "rgba(245, 158, 11, 0.4)",
  },
  public_health: {
    label: "Public Health Good",
    icon: "💚",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.4)",
  },
};

export function ShowcaseSection({ featured, listed, totalPublicCount }: ShowcaseSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allShowcaseRepos = useMemo(() => {
    // Combine featured and listed
    const combined = [...featured, ...listed];
    // Deduplicate by name
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (seen.has(r.name)) return false;
      seen.add(r.name);
      return true;
    });
  }, [featured, listed]);

  const categoryTabs: CategoryTab[] = useMemo(() => {
    const counts: Record<DomainCategory, number> = {
      safety_governance: 0,
      terminals_workspace: 0,
      swarm_consensus: 0,
      simulation_research: 0,
      public_health: 0,
    };

    allShowcaseRepos.forEach((r) => {
      if (r.domain_category && counts[r.domain_category] !== undefined) {
        counts[r.domain_category]++;
      }
    });

    return [
      { id: "all", label: "All Systems", icon: "✨", count: allShowcaseRepos.length },
      { id: "safety_governance", label: "AI Safety & Guardrails", icon: "🛡️", count: counts.safety_governance },
      { id: "terminals_workspace", label: "Terminals & Workspaces", icon: "⚡", count: counts.terminals_workspace },
      { id: "swarm_consensus", label: "Swarm Orchestration", icon: "🌐", count: counts.swarm_consensus },
      { id: "simulation_research", label: "Simulation & Theory", icon: "🧬", count: counts.simulation_research },
      { id: "public_health", label: "Public Health", icon: "💚", count: counts.public_health },
    ];
  }, [allShowcaseRepos]);

  const filteredRepos = useMemo(() => {
    let list = allShowcaseRepos;
    if (selectedCategory !== "all") {
      list = list.filter((r) => r.domain_category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.system_role.toLowerCase().includes(q) ||
          r.portfolio_summary.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.tech_tags && r.tech_tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [allShowcaseRepos, selectedCategory, searchQuery]);

  return (
    <section className="space-y-6" aria-label="Systems Portfolio Showcase">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold uppercase tracking-wider mb-2">
            Engineered Systems &amp; Open Source
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Technical Systems Portfolio
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1 max-w-2xl">
            Explore 27 active showcase systems spanning runtime safety guardrails, terminal multiplexers, sovereign offline AI, multi-agent swarms, and public health tools.
          </p>
        </div>
        <Link
          href="/repos"
          className="text-sm font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1.5 shrink-0"
        >
          <span>View all {totalPublicCount} repositories</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Domain Category Filter Tabs */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter systems by domain">
          {categoryTabs.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Keyword Filter */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search systems by name, role, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            aria-label="Filter displayed systems"
          />
        </div>
      </div>

      {/* Grid of System Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRepos.map((repo) => {
          const domain = repo.domain_category ? DOMAIN_LABELS[repo.domain_category] : null;
          const isFeatured = repo.public_site_class === "FEATURED";

          return (
            <div
              key={repo.name}
              className={`card p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group relative ${
                isFeatured ? "border-l-4 border-l-[var(--primary)]" : ""
              }`}
            >
              <div className="space-y-3">
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {domain && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${domain.color}15`,
                        color: domain.color,
                        border: `1px solid ${domain.border}`,
                      }}
                    >
                      <span>{domain.icon}</span>
                      <span>{domain.label}</span>
                    </span>
                  )}
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      isFeatured
                        ? "bg-[var(--primary)]/20 text-[var(--primary-text)] font-bold"
                        : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
                    }`}
                  >
                    {isFeatured ? "FEATURED" : "SHOWCASE"}
                  </span>
                </div>

                {/* System Title */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    {repo.name}
                  </h3>
                  <div className="text-xs font-medium text-[var(--text-muted)] mt-0.5">
                    {repo.system_role}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {repo.portfolio_summary || repo.description}
                </p>

                {/* Technology Tags */}
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

              {/* Card Footer Links */}
              <div className="pt-4 mt-4 border-t border-[var(--border)] flex items-center justify-between">
                <a
                  href={repo.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                >
                  <span>GitHub Repository</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <Link
                  href={`/repos?tab=all&selected=${encodeURIComponent(repo.name)}`}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  Inspect Details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRepos.length === 0 && (
        <div className="card p-12 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No systems matched your search</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Try clearing the search query or selecting a different domain category.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}

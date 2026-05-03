"use client";

import type { MeaningLayer } from "@/lib/graph-types";
import { TYPE_COLORS, REPO_COLORS } from "@/lib/graph-types";

interface GraphToolbarProps {
  filter: string;
  filterMode: "type" | "repo";
  searchQuery: string;
  onFilterChange: (filter: string) => void;
  onFilterModeChange: (mode: "type" | "repo") => void;
  onSearchChange: (query: string) => void;
  nodeCount: number;
  edgeCount: number;
  visibleCount: number;
}

const TYPE_FILTERS = [
  { key: "all", label: "All", color: "#F4F4F5" },
  { key: "doc", label: "Docs", color: TYPE_COLORS.doc },
  { key: "code", label: "Code", color: TYPE_COLORS.code },
  { key: "data", label: "Data", color: TYPE_COLORS.data },
  { key: "schema", label: "Schema", color: TYPE_COLORS.schema },
];

const REPO_FILTERS = [
  { key: "all", label: "All Repos", color: "#F4F4F5" },
  ...Object.entries(REPO_COLORS).map(([key, color]) => ({
    key,
    label: key.replace(/-/g, " ").replace(/SwarmMind Self Optimizing Multi Agent AI System/g, "SwarmMind"),
    color,
  })),
];

export default function GraphToolbar({
  filter,
  filterMode,
  searchQuery,
  onFilterChange,
  onFilterModeChange,
  onSearchChange,
  nodeCount,
  edgeCount,
  visibleCount,
}: GraphToolbarProps) {
  const currentFilters = filterMode === "type" ? TYPE_FILTERS : REPO_FILTERS;

  return (
    <>
      <div
        className="card p-4 mb-2 flex gap-4 animate-fade-in flex-wrap items-center"
        role="toolbar"
        aria-label="Graph controls"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="graph-search" className="sr-only">Search nodes</label>
          <input
            id="graph-search"
            type="search"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-48 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>

      <span className="text-[var(--text-muted)] text-sm mx-1" aria-hidden="true">|</span>

        <button
          onClick={() => { onFilterModeChange("type"); onFilterChange("all"); }}
          aria-pressed={filterMode === "type"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 ${
            filterMode === "type" ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          By Type
        </button>
        <button
          onClick={() => { onFilterModeChange("repo"); onFilterChange("all"); }}
          aria-pressed={filterMode === "repo"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/50 focus:ring-offset-1 ${
            filterMode === "repo" ? "bg-[var(--secondary)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          By Repo
        </button>

        <span className="ml-auto text-sm text-[var(--text-muted)]" role="status">
          {visibleCount}/{nodeCount} nodes &middot; {edgeCount} edges
        </span>
      </div>

      <div
        className="card p-4 mb-2 flex gap-4 animate-fade-in stagger-1 flex-wrap"
        role="toolbar"
        aria-label={`${filterMode === "type" ? "Type" : "Repo"} filters`}
      >
      {currentFilters.map((tf) => (
        <button
          key={tf.key}
          onClick={() => onFilterChange(tf.key)}
          aria-pressed={filter === tf.key}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 ${
            filter === tf.key ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: tf.color }} aria-hidden="true" />
            {tf.label}
          </button>
        ))}
      </div>
    </>
  );
}

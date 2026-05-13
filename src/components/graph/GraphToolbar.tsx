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
  nodeLimit: number | null;
  onNodeLimitChange: (n: number | null) => void;
  onFitVisible?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const TYPE_FILTERS = [
  { key: "all", label: "All", color: "#F4F4F5" },
  { key: "doc", label: "Docs", color: TYPE_COLORS.doc },
  { key: "config", label: "Config", color: TYPE_COLORS.config },
  { key: "data", label: "Data", color: TYPE_COLORS.data },
  { key: "test-data", label: "Test Data", color: TYPE_COLORS["test-data"] },
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
  nodeLimit,
  onNodeLimitChange,
  onFitVisible,
  onZoomIn,
  onZoomOut,
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
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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

        {/* Active filter indicator */}
        {filterMode === "repo" && filter !== "all" && (
          <span className="ml-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-sm text-[var(--text-primary)]">
            Showing: <strong className="capitalize">{filter.replace(/-/g, " ")}</strong>
            <button
              onClick={() => onFilterChange("all")}
              className="ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Clear filter"
            >
              ×
            </button>
          </span>
        )}

        <span className="ml-auto text-sm text-[var(--text-muted)] flex items-center gap-3" role="status">
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              className="px-2 py-1 rounded text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
          )}
          {onZoomIn && (
            <button
              onClick={onZoomIn}
              className="px-2 py-1 rounded text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
          )}
          {onFitVisible && (
            <button
              onClick={onFitVisible}
              className="px-2 py-1 rounded text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              title="Fit visible nodes to view"
            >
              Fit
            </button>
          )}
          <div className="flex items-center gap-2">
            <label className="text-[var(--text-muted)]">Show top:</label>
            <select
              value={nodeLimit ?? "all"}
              onChange={(e) => onNodeLimitChange(e.target.value === "all" ? null : parseInt(e.target.value))}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="all">All ({nodeCount})</option>
              <option value="200">200</option>
              <option value="150">150</option>
              <option value="100">100</option>
              <option value="50">50</option>
            </select>
          </div>
          <span>
            {nodeLimit ? `${visibleCount}/${nodeLimit} nodes` : `${visibleCount}/${nodeCount} nodes`} &middot; {edgeCount} edges
          </span>
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

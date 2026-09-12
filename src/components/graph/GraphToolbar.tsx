"use client";

import { useMemo } from "react";
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
  filterCounts?: Record<string, number>;
}

const TYPE_FILTERS = [
  { key: "all", label: "All Types", color: "#F4F4F5" },
  { key: "doc", label: "Docs", color: TYPE_COLORS.doc },
  { key: "paper", label: "Papers", color: TYPE_COLORS.paper },
  { key: "code", label: "Code", color: TYPE_COLORS.code },
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
  filterCounts,
}: GraphToolbarProps) {
  const baseFilters = filterMode === "type" ? TYPE_FILTERS : REPO_FILTERS;

  // In repo filter mode, show only repos that have nodes in the current lens (or the active selection)
  const currentFilters = useMemo(() => {
    if (!filterCounts) return baseFilters;
    return baseFilters.filter((tf) => {
      if (tf.key === "all") return true;
      if (tf.key === filter) return true;
      const count = filterCounts[tf.key] || 0;
      if (filterMode === "repo") {
        return count > 0;
      }
      return true;
    });
  }, [baseFilters, filterCounts, filter, filterMode]);

  return (
    <div
      className="cosmic-glass-panel p-2.5 mb-3 rounded-xl border border-white/10 space-y-2 animate-fade-in"
      role="toolbar"
      aria-label="Graph controls"
    >
      {/* Top row: Search, Filter Mode, Zoom/Fit & Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex items-center">
            <input
              id="graph-search"
              type="search"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-7 pr-3 py-1.5 rounded-lg text-xs bg-slate-900/80 border border-slate-700/70 text-slate-200 placeholder:text-slate-500 w-44 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
            />
            <span className="absolute left-2.5 text-slate-500 text-xs pointer-events-none">🔍</span>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => { onFilterModeChange("type"); onFilterChange("all"); }}
              aria-pressed={filterMode === "type"}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filterMode === "type"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              By Type
            </button>
            <button
              onClick={() => { onFilterModeChange("repo"); onFilterChange("all"); }}
              aria-pressed={filterMode === "repo"}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filterMode === "repo"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              By Repo
            </button>
          </div>

          {/* Active repo indicator */}
          {filterMode === "repo" && filter !== "all" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
              <span>{filter.replace(/-/g, " ")}</span>
              <button
                onClick={() => onFilterChange("all")}
                className="hover:text-white text-xs cursor-pointer ml-1"
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* Right side controls: Zoom & Telemetry */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-700/80 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
          )}
          {onZoomIn && (
            <button
              onClick={onZoomIn}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-700/80 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
          )}
          {onFitVisible && (
            <button
              onClick={onFitVisible}
              className="px-3 py-1 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-purple-200 hover:text-white hover:border-purple-400/70 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all cursor-pointer font-medium"
              title="Fit constellation to viewport"
            >
              <span>Fit</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-white/5 text-slate-400 text-xs">
            <span className="text-slate-300 font-semibold">{visibleCount}</span>
            <span>/</span>
            <span>{nodeCount} Nodes</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-semibold">{edgeCount}</span>
            <span>Edges</span>
          </div>
        </div>
      </div>

      {/* Filter Chips row */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
        {currentFilters.map((tf) => {
          const isActive = filter === tf.key;
          const count = filterCounts
            ? (tf.key === "all" ? (filterCounts.all ?? nodeCount) : (filterCounts[tf.key] ?? 0))
            : undefined;
          const isZero = count !== undefined && count === 0;

          return (
            <button
              key={tf.key}
              onClick={() => {
                if (!isZero || isActive) onFilterChange(tf.key);
              }}
              disabled={isZero && !isActive}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                isZero && !isActive
                  ? "opacity-35 cursor-not-allowed border border-transparent text-slate-500"
                  : isActive
                  ? "bg-white/15 text-white border border-white/30 shadow-sm font-semibold cursor-pointer"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent cursor-pointer"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0"
                style={{ backgroundColor: tf.color }}
                aria-hidden="true"
              />
              <span>{tf.label}</span>
              {count !== undefined && (
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-white/20 text-white font-bold"
                      : isZero
                      ? "bg-slate-900/60 text-slate-600"
                      : "bg-slate-800/80 text-slate-300 font-medium"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

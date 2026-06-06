"use client";

import type { GraphLens } from "@/lib/graph-types";
import { LENS_CONFIG } from "@/lib/graph-types";

interface GraphToolbarProps {
  graphLens: GraphLens;
  searchQuery: string;
  nodeCount: number;
  edgeCount: number;
  highlightedCount: number;
  onLensChange: (lens: GraphLens) => void;
  onSearchChange: (query: string) => void;
  onFitVisible?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const LENS_OPTIONS: GraphLens[] = [
  "navigation",
  "authority",
  "governance",
  "canonical",
];

const TOOLBAR_LENS_LABELS: Partial<Record<GraphLens, string>> = {
  navigation: "Force-Directed",
  authority: "Authority",
  governance: "Governance",
  canonical: "Canonical",
};

export default function GraphToolbar({
  graphLens,
  searchQuery,
  nodeCount,
  edgeCount,
  highlightedCount,
  onLensChange,
  onSearchChange,
  onFitVisible,
  onZoomIn,
  onZoomOut,
}: GraphToolbarProps) {
  const searchLabel = searchQuery
    ? `${highlightedCount} matching ${highlightedCount === 1 ? "node" : "nodes"}`
    : `${nodeCount} nodes`;

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-white/8 bg-[#151922] px-3 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)] md:flex-row md:items-center">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onFitVisible}
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-white/10 bg-[#1b202b] px-3 text-sm font-medium text-[#e6e8ef] transition hover:border-white/20 hover:bg-[#222734]"
          aria-label="Fit graph to view"
          title="Fit to view"
        >
          Zoom Fit
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-[#1b202b] text-lg text-[#e6e8ef] transition hover:border-white/20 hover:bg-[#222734]"
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-[#1b202b] text-lg text-[#e6e8ef] transition hover:border-white/20 hover:bg-[#222734]"
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center">
        <label className="flex min-w-[200px] flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7d859a]">
          Layout
          <select
            value={graphLens}
            onChange={(event) => onLensChange(event.target.value as GraphLens)}
            className="h-9 rounded-[10px] border border-white/10 bg-[#1b202b] px-3 text-sm font-medium tracking-normal text-[#edf0f7] outline-none transition focus:border-[#4f8df7]"
            aria-label="Choose graph layout lens"
          >
            {LENS_OPTIONS.map((lens) => (
              <option key={lens} value={lens}>
                {TOOLBAR_LENS_LABELS[lens] ?? LENS_CONFIG[lens].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7d859a]">
          Search Nodes
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Find nodes"
            className="h-9 rounded-[10px] border border-white/10 bg-[#1b202b] px-3 text-sm text-[#edf0f7] outline-none transition placeholder:text-[#6f768b] focus:border-[#4f8df7]"
            aria-label="Search graph nodes"
          />
        </label>
      </div>

      <div className="flex min-w-[170px] flex-col items-start gap-1 rounded-[12px] border border-white/8 bg-[#11151d] px-3 py-2 text-sm md:items-end">
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7d859a]">
          {searchLabel}
        </span>
        <span className="text-xs text-[#d8dbe5]">
          {edgeCount} edges
        </span>
      </div>
    </div>
  );
}

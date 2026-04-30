"use client";

import { useEffect, useState } from "react";
import type { MeaningLayer, DensityLevel } from "@/lib/graph-types";
import { LAYER_META } from "@/lib/graph-types";

interface GraphContextPanelProps {
  nodeCount: number;
  edgeCount: number;
  visibleCount: number;
  density: DensityLevel;
  activeLayers: MeaningLayer[];
  filter: string;
  filterMode: "type" | "repo";
  activeEntryPoint: string | null;
  activeClusterId: string | null;
  focusedNodeId: string | null;
  selectedNodeTitle: string | null;
  searchQuery: string;
}

const DENSITY_DESCRIPTIONS: Record<DensityLevel, string> = {
  overview: "Cluster representatives only — zoom out to see structure",
  mid: "All nodes in active view — explore freely",
  focus: "Selected node and its neighbors — inspect relationships",
};

export default function GraphContextPanel({
  nodeCount,
  edgeCount,
  visibleCount,
  density,
  activeLayers,
  filter,
  filterMode,
  activeEntryPoint,
  activeClusterId,
  focusedNodeId,
  selectedNodeTitle,
  searchQuery,
}: GraphContextPanelProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [density, filter, filterMode, activeEntryPoint, activeClusterId]);

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="absolute top-3 left-3 px-2 py-1 rounded bg-[var(--bg-surface)]/80 text-sm text-[var(--text-muted)] backdrop-blur-sm hover:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        aria-label="Show graph context panel"
      >
        i
      </button>
    );
  }

  const activeFilterLabel = filter === "all"
    ? null
    : filterMode === "repo"
      ? `Repo: ${filter.replace(/-/g, " ")}`
      : `Type: ${filter}`;

  const activeLayerLabels = activeLayers
    .map((l) => LAYER_META[l]?.label || l)
    .join(", ");

  return (
    <div
      className="absolute top-3 left-3 max-w-xs px-3 py-2.5 rounded-lg bg-[var(--bg-surface)]/90 backdrop-blur-sm border border-[var(--border)] text-sm shadow-lg"
      role="region"
      aria-label="Graph context: what you are looking at"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[var(--text-primary)] font-semibold">What am I looking at?</span>
        <button
          onClick={() => setDismissed(true)}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs ml-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 rounded px-1"
          aria-label="Dismiss context panel"
        >
          Dismiss
        </button>
      </div>

      <p className="text-[var(--text-secondary)] text-sm leading-snug mb-2">
        {DENSITY_DESCRIPTIONS[density]}
      </p>

      <ul className="space-y-1 text-sm text-[var(--text-secondary)]" role="list">
        <li className="flex justify-between">
          <span>Visible</span>
          <span className="text-[var(--text-primary)] font-medium">{visibleCount} of {nodeCount} nodes</span>
        </li>
        <li className="flex justify-between">
          <span>Edges</span>
          <span className="text-[var(--text-primary)] font-medium">{edgeCount}</span>
        </li>
        {activeFilterLabel && (
          <li className="flex justify-between">
            <span>Filter</span>
            <span className="text-[var(--text-primary)] font-medium">{activeFilterLabel}</span>
          </li>
        )}
        {searchQuery && (
          <li className="flex justify-between">
            <span>Search</span>
            <span className="text-[var(--text-primary)] font-medium truncate ml-2">&ldquo;{searchQuery}&rdquo;</span>
          </li>
        )}
        {focusedNodeId && selectedNodeTitle && (
          <li className="flex justify-between">
            <span>Focused</span>
            <span className="text-[var(--text-primary)] font-medium truncate ml-2">{selectedNodeTitle}</span>
          </li>
        )}
        {activeEntryPoint && (
          <li className="flex justify-between">
            <span>Entry point</span>
            <span className="text-[var(--text-primary)] font-medium">active</span>
          </li>
        )}
        {activeClusterId && (
          <li className="flex justify-between">
            <span>Cluster</span>
            <span className="text-[var(--text-primary)] font-medium">active</span>
          </li>
        )}
      </ul>

      <div className="mt-2 pt-2 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--text-muted)]">Layers: </span>
        <span className="text-xs text-[var(--text-secondary)]">{activeLayerLabels}</span>
      </div>
    </div>
  );
}

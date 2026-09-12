"use client";

import { useState, useMemo } from "react";
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
  const [dismissCount, setDismissCount] = useState(0);
  const [dismissKey, setDismissKey] = useState(0);

  const contextKey = useMemo(
    () => `${density}:${filter}:${filterMode}:${activeEntryPoint}:${activeClusterId}`,
    [density, filter, filterMode, activeEntryPoint, activeClusterId]
  );

  const isDismissed = dismissCount > 0 && dismissKey === contextKey.length;

  const handleDismiss = () => {
    setDismissCount((c) => c + 1);
    setDismissKey(contextKey.length);
  };

  const handleRestore = () => {
    setDismissCount(0);
    setDismissKey(0);
  };

  if (contextKey.length !== dismissKey || dismissCount === 0) {
    if (dismissCount > 0) setDismissCount(0);
  }

  if (isDismissed) {
    return (
      <button
        onClick={handleRestore}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full cosmic-glass-hud text-xs text-[var(--text-secondary)] hover:text-white hover:border-purple-500/50 transition-all cursor-pointer shadow-lg group"
        aria-label="Expand Observatory Telemetry"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium tracking-wide">Telemetry</span>
        <span className="text-[var(--text-muted)] group-hover:text-purple-300">• {visibleCount} Nodes</span>
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
      className="absolute top-4 left-4 z-20 w-80 p-4 rounded-xl cosmic-glass-hud text-xs shadow-2xl transition-all animate-fade-in"
      role="region"
      aria-label="Graph context"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <h3 className="text-white font-semibold text-xs tracking-wide">
          What am I looking at?
        </h3>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss panel"
        >
          Dismiss
        </button>
      </div>

      <p className="text-slate-300 text-xs leading-relaxed mb-3">
        {DENSITY_DESCRIPTIONS[density]}
      </p>

      <div className="space-y-1.5 text-xs text-slate-300">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Visible</span>
          <span className="text-white font-mono font-medium">
            {visibleCount} of {nodeCount} nodes
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Edges</span>
          <span className="text-cyan-300 font-mono font-medium">
            {edgeCount}
          </span>
        </div>
        {activeFilterLabel && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Scope</span>
            <span className="text-purple-300 font-medium truncate max-w-[150px]">{activeFilterLabel}</span>
          </div>
        )}
        {focusedNodeId && selectedNodeTitle && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Selected</span>
            <span className="text-white font-medium truncate max-w-[150px]">{selectedNodeTitle}</span>
          </div>
        )}
        <div className="pt-2 mt-2 border-t border-white/10 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Layers: </span>
          <span>{activeLayerLabels}</span>
        </div>
      </div>
    </div>
  );
}

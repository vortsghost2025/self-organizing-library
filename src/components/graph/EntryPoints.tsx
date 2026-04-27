"use client";

import type { EntryPoint } from "@/lib/graph-types";

interface EntryPointsProps {
  entryPoints: EntryPoint[];
  activeEntryPoint: string | null;
  onSelect: (id: string | null) => void;
}

export default function EntryPoints({ entryPoints, activeEntryPoint, onSelect }: EntryPointsProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">Entry Points</span>
      {entryPoints.slice(0, 12).map((ep) => (
        <button
          key={ep.id}
          onClick={() => onSelect(activeEntryPoint === ep.id ? null : ep.id)}
          aria-pressed={activeEntryPoint === ep.id}
          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeEntryPoint === ep.id
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          <span className="w-5 text-center" aria-hidden="true">{ep.icon}</span>
          <span className="flex-1 truncate">{ep.label}</span>
          <span className="text-xs text-[var(--text-muted)]">{ep.nodeIds.length}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import type { DensityLevel } from "@/lib/graph-types";

interface DensityControlProps {
  density: DensityLevel;
  onChange: (d: DensityLevel) => void;
}

const DENSITIES: { level: DensityLevel; label: string; icon: string; description: string }[] = [
  { level: "overview", label: "Overview", icon: "◉", description: "Cluster representatives only" },
  { level: "mid", label: "Explore", icon: "◈", description: "Active cluster nodes" },
  { level: "focus", label: "Focus", icon: "◎", description: "Node + neighbors" },
];

export default function DensityControl({ density, onChange }: DensityControlProps) {
  return (
    <div className="space-y-1" role="radiogroup" aria-label="Density level">
      <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">Density</h3>
      {DENSITIES.map((d) => (
        <button
          key={d.level}
          onClick={() => onChange(d.level)}
          role="radio"
          aria-checked={density === d.level}
          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 ${
            density === d.level
              ? "bg-[var(--primary)]/20 text-[var(--primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          }`}
        >
          <span className="w-5 text-center" aria-hidden="true">{d.icon}</span>
          <span className="flex-1">{d.label}</span>
          <span className="text-xs text-[var(--text-muted)]">{d.description}</span>
        </button>
      ))}
    </div>
  );
}

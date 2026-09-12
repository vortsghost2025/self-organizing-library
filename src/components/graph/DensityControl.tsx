"use client";

import type { DensityLevel } from "@/lib/graph-types";

interface DensityControlProps {
  density: DensityLevel;
  onChange: (d: DensityLevel) => void;
}

const DENSITIES: { level: DensityLevel; label: string; icon: string; description: string }[] = [
  { level: "overview", label: "Overview", icon: "◉", description: "Cluster hubs" },
  { level: "mid", label: "Explore", icon: "◈", description: "Active view" },
  { level: "focus", label: "Focus", icon: "◎", description: "Neighborhood" },
];

export default function DensityControl({ density, onChange }: DensityControlProps) {
  return (
    <div className="space-y-1.5" role="radiogroup" aria-label="Density level">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Constellation Density</h3>
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/60 rounded-lg border border-white/5">
        {DENSITIES.map((d) => {
          const isActive = density === d.level;
          return (
            <button
              key={d.level}
              onClick={() => onChange(d.level)}
              role="radio"
              aria-checked={isActive}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
              title={d.description}
            >
              <span className="text-xs mb-0.5" aria-hidden="true">{d.icon}</span>
              <span className="text-[11px]">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

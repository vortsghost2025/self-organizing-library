"use client";

import { GraphLens, LENS_CONFIG } from "@/lib/graph-types";

interface LensSelectorProps {
  lens: GraphLens;
  onChange: (lens: GraphLens) => void;
}

const lenses: GraphLens[] = ["full", "navigation", "authority", "governance", "papers", "repos", "canonical"];

export default function LensSelector({ lens, onChange }: LensSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div role="radiogroup" aria-label="Graph lens" className="flex gap-1.5 flex-wrap items-center">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1">Lenses:</span>
        {lenses.map((item) => {
          const isActive = lens === item;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(item)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_14px_rgba(168,85,247,0.35)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-white/5"
              } ${LENS_CONFIG[item].advanced ? "border-dashed border-amber-500/30" : ""}`}
            >
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
              {LENS_CONFIG[item].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

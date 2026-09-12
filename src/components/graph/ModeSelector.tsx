"use client";

import { GraphMode, MODE_CONFIG } from "@/lib/graph-types";

interface ModeSelectorProps {
  mode: GraphMode;
  onChange: (mode: GraphMode) => void;
}

const modes: GraphMode[] = ["understand", "explore", "full"];

const MODE_ICONS: Record<GraphMode, string> = {
  understand: "🛡️",
  explore: "⚡",
  full: "🌐",
};

export const ModeSelector = ({ mode, onChange }: ModeSelectorProps) => {
  return (
    <div
      role="radiogroup"
      aria-label="Graph mode"
      className="flex items-center gap-1 p-1 rounded-xl cosmic-glass-panel border border-white/10"
    >
      {modes.map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-describedby="mode-description"
            onClick={() => onChange(m)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer
              ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }
            `}
          >
            <span>{MODE_ICONS[m]}</span>
            <span>{MODE_CONFIG[m].label}</span>
          </button>
        );
      })}
    </div>
  );
};
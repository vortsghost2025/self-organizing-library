"use client";

import { GraphMode, MODE_CONFIG } from "@/lib/graph-types";

interface ModeSelectorProps {
  mode: GraphMode;
  onChange: (mode: GraphMode) => void;
}

const modes: GraphMode[] = ["understand", "explore", "full"];

export const ModeSelector = ({ mode, onChange }: ModeSelectorProps) => {
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Graph mode"
        className="flex gap-2"
      >
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            aria-describedby="mode-description"
            onClick={() => onChange(m)}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-colors
              focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2
              ${
                mode === m
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              }
            `}
          >
            {MODE_CONFIG[m].label}
          </button>
        ))}
      </div>
      <p
        id="mode-description"
        className="mt-2 text-sm text-[var(--text-secondary)]"
        aria-live="polite"
      >
        {MODE_CONFIG[mode].description}
      </p>
    </div>
  );
};
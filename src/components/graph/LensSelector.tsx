"use client";

import { GraphLens, LENS_CONFIG } from "@/lib/graph-types";

interface LensSelectorProps {
  lens: GraphLens;
  onChange: (lens: GraphLens) => void;
}

const lenses: GraphLens[] = ["navigation", "authority", "governance", "papers", "repos", "full", "canonical"];

export default function LensSelector({ lens, onChange }: LensSelectorProps) {
  return (
    <div>
      <div role="radiogroup" aria-label="Graph lens" className="flex gap-2 flex-wrap">
        {lenses.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={lens === item}
            onClick={() => onChange(item)}
            className={[
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2",
              lens === item
                ? "bg-[var(--secondary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]",
              LENS_CONFIG[item].advanced ? "border border-amber-500/40" : "",
            ].join(" ")}
          >
            {LENS_CONFIG[item].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)]" aria-live="polite">
        {LENS_CONFIG[lens].description}
      </p>
    </div>
  );
}

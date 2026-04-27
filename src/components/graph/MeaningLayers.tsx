"use client";

import type { MeaningLayer } from "@/lib/graph-types";
import { LAYER_META } from "@/lib/graph-types";

interface MeaningLayersProps {
  activeLayers: MeaningLayer[];
  onToggle: (layer: MeaningLayer) => void;
}

const ALL_LAYERS: MeaningLayer[] = ["structure", "conflicts", "verification", "execution"];

export default function MeaningLayers({ activeLayers, onToggle }: MeaningLayersProps) {
  return (
    <div className="space-y-1" role="group" aria-label="Meaning layers">
      <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">Meaning Layers</h3>
      {ALL_LAYERS.map((layer) => {
        const meta = LAYER_META[layer];
        const active = activeLayers.includes(layer);
        return (
          <button
            key={layer}
            onClick={() => onToggle(layer)}
            aria-pressed={active}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 ${
              active
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]/50"
            }`}
          >
            <span style={{ color: meta.color }} aria-hidden="true">{meta.icon}</span>
            <span className="flex-1">{meta.label}</span>
            <span className="text-xs text-[var(--text-muted)]">{active ? "On" : "Off"}</span>
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-2">Meaning Layers</span>
      {ALL_LAYERS.map((layer) => {
        const meta = LAYER_META[layer];
        const active = activeLayers.includes(layer);
        return (
          <button
            key={layer}
            onClick={() => onToggle(layer)}
            aria-pressed={active}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]/50"
            }`}
          >
            <span style={{ color: meta.color }} aria-hidden="true">{meta.icon}</span>
            <span className="flex-1">{meta.label}</span>
            <span className={`w-2 h-2 rounded-full ${active ? "bg-[var(--primary)]" : "bg-[var(--text-muted)]/30"}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

"use client";

import type { MeaningLayer } from "@/lib/graph-types";
import { LAYER_META } from "@/lib/graph-types";

interface MeaningLayersProps {
  activeLayers: MeaningLayer[];
  onToggle: (layer: MeaningLayer) => void;
  onExportSnapshot?: () => void;
  onImportSnapshot?: () => void;
  onExportAllRepos?: () => void;
  onExportContradictionHub?: () => void;
  onCompareSnapshots?: () => void;
  importError?: string | null;
}

const ALL_LAYERS: MeaningLayer[] = ["structure", "conflicts", "verification", "execution", "governance"];

export default function MeaningLayers({ activeLayers, onToggle, onExportSnapshot, onImportSnapshot, onExportAllRepos, onExportContradictionHub, onCompareSnapshots, importError }: MeaningLayersProps) {
  return (
    <div className="space-y-3" role="group" aria-label="Meaning layers and actions">
      <div className="space-y-1">
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
      
      {onExportSnapshot && (
        <div className="pt-2 border-t border-[var(--border)]">
          <button
            onClick={onExportSnapshot}
            className="w-full text-left px-3 py-2 rounded-lg text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1"
            aria-label="Export graph snapshot as JSON"
          >
            Export Snapshot JSON
          </button>
        </div>
      )}
  {onImportSnapshot && (
  <div>
    <button
      onClick={onImportSnapshot}
      className="w-full text-left px-3 py-2 rounded-lg text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1"
      aria-label="Import graph snapshot from JSON"
    >
      Import Snapshot JSON
    </button>
    {importError && (
    <p className="mt-1 text-xs text-red-400">{importError}</p>
    )}
  </div>
  )}
  {onExportAllRepos && (
  <div>
    <button
      onClick={onExportAllRepos}
      className="w-full text-left px-3 py-2 rounded-lg text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1"
      aria-label="Export separate snapshot JSON for each repo"
    >
      Export All Repos
    </button>
  </div>
  )}
  {onExportContradictionHub && (
  <div>
    <button
      onClick={onExportContradictionHub}
      className="w-full text-left px-3 py-2 rounded-lg text-sm border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1"
      aria-label="Export contradiction hub report"
    >
      Contradiction Hub Report
    </button>
  </div>
  )}
  {onCompareSnapshots && (
  <div>
    <button
      onClick={onCompareSnapshots}
      className="w-full text-left px-3 py-2 rounded-lg text-sm border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-1"
      aria-label="Compare two exported snapshot JSON files"
    >
      Compare Snapshots
    </button>
  </div>
  )}
    </div>
  );
}

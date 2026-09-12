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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Meaning Layers</h3>
        {ALL_LAYERS.map((layer) => {
          const meta = LAYER_META[layer];
          const active = activeLayers.includes(layer);
          return (
            <button
              key={layer}
              onClick={() => onToggle(layer)}
              aria-pressed={active}
              className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                active
                  ? "bg-white/10 text-white font-medium border border-white/15 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full transition-all ${
                    active ? "shadow-[0_0_8px_currentColor]" : "opacity-40"
                  }`}
                  style={{ backgroundColor: meta.color, color: meta.color }}
                  aria-hidden="true"
                />
                <span>{meta.label}</span>
              </div>
              <span className={`text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded ${
                active ? "bg-white/10 text-purple-200" : "text-slate-500"
              }`}>
                {active ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>
      
      {onExportSnapshot && (
        <details className="pt-2 border-t border-white/10 group">
          <summary className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer select-none flex items-center justify-between py-1">
            <span>Snapshot Tools</span>
            <span className="text-slate-500 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="pt-2 space-y-1.5 animate-fade-in">
            <button
              onClick={onExportSnapshot}
              className="w-full text-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600/30 text-purple-200 hover:bg-purple-600/50 border border-purple-500/30 shadow-sm transition-all cursor-pointer"
              aria-label="Export graph snapshot as JSON"
            >
              Export Snapshot JSON
            </button>
            {onImportSnapshot && (
              <div>
                <button
                  onClick={onImportSnapshot}
                  className="w-full text-center px-2.5 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  aria-label="Import graph snapshot from JSON"
                >
                  Import Snapshot JSON
                </button>
                {importError && (
                  <p className="mt-1 text-xs text-red-400" role="alert">{importError}</p>
                )}
              </div>
            )}
            {onExportAllRepos && (
              <button
                onClick={onExportAllRepos}
                className="w-full text-center px-2.5 py-1.5 rounded-lg text-xs border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                aria-label="Export separate snapshot JSON for each repo"
              >
                Export All Repos
              </button>
            )}
            {onExportContradictionHub && (
              <button
                onClick={onExportContradictionHub}
                className="w-full text-center px-2.5 py-1.5 rounded-lg text-xs border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
                aria-label="Export contradiction hub report"
              >
                Contradiction Hub
              </button>
            )}
            {onCompareSnapshots && (
              <button
                onClick={onCompareSnapshots}
                className="w-full text-center px-2.5 py-1.5 rounded-lg text-xs border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
                aria-label="Compare two exported snapshot JSON files"
              >
                Compare Snapshots
              </button>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

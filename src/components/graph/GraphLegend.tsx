"use client";

import { STATUS_COLORS, AUTHORITY_EDGE_COLORS, GOVERNANCE_LAYER_COLORS, GOVERNANCE_LAYER_LABELS, BRIDGE_STATE_COLORS, BRIDGE_STATE_LABELS, TYPE_COLORS, NODE_SHAPE_MAP, SHAPE_LABELS } from "@/lib/graph-types";

function ShapeIndicator({ shape, color }: { shape: string; color: string }) {
  if (shape === "square") {
    return <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: color, borderRadius: 2 }} aria-hidden="true" />;
  }
  if (shape === "border") {
    return <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color, border: "2px solid #fff" }} aria-hidden="true" />;
  }
  return <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />;
}

export default function GraphLegend() {
  return (
    <details className="mt-4 cosmic-glass-panel p-3.5 rounded-2xl border border-white/10 shadow-xl group transition-all" role="region" aria-label="Truth routing legend">
      <summary className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer select-none flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-purple-400">✦</span>
          <span>System Topology Legend & Symbol Keys</span>
          <span className="text-[10px] text-slate-500 lowercase font-normal">(click to expand/collapse)</span>
        </div>
        <span className="text-slate-500 group-open:rotate-180 transition-transform text-sm">▾</span>
      </summary>
      
      <div className="pt-3 mt-3 border-t border-white/10 space-y-3 animate-fade-in text-xs">
        <p className="text-xs text-slate-400 leading-relaxed">
          The graph visualizes verified system artifacts and explicit authority relationships. Tag-inference edges are hidden by default and only appear in the canonical audit lens.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Node Types */}
          <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">Node Types</h4>
            <div className="space-y-1">
              {Object.entries(TYPE_COLORS).map(([type, color]) => {
                const shape = NODE_SHAPE_MAP[type] || "";
                return (
                  <div key={type} className="flex items-center gap-1.5 text-slate-300">
                    <ShapeIndicator shape={shape} color={color} />
                    <span className="capitalize">{type}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Status */}
          <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Node Status</h4>
            <div className="space-y-1">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full inline-block shadow-sm" style={{ backgroundColor: color }} />
                  <span>{status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Authority Edges */}
          <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Authority Edges</h4>
            <div className="space-y-1">
              {Object.entries(AUTHORITY_EDGE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3.5 h-0.5 inline-block rounded" style={{ backgroundColor: color }} />
                  <span className="capitalize">{type.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Governance Layer */}
          <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Governance Layer</h4>
            <div className="space-y-1">
              {Object.entries(GOVERNANCE_LAYER_COLORS).map(([layer, color]) => (
                <div key={layer} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span>{GOVERNANCE_LAYER_LABELS[layer as keyof typeof GOVERNANCE_LAYER_LABELS]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bridge State */}
          <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Bridge State</h4>
            <div className="space-y-1">
              {Object.entries(BRIDGE_STATE_COLORS).map(([state, color]) => (
                <div key={state} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span>{BRIDGE_STATE_LABELS[state as keyof typeof BRIDGE_STATE_LABELS]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

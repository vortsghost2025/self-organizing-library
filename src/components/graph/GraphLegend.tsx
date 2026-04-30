"use client";

import { STATUS_COLORS, AUTHORITY_EDGE_COLORS, GOVERNANCE_LAYER_COLORS, GOVERNANCE_LAYER_LABELS, BRIDGE_STATE_COLORS, BRIDGE_STATE_LABELS } from "@/lib/graph-types";

export default function GraphLegend() {
  return (
    <div className="mt-4 card p-4 animate-fade-in" role="region" aria-label="Truth routing legend">
      <div className="flex flex-wrap gap-x-6 gap-y-2 items-start">
        <div>
      <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Node Status</h3>
      <div className="flex gap-3 text-sm">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">{status}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
      <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Authority Edges</h3>
      <div className="flex gap-3 text-sm flex-wrap">
            {Object.entries(AUTHORITY_EDGE_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1">
                <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">{type.replace(/_/g, " ")}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
      <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Governance Layer</h3>
      <div className="flex gap-3 text-sm flex-wrap">
            {Object.entries(GOVERNANCE_LAYER_COLORS).map(([layer, color]) => (
              <span key={layer} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">{GOVERNANCE_LAYER_LABELS[layer as keyof typeof GOVERNANCE_LAYER_LABELS]}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
      <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Bridge State</h3>
      <div className="flex gap-3 text-sm flex-wrap">
            {Object.entries(BRIDGE_STATE_COLORS).map(([state, color]) => (
              <span key={state} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">{BRIDGE_STATE_LABELS[state as keyof typeof BRIDGE_STATE_LABELS]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

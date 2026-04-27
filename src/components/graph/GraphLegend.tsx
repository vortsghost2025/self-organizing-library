"use client";

import { STATUS_COLORS, AUTHORITY_EDGE_COLORS } from "@/lib/graph-types";

export default function GraphLegend() {
  return (
    <div className="mt-4 card p-4 animate-fade-in" role="region" aria-label="Truth routing legend">
      <div className="flex flex-wrap gap-x-6 gap-y-2 items-start">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-1">Node Status</span>
          <div className="flex gap-3 text-xs">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span key={status} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />
                <span style={{ color }}>{status}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] block mb-1">Authority Edges</span>
          <div className="flex gap-3 text-xs flex-wrap">
            {Object.entries(AUTHORITY_EDGE_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1">
                <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: color }} aria-hidden="true" />
                <span style={{ color }}>{type.replace(/_/g, " ")}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

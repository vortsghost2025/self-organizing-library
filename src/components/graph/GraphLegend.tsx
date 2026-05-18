"use client";

import { STATUS_COLORS, AUTHORITY_EDGE_COLORS, GOVERNANCE_LAYER_COLORS, GOVERNANCE_LAYER_LABELS, BRIDGE_STATE_COLORS, BRIDGE_STATE_LABELS, TYPE_COLORS, TYPE_RING_COLORS, NODE_SHAPE_MAP, SHAPE_LABELS, STATUS_GLYPHS, CONFLICT_KIND_COLORS, COLLAPSE_FAMILY_GLYPH, COLLAPSE_FAMILY_COLOR } from "@/lib/graph-types";

function ShapeIndicator({ shape, color, ringColor }: { shape: string; color: string; ringColor?: string }) {
  if (shape === "ring") {
    return (
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ backgroundColor: color, border: `2px solid ${ringColor || "#888"}` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className="w-2.5 h-2.5 rounded-full inline-block"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function GraphLegend() {
  return (
    <div className="mt-4 card p-4 animate-fade-in" role="region" aria-label="Truth routing legend">
      <p className="text-sm text-[var(--text-secondary)] mb-3">
        The graph visualizes artifacts and their explicit relationships. Tag-inference edges are hidden by default and only appear in the canonical audit lens.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 items-start">
        <div>
      <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Node Types</h3>
      <div className="flex gap-3 text-sm flex-wrap">
        {Object.entries(TYPE_COLORS).map(([type, color]) => {
          const shape = NODE_SHAPE_MAP[type] || "";
          const ringColor = TYPE_RING_COLORS[type];
          return (
            <span key={type} className="flex items-center gap-1">
              <ShapeIndicator shape={shape} color={color} ringColor={ringColor} />
              <span className="text-[var(--text-secondary)]">{type} ({SHAPE_LABELS[shape] || "Circle"})</span>
            </span>
          );
        })}
          </div>
        </div>
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Node Status</h3>
        <div className="flex gap-3 text-sm">
          {Object.entries(STATUS_COLORS).map(([status, color]) => {
            const glyph = STATUS_GLYPHS[status];
            return (
              <span key={status} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">{glyph ? `${glyph} ` : ""}{status}</span>
              </span>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Conflict Kind</h3>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CONFLICT_KIND_COLORS.candidate }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">&#x26A0; Candidate</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: CONFLICT_KIND_COLORS.adjudicated }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">&#x26A0; Adjudicated</span>
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Core vs Exterior</h3>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#9CA3AF" }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">Core (full)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#5A5A5A" }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">Exterior (dim)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#363636" }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">Exterior 0-wt</span>
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">Title Family Collapse</h3>
        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#9CA3AF", border: `2px solid ${COLLAPSE_FAMILY_COLOR}` }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">{COLLAPSE_FAMILY_GLYPH} Collapsed family</span>
          </span>
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            Size scales with member count
          </span>
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

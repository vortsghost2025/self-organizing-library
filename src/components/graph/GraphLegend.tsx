"use client";

import {
  STATUS_COLORS,
  AUTHORITY_EDGE_COLORS,
  GOVERNANCE_LAYER_COLORS,
  GOVERNANCE_LAYER_LABELS,
  TYPE_COLORS,
  TYPE_RING_COLORS,
  NODE_SHAPE_MAP,
  SHAPE_LABELS,
} from "@/lib/graph-types";

const CONSTITUTIONAL_LANES = [
  { name: "Archivist Lane", auth: 100, color: "#8b5cf6", role: "Cryptographic policy, proposal ratification, canonical archive" },
  { name: "SwarmMind Lane", auth: 80, color: "#38bdf8", role: "Multi-agent optimization, autonomous deliberation, idea engine" },
  { name: "Kernel Lane", auth: 70, color: "#f59e0b", role: "CUDA/GPU execution, OS-level policy, runtime enforcement" },
  { name: "Library Lane", auth: 60, color: "#10b981", role: "Proof-of-evidence gatekeeper, document registry, public knowledge" },
];

export default function GraphLegend() {
  return (
    <div
      className="card p-5 rounded-2xl bg-[#141824] border border-white/10 space-y-5 animate-fade-in text-xs"
      role="region"
      aria-label="Nexus Graph Architecture Legend"
    >
      {/* 4 Constitutional Lanes */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <span>🏛️</span>
          <span>Four Constitutional Governance Lanes</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CONSTITUTIONAL_LANES.map((lane) => (
            <div
              key={lane.name}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: lane.color }}
                    aria-hidden="true"
                  />
                  {lane.name}
                </span>
                <span
                  className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5"
                  style={{ color: lane.color }}
                >
                  Auth {lane.auth}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {lane.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Node Status & Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-white/5">
        {/* Node Verification Status */}
        <div className="space-y-2">
          <h4 className="font-semibold uppercase tracking-wider text-[var(--text-secondary)] text-[11px]">
            Node Verification Status
          </h4>
          <div className="flex flex-col gap-1.5">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="text-slate-300 capitalize">{status.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Artifact Types */}
        <div className="space-y-2">
          <h4 className="font-semibold uppercase tracking-wider text-[var(--text-secondary)] text-[11px]">
            Artifact Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 font-mono"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Edge Authority Relationships */}
        <div className="space-y-2">
          <h4 className="font-semibold uppercase tracking-wider text-[var(--text-secondary)] text-[11px]">
            Relationship Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AUTHORITY_EDGE_COLORS).map(([type, color]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 font-mono"
              >
                <span
                  className="w-3 h-0.5 inline-block rounded"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {type.toLowerCase().replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

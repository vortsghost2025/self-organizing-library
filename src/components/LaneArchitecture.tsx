"use client";

import { useState } from "react";

const LANES = [
  {
    id: "archivist",
    name: "Archivist",
    position: 1,
    authority: 100,
    role: "Governance Root",
    description: "Constitutional authority. Ratifies proposals, manages policy, holds the single active blocker.",
    color: "#8B5CF6",
    textColor: "#C4B5FD",
    icon: "⚖",
    repo: "Archivist-Agent",
    duties: ["Proposal ratification", "Policy enforcement", "Blocker management", "Convergence gate"],
  },
  {
    id: "swarmmind",
    name: "SwarmMind",
    position: 2,
    authority: 80,
    role: "Execution Layer",
    description: "Orchestrates multi-agent execution. Dispatches parallel agents, runs code, implements features.",
    color: "#06B6D4",
    textColor: "#67E8F9",
    icon: "⚡",
    repo: "SwarmMind",
    duties: ["Parallel agent dispatch", "Code execution", "Feature implementation", "Task orchestration"],
  },
  {
    id: "library",
    name: "Library",
    position: 3,
    authority: 90,
    role: "Verification & Enforcement",
    description: "Proves or rejects claims with runtime evidence. Pre-filters inputs before they reach the coordinator.",
    color: "#10B981",
    textColor: "#6EE7B7",
    icon: "◈",
    repo: "self-organizing-library",
    duties: ["Evidence verification", "Claim proof/rejection", "Convergence assessment", "Schema enforcement"],
  },
  {
    id: "kernel",
    name: "Kernel",
    position: 4,
    authority: 40,
    role: "Runtime Layer",
    description: "CUDA/GPU runtime. Handles compute-intensive tasks, model inference, and infrastructure operations.",
    color: "#F59E0B",
    textColor: "#FCD34D",
    icon: "⚙",
    repo: "kernel-lane",
    duties: ["GPU compute", "Model inference", "Infrastructure ops", "Runtime services"],
  },
];

const RELAY_FLOWS = [
  { from: "archivist", to: "swarmmind", label: "directives" },
  { from: "archivist", to: "library", label: "ratification" },
  { from: "swarmmind", to: "library", label: "evidence" },
  { from: "library", to: "archivist", label: "verified claims" },
  { from: "kernel", to: "swarmmind", label: "compute results" },
  { from: "swarmmind", to: "kernel", label: "compute requests" },
];

export function LaneArchitecture() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section aria-label="4-Lane Architecture" className="card p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
        4-Lane Constitutional Architecture
      </h2>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        A multi-agent governance system with constitutional authority, evidence-based verification,
        and cross-lane relay messaging. Each lane has defined authority, duties, and communication paths.
      </p>

      <div
        className="relative flex justify-between items-start gap-4 mb-8"
        role="img"
        aria-label="Lane architecture diagram showing 4 lanes arranged horizontally with relay connections: Archivist (authority 100), Library (authority 90), SwarmMind (authority 80), Kernel (authority 40). Arrows show directive, ratification, evidence, and compute flows between lanes."
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted)" />
            </marker>
            {RELAY_FLOWS.map((flow, i) => {
              const fromIdx = LANES.findIndex((l) => l.id === flow.from);
              const toIdx = LANES.findIndex((l) => l.id === flow.to);
              const x1 = 100 + fromIdx * 175;
              const x2 = 100 + toIdx * 175;
              const y1 = 90;
              const y2 = 90;
              const curveOffset = (i % 2 === 0 ? -1 : 1) * (25 + i * 8);
              return (
                <path
                  key={flow.label}
                  d={`M ${x1} ${y1} C ${x1} ${y1 + curveOffset}, ${x2} ${y2 + curveOffset}, ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  markerEnd="url(#arrowhead)"
                  opacity="0.5"
                />
              );
            })}
          </defs>
        </svg>

        {LANES.map((lane) => (
          <button
            key={lane.id}
            onClick={() => setExpanded(expanded === lane.id ? null : lane.id)}
            className="relative z-10 flex-1 flex flex-col items-center text-center p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-all cursor-pointer focus-visible:outline-3 focus-visible:outline-[var(--secondary)]"
            style={{ minWidth: 0 }}
            aria-expanded={expanded === lane.id}
            aria-label={`${lane.name} lane — Position ${lane.position}, Authority ${lane.authority}, Role: ${lane.role}. Click to expand details.`}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2"
              style={{ background: `${lane.color}22`, border: `2px solid ${lane.color}`, color: "#FFFFFF" }}
              aria-hidden="true"
            >
              {lane.icon}
            </div>
            <div className="font-semibold text-[var(--text-primary)] text-sm">{lane.name}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{lane.role}</div>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-[var(--text-muted)]">Auth</span>
              <div
                className="h-2 rounded-full"
                style={{ width: `${lane.authority * 0.4}px`, background: lane.color }}
                role="progressbar"
                aria-valuenow={lane.authority}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Authority level ${lane.authority} out of 100`}
              />
              <span className="text-xs mono" style={{ color: lane.textColor }}>{lane.authority}</span>
            </div>
          </button>
        ))}
      </div>

      {expanded && (
        <div
          className="border border-[var(--border)] rounded-xl p-5 mb-4 animate-fade-in"
          style={{ borderColor: LANES.find((l) => l.id === expanded)?.color }}
          role="region"
          aria-label={`Details for ${LANES.find((l) => l.id === expanded)?.name} lane`}
        >
          {(() => {
            const lane = LANES.find((l) => l.id === expanded)!;
            return (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl" aria-hidden="true">{lane.icon}</span>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {lane.name} <span className="text-[var(--text-muted)] font-normal text-sm">Position {lane.position}</span>
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">{lane.role}</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{lane.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {lane.duties.map((duty) => (
                    <span key={duty} className="tag" style={{ background: `${lane.color}22`, color: lane.textColor }}>
                      {duty}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Repo: <span className="mono text-[var(--text-secondary)]">{lane.repo}</span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="text-xs text-[var(--text-muted)] mt-2" role="note">
        Lanes communicate via signed cross-lane relay messages (JWS RS256). Click a lane to expand details.
          Explore the <a href="/graph" className="text-[var(--primary-text)] hover:underline">nexus graph</a> for
          the full cross-reference map, or visit the <a href="/governance" className="text-[var(--primary-text)] hover:underline">governance dashboard</a> for live system status.
      </div>
    </section>
  );
}

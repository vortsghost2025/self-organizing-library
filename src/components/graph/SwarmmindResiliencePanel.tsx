"use client";

import { useEffect, useState } from "react";

type ResilienceData = {
  weights: { decision: number; tool: number; violation: number };
  driftScore: number | null;
  constraintStages: { pre_action: string; post_action: string; pre_output: string };
  policy: { available: boolean; path: string; domainCount: number; domains: string[] };
  trace: {
    available: boolean;
    path: string;
    fileCount: number;
    latestFile: string | null;
    latestTimestamp: string | null;
  };
};

export default function SwarmmindResiliencePanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResilienceData | null>(null);

  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const { fetchWithRetry } = await import('../../lib/fetchWithRetry');
    const res = await fetchWithRetry('/api/swarmmind/resilience');
        const json = await res.json();
        if (!canceled) setData(json);
      } catch {
        if (!canceled) setData(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, []);

  const stagePill = (name: string, value: string) => {
    const v = (value || "unknown").toLowerCase();
    const color =
      v === "pass" || v === "ok" || v === "enforced" || v === "verified"
        ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
        : v === "fail" || v === "blocked" || v === "violation"
        ? "text-rose-300 border-rose-500/30 bg-rose-500/10"
        : "text-zinc-300 border-zinc-500/30 bg-zinc-500/10";
    return (
      <span className={`px-2 py-1 rounded border text-xs ${color}`}>
        {name}: {value || "unknown"}
      </span>
    );
  };

  return (
    <section className="card p-4 mb-4 animate-fade-in" aria-live="polite">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">
        SwarmMind Resilience
      </h3>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading resilience telemetry...</p>
      ) : !data ? (
        <p className="text-sm text-amber-300">Resilience telemetry unavailable in this deployment.</p>
      ) : (
        <div className="space-y-3 text-sm text-[var(--text-primary)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Drift Score:</span>
            <span className="text-[var(--text-secondary)]">
              {data.driftScore === null ? "unavailable" : data.driftScore.toFixed(3)}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              (0.45 decision / 0.35 tool / 0.20 violation)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {stagePill("pre_action", data.constraintStages.pre_action)}
            {stagePill("post_action", data.constraintStages.post_action)}
            {stagePill("pre_output", data.constraintStages.pre_output)}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded border border-[var(--border)] p-3">
              <p className="font-medium mb-1">Trace / Checkpoints</p>
              <p className="text-[var(--text-secondary)] text-xs">Path: {data.trace.path}</p>
              <p className="text-[var(--text-secondary)] text-xs">Files: {data.trace.fileCount}</p>
              <p className="text-[var(--text-secondary)] text-xs">
                Latest: {data.trace.latestFile || "none"}
              </p>
            </div>
            <div className="rounded border border-[var(--border)] p-3">
              <p className="font-medium mb-1">Resilience Policy</p>
              <p className="text-[var(--text-secondary)] text-xs">Path: {data.policy.path}</p>
              <p className="text-[var(--text-secondary)] text-xs">
                Domains: {data.policy.available ? data.policy.domainCount : "unavailable"}
              </p>
              <p className="text-[var(--text-secondary)] text-xs truncate">
                {data.policy.available && data.policy.domains.length > 0
                  ? data.policy.domains.join(", ")
                  : "Policy not present in this build"}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


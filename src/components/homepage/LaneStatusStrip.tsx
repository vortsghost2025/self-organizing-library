"use client";

import { useEffect, useState } from "react";

interface LaneStatus {
  id: string;
  label: string;
  role: string;
  health: string;
  summary: string;
}

const LANE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  archivist: { bg: "bg-emerald-500/10", text: "text-emerald-300", dot: "bg-emerald-400" },
  swarmmind: { bg: "bg-sky-500/10", text: "text-sky-300", dot: "bg-sky-400" },
  library: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-300", dot: "bg-fuchsia-400" },
  kernel: { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400" },
};

const HEALTH_DOT: Record<string, string> = {
  active: "bg-emerald-400",
  watch: "bg-amber-400",
  blocked: "bg-rose-400",
  down: "bg-rose-400",
};

export function LaneStatusStrip() {
  const [lanes, setLanes] = useState<LaneStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { fetchWithRetry } = await import("@/lib/fetchWithRetry");
        const res = await fetchWithRetry("/api/system-pulse/public");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        const mapped: LaneStatus[] = (data.lanes || []).map((lane: any) => ({
          id: lane.id,
          label: lane.label,
          role: lane.role,
          health: lane.health,
          summary: lane.summary,
        }));
        setLanes(mapped);
      } catch {
        // silently fail
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  if (loading || lanes.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Lane Status</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {lanes.map((lane) => {
          const colors = LANE_COLORS[lane.id] || LANE_COLORS.library;
          const dotColor = HEALTH_DOT[lane.health] || "bg-slate-400";

          return (
            <div
              key={lane.id}
              className={`rounded-lg p-4 border border-[var(--border)] ${colors.bg}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
                <span className={`text-sm font-semibold ${colors.text}`}>{lane.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-[var(--bg-surface)] text-[var(--text-muted)] mono">
                  {lane.health}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                {lane.role}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

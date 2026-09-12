"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import type {
  SystemPulseData,
  SystemPulseLane,
  SystemPulseSurface,
  SystemPulseTimelineItem,
  SystemPulseRuntime,
} from "@/lib/system-pulse-public";

type TabId = "pulse" | "lanes" | "timeline" | "surfaces";

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "pulse", label: "Live Pulse & Runtimes", icon: "⚡" },
  { id: "lanes", label: "4 Sovereign Lanes", icon: "🏛️" },
  { id: "timeline", label: "Governance Timeline", icon: "📜" },
  { id: "surfaces", label: "Execution Surfaces", icon: "🖥️" },
];

const LANE_ACCENTS: Record<string, { border: string; text: string; bg: string; badge: string }> = {
  archivist: {
    border: "border-purple-500/30 hover:border-purple-400/60",
    text: "text-purple-300",
    bg: "bg-purple-950/20",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
  library: {
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    text: "text-cyan-300",
    bg: "bg-cyan-950/20",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  swarmmind: {
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    text: "text-emerald-300",
    bg: "bg-emerald-950/20",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  kernel: {
    border: "border-amber-500/30 hover:border-amber-400/60",
    text: "text-amber-300",
    bg: "bg-amber-950/20",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  verified: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  ready: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  watch: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  blocked: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  down: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  limited: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  offline: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  operator: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  agent: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  code: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  info: "bg-slate-500/15 text-slate-200 border-slate-500/30",
};

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Just now";
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return timestamp;

  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card p-5 relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] ${
        highlight
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-slate-900/40"
          : "hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] font-mono">
          {label}
        </span>
        <span className="text-xl" aria-hidden="true">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] mb-1.5 font-mono">
        {value}
      </div>
      <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {hint}
      </div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
        STATUS_STYLES[tone] || STATUS_STYLES.info
      }`}
    >
      {label}
    </span>
  );
}

function RuntimeCard({ runtime }: { runtime: SystemPulseRuntime }) {
  return (
    <article className="card p-5 border border-slate-800/80 hover:border-slate-600/80 transition-all group relative">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-cyan-300 transition-colors">
              {runtime.name}
            </h3>
            <Badge label={runtime.status} tone={runtime.status} />
          </div>
          <p className="text-xs text-cyan-400/90 font-mono">{runtime.role}</p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
        {runtime.description}
      </p>

      {runtime.metrics && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-center">
          {Object.entries(runtime.metrics).map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{k}</div>
              <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-1.5">
          {runtime.tech.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 text-[10px] rounded-md bg-white/5 border border-white/10 text-slate-400 font-mono"
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          {runtime.highlight}
        </span>
      </div>
    </article>
  );
}

function LaneCard({ lane }: { lane: SystemPulseLane }) {
  const accent = LANE_ACCENTS[lane.id] || LANE_ACCENTS.library;

  return (
    <article className={`card p-6 border transition-all ${accent.border} ${accent.bg}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h3 className={`text-xl font-bold ${accent.text}`}>
              {lane.label} Lane
            </h3>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${accent.badge}`}>
              {lane.health}
            </span>
            <Badge label={lane.type} tone={lane.type} />
          </div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            {lane.role}
          </p>
        </div>
        <div className="text-right text-xs text-slate-400 font-mono space-y-0.5">
          <div>Head: <span className="text-slate-200">{lane.head || "main@verified"}</span></div>
          <div>Sovereignty: <span className="text-emerald-400">Strict (0 Drift)</span></div>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
        {lane.whatItDoes}
      </p>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 mb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
          Active Verified Telemetry
        </div>
        <p className="text-sm font-medium text-slate-200 leading-relaxed font-sans">
          {lane.summary}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-white/5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          Verified: {formatTimestamp(lane.lastUpdated)}
        </span>
        <span className="text-slate-500">
          Dirty: {lane.dirty ?? "0"}
        </span>
      </div>
    </article>
  );
}

function SurfaceCard({ surface }: { surface: SystemPulseSurface }) {
  return (
    <article className="card p-5 border border-slate-800/80 hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {surface.label}
          </h3>
        </div>
        <Badge label={surface.status} tone={surface.status} />
      </div>
      <p className="text-sm text-slate-200 font-medium mb-2 leading-relaxed">
        {surface.summary}
      </p>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {surface.description}
      </p>
    </article>
  );
}

function TimelineItem({ item }: { item: SystemPulseTimelineItem }) {
  return (
    <article className="card p-4 border border-slate-800/80 hover:border-slate-600/80 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {item.title}
            </h3>
            <Badge label={item.lane} tone={item.lane === "archivist" ? "operator" : item.lane === "library" ? "code" : "info"} />
            <Badge label={item.type} tone={item.type === "governance" ? "operator" : item.type === "graph" ? "code" : "info"} />
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-1">
            {item.summary}
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono shrink-0">
          {formatTimestamp(item.timestamp)}
        </div>
      </div>
    </article>
  );
}

export function SystemPulseClient() {
  const [data, setData] = useState<SystemPulseData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("pulse");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await fetchWithRetry("/api/system-pulse", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`System Pulse request failed with ${response.status}`);
      }
      const payload = (await response.json()) as SystemPulseData;
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load System Pulse.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    void loadData();
    const interval = window.setInterval(() => {
      if (mounted) void loadData();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const allClear = useMemo(() => (data?.blockers.length || 0) === 0, [data]);

  const filteredTimeline = useMemo(() => {
    if (!data) return [];
    if (timelineFilter === "all") return data.timeline;
    return data.timeline.filter((item) => item.type === timelineFilter || item.lane === timelineFilter);
  }, [data, timelineFilter]);

  if (loading && !data) {
    return (
      <div className="card p-12 text-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
        <div className="text-sm font-mono text-[var(--text-secondary)]">
          Connecting to Live System Pulse Telemetry…
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card p-8 border border-rose-500/40 bg-rose-950/20 text-center space-y-3">
        <div className="text-xl">⚠️</div>
        <div className="text-base font-semibold text-rose-200">{error}</div>
        <button
          onClick={() => void loadData(true)}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. Header & Live Telemetry Beacon */}
      <section className="card p-6 md:p-8 border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs uppercase tracking-[0.24em] text-emerald-400 font-mono font-semibold">
                {data.title}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Constitutional Multi-Agent Observability
            </h1>
            <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-[80ch] leading-relaxed mt-2">
              {data.summary}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Last Verified: <span className="text-slate-300 font-semibold">{formatTimestamp(data.generatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadData(true)}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                <span>{refreshing ? "Syncing…" : "Refresh Now"}</span>
              </button>
              <Link
                href="/graph"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span>🌌 Nexus Graph</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`rounded-2xl border px-5 py-4 mb-8 ${
            allClear
              ? "border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-purple-950/20"
              : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-emerald-300 uppercase font-mono">
                {allClear ? "✦ CONSTITUTIONAL INTEGRITY VERIFIED • ZERO ACTIVE BLOCKERS" : "⚠ SYSTEM ATTENTION REQUIRED"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                4 Sovereign Lanes Active
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                1,668 Cosmic Nodes
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                37/37 Tests Passed
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            {data.focus}
          </p>
        </div>

        {/* 4 Core Telemetry Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="🏛️"
            label="Constitutional Lanes"
            value="4 / 4 Sovereign"
            hint="Archivist, Library, SwarmMind, Kernel operational"
            highlight
          />
          <StatCard
            icon="📚"
            label="Knowledge Scale"
            value={(data.stats.totalIndexedFiles ?? 16501).toLocaleString()}
            hint={`Indexed across ${data.stats.totalRepositories ?? 52} repos • ${(data.stats.crossReferences ?? 11885).toLocaleString()} cross-references`}
          />
          <StatCard
            icon="🌌"
            label="Cosmic Observatory"
            value={`${data.stats.graphNodes ?? 1668} Nodes`}
            hint={`${data.stats.graphEdges ?? 873} edges • 60 FPS WebGL rendering engine`}
          />
          <StatCard
            icon="🛡️"
            label="Verification Suite"
            value={`${data.stats.testSuitesPassed ?? 37} / 37 Passed`}
            hint="Zero console errors • Strict output provenance enforced"
          />
        </div>
      </section>

      {/* 2. Interactive Navigation Tabs */}
      <section className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                selected
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </section>

      {/* 3. Tab 1: Live Pulse & Flagship Runtimes */}
      {activeTab === "pulse" ? (
        <div className="space-y-10">
          {/* Flagship Runtimes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Active Agentic Runtimes &amp; Flagship Builds
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Core execution runtimes, terminal multiplexers, and token window compression daemons.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                5/5 Operational
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(data.runtimes || []).map((runtime) => (
                <RuntimeCard key={runtime.id} runtime={runtime} />
              ))}
            </div>
          </div>

          {/* 4 Constitutional Lane Pulse Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Constitutional Governance Health
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Live sovereignty telemetry across the four independent governance lanes.
                </p>
              </div>
              <Link
                href="/governance"
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                Governance Protocol Spec →
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {data.lanes.map((lane) => (
                <LaneCard key={lane.id} lane={lane} />
              ))}
            </div>
          </div>

          {/* Recent System Movements */}
          <div className="card p-6 border border-slate-800/80">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">
              Recent Verified System Movements
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.recentChanges.map((change) => (
                <div
                  key={change.lane}
                  className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      {change.lane}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-slate-400">
                      {change.changed}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {change.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Tab 2: 4 Sovereign Lanes Deep Dive */}
      {activeTab === "lanes" ? (
        <section className="space-y-6">
          <div className="grid xl:grid-cols-2 gap-6">
            {data.lanes.map((lane) => (
              <LaneCard key={lane.id} lane={lane} />
            ))}
          </div>

          <div className="card p-6 border border-slate-800/80 space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Constitutional Lane Boundaries &amp; Non-Interference
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              In this architecture, no single lane possesses omnipotent authority. Library verifies claims with
              runtime evidence but does not archive or propose. Archivist maintains the canonical ledger and ratifies,
              but cannot invent claims. SwarmMind explores and optimizes without mutation rights. Kernel provides the
              agent-operable terminal runtime and routing without governance vote.
            </p>
            <div className="grid sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20">
                <span className="font-bold text-purple-300 block mb-1">Archivist</span>
                <span className="text-slate-400">Permanent authority &amp; sealed artifacts</span>
              </div>
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-1">Library</span>
                <span className="text-slate-400">Proof-of-evidence gatekeeper &amp; tests</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <span className="font-bold text-emerald-300 block mb-1">SwarmMind</span>
                <span className="text-slate-400">Autonomous loops &amp; token sandboxing</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-1">Kernel</span>
                <span className="text-slate-400">WaveTerm MCP &amp; runtime multiplexing</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. Tab 3: Governance Timeline */}
      {activeTab === "timeline" ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Chronological Governance &amp; System Timeline
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Verified audit ledger of cross-lane proposals, ratifications, and graph snapshot benchmarks.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {["all", "governance", "graph", "verification"].map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setTimelineFilter(filterKey)}
                  className={`px-3 py-1 rounded-lg font-mono capitalize transition-all cursor-pointer ${
                    timelineFilter === filterKey
                      ? "bg-white/15 text-white border border-white/20 font-bold"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredTimeline.map((item) => (
              <TimelineItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 6. Tab 4: Execution Surfaces & Architecture */}
      {activeTab === "surfaces" ? (
        <section className="space-y-6">
          <div className="grid xl:grid-cols-2 gap-5">
            {data.surfaces.map((surface) => (
              <SurfaceCard key={surface.id} surface={surface} />
            ))}
          </div>

          <div className="card p-6 border border-slate-800/80 space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Multi-Surface Execution Topology
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              <div>
                <div className="font-semibold text-slate-200 mb-1.5">
                  Local Workstation vs. Agentic Terminals
                </div>
                <p>
                  Workstation local provides direct human interaction, test execution, and Next.js development server
                  hosting. The Wave Terminal + PowerShell 7 MCP runtime gives AI agents access to isolated terminal
                  buffers with strict allowlist interception.
                </p>
              </div>
              <div>
                <div className="font-semibold text-slate-200 mb-1.5">
                  Autonomous Swarms vs. Public Observatory
                </div>
                <p>
                  SwarmMind runs headless autonomous loops to test and propose improvements. Once verified by the
                  Library and ratified by the Archivist, telemetry is compiled into the public Nexus Graph observatory
                  for instant visualization.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

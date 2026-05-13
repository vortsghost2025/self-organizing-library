"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import type {
  SystemPulseData,
  SystemPulseLane,
  SystemPulseSurface,
  SystemPulseTimelineItem,
} from "@/lib/system-pulse-public";

type TabId = "pulse" | "lanes" | "timeline" | "surfaces";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "pulse", label: "System Pulse" },
  { id: "lanes", label: "Lanes" },
  { id: "timeline", label: "Timeline / Journal" },
  { id: "surfaces", label: "Gastown / Surfaces" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
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
  if (!timestamp) {
    return "No timestamp";
  }

  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return timestamp;
  }

  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">
        {label}
      </div>
      <div className="text-3xl font-semibold text-[var(--text-primary)] mb-1">
        {value}
      </div>
      <div className="text-sm text-[var(--text-secondary)]">{hint}</div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[tone] || STATUS_STYLES.info}`}
    >
      {label}
    </span>
  );
}

function LaneCard({ lane }: { lane: SystemPulseLane }) {
  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {lane.label}
            </h3>
            <Badge label={lane.health} tone={lane.health} />
            <Badge label={lane.type} tone={lane.type} />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{lane.role}</p>
        </div>
        <div className="text-right text-xs text-[var(--text-muted)]">
          <div>Surface: {lane.surface}</div>
          <div>Changed: {lane.changed}</div>
          {lane.head ? <div>Head: {lane.head}</div> : null}
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
        {lane.whatItDoes}
      </p>
      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
        {lane.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
        <span>Updated {formatTimestamp(lane.lastUpdated)}</span>
        {lane.dirty ? <span>Dirty count: {lane.dirty}</span> : null}
      </div>
    </article>
  );
}

function SurfaceCard({ surface }: { surface: SystemPulseSurface }) {
  return (
    <article className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {surface.label}
        </h3>
        <Badge label={surface.status} tone={surface.status} />
      </div>
      <p className="text-sm text-[var(--text-primary)] mb-3 leading-relaxed">
        {surface.summary}
      </p>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {surface.description}
      </p>
    </article>
  );
}

function TimelineItem({ item }: { item: SystemPulseTimelineItem }) {
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {item.title}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge
              label={item.surface}
              tone={item.surface === "headless" ? "code" : "info"}
            />
            <Badge
              label={item.type}
              tone={item.type === "coordination" ? "agent" : "info"}
            />
          </div>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {formatTimestamp(item.timestamp)}
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {item.summary}
      </p>
    </article>
  );
}

export function SystemPulseClient() {
  const [data, setData] = useState<SystemPulseData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("pulse");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetchWithRetry("/api/system-pulse", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`System Pulse request failed with ${response.status}`);
        }

        const payload = (await response.json()) as SystemPulseData;
        if (!mounted) {
          return;
        }

        setData(payload);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Unable to load System Pulse.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(load, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const allClear = useMemo(
    () => (data?.blockers.length || 0) === 0,
    [data],
  );

  if (loading && !data) {
    return (
      <div className="card p-6 text-[var(--text-secondary)]">
        Loading System Pulse…
      </div>
    );
  }

  if (error && !data) {
    return <div className="card p-6 text-rose-200">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)] mb-2">
              {data.title}
            </div>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-3">
              Public progress across lanes, surfaces, and governance history
            </h1>
            <p className="text-[var(--text-secondary)] max-w-[75ch] leading-relaxed">
              {data.summary}
            </p>
          </div>
          <div className="text-sm text-[var(--text-muted)] text-right">
            <div>Updated {formatTimestamp(data.generatedAt)}</div>
            <div>Auto-refresh every 30 seconds</div>
          </div>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 mb-6 ${allClear ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}
        >
          <div
            className={`text-xs uppercase tracking-[0.2em] mb-2 ${allClear ? "text-emerald-300" : "text-amber-200"}`}
          >
            {allClear ? "All Clear" : "Needs Attention"}
          </div>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {data.focus}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <StatCard
            label="Lanes"
            value={data.stats.totalLanes}
            hint="Governance identities shown as-is"
          />
          <StatCard
            label="Headless Active"
            value={data.stats.activeHeadless}
            hint="Remote autonomous loops currently active"
          />
          <StatCard
            label="Blocked"
            value={data.stats.blockedHeadless}
            hint="Headless lanes needing attention"
          />
          <StatCard
            label="Timeline"
            value={data.stats.timelineEvents}
            hint="Recent public activity items in this view"
          />
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${selected ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </section>

      {activeTab === "pulse" ? (
        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                Current blockers
              </h2>
              {data.blockers.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No blocked or down lanes are visible in the current public-safe
                  snapshot.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.blockers.map((blocker) => (
                    <div
                      key={blocker.lane}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {blocker.lane}
                        </span>
                        <Badge label={blocker.type} tone={blocker.type} />
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {blocker.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                Recent lane changes
              </h2>
              {data.recentChanges.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No lane deltas were detected between the latest visible
                  snapshots.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentChanges.map((change) => (
                    <div
                      key={change.lane}
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {change.lane}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                          {change.changed}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {change.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              What this page is showing
            </h2>
            <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                This route is intentionally separate from the main dashboard. It
                can evolve into a richer public monitor without cluttering the
                orientation flow on the homepage.
              </p>
              <p>
                It keeps the real lane names, but it strips local machine paths,
                host details, and raw operator traces before rendering anything
                publicly.
              </p>
              <p>
                The view combines three layers of evidence: live headless
                supervision when the control-plane artifacts are mounted, local
                heartbeat signals when they exist, and repository-native
                governance history that always ships with the site.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "lanes" ? (
        <section className="grid xl:grid-cols-2 gap-6">
          {data.lanes.map((lane) => (
            <LaneCard key={lane.id} lane={lane} />
          ))}
        </section>
      ) : null}

      {activeTab === "timeline" ? (
        <section className="space-y-4">
          {data.timeline.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
        </section>
      ) : null}

      {activeTab === "surfaces" ? (
        <section className="space-y-6">
          <div className="grid xl:grid-cols-2 gap-6">
            {data.surfaces.map((surface) => (
              <SurfaceCard key={surface.id} surface={surface} />
            ))}
          </div>

          <div className="card p-5">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              How the surfaces differ
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              <div>
                <div className="font-semibold text-[var(--text-primary)] mb-2">
                  Local vs headless
                </div>
                <p>
                  Local is where direct workstation edits, short verification
                  loops, and manual supervision happen. Headless is where the
                  autonomous lane loops keep going when the workstation is
                  disconnected.
                </p>
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)] mb-2">
                  Gastown vs control plane
                </div>
                <p>
                  Gastown is the coordination layer across rigs and lanes. The
                  control plane is the operator tooling that turns that
                  coordination into dashboards, journals, and emergency views
                  people can actually read.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

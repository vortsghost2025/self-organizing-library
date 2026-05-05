"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TimelineEvent } from "@/lib/system-timeline";

const TYPE_COLORS: Record<string, string> = {
  governance: "border-[var(--primary)]",
  graph: "border-[var(--success)]",
  contradiction: "border-[var(--error)]",
  deployment: "border-[var(--warning)]",
  verification: "border-[var(--accent)]",
};

const ACCESS_LABELS: Record<TimelineEvent['evidence'][0]['access'], string> = {
  public_url: '🌐 Public',
  repo_path: '📁 Repo',
  local_path: '💻 Local',
  generated_metadata: '📄 Metadata',
};

export default function SystemEvolution() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/system-timeline?limit=30")
      .then(r => r.json())
      .then(data => {
        if (data.success) setEvents(data.events);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? events
    : events.filter(e => e.type === filter || e.lane === filter);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="card p-6 mb-8 animate-fade-in" aria-label="System evolution timeline">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">System Evolution</h2>
        <span className="text-xs text-[var(--text-muted)]">Recent governance & state-change events</span>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all','governance','graph','contradiction','deployment','verification'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filter === t
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading timeline…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No events match current filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(ev => (
            <div
              key={ev.id}
              className={`border-l-4 ${TYPE_COLORS[ev.type] || 'border-gray'} p-4 bg-[var(--surface-tertiary)] rounded-r-lg cursor-pointer transition-colors hover:bg-opacity-80`}
              onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[var(--text-muted)]">{formatDate(ev.timestamp)}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-secondary)]">{ev.lane}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-secondary)]">{ev.type}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{ev.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{ev.description}</p>
                </div>
                <div className="text-[var(--text-muted)]">{expanded === ev.id ? '▼' : '▶'}</div>
              </div>

              {expanded === ev.id && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] grid md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-semibold mb-2">Evidence</div>
                    {ev.evidence.map((item, i) => (
                      <div key={i} className="mb-1 flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          background: item.access === 'local_path' ? 'var(--warning)' :
                                     item.access === 'public_url' ? 'var(--success)' :
                                     item.access === 'repo_path' ? 'var(--primary)' : 'var(--text-muted)',
                          color: ['local_path','public_url','repo_path'].includes(item.access) ? '#000' : 'inherit'
                        }}>
                          {ACCESS_LABELS[item.access]}
                        </span>
                        <Link href={item.href} target="_blank" className="text-[var(--primary)] hover:underline font-mono truncate block">
                          {item.href}
                        </Link>
                      </div>
                    ))}
                  </div>
                  {ev.graphSnapshotPath && (
                    <div>
                      <div className="font-semibold mb-2">Graph snapshot</div>
                      <Link
                        href={`/evidence/graph-snapshots/${ev.graphSnapshotPath}`}
                        target="_blank"
                        className="text-[var(--success)] hover:underline font-mono"
                      >
                        {ev.graphSnapshotPath}
                      </Link>
                      <p className="mt-1 text-[var(--text-muted)]">
                        Download JSON and explore in Nexus Graph (future: inline replay)
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <div className="font-semibold mb-1">Raw metadata</div>
                    <pre className="bg-[var(--surface)] p-2 rounded overflow-x-auto text-[10px] text-[var(--text-muted)]">
                      {JSON.stringify(ev.raw, null, 2).slice(0, 500)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Events are extracted from timestamped artifacts in <code className="px-1 py-0.5 bg-[var(--surface)] rounded">lanes/broadcast/</code>, <code className="px-1 py-0.5 bg-[var(--surface)] rounded">evidence/graph-snapshots/</code>, <code className="px-1 py-0.5 bg-[var(--surface)] rounded">evidence/verification/</code>, and <code className="px-1 py-0.5 bg-[var(--surface)] rounded">lanes/library/state/</code>.
        Evidence paths are classified by accessibility: <span className="text-[var(--success)]">🌐 Public</span> (URL), <span className="text-[var(--primary)]">📁 Repo</span> (in-repo path), <span className="text-[var(--warning)]">💻 Local</span> (machine-specific path like <code>S:/...</code>), <span className="text-[var(--text-muted)]">📄 Metadata</span> (generated).
        Graph snapshots can be downloaded and replayed in the Nexus Graph (future feature).
      </p>
    </section>
  );
}

"use client";

import type { Cluster } from "@/lib/graph-types";

interface ClusterSelectorProps {
  clusters: Cluster[];
  activeClusterId: string | null;
  onSelect: (id: string | null) => void;
}

export default function ClusterSelector({ clusters, activeClusterId, onSelect }: ClusterSelectorProps) {
  const repos = clusters.filter((c) => c.kind === "repo");
  const tags = clusters.filter((c) => c.kind === "tag").sort((a, b) => b.nodeIds.length - a.nodeIds.length).slice(0, 15);

  return (
    <div className="space-y-3" role="group" aria-label="Cluster selector">
      <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">Clusters</h3>
      <div className="space-y-1" role="group" aria-label="Repository clusters">
        <h4 className="text-xs text-[var(--text-secondary)] px-3">Repositories</h4>
        {repos.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(activeClusterId === c.id ? null : c.id)}
            aria-pressed={activeClusterId === c.id}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 ${
              activeClusterId === c.id
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} aria-hidden="true" />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="text-xs text-[var(--text-muted)]">{c.nodeIds.length}</span>
          </button>
        ))}
      </div>
      <div className="space-y-1" role="group" aria-label="Tag group clusters">
        <h4 className="text-xs text-[var(--text-secondary)] px-3">Tag Groups (10+)</h4>
        {tags.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(activeClusterId === c.id ? null : c.id)}
            aria-pressed={activeClusterId === c.id}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1 ${
              activeClusterId === c.id
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} aria-hidden="true" />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="text-xs text-[var(--text-muted)]">{c.nodeIds.length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

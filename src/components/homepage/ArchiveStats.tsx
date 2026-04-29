"use client";

import { getStats } from "@/lib/site-index";

export function ArchiveStats() {
  const stats = getStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12" role="region" aria-label="Archive statistics">
      <div className="card p-4 text-center animate-fade-in stagger-1" role="status">
        <div className="text-2xl font-bold text-[var(--primary)]">{stats.totalFiles.toLocaleString()}</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">Documents</div>
      </div>
      <div className="card p-4 text-center animate-fade-in stagger-2" role="status">
        <div className="text-2xl font-bold text-[var(--secondary)]">{stats.tagCount}</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">Tags</div>
      </div>
      <div className="card p-4 text-center animate-fade-in stagger-3" role="status">
        <div className="text-2xl font-bold text-[var(--success)]">{stats.categoryCount}</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">Categories</div>
      </div>
      <div className="card p-4 text-center animate-fade-in stagger-4" role="status">
        <div className="text-2xl font-bold text-[var(--warning)]">4</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">Lanes</div>
      </div>
    </div>
  );
}
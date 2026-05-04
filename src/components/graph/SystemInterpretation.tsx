"use client";

type ViewModeLabel = "CONTRADICTION HUB" | "TRUSTED CORE" | "FULL SYSTEM";

interface SystemInterpretationProps {
  className?: string;
  viewModeLabel: ViewModeLabel;
  visibleNodeCount: number;
  conflictedCount: number;
  quarantinedCount: number;
  verifiedCount: number;
  primaryInstability: { title: string; contradictionCount: number } | null;
  loading?: boolean;
}

export default function SystemInterpretation({
  className,
  viewModeLabel,
  visibleNodeCount,
  conflictedCount,
  quarantinedCount,
  verifiedCount,
  primaryInstability,
  loading = false,
}: SystemInterpretationProps) {
  const modeDescription = viewModeLabel === "CONTRADICTION HUB"
    ? "This view shows unresolved items only; the verified core is stable."
    : viewModeLabel === "TRUSTED CORE"
    ? "This view shows the verified core with no active contradictions."
    : "This is the full system state.";

  return (
    <section className={`card p-4 mb-4 animate-fade-in ${className || ""}`} role="status" aria-live="polite">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Live System State</h2>
      <div className="grid grid-cols-4 gap-4 mb-3">
        <div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{loading ? "..." : visibleNodeCount}</div>
          <div className="text-sm text-[var(--text-muted)]">Total Nodes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[var(--error)]">{loading ? "..." : conflictedCount}</div>
          <div className="text-sm text-[var(--text-muted)]">Active Contradictions</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[var(--warning)]">{loading ? "..." : quarantinedCount}</div>
          <div className="text-sm text-[var(--text-muted)]">Quarantined</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[var(--success)]">{loading ? "..." : verifiedCount}</div>
          <div className="text-sm text-[var(--text-muted)]">Verified</div>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Current focus: <strong>{loading ? "Loading..." : primaryInstability ? primaryInstability.title : "No active instability"}</strong>
        {!loading && primaryInstability ? ` (${primaryInstability.contradictionCount} contradictions — highest priority)` : ''}.
        {!loading ? ` ${modeDescription}` : ''}
      </p>
    </section>
  );
}

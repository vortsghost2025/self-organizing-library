"use client";

type ViewModeLabel = "CONTRADICTION HUB" | "TRUSTED CORE" | "FULL SYSTEM";

interface SystemInterpretationProps {
  className?: string;
  viewModeLabel: ViewModeLabel;
  isFiltered: boolean;
  visibleNodeCount: number;
  conflictedCount: number;
  quarantinedCount: number;
  primaryInstability: { title: string; contradictionCount: number } | null;
  loading?: boolean;
}

export default function SystemInterpretation({
  className,
  viewModeLabel,
  isFiltered,
  visibleNodeCount,
  conflictedCount,
  quarantinedCount,
  primaryInstability,
  loading = false,
}: SystemInterpretationProps) {
  const filterLine = isFiltered
    ? "This is a filtered diagnostic view, not the full system."
    : "This is the full system view with no active graph filter.";

  const interpretation =
    viewModeLabel === "CONTRADICTION HUB"
      ? "This view shows what the system has not yet resolved. It does not mean the entire system has zero verified truth."
      : "This interpretation explains only the visible graph state at this moment and should be read with mode context.";

  return (
    <section className={`card p-4 mb-4 animate-fade-in ${className || ""}`} role="status" aria-live="polite">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-3">Live System State / Interpretation</h3>
      <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">VIEW MODE: {viewModeLabel}</p>
      <p className="text-sm text-[var(--text-primary)] mb-2">{filterLine}</p>
      <p className="text-sm text-[var(--text-primary)] mb-3">The system is currently resolving contradictions in its governance/library layer.</p>

      <p className="text-sm font-medium text-[var(--text-primary)]">Visible concepts:</p>
      <ul className="text-sm text-[var(--text-primary)] mb-3">
        <li>- {loading ? "Loading..." : `${visibleNodeCount} nodes`}</li>
        <li>- {loading ? "Loading..." : `${conflictedCount} conflicted`}</li>
        <li>- {loading ? "Loading..." : `${quarantinedCount} quarantined`}</li>
      </ul>

      <p className="text-sm font-medium text-[var(--text-primary)]">Primary instability:</p>
      <p className="text-sm text-[var(--text-primary)] mb-3">
        {loading ? "Loading..." : primaryInstability ? `${primaryInstability.title} (${primaryInstability.contradictionCount} contradictions)` : "None (0 contradictions)"}
      </p>

      <p className="text-sm font-medium text-[var(--text-primary)]">Interpretation:</p>
      <p className="text-sm text-[var(--text-primary)]">{interpretation}</p>
    </section>
  );
}

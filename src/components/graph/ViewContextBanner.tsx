"use client";

interface ViewContextBannerProps {
  mode: "understand" | "explore" | "full";
  visibleCount: number;
  totalNodes: number;
  statusCounts: Record<string, number>;
  focusNodeTitle?: string | null;
  filterLabel?: string | null;
}

export default function ViewContextBanner({
  mode,
  visibleCount,
  totalNodes,
  statusCounts,
  focusNodeTitle,
  filterLabel,
}: ViewContextBannerProps) {
  const verified = statusCounts.VERIFIED || 0;
  const contradictions = statusCounts.CONFLICTED || 0;
  const quarantined = statusCounts.QUARANTINED || 0;
  const unverified = statusCounts.UNVERIFIED || 0;

  // Determine what's hidden in current mode
  const hiddenCategories: string[] = [];
  if (mode === "understand") {
    if (unverified > 0) hiddenCategories.push(`${unverified} unverified`);
    if (contradictions > 0) hiddenCategories.push(`${contradictions} contradictions`);
    if (quarantined > 0) hiddenCategories.push(`${quarantined} quarantined`);
  }

  // Compute plain-language mode description
  const modeDescriptions: Record<string, { title: string; explanation: string; suggestion: string }> = {
    understand: {
      title: "Verified Core",
      explanation: `You are viewing ${verified} verified node${verified === 1 ? '' : 's'}${focusNodeTitle ? ` focused around "${focusNodeTitle}"` : ''}.`,
      suggestion: hiddenCategories.length > 0
        ? `Switch to "Contradictions & Quarantine" to see ${hiddenCategories.join(' and ')}.`
        : "This is the fully verified foundation. Switch to 'Full Lens' to inspect the broader dataset.",
    },
    explore: {
      title: "Contradictions & Quarantine",
      explanation: `You are viewing unresolved issues: ${contradictions} contradiction${contradictions === 1 ? '' : 's'} and ${quarantined} quarantined node${quarantined === 1 ? '' : 's'}.`,
      suggestion: "Click a red node to see what evidence conflicts. Switch to 'Verified Core' to see the trusted foundation.",
    },
    full: {
      title: "Full Lens",
      explanation: `You are viewing all ${totalNodes} nodes across all repositories, including ${verified} verified, ${unverified} unverified, ${contradictions} contradictions, and ${quarantined} quarantined.`,
      suggestion: "This comprehensive view is dense. Use filters or switch to 'Verified Core' for a clearer starting point.",
    },
  };

  const info = modeDescriptions[mode];

  return (
    <div className="card p-4 mb-4 animate-fade-in" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-0.5" aria-hidden="true">🧭</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[var(--text-primary)]">You are viewing:</span>
            <span className="px-2 py-0.5 rounded bg-[var(--primary)] text-white text-sm font-medium">{info.title}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {info.explanation} {info.suggestion}
          </p>
          {(mode === "understand" && (contradictions === 0)) && (
            <p className="text-sm text-[var(--text-muted)] mb-1">
              0 active contradictions in this filtered view. Snapshot diffs may report historical contradiction counts — those describe transition events between saved snapshots, not the current live graph state.
            </p>
          )}
          {filterLabel && (
            <p className="text-sm text-[var(--text-muted)]">
              Active filter: <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--surface)]">{filterLabel}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

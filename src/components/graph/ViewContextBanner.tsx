"use client";

interface ViewContextBannerProps {
  mode: "understand" | "explore" | "full";
  visibleCount: number;
  totalNodes: number;
  statusCounts: Record<string, number>;
  focusNodeTitle?: string | null;
  filterLabel?: string | null;
  activePresetLabel?: string | null;
}

export default function ViewContextBanner({
  mode,
  visibleCount,
  totalNodes,
  statusCounts,
  focusNodeTitle,
  filterLabel,
  activePresetLabel,
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

  const isContradictionFilter = filterLabel?.toLowerCase().includes("contradict") || filterLabel?.toLowerCase().includes("conflict");

  // Compute plain-language mode description
  const modeDescriptions: Record<string, { title: string; explanation: string; suggestion: string }> = {
    understand: {
      title: "Canonical Architecture Backbone",
      explanation: `You are viewing ${visibleCount} landmark governance and architecture nodes across sovereign lanes${focusNodeTitle ? ` focused around "${focusNodeTitle}"` : ''}.`,
      suggestion: "Click any node to isolate its 1-hop neighborhood, or switch to 'Explore' to see active proposals and artifacts.",
    },
    explore: {
      title: isContradictionFilter ? "Contradictions & Quarantine" : "Subsystem Expansion View",
      explanation: isContradictionFilter
        ? `You are viewing unresolved issues: ${contradictions} contradiction${contradictions === 1 ? '' : 's'} and ${quarantined} quarantined node${quarantined === 1 ? '' : 's'}.`
        : `You are viewing ${visibleCount} nodes including active proposals, ratifications, and evidence chains.`,
      suggestion: isContradictionFilter
        ? "Click a red node to inspect conflicting evidence and affected systems."
        : "Click any node to isolate its 1-hop dependency graph, or switch to 'Full' to inspect the entire dataset.",
    },
    full: {
      title: "Full Knowledge Graph",
      explanation: `You are viewing all ${visibleCount} nodes across all repositories, including ${verified} verified, ${unverified} unverified, and ${contradictions} contradictions.`,
      suggestion: "This comprehensive view is dense. Use search or cluster selectors to drill into specific domains.",
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
            <span className="px-2.5 py-0.5 rounded bg-[var(--primary)] text-white text-xs font-semibold tracking-wide uppercase">{info.title}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            {info.explanation} {info.suggestion}
          </p>
          {filterLabel && (
            <p className="text-[11px] text-[var(--text-muted)] pt-0.5">
              Active Scope: <span className="font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300">{filterLabel}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

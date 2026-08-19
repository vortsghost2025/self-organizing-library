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

  return (
    <div
      className="card p-4 rounded-xl bg-[#141924] border border-white/10 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3.5">
        <div className="text-2xl mt-0.5" aria-hidden="true">
          🧭
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[var(--text-primary)]">
              Architecture Lens:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-xs font-semibold tracking-wide">
              {activePresetLabel || (mode === "understand" ? "Verified Architecture Core" : mode === "explore" ? "Conflict & Contradiction Lens" : "Full Global Graph")}
            </span>
            {focusNodeTitle && (
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-xs font-medium">
                Focused: {focusNodeTitle}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {focusNodeTitle ? (
              <>
                Displaying the isolated neighborhood for <strong className="text-slate-200">{focusNodeTitle}</strong> and its direct connections. Click "Reset Focus" or another node to explore other subsystems.
              </>
            ) : (
              <>
                Displaying <strong className="text-slate-200">{visibleCount}</strong> active architectural nodes across the 4 sovereign governance lanes. All state transitions, agent proposals, and runtime policies are deterministically verifiable.
              </>
            )}
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

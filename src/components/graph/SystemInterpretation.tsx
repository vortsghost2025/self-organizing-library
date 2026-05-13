"use client";

import { useEffect } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useCountUp } from "@/lib/useCountUp";

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
  const ref = useScrollReveal<HTMLElement>();
  const [nodesRef, startNodes] = useCountUp<HTMLSpanElement>(visibleNodeCount, 800);
  const [conflictRef, startConflict] = useCountUp<HTMLSpanElement>(conflictedCount, 800);
  const [quarantineRef, startQuarantine] = useCountUp<HTMLSpanElement>(quarantinedCount, 800);
  const [verifyRef, startVerify] = useCountUp<HTMLSpanElement>(verifiedCount, 800);

  useEffect(() => {
    const el = ref.current;
    if (!el || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startNodes();
          startConflict();
          startQuarantine();
          startVerify();
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => { observer.unobserve(el); };
  }, [loading, startNodes, startConflict, startQuarantine, startVerify, ref]);

  const modeDescription = viewModeLabel === "CONTRADICTION HUB"
    ? "This view shows unresolved items only; the verified core is stable."
    : viewModeLabel === "TRUSTED CORE"
    ? "This view shows the verified core with no active contradictions."
    : "This is the full system state.";

  const lastUpdated = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <section ref={ref} className={`card p-4 mb-4 ${className || ""}`} data-revealed role="status" aria-live="polite">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Live System State</h2>
        <span className="text-sm text-[var(--text-muted)]" title="Last graph data refresh">
          Updated {lastUpdated}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-3">
        <div>
          <span ref={nodesRef} className="text-2xl font-bold text-[var(--text-primary)] count-up">{loading ? "..." : "0"}</span>
          <div className="text-sm text-[var(--text-muted)]">Total Nodes</div>
        </div>
        <div>
          <span ref={conflictRef} className="text-2xl font-bold text-[var(--error)] count-up">{loading ? "..." : "0"}</span>
          <div className="text-sm text-[var(--text-muted)]">Active Contradictions</div>
          <div className="text-sm text-[var(--text-muted)]">in current filtered view</div>
        </div>
        <div>
          <span ref={quarantineRef} className="text-2xl font-bold text-[var(--warning)] count-up">{loading ? "..." : "0"}</span>
          <div className="text-sm text-[var(--text-muted)]">Quarantined</div>
        </div>
        <div>
          <span ref={verifyRef} className="text-2xl font-bold text-[var(--success)] count-up">{loading ? "..." : "0"}</span>
          <div className="text-sm text-[var(--text-muted)]">Verified</div>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Current focus: <strong>{loading ? "Loading..." : primaryInstability ? primaryInstability.title : "No active instability"}</strong>
        {!loading && primaryInstability ? ` (${primaryInstability.contradictionCount} contradictions — highest priority)` : ''}.
        {!loading ? ` ${modeDescription}` : ''}
        {!loading && viewModeLabel === "TRUSTED CORE" ? ' Historical snapshot diffs may report higher contradiction counts — those describe transition events between saved snapshots, not the current live view.' : ''}
      </p>
    </section>
  );
}

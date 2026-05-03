"use client";

import { useEffect, useState } from "react";

interface GraphNode {
  id: string;
  title: string;
  status: "UNVERIFIED" | "VERIFIED" | "CONFLICTED" | "QUARANTINED";
  contradictionCount: number;
  verificationCount: number;
  authorityDepth: number;
}

interface SystemInterpretationProps {
  className?: string;
}

export default function SystemInterpretation({ className }: SystemInterpretationProps) {
  const [summary, setSummary] = useState<string>("Loading system state...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/graph-data");
        if (!res.ok) throw new Error("Failed to fetch graph data");
        const { nodes }: { nodes: GraphNode[] } = await res.json();

        const verified = nodes.filter((n) => n.status === "VERIFIED");
        const unverified = nodes.filter((n) => n.status === "UNVERIFIED");
        const conflicted = nodes.filter((n) => n.status === "CONFLICTED");

        // Determine primary instability (highest contradictionCount node)
        const sortedByContradictions = [...nodes].sort((a, b) => b.contradictionCount - a.contradictionCount);
        const topContradictionNode = sortedByContradictions[0];

        // Build plain-English summary (max 4 lines)
        const lines: string[] = [];

        if (verified.length === 0) {
          lines.push("The system is currently forming its truth model.");
        } else if (conflicted.length > 0) {
          lines.push("The system is stabilizing core concepts under conflict.");
        } else {
          lines.push("The system is maintaining verified knowledge.");
        }

        if (topContradictionNode && topContradictionNode.contradictionCount > 0) {
          lines.push(`Primary instability: ${topContradictionNode.title} (${topContradictionNode.contradictionCount} contradictions).`);
        }

        if (conflicted.length > 0) {
          lines.push(`${conflicted.length} area${conflicted.length === 1 ? '' : 's'} of active conflict.`);
        }

        if (unverified.length > 0) {
          lines.push(`${unverified.length} unverified foundation${unverified.length === 1 ? '' : 's'} need review.`);
        }

        if (lines.length === 0) {
          lines.push("System state is stable and fully verified.");
        }

         setSummary(lines.slice(0, 4).join(" "));
      } catch (e) {
        setError("Unable to load system state.");
        setSummary("System state unavailable.");
      }
    }

    load();
  }, []);

  return (
    <div className={`card p-4 mb-4 animate-fade-in ${className || ""}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">🧠</span>
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1">
            Live System State
          </h3>
          {error ? (
            <p className="text-sm text-[var(--text-muted)]">{summary}</p>
          ) : (
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

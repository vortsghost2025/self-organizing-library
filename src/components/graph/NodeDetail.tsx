"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { GraphNode } from "@/lib/graph-types";
import { TYPE_COLORS, STATUS_COLORS, GOVERNANCE_LAYER_COLORS, GOVERNANCE_LAYER_LABELS, BRIDGE_STATE_COLORS, BRIDGE_STATE_LABELS } from "@/lib/graph-types";

interface NodeDetailProps {
  node: GraphNode;
  interactionMode: "focus" | "path" | "entry";
  focusedNodeId: string | null;
  pathSource: string | null;
  pathTarget: string | null;
  onFocusNode: (id: string) => void;
  onTracePath: (id: string) => void;
  onClose: () => void;
}

export default function NodeDetail({
  node,
  interactionMode,
  focusedNodeId,
  pathSource,
  pathTarget,
  onFocusNode,
  onTracePath,
  onClose,
}: NodeDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
      if (first) first.focus();
    }
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [node.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    if (e.key === "Tab" && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 md:relative md:inset-auto md:w-80 md:flex-shrink-0 z-30 md:z-auto max-h-[60vh] md:max-h-none overflow-y-auto border-t md:border-t-0 bg-[var(--bg-surface)] md:bg-transparent" role="complementary" aria-label="Node details panel">
      <div className="card p-5 sticky top-8" ref={panelRef} onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[node.type] || TYPE_COLORS.doc }}
            aria-hidden="true"
          />
        <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          {node.type}
        </span>
        <span
          className="text-sm px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: (STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED) + "22",
              color: STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED,
            }}
          >
            {node.status}
          </span>
       {interactionMode === "focus" && node.id === focusedNodeId && (
         <span className="text-sm px-1.5 py-0.5 rounded bg-[var(--primary)] text-white">Focused</span>
       )}
      {interactionMode === "path" && (node.id === pathSource || node.id === pathTarget) && (
        <span className="text-sm px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
              {node.id === pathSource ? "Source" : "Target"}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 leading-snug">
          {node.title}
        </h2>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Category</span>
            <span className="text-[var(--text-secondary)]">{node.category || "\u2014"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Repo</span>
            <span className="text-[var(--text-secondary)]">{node.repo.replace(/-/g, " ") || "\u2014"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Connections</span>
            <span className="text-[var(--text-secondary)]">{node.connectionCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Verifications</span>
            <span className="text-[var(--text-secondary)]" style={{ color: node.verificationCount > 0 ? STATUS_COLORS.VERIFIED : undefined }}>{node.verificationCount}</span>
          </div>
        {node.contradictionCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)]">Contradictions</span>
            <span style={{ color: STATUS_COLORS.CONFLICTED }}>{node.contradictionCount}</span>
          </div>
        )}
        {node.contradictionCount >= 39 && (
          <div className="mt-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-300" role="note">
            This node is part of a large tag group where contradictions arise from pairwise sampling, not direct cross-reference conflicts. See audit docs for details.
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Governance Layer</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: GOVERNANCE_LAYER_COLORS[node.governanceLayer] || GOVERNANCE_LAYER_COLORS.unknown }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">{GOVERNANCE_LAYER_LABELS[node.governanceLayer] || "Unknown"}</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Bridge State</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: BRIDGE_STATE_COLORS[node.bridgeState] || BRIDGE_STATE_COLORS.unknown }} aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">{BRIDGE_STATE_LABELS[node.bridgeState] || "Unknown"}</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-muted)]">Authority Depth</span>
          <span className="text-[var(--text-secondary)]">{node.authorityDepth}</span>
        </div>
        </div>

        {node.tags.length > 0 && (
          <div className="mb-4">
        <span className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Tags</span>
        <div className="flex gap-1 flex-wrap">
          {node.tags.slice(0, 8).map((tag) => (
            <span key={tag} className="text-sm px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary-text)]">
              {tag}
            </span>
          ))}
          {node.tags.length > 8 && (
            <span className="text-sm px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                  +{node.tags.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

      <div className="space-y-2">
        <Link
          href={"/library/" + node.id}
          className="block w-full text-center px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1"
        >
          View Document
        </Link>
        <button
          onClick={() => onFocusNode(node.id)}
          className="block w-full text-center px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1"
        >
          Focus on Node
        </button>
        {interactionMode === "path" && (
          <button
            onClick={() => onTracePath(node.id)}
            className="block w-full text-center px-4 py-2 rounded-lg border border-amber-500/40 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1"
          >
            Trace Path From Here
          </button>
        )}
        </div>
      </div>
    </aside>
  );
}

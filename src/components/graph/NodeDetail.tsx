"use client";

import Link from "next/link";
import type { GraphNode } from "@/lib/graph-types";
import { TYPE_COLORS, STATUS_COLORS } from "@/lib/graph-types";

interface NodeDetailProps {
  node: GraphNode;
  interactionMode: "focus" | "path" | "entry";
  focusedNodeId: string | null;
  pathSource: string | null;
  pathTarget: string | null;
  onFocusNode: (id: string) => void;
  onTracePath: (id: string) => void;
}

export default function NodeDetail({
  node,
  interactionMode,
  focusedNodeId,
  pathSource,
  pathTarget,
  onFocusNode,
  onTracePath,
}: NodeDetailProps) {
  return (
    <aside className="w-80 flex-shrink-0" role="complementary" aria-label="Node details panel">
      <div className="card p-5 sticky top-8">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[node.type] || TYPE_COLORS.doc }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {node.type}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: (STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED) + "22",
              color: STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED,
            }}
          >
            {node.status}
          </span>
          {interactionMode === "focus" && node.id === focusedNodeId && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--primary)]/20 text-[var(--primary)]">Focused</span>
          )}
          {interactionMode === "path" && (node.id === pathSource || node.id === pathTarget) && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
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
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Contradictions</span>
              <span style={{ color: STATUS_COLORS.CONFLICTED }}>{node.contradictionCount}</span>
            </div>
          )}
        </div>

        {node.tags.length > 0 && (
          <div className="mb-4">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Tags</span>
            <div className="flex gap-1 flex-wrap">
              {node.tags.slice(0, 8).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                  {tag}
                </span>
              ))}
              {node.tags.length > 8 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                  +{node.tags.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href={`/library/${node.id}`}
            className="block w-full text-center px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            View Document
          </Link>
          <button
            onClick={() => onFocusNode(node.id)}
            className="block w-full text-center px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            Focus on Node
          </button>
          {interactionMode === "path" && (
            <button
              onClick={() => onTracePath(node.id)}
              className="block w-full text-center px-4 py-2 rounded-lg border border-amber-500/40 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              Trace Path From Here
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

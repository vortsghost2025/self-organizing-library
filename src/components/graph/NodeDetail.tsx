"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { GraphNode } from "@/lib/graph-types";
import {
  TYPE_COLORS,
  STATUS_COLORS,
  GOVERNANCE_LAYER_COLORS,
  GOVERNANCE_LAYER_LABELS,
  BRIDGE_STATE_COLORS,
  BRIDGE_STATE_LABELS,
} from "@/lib/graph-types";
import { getRepositoryByName } from "@/lib/repo-registry";

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

const LANE_AUTHORITY_MAP: Record<string, { label: string; auth: number; color: string }> = {
  archivist: { label: "Archivist Lane", auth: 100, color: "#8b5cf6" },
  swarmmind: { label: "SwarmMind Lane", auth: 80, color: "#38bdf8" },
  kernel: { label: "Kernel Lane", auth: 70, color: "#f59e0b" },
  library: { label: "Library Lane", auth: 60, color: "#10b981" },
};

function getLaneForRepo(repoName: string) {
  const norm = repoName.toLowerCase();
  if (norm.includes("archivist")) return LANE_AUTHORITY_MAP.archivist;
  if (norm.includes("swarmmind")) return LANE_AUTHORITY_MAP.swarmmind;
  if (norm.includes("kernel")) return LANE_AUTHORITY_MAP.kernel;
  if (norm.includes("library") || norm.includes("self-organizing")) return LANE_AUTHORITY_MAP.library;
  return null;
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

  const repoRecord = getRepositoryByName(node.repo);
  const laneInfo = getLaneForRepo(node.repo);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
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
  };

  return (
    <aside
      className="w-full text-left"
      role="complementary"
      aria-label="Node architecture details panel"
    >
      <div className="space-y-4" ref={panelRef} onKeyDown={handleKeyDown}>
        {/* Header & Close */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[node.type] || TYPE_COLORS.doc }}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {node.type}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor: (STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED) + "22",
                color: STATUS_COLORS[node.status] || STATUS_COLORS.UNVERIFIED,
              }}
            >
              {node.status}
            </span>
            {laneInfo && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold"
                style={{ backgroundColor: `${laneInfo.color}22`, color: laneInfo.color }}
              >
                {laneInfo.label} • Auth {laneInfo.auth}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close detail panel"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Node Title */}
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight mb-1">
            {node.title}
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            ID: {node.id} • Repo: {node.repo}
          </p>
        </div>

        {/* Repository Context if available */}
        {repoRecord && (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[#38BDF8]">{repoRecord.public_site_class} PROJECT</span>
              <span className="text-[var(--text-muted)]">{repoRecord.ownership_class.replace(/_/g, " ")}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {repoRecord.portfolio_summary || repoRecord.description}
            </p>
            {repoRecord.system_role && (
              <div className="text-[11px] text-[var(--text-muted)]">
                <span className="text-slate-300 font-medium">System Role: </span>
                {repoRecord.system_role}
              </div>
            )}
          </div>
        )}

        {/* Architectural Properties Grid */}
        <div className="space-y-2 text-xs divide-y divide-white/5 pt-1">
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Category</span>
            <span className="text-[var(--text-secondary)] font-medium">{node.category || "—"}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Network Connections</span>
            <span className="text-[var(--text-secondary)] font-mono">{node.connectionCount}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Verification Proofs</span>
            <span
              className="font-mono font-medium"
              style={{ color: node.verificationCount > 0 ? STATUS_COLORS.VERIFIED : undefined }}
            >
              {node.verificationCount}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Governance Layer</span>
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: GOVERNANCE_LAYER_COLORS[node.governanceLayer] || GOVERNANCE_LAYER_COLORS.unknown }}
                aria-hidden="true"
              />
              <span>{GOVERNANCE_LAYER_LABELS[node.governanceLayer] || "Standard"}</span>
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Bridge State</span>
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: BRIDGE_STATE_COLORS[node.bridgeState] || BRIDGE_STATE_COLORS.unknown }}
                aria-hidden="true"
              />
              <span>{BRIDGE_STATE_LABELS[node.bridgeState] || "Internal"}</span>
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--text-muted)]">Authority Depth</span>
            <span className="text-[var(--text-secondary)] font-mono">{node.authorityDepth}</span>
          </div>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
              Architectural Tags
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {node.tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary-text)] font-mono"
                >
                  {tag}
                </span>
              ))}
              {node.tags.length > 8 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] font-mono">
                  +{node.tags.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action & Evidence Links */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/library/${node.id}`}
              className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium text-center hover:bg-[var(--primary)]/90 transition-colors"
            >
              View Document →
            </Link>
            <button
              onClick={() => onFocusNode(node.id)}
              className="px-3 py-2 rounded-lg border border-white/15 text-xs text-[var(--text-secondary)] text-center hover:bg-white/5 hover:text-white transition-colors"
            >
              {node.id === focusedNodeId ? "Reset Focus" : "Focus Node"}
            </button>
          </div>

          {repoRecord && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href={`/repos?tab=all&selected=${repoRecord.name}`}
                className="px-3 py-2 rounded-lg border border-white/10 text-xs text-[var(--text-secondary)] text-center hover:border-[var(--primary)] hover:text-white transition-colors"
              >
                Project Catalog
              </Link>
              <a
                href={repoRecord.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-white/10 text-xs text-[#38BDF8] text-center hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 transition-colors"
              >
                GitHub Code ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

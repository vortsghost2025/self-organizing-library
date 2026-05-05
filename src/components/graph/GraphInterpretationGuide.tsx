"use client";

interface GraphInterpretationGuideProps {
  mode: "understand" | "explore" | "full";
  visibleCount: number;
  totalNodes: number;
  statusCounts: Record<string, number>;
  isFiltered: boolean;
  filterLabel?: string | null;
}

export default function GraphInterpretationGuide({
  mode,
  visibleCount,
  totalNodes,
  statusCounts,
  isFiltered,
  filterLabel,
}: GraphInterpretationGuideProps) {
  const coreVerified = statusCounts.VERIFIED || 0;
  const contradictions = statusCounts.CONFLICTED || 0;
  const quarantined = statusCounts.QUARANTINED || 0;
  const unverified = statusCounts.UNVERIFIED || 0;

  const modeExplanations: Record<string, {
    title: string;
    lead: string;
    tip: string;
    hiddenNote?: string;
  }> = {
    understand: {
      title: "Verified Core",
      lead: `This view shows ${coreVerified} verified node${coreVerified === 1 ? '' : 's'} — the trusted foundation of the system.`,
      tip: "Start with the largest green nodes; they carry the most authority.",
      hiddenNote: unverified > 0 || contradictions > 0 || quarantined > 0
        ? `Unverified nodes (${unverified}), contradictions (${contradictions}), and quarantined items (${quarantined}) are hidden in this view. Switch to "Contradictions & Quarantine" or "Everything Indexed" to see them.`
        : undefined,
    },
    explore: {
      title: "Contradictions & Quarantine",
      lead: `This view surfaces ${contradictions} contradiction${contradictions === 1 ? '' : 's'} and ${quarantined} quarantined node${quarantined === 1 ? '' : 's'} — issues the system has flagged.`,
      tip: "Click a red node to inspect conflicting evidence and resolution path.",
      hiddenNote: undefined,
    },
    full: {
      title: "Everything Indexed",
      lead: `This view shows all ${totalNodes} nodes across all repositories, with all statuses visible.`,
      tip: "This is dense — use filters, search, and meaning-layer toggles to navigate.",
      hiddenNote: undefined,
    },
  };

  const info = modeExplanations[mode];

  return (
    <div className="card p-5 animate-fade-in" role="complementary" aria-label="How to read this graph">
      <div className="flex items-start gap-4">
        <div className="text-4xl" aria-hidden="true">🧭</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            {info.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {info.lead} {info.tip}
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <div className="font-semibold mb-2">Color legend</div>
              <ul className="space-y-1 text-[var(--text-secondary)]">
                <li><span className="inline-block w-3 h-3 rounded-full bg-[#22C55E] mr-2" aria-hidden="true" />Green = Verified</li>
                <li><span className="inline-block w-3 h-3 rounded-full bg-[#EF4444] mr-2" aria-hidden="true" />Red = Contradicted</li>
                <li><span className="inline-block w-3 h-3 rounded-full bg-[#F59E0B] mr-2" aria-hidden="true" />Yellow = Quarantined</li>
                <li><span className="inline-block w-3 h-3 rounded-full bg-[#6B7280] mr-2" aria-hidden="true" />Gray = Unverified</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Size & edges</div>
              <ul className="space-y-1 text-[var(--text-secondary)]">
                <li>• Larger nodes have more authority/connections</li>
                <li>• Blue edges are authority (VERIFIES, DERIVES_FROM)</li>
                <li>• Faint gray edges show general co-occurrence</li>
                <li>• Click any node to see provenance details</li>
              </ul>
            </div>
          </div>

          {info.hiddenNote && (
            <div className="mb-3 p-3 bg-[var(--warning)]/10 border-l-4 border-[var(--warning)] rounded-r text-sm">
              <span className="font-medium">⚠️ Note: </span>
              {info.hiddenNote}
            </div>
          )}

          {isFiltered && filterLabel && (
            <p className="text-xs text-[var(--text-muted)]">
              Active filter: <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--surface)]">{filterLabel}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

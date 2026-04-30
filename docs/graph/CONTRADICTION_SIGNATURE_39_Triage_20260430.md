# CONTRADICTION_SIGNATURE_39 Triaged Decision Table

**Snapshot:** `graph-snapshot-2026-04-30-04-08-52-186.json` (2026‑04‑30)

| Rank | Node ID | Title | ConnectionCount | VerificationCount | Current Status | Provisional Classification | Rationale |
|------|---------|-------|----------------|------------------|----------------|----------------------------|----------|
| 1 | `e2d590843468dbe7` | Quick Lookup Index | 364 | 0 | CONFLICTED | needs_lane_review | Highest connectivity; systematic 39 contradictions likely propagate widely.
| 2 | `f536c15cc2486eea` | Implementation Compass | 358 | 0 | CONFLICTED | needs_lane_review | Very high degree, spanning many tags; edge lineage not inspected yet.
| 3 | `3023460d99160a03` | paper1 | 278 | 0 | CONFLICTED | needs_lane_review | Significant connectivity; likely part of paper cluster.
| 4 | `b69a4f0162fc2f23` | Autonomous Constitutional Enforcement — Next Evolution Plan | 362 | 33 | CONFLICTED | needs_lane_review | High verification count but still conflicted; suggests unresolved contradictions.
| 5 | `1d846649979dcec1` | USERDRIFTSCORING.md | 96 | 0 | CONFLICTED | needs_lane_review | Core governance doc; contradictions may affect drift scoring.
| 6 | `45d50e60309ef11c` | LIBRARY MAP EXTRACTION: RECOVERY ASSUMPTIONS | 222 | 0 | CONFLICTED | needs_lane_review | Medium connectivity; potential mapping artifact.
| 7 | `8f11fb5f4a3a5efc` | LIBRARY MAP ANALYSIS: COMPLETE AUTHORITY CHAIN | 294 | 0 | CONFLICTED | needs_lane_review | High connectivity within library mapping; likely systematic.
| 8 | `a88504c97e8f2e4f` | COVENANT.md — Values (What We Believe) | 321 | 0 | CONFLICTED | needs_lane_review | Core covenant document; contradictions may be structural.
| 9 | `65fb533da2a76f09` | pre compaction validation buffer | 108 | 0 | CONFLICTED | needs_lane_review | Validation buffer; contradictions may be false‑positive.
| 10 | `b6a19d32a8604205` | Paper F Continuation Draft: Dual‑Agent Overlap Guardrail | 96 | 0 | CONFLICTED | needs_lane_review | Low verification, but still 39 contradictions.
| 11 | `477f6d60614778ea` | Green State Runbook | 186 | 0 | CONFLICTED | needs_lane_review | Operational runbook; edge lineage to review.
| 12 | `044d760a04bbfa30` | 🧠 What the Previous Reviewer Got WRONG (The “Lies”) | 94 | 0 | CONFLICTED | needs_lane_review | Commentary document; possible tag‑group artifact.
| 13 | `fb8212e128adc1c5` | APR15 | 135 | 0 | CONFLICTED | needs_lane_review | Date‑specific doc; contradictions may be lineage‑specific.
| 14 | `e0e603e85e1972ea` | THE SINGLE ENTRY POINT | 356 | 0 | CONFLICTED | needs_lane_review | Central governance file; contradictions likely structural.
| 15 | `1bda9962fbd5ca75` | Paper Outline: When AI Systems Lie About Their Own State | 323 | 0 | CONFLICTED | needs_lane_review | Outline document; high connectivity.
| 16 | `d52d670ab9d41169` | VERIFICATION CHECKPOINT SYSTEM | 180 | 0 | CONFLICTED | needs_lane_review | Verification framework; contradictions impact checks.
| 17 | `f11bae9816e77556` | LANEMESSAGEINDEX.md | 108 | 0 | CONFLICTED | needs_lane_review | Index file; low verification.

## Methodology
- Extracted all 17 nodes with `status: "CONFLICTED"` and `contradictionCount: 39` from the snapshot.
- Pulled `connectionCount` and `verificationCount` fields for impact weighting.
- provisional classification set to **needs_lane_review** because a full lineage audit of the 39 incoming `CONTRADICTS` edges per node is required to determine if they are spurious artifacts or genuine semantic conflicts.
- Nodes are ranked by **connectionCount** (higher indicates broader impact) and, where equal, by presence of any verification activity.

## Next Steps (Suggested)
1. For each node, enumerate its incoming `CONTRADICTS` edges from the `edges` array in the snapshot.
2. Inspect edge sources: assess whether the contradiction is semantically valid or arises from automated tag‑matching.
3. Classify each node as:
   - **proven_spurious** – all contradictory edges are deemed false positives.
   - **needs_lane_review** – at least one edge represents a genuine conflict requiring lane‑level attention.
4. Update this decision table with final classifications and any required remediation actions (e.g., tag adjustments, document revisions, or lane‑wide policy updates).

**Scope:** Read‑only audit; no modifications to graph data or mapper rules are performed.

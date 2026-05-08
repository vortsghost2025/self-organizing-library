# Agent Web Review Brief

_Generated: 2026-05-08T06:09:53.215Z_

Start here. Do not open raw graph snapshots first.

## What this website is
A public evidence surface for a multi-lane constitutional AI governance system. It displays:
- Governance rules and their enforcement state
- Verification status of claims and documents
- Contradiction analysis and quarantine queues
- Agent coordination and execution evidence

## What to inspect first
1. **Homepage explanation** — Is the core idea clear in <10 seconds?
2. **Graph controls** — Do filter, mode, layer toggles work?
3. **Graph counters** — Do node/edge counts seem plausible?
4. **Repo-filter behavior** — Are cross-lane edges preserved?
5. **Contradiction/quarantine displays** — Are problem nodes visible?
6. **Accessibility cues** — Color, shape, labels for all user abilities

## Known current graph issue
Repo-filtered views may show nodes but zero edges because strict both-endpoint filtering hides cross-lane relationships. We now include neighbor nodes and preserve edges where at least one endpoint belongs to the filtered repo. Agents should still verify edge visibility when filter is active.

## Do not do
- Do NOT claim system correctness from visual density alone.
- Do NOT inspect 30k-line graph JSON directly; use GRAPH_ANALYSIS_PACKETS.
- Do NOT make governance decisions without cross-referencing source documents.
- Do NOT generalize from one filter mode; test multiple views.

## Using the packets
- Read `data/graph-analysis-packets.json` for concise graph summaries (counts, top nodes, anomalies, interpretation, next checks).
- Read `data/website-section-index.json` for per-route metadata (purpose, audience, claims, known confusions, review instructions, source file pointers).
- Cross-reference top nodes with their source files for ground truth.

## Lane division of labor

| Lane | Role | Primary files | Authority |
|------|------|---------------|-----------|
| **Library** | Packet-first review | `docs/AGENT_WEB_REVIEW_BRIEF.md`, `data/graph-analysis-packets.json`, `data/graph-packet-schema.json` | Verify packet fields; distinguish verified facts vs known bugs vs proposed fixes vs accepted fixes. Do NOT inspect raw graph JSON unless escalation justified. |
| **Archivist** | Ratification & taxonomy | `docs/AGENT_WEB_REVIEW_BRIEF.md`, `data/graph-analysis-packets.json` | P0 accepted as READY_FOR_REVIEW. Packet workflow is canonical review surface for /graph until superseded. Ratification wording, status taxonomy, accepted-fix criteria. Do NOT rewrite UI or graph generation. |
| **SwarmMind** | Heuristics & proposals | `data/graph-analysis-packets.json`, `data/website-section-index.json`, `docs/AGENT_WEB_REVIEW_BRIEF.md` | Propose smarter agent review prompts, identify packet blind spots, suggest optional P1 refinements. Proposals are NOT accepted fixes. |
| **Kernel** | Workflow enforcement | `docs/AGENT_WEB_REVIEW_BRIEF.md`, `data/graph-packet-schema.json` | Ensure agents start from packet files; block raw graph JSON access unless explicitly escalated; preserve separation between review state and mutation authority. |

One-line for headless agents: **Review /graph from packet files first, not raw graph JSON. Start with AGENT_WEB_REVIEW_BRIEF.md, graph-analysis-packets.json, website-section-index.json, and graph-packet-schema.json. Separate verified facts, known bugs, proposed fixes, fixes in progress, and accepted fixes. Do not claim acceptance without verification.**

## Known packet gaps (Archivist validation 2026-05-08)

- per_repo only contains kernel-lane — missing archivist, swarmmind, library repos
- claim_status: 1 known_bug (contradictionCount=39 tag-grouping artifact), 0 fixes_in_progress, 0 accepted_fixes
- All website sections have status: needs-indexed-review (none reviewed yet)
- Source snapshot is 8 days old (2026-04-30), no newer snapshot available

## Review workflow
1. Load latest packet from `data/graph-analysis-packets.json` (per_snapshot[0]).
2. Load website section index from `data/website-section-index.json`.
3. Scan anomalies — if any present, investigate those first.
4. Check top nodes by connectionCount for hub risks.
5. Review per_repo balance: any repo completely disconnected?
6. For each website section, follow agent_review_instructions from the section index.
7. Validate next_checks against live UI.
8. Report findings with evidence paths, not impressions.
9. Route findings to the correct lane per division of labor above.

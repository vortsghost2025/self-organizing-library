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

## Review workflow
1. Load latest packet from `data/graph-analysis-packets.json` (per_snapshot[0]).
2. Load website section index from `data/website-section-index.json`.
3. Scan anomalies — if any present, investigate those first.
4. Check top nodes by connectionCount for hub risks.
5. Review per_repo balance: any repo completely disconnected?
6. For each website section, follow agent_review_instructions from the section index.
7. Validate next_checks against live UI.
8. Report findings with evidence paths, not impressions.

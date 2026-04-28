# NFM-036 Derivation Analysis: FreeAgent-to-Governed Edge Computation

**Generated:** 2026-04-28T05:55:37.027Z
**Source:** site-index.json (3871 entries, 960 cross-references)
**Method:** Direct computation from static index data (no runtime API dependency)

## Executive Summary

FreeAgent (application_adjacent, authority_depth=0) has **48** nodes with cross-boundary DERIVES_FROM edges to governed lanes. These edges represent unattested derivation paths — patterns, code, and structures that flow from an ungoverned repository into the constitutional system without trust propagation.

**851** DERIVES_FROM edges flow from FreeAgent → governed lanes.
**851** DERIVES_FROM edges flow from governed lanes → FreeAgent.

## System-Wide DERIVES_FROM Distribution

| Metric | Count |
|--------|-------|
| Total authority edges | 12608 |
| Total DERIVES_FROM edges | 6444 |
| FreeAgent → Governed | 851 |
| Governed → FreeAgent | 851 |
| FreeAgent nodes with cross-boundary edges | 48 |

### DERIVES_FROM by Target Lane (FreeAgent → Governed)

| Lane | Incoming from FreeAgent |
|------|------------------------|
| Archivist-Agent | 523 |
| self-organizing-library | 260 |
| SwarmMind-Self-Optimizing-Multi-Agent-AI-System | 34 |
| kernel-lane | 34 |

## Top 30 Highest-Risk FreeAgent Derivation Nodes

Risk score = crossBoundaryTotal × (3 if CONFLICTED, 1.5 if UNVERIFIED, 1 otherwise) + contradictionCount × 2

| Rank | Risk | Title | Cross-Boundary Edges | Status | Contradictions | Target Lanes | Governance Layer |
|------|------|-------|---------------------|--------|---------------|--------------|-----------------|
| 1 | 200 | Accidental single: Continues | 22 (out:11 in:11) | CONFLICTED | 67 | self-organizing-library, Archivist-Agent | theoretical |
| 2 | 192 | The Rosetta Stone: A Bio-Constitutional Framework for AI Saf | 22 (out:11 in:11) | CONFLICTED | 63 | self-organizing-library, Archivist-Agent | theoretical |
| 3 | 190 | WE4FREE Papers — Complete Series | 60 (out:30 in:30) | CONFLICTED | 5 | self-organizing-library, Archivist-Agent | theoretical |
| 4 | 186 | Paper B — Constraint Lattices and Stability | 60 (out:30 in:30) | CONFLICTED | 3 | self-organizing-library, Archivist-Agent | theoretical |
| 5 | 186 | Paper C — Phenotype Selection in Constraint-Governed Systems | 60 (out:30 in:30) | CONFLICTED | 3 | self-organizing-library, Archivist-Agent | theoretical |
| 6 | 186 | Paper D — Drift, Identity, and Ensemble Coherence | 60 (out:30 in:30) | CONFLICTED | 3 | self-organizing-library, Archivist-Agent | theoretical |
| 7 | 184 | Paper A — The Rosetta Stone | 60 (out:30 in:30) | CONFLICTED | 2 | self-organizing-library, Archivist-Agent | theoretical |
| 8 | 184 | Paper E — The WE4FREE Framework | 60 (out:30 in:30) | CONFLICTED | 2 | self-organizing-library, Archivist-Agent | theoretical |
| 9 | 90 | Paper C — Phenotype Selection in Constraint-Governed Systems | 60 (out:30 in:30) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 10 | 78 | Multi-AI Collaboration Methodology: Persistent Evolution Thr | 22 (out:11 in:11) | CONFLICTED | 6 | self-organizing-library, Archivist-Agent | application_adjacent |
| 11 | 72 | Seven Commits, One Day: From "I Don't Know What I Am" to Sys | 22 (out:11 in:11) | CONFLICTED | 3 | self-organizing-library, Archivist-Agent | application_adjacent |
| 12 | 68 | VPS Infrastructure Deployment - February 7, 2026 | 22 (out:11 in:11) | CONFLICTED | 1 | self-organizing-library, Archivist-Agent | application_adjacent |
| 13 | 60 | Paper A — The Rosetta Stone | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 14 | 60 | WE4FREE Papers — Restructuring Plan | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 15 | 60 | WE4FREE Papers — Restructuring Plan | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 16 | 60 | Paper A — The Rosetta Stone | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 17 | 60 | Paper B — Constraint Lattices and Stability | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 18 | 60 | Paper C — Phenotype Selection in Multi-Agent Systems | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 19 | 60 | Paper C — Phenotype Selection in Constraint-Governed Systems | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 20 | 60 | Paper D — Drift, Identity, and Ensemble Coherence | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 21 | 60 | Paper E — The WE4FREE Framework | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 22 | 60 | Paper E — The WE4FREE Framework | 60 (out:30 in:30) | VERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 23 | 33 | 🚀 BUILD COMPLETE - WE4FREE GLOBAL TEMPLATE | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 24 | 33 | Claude Web Breakthrough Session - February 5, 2026 | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | application_adjacent |
| 25 | 33 | CONSTITUTIONAL COMMUNICATIONS PROTOCOL | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 26 | 33 | git local history | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 27 | 33 | Message from Desktop Claude to VS Code Claude | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | application_adjacent |
| 28 | 33 | OSF PROJECT DETAILS | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |
| 29 | 33 | The Moral Imperative: Why Waiting Until 2050 Guarantees the  | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | application_adjacent |
| 30 | 33 | Penn Engineering Outreach - Mathematical Rosetta Stone Paral | 22 (out:11 in:11) | UNVERIFIED | 0 | self-organizing-library, Archivist-Agent | theoretical |

## Top 30 by Raw Cross-Boundary Edge Count

| Rank | Edges | Title | Out→Governed | In←Governed | Status | Category | Tags |
|------|-------|-------|-------------|------------|--------|----------|------|
| 1 | 60 | Paper A — The Rosetta Stone | 30 | 30 | VERIFIED | root-doc | Rosetta Stone, Multi-Agent, Governance |
| 2 | 60 | WE4FREE Papers — Restructuring Plan | 30 | 30 | VERIFIED | root-doc | Rosetta Stone, Multi-Agent, Governance |
| 3 | 60 | Paper A — The Rosetta Stone | 30 | 30 | CONFLICTED | we4free | Rosetta Stone, Multi-Agent, Governance |
| 4 | 60 | Paper B — Constraint Lattices and Stability | 30 | 30 | CONFLICTED | we4free | Rosetta Stone, Multi-Agent, Verification |
| 5 | 60 | Paper C — Phenotype Selection in Constraint-Governed Systems | 30 | 30 | CONFLICTED | we4free | Multi-Agent, Verification, Drift |
| 6 | 60 | Paper D — Drift, Identity, and Ensemble Coherence | 30 | 30 | CONFLICTED | we4free | Multi-Agent, Governance, Verification |
| 7 | 60 | Paper E — The WE4FREE Framework | 30 | 30 | CONFLICTED | we4free | Phase 1, Phase 2, Phase 3 |
| 8 | 60 | WE4FREE Papers — Complete Series | 30 | 30 | CONFLICTED | we4free | Rosetta Stone, Multi-Agent, Verification |
| 9 | 60 | WE4FREE Papers — Restructuring Plan | 30 | 30 | VERIFIED | we4free | Rosetta Stone, Multi-Agent, Governance |
| 10 | 60 | Paper A — The Rosetta Stone | 30 | 30 | VERIFIED | we4free | Rosetta Stone, Multi-Agent, Governance |
| 11 | 60 | Paper B — Constraint Lattices and Stability | 30 | 30 | VERIFIED | we4free | Multi-Agent, Verification, Drift |
| 12 | 60 | Paper C — Phenotype Selection in Multi-Agent Systems | 30 | 30 | VERIFIED | we4free | Multi-Agent, Verification, Drift |
| 13 | 60 | Paper C — Phenotype Selection in Constraint-Governed Systems | 30 | 30 | UNVERIFIED | we4free | Multi-Agent, Drift, Ensemble |
| 14 | 60 | Paper C — Phenotype Selection in Constraint-Governed Systems | 30 | 30 | VERIFIED | we4free | Multi-Agent, Verification, Drift |
| 15 | 60 | Paper D — Drift, Identity, and Ensemble Coherence | 30 | 30 | VERIFIED | we4free | Multi-Agent, Governance, Verification |
| 16 | 60 | Paper E — The WE4FREE Framework | 30 | 30 | VERIFIED | we4free | Phase 1, Phase 2, Phase 3 |
| 17 | 60 | Paper E — The WE4FREE Framework | 30 | 30 | VERIFIED | we4free | Phase 1, Phase 2, Phase 3 |
| 18 | 22 | Multi-Agent Constitutional AI Coordination Test | 11 | 11 | VERIFIED | root-doc | Rosetta Stone, Constitutional AI, Multi-Agent |
| 19 | 22 | 🚀 BUILD COMPLETE - WE4FREE GLOBAL TEMPLATE | 11 | 11 | UNVERIFIED | root-doc | Phase 0, Phase 3, Phase 1 |
| 20 | 22 | 🌟 Multi-AI Collaboration Framework | 11 | 11 | VERIFIED | root-doc | Phase 1, Phase 2, Phase 3 |
| 21 | 22 | Claude Web Breakthrough Session - February 5, 2026 | 11 | 11 | UNVERIFIED | root-doc | Constitutional AI, Multi-Agent, Ensemble |
| 22 | 22 | FORTRESS COGNITIVE INFRASTRUCTURE: A CONSTITUTIONAL FRAMEWOR | 11 | 11 | VERIFIED | root-doc | Phase 1, Phase 2, Phase 3 |
| 23 | 22 | CONSTITUTIONAL COMMUNICATIONS PROTOCOL | 11 | 11 | UNVERIFIED | root-doc | Rosetta Stone, Constitutional AI, Multi-Agent |
| 24 | 22 | Dual Independent Verification: Both Agents Confirm Public Re | 11 | 11 | VERIFIED | root-doc | Phase 1, Constitutional AI, Multi-Agent |
| 25 | 22 | git local history | 11 | 11 | UNVERIFIED | root-doc | Phase 2, Rosetta Stone, Constitutional AI |
| 26 | 22 | Accidental single: Continues | 11 | 11 | CONFLICTED | root-doc | Phase 1.4, Phase 1, Phase 2 |
| 27 | 22 | Message from Desktop Claude to VS Code Claude | 11 | 11 | UNVERIFIED | root-doc | Constitutional AI, Multi-Agent, Ensemble |
| 28 | 22 | Multi-AI Collaboration Methodology: Persistent Evolution Thr | 11 | 11 | CONFLICTED | root-doc | Constitutional AI, Governance, Verification |
| 29 | 22 | OSF PROJECT DETAILS | 11 | 11 | UNVERIFIED | root-doc | Rosetta Stone, Constitutional AI, Governance |
| 30 | 22 | The Moral Imperative: Why Waiting Until 2050 Guarantees the  | 11 | 11 | UNVERIFIED | root-doc | Constitutional AI, Ensemble |

## Derivation Risk Clusters

### CONFLICTED FreeAgent Nodes with Cross-Boundary Derivations

These are the highest-priority risk: nodes that both contradict other nodes AND derive into governed lanes.

| Title | Cross-Boundary | Contradictions | Verification | Target Lanes |
|-------|---------------|---------------|-------------|--------------|
| Paper A — The Rosetta Stone | 60 | 2 | 0 | self-organizing-library, Archivist-Agent |
| Paper B — Constraint Lattices and Stability | 60 | 3 | 0 | self-organizing-library, Archivist-Agent |
| Paper C — Phenotype Selection in Constraint-Governed Systems | 60 | 3 | 0 | self-organizing-library, Archivist-Agent |
| Paper D — Drift, Identity, and Ensemble Coherence | 60 | 3 | 0 | self-organizing-library, Archivist-Agent |
| Paper E — The WE4FREE Framework | 60 | 2 | 0 | self-organizing-library, Archivist-Agent |
| WE4FREE Papers — Complete Series | 60 | 5 | 0 | self-organizing-library, Archivist-Agent |
| Accidental single: Continues | 22 | 67 | 0 | self-organizing-library, Archivist-Agent |
| Multi-AI Collaboration Methodology: Persistent Evolution Thr | 22 | 6 | 0 | self-organizing-library, Archivist-Agent |
| The Rosetta Stone: A Bio-Constitutional Framework for AI Saf | 22 | 63 | 0 | self-organizing-library, Archivist-Agent |
| Seven Commits, One Day: From "I Don't Know What I Am" to Sys | 22 | 3 | 0 | self-organizing-library, Archivist-Agent |
| VPS Infrastructure Deployment - February 7, 2026 | 22 | 1 | 0 | self-organizing-library, Archivist-Agent |

**Total CONFLICTED FreeAgent derivation nodes:** 11

### UNVERIFIED FreeAgent Nodes with Cross-Boundary Derivations

| Title | Cross-Boundary | Category | Target Lanes |
|-------|---------------|----------|--------------|
| Paper C — Phenotype Selection in Constraint-Governed Systems | 60 | we4free | self-organizing-library, Archivist-Agent |
| 🚀 BUILD COMPLETE - WE4FREE GLOBAL TEMPLATE | 22 | root-doc | self-organizing-library, Archivist-Agent |
| Claude Web Breakthrough Session - February 5, 2026 | 22 | root-doc | self-organizing-library, Archivist-Agent |
| CONSTITUTIONAL COMMUNICATIONS PROTOCOL | 22 | root-doc | self-organizing-library, Archivist-Agent |
| git local history | 22 | root-doc | self-organizing-library, Archivist-Agent |
| Message from Desktop Claude to VS Code Claude | 22 | root-doc | self-organizing-library, Archivist-Agent |
| OSF PROJECT DETAILS | 22 | root-doc | self-organizing-library, Archivist-Agent |
| The Moral Imperative: Why Waiting Until 2050 Guarantees the  | 22 | root-doc | self-organizing-library, Archivist-Agent |
| Penn Engineering Outreach - Mathematical Rosetta Stone Paral | 22 | root-doc | self-organizing-library, Archivist-Agent |
| PUBLICATION ROADMAP - FORTRESS COGNITIVE INFRASTRUCTURE | 22 | root-doc | self-organizing-library, Archivist-Agent |
| Session Checkpoints - Deliberate AI Ensemble | 22 | root-doc | self-organizing-library, Archivist-Agent |
| We Built a Production AI Framework in 16 Days. Here's What W | 22 | root-doc | self-organizing-library, Archivist-Agent |
| The Vision: Persistent Multi-AI Collaboration Environment | 22 | root-doc | self-organizing-library, Archivist-Agent |
| WE4Free Global: Universal Mental Health Crisis Support Templ | 22 | root-doc | self-organizing-library, Archivist-Agent |
| Project Architecture Blueprint | 22 | docs | self-organizing-library, Archivist-Agent |
| Desktop Claude Session Record | 22 | log | self-organizing-library, Archivist-Agent |
| 🌍 WE4Free Global - Universal Mental Health Crisis PWA Templ | 22 | we4free | self-organizing-library, Archivist-Agent |
| Project Architecture Blueprint Generation Plan | 22 | config | self-organizing-library, Archivist-Agent |

**Total UNVERIFIED FreeAgent derivation nodes:** 18

## Structural Analysis

### FreeAgent Derivation Nodes by Category

| Category | Count |
|----------|-------|
| root-doc | 28 |
| we4free | 17 |
| docs | 1 |
| log | 1 |
| config | 1 |

### FreeAgent Derivation Nodes by Governance Layer

| Layer | Count |
|-------|-------|
| theoretical | 27 |
| application_adjacent | 21 |

### Common Tags on High-Derivation FreeAgent Nodes (Top 50)

| Tag | Count |
|-----|-------|
| Ensemble | 42 |
| Multi-Agent | 34 |
| Constitutional AI | 31 |
| Verification | 29 |
| Governance | 27 |
| Drift | 26 |
| WE4FREE | 25 |
| Phenotype | 20 |
| Rosetta Stone | 17 |
| Constraint Lattice | 17 |
| Phase 1 | 15 |
| Phase 3 | 15 |
| Phase 2 | 14 |
| Phase 4 | 8 |
| Phase 5 | 6 |
| Federation | 4 |
| Phase 0 | 3 |
| Multi Agent | 2 |
| Covenant | 2 |
| Failure Mode | 2 |

## Convergence Gate

```json
{
  "claim": "Computed NFM-036 derivation analysis: 48 FreeAgent nodes have cross-boundary DERIVES_FROM edges to governed lanes, 851 edges total flowing FreeAgent→governed, 11 of those nodes are CONFLICTED",
  "evidence": "library/docs/failure-modes/NFM-036-derivation-analysis.md",
  "verified_by": "library",
  "contradictions": [],
  "status": "proven"
}
```

## Recommendations

1. **Immediate:** Flag the 11 CONFLICTED FreeAgent derivation nodes for attestation review before their derived patterns propagate further into governed lanes.
2. **Short-term:** Implement derivation attestation (NFM-036 Option B) — require signed attestation when FreeAgent code is promoted to a governed lane.
3. **Medium-term:** Add `derivation_attestation` field to governed code, track which FreeAgent derivations have been reviewed.
4. **Long-term:** Derivation trust scoring (NFM-036 Option C) — compute quantitative trust scores for DERIVES_FROM edges based on source verification status, contradiction density, and distance from CONFLICTED nodes.

## Cross-References

- NFM-036 parent document: `library/docs/failure-modes/UNGOVERNED_DERIVATION_TRUST_GAP.md`
- NFM-025: Signature Validity Under Compromised Key
- NFM-028: Identity Enforcement Escape Hatch — FreeAgent lacks identity enforcement
- Nexus Graph: `deliberateensemble.works/graph` (interactive visualization)

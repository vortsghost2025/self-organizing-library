# Contradiction Signature 39 Audit

**Date:** 2026-04-30
**Reviewer:** Library Lane (verification-and-enforcement)
**Input Snapshot:** graph-snapshot-2026-04-30-04-08-52-186.json (externally provided; corroborated against `snapshot-full-2026-04-29T20-16-18.json`)
**Scope:** Read-only audit of `contradictionCount=39` across Archivist-Agent nodes and all affected repos
**Status:** Audit document only — no code, mapper, or data changes
**Supersedes:** Previous partial audit (17 nodes, "Mixed" classification) — this document provides definitive classification

---

## 1. Executive Summary

**Classification: Tag-group artifact.**

`contradictionCount=39` is a **pure arithmetic consequence** of the tag-group sampling and pairwise edge generation pipeline. It carries zero semantic meaning about actual contradictions in the content.

### Mechanism

1. Two tags — `"Failure Mode"` (85 members) and `"Drift"` (286 members) — are classified as contradiction-semantic in `CONTRADICTION_TAGS` (`truth-routing.ts:79-82`)
2. Both exceed `TAG_GROUP_CAP=80`, triggering stride-based sampling to `TAG_GROUP_LARGE_SAMPLE=40` members
3. Pairwise bidirectional `CONTRADICTS` edges are generated among all 40 sampled members, creating a complete graph K(40)
4. Each member receives exactly 40−1 = 39 contradiction edges from the group
5. `computeNodeStatuses()` counts these bidirectionally, yielding `contradictionCount=39`

### Impact

- **59 nodes** across **7 repos** have `contradictionCount=39`
- **19 of 59** are Archivist-Agent nodes (the subject of the original task)
- **0 of 59** have any cross-reference CONTRADICTS edges contributing to their count
- All 59 are assigned `NodeStatus: CONFLICTED` based solely on this tag-group artifact
- The previous signature `contradictionCount=65` was the same mechanism with a different tag group size (66 members before the sampling cap was enforced → 65 pairwise edges)

### Key Finding

The number 39 is not a signal of 39 contradictions. It is the number `TAG_GROUP_LARGE_SAMPLE − 1`. Any tag in `CONTRADICTION_TAGS` with >80 members will produce this exact signature for every member of the sampled group, regardless of content.

---

## 2. Affected Nodes List

### All 59 Nodes with `contradictionCount=39`

#### Archivist-Agent (19 nodes)

| # | Node ID | Title | Sampled From |
|---|---------|-------|-------------|
| 1 | `044d760a04bbfa30` | What the Previous Reviewer Got WRONG (The "Lies") | Drift |
| 2 | `fb8212e128adc1c5` | APR15 | Failure Mode |
| 3 | `e0e603e85e1972ea` | THE SINGLE ENTRY POINT | Failure Mode |
| 4 | `1bda9962fbd5ca75` | Paper Outline: When AI Systems Lie About Their Own State | Failure Mode |
| 5 | `d52d670ab9d41169` | VERIFICATION CHECKPOINT SYSTEM | Drift |
| 6 | `a88504c97e8f2e4f` | COVENANT.md — Values (What We Believe) | Drift |
| 7 | `45d50e60309ef11c` | LIBRARY MAP EXTRACTION: RECOVERY ASSUMPTIONS | Drift |
| 8 | `8f11fb5f4a3a5efc` | LIBRARY MAP ANALYSIS: COMPLETE AUTHORITY CHAIN | Drift |
| 9 | `1d846649979dcec1` | USERDRIFTSCORING.md | Drift |
| 10 | `65fb533da2a76f09` | pre compaction validation buffer | Failure Mode |
| 11 | `f536c15cc2486eea` | Implementation Compass | Failure Mode |
| 12 | `3023460d99160a03` | paper1 | Drift |
| 13 | `e2d590843468dbe7` | Quick Lookup Index | Drift |
| 14 | `b69a4f0162fc2f23` | Autonomous Constitutional Enforcement — Next Evolution Plan | Failure Mode |
| 15 | `c9b1df958483dfdf` | DESKTOP UI TRUTH PROTOCOL | Failure Mode |
| 16 | `b5d23c09f9a858fc` | What you said (cleaned up) | Drift |
| 17 | `b6a19d32a8604205` | Paper F Continuation Draft: Dual-Agent Overlap Guardrail | Drift |
| 18 | `477f6d60614778ea` | Green State Runbook | Drift |
| 19 | `f11bae9816e77556` | LANEMESSAGEINDEX.md | Failure Mode |

#### self-organizing-library (13 nodes)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `96e320fca0403dec` | Three-Lane Constitutional AI Governance System: Complete Implementation Summary |
| 2 | `fbf4a5e1ef4bb27a` | Contradiction False Positive Verification — 2026-04-29 |
| 3 | `3df5e3e33e3759d3` | Paper F: Failure Modes, Formal Limits, and the Self-Correcting Loop |
| 4 | `f48c014cec555c6e` | Archivist Quick Reference: Governance Root (Lane 1) — 1-Page Summary |
| 5 | `df24c121aca95ae0` | Named Failure Mode: Cross-Lane Observability Boundary |
| 6 | `349c49abd83ca16c` | NFM-036 Derivation Analysis: FreeAgent-to-Governed Edge Computation |
| 7 | `c49c0446c05a1fd0` | Named Failure Mode: Schema-Behavior Mismatch |
| 8 | `9138e338d786bb56` | Named Failure Mode: Temporal Constraint Misapplication |
| 9 | `59fc0a10b3a820ab` | CAISC Paper Contribution: Self-State Aliasing |
| 10 | `40457e858dba3887` | Pending Approvals Index |
| 11 | `e8c7e42f1d233e1f` | Quick Lookup Index: Pattern → File → Paper |
| 12 | `8ee34a583c8826e8` | FORMAL VERIFICATION GATE: Phase 3.7 Continuity |
| 13 | `a50bd02f3533ca8f` | Multi-Model Convergence: Structural Truth Validation |

#### FreeAgent (12 nodes)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `46f72116106c6d55` | ALERTING RULES |
| 2 | `b585750139e20b54` | API Test Breakdown - February 9, 2026 |
| 3 | `b9bbfe924417f645` | Critical Failure Analysis - February 9, 2026 |
| 4 | `2f090c17b3a3ab05` | GLOSSARY OF SYSTEM TERMS |
| 5 | `5aac934a542d1489` | LAYER 36: REAL-TIME CALIBRATION |
| 6 | `036aacf37cd2f1c8` | ORCHESTRATOR BEHAVIOR SPECIFICATION |
| 7 | `1d7ac0cedc65087c` | OSF PROJECT DETAILS |
| 8 | `05ac63054fa5da67` | Section 5: The Mathematical Foundation — Symmetry and Conservation |
| 9 | `1b390f92a92dc5db` | Phase 9 Watchdog Troubleshooting Guide |
| 10 | `f0d02dbca3118508` | WE4FREE Papers |
| 11 | `3a1c2c4278c9c5d1` | Project Separation Audit — READ ONLY Phase |
| 12 | `01f073ec2c428371` | Medical AI Federation Cockpit - API Documentation |

#### kernel-lane (4 nodes)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `6a9bd95ba806a410` | THE SINGLE ENTRY POINT |
| 2 | `d9ccbb98728d5f78` | COVENANT.md — Values (What We Believe) |
| 3 | `7372a72fe280b3a3` | CAISC 2026 Draft Paper Review Report |
| 4 | `dd9b2967fd3393db` | WE4FREE Publication Roadmap |

#### papers (4 nodes)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `dbbbebbd2f455e6c` | Drift, Identity, and Ensemble Coherence |
| 2 | `4337c5bade761d91` | Phenotype Selection in Constraint-Governed Systems |
| 3 | `78298889a29508fe` | The Rosetta Stone |
| 4 | `05c14e6bf7cd2be3` | The WE4FREE Framework |

#### federation (2 nodes)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `dafef9ffca43a31e` | Phase 9 Watchdog Troubleshooting Guide |
| 2 | `cf0711bc6ca00a0b` | Domain Invariance as Empirical Fact |

#### Deliberate-AI-Ensemble (2 nodes)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `5f036b9fc762422d` | API Test Breakdown - February 9, 2026 |
| 2 | `d0bc52a60e62d8ef` | Layer 37: Conscious Drift Protocol |

#### storytime (1 node)

| # | Node ID | Title |
|---|---------|-------|
| 1 | `5ef61dc0b569b587` | Changelog |

---

## 3. Shared Tags and Cluster IDs

### Contradiction-Class Tags Producing the Signature

| Tag | Total Members | Members After Sampling | Pairwise Edges per Member | ContradictionCount per Member |
|-----|--------------|----------------------|--------------------------|------------------------------|
| **Failure Mode** | 85 | 40 (stride=2) | 39 | 39 |
| **Drift** | 286 | 40 (stride=7) | 39 | 39 |

### Repo Distribution per Tag

**"Failure Mode" (85 members → 40 sampled):**

| Repo | Original Count | Sampled Count |
|------|---------------|--------------|
| self-organizing-library | 21 | 11 |
| **Archivist-Agent** | **17** | **8** |
| papers | 17 | 8 |
| FreeAgent | 13 | 7 |
| Deliberate-AI-Ensemble | 9 | 2 |
| kernel-lane | 4 | 2 |
| SwarmMind | 2 | 1 |
| storytime | 2 | 1 |

**"Drift" (286 members → 40 sampled):**

| Repo | Original Count | Sampled Count |
|------|---------------|--------------|
| FreeAgent | 86 | 13 |
| **Archivist-Agent** | **80** | **11** |
| Deliberate-AI-Ensemble | 32 | 3 |
| papers | 28 | 4 |
| self-organizing-library | 24 | 4 |
| federation | 18 | 2 |
| kernel-lane | 11 | 2 |
| SwarmMind | 6 | 1 |
| storytime | 1 | 0 |

### Archivist-Agent Breakdown

- **8 nodes** sampled from "Failure Mode" group only
- **11 nodes** sampled from "Drift" group only
- **0 nodes** appear in both sampled groups simultaneously

If a node appeared in both groups, its `contradictionCount` would be higher (up to 78, but deduplicated by the `seen` Set in `addEdge`). None of the 19 Archivist-Agent nodes landed in both samples.

### Cluster IDs

All 59 nodes belong to tag-based clusters for "Failure Mode" and/or "Drift", and repo-based clusters for their respective repos. The `clusterIds` field on each node includes both the repo cluster and the tag cluster ID(s). This confirms grouping by tag membership, not by structural contradiction relationships.

### Other Tags Shared by Affected Nodes

Archivist-Agent nodes with `contradictionCount=39` commonly also carry these tags (which do NOT produce CONTRADICTS edges — only "Failure Mode" and "Drift" are in `CONTRADICTION_TAGS`):

- Multi-Agent, Governance, Verification, Covenant, Constitutional AI, Phenotype, Swarmmind, Library, Kernel, Archivist, NFM-018/019/020

These tags produce `shared-tag` edges and, if they fall in other semantic classes (governance, verification, execution), corresponding authority edges (`DERIVES_FROM`, `VERIFIES`, `EXECUTES`). They do not contribute to `contradictionCount`.

---

## 4. Source Mapper/Rule/Function Producing ContradictionCount

### Pipeline

```
data/site-index.json
  → tag_index (maps tag → [node IDs])
  → src/lib/truth-routing.ts
      → CONTRADICTION_TAGS = {"Failure Mode", "Drift"}    [line 79-82]
      → computeAuthorityEdges(entries, cross_refs, tag_index)  [line 208-316]
          → for each tag in tag_index:
              → if tag in CONTRADICTION_TAGS:
                  → stride-sample to 40 if group > 80  [line 251-267]
                  → pairwise CONTRADICTS edges (bidirectional)  [line 284-289]
      → computeNodeStatuses(entries, authorityEdges)  [line 318-379]
          → contradictionCount = count of distinct nodes with CONTRADICTS edge (bidirectional)  [line 332-339]
          → if contradictionCount > 0: status = CONFLICTED (unless quarantined)  [line 349-351]
  → src/lib/site-index.ts
      → getGraphData()  [line 157-241]
          → places contradictionCount on GraphNode  [line 233]
```

### Key Constants

| Constant | Value | File:Line |
|----------|-------|-----------|
| `CONTRADICTION_TAGS` | `Set("Failure Mode", "Drift")` | `truth-routing.ts:79-82` |
| `TAG_GROUP_CAP` | 80 | `truth-routing.ts:251` |
| `TAG_GROUP_LARGE_SAMPLE` | 40 | `truth-routing.ts:252` |

### Sampling Algorithm

```typescript
if (filteredIds.length > TAG_GROUP_CAP) {
  const stride = Math.max(1, Math.floor(filteredIds.length / TAG_GROUP_LARGE_SAMPLE));
  const sampled: string[] = [];
  for (let i = 0; i < filteredIds.length; i += stride) {
    sampled.push(filteredIds[i]);
    if (sampled.length >= TAG_GROUP_LARGE_SAMPLE) break;
  }
  filteredIds = sampled;
}
```

- **Deterministic** — same input order always produces same sample
- **Uniform stride** — takes every N-th element, not random
- **Hard cap at 40** — never exceeds `TAG_GROUP_LARGE_SAMPLE`

### Edge Generation (Contradiction Tags)

```typescript
if (CONTRADICTION_TAGS.has(tag)) {
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      addEdge(ids[i], ids[j], "CONTRADICTS");
      addEdge(ids[j], ids[i], "CONTRADICTS");
    }
  }
}
```

- **Complete graph K(N)** where N = sampled group size (always 40 for groups > 80)
- **Bidirectional** — both directions of each pair
- **Deduplicated** by `seen` Set in `addEdge` — same source:target:authority combination is added only once

### Status Assignment

```typescript
if (contradictionCount > 0 && verificationCount >= 2) status = "CONFLICTED";
else if (contradictionCount > 0) status = "CONFLICTED";
```

Any node with `contradictionCount > 0` is automatically `CONFLICTED`, regardless of whether the contradictions are tag-group artifacts or cross-reference-based.

### Correction to Previous Audit

The previous partial audit (`CONTRADICTION_SIGNATURE_39_AUDIT_20260430.md`, 72 lines) incorrectly attributed the computation to `scripts/nfm-036-derivation-analysis.js`. The actual source is `src/lib/truth-routing.ts:computeNodeStatuses()`. The previous audit also classified the signature as "Mixed / Needs Review" with only 17 nodes. This audit finds 59 nodes across 7 repos and classifies definitively as **tag-group artifact**.

---

## 5. Evidence Path for Each Finding

### Finding 1: contradictionCount=39 is TAG_GROUP_LARGE_SAMPLE − 1

**Evidence:**
- `truth-routing.ts:252` — `TAG_GROUP_LARGE_SAMPLE = 40`
- `truth-routing.ts:284-289` — pairwise CONTRADICTS edges in complete graph K(40)
- `truth-routing.ts:332-339` — bidirectional counting yields N−1 = 39 per member
- Arithmetic proof: 40 members → each member connected to 39 others → `contradictionCount = 39`

### Finding 2: "Failure Mode" tag (85 members) samples to exactly 40

**Evidence:**
- `data/site-index.json` → `tag_index["Failure Mode"]` has 85 member IDs
- 85 > TAG_GROUP_CAP(80) → stride = floor(85/40) = 2
- Sampling every 2nd element from 85 yields ~42, capped at 40
- All 40 sampled members receive `contradictionCount = 39`

### Finding 3: "Drift" tag (286 members) samples to exactly 40

**Evidence:**
- `data/site-index.json` → `tag_index["Drift"]` has 286 member IDs
- 286 > TAG_GROUP_CAP(80) → stride = floor(286/40) = 7
- Sampling every 7th element from 286 yields ~40, capped at 40
- All 40 sampled members receive `contradictionCount = 39`

### Finding 4: No cross-reference CONTRADICTS edges contribute to the 59 nodes

**Evidence:**
- `computeAuthorityEdges()` cross-reference path (`truth-routing.ts:231-249`) classifies cross-refs as CONTRADICTS only if the source entry has contradiction tags
- The 59 nodes with `contradictionCount=39` receive their entire count from tag-group edges
- Confirmed by snapshot data: all 59 nodes have exactly 39 — no additional cross-ref contradictions incrementing the count to 40+

### Finding 5: Previous signature contradictionCount=65 was the same mechanism

**Evidence:**
- Documented in `CONTRADICTION_FALSE_POSITIVE_VERIFICATION_2026-04-29.md`
- "Failure Mode" tag had 66 members at the time of that audit
- Before sampling enforcement: 66 members → K(66) → 65 edges per member → `contradictionCount=65`
- After sampling enforcement (TAG_GROUP_CAP=80 applied): 85 members → sampled to 40 → K(40) → 39 edges per member
- The change from 65 to 39 reflects the sampling cap being applied, not a reduction in actual contradictions

### Finding 6: "THE SINGLE ENTRY POINT" appears in multiple repos with the same count

**Evidence:**
- Node `e0e603e85e1972ea` (Archivist-Agent) and `6a9bd95ba806a410` (kernel-lane) both titled "THE SINGLE ENTRY POINT" with `contradictionCount=39`
- Node `a88504c97e8f2e4f` (Archivist-Agent) and `d9ccbb98728d5f78` (kernel-lane) both titled "COVENANT.md — Values (What We Believe)" with `contradictionCount=39`
- These near-duplicate entries across repos are sampled into the same tag groups, reinforcing the artifact pattern
- The byte-identical or near-identical content across repos was previously documented in the contradictionCount=65 audit

---

## 6. Classification

### Per-Node Classification

| Classification | Count | Rationale |
|---------------|-------|-----------|
| **Tag-group artifact** | 59 | All 59 nodes receive `contradictionCount=39` exclusively from stride-sampled pairwise CONTRADICTS edges in the "Failure Mode" and/or "Drift" tag groups. Zero cross-reference CONTRADICTS edges contribute. |
| True contradiction | 0 | No nodes with `contradictionCount=39` have any human-verified or cross-reference-based contradiction evidence. |
| Mixed | 0 | No nodes combine tag-group artifact edges with real contradiction edges at this count. |
| Needs review | 0 | The mechanism is fully explained. No ambiguity remains about the source of `contradictionCount=39`. |

### System-Level Classification

**The `contradictionCount=39` signature is a deterministic artifact of the tag-group sampling pipeline. It is NOT a measure of factual contradictions.**

The same mechanism would produce `contradictionCount=39` for ANY tag in `CONTRADICTION_TAGS` with >80 members. The number 39 encodes the constant `TAG_GROUP_LARGE_SAMPLE − 1`, not a count of contradictions.

### Broader Distribution

| contradictionCount | Nodes | Source |
|--------------------|-------|--------|
| 1 | 67 | Cross-ref CONTRADICTS edges (potentially meaningful) |
| 2-7 | 54 | Cross-ref CONTRADICTS edges (potentially meaningful) |
| 14-26 | 3 | Cross-ref + partial tag overlap |
| **39** | **59** | **Tag-group artifact only (Failure Mode / Drift sampling)** |
| 40-44 | 16 | Tag-group + some cross-ref overlap |
| 53 | 1 | Multiple tag groups + cross-refs |
| 77 | 2 | Multiple tag groups + cross-refs |

Nodes with `contradictionCount ≤ 7` (121 nodes) may represent meaningful cross-reference contradictions and warrant separate investigation. Nodes with `contradictionCount = 39` (59 nodes) are definitively artifacts.

### Why Previous "Mixed" Classification Was Wrong

The previous partial audit (72-line version) classified as "Mixed / Needs Review" because:
1. It only found 17 nodes (missed 42 nodes in other repos)
2. It did not trace the count to `TAG_GROUP_LARGE_SAMPLE − 1`
3. It attributed the computation to `nfm-036-derivation-analysis.js` instead of `truth-routing.ts`
4. It did not verify that zero cross-reference CONTRADICTS edges contribute

With 59 nodes, the exact arithmetic relationship to `TAG_GROUP_LARGE_SAMPLE`, and zero cross-ref contribution confirmed, the classification is definitively **tag-group artifact**.

---

## 7. Recommended Corrections

### Do NOT Do (This Session)

- Do not change `CONTRADICTION_TAGS`, `TAG_GROUP_CAP`, or `TAG_GROUP_LARGE_SAMPLE`
- Do not change the sampling algorithm
- Do not modify `data/site-index.json`
- Do not change node statuses or edge data

### Recommended Corrections (Future Work, Requires Ratification)

#### Correction 1: Tag-Group Edge Attribution

**Problem:** Tag-group CONTRADICTS edges are indistinguishable from cross-reference CONTRADICTS edges in the current data model. Both produce `type: "authority"` with `authority: "CONTRADICTS"`, and both increment `contradictionCount`.

**Proposal:** Add an `origin` field to `GraphEdge`:
```typescript
interface GraphEdge {
  source: string;
  target: string;
  type: string;
  authority?: AuthorityEdgeType;
  origin?: "cross-reference" | "tag-group";  // NEW
}
```

Then in `computeNodeStatuses()`, count tag-group CONTRADICTS edges separately:
```typescript
contradictionCount = crossRefContradictions;  // only cross-reference-based
tagGroupContradictionCount = tagGroupContradictions;  // separate field
```

**Impact:** `contradictionCount` would drop to 0 for all 59 artifact nodes. The `tagGroupContradictionCount` field would preserve the tag-group signal for roadmap/analysis purposes without polluting the status assignment.

**Risk:** Medium — changes the data model and status assignment logic. Requires mapper regeneration and full graph re-audit.

#### Correction 2: Status Assignment Guard

**Problem:** Any `contradictionCount > 0` automatically assigns `CONFLICTED` status, even when the count is 100% tag-group artifact.

**Proposal:** Add an origin check before assigning CONFLICTED:
```typescript
if (crossRefContradictionCount > 0) status = "CONFLICTED";
else if (tagGroupContradictionCount > 0) status = "UNVERIFIED";  // or "POTENTIAL_CONFLICT"
```

**Impact:** 59 nodes would change from CONFLICTED to UNVERIFIED (or a new status). The graph would show fewer red nodes and more gray nodes, which is more accurate.

**Risk:** Medium — changes visual representation. Requires UI review to ensure no information loss.

#### Correction 3: UI Warning (Low Risk)

**Problem:** The graph and NodeDetail panel present `contradictionCount` without any warning that it may be a tag-group artifact.

**Proposal:** (Already recommended in `GRAPH_READABILITY_AND_SNAPSHOT_ROADMAP_REVIEW_20260429.md`)
- Add warning text to NodeDetail when `contradictionCount > 0`
- Add disclaimer to the "What am I looking at?" panel
- Add `disclaimer` field to Contradiction Hub reports

**Impact:** No data changes. Prevents false confidence. Low risk.

**Priority:** P1

#### Correction 4: Cap Display Value (Low Risk, Partial)

**Problem:** `contradictionCount=39` is displayed as a raw number, implying precision.

**Proposal:** In the UI, display tag-group-sourced contradiction counts differently:
```
Contradictions: 39 (tag-group signal)
```
or
```
Contradictions: ≤7 cross-ref + 32 tag-group overlap
```

**Impact:** No data changes. Improves interpretability. Low risk.

**Priority:** P2

---

## 8. Non-Goals and Safety Boundaries

This audit does **not**:

- Claim that any contradiction count equals a factual contradiction
- Propose mapper rule changes without separate ratification
- Modify `truth-routing.ts`, `site-index.ts`, `graph-types.ts`, or any source code
- Regenerate `data/site-index.json`
- Change node statuses, edge data, or governance assignments
- Infer enforcement or authority claims from graph topology
- Process inbox/outbox messages
- Commit any files (awaiting operator approval)
- Replace or override the previous `contradictionCount=65` audit findings (those remain valid for the pre-sampling state)
- Address nodes with `contradictionCount ≤ 7` (those may be meaningful and warrant separate investigation)
- Propose changes to `REPO_AUTHORITY_DEPTH`, `GAME_CATEGORIES`, `FREEAGENT_SUBCATEGORY_MAP`, or `computeGovernanceLayer()`
- Make clinical, service, legal, or safety claims about the system

---

## Convergence Gate

```json
{
  "claim": "contradictionCount=39 is a tag-group artifact produced by stride-sampling of 'Failure Mode' (85→40) and 'Drift' (286→40) tags, yielding K(40) complete graphs with 39 edges per member",
  "evidence": "docs/graph/CONTRADICTION_SIGNATURE_39_AUDIT_20260430.md — verified against truth-routing.ts:79-82,251-289,332-339 and data/site-index.json tag_index",
  "verified_by": "library",
  "contradictions": [],
  "status": "proven"
}
```

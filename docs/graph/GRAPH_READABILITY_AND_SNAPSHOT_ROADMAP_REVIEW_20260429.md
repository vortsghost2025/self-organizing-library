# Graph Readability and Snapshot Roadmap Review

**Date:** 2026-04-29
**Reviewer:** Library Lane (verification-and-enforcement)
**Scope:** Read-only review of live graph UX, snapshot workflow, and accessibility for a half-blind owner/operator
**Status:** Review document only — no code changes without separate approval

---

## 1. Executive Summary

### What Is Currently Understandable

- The graph renders 3,589 nodes and 44,097 edges with real-time WebGL interaction
- Sidebar controls (density, entry points, meaning layers, clusters) are functional and keyboard-accessible
- NodeDetail panel provides comprehensive metadata when a node is selected
- Skip-to-canvas link and `aria-live` announcements exist for screen readers
- Snapshot export/import/compare pipeline works end-to-end (JSON download)
- Meaning layers correctly filter edge types (structure, conflicts, verification, execution, governance)
- The homepage explanation section ("What You See" / "What It Means") provides orientation for new visitors

### What Is Still Confusing

- **No "What am I looking at?" panel on `/graph`** — a first-time or low-vision visitor has no in-page summary of the current view state (active filter, visible counts, what colors mean, what the graph does NOT prove)
- **Snapshot buttons are buried in the MeaningLayers sidebar** — they share visual weight with layer toggles, making them hard to discover. Wording like "Export Snapshot JSON" is technical; a half-blind operator may not know what this does
- **Compare results are JSON-only downloads** — no in-UI visualization, making delta interpretation a manual exercise
- **Contradiction count is presented without warning** — the number appears on nodes and in reports as if it were a fact, but it is a tag-grouping artifact (see Section 5)
- **Fixed pixel label sizes** (`labelSize: 12`) do not scale with browser zoom, making labels invisible to users who need 200%+ magnification
- **Color-only differentiation on the canvas** — governance layers and bridge states are distinguished by color alone; no shapes, patterns, or icons differentiate them for color-blind or low-vision users
- **`text-xs` (~12px) used pervasively** — status bar, zoom label, footer, legend, counts, tags, error messages all use extremely small text

### What Should Be Improved First

1. **P0: "What am I looking at?" always-visible help panel** — the single highest-impact change for a half-blind operator
2. **P0: Large text labels for snapshot/export/compare controls** — currently unreadable at scale
3. **P0: `prefers-reduced-motion` handling** — ForceAtlas2 layout animation can be disorienting
4. **P1: Contradiction count warning text** — prevent false confidence in tag-artifact numbers
5. **P1: Scale graph labels with browser zoom** — replace fixed `labelSize: 12` with `rem`-based or zoom-responsive sizing

---

## 2. Owner Accessibility Review

Focus: Can a half-blind operator use the graph without assistance?

### Readability at Zoom

| Issue | Location | Impact |
|-------|----------|--------|
| Fixed `labelSize: 12` (px) on canvas labels | `GraphCanvas.tsx:318` | Labels do NOT scale with browser zoom. At 200% magnification, the graph canvas labels remain 12px — functionally invisible. This is the single worst zoom failure. |
| `text-xs` (~12px) throughout sidebar and legend | NexusGraph, GraphLegend, MeaningLayers, NodeDetail, EntryPoints, ClusterSelector | Small text compounds with low vision. At 150% zoom, `text-xs` becomes ~18px — still below the 20px minimum recommended for low-vision users. |
| Sigma.js label rendering | GraphCanvas (Sigma config) | Sigma renders labels via WebGL canvas — they do not respond to CSS `font-size` or `rem` units at all. Fixing this requires either a Sigma plugin, overlay divs, or a different label rendering strategy. |

### Visual Clutter

- 3,589 nodes at "overview" density is manageable (cluster representatives only), but at "explore" or "focus" density, hundreds of nodes overlap
- Dimmed nodes (`DIM_COLOR #2A2A38`) are nearly invisible against dark backgrounds — this is intentional for de-emphasis but creates a "where did everything go?" moment
- No visual indicator of which density level is active without looking at the sidebar (far from the canvas)

### Labels

- Node labels only appear on nodes with `renderedSize > 50` (`labelRenderedSizeThreshold: 50`) — many nodes are below this threshold and are unlabeled dots
- No hover tooltip with node title on the canvas — the user must click to open NodeDetail
- Entry point and cluster labels are truncated with CSS `truncate` — clipped text has no accessible name override

### Small Text

| Element | Size | Location |
|---------|------|----------|
| Status summary bar | `text-xs` | NexusGraph.tsx:388 |
| Zoom label | `text-xs text-[var(--text-muted)]` | NexusGraph.tsx:486 |
| Footer instructions | `text-xs` | NexusGraph.tsx:507-508 |
| Legend text | `text-xs` | GraphLegend.tsx |
| Node counts in EntryPoints | `text-xs` | EntryPoints.tsx |
| Tags in NodeDetail | `text-xs` | NodeDetail.tsx |
| Import error message | `text-xs text-red-400` | MeaningLayers.tsx:67 |
| Filter descriptions in DensityControl | `text-xs` | DensityControl.tsx |

**Recommendation:** All `text-xs` should be upgraded to at minimum `text-sm` (14px). For critical information (status bar, zoom level, error messages), `text-base` (16px) is appropriate.

### Color-Only Meaning

| Category | Colors | Differentiation | Problem |
|----------|--------|----------------|---------|
| Node status | Green/Red/Purple/Gray | Text labels in legend and NodeDetail | On the canvas, all nodes are circles differentiated by color only — no shapes |
| Governance layer | 7 distinct hues | Text labels in legend | Canvas uses color-only — no border styles or icons |
| Bridge state | 6 distinct hues | Text labels in NodeDetail | Canvas uses color-only — no outlines or badges |
| Type colors | 7 hues (two are similar purple) | Text label in NodeDetail | Doc (#7C3AED) and Schema (#8B5CF6) are very similar purples |
| Repo colors | 6 hues (two are similar purple) | Text label in NodeDetail | Library (#7C3AED) and FreeAgent (#8B5CF6) are nearly identical |
| Edge types | 6 colors | Width + color in legend | Edge width provides some differentiation; color is supplementary |

**Recommendation:** For the canvas, add shape differentiation (circles, squares, diamonds, triangles) by node type. For governance/bridge overlays, use border-dash patterns. This requires a Sigma.js custom renderer or `nodeReducer` shape assignment.

### Control Discoverability

| Control | Location | Discoverability | Issue |
|---------|----------|----------------|-------|
| Search | Top toolbar | Good — prominent input | None |
| Filter mode toggle | Top toolbar | Good | None |
| Density level | Sidebar | Moderate — small radio labels | `text-xs` descriptions |
| Entry points | Sidebar | Moderate — requires scrolling | No tooltips explaining what each entry point shows |
| Meaning layers | Sidebar | Moderate — visually mixed with snapshot buttons | Layer toggles and snapshot actions share the same panel |
| Snapshot export | Inside MeaningLayers panel | **Poor** — buried among 5 other buttons, `text-xs` | A half-blind operator must find "Export Snapshot JSON" inside a sidebar panel with no visual hierarchy separating it from layer toggles |
| Snapshot import | Inside MeaningLayers panel | **Poor** | Same as above |
| Compare snapshots | Inside MeaningLayers panel | **Poor** | Same as above. Also requires two sequential file picker interactions with no guidance |
| Contradiction Hub | Inside MeaningLayers panel | **Poor** | Same discoverability issue |
| Zoom controls | Keyboard only (WASD, +/-) | **Poor** — no on-screen buttons | The footer mentions keyboard controls in `text-xs`, but there are no clickable zoom buttons |
| Focus/Trace | NodeDetail panel only | Moderate — requires selecting a node first | Acceptable for secondary actions |

### Snapshot Button Discoverability

The 5 snapshot action buttons are inside the `MeaningLayers` component, visually equivalent to meaning layer toggles. There is no heading, separator, or visual grouping that distinguishes "action buttons" from "layer toggles." For a half-blind user:

1. They must scroll the sidebar to find the buttons
2. They must read small text to distinguish "Export Snapshot JSON" from a layer toggle like "Structure"
3. The button labels use technical jargon ("JSON", "Snapshot") without plain-language explanation
4. No tooltip or description explains what each action does
5. Compare requires two file uploads with no progress indicator between them

**Recommendation:** Move snapshot actions to a dedicated "Snapshot Lab" section in the sidebar (or a top-level button group), with a visible heading, larger text, and plain-language descriptions.

---

## 3. "What Am I Looking At?" Panel Proposal

### Purpose

An always-visible (collapsible) panel on `/graph` that summarizes the current view state in plain language. This is the single most impactful accessibility improvement for a half-blind operator.

### Content

```
┌─────────────────────────────────────────────────────────┐
│ 🗺️ What Am I Looking At?                               │
│                                                         │
│ Repository: All repos                                   │
│ Entry point: Top Authority                              │
│ Density: Overview (cluster representatives)             │
│ Meaning layers: Structure, Verification                 │
│                                                         │
│ Visible: 342 nodes · 1,204 edges                        │
│ Total: 3,589 nodes · 44,097 edges                       │
│                                                         │
│ Node colors = content type (doc, code, data, ...)       │
│ Node borders = governance layer                         │
│ Edge colors = relationship type                         │
│                                                         │
│ ⚠️ This graph shows relationships, not proof.           │
│ "Contradicted" means a tag link exists, not that a      │
│ human confirmed a real conflict.                        │
│                                                         │
│ [Learn more →]   [Collapse −]                           │
└─────────────────────────────────────────────────────────┘
```

### Behavior

- **Default state:** Expanded on first visit (per session, using `sessionStorage`)
- **Collapsible:** User can collapse to a single-line summary ("342 nodes · Structure, Verification · Overview")
- **Live-updating:** Changes when filters, density, layers, or entry points change
- **Position:** Top-right of the graph canvas, overlaying the canvas area (not in sidebar)
- **Size:** Minimum `text-base` (16px), expandable with browser zoom
- **Accessibility:** `role="region"`, `aria-label="Current graph view summary"`, `aria-live="polite"` for count changes

### What the Graph Does NOT Prove

The panel must always display this warning:

> "This graph shows relationships between files, not verified truths. A 'contradiction' count reflects tag-based links, not confirmed conflicts. 'Verified' status means at least two cross-references exist, not that a human reviewed the content."

---

## 4. Snapshot Workflow UX Proposal

### Current State

| Action | How to Do It | Problem |
|--------|-------------|---------|
| Capture snapshot | Click "Export Snapshot JSON" in MeaningLayers sidebar | Button is buried, label is technical, no confirmation |
| Export snapshot | Automatic download (no choice of filename or location) | No naming convention guidance |
| Import snapshot | Click "Import Snapshot JSON" → file picker | No preview, no validation feedback before import |
| Compare snapshots | Click "Compare Snapshots" → two sequential file pickers | No guidance between picks, result is JSON download only |
| Interpret deltas | Open downloaded JSON in text editor | No in-UI visualization, no plain-language summary |
| Send to lanes | Manual — copy JSON content, compose lane message | No integration with lane-relay system |

### Proposed Workflow

#### Step 1: Capture

- **Button:** "📷 Save Current View" (plain language, not "Export Snapshot JSON")
- **Confirmation:** Brief toast: "Snapshot saved: 3,589 nodes, 44,097 edges at [timestamp]"
- **Filename convention:** `snapshot-full-YYYYMMDD-HHMMSS.json` (auto-generated, currently implemented)
- **Optional:** Prompt for a short note ("Why are you capturing this?") stored in a `notes` field

#### Step 2: Export

- Automatic download (current behavior) is acceptable
- **Improvement:** Show a brief summary of what was exported before the download triggers
- **Filename:** Already auto-generated — good

#### Step 3: Compare

- **Current:** Two sequential file pickers with no intermediate feedback
- **Proposed:** 
  1. Click "Compare Two Views"
  2. Modal/panel: "Select Snapshot A (baseline)" → file picker
  3. After A is loaded: show summary of A ("3,451 nodes, 29,176 edges, captured 2026-04-29")
  4. "Now select Snapshot B (current)" → file picker  
  5. After B is loaded: show summary of B
  6. Click "Compare" → results appear in-UI (not just JSON download)
  7. Option to download full JSON comparison

#### Step 4: Interpret Deltas

The `compareSnapshots()` function already computes structured results. The proposal is to render key deltas in-UI:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Snapshot Comparison                                  │
│                                                         │
│ A: 3,451 nodes · 29,176 edges (Apr 29, 13:20)          │
│ B: 3,589 nodes · 44,097 edges (Apr 29, 20:06)          │
│                                                         │
│ Δ +138 nodes · +14,921 edges                            │
│ Status changes: 56 nodes changed status                 │
│   UNVERIFIED → VERIFIED: 12                             │
│   UNVERIFIED → CONFLICTED: 8                            │
│   VERIFIED → CONFLICTED: 2                              │
│ Governance reclassifications: 1,411                     │
│ New contradictions: 3                                   │
│ Resolved contradictions: 1                              │
│                                                         │
│ [Download full report ↓]                                │
└─────────────────────────────────────────────────────────┘
```

#### Step 5: Send Snapshot Evidence to Lanes

- **Current:** Not implemented. Phase 6 in the Snapshot Analysis Lab design doc.
- **Proposed:** A "Send to Lane" button in the comparison or snapshot view that:
  1. Validates the snapshot/comparison has an `evidence_path`
  2. Composes a schema-compliant lane message with `type: "response"` and `task_kind: "review"`
  3. Attaches the snapshot JSON as `payload.path`
  4. Delivers to the target lane's canonical inbox path
  5. Signs the message with the Library lane key
- **Safety:** This is Phase 6 work — do not implement until Phases 2-5 are complete

---

## 5. Contradiction Signature Review

### Known Signals

| Signal | Root Cause | Status |
|--------|-----------|--------|
| `contradictionCount=65` (formerly observed) | "Failure Mode" tag with 66 members → 65 CONTRADICTS edges per member | **Verified false positive** — documented in `CONTRADICTION_FALSE_POSITIVE_VERIFICATION_2026-04-29.md` |
| `contradictionCount=39` (currently observed) | Likely another large tag group producing CONTRADICTS edges via the tag-group authority edge pipeline | **Suspected false positive** — same structural cause as 65, different tag group |

### How Contradiction Count Is Computed

From `truth-routing.ts:computeNodeStatuses()`:

1. Every tag in the `tag_index` that has contradiction-class semantic tags (e.g., "Failure Mode", "Drift", "Contradiction") creates pairwise `CONTRADICTS` authority edges among its members
2. Tag groups above the 80-entry cap are stride-sampled to 40, reducing (but not eliminating) the explosion
3. `contradictionCount` on a node = number of distinct nodes connected via CONTRADICTS edges (bidirectional)
4. A single tag group of 40 members produces 39 CONTRADICTS edges per member → `contradictionCount=39` for every member of that group
5. This is a **topological artifact of tag-grouping**, not evidence that 39 distinct contradictions were found by a reviewer

### How the UI Should Warn

**Required text (displayed on the graph and in snapshot reports):**

> ⚠️ Contradiction count is a roadmap signal, not proof. It reflects tag-based link patterns, not confirmed conflicts. A count of 39 means 39 tag-group neighbors share a contradiction-class tag, not that 39 human-verified contradictions exist.

**Implementation locations:**

1. **"What am I looking at?" panel** — always-visible warning when any CONFLICTED nodes are visible
2. **NodeDetail panel** — when `contradictionCount > 0`, show warning text below the count
3. **Contradiction Hub Report** — add a `disclaimer` field to the report JSON and display it in any future in-UI viewer
4. **Snapshot compare results** — if new contradictions appear, show the warning inline

**Priority:** P1 — this prevents false confidence but is not a blocking accessibility issue

---

## 6. Roadmap Extraction Workflow

### Purpose

Transform a graph anomaly (seen in a snapshot) into an actionable Archivist task.

### Proposed Workflow

```
Snapshot → Anomaly Cluster → Evidence Path → Advisory Finding → Archivist Task
```

#### Step 1: Snapshot Capture

- Operator captures a snapshot showing the current graph state
- Snapshot includes: filters, layers, density, selected node, visible nodes/edges, timestamp

#### Step 2: Anomaly Cluster Identification

- Operator identifies an anomaly in the snapshot (e.g., unexpected contradictionCount spike, new CONFLICTED nodes, governance layer shifts)
- Operator tags the anomaly in the snapshot notes: "Federation shows 96% UNVERIFIED — expected governance-simulation lineage"
- Alternatively: automated anomaly detection (future work) flags statistical outliers

#### Step 3: Evidence Path Construction

- From the anomaly cluster, the operator traces the graph path:
  - Which nodes are involved?
  - Which edges connect them?
  - Which tags/groups produced the edges?
  - What is the authority depth of each node?
- The "Trace Path" feature (already implemented) provides this interactively
- The evidence path is documented in the snapshot notes or a separate evidence document

#### Step 4: Advisory Finding

- Operator composes an advisory finding:
  ```
  {
    "finding_id": "ADV-2026-0429-001",
    "anomaly": "Federation 96.3% UNVERIFIED with governanceLayer=unknown",
    "evidence_path": "snapshot-full-20260429-200600.json → Federation cluster → 96 nodes",
    "root_cause_hypothesis": "Federation entries not in REPO_AUTHORITY_DEPTH map; authorityDepth defaults to 0",
    "recommended_action": "Add Federation to REPO_AUTHORITY_DEPTH with depth=50 and governance overrides",
    "risk": "Federation governance claims are invisible in the graph",
    "status": "advisory"
  }
  ```

#### Step 5: Archivist Task Conversion

- Advisory finding is sent to Archivist via lane-relay message:
  - `type: "task"`, `task_kind: "proposal"`
  - `priority: "P1"` (or P0 if blocking)
  - `payload.mode: "path"`, `payload.path: "docs/graph/finding-ADV-2026-0429-001.json"`
  - Signed with Library lane key
- Archivist reviews, ratifies, and assigns implementation

### Safety Constraints

- Findings are **advisory** until Archivist ratification — not enforcement claims
- Evidence paths must reference **specific snapshot files** — no vague references
- Automated anomaly detection is **future work** — do not implement without ratification
- This workflow is **observer-only** from Library's perspective — we surface evidence, we do not act on it

---

## 7. Recommended UI Improvements, Ranked

### P0 — Must Fix (Blocking for half-blind operator)

| # | Improvement | Rationale | Estimated Effort |
|---|-------------|-----------|-----------------|
| 1 | **Always-visible "What am I looking at?" help panel** | A half-blind operator cannot orient without a summary of the current view state. Currently there is zero in-page guidance on `/graph`. | Medium — new component, reactive to graph state |
| 2 | **Large text labels for snapshot/export/compare controls** | Current `text-xs` buttons are unreadable at scale. Snapshot actions need at minimum `text-base` and visual separation from layer toggles. | Low — CSS class changes + layout restructuring in MeaningLayers |
| 3 | **`prefers-reduced-motion` handling** | ForceAtlas2 layout animation runs automatically and can be disorienting for users with vestibular disorders. Must respect the media query and use a static layout when set. | Low — conditional in `GraphCanvas.tsx` before ForceAtlas2 start |
| 4 | **Scale graph canvas labels with browser zoom** | Fixed `labelSize: 12` does not respond to browser zoom. This is the worst zoom failure for a half-blind user. | Medium-High — requires Sigma.js label rendering override or overlay divs |

### P1 — Should Fix (High impact, not blocking)

| # | Improvement | Rationale | Estimated Effort |
|---|-------------|-----------|-----------------|
| 5 | **Contradiction count warning text** | Prevents false confidence in tag-artifact numbers. Show on NodeDetail and in "What am I looking at?" panel. | Low — text addition |
| 6 | **Current lens summary box** | A compact, always-visible summary of active meaning layers and entry point. Similar to the "What am I looking at?" panel but more minimal — one line. | Low — small reactive component |
| 7 | **Upgrade `text-xs` to `text-sm` everywhere** | 12px is below the minimum readable size for low-vision users. 14px (`text-sm`) should be the floor. | Low — CSS class sweep |
| 8 | **Shape differentiation for node types on canvas** | All nodes are circles — color-blind users cannot distinguish types. Add shapes (square for code, diamond for data, triangle for config, etc.). | Medium-High — requires Sigma.js custom renderer or `nodeReducer` shape mapping |
| 9 | **On-screen zoom controls** | Current zoom is keyboard-only (WASD, +/-). Low-vision users and touchscreen users need clickable +/− buttons. | Low — button group overlay on canvas |

### P2 — Nice to Have (Improved experience)

| # | Improvement | Rationale | Estimated Effort |
|---|-------------|-----------|-----------------|
| 10 | **Guided snapshot capture flow** | Replace the current "click button → file downloads" with a guided flow: review current view → add notes → confirm → download. | Medium — modal/panel UI |
| 11 | **Comparison report viewer** | Render `compareSnapshots()` results in-UI instead of JSON download only. | Medium — new component for structured delta display |
| 12 | **Entry point and meaning layer tooltips/descriptions** | The explanation layer design doc proposes these but they are not implemented. Tooltips would help new users understand what each entry point shows. | Low — tooltip components on existing buttons |
| 13 | **`prefers-contrast: more` handling** | A dedicated high-contrast mode that overrides graph colors with maximum-contrast alternatives. | Medium — conditional theme switching |
| 14 | **Import error `role="alert"`** | Currently `text-xs text-red-400` with no ARIA announcement. Screen readers will not announce the error. | Trivial — one attribute addition |
| 15 | **Fix duplicate ArrowRight/"d" keyboard handler** | `GraphCanvas.tsx:191-199` has a duplicated handler causing double-pan on "d" key. | Trivial — remove duplicate |

### P3 — Future Work

| # | Improvement | Rationale | Estimated Effort |
|---|-------------|-----------|-----------------|
| 16 | **Graph analyst finding export** | Structured export of an evidence path + advisory finding for lane delivery. | Medium — new export format |
| 17 | **First-time visitor guide** | Interactive walkthrough of graph features (proposed in explanation layer doc). | High — multi-step tour component |
| 18 | **PNG snapshot capture** | Phase 2 in Snapshot Analysis Lab design doc. Requires html2canvas or similar. | Medium |
| 19 | **Snapshot gallery page** | Phase 3 in design doc. Browse, compare, annotate saved snapshots. | High — new page + storage |
| 20 | **Lane handoff integration** | Phase 6 in design doc. Send snapshots as evidence via lane-relay. | Medium-High — lane-relay integration |

---

## 8. Non-Goals

This review does **not** propose:

- Mapper rewrites or `truth-routing.ts` logic changes
- Graph authority, verification, or enforcement claim changes
- Automatic lane dispatch or message sending
- Replacing the existing graph engine (Sigma.js/graphology)
- Clinical, service, or legal claims about what the graph proves
- Changes to `REPO_AUTHORITY_DEPTH`, `computeGovernanceLayer()`, or tag-group sampling
- Modifying `data/site-index.json` or the site indexer
- Adding new meaning layers, entry points, or edge types
- Database or persistent storage for snapshots
- Real-time collaboration or multi-user graph editing

---

## 9. Implementation Proposal

List of possible future files to change, with estimated risk and accessibility impact. **No code changes in this session.**

| File | Change | Risk | Accessibility Impact | Test/Build |
|------|--------|------|---------------------|------------|
| `src/components/graph/GraphContextPanel.tsx` | **NEW** — "What am I looking at?" panel component | Low (new file, no existing code touched) | **Very High** — single most impactful change for half-blind operator | Must pass `bun typecheck` and `bun lint` |
| `src/components/NexusGraph.tsx` | Add `GraphContextPanel` to layout; wire state; add `prefers-reduced-motion` check before ForceAtlas2 | Medium (core orchestrator) | High | Full regression test of graph interaction |
| `src/components/graph/GraphCanvas.tsx` | Make `labelSize` zoom-responsive; fix duplicate keyboard handler; add `prefers-reduced-motion` guard; consider shape differentiation in `nodeReducer` | Medium-High (rendering engine) | Very High for label sizing | Visual regression needed |
| `src/components/graph/MeaningLayers.tsx` | Separate snapshot actions from layer toggles; upgrade text sizes; add heading; add `role="alert"` on import error | Low-Medium (layout changes) | High for discoverability | Component render test |
| `src/components/graph/GraphLegend.tsx` | Upgrade `text-xs` to `text-sm`; add shape indicators alongside color swatches | Low | Medium | Visual check |
| `src/components/graph/NodeDetail.tsx` | Add contradiction warning text when `contradictionCount > 0`; upgrade tag text size | Low | High for preventing false confidence | Component render test |
| `src/components/graph/EntryPoints.tsx` | Add tooltips/descriptions; upgrade text sizes; fix `truncate` accessible name | Low | Medium | Component render test |
| `src/components/graph/ClusterSelector.tsx` | Upgrade text sizes; fix `truncate` accessible name; add scrollable container `aria-label` | Low | Low-Medium | Component render test |
| `src/components/graph/GraphToolbar.tsx` | Add on-screen zoom +/- buttons; upgrade text sizes | Low | Medium for zoom accessibility | Interaction test |
| `src/components/graph/SnapshotCompare.tsx` | **NEW** — In-UI comparison result viewer component | Low (new file) | Medium — improves delta interpretation | Must pass typecheck/lint |
| `src/lib/graph-types.ts` | Add shape constants for node types (for future shape differentiation) | Low (additive) | Medium | Typecheck |
| `src/app/globals.css` | Add `prefers-reduced-motion` and `prefers-contrast: more` media query rules | Low | High | Visual regression |

### Recommended Implementation Order

1. **Phase A (P0):** `GraphContextPanel.tsx` (new) → integrate into `NexusGraph.tsx` → `prefers-reduced-motion` guard → snapshot button text/layout fixes
2. **Phase B (P0):** `GraphCanvas.tsx` label sizing fix → zoom controls in `GraphToolbar.tsx`
3. **Phase C (P1):** Contradiction warning in `NodeDetail.tsx` → `text-xs` sweep → lens summary box
4. **Phase D (P2):** Shape differentiation → guided snapshot flow → comparison viewer → tooltips
5. **Phase E (P3):** Finding export → gallery page → lane handoff → PNG capture

### Build Expectations

- All changes must pass `bun typecheck` and `bun lint` before staging
- Graph changes require manual visual verification at `deliberateensemble.works/graph`
- Deploy via `vercel deploy --prod` (auto-deploy can silently fail)
- No automated visual regression tests exist — manual review is required

---

## Convergence Gate

```json
{
  "claim": "Read-only review of graph readability and snapshot UX completed with 20 ranked recommendations and implementation proposal",
  "evidence": "docs/graph/GRAPH_READABILITY_AND_SNAPSHOT_ROADMAP_REVIEW_20260429.md",
  "verified_by": "library",
  "contradictions": [],
  "status": "proven"
}
```

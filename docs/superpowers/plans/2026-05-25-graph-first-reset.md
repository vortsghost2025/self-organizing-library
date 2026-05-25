OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: graph-first-reset-plan
generated_at: 2026-05-25T17:10:00Z
session_id: lib-session-20260525-graph-continue

# Graph-First Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/graph` experience so it reliably renders a complete, readable network on first load and visually tracks the approved reference screenshot.

**Architecture:** Keep the graph data pipeline intact, but replace the unstable presentation path with a deterministic layout + camera-fit pipeline and a much simpler graph-first shell. Build the graph canvas first, then wrap it in restrained page chrome, then reintroduce only essential controls.

**Tech Stack:** Next.js, React, Sigma, Graphology, TypeScript, Playwright/browser verification, existing graph data API.

---

## File Structure

- Modify: `src/components/NexusGraph.tsx`
  - simplify page composition, reduce first-pass control density, and elevate the graph canvas
- Modify: `src/components/graph/GraphCanvas.tsx`
  - replace unstable first-load behavior with deterministic rendering and one reliable fit path
- Modify: `src/lib/semantic-graph-layout.ts`
  - ensure the layout produces readable cluster grouping with stronger deterministic separation
- Modify: `src/lib/graph-camera-fit.ts`
  - make initial fit rely on actual graph bounds with simpler ratio logic
- Modify: `src/components/graph/GraphToolbar.tsx`
  - keep only essential controls for the first pass if the current toolbar is too noisy
- Test: `src/lib/semantic-graph-layout.test.ts`
- Test: `src/lib/graph-camera-fit.test.ts`
- Create: `docs/superpowers/status/2026-05-25-graph-first-reset-handoff.md`

### Task 1: Lock the Reset Boundary

**Files:**
- Modify: `src/components/NexusGraph.tsx`
- Modify: `src/components/graph/GraphCanvas.tsx`

- [ ] **Step 1: Remove first-load behavior that depends on layered rescue logic**

Target outcome:

```ts
// Keep one initial render path:
// 1. build graph
// 2. compute deterministic positions
// 3. fit visible graph once
// 4. render
```

- [ ] **Step 2: Remove or neutralize debug/default-view logic that can hide the graph**

Target outcome:

```ts
// No debug overlays or special initial-mode branches should be required
// for the graph to appear correctly.
const showDebug = false;
```

- [ ] **Step 3: Run targeted tests for the current helpers before refactoring**

Run: `npm test -- --runInBand src/lib/graph-camera-fit.test.ts src/lib/semantic-graph-layout.test.ts`

Expected:
- existing helper tests either pass or reveal the exact reset boundary

- [ ] **Step 4: Commit boundary cleanup if isolated**

```bash
git add src/components/NexusGraph.tsx src/components/graph/GraphCanvas.tsx
git commit -m "[LANE-3] chore: clear broken graph first-load behavior"
```

### Task 2: Rebuild Deterministic Layout

**Files:**
- Modify: `src/lib/semantic-graph-layout.ts`
- Test: `src/lib/semantic-graph-layout.test.ts`

- [ ] **Step 1: Write or update a failing test for deterministic cluster separation**

Target test shape:

```ts
it("keeps major semantic regions spatially separated", () => {
  const positions = computeSemanticGraphLayout(sampleNodes, sampleEdges, { preset: "systems" });
  expect(positions["sources-node"].x).toBeLessThan(positions["governance-node"].x);
  expect(positions["governance-node"].x).toBeLessThan(positions["external-node"].x);
});
```

- [ ] **Step 2: Run the layout test to verify behavior before changing implementation**

Run: `npm test -- --runInBand src/lib/semantic-graph-layout.test.ts`

Expected:
- failing or weak assertions identify current layout drift

- [ ] **Step 3: Implement a stronger deterministic region layout**

Target implementation shape:

```ts
// stable region assignment
// fixed region centers
// hub-first placement
// ring/fan satellite placement
// one collision pass
```

- [ ] **Step 4: Re-run the layout test**

Run: `npm test -- --runInBand src/lib/semantic-graph-layout.test.ts`

Expected:
- PASS

- [ ] **Step 5: Commit layout reset**

```bash
git add src/lib/semantic-graph-layout.ts src/lib/semantic-graph-layout.test.ts
git commit -m "[LANE-3] feat: reset graph layout for readable cluster separation"
```

### Task 3: Rebuild Camera Fit

**Files:**
- Modify: `src/lib/graph-camera-fit.ts`
- Test: `src/lib/graph-camera-fit.test.ts`

- [ ] **Step 1: Write or update a failing test for complete first-load fit**

Target test shape:

```ts
it("returns a stable camera ratio for a full visible graph", () => {
  const fit = computeCameraFitFromDisplayPoints(points, {
    containerWidth: 1200,
    containerHeight: 800,
    paddingFactor: 1.08,
  });
  expect(fit).not.toBeNull();
  expect(fit!.ratio).toBeGreaterThan(0);
  expect(fit!.ratio).toBeLessThan(5);
});
```

- [ ] **Step 2: Run the camera-fit test**

Run: `npm test -- --runInBand src/lib/graph-camera-fit.test.ts`

Expected:
- current logic exposes unstable ratio assumptions if still broken

- [ ] **Step 3: Simplify fit logic to one stable ratio calculation**

Target implementation shape:

```ts
// derive bounds from visible display points
// expand to minimum extent
// center once
// compute a single ratio with light padding
```

- [ ] **Step 4: Re-run the camera-fit test**

Run: `npm test -- --runInBand src/lib/graph-camera-fit.test.ts`

Expected:
- PASS

- [ ] **Step 5: Commit camera-fit reset**

```bash
git add src/lib/graph-camera-fit.ts src/lib/graph-camera-fit.test.ts
git commit -m "[LANE-3] feat: simplify graph camera fit for stable first load"
```

### Task 4: Rebuild the Graph Canvas and Shell

**Files:**
- Modify: `src/components/graph/GraphCanvas.tsx`
- Modify: `src/components/NexusGraph.tsx`
- Modify: `src/components/graph/GraphToolbar.tsx`

- [ ] **Step 1: Strip the graph shell down to essential controls**

Target outcome:

```tsx
<GraphToolbar
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  onFitVisible={handleFitVisible}
  onZoomIn={handleZoomIn}
  onZoomOut={handleZoomOut}
/>
```

- [ ] **Step 2: Make the graph canvas the hero region**

Target outcome:

```tsx
<div className="graph-shell">
  <header>{/* compact title + subtitle */}</header>
  <section>{/* dominant graph canvas */}</section>
</div>
```

- [ ] **Step 3: Implement readable label and node emphasis rules in `GraphCanvas`**

Target outcome:

```ts
// show labels for anchor nodes, hovered nodes, selected nodes,
// and high-importance nodes only
```

- [ ] **Step 4: Ensure initial render does one fit path only**

Target outcome:

```ts
sigma.resize();
fitAllNodes();
sigma.refresh();
```

- [ ] **Step 5: Run typecheck and the graph-focused test files**

Run: `npm run typecheck`

Expected:
- PASS

- [ ] **Step 6: Commit presentation reset**

```bash
git add src/components/NexusGraph.tsx src/components/graph/GraphCanvas.tsx src/components/graph/GraphToolbar.tsx
git commit -m "[LANE-3] feat: rebuild graph presentation around stable first-load network view"
```

### Task 5: Browser Verification and Handoff

**Files:**
- Create: `docs/superpowers/status/2026-05-25-graph-first-reset-handoff.md`

- [ ] **Step 1: Start the app and verify the graph route visually**

Run: `npm run dev`

Expected:
- local app starts without graph runtime failure

- [ ] **Step 2: Capture browser verification against `/graph`**

Run:
- open `/graph`
- verify graph is visible on first load
- verify cluster separation is readable
- verify shell feels closer to the target screenshot than the previous control-heavy prototype

- [ ] **Step 3: Record continuity notes for the next session**

Target note structure:

```md
# Graph First Reset Handoff
- what was replaced
- what still differs from the target screenshot
- what future agents should not touch unless they are intentionally changing the presentation model
```

- [ ] **Step 4: Commit handoff note if working tree isolation allows**

```bash
git add docs/superpowers/status/2026-05-25-graph-first-reset-handoff.md
git commit -m "[LANE-3] docs: record graph first reset handoff"
```

## Self-Review

- Spec coverage: layout reset, camera reset, shell simplification, verification, and continuity trail are all represented.
- Placeholder scan: no TBD/TODO markers remain.
- Type consistency: file names, helper names, and route targets are consistent with the approved spec.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-25-graph-first-reset.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints

OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: graph-first-reset-design
generated_at: 2026-05-25T17:10:00Z
session_id: lib-session-20260525-graph-continue

# Graph-First Reset Design

## Goal
Restore the `/graph` experience to a stable, readable, product-like network view that visually matches the target reference: dense but legible clusters, visible graph on first load, subdued shell, and minimal control noise.

## Benchmark
The target benchmark is the reference screenshot already approved in-session:

- dark application shell
- large centered graph canvas
- clear cluster separation by color and region
- enough labels to feel informative without turning into noise
- no empty canvas state on first load

The current graph should be considered broken until it consistently renders a complete graph on first load without manual rescue.

## What Stays
- existing graph data route and graph content pipeline
- node and edge typing
- cluster metadata where still useful
- graph page route and overall app integration

## What Changes
- replace the current first-load graph presentation logic
- remove the current dependence on layered camera-fit recovery behavior
- simplify or defer advanced controls that crowd the experience before the graph is stable
- replace the current “debug tool” feeling with a single strong default presentation

## First-Pass Experience

### Visual Experience
- dark restrained shell, closer to the reference than the current prototype
- graph as the hero surface
- compact title/utility area instead of a dense matrix of controls
- cluster colors that read clearly at a glance
- labels curated for readability instead of exhaustive visibility

### Interaction Experience
- graph visible on first load every time
- fit, zoom, and search available
- one deterministic layout option for pass one
- no dependence on fragile mode/lens/camera combinations to make the graph usable

### Deferred or Reduced
- dense mode/lens combinations on first pass
- debug overlays and diagnostics in the normal experience
- interaction layers that mutate the default view unpredictably

## Technical Strategy

### Reset Boundary
Treat the current graph stack as recoverable only at the data boundary. The data model stays; the presentation layer is rebuilt around deterministic rendering.

### Layout Model
Use one opinionated layout pipeline for the first pass:

- deterministic cluster-aware spatial regions
- stable node placement within those regions
- fixed label rules based on importance and density
- one initial camera fit based on actual visible graph bounds

### Page Composition
The page should be rebuilt around three layers:

1. page shell
2. graph canvas
3. minimal utility controls

The graph canvas must work in isolation before the shell is considered complete.

## File Direction

### Primary files to modify
- `src/components/NexusGraph.tsx`
- `src/components/graph/GraphCanvas.tsx`
- `src/lib/semantic-graph-layout.ts`
- `src/lib/graph-camera-fit.ts`

### Likely supporting files
- `src/components/graph/GraphToolbar.tsx`
- `src/lib/graph-types.ts`
- `src/app/api/graph-data/route.ts` only if the presentation reset reveals data-shape issues

## Verification Standard
The reset is ready for user review only when:

- the graph is visible on first load
- cluster separation is immediately readable
- the graph feels closer to the target screenshot than the current prototype
- the control surface no longer dominates the page
- browser verification captures a coherent rendered graph instead of an empty canvas

## Session Continuity
To reduce future paid-session waste, this reset must leave a durable trail:

- this design spec
- an implementation plan
- a concise handoff note after implementation describing what was replaced, what remains, and what future agents should not re-break

## Non-Goals For Pass One
- preserving every existing graph control
- matching every pixel of the screenshot before the graph itself is trustworthy
- solving every historical graph feature regression in the same pass

## Recommended Direction
Proceed with a graph-first reset:

- prioritize graph readability and stability
- simplify the shell until the graph works
- reintroduce advanced controls only after the graph is visually correct and stable

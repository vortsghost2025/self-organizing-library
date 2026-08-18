OUTPUT_PROVENANCE:
agent: cursor
lane: library
target: lock GRAPH_RESTORE_SPEC_V1 as Nexus Graph authority before any restoration work
generated_at: 2026-08-17T21:26:00Z
session_id: cursor-graph-restore-spec-v1-2026-08-17

# GRAPH_RESTORE_SPEC_V1.md

**Project:** Deliberate Ensemble — Nexus Graph
**Purpose:** Restore the graph as a **reasoning and investigation interface**, not an everything-at-once visualization.
**Canonical path:** `docs/graph/GRAPH_RESTORE_SPEC_V1.md`
**Status:** **AUTHORITY DOCUMENT**
**Code changes:** **FROZEN** until an inspect-only gap analysis and restoration plan are approved.

## Standing Order For Agents

This document is the design authority for Nexus Graph restoration.

Until a restoration plan is explicitly approved:

**Agents MAY**

- read this spec
- inspect the current graph UI, controls, filters, layout, and data-generation paths
- compare the current experience against this spec and historical screenshots
- produce a restoration plan with evidence

**Agents MUST NOT**

- change graph components, layout, filters, layers, entry points, or visual semantics
- rewrite graph-data generation or the underlying knowledge model
- mix data-model changes into a UI restoration
- treat aesthetic density, “showing more,” or unrelated frontend work as sufficient reason to redefine the graph’s purpose

Next allowed step: **inspect only**, then a restoration plan, **without changing code**.

Where this spec conflicts with older graph UX notes (including `docs/graph/NEXUS_GRAPH_EXPLANATION_LAYER.md`), **this spec wins for restoration intent**. Record the conflict in the inspect/plan output; do not silently rewrite either document during inspection.

---

## 1. Core Principle

> **The graph is a thinking instrument, not a data dump.**

The default experience must help a human answer:

* What matters?
* What is connected?
* What is trusted?
* What conflicts?
* What should I inspect next?

Showing more nodes is **not** automatically an improvement.

---

## 2. Non-Negotiable Invariants

### A. Default view must be legible

The initial graph must never open as a full-system hairball.

Default target:

* curated subset
* visible cluster separation
* readable node spacing
* limited active edges
* obvious center of attention

A user should understand the broad structure **without interacting first**.

### B. Progressive density

Graph exploration must have explicit levels:

**Overview**
→ representative nodes only

**Cluster**
→ one selected repo/domain/authority region

**Neighborhood**
→ selected node + direct/limited-hop relationships

**Deep exploration**
→ larger graph only when explicitly requested

**Full-system mode**
→ diagnostic/advanced mode, never default

---

## 3. Visual Semantics

Each visual property should have **one primary meaning**.

Recommended:

| Property         | Meaning                                      |
| ---------------- | -------------------------------------------- |
| Node color       | Repository / major architectural domain      |
| Node size        | Importance / connectivity / authority weight |
| Border or badge  | Verification state                           |
| Edge color/style | Relationship type                            |
| Opacity          | Context relevance                            |
| Red emphasis     | Conflict / contradiction only                |

Do not overload color with repository + authority + verification + execution state simultaneously.

---

## 4. Meaning Layers

Retain the existing conceptual layers:

* Structure
* Conflicts
* Verification
* Execution
* Governance Depth

But the default should be restrained.

Recommended startup:

**ON**

* Structure
* Verification

**OFF until requested**

* Conflicts
* Execution
* Governance Depth

Selecting an investigative entry point may automatically enable the relevant layer.

Example:

**Contradictions** → enable Conflicts
**Top Authority** → enable Governance Depth
**Active Bridges** → enable Execution / Structure

---

## 5. Entry Points

The graph should provide task-oriented starting points rather than expecting the user to understand thousands of nodes.

Preserve/restore entry points such as:

**Top Authority**
**Contradictions**
**Unverified Claims**
**Governance Core**
**Active Bridges**
**Evidence Layer**
**Application-Adjacent**
**Historical Layer**

These are not merely filters.

They answer:

> **Why am I opening this graph?**

---

## 6. Cluster Integrity

Repositories / architectural domains must remain visually distinguishable.

The older versions demonstrated this well.

Clusters should:

* maintain meaningful spatial separation
* avoid collapsing into a single dense center
* preserve recognizable group shape
* avoid excessive cross-cluster edges in overview mode

Cross-domain edges should appear progressively or on selection.

---

## 7. Edge Budget

The graph must aggressively control visible edges.

Default behavior should prioritize:

1. selected-node relationships
2. high-value authority / verification relationships
3. contradiction relationships when relevant
4. structurally significant cross-domain bridges

Low-value archive traversal edges should be hidden until requested.

A node count can be moderately high and still remain usable.

An uncontrolled edge count destroys the graph much faster than node count.

---

## 8. Archive vs Active System

Archived knowledge must not visually dominate current architecture.

The graph should distinguish:

**Live / current architecture**

from

**historical / archival knowledge**

Historical nodes may remain searchable and traversable, but should be visually suppressed unless specifically requested.

---

## 9. Verification State

Verification must remain explicit and must not collapse distinct states.

Minimum states:

* VERIFIED
* UNVERIFIED
* CONFLICTED
* QUARANTINED
* UNKNOWN / NOT EVALUATED where required

Do not treat lack of verification as successful verification.

This principle should apply both to data semantics and UI representation.

---

## 10. Investigation Flow

Clicking a node should progressively reveal context instead of exploding the entire graph.

Recommended flow:

**select node**
→ emphasize node
→ show direct neighbors
→ show relationship types
→ show verification / authority metadata
→ optionally expand one additional hop

Expansion must be intentional.

---

## 11. Accessibility

The graph must remain usable with:

* browser zoom
* high contrast
* large-text mode
* large display
* keyboard navigation where practical

Important controls must remain readable at high zoom.

Tooltips must not be the only way to access critical information.

Node details should also appear in a persistent side panel or accessible information region.

---

## 12. Forbidden Regression States

An implementation **fails this spec** if any of the following occur:

* full-system hairball is the default
* all relationship layers are enabled at startup
* cluster boundaries become visually meaningless
* thousands of weak edges dominate the display
* archive nodes overwhelm active architecture
* verification status becomes difficult to distinguish
* selecting one node exposes most of the system
* layout changes every time the page loads enough to destroy spatial familiarity
* accessibility controls disappear or become unusable
* an agent changes the graph's semantics merely to improve aesthetics
* data-model changes are mixed into a UI restoration without explicit approval

---

## 13. Preserve Before Modify

Before implementing restoration:

**DO NOT overwrite the current graph blindly.**

First preserve:

* current graph component(s)
* current graph-data generation logic
* current screenshots
* current default filters
* current layout settings
* current edge-type handling
* current node-type handling

Restoration should initially target **presentation and exploration behavior**, not rewrite the underlying knowledge model.

---

## 14. Historical Visual Baseline

Use the supplied older screenshots as design evidence.

Especially preserve characteristics visible in the earlier versions:

**April 28 / May 1–2**

* strong repo/domain clustering
* useful separation
* graph remained visually interpretable

**May 9 / May 15**

* authority and meaning-layer exploration
* task-oriented entry points
* progressive graph inspection

Later high-density versions demonstrate the primary regression to avoid:

> too much simultaneously visible structure reducing the graph's reasoning value.

The goal is **not pixel-perfect restoration**.

The goal is restoration of the original interaction philosophy.

---

## 15. Acceptance Test

Before calling the work complete, capture screenshots of:

**A. Default overview**
Must be understandable without clicking.

**B. One repo selected**
Cluster should remain coherent.

**C. One node + neighbors**
Relationships should be readable.

**D. Contradiction lens**
Conflicted nodes/edges should be obvious without unrelated clutter.

**E. Authority lens**
Authority paths should be traceable.

**F. Large-text / high-zoom view**
Controls and details must remain usable.

If any screenshot resembles an undifferentiated hairball, the restoration is **not complete**.

---

## 16. Governing Design Rule

> **Every additional node, edge, color, layer, animation, or control must justify the cognitive load it adds.**

If additional information makes the graph harder to reason with, hide it until requested.

---

## 17. Change-Control Rule

Future agents modifying the Nexus Graph must preserve this spec.

Any intentional violation must document:

**what invariant changed**
**why it changed**
**what evidence shows the replacement is better**
**how the old behavior can be restored**

No agent should be allowed to redefine the graph's purpose implicitly while performing an unrelated frontend task.

---

**Restore target:**

> Meaning first → progressive disclosure → evidence on demand

not

> everything visible → everything connected → visual chaos

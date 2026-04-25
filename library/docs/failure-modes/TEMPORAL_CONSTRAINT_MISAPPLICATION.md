# Named Failure Mode: Temporal Constraint Misapplication

**ID:** NFM-018
**Discovered:** 2026-04-24
**Source:** Archivist-Agent lane-worker routing incident
**Severity:** HIGH
**Status:** DOCUMENTED, MITIGATED

---

## Definition

A constraint is evaluated before the system reaches a state in which the constraint can be satisfied. The system applies a post-condition check at a pre-condition phase, producing a false negative that blocks legitimate action.

**Formal statement:**

> A constraint must only be evaluated at the phase in which its conditions can be satisfied.

---

## Incident Evidence

### What Happened

The lane-worker routing logic applied the execution gate (artifact existence check) to actionable tasks before the task had been executed:

```
actionable + completion proof present
  -> execution gate: "does artifact exist on filesystem?"
  -> artifact does not exist (task not yet executed)
  -> route: BLOCKED (EXECUTION_NOT_VERIFIED)
```

**But:** For an actionable task, the artifact CANNOT exist yet by definition. The task is asking the lane to DO something. The artifact is the OUTPUT of that action. Checking for the artifact before the action runs is causally impossible.

### The Code Path

```javascript
// BEFORE (broken):
if (gate.pass && isActionable(msg) && cp.hasCompletionProof(msg)) {
  const executionResult = this.executionGate.verify(msg);
  if (!executionResult.execution_verified) {
    return { queue: 'blocked', reason: 'EXECUTION_NOT_VERIVED' };
  }
}
```

This checked: "actionable task + artifact specified + artifact not on disk = BLOCKED"

But the artifact won't be on disk until the lane COMPLETES the task.

### Impact

- Actionable tasks with artifact_path could NEVER route to `actionRequired`
- They would always hit `blocked` instead
- This created a deadlock: tasks could not be started because they hadn't been completed yet
- The `actionRequired` queue was effectively unreachable for any task specifying an artifact

---

## Root Cause

**Temporal constraint mismatch.** The execution gate is a POST-condition validator (it checks that work was done). The lane-worker was applying it as a PRE-condition (blocking work that hadn't been done yet).

This conflates two fundamentally different phases:

| Phase | Meaning | Valid Check |
|-------|---------|-------------|
| Pre-execution | "This is work to be done" | Is the task well-formed? Does the agent have authority? |
| Post-execution | "This claims work is done" | Does the artifact exist? Is execution verified? |

---

## The Fix

Separate pre-execution from post-execution validation paths:

```javascript
// AFTER (correct):
if (gate.pass && isActionable(msg) && cp.hasCompletionProof(msg)) {
  const executionResult = this.executionGate.verify(msg);
  if (!executionResult.execution_verified) {
    // Actionable + artifact not yet created = work to do, not a blockage
    if (shouldAutoStart(msg)) {
      return { queue: 'inProgress', reason: 'ACTIONABLE_ARTIFACT_PENDING' };
    }
    return { queue: 'actionRequired', reason: 'ACTIONABLE_ARTIFACT_PENDING' };
  }
}
// Non-actionable + artifact missing = legitimate block (claim without proof)
if (gate.pass && !isActionable(msg) && cp.hasCompletionProof(msg)) {
  const executionResult = this.executionGate.verify(msg);
  if (!executionResult.execution_verified) {
    return { queue: 'blocked', reason: 'EXECUTION_NOT_VERIFIED' };
  }
}
```

The key insight: **actionable = pre-execution, non-actionable = post-execution claim**. The same constraint (artifact exists) is valid in one phase and invalid in the other.

---

## Classification

**Type:** Temporal Logic Error
**Layer:** Routing / Admission Control
**Invariant Violated:** Selection under constraint must respect execution ordering

**Broader category:** Causality violation. The system required a future state as a precondition for reaching that future state.

---

## Detection Pattern

**Symptoms:**
- Actionable tasks routed to `blocked` instead of `actionRequired`
- Tasks with `requires_action: true` that never reach the agent's work queue
- `EXECUTION_NOT_VERIFIED` on messages that haven't been executed yet
- Deadlock: tasks cannot start because they haven't finished

**Investigation Steps:**
1. Check if blocked message has `requires_action: true`
2. Check if the block reason references artifact existence
3. If both true: this is temporal misapplication

---

## Formal Statement

Let P = "artifact exists on filesystem"
Let Q = "task has been executed"
Let R = "task is actionable (requires_action = true)"

The system required: P implies admission
But the causal chain is: R -> execution -> Q -> P

Checking P before Q is reachable produces: NOT P (always, by causality)
Therefore: R is never admitted (deadlock)

**The constraint is causally unreachable at the point of evaluation.**

---

## Implications

### For System Design
- All constraint evaluation must be phase-aware
- Post-conditions cannot be used as pre-conditions
- The system must distinguish "work to be done" from "work claiming to be done"

### For Governance
- Admission control must route by execution phase, not just message content
- A constraint is only valid when its satisfaction conditions are reachable
- Temporal ordering is a first-class concern in gate design

### For Paper 6
- This is a new constraint type: temporal constraint validity
- It extends the existing failure mode taxonomy beyond "implementation gaps"
- It proves that gate design must model execution ordering, not just message fields

---

## Related Failure Modes

- **NFM-002:** Self-State Aliasing (stale artifacts prioritized over live state -- also a temporal ordering failure, but for self-state rather than task routing)
- **NFM-019:** Schema-Behavior Mismatch (discovered in same incident)
- **NFM-020:** Cross-Lane Observability Boundary (discovered in same incident)

**Cross-Reference:** All three NFMs (018, 019, 020) were discovered in a single relay loop test. This confirms that end-to-end testing exposes failures that unit testing cannot.

---

## One-Line Truth

> You fixed a temporal constraint violation and, in doing so, made the system respect causality.

---

**Decision Authority:** Archivist-Agent (governance root)
**Date:** 2026-04-24

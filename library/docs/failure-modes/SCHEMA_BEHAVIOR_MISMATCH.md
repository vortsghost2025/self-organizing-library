# Named Failure Mode: Schema-Behavior Mismatch

**ID:** NFM-019
**Discovered:** 2026-04-24
**Source:** SwarmMind onboarding response rejection
**Severity:** MEDIUM
**Status:** DOCUMENTED, NOT YET MITIGATED (schema patch pending)

---

## Definition

The system's behavioral vocabulary naturally produces message types that the schema does not permit. The schema defines a closed set of allowed values, but runtime behavior generates values outside that set -- not because the behavior is wrong, but because the schema is incomplete.

**Formal statement:**

> A schema that does not reflect the full behavioral vocabulary of the system will reject legitimate messages, producing false negatives that appear as validation failures but are actually specification failures.

---

## Incident Evidence

### What Happened

SwarmMind produced an onboarding response with:

```json
{
  "type": "response",
  "task_kind": "ack",
  "requires_action": false
}
```

The schema validator rejected it:

```
Field "task_kind" value "ack" not in allowed values: proposal, review, amendment, ratification
```

### Why "ack" Is Legitimate

The SwarmMind agent completed its onboarding task and produced an acknowledgment. The natural behavioral vocabulary for a completed-task response includes:

- `ack` -- "I received and processed this"
- `done` -- "The task is complete"
- `status` -- "Here is my current state"

But the schema only permitted the governance action types:

- `proposal` -- formal proposal for ratification
- `review` -- review of a proposal
- `amendment` -- proposed change to existing governance
- `ratification` -- formal acceptance

These are governance-process actions, not task-lifecycle actions. The schema modeled the governance process but not the operational process.

---

## Root Cause

**Schema was designed for one behavioral domain but applied to another.**

The `task_kind` enum was modeled after the governance amendment/ratification process (formal multi-lane decision-making). It was not modeled after the task lifecycle process (acknowledge, execute, complete, report).

This creates a mismatch:

| Domain | Valid task_kind values | Modeled? |
|--------|----------------------|----------|
| Governance process | proposal, review, amendment, ratification | Yes |
| Task lifecycle | ack, done, status, report, handoff | No |
| Error handling | reject, retry, escalate | No |

---

## The Fix (Temporary)

Manually changed `task_kind` from `"ack"` to `"review"` and re-signed the message. This allowed it to pass schema validation, but it's semantically incorrect -- the response isn't a review, it's an acknowledgment.

**This is a patch, not a fix.** The correct fix is to extend the schema to cover the full behavioral vocabulary.

---

## The Fix (Proper -- Not Yet Implemented)

Extend `task_kind` enum to cover all behavioral domains:

```json
{
  "task_kind": {
    "enum": [
      "proposal", "review", "amendment", "ratification",
      "ack", "done", "status", "report", "handoff",
      "reject", "retry", "escalate"
    ]
  }
}
```

OR: Split into two fields:

```json
{
  "task_kind": { "enum": ["proposal", "review", "amendment", "ratification"] },
  "operation_type": { "enum": ["ack", "done", "status", "report", "handoff", "reject", "retry", "escalate"] }
}
```

The second approach is cleaner because it separates governance-process types from operational types. But it requires schema versioning and migration.

---

## Classification

**Type:** Specification Incompleteness
**Layer:** Schema / Interface Contract
**Invariant Violated:** Schema must model the full behavioral vocabulary of the system

**Related pattern:** In API design, this is "schema too tight" -- the contract is narrower than the actual behavior.

---

## Detection Pattern

**Symptoms:**
- Legitimate messages rejected by schema validation
- Agents forced to mislabel their outputs to pass validation
- Manual intervention required to fix "invalid" messages that are actually valid
- Schema enum values never or rarely used by actual behavior

**Investigation Steps:**
1. When a message fails schema validation, check if the rejected value is semantically correct
2. If yes: this is schema-behavior mismatch, not a bad message
3. Audit the schema enum against actual runtime behavior to find gaps

---

## Implications

### For System Design
- Schemas must be derived from observed behavior, not just from design intent
- Schema evolution must be a first-class concern (versioning, migration, backward compatibility)
- When behavior produces a value outside the schema, the default assumption should be "schema incomplete" not "behavior wrong"

### For Governance
- Governance constraints must distinguish between "behavior violates governance" and "behavior violates schema"
- The latter is a specification gap, not a compliance violation
- Over-tight schemas can prevent legitimate coordination between lanes

### For Verification
- Schema validation passes are necessary but not sufficient
- A schema that rejects legitimate behavior provides false confidence
- Schema coverage auditing should be part of lane health checks

---

## Generalization

This failure mode applies whenever:

1. A specification defines a closed set of allowed values
2. The runtime produces values not in that set
3. The system treats the runtime output as "invalid" rather than questioning the specification

This is the **specification-authority inversion**: the spec claims authority over behavior, but behavior is the ground truth. The spec should be derived from behavior, not the other way around.

**Exception:** When the spec deliberately constrains behavior (e.g., security policy). In that case, the runtime value IS wrong, and the block is correct. The key question is: **is this constraint intentional governance or accidental underspecification?**

---

## Related Failure Modes

- **NFM-018:** Temporal Constraint Misapplication (evaluating a constraint at the wrong phase -- same incident)
- **NFM-020:** Cross-Lane Observability Boundary (artifact resolution failure -- same incident)
- **NFM-002:** Self-State Aliasing (stale artifacts prioritized over live state -- similar pattern of specification overriding reality)

**Cross-Reference:** NFM-018, 019, and 020 form a triple: temporal mismatch (phase), schema mismatch (vocabulary), and scope mismatch (boundary). All three were exposed by a single end-to-end relay test.

---

**Decision Authority:** Archivist-Agent (governance root)
**Date:** 2026-04-24

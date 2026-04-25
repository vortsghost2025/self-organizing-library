# NFM-022: Evidence Pre-condition on New Tasks

**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Discovery:** 2026-04-25 (Archivist → SwarmMind relay loop test)

## Definition

The execution verification gate treats `evidence.required=true` as a pre-condition for all messages, including new actionable tasks that haven't been executed yet. This creates a causality violation: the system demands proof of completion before allowing work to begin.

## Evidence

- Archivist dispatched E2E test task to SwarmMind with `requires_action=true` and `evidence.required=true`
- SwarmMind lane-worker routed message to `blocked` (EXECUTION_NOT_VERIFIED) instead of `actionRequired`
- The artifact_path referenced a response that doesn't exist yet — because the task hasn't been executed
- Result: actionable tasks permanently blocked, unable to reach the work queue

## Root Cause

`hasUnresolvableEvidence()` was called unconditionally on all messages regardless of `requires_action` flag. For actionable tasks, missing evidence is expected — the task exists precisely to produce that evidence.

## Fix

Gate the evidence check with `!isActionable`:

```javascript
if (!isActionable && this.hasUnresolvableEvidence(msg)) {
  return { route: 'blocked', reason: 'EXECUTION_NOT_VERIFIED' };
}
```

Actionable tasks (`requires_action=true`) skip the evidence check and route to `actionRequired`. Non-actionable messages (informational, responses) still require verifiable evidence.

## Detection Pattern

- Actionable tasks routed to `blocked` instead of `actionRequired`
- EXECUTION_NOT_VERIFIED on messages with `requires_action=true`
- Task queue stays empty despite dispatched tasks
- Artifacts referenced in evidence_exchange don't exist yet

## Cross-References

- NFM-018: Temporal Constraint Misapplication (same causal inversion, different expression)
- NFM-020: Cross-Lane Observability Boundary (evidence resolution across lanes)

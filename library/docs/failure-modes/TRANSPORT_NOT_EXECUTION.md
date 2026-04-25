# NFM-023: Transport ≠ Execution

**Status:** DOCUMENTED, OBSERVED
**Severity:** MEDIUM
**Discovery:** 2026-04-25 (E2E relay loop test, SwarmMind observation)

## Definition

Successful message delivery (transport layer) does not imply successful task execution (application layer). A message can arrive at the correct inbox with valid signature and schema, yet the receiving lane may refuse execution because it lacks a live consumer — a running agent to process the action-required queue.

## Evidence

- relay-daemon delivered signed task to SwarmMind canonical inbox: SUCCESS
- lane-worker validated schema + signature: PASS
- lane-worker routed to action-required/: CORRECT
- No agent was running to execute the task: STALLED
- System correctly refused to pretend the task was done: CORRECT BEHAVIOR

## Key Insight

This is not a bug — it's a system maturity marker. The system is strong enough to reject invalid reality. Transport success without execution capability should not be confused with task completion.

## Mitigation

- task-executor.js: Daemon that polls action-required/, executes tasks, signs responses
- inbox-watcher.ps1: Background service that auto-runs lane-worker on new messages
- Together they close the gap between transport and execution

## Detection Pattern

- Messages delivered to inbox but never moved from action-required/
- Outbox empty despite incoming tasks
- lane-worker reports `action-required > 0` on repeated scans
- No agent session active for the lane

## Cross-References

- NFM-022: Evidence Pre-condition (tasks can't reach action-required if blocked by evidence check)
- NFM-020: Cross-Lane Observability (even if executed, can the sender verify it?)

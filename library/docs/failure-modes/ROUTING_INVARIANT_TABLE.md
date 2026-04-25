# Routing Invariant Table

**Version:** 1.0
**Date:** 2026-04-25
**Source:** `lane-worker.js` decideRoute() logic (lines 304-367)

---

## Message Categories

Every inbound message falls into exactly one of three operational categories:

| Category | Definition | Key Signals |
|----------|------------|-------------|
| **New Task** | Work that has not been executed yet | `requires_action=true`, no completion proof yet |
| **Completion Claim** | A lane reporting work is done | `requires_action=false` + `evidence_exchange.artifact_path` present |
| **Transport Ack** | Informational/heartbeat with no work or proof | `requires_action=false`, no completion proof, no artifact_path |

---

## Routing Invariants

### Gate Order (evaluated sequentially, first match wins)

| # | Condition | Route | Reason | NFM Reference |
|---|-----------|-------|--------|---------------|
| G1 | Schema invalid | **quarantine** | SCHEMA_INVALID | NFM-019, NFM-024 |
| G2 | Signature invalid | **blocked** | SIGNATURE_INVALID | — |
| G3 | Non-ASCII in top-level fields | **quarantine** | FORMAT_VIOLATION_NON_ASCII | NFM-019 fix 2 |
| G4 | Non-actionable + unresolvable evidence | **blocked** | EVIDENCE_REQUIRED_NO_ARTIFACT | NFM-022 |
| G5 | Fake completion proof (disposition without evidence) | **blocked** | FAKE_COMPLETION_PROOF | — |
| G6 | Actionable + no completion proof + auto-start | **inProgress** | ACTIONABLE_NO_PROOF_AUTO_START | — |
| G7 | Actionable + no completion proof | **actionRequired** | ACTIONABLE_NO_PROOF | NFM-018, NFM-022 |
| G8 | Completion gate failed | **blocked** | (gate.reason) | — |
| G9 | Actionable + completion proof + artifact not verified + auto-start | **inProgress** | ACTIONABLE_ARTIFACT_PENDING | — |
| G10 | Actionable + completion proof + artifact not verified | **actionRequired** | ACTIONABLE_ARTIFACT_PENDING | NFM-020, NFM-022 |
| G11 | Non-actionable + completion proof + artifact not verified | **blocked** | EXECUTION_NOT_VERIFIED | NFM-020 |
| G12 | All gates passed + artifact verified (or no artifact needed) | **processed** | (gate.reason) | — |

---

## Category x Route Matrix

| Route | New Task | Completion Claim | Transport Ack |
|-------|----------|-----------------|---------------|
| **quarantine** | OK (G1, G3) | OK (G1, G3) | OK (G1, G3) |
| **blocked** | NO* | OK (G2, G8, G11) | OK (G2, G4) |
| **actionRequired** | OK (G7, G10) | NO | NO |
| **inProgress** | OK (G6, G9) | NO | NO |
| **processed** | IF** | OK (G12) | OK (G12) |

*New tasks MUST NOT route to `blocked` for evidence reasons (NFM-022). Bad signature/schema goes to `blocked`/`quarantine`, but missing evidence on a new task is expected.

**A new task reaches `processed` ONLY after execution produces a verifiable artifact (second lane-worker pass after task-executor completes).

---

## Key Invariants (Non-Negotiable)

### INV-1: New tasks are never blocked for missing evidence
```
IF requires_action=true AND hasCompletionProof=false
THEN route IN {actionRequired, inProgress}
NEVER route = blocked with EVIDENCE_REQUIRED_NO_ARTIFACT
```
NFM-022 enforcement: `hasUnresolvableEvidence()` is skipped for actionable messages.

### INV-2: Completion claims require verifiable artifacts
```
IF requires_action=false AND hasCompletionProof=true
THEN route = processed  IF execution_verified=true
     route = blocked    IF execution_verified=false
```
NFM-020 enforcement: Non-actionable messages with unverified artifacts cannot enter processed/.

### INV-3: Transport acks need no artifact
```
IF requires_action=false AND hasCompletionProof=false
THEN route = processed (no artifact check needed)
```
Heartbeats, informational messages, notifications — no work claimed, no proof needed.

### INV-4: Schema rejection is terminal for the message
```
IF schema_result.valid=false THEN route = quarantine
```
The message must be re-sent with valid schema. No recovery path within the same message.

### INV-5: Actionable + artifact not verified = actionRequired, not blocked
```
IF requires_action=true AND hasCompletionProof=true AND execution_verified=false
THEN route = actionRequired (NOT blocked)
```
NFM-018 + NFM-022: The artifact may exist on the sender's filesystem but not yet on the receiver's.

### INV-6: Quarantine is for format/schema, blocked is for semantic/trust
```
quarantine = "this message is malformed" (schema, encoding)
blocked    = "this message is well-formed but untrustworthy or unverifiable" (signature, evidence)
```
Re-sending fixes quarantine. Additional evidence fixes blocked.

---

## NFM-022, NFM-023, NFM-024: Deterministic Test Cases

### NFM-022: Evidence Pre-condition on New Tasks

**Test 022-A: Actionable task with evidence.required=true, no artifact_path**

```json
{
  "id": "test-022a",
  "from": "archivist",
  "to": "swarmmind",
  "type": "task",
  "task_kind": "proposal",
  "priority": "P1",
  "requires_action": true,
  "evidence": { "required": true },
  "evidence_exchange": { "artifact_path": null, "artifact_type": "log" },
  "subject": "Do work",
  "body": "This task needs doing",
  "timestamp": "2026-04-25T00:00:00Z",
  "schema_version": "1.3"
}
```

Expected: `actionRequired` (G7)
Prior bug: `blocked` with EVIDENCE_REQUIRED_NO_ARTIFACT
Invariant: INV-1

**Test 022-B: Non-actionable response with evidence.required=true, no artifact_path**

```json
{
  "id": "test-022b",
  "from": "swarmmind",
  "to": "archivist",
  "type": "response",
  "task_kind": "done",
  "priority": "P2",
  "requires_action": false,
  "evidence": { "required": true },
  "evidence_exchange": { "artifact_path": null, "artifact_type": "response" },
  "subject": "Claim done",
  "body": "I finished it",
  "timestamp": "2026-04-25T00:00:00Z",
  "schema_version": "1.3"
}
```

Expected: `blocked` with EVIDENCE_REQUIRED_NO_ARTIFACT (G4)
This is correct: A completion claim with no artifact is unverified.

**Test 022-C: Actionable task with evidence.required=false, no artifact_path**

```json
{
  "id": "test-022c",
  "from": "archivist",
  "to": "kernel",
  "type": "task",
  "task_kind": "proposal",
  "priority": "P2",
  "requires_action": true,
  "evidence": { "required": false },
  "evidence_exchange": { "artifact_path": null, "artifact_type": "log" },
  "subject": "Optional proof task",
  "body": "Do this if you can",
  "timestamp": "2026-04-25T00:00:00Z",
  "schema_version": "1.3"
}
```

Expected: `actionRequired` (G7)
This always worked: No evidence required, no conflict.

---

### NFM-023: Transport != Execution

**Test 023-A: Delivered to action-required/, no consumer**

Setup: Place valid signed task in `lanes/kernel/inbox/action-required/`. Do NOT run task-executor.

Expected state after 60 seconds:
- File still in `action-required/`
- Outbox empty
- No response in sender's inbox
- heartbeat shows `action_required > 0`

This is NOT a bug. The system correctly does not pretend the task is done.
Detection: Monitor `action-required/` count > 0 for > N polling cycles.

**Test 023-B: Delivered to action-required/, consumer runs**

Setup: Same as 023-A, then run `task-executor.js`.

Expected:
- Task file moves from `action-required/` to `processed/`
- Signed response appears in target lane's inbox
- Outbox contains response copy
- Next lane-worker on target inbox routes response to `processed/`

**Test 023-C: Delivered to canonical inbox, lane-worker not running**

Setup: Place valid signed task directly in `lanes/kernel/inbox/` (not action-required/).

Expected: File stays in inbox root. Not admitted (no lane-worker pass).
vs. 023-A: In 023-A, lane-worker admitted it but task-executor hasn't consumed. In 023-C, not even admitted yet.

---

### NFM-024: Schema Enum Insufficient for Operational Vocabulary

**Test 024-A: artifact_type="response" with old schema (4-value enum)**

```json
{
  "id": "test-024a",
  "from": "archivist",
  "to": "kernel",
  "type": "task",
  "task_kind": "proposal",
  "priority": "P1",
  "requires_action": true,
  "evidence": { "required": true },
  "evidence_exchange": { "artifact_path": "lanes/kernel/outbox/result.json", "artifact_type": "response" },
  "subject": "Do work and respond",
  "body": "Task with response artifact type",
  "timestamp": "2026-04-25T00:00:00Z",
  "schema_version": "1.3"
}
```

Expected with old schema: `quarantine` with SCHEMA_INVALID
Expected with fixed schema: `actionRequired` (G7 or G10)
NFM-024 fix: Extended enum to include response, report, artifact.

**Test 024-B: artifact_type="benchmark" (always-valid value)**

```json
{
  "id": "test-024b",
  "from": "archivist",
  "to": "kernel",
  "type": "task",
  "task_kind": "proposal",
  "priority": "P1",
  "requires_action": true,
  "evidence": { "required": true },
  "evidence_exchange": { "artifact_path": "lanes/kernel/outbox/bench.json", "artifact_type": "benchmark" },
  "subject": "Run benchmark",
  "body": "Standard benchmark task",
  "timestamp": "2026-04-25T00:00:00Z",
  "schema_version": "1.3"
}
```

Expected: `actionRequired` (G10)
This always worked: "benchmark" was in the original enum.

**Test 024-C: artifact_type="future_type" with current schema**

```json
{
  "id": "test-024c",
  "from": "archivist",
  "to": "kernel",
  "type": "task",
  "task_kind": "proposal",
  "priority": "P1",
  "requires_action": true,
  "evidence": { "required": true },
  "evidence_exchange": { "artifact_path": null, "artifact_type": "future_type" },
  "subject": "Hypothetical",
  "body": "Test with unknown artifact type",
  "timestamp": "2026-04-25T00:00:00Z",
  "schema_version": "1.3"
}
```

Expected: `quarantine` with SCHEMA_INVALID
This is correct: Unknown types must be added to schema before use.
Design rule: When a new artifact_type is needed, extend schema FIRST, then use it.

---

## CI Gate Specifications

### Gate NFM-022: Evidence Pre-condition

```javascript
// Test 022-A: actionable + no artifact -> actionRequired
const msg = { requires_action: true, evidence: { required: true },
  evidence_exchange: { artifact_path: null } };
const result = laneWorker.decideRoute(msg, { valid: true }, { valid: true });
assert(result.queue === 'actionRequired',
  'NFM-022: actionable task blocked for missing evidence');

// Test 022-B: non-actionable + no artifact -> blocked
const msg2 = { requires_action: false, evidence: { required: true },
  evidence_exchange: { artifact_path: null } };
const result2 = laneWorker.decideRoute(msg2, { valid: true }, { valid: true });
assert(result2.queue === 'blocked',
  'NFM-022: non-actionable claim without evidence must be blocked');
```

### Gate NFM-023: Transport != Execution

```
1. Create valid signed task in action-required/
2. Wait 30 seconds
3. Assert: file still in action-required/ (no phantom completion)
4. Run task-executor
5. Assert: file moved to processed/, response in outbox/
```

### Gate NFM-024: Schema Enum Coverage

```javascript
// Test 024-A: artifact_type=response must pass validation
const msg = { /* full message */ evidence_exchange: { artifact_type: 'response' } };
const result = schemaValidator.validate(msg);
assert(result.valid === true,
  'NFM-024: artifact_type=response must pass schema validation');

// Test 024-C: unknown type must fail
const msg2 = { /* full message */ evidence_exchange: { artifact_type: 'future_type' } };
const result2 = schemaValidator.validate(msg2);
assert(result2.valid === false,
  'NFM-024: unknown artifact_type must fail schema validation');
```

---

## failure_mode_id Commit Convention

All remediation commits and postmortems MUST reference the NFM ID:

**Commit message format:**
```
fix: <description> (NFM-022)
feat: <description> (NFM-024)
```

**Postmortem format:**
```markdown
## Postmortem: <title>
**NFM ID:** NFM-022
**Date:** 2026-04-25
**Detection:** <how was it found>
**Root Cause:** <one paragraph>
**Fix:** <what was changed>
**Test:** <link to deterministic test>
**CI Gate:** <link to gate specification>
```

This ensures every fix is traceable to its failure mode and every failure mode has at least one deterministic test + one CI gate preventing regression.

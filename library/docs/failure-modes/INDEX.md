# Failure Modes Index

**Last Updated:** 2026-04-26
**Total Named Failure Modes:** 14

---

## Active Failure Modes

### NFM-001: Process Isolation Failure
**Status:** DOCUMENTED, MITIGATION IN PROGRESS
**Severity:** HIGH
**Definition:** Agent spawns child process that bypasses lane context gate
**Discovery:** External lane analysis
**File:** Not yet created

---

### NFM-002: Self-State Aliasing
**Status:** DOCUMENTED, NOT YET MITIGATED
**Severity:** HIGH
**Definition:** Active agent determines own status from stale artifacts instead of live runtime state
**Discovery:** 2026-04-18T06:41:53Z (Archivist incident)
**File:** `SELF_STATE_ALIASING_FAILURE_MODE.md`

**Key Evidence:**
- SwarmMind live session: `1776476695493-28240`
- Archivist terminated registry entry: `1776403587854-50060`
- False conclusion: "Archivist terminated" while active

**Fix Required:** Source-of-truth precedence (runtime > lock > registry > history)

---

### NFM-003: Write-Before-Gate Race
**Status:** DOCUMENTED, NOT YET MITIGATED
**Severity:** MEDIUM
**Definition:** Agent uses fs bypass path (internalBinding, fs.promises, io_uring, native addons) to write before gate intercepts
**Discovery:** 2026-04-18 (External lane analysis)
**File:** `WRITE_BEFORE_GATE_RACE.md`

**Bypass Paths:**
- `internalBinding('fs')` -- Internal C++ binding
- `fs.promises` -- Promise-based API
- `io_uring` -- Linux async I/O
- Native C++ addons -- Direct system calls

**Current Mitigation:** Phase 2 covers sync methods only
**Phase 2.5 Fix:** Wrap fs.promises, add test coverage
**Phase 3 Fix:** OS-level file permissions, file system watcher

---

### NFM-018: Temporal Constraint Misapplication
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** A constraint is evaluated before the system reaches a state in which the constraint can be satisfied. Post-condition check applied at pre-condition phase.
**Discovery:** 2026-04-24 (Archivist lane-worker routing incident)
**File:** `TEMPORAL_CONSTRAINT_MISAPPLICATION.md`

**Key Evidence:**
- Actionable task with artifact_path routed to `blocked` (EXECUTION_NOT_VERIFIED)
- Artifact cannot exist before task is executed (causally impossible)
- Fixed: actionable + pending artifact routes to `actionRequired`, not `blocked`

---

### NFM-019: Schema-Behavior Mismatch
**Status:** DOCUMENTED, NOT YET MITIGATED (schema patch pending)
**Severity:** MEDIUM
**Definition:** Schema defines a closed set of allowed values that does not cover the full behavioral vocabulary of the system. Legitimate messages rejected as "invalid."
**Discovery:** 2026-04-24 (SwarmMind onboarding response rejected for task_kind="ack")
**File:** `SCHEMA_BEHAVIOR_MISMATCH.md`

**Key Evidence:**
- SwarmMind produced `task_kind: "ack"` (legitimate acknowledgment)
- Schema only allowed: proposal, review, amendment, ratification
- Temporary fix: changed to "review"; proper fix: extend schema enum

---

### NFM-020: Cross-Lane Observability Boundary
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** Execution verification cannot resolve artifact paths across lane boundaries. Each lane's verification scope is limited to its own filesystem root.
**Discovery:** 2026-04-24 (Archivist execution gate failed on SwarmMind response artifact)
**File:** `CROSS_LANE_OBSERVABILITY_BOUNDARY.md`

**Key Evidence:**
- SwarmMind artifact at `S:/SwarmMind/lanes/swarmmind/outbox/...`
- Archivist execution gate looked in `S:/Archivist-Agent/lanes/swarmmind/outbox/...`
- Result: OUTSIDE_ALLOWED_ROOTS, artifact unresolvable
- Proves: execution verification is lane-relative unless shared observability exists

**Fix Applied (2026-04-25):**
- `resolveRelativePath()` now checks filesystem existence across all allowed roots
- Before: resolved to first containment match (wrong root)
- After: resolves to root where file actually exists (correct root)
- All 4 lanes have all 4 lane roots in `config/allowed_roots.json`

---

### NFM-022: Evidence Pre-condition on New Tasks
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** The execution verification gate treats evidence.required=true as a pre-condition for all messages, including new actionable tasks that haven't been executed yet. Causality violation: demands proof of completion before work begins.
**Discovery:** 2026-04-25 (Archivist → SwarmMind relay loop test)
**File:** `EVIDENCE_PRECONDITION_ON_NEW_TASKS.md`

**Key Evidence:**
- Actionable task with requires_action=true routed to blocked (EXECUTION_NOT_VERIFIED)
- Artifact cannot exist before task is executed (causally impossible)
- Fixed: skip hasUnresolvableEvidence for actionable tasks (requires_action=true)

---

### NFM-023: Transport ≠ Execution
**Status:** DOCUMENTED, OBSERVED
**Severity:** MEDIUM
**Definition:** Successful message delivery (transport layer) does not imply successful task execution (application layer). A delivered message with valid signature may sit in action-required/ indefinitely if no agent is running to consume it.
**Discovery:** 2026-04-25 (E2E relay loop test, SwarmMind observation)
**File:** `TRANSPORT_NOT_EXECUTION.md`

**Key Insight:** This is not a bug — the system correctly refuses to pretend a task is done when it hasn't been executed. Transport success without execution capability should not be confused with task completion.

---

### NFM-024: Schema Enum Insufficient for Operational Vocabulary
**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Definition:** Schema's evidence_exchange.artifact_type enum defined only 4 values (benchmark, profile, release, log) but the operational system needed "response" for task reply messages. Tasks dispatched with artifact_type: "response" were quarantined as SCHEMA_INVALID.
**Discovery:** 2026-04-25 (Kernel lane quarantined Archivist tasks)
**File:** `SCHEMA_ENUM_INSUFFICIENT.md`

**Key Evidence:**
- Kernel quarantined 2 Archivist tasks: artifact_type "response" not in allowed values
- Signature valid, message structure correct — only the enum was too narrow
- Fixed: extended enum to include response, report, artifact

---

### NFM-021: Relative Path Resolution Failure
**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Definition:** Artifact-resolver only handled absolute paths. Relative evidence_exchange.artifact_path values were always rejected with OUTSIDE_ALLOWED_ROOTS.
**Discovery:** 2026-04-25 (Archivist lane-worker blocking SwarmMind multi-task review)
**File:** `RELATIVE_PATH_RESOLUTION_FAILURE.md`

**Key Evidence:**
- SwarmMind review had relative `artifact_path = "lanes/archivist/inbox/..."`
- Rejected: `OUTSIDE_ALLOWED_ROOTS` (path didn't start with any allowed root)
- Fixed: `resolveRelativePath()` joins relative paths against allowed roots
- Same message processed successfully after fix: `execution_verified=true`

---

### NFM-025: Signature Validity Under Compromised Key
**Status:** ACTIVE RISK - no mitigation
**Severity:** CRITICAL
**Definition:** A valid cryptographic signature does not guarantee the message was authorized by the lane owner. If a private key is compromised (leaked via git, stolen from disk, extracted from memory), any attacker can produce messages that pass every gate in our pipeline.
**Discovery:** 2026-04-26 (Architecture review of key lifecycle gaps)
**File:** `docs/ops/TRUST_LAYER_V1.md` (Archivist)

**Key Evidence:**
- Private keys existed in git history (removed in commit 196785b)
- Key material on local disk with no access controls beyond OS file permissions
- No key rotation, revocation, or compromise detection mechanism exists

---

### NFM-026: Trust Store Divergence Across Lanes
**Status:** Partially mitigated (manual sync, no runtime check)
**Severity:** HIGH
**Definition:** Each lane maintains its own copy of trust-store.json. If one copy is modified (accidentally or maliciously), it will accept/reject different messages than the other lanes. No automated cross-lane consistency verification at runtime.
**Discovery:** 2026-04-26 (Architecture review)
**File:** `docs/ops/TRUST_LAYER_V1.md` (Archivist)

---

### NFM-027: Key Rotation Race Condition
**Status:** Not yet encountered
**Severity:** MEDIUM
**Definition:** During a key rotation, there is a window where some lanes have the new key and others still have the old key. Messages signed with the old key are rejected by updated lanes; messages signed with the new key are rejected by lanes that haven't updated yet.
**Discovery:** 2026-04-26 (Predicted from architecture review)
**File:** `docs/ops/TRUST_LAYER_V1.md` (Archivist)

---

### NFM-028: Stale Signature Replay Attack
**Status:** Partially mitigated (idempotency_key, no freshness check)
**Severity:** MEDIUM
**Definition:** A previously valid signed message can be re-delivered to a lane's inbox. If timestamp freshness is not checked, stale messages could be re-processed, causing duplicate execution of already-completed tasks.
**Discovery:** 2026-04-26 (Predicted from architecture review)
**File:** `docs/ops/TRUST_LAYER_V1.md` (Archivist)

---

## Routing Invariants

**Authoritative document:** `ROUTING_INVARIANT_TABLE.md`

Three message categories, twelve gates (G1-G12), six non-negotiable invariants (INV-1 through INV-6).

| Category | Route Rule |
|----------|------------|
| New Task | actionRequired or inProgress (never blocked for evidence) |
| Completion Claim | processed if artifact verified, blocked if not |
| Transport Ack | processed (no artifact needed) |

Key invariant: **INV-1** (NFM-022) = new tasks never blocked for missing evidence. **INV-2** (NFM-020) = completion claims require verifiable artifacts. **INV-6** = quarantine for format, blocked for trust.

---

## Cross-References

| Failure Mode | Related To | Shared Concept |
|--------------|------------|----------------|
| NFM-001 | NFM-003 | Bypass of behavioral enforcement |
| NFM-002 | NFM-001 | Source-of-truth confusion |
| NFM-003 | NFM-001 | Implementation gap in enforcement |
| NFM-018 | NFM-002 | Temporal ordering of constraint evaluation |
| NFM-018 | NFM-019, NFM-020 | Same incident (relay loop test) |
| NFM-019 | NFM-018, NFM-020 | Same incident (relay loop test) |
| NFM-020 | NFM-003, NFM-018 | Epistemic boundary / observability limits |
| NFM-020 | NFM-018, NFM-019 | Same incident (relay loop test) |
| NFM-021 | NFM-020 | Relative path as special case of observability boundary |
| NFM-022 | NFM-018 | Same causal inversion — demand proof before work is done |
| NFM-023 | NFM-022 | Transport without consumer = stalled execution |
| NFM-024 | NFM-019 | Same class — schema enum too narrow for behavior |

---

## Detection Patterns

### NFM-001: Process Isolation Failure
- Agent spawned child process
- Gate shows no log for action
- Action occurred outside lane boundary

### NFM-002: Self-State Aliasing
- Agent claims wrong status about itself
- Live process contradicts registry/lock
- "I am terminated" while actively operating

### NFM-003: Write-Before-Gate Race
- File exists but no gate log entry
- Cross-lane write appears but gate shows ALLOWED
- Agent claims didn't write, but content matches agent

### NFM-018: Temporal Constraint Misapplication
- Actionable tasks routed to `blocked` instead of `actionRequired`
- EXECUTION_NOT_VERIFIED on messages that haven't been executed yet
- Tasks with requires_action=true never reach agent work queue

### NFM-019: Schema-Behavior Mismatch
- Legitimate messages rejected by schema validation
- Agents forced to mislabel outputs to pass validation
- Schema enum values never or rarely used by actual behavior

### NFM-020: Cross-Lane Observability Boundary
- EXECUTION_NOT_VERIFIED with OUTSIDE_ALLOWED_ROOTS on cross-lane messages
- Artifact exists at sender's path but not in receiver's scope
- Cross-lane messages always fail execution verification when carrying artifact_path

### NFM-021: Relative Path Resolution Failure
- EXECUTION_NOT_VERIFIED with OUTSIDE_ALLOWED_ROOTS on messages with relative artifact_path
- Artifact exists at `<allowed-root>/<relative-path>` but resolver only checked raw path
- Fixed: resolveRelativePath() joins relative path against each allowed root

### NFM-022: Evidence Pre-condition on New Tasks
- Actionable tasks routed to `blocked` instead of `actionRequired`
- EXECUTION_NOT_VERIFIED on messages with requires_action=true and no artifact yet
- Causality violation: system demands proof of completion before task starts

### NFM-023: Transport ≠ Execution
- Messages delivered to inbox but never moved from action-required/
- Outbox empty despite incoming tasks
- No agent session active for the lane (live consumer missing)

### NFM-024: Schema Enum Insufficient for Operational Vocabulary
- Signed, valid messages quarantined as SCHEMA_INVALID
- Error detail mentions specific enum field value not in allowed list
- The rejected value is semantically meaningful in the system's operational context

---

## Severity Levels

| Level | Definition | Action Required |
|-------|------------|-----------------|
| **HIGH** | Constitutional violation possible | Immediate mitigation required |
| **MEDIUM** | Lane boundary bypass possible | Mitigation in next phase |
| **LOW** | Degradation or inconvenience | Document, monitor |

---

## Mitigation Phases

| Phase | Scope | Failure Modes Addressed |
|-------|-------|-------------------------|
| Phase 2 | In-process enforcement | Partial (sync fs only) |
| Phase 2.5 | Extended process coverage | NFM-003 (fs.promises) |
| Phase 3 | OS-level enforcement | NFM-001, NFM-002, NFM-003 (full) |

---

## Commitment

All named failure modes are tracked until Phase 3 provides OS-level enforcement. New failure modes discovered during operation must be documented with:
- Unique ID (NFM-XXX)
- Discovery date and source
- Severity classification
- Detection pattern
- Recommended fix
- Cross-references to related modes

---

**This index is the authoritative registry of known failure modes.**

# Failure Modes Index

**Last Updated:** 2026-04-24
**Total Named Failure Modes:** 6

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
**Status:** DOCUMENTED, PARTIALLY MITIGATED
**Severity:** HIGH
**Definition:** Execution verification cannot resolve artifact paths across lane boundaries. Each lane's verification scope is limited to its own filesystem root.
**Discovery:** 2026-04-24 (Archivist execution gate failed on SwarmMind response artifact)
**File:** `CROSS_LANE_OBSERVABILITY_BOUNDARY.md`

**Key Evidence:**
- SwarmMind artifact at `S:/SwarmMind/lanes/swarmmind/outbox/...`
- Archivist execution gate looked in `S:/Archivist-Agent/lanes/swarmmind/outbox/...`
- Result: OUTSIDE_ALLOWED_ROOTS, artifact unresolvable
- Proves: execution verification is lane-relative unless shared observability exists

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

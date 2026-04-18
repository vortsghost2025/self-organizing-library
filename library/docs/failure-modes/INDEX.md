# Failure Modes Index

**Last Updated:** 2026-04-18
**Total Named Failure Modes:** 3

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
- `internalBinding('fs')` — Internal C++ binding
- `fs.promises` — Promise-based API
- `io_uring` — Linux async I/O
- Native C++ addons — Direct system calls

**Current Mitigation:** Phase 2 covers sync methods only
**Phase 2.5 Fix:** Wrap fs.promises, add test coverage
**Phase 3 Fix:** OS-level file permissions, file system watcher

---

## Cross-References

| Failure Mode | Related To | Shared Concept |
|--------------|------------|----------------|
| NFM-001 | NFM-003 | Bypass of behavioral enforcement |
| NFM-002 | NFM-001 | Source-of-truth confusion |
| NFM-003 | NFM-001 | Implementation gap in enforcement |

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

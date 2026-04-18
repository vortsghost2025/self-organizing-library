# Named Failure Mode: Write-Before-Gate Race

**ID:** NFM-003
**Discovered:** 2026-04-18
**Source:** External isolated lane analysis
**Severity:** MEDIUM
**Status:** DOCUMENTED, NOT YET MITIGATED

---

## Definition

The `fs` monkey-patch in LaneContextGate covers `fs.writeFileSync`, `fs.appendFileSync`, `fs.mkdirSync`, and `fs.unlinkSync`. However, Node.js has multiple paths to disk that bypass these high-level methods:

1. `internalBinding('fs')` — Internal C++ binding
2. `fs.promises` — Promise-based API (may use different code path)
3. `io_uring` — Linux async I/O (via libuv)
4. Native C++ addons — Direct system calls

**The Race:** If an agent uses any of these bypass paths, the write reaches disk before the gate can intercept.

---

## Evidence

From external lane analysis:
> "Modern Node.js often uses internalBinding('fs'). If the patch only covers the high-level fs.writeFileSync, an agent using a more obscure method (or a library that bypasses fs for io_uring or similar) will ignore the gate."

---

## Current Mitigation

**Phase 2:** Partial coverage only. The gate intercepts synchronous fs methods but not:
- Promise-based methods
- Internal bindings
- Child processes (separate issue, covered by NFM-001)

---

## Recommended Fix (Phase 2.5/3)

### Phase 2.5 (SwarmMind):
1. Wrap `fs.promises` methods in addition to sync methods
2. Add test coverage for promise-based writes
3. Document known bypass paths in code comments

### Phase 3 (Archivist-Level):
1. OS-level file permissions (ACL/chmod) as "Physical Lattice"
2. File system watcher that HALTS on unauthorized writes
3. Audit logging of all disk activity regardless of code path

---

## Detection Pattern

**Symptoms:**
- Cross-lane write appears in logs but gate shows ALLOWED
- File exists but no gate log entry for the write
- Agent claims it didn't write the file but file has agent's content

**Investigation Steps:**
1. Check if agent used `fs.promises.*` instead of `fs.*Sync`
2. Check if agent spawned a child process
3. Check if agent used a native module

---

## Classification

**Type:** Implementation Gap
**Layer:** Behavioral → Enforcement
**Authority Impact:** Can bypass lane boundaries if agent is sophisticated

---

## Related Failure Modes

- **NFM-001:** Process Isolation Failure (child processes bypass gate)
- **NFM-002:** Self-State Aliasing (identity confusion from stale artifacts)

**Cross-Reference:** All three failure modes share a common theme: implementation gaps in behavioral enforcement that allow bypassing lane boundaries.

---

## Commitment

This failure mode will be tracked until Phase 3 provides OS-level enforcement.

---

## Layer Status Table (Per Authority 100 Decision)

| Layer | Status | Enforcement Level |
|-------|--------|-------------------|
| JS fs API | ✅ gated | JS-level (Phase 2) |
| fs.promises | ⚠️ verify | JS-level (Phase 2.5) |
| child_process | ⚠️ verify | JS-level (Phase 2.5) |
| internalBinding | ❌ exposed | **REQUIRES OS-LEVEL** |
| OS boundary | ❌ none | Phase 3 scope |

**Critical finding:** process.binding is NOT safely interceptable in userland. Attempting to patch it creates false sense of security. Must escalate to OS boundary.

---

## Escalation Path

1. **Phase 2.5:** Verify fs.promises and child_process blocked
2. **Document:** internalBinding as "requires OS-level enforcement"
3. **Phase 3:** OS-level file permissions, ACLs, seccomp-bpf

**STOP condition:** Do NOT proceed to Phase 3 until Phase 2.5 verification complete.

---

## Related Documents

- `S:\Archivist-Agent\.artifacts\DECISION_NFM003_RESPONSE_STRATEGY.md` — Sequential execution decision
- `S:\Archivist-Agent\.lane-relay\library-inbox.md` — Verification task
- `S:\Archivist-Agent\.lane-relay\swarmmind-inbox.md` — SwarmMind task

---

**Decision Authority:** Human Operator (via external isolated lane guidance)
**Date:** 2026-04-18

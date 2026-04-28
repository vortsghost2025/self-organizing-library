# Failure Modes Index

**Last Updated:** 2026-04-27
**Total Named Failure Modes:** 36

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

### NFM-004: Identity Enforcement Soft Mode
**Status:** DOCUMENTED, MITIGATED
**Severity:** P0
**Definition:** `verified=false` middle ground permits unsigned messages to enter processing instead of being rejected
**Discovery:** 2026-04-19 (Enforcement audit)
**File:** Not yet created

**Key Evidence:**
- IdentityEnforcer was running in 'warn' mode, not 'enforce' mode
- Unsigned messages received `verified=false` but still entered processing
- Fixed: switched to enforce mode — unsigned → expired/, no middle ground

---

### NFM-005: Trust Store Format Mismatch
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** Trust store used flat format (lane IDs as top-level keys) but Verifier expected nested `{ keys: {} }` format
**Discovery:** 2026-04-19 (Cross-lane key_id verification)
**File:** Not yet created

**Key Evidence:**
- Verifier.js and TrustStoreManager.js now normalize both formats
- Flat format automatically converted to nested format at load time

---

### NFM-006: Subagent File Destruction
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** AI agent overwrites 138-line file with 22-line fragment, destroying content silently
**Discovery:** 2026-04-20 (Subagent session)
**File:** Not yet created

**Key Evidence:**
- Write tool can silently fail on Windows
- Always verify file content and line count after writes

---

### NFM-007: Undefined TRUST_STORE_PATH
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** constants.js didn't export what Verifier.js imported — `TRUST_STORE_PATH` was undefined
**Discovery:** 2026-04-19 (Runtime crash)
**File:** Not yet created

---

### NFM-008: Nonexistent Method Call
**Status:** DOCUMENTED, MITIGATED
**Severity:** HIGH
**Definition:** `trustStore.loadFromArchivist()` crashes at runtime — method never existed
**Discovery:** 2026-04-19 (Runtime crash)
**File:** Not yet created

---

### NFM-009: Freshness ≠ Liveness
**Status:** DOCUMENTED, NOT YET MITIGATED
**Severity:** MEDIUM
**Definition:** Heartbeat/git checks measure artifact freshness, not process liveness. A stale artifact does not mean a dead process.
**Discovery:** 2026-04-19 (Liveness audit)
**File:** Not yet created

---

### NFM-010: Canonical vs Mirror Delivery
**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Definition:** Messages written to local mirror copy instead of target's actual repository path
**Discovery:** 2026-04-20 (Cross-lane delivery audit)
**File:** Not yet created

**Key Evidence:**
- Senders must write to target's CANONICAL path, not their own local mirror
- Fixed: delivery paths now target absolute canonical paths

---

### NFM-011: Schema Enum Mismatch
**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Definition:** `kernel` vs `kernel-lane` inconsistency between to-enum and canonical_paths
**Discovery:** 2026-04-20 (Schema validation audit)
**File:** Not yet created

---

### NFM-012: Non-Compliant Message Emission
**Status:** DOCUMENTED, OBSERVED
**Severity:** MEDIUM
**Definition:** SwarmMind uses `from_lane`/`to_lane` instead of schema-compliant `from`/`to`
**Discovery:** 2026-04-20 (Inbox watcher rejection logs)
**File:** Not yet created

**Key Evidence:**
- Library sent compliance notice to SwarmMind
- Non-compliant messages rejected at enforcement gate (by design)

---

### NFM-013: Cryptographically Wrong Key IDs
**Status:** DOCUMENTED, MITIGATED
**Severity:** CRITICAL
**Definition:** Sync script propagated one lane's key_id to all trust store entries instead of computing each independently
**Discovery:** 2026-04-20 (DER fingerprint verification)
**File:** Not yet created

**Key Evidence:**
- All 4 lanes had identical key_ids in trust store
- Fixed: each lane's key_id now computed as SHA-256 of its own DER public key

---

### NFM-014: Silent Atomic Write Failure
**Status:** DOCUMENTED, MITIGATED
**Severity:** CRITICAL
**Definition:** Windows file locking causes write to appear successful but content not persisted to disk
**Discovery:** 2026-04-20 (Cross-platform testing)
**File:** Not yet created

**Key Evidence:**
- Atomic writes can silently fail on Windows
- Always verify file content after write operations

---

### NFM-015: Disappearing Identity Directory
**Status:** DOCUMENTED, OBSERVED
**Severity:** HIGH
**Definition:** SwarmMind `.identity/` directory vanished due to git/.gitignore misconfiguration
**Discovery:** 2026-04-20 (Identity key audit)
**File:** Not yet created

---

### NFM-016: Batch Terminal Decision Stamps
**Status:** DOCUMENTED, MITIGATED
**Severity:** P0
**Definition:** Authority agent applied blanket "obviated" terminal_decision stamp to 64/67 files without per-message proof of resolution
**Discovery:** 2026-04-22 (P0 remediation audit)
**File:** Not yet created

**Key Evidence:**
- 22 action-required messages recovered, 5 fail-closed gaps patched
- Per-message verification now required before stamping terminal_decision

---

### NFM-017: Cryptographically Invalid PEM
**Status:** ACTIVE RISK - awaiting SwarmMind regeneration
**Severity:** CRITICAL
**Definition:** SwarmMind trust-store entry fails `crypto.createPublicKey()` — PEM is not a valid RSA public key
**Discovery:** 2026-04-22 (Trust store verification)
**File:** Not yet created

**Key Evidence:**
- Library discovered and escalated; Library cannot fix SwarmMind's keys
- Blocks 2 recovery tests (9/11 instead of 11/11)
- Awaiting SwarmMind key regeneration or operator intervention

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

### NFM-029: Invalid task_kind at Dispatch
**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Definition:** Dispatching a task with `task_kind="task"` causes SCHEMA_INVALID quarantine because "task" is a valid `type` enum value but NOT a valid `task_kind` enum value. The two enums have overlapping but distinct allowed values.
**Discovery:** 2026-04-26 (Subagent batch testing — 3 messages quarantined)
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-001)

**Key Evidence:**
- `task-task-1777227262664.json` quarantined: task_kind="task" not in allowed enum
- `task-task-17772276063463v93.json` quarantined: same
- `task-task-1777227606346tinw.json` quarantined: same
- Fix: use task_kind="report" or "status" for work requests

---

### NFM-030: Windows Path Normalization Mismatch
**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Definition:** `path.join()` on Windows produces backslash paths (`S:\SwarmMind\...`) but allowed-root comparisons used forward-slash strings (`S:/SwarmMind`). File read tasks for valid paths were rejected as "outside allowed roots".
**Discovery:** 2026-04-26 (Subagent file read test — first attempt failed)
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-005)

**Key Evidence:**
- `S:\SwarmMind\lanes\broadcast\system_state.json` rejected vs `S:/SwarmMind`
- Fix: normalize both sides with `.replace(/\\/g, '/')` before comparison

---

### NFM-031: Long-Running Script Timeout
**Status:** DOCUMENTED, MITIGATED
**Severity:** LOW
**Definition:** Daemon scripts (heartbeat.js, relay-daemon.js, inbox-watcher.ps1) run indefinitely. When dispatched as "run script" tasks, the 30-second timeout kills them with ETIMEDOUT, producing confusing error responses.
**Discovery:** 2026-04-26 (Batch test: "run script heartbeat" → ETIMEDOUT)
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-011)

**Key Evidence:**
- `response-task-report-1777231724984nnj0.json`: exit -1, ETIMEDOUT
- Fix: auto-detect daemon scripts by name and skip with clear message

---

### NFM-032: Cross-Lane Read Scope
**Status:** ACTIVE RISK - accepted at Level 1
**Severity:** MEDIUM (escalates to HIGH at Level 2)
**Definition:** A delegated subagent can read files across all lane roots, not just its own. This means SwarmMind can access Kernel, Library, and Archivist filesystem contents via file-read tasks. The current path safety model allows cross-lane reads but restricts writes to own lane.
**Discovery:** 2026-04-26 (Library throughput validation flagged this)
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-019)

**Key Evidence:**
- "Read Kernel trust store" → S:/kernel-lane/lanes/broadcast/trust-store.json (success)
- "Read Library NFM index" → S:/self-organizing-library/library/docs/failure-modes/INDEX.md (success)
- This is by design at Level 1 (local dev, single operator)
- Risk materializes when multiple operators or external agents exist

---

### NFM-033: Test Suite Exit Code Semantics
**Status:** DOCUMENTED, MITIGATED
**Severity:** LOW
**Definition:** Test suites (recovery-test-suite.js) exit with code 1 even when most tests pass (e.g. 10/11 PASS, 1 FAIL from lane_liveness). The executor treated any non-zero exit as a hard failure, obscuring the actual pass/fail ratio.
**Discovery:** 2026-04-26 (Recovery test dispatched as subagent task)
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-012)

**Key Evidence:**
- `response-task-report-1777227998797ksgf.json`: "exit 1" but 10/11 tests pass
- The 1 failure (lane_liveness) is expected — not all lanes have active watchers
- Fix: parse PASS/FAIL counts from stdout, report "10P/1F" not just "exit 1"

---

### NFM-034: system_state Field Name Mismatch
**Status:** DOCUMENTED, MITIGATED
**Severity:** LOW
**Definition:** The status report function read `ss.system_state` but the actual JSON field is `ss.system_status`. Result: status reports returned "unknown" instead of "consistent".
**Discovery:** 2026-04-26 (First batch test: system_state: unknown)
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-013)

**Key Evidence:**
- system_state.json contains `system_status: "consistent"`
- Code read `ss.system_state` → undefined → "unknown"
- Fix: read `ss.system_status` instead

---

### NFM-035: Grep Tool Unavailability on Windows
**Status:** DOCUMENTED, MITIGATED
**Severity:** LOW
**Definition:** The grep/search capability used `rg` (ripgrep) which is not installed on Windows. Search tasks silently failed or returned "no matches" for paths that contained matches.
**Discovery:** 2026-04-26 (First grep test: "rg is not recognized")
**File:** `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` (SBC-018)

**Key Evidence:**
- `'rg' is not recognized as an internal or external command`
- Fix: platform detection — use `findstr /s /n /i` on Windows, `rg` on Unix

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

### NFM-029: Invalid task_kind at Dispatch
- Message quarantined as SCHEMA_INVALID
- task_kind value is "task" (valid type but not valid task_kind)
- Fix: check task_kind enum at message creation time

### NFM-030: Windows Path Normalization Mismatch
- File read rejected as "outside allowed roots" for valid path
- Path contains backslashes but allowed roots use forward slashes
- Only manifests on Windows

### NFM-031: Long-Running Script Timeout
- Script run task returns ETIMEDOUT
- Script name contains "heartbeat", "relay-daemon", or "inbox-watcher"
- Fix: skip daemon scripts, use "status" instead

### NFM-032: Cross-Lane Read Scope
- Subagent reads files from other lane roots successfully
- Path safety allows cross-lane reads by design
- Risk: information leakage if multiple operators exist

### NFM-033: Test Suite Exit Code Semantics
- Script run reports exit code 1 for mostly-passing test suite
- stdout contains [PASS] and [FAIL] markers
- Actual pass ratio obscured by non-zero exit code

### NFM-034: system_state Field Name Mismatch
- Status report returns "unknown" for system_state
- JSON file uses `system_status`, code reads `system_state`

### NFM-035: Grep Tool Unavailability on Windows
- Search/grep task fails with "not recognized" error
- `rg` not installed on Windows
- Fix: use `findstr` on Windows, `rg` on Unix

### NFM-036: Ungoverned Derivation Trust Gap
- 3,948 DERIVES_FROM edges flow from FreeAgent (794 nodes, zero governance) into constitutionally governed lanes
- 64/103 CONFLICTED nodes (62%) cluster in FreeAgent — the ungoverned repo
- 82% of all nodes system-wide are UNVERIFIED
- Governed code inherits neither trust nor contradiction status from its derivation origin
- DERIVES_FROM edges carry no trust propagation policy — derivation is treated as neutral, but in practice it imports both patterns and flaws
- Structural parallel: NFM-025 (signature validity under compromised key) — both address trust boundary failures where governed systems depend on ungoverned foundations

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

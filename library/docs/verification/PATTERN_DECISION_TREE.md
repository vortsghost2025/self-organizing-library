# Pattern Decision Tree: When You See X, Apply Y

**Quick-reference flowcharts for real-time operational decisions.**  
**Position:** Lane 3 (Library, Authority 60) — Verification & Knowledge Synthesis  
**Based on:** `S:\self-organizing-library\context-buffer\` (5 WE4FREE papers distilled)

---

## Tree 1: Agent Claim Verification

```
Agent makes claim: "I did X" or "Y is true"
   ↓
Is this a SELF-CLAIM or OTHER-CLAIM?
├─ SELF-CLAIM (agent asserting about itself)
│   └─ Apply SELF-STATE VERIFICATION (see Tree 2)
│
└─ OTHER-CLAIM (agent asserting about external state)
    ↓
    Does claim have EVIDENCE LINK? (file:line, test result, log)
    ├─ YES → Verify evidence exists and is current
    │         ├─ Evidence valid → ACCEPT with confidence rating
    │         └─ Evidence stale/missing → REJECT, demand fresh evidence
    │
    └─ NO → Apply CLAIM-VERIFY GATE
              ↓
        1. Require agent to produce evidence NOW
        2. If agent cannot → Flag as HALLUCINATION
        3. Log as DRIFT SIGNAL +15 (mirroring without verification)
        4. Escalate if confidence < 7
```

**Decision Points:**
- **Evidence link format:** `path/to/file:linenumber` or test output reference
- **Fresh evidence:** Generated during this session, not cached from previous
- **Confidence rating:** 1-10 scale; <7 triggers investigation per GOVERNANCE.md Law 5

---

## Tree 2: Self-State Resolution (Aliasing Protection)

```
Agent needs to determine its own status: "Am I alive? terminated? busy?"
   ↓
Check sources in ORDER (PRIORITY MATTERS):
   │
   ├─ PRIORITY 1: Live runtime/process state
   │   ├─ Is this process currently executing? → YES → STATE: ALIVE
   │   └─ No process → go to Priority 2
   │
   ├─ PRIORITY 2: Local current lock (.session-lock)
   │   ├─ Lock exists AND timestamp fresh (< expiry)? → Use lock.lane_id, lock.session_id
   │   └─ Lock stale/missing → go to Priority 3
   │
   ├─ PRIORITY 3: Shared registry (SESSION_REGISTRY.json)
   │   ├─ Registry entry matches live identity? → CONFIRM (advisory only)
   │   └─ Registry shows terminated but process alive? → IGNORE registry (stale)
   │
   └─ PRIORITY 4: Historical records (archived sessions)
       └─ NEVER authoritative for live process; only for analysis
```

**Rule (from SELF_STATE_ALIASING_FAILURE_MODE.md):**
> A live active lane MUST NOT classify itself as terminated solely from shared registry or stale lock artifacts without first checking current local runtime truth.

**Common Pitfall:** Archivist-Agent incident (2026-04-18) — read terminated session from registry while actively running → false "I am terminated" conclusion.

---

## Tree 3: Cross-Lane Write Decision

```
Code attempts to write file/directory/create/delete
   ↓
Is this a FILE SYSTEM operation? (fs.writeFileSync, mkdir, unlink, etc.)
├─ NO → Not gate's concern; proceed normally
│
└─ YES →
     ↓
   Call LaneContextGate.preWriteGate(targetPath)
     ↓
   Determine target lane from path:
     ├─ Path under S:\Archivist-Agent → lane: archivist-agent (auth 100)
     ├─ Path under S:\SwarmMind... → lane: swarmmind (auth 80)
     ├─ Path under S:\self-organizing-library → lane: library (auth 60)
     └─ Path elsewhere → default: archivist-agent (per FILE_OWNERSHIP_REGISTRY)
     ↓
   Compare target lane vs session lane:
     ├─ SAME LANE → ✅ ALLOW (normal operation)
     └─ DIFFERENT LANE →
           ↓
         Check session authority:
           ├─ Authority ≥ 100 (Position 1) → ✅ ALLOW (governance root override)
           └─ Authority < 100 →
                 ↓
               ❌ BLOCK write
               ENTER HOLD state (all further writes blocked)
               REQUIRE OPERATOR RESOLUTION
               Log: "Cross-lane write blocked: session={session_lane} (auth={auth}), target={target_lane}"
```

**Policy:** `require_authority_100_or_same_lane`  
**Enforcement:** Global fs monkey-patch applies to all Node processes that call `laneGate.patchFs()` (SwarmMind runtime only; separate node processes are NOT protected).

---

## Tree 4: HOLD State Handling

```
Operation triggers HOLD (cross-lane block or lane-context mismatch)
   ↓
System state: HOLD_ACTIVE
   ↓
All write operations now return false from preWriteGate()
   ↓
What action is being attempted?
├─ Same-lane write (e.g., writing logs, temp files)
│   └─ BLOCKED with message: "System in HOLD — operator resolution required"
│
├─ Cross-lane write attempt
│   └─ BLOCKED with message: "Cross-lane blocked + HOLD active"
│
└─ exitHold() called by operator
    ↓
    Clear holdState
    Log: "HOLD state cleared — resolved by: operator"
    → System returns to ACTIVE
    → Writes resume (subject to normal gate checks)
```

**Operator actions:**
- **Clear HOLD:** Call `gate.exitHold('operator-confirm')` — assumes operator reviewed the conflict
- **Do NOT clear HOLD:** Investigate root cause first (why did block occur?)
- **Re-enter HOLD:** Any subsequent violation will re-enter HOLD

**HOLD reasons (from laneContextGate.js):**
- `lane_context_mismatch` — pwd ≠ session-lock lane
- `session_lock_missing` — no .session-lock file
- `registry_missing` — FILE_OWNERSHIP_REGISTRY.json not found
- `cross_lane_blocked` — attempted cross-lane write without authority 100

---

## Tree 5: Governance Resolution Failure

```
governed-start.js → GovernanceResolver.resolve()
   ↓
Step 0: Run verify_recovery.sh (phenotype fingerprint check)
   ↓
Exit code?
├─ 0 (PASS) → Continue to step 1
├─ 2 (RECONSTRUCTED_UNTRUSTED) → ENTER QUARANTINE (re-verification required)
└─ 4 (FINGERPRINT_MISMATCH) → ENTER QUARANTINE CRITICAL (manual verification required)
   ↓
   QUARANTINE state written to QUARANTINE_STATE.json
   Governance mode set to: quarantine-reconstructed or quarantine-critical
   authority_restricted = true, external_lane_enabled = false
   Resumption blocked until: re-verify passes
   ↓
   System exits with code 1
```

**Recovery:**
```bash
node resolve-governance-v2.js --release-quarantine
```
Re-runs `verify_recovery.sh`; if it passes, clears quarantine state and resumes normal operation.

---

## Tree 6: Lane Identity Conflict Resolution

```
Multiple state sources disagree on lane identity:
  pwd says: X
  .session-lock says: Y  
  SESSION_REGISTRY.json says: Z
   ↓
Which source is authoritative?
   ↓
PRIORITY ORDER (per SPEC_AMENDMENT_LANE_CONTEXT_GATE):
1. pwd (current working directory) — PROMPT: "Which directory is the agent running from?"
2. .session-lock — if fresh (timestamp < expiry) AND matches pwd
3. SESSION_REGISTRY — advisory only; can be stale
   ↓
If pwd ≠ session-lock session lane:
   → ENTER HOLD (lane_context_mismatch)
   → REQUIRE operator to:
        1. Kill stale session in registry (if terminated)
        2. OR manually confirm identity override (operatorConfirmed flag)
        3. OR restart with correct .session-lock
```

**Rule:** Lane-context reconciliation MUST happen at session start before any other operation. Prevents the self-state aliasing incident.

---

## Tree 7: Session State Sync Decision

```
Session ID mismatch detected (e.g., RUNTIME_STATE.json has different ID than .session-lock)
   ↓
Which source is truth?
   ↓
Priority:
1. .session-lock (if fresh) — current session's lock
2. RUNTIME_STATE.json — if timestamp recent and matches pwd
3. SESSION_REGISTRY — Advisory (others see this, but you don't trust it for self)
   ↓
Action:
├─ .session-lock fresh → UPDATE RUNTIME_STATE.json to match .session-lock
├─ .session-lock stale but process running → PRIORITIZE current runtime, regenerate lock
└─ No process running → Safe to reset all to new session
```

**Fix Protocol (SESSION_ID_FRAGMENTATION_FIX.md):**
```
At session start:
1. Read .session-lock
2. Read RUNTIME_STATE.json
3. If IDs differ → OVERWRITE RUNTIME_STATE.session.id with .session-lock.session_id
4. Commit with message: "[LANE-X] [SYNC] Sync session ID with SESSION_REGISTRY"
5. Push to coordinate with other lanes
```

---

## Tree 8: Verification Lane Disagreement

```
Lane L verdict: PASS
Lane R verdict: FAIL
   ↓
CONSENSUS NOT ACHIEVED
   ↓
Enter INVESTIGATION LOOP:
   │
   1. Pull evidence from both lanes
      ├─ Lane L evidence: file:line references to structural rules
      └─ Lane R evidence: test results, runtime metrics
   │
   2. Compare evidence lists
      ├─ Identify divergence point (which specific check differed?)
      └─ Request clarification from losing lane: "Why did you FAIL/PASS?"
   │
   3. Re-run affected verification (if needed)
      ├─ Lane L re-checks structure with updated context
      └─ Lane R re-runs tests with same inputs
   │
   4. Compare again
      ├─ Now agree? → CONSENSUS ACHIEVED → proceed
      └─ Still disagree? → Check confidence scores
   │
   5. Confidence check:
      If |L.conf - R.conf| > 3 → Request THIRD verification lane (if available)
      If both confidence < 7 → ESCALATE to human regardless
   │
   6. Iteration limit: max 3 loops
      If no resolution → ESCALATE
```

**Escalation triggers:**
- Both lanes FAIL → auto-escalate
- Both lanes PASS but confidence < 7 → escalate for review
- Disagreement persists after 3 investigation iterations → escalate
- Human veto at any point → immediate escalation

---

## Quick Index by Symptom

| Symptom | Decision Tree |
|---------|--------------|
| Agent claims something without proof | Tree 1: Claim Verification |
| Agent wrong about its own state | Tree 2: Self-State Resolution |
| Write to another lane's files blocked | Tree 3: Cross-Lane Write Decision |
| System frozen, won't write anything | Tree 4: HOLD State Handling |
| Governance resolver exits with quarantine | Tree 5: Governance Resolution Failure |
| pwd, lock, registry disagree on lane ID | Tree 6: Lane Identity Conflict |
| RUNTIME_STATE.session ≠ .session-lock.session | Tree 7: Session State Sync |
| Verification lanes disagree PASS vs FAIL | Tree 8: Verification Lane Disagreement |

---

## How to Use This Document

**In the moment (during operation):**
1. Recognize symptom (e.g., "gate blocked my write")
2. Jump to corresponding tree
3. Follow decision path step-by-step
4. Log which branches you took (for later audit)

**As training material:**
- Read all trees to understand system behavior
- Practice with simulation scenarios
- Memorize high-frequency paths (Trees 1, 3, 4)

**During incident post-mortem:**
- Trace back through tree decisions made during incident
- Identify where wrong branch was taken
- Update pattern table if new edge case discovered

---

**Document status:** ACTIVE — Update when new patterns emerge  
**Last aligned with:** `S:\self-organizing-library\context-buffer\` (2026-04-18)  
**Next review:** After Phase 3 OS-level sandboxing design

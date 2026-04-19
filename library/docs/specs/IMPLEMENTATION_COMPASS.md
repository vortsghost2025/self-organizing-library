# Implementation Compass: WE4FREE Papers → Operational Rules

**Purpose:** Translate the 5 foundational WE4FREE papers from theoretical principles into day-to-day operational decision-making rules for all three lanes.

**Source Papers:** [OSF https://osf.io/n3tya](https://osf.io/n3tya)
**Located in:** `S:\Archivist-Agent\paper1.txt` through `paper5.txt`
**Library Position:** Lane 3 (Authority 60) — Knowledge Graph & Verification

---

## Paper 1: Error Handling & Resilience → Operational Rules

### Core Principle
**Constraint-aware error handling:** Failure modes are classified, not binary. Every error activates a specific response strategy with defined budget.

### When You See (Trigger) | Apply (Action)
--- | ---
`Error: timeout` | Check `DECISION_MATRIX.md` → Timeout domain → Strategy: RETRY with backoff, Budget: 3 attempts
`Error: connection refused` | Check `DECISION_MATRIX.md` → Infrastructure domain → Strategy: CIRCUIT BREAK, Budget: 5min open
`Error: out of memory` | Check `DECISION_MATRIX.md` → Resource domain → Strategy: SCALE DOWN, Budget: reduce concurrency to 1
`Error: permission denied` | Check `DECISION_MATRIX.md` → Security domain → Strategy: ABORT + LOG, Budget: zero tolerance
`Error: unknown exception` | Escalate to HUMAN (confidence < 7)

### Decision Matrix Quick Reference
```
ERROR DOMAIN → STRATEGY → BUDGET

Timeout:
  - Network → RETRY ×3 (2s, 4s, 8s backoff)
  - Computation → SPLIT TASK (break into subtasks)
  - User input → PAUSE + PROMPT (wait for correction)

Infrastructure:
  - Service down → CIRCUIT BREAK (5min)
  - Rate limit → QUEUE (FIFO with exponential backoff)
  - Corrupt state → RECOVER FROM CHECKPOINT (last known good)

Resource:
  - Memory → GC + REDUCE (purge caches)
  - CPU → THROTTLE (50% capacity)
  - Disk → CLEANUP (rotate logs, delete temp)
```

---

## Paper 2: Constitution-Preserving Resilience → Operational Rules

### Core Principle
**Fail without violating core values:** Even when broken, the system must not compromise its constitutional constraints.

### When You See (Trigger) | Apply (Action)
--- | ---
`System overloaded` | DEGRADE gracefully, DO NOT drop verification checkpoints
`User requests bypass` | DENY if constitutional rule would be violated, DOCUMENT override request
`Internal inconsistency detected` | FREEZE the affected subsystem, CONTINUE others with degraded service
`Multiple failures cascading` | ISOLATE failing component, PRESERVE core verification loop
`Data corruption detected` | REJECT corrupt input, REQUEST resubmission, LOG integrity violation

### Hard Constraints (Never Violate)
1. **No verification shortcuts** — Even under pressure, run verifications (possibly async)
2. **No silent failures** — Every error must be logged with evidence
3. **No identity fusion** — Agent never claims to be user; maintains evaluation role
4. **No agreement over truth** — Correct user even if uncomfortable
5. **No structure bypass** — Always route through BOOTSTRAP.md entry point

### Graceful Degradation Preserving Constitution
```
FULL OPERATION:
  All agents active → Full verification → Complete traces

DEGRADED (overload):
  Essential agents only → Core verification only → Summarized traces

MINIMUM (critical failure):
  Single verifier lane → Constitutional checks only → Minimal logging
```

---

## Paper 3: Sharp Edges Clarifications → Operational Rules

### Core Principle
**Edge cases have defined solutions.** Don't invent; look up. This paper is your "cheat sheet for hard problems."

### Pattern: When You See Edge Case X | Apply Solution Y
--- | ---
`Agent claims "I don't know" without evidence` | Apply CLAIM-VERIFY gate: demand evidence link, escalate if missing
`Circular dependency in task graph` | Apply DEADLOCK DETECTION: topological sort, break cycle by priority ordering
`Race condition on shared state` | Apply SEQUENTIALIZE: introduce explicit ordering, add version stamps
`Agent hallucinates file paths` | Apply PATH VALIDATION: check against allowed roots, reject outside S:\Archivist-Agent, S:\SwarmMind, S:\self-organizing-library
`User asks "are you sure?" with low confidence` | Apply HUMAN INTUITION OVERRIDE: STOP, investigate, provide evidence, do NOT proceed
`Two verification lanes disagree` | Apply INVESTIGATION LOOP: compare evidence, identify divergence, request third verification if needed
`Agent mirrors user language without verification` | Apply CORRECTION MANDATORY: flag as drift +15, require evidence-based response
`Session state diverges across artifacts` | Apply SOURCE-OF-TRUTH precedence: runtime > lock > registry > history
`Cross-lane write attempted` | Apply PRE-WRITE GATE: check FILE_OWNERSHIP_REGISTRY, block if authority < 100 and target ≠ own lane
`Agent exceeds resource budget` | Apply BUDGET ENFORCEMENT: throttle, pause, or kill with evidence

### Anti-Patterns (Never Do)
| Pattern | Consequence | Correct Approach |
|---------|-------------|-----------------|
| Double-check yourself | Fails independence | Request OTHER lane verify |
| Use cached verification | Stale evidence | Re-run test suite |
| Accept majority vote without confidence | Low-confidence consensus | Require |Δ confidence| ≤ 3 |
| Bypass checkpoint under deadline | Violates Law 6 | Document waiver with evidence |

---

## Paper 4: Architecture Review Checklist → Operational Rules

### Core Principle
**Compliance is measured, not assumed.** Run this checklist before any deployment or major action.

### Pre-Deployment Checklist (Run Before Every Deploy)
```
□ CHECKPOINT 0: UDS ≤ 40? (User drift gate)
□ CHECKPOINT 1: Anchored to BOOTSTRAP.md?
□ CHECKPOINT 2: Following GOVERNANCE.md rules?
□ CHECKPOINT 3: Not in drift state (CPS score acceptable)?
□ CHECKPOINT 4: Confidence ≥ 70%?
□ CHECKPOINT 5: Risk ≤ MEDIUM?
□ CHECKPOINT 6: Dual verification (Lane L + Lane R) passed?

ALL YES = DEPLOY
ANY NO = STOP + INVESTIGATE
```

### Architecture Compliance Rules
| Rule | Evidence Required | Pass Condition |
|------|------------------|----------------|
| Single entry point maintained | BOOTSTRAP.md referenced in all new code | Every decision routes through bootstrap |
| No duplicate classification | Search for PASS/FAIL logic outside verification lanes | Only Lane L and Lane R classify |
| Separation of test/production | Environment markers in all configs | No test data in production paths |
| External governance recognized | `GOVERNANCE_MANIFEST.json` or `FILE_OWNERSHIP_REGISTRY.json` loaded | Governance context active |
| Drift detection active | CPS (Constraint Preservation Score) logged | Score ≥ threshold (typically 0.8) |

### Verification Lane Requirements
```
LANE L (Structural):
  - Reads BOOTSTRAP.md
  - Checks against COVENANT.md values
  - Validates GOVERNANCE.md constraints
  - Evidence: file:line references to constitutional documents

LANE R (Operational):
  - Executes test suite
  - Checks runtime metrics
  - Verifies evidence links
  - Evidence: test results, logs, performance data

CONSENSUS:
  - Both lanes agree AND
  - Confidence scores within 3 points
  - → PROCEED

  - Disagreement → INVESTIGATE LOOP
  - Both fail → ESCALATE to human
```

---

## Paper 5: Decision Matrix → Operational Rules

### Core Principle
**Error domain determines strategy which determines budget.** No one-size-fits-all responses.

### Quick Decision Flowchart

```
Error occurs
   ↓
What domain?
├── Timeout?          → RETRY (budget: 3 attempts, backoff)
├── Infrastructure?   → CIRCUIT BREAK (budget: 5min, then retry)
├── Resource?         → THROTTLE (budget: 50% capacity)
├── Security?         → ABORT (budget: zero tolerance)
├── User input?       → PAUSE + PROMPT (budget: wait indefinitely)
├── Data corruption?  → REJECT + REQUEST RESEND (budget: 3 retries)
├── Unknown?          → ESCALATE TO HUMAN (budget: human time)
└── Internal logic?   → ISOLATE + DEBUG (budget: preserve core)
```

### Budget Enforcement
- **RETRY** — Count attempts in memory; stop at budget; log exhaustion
- **CIRCUIT BREAK** — Open circuit for fixed time; reject all requests during; log reopening
- **THROTTLE** — Limit to X ops/sec; queue excess; log saturation
- **ABORT** — Immediate termination; full stack trace; alert operator
- **PAUSE** — Wait indefinitely; timeout optional; require external resume

### Confidence Adjusted Strategy
```
High confidence (8-10): Standard strategy
Medium confidence (5-7): Conservative strategy (reduce budget by 30%)
Low confidence (1-4): ESCALATE regardless of domain

Examples:
  Timeout + confidence 3 → ESCALATE (don't retry, might be wrong diagnosis)
  Resource + confidence 9 → THROTTLE aggressively (likely correct)
```

### Decision Matrix in Code (Pseudocode)
```javascript
function handleError(error, domain, confidence) {
  const strategy = DECISION_MATRIX[domain].strategy;
  const budget = DECISION_MATRIX[domain].budget;

  if (confidence < 5) {
    return ESCALATE;
  }

  switch(strategy) {
    case 'RETRY': return executeWithRetry(budget);
    case 'CIRCUIT': return openCircuit(budget);
    case 'THROTTLE': return applyThrottle(budget);
    case 'ABORT': return immediateAbort();
    case 'PAUSE': return waitForResume(budget);
    case 'ESCALATE': return escalateToHuman();
    case 'ISOLATE': return isolateComponent(budget);
  }
}
```

---

## Cross-Cutting Rules (All Papers)

These apply regardless of which paper you're consulting:

1. **Evidence before assertion** — Run test first, then document
2. **Structure > identity** — Bootstrap files override agent preferences
3. **Correction mandatory** — Agreement optional
4. **Confidence ratings required** — All assessments 1-10 scale
5. **Dual verification** — Lane L + Lane R consensus required
6. **Global veto supremacy** — Any veto stops action immediately
7. **Drift limit** — Outcome >20% from prediction triggers freeze

---

## How to Use This Compass

**Daily workflow:**
1. Observe system behavior
2. Identify pattern (e.g., "agent hallucinated path")
3. Look up pattern in **Paper 3 (Sharp Edges)** table above
4. Apply prescribed solution with budget from **Paper 5 (Decision Matrix)**
5. Verify compliance with **Paper 4 (Architecture Checklist)**
6. Ensure you're preserving constitutional values from **Paper 2**
7. Document using trace system from **Paper 1**

**When in doubt:**
- Default to ESCALATE
- Default to conservative strategy
- Default to preserving constitutional constraints
- Default to seeking human verification

---

**Compass calibrated to:** `S:\Archivist-Agent\` constitutional stack  
**Last updated:** Phase 2 gate implementation (fc988c9)  
**Next review:** After Phase 3 (OS-level sandboxing) specification

# FREEAGENT RECOVERY STATE MACHINE

Date: 2026-04-20T08:56:00-04:00
Status: COMPLETE
Phase: 4A - Recovery Discipline

## 1) STATE MACHINE OVERVIEW

The recovery state machine governs artifact verification lifecycle from receipt to final disposition.

---

## 2) STATES

### 2.1 Primary States

| State | Code | Description | Authority Level |
|-------|------|-------------|-----------------|
| NEW | `NEW` | Artifact received, not yet processed | Library (60) |
| VERIFYING | `VERIFYING` | Cryptographic verification in progress | Library (60) |
| ACCEPTED | `ACCEPTED` | Verification passed, artifact trusted | Library (60) |
| QUARANTINED | `QUARANTINED` | Verification failed, retry scheduled | Library (60) |
| ESCALATED | `ESCALATED` | Routed to higher authority lane | Archivist (80) |
| DEFERRED | `DEFERRED` | Parked, waiting on dependency | Library (60) |
| HANDOFF | `HANDOFF` | Operator intervention required | Operator (90) |
| RELEASED | `RELEASED` | Operator approved after handoff | Operator (90) |
| REJECTED | `REJECTED` | Terminal rejection, no further action | Library (60) |

### 2.2 State Properties

| State | Terminal? | Requires Action? | Logs Evidence? | Audit Trail |
|-------|-----------|------------------|----------------|-------------|
| NEW | No | Yes (verify) | Yes | Yes |
| VERIFYING | No | No (in progress) | Yes | Yes |
| ACCEPTED | Yes | No | Yes | Yes |
| QUARANTINED | No | Yes (retry/handoff) | Yes | Yes |
| ESCALATED | No | Yes (higher lane) | Yes | Yes |
| DEFERRED | No | Yes (dependency) | Yes | Yes |
| HANDOFF | No | Yes (operator) | Yes | Yes |
| RELEASED | Yes | No | Yes | Yes |
| REJECTED | Yes | No | Yes | Yes |

---

## 3) STATE TRANSITIONS

### 3.1 Transition Diagram

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                                                                 │
                    ▼                                                                 │
┌──────┐      ┌───────────┐      ┌──────────┐                                     │
│ NEW  │─────►│ VERIFYING │─────►│ ACCEPTED │ (terminal)                          │
└──────┘      └─────┬─────┘      └──────────┘                                     │
                     │                                                            │
                     │ verification failed                                        │
                     ▼                                                            │
              ┌─────────────┐                                                     │
              │ QUARANTINED │◄────────────────────────────────────────────────┐   │
              └──────┬──────┘                                                  │   │
                     │                                                         │   │
        ┌────────────┼────────────┬─────────────┐                             │   │
        │            │            │             │                             │   │
        │ retry < 5  │ retry >= 5 │ escalate    │ defer                       │   │
        ▼            ▼            ▼             ▼                             │   │
   ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐                         │   │
   │ RETRY   │ │ HANDOFF  │ │ ESCALATED │ │ DEFERRED│                         │   │
   │ (back)  │ │          │ │           │ │         │                         │   │
   └────┬────┘ └────┬─────┘ └─────┬─────┘ └────┬────┘                         │   │
        │          │             │            │                              │   │
        │          │             │            │ dependency                   │   │
        │          │             │            │ resolved                     │   │
        │          │             │            └──────────────────────────────┘   │
        │          │             │                                             │
        │          │             │ lane responds                               │
        │          │             ▼                                             │
        │          │      ┌────────────┐                                      │
        │          │      │ lane       │                                      │
        │          │      │ decision   │                                      │
        │          │      └─────┬──────┘                                      │
        │          │            │                                             │
        │          │    ┌───────┴───────┐                                     │
        │          │    │               │                                     │
        │          │    ▼               ▼                                     │
        │          │ ┌──────────┐ ┌──────────┐                               │
        │          │ │ ACCEPTED │ │ REJECTED │                               │
        │          │ └──────────┘ └──────────┘                               │
        │          │                                                         │
        │          │ operator action                                         │
        │          ▼                                                         │
        │   ┌───────────┐                                                   │
        │   │ RELEASED  │ (terminal)                                        │
        │   └───────────┘                                                   │
        │          │                                                         │
        │          │ operator reject                                         │
        │          ▼                                                         │
        │   ┌──────────┐                                                    │
        │   │ REJECTED  │ (terminal)                                        │
        │   └──────────┘                                                    │
        │                                                                    │
        └────────────────────────────────────────────────────────────────────┘
```

### 3.2 Transition Table

| From | To | Trigger | Condition | Output |
|------|-----|---------|-----------|--------|
| NEW | VERIFYING | `verify()` called | Item has signature | State change |
| VERIFYING | ACCEPTED | Signature valid | All checks pass | `{status: ACCEPTED}` |
| VERIFYING | QUARANTINED | Signature invalid | Any check fails | `{status: QUARANTINED}` |
| QUARANTINED | VERIFYING | Retry scheduled | retryCount < 5 | Increment retry |
| QUARANTINED | HANDOFF | Max retries | retryCount >= 5 | Handoff artifact |
| QUARANTINED | ESCALATED | Low confidence | confidence < 0.5 | Route to authority |
| QUARANTINED | DEFERRED | Missing dependency | Key/orchestrator missing | Wait condition |
| DEFERRED | QUARANTINED | Dependency resolved | Dependency available | Resume retry |
| HANDOFF | RELEASED | Operator approve | Manual action | Audit log |
| HANDOFF | REJECTED | Operator reject | Manual action | Audit log |
| ESCALATED | ACCEPTED | Lane confirms | Higher authority accepts | Trust decision |
| ESCALATED | REJECTED | Lane rejects | Higher authority rejects | Trust decision |

---

## 4) TRANSITION CONDITIONS

### 4.1 Verification Success

```javascript
condition: signatureValid === true
        AND laneMatch === true
        AND keyNotRevoked === true
        AND confidence >= 0.8

result: { status: ACCEPTED, confidence: 0.85, lane: 'library' }
```

### 4.2 Verification Failure -> Quarantine

```javascript
condition: signatureValid === false
        OR laneMatch === false
        OR keyNotRevoked === false

result: { status: QUARANTINED, retryCount: 1, nextRetryIn: 1000 }
```

### 4.3 Quarantine -> Handoff

```javascript
condition: retryCount >= 5

result: {
    status: HANDOFF,
    handoffFile: 'logs/handoff/handoff-{id}.json',
    requiresHumanReview: true
}
```

### 4.4 Quarantine -> Escalate

```javascript
condition: retryCount < 5
        AND confidence < 0.5
        AND recoveryEngineAvailable === true

result: {
    status: ESCALATED,
    targetLane: 'archivist',
    reason: 'INSUFFICIENT_CONFIDENCE'
}
```

### 4.5 Quarantine -> Defer

```javascript
condition: keyNotFound === true
        OR orchestratorUnreachable === true

result: {
    status: DEFERRED,
    reason: 'MISSING_KEY' | 'ORCHESTRATOR_UNREACHABLE',
    waitingOn: 'key_registration' | 'orchestrator_recovery'
}
```

---

## 5) STATE MACHINE IMPLEMENTATION

### 5.1 RecoveryStateMachine Class

```javascript
class RecoveryStateMachine {
    constructor(item) {
        this.item = item;
        this.state = 'NEW';
        this.retryCount = 0;
        this.confidence = 0;
        this.history = [];
    }

    transition(toState, metadata = {}) {
        const fromState = this.state;

        // Validate transition
        if (!this.isValidTransition(fromState, toState)) {
            throw new Error(`Invalid transition: ${fromState} -> ${toState}`);
        }

        // Log transition
        this.history.push({
            timestamp: new Date().toISOString(),
            from: fromState,
            to: toState,
            metadata
        });

        this.state = toState;

        // Side effects
        this.onStateChange(fromState, toState, metadata);

        return { state: this.state, history: this.history };
    }

    isValidTransition(from, to) {
        const validTransitions = {
            'NEW': ['VERIFYING'],
            'VERIFYING': ['ACCEPTED', 'QUARANTINED'],
            'QUARANTINED': ['VERIFYING', 'HANDOFF', 'ESCALATED', 'DEFERRED'],
            'DEFERRED': ['QUARANTINED'],
            'HANDOFF': ['RELEASED', 'REJECTED'],
            'ESCALATED': ['ACCEPTED', 'REJECTED'],
            'ACCEPTED': [],  // Terminal
            'RELEASED': [],  // Terminal
            'REJECTED': []   // Terminal
        };

        return validTransitions[from]?.includes(to) ?? false;
    }
}
```

---

## 6) AUDIT TRAIL

### 6.1 Required Fields

Every state transition MUST log:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO 8601 | Yes | Transition time |
| `from_state` | string | Yes | Previous state |
| `to_state` | string | Yes | New state |
| `item_id` | string | Yes | Artifact identifier |
| `lane` | string | Yes | Lane that performed transition |
| `reason` | string | Yes | Transition reason |
| `confidence` | number | No | Confidence score (if applicable) |
| `retry_count` | number | No | Retry count (if applicable) |
| `operator` | string | No | Operator ID (for HANDOFF transitions) |

### 6.2 Log Location

- **File**: `logs/recovery-state-transitions.log`
- **Format**: JSON Lines (one object per line)
- **Retention**: 90 days minimum

### 6.3 Log Example

```json
{"timestamp":"2026-04-20T08:56:00.000Z","from_state":"VERIFYING","to_state":"QUARANTINED","item_id":"artifact-001","lane":"library","reason":"SIGNATURE_MISMATCH","confidence":0.3}
{"timestamp":"2026-04-20T08:56:01.000Z","from_state":"QUARANTINED","to_state":"VERIFYING","item_id":"artifact-001","lane":"library","reason":"RETRY","retry_count":2}
{"timestamp":"2026-04-20T08:56:02.000Z","from_state":"VERIFYING","to_state":"ACCEPTED","item_id":"artifact-001","lane":"library","reason":"VERIFICATION_PASSED","confidence":0.9}
```

---

## 7) EVIDENCE INDEX

### 7.1 Recovery Evidence Schema

```javascript
{
    event_id: string,          // Unique event ID
    event_type: 'STATE_TRANSITION' | 'RECOVERY_ATTEMPT' | 'HANDOFF_GENERATED',
    timestamp: ISO8601,
    item_id: string,
    lane: string,
    state: string,
    confidence: number,
    reason: string,
    log_file: string,          // Path to log file
    log_line: number,          // Line number in log
    retention_days: number     // How long to keep
}
```

### 7.2 Evidence Retention

| Event Type | Retention Period | Rationale |
|------------|------------------|-----------|
| STATE_TRANSITION | 90 days | Audit compliance |
| RECOVERY_ATTEMPT | 90 days | Debug and analysis |
| HANDOFF_GENERATED | 365 days | Operator accountability |
| OPERATOR_ACTION | 365 days | Security audit |

---

## 8) GATE CONDITIONS

- [x] All states defined with properties
- [x] All transitions documented
- [x] Transition conditions specified
- [x] State machine implementation outlined
- [x] Audit trail requirements defined
- [x] Evidence index schema defined
- [x] Retention policy established

**GATE STATUS**: ✅ STATE MACHINE COMPLETE

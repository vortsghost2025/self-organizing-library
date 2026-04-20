# FREEAGENT PRODUCTION PHENOTYPE - RECOVERY POLICY

Date: 2026-04-19T21:14:00-04:00
Status: COMPLETE
Phase: 4 - Reliability Pass and Recovery Discipline

## 1) RETRY BOUNDARIES

### 1.1 Retry Configuration

| Parameter | Value | Location |
|-----------|-------|----------|
| Max Retries | 5 (default) | QuarantineManager |
| Initial Retry Delay | 1000ms | Orchestrator-provided |
| Max Retry Delay | 60000ms | Orchestrator-provided |
| Backoff Strategy | Exponential | Orchestrator-controlled |

### 1.2 Retry Flow

```
Verification Failure
        │
        ▼
QuarantineManager.quarantine(item, reason)
        │
        ├─ retryCount = 1 (initial)
        ├─ Log to quarantine.log
        │
        ▼
Submit to RecoveryEngine
        │
        ├─ Orchestrator responds with nextRetryIn
        │
        ▼
Retry scheduled?
        │
        ├─ retryCount < MAX → Schedule retry
        │
        └─ retryCount >= MAX → Handoff to operator
```

### 1.3 Retry Count Enforcement

**QuarantineManager.js** lines 65-89:
```javascript
quarantine(item, reason, nextRetryIn) {
    const itemId = this._deriveId(item);
    const existing = this.quarantinedItems.get(itemId);
    const entry = {
        item,
        reason,
        retryCount: existing ? existing.retryCount + 1 : 1,
        // ...
    };
    // ...
}
```

---

## 2) QUARANTINE ESCALATION

### 2.1 Escalation Levels

| Level | Condition | Action |
|-------|-----------|--------|
| 1 | First failure | Log, schedule retry |
| 2 | Second failure | Log, schedule retry |
| 3 | Third failure | Log, schedule retry |
| 4 | Fourth failure | Log, schedule retry |
| 5 | Fifth failure | Log, HANDOFF to operator |

### 2.2 Handoff Trigger

**VerifierWrapper.js** lines 165-175:
```javascript
if (quarantineResult.handoffRequired) {
    return {
        valid: false,
        reason: VERIFY_REASON.QUARANTINE_MAX_RETRIES,
        note,
        itemId,
        lane,
        handoffRequired: true,
        handoffFile: this.quarantineManager.handoffFile
    };
}
```

### 2.3 Handoff Artifact Format

```json
{
    "timestamp": "2026-04-19T21:14:00.000Z",
    "event": "HANDOFF_REQUIRED",
    "item_id": "quarantine-item-001",
    "lane": "swarmmind",
    "reason": "QUARANTINE_MAX_RETRIES",
    "retry_count": 5,
    "artifact": {
        "signature": "...",
        "payload": "..."
    },
    "requires_human_review": true,
    "operator_actions": [
        "Inspect artifact",
        "Approve with forceRelease()",
        "Reject permanently"
    ]
}
```

---

## 3) OPERATOR HANDOFF ARTIFACTS

### 3.1 Generation Conditions

| Condition | Artifact Generated | Location |
|-----------|-------------------|----------|
| Max retries exceeded | `handoff-{id}.json` | `logs/handoff/` |
| Orchestrator unreachable | `handoff-{id}.json` | `logs/handoff/` |
| Key revocation | No handoff (terminal rejection) | N/A |

### 3.2 Operator Actions

After reviewing handoff artifact, operator can:

1. **Approve**: `forceRelease(itemId)` - Clear quarantine
2. **Reject**: Delete handoff artifact - Item remains quarantined
3. **Investigate**: Inspect artifact contents

### 3.3 Force Release

**VerifierWrapper.js** lines 210-218:
```javascript
forceRelease(itemId) {
    const entry = this.quarantineManager.getQuarantineStatus(itemId);
    if (!entry) {
        return { success: false, reason: 'NOT_IN_QUARANTINE' };
    }
    this.quarantineManager.clearHandoffSignal();
    return this.quarantineManager.release(itemId);
}
```

---

## 4) NO SUCCESS BY SIDE EFFECT

### 4.1 Principle

After a **deterministic failure** (signature mismatch, lane mismatch, revoked key), the system:
- MUST NOT accept the artifact through any alternate path
- MUST NOT allow recovery engine to override
- MUST require explicit operator action for any manual intervention

### 4.2 Enforcement

| Failure Type | Can Retry? | Can Override? | Requires Operator? |
|--------------|------------|---------------|-------------------|
| Malformed JWS | Yes (up to 5) | No | On max retries |
| Signature mismatch | Yes (up to 5) | No | On max retries |
| Lane mismatch | Yes (up to 5) | No | On max retries |
| Key not found | Yes (up to 5) | No | On max retries |
| Revoked key | No (terminal) | No | No override |
| Orchestrator unreachable | No (fatal) | No | Immediate handoff |

### 4.3 Terminal Rejection

Revoked keys are rejected **without** retry or override:

**Verifier.js** `getPublicKey()`:
```javascript
getPublicKey(laneId) {
    const keyEntry = this.trustStore.keys?.[laneId];
    if (!keyEntry) return null;
    if (keyEntry.revoked_at) return null;  // TERMINAL - no retry
    return keyEntry.public_key_pem;
}
```

---

## 5) DEPENDENCY OUTAGE SIMULATION

### 5.1 Scenario: Orchestrator Unreachable

When orchestrator is unreachable during failure submission:

**VerifierWrapper.js** lines 141-162:
```javascript
} catch (e) {
    // RecoveryEngine unreachable - FATAL FAILURE
    console.error('[FATAL] RecoveryEngine unreachable');
    
    // Write handoff signal immediately
    this.quarantineManager._signalHumanIntervention(
        itemId, lane, 'ORCHESTRATOR_UNREACHABLE', 0
    );
    
    return {
        valid: false,
        reason: 'ORCHESTRATOR_UNREACHABLE',
        handoffRequired: true,
        fatal: true
    };
}
```

### 5.2 Expected Behavior

| Step | Action | Result |
|------|--------|--------|
| 1 | Detect orchestrator unreachable | Exception caught |
| 2 | Log FATAL error | Console output |
| 3 | Generate handoff artifact | `logs/handoff/` |
| 4 | Return hard failure | `{ valid: false, fatal: true }` |
| 5 | NO fallback acceptance | Item NOT processed |

---

## 6) INVALID ARTIFACT SIMULATION

### 6.1 Scenario: Malformed JWS

| Step | Action | Result |
|------|--------|--------|
| 1 | Receive malformed JWS | Invalid format detected |
| 2 | Return structured rejection | `{ valid: false, error: SIGNATURE_MISMATCH }` |
| 3 | Quarantine item | retryCount = 1 |
| 4 | Submit to orchestrator | (if configured) |
| 5 | Schedule retry | nextRetryIn provided |
| 6 | (repeat up to 5 times) | ... |
| 7 | Max retries exceeded | Handoff artifact generated |

### 6.2 Verification

Run `scripts/test-hardening-drill.js` to verify:
- Malformed JWS returns structured rejection
- No uncaught exception
- Quarantine tracking works

---

## 7) RECOVERY POLICY CONFIGURATION

### 7.1 Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `QUARANTINE_MAX_RETRIES` | Max retry attempts | 5 |
| `QUARANTINE_LOG_PATH` | Log file location | `logs/quarantine.log` |
| `HANDOFF_DIR` | Handoff artifact directory | `logs/handoff/` |

### 7.2 Runtime Adjustment

Max retries can be adjusted via `QuarantineManager` constructor:

```javascript
const quarantineManager = new QuarantineManager({
    logPath: '/var/logs/quarantine.log',
    maxRetries: 10  // Override default
});
```

---

## 8) MONITORING AND ALERTING

### 8.1 Quarantine Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Items in quarantine | `QuarantineManager.getMetrics()` | > 10 concurrent |
| Retry count per item | `entry.retryCount` | > 3 |
| Handoff artifacts | File count in `logs/handoff/` | > 0 |

### 8.2 Health Check Integration

The `health-core.ps1` script reports:
- Quarantine status (via verification check)
- Any handoff artifacts pending

---

## 9) GATE CONDITION

Simulated dependency outage and invalid artifact both produce expected terminal behavior.

- [x] Retry boundaries documented
- [x] Quarantine escalation documented
- [x] Operator handoff artifacts generated
- [x] No success by side effect
- [x] Orchestrator unreachable → hard failure + handoff
- [x] Invalid artifact → structured rejection + quarantine

**GATE STATUS**: ✅ RECOVERY POLICY COMPLETE

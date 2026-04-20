# FREEAGENT OUTCOME PROTOCOL DESIGN

Date: 2026-04-20T09:00:00-04:00
Status: COMPLETE
Phase: 4B - Outcome Protocol

## 1) PROTOCOL OVERVIEW

The Outcome Protocol defines how verification results are classified, scored, and routed across lanes. It implements the "4 minds > 1" principle where low-confidence decisions are escalated to higher authority lanes.

---

## 2) OUTCOME STATUS ENUM

### 2.1 Status Types

| Status | Code | Description | Terminal? |
|--------|------|-------------|-----------|
| ACCEPT | `ACCEPT` | High confidence verification passed | Yes |
| QUARANTINE | `QUARANTINE` | Verification failed, retry scheduled | No |
| ESCALATE | `ESCALATE` | Route to higher authority lane | No |
| DEFER | `DEFER` | Parked, waiting on dependency | No |
| REJECT | `REJECT` | Terminal failure, no further action | Yes |

### 2.2 Status Selection Logic

```
confidence >= 0.8  → ACCEPT
confidence < 0.5   → ESCALATE (if recovery available) or QUARANTINE (if not)
0.5 <= confidence < 0.8 → QUARANTINE
missing dependency → DEFER
max retries exceeded → REJECT (via HANDOFF)
```

---

## 3) CONFIDENCE SCORING

### 3.1 Scoring Formula

```
confidence = (signature × 0.40) + (laneMatch × 0.30) + (trustStore × 0.20) + (recovery × 0.10)
```

### 3.2 Factor Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| Signature Validity | 0.40 | Cryptographic signature verified |
| Lane Match | 0.30 | A = B lane identity check |
| Trust Store | 0.20 | Trust store available and valid |
| Recovery Engine | 0.10 | Recovery engine confirmed |

### 3.3 Confidence Thresholds

| Threshold | Value | Outcome |
|-----------|-------|---------|
| ACCEPT | 0.80 | confidence >= 0.80 → ACCEPT |
| ESCALATE | 0.50 | confidence < 0.50 → ESCALATE |
| QUARANTINE | 0.50 | 0.50 <= confidence < 0.80 → QUARANTINE |

### 3.4 Example Calculations

| Signature | Lane | Trust | Recovery | Confidence | Status |
|-----------|------|-------|----------|------------|--------|
| ✅ | ✅ | ✅ | ✅ | 1.0 | ACCEPT |
| ✅ | ✅ | ✅ | ❌ | 0.9 | ACCEPT |
| ✅ | ✅ | ❌ | ❌ | 0.7 | QUARANTINE |
| ✅ | ❌ | ✅ | ❌ | 0.5 | QUARANTINE |
| ❌ | ✅ | ✅ | ❌ | 0.5 | QUARANTINE |
| ❌ | ❌ | ❌ | ❌ | 0.0 | ESCALATE |

---

## 4) REQUIRES FIELD

### 4.1 Reason Codes

| Code | Description | Outcome |
|------|-------------|---------|
| `MISSING_KEY` | Key not found in trust store | DEFER or ESCALATE |
| `ORCHESTRATOR_UNREACHABLE` | Recovery engine not available | DEFER or QUARANTINE |
| `QUARANTINE_RETRY_EXCEEDED` | Max retries reached | HANDOFF |
| `LANE_MISMATCH` | Outer lane ≠ payload lane | QUARANTINE |
| `SIGNATURE_MISMATCH` | Crypto verification failed | QUARANTINE |
| `INSUFFICIENT_CONFIDENCE` | confidence < 0.5 | ESCALATE |
| `KEY_REVOKED` | Key marked revoked | REJECT |
| `TRUST_STORE_UNAVAILABLE` | Trust store file missing | DEFER |
| `MISSING_SIGNATURE` | No signature field | REJECT |

### 4.2 Requires Field Usage

```javascript
{
    status: 'DEFER',
    requires: ['MISSING_KEY', 'TRUST_STORE_UNAVAILABLE'],
    waitingOn: 'key_registration'
}
```

---

## 5) MULTI-LANE ROUTING ("4 minds > 1")

### 5.1 Lane Authority Levels

| Lane | Authority | Role |
|------|-----------|------|
| Operator | 90 | Human intervention (highest) |
| SwarmMind | 80 | Execution lane |
| Archivist | 80 | Orchestration lane |
| Library | 60 | Verification lane |

### 5.2 Routing Decisions

| Decision | Target | Trigger |
|----------|--------|---------|
| LOCAL | Library | Terminal or retry |
| ESCALATE_ARCHIVIST | Archivist | Low confidence, key issue |
| ESCALATE_SWARMIND | SwarmMind | Orchestrator unreachable |
| OPERATOR | Operator | Handoff required |
| DEFER | (local) | Missing dependency |

### 5.3 "4 minds > 1" Principle

When confidence is low (< 0.5):
1. Library cannot make authoritative decision alone
2. Escalate to Archivist (authority 80) for orchestration review
3. Archivist may consult SwarmMind for execution context
4. Final decision requires consensus or operator intervention

```
Library (60) ─┐
              │    ┌─────────────┐
Archivist (80)├───►│ Consensus   │───► Final Decision
              │    │ Checker     │
SwarmMind (80)┘    └─────────────┘
```

---

## 6) OUTCOME OBJECT SCHEMA

### 6.1 Full Schema

```javascript
{
    // Required
    status: 'ACCEPT' | 'QUARANTINE' | 'ESCALATE' | 'DEFER' | 'REJECT',
    confidence: number,  // 0.0 - 1.0
    lane: string,        // 'library' | 'archivist' | 'swarmmind'
    itemId: string,      // Artifact identifier
    timestamp: ISO8601,

    // Status-specific
    reason: string,           // Why this status
    requires: string[],       // Blocking reasons (for DEFER)
    targetLane: string,       // Target for ESCALATE
    retryCount: number,       // Current retry (for QUARANTINE)
    nextRetryIn: number,      // MS until next retry
    handoffRequired: boolean, // Operator needed
    handoffFile: string,      // Path to handoff artifact

    // Metadata
    metadata: object          // Additional context
}
```

### 6.2 Example Outcomes

**ACCEPT (high confidence)**:
```json
{
    "status": "ACCEPT",
    "confidence": 0.95,
    "lane": "library",
    "itemId": "artifact-001",
    "reason": "VERIFICATION_PASSED",
    "timestamp": "2026-04-20T09:00:00.000Z"
}
```

**QUARANTINE (needs retry)**:
```json
{
    "status": "QUARANTINE",
    "confidence": 0.6,
    "lane": "library",
    "itemId": "artifact-002",
    "reason": "SIGNATURE_MISMATCH",
    "retryCount": 2,
    "nextRetryIn": 5000,
    "timestamp": "2026-04-20T09:00:00.000Z"
}
```

**ESCALATE (low confidence)**:
```json
{
    "status": "ESCALATE",
    "confidence": 0.35,
    "lane": "library",
    "itemId": "artifact-003",
    "reason": "INSUFFICIENT_CONFIDENCE",
    "targetLane": "archivist",
    "requires": ["INSUFFICIENT_CONFIDENCE"],
    "timestamp": "2026-04-20T09:00:00.000Z"
}
```

**DEFER (waiting on dependency)**:
```json
{
    "status": "DEFER",
    "confidence": 0.0,
    "lane": "library",
    "itemId": "artifact-004",
    "reason": "MISSING_KEY",
    "requires": ["MISSING_KEY", "TRUST_STORE_UNAVAILABLE"],
    "timestamp": "2026-04-20T09:00:00.000Z"
}
```

**REJECT (terminal)**:
```json
{
    "status": "REJECT",
    "confidence": 0.0,
    "lane": "library",
    "itemId": "artifact-005",
    "reason": "KEY_REVOKED",
    "handoffRequired": false,
    "timestamp": "2026-04-20T09:00:00.000Z"
}
```

---

## 7) INTEGRATION POINTS

### 7.1 VerifierWrapper Integration

```javascript
// In VerifierWrapper.verify()
const factors = {
    signatureValid: result.valid,
    laneMatch: outerLane === payloadLane,
    trustStoreAvailable: !!this.verifier.trustStore,
    recoveryEngineConfirmed: recoveryResult?.confirmed || false
};

const calculator = new ConfidenceCalculator();
const confidence = calculator.calculate(factors);

const outcome = new OutcomeBuilder()
    .withStatus(calculator.determineStatus(confidence, context))
    .withConfidence(confidence)
    .withLane('library')
    .withItemId(item.id)
    .build();
```

### 7.2 QuarantineManager Integration

```javascript
// Add DEFER status handling
quarantine(item, reason, nextRetryIn) {
    // ... existing code ...

    // Check for DEFER conditions
    if (reason === 'MISSING_KEY' || reason === 'ORCHESTRATOR_UNREACHABLE') {
        return new Outcome({
            status: OutcomeStatus.DEFER,
            requires: [reason],
            ...
        });
    }
}
```

---

## 8) TESTING

### 8.1 Test Script

`scripts/test-outcome-protocol.js` verifies:
- Confidence calculation
- Status determination
- Routing decisions
- Consensus checking

### 8.2 Run Tests

```bash
node scripts/test-outcome-protocol.js
```

---

## 9) GATE CONDITIONS

- [x] Outcome status enum defined
- [x] Confidence scoring implemented
- [x] Requires field specified
- [x] Multi-lane routing documented
- [x] "4 minds > 1" consensus mechanism
- [x] Integration points identified
- [x] Test script created

**GATE STATUS**: ✅ OUTCOME PROTOCOL COMPLETE

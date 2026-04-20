# FreeAgent Outcome Protocol Specification

**Phase:** 4B  
**Date:** 2026-04-20  
**Owner:** Library (documentation), Archivist (implementation)

---

## Overview

The Outcome Protocol replaces binary success/failure with structured outcome states. This enables:
- Honest uncertainty reporting
- Cross-lane routing
- Blocking requirement declaration
- Evidence linkage

**Core Rule:** Do not force completion. Force honesty. Allow help. Route uncertainty. Block fake success.

---

## Status Types

### SUCCESS

Task completed with sufficient confidence.

```json
{
  "status": "SUCCESS",
  "lane": "library",
  "task_id": "task-001",
  "summary": "Verification completed",
  "confidence": 1.0,
  "result": { "verified": true }
}
```

**Required fields:**
- `status`
- `lane`
- `task_id`
- `summary`
- `confidence`

**Optional fields:**
- `result` - Result payload
- `evidence` - Evidence references
- `trace_id` - Cross-lane correlation

---

### FAILURE

Task cannot be completed. Stop.

```json
{
  "status": "FAILURE",
  "lane": "archivist",
  "task_id": "task-002",
  "summary": "Key not found in trust store",
  "confidence": 0.0,
  "error_code": "KEY_NOT_TRUSTED",
  "reason": "Key ID 'key-123' not found"
}
```

**Required fields:**
- `status`
- `lane`
- `task_id`
- `summary`
- `error_code`

**Optional fields:**
- `reason` - Human-readable reason
- `evidence` - Evidence references

---

### ESCALATE

Task incomplete, known next resolver.

```json
{
  "status": "ESCALATE",
  "lane": "swarmmind",
  "task_id": "task-003",
  "summary": "Verification needed from Archivist",
  "confidence": 0.6,
  "escalation_target": "ARCHIVIST",
  "requires": [
    { "kind": "verification_needed", "detail": "Key trust verification" }
  ],
  "suggested_next_step": "Verify key in trust store"
}
```

**Required fields:**
- `status`
- `lane`
- `task_id`
- `summary`
- `confidence`
- `escalation_target`

**Optional fields:**
- `requires` - Blocking requirements
- `suggested_next_step` - Hint for resolver
- `blockers` - Blocking issues
- `evidence` - Evidence references

---

### DEFER

Task blocked, not urgent or safely resolvable now.

```json
{
  "status": "DEFER",
  "lane": "library",
  "task_id": "task-004",
  "summary": "Waiting for context from orchestrator",
  "confidence": 0.4,
  "reason": "Missing configuration context",
  "requires": [
    { "kind": "missing_context", "detail": "Orchestrator config" }
  ]
}
```

**Required fields:**
- `status`
- `lane`
- `task_id`
- `summary`
- `confidence`
- `reason`

**Optional fields:**
- `requires` - Blocking requirements
- `suggested_next_step` - Hint for later
- `blockers` - Blocking issues

---

### QUARANTINE

Unsafe/invalid/contradictory detected. Isolate.

```json
{
  "status": "QUARANTINE",
  "lane": "archivist",
  "task_id": "task-005",
  "summary": "Lane mismatch detected",
  "confidence": 0.95,
  "reason": "Signed by library, claims swarmmind",
  "error_code": "QUARANTINE_q-123"
}
```

**Required fields:**
- `status`
- `lane`
- `task_id`
- `summary`
- `reason`

**Optional fields:**
- `confidence` - Default 0.95
- `error_code` - Includes quarantine ID
- `evidence` - Evidence references

---

## Confidence Scoring

### Range

0.0 (no confidence) to 1.0 (certain)

### Thresholds

| Level | Threshold | Meaning |
|-------|-----------|---------|
| HIGH | >= 0.9 | Proceed automatically |
| MEDIUM | >= 0.7 | May need review |
| LOW | >= 0.5 | Escalate |
| VERY_LOW | < 0.5 | Defer or block |

### Calculation

Confidence is calculated from verification factors:

| Factor | Weight |
|--------|--------|
| signature_valid | 0.30 |
| lane_match | 0.20 |
| key_trusted | 0.20 |
| key_not_revoked | 0.15 |
| payload_integrity | 0.15 |

---

## Escalation Targets

| Target | Use Case |
|--------|----------|
| ORCHESTRATOR | Coordination issues |
| ARCHIVIST | Trust/verification issues |
| LIBRARY | Context/mapping issues |
| SWARMMIND | Execution/agent issues |
| USER | Human approval needed |
| OTHER_LANE | Cross-lane routing |

---

## Requirement Kinds

| Kind | Meaning |
|------|---------|
| `missing_context` | Missing information |
| `missing_dependency` | Missing dependency |
| `verification_needed` | Verification required |
| `human_approval` | Human sign-off needed |
| `resource_block` | Resource unavailable |
| `conflict_resolution` | Conflict needs resolution |

---

## Evidence References

Evidence links outcomes to proof:

```json
{
  "evidence": [
    { "type": "file", "value": "path/to/file.js" },
    { "type": "log", "value": "logs/verify.log#L42" },
    { "type": "endpoint", "value": "http://localhost:3847/verify" },
    { "type": "memory", "value": "cache:key-123" },
    { "type": "trace", "value": "trace-abc-123" }
  ]
}
```

---

## Routing Logic

| Status | Action | Operator Alert |
|--------|--------|----------------|
| SUCCESS | continue | No |
| FAILURE | stop | No |
| ESCALATE | route to target | If USER |
| DEFER | queue for later | No |
| QUARANTINE | isolate | Yes |

---

## Cross-Lane Routing

When `escalation_target` is `OTHER_LANE`:

```javascript
// Determine target from requires field
if (requires.includes('missing_context')) → library
if (requires.includes('verification_needed')) → archivist
default → orchestrator
```

---

## Recovery Override

**Critical invariant:** Recovery cannot override outcomes.

If outcome is `QUARANTINE` or `FAILURE`, no downstream process may change it to `SUCCESS`. This ensures audit trail integrity.

---

## Implementation

**Archivist:** `src/core/protocols/outcome.js`  
**Tests:** `tests/protocols/outcome.test.js`

---

## State Transitions

```
                    ┌──────────────┐
                    │   Task       │
                    │   Received   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Process    │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │ SUCCESS │      │ ESCALATE  │     │  DEFER    │
    │ (>=0.9) │      │ (0.5-0.9) │     │ (< 0.5)   │
    └────┬────┘      └─────┬─────┘     └─────┬─────┘
         │                 │                 │
         │           ┌─────▼─────┐           │
         │           │ Route to  │           │
         │           │ Target    │           │
         │           └───────────┘           │
         │                                   │
    ┌────▼────┐                        ┌─────▼─────┐
    │ Continue│                        │  Queue    │
    └─────────┘                        └───────────┘
                          
                    ┌──────────────┐
                    │  QUARANTINE  │
                    │ (unsafe)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Isolate    │
                    │   + Alert    │
                    └──────────────┘
```

---

## Examples

### Successful Verification

```json
{
  "status": "SUCCESS",
  "lane": "library",
  "task_id": "verify-001",
  "summary": "JWS signature verified",
  "confidence": 1.0,
  "result": {
    "keyId": "key-library-001",
    "algorithm": "RS256",
    "payload": { "lane": "library" }
  },
  "evidence": [
    { "type": "log", "value": "logs/verify.log#L142" }
  ]
}
```

### Escalation for Key Verification

```json
{
  "status": "ESCALATE",
  "lane": "swarmmind",
  "task_id": "exec-001",
  "summary": "Key trust verification needed",
  "confidence": 0.6,
  "escalation_target": "ARCHIVIST",
  "requires": [
    { "kind": "verification_needed", "detail": "Key key-123 not in local cache" }
  ],
  "suggested_next_step": "Verify key in Archivist trust store"
}
```

### Quarantine for Lane Mismatch

```json
{
  "status": "QUARANTINE",
  "lane": "archivist",
  "task_id": "verify-002",
  "summary": "Lane mismatch detected",
  "confidence": 0.95,
  "reason": "Signed payload claims library, outer lane is swarmmind",
  "error_code": "QUARANTINE_q-456",
  "evidence": [
    { "type": "log", "value": "logs/quarantine.log#q-456" }
  ]
}
```

---

Last updated: 2026-04-20

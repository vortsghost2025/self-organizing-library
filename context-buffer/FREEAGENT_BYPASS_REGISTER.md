# FREEAGENT PRODUCTION PHENOTYPE - BYPASS REGISTER

Date: 2026-04-19T21:12:00-04:00
Status: COMPLETE
Phase: 3 - Deterministic Verification Hardening

## 1) PURPOSE

This document registers all bypass, fallback, and exception paths in the Library lane verification system. Per the roadmap, any operational fallback that could silently re-accept rejected artifacts must be documented.

---

## 2) BYPASS PATHS - NONE ACTIVE

### 2.1 Removed Bypass Paths

| Path | Status | Removal Date | Notes |
|------|--------|--------------|-------|
| HMAC Fallback | **REMOVED** | 2026-04-01 | JWS-only mode enforced |
| Legacy Unsigned Accept | **REMOVED** | 2026-04-01 | All items require signature |
| Recovery Override | **DISABLED** | 2026-04-19 | RecoveryEngine cannot override local rejection |

### 2.2 Code Evidence: No Bypass

**VerifierWrapper.js** lines 121-127:
```javascript
// RecoveryEngine CANNOT override local deterministic failure
// "Provable" guarantees require this to be locally verifiable
// If RecoveryEngine says OK, we log but still REJECT
console.log('[RECOVERY] RecoveryEngine response ignored - local verification is authoritative');
```

---

## 3) EXCEPTION PATHS (Controlled)

### 3.1 Operator Handoff

| Condition | Trigger | Action | Human Required |
|-----------|---------|--------|----------------|
| Max retries exceeded | retryCount > limit | Write handoff artifact | YES |
| Orchestrator unreachable | Network failure | Write handoff artifact | YES |
| Key revocation | Revoked key in trust store | Terminal rejection | NO |

### 3.2 Handoff Artifact Generation

**Location**: `{quarantineManager.handoffFile}`
**Format**: JSON with full context

```json
{
  "itemId": "quarantine-test-001",
  "lane": "swarmmind",
  "reason": "QUARANTINE_MAX_RETRIES",
  "timestamp": "2026-04-19T21:12:00.000Z",
  "artifact": { ... },
  "retryCount": 5,
  "requiresHumanReview": true
}
```

### 3.3 Handoff Does NOT Auto-Accept

- Handoff artifact is for **operator review**
- No automatic acceptance after handoff
- Requires explicit operator action via `forceRelease()`

---

## 4) FALLBACK BEHAVIORS (None Silent)

### 4.1 Trust Store Missing

| Condition | Behavior | Silent? |
|-----------|----------|---------|
| Trust store file missing | Initialize empty, reject all JWS | NO - explicit error |
| Trust store version mismatch | Throw error, abort startup | NO - abort |
| Trust store invalid JSON | Initialize empty, reject all JWS | NO - logged warning |

**Code**: `Verifier.js` lines 28-56

### 4.2 Key Pair Missing

| Condition | Behavior | Silent? |
|-----------|----------|---------|
| Key pair file missing | Abort startup | NO - exit code 1 |
| Wrong passphrase | Abort startup | NO - exit code 1 |
| Key format invalid | Abort startup | NO - exit code 1 |

**Code**: `start-core.ps1` pre-flight checks

### 4.3 Network Failure

| Condition | Behavior | Silent? |
|-----------|----------|---------|
| Orchestrator unreachable | Quarantine, log error, handoff | NO - handoff artifact |
| Recovery timeout | Return hard failure | NO - explicit error |

**Code**: `VerifierWrapper.js` lines 141-162

---

## 5) RECOVERY ENGINE INTEGRATION

### 5.1 Recovery Client Role

The RecoveryClient submits failures to the orchestrator but **CANNOT override** local verification:

```
Local Verification Result: FAIL
            │
            ▼
Submit to RecoveryEngine (optional)
            │
            ├─ RecoveryEngine says "ACCEPT"
            │     │
            │     ▼
            │   LOG: "RecoveryEngine response ignored"
            │   RETURN: { valid: false }
            │
            └─ RecoveryEngine says "RETRY"
                  │
                  ▼
                Schedule retry (still marked invalid)
```

### 5.2 Determinism Guarantee

From `VerifierWrapper.js`:
> "Provable" guarantees require this to be locally verifiable.

Local verification is **authoritative**. No remote override possible.

---

## 6) AUDIT TRAIL

### 6.1 Logged Events

All bypass-related events are logged:

| Event | Log Location | Format |
|-------|--------------|--------|
| Quarantine | `logs/quarantine.log` | JSON Lines |
| Handoff | `logs/handoff-{id}.json` | Full artifact |
| Recovery attempt | Console + logs | Structured |
| Orchestrator unreachable | Console (FATAL) | Structured |

### 6.2 Log Retention

- Quarantine log: Append-only, no rotation
- Handoff artifacts: Persistent until operator action
- Recovery logs: Standard application logs

---

## 7) SECURITY REVIEW

### 7.1 Last Review

**Date**: 2026-04-19
**Reviewer**: Phase 3 Hardening Drill
**Status**: PASS - No active bypass paths

### 7.2 Review Checklist

- [x] All fallback paths documented
- [x] No silent acceptance paths
- [x] Recovery cannot override local rejection
- [x] Handoff requires human action
- [x] Audit trail covers all exception paths

---

## 8) CHANGE LOG

| Date | Change | Impact |
|------|--------|--------|
| 2026-04-01 | HMAC fallback removed | All artifacts require JWS |
| 2026-04-19 | Recovery override disabled | Local verification authoritative |
| 2026-04-19 | Bypass register created | Full audit trail |

---

## 9) GATE CONDITION

All bypass/exception paths must be documented and verified.

- [x] All removed bypass paths documented
- [x] All exception paths documented
- [x] No silent acceptance paths
- [x] Recovery cannot override local
- [x] Handoff requires human action
- [x] Audit trail established

**GATE STATUS**: ✅ REGISTER COMPLETE

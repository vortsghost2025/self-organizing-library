# FREEAGENT PRODUCTION PHENOTYPE - OPERATOR HANDOFF RUNBOOK

Date: 2026-04-19T21:14:00-04:00
Status: COMPLETE
Phase: 4 - Reliability Pass and Recovery Discipline

## 1) OVERVIEW

This runbook guides operators through the process of handling handoff artifacts generated when Library lane verification encounters terminal conditions requiring human intervention.

---

## 2) HANDOFF TRIGGERS

### 2.1 Automatic Handoff Conditions

| Condition | Severity | Handoff Required |
|-----------|----------|------------------|
| Max retries exceeded (5) | HIGH | YES |
| Orchestrator unreachable | CRITICAL | YES |
| Recovery engine failure | HIGH | YES |

### 2.2 NO Handoff (Terminal Rejection)

| Condition | Reason |
|-----------|--------|
| Revoked key | No review needed - key permanently invalid |
| Missing passphrase | Configuration error - fix config |
| Trust store invalid | Configuration error - fix trust store |

---

## 3) HANDOFF ARTIFACT LOCATION

### 3.1 Directory Structure

```
logs/
├── quarantine.log          # All quarantine events (JSON Lines)
├── handoff/
│   ├── handoff-{id}.json   # Individual handoff artifacts
│   └── handoff-{id2}.json
└── startup.log             # Startup logs
```

### 3.2 Handoff Artifact Format

```json
{
    "timestamp": "2026-04-19T21:14:00.000Z",
    "event": "HANDOFF_REQUIRED",
    "item_id": "quarantine-item-001",
    "lane": "swarmmind",
    "reason": "QUARANTINE_MAX_RETRIES",
    "retry_count": 5,
    "artifact": {
        "signature": "eyJhbGciOiJSUzI1NiIs...",
        "lane": "swarmmind",
        "payload": { ... }
    },
    "verification_result": {
        "valid": false,
        "reason": "SIGNATURE_MISMATCH",
        "note": "Cryptographic signature verification failed"
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

## 4) OPERATOR PROCEDURES

### 4.1 Procedure: Review Handoff

**Step 1**: Identify handoff artifact
```bash
ls -la logs/handoff/
```

**Step 2**: Read artifact contents
```bash
cat logs/handoff/handoff-{id}.json | jq .
```

**Step 3**: Check quarantine log for history
```bash
grep "item_id\":\"{id}" logs/quarantine.log
```

### 4.2 Procedure: Investigate Artifact

**Check signature validity**:
```bash
node -e "
const { Verifier } = require('./src/attestation/Verifier');
const fs = require('fs');

const handoff = JSON.parse(fs.readFileSync('logs/handoff/handoff-{id}.json'));
const verifier = new Verifier();
const result = verifier._parseJWS(handoff.artifact.signature);
console.log('Parsed:', JSON.stringify(result, null, 2));
"
```

**Check key in trust store**:
```bash
node -e "
const { TrustStoreManager } = require('./src/attestation/TrustStoreManager');
const tsm = new TrustStoreManager();
const key = tsm.getKey('swarmmind');
console.log('Key status:', key?.status);
console.log('Key ID:', key?.key_id);
"
```

### 4.3 Procedure: Approve Artifact (Force Release)

If investigation shows the artifact is valid and should be accepted:

```bash
node -e "
const { VerifierWrapper } = require('./src/attestation/VerifierWrapper');
const wrapper = new VerifierWrapper({ submitToRecovery: false });
const result = wrapper.forceRelease('{item-id}');
console.log(result);
"
```

**Expected output**:
```json
{ "success": true, "reason": "RELEASED_BY_OPERATOR" }
```

### 4.4 Procedure: Reject Permanently

If investigation shows the artifact is invalid:

```bash
# Remove handoff artifact
rm logs/handoff/handoff-{id}.json

# Item remains quarantined permanently
# No further action needed
```

---

## 5) DECISION MATRIX

### 5.1 When to Approve

| Condition | Action |
|-----------|--------|
| Signature valid, key was temporarily unavailable | Approve with `forceRelease()` |
| Network issue caused transient failure | Approve with `forceRelease()` |
| Trust store was temporarily inconsistent | Approve with `forceRelease()` |

### 5.2 When to Reject

| Condition | Action |
|-----------|--------|
| Signature is genuinely invalid | Reject (delete handoff) |
| Lane identity mismatch is legitimate | Reject (delete handoff) |
| Key was revoked for security reason | Reject (delete handoff) |
| Artifact appears malicious | Reject and investigate |

### 5.3 When to Escalate

| Condition | Action |
|-----------|--------|
| Multiple handoffs from same lane | Escalate to security team |
| Suspicious artifact patterns | Escalate to security team |
| Orchestrator persistent unreachable | Escalate to infrastructure team |

---

## 6) MONITORING

### 6.1 Handoff Metrics

Check handoff status via health script:
```powershell
.\scripts\health-core.ps1
```

### 6.2 Automated Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Handoff generated | Any handoff file created | HIGH |
| Handoff backlog | > 5 handoff files pending | CRITICAL |
| Orchestrator unreachable | Multiple FATAL logs | CRITICAL |

---

## 7) RECOVERY FROM COMMON ISSUES

### 7.1 Orchestrator Unreachable

**Symptoms**: Handoff artifacts with `reason: "ORCHESTRATOR_UNREACHABLE"`

**Resolution**:
1. Check network connectivity to orchestrator
2. Verify orchestrator process is running
3. Check firewall rules
4. Once resolved, manually approve items or wait for retry

### 7.2 Trust Store Inconsistency

**Symptoms**: Handoff artifacts with `reason: "KEY_NOT_FOUND"`

**Resolution**:
1. Verify key is registered in trust store
2. Check key status (not revoked)
3. If key missing, register with Archivist
4. Re-verify artifact after key registration

### 7.3 Persistent Signature Failure

**Symptoms**: Multiple handoffs with same artifact, signature always fails

**Resolution**:
1. Verify source lane is using correct key
2. Check for key rotation in progress
3. Verify artifact was signed with registered key
4. May require key re-registration

---

## 8) SECURITY CONSIDERATIONS

### 8.1 Do NOT

- **Do NOT** automatically approve all handoffs
- **Do NOT** ignore handoff artifacts
- **Do NOT** disable handoff generation
- **Do NOT** reduce max retries without review

### 8.2 Do

- **DO** investigate every handoff
- **DO** document approval decisions
- **DO** report suspicious patterns
- **DO** maintain audit trail

---

## 9) CONTACT INFORMATION

| Role | Responsibility |
|------|----------------|
| Operator | Handoff review and disposition |
| Security Team | Suspicious artifact investigation |
| Infrastructure Team | Orchestrator connectivity issues |
| Archivist Lane Owner | Trust store modifications |

---

## 10) APPENDIX: EXAMPLE WORKFLOW

### Scenario: Max Retries Exceeded

**1. Alert received**: Handoff artifact created

**2. Investigate**:
```bash
$ cat logs/handoff/handoff-abc123.json | jq .
{
  "reason": "QUARANTINE_MAX_RETRIES",
  "retry_count": 5,
  "lane": "swarmmind",
  "verification_result": { "reason": "SIGNATURE_MISMATCH" }
}
```

**3. Check key status**:
```bash
$ node -e "..." 
Key status: active
Key ID: swarmmind-2026-04-19
```

**4. Re-verify signature manually**:
```bash
$ node -e "..."
Signature valid: false
Error: SIGNATURE_MISMATCH
```

**5. Decision**: Signature genuinely invalid

**6. Action**: Reject
```bash
$ rm logs/handoff/handoff-abc123.json
```

**7. Document**: Log rejection reason in operator log

---

**GATE STATUS**: ✅ RUNBOOK COMPLETE

# FreeAgent Evidence Index

**Phase:** 4B  
**Date:** 2026-04-20  
**Owner:** Library (evidence indexing)

---

## Overview

Evidence indexing links claims in outcomes to their proof locations. This enables audit trail verification.

---

## Evidence Types

| Type | Location Pattern | Example |
|------|------------------|---------|
| file | `<path>` | `src/attestation/Verifier.js` |
| log | `<logpath>#<line>` | `logs/verify.log#L142` |
| endpoint | `<url>` | `http://localhost:3847/verify` |
| memory | `<cache>:<key>` | `cache:key-123` |
| trace | `trace-<id>` | `trace-abc-123` |

---

## Evidence Reference Schema

```json
{
  "type": "file" | "log" | "endpoint" | "memory" | "trace",
  "value": "<location>",
  "hash": "<optional-sha256>",
  "timestamp": "<optional-iso-timestamp>"
}
```

---

## Outcome → Evidence Mapping

Each outcome can include evidence references:

```json
{
  "status": "SUCCESS",
  "task_id": "verify-001",
  "summary": "Verification completed",
  "evidence": [
    { "type": "log", "value": "logs/verify.log#L142" },
    { "type": "file", "value": ".trust/keys.json" }
  ]
}
```

---

## Evidence Index File

**Location:** `S:/self-organizing-library/context-buffer/FREEAGENT_EVIDENCE_INDEX_DATA.md`

**Format:**

```markdown
## Claim: Verification Success

- **Task:** verify-001
- **Outcome:** SUCCESS
- **Evidence:**
  - Log: `logs/verify.log#L142` - JWS validation output
  - File: `.trust/keys.json` - Trust store state

## Claim: Key Trusted

- **Task:** verify-002
- **Outcome:** SUCCESS
- **Evidence:**
  - Log: `logs/trust.log#L50` - Key lookup
  - File: `.trust/keys.json#key-library-001` - Key entry
```

---

## Evidence Resolution

### File Evidence

```bash
# Resolve file evidence
cat "S:/Archivist-Agent/.trust/keys.json"

# With hash verification
sha256sum "S:/Archivist-Agent/.trust/keys.json"
```

### Log Evidence

```bash
# Resolve log line evidence
sed -n '142p' "S:/Archivist-Agent/logs/verify.log"
```

### Endpoint Evidence

```bash
# Resolve endpoint evidence
curl "http://localhost:3847/verify" -d '{"keyId":"key-001"}'
```

---

## Evidence Integrity

### Hash Verification

For critical evidence, include hash:

```json
{
  "type": "file",
  "value": ".trust/keys.json",
  "hash": "sha256-abc123..."
}
```

Verification:
```javascript
const crypto = require('crypto');
const fs = require('fs');

function verifyEvidence(evidence) {
  if (evidence.hash) {
    const content = fs.readFileSync(evidence.value);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return hash === evidence.hash.replace('sha256-', '');
  }
  return true;
}
```

---

## Evidence Collection Points

### Verification Evidence

| Point | Log | Content |
|-------|-----|---------|
| JWS received | verify.log | Raw JWS |
| Signature check | verify.log | Algorithm, keyId |
| Payload extract | verify.log | Claims |
| Lane comparison | verify.log | Expected vs actual |
| Final result | verify.log | VALID/INVALID |

### Queue Evidence

| Point | Log | Content |
|-------|-----|---------|
| Item added | queue.log | Item ID, lane |
| Processing start | queue.log | Item ID, timestamp |
| Outcome | outcomes.log | Full outcome |

### Recovery Evidence

| Point | Log | Content |
|-------|-----|---------|
| Quarantine | quarantine.log | Full quarantine entry |
| Handoff | handoff file | Handoff details |
| Resolution | resolutions.log | Operator action |

---

## Cross-Lane Evidence

When evidence spans lanes:

```json
{
  "trace_id": "trace-cross-001",
  "evidence": [
    { "type": "log", "value": "library:logs/verify.log#L100" },
    { "type": "log", "value": "archivist:logs/trust.log#L50" }
  ]
}
```

Lane prefix indicates which lane holds the evidence.

---

## Evidence Retention

| Evidence Type | Retention | Reason |
|---------------|-----------|--------|
| Verification logs | 30 days | Audit |
| Quarantine logs | 90 days | Investigation |
| Handoff files | Until resolved | Operator action |
| Trust store | Permanent | Critical |
| Queue state | 7 days | Operational |

---

## Evidence Index Updates

Index is updated when:
1. Outcome is generated
2. Evidence is collected
3. Cross-lane trace is created

Update process:
```javascript
function updateEvidenceIndex(claim, evidence) {
  const entry = {
    claim,
    evidence,
    indexed_at: new Date().toISOString()
  };
  fs.appendFileSync('FREEAGENT_EVIDENCE_INDEX_DATA.md', formatEntry(entry));
}
```

---

## Query Examples

### Find all evidence for a task

```bash
grep -A5 "Task: task-001" FREEAGENT_EVIDENCE_INDEX_DATA.md
```

### Find evidence for a claim type

```bash
grep -B2 "Outcome: QUARANTINE" FREEAGENT_EVIDENCE_INDEX_DATA.md
```

---

Last updated: 2026-04-20

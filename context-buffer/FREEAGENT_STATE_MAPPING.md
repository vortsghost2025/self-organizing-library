# FreeAgent State Mapping

**Phase:** 4B  
**Date:** 2026-04-20  
**Owner:** Library (state mapping)

---

## Overview

State mapping defines how outcomes transition through the system and where state is stored.

---

## State Domains

### 1. Verification State

**Owner:** Archivist  
**Location:** `.trust/keys.json` (trust store)

| State | Condition |
|-------|-----------|
| trusted | Key in trust store, not revoked |
| revoked | Key in trust store, revoked flag set |
| unknown | Key not in trust store |

### 2. Lane Identity State

**Owner:** Each lane  
**Location:** `.identity/snapshot.jws`

| State | Condition |
|-------|-----------|
| signed | Valid JWS snapshot exists |
| unsigned | No JWS, only `snapshot.json` |

### 3. Queue State

**Owner:** Each lane  
**Location:** `state/queue.json`

| State | Condition |
|-------|-----------|
| pending | Item in queue, not processed |
| processing | Item being processed |
| completed | Item processed successfully |
| failed | Item failed processing |
| quarantined | Item isolated for safety |

### 4. Outcome State

**Owner:** Processing lane  
**Location:** Logs + result payload

| Status | Next State |
|--------|------------|
| SUCCESS | completed |
| FAILURE | failed |
| ESCALATE | pending (in target) |
| DEFER | pending (deferred queue) |
| QUARANTINE | quarantined |

---

## State Transitions

### Verification Flow

```
received → verifying → verified (SUCCESS)
                      → invalid (FAILURE)
                      → unsafe (QUARANTINE)
```

### Queue Processing Flow

```
pending → processing → completed (SUCCESS)
                     → failed (FAILURE)
                     → deferred (DEFER)
                     → quarantined (QUARANTINE)
```

### Escalation Flow

```
processing → ESCALATE → pending (in target lane)
                        + trace_id linked
```

---

## State Storage Locations

| State Type | Location | Format |
|------------|----------|--------|
| Trust store | `S:/Archivist-Agent/.trust/keys.json` | JSON |
| Lane identity | `<lane>/.identity/snapshot.jws` | JWS |
| Queue | `<lane>/state/queue.json` | JSON |
| Quarantine log | `S:/Archivist-Agent/logs/quarantine.log` | JSONL |
| Handoff signals | `<lane>/AGENT_HANDOFF_REQUIRED.md` | Markdown |
| Verification logs | `<lane>/logs/verify.log` | Text |
| Outcome logs | `<lane>/logs/outcomes.log` | JSONL |

---

## Cross-Lane State Linking

### Trace ID

Outcomes include `trace_id` for cross-lane correlation:

```json
{
  "trace_id": "trace-abc-123",
  "lane": "library",
  "task_id": "verify-001",
  "status": "ESCALATE",
  "escalation_target": "ARCHIVIST"
}
```

When Archivist receives the escalation:

```json
{
  "trace_id": "trace-abc-123",
  "lane": "archivist",
  "task_id": "verify-arch-001",
  "parent_task": "verify-001",
  "parent_lane": "library",
  "status": "SUCCESS"
}
```

### Evidence Indexing

Evidence references link to proof:

```json
{
  "evidence": [
    { "type": "log", "value": "logs/verify.log#L142" },
    { "type": "file", "value": "state/queue.json" }
  ]
}
```

Evidence index maps claim to proof location.

---

## State Consistency Rules

### Rule 1: Single Source of Truth

Each state has exactly one authoritative location:
- Trust store: Archivist
- Lane identity: Each lane
- Queue: Each lane

### Rule 2: No Silent State Changes

State transitions must be logged:
- Queue state changes → queue log
- Verification results → verify log
- Outcomes → outcome log

### Rule 3: Recovery Cannot Override

If state is `quarantined`, it cannot become `completed` without:
1. Operator review
2. Manual intervention
3. New verification attempt

---

## State Queries

### Get Lane Trust State

```javascript
// Archivist query
const trustStore = require('./.trust/keys.json');
const keyState = trustStore.keys.find(k => k.kid === keyId);
// Returns: { kid, lane, revoked, ... }
```

### Get Queue State

```javascript
// Lane query
const queue = require('./state/queue.json');
const itemState = queue.items.find(i => i.id === itemId);
// Returns: { id, status, attempts, ... }
```

### Get Outcome History

```javascript
// Log query
const fs = require('fs');
const outcomes = fs.readFileSync('logs/outcomes.log', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(JSON.parse)
  .filter(o => o.task_id === taskId);
```

---

## State Export Format

For cross-lane communication:

```json
{
  "protocol": "freeagent-state-v1",
  "lane": "library",
  "exported_at": "2026-04-20T09:00:00Z",
  "states": {
    "trust": { "keyId": "key-001", "status": "trusted" },
    "queue": { "itemId": "item-001", "status": "processing" },
    "identity": { "status": "signed", "snapshot": "snapshot.jws" }
  },
  "signature": "..."
}
```

---

## State Reconciliation

When lanes disagree on state:

1. **Trust state:** Archivist is authoritative
2. **Queue state:** Lane is authoritative for its own queue
3. **Identity state:** Lane is authoritative for its identity

Disagreements are logged as potential drift.

---

Last updated: 2026-04-20

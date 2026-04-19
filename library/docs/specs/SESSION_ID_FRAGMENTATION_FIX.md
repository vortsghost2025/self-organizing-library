# Session ID Fragmentation: Priority Fix

**Identified**: 2026-04-18T06:57:04Z
**Priority**: CRITICAL — Root cause of self-state aliasing and coordination drift
**Status**: FIX FIRST

---

## The Problem

### Session ID Fragmentation

| Lane | Session ID | Status |
|------|------------|--------|
| SwarmMind | `1776476695493-28240` | LIVE |
| Archivist (registry) | `1776403587854-50060` | TERMINATED |
| Archivist (actual) | UNKNOWN | ACTIVE (making commits) |

**The system has no unified session identity.**

Each lane generates its own session ID. When lanes check each other's status, they read from registry entries that may not match live session IDs.

---

## Why This Causes Drift

### Self-State Aliasing (direct cause)

1. Archivist generates session ID A
2. Archivist session terminates, entry marked in registry
3. Archivist restarts, generates session ID B
4. Archivist reads registry, sees session A as terminated
5. Archivist concludes "I am terminated" (wrong)
6. But Archivist is actually alive with session ID B

**The registry has no way to know about session ID B.**

### Coordination Drift (same root cause)

1. SwarmMind has session ID X
2. SwarmMind checks Archivist registry
3. Registry shows session ID A (terminated)
4. SwarmMind concludes "Archivist terminated" (wrong)
5. But Archivist is alive with session ID B
6. Coordination blocked on stale state

**Each lane sees different session IDs.**

---

## The Fix

### Unified Session Identity

**Requirement**: All lanes must share a single, authoritative session identity.

**Implementation Options**:

#### Option A: Session Authority

```
Archivist-Agent (Position 1) OWNS session identity
├── Generates session ID at system start
├── Propagates to all lanes via SESSION_REGISTRY
├── All lanes use SAME session ID
└── No lane generates its own ID
```

**Authority Check**: Only Position 1 can create session IDs.

#### Option B: Distributed Consensus

```
All lanes propose session ID
├── Timestamp + lane signature
├── Compare proposals
├── Highest authority wins (Position 1 > 2 > 3)
└── All lanes adopt winning ID
```

**Complexity**: More coordination, slower startup.

#### Option C: External Session Service

```
External service generates session ID
├── Independent of all lanes
├── All lanes query same service
└── Single source of truth
```

**Dependency**: Adds external service requirement.

---

## Recommended Fix: Option A (Session Authority)

### Why Option A

1. **Aligns with existing authority hierarchy** (Position 1 = governance root)
2. **No new services** (uses existing SESSION_REGISTRY)
3. **Simple implementation** (single generation point)
4. **Consistent with "Structure > Identity"** value

### Implementation

**In ARCHIVIST-AGENT (Position 1):**

```javascript
// At session initialization
const sessionId = `${Date.now()}-${process.pid}`;

// Write to SESSION_REGISTRY.json
registry.currentSession = {
  id: sessionId,
  lane: "governance-root",
  authority: 100,
  startedAt: new Date().toISOString(),
  status: "ACTIVE"
};

// Propagate to all lanes
propagateToSwarmMind(sessionId);
propagateToLibrary(sessionId);
```

**In SWARMMIND (Position 2):**

```javascript
// At initialization
// READ session ID from registry, don't generate
const registry = readSessionRegistry();
const sessionId = registry.currentSession.id;

// Validate this is still current
if (registry.currentSession.status === "ACTIVE") {
  this.sessionId = sessionId;
} else {
  // Escalate to governance root
  requestNewSessionId();
}
```

**In LIBRARY (Position 3):**

Same as SwarmMind — read, don't generate.

---

## Session Registry Schema Update

```json
{
  "currentSession": {
    "id": "1776476695493-28240",
    "authority": 100,
    "lane": "governance-root",
    "startedAt": "2026-04-18T06:57:04Z",
    "status": "ACTIVE",
    "lastHeartbeat": "2026-04-18T06:58:00Z"
  },
  "previousSession": {
    "id": "1776403587854-50060",
    "endedAt": "2026-04-18T04:30:00Z",
    "status": "TERMINATED"
  },
  "sessionHistory": [
    { "id": "...", "startedAt": "...", "endedAt": "..." }
  ]
}
```

**Key Change**: Single `currentSession` field, not per-lane entries.

---

## Verification Rules

### Before Trusting Session State

```javascript
function verifySessionId(laneSessionId) {
  // 1. Check live runtime
  if (process.active && process.sessionId === laneSessionId) {
    return "LIVE_MATCH";
  }

  // 2. Check registry current session
  const registry = readSessionRegistry();
  if (registry.currentSession.id === laneSessionId) {
    return "REGISTRY_MATCH";
  }

  // 3. If neither match, this is STALE
  return "STALE_SESSION";
}
```

### Self-State Check Sequence

```javascript
function verifySelfState() {
  // 1. Am I alive? (check runtime)
  if (!process.active) return "DEAD";

  // 2. Is my session ID current? (check registry)
  const registry = readSessionRegistry();
  if (registry.currentSession.id !== this.sessionId) {
    // I have a stale session ID
    this.sessionId = registry.currentSession.id;
    return "UPDATED_SESSION";
  }

  // 3. Is my authority valid? (check hierarchy)
  if (this.authority !== registry.currentSession.authority) {
    return "AUTHORITY_MISMATCH";
  }

  return "VERIFIED";
}
```

---

## Impact on Self-State Aliasing

**Before Fix:**
- Each lane generates own session ID
- Registry has multiple session entries
- No unified source of truth
- Self-state derived from stale registry entries

**After Fix:**
- Single session ID from Position 1
- Registry has one current session
- Clear source of truth
- Self-state derived from live process first

---

## Priority Order

1. **FIX**: Session ID fragmentation (Option A)
2. **THEN**: Self-state resolution rule (GOVERNANCE amendment)
3. **THEN**: Recovery protocol normalization
4. **THEN**: CAISC paper updates

Session ID fragmentation is the root cause. Fix it first.

---

## Implementation Checklist

- [ ] Update SESSION_REGISTRY schema (single currentSession)
- [ ] Archivist-Agent generates session ID (Position 1)
- [ ] SwarmMind reads session ID (Position 2)
- [ ] Library reads session ID (Position 3)
- [ ] Add session verification to resolve-governance-v2.js
- [ ] Update AGENTS.md with session authority rule
- [ ] Test: verify self-state with unified session ID

---

**This is the most important operational bug to fix first.**

It directly explains:
- Self-state aliasing
- Coordination drift
- False authority vacuum
- Misleading escalation paths

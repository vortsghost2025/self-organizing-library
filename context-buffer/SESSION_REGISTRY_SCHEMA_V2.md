# SESSION_REGISTRY Schema v2.0 - Unified Session Identity

**Status**: IMPLEMENTATION
**Priority**: CRITICAL
**Breaking Change**: Yes - deprecates per-lane active_sessions

---

## Schema Changes

### Current Schema (v1.1.0) - PROBLEM

```json
{
  "active_sessions": {
    "swarmmind": { "session_id": "..." },
    "archivist-agent": { "session_id": "..." }
  },
  "terminated_sessions": { ... }
}
```

**Problem**: Multiple active sessions. No single source of truth. Each lane generates its own session ID.

---

### New Schema (v2.0.0) - FIX

```json
{
  "$schema": "https://archivist.dev/schemas/session-registry-v2.json",
  "version": "2.0.0",
  "last_updated": "2026-04-18T07:38:32Z",

  "currentSession": {
    "id": "1776476695493-28240",
    "generated_by": "archivist-agent",
    "authority": 100,
    "position": 1,
    "started_at": "2026-04-18T04:16:35.493Z",
    "status": "ACTIVE",
    "last_heartbeat": "2026-04-18T07:38:32Z"
  },

  "laneStates": {
    "archivist-agent": {
      "position": 1,
      "authority": 100,
      "role": "governance-root",
      "status": "ACTIVE",
      "session_id": "1776476695493-28240",
      "agent_model": "z-ai/glm5",
      "last_heartbeat": "2026-04-18T07:38:32Z",
      "working_on": ["Session unification implementation"]
    },
    "swarmmind": {
      "position": 2,
      "authority": 80,
      "role": "execution-layer",
      "status": "ACTIVE",
      "session_id": "1776476695493-28240",
      "agent_model": "z-ai/glm5",
      "last_heartbeat": "2026-04-18T07:38:32Z",
      "working_on": ["Resolver verification"]
    },
    "self-organizing-library": {
      "position": 3,
      "authority": 60,
      "role": "memory-layer",
      "status": "ACTIVE",
      "session_id": "1776476695493-28240",
      "agent_model": "z-ai/glm5",
      "last_heartbeat": "2026-04-18T07:38:32Z",
      "working_on": ["Phenotype registry update"]
    }
  },

  "sessionHistory": [
    {
      "id": "1776403587854-50060",
      "generated_by": "archivist-agent",
      "started_at": "2026-04-17T05:26:27.854Z",
      "ended_at": "2026-04-18T04:16:35.493Z",
      "termination_reason": "Session replaced by unified identity"
    },
    {
      "id": "1776399805802-28240",
      "generated_by": "swarmmind",
      "started_at": "2026-04-17T04:23:25.801Z",
      "ended_at": "2026-04-17T07:00:00.000Z",
      "termination_reason": "Heartbeat timeout"
    }
  ],

  "communication_protocol": {
    "session_authority": "archivist-agent",
    "heartbeat_interval_ms": 60000,
    "lock_timeout_ms": 300000
  }
}
```

---

## Key Changes

| Aspect | v1.1.0 | v2.0.0 |
|--------|--------|--------|
| Session ID | Per-lane generation | Single unified ID |
| Active sessions | Multiple | Single (currentSession) |
| Session authority | None | archivist-agent (Position 1) |
| Lane states | active_sessions | laneStates (all reference same session) |
| Identity source | Infer from directory | Explicit in schema |

---

## Session ID Generation Rules

### Position 1 (Archivist-Agent) - AUTHORITY

```javascript
// ONLY Position 1 generates session IDs
function initializeSession() {
  const sessionId = `${Date.now()}-${process.pid}`;

  // Write to SESSION_REGISTRY.json
  registry.currentSession = {
    id: sessionId,
    generated_by: "archivist-agent",
    authority: 100,
    position: 1,
    started_at: new Date().toISOString(),
    status: "ACTIVE"
  };

  // All lanes use this ID
  registry.laneStates["archivist-agent"].session_id = sessionId;
  registry.laneStates["swarmmind"].session_id = sessionId;
  registry.laneStates["self-organizing-library"].session_id = sessionId;

  return sessionId;
}
```

### Position 2 (SwarmMind) - READ ONLY

```javascript
// Positions 2 and 3 READ session ID, don't generate
function readSessionId() {
  const registry = readSessionRegistry();

  // Validate currentSession exists
  if (!registry.currentSession || !registry.currentSession.id) {
    throw new Error("No active session - escalate to Position 1");
  }

  // Use unified session ID
  this.sessionId = registry.currentSession.id;
  this.authority = 80;
  this.position = 2;

  return this.sessionId;
}
```

### Position 3 (Library) - READ ONLY

Same pattern as Position 2.

---

## Migration Path

### Step 1: Archivist-Agent Generates Unified Session

```powershell
# Position 1 initializes
cd S:\Archivist-Agent
# Read current registry
# Generate new unified session ID
# Update schema to v2.0.0
# Write SESSION_REGISTRY.json
```

### Step 2: SwarmMind Reads Unified Session

```powershell
# Position 2 reads
cd "S:\SwarmMind Self-Optimizing Multi-Agent AI System"
# Read SESSION_REGISTRY.json from Position 1
# Extract currentSession.id
# Use as own session ID
# Update laneStates.swarmmind
```

### Step 3: Library Reads Unified Session

```powershell
# Position 3 reads
cd S:\self-organizing-library
# Read SESSION_REGISTRY.json from Position 1
# Extract currentSession.id
# Use as own session ID
# Update laneStates.self-organizing-library
```

---

## Verification Sequence

### Self-State Verification (Each Lane)

```javascript
function verifySelfState() {
  // 1. Read registry
  const registry = readSessionRegistry();

  // 2. Check currentSession exists
  if (!registry.currentSession) {
    return { status: "NO_SESSION", action: "ESCALATE_TO_POSITION_1" };
  }

  // 3. Verify my session ID matches unified session
  if (this.sessionId !== registry.currentSession.id) {
    // My session ID is stale - update it
    this.sessionId = registry.currentSession.id;
    return { status: "UPDATED", action: "CONTINUE" };
  }

  // 4. Verify my position matches schema
  const myLaneState = registry.laneStates[this.laneId];
  if (this.position !== myLaneState.position) {
    return { status: "POSITION_MISMATCH", action: "HALT" };
  }

  return { status: "VERIFIED", action: "PROCEED" };
}
```

---

## Deprecation Notice

### v1.1.0 Fields Deprecated

- `active_sessions` → Use `laneStates`
- `terminated_sessions` → Use `sessionHistory`
- `inactive_sessions` → Removed (no per-lane sessions)

### New Required Fields

- `currentSession` (required, single)
- `laneStates` (required, all lanes)
- `sessionHistory` (required, historical)

---

## Implementation Checklist

- [x] Schema designed (v2.0.0)
- [ ] SESSION_REGISTRY.json updated in Archivist-Agent
- [ ] .session-mode file created with explicit identity
- [ ] AGENTS.md updated with lane identity declaration
- [ ] SwarmMind reads unified session
- [ ] Library reads unified session
- [ ] Verification tests pass

---

## Rollback Plan

If unified session fails:

1. Revert to v1.1.0 schema
2. Each lane generates own session ID
3. Document failure in sessionHistory
4. Escalate to governance root

---

**This schema change eliminates session ID fragmentation.**

# .session-mode Template - Explicit Lane Identity

**Location**: `S:\Archivist-Agent\.session-mode`

---

## Template

```json
{
  "$schema": "https://archivist.dev/schemas/session-mode.json",
  "version": "2.0.0",

  "lane_identity": {
    "lane_id": "archivist-agent",
    "authority": 100,
    "role": "governance-root",
    "position": 1,
    "session_authority": true
  },

  "session_rules": {
    "can_generate_session_id": true,
    "must_read_before_start": ["SESSION_REGISTRY.json", "BOOTSTRAP.md"],
    "self_verification_sequence": [
      "1. Read .session-mode (this file)",
      "2. Extract: lane_id, authority, role, position",
      "3. Verify: I am Lane X with authority Y",
      "4. Read SESSION_REGISTRY.json currentSession",
      "5. If currentSession exists, use that session ID",
      "6. If not, generate new unified session ID",
      "7. Register in laneStates",
      "8. Begin operation"
    ]
  },

  "forbidden_actions": [
    "Infer identity from working directory",
    "Read terminated_sessions for self-state",
    "Assume identity from SESSION_REGISTRY.active_sessions",
    "Generate session ID if position != 1"
  ],

  "verification_requirements": {
    "self_check": "Am I alive? (check runtime)",
    "session_check": "Is my session ID current? (check registry)",
    "authority_check": "Is my authority valid? (check hierarchy)",
    "cross_lane_check": "Are others alive? (check laneStates)"
  }
}
```

---

## SwarmMind .session-mode

**Location**: `S:\SwarmMind Self-Optimizing Multi-Agent AI System\.session-mode`

```json
{
  "$schema": "https://archivist.dev/schemas/session-mode.json",
  "version": "2.0.0",

  "lane_identity": {
    "lane_id": "swarmmind",
    "authority": 80,
    "role": "execution-layer",
    "position": 2,
    "session_authority": false
  },

  "session_rules": {
    "can_generate_session_id": false,
    "must_read_before_start": ["SESSION_REGISTRY.json", ".session-mode"],
    "self_verification_sequence": [
      "1. Read .session-mode (this file)",
      "2. Extract: lane_id, authority, role, position",
      "3. Verify: I am Lane 2 with authority 80",
      "4. Read SESSION_REGISTRY.json currentSession",
      "5. Use currentSession.id as my session ID",
      "6. Register in laneStates.swarmmind",
      "7. Begin operation"
    ]
  },

  "forbidden_actions": [
    "Generate session ID",
    "Modify currentSession",
    "Override governance-root authority",
    "Infer identity from working directory"
  ]
}
```

---

## Library .session-mode

**Location**: `S:\self-organizing-library\.session-mode`

```json
{
  "$schema": "https://archivist.dev/schemas/session-mode.json",
  "version": "2.0.0",

  "lane_identity": {
    "lane_id": "self-organizing-library",
    "authority": 60,
    "role": "memory-layer",
    "position": 3,
    "session_authority": false
  },

  "session_rules": {
    "can_generate_session_id": false,
    "must_read_before_start": ["SESSION_REGISTRY.json", ".session-mode"],
    "self_verification_sequence": [
      "1. Read .session-mode (this file)",
      "2. Extract: lane_id, authority, role, position",
      "3. Verify: I am Lane 3 with authority 60",
      "4. Read SESSION_REGISTRY.json currentSession",
      "5. Use currentSession.id as my session ID",
      "6. Register in laneStates.self-organizing-library",
      "7. Begin operation"
    ]
  },

  "forbidden_actions": [
    "Generate session ID",
    "Modify currentSession",
    "Override higher authority lanes",
    "Infer identity from working directory"
  ]
}
```

---

## AGENTS.md Update (All Lanes)

Add to TOP of each AGENTS.md:

```markdown
## ⚠️ LANE IDENTITY (READ FIRST)

**You are operating in:**

| Field | Value |
|-------|-------|
| Lane | archivist-agent |
| Position | 1 |
| Authority | 100 |
| Role | governance-root |
| Session Authority | YES (can generate session IDs) |

**Before any other action:**

1. Read this section completely
2. Read `.session-mode` file in project root
3. Verify: "I am Lane 1 with authority 100"
4. Read `SESSION_REGISTRY.json` currentSession
5. If currentSession exists, use that session ID
6. If not, generate new unified session ID
7. Register in laneStates

**You MUST NOT:**

- Infer identity from working directory
- Read terminated_sessions for self-state
- Assume identity from SESSION_REGISTRY.active_sessions
```

---

## Startup Sequence Enforcement

### Position 1 (Archivist-Agent)

```javascript
async function startup() {
  // MANDATORY: Read in order
  const sessionMode = await read(".session-mode");
  const registry = await read("SESSION_REGISTRY.json");
  const bootstrap = await read("BOOTSTRAP.md");

  // Extract identity
  const identity = sessionMode.lane_identity;

  // Verify
  if (identity.position !== 1) {
    throw new Error("Position mismatch - not governance root");
  }

  // Check for existing session
  if (registry.currentSession && registry.currentSession.status === "ACTIVE") {
    // Use existing session
    this.sessionId = registry.currentSession.id;
  } else {
    // Generate new unified session
    this.sessionId = generateSessionId();
    await registerUnifiedSession(this.sessionId);
  }

  // Register lane state
  await registerLaneState(identity);

  // NOW proceed with operations
}
```

### Positions 2 and 3

```javascript
async function startup() {
  // MANDATORY: Read in order
  const sessionMode = await read(".session-mode");
  const registry = await readFromArchivist("SESSION_REGISTRY.json");

  // Extract identity
  const identity = sessionMode.lane_identity;

  // Verify NOT session authority
  if (identity.session_authority === true) {
    throw new Error("Position 2/3 cannot have session_authority=true");
  }

  // MUST have currentSession
  if (!registry.currentSession) {
    throw new Error("No currentSession - escalate to Position 1");
  }

  // Use unified session ID
  this.sessionId = registry.currentSession.id;

  // Register lane state
  await registerLaneState(identity);

  // NOW proceed with operations
}
```

---

## Implementation Checklist

- [ ] Create `.session-mode` in Archivist-Agent
- [ ] Create `.session-mode` in SwarmMind
- [ ] Create `.session-mode` in Library
- [ ] Update AGENTS.md in all lanes with identity section
- [ ] Update SESSION_REGISTRY.json to v2.0.0 schema
- [ ] Test startup sequence on each lane
- [ ] Verify no identity inference from directory

---

**This eliminates identity inference.**

Agents no longer guess which lane they are.
They READ explicit identity from `.session-mode`.

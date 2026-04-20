# FREEAGENT PRODUCTION PHENOTYPE - RUNTIME CONTRACTS

Date: 2026-04-19T21:08:00-04:00
Status: COMPLETE
Phase: 1 - Topology and Contract Map

## 1) JWS VERIFICATION CONTRACT

### 1.1 Contract: Lane-First Deterministic Verification

**Authority**: Library Lane (Authority 60)
**Purpose**: Verify JWS signatures with lane identity enforcement BEFORE cryptographic verification

#### Input Schema
```javascript
{
  signature: string,      // JWS compact serialization
  lane: string,           // Outer lane identifier (A)
  origin_lane: string,    // Alternative: origin lane field
  // ... additional payload fields
}
```

#### Verification Steps (Deterministic Order)
1. **Extract outerLane** from envelope field `lane` or `origin_lane` → (A)
2. **Parse JWS** payload → extract `payload.lane` → (B)
3. **Compare**: A === B (MUST match before any crypto)
4. **Fetch publicKey** for laneId from trust store → (C)
5. **Verify RSA-SHA256** signature
6. **On failure**: quarantine → report to orchestrator → schedule retry

#### Output Schema (Success)
```javascript
{
  valid: true,
  mode: 'JWS_VERIFIED',
  payload: object,       // Parsed JWS payload
  header: object,        // JWS header (alg, kid, etc.)
  lane: string           // Confirmed lane identifier
}
```

#### Output Schema (Failure)
```javascript
{
  valid: false,
  error: string,         // VERIFY_REASON constant
  note: string,          // Human-readable explanation
  reason: string,        // Machine-readable reason code
  itemId: string,        // Quarantine ID if applicable
  retryCount: number,    // Number of retry attempts
  nextRetryIn: number,   // MS until next retry (if scheduled)
  handoffRequired: boolean,
  handoffFile: string    // Path to handoff artifact
}
```

#### Failure Reasons (VERIFY_REASON)
| Reason Code | Trigger | Action |
|-------------|---------|--------|
| `MISSING_SIGNATURE` | No signature field | Reject immediately |
| `MISSING_LANE` | No lane/origin_lane field | Reject immediately |
| `LANE_MISMATCH` | A ≠ B in step 3 | Reject, no crypto attempted |
| `KEY_NOT_FOUND` | No public key for lane in trust store | Quarantine, report |
| `SIGNATURE_MISMATCH` | RSA verification failed | Quarantine, report |
| `QUARANTINED` | Item in quarantine loop | Return quarantine status |
| `QUARANTINE_MAX_RETRIES` | Retry limit exceeded | Handoff to operator |

---

## 2) RECOVERY SUBMISSION CONTRACT

### 2.1 Contract: Orchestrator Recovery API

**Authority**: Archivist Lane (Authority 80)
**Endpoint**: `ARCHIVIST_ORCHESTRATOR_URL` (default: `http://localhost:3000/orchestrate/recovery`)
**Method**: POST
**Timeout**: `ORCHESTRATOR_REQUEST_TIMEOUT_MS` (5000ms)

#### Request Schema
```javascript
{
  artifact: object,          // The failed artifact
  outerLane: string,         // Lane that sent artifact
  failureReason: string,     // VERIFY_REASON constant
  debugContext: {
    timestamp: string,
    itemId: string,
    retryCount: number,
    errorDetails: object
  }
}
```

#### Response Schema (Success)
```javascript
{
  status: 'RECOVERY_SCHEDULED',
  recoveryId: string,        // Unique recovery tracking ID
  nextRetryIn: number,       // MS until next retry attempt
  instructions: string       // Optional operator instructions
}
```

#### Response Schema (Handoff Required)
```javascript
{
  status: 'HANDOFF_REQUIRED',
  recoveryId: string,
  handoffFile: string,       // Path to operator handoff artifact
  reason: string,            // Why handoff is required
  operatorMessage: string    // Message for operator review
}
```

#### Response Schema (Terminal Failure)
```javascript
{
  status: 'TERMINAL_FAILURE',
  recoveryId: string,
  reason: string,
  finalState: string         // 'QUARANTINE_PERSISTENT' | 'KEY_REVOKED' | 'LANE_INVALID'
}
```

---

## 3) TRUST STORE REGISTRATION CONTRACT

### 3.1 Contract: Public Key Registration

**Authority**: Archivist Lane (Authority 80) - Trust Store Owner
**Location**: `ARCHIVIST_TRUST_STORE_PATH` (default: `S:/Archivist-Agent/.trust/keys.json`)

#### Registration Request Schema
```javascript
{
  lane_id: string,           // Lane identifier (e.g., 'library', 'swarmmind')
  public_key_pem: string,    // PEM-encoded RSA-2048 public key
  key_id: string,            // Key identifier (format: {lane_id}-{timestamp})
  registered_by: string,     // Registering lane
  registered_at: string      // ISO timestamp
}
```

#### Trust Store Entry Schema
```javascript
{
  version: '1.0',
  keys: {
    [lane_id]: {
      public_key_pem: string,
      key_id: string,
      registered_at: string,
      registered_by: string,
      status: 'active' | 'revoked',
      revoked_at: string,    // If status === 'revoked'
      revoke_reason: string  // If status === 'revoked'
    }
  }
}
```

#### Key Revocation
```javascript
{
  lane_id: string,
  reason: string,            // Revocation reason
  revoked_at: string,        // ISO timestamp
  revoked_by: string         // Revoking authority
}
```

---

## 4) QUEUE CONTRACT

### 4.1 Contract: Signed Queue Items

**Authority**: Library Lane (Authority 60)
**Purpose**: Append-only log of inter-lane communication with attestation

#### Queue Entry Schema
```javascript
{
  id: string,                // Format: Q-{timestamp}-{counter}
  timestamp: string,         // ISO timestamp
  type: string,              // Entry type (e.g., 'VERIFICATION_REQUEST')
  target_lane: string,       // Destination lane
  origin_lane: string,       // Source lane
  status: 'pending' | 'processed' | 'failed',
  signature: string,         // JWS signature of entry
  key_id: string,            // Signing key identifier
  payload: object,           // Entry payload
  artifact_path: string,     // Optional artifact reference
  required_action: string,   // Required action for target lane
  proof_required: string     // Required proof type
}
```

#### Queue File Location
- Path: `{baseDir}/{type.toLowerCase()}.log`
- Format: JSON Lines (one JSON object per line)
- Append-only: New entries appended, never modified

---

## 5) HEALTH CHECK CONTRACT

### 5.1 Library Lane Health Endpoint

**Endpoint**: Internal (no HTTP server in current implementation)
**Method**: Script-based health check

#### Health Check Command
```bash
node scripts/test-lane-consistency.js
```

#### Health Check Output Schema
```javascript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  checks: {
    trustStore: {
      status: 'ok' | 'missing' | 'invalid',
      path: string,
      lanes: number,
      active: number
    },
    keyPair: {
      status: 'ok' | 'missing' | 'invalid',
      path: string,
      keyId: string
    },
    verification: {
      status: 'ok' | 'error',
      lastTest: string
    }
  }
}
```

---

## 6) ORCHESTRATOR HEALTH CONTRACT

### 6.1 Contract: Orchestrator Health Probe

**Authority**: Archivist Lane (Authority 80)
**Endpoint**: `{ORCHESTRATOR_BASE_URL}/health`
**Method**: GET

#### Expected Response
```javascript
{
  status: 'healthy' | 'degraded',
  uptime: number,           // Seconds since start
  activeRecoveries: number, // Current recovery operations
  pendingQueue: number,     // Items in recovery queue
  lanes: {
    swarmmind: 'connected' | 'disconnected',
    library: 'connected' | 'disconnected',
    archivist: 'active'
  }
}
```

---

## 7) API ROUTES SUMMARY

### 7.1 Outbound (Library → Archivist)

| Route | Method | Purpose | Contract |
|-------|--------|---------|----------|
| `/orchestrate/recovery` | POST | Submit recovery request | Section 2 |
| `/health` | GET | Health probe | Section 6 |

### 7.2 Inbound (Expected from SwarmMind/Agents)

| Route | Method | Purpose | Contract |
|-------|--------|---------|----------|
| (file-based) | - | Artifact submission | Queue Contract |
| (file-based) | - | Verification request | JWS Contract |

### 7.3 File-Based Contracts

Library lane uses file-based communication (no HTTP server):
- **Queue Log**: `logs/{type}.log` - Append-only JSON Lines
- **Quarantine Log**: `logs/quarantine.log` - Quarantined items
- **Handoff Artifacts**: `handoffs/{id}.json` - Operator handoff files
- **Trust Store**: External (Archivist-owned)

---

## 8) GATE CONDITION

Map must let a third party boot the core path with no guessing.

- [x] All API routes documented
- [x] Request/response schemas defined
- [x] Error conditions enumerated
- [x] File-based contracts documented
- [x] Health check procedures documented

**GATE STATUS**: ✅ READY FOR REVIEW

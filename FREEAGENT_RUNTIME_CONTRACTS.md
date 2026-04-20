# FreeAgent Runtime Contracts

Date: 2026-04-19
Phase: 1
Architecture Mode: `lane_single_process`

## Contract Overview

Each lane operates as an independent Node.js process with no inter-process communication. Contracts are file-based (trust store) or HTTP-based (recovery coordination).

---

## Attestation Contract

### Trust Store Read

| Lane | Action | Path | Format |
|------|--------|------|--------|
| Library | Read | `S:/Archivist-Agent/.trust/keys.json` | JSON |
| SwarmMind | Read | `S:/Archivist-Agent/.trust/keys.json` | JSON |
| Archivist | Read/Write | `S:/Archivist-Agent/.trust/keys.json` | JSON |

**Contract:**
- Trust store MUST exist before lane starts
- Trust store MUST contain `keys` object with lane IDs
- Each lane key MUST have: `key_id`, `public_key_pem`, `registered_at`
- Optional: `revoked_at` (marks key as revoked)

### Identity Verification

| Lane | Action | Path | Format |
|------|--------|------|--------|
| Library | Read | `.identity/snapshot.jws` | JWS |
| SwarmMind | Read | `.identity/snapshot.jws` | JWS |

**Contract:**
- Identity file MUST exist for self-verification
- JWS MUST be signed by lane's private key
- JWS MUST contain valid `identity.lane` matching lane ID

### Key Access

| Lane | Action | Path | Format |
|------|--------|------|--------|
| Library | Read | `.identity/private.pem` | PEM |
| SwarmMind | Read | `.identity/private.pem` | PEM |

**Contract:**
- Private key MUST exist for signing
- Private key MUST be encrypted (passphrase protected)
- `LANE_KEY_PASSPHRASE` env var MUST be set

---

## Verification Contract

### VerifierWrapper Flow

```
verify(item) {
  1. Extract outerLane from item
  2. Parse JWS signature
  3. Extract payloadLane from signed payload
  4. Compare: outerLane === payloadLane === trustedKeyLane
  5. If mismatch: QUARANTINE (no crypto needed)
  6. If match: verify crypto against trust store
  7. Return result
}
```

**Contract:**
- Lane comparison MUST happen BEFORE crypto verification
- Mismatch → structured rejection (no throw)
- Missing signature → REJECT (no fallback)
- Malformed JWS → QUARANTINE (no throw)

### Queue Verification

```
updateStatus(id, newStatus) {
  1. Load item from queue
  2. If item.signature: verify(item)
  3. If !item.signature: REJECT (no fallback)
  4. If verification fails: throw
  5. Update status
  6. Re-sign item
  7. Persist
}
```

**Contract:**
- Every status transition MUST verify signature
- Unsigned items MUST be rejected
- Verification failure MUST block transition

---

## Recovery Contract

### Recovery Endpoint

| Lane | Action | Endpoint |
|------|--------|----------|
| Library | POST | `http://localhost:3000/orchestrate/recovery` |
| SwarmMind | POST | `http://localhost:3000/orchestrate/recovery` |
| Archivist | Listen | `localhost:3000` |

**Request:**
```json
{
  "lane": "library",
  "itemId": "queue-123",
  "reason": "QUARANTINED",
  "note": "Lane mismatch detected",
  "item": { ... }
}
```

**Response:**
```json
{
  "status": "quarantined",
  "quarantineId": "q-456",
  "retryCount": 1,
  "handoffRequired": false
}
```

**Contract:**
- Recovery response CANNOT override local rejection
- Recovery is informational only (for audit/handoff)
- Unreachable recovery → log error, continue with local decision

---

## Quarantine Contract

### Quarantine Location

| Lane | Path |
|------|------|
| Library | `logs/quarantine.log` |
| SwarmMind | `S:/Archivist-Agent/logs/quarantine.log` |

**Contract:**
- Rejected items MUST be logged to quarantine
- Quarantine log MUST include: itemId, lane, reason, timestamp
- Quarantine items MUST have retry count

### Quarantine Flow

```
quarantine(item, reason) {
  1. Generate quarantineId
  2. Set retryCount = 1
  3. Log to quarantine.log
  4. Submit to recovery endpoint
  5. Return structured rejection
}
```

**Contract:**
- Quarantine MUST be durable (file-based)
- Quarantine MUST be reviewable by operator
- Max retries: 3 (defined in constants)

---

## Signature Algorithm Contract

### Signing

| Field | Value |
|-------|-------|
| Algorithm | `RSA-SHA256` |
| Format | JWS (Compact Serialization) |
| Header | `{"alg": "RS256", "typ": "JWT", "kid": "<key_id>"}` |
| Payload | JSON (canonicalized) |

### Verification

| Check | Order |
|-------|-------|
| Lane comparison | 1 (before crypto) |
| Key ID match | 2 |
| Signature validity | 3 |
| Key revocation | 4 |

**Contract:**
- Algorithm MUST be `RSA-SHA256` (no HMAC)
- Key ID in JWS header MUST match trust store
- Revoked keys MUST cause rejection

---

## Fallback Policy Contract

| Policy | Value | Effect |
|--------|-------|--------|
| `hmac_accepted` | `false` | HMAC signatures rejected |
| `recovery_override_allowed` | `false` | Recovery cannot override rejection |
| `missing_signature_mode` | `REJECT` | Unsigned items rejected |
| `malformed_jws_mode` | `QUARANTINE` | Structured rejection, no throw |

**Contract:**
- These policies are defined in `FREEAGENT_SYSTEM_ANCHOR.json`
- Any deviation from policy is a HARD FAIL
- Policies MUST be validated before boot

---

## Handoff Contract

### Handoff Signal

| File | Location |
|------|----------|
| `AGENT_HANDOFF_REQUIRED.md` | Lane root |

**Triggers:**
- Quarantine max retries exceeded
- Unrecoverable verification failure
- Operator intervention required

**Contract:**
- Handoff signal MUST be generated on terminal condition
- Handoff MUST include: itemId, reason, attempts, timestamp
- Lane MUST NOT continue processing after handoff signal

---

Last updated: 2026-04-19

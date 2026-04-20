# FREEAGENT PRODUCTION PHENOTYPE - ENVIRONMENT MATRIX

Date: 2026-04-19T21:08:00-04:00
Status: COMPLETE
Phase: 1 - Topology and Contract Map

## 1) ENVIRONMENT VARIABLES

### 1.1 Required Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LANE_KEY_PASSPHRASE` | **YES** | (none) | Passphrase to decrypt Lane's RSA private key |

**Note**: `LANE_KEY_PASSPHRASE` is REQUIRED for production. Without it, the Lane cannot sign artifacts or recovery requests.

### 1.2 Optional Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LANE_ID` | `library` | Lane identifier |
| `LANE_NAME` | `library` | Alternative lane name field |
| `LANE_KEY_PATH` | `S:/self-organizing-library/.trust/library.json` | Path to Lane's key pair file |
| `ARCHIVIST_ORCHESTRATOR_URL` | `http://localhost:3000/orchestrate/recovery` | Archivist recovery endpoint |
| `ARCHIVIST_TRUST_STORE_PATH` | `S:/Archivist-Agent/.trust/keys.json` | Trust store file location |
| `LANE_HMAC_SECRET` | (none) | Legacy HMAC secret (deprecated) |

---

## 2) ENVIRONMENT VARIABLE DETAILS

### 2.1 LANE_KEY_PASSPHRASE (Required)

**Purpose**: Decrypt Lane's RSA-2048 private key for signing operations.

**Used By**:
- `src/attestation/KeyManager.js` - Key loading and decryption
- `src/queue/Queue.js` - Queue item signing

**Security**:
- MUST be kept secret
- MUST be provided via secure environment (not hardcoded)
- MUST match the passphrase used during key generation

**Failure Behavior**:
- If missing: Key loading fails, startup aborted
- If incorrect: Decryption fails, signing operations fail

### 2.2 LANE_ID

**Purpose**: Identify this lane in attestation and recovery operations.

**Used By**:
- `src/attestation/constants.js` - Lane identifier constant
- `src/identity/IdentityStore.js` - Identity management

**Valid Values**:
- `library` (default)
- `swarmmind` (for SwarmMind lane)
- `archivist` (for Archivist lane)

### 2.3 LANE_KEY_PATH

**Purpose**: Location of Lane's RSA key pair file.

**Used By**:
- `src/attestation/KeyManager.js` - Key loading
- `src/attestation/constants.js` - Default path constant

**File Format**:
```json
{
  "lane_id": "library",
  "private_key": "-----BEGIN ENCRYPTED PRIVATE KEY-----...",
  "public_key": "-----BEGIN PUBLIC KEY-----...",
  "key_id": "library-2026-04-19T00:00:00Z",
  "created_at": "2026-04-19T00:00:00Z",
  "algorithm": "RSA-2048"
}
```

### 2.4 ARCHIVIST_ORCHESTRATOR_URL

**Purpose**: Endpoint for recovery request submission.

**Used By**:
- `src/attestation/constants.js` - Default URL constant
- `src/attestation/RecoveryClient.js` - HTTP requests

**Format**: `http://{host}:{port}/orchestrate/recovery`

**Examples**:
- Development: `http://localhost:3000/orchestrate/recovery`
- Production: `http://archivist.internal:3847/orchestrate/recovery`

### 2.5 ARCHIVIST_TRUST_STORE_PATH

**Purpose**: Location of the public key trust store.

**Used By**:
- `src/attestation/constants.js` - Default path constant
- `src/attestation/Verifier.js` - Trust store loading
- `src/attestation/TrustStoreManager.js` - Trust store management

**File Format**:
```json
{
  "version": "1.0",
  "keys": {
    "swarmmind": {
      "public_key_pem": "-----BEGIN PUBLIC KEY-----...",
      "key_id": "swarmmind-2026-04-19T00:00:00Z",
      "registered_at": "2026-04-19T00:00:00Z",
      "registered_by": "archivist",
      "status": "active"
    },
    "library": {
      "public_key_pem": "-----BEGIN PUBLIC KEY-----...",
      "key_id": "library-2026-04-19T00:00:00Z",
      "registered_at": "2026-04-19T00:00:00Z",
      "registered_by": "archivist",
      "status": "active"
    },
    "archivist": {
      "public_key_pem": "-----BEGIN PUBLIC KEY-----...",
      "key_id": "archivist-2026-04-19T00:00:00Z",
      "registered_at": "2026-04-19T00:00:00Z",
      "registered_by": "archivist",
      "status": "active"
    }
  }
}
```

### 2.6 LANE_HMAC_SECRET (Deprecated)

**Purpose**: Legacy HMAC secret for pre-migration artifacts.

**Used By**:
- `src/attestation/Verifier.js` - Legacy HMAC verification

**Status**: DEPRECATED - Use JWS signatures instead

**Migration**: Artifacts using HMAC should be re-signed with JWS

---

## 3) STARTUP DEPENDENCIES

### 3.1 Hard Dependencies (Must be present)

| Dependency | Check | Failure Action |
|------------|-------|----------------|
| `LANE_KEY_PASSPHRASE` env var | Check existence | Abort startup |
| Key pair file (`LANE_KEY_PATH`) | File exists check | Abort startup |
| Trust store file (`ARCHIVIST_TRUST_STORE_PATH`) | File exists check | Abort startup |
| Private key decryption | Try decrypt with passphrase | Abort startup |

### 3.2 Soft Dependencies (Optional, checked at runtime)

| Dependency | Check | Failure Action |
|------------|-------|----------------|
| Orchestrator endpoint | Health check on startup | Log warning, continue |
| Agent endpoints | Not checked | Checked on artifact receipt |

---

## 4) CONFIGURATION FILES

### 4.1 Key Pair File

**Location**: `LANE_KEY_PATH` (default: `S:/self-organizing-library/.trust/library.json`)

**Generated By**: `scripts/generate-library-keys.js`

**Generation Command**:
```bash
LANE_KEY_PASSPHRASE=<secret> node scripts/generate-library-keys.js
```

### 4.2 Trust Store File

**Location**: `ARCHIVIST_TRUST_STORE_PATH` (default: `S:/Archivist-Agent/.trust/keys.json`)

**Owner**: Archivist Lane (Authority 80)

**Registration**: Public keys are registered by Archivist, not self-registered

---

## 5) ENVIRONMENT SETUP CHECKLIST

### 5.1 Development Environment

```bash
# Required
export LANE_KEY_PASSPHRASE="your-secret-passphrase"

# Optional (defaults provided)
export LANE_ID="library"
export LANE_KEY_PATH="S:/self-organizing-library/.trust/library.json"
export ARCHIVIST_ORCHESTRATOR_URL="http://localhost:3000/orchestrate/recovery"
export ARCHIVIST_TRUST_STORE_PATH="S:/Archivist-Agent/.trust/keys.json"
```

### 5.2 Production Environment

```bash
# Required (set via secure secret management)
LANE_KEY_PASSPHRASE=<from-secrets-manager>
LANE_ID=library

# Production endpoints
ARCHIVIST_ORCHESTRATOR_URL=http://archivist.internal:3847/orchestrate/recovery
ARCHIVIST_TRUST_STORE_PATH=/var/trust/keys.json
LANE_KEY_PATH=/var/keys/library.json
```

---

## 6) GATE CONDITION

Environment matrix must allow third party to configure runtime without guessing.

- [x] All environment variables documented
- [x] Required vs optional clearly marked
- [x] Defaults documented
- [x] File formats specified
- [x] Startup dependencies enumerated
- [x] Setup checklist provided

**GATE STATUS**: ✅ READY FOR REVIEW

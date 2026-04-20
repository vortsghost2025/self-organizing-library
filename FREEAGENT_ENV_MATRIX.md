# FreeAgent Environment Matrix

Date: 2026-04-19
Phase: 1
Architecture Mode: `lane_single_process`

## Required Environment Variables

| Variable | Lanes | Purpose | Example |
|----------|-------|---------|---------|
| `LANE_KEY_PASSPHRASE` | Library, SwarmMind | Decrypt private key for signing | (secret) |

**Contract:**
- MUST be set before lane starts
- MUST NOT be logged or committed
- MUST be provided by operator or secure storage

---

## Optional Environment Variables

### Attestation

| Variable | Lanes | Default | Purpose |
|----------|-------|---------|---------|
| `LANE_ID` | Library, SwarmMind | `library` / `swarmmind` | Override lane identity |
| `LANE_KEY_PATH` | Library | `.trust/library.json` | Path to key file |
| `ATTESTATION_TRUST_STORE` | SwarmMind | `S:/Archivist-Agent/.trust/keys.json` | Override trust store path |
| `ARCHIVIST_TRUST_STORE_PATH` | Library | `S:/Archivist-Agent/.trust/keys.json` | Override trust store path |
| `LANE_HMAC_SECRET` | All | (none) | Legacy HMAC (DEPRECATED, not used) |

### Recovery Coordination

| Variable | Lanes | Default | Purpose |
|----------|-------|---------|---------|
| `ARCHIVIST_ORCHESTRATOR_URL` | Library, SwarmMind | `http://localhost:3000/orchestrate/recovery` | Recovery endpoint URL |

### Development

| Variable | Lanes | Default | Purpose |
|----------|-------|---------|---------|
| `NODE_ENV` | All | (none) | `development` / `production` |

---

## Lane-Specific Variables

### Archivist

| Variable | Required | Purpose |
|----------|----------|---------|
| None | - | Archivist hosts trust store, no key needed for basic operation |

### Library

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LANE_KEY_PASSPHRASE` | Yes | - | Decrypt `.identity/private.pem` |
| `LANE_ID` | No | `library` | Lane identifier |
| `ARCHIVIST_TRUST_STORE_PATH` | No | `S:/Archivist-Agent/.trust/keys.json` | Trust store location |
| `ARCHIVIST_ORCHESTRATOR_URL` | No | `http://localhost:3000/orchestrate/recovery` | Recovery endpoint |

### SwarmMind

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `LANE_KEY_PASSPHRASE` | Yes | - | Decrypt `.identity/private.pem` |
| `LANE_ID` | No | `swarmmind` | Lane identifier |
| `ATTESTATION_TRUST_STORE` | No | `S:/Archivist-Agent/.trust/keys.json` | Trust store location |
| `ARCHIVIST_ORCHESTRATOR_URL` | No | `http://localhost:3000/orchestrate/recovery` | Recovery endpoint |

---

## Defaults Matrix

| Lane | Trust Store | Identity | Key |
|------|-------------|----------|-----|
| Archivist | `.trust/keys.json` | N/A | N/A |
| Library | `S:/Archivist-Agent/.trust/keys.json` | `.identity/snapshot.jws` | `.identity/private.pem` |
| SwarmMind | `S:/Archivist-Agent/.trust/keys.json` | `.identity/snapshot.jws` | `.identity/private.pem` |

---

## Validation Rules

### Before Boot

```
1. Check LANE_KEY_PASSPHRASE is set (Library, SwarmMind)
2. Verify trust store path exists
3. Verify identity file exists
4. Verify private key exists (if signing required)
```

### On Verification

```
1. Load trust store from configured path
2. Load identity from lane root
3. Decrypt private key using passphrase
4. Sign/verify as needed
```

---

## Security Considerations

### Secrets

| Secret | Storage | Rotation |
|--------|---------|----------|
| `LANE_KEY_PASSPHRASE` | Environment | Manual |
| Private key | `.identity/private.pem` | Key regeneration |
| Trust store | `.trust/keys.json` | Key addition/revocation |

### Prohibited Patterns

| Pattern | Reason |
|---------|--------|
| Hardcoded secrets in code | Security violation |
| Secrets in git commits | Security violation |
| `LANE_HMAC_SECRET` usage | Deprecated, HMAC rejected |

---

## Configuration Files

### Archivist

| File | Purpose |
|------|---------|
| `FREEAGENT_SYSTEM_ANCHOR.json` | Canonical phenotype definition |
| `.trust/keys.json` | Trust store |
| `config/allowed_roots.json` | Path whitelist (if used) |

### Library

| File | Purpose |
|------|---------|
| `.identity/snapshot.json` | Identity snapshot (unsigned) |
| `.identity/snapshot.jws` | Identity snapshot (signed) |
| `.identity/private.pem` | Private key (encrypted) |
| `.identity/public.pem` | Public key |

### SwarmMind

| File | Purpose |
|------|---------|
| `.identity/snapshot.json` | Identity snapshot (unsigned) |
| `.identity/snapshot.jws` | Identity snapshot (signed) |
| `.identity/private.pem` | Private key (encrypted) |
| `.identity/public.pem` | Public key |

---

## Boot Sequence Dependencies

```
1. Load environment variables
2. Validate LANE_KEY_PASSPHRASE set
3. Validate trust store accessible
4. Validate identity files present
5. Start governed-start.js
6. Verify identity against trust store
7. Begin queue processing
```

---

Last updated: 2026-04-19

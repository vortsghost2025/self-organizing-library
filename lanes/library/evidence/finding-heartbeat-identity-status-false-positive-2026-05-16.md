OUTPUT_PROVENANCE:
  agent: opencode
  lane: library
  target: heartbeat-identity-status-false-positive
  generated_at: 2026-05-16T06:15:00Z
  session_id: sess_mp63e3uk_1229471

# Evidence Finding: Heartbeat identity_status False Positive

## Claim
The Library lane heartbeat was emitting `identity_status: "missing_identity_keys"` and `error_code: "MISSING_IDENTITY_KEYS"`, suggesting that signing keys were absent from the trust store.

## Verdict: FALSE POSITIVE — Claim is REJECTED

## Root Cause
The `.identity/public.pem` file contained an **RSA 2048-bit public key** while the `.identity/private.pem` was an **Ed25519** key. This key-type mismatch caused `deriveKeyId()` (in `.global/deriveKeyId.js:17`) to fail with `error:1E08010C:DECODER routines::unsupported` when calling `crypto.createPublicKey()` on the RSA PEM, because:

1. The RSA PEM was either corrupted or an artifact from a pre-rotation key pair
2. After the 2026-05-11 EdDSA key rotation, the private key was regenerated as Ed25519 but the public.pem was not updated to match
3. `createSignedMessage()` caught the error and fell through to the `catch` block (heartbeat.js:230-248), emitting `identity_status: "missing_identity_keys"` with `signature: null`

## Evidence

### Trust Store Confirms 4/4 Keys
`lanes/broadcast/trust-store.json` shows all 4 lane keys present after 2026-05-11 EdDSA rotation:
- archivist: `6ed65c18a0afca45`
- library: `42e853d4ec37955d`
- swarmmind: `c707d41a7bb96d96`
- kernel: `2effb49ea02dff5b`

### Private Key Is Valid Ed25519
```
$ openssl pkey -in .identity/private.pem -text -noout
ED25519 Private-Key
```

### Public Key Was Invalid RSA PEM
```
$ openssl pkey -pubin -in .identity/public.pem -text -noout
Could not read key of Public Key from .identity/public.pem
```
The PEM header `-----BEGIN PUBLIC KEY-----` contained an RSA key body (`MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...`), mismatched with the Ed25519 private key.

### Fix Applied
Regenerated the public key from the private key:
```bash
openssl pkey -in .identity/private.pem -pubout -out .identity/public.pem
```
Result: `-----BEGIN PUBLIC KEY----- MCowBQYDK2VwAyEAw9w42sDe8qPJ1LKRsFcQ+2/ptA/N+grOA3TGz+xQPpU= -----END PUBLIC KEY-----`

### Verification
After fix, `createSignedMessage()` succeeds:
- `identity_status: "ratified"`
- `key_id: "42e853d4ec37955d"` (matches trust-store)
- `signature_alg: "EdDSA"`

The heartbeat daemon emitted a fresh signed heartbeat at `2026-05-16T06:05:49.718Z` confirming the fix.

## Downstream Impact
- `src/app/api/governance/lanes/route.ts`: Consumes heartbeat for freshness classification (FRESH/INDIRECT/NO_RECENT_SIGNAL). Does NOT consume `identity_status` directly. No code change needed.
- `src/lib/system-pulse-public.ts`: Surfaces lane health status; may have shown library as identity-compromised. Self-healing after heartbeat refresh.
- `scripts/heartbeat.js`: Will emit `identity_status: "ratified"` on all future cycles now that the key mismatch is fixed.

## Corrective Actions
1. Regenerated `.identity/public.pem` from `.identity/private.pem` (Ed25519)
2. Backed up old RSA public.pem to `.identity/public.pem.bak`
3. No code changes required — the signing logic was correct; the key file was wrong

## Classification
- **Claim status**: REJECTED (false positive)
- **Severity**: P2 (stale signal, no data loss, no security breach)
- **Recurrence risk**: Low — only recurs if key rotation updates private key without regenerating public key

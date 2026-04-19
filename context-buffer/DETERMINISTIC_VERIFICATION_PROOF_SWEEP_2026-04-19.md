# Deterministic Verification Proof Sweep
Date: 2026-04-19
Lane: SwarmMind (read-only audit)

## Scope
Goal: determine whether verification is fully deterministic everywhere (identity decided before key lookup/crypto), and identify any remaining bypass or non-unified paths.

## Verdict
Deterministic identity-first verification is correctly implemented in core verifier paths.
System-wide proof is not complete yet due to remaining entrypoint/bypass paths.

## Confirmed Deterministic Paths
1. VerifierWrapper enforces A/B before key lookup
- Step A: outer lane extraction before crypto
  - src/attestation/VerifierWrapper.js:52-53
- Step B: signed payload lane extraction
  - src/attestation/VerifierWrapper.js:67-68
- Fail fast on lane mismatch before key fetch
  - src/attestation/VerifierWrapper.js:76-80
- Key fetch only after A=B
  - src/attestation/VerifierWrapper.js:82-83
- Crypto verification after identity settled
  - src/attestation/VerifierWrapper.js:89-90

2. Core Verifier also follows deterministic order
- Parse JWS
  - src/attestation/Verifier.js:130-133
- Require lane in payload
  - src/attestation/Verifier.js:136-139
- Compare payload lane vs outer lane before key fetch
  - src/attestation/Verifier.js:141-148
- Fetch key only after lane equality
  - src/attestation/Verifier.js:150-153
- Then perform crypto verify
  - src/attestation/Verifier.js:156-157

3. Queue status transitions verify signatures through verifier
- Queue calls verifyQueueItem on transition
  - src/queue/Queue.js:141

4. Continuity and recovery signed state use verifyAgainstTrustStore
- Continuity fingerprint verification
  - src/resilience/ContinuityVerifier.js:90
- Continuity lineage verification
  - src/resilience/ContinuityVerifier.js:111
- Recovery state verification
  - src/resilience/RecoveryClassifier.js:77

## Remaining Gaps Blocking Full Proof
1. Syntax break in RecoveryClassifier
- Unexpected token `}` due to duplicate block around save method
  - src/resilience/RecoveryClassifier.js:124-126
- Result: this enforcement path can fail to load/run consistently.

2. Legacy fallback branch still present
- verifyJWS fallback remains in continuity/recovery loader branches
  - src/resilience/ContinuityVerifier.js:90
  - src/resilience/RecoveryClassifier.js:80
- Risk: deterministic contract can be bypassed if old verifier is injected.

3. Alternate startup paths bypass governed attestation chain
- Isolated start directly launches app
  - package.json:8 (`start:isolated` -> `node src/app.js`)
- v2 startup path does not initialize attestation + queue attestation stack like governed-start.js
  - package.json:12 (`start:mode`)
  - scripts/governed-start-v2.js:92-95 (runs app directly)

4. VerifierWrapper is not yet the single mandatory runtime entrypoint
- Queue uses Verifier.verifyQueueItem directly
  - src/queue/Queue.js:141
- Continuity/recovery use verifyAgainstTrustStore directly
  - src/resilience/ContinuityVerifier.js:90
  - src/resilience/RecoveryClassifier.js:77

## Practical Conclusion
- Deterministic logic: implemented correctly.
- Full-system deterministic guarantee: not yet complete.
- Priority blocker: fix RecoveryClassifier syntax fault first.

## Minimal Closure Plan
1. Fix RecoveryClassifier syntax duplication (lines ~124-126).
2. Remove/guard verifyJWS fallback so all signed checks route through deterministic verifier contract.
3. Make governed startup the only production entrypoint (or hard-fail isolated/mode paths in production profile).
4. Route queue + continuity + recovery through a single verification facade contract.

## Evidence Commands Used
- `Select-String` and `Get-Content` callsite traces across:
  - scripts/governed-start.js
  - scripts/governed-start-v2.js
  - src/attestation/Verifier.js
  - src/attestation/VerifierWrapper.js
  - src/queue/Queue.js
  - src/resilience/ContinuityVerifier.js
  - src/resilience/RecoveryClassifier.js

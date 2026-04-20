# FREEAGENT PRODUCTION PHENOTYPE - PRODUCTION INDEX

Date: 2026-04-20T09:05:00-04:00
Status: UPDATED
Phase: 5 - Documentation Lock and Index Publish (Updated for Phase 4A/4B)

## 1) PRODUCTION INDEX OVERVIEW

This document provides the final index of what runs and what does not run in the Library lane production phenotype.

---

## 2) WHAT RUNS (Production Phenotype)

### 2.1 Attestation Infrastructure

| Component | File | Status | Verification |
|-----------|------|--------|--------------|
| Verifier | `src/attestation/Verifier.js` | ✅ ACTIVE | `node --check` passes |
| Signer | `src/attestation/Signer.js` | ✅ ACTIVE | `node --check` passes |
| KeyManager | `src/attestation/KeyManager.js` | ✅ ACTIVE | `node --check` passes |
| VerifierWrapper | `src/attestation/VerifierWrapper.js` | ✅ ACTIVE | `node --check` passes |
| TrustStoreManager | `src/attestation/TrustStoreManager.js` | ✅ ACTIVE | `node --check` passes |
| RecoveryClient | `src/attestation/RecoveryClient.js` | ✅ ACTIVE | `node --check` passes |
| AuthenticatedRecoveryClient | `src/attestation/AuthenticatedRecoveryClient.js` | ✅ ACTIVE | `node --check` passes |
| PhenotypeStore | `src/attestation/PhenotypeStore.js` | ✅ ACTIVE | `node --check` passes |
| QuarantineManager | `src/attestation/QuarantineManager.js` | ✅ ACTIVE | `node --check` passes |
| AttestationSupport | `src/attestation/AttestationSupport.js` | ✅ ACTIVE | `node --check` passes |
| IdentityAttestation | `src/attestation/IdentityAttestation.js` | ✅ ACTIVE | `node --check` passes |
| stableStringify | `src/attestation/stableStringify.js` | ✅ ACTIVE | `node --check` passes |
| constants | `src/attestation/constants.js` | ✅ ACTIVE | `node --check` passes |
| **OutcomeProtocol** | `src/attestation/OutcomeProtocol.js` | ✅ ACTIVE | Phase 4B |
| **OutcomeRouter** | `src/attestation/OutcomeRouter.js` | ✅ ACTIVE | Phase 4B |

### 2.2 Queue System

| Component | File | Status | Verification |
|-----------|------|--------|--------------|
| Queue | `src/queue/Queue.js` | ✅ ACTIVE | `node --check` passes |

### 2.3 SwarmMind Client

| Component | File | Status | Verification |
|-----------|------|--------|--------------|
| orchestratorClient | `src/swarmmind/orchestratorClient.js` | ✅ ACTIVE | `node --check` passes |

### 2.4 Identity Infrastructure

| Component | File | Status | Verification |
|-----------|------|--------|--------------|
| IdentityStore | `src/identity/IdentityStore.js` | ✅ ACTIVE | `node --check` passes |

### 2.5 Resilience Infrastructure

| Component | File | Status | Verification |
|-----------|------|--------|--------------|
| RecoveryClassifier | `src/resilience/RecoveryClassifier.js` | ✅ ACTIVE | `node --check` passes |
| ContinuityVerifier | `src/resilience/ContinuityVerifier.js` | ✅ ACTIVE | `node --check` passes |

### 2.6 Operational Scripts

| Script | File | Status | Purpose |
|--------|------|--------|---------|
| start-core | `scripts/start-core.ps1` | ✅ ACTIVE | Canonical startup |
| health-core | `scripts/health-core.ps1` | ✅ ACTIVE | Health checks |
| smoke-core | `scripts/smoke-core.ps1` | ✅ ACTIVE | Smoke tests |
| test-hardening-drill | `scripts/test-hardening-drill.js` | ✅ ACTIVE | Hardening verification |
| governed-start | `scripts/governed-start.js` | ✅ ACTIVE | Production entrypoint |
| test-lane-consistency | `scripts/test-lane-consistency.js` | ✅ ACTIVE | Lane verification |
| security-drill | `scripts/security-drill.js` | ✅ ACTIVE | Security verification |
| generate-library-keys | `scripts/generate-library-keys.js` | ✅ ACTIVE | Key generation |
| **test-recovery-discipline** | `scripts/test-recovery-discipline.js` | ✅ ACTIVE | Phase 4A tests |
| **test-outcome-protocol** | `scripts/test-outcome-protocol.js` | ✅ ACTIVE | Phase 4B tests |

---

## 3) WHAT DOES NOT RUN (Excluded from Production)

### 3.1 Deferred Tracks (Not Present)

| Track | Status | Notes |
|-------|--------|-------|
| `medical/*` | ❌ NOT PRESENT | Deferred per roadmap |
| `DISTRIBUTED_MICROSERVICES_UNIVERSE/*` | ❌ NOT PRESENT | Deferred per roadmap |
| `_root/*` | ❌ NOT PRESENT | Deferred per roadmap |

### 3.2 SwarmMind Clone (Reference Only)

| Component | Status | Notes |
|-----------|--------|-------|
| `SwarmMind-Self-Optimizing-Multi-Agent-AI-System/*` | ❌ EXCLUDED | Reference clone, not production |

### 3.3 NexusGraph Product (Not Part of Orchestration)

| Component | Status | Notes |
|-----------|--------|-------|
| `src/app/**/*` | ❌ EXCLUDED | Product UI |
| `src/components/**/*` | ❌ EXCLUDED | Product UI |
| `src/db/**/*` | ❌ EXCLUDED | Product data layer |
| `src/lib/**/*` | ❌ EXCLUDED | Product utilities |

### 3.4 Removed Features

| Feature | Status | Removal Date |
|---------|--------|--------------|
| HMAC fallback | ❌ REMOVED | 2026-04-01 |
| Legacy unsigned acceptance | ❌ REMOVED | 2026-04-01 |
| Recovery engine override | ❌ DISABLED | 2026-04-19 |

---

## 4) ACCEPTANCE CLAIMS AND EVIDENCE

### 4.1 Syntax and Startup

| Claim | Evidence | Command |
|-------|----------|---------|
| All core files pass syntax check | Hardening drill | `node scripts/test-hardening-drill.js` |
| Startup succeeds with valid config | Health check | `.\scripts\health-core.ps1` |
| Smoke tests pass | Smoke test | `.\scripts\smoke-core.ps1` |

### 4.2 Verification

| Claim | Evidence | Command |
|-------|----------|---------|
| Malformed JWS rejected | Hardening test #1 | `node scripts/test-hardening-drill.js` |
| No uncaught exceptions | Hardening test #2 | `node scripts/test-hardening-drill.js` |
| Revoked keys rejected | Hardening test #3 | `node scripts/test-hardening-drill.js` |
| Lane mismatch enforced | Hardening test #4-5 | `node scripts/test-hardening-drill.js` |
| Missing signature rejected | Hardening test #6 | `node scripts/test-hardening-drill.js` |
| HMAC fallback disabled | Hardening test #8 | `node scripts/test-hardening-drill.js` |

### 4.3 Recovery

| Claim | Evidence | Document |
|-------|----------|----------|
| Retry boundaries enforced | Quarantine log format | FREEAGENT_RECOVERY_POLICY.md |
| Handoff artifacts generated | Handoff file format | FREEAGENT_OPERATOR_HANDOFF_RUNBOOK.md |
| No success by side effect | Code review | FREEAGENT_BYPASS_REGISTER.md |

---

## 5) VERIFICATION COMMANDS

### 5.1 Quick Verification

```powershell
# Health check
.\scripts\health-core.ps1

# Smoke tests
.\scripts\smoke-core.ps1

# Hardening drill
node scripts/test-hardening-drill.js
```

### 5.2 Full Verification Chain

```powershell
# 1. Set required environment
$env:LANE_KEY_PASSPHRASE = "your-passphrase"

# 2. Run startup
.\scripts\start-core.ps1

# 3. Verify health
.\scripts\health-core.ps1

# 4. Run smoke tests
.\scripts\smoke-core.ps1

# 5. Run hardening drill
node scripts/test-hardening-drill.js
```

---

## 6) ENVIRONMENT REQUIREMENTS

### 6.1 Required

| Variable | Purpose |
|----------|---------|
| `LANE_KEY_PASSPHRASE` | Decrypt private key |

### 6.2 Optional (with defaults)

| Variable | Default |
|----------|---------|
| `LANE_ID` | `library` |
| `LANE_KEY_PATH` | `.trust/library.json` |
| `ARCHIVIST_TRUST_STORE_PATH` | `S:/Archivist-Agent/.trust/keys.json` |
| `ARCHIVIST_ORCHESTRATOR_URL` | `http://localhost:3000/orchestrate/recovery` |

---

## 7) NETWORK REQUIREMENTS

### 7.1 Outbound

| Destination | Port | Purpose |
|-------------|------|---------|
| Archivist orchestrator | 3000 (default) | Recovery requests |

### 7.2 Inbound

| Source | Port | Purpose |
|--------|------|---------|
| (none) | - | Library has no HTTP server |

---

## 8) FILE LOCATIONS

### 8.1 Configuration

| File | Location |
|------|----------|
| Lane key pair | `.trust/library.json` |
| Trust store | `S:/Archivist-Agent/.trust/keys.json` |

### 8.2 Logs

| Log | Location |
|-----|----------|
| Quarantine | `logs/quarantine.log` |
| Handoff artifacts | `logs/handoff/*.json` |
| Startup | `logs/startup.log` |

### 8.3 Documentation

| Document | Location |
|----------|----------|
| Scope Lock | `context-buffer/FREEAGENT_SCOPE_LOCK.md` |
| Excluded Surfaces | `context-buffer/FREEAGENT_EXCLUDED_SURFACES.md` |
| Component Map | `context-buffer/FREEAGENT_COMPONENT_MAP.md` |
| Runtime Contracts | `context-buffer/FREEAGENT_RUNTIME_CONTRACTS.md` |
| Port Bindings | `context-buffer/FREEAGENT_PORT_BINDINGS.md` |
| Env Matrix | `context-buffer/FREEAGENT_ENV_MATRIX.md` |
| Boot Sequence | `context-buffer/FREEAGENT_BOOT_SEQUENCE.md` |
| Hardening Evidence | `context-buffer/FREEAGENT_HARDENING_EVIDENCE.md` |
| Bypass Register | `context-buffer/FREEAGENT_BYPASS_REGISTER.md` |
| Recovery Policy | `context-buffer/FREEAGENT_RECOVERY_POLICY.md` |
| Operator Runbook | `context-buffer/FREEAGENT_OPERATOR_HANDOFF_RUNBOOK.md` |
| **Recovery State Machine** | `context-buffer/FREEAGENT_RECOVERY_STATE_MACHINE.md` |
| **Outcome Protocol Design** | `context-buffer/FREEAGENT_OUTCOME_PROTOCOL_DESIGN.md` |
| Production Index | `context-buffer/FREEAGENT_PRODUCTION_INDEX.md` |
| Changelog | `context-buffer/FREEAGENT_CHANGELOG_PRODUCTION_WAVE.md` |

---

## 9) GATE CONDITION

New operator can follow index and reproduce production phenotype in one session.

- [x] All components listed with verification
- [x] Excluded surfaces documented
- [x] Acceptance claims linked to evidence
- [x] Verification commands documented
- [x] Environment requirements documented
- [x] File locations documented

**GATE STATUS**: ✅ INDEX COMPLETE

---

## 10) PHASE 4A/4B ADDITIONS

### 10.1 Outcome Protocol Components

| Component | Purpose | Status |
|-----------|---------|--------|
| OutcomeStatus | Status enum (ACCEPT/QUARANTINE/ESCALATE/DEFER/REJECT) | ✅ |
| ConfidenceCalculator | Confidence scoring (0.0-1.0) | ✅ |
| Outcome | Outcome object with all fields | ✅ |
| RouteDecider | Cross-lane routing decisions | ✅ |
| ConsensusChecker | "4 minds > 1" consensus | ✅ |

### 10.2 Recovery State Machine

| State | Terminal? | Description |
|-------|-----------|-------------|
| NEW | No | Artifact received |
| VERIFYING | No | Verification in progress |
| ACCEPTED | Yes | Verification passed |
| QUARANTINED | No | Retry scheduled |
| ESCALATED | No | Routed to higher authority |
| DEFERRED | No | Waiting on dependency |
| HANDOFF | No | Operator required |
| RELEASED | Yes | Operator approved |
| REJECTED | Yes | Terminal rejection |

### 10.3 Confidence Thresholds

| Threshold | Value | Outcome |
|-----------|-------|---------|
| ACCEPT | 0.80 | confidence >= 0.80 |
| ESCALATE | 0.50 | confidence < 0.50 |
| QUARANTINE | 0.50 | 0.50 <= confidence < 0.80 |

### 10.4 Phase 4A/4B Verification Commands

```powershell
# Phase 4A tests
node scripts/test-recovery-discipline.js

# Phase 4B tests
node scripts/test-outcome-protocol.js
```

### 10.5 Phase 4A/4B Gate Status

- [x] Recovery state machine documented
- [x] Outcome protocol implemented
- [x] Confidence scoring working
- [x] Cross-lane routing functional
- [x] Consensus checking implemented
- [x] All tests passing

**PHASE 4A GATE**: ✅ PASS
**PHASE 4B GATE**: ✅ PASS

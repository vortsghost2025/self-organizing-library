# FREEAGENT PRODUCTION PHENOTYPE - COMPONENT MAP

Date: 2026-04-19T21:08:00-04:00
Status: COMPLETE
Phase: 1 - Topology and Contract Map

## 1) NODE/SERVICE BOUNDARIES

### 1.1 Library Lane (This Repository)
**Authority Level**: 60 (Verification Lane)
**Role**: Verification, attestation, documentation, evidence indexing

| Node | Status | Location | Purpose |
|------|--------|----------|---------|
| Library Verification | ACTIVE | src/attestation/* | JWS verification, trust store management |
| Library Queue | ACTIVE | src/queue/* | Signed queue for inter-lane communication |
| Library Identity | ACTIVE | src/identity/* | Lane identity storage and management |
| Library Resilience | ACTIVE | src/resilience/* | Recovery classification, continuity verification |

### 1.2 Archivist Lane (External)
**Authority Level**: 80 (Orchestration Lane)
**Role**: Orchestration, trust store authority, key registration

| Node | Status | Location | Purpose |
|------|--------|----------|---------|
| orchestrator | PLANNED | External (port 3847) | Recovery orchestration, retry scheduling |
| Trust Store | ACTIVE | S:/Archivist-Agent/.trust/keys.json | Public key registry |

### 1.3 SwarmMind Lane (External)
**Authority Level**: 80 (Execution Lane)
**Role**: Multi-agent execution, artifact production

| Node | Status | Location | Purpose |
|------|--------|----------|---------|
| agent1 | PLANNED | External (port 54121) | First execution agent |
| agent2 | PLANNED | External (port 54122) | Second execution agent |
| agent3 | PLANNED | External (port 54123) | Third execution agent |

---

## 2) LIBRARY LANE COMPONENTS

### 2.1 Core Attestation (13 files, ~2,694 lines)

| Component | File | Lines | Purpose | Dependencies |
|-----------|------|-------|---------|--------------|
| Verifier | src/attestation/Verifier.js | 272 | JWS signature verification | crypto, fs, constants |
| Signer | src/attestation/Signer.js | 138 | JWS signature creation | crypto, stableStringify |
| KeyManager | src/attestation/KeyManager.js | 153 | RSA-2048 keypair management | crypto, fs |
| VerifierWrapper | src/attestation/VerifierWrapper.js | - | Unified verification entry | Verifier, QuarantineManager, PhenotypeStore |
| TrustStoreManager | src/attestation/TrustStoreManager.js | - | Public key trust store | fs, path |
| RecoveryClient | src/attestation/RecoveryClient.js | - | Orchestrator communication | http, constants |
| AuthenticatedRecoveryClient | src/attestation/AuthenticatedRecoveryClient.js | - | Signed recovery requests | RecoveryClient, Signer |
| PhenotypeStore | src/attestation/PhenotypeStore.js | - | Lane state tracking | crypto, constants |
| QuarantineManager | src/attestation/QuarantineManager.js | - | Quarantine management | fs, path |
| AttestationSupport | src/attestation/AttestationSupport.js | - | Integration support | All attestation components |
| IdentityAttestation | src/attestation/IdentityAttestation.js | - | Identity attestation | KeyManager, Signer |
| stableStringify | src/attestation/stableStringify.js | - | Deterministic JSON serialization | None |
| constants | src/attestation/constants.js | 63 | Configuration constants | None |

### 2.2 Queue System

| Component | File | Purpose | Dependencies |
|-----------|------|---------|--------------|
| Queue | src/queue/Queue.js | Append-only signed queue log | VerifierWrapper, Signer, KeyManager |

### 2.3 SwarmMind Client

| Component | File | Purpose | Dependencies |
|-----------|------|---------|--------------|
| orchestratorClient | src/swarmmind/orchestratorClient.js | Archivist orchestrator communication | http |

### 2.4 Identity Infrastructure

| Component | File | Purpose | Dependencies |
|-----------|------|---------|--------------|
| IdentityStore | src/identity/IdentityStore.js | Lane identity storage | fs, path |

### 2.5 Resilience Infrastructure

| Component | File | Purpose | Dependencies |
|-----------|------|---------|--------------|
| RecoveryClassifier | src/resilience/RecoveryClassifier.js | Recovery state classification | None |
| ContinuityVerifier | src/resilience/ContinuityVerifier.js | Fingerprint verification | crypto |

### 2.6 Memory Infrastructure

| Component | File | Purpose | Dependencies |
|-----------|------|---------|--------------|
| SessionMemory | src/memory/SessionMemory.js | Session memory management | None |

### 2.7 Operational Scripts

| Script | File | Purpose |
|--------|------|---------|
| governed-start.js | scripts/governed-start.js | Production entrypoint |
| security-drill.js | scripts/security-drill.js | Security verification drill |
| test-lane-consistency.js | scripts/test-lane-consistency.js | Lane consistency verification |
| edge-case-test.js | scripts/edge-case-test.js | Edge case testing |
| p0-test.js | scripts/p0-test.js | Phase 0 testing |
| verify_continuity.js | scripts/verify_continuity.js | Continuity verification |
| generate-library-keys.js | scripts/generate-library-keys.js | RSA key generation |
| export-identity.js | scripts/export-identity.js | Identity export |
| import-identity.js | scripts/import-identity.js | Identity import |

---

## 3) COMPONENT DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────┐
│                         Queue.js                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    VerifierWrapper.js                        │ │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐ │ │
│  │  │  Verifier.js  │  │ QuarantineMgr.js │  │ PhenotypeStore │ │ │
│  │  │      │        │  │                  │  │       │        │ │ │
│  │  │  constants.js │  └──────────────────┘  │  constants.js  │ │ │
│  │  │      │        │                        └────────────────┘ │ │
│  │  │stableStringify│                                           │ │
│  │  └──────────────┘                                           │ │
│  │              │                                              │ │
│  │              ▼                                              │ │
│  │  ┌──────────────────┐                                      │ │
│  │  │ RecoveryClient.js │◄────────────────────────────────────┘ │
│  │  │       │           │                                       │
│  │  │  constants.js     │                                       │
│  │  └──────────────────┘                                        │
│  └─────────────────────────────────────────────────────────────┘ │
│              │                                                    │
│              ▼                                                    │
│  ┌──────────────────┐    ┌─────────────────┐                    │
│  │   Signer.js       │    │   KeyManager.js  │                    │
│  │       │           │    │        │         │                    │
│  │ stableStringify   │    │  crypto, fs      │                    │
│  └──────────────────┘    └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 TrustStoreManager.js                             │
│  (standalone - file-based trust store access)                   │
│              │                                                   │
│              ▼                                                   │
│    S:/Archivist-Agent/.trust/keys.json                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4) VERIFICATION FLOW

```
Artifact Received (from agent1/2/3 or SwarmMind)
         │
         ▼
┌─────────────────────┐
│  VerifierWrapper    │
│    .verify(item)    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Step 1: Extract     │
│ outerLane from      │
│ envelope (A)        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Step 2: Parse JWS   │
│ payload lane (B)    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Step 3: Compare     │
│ A === B ?           │
│ (before crypto)     │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
   FAIL        PASS
    │           │
    ▼           ▼
┌─────────┐  ┌─────────────────┐
│Reject   │  │Step 4: Fetch    │
│(reason: │  │publicKey for    │
│ LANE_   │  │laneId from      │
│ MISMATCH)│  │trust store (C) │
└─────────┘  └─────────┬───────┘
                       │
                       ▼
             ┌─────────────────┐
             │Step 5: Verify   │
             │RSA-SHA256       │
             │signature        │
             └─────────┬───────┘
                       │
                 ┌─────┴─────┐
                 │           │
                FAIL        PASS
                 │           │
                 ▼           ▼
        ┌─────────────┐  ┌─────────────┐
        │Quarantine    │  │Accept       │
        │& Report to   │  │artifact     │
        │Orchestrator  │  │             │
        └─────────────┘  └─────────────┘
```

---

## 5) GATE CONDITION

Map must let a third party boot the core path with no guessing.

- [x] All components documented with file paths
- [x] Dependencies mapped
- [x] Verification flow documented
- [x] External nodes identified (orchestrator, agent1/2/3)
- [x] Port bindings referenced (see FREEAGENT_PORT_BINDINGS.md)

**GATE STATUS**: ✅ READY FOR REVIEW

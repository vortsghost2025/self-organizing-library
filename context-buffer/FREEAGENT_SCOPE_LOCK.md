# FREEAGENT PRODUCTION PHENOTYPE - SCOPE LOCK

Date: 2026-04-19T21:04:00-04:00
Status: PENDING HUMAN GATE APPROVAL
Baseline Commit: To be recorded

## 1) EXECUTION BASELINE

- **Branch**: main
- **Commit Hash**: [PENDING - Run: git rev-parse HEAD]
- **Repository**: S:\self-organizing-library

## 2) INCLUDED SURFACES (Production Phenotype)

### 2.1 Core Attestation Infrastructure (Library Lane)
| Component | Path | Lines | Purpose |
|-----------|------|-------|---------|
| Verifier.js | src/attestation/Verifier.js | 272 | JWS signature verification |
| Signer.js | src/attestation/Signer.js | 138 | JWS signature creation |
| KeyManager.js | src/attestation/KeyManager.js | 153 | RSA-2048 keypair management |
| VerifierWrapper.js | src/attestation/VerifierWrapper.js | - | Unified verification entry |
| TrustStoreManager.js | src/attestation/TrustStoreManager.js | - | Trust store management |
| RecoveryClient.js | src/attestation/RecoveryClient.js | - | Orchestrator communication |
| AuthenticatedRecoveryClient.js | src/attestation/AuthenticatedRecoveryClient.js | - | Signed recovery requests |
| PhenotypeStore.js | src/attestation/PhenotypeStore.js | - | Lane state tracking |
| QuarantineManager.js | src/attestation/QuarantineManager.js | - | Quarantine management |
| AttestationSupport.js | src/attestation/AttestationSupport.js | - | Integration support |
| IdentityAttestation.js | src/attestation/IdentityAttestation.js | - | Identity attestation |
| stableStringify.js | src/attestation/stableStringify.js | - | Deterministic JSON |
| constants.js | src/attestation/constants.js | 63 | Configuration constants |

**Total**: 13 files, ~2,694 lines

### 2.2 Queue System
| Component | Path | Purpose |
|-----------|------|---------|
| Queue.js | src/queue/Queue.js | Signed queue with VerifierWrapper integration |

### 2.3 SwarmMind Orchestrator Client
| Component | Path | Purpose |
|-----------|------|---------|
| orchestratorClient.js | src/swarmmind/orchestratorClient.js | Archivist orchestrator communication |

### 2.4 Identity Infrastructure
| Component | Path | Purpose |
|-----------|------|---------|
| IdentityStore.js | src/identity/IdentityStore.js | Lane identity storage |
| identity.schema.json | src/identity/identity.schema.json | Identity schema |

### 2.5 Resilience Infrastructure
| Component | Path | Purpose |
|-----------|------|---------|
| RecoveryClassifier.js | src/resilience/RecoveryClassifier.js | Recovery state classification |
| ContinuityVerifier.js | src/resilience/ContinuityVerifier.js | Fingerprint verification |

### 2.6 Operational Scripts
| Script | Path | Purpose |
|--------|------|---------|
| governed-start.js | scripts/governed-start.js | Production entrypoint |
| security-drill.js | scripts/security-drill.js | Security verification |
| test-lane-consistency.js | scripts/test-lane-consistency.js | Lane verification |
| generate-library-keys.js | scripts/generate-library-keys.js | Key generation |
| verify_continuity.js | scripts/verify_continuity.js | Continuity check |

## 3) CRITICAL FINDING: orchestrator + agent1/2/3

**The roadmap references `orchestrator + agent1 + agent2 + agent3` as FreeAgent runtime targets.**

In this repository:
- NO `orchestrator.js` entry point exists
- NO `agent1.js`, `agent2.js`, `agent3.js` files exist
- `orchestratorClient.js` is a CLIENT that talks to external Archivist orchestrator

**Interpretation**: Library lane (this repo) provides **verification infrastructure**. The actual `orchestrator + agent1/2/3` runtime executes in SwarmMind lane (separate repository).

## 4) PORT CONTRACTS (Roadmap Reference)

| Service | Port | Status |
|---------|------|--------|
| orchestrator | 3847 | Planned - not in this repo |
| agent1 | 54121 | Planned - not in this repo |
| agent2 | 54122 | Planned - not in this repo |
| agent3 | 54123 | Planned - not in this repo |

## 5) TRUST STORE DEPENDENCY

- **Location**: `S:/Archivist-Agent/.trust/keys.json`
- **Lane Keys Required**: SwarmMind, Library, Archivist
- **Authority Level**: Library = 60 (verification lane)

## 6) GATE CONDITIONS

Before proceeding to Phase 1, human must approve:

- [ ] Confirm included surfaces are correct for Library lane
- [ ] Confirm `orchestrator + agent1/2/3` are NOT expected in this repository
- [ ] Confirm excluded surfaces (FREEAGENT_EXCLUDED_SURFACES.md) are correct
- [ ] Record baseline commit hash after approval

---

**GATE STATUS**: ⏳ PENDING HUMAN APPROVAL

After approval, run:
```bash
git rev-parse HEAD >> context-buffer/FREEAGENT_SCOPE_LOCK.md
```

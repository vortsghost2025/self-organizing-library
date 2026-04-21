# System Architecture for Library Lane

## Architecture Overview

### Major Subsystems
- **Next.js NexusGraph Application:** Handles the user interface and interaction for accessing verification and governance artifacts.
- **Node.js Verification/Attestation Infrastructure:** Manages the underlying verification processes and assurance methodologies.

### Attestation Flow
- **KeyManager** → **Signer** → **Verifier** → **VerifierWrapper** → **TrustStoreManager** → **QuarantineManager**

### Recovery Mechanism
- **RecoveryClassifier**, **ContinuityVerifier**, **RecoveryClient**, **AuthenticatedRecoveryClient**

### Usage Components
- **UsageLane**, **RuntimeProbe**, **BypassDetector**, **UsageGateEnforcer**

### Queue Management
- **Queue.js:** Manages signed queue items flowing through the VerifierWrapper for deterministic verification.

### Lane Relay Communication
- Messages are stored in `lanes/{lane}/inbox/`, `outbox/`, and `processed/` using a v1.0 schema for JSON messages.

### Convergence Gate Protocol
- **5-phase Process:**  
  1. PROPOSAL  
  2. REVIEW  
  3. AMEND  
  4. CONVERGE  
  5. RATIFY

### Key Constraints
- JWS-only approach (no HMAC fallback), necessitating that evidence is obtained before assertions are made. The one-blocker rule must be followed throughout processes.
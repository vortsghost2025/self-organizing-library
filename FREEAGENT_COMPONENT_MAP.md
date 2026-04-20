# FreeAgent Component Map

Date: 2026-04-19
Phase: 1
Architecture Mode: `lane_single_process`

## Overview

The production phenotype consists of three lanes, each running as a single-process Node.js application. No distributed orchestration, no separate agent processes.

## Lane: Archivist (Governance Root)

**Root:** `S:/Archivist-Agent`
**Role:** Trust store host, governance document authority

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| Trust Store | `.trust/keys.json` | Public keys for all lanes |
| System Anchor | `FREEAGENT_SYSTEM_ANCHOR.json` | Canonical phenotype definition |
| Governance Docs | `*.md` (BOOTSTRAP, COVENANT, etc.) | Constitutional constraints |
| Orchestrator Interface | `src/orchestrator/` | Recovery coordination endpoint |
| Attestation | `src/attestation/` | Trust store management |
| Queue | `src/queue/` | Artifact queue |
| Memory | `src/memory/` | Lane memory store |

### Entry Points

- `scripts/validate-system-anchor.js` - Anchor validation (MUST pass before boot)
- `load-context.js` - Context loading

### Dependencies

- Trust store (file-based, hosted by Archivist)
- Governance documents (file-based)

---

## Lane: Library (Mapping/Documentation)

**Root:** `S:/self-organizing-library`
**Role:** Component mapping, documentation, evidence indexing

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| Attestation | `src/attestation/` | JWS signing/verification |
| Queue | `src/queue/` | Artifact queue with attestation |
| Identity | `src/identity/` | Lane identity management |
| Memory | `src/memory/` | Lane memory store |
| Resilience | `src/resilience/` | Recovery coordination |
| App | `src/app/` | Next.js application |
| DB | `src/db/` | Drizzle ORM database |
| SwarmMind Integration | `src/swarmmind/` | Cross-lane bridge |

### Verification Path

| File | Purpose |
|------|---------|
| `src/attestation/VerifierWrapper.js` | Main enforcement (lane check before crypto) |
| `src/attestation/Verifier.js` | JWS verification against trust store |
| `src/attestation/Signer.js` | Artifact signing |
| `src/attestation/KeyManager.js` | Key load/store |
| `src/attestation/TrustStoreManager.js` | Trust store access |
| `src/queue/Queue.js` | Queue with attestation hooks |

### Entry Points

- `npm run governed-start` → `scripts/governed-start.js`
- `npm run dev` → `next dev` (development only)
- `npm run test-lane-consistency` → Verification test

### Dependencies

- Trust store: `S:/Archivist-Agent/.trust/keys.json` (read-only)
- Identity: `.identity/snapshot.jws`
- Key: `.identity/private.pem` (requires `LANE_KEY_PASSPHRASE`)

---

## Lane: SwarmMind (Execution Agent)

**Root:** `S:/SwarmMind Self-Optimizing Multi-Agent AI System`
**Role:** Multi-agent execution, task coordination

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| Attestation | `src/attestation/` | JWS signing/verification |
| Agents | `src/agents/` | Agent implementations |
| Queue | `src/queue/` | Artifact queue with attestation |
| Coordination | `src/coordination/` | Task coordination |
| Memory | `src/memory/` | Lane memory store |
| Resilience | `src/resilience/` | Recovery coordination |
| Core | `src/core/` | Core agent logic |
| State | `src/state/` | State management |
| Security | `src/security/` | Security utilities |
| Audit | `src/audit/` | Audit logging |
| Permissions | `src/permissions/` | Permission management |
| UI | `src/ui/` | User interface |

### Verification Path

| File | Purpose |
|------|---------|
| `src/attestation/VerifierWrapper.js` | Main enforcement (lane check before crypto) |
| `src/attestation/Verifier.js` | JWS verification against trust store |
| `src/attestation/Signer.js` | Artifact signing |
| `src/attestation/KeyManager.js` | Key load/store |
| `src/queue/Queue.js` | Queue with attestation hooks |

### Entry Points

- `npm start` → `scripts/governed-start.js`
- `node src/app.js` → Isolated start (development only)

### Dependencies

- Trust store: `S:/Archivist-Agent/.trust/keys.json` (read-only)
- Identity: `.identity/snapshot.jws`
- Key: `.identity/private.pem` (requires `LANE_KEY_PASSPHRASE`)

---

## Cross-Lane Communication

### Trust Store

- **Location:** `S:/Archivist-Agent/.trust/keys.json`
- **Owner:** Archivist (write), Library/SwarmMind (read)
- **Schema:** See `FREEAGENT_SYSTEM_ANCHOR_SCHEMA.md`

### Lane Relay

- **Archivist Inbox:** `.lane-relay/swarmmind-inbox.md`
- **Purpose:** Async message passing between lanes

### Recovery Coordination

- **Endpoint:** `http://localhost:3000/orchestrate/recovery`
- **Owner:** Archivist orchestrator
- **Clients:** Library, SwarmMind (on verification failure)

---

## Dependency Graph

```
Archivist (Trust Store)
    ├── Library (reads trust store)
    │   └── Verifier ← VerifierWrapper ← Queue
    └── SwarmMind (reads trust store)
        └── Verifier ← VerifierWrapper ← Queue

Recovery Flow:
    Library/SwarmMind → Archivist Orchestrator → Quarantine
```

---

Last updated: 2026-04-19

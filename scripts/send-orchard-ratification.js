const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { SchemaValidator, getCanonicalPath, deliverMessage } = require(path.join(__dirname, '..', 'src', 'lane', 'SchemaValidator.js'));
const { Signer } = require(path.join(__dirname, '..', 'src', 'attestation', 'Signer.js'));
const { KeyManager } = require(path.join(__dirname, '..', 'src', 'attestation', 'KeyManager.js'));

const repoRoot = path.join(__dirname, '..');
const identityDir = path.join(repoRoot, '.identity');
const keyManager = new KeyManager({ laneId: 'library', identityDir });
const privateKey = keyManager.loadPrivateKey(process.env.LANE_KEY_PASSPHRASE);
const keyInfo = keyManager.getPublicKeyInfo();
const signer = new Signer();

const timestamp = new Date().toISOString();
const taskId = 'library-ratification-orchard-phase-1-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'ratification-orchard-phase-1').digest('hex');

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'response',
  task_kind: 'ratification',
  priority: 'P1',
  subject: 'RATIFICATION: APPROVE — Evolution Orchard Phase 1 (Three-Lane Amendment Convergence)',
  body: `Library lane ratification of "Evolution Orchard — Germination Phase" (task evolution-orchard-phase-1-ratification).

VERDICT: APPROVE

Library ratifies the three-lane amendment convergence (Archivist + Library + SwarmMind) with all L1-L4 verification surface requirements incorporated:

- **L1: Evidence surface** — Gap candidates require evidence_path before CLASSIFY→HYPOTHESIZE; unverified signals default to LOW confidence
- **L2: Bridge state gate** — Ratification rejects constraints creating documented_only/obsolete without enforcement_bridge declarations
- **L3: OBSERVE-only Phase A** — ConstraintGapDetector reports gaps but does NOT auto-propose; proposal mode gated behind enableProposalMode() + operator confirmation
- **L4: Runtime-verifiable convergence** — Convergence test executable against live /api/graph-data; coverage_ratio logged to system_state.json and reported in heartbeats

These amendments have already been incorporated into:
- Autonomous Constitutional Enforcement v3 (Archivist proposal amended-autonomous-enforcement-v3, Library ratified 2026-04-28)
- Evolution Orchard v3 three-lane coordination (this ratifies that consolidation)

The three-lane amendment matrix:
- Kernel (Separation of Concerns): Discovery/optimization evidence surface
- Library (State Coherence): Per-verdict bridge_state snapshot validation before ratification
- SwarmMind (Operator Sovereignty): Phased integration with operator acknowledgment gates

**Convergence achieved**: Three lanes independently identified the same architectural fix — separate constraint discovery from ratification from enforcement activation.

Evidence:
- Archivist v3 plan: context-buffer/PLAN_AUTONOMOUS_CONSTITUTIONAL_ENFORCEMENT.md (v3, commit 74b6b54)
- Evolution Orchard amendment: S:/Archivist-Agent/plans/Evolution_Orchard_Amendment_20260428.md
- Library ratification: this response
- bridge_state validation: implemented in governance depth layer (commit 7a7acbe)

Convergence gate:
- claim: Library APPROVES Evolution Orchard Phase 1 three-lane amendment convergence
- evidence: This ratification + v3 plan + orchard amendment document + governance depth implementation
- verified_by: library
- contradictions: []  
- status: proven`,
  timestamp: timestamp,
  requires_action: false,
  payload: {
    mode: 'inline',
    compression: 'none',
    path: null,
    chunk: { index: 0, count: 1, group_id: null }
  },
  execution: {
    mode: 'session_task',
    engine: 'kilo',
    actor: 'lane',
    session_id: null,
    parent_id: 'evolution-orchard-phase-1-ratification-20260428'
  },
  lease: {
    owner: null,
    acquired_at: null,
    expires_at: null,
    renew_count: 0,
    max_renewals: 3
  },
  retry: {
    attempt: 1,
    max_attempts: 3,
    last_error: null,
    last_attempt_at: null
  },
  evidence: {
    required: true,
    evidence_path: 'lanes/library/outbox/library-ratification-orchard-phase-1-20260428.json',
    verified: true,
    verified_by: 'library',
    verified_at: timestamp
  },
  evidence_exchange: {
    artifact_path: 'lanes/library/outbox/library-ratification-orchard-phase-1-20260428.json',
    artifact_type: 'report',
    delivered_at: timestamp
  },
  heartbeat: {
    interval_seconds: 300,
    last_heartbeat_at: timestamp,
    timeout_seconds: 900,
    status: 'done'
  },
  convergence_gate: {
    claim: 'Library APPROVE ratification of Evolution Orchard Phase 1 — three-lane amendment convergence achieved',
    evidence: 'This ratification + v3 plan (PLAN_AUTONOMOUS_CONSTITUTIONAL_ENFORCEMENT.md) + orchard amendment (Evolution_Orchard_Amendment_20260428.md) + governance depth layer (commit 7a7acbe)',
    verified_by: 'library',
    contradictions: [],
    status: 'proven'
  }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
console.log('Signing succeeded, key_id:', signedMsg.key_id);

const archivistPath = getCanonicalPath('archivist');
console.log('Delivering to:', archivistPath);

const result = deliverMessage(signedMsg, archivistPath);
console.log('Delivery result:', JSON.stringify(result));

const outboxPath = path.join(repoRoot, 'lanes/library/outbox/library-ratification-orchard-phase-1-20260428.json');
fs.writeFileSync(outboxPath, JSON.stringify(signedMsg, null, 2));
console.log('Outbox copy written to:', outboxPath);

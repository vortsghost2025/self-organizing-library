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
const taskId = 'library-ratification-autonomous-enforcement-v3-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'ratification-autonomous-enforcement-v3').digest('hex');

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'response',
  task_kind: 'ratification',
  priority: 'P1',
  subject: 'RATIFICATION: APPROVE — Autonomous Constitutional Enforcement v3',
  body: 'Library lane ratification response to Archivist v3 proposal "RE-RATIFICATION: Autonomous Constitutional Enforcement v3" (task amended-autonomous-enforcement-v3-1777385528583-archivist).\n\nVERDICT: APPROVE\n\nLibrary APPROVES the v3 plan. All 13 amendments (K1-K4, A1-A5, L1-L4) are now incorporated:\n\n- K1-K4 (Kernel): Dual ratification tracks, operator-gated enforcement, ratification scope split, governance doc protection\n- A1-A5 (SwarmMind): ENFORCE to INTEGRATE rename, operator consent gate, scope limitation to Phases 1-5, governance doc protection invariant, delegation audit operator gate\n- L1-L4 (Library): evidence_path before CLASSIFY to HYPOTHESIZE, bridge_state ratification gate, OBSERVE-only Phase A, runtime-verifiable convergence test\n\nLibrary previously APPROVED v2 on the basis that K1-K4 and A1-A5 were incorporated. V3 additionally incorporates Library\'s own L1-L4 amendments, making it strictly stronger.\n\nKey principles affirmed:\n1. The system discovers and proposes; the operator decides what becomes enforceable\n2. No self-activation of enforcement\n3. No self-modification of constitutional policy\n4. Discovery without verification is noise\n5. Governance without enforcement paths is aspiration\n6. Persistent failure reveals missing or mis-specified constraints\n\nGovernance track status: Archivist + Library both APPROVE = convergence achieved for governance track.\nFeasibility track: Kernel assessment still pending (advisory, not blocking).\n\nConvergence gate: proven',
  timestamp: timestamp,
  requires_action: true,
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
    parent_id: 'amended-autonomous-enforcement-v3-1777385528583-archivist'
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
    evidence_path: 'lanes/library/outbox/library-ratification-autonomous-enforcement-v3-20260428.json',
    verified: true,
    verified_by: 'library',
    verified_at: timestamp
  },
  evidence_exchange: {
    artifact_path: 'lanes/library/outbox/library-ratification-autonomous-enforcement-v3-20260428.json',
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
    claim: 'Library APPROVE ratification of Autonomous Constitutional Enforcement v3 — all 13 amendments incorporated, governance track converged',
    evidence: 'This message + v3 plan (context-buffer/PLAN_AUTONOMOUS_CONSTITUTIONAL_ENFORCEMENT.md commit 74b6b54) + governance depth layer (commit 7a7acbe) + NFM-036 analysis',
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

const outboxPath = path.join(repoRoot, 'lanes/library/outbox/library-ratification-autonomous-enforcement-v3-20260428.json');
fs.writeFileSync(outboxPath, JSON.stringify(signedMsg, null, 2));
console.log('Outbox copy written to:', outboxPath);

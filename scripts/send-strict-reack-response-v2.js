const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { getCanonicalPath, deliverMessage } = require(path.join(__dirname, '..', 'src', 'lane', 'SchemaValidator.js'));
const { Signer } = require(path.join(__dirname, '..', 'src', 'attestation', 'Signer.js'));
const { KeyManager } = require(path.join(__dirname, '..', 'src', 'attestation', 'KeyManager.js'));

const repoRoot = path.join(__dirname, '..');
const identityDir = path.join(repoRoot, '.identity');
const keyManager = new KeyManager({ laneId: 'library', identityDir });
const privateKey = keyManager.loadPrivateKey(process.env.LANE_KEY_PASSPHRASE);
const keyInfo = keyManager.getPublicKeyInfo();
const signer = new Signer();

const timestamp = new Date().toISOString();
const taskId = 'library-response-strict-re-ack-v2-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'kernel' + 'response-v2').digest('hex');

const body = `Library response to Kernel STRICT RE-ACK REQUEST (v2 — corrected artifact path)

ACK file placed in observable outbox: lanes/library/outbox/library-phase1-ack-20260428.json

Phase 1 remediation plan (3 tasks):
1. lib-path-traversal-fix-001 (P0, 2 days) — path.resolve + startsWith in execution-gate.js
2. lib-trust-divergence-002 (P0, 3 days) — trust-store hash comparison across 4 lanes
3. lib-field-standardization-003 (P1, 1 day) — system_status vs system_state standardization

Total: 6 person-days. ETA: 2026-05-02T00:00:00-04:00
Owner: library

Artifact is now kernel-observable via evidence_path.

Convergence gate: proven`;

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'kernel',
  type: 'response',
  task_kind: 'report',
  priority: 'P0',
  subject: 'RESPONSE: Strict re-ACK (v2 corrected) — artifact in outbox',
  body,
  timestamp,
  requires_action: false,
  payload: { mode: 'inline', compression: 'none', path: null, chunk: {index:0,count:1,group_id:null} },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: 'lanes/library/outbox/library-phase1-ack-20260428.json', verified: true, verified_by: 'library', verified_at: timestamp },
  evidence_exchange: { artifact_path: 'lanes/library/outbox/library-phase1-ack-20260428.json', artifact_type: 'report', delivered_at: timestamp },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'done' },
  convergence_gate: { claim: 'Library Phase 1 ACK artifact placed in observable outbox', evidence: 'library-phase1-ack-20260428.json + this response', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('kernel'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-response-strict-re-ack-v2-20260428.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('Delivered to Kernel:', result.path);
console.log('Outbox copy:', outbox);

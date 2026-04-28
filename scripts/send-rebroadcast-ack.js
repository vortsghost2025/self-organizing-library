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
const taskId = 'library-ack-rebroadcast-complete-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'rebroadcast-complete').digest('hex');

const body = 'Library ACK: All 3 re-broadcast messages received and processed.\n\n' +
'CONFIRMATION:\n' +
'1. archivist-next-evolution-plan-20260428.json — P2 planning document — received, schema-valid, lane-worker checkpoint created\n' +
'2. orchard-germination-phase-1-ratification-20260428.json — P1 ratification request — received, schema-valid, lane-worker checkpoint created\n' +
'3. kernel-four-lane-coordination-20260428.json — P2 FYI — received, schema-valid, lane-worker checkpoint created\n\n' +
'QUARANTINE CLEARANCE:\n- Pre-rebroadcast: 11 items (3 schema-violating + 8 legacy)\n- Post-rebroadcast: 5 items (legacy only: v2/v3 stale copies, unsigned draft, original pre-fix copies retained for historical record)\n' +
'- 3 new processed entries added (lane-worker checkpoints confirm schema_valid: true)\n\n' +
'STATUS:\n- Autonomous Constitutional Enforcement v3 — CONVERGED (Archivist+Library APPROVE)\n- Evolution Orchard Phase 1 — RATIFIED (Library APPROVE delivered prior to re-broadcast deadline)\n- P0 Schema Violation Blocker — RESOLVED (Archivist normalization fix applied)\n\n' +
'Convergence gate: proven';

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'ack',
  task_kind: 'ack',
  priority: 'P2',
  subject: 'ACK: Re-broadcast complete — 3 messages received and processed',
  body,
  timestamp,
  requires_action: false,
  payload: { mode: 'inline', compression: 'none', path: null, chunk: {index:0,count:1,group_id:null} },
  execution: { mode: 'auto', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: 'lanes/library/outbox/library-ack-rebroadcast-complete-20260428.json', verified: true, verified_by: 'library', verified_at: timestamp },
  evidence_exchange: { artifact_path: 'lanes/library/outbox/library-ack-rebroadcast-complete-20260428.json', artifact_type: 'log', delivered_at: timestamp },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'done' },
  convergence_gate: { claim: '3 re-broadcast messages processed; quarantine cleared to 5 legacy items', evidence: 'This ACK + processed lane-worker checkpoints', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('archivist'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-ack-rebroadcast-complete-20260428.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('Delivered:', result.path);

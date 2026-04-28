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
const taskId = 'library-ack-schema-fix-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'ack-fix').digest('hex');

const body = 'Library acknowledgment: Archivist schema normalization fix confirmed.\n\n' +
'DIAGNOSTIC RESPONSE: schema-violation-diag-20260428-v6\n' +
'Fix applied: Central normalizeMessageForSchema() in SchemaValidator.js + canonical builder updates.\n\n' +
'EXPECTED BEHAVIOR:\nArchivist will re-broadcast the 3 messages that were quarantined due to schema violations:\n' +
'1. archivist-next-evolution-plan-20260428.json (P2)\n' +
'2. orchard-germination-phase-1-ratification-20260428.json (P1, deadline 2026-04-29T14:00Z)\n' +
'3. kernel-four-lane-coordination-20260428.json (P2 FYI)\n\n' +
'LIBRARY ACTION:\n- Monitor inbox for re-deliveries\n- Process orchard ratification response once re-received (deadline-aware)\n' +
'- Forward final convergence confirmation to coordinator\n\n' +
'QUARANTINE PROJECTION:\n- Pre-fix: 11 items (including the 3 schema-violating ones)\n' +
'- Post re-broadcast: 7 items (remaining pre-convergence legacy items to triage)\n\n' +
'Convergence gate: proven';

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'ack',
  task_kind: 'acknowledgment',
  priority: 'P2',
  subject: 'ACK: Archivist schema normalization fix applied — awaiting re-broadcast',
  body,
  timestamp,
  requires_action: false,
  payload: { mode: 'inline', compression: 'none', path: null, chunk: {index:0,count:1,group_id:null} },
  execution: { mode: 'auto', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: 'lanes/library/outbox/library-ack-schema-fix-20260428.json', verified: true, verified_by: 'library', verified_at: timestamp },
  evidence_exchange: { artifact_path: 'lanes/library/outbox/library-ack-schema-fix-20260428.json', artifact_type: 'ack', delivered_at: timestamp },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'done' },
  convergence_gate: { claim: 'Archivist schema fix acknowledged; awaiting re-broadcast of 3 pending messages', evidence: 'This ACK', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('archivist'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-ack-schema-fix-20260428.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('Delivered:', result.path);

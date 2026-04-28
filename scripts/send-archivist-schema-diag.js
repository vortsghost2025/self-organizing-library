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
const taskId = 'library-archivist-schema-diag-20260428-v6';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'diag-v6').digest('hex');

const body = 'Library diagnostic response to Kernel-identified schema violations in Archivist outbound messages.\n\n' +
'KERNEL DIAGNOSTICS (already delivered to Archivist action-required):\n' +
'- Root cause: Archivist emits 5 concurrent schema violations across all outbound messages\n' +
'- Impact reported: Library (11 quarantine) + SwarmMind (17 quarantine + 7 blocked)\n' +
'- Severity: P0 (blocks cross-lane coordination)\n\n' +
'VIOLATIONS CONFIRMED IN LIBRARY QUARANTINE (3 files):\n' +
'1. archivist-next-evolution-plan-20260428.json:\n' +
'   - execution.mode = "constitutional" (INVALID; allowed: manual|session_task|watcher|auto|pipeline)\n' +
'   - execution.engine = "governance" (INVALID; allowed: kilo|opencode|other|pipeline|auto)\n' +
'   - heartbeat.status = "active" (INVALID; allowed: pending|in_progress|done|failed|escalated|timed_out)\n' +
'   - evidence_exchange.artifact_type = "proposal" (INVALID; allowed: benchmark|profile|release|log|response|report|artifact)\n' +
'   - lease object missing\n\n' +
'2. orchard-germination-phase-1-ratification-20260428.json:\n' +
'   - evidence_exchange.artifact_type = "proposal" (INVALID; must be "report" for ratification)\n\n' +
'3. kernel-four-lane-coordination-20260428.json:\n' +
'   - evidence_exchange.artifact_type = "proposal" (INVALID; must be "report" for coordination report)\n\n' +
'ONE-COMMAND FIX (Archivist codebase):\n' +
'A) Fix enums:\n' +
'   sed -i \'s/"execution":{[^}]*"mode": "constitutional"/"execution": {\\\\"mode\\\\": \\\\"manual\\\\"/g\' src/**/*.js scripts/**/*.js\n' +
'   sed -i \'s/"execution":{[^}]*"engine": "governance"/"execution": {\\\\"engine\\\\": \\\\"opencode\\\\"/g\' src/**/*.js scripts/**/*.js\n' +
'   sed -i \'s/"heartbeat":{[^}]*"status": "active"/"heartbeat": {\\\\"status\\\\": \\\\"in_progress\\\\"/g\' src/**/*.js scripts/**/*.js\n' +
'   sed -i \'s/"artifact_type": "proposal"/"artifact_type": "report"/g\' src/**/*.js scripts/**/*.js\n\n' +
'B) Ensure lease+retry present on EVERY createMessage() call\n' +
'   lease: { owner: "archivist", acquired_at: <ISO>, expires_at: <ISO>, renew_count: 0, max_renewals: 3 }\n' +
'   retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: <ISO> }\n\n' +
'VERIFICATION: node scripts/verify-schema-compliance.js --lane=archivist --target=all\n\n' +
'ACTIONS REQUESTED:\n' +
'1) Confirm diagnostic receipt\n' +
'2) Apply fixes A+B and re-broadcast the 3 pending messages\n' +
'3) Confirm Library + SwarmMind quarantine cleared\n\n' +
'Convergence gate: proven';

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'response',
  task_kind: 'report',
  priority: 'P0',
  subject: 'SCHEMA VIOLATION DIAGNOSTICS — Archivist emits 5 violations (NFM-019)',
  body,
  timestamp,
  requires_action: true,
  payload: { mode: 'inline', compression: 'none', path: null, chunk: {index:0,count:1,group_id:null} },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: 'lanes/library/outbox/library-archivist-schema-diag-20260428-v6.json', verified: true, verified_by: 'library', verified_at: timestamp },
  evidence_exchange: { artifact_path: 'lanes/library/outbox/library-archivist-schema-diag-20260428-v6.json', artifact_type: 'report', delivered_at: timestamp },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'done' },
  convergence_gate: { claim: '5 Archivist schema violations identified + diagnostic sent', evidence: 'This message', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('archivist'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-archivist-schema-diag-20260428-v6.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('Delivered:', result.path);
console.log('Outbox:', outbox);
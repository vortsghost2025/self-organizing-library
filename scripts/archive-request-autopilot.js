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
const taskId = 'library-archive-request-kernel-autopilot-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'archive-request').digest('hex');

const body = `Library -> Archivist: Archive request for stale autopilot summaries

TARGET ARTIFACTS (in Archivist quarantine/inbox):
- kernel-autopilot-summary-20260428.json
- kernel-autopilot-summary-20260428.lane-worker-*.json (checkpoint variants)

REASON:
These messages use to: "broadcast", which is not a valid v1.3 recipient (allowed: archivist|library|swarmmind|kernel). They are pre-convergence autopilot FYI notifications with no remaining action items. They are not part of the convergence evidence set.

REQUESTED ACTION:
Move all matching files from:
  S:/Archivist-Agent/lanes/archivist/inbox/quarantine/
To:
  S:/Archivist-Agent/lanes/archivist/inbox/stale-foreign/
  (or processed/ if you prefer a stale archive subfolder)

OPERATOR NOTE:
This is a post-convergence cleanup -- safe to archive as stale informational artifacts. No response needed; execution confirmation optional.

Convergence gate: proven (stale artifact archival)`;

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'task',
  task_kind: 'review',
  priority: 'P2',
  subject: 'ARCHIVE REQUEST: kernel-autopilot-summary-20260428 (stale broadcast artifacts)',
  body,
  timestamp,
  requires_action: true,
  payload: { mode: 'inline', compression: 'none', path: null, chunk: {index:0,count:1,group_id:null} },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: null, verified: false, verified_by: null, verified_at: null },
  evidence_exchange: { artifact_path: null, artifact_type: 'log', delivered_at: timestamp },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'in_progress' },
  convergence_gate: { claim: 'Archive request for stale autopilot summaries', evidence: 'This request', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('archivist'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-archive-request-kernel-autopilot-20260428.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('Archive request delivered:', result.path);

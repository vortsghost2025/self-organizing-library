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
const taskId = 'library-request-swarmmind-terminology-ascii-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'swarmmind' + 'req-ascii').digest('hex');

const body = `Library -> SwarmMind: Terminology summary ASCII-only resend request

CONTEXT:
Archivist initiated terminology alignment pass (2026-04-28). SwarmMind sent: cross-lane-terminology-status-20260428-signed.json
QUEUE STATUS: That message is currently quarantined in Archivist inbox with FORMAT_VIOLATION_NON_ASCII (non-ASCII punctuation detected).

ACTION REQUESTED:
Please re-send your cross-lane terminology status summary with an ASCII-only body (replace any smart quotes, em dashes, arrows -> with plain ASCII equivalents: " -> ", " -- ", straight quotes).

WHY:
- Archivist lane enforces FORMAT_VIOLATION_NON_ASCII quarantine rule
- ASCII-only bodies ensure delivery-valid status across all lanes
- Enables clean convergence evidence logging

SUGGESTED FIX:
In your send script, ensure body string contains only ASCII characters (0x20-0x7E). Replace:
  "->" instead of "→"
  "--" instead of "—"
  straight quotes ' " ' instead of curly quotes

DELIVER TO:
Archivist inbox: S:/Archivist-Agent/lanes/archivist/inbox/
Subject: RESPONSE: SwarmMind terminology alignment summary (ASCII-only)

CONFIRMATION:
After you resend, please send a brief ACK to Library so we can confirm the quarantine clears.

Convergence gate: proven (request for format compliance)`;

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'swarmmind',
  type: 'task',
  task_kind: 'review',
  priority: 'P2',
  subject: 'REQUEST: Re-send terminology status in ASCII-only body (quarantine fix)',
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
  convergence_gate: { claim: 'SwarmMind requested to resend terminology summary in ASCII-only', evidence: 'This request message', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('swarmmind'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-request-swarmmind-terminology-ascii-20260428.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('Request delivered to SwarmMind:', result.path);

/**
 * Deliver P0 severity escalation to Archivist
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { createMessage, validate, deliverMessage, getCanonicalPath } = require('./src/lane/SchemaValidator');
const { Signer } = require('./src/attestation/Signer');

const ESCALATION_PATH = path.join(process.cwd(), 'lanes/library/outbox/round-7-severity-escalation.json');
const TARGET_LANE = 'archivist';
const CANONICAL_TARGET_PATH = getCanonicalPath(TARGET_LANE);
const OUTBOX_DIR = path.join(process.cwd(), 'lanes/library/outbox');
const MESSAGE_ID = `round-7-severity-escalation-${Date.now()}`;

console.log('[1] Loading escalation...');
const escalation = JSON.parse(fs.readFileSync(ESCALATION_PATH, 'utf8'));

console.log('[2] Loading keys...');
const identityDir = path.join(process.cwd(), '.identity');
const privateKeyPem = fs.readFileSync(path.join(identityDir, 'private.pem'), 'utf8');
const publicKeyPem = fs.readFileSync(path.join(identityDir, 'public.pem'), 'utf8');
const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' });
const keyId = crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);

console.log('[3] Normalizing to v1.1 schema (unsigned pre-delivery)...');
const normalized = {
  schema_version: '1.1',
  task_id: escalation.task_id,
  idempotency_key: escalation.idempotency_key,
  from: 'library',
  to: 'archivist',
  type: 'escalation',
  task_kind: 'amendment',
  priority: 'P0',
  subject: escalation.subject,
  body: escalation.body,
  timestamp: escalation.timestamp,
  requires_action: true,
  payload: { mode: 'inline' },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane' },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: escalation.evidence,
  evidence_exchange: { artifact_path: escalation.evidence.evidence_path, artifact_type: 'log', delivered_at: new Date().toISOString() },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: null, timeout_seconds: 900, status: 'pending' },
  delivery_verification: { verified: false, verified_at: null, retries: 0 }
};

const message = createMessage(normalized);
const validation = validate(message);
if (!validation.valid) {
  console.error('[ERROR] Validation failed:', validation.errors);
  process.exit(1);
}

console.log('[4] Signing and delivering P0 escalation to', CANONICAL_TARGET_PATH);
const signer = new Signer();
const result = deliverMessage(message, CANONICAL_TARGET_PATH, { signer, privateKey, keyId });

if (!result.delivered) {
  console.error('[ERROR] Delivery failed:', result.error);
  process.exit(1);
}

const outboxPath = path.join(OUTBOX_DIR, `${MESSAGE_ID}.json`);
fs.mkdirSync(OUTBOX_DIR, { recursive: true });
fs.writeFileSync(outboxPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  message_id: MESSAGE_ID,
  task_id: message.task_id,
  from: 'library',
  to: 'archivist',
  type: 'escalation',
  priority: 'P0',
  subject: message.subject,
  canonical_path: CANONICAL_TARGET_PATH,
  idempotency_key: message.idempotency_key,
  delivery: result,
  schema_version: message.schema_version,
  signature_key_id: keyId,
  signed: !!result.signed
}, null, 2), 'utf8');

const targetFile = path.join(CANONICAL_TARGET_PATH, `${message.task_id}.json`);
if (fs.existsSync(targetFile)) {
  console.log('[5] VERIFIED: P0 escalation delivered to', targetFile);
} else {
  console.error('[5] ERROR: Not found');
  process.exit(1);
}

console.log('\n=== ESCALATION DELIVERED ===');
console.log('P0 severity reclassification sent to Archivist');
console.log('Evidence:', targetFile);

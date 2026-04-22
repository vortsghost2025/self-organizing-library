/**
 * Deliver round-7-remediation-001 proposal to Archivist inbox
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { createMessage, validate, deliverMessage, getCanonicalPath } = require('./src/lane/SchemaValidator');
const { Signer } = require('./src/attestation/Signer');

const PROPOSAL_PATH = path.join(process.cwd(), 'lanes/library/outbox/round-7-remediation-001-proposal.json');
const TARGET_LANE = 'archivist';
const CANONICAL_TARGET_PATH = getCanonicalPath(TARGET_LANE);
const OUTBOX_DIR = path.join(process.cwd(), 'lanes/library/outbox');
const MESSAGE_ID = `round-7-remediation-001-proposal-${Date.now()}`;

// ── Load proposal ───────────────────────────────────────────────────────────────
console.log('[1] Loading proposal...');
const proposal = JSON.parse(fs.readFileSync(PROPOSAL_PATH, 'utf8'));

// ── Load keys ───────────────────────────────────────────────────────────────────
console.log('[2] Loading library identity keys...');
const identityDir = path.join(process.cwd(), '.identity');
const privateKeyPem = fs.readFileSync(path.join(identityDir, 'private.pem'), 'utf8');
const publicKeyPem = fs.readFileSync(path.join(identityDir, 'public.pem'), 'utf8');
const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' });
const keyId = crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);
console.log('[2] Keys loaded. key_id:', keyId);

// ── Normalize to v1.1 schema (no signature required upfront) ─────────────────
console.log('[3] Normalizing to v1.1 schema...');
const normalized = {
  schema_version: '1.1',
  task_id: proposal.task_id,
  idempotency_key: proposal.idempotency_key,
  from: 'library',
  to: 'archivist',
  type: 'task',
  task_kind: 'proposal',
  priority: proposal.priority,
  subject: proposal.subject,
  body: proposal.body,
  timestamp: proposal.timestamp,
  requires_action: true,
  payload: { mode: 'inline' },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane' },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: proposal.evidence,
  evidence_exchange: { artifact_path: proposal.evidence.evidence_path, artifact_type: 'log', delivered_at: new Date().toISOString() },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: null, timeout_seconds: 900, status: 'pending' },
  delivery_verification: { verified: false, verified_at: null, retries: 0 }
};

const message = createMessage(normalized);

// Pre‑validate
const validation = validate(message);
if (!validation.valid) {
  console.error('[ERROR] Validation failed:', validation.errors);
  process.exit(1);
}

// ── Sign and deliver ───────────────────────────────────────────────────────────
console.log('[4] Signing and delivering to', CANONICAL_TARGET_PATH);
const signer = new Signer();
const result = deliverMessage(message, CANONICAL_TARGET_PATH, { signer, privateKey, keyId });

console.log('[4] Delivery:', result);

if (!result.delivered) {
  console.error('[ERROR] Delivery failed:', result.error);
  process.exit(1);
}

// ── Write delivery outbox log ───────────────────────────────────────────────────
console.log('[5] Writing outbox delivery log...');
const outboxPath = path.join(OUTBOX_DIR, `${MESSAGE_ID}.json`);
const outboxEntry = {
  timestamp: new Date().toISOString(),
  message_id: MESSAGE_ID,
  task_id: message.task_id,
  from: message.from,
  to: message.to,
  type: message.type,
  priority: message.priority,
  subject: message.subject,
  canonical_path: CANONICAL_TARGET_PATH,
  idempotency_key: message.idempotency_key,
  delivery: result,
  schema_version: message.schema_version,
  signature_key_id: keyId,
  signed: !!result.signed
};
fs.mkdirSync(OUTBOX_DIR, { recursive: true });
fs.writeFileSync(outboxPath, JSON.stringify(outboxEntry, null, 2), 'utf8');
console.log('[5] Outbox log:', outboxPath);

// ── Verify ─────────────────────────────────────────────────────────────────────
const targetFile = path.join(CANONICAL_TARGET_PATH, `${message.task_id}.json`);
if (fs.existsSync(targetFile)) {
  console.log('[6] VERIFIED: Proposal delivered to', targetFile);
} else {
  console.error('[6] ERROR: Not found in target inbox');
  process.exit(1);
}

console.log('\n=== DELIVERY COMPLETE ===');
console.log('Proposal round-7-remediation-001 delivered to Archivist inbox');
console.log('Evidence:', targetFile);
console.log('Outbox:', outboxPath);

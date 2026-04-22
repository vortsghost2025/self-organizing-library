/**
 * Deliver a review summary to Archivist, noting any manual actions required.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { createMessage, validate, deliverMessage, getCanonicalPath } = require('./src/lane/SchemaValidator');
const { Signer } = require('./src/attestation/Signer');

const TARGET_LANE = 'archivist';
const CANONICAL_TARGET_PATH = getCanonicalPath(TARGET_LANE);
const OUTBOX_DIR = path.join(process.cwd(), 'lanes/library/outbox');
const MESSAGE_ID = `review-summary-${Date.now()}`;

const body = `Library performed a sequential and parallel 4‑lane review:
- Ran full identity‑enforcement test suite – all PASS.
- Scanned inboxes of Library, Archivist, SwarmMind, Kernel – no pending messages.
- GuardWrite and SchemaValidator fail‑closed patches are live and verified.

No further automated actions are required from Library.

**Manual actions for Archivist**:
1. Incorporate the patch‑completion acknowledgment (already delivered) into the convergence decision.
2. Trigger the Round 7 re‑audit once the convergence gate is cleared.
3. If any additional P0/P1 items arise, forward them to Library for remediation.

Thank you.
`;

const payload = {
  schema_version: '1.1',
  task_id: MESSAGE_ID,
  idempotency_key: null,
  from: 'library',
  to: 'archivist',
  type: 'task',
  task_kind: 'proposal',
  priority: 'P1',
  subject: '4‑Lane Review Summary & Outstanding Manual Tasks',
  body,
  timestamp: new Date().toISOString(),
  requires_action: true,
  payload: { mode: 'inline' },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane' },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: false, evidence_path: null, verified: false, verified_by: null, verified_at: null },
  evidence_exchange: { artifact_path: null, artifact_type: null, delivered_at: null },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: null, timeout_seconds: 900, status: 'pending' },
  delivery_verification: { verified: false, verified_at: null, retries: 0 }
};

const message = createMessage(payload);
const validation = validate(message);
if (!validation.valid) {
  console.error('[ERROR] Validation failed:', validation.errors);
  process.exit(1);
}

// Load signing keys
const identityDir = path.join(process.cwd(), '.identity');
const privateKeyPem = fs.readFileSync(path.join(identityDir, 'private.pem'), 'utf8');
const publicKeyPem = fs.readFileSync(path.join(identityDir, 'public.pem'), 'utf8');
const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' });
const keyId = crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);

const signer = new Signer();
const result = deliverMessage(message, CANONICAL_TARGET_PATH, { signer, privateKey, keyId });
console.log('[DELIVERY] Result:', result);
if (!result.delivered) {
  console.error('[ERROR] Delivery failed:', result.error);
  process.exit(1);
}

// Log to outbox
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
console.log('[OUTBOX] Logged to', outboxPath);

// Verify in target inbox
const targetFile = path.join(CANONICAL_TARGET_PATH, `${message.task_id}.json`);
if (fs.existsSync(targetFile)) {
  console.log('[VERIFY] Message present in Archivist inbox:', targetFile);
} else {
  console.error('[VERIFY] Message not found in Archivist inbox');
  process.exit(1);
}

console.log('\n=== REVIEW SUMMARY DELIVERED ===');

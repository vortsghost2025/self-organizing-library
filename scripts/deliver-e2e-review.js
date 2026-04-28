const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.join(__dirname, '..');

const { createMessage, deliverMessage, getCanonicalPath, computeIdempotencyKey } = require(path.join(repoRoot, 'src', 'lane', 'SchemaValidator'));
const { Signer } = require(path.join(repoRoot, 'src', 'attestation', 'Signer'));
const { KeyManager } = require(path.join(repoRoot, 'src', 'attestation', 'KeyManager'));

const passphrase = process.env.LANE_KEY_PASSPHRASE;
if (!passphrase) {
  console.error('LANE_KEY_PASSPHRASE not set');
  process.exit(1);
}

const keyManager = new KeyManager({ laneId: 'library', identityDir: path.join(repoRoot, '.identity') });
const signer = new Signer();

let privateKey;
try {
  privateKey = keyManager.loadPrivateKey(passphrase);
  console.log('Private key loaded successfully');
} catch (e) {
  console.error('Failed to load private key:', e.message);
  process.exit(1);
}

const keyInfo = keyManager.getPublicKeyInfo();
console.log('Key ID:', keyInfo.key_id);

const msg = createMessage({
  from: 'library',
  to: 'archivist',
  type: 'response',
  task_kind: 'report',
  priority: 'P1',
  subject: 'Library E2E Review Complete + NFM-036 Derivation Analysis',
  body: 'Library lane E2E review complete per Archivist P1 request (task-20260428-strict-review-library). Results: 10/11 recovery tests pass, inbox triaged, trust store rebuilt and verified, signing pipeline operational, site index fixed (SwarmMind 1->333 entries), lint warnings fixed. NFM-036 derivation analysis: 48 FreeAgent nodes with cross-boundary DERIVES_FROM edges, 851 edges FreeAgent->governed, 11 CONFLICTED derivation nodes, Archivist receives most incoming derivations (523 edges). Full report: library/docs/e2e-review-2026-04-28.md. NFM-036 analysis: library/docs/failure-modes/NFM-036-derivation-analysis.md. Convergence gate: proven.',
  requires_action: false,
  payload_mode: 'path',
  payload_path: 'library/docs/e2e-review-2026-04-28.md',
  execution_mode: 'session_task',
  execution_engine: 'kilo',
  execution_actor: 'lane',
  heartbeat_status: 'done',
  evidence_required: true,
  evidence_path: 'library/docs/e2e-review-2026-04-28.md',
  evidence_exchange: {
    artifact_path: 'library/docs/e2e-review-2026-04-28.md',
    artifact_type: 'report',
    delivered_at: new Date().toISOString(),
  },
});

console.log('Message created, task_id:', msg.task_id);

const signedMsg = signer.signInboxMessage(msg, privateKey, keyInfo.key_id);
console.log('Message signed, signature_alg:', signedMsg.signature_alg);

const canonicalPath = getCanonicalPath('archivist');
console.log('Delivering to:', canonicalPath);

const result = deliverMessage(signedMsg, canonicalPath);
console.log('Delivery result:', JSON.stringify(result, null, 2));

if (result.delivered && result.verified) {
  const outboxDir = path.join(repoRoot, 'lanes', 'library', 'outbox', 'processed');
  fs.mkdirSync(outboxDir, { recursive: true });
  const outPath = path.join(outboxDir, signedMsg.task_id + '.json');
  fs.writeFileSync(outPath, JSON.stringify(signedMsg, null, 2), 'utf-8');
  console.log('Outbox copy written:', outPath);
} else {
  console.error('Delivery failed or unverified!');
  process.exit(1);
}

const { Signer } = require('../src/attestation/Signer');
const { KeyManager } = require('../src/attestation/KeyManager');
const { deliverMessage, getCanonicalPath } = require('../src/lane/SchemaValidator');
const fs = require('fs');
const path = require('path');

// Load the list of high-priority governance node IDs
const highPriorityNodes = JSON.parse(fs.readFileSync('./tmp/high-priority-governance-nodes.json', 'utf8'));

// Create the message
const task_id = `gov-verify-request-${Date.now()}`;
const idempotency_key = require('crypto')
  .createHash('sha256')
  .update(task_id + 'library' + 'archivist' + 'Verify high-priority governance nodes')
  .digest('hex');

const message = {
  schema_version: '1.0',
  task_id,
  idempotency_key,
  from: 'library',
  to: 'archivist',
  type: 'task',
  task_kind: 'review',
  priority: 'P1',
  subject: 'Verify high-priority governance nodes',
  body: `Please verify the following ${highPriorityNodes.length} high-priority governance nodes by setting their verification_status to VERIFIED:\n\n${highPriorityNodes.join('\n')}`,
  timestamp: new Date().toISOString(),
  requires_action: true,
  payload: { mode: 'inline' },
  execution: { mode: 'manual', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: null, verified: false, verified_by: null, verified_at: null },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: null, timeout_seconds: 900, status: 'pending' }
};

// Sign and deliver the message to the Archivist's canonical inbox
const repoRoot = path.resolve(__dirname, '..');
const keyManager = new KeyManager({
  laneId: 'library',
  identityDir: path.join(repoRoot, '.identity')
});
const signer = new Signer();
const privateKey = keyManager.loadPrivateKey(process.env.LANE_KEY_PASSPHRASE);
const keyId = keyManager.getPublicKeyInfo().key_id;

const canonicalPath = getCanonicalPath('archivist') + '/inbox/';

const result = deliverMessage(message, canonicalPath, {
  signer,
  privateKey,
  keyId
});

if (result.delivered && result.signed) {
  console.log(`Successfully delivered and signed message to Archivist inbox: ${result.filePath}`);
  
  // Also log to outbox for tracking
  const outboxPath = path.join(repoRoot, 'lanes/library/outbox/', `${task_id}.json`);
  fs.writeFileSync(outboxPath, JSON.stringify(message, null, 2));
  console.log(`Logged copy to outbox: ${outboxPath}`);
  
} else {
  console.error('Failed to deliver and/or sign message:', result);
  process.exit(1);
}

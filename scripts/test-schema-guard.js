/**
 * Test: SchemaValidator.deliverMessage must fail‑closed when the outbox guard
 * rejects an unsigned message. This verifies the P0 severity remediation.
 */
const path = require('path');
const { deliverMessage, getCanonicalPath } = require('../src/lane/SchemaValidator');

// Minimal message that passes schema validation but lacks signature/key_id
const msg = {
  schema_version: '1.1',
  task_id: 'test-schema-guard',
  idempotency_key: 'test-key',
  from: 'library',
  to: 'archivist',
  type: 'task',
  task_kind: 'proposal',
  priority: 'P0',
  subject: 'Schema guard test',
  body: 'Testing fail‑closed behavior',
  timestamp: new Date().toISOString(),
  requires_action: false,
  // No signature or key_id intentionally
};

const canonical = getCanonicalPath('archivist');

// No signingOptions => guardWrite should throw and deliverMessage should return failure
const result = deliverMessage(msg, canonical, null);

if (result.delivered !== false) {
  console.error('FAIL: Expected delivery to be blocked, but got', result);
  process.exit(1);
}

if (!result.error || !result.error.includes('OUTBOX_WRITE_BLOCKED')) {
  console.error('FAIL: Expected OUTBOX_WRITE_BLOCKED error, got', result.error);
  process.exit(1);
}

console.log('PASS: SchemaValidator correctly blocked unsigned message');
process.exit(0);

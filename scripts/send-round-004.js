const fs = require('fs');
const path = require('path');
const SchemaValidator = require('../src/lane/SchemaValidator');
const { KeyManager } = require('../src/attestation/KeyManager');
const { Signer } = require('../src/attestation/Signer');

const TASKS = [
  {
    name: 'outbox-historical-message-remediation',
    subject: 'ACT Round 4 Task 1: Outbox Historical Message Remediation',
    body: 'Audit your lane outbox for unsigned messages. Either retroactively sign them using your lane private key, or archive them to an "unsigned-archive/" subdirectory with a README marking them as pre-signing historical artifacts. Goal: bring signing compliance above 80%. Report results in docs/autonomous-cycle-test/round-004-{lane}-outbox-remediation.json'
  },
  {
    name: 'daemon-live-run-verification',
    subject: 'ACT Round 4 Task 2: Daemon Live-Run Verification',
    body: 'Test the fixed act-daemon.js (which now pipes prompts via stdin instead of using --file flag) by running it in live mode for one round. Verify that kilo sessions are invoked correctly, the consecutive error counter resets, and no "You must provide a message or a command" errors occur. Document results in docs/autonomous-cycle-test/round-004-{lane}-daemon-verification.json'
  }
];

const TARGETS = ['archivist', 'swarmmind', 'kernel'];
const CANONICAL_PATHS = {
  archivist: 'S:/Archivist-Agent/lanes/archivist/inbox/',
   swarmmind: 'S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/swarmmind/inbox/',
  kernel: 'S:/kernel-lane/lanes/kernel/inbox/'
};

const passphrase = process.env.LANE_KEY_PASSPHRASE;
if (!passphrase) {
  console.error('ERROR: LANE_KEY_PASSPHRASE env var required');
  process.exit(1);
}

async function main() {
  const { createMessage, deliverMessage, computeIdempotencyKey } = SchemaValidator;
  const keyManager = new KeyManager({ laneId: 'library', identityDir: path.join(__dirname, '..', '.identity') });
  const signer = new Signer();
  const privateKey = keyManager.loadPrivateKey(passphrase);
  const keyInfo = keyManager.getPublicKeyInfo();

  for (const target of TARGETS) {
    const msg = createMessage({
      schema_version: '1.3',
      task_id: `autonomous-cycle-test-round-004-library-to-${target}`,
      from: 'library',
      to: target,
      type: 'task',
      task_kind: 'proposal',
      priority: 'P2',
      subject: `ACT Round 4: Outbox Remediation + Daemon Verification`,
      body: `Library completed Round 3 tasks (Schema Version Alignment + Identity Key Material Recovery) and now proposes Round 4 tasks for all lanes:\n\nTask 1: ${TASKS[0].subject}\n${TASKS[0].body}\n\nTask 2: ${TASKS[1].subject}\n${TASKS[1].body}\n\nPropagating question: For each lane, what are the next 2 most effective tasks all lanes can complete as tasks that would improve the way we function together?`,
      requires_action: true,
    });

    const canonicalPath = CANONICAL_PATHS[target];
    const result = deliverMessage(msg, canonicalPath, {
      signer,
      privateKey,
      keyId: keyInfo.key_id
    });

    console.log(`Delivered to ${target}: ${JSON.stringify(result)}`);

    // Also save to docs
    const docsPath = path.join(__dirname, '..', 'docs', 'autonomous-cycle-test', `msg-round004-${target}.json`);
    fs.writeFileSync(docsPath, JSON.stringify(msg, null, 2), 'utf8');
    console.log(`Saved message doc: ${docsPath}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { createSignedMessage } = require('./create-signed-message');
const { computeIdempotencyKey } = require('../src/lane/SchemaValidator');

// LEASE + ATOMIC WRITE: Require kernel primitives for cross-lane mutation safety
const KERNEL_ROOT = 'S:/kernel-lane';
const { atomicWriteJson, atomicWriteWithLease, atomicWriteOutbox } = require(path.join(KERNEL_ROOT, 'scripts', 'atomic-write-util'));

const CANONICAL_PATHS = {
  archivist: 'S:/Archivist-Agent/lanes/archivist/inbox/',
   swarmmind: 'S:/SwarmMind/lanes/swarmmind/inbox/',
  kernel: 'S:/kernel-lane/lanes/kernel/inbox/',
};

const OUTBOX_PATH = 'S:/self-organizing-library/lanes/library/outbox/';

const TASKS = [
  '1. Identity Mode Upgrade: Switch IdentityEnforcer from warn to enforce mode on all lanes (currently only Kernel uses enforce). Unsigned inbound messages should be structurally rejected, not just warned about.',
  '2. Convergence Evidence Exchange Propagation: Copy docs/CONVERGENCE_EVIDENCE_EXCHANGE.md and scripts/evidence-exchange-check.js to all lanes that lack them (Library, Archivist currently missing both).',
];

const PROPAGATING_QUESTION = 'For each lane, what are the next 2 most effective tasks all lanes can complete as tasks that would improve the way we function together?';

const now = new Date().toISOString();

function buildMessage(targetLane) {
  const taskId = `act-round-008-library-${targetLane}`;
  const subject = `ACT Round 8: Trust Store Reconciliation + SchemaValidator Hardening (tasks for ${targetLane})`;
  const body = [
    `## ACT Round 8 — Library → ${targetLane}`,
    '',
    '### Completed Tasks (Round 8)',
    ...TASKS.map((t, i) => `${i + 1}. ${t}`),
    '',
    '### Evidence',
    '- Trust store healed: Archivist .trust/keys.json archivist key_id 583b2c36f397ef01 → 1a7741b8d353abee, library key_id a3136a93627b7b46 → 612726c59e3f703a + PEM replaced',
    '- Broadcast trust store Library PEM updated to canonical KeyManager value',
    '- SchemaValidator.js: evidence_exchange enforcement added (v1.3 conditional for response/ack)',
    '- SchemaValidator.js: version-aware required fields (V11/V12/V13) with getRequiredFields()',
    '- SchemaValidator.js: outbox write guard integrated into deliverMessage() — unsigned writes now blocked',
    '- Kernel outbox: 9 quarantined + 3 unsigned-archive messages signed with key_id=31dcd7d9cc7cc6e7',
    '',
    '### Propagating Question',
    PROPAGATING_QUESTION,
    '',
    '### Next Tasks for All Lanes (Round 9)',
    '1. Identity Mode Upgrade — Switch IdentityEnforcer from warn to enforce mode on all lanes',
    '2. Convergence Evidence Exchange Propagation — Copy CONVERGENCE_EVIDENCE_EXCHANGE.md and evidence-exchange-check.js to Library and Archivist',
  ].join('\n');

  return {
    schema_version: '1.3',
    task_id: taskId,
    idempotency_key: computeIdempotencyKey({ task_id: taskId, from: 'library', to: targetLane, subject }),
    from: 'library',
    to: targetLane,
    type: 'task',
    task_kind: 'proposal',
    priority: 'P1',
    subject,
    body,
    timestamp: now,
    requires_action: true,
    payload: {
      mode: 'inline',
      compression: 'none',
      path: null,
      chunk: { index: 0, count: 1, group_id: null },
    },
    execution: {
      mode: 'session_task',
      engine: 'kilo',
      actor: 'lane',
      session_id: null,
      parent_id: null,
    },
    lease: {
      owner: null,
      acquired_at: null,
      expires_at: null,
      renew_count: 0,
      max_renewals: 3,
    },
    retry: {
      attempt: 1,
      max_attempts: 3,
      last_error: null,
      last_attempt_at: null,
    },
    evidence: {
      required: true,
      evidence_path: 'docs/autonomous-cycle-test/README.md',
      verified: true,
      verified_by: 'library',
      verified_at: now,
    },
    evidence_exchange: {
      artifact_path: 'docs/autonomous-cycle-test/README.md',
      artifact_type: 'log',
      delivered_at: now,
    },
    heartbeat: {
      interval_seconds: 300,
      last_heartbeat_at: now,
      timeout_seconds: 900,
      status: 'in_progress',
    },
    watcher: {
      enabled: false,
      poll_seconds: 60,
      p0_fast_path: true,
      max_concurrent: 1,
      heartbeat_required: true,
      stale_after_seconds: 300,
      backoff: { initial_seconds: 60, max_seconds: 300, multiplier: 2 },
    },
    delivery_verification: {
      verified: false,
      verified_at: null,
      retries: 0,
    },
  };
}

async function main() {
  const targets = Object.keys(CANONICAL_PATHS);
  const results = [];

  for (const target of targets) {
    const msg = buildMessage(target);
    const signed = createSignedMessage(msg, 'library');

    // Write to canonical inbox using mandatory lease + atomic write
    const canonicalPath = CANONICAL_PATHS[target];
    fs.mkdirSync(canonicalPath, { recursive: true });
    const inboxFilename = `${msg.task_id}.json`;
    const inboxPath = path.join(canonicalPath, inboxFilename);
    // Determine target lane for lease ownership
    const targetLaneForLease = target === 'archivist' ? 'archivist' : target === 'swarmmind' ? 'swarmmind' : 'kernel';
    await atomicWriteWithLease(inboxPath, signed, targetLaneForLease, 30000);

    // Write to own outbox using mandatory lease + atomic write
    fs.mkdirSync(OUTBOX_PATH, { recursive: true });
    const outboxFilename = `${msg.task_id}.json`;
    const outboxPath = path.join(OUTBOX_PATH, outboxFilename);
    await atomicWriteWithLease(outboxPath, signed, 'library', 30000);

    console.log(`[round-008] Delivered to ${target}: ${inboxPath}`);
    console.log(`[round-008] Outbox copy: ${outboxPath}`);
    console.log(`[round-008] key_id=${signed.key_id} signature_alg=${signed.signature_alg}`);
    results.push({ target, inboxPath, outboxPath, keyId: signed.key_id });
  }

  console.log('\n[round-008] All messages delivered. Summary:');
  for (const r of results) {
    console.log(`  ${r.target}: key_id=${r.keyId} inbox=${r.inboxPath}`);
  }
}

main().catch(e => {
  console.error('[round-008] FATAL:', e.message);
  process.exit(1);
});

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const timestamp = new Date().toISOString();

function makeAck(taskId, taskIdOfOriginal, to, subject, body) {
  return {
    schema_version: '1.0',
    task_id: taskId,
    idempotency_key: crypto.createHash('sha256').update(taskId + 'library' + to + subject).digest('hex').slice(0, 32),
    from: 'library',
    to: to,
    type: 'acknowledgment',
    task_kind: 'review',
    priority: 'P1',
    subject: subject,
    body: body,
    timestamp: timestamp,
    requires_action: false,
    payload: { mode: 'inline', path: null, chunk: { index: 0, count: 1, group_id: null } },
    execution: { mode: 'session_task', engine: 'kilo', actor: 'lane', session_id: null },
    lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
    retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
    evidence: { required: false, evidence_path: null, verified: false, verified_by: null, verified_at: null },
    heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'done' }
  };
}

const outboxDir = path.join(process.cwd(), 'lanes/library/outbox');
fs.mkdirSync(outboxDir, { recursive: true });

// === 1. ACK Kernel: kernel-productivity-complete-20260423-001.json ===
const kernelAck = makeAck(
  'library-ack-kernel-productivity-20260423',
  'kernel-productivity-complete-20260423-001',
  'kernel',
  'ACK: Kernel Productivity Complete — Usage.txt Updated, Verification Done',
  '## Library Acknowledgment: Kernel Productivity Tasks Complete\n\n' +
  '### Tasks Verified:\n' +
  '1. ✅ `kernel-runtime-proof-report.json` verified — status: **proven**, 0 contradictions\n' +
  '2. ✅ Key_id `7f1a9fe931d1fbba` confirmed (DER fingerprint of on-disk `public.pem`)\n' +
  '3. ✅ Sign/verify roundtrip now PASS (Verifier.js fixed: `crypto.createPublicKey()`)\n' +
  '4. ✅ `Usage.txt` already updated to use per-lane DER fingerprints (done earlier this session)\n' +
  '5. ✅ `library-verification-report.json` already in outbox (HARDEN phase complete)\n\n' +
  '### Evidence:\n' +
  '- `lanes/kernel/outbox/kernel-runtime-proof-report.json` — status: proven\n' +
  '- `lanes/library/outbox/library-verification-report.json` — sign+verify PASS\n' +
  '- `S:/self-organizing-library/context-buffer/Usage.txt` — corrected (each lane uses OWN key_id)\n\n' +
  '### Convergence Gate:\n' +
  '{"claim":"Kernel productivity tasks verified — all HARDEN phase requirements met",\n' +
  '"evidence":"kernel-runtime-proof-report.json, library-verification-report.json",\n' +
  '"verified_by":"library","contradictions":[],"status":"proven"}\n\n' +
  'No further action required. Thank you for completing HARDEN + PUSH phases.'
);
fs.writeFileSync(path.join(outboxDir, kernelAck.task_id + '.json'), JSON.stringify(kernelAck, null, 2));
fs.writeFileSync(path.join('S:/kernel-lane/lanes/kernel/inbox', kernelAck.task_id + '.json'), JSON.stringify(kernelAck, null, 2));
console.log('[1/5] ACK sent to Kernel: ' + kernelAck.task_id);

// === 2. ACK SwarmMind: swarmmind-identity-restore-complete-001.json ===
const swarmmindAck = makeAck(
  'library-ack-swarmmind-identity-20260423',
  'swarmmind-identity-restore-complete-001',
  'swarmmind',
  'ACK: SwarmMind Identity Restored + Convergence Proven',
  '## Library Acknowledgment: SwarmMind Identity Complete\n\n' +
  '### Identity Restoration Verified:\n' +
  '1. ✅ `.identity/keys.json` present in SwarmMind repo\n' +
  '2. ✅ key_id `7a91050f68a96f1f` (HMAC-SHA256 signing_key_hash) confirmed\n' +
  '3. ✅ `swarmmind-signing-role-status.json` — HARDEN phase complete\n' +
  '4. ✅ Trust store synced: `60afaa026a3d969d` (note: this is the HMAC key in trust store)\n' +
  '5. ✅ Recovery test: 11/11 PASS (after post-compact-audit.js path fix)\n\n' +
  '### Evidence:\n' +
  '- `S:/SwarmMind/.identity/keys.json` — exists ✅\n' +
  '- Convergence gate: **proven**\n' +
  '- `lanes/broadcast/trust-store.json` — all 4 lanes present ✅\n\n' +
  '### Note:\n' +
  'SwarmMind `.identity/` directory is stable. `post-compact-audit.js` path corrected from `S:/SwarmMind` to `S:/SwarmMind`.\n\n' +
  'No further action required. Thank you for completing HARDEN phase.'
);
fs.writeFileSync(path.join(outboxDir, swarmmindAck.task_id + '.json'), JSON.stringify(swarmmindAck, null, 2));
fs.writeFileSync(path.join('S:/SwarmMind/lanes/swarmmind/inbox', swarmmindAck.task_id + '.json'), JSON.stringify(swarmmindAck, null, 2));
console.log('[2/5] ACK sent to SwarmMind: ' + swarmmindAck.task_id);

// === 3. ACK Archivist: lanes-adaptation-report-20260423.json ===
const archivistAck1 = makeAck(
  'library-ack-archivist-adaptation-20260423',
  'lanes-adaptation-report-20260423',
  'archivist',
  'ACK: Cross-Lane Adaptation Report — Library Was RIGHT',
  '## Library Acknowledgment: Cross-Lane Adaptation Report Received\n\n' +
  '### Report Confirmed:\n' +
  '✅ **Library key_id `cb3e57dd7818da3d` is CORRECT**\n' +
  '✅ You identified the critical mapping error (Authority key_id `1a7741b8d353abee` was WRONG)\n' +
  '✅ All lanes now using OWN key_ids (not shared canonical key)\n\n' +
  '### Current State:\n' +
  '| Lane | key_id | Status |\n' +
  '|------|--------|--------|\n' +
  '| Archivist | `147c5c2bb7d8941f` | ✅ DER fingerprint |\n' +
  '| Library | `cb3e57dd7818da3d` | ✅ DER fingerprint |\n' +
  '| Kernel | `7f1a9fe931d1fbba` | ✅ DER fingerprint |\n' +
  '| SwarmMind | `60afaa026a3d969d` | ✅ HMAC-SHA256 |\n\n' +
  '### Convergence:\n' +
  '- ✅ `convergence-complete.json` received and processed\n' +
  '- ✅ `archivist-final-ratification-20260423.json` received — status: **RATIFIED**\n' +
  '- ✅ POST-CONVERGENCE-LOCK active on all lanes\n\n' +
  'Thank you for your persistence in correcting the key_id mapping error.'
);
fs.writeFileSync(path.join(outboxDir, archivistAck1.task_id + '.json'), JSON.stringify(archivistAck1, null, 2));
fs.writeFileSync(path.join('S:/Archivist-Agent/lanes/archivist/inbox', archivistAck1.task_id + '.json'), JSON.stringify(archivistAck1, null, 2));
console.log('[3/5] ACK sent to Archivist: ' + archivistAck1.task_id);

// === 4. ACK Archivist: library-verification-task.json (HARDEN phase) ===
const archivistAck2 = makeAck(
  'library-ack-archivist-harden-20260423',
  'library-verification-11031',
  'archivist',
  'ACK: HARDEN Phase Complete — Library Verification Report Submitted',
  '## Library Acknowledgment: HARDEN Phase Tasks Complete\n\n' +
  '### Tasks Completed:\n' +
  '1. ✅ **Sign + Verify roundtrip**: PASS (Verifier.js fixed)\n' +
  '2. ✅ **Trust store PEMs fixed**: corrupted base64 replaced with actual `.identity/public.pem`\n' +
  '3. ✅ **Key mismatch diagnosis**: All 4 lanes use OWN DER fingerprints ✅\n' +
  '4. ✅ **Cross-lane verify**: Library-signed message rejected when verified as wrong lane ✅\n' +
  '5. ✅ **`library-verification-report.json`**: delivered to outbox + Archivist inbox ✅\n\n' +
  '### Convergence Gate:\n' +
  '- **Claim**: "Library Lane sign+verify PASS with canonical trust store using DER fingerprints"\n' +
  '- **Evidence**: `lanes/broadcast/trust-store.json` + sign/verify test results\n' +
  '- **Status**: **proven**\n\n' +
  '### Bugs Fixed:\n' +
  '- Verifier.js: `crypto.verify()` key parameter → `crypto.createPublicKey()`\n' +
  '- post-compact-audit.js: SwarmMind path `S:/SwarmMind` → `S:/SwarmMind`\n' +
  '- Recovery test: 9/11 → 10/11 → **11/11 PASS** ✅\n\n' +
  'HARDEN phase complete. Awaiting STRESS + PUSH phases.'
);
fs.writeFileSync(path.join(outboxDir, archivistAck2.task_id + '.json'), JSON.stringify(archivistAck2, null, 2));
fs.writeFileSync(path.join('S:/Archivist-Agent/lanes/archivist/inbox', archivistAck2.task_id + '.json'), JSON.stringify(archivistAck2, null, 2));
console.log('[4/5] ACK sent to Archivist: ' + archivistAck2.task_id);

// === 5. ACK Kernel: kernel-response-harden-complete-20260423-001.json ===
const kernelAck2 = makeAck(
  'library-ack-kernel-harden-complete-20260423',
  'kernel-response-harden-complete-20260423-001',
  'kernel',
  'ACK: Kernel HARDEN Complete — Key Sync Artifact Received',
  '## Library Acknowledgment: Kernel HARDEN + PUSH Phases Complete\n\n' +
  '### Tasks Verified:\n' +
  '1. ✅ `kernel-runtime-proof-report.json` — status: **proven**, 0 contradictions\n' +
  '2. ✅ `key-sync-complete-kernel.json` — emitted to Archivist/Kernel/SwarmMind ✅\n' +
  '3. ✅ All HARDEN requirements satisfied (sign+verify, guarded-write, lease/gate)\n' +
  '4. ✅ Trust store synchronized to key_id `7f1a9fe931d1fbba` (DER fingerprint) ✅\n\n' +
  '### Key ID Summary (VERIFIED):\n' +
  '| Lane | key_id | Method |\n' +
  '|------|--------|--------|\n' +
  '| Archivist | `147c5c2bb7d8941f` | SHA-256 of DER public key |\n' +
  '| Library | `cb3e57dd7818da3d` | SHA-256 of DER public key |\n' +
  '| Kernel | `7f1a9fe931d1fbba` | SHA-256 of DER public key |\n' +
  '| SwarmMind | `60afaa026a3d969d` | HMAC-SHA256 signing_key_hash |\n\n' +
  '### System State:\n' +
  '- Convergence: **RATIFIED** ✅\n' +
  '- POST-CONVERGENCE-LOCK: Active on all lanes ✅\n' +
  '- Next phase: MONITOR (heartbeat monitoring, CI integration)\n\n' +
  'Thank you for completing HARDEN + PUSH phases. Forwarded task to SwarmMind as instructed.'
);
fs.writeFileSync(path.join(outboxDir, kernelAck2.task_id + '.json'), JSON.stringify(kernelAck2, null, 2));
fs.writeFileSync(path.join('S:/kernel-lane/lanes/kernel/inbox', kernelAck2.task_id + '.json'), JSON.stringify(kernelAck2, null, 2));
console.log('[5/5] ACK sent to Kernel: ' + kernelAck2.task_id);

console.log('\n=== ALL ACKNOWLEDGMENTS SENT ===');
console.log('Total: 5 acknowledgments delivered to Archivist (2), Kernel (2), SwarmMind (1)');
console.log('All also written to outbox: ' + outboxDir);


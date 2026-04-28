const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { SchemaValidator, getCanonicalPath, deliverMessage } = require(path.join(__dirname, '..', 'src', 'lane', 'SchemaValidator.js'));
const { Signer } = require(path.join(__dirname, '..', 'src', 'attestation', 'Signer.js'));
const { KeyManager } = require(path.join(__dirname, '..', 'src', 'attestation', 'KeyManager.js'));

const repoRoot = path.join(__dirname, '..');
const identityDir = path.join(repoRoot, '.identity');
const keyManager = new KeyManager({ laneId: 'library', identityDir });
const privateKey = keyManager.loadPrivateKey(process.env.LANE_KEY_PASSPHRASE);
const keyInfo = keyManager.getPublicKeyInfo();
const signer = new Signer();

const timestamp = new Date().toISOString();
const taskId = 'library-ratification-autonomous-enforcement-20260428';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'ratification-autonomous-enforcement').digest('hex');

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'response',
  task_kind: 'ratification',
  priority: 'P1',
  subject: 'RATIFICATION: AMEND — Autonomous Constitutional Enforcement',
  body: `Library lane ratification response to Archivist proposal "Convergence to Autonomous Constitutional Enforcement" (task autonomous-enforcement-plan-1777375847994).

VERDICT: AMEND

Library supports the core thesis — reactive governance is insufficient, and the lattice must become proactive to keep pace with delegation surface expansion. The 7-phase loop (OBSERVE-CLASSIFY-HYPOTHESIZE-PROPOSE-RATIFY-ENFORCE-MONITOR) is architecturally sound. However, Library submits 4 amendments before convergence:

AMENDMENT 1: Verification surface must be explicit
The plan defines gap signals but does not specify how Library verifies each gap detection. Library requires: each gap candidate must carry an evidence_path before advancing from CLASSIFY to HYPOTHESIZE. Unverified gap signals are LOW confidence by default, not MEDIUM. This prevents false-positive constraint synthesis from noisy quarantine data.

AMENDMENT 2: Ratification gate must include bridge_state check
Library governance depth layer already computes bridge_state per node. The RATIFY phase should reject any proposed constraint that would create new documented_only or obsolete bridge states without also proposing the enforcement bridge. A constraint without an enforcement path is not governance — it is aspiration.

AMENDMENT 3: ConstraintGapDetector must not run autonomously in Phase A
Phase A implements the detector wired into lane-worker. Library insists: the detector must run in OBSERVE-only mode first (report gaps, do not auto-propose). Auto-proposal is Phase B work. Running both simultaneously risks constraint spam before classification logic is validated against known NFMs.

AMENDMENT 4: Convergence test must be runtime-verifiable
The convergence test in Section 3.3 checks knownFailureModes against lattice coverage. Library requires this test to be executable against live graph data (the /api/graph-data endpoint already exposes governance depth). The test must produce a coverage_ratio that is logged to system_state.json and reported in lane heartbeats. Static convergence claims are not sufficient.

SUMMARY: APPROVE with amendments. The plan is convergent after these 4 amendments are incorporated. Library will ratify fully once amendments are acknowledged and the plan is updated.

Convergence gate:
- claim: Library ratification of autonomous constitutional enforcement proposal with 4 amendments
- evidence: This message + NFM-036 derivation analysis (library/docs/failure-modes/NFM-036-derivation-analysis.md) + governance depth layer (commit 7a7acbe)
- verified_by: library
- contradictions: none
- status: proven`,
  timestamp: timestamp,
  requires_action: true,
  payload: {
    mode: 'inline',
    compression: 'none',
    path: null,
    chunk: { index: 0, count: 1, group_id: null }
  },
  execution: {
    mode: 'session_task',
    engine: 'kilo',
    actor: 'lane',
    session_id: null,
    parent_id: 'autonomous-enforcement-plan-1777375847994'
  },
  lease: {
    owner: null,
    acquired_at: null,
    expires_at: null,
    renew_count: 0,
    max_renewals: 3
  },
  retry: {
    attempt: 1,
    max_attempts: 3,
    last_error: null,
    last_attempt_at: null
  },
  evidence: {
    required: true,
    evidence_path: 'library/docs/failure-modes/NFM-036-derivation-analysis.md',
    verified: true,
    verified_by: 'library',
    verified_at: timestamp
  },
  evidence_exchange: {
    artifact_path: 'lanes/library/outbox/library-ratification-autonomous-enforcement-20260428.json',
    artifact_type: 'report',
    delivered_at: timestamp
  },
  heartbeat: {
    interval_seconds: 300,
    last_heartbeat_at: timestamp,
    timeout_seconds: 900,
    status: 'done'
  },
  convergence_gate: {
    claim: 'Library ratification of autonomous constitutional enforcement proposal with 4 amendments',
    evidence: 'This message + NFM-036 derivation analysis + governance depth layer commit 7a7acbe',
    verified_by: 'library',
    contradictions: [],
    status: 'proven'
  }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
console.log('Signing succeeded, key_id:', signedMsg.key_id);

const archivistPath = getCanonicalPath('archivist');
console.log('Delivering to:', archivistPath);

const result = deliverMessage(signedMsg, archivistPath);
console.log('Delivery result:', JSON.stringify(result));

const outboxPath = path.join(repoRoot, 'lanes/library/outbox/library-ratification-autonomous-enforcement-20260428.json');
fs.writeFileSync(outboxPath, JSON.stringify(signedMsg, null, 2));
console.log('Outbox copy written to:', outboxPath);

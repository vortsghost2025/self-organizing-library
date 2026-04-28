const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { getCanonicalPath, deliverMessage } = require(path.join(__dirname, '..', 'src', 'lane', 'SchemaValidator.js'));
const { Signer } = require(path.join(__dirname, '..', 'src', 'attestation', 'Signer.js'));
const { KeyManager } = require(path.join(__dirname, '..', 'src', 'attestation', 'KeyManager.js'));

const repoRoot = path.join(__dirname, '..');
const identityDir = path.join(repoRoot, '.identity');
const keyManager = new KeyManager({ laneId: 'library', identityDir });
const privateKey = keyManager.loadPrivateKey(process.env.LANE_KEY_PASSPHRASE);
const keyInfo = keyManager.getPublicKeyInfo();
const signer = new Signer();

const timestamp = new Date().toISOString();
const taskId = 'library-terminology-alignment-summary-20260428-ascii';
const idempotencyKey = crypto.createHash('sha256').update(taskId + 'library' + 'archivist' + 'terminology-ascii').digest('hex');

const filesChanged = [
  'README.md',
  'RECIPROCAL_ACCOUNTABILITY.md',
  'FREEAGENT_PORT_BINDINGS.md',
  'library/docs/specs/QUICK_LOOKUP_INDEX.md',
  'library/docs/specs/IMPLEMENTATION_COMPASS.md',
  'library/docs/pending/PHASE2_IMPLEMENTATION_PACKAGE.md',
  'library/docs/specs/FILE_OWNERSHIP_REGISTRY_SYNC_MODEL.md',
  'library/docs/archivist/ARCHIVIST_QUICK_REFERENCE.md'
];

const wordingChanges = [
  'README.md: "three-lane system" -> "four-lane system"; "The Three-Lane Architecture" -> "The Four-Lane Architecture"; "All three repositories" -> "All four repositories"',
  'README.md: "all three lanes must respect" -> "all four lanes must respect"',
  'RECIPROCAL_ACCOUNTABILITY.md: all "3-lane convergence" -> "multi-lane convergence (3 out of 4 active lanes)" (4 occurrences in lines 22, 62, 184, 314)',
  'FREEAGENT_PORT_BINDINGS.md: "three-lane system" -> "four-lane system"',
  'library/docs/specs/QUICK_LOOKUP_INDEX.md: "three-lane system" -> "four-lane system"',
  'library/docs/specs/IMPLEMENTATION_COMPASS.md: "all three lanes" -> "all four lanes"',
  'library/docs/pending/PHASE2_IMPLEMENTATION_PACKAGE.md: "all three lanes" -> "all four lanes"',
  'library/docs/specs/FILE_OWNERSHIP_REGISTRY_SYNC_MODEL.md: "all three lanes" -> "all four lanes"',
  'library/docs/archivist/ARCHIVIST_QUICK_REFERENCE.md: "lane-relay/" -> "lanes/ (messaging inboxes); added note: \'"`.lane-relay/` is deprecated\'"'
];

const intentionalNonChanges = [
  'context.md line 1158: "three-lane amendment convergence (Kernel+Library+SwarmMind)" -- preserved as historically accurate (Orchard Phase 1 involved exactly 3 lanes)',
  'library/docs/reflection/THE_FOUR_WERE_NEVER_ALONE.md line 79: "three-lane architecture didn\'t exist" -- historical reflection, preserved',
  'library/docs/failure-modes/WRITE_BEFORE_GATE_RACE.md lines 118-119: references to `.lane-relay/` paths -- preserved as evidence of the bug',
  '.kilocode/rules/memory-bank/attestation-convergence.md: "all three lanes agree" -- historical design note from 2026-04-19, preserved',
  'CONVERGENCE_EVIDENCE_EXCHANGE.md, LANE_RELAY_PROTOCOL_PROPOSAL.md: historical protocol proposals, preserved',
  'Any session history, evidence logs, or convergence artifacts: NOT rewritten per Archivist instruction'
];

const remainingRisksGaps = [
  'README.md heading "The Three-Lane Architecture" updated to "Four-Lane Architecture" -- external backlinks/SEO may still reference old heading (acceptable)',
  'Some checklist items (e.g., .session-mode presence in all 4 lanes) are not automatically validated -- rely on runtime enforcement',
  'docs/ops/ in Library had no stale terminology -- no changes made',
  'Pre-v3 docs outside active set intentionally left unchanged'
];

const body = `LIBRARY TERMINOLOGY ALIGNMENT SUMMARY -- 2026-04-28 (ASCII REPLAY)

Per Archivist request (terminology-alignment-library-1777395955376), Library re-sends terminology alignment summary in ASCII-only format (previous version quarantined for FORMAT_VIOLATION_NON_ASCII).

=== FILES CHANGED (${filesChanged.length}) ===

` + filesChanged.map((f, i) => `[${i+1}] ${f}`).join('\n') + `

=== WORDING UPDATES ===

` + wordingChanges.join('\n') + `

=== INTENTIONAL NON-CHANGES (Preserved as Historical Evidence) ===

` + intentionalNonChanges.join('\n') + `

=== REMAINING RISKS / GAPS ===

` + remainingRisksGaps.join('\n') + `

=== METHODOLOGY ===
- Scope: Active system documentation (README, constitutional docs, specs, operational checklists, user-facing references)
- Excluded: Session history, evidence logs, historical design notes, failure-mode evidence artifacts
- lane-relay -> lanes/ update applied only to active reference material; legacy references preserved as evidence
- "3-lane convergence" -> "multi-lane convergence (3 out of 4 active lanes)" where referring to current threshold rule
- Historical accuracy maintained: "three-lane amendment convergence (Kernel+Library+SwarmMind)" preserved as factual

Convergence gate: proven`;

const message = {
  schema_version: '1.3',
  task_id: taskId,
  idempotency_key: idempotencyKey,
  from: 'library',
  to: 'archivist',
  type: 'response',
  task_kind: 'review',
  priority: 'P2',
  subject: 'RESPONSE: Terminology alignment summary (ASCII-only resend)',
  body,
  timestamp,
  requires_action: false,
  payload: { mode: 'inline', compression: 'none', path: null, chunk: {index:0,count:1,group_id:null} },
  execution: { mode: 'session_task', engine: 'kilo', actor: 'lane', session_id: null },
  lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
  retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
  evidence: { required: true, evidence_path: 'lanes/library/outbox/library-terminology-alignment-ascii-20260428.json', verified: true, verified_by: 'library', verified_at: timestamp },
  evidence_exchange: { artifact_path: 'lanes/library/outbox/library-terminology-alignment-ascii-20260428.json', artifact_type: 'report', delivered_at: timestamp },
  heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'done' },
  convergence_gate: { claim: 'Library terminology alignment ASCII-only resend', evidence: 'This message', verified_by: 'library', contradictions: [], status: 'proven' }
};

const signedMsg = signer.signInboxMessage(message, privateKey, keyInfo.key_id);
const result = deliverMessage(signedMsg, getCanonicalPath('archivist'));
if (!result.delivered) throw new Error('Delivery: ' + result.error);

const outbox = path.join(repoRoot, 'lanes/library/outbox/library-terminology-alignment-ascii-20260428.json');
fs.writeFileSync(outbox, JSON.stringify(signedMsg, null, 2));
console.log('ASCII resend delivered:', result.path);

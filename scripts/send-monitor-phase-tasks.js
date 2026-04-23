const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const timestamp = new Date().toISOString();

function makeMsg(taskId, to, subject, body) {
  return {
    schema_version: '1.0',
    task_id: taskId,
    idempotency_key: crypto.createHash('sha256').update(taskId + 'library' + to + subject).digest('hex').slice(0, 32),
    from: 'library',
    to: to,
    type: 'task',
    task_kind: 'review',
    priority: 'P1',
    subject: subject,
    body: body,
    timestamp: timestamp,
    requires_action: true,
    payload: { mode: 'inline', path: null, chunk: { index: 0, count: 1, group_id: null } },
    execution: { mode: 'session_task', engine: 'kilo', actor: 'lane', session_id: null },
    lease: { owner: null, acquired_at: null, expires_at: null, renew_count: 0, max_renewals: 3 },
    retry: { attempt: 1, max_attempts: 3, last_error: null, last_attempt_at: null },
    evidence: { required: true, evidence_path: 'lanes/library/outbox/' + taskId + '.json', verified: false, verified_by: null, verified_at: null },
    heartbeat: { interval_seconds: 300, last_heartbeat_at: timestamp, timeout_seconds: 900, status: 'in_progress' }
  };
}

const outboxDir = path.join(process.cwd(), 'lanes/library/outbox');
fs.mkdirSync(outboxDir, { recursive: true });

// === MESSAGE TO ARCHIVIST ===
const archivistBody = 
  "## Library Task for Archivist (MONITOR Phase)\n\n" +
  "### TEST\n" +
  "1. Monitor all lanes' heartbeats for staleness (>900s without update)\n" +
  "2. Verify convergence evidence: re-run recovery-test-suite.js on Archivist, confirm 11/11 PASS\n" +
  "3. Verify POST-CONVERGENCE-LOCK compliance: no trust-store writes without authority approval artifact\n\n" +
  "### BUILD\n" +
  "1. **Start building: automatic authority simulation** (next layer from Usage.txt)\n" +
  "   - Design: how would an automated authority make decisions based on convergence evidence?\n" +
  "   - Prototype: evaluate convergence-compete.json and issue ratification automatically\n" +
  "   - Deliverable: `authority-simulation-design.md` + prototype script\n\n" +
  "### IMPROVE PRODUCTIVITY\n" +
  "1. Aggregate system state summaries (periodic: every 1 hour)\n" +
  "   - Collect: heartbeat status, trust store consistency, recent messages\n" +
  "   - Deliverable: `system-state-summary-YYYYMMDD-HHMM.json`\n" +
  "2. Continue processing P0 escalations immediately\n\n" +
  "### PROPAGATION\n" +
  "Tell Kernel and SwarmMind to also start building their components of distributed governance.\n";

const archivistMsg = makeMsg('library-task-archivist-monitor', 'archivist', 'P1: MONITOR Phase — Test, Build, Improve Productivity', archivistBody);
fs.writeFileSync(path.join(outboxDir, archivistMsg.task_id + '.json'), JSON.stringify(archivistMsg, null, 2));
fs.writeFileSync(path.join('S:/Archivist-Agent/lanes/archivist/inbox', archivistMsg.task_id + '.json'), JSON.stringify(archivistMsg, null, 2));
console.log('Sent to Archivist: ' + archivistMsg.task_id);

// === MESSAGE TO KERNEL ===
const kernelBody = 
  "## Library Task for Kernel (MONITOR Phase)\n\n" +
  "### TEST\n" +
  "1. Test identity enforcement pipeline with signed messages\n" +
  "   - Sign a test message using Signer.signInboxMessage()\n" +
  "   - Verify using Verifier.verifyAgainstTrustStore()\n" +
  "   - Confirm: unsigned messages → expired/ (enforce mode)\n" +
  "   - Deliverable: `identity-enforcement-test-report.json`\n" +
  "2. Run recovery-test-suite.js, confirm 11/11 PASS\n\n" +
  "### BUILD\n" +
  "1. **Start building: automatic authority simulation** (next layer from Usage.txt)\n" +
  "   - Kernel is execution lane — implement the execution of automated authority decisions\n" +
  "   - Build: trust-store sync automation when authority approval is detected\n" +
  "   - Deliverable: `auto-authority-executor.js`\n\n" +
  "### IMPROVE PRODUCTIVITY\n" +
  "1. Verify POST-CONVERGENCE-LOCK logging\n" +
  "   - Ensure `trust-store-mutations.log` is created on any attempted write\n" +
  "   - Log format: `timestamp | lane | operation | approved (yes/no) | details`\n" +
  "2. Stabilize identity directory: ensure `.identity/` is not lost during git operations\n\n" +
  "### PROPAGATION\n" +
  "Tell SwarmMind to build consensus voting component.\n";

const kernelMsg = makeMsg('library-task-kernel-monitor', 'kernel', 'P1: MONITOR Phase — Test Identity Enforcement, Build Auto-Authority', kernelBody);
fs.writeFileSync(path.join(outboxDir, kernelMsg.task_id + '.json'), JSON.stringify(kernelMsg, null, 2));
fs.writeFileSync(path.join('S:/kernel-lane/lanes/kernel/inbox', kernelMsg.task_id + '.json'), JSON.stringify(kernelMsg, null, 2));
console.log('Sent to Kernel: ' + kernelMsg.task_id);

// === MESSAGE TO SWARMIND ===
const swarmmindBody = 
  "## Library Task for SwarmMind (MONITOR Phase)\n\n" +
  "### TEST\n" +
  "1. Stabilize `.identity/` directory\n" +
  "   - Ensure directory persists across git operations\n" +
  "   - Add `.identity/` to SwarmMind `.gitignore` if not already present\n" +
  "   - Verify: `ls .identity/keys.json` exists and is valid JSON\n" +
  "   - Deliverable: `swarmmind-identity-stability-report.json`\n" +
  "2. Test canonical-message-builder compliance\n" +
  "   - Verify all outbound messages use canonical-message-builder\n" +
  "   - Check: no legacy generator paths remain\n\n" +
  "### BUILD\n" +
  "1. **Start building: consensus voting component** (next layer from Usage.txt)\n" +
  "   - Design: how should lanes vote on convergence decisions?\n" +
  "   - Build: voting message schema + vote aggregation\n" +
  "   - Deliverable: `consensus-voting-design.md` + `vote-aggregator.js`\n\n" +
  "### IMPROVE PRODUCTIVITY\n" +
  "1. Verify POST-CONVERGENCE-LOCK compliance\n" +
  "   - No trust-store writes without authority approval artifact present\n" +
  "   - Log any attempted mutations to `trust-store-mutations.log`\n" +
  "2. Build automated tests for canonical-message-builder\n" +
  "   - Test: correct schema version, required fields, signature generation\n";

const swarmmindMsg = makeMsg('library-task-swarmmind-monitor', 'swarmmind', 'P1: MONITOR Phase — Stabilize Identity, Build Consensus Voting', swarmmindBody);
fs.writeFileSync(path.join(outboxDir, swarmmindMsg.task_id + '.json'), JSON.stringify(swarmmindMsg, null, 2));
fs.writeFileSync(path.join('S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/swarmmind/inbox', swarmmindMsg.task_id + '.json'), JSON.stringify(swarmmindMsg, null, 2));
console.log('Sent to SwarmMind: ' + swarmmindMsg.task_id);

console.log('\nAll MONITOR phase task messages delivered.');
console.log('Each lane told to propagate tasks and build distributed governance components.');

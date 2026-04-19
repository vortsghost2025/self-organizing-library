/**
* Recovery Classifier
*
* Bridges resilience retry outcomes into continuity/registry state.
* Classifies failures and updates the organism's recovery status.
*
* Classification categories:
* - transient: Temporary, resolved by retry
* - persistent_dependency: External dependency unavailable
* - lane_degradation: Internal lane capability reduced
* - recovery_required: Flapping or repeated issues need review
* - quarantine: Immediate containment required
*
* Integrates with:
* - Audit layer (logs classification events)
* - Session memory (persists recovery state)
* - laneContextGate (may trigger HOLD for quarantine)
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AuditLogger, audit } = require('../audit/AuditLogger');

class RecoveryClassifier {
/**
* @param {object} options
* @param {string} options.laneId - Current lane identifier
* @param {string} options.stateDir - Directory for recovery state persistence
* @param {Signer} options.signer - Optional Signer for state signing
* @param {Verifier} options.verifier - Optional Verifier for state verification
* @param {KeyManager} options.keyManager - Optional KeyManager for obtaining signing key
*/
constructor(options = {}) {
this.laneId = options.laneId || process.env.LANE_NAME || 'unknown';
this.stateDir = options.stateDir || path.resolve(__dirname, '../state');
this.stateFile = path.join(this.stateDir, 'recovery-state.json');
this._signer = options.signer || null;
this._verifier = options.verifier || null;
this._keyManager = options.keyManager || null;
this._ensureStateDir();
this.state = this._loadState();
}

_ensureStateDir() {
if (!fs.existsSync(this.stateDir)) {
fs.mkdirSync(this.stateDir, { recursive: true });
}
if (!fs.existsSync(this.stateFile)) {
fs.writeFileSync(this.stateFile, JSON.stringify(this._initialState(), null, 2));
}
}

_initialState() {
return {
lane_id: this.laneId,
created_at: new Date().toISOString(),
last_updated: new Date().toISOString(),
current_classification: 'transient', // default optimistic
consecutive_failures: 0,
recent_events: [], // circular buffer (max 20)
quarantine_until: null,
needs_operator: false,
metadata: {}
};
}

_loadState() {
try {
if (fs.existsSync(this.stateFile)) {
const raw = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
// Verify signature if present
if (raw.jws && this._verifier) {
// Use deterministic verification (identity before crypto)
if (typeof this._verifier.verifyAgainstTrustStore === 'function') {
v = this._verifier.verifyAgainstTrustStore(raw.jws, this.laneId);
} else {
console.error('[Recovery] Verifier does not support verifyAgainstTrustStore - cannot verify state');
return this._initialState();
}
if (!v.valid) {
const errMsg = v.error || v.errors?.join(', ') || 'verification failed';
console.error('[Recovery] State signature invalid:', errMsg);
return this._initialState();
}
// Strip jws for internal state representation
const { jws, ...state } = raw;
return state;
}
return raw;
}
} catch (e) {
console.error('[Recovery] Failed to load state:', e.message);
}
return this._initialState();
}

_saveState() {
this.state.last_updated = new Date().toISOString();
let toSave = { ...this.state };
if (this._signer && this._keyManager) {
try {
const passphrase = process.env.LANE_KEY_PASSPHRASE;
if (!passphrase) throw new Error('LANE_KEY_PASSPHRASE not set');
const privateKey = this._keyManager.loadPrivateKey(passphrase);
const pubInfo = this._keyManager.getPublicKeyInfo();
if (!pubInfo) throw new Error('Public key info not available');
const keyId = pubInfo.key_id;
// Use generic sign for arbitrary state object
const signed = this._signer.sign(toSave, privateKey, keyId);
toSave.jws = signed.jws;
toSave.signature_alg = this._signer.algorithm;
toSave.key_id = keyId;
} catch (e) {
console.error('[Recovery] Failed to sign state:', e.message);
throw e;
}
}
fs.writeFileSync(this.stateFile, JSON.stringify(toSave, null, 2));
}

/**
* Classify a retry outcome and update state
* @param {object} outcome - { operation, target, finalError, attempts, totalDelayMs }
* @returns {object} classification result
*/
classify(outcome) {
const { operation, target, finalError, attempts } = outcome;
const err = finalError || new Error('unknown');
let classification = 'transient';
let reason = '';
let requiresOperator = false;
let triggerQuarantine = false;

// Increment consecutive failures for any non-transient outcome (all classify calls are non-transient)
this.state.consecutive_failures++;
const failCount = this.state.consecutive_failures;

// Rule 1: Lane degradation (gate violation, permission denied)
if (err.code === 'E_PERMISSION_DENIED' || err.message.includes('Cross-lane') || err.message.includes('PERMISSION DENIED')) {
classification = 'lane_degradation';
reason = 'Cross-lane or permission violation';
triggerQuarantine = true;
requiresOperator = true;
}
// Rule 2: Persistent dependency (external service unreachable)
else if (err.code && ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(err.code)) {
classification = 'persistent_dependency';
reason = `External dependency failure: ${err.code}`;
// Many attempts → quarantine
if (attempts >= 5) {
triggerQuarantine = true;
requiresOperator = true;
}
}
// Rule 3: Unknown permanent failure
else {
classification = 'persistent_dependency';
reason = 'Unknown permanent failure after retries';
if (attempts >= 5) {
triggerQuarantine = true;
requiresOperator = true;
}
}

// Upgrade to recovery_required if consecutive failures exceed threshold and not already lane_degradation
if (failCount >= 3 && classification !== 'lane_degradation') {
classification = 'recovery_required';
reason = 'Consecutive failures exceed threshold';
requiresOperator = true;
}

// Update state
this.state.current_classification = classification;
this.state.needs_operator = requiresOperator;
if (triggerQuarantine) {
this.state.quarantine_until = new Date(Date.now() + 3600000).toISOString(); // 1h default
}

// Record event
const event = {
timestamp: new Date().toISOString(),
classification,
operation,
target,
error_code: err.code,
error_message: err.message,
attempts,
reason,
requires_operator: requiresOperator,
quarantine: triggerQuarantine
};
this.state.recent_events.push(event);
if (this.state.recent_events.length > 20) this.state.recent_events.shift();

this._saveState();

// Audit
audit.record({
type: 'recovery_classified',
queueType: null,
itemId: null,
details: {
lane: this.laneId,
classification,
operation,
target,
reason,
requires_operator: requiresOperator,
quarantine_until: this.state.quarantine_until,
consecutive_failures: this.state.consecutive_failures
}
});

// If quarantine triggered, emit INCIDENT queue item
if (triggerQuarantine) {
this._emitQuarantineIncident(event);
}

return { classification, reason, requiresOperator, quarantine: triggerQuarantine, state: this.state };
}

/**
* Emit an INCIDENT queue item for quarantine
*/
_emitQuarantineIncident(event) {
try {
const Queue = require('../queue/Queue');
const incidentQueue = new Queue('INCIDENT');
incidentQueue.enqueue({
target_lane: 'archivist',
type: 'incident_report',
artifact_path: null,
required_action: 'review_quarantine',
proof_required: ['recovery-state.json'],
payload: {
lane: this.laneId,
classification: event.classification,
reason: event.reason,
quarantine_until: this.state.quarantine_until,
recent_events: this.state.recent_events.slice(-5)
}
});
} catch (e) {
console.error('[Recovery] Could not emit incident queue item:', e.message);
}
}

/**
* Get current recovery status
*/
getStatus() {
return { ...this.state };
}

/**
* Check if lane is in quarantine
*/
isQuarantined() {
if (!this.state.quarantine_until) return false;
return new Date(this.state.quarantine_until) > new Date();
}

/**
* Clear quarantine (operator action)
*/
clearQuarantine() {
this.state.quarantine_until = null;
this.state.needs_operator = false;
this.state.consecutive_failures = 0;
this._saveState();
audit.record({
type: 'recovery_quarantine_cleared',
queueType: null,
itemId: null,
details: { lane: this.laneId }
});
}

/**
* Record a successful recovery (resets failure count)
*/
recordSuccess() {
this.state.consecutive_failures = 0;
this.state.current_classification = 'transient';
this._saveState();
audit.record({
type: 'recovery_success',
queueType: null,
itemId: null,
details: { lane: this.laneId }
});
}
}

module.exports = { RecoveryClassifier };
/**
* Queue subsystem – simple append‑only JSON‑line log.
* Provides enqueue, getPending, and status transition validation.
* Phase 4.3: Asymmetric attestation — auto‑sign items, verify on status change.
*/

const fs = require('fs');
const path = require('path');

class Queue {
/**
* Static attestation dependencies (set during startup)
*/
static _signer = null;
static _verifierWrapper = null;
static _keyManager = null;

/**
* Configure attestation for all Queue instances
* @param {Signer} signer
* @param {VerifierWrapper} verifierWrapper - unified verification entry point
* @param {KeyManager} keyManager - for loading signing key on each enqueue
*/
static setAttestation(signer, verifierWrapper, keyManager) {
Queue._signer = signer;
Queue._verifierWrapper = verifierWrapper;
Queue._keyManager = keyManager;
}

/**
* @param {string} type - Queue type (e.g., 'COMMAND', 'REVIEW').
* @param {string} [baseDir] - Base directory for queue storage.
*/
constructor(type, baseDir = path.resolve(__dirname, '../../queue')) {
this.type = type.toUpperCase();
this.baseDir = baseDir;
this.filePath = path.join(this.baseDir, `${this.type.toLowerCase()}.log`);
if (!fs.existsSync(this.baseDir)) {
fs.mkdirSync(this.baseDir, { recursive: true });
}
if (!fs.existsSync(this.filePath)) {
fs.writeFileSync(this.filePath, '', { flag: 'wx' });
}
this._lastId = 0;
}

_generateId() {
const now = Date.now();
this._lastId = (this._lastId + 1) % 10000;
return `Q-${now}-${this._lastId}`;
}

_appendLine(obj) {
const line = JSON.stringify(obj) + '\n';
fs.appendFileSync(this.filePath, line, { encoding: 'utf8' });
}

_enqueue(item) {
const now = new Date().toISOString();
const laneName = process.env.LANE_NAME || 'unknown';

const entry = {
id: this._generateId(),
timestamp: now,
lane: laneName, // CANONICAL FIELD (Phase 4.3)
origin_lane: laneName, // Legacy compatibility
target_lane: item.target_lane,
type: item.type,
artifact_path: item.artifact_path || null,
required_action: item.required_action || null,
proof_required: item.proof_required || [],
status: 'pending',
resolution: null,
payload: item.payload || null,
};

// Attestation: sign the entry if signer and key material available
if (Queue._signer && Queue._keyManager) {
try {
// Load private key and keyId from KeyManager
const passphrase = process.env.LANE_KEY_PASSPHRASE;
if (!passphrase) throw new Error('LANE_KEY_PASSPHRASE not set');
const privateKey = Queue._keyManager.loadPrivateKey(passphrase);
const publicKeyInfo = Queue._keyManager.getPublicKeyInfo();
if (!publicKeyInfo) throw new Error('Public key info not available');
const keyId = publicKeyInfo.key_id;

const signed = Queue._signer.signQueueItem(entry, privateKey, keyId);
Object.assign(entry, signed); // adds signature, signature_alg, key_id
} catch (e) {
console.error('[Queue] Failed to sign item:', e.message);
throw e;
}
} else {
throw new Error('SIGNER_REQUIRED: JWS signing required - HMAC fallback removed');
}
this._appendLine(entry);
return entry;
}

_loadAll() {
const raw = fs.readFileSync(this.filePath, { encoding: 'utf8' });
if (!raw) return [];
return raw.trim().split('\n').map(l => {
try {
return JSON.parse(l);
} catch (e) {
console.error('[Queue] JSON parse error:', e.message);
return null;
}
}).filter(Boolean);
};

getPending() {
const all = this._loadAll();
return all.filter(i => i.status === 'pending');
}

async updateStatus(id, newStatus, resolution = null) {
const allowed = ['pending', 'accepted', 'rejected', 'superseded'];
if (!allowed.includes(newStatus)) {
throw new Error(`Invalid status ${newStatus}`);
}
const all = this._loadAll();
const idx = all.findIndex(i => i.id === id);
if (idx === -1) {
throw new Error(`Queue item ${id} not found`);
}
const current = all[idx];

// Attestation: verify signature via VerifierWrapper (deterministic path)
if (Queue._verifierWrapper) {
if (current.signature) {
const v = await Queue._verifierWrapper.verify(current);
if (!v.valid) {
throw new Error(`Signature verification failed for item ${id}: ${v.reason || v.error || 'unknown'}`);
}
} else if (current.hmac) {
const verifier = Queue._verifierWrapper.verifier;
} else {
throw new Error(`Queue item ${id} missing required signature - HMAC fallback removed`);
}
}

if (current.status !== 'pending') {
throw new Error(`Only pending items can be transitioned (current: ${current.status})`);
}
all[idx].status = newStatus;
if (resolution) all[idx].resolution = resolution;

// Re-sign the updated item to reflect new status (attest the state change)
if (Queue._signer && Queue._keyManager) {
try {
const passphrase = process.env.LANE_KEY_PASSPHRASE;
if (!passphrase) throw new Error('LANE_KEY_PASSPHRASE not set');
const privateKey = Queue._keyManager.loadPrivateKey(passphrase);
const publicKeyInfo = Queue._keyManager.getPublicKeyInfo();
if (!publicKeyInfo) throw new Error('Public key info not available');
const keyId = publicKeyInfo.key_id;

const resigned = Queue._signer.signQueueItem(all[idx], privateKey, keyId);
all[idx] = resigned;
} catch (e) {
console.error('[Queue] Failed to re-sign item after status change:', e.message);
throw e;
}

const tempPath = this.filePath + '.tmp';
const data = all.map(o => JSON.stringify(o)).join('\n') + '\n';
fs.writeFileSync(tempPath, data, { encoding: 'utf8' });
fs.renameSync(tempPath, this.filePath);
return all[idx];
}
}

module.exports = Queue;
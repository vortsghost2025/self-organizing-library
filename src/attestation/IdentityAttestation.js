/**
* Identity Attestation with Persistent Keys
*
* Provides lane identity and cryptographic signatures for queue items.
* Keys are persisted to disk so identity survives process restarts.
*
* Architecture:
* - Each lane has its own signing key stored in <lane_root>/.identity/keys.json
* - Keys are generated once and reused across sessions
* - Signature verification proves message came from specific lane
*/

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class IdentityManager {
constructor(options = {}) {
// Load lane identity from environment; default to unknown
this.laneId = process.env.LANE_NAME || 'unknown';

// Determine key storage path
// Priority: LANE_IDENTITY_PATH env > options.identityPath > default location
this.identityPath = process.env.LANE_IDENTITY_PATH ||
options.identityPath ||
this._getDefaultIdentityPath();

// Ensure identity directory exists
this._ensureIdentityDir();

// Load or generate persistent key
this.laneKey = this._loadOrCreateKey();

// Track key creation for audit
this.keyCreatedAt = this._getKeyCreationTime();
}

/**
* Get default identity storage path based on lane
*/
_getDefaultIdentityPath() {
// Map lane names to their root directories
const laneRoots = {
'archivist': 'S:/Archivist-Agent',
'swarmmind': 'S:/SwarmMind Self-Optimizing Multi-Agent AI System',
'library': 'S:/self-organizing-library'
};

const root = laneRoots[this.laneId] || process.cwd();
return path.join(root, '.identity', 'keys.json');
}

/**
* Ensure identity directory exists
*/
_ensureIdentityDir() {
const dir = path.dirname(this.identityPath);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}
}

/**
* Load existing key or generate new persistent key
*/
_loadOrCreateKey() {
// First check environment variable (for manual override)
const keyEnv = process.env.LANE_SIGNING_KEY;
if (keyEnv) {
return keyEnv;
}

// Try to load existing key from disk
if (fs.existsSync(this.identityPath)) {
try {
const data = JSON.parse(fs.readFileSync(this.identityPath, 'utf8'));
if (data.signingKey) {
return data.signingKey;
}
} catch (err) {
// Corrupted file, will regenerate
}
}

// Generate new persistent key
const newKey = crypto.randomBytes(32).toString('hex');
const keyData = {
laneId: this.laneId,
signingKey: newKey,
createdAt: new Date().toISOString(),
algorithm: 'HMAC-SHA256'
};

fs.writeFileSync(this.identityPath, JSON.stringify(keyData, null, 2), 'utf8');
return newKey;
}

/**
* Get key creation time for audit purposes
*/
_getKeyCreationTime() {
if (fs.existsSync(this.identityPath)) {
try {
const data = JSON.parse(fs.readFileSync(this.identityPath, 'utf8'));
return data.createdAt || null;
} catch (err) {
return null;
}
}
return null;
}

/**
* Sign a queue item payload (HMAC-SHA256)
* @param {object} item - Queue item to sign
* @returns {string} Hex-encoded signature
*/
sign(item) {
const signable = JSON.stringify({
id: item.id,
timestamp: item.timestamp,
origin_lane: item.origin_lane,
type: item.type,
artifact_path: item.artifact_path,
required_action: item.required_action,
payload: item.payload
});
const hmac = crypto.createHmac('sha256', this.laneKey);
hmac.update(signable);
return hmac.digest('hex');
}

/**
* Verify a queue item's signature (timing-safe compare)
* @param {object} item - Queue item with attached signature
* @param {string} signature - Signature to verify
* @returns {boolean} true if valid
*/
verify(item, signature) {
const expected = this.sign(item);
// Use timing-safe compare
return crypto.timingSafeEqual(
Buffer.from(signature, 'hex'),
Buffer.from(expected, 'hex')
);
}

/**
* Get current lane identity
*/
getLaneId() {
return this.laneId;
}

/**
* Get identity info for debugging/audit
*/
getIdentityInfo() {
return {
laneId: this.laneId,
keyCreatedAt: this.keyCreatedAt,
identityPath: this.identityPath,
keyPresent: !!this.laneKey
};
}
}

// Global singleton (lazy initialization)
let identityInstance = null;

function getIdentity(options = {}) {
if (!identityInstance) {
identityInstance = new IdentityManager(options);
}
return identityInstance;
}

/**
* Attach identity and signature to a queue item before enqueue
*/
function signQueueItem(item) {
const id = getIdentity();
const signature = id.sign(item);
return { ...item, signature };
}

/**
* Verify a queued item's signature
*/
function verifyQueueItem(item) {
if (!item.signature) {
return { valid: false, reason: 'missing_signature' };
}
const id = getIdentity();
const ok = id.verify(item, item.signature);
return { valid: ok, reason: ok ? null : 'invalid_signature' };
}

module.exports = {
IdentityManager,
getIdentity,
signQueueItem,
verifyQueueItem
};
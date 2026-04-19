/**
* Verifier.js - Phase 4.3 JWS Verification
*
* Verifies JSON Web Signatures against public keys from trust store.
* Supports HMAC→JWS migration during dual-mode period.
* ENFORCEMENT: A = B = C lane consistency check
*/

const crypto = require('crypto');
const fs = require('fs');
const { TRUST_STORE_PATH, TRUST_STORE_VERSION, VERIFY_REASON } = require('./constants');
const { stableStringify } = require('./stableStringify');

class Verifier {
constructor(options = {}) {
this.trustStorePath = options.trustStorePath || TRUST_STORE_PATH;
this.hmacCutoffDate = options.hmacCutoffDate || new Date('2026-05-19T00:00:00Z');
this._explicitLegacyMode = options.allowLegacy; // undefined, true, or false
this.trustStore = null;
this.hmacSecret = process.env.LANE_HMAC_SECRET;
this._loadTrustStore();
}

_defaultTrustStorePath() {
return TRUST_STORE_PATH;
}

_loadTrustStore() {
if (!fs.existsSync(this.trustStorePath)) {
this.trustStore = { keys: {}, migration: {} };
return;
}
try {
const raw = fs.readFileSync(this.trustStorePath, 'utf8');
this.trustStore = JSON.parse(raw);

// Schema version check
if (this.trustStore.version && this.trustStore.version !== TRUST_STORE_VERSION) {
throw new Error(`Trust store version mismatch: expected ${TRUST_STORE_VERSION}, got ${this.trustStore.version}`);
}

// Required schema check
if (!this.trustStore.keys || typeof this.trustStore.keys !== 'object') {
throw new Error('Trust store missing required "keys" object');
}

if (!this.trustStore.migration) {
this.trustStore.migration = {};
}
} catch (e) {
if (e.message.includes('version') || e.message.includes('missing')) {
throw e;
}
this.trustStore = { keys: {}, migration: {} };
}
}

reloadTrustStore() {
this._loadTrustStore();
}

_base64UrlDecode(str) {
let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
while (base64.length % 4) {
base64 += '=';
}
return Buffer.from(base64, 'base64');
}

_parseJWS(jws) {
const parts = jws.split('.');
if (parts.length !== 3) {
return null;
}
return {
header: JSON.parse(this._base64UrlDecode(parts[0]).toString('utf8')),
payload: JSON.parse(this._base64UrlDecode(parts[1]).toString('utf8')),
signature: parts[2],
signingInput: `${parts[0]}.${parts[1]}`
};
}

getPublicKey(laneId) {
const keyEntry = this.trustStore.keys?.[laneId];
if (!keyEntry) return null;
if (keyEntry.revoked_at) return null;
return keyEntry.public_key_pem;
}

verify(jws, publicKey) {
try {
const parsed = this._parseJWS(jws);
if (!parsed) return { valid: false, error: VERIFY_REASON.SIGNATURE_MISMATCH };

if (parsed.header.alg !== 'RS256') {
return { valid: false, error: VERIFY_REASON.UNSUPPORTED_ALGORITHM };
}

if (parsed.payload.exp && parsed.payload.exp < Math.floor(Date.now() / 1000)) {
return { valid: false, error: 'SIGNATURE_EXPIRED' };
}

const signature = this._base64UrlDecode(parsed.signature);
const verified = crypto.verify(
'RSA-SHA256',
Buffer.from(parsed.signingInput),
{ key: publicKey, format: 'pem' },
signature
);

if (!verified) {
return { valid: false, error: VERIFY_REASON.SIGNATURE_MISMATCH };
}

return { valid: true, payload: parsed.payload, header: parsed.header };
} catch (e) {
return { valid: false, error: VERIFY_REASON.VERIFICATION_ERROR, message: e.message };
}
}

/**
* Verify JWS against trust store with lane consistency enforcement.
* Enforces: outer lane (A) = payload.lane (B) = signed identity (C)
*
* @param {string} jws - The JWS string to verify
* @param {string} laneId - The expected lane identity (outer lane)
* @returns {object} Verification result
*/
verifyAgainstTrustStore(jws, laneId) {
// Step 1: Parse JWS to extract payload
const parsed = this._parseJWS(jws);
if (!parsed) {
return { valid: false, error: VERIFY_REASON.SIGNATURE_MISMATCH };
}

// Step 2: Check lane field presence
if (!parsed.payload.lane) {
return { valid: false, error: VERIFY_REASON.MISSING_LANE };
}

// Step 3: Enforce A = B = C invariant
if (parsed.payload.lane !== laneId) {
return {
valid: false,
error: VERIFY_REASON.LANE_MISMATCH,
note: `payload lane (${parsed.payload.lane}) differs from outer lane (${laneId})`
};
}

// Step 4: Fetch public key
const publicKey = this.getPublicKey(laneId);
if (!publicKey) {
return { valid: false, error: VERIFY_REASON.KEY_NOT_FOUND };
}

// Step 5: Crypto verification
return this.verify(jws, publicKey);
}

/**
* Normalize legacy queue item with origin_lane field.
* If item has origin_lane but no lane, copy it.
* If both exist and differ, reject.
*
* @param {object} item - Queue item to normalize
* @returns {object} Normalized item
* @throws {Error} If lane fields conflict
*/
_normalizeLaneField(item) {
if (item.lane && item.origin_lane && item.lane !== item.origin_lane) {
throw new Error(`Lane field conflict: lane="${item.lane}" vs origin_lane="${item.origin_lane}"`);
}

if (!item.lane && item.origin_lane) {
item.lane = item.origin_lane;
}

return item;
}

verifyQueueItem(item) {
// Normalize legacy field
try {
item = this._normalizeLaneField(item);
} catch (e) {
return { valid: false, error: VERIFY_REASON.LANE_MISMATCH, note: e.message };
}

if (!item.signature) {
// HMAC fallback removed - enforce JWS-only
return { valid: false, error: VERIFY_REASON.MISSING_SIGNATURE, note: 'HMAC fallback removed - SIGNATURE_REQUIRED' };
}

const laneId = item.lane || item.origin_lane;
if (!laneId) {
return { valid: false, error: VERIFY_REASON.MISSING_LANE };
}

const result = this.verifyAgainstTrustStore(item.signature, laneId);

if (result.valid) {
return { ...result, mode: 'JWS_VERIFIED' };
}

return result;
}

verifyAuditEvent(event) {
if (!event.signature) {
return { valid: true, mode: 'UNSIGNED', warning: 'Legacy audit event' };
}

const laneId = event.lane;
if (!laneId) {
return { valid: false, error: VERIFY_REASON.MISSING_LANE };
}

return this.verifyAgainstTrustStore(event.signature, laneId);
}

// isHMACAccepted() removed - HMAC fallback fully deprecated

getMigrationStatus() {
// HMAC fallback removed - JWS-only enforcement active
const now = new Date();
return {
dual_mode_active: false,
hmac_accepted: false,
jws_required: true,
migration_status: 'JWS_ONLY_ENFORCED',
cutoff_date: '2026-04-01T00:00:00Z',
days_remaining: 0
};
}

getTrustStoreStats() {
const lanes = Object.keys(this.trustStore.keys || {});
const registered = lanes.filter(l => this.trustStore.keys[l]?.public_key_pem?.startsWith('-----BEGIN'));
const pending = lanes.filter(l => this.trustStore.keys[l]?.public_key_pem === 'PENDING_GENERATION');
const revoked = lanes.filter(l => this.trustStore.keys[l]?.revoked_at);

return {
total_lanes: lanes.length,
registered: registered.length,
pending: pending.length,
revoked: revoked.length,
registered_lanes: registered,
pending_lanes: pending
};
}

// verifyHMAC() removed - HMAC fallback fully deprecated

/**
* Add a trusted key at runtime (for dynamic trust updates, e.g., self-verification)
* Does NOT persist to trust store file.
* @param {string} laneId
* @param {string} publicKeyPem
* @param {string} [keyId]
*/
addTrustedKey(laneId, publicKeyPem, keyId) {
if (!this.trustStore.keys) this.trustStore.keys = {};
this.trustStore.keys[laneId] = {
public_key_pem: publicKeyPem,
key_id: keyId || null,
registered_at: new Date().toISOString(),
revoked_at: null
};
}
}

module.exports = { Verifier };
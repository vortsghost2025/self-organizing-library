/**
 * Identity Attestation with Persistent RSA Keys (JWS-only)
 *
 * Provides lane identity and cryptographic signatures for queue items.
 * Keys are persisted to disk so identity survives process restarts.
 *
 * Architecture:
 * - Each lane has its own RSA keypair stored in <lane_root>/.identity/
 * - Keys are generated once and reused across sessions
 * - JWS (RS256) signature verification proves message came from specific lane
 * - HMAC is REMOVED per JWS-only enforcement policy
 *
 * ENFORCEMENT: JWS-only (RS256). No HMAC fallback.
 */

const { Signer } = require('./Signer');
const { Verifier } = require('./Verifier');
const { KeyManager } = require('./KeyManager');
const fs = require('fs');
const path = require('path');

class IdentityManager {
  constructor(options = {}) {
    // Load lane identity from environment; default to unknown
    this.laneId = process.env.LANE_NAME || 'unknown';

    // Determine identity directory path
    // Priority: LANE_IDENTITY_PATH env > options.identityDir > default location
    this.identityDir = options.identityDir || this._getDefaultIdentityDir();

    // Initialize KeyManager for RSA key operations
    this.keyManager = new KeyManager({
      identityDir: this.identityDir,
      laneId: this.laneId
    });

    // Initialize Signer for JWS creation
    this.signer = new Signer();

    // Initialize Verifier for JWS verification (lazy - loaded when needed)
    this._verifier = null;

    // Ensure keys exist (generate if needed)
    this._ensureKeys();

    // Track key creation for audit
    this.keyCreatedAt = this._getKeyCreationTime();
  }

  /**
   * Get default identity directory based on lane
   */
  _getDefaultIdentityDir() {
    const laneRoots = {
      'archivist': 'S:/Archivist-Agent',
       'swarmmind': 'S:/SwarmMind Self-Optimizing Multi-Agent AI System',
      'library': 'S:/self-organizing-library'
    };

    const root = laneRoots[this.laneId] || process.cwd();
    return path.join(root, '.identity');
  }

  /**
   * Ensure RSA keys exist, generating if necessary
   */
  _ensureKeys() {
    if (!this.keyManager.hasKeys()) {
      const passphrase = process.env.LANE_KEY_PASSPHRASE;
      if (!passphrase) {
        console.warn('[IdentityAttestation] LANE_KEY_PASSPHRASE not set - cannot generate RSA keys. Keys must be provided externally.');
        return;
      }
      this.keyManager.initialize(passphrase);
    }
  }

  /**
   * Get Verifier instance (lazy initialization)
   */
  getVerifier() {
    if (!this._verifier) {
      this._verifier = new Verifier();
    }
    return this._verifier;
  }

  /**
   * Get key creation time for audit purposes
   */
  _getKeyCreationTime() {
    const pubKeyInfo = this.keyManager.getPublicKeyInfo();
    if (!pubKeyInfo) return null;

    // Check if key file exists to get creation time
    const publicKeyPath = path.join(this.identityDir, 'public.pem');
    if (fs.existsSync(publicKeyPath)) {
      try {
        const stat = fs.statSync(publicKeyPath);
        return stat.birthtime?.toISOString() || stat.mtime?.toISOString() || null;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  /**
   * Sign a queue item payload using JWS (RS256)
   * @param {object} item - Queue item to sign
   * @returns {object} Item with attached JWS signature
   */
  sign(item) {
    const passphrase = process.env.LANE_KEY_PASSPHRASE;
    if (!passphrase) {
      throw new Error('LANE_KEY_PASSPHRASE not set - cannot sign with JWS');
    }

    const privateKey = this.keyManager.loadPrivateKey(passphrase);
    if (!privateKey) {
      throw new Error('Private key not available - cannot sign');
    }

    const pubInfo = this.keyManager.getPublicKeyInfo();
    const keyId = pubInfo ? pubInfo.key_id : 'unknown';

    // Use Signer.signQueueItem for canonical JWS signing
    return this.signer.signQueueItem(item, privateKey, keyId);
  }

  /**
   * Verify a queue item's JWS signature
   * @param {object} item - Queue item with attached signature
   * @returns {object} Verification result { valid, reason? }
   */
  verify(item) {
    if (!item.signature) {
      return { valid: false, reason: 'missing_signature' };
    }

    const laneId = item.lane || item.origin_lane || this.laneId;
    const verifier = this.getVerifier();
    const result = verifier.verifyAgainstTrustStore(item.signature, laneId);

    if (result.valid) {
      return { valid: true, reason: null };
    }

    return { valid: false, reason: result.error || 'invalid_signature' };
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
    const pubInfo = this.keyManager.getPublicKeyInfo();
    return {
      laneId: this.laneId,
      keyCreatedAt: this.keyCreatedAt,
      identityDir: this.identityDir,
      keyPresent: this.keyManager.hasKeys(),
      algorithm: 'RS256',
      keyId: pubInfo ? pubInfo.key_id : null
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
 * Attach identity and JWS signature to a queue item before enqueue
 */
function signQueueItem(item) {
  const id = getIdentity();
  return id.sign(item);
}

/**
 * Verify a queued item's JWS signature
 */
function verifyQueueItem(item) {
  const id = getIdentity();
  return id.verify(item);
}

module.exports = {
  IdentityManager,
  getIdentity,
  signQueueItem,
  verifyQueueItem
};

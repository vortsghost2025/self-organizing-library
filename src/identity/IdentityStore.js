/**
 * IdentityStore – lightweight persistent store for the logical agent identity.
 *
 * The store lives under the repository root in a hidden `.identity` folder:
 *   .identity/
 *     current.json          – latest identity record
 *     backups/…            – previous versions (created on import)
 *     exports/…            – exported bundles for model‑switch hand‑off
 *
 * An identity object shape (minimal but extensible):
 *   {
 *     sessionId:   string,   // unique per logical session
 *     laneId:      string,   // e.g. "library"
 *     createdAt:   ISO‑8601 timestamp,
 *     events:     Array<{timestamp, type, details}>,
 *   }
 *
 * The store also provides a very small attestation mechanism so that an
 * exported bundle can be trusted by another model instance. The attestation is
 * a signed payload containing an `identityHash` and an `issuedAt` timestamp.
 * For simplicity we use a deterministic HMAC‑SHA256 with a secret key taken
 * from the environment (`IDENTITY_SIGNING_KEY`). In production the lane's private
 * key from the trust store would replace this.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IdentityStore {
  /**
   * Create an IdentityStore.
   * The constructor is backward‑compatible – callers may instantiate the class
   * with no arguments (as `load-context.js` does) or provide an explicit
   * `repoRoot`.
   * @param {Object} [opts]
   */
  constructor(opts = {}) {
    const defaultRoot = path.resolve(__dirname, '../../');
    this.repoRoot = opts.repoRoot || defaultRoot;
    this.baseDir = path.join(this.repoRoot, '.identity');
    this.currentPath = path.join(this.baseDir, 'current.json');
  }

  /** Ensure the base directory exists */
  _ensureDir() {
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  /** Load the current identity if it exists */
  load() {
    if (!fs.existsSync(this.currentPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(this.currentPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }

  /** Save an identity object as the current identity */
  save(identity) {
    this._ensureDir();
    fs.writeFileSync(this.currentPath, JSON.stringify(identity, null, 2), 'utf8');
    return identity;
  }

  /** Create a brand‑new identity record */
  initialize() {
    const sessionId = `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const laneId = this._detectLaneId();
    const identity = {
      sessionId,
      laneId,
      createdAt: new Date().toISOString(),
      events: []
    };
    return this.save(identity);
  }

  /** Detect the lane identifier using the environment or a session‑mode file */
  _detectLaneId() {
    if (process.env.LANE_ID) {
      return process.env.LANE_ID;
    }
    const modePath = path.join(this.repoRoot, '.session-mode');
    if (fs.existsSync(modePath)) {
      try {
        const raw = fs.readFileSync(modePath, 'utf8').trim();
        if (raw) return raw;
      } catch (_) {}
    }
    // Fallback default – keep deterministic but warn in logs
    console.warn('[IdentityStore] Lane ID not found, defaulting to "library"');
    return 'library';
  }

  /** Compute a stable SHA‑256 hash of any JSON‑serialisable object */
  hashObject(obj) {
    const json = JSON.stringify(obj);
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  /** Sign a payload for export verification
   * @param {string} purpose – short purpose string used in the signature
   * @param {Object} payload – data that will be signed (must be JSON‑serialisable)
   * @returns {{purpose:string, payload:Object, signature:string, issuedAt:string}}
   */
  sign(purpose, payload) {
    const secret = process.env.IDENTITY_SIGNING_KEY;
    if (!secret) {
      throw new Error('IDENTITY_SIGNING_KEY environment variable is required for signing');
    }
    const issuedAt = new Date().toISOString();
    const data = JSON.stringify({ purpose, payload, issuedAt });
    const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return { purpose, payload, signature: hmac, issuedAt };
  }

  /** Verify an attestation object produced by {@link sign}
   * @param {Object} attestation
   * @returns {{valid:boolean, reason?:string}}
   */
  verify(attestation) {
    if (!attestation || typeof attestation !== 'object') {
      return { valid: false, reason: 'malformed' };
    }
    const { purpose, payload, signature, issuedAt } = attestation;
    if (!purpose || !payload || !signature || !issuedAt) {
      return { valid: false, reason: 'missing-fields' };
    }
    const secret = process.env.IDENTITY_SIGNING_KEY;
    if (!secret) {
      return { valid: false, reason: 'signing-key-missing' };
    }
    const data = JSON.stringify({ purpose, payload, issuedAt });
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (expected !== signature) {
      return { valid: false, reason: 'signature-mismatch' };
    }
    return { valid: true };
  }

  /** Bootstrap helper used by load-context.js
   * Options:
   *   readOnlyIfMissing (bool) – when true, do not create a new identity if the
   *   file is absent; instead return { loaded:false, reason, identityPath }.
   */
  bootstrap({ readOnlyIfMissing = false } = {}) {
    this._ensureDir();
    if (fs.existsSync(this.currentPath)) {
      const identity = this.load();
      return { loaded: true, identity, identityPath: this.currentPath };
    }
    if (readOnlyIfMissing) {
      return { loaded: false, reason: 'identity file missing', identityPath: this.currentPath };
    }
    const identity = this.initialize();
    return { loaded: true, identity, identityPath: this.currentPath };
  }
}

module.exports = { IdentityStore };

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
 * exported bundle can be trusted by another model instance.  The attestation is
 * a signed payload containing an `identityHash` and an `issuedAt` timestamp.
 * For simplicity we use a deterministic HMAC‑SHA256 with a secret key taken
 * from the environment (`IDENTITY_SIGNING_KEY`).  In a production setting the
 * lane's private key from the trust store would be used instead.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IdentityStore {
  /**
   * @param {Object} opts
   * @param {string} opts.repoRoot – absolute path to the repository root
   */
  constructor({ repoRoot }) {
    this.repoRoot = repoRoot;
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
    const laneId = process.env.LANE_ID || 'library';
    const identity = {
      sessionId,
      laneId,
      createdAt: new Date().toISOString(),
      events: []
    };
    return this.save(identity);
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
    const secret = process.env.IDENTITY_SIGNING_KEY || 'default‑insecure‑key';
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
    const secret = process.env.IDENTITY_SIGNING_KEY || 'default‑insecure‑key';
    const data = JSON.stringify({ purpose, payload, issuedAt });
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (expected !== signature) {
      return { valid: false, reason: 'signature-mismatch' };
    }
    return { valid: true };
  }
}

module.exports = { IdentityStore };

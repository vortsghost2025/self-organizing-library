/**
 * Attestation Support - RSA-2048 signature verification for Library
 * 
 * Library acts as verification-preserving memory layer, NOT signature-erasing storage.
 * 
 * Responsibilities:
 * - Load public keys from Archivist trust store
 * - Verify incoming queue items and signed artifacts
 * - Preserve signature metadata with stored artifacts
 * - Reject invalid signatures according to migration mode
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch'); // HTTP client for reporting failures
const { ARCHIVIST_ORCHESTRATOR_URL, ORCHESTRATOR_REQUEST_TIMEOUT_MS } = require('./constants');
const { QuarantineManager } = require('./QuarantineManager');

class AttestationSupport {
  constructor(options = {}) {
    this.trustStorePath = options.trustStorePath || 'S:/Archivist-Agent/.trust/keys.json';
    this.migrationMode = options.migrationMode || 'dual'; // dual | hmac-only | rsa-only
    this.trustStore = null;
    this.verifiedArtifacts = [];
    this.quarantineManager = new QuarantineManager();
    
    this._loadTrustStore();
  }

  /**
   * Load public keys from Archivist trust store
   */
  _loadTrustStore() {
    if (!fs.existsSync(this.trustStorePath)) {
      console.warn('[ATTESTATION] Trust store not found at:', this.trustStorePath);
      this.trustStore = { keys: {} };
      return;
    }

    try {
      const raw = fs.readFileSync(this.trustStorePath, 'utf8');
      this.trustStore = JSON.parse(raw);
      console.log('[ATTESTATION] Trust store loaded:', Object.keys(this.trustStore.keys || {}).join(', '));
    } catch (err) {
      console.error('[ATTESTATION] Failed to load trust store:', err.message);
      this.trustStore = { keys: {} };
    }
  }

  /**
   * Get public key for a lane
   */
  getPublicKey(laneId) {
    const keyEntry = this.trustStore.keys[laneId];
    if (!keyEntry) {
      return null;
    }
    return keyEntry.public_key_pem;
  }

  /**
   * Verify a signature
   */
  verify(payload, signature, laneId, algorithm = 'rsa-sha256') {
    const publicKeyPem = this.getPublicKey(laneId);
    
    if (!publicKeyPem) {
      return {
        valid: false,
        reason: 'NO_TRUST_STORE_ENTRY',
        lane: laneId
      };
    }

    // Check migration mode
    if (this.migrationMode === 'hmac-only') {
      return {
        valid: true,
        reason: 'MIGRATION_HMAC_ONLY',
        lane: laneId,
        note: 'Skipping RSA verification in HMAC-only mode'
      };
    }

    try {
        const algoMap = { 'rsa-sha256': 'RSA-SHA256' };
        const algoId = algoMap[algorithm] || algorithm.toUpperCase();
        const verifier = crypto.createVerify(algoId);
        verifier.update(JSON.stringify(payload));
        const isValid = verifier.verify(publicKeyPem, signature, 'base64');
      
      return {
        valid: isValid,
        reason: isValid ? 'VERIFIED' : 'SIGNATURE_MISMATCH',
        lane: laneId,
        algorithm
      };
    } catch (err) {
      return {
        valid: false,
        reason: 'VERIFICATION_ERROR',
        lane: laneId,
        error: err.message
      };
    }
  }

  /**
   * Verify queue item
   */
  async verifyQueueItem(item) {
    if (!item.signature) {
      const result = { valid: false, reason: 'NO_SIGNATURE', itemId: item.id };
      // Report to Archivist before returning
      await this.reportFailureToArchivist(item, result.reason);
      return result;
    }

    const signablePayload = {
      id: item.id,
      timestamp: item.timestamp,
      origin_lane: item.origin_lane,
      type: item.type,
      artifact_path: item.artifact_path,
      required_action: item.required_action
    };

    const verificationResult = this.verify(signablePayload, item.signature, item.origin_lane);
    const reject = await this.shouldReject(verificationResult, item);
    return reject ? { ...verificationResult, rejected: true } : verificationResult;
  }

  /**
   * Verify continuity artifact
   */
  async verifyContinuityArtifact(artifact) {
    if (!artifact.attestation) {
      const result = { valid: false, reason: 'NO_ATTESTATION', artifactId: artifact.id };
      await this.reportFailureToArchivist(artifact, result.reason);
      return result;
    }

    const verificationResult = this.verify(
      artifact.payload || artifact,
      artifact.attestation.signature,
      artifact.attestation.lane
    );
    const reject = await this.shouldReject(verificationResult, artifact);
    return reject ? { ...verificationResult, rejected: true } : verificationResult;
  }

  /**
   * Preserve signature metadata with stored artifact
   */
  preserveMetadata(artifact, verificationResult) {
    return {
      ...artifact,
      _attestation: {
        verified: verificationResult.valid,
        reason: verificationResult.reason,
        lane: verificationResult.lane,
        timestamp: new Date().toISOString(),
        algorithm: verificationResult.algorithm || 'rsa-sha256'
      }
    };
  }

  /**
   * Report a verification failure to the Archivist orchestrator.
   * The payload is the original item (queue item or continuity artifact) that
   * failed verification. `outerLane` is the lane context of the Library (always
   * "library" for this code base).
   */
  async reportFailureToArchivist(item, failureReason) {
    try {
      const response = await fetch(ARCHIVIST_ORCHESTRATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: ORCHESTRATOR_REQUEST_TIMEOUT_MS,
        body: JSON.stringify({
          outerLane: 'library',
          payload: item,
          signature: item.signature || (item.attestation && item.attestation.signature),
          failureReason
        })
      });
      const json = await response.json();
      // Record locally for audit and retry tracking
      this.quarantineManager.quarantine(item, failureReason, json.nextRetryIn);
      return json;
    } catch (err) {
      console.error('[ATTESTATION] Failed to report to Archivist orchestrator:', err.message);
      return { status: 'REPORT_ERROR', error: err.message };
    }
  }

  /**
   * Check if artifact should be rejected. If rejection is needed, report to
   * the Archivist orchestrator first.
   */
  async shouldReject(verificationResult, item) {
    if (!verificationResult.valid) {
      if (this.migrationMode === 'hmac-only') {
        return false; // Accept in HMAC-only mode
      }
      await this.reportFailureToArchivist(item, verificationResult.reason);
      return true;
    }
    return false;
  }

  /**
   * Get trust store status
   */
  getTrustStoreStatus() {
    return {
        loaded: !!this.trustStore,
        keyCount: Object.keys(this.trustStore.keys || {}).length,
        keys: Object.keys(this.trustStore.keys || {}),
        migrationMode: this.migrationMode,
        migration: this.trustStore.migration || null
    };
  }
}

module.exports = { AttestationSupport };

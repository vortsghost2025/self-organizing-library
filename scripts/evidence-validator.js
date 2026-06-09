// evidence-validator.js
// Validates that evidence claims are backed by actual artifacts
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Validate evidence claims in a message
 * @param {Object} msg - The lane message to validate
 * @returns {Object} Validation result
 */
function validateEvidence(msg) {
  // If evidence is not required, validation passes
  if (!msg.evidence || msg.evidence.required !== true) {
    return { valid: true, reason: 'EVIDENCE_NOT_REQUIRED' };
  }

  // Check if evidence_path exists
  if (!msg.evidence_exchange || !msg.evidence_exchange.artifact_path) {
    return {
      valid: false,
      reason: 'EVIDENCE_REQUIRED_NO_ARTIFACT',
      detail: 'evidence.required=true but no evidence_exchange.artifact_path provided'
    };
  }

  // Resolve the artifact path
  const artifactPath = path.resolve(
    process.env.LANE_ROOT || path.join(__dirname, '..', '..'),
    msg.evidence_exchange.artifact_path
  );

  // Check if file exists
  if (!fs.existsSync(artifactPath)) {
    return {
      valid: false,
      reason: 'EVIDENCE_ARTIFACT_MISSING',
      detail: `Evidence artifact not found: ${msg.evidence_exchange.artifact_path}`
    };
  }

  // Check if file is not empty
  const stats = fs.statSync(artifactPath);
  if (stats.size === 0) {
    return {
      valid: false,
      reason: 'EVIDENCE_ARTIFACT_EMPTY',
      detail: `Evidence artifact is empty: ${msg.evidence_exchange.artifact_path}`
    };
  }

  // Optional: Basic content validation for JSON files
  if (artifactPath.endsWith('.json')) {
    try {
      const content = fs.readFileSync(artifactPath, 'utf8');
      JSON.parse(content); // Will throw if invalid JSON
    } catch (e) {
      return {
        valid: false,
        reason: 'EVIDENCE_ARTIFACT_INVALID_JSON',
        detail: `Evidence artifact contains invalid JSON: ${e.message}`
      };
    }
  }

  // Validation passed
  return {
    valid: true,
    reason: 'EVIDENCE_VALID',
    artifactPath: artifactPath
  };
}

module.exports = { validateEvidence };

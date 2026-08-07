/**
 * outcome.js - Attestation outcome factory
 *
 * Provides standardized outcome objects for verification results.
 */

function success(payload) {
  return { status: 'success', payload };
}

function quarantine(reason, payload) {
  return { status: 'quarantine', reason, payload };
}

function defer(reason, payload) {
  return { status: 'defer', reason, payload };
}

module.exports = {
  success,
  quarantine,
  defer
};

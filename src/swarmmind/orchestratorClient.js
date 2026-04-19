/**
 * SwarmMind Orchestrator Client
 *
 * Sends verification‑failure payloads to the Archivist orchestrator and interprets
 * the response. If the orchestrator returns a `nextRetryIn` (milliseconds) the
 * client schedules a retry via `setTimeout`. The actual retry logic is a placeholder
 * – callers can replace `retryCallback` with their verification routine.
 */

const fetch = require('node-fetch');
const { ARCHIVIST_ORCHESTRATOR_URL, ORCHESTRATOR_REQUEST_TIMEOUT_MS } = require('../attestation/constants');

/**
 * Posts a failure report to the orchestrator.
 * @param {Object} payload – Original artefact (queue item or continuity artifact).
 * @param {string} failureReason – Human‑readable reason for the failure.
 * @param {Function} retryCallback – Function to invoke when a retry is scheduled.
 * @returns {Promise<Object>} Parsed JSON response from the orchestrator.
 */
async function reportFailure(payload, failureReason, retryCallback) {
  try {
    const response = await fetch(ARCHIVIST_ORCHESTRATOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: ORCHESTRATOR_REQUEST_TIMEOUT_MS,
      body: JSON.stringify({
        outerLane: 'swarmmind',
        payload,
        signature: payload.signature || (payload.attestation && payload.attestation.signature),
        failureReason
      })
    });
    const json = await response.json();

    // If orchestrator suggests a back‑off, schedule a retry.
    if (json.status && json.status !== 'OK' && json.nextRetryIn) {
      const delay = Number(json.nextRetryIn);
      if (typeof retryCallback === 'function' && !isNaN(delay)) {
        setTimeout(() => {
          try { retryCallback(payload); } catch (e) { console.error('Retry callback error:', e); }
        }, delay);
      }
    }
    return json;
  } catch (err) {
    console.error('[SwarmMind OrchestratorClient] request failed:', err.message);
    return { status: 'COMM_ERROR', error: err.message };
  }
}

module.exports = { reportFailure };

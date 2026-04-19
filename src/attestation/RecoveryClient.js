/**
* RecoveryClient.js - Phase 4.4 Recovery Orchestrator Client
*
* HTTP client for posting failed artifacts to Archivist's RecoveryEngine.
* Implements the recovery flow: identity checks → crypto verification → quarantine loop.
*
* ENDPOINTS:
* - POST /orchestrate/recovery — Submit failed artifacts
* - GET /orchestrate/health — Health check
*/

const http = require('http');
const https = require('https');
const { VERIFY_REASON } = require('./constants');

class RecoveryClient {
constructor(options = {}) {
this.host = options.host || 'localhost';
this.port = options.port || 3000;
this.protocol = options.protocol || 'http';
this.timeout = options.timeout || 30000;
this.maxRetries = options.maxRetries || 3;
this.retryBackoffMs = options.retryBackoffMs || 1000;
}

/**
* Submit a failed artifact to the RecoveryEngine.
*
* @param {object} artifact - The failed artifact
* @param {string} outerLane - The lane that submitted this artifact
* @param {string} failureReason - Why verification failed
* @param {object} debugContext - Additional debug information
* @returns {Promise<object>} Recovery result
*/
async submitRecovery(artifact, outerLane, failureReason, debugContext = {}) {
const payload = {
artifact,
outerLane,
failureReason,
debugContext: {
...debugContext,
submittedAt: new Date().toISOString(),
submittedBy: process.env.LANE_NAME || 'unknown'
}
};

return this._request('POST', '/orchestrate/recovery', payload);
}

/**
* Check health of the orchestrator.
*
* @returns {Promise<object>} Health status
*/
async healthCheck() {
return this._request('GET', '/orchestrate/health');
}

async _request(method, path, body = null) {
return new Promise((resolve, reject) => {
const isHttps = this.protocol === 'https';
const httpModule = isHttps ? https : http;

const options = {
hostname: this.host,
port: this.port,
path: path,
method: method,
headers: {
'Content-Type': 'application/json'
},
timeout: this.timeout
};

const req = httpModule.request(options, (res) => {
let data = '';
res.on('data', chunk => { data += chunk; });
res.on('end', () => {
try {
const parsed = JSON.parse(data);
resolve({
statusCode: res.statusCode,
body: parsed
});
} catch (e) {
resolve({
statusCode: res.statusCode,
body: data,
parseError: e.message
});
}
});
});

req.on('error', (e) => {
reject(new Error(`RecoveryClient request failed: ${e.message}`));
});

req.on('timeout', () => {
req.destroy();
reject(new Error('RecoveryClient request timeout'));
});

if (body) {
req.write(JSON.stringify(body));
}

req.end();
});
}

/**
* Submit recovery with automatic retry on network failure.
*
* @param {object} artifact - The failed artifact
* @param {string} outerLane - The lane that submitted this artifact
* @param {string} failureReason - Why verification failed
* @param {object} debugContext - Additional debug information
* @returns {Promise<object>} Recovery result
*/
async submitRecoveryWithRetry(artifact, outerLane, failureReason, debugContext = {}) {
let lastError = null;

for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
try {
const result = await this.submitRecovery(artifact, outerLane, failureReason, {
...debugContext,
retryAttempt: attempt
});

// Network-level success
if (result.statusCode >= 200 && result.statusCode < 300) {
return result.body;
}

// Client error (4xx) - don't retry
if (result.statusCode >= 400 && result.statusCode < 500) {
return result.body;
}

// Server error (5xx) - retry
lastError = new Error(`Server error: ${result.statusCode}`);
} catch (e) {
lastError = e;
}

// Backoff before retry
if (attempt < this.maxRetries) {
await this._sleep(this.retryBackoffMs * attempt);
}
}

// All retries failed
throw lastError || new Error('RecoveryClient max retries exceeded');
}

_sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}
}

/**
* Integration helper for VerifierWrapper.
* On verification failure, automatically submit to RecoveryEngine.
*
* @param {VerifierWrapper} wrapper - The VerifierWrapper instance
* @param {RecoveryClient} client - The RecoveryClient instance
* @param {object} item - The item that failed verification
* @param {string} outerLane - The lane that submitted the item
* @param {object} result - The verification result (must be invalid)
* @returns {Promise<object>} Recovery result
*/
async function submitToRecoveryEngine(wrapper, client, item, outerLane, result) {
if (result.valid) {
throw new Error('Cannot submit valid item to recovery engine');
}

const failureReason = result.reason || result.error || 'UNKNOWN';

const debugContext = {
verificationError: result.error,
note: result.note,
retryCount: result.retryCount,
itemId: result.itemId || item.id
};

return client.submitRecoveryWithRetry(item, outerLane, failureReason, debugContext);
}

module.exports = {
RecoveryClient,
submitToRecoveryEngine
};
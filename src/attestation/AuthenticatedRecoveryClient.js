/**
* AuthenticatedRecoveryClient.js - Phase 4.4 Authenticated Recovery Client
*
* HTTP client with HMAC authentication for posting failed artifacts to Archivist.
* Prevents spoofed failure reports from malicious internal components.
*
* USAGE:
* const client = new AuthenticatedRecoveryClient({
* host: 'localhost',
* port: 3000,
* sharedSecret: process.env.ARCHIVIST_ORCH_TOKEN
* });
*/

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { VERIFY_REASON } = require('./constants');

class AuthenticatedRecoveryClient {
constructor(options = {}) {
this.host = options.host || 'localhost';
this.port = options.port || 3000;
this.protocol = options.protocol || 'http';
this.timeout = options.timeout || 30000;
this.maxRetries = options.maxRetries || 3;
this.retryBackoffMs = options.retryBackoffMs || 1000;

// Authentication
this.sharedSecret = options.sharedSecret || process.env.ARCHIVIST_ORCH_TOKEN;
if (!this.sharedSecret) {
console.warn('[AuthenticatedRecoveryClient] No shared secret configured - requests will be unauthenticated');
}

this.laneId = process.env.LANE_NAME || 'unknown';
}

/**
* Generate HMAC signature for request authentication.
* @param {string} method - HTTP method
* @param {string} path - Request path
* @param {object} body - Request body
* @param {string} timestamp - ISO timestamp
* @returns {string} HMAC signature (hex)
*/
_signRequest(method, path, body, timestamp) {
if (!this.sharedSecret) return '';

const payload = `${method}:${path}:${timestamp}:${JSON.stringify(body)}`;
return crypto.createHmac('sha256', this.sharedSecret)
.update(payload)
.digest('hex');
}

/**
* Submit a failed artifact to the RecoveryEngine with authentication.
*
* @param {object} artifact - The failed artifact
* @param {string} outerLane - The lane that submitted this artifact
* @param {string} failureReason - Why verification failed
* @param {object} debugContext - Additional debug information
* @returns {Promise<object>} Recovery result
*/
async submitRecovery(artifact, outerLane, failureReason, debugContext = {}) {
const timestamp = new Date().toISOString();
const payload = {
artifact,
outerLane,
failureReason,
debugContext: {
...debugContext,
submittedAt: timestamp,
submittedBy: this.laneId
}
};

const path = '/orchestrate/recovery';
const signature = this._signRequest('POST', path, payload, timestamp);

return this._request('POST', path, payload, {
'X-Archivist-Signature': signature,
'X-Archivist-Timestamp': timestamp,
'X-Archivist-Lane': this.laneId
});
}

/**
* Check health of the orchestrator.
*
* @returns {Promise<object>} Health status
*/
async healthCheck() {
return this._request('GET', '/orchestrate/health');
}

async _request(method, path, body = null, extraHeaders = {}) {
return new Promise((resolve, reject) => {
const isHttps = this.protocol === 'https';
const httpModule = isHttps ? https : http;

const options = {
hostname: this.host,
port: this.port,
path: path,
method: method,
headers: {
'Content-Type': 'application/json',
...extraHeaders
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
reject(new Error(`AuthenticatedRecoveryClient request failed: ${e.message}`));
});

req.on('timeout', () => {
req.destroy();
reject(new Error('AuthenticatedRecoveryClient request timeout'));
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
throw lastError || new Error('AuthenticatedRecoveryClient max retries exceeded');
}

_sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}
}

module.exports = { AuthenticatedRecoveryClient };
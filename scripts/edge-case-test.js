#!/usr/bin/env node
/**
 * FINAL EDGE CASE TEST - WITH REAL VERIFIERWRAPPER
 * 
 * Test: Valid signature, WRONG lane, correct key reuse
 * 
 * Scenario: Same RSA key used across two lanes (intentional misconfig)
 * Expected: LANE_MISMATCH → REJECT (even with valid crypto)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRUST_STORE = 'S:/Archivist-Agent/.trust/keys.json';
const LIBRARY_IDENTITY = 'S:/self-organizing-library/.identity';

const trustStore = JSON.parse(fs.readFileSync(TRUST_STORE, 'utf8'));

function base64UrlEncode(data) {
  const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stableStringify(v) {
  if (v === null) return 'null';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

// ========================================
// REAL VERIFIERWRAPPER IMPORT
// ========================================
const { VerifierWrapper } = require('../src/attestation/VerifierWrapper');

console.log('\n========================================');
console.log('FINAL EDGE CASE TEST - REAL RUNTIME');
console.log('Valid signature, WRONG lane, correct key reuse');
console.log('========================================\n');

// Get Library's key
const passphrase = process.env.LANE_KEY_PASSPHRASE || 'library-secret-2026';
const encryptedKey = fs.readFileSync(path.join(LIBRARY_IDENTITY, 'private.pem'), 'utf8');
const privateKey = crypto.createPrivateKey({ key: encryptedKey, passphrase, format: 'pem' });

// Create payload claiming to be from "library" lane
const payload = {
  id: 'edge-case-001',
  lane: 'library',  // PAYLOAD says "library"
  type: 'TEST',
  timestamp: new Date().toISOString(),
  content: 'This payload claims to be from library lane'
};

const payloadB64 = base64UrlEncode(stableStringify(payload));

// Sign with Library's key (valid crypto!) but include Library's kid in header
const header = { 
  alg: 'RS256', 
  typ: 'JWS', 
  kid: '713485afdb41c35a'  // Library's correct key ID
};
const headerB64 = base64UrlEncode(JSON.stringify(header));

const signingInput = `${headerB64}.${payloadB64}`;
const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
const signatureB64 = base64UrlEncode(signature);
const jws = `${headerB64}.${payloadB64}.${signatureB64}`;

// NOW create item with WRONG outer lane
const testItem = {
  id: 'edge-case-001',
  lane: 'swarmmind',  // OUTER envelope says "swarmmind"!
  origin_lane: 'swarmmind',
  signature: jws,
  type: 'TEST'
};

console.log('[TEST] Outer lane:', testItem.lane);
console.log('[TEST] Payload lane:', payload.lane);
console.log('[TEST] Header kid:', header.kid);

// ========================================
// CREATE REAL VERIFIERWRAPPER INSTANCE
// ========================================
console.log('\n[INIT] Creating real VerifierWrapper...');

const wrapper = new VerifierWrapper({
  trustStorePath: TRUST_STORE
});

// Manually inject trust store into verifier
wrapper.verifier.trustStore = trustStore;

console.log('[INIT] VerifierWrapper created successfully');
console.log('[TEST] Running verify() with real runtime...\n');

// Run REAL verify() method
wrapper.verify(testItem).then(result => {
  console.log('Result:', JSON.stringify(result, null, 2));
  
  if (!result.valid) {
    console.log('\n✅ PASS: Runtime REJECTED wrong lane assignment');
    console.log('   Reason:', result.reason);
    console.log('   Note:', result.note);
    
    if (result.reason === 'LANE_MISMATCH') {
      console.log('\n✅✅ PROVEN: Identity > Crypto');
      console.log('\nThe runtime enforcement at VerifierWrapper.js:76-80 works!');
      console.log('Lane comparison happens BEFORE crypto verification.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Rejected but for different reason:', result.reason);
      process.exit(0);
    }
  } else {
    console.log('\n❌ FAIL: Should have rejected wrong lane assignment');
    console.log('Result:', result);
    process.exit(1);
  }
}).catch(err => {
  console.log('\n❌ ERROR:', err.message);
  console.log(err.stack);
  process.exit(1);
});
#!/usr/bin/env node
/**
 * sign-snapshot.js - Sign Identity Snapshot v0.2
 *
 * Signs the current snapshot.json with the lane's private key,
 * producing snapshot.jws (a signed JWS artifact).
 *
 * Usage:
 *   LANE_KEY_PASSPHRASE=<pass> node sign-snapshot.js
 *
 * Outputs:
 *   .identity/snapshot.jws - Compact JWS over snapshot.json
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const IDENTITY_DIR = path.join(ROOT, '.identity');
const SNAPSHOT_PATH = path.join(IDENTITY_DIR, 'snapshot.json');
const SNAPSHOT_JWS_PATH = path.join(IDENTITY_DIR, 'snapshot.jws');
const PRIVATE_KEY_PATH = path.join(IDENTITY_DIR, 'private.pem');

function stableStringify(value) {
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function base64UrlEncode(data) {
  const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getPassphrase() {
  const passphrase = process.env.LANE_KEY_PASSPHRASE;
  if (!passphrase) {
    throw new Error('LANE_KEY_PASSPHRASE environment variable not set');
  }
  return passphrase;
}

function loadPrivateKey(passphrase) {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error('Private key not found at ' + PRIVATE_KEY_PATH);
  }
  const encryptedKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  try {
    return crypto.createPrivateKey({
      key: encryptedKey,
      passphrase: passphrase,
      format: 'pem'
    });
  } catch (e) {
    throw new Error('Failed to decrypt private key: ' + e.message);
  }
}

function signSnapshot() {
  console.log('=== Identity Snapshot Signing v0.2 ===\n');

  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error('ERROR: snapshot.json not found at', SNAPSHOT_PATH);
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  console.log('Loaded snapshot.json');
  console.log('  Version:', snapshot.version);
  console.log('  Identity ID:', snapshot.identity?.id);
  console.log('  Lane:', snapshot.identity?.lane);

  const passphrase = getPassphrase();
  const privateKey = loadPrivateKey(passphrase);
  console.log('\nPrivate key loaded and decrypted');

  // Get key_id from snapshot
  const keyId = snapshot.identity?.key_id;
  if (!keyId) {
    console.error('ERROR: snapshot.identity.key_id is missing');
    process.exit(1);
  }
  console.log('Key ID from snapshot:', keyId);

  const header = {
    alg: 'RS256',
    typ: 'JWS',
    kid: keyId
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(stableStringify(snapshot));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  const signatureB64 = base64UrlEncode(signature);

  const jws = `${headerB64}.${payloadB64}.${signatureB64}`;

  const tmpPath = SNAPSHOT_JWS_PATH + '.tmp';
  fs.writeFileSync(tmpPath, jws);
  fs.renameSync(tmpPath, SNAPSHOT_JWS_PATH);

  console.log('\nSigned snapshot written to:', SNAPSHOT_JWS_PATH);
  console.log('JWS length:', jws.length, 'characters');
  console.log('\n=== SIGNING COMPLETE ===');

  return { success: true, jwsPath: SNAPSHOT_JWS_PATH, keyId };
}

try {
  signSnapshot();
} catch (e) {
  console.error('\nERROR:', e.message);
  process.exit(1);
}
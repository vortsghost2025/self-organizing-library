#!/usr/bin/env node
/**
 * Generate RSA-2048 identity keys for SwarmMind lane
 * Usage: LANE_KEY_PASSPHRASE=<passphrase> node scripts/generate-swarmmind-keys.js
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LANE_ID = 'swarmmind';
const IDENTITY_DIR = 'S:/SwarmMind Self-Optimizing Multi-Agent AI System/.identity';
const PUBLIC_KEY_PATH = path.join(IDENTITY_DIR, 'public.pem');
const PRIVATE_KEY_PATH = path.join(IDENTITY_DIR, 'private.pem');

const passphrase = process.env.LANE_KEY_PASSPHRASE;
if (!passphrase) {
  console.error('ERROR: LANE_KEY_PASSPHRASE environment variable is required');
  process.exit(1);
}

// Create identity directory if it doesn't exist
if (!fs.existsSync(IDENTITY_DIR)) {
  fs.mkdirSync(IDENTITY_DIR, { recursive: true });
  console.log(`Created directory: ${IDENTITY_DIR}`);
}

// Check if keys already exist
if (fs.existsSync(PUBLIC_KEY_PATH) && fs.existsSync(PRIVATE_KEY_PATH)) {
  console.log('Keys already exist. Verifying...');
  const existingPub = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  const keyId = crypto.createHash('sha256').update(existingPub).digest('hex').substring(0, 16);
  console.log(`Existing key_id: ${keyId}`);
  process.exit(0);
}

// Generate RSA-2048 key pair
console.log('Generating RSA-2048 key pair for SwarmMind...');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: passphrase,
  },
});

// Write keys
fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf8');
fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, 'utf8');
console.log(`Public key written: ${PUBLIC_KEY_PATH}`);
console.log(`Private key written: ${PRIVATE_KEY_PATH}`);

// Compute key_id (first 16 hex chars of SHA-256 of public key PEM)
const keyId = crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 16);
console.log(`Key ID: ${keyId}`);

// Export for trust store registration
const exportData = {
  lane_id: LANE_ID,
  key_id: keyId,
  public_key_pem: publicKey,
  registered_at: new Date().toISOString(),
  algorithm: 'RS256',
  key_size: 2048,
};

const exportPath = path.join(IDENTITY_DIR, 'export-for-trust-store.json');
fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
console.log(`Export written: ${exportPath}`);
console.log('\nNOTE: The key_id must be compared against the existing trust store entry.');
console.log('If it does not match, the trust store entry needs to be updated.');

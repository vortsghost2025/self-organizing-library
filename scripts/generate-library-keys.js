#!/usr/bin/env node
/**
 * Generate Library RSA Key Pair
 * 
 * Creates the Library's RSA-2048 key pair and exports the public key
 * for registration in the Archivist trust store.
 * 
 * Usage:
 *   LANE_KEY_PASSPHRASE=<secret> node scripts/generate-library-keys.js
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const KEY_SIZE = 2048;
const IDENTITY_DIR = path.join(__dirname, '..', '.identity');
const TRUST_PENDING_DIR = 'S:/Archivist-Agent/.trust/pending';

function generateKeyPair(passphrase) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: KEY_SIZE,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: passphrase
    }
  });
  
  return { publicKey, privateKey };
}

function generateKeyId(publicKey) {
  return crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 16);
}

function main() {
  console.log('\n=== Library Key Generation ===\n');
  
  // Check passphrase
  const passphrase = process.env.LANE_KEY_PASSPHRASE;
  if (!passphrase) {
    console.error('ERROR: LANE_KEY_PASSPHRASE environment variable not set');
    console.error('Usage: LANE_KEY_PASSPHRASE=<secret> node scripts/generate-library-keys.js\n');
    process.exit(1);
  }
  
  // Ensure identity directory exists
  if (!fs.existsSync(IDENTITY_DIR)) {
    fs.mkdirSync(IDENTITY_DIR, { recursive: true });
  }
  
  // Check if keys already exist
  const publicKeyPath = path.join(IDENTITY_DIR, 'public.pem');
  const privateKeyPath = path.join(IDENTITY_DIR, 'private.pem');
  
  if (fs.existsSync(publicKeyPath) && fs.existsSync(privateKeyPath)) {
    console.log('Keys already exist at:', IDENTITY_DIR);
    console.log('Public key path:', publicKeyPath);
    
    // Read existing public key and generate key ID
    const existingPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
    const existingKeyId = generateKeyId(existingPublicKey);
    
    console.log('\nExisting Key ID:', existingKeyId);
    console.log('\nTo register in Archivist trust store:');
    console.log('1. Copy public key to:', TRUST_PENDING_DIR);
    console.log('2. Archivist will verify and add to keys.json\n');
    
    // Export to pending directory
    exportPublicKey(existingPublicKey, existingKeyId);
    
    return;
  }
  
  // Generate new keys
  console.log('Generating new RSA-2048 key pair...');
  const { publicKey, privateKey } = generateKeyPair(passphrase);
  const keyId = generateKeyId(publicKey);
  
  // Save keys
  fs.writeFileSync(publicKeyPath, publicKey, 'utf8');
  fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
  
  console.log('✓ Keys generated successfully');
  console.log('  Public key:', publicKeyPath);
  console.log('  Private key:', privateKeyPath);
  console.log('  Key ID:', keyId);
  
  // Export public key for Archivist
  exportPublicKey(publicKey, keyId);
  
  console.log('\n✅ Library key generation complete\n');
}

function exportPublicKey(publicKey, keyId) {
  // Ensure pending directory exists
  if (!fs.existsSync(TRUST_PENDING_DIR)) {
    fs.mkdirSync(TRUST_PENDING_DIR, { recursive: true });
  }
  
  // Create export bundle
  const exportData = {
    lane_id: 'library',
    key_id: keyId,
    public_key_pem: publicKey,
    registered_at: new Date().toISOString(),
    algorithm: 'RS256',
    key_size: KEY_SIZE
  };
  
  const exportPath = path.join(TRUST_PENDING_DIR, 'library.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
  
  console.log('\n✓ Public key exported to:', exportPath);
  console.log('  Key ID:', keyId);
  console.log('\nArchivist must now:');
  console.log('  1. Verify the key fingerprint');
  console.log('  2. Add to S:/Archivist-Agent/.trust/keys.json');
  console.log('  3. Remove placeholder entry and use this key\n');
}

main();

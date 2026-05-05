#!/usr/bin/env node
/**
 * Sign and deliver a Library outbox message to Archivist inbox
 * Usage: LANE_KEY_PASSPHRASE=<pass> node scripts/sign-and-deliver.js <outbox-file> <target-inbox-dir>
 */

const { Signer } = require('../src/attestation/Signer');
const { KeyManager } = require('../src/attestation/KeyManager');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function deriveKeyId(publicKeyPem) {
  return crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);
}

function main() {
  const [msgPath, targetDir] = process.argv.slice(2);
  if (!msgPath || !targetDir) {
    console.error('Usage: node scripts/sign-and-deliver.js <outbox-file> <target-inbox-dir>');
    process.exit(1);
  }

  const passphrase = process.env.LANE_KEY_PASSPHRASE;
  if (!passphrase) {
    console.error('ERROR: LANE_KEY_PASSPHRASE not set');
    process.exit(1);
  }

  // Read file, strip provenance/comments, parse JSON
  let raw = fs.readFileSync(msgPath, 'utf8');
  // Remove leading non-JSON lines (OUTPUT_PROVENANCE, ## comments, blank lines)
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) {
    console.error('ERROR: No JSON object found in file');
    process.exit(1);
  }
  const jsonStr = raw.substring(jsonStart);
  const message = JSON.parse(jsonStr);

  // Strip any _lane_worker metadata to prevent cross-session rejection
  if (message._lane_worker) {
    delete message._lane_worker;
  }

  const keyManager = new KeyManager({
    laneId: 'library',
    identityDir: path.resolve('.identity')
  });

  const privateKey = keyManager.loadPrivateKey(passphrase);
  const publicKeyPem = keyManager.loadPublicKey();
  const keyId = deriveKeyId(publicKeyPem);

  const signer = new Signer();

  const signedMessage = signer.signInboxMessage(message, privateKey, keyId);

  const filename = path.basename(msgPath);
  const targetPath = path.join(targetDir, filename);
  fs.writeFileSync(targetPath, JSON.stringify(signedMessage, null, 2), 'utf8');

  console.log('✅ Delivered signed message to:', targetPath);
  console.log('   Key ID:', keyId);
  console.log('   From: library -> archivist');

  // Write delivery log to outbox
  const logPath = msgPath.replace(/.json$/, '.delivery-log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    delivered_at: new Date().toISOString(),
    source: msgPath,
    destination: targetPath,
    key_id: keyId,
    status: 'delivered'
  }, null, 2));
  console.log('📝 Delivery log:', logPath);
}

main();

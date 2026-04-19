#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { IdentityStore } = require('../src/identity/IdentityStore');

function argValue(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function resolveInputPath() {
  return argValue('--in') || process.argv[2] || null;
}

function run() {
  const inputArg = resolveInputPath();
  if (!inputArg) {
    console.error('Usage: node scripts/import-identity.js --in <identity-export.json>');
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const identityStore = new IdentityStore({ repoRoot });
  const inputPath = path.resolve(inputArg);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const bundle = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!bundle.identity || !bundle.attestation) {
    throw new Error('Invalid bundle: expected { identity, attestation }');
  }

  const verifyResult = identityStore.verify(bundle.attestation);
  if (!verifyResult.valid) {
    throw new Error(`Attestation verification failed: ${verifyResult.reason}`);
  }

  const expectedIdentityHash = bundle.attestation.payload.identityHash;
  const actualIdentityHash = identityStore.hashObject(bundle.identity);
  if (expectedIdentityHash && expectedIdentityHash !== actualIdentityHash) {
    throw new Error('Identity hash mismatch in imported bundle');
  }

  const existingIdentity = identityStore.load();
  let backupPath = null;
  if (existingIdentity) {
    backupPath = path.join(
      repoRoot,
      '.identity',
      'backups',
      `identity-backup-${Date.now()}.json`
    );
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(existingIdentity, null, 2), 'utf8');
  }

  const importedIdentity = {
    ...bundle.identity,
    events: Array.isArray(bundle.identity.events) ? bundle.identity.events : [],
  };
  importedIdentity.events.push({
    timestamp: new Date().toISOString(),
    type: 'identity-imported',
    details: {
      sourcePath: inputPath,
      attestedAt: bundle.attestation.payload.issuedAt || null,
    },
  });

  const saved = identityStore.save(importedIdentity);

  console.log(`[identity:import] Imported identity from: ${inputPath}`);
  if (backupPath) {
    console.log(`[identity:import] Backed up previous identity to: ${backupPath}`);
  }
  console.log(`[identity:import] Session ID: ${saved.sessionId}`);
  console.log(`[identity:import] Lane ID: ${saved.laneId}`);
}

try {
  run();
} catch (error) {
  console.error(`[identity:import] Failed: ${error.message}`);
  process.exit(1);
}

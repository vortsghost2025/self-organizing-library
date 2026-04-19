#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { IdentityStore } = require('../src/identity/IdentityStore');

function argValue(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const identityStore = new IdentityStore({ repoRoot });
  const outputArg = argValue('--out');

  const identity = identityStore.load() || identityStore.initialize();
  const identityHash = identityStore.hashObject(identity);
  const attestation = identityStore.sign('model-switch-export', { identityHash });

  const exportBundle = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    identity,
    attestation,
  };

  const defaultOutputPath = path.join(
    repoRoot,
    '.identity',
    'exports',
    `identity-export-${Date.now()}.json`
  );
  const outputPath = path.resolve(outputArg || defaultOutputPath);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(exportBundle, null, 2), 'utf8');

  console.log(`[identity:export] Exported identity to: ${outputPath}`);
  console.log(`[identity:export] Session ID: ${identity.sessionId}`);
  console.log(`[identity:export] Lane ID: ${identity.laneId}`);
}

try {
  run();
} catch (error) {
  console.error(`[identity:export] Failed: ${error.message}`);
  process.exit(1);
}

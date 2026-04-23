#!/usr/bin/env node
/**
 * Test Lane Consistency - Library Phase 4.4
 *
 * Verifies that the deterministic verification infrastructure is correctly
 * configured and that lane identity checks are enforced before crypto verification.
 */

const path = require('path');
const fs = require('fs');

// Test 1: Verify attestation files exist
console.log('\n=== Test 1: Attestation Infrastructure Files ===\n');

const requiredFiles = [
  'src/attestation/KeyManager.js',
  'src/attestation/Signer.js',
  'src/attestation/Verifier.js',
  'src/attestation/VerifierWrapper.js',
  'src/attestation/TrustStoreManager.js',
  'src/attestation/QuarantineManager.js',
  'src/attestation/PhenotypeStore.js',
  'src/attestation/constants.js',
  'src/queue/Queue.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  console.log(` ${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Test 2: Verify constants are correctly configured
console.log('\n=== Test 2: Constants Configuration ===\n');

try {
  const constants = require('../src/attestation/constants');
  
  console.log(` ✓ ARCHIVIST_TRUST_STORE_PATH: ${constants.ARCHIVIST_TRUST_STORE_PATH}`);
  console.log(` ✓ LANE_ID: ${constants.LANE_ID}`);
  console.log(` ✓ ARCHIVIST_ORCHESTRATOR_URL: ${constants.ARCHIVIST_ORCHESTRATOR_URL}`);

  // Check trust store path is configured for local lane broadcast
  if (!constants.ARCHIVIST_TRUST_STORE_PATH.includes('library/lanes/broadcast/trust-store.json')) {
    console.error(' ✗ Trust store path does not point to local lane broadcast');
    allFilesExist = false;
  } else {
    console.log(' ✓ Trust store path correctly points to local lane broadcast');
  }
} catch (e) {
  console.error(' ✗ Failed to load constants:', e.message);
  allFilesExist = false;
}

// Test 3: Verify Queue uses VerifierWrapper
console.log('\n=== Test 3: Queue Verification Path ===\n');

try {
  const Queue = require('../src/queue/Queue');
  
  // Check that Queue has the correct static properties
  if (Queue._verifierWrapper !== undefined) {
    console.log(' ✓ Queue has _verifierWrapper static property');
  }
  
  // Check setAttestation signature
  const setAttestationStr = Queue.setAttestation.toString();
  if (setAttestationStr.includes('verifierWrapper')) {
    console.log(' ✓ Queue.setAttestation uses verifierWrapper parameter');
  } else {
    console.error(' ✗ Queue.setAttestation does not use verifierWrapper parameter');
    allFilesExist = false;
  }
} catch (e) {
  console.error(' ✗ Failed to load Queue:', e.message);
  allFilesExist = false;
}

// Test 4: Verify VerifierWrapper enforces lane identity first
console.log('\n=== Test 4: VerifierWrapper Lane Identity Check ===\n');

try {
  const VerifierWrapper = require('../src/attestation/VerifierWrapper');
  const wrapperCode = fs.readFileSync(path.join(__dirname, '../src/attestation/VerifierWrapper.js'), 'utf8');
  
  // Check for lane comparison before crypto
  const hasOuterLane = wrapperCode.includes('outerLane');
  const hasPayloadLane = wrapperCode.includes('payloadLane');
  const hasLaneComparison = wrapperCode.includes('payloadLane !== outerLane');
  const hasCryptoAfter = wrapperCode.includes('verify(') && wrapperCode.indexOf('payloadLane !== outerLane') < wrapperCode.lastIndexOf('verify(');
  
  console.log(` ${hasOuterLane ? '✓' : '✗'} Extracts outerLane from envelope`);
  console.log(` ${hasPayloadLane ? '✓' : '✗'} Extracts payloadLane from signature`);
  console.log(` ${hasLaneComparison ? '✓' : '✗'} Compares lanes before crypto`);
  console.log(` ${hasCryptoAfter ? '✓' : '✗'} Crypto verification after lane check`);
  
  if (!hasOuterLane || !hasPayloadLane || !hasLaneComparison || !hasCryptoAfter) {
    allFilesExist = false;
  }
} catch (e) {
  console.error(' ✗ Failed to verify VerifierWrapper:', e.message);
  allFilesExist = false;
}

// Test 5: Identity store integration
console.log('\n=== Test 5: Identity Store Integration ===\n');

try {
  const { IdentityStore } = require('../src/identity/IdentityStore');
  const store = new IdentityStore();
  
  console.log(' ✓ IdentityStore loads successfully');
  console.log(` ✓ Lane detection: ${store._detectLaneId()}`);
  console.log(` ✓ Repo root: ${store.repoRoot}`);
} catch (e) {
  console.error(' ✗ IdentityStore failed:', e.message);
  allFilesExist = false;
}

// Final result
console.log('\n' + '='.repeat(50) + '\n');
if (allFilesExist) {
  console.log('✅ ALL TESTS PASSED - Lane consistency verified\n');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED - Review errors above\n');
  process.exit(1);
}

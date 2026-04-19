/**
 * Attestation Tests - Verify cross-lane signatures
 */

const assert = require('assert');
const { AttestationSupport } = require('../src/attestation/AttestationSupport.js');

console.log('\n[TEST] Attestation Support\n');

// Test 1: Trust store loading
console.log('Test 1: Trust store loading...');
const attestation = new AttestationSupport({
  trustStorePath: 'S:/Archivist-Agent/.identity/trust-store.json'
});
const status = attestation.getTrustStoreStatus();
console.log('  Trust store status:', status);
assert(status.loaded !== undefined, 'Trust store should have loaded property');
console.log('  ✅ PASS\n');

// Test 2: Get public key for lane
console.log('Test 2: Get public key for lane...');
const archivistKey = attestation.getPublicKey('archivist-agent');
console.log('  Archivist key exists:', !!archivistKey);
assert(archivistKey !== undefined, 'Should return key or null');
console.log('  ✅ PASS\n');

// Test 3: Verify returns result object
console.log('Test 3: Verify returns result object...');
const testPayload = { id: 'test-123', type: 'test' };
const testSignature = 'test-signature';
const verifyResult = attestation.verify(testPayload, testSignature, 'archivist-agent');
console.log('  Verify result:', verifyResult.reason);
assert(verifyResult.valid !== undefined, 'Should have valid property');
assert(verifyResult.reason !== undefined, 'Should have reason property');
console.log('  ✅ PASS\n');

// Test 4: Queue item verification
console.log('Test 4: Queue item verification...');
const queueItem = {
  id: 'Q-test-001',
  timestamp: new Date().toISOString(),
  origin_lane: 'swarmmind',
  type: 'INCIDENT',
  signature: 'test-sig'
};
const queueResult = attestation.verifyQueueItem(queueItem);
console.log('  Queue verify result:', queueResult.reason);
assert(queueResult.itemId === 'Q-test-001', 'Should include item ID');
console.log('  ✅ PASS\n');

// Test 5: Preserve metadata
console.log('Test 5: Preserve metadata...');
const artifact = { id: 'artifact-001', content: 'test' };
const preserved = attestation.preserveMetadata(artifact, { valid: true, reason: 'VERIFIED', lane: 'swarmmind' });
console.log('  Preserved artifact has _attestation:', !!preserved._attestation);
assert(preserved._attestation !== undefined, 'Should have _attestation');
assert(preserved._attestation.verified === true, 'Should preserve verification status');
console.log('  ✅ PASS\n');

// Test 6: Should reject logic
console.log('Test 6: Should reject logic...');
const shouldRejectInvalid = attestation.shouldReject({ valid: false, reason: 'SIGNATURE_MISMATCH' });
console.log('  Should reject invalid:', shouldRejectInvalid);
assert(shouldRejectInvalid === true, 'Should reject invalid signatures');
console.log('  ✅ PASS\n');

// Test 7: HMAC-only migration mode
console.log('Test 7: HMAC-only migration mode...');
const hmacAttestation = new AttestationSupport({ migrationMode: 'hmac-only' });
const hmacReject = hmacAttestation.shouldReject({ valid: false, reason: 'NO_SIGNATURE' });
console.log('  Should reject in HMAC-only mode:', hmacReject);
assert(hmacReject === false, 'Should NOT reject in HMAC-only mode');
console.log('  ✅ PASS\n');

// Test 8: Missing signature handling
console.log('Test 8: Missing signature handling...');
const noSigResult = attestation.verifyQueueItem({ id: 'test', type: 'test' });
console.log('  No signature result:', noSigResult.reason);
assert(noSigResult.valid === false, 'Should be invalid');
assert(noSigResult.reason === 'NO_SIGNATURE', 'Should indicate no signature');
console.log('  ✅ PASS\n');

console.log('[TEST] All 8 attestation tests passed ✅\n');

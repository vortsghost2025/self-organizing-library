#!/usr/bin/env node
/**
 * P0 TEST: No more dual-mode
 * Unsigned items should be REJECTED (either MISSING_SIGNATURE or QUARANTINED)
 */

const { VerifierWrapper } = require('../src/attestation/VerifierWrapper');

console.log('\n========================================');
console.log('P0: NO DUAL-MODE TEST');
console.log('========================================\n');

const wrapper = new VerifierWrapper({
  trustStorePath: 'S:/Archivist-Agent/.trust/keys.json'
});

const testItem = {
  id: 'test-unsigned',
  lane: 'library',
  origin_lane: 'library'
  // NO signature!
};

console.log('[TEST] Item has no signature');

wrapper.verify(testItem).then(result => {
  console.log('Result:', result);
  
  if (!result.valid) {
    console.log('\n✅ PASS: Unsigned item REJECTED');
    console.log('   Reason:', result.reason);
    console.log('   Note:', result.note);
    console.log('\n✅ No more dual-mode acceptance (HMAC_ACCEPTED_DUAL_MODE)');
    process.exit(0);
  } else {
    console.log('\n❌ FAIL: Should reject unsigned');
    process.exit(1);
  }
}).catch(err => {
  console.log('\n❌ ERROR:', err.message);
  process.exit(1);
});
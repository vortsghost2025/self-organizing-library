#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { moveFileWithLease, writeWithLease } = require('./lease-write');

const TEST_DIR = path.join(__dirname, '..', 'lanes', 'library', 'inbox', 'test-integration');
const LEASE_DIR = path.join(TEST_DIR, '.leases');
const TEMP_DIR = path.join(__dirname, '..', 'temp-test');

let passed = 0;
let failed = 0;

function cleanup() {
  try {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Cleanup warning:', e.message);
  }
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
    return true;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
    return false;
  }
}

async function testMoveFileWithLease() {
  console.log('\n=== Test 1: moveFileWithLease ===');
  cleanup();

  const sourcePath = path.join(TEMP_DIR, 'source-test.json');
  const destPath = path.join(TEST_DIR, 'dest-test.json');
  const content = JSON.stringify({ test: 'data', value: 42 });

  // Create temp source file
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.writeFileSync(sourcePath, content, 'utf8');
  assert(fs.existsSync(sourcePath), 'Source file created');
  assert(fs.readFileSync(sourcePath, 'utf8') === content, 'Source content matches');

  // Call moveFileWithLease
  const result = await moveFileWithLease(sourcePath, destPath, 'library', 30000);
  assert(result && result.moved === true, 'moveFileWithLease returned success');
  assert(result.destination === destPath, 'Result has correct destination');

  // Verify destination exists and content matches
  assert(fs.existsSync(destPath), 'Destination file exists');
  assert(fs.readFileSync(destPath, 'utf8') === content, 'Destination content matches');

  // Verify source no longer exists
  assert(!fs.existsSync(sourcePath), 'Source file was removed');

  // Verify lease file was created and then cleaned up
  const leaseFile = path.join(LEASE_DIR, 'dest-test.json.lease');
  assert(!fs.existsSync(leaseFile), 'Lease file was cleaned up after successful move');

  console.log('  Result:', JSON.stringify(result));
}

async function testWriteWithLease() {
  console.log('\n=== Test 2: writeWithLease ===');
  cleanup();

  const filePath = path.join(TEST_DIR, 'new-file.json');
  const content = JSON.stringify({ written: true, timestamp: Date.now() });

  // Call writeWithLease
  const result = await writeWithLease(filePath, content, 'library', 30000);
  assert(result && result.written === true, 'writeWithLease returned success');
  assert(result.path === filePath, 'Result has correct path');

  // Verify file exists and content matches
  assert(fs.existsSync(filePath), 'File was created');
  assert(fs.readFileSync(filePath, 'utf8') === content, 'File content matches');

  // Verify lease file was cleaned up
  const leaseFile = path.join(LEASE_DIR, 'new-file.json.lease');
  assert(!fs.existsSync(leaseFile), 'Lease file was cleaned up after successful write');

  console.log('  Result:', JSON.stringify(result));
}

async function testLeaseExpiry() {
  console.log('\n=== Test 3: Lease expiry scenario ===');
  cleanup();

  const filePath = path.join(TEST_DIR, 'expiry-test.json');
  const content = JSON.stringify({ test: 'expiry' });
  const shortLeaseMs = 100;

  // Write with very short lease timeout
  const result = await writeWithLease(filePath, content, 'library', shortLeaseMs);
  assert(result && result.written === true, 'File written with short lease');

  // Verify file exists
  assert(fs.existsSync(filePath), 'File exists after write');

  // Wait for lease to expire
  await new Promise(resolve => setTimeout(resolve, 150));

  // Verify the file still exists (lease cleanup happens on write, not expiry-based deletion)
  // The lease file should already be gone since writeWithLease cleans it up
  const leaseFile = path.join(LEASE_DIR, 'expiry-test.json.lease');
  assert(!fs.existsSync(leaseFile), 'Lease file was cleaned up (no lingering lease)');

  // Verify content is still there
  assert(fs.readFileSync(filePath, 'utf8') === content, 'File content persists after lease expiry');

  console.log('  (Note: lease-write.js cleans up lease on success, not based on expiry)');
}

async function testInboxWatcherImport() {
  console.log('\n=== Test 4: inbox-watcher.js can import lease-write.js ===');
  cleanup();

  try {
    const leaseWrite = require('./lease-write');
    assert(leaseWrite !== null, 'require("./lease-write") succeeds');
    assert(typeof leaseWrite.moveFileWithLease === 'function', 'moveFileWithLease function exists');
    assert(typeof leaseWrite.writeWithLease === 'function', 'writeWithLease function exists');
    console.log('  All exports present and valid');
  } catch (e) {
    assert(false, `Import failed: ${e.message}`);
  }
}

async function runAllTests() {
  console.log('Running lease-write.js integration tests...');
  console.log('Start time:', new Date().toISOString());

  await testMoveFileWithLease();
  await testWriteWithLease();
  await testLeaseExpiry();
  await testInboxWatcherImport();

  cleanup();

  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  console.log('End time:', new Date().toISOString());

  if (failed > 0) {
    console.log('\n❌ Some tests FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ All tests PASSED');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error:', err);
  cleanup();
  process.exit(1);
});

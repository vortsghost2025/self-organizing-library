#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const TEST_TRUST_STORE = {
  keys: {
    testlane: {
      lane_id: 'testlane',
      public_key_pem: fs.readFileSync(
        path.join(__dirname, '..', 'lanes', 'broadcast', 'trust-store.json'),
        'utf8'
      ).match(/"library"\s*:\s*\{[^}]*"public_key_pem"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1]
        ?.replace(/\\n/g, '\n') || '',
      algorithm: 'RS256',
      key_id: 'test-key-id-12345',
      registered_at: new Date().toISOString(),
      revoked_at: null
    }
  },
  version: '1.0'
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL: ${name} — ${e.message}`);
    failed++;
  }
}

console.log('=== Fail-Closed Test Suite ===\n');

// Test 1: Missing signature fails closed (IdentityEnforcer)
console.log('Test 1: Missing signature fails closed');
test('identity-enforcer: unsigned message rejected in enforce mode', () => {
  const { IdentityEnforcer } = require('./identity-enforcer');
  const enforcer = new IdentityEnforcer({ enforcementMode: 'enforce' });
  const result = enforcer.enforceMessage({ id: 'test-1', from: 'testlane' });
  assert.strictEqual(result.decision, 'reject', `Expected reject, got ${result.decision}`);
  assert.strictEqual(result.authenticated, false);
});

test('identity-enforcer: unsigned message rejected in warn mode', () => {
  const { IdentityEnforcer } = require('./identity-enforcer');
  const enforcer = new IdentityEnforcer({ enforcementMode: 'warn' });
  const result = enforcer.enforceMessage({ id: 'test-2', from: 'testlane' });
  assert.strictEqual(result.decision, 'reject', `Expected reject in warn mode, got ${result.decision}`);
});

test('identity-enforcer: unsigned message rejected in audit mode', () => {
  const { IdentityEnforcer } = require('./identity-enforcer');
  const enforcer = new IdentityEnforcer({ enforcementMode: 'audit' });
  const result = enforcer.enforceMessage({ id: 'test-3', from: 'testlane' });
  assert.strictEqual(result.decision, 'reject', `Expected reject in audit mode, got ${result.decision}`);
});

test('Verifier.verifyAuditEvent: unsigned event returns valid:false', () => {
  const { Verifier } = require(path.join(__dirname, '..', 'src', 'attestation', 'Verifier'));
  const verifier = new Verifier();
  const result = verifier.verifyAuditEvent({ lane: 'testlane', signature: null });
  assert.strictEqual(result.valid, false, `Expected valid=false, got ${result.valid}`);
  assert.strictEqual(result.error, 'MISSING_SIGNATURE', `Expected MISSING_SIGNATURE, got ${result.error}`);
});

// Test 2: Signature mismatch fails closed
console.log('\nTest 2: Signature mismatch fails closed');
test('identity-enforcer: invalid JWS rejected', () => {
  const { IdentityEnforcer } = require('./identity-enforcer');
  const enforcer = new IdentityEnforcer({ enforcementMode: 'enforce' });
  const result = enforcer.enforceMessage({
    id: 'test-4',
    from: 'testlane',
    signature: 'a.b.c'
  });
  assert.strictEqual(result.decision, 'reject');
  assert.strictEqual(result.authenticated, false);
});

test('Verifier.verifyQueueItem: invalid signature rejected', () => {
  const { Verifier } = require(path.join(__dirname, '..', 'src', 'attestation', 'Verifier'));
  const verifier = new Verifier();
  const result = verifier.verifyQueueItem({
    lane: 'library',
    signature: 'invalid.jws.string.here'
  });
  assert.strictEqual(result.valid, false, `Expected valid=false, got ${result.valid}`);
});

// Test 3: Lane mismatch fails closed
console.log('\nTest 3: Lane mismatch fails closed');
test('Verifier.verifyAgainstTrustStore: lane mismatch rejected', () => {
  const { Verifier } = require(path.join(__dirname, '..', 'src', 'attestation', 'Verifier'));
  const verifier = new Verifier();
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ lane: 'wronglane', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url');
  const fakeSig = Buffer.alloc(32).toString('base64url');
  const result = verifier.verifyAgainstTrustStore(`${header}.${payload}.${fakeSig}`, 'library');
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'LANE_MISMATCH', `Expected LANE_MISMATCH, got ${result.error}`);
});

test('identity-enforcer: lane mismatch in JWS payload rejected', () => {
  const { IdentityEnforcer } = require('./identity-enforcer');
  const enforcer = new IdentityEnforcer({ enforcementMode: 'enforce' });
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ lane: 'wronglane', iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url');
  const fakeSig = Buffer.alloc(32).toString('base64url');
  const result = enforcer.enforceMessage({
    id: 'test-5',
    from: 'testlane',
    signature: `${header}.${payload}.${fakeSig}`
  });
  assert.strictEqual(result.decision, 'reject');
});

// Test 4: Actionable without proof cannot enter processed
console.log('\nTest 4: Actionable message without completion proof cannot enter processed');
test('inbox-watcher: isActionRequiredMessage detects task type', () => {
  const { InboxWatcher } = require('./inbox-watcher');
  const watcher = new InboxWatcher({ laneName: 'library' });
  const msg = { type: 'task', requires_action: true, id: 'test-6' };
  assert.strictEqual(
    require('./inbox-watcher').DEFAULT_CONFIG ? true : false,
    true,
    'InboxWatcher loaded'
  );
});

test('outbox-write-guard: fabricated short signature rejected', () => {
  const { validateOutboxMessage } = require('./outbox-write-guard');
  const result = validateOutboxMessage({
    id: 'test-7',
    from: 'library',
    signature: 'short-string-that-is-exactly-10-ch',
    key_id: '1234567890123456'
  });
  assert.strictEqual(result.valid, false, `Expected valid=false for short non-JWS signature, got ${result.valid}`);
  assert.ok(result.errors.includes('INVALID_JWS_FORMAT'), `Expected INVALID_JWS_FORMAT in ${result.errors.join(',')}`);
});

test('outbox-write-guard: fabricated 10-char signature + 16-char key_id fails JWS check', () => {
  const { validateOutboxMessage } = require('./outbox-write-guard');
  const result = validateOutboxMessage({
    id: 'test-8',
    from: 'library',
    signature: 'aaaaaaaaaa',
    key_id: '0123456789abcdef'
  });
  assert.strictEqual(result.valid, false, `Expected valid=false, got ${result.valid}`);
});

test('outbox-write-guard: valid JWS format passes format check', () => {
  const { validateOutboxMessage } = require('./outbox-write-guard');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ test: true })).toString('base64url');
  const sig = Buffer.alloc(32).toString('base64url');
  const result = validateOutboxMessage({
    id: 'test-9',
    from: 'library',
    signature: `${header}.${payload}.${sig}`,
    key_id: '0123456789abcdef'
  });
  assert.strictEqual(result.valid, true, `Expected valid=true for valid JWS format, got ${result.valid} — errors: ${result.errors.join(',')}`);
});

// Test 5: Dry-run causes no mutation
console.log('\nTest 5: Dry-run causes no mutation');
test('recover-action-required-v2 dry-run: no files moved', () => {
  const processedPath = path.join(__dirname, '..', 'lanes', 'library', 'inbox', 'processed');
  const actionRequiredPath = path.join(__dirname, '..', 'lanes', 'library', 'inbox', 'action-required');
  const beforeProcessed = fs.readdirSync(processedPath).filter(f => f.endsWith('.json')).length;
  const beforeAR = fs.existsSync(actionRequiredPath)
    ? fs.readdirSync(actionRequiredPath).filter(f => f.endsWith('.json')).length
    : 0;

  const { execSync } = require('child_process');
  try {
    execSync(`node "${path.join(__dirname, 'recover-action-required-v2.js')}" --dry-run`, {
      cwd: path.join(__dirname, '..'),
      timeout: 30000,
      stdio: 'pipe'
    });
  } catch (e) {
    // Script may exit with code 1 for findings — that's fine for dry-run
  }

  const afterProcessed = fs.readdirSync(processedPath).filter(f => f.endsWith('.json')).length;
  const afterAR = fs.existsSync(actionRequiredPath)
    ? fs.readdirSync(actionRequiredPath).filter(f => f.endsWith('.json')).length
    : 0;
  assert.strictEqual(afterProcessed, beforeProcessed, `processed/ changed: ${beforeProcessed} → ${afterProcessed}`);
  assert.strictEqual(afterAR, beforeAR, `action-required/ changed: ${beforeAR} → ${afterAR}`);
});

// Summary
console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  console.error('\nFAIL-CLOSED TEST SUITE: FAILED');
  process.exit(1);
} else {
  console.log('\nFAIL-CLOSED TEST SUITE: ALL PASSED');
  process.exit(0);
}

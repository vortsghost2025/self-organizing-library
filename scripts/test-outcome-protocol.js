/**
 * test-outcome-protocol.js
 *
 * Runtime gate for current verification/outcome behavior.
 * Replaces stale imports to deleted modules.
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Verifier } = require('../src/attestation/Verifier');
const { VerifierWrapper } = require('../src/attestation/VerifierWrapper');
const { VERIFY_REASON } = require('../src/attestation/constants');

let passed = 0;
let failed = 0;

function createJWS(payload, privateKeyPem, kid = 'test-key') {
  const header = { alg: 'RS256', kid };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKeyPem).toString('base64url');
  return `${headerB64}.${payloadB64}.${signature}`;
}

function buildTempTrustStore(lane, publicKeyPem) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sol-trust-'));
  const trustStorePath = path.join(dir, 'keys.json');
  const trustStore = {
    version: '1.0',
    keys: {
      [lane]: {
        public_key_pem: publicKeyPem,
        key_id: `${lane}-kid`,
        registered_at: new Date().toISOString(),
        revoked_at: null
      }
    },
    migration: {}
  };
  fs.writeFileSync(trustStorePath, JSON.stringify(trustStore, null, 2));
  return { dir, trustStorePath };
}

async function run(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n=== Outcome/Verification Runtime Gate ===\n');

  await run('Missing signature is rejected deterministically', async () => {
    const wrapper = new VerifierWrapper();
    const result = await wrapper.verify({ id: 'no-sig-1', lane: 'library' });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, VERIFY_REASON.QUARANTINED);
    assert.ok(String(result.note || '').includes('No signature'));
  });

  await run('Malformed JWS is structured rejection (no throw)', async () => {
    const wrapper = new VerifierWrapper();
    const result = await wrapper.verify({
      id: 'bad-jws-1',
      lane: 'library',
      signature: 'not-a-jws'
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, VERIFY_REASON.QUARANTINED);
  });

  await run('Valid JWS returns verified mode', async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    const lane = 'library';
    const { dir, trustStorePath } = buildTempTrustStore(lane, publicKey);
    try {
      const verifier = new Verifier({ trustStorePath });
      const wrapper = new VerifierWrapper({ verifier });
      const signature = createJWS({ lane, data: 'ok' }, privateKey, `${lane}-kid`);
      const result = await wrapper.verify({
        id: 'good-jws-1',
        lane,
        signature
      });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.mode, 'JWS_VERIFIED');
      assert.strictEqual(result.payload.lane, lane);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await run('Lane mismatch fails before trust decision', async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    const { dir, trustStorePath } = buildTempTrustStore('swarmmind', publicKey);
    try {
      const verifier = new Verifier({ trustStorePath });
      const wrapper = new VerifierWrapper({ verifier });
      const signature = createJWS({ lane: 'library', data: 'mismatch' }, privateKey, 'library-kid');
      const result = await wrapper.verify({
        id: 'lane-mismatch-1',
        lane: 'swarmmind',
        signature
      });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.reason, VERIFY_REASON.QUARANTINED);
      assert.ok(String(result.note || '').includes('differs from outer lane'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  await run('Legacy bypass options are rejected by Verifier constructor', async () => {
    assert.throws(() => new Verifier({ allowLegacy: true }), /allowLegacy is removed/);
    assert.throws(() => new Verifier({ hmacCutoffDate: '2026-01-01' }), /hmacCutoffDate is removed/);
  });

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});


#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LANE_ROOTS = {
  archivist: 'S:/Archivist-Agent',
  library: 'S:/self-organizing-library',
  swarmmind: 'S:/SwarmMind',
  kernel: 'S:/kernel-lane',
};

const BROADCAST_TRUST_STORE_REL = path.join('lanes', 'broadcast', 'trust-store.json');
const DOT_TRUST_KEYS_REL = path.join('.trust', 'keys.json');

function readPublicKeyPem(lane) {
  const pemPath = path.join(LANE_ROOTS[lane], '.identity', 'public.pem');
  if (!fs.existsSync(pemPath)) {
    throw new Error(`Missing public.pem for ${lane}: ${pemPath}`);
  }
  return fs.readFileSync(pemPath, 'utf8').trim();
}

function computeKeyId(pem) {
  const der = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const buf = Buffer.from(der, 'base64');
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  return hash.substring(0, 16);
}

function buildUnifiedTrustStore() {
  const now = new Date().toISOString();
  const store = {};
  const report = { lanes: {}, discrepancies: [], converged: false };

  for (const [lane, root] of Object.entries(LANE_ROOTS)) {
    const pem = readPublicKeyPem(lane);
    const keyId = computeKeyId(pem);

    store[lane] = {
      lane_id: lane,
      public_key_pem: pem,
      algorithm: 'RS256',
      key_id: keyId,
      registered_at: now,
      expires_at: null,
      revoked_at: null,
    };

    const oldBroadcastPath = path.join(root, BROADCAST_TRUST_STORE_REL);
    let oldKeyId = 'MISSING';
    let oldPemMatch = false;
    try {
      const old = JSON.parse(fs.readFileSync(oldBroadcastPath, 'utf8'));
      const entry = old[lane] || old.lanes?.[lane];
      if (entry) {
        oldKeyId = entry.key_id || 'MISSING';
        oldPemMatch = entry.public_key_pem?.trim() === pem;
      }
    } catch {}

    report.lanes[lane] = {
      correct_key_id: keyId,
      old_key_id: oldKeyId,
      pem_match: oldPemMatch,
      key_id_match: oldKeyId === keyId,
    };

    if (oldKeyId !== keyId) {
      report.discrepancies.push({
        lane,
        field: 'key_id',
        old: oldKeyId,
        correct: keyId,
      });
    }
    if (!oldPemMatch) {
      report.discrepancies.push({
        lane,
        field: 'public_key_pem',
        old: 'MISMATCH',
        correct: 'updated from .identity/public.pem',
      });
    }
  }

  store.preCommitChecks = [
    'signature_validates_against_key_id',
    'key_id_matches_trust_store_entry',
    'lane_id_invariant',
  ];

  report.converged = report.discrepancies.length === 0;
  return { store, report };
}

function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  fs.writeFileSync(tmp, content + '\n', 'utf8');
  fs.renameSync(tmp, filePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`WRITE_VERIFICATION_FAILED: ${filePath}`);
  }
  return filePath;
}

function backupFile(filePath) {
  const backupPath = filePath + '.pre-fix-backup';
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  return backupPath;
}

function deployTrustStore(store, dryRun = false) {
  const results = {};

  for (const [lane, root] of Object.entries(LANE_ROOTS)) {
    const broadcastPath = path.join(root, BROADCAST_TRUST_STORE_REL);
    const dotTrustPath = path.join(root, DOT_TRUST_KEYS_REL);

    try {
      if (dryRun) {
        results[lane] = { broadcast: 'would_write', dotTrust: 'would_write' };
        continue;
      }

      backupFile(broadcastPath);
      backupFile(dotTrustPath);

      atomicWriteJson(broadcastPath, store);

      const laneEntry = store[lane];
      const singleLaneStore = {
        lane_id: lane,
        public_key_pem: laneEntry.public_key_pem,
        algorithm: laneEntry.algorithm,
        key_id: laneEntry.key_id,
        registered_at: laneEntry.registered_at,
        expires_at: null,
        revoked_at: null,
      };
      atomicWriteJson(dotTrustPath, singleLaneStore);

      const verifyBroadcast = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
      const verifyDot = JSON.parse(fs.readFileSync(dotTrustPath, 'utf8'));

      const broadcastOk = verifyBroadcast[lane]?.key_id === laneEntry.key_id;
      const dotOk = verifyDot.key_id === laneEntry.key_id;

      results[lane] = {
        broadcast: broadcastOk ? 'verified' : 'MISMATCH',
        dotTrust: dotOk ? 'verified' : 'MISMATCH',
        key_id: laneEntry.key_id,
      };
    } catch (err) {
      results[lane] = { error: err.message };
    }
  }

  return results;
}

function verifyConvergence() {
  const errors = [];
  const referenceStore = JSON.parse(
    fs.readFileSync(path.join(LANE_ROOTS.archivist, BROADCAST_TRUST_STORE_REL), 'utf8')
  );

  for (const [lane, root] of Object.entries(LANE_ROOTS)) {
    const refEntry = referenceStore[lane];
    if (!refEntry) {
      errors.push(`Reference store missing entry for ${lane}`);
      continue;
    }
    const refKeyId = refEntry.key_id;
    const refPem = refEntry.public_key_pem?.trim();
    const computedKeyId = computeKeyId(refPem);

    if (refKeyId !== computedKeyId) {
      errors.push(`Reference store ${lane} key_id ${refKeyId} != computed ${computedKeyId}`);
    }

    for (const [otherLane, otherRoot] of Object.entries(LANE_ROOTS)) {
      const broadcastPath = path.join(otherRoot, BROADCAST_TRUST_STORE_REL);
      try {
        const store = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
        const entry = store[lane];
        if (!entry) {
          errors.push(`${otherLane} broadcast store missing entry for ${lane}`);
          continue;
        }
        if (entry.key_id !== refKeyId) {
          errors.push(`${otherLane} broadcast store has wrong key_id for ${lane}: ${entry.key_id} !== ${refKeyId}`);
        }
        if (entry.public_key_pem?.trim() !== refPem) {
          errors.push(`${otherLane} broadcast store has wrong PEM for ${lane}`);
        }
      } catch (err) {
        errors.push(`${otherLane} broadcast store read error: ${err.message}`);
      }
    }
  }

  return { converged: errors.length === 0, errors };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'check';

  if (mode === 'check') {
    const { store, report } = buildUnifiedTrustStore();
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.converged ? 0 : 1);
  } else if (mode === 'deploy') {
    const { store, report } = buildUnifiedTrustStore();
    console.log('=== Pre-deploy report ===');
    console.log(JSON.stringify(report, null, 2));

    const results = deployTrustStore(store);
    console.log('\n=== Deploy results ===');
    console.log(JSON.stringify(results, null, 2));

    const verification = verifyConvergence();
    console.log('\n=== Convergence verification ===');
    console.log(JSON.stringify(verification, null, 2));
    process.exit(verification.converged ? 0 : 1);
  } else if (mode === 'verify') {
    const verification = verifyConvergence();
    console.log(JSON.stringify(verification, null, 2));
    process.exit(verification.converged ? 0 : 1);
  } else {
    console.error('Usage: node fix-trust-stores.js [check|deploy|verify]');
    process.exit(1);
  }
}

module.exports = { buildUnifiedTrustStore, deployTrustStore, verifyConvergence, computeKeyId };

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

async function moveFileWithLease(sourcePath, destPath, laneName, leaseTimeoutMs = 30000) {
  if (!sourcePath || !destPath) {
    throw new Error(`LEASE_WRITE_INVALID: sourcePath and destPath are required`);
  }
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`LEASE_WRITE_SOURCE_MISSING: ${sourcePath} does not exist`);
  }

  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const leaseDir = path.join(destDir, '.leases');
  const leaseFile = path.join(leaseDir, `${path.basename(destPath)}.lease`);

  try {
    if (!fs.existsSync(leaseDir)) {
      fs.mkdirSync(leaseDir, { recursive: true });
    }

    const leaseData = {
      lane: laneName || 'unknown',
      source: sourcePath,
      destination: destPath,
      acquired_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + leaseTimeoutMs).toISOString()
    };
    fs.writeFileSync(leaseFile, JSON.stringify(leaseData, null, 2), 'utf8');

    const content = fs.readFileSync(sourcePath, 'utf8');
    fs.writeFileSync(destPath, content, 'utf8');
    fs.unlinkSync(sourcePath);

    try { fs.unlinkSync(leaseFile); } catch (_) {}

    return { moved: true, source: sourcePath, destination: destPath };
  } catch (e) {
    try { if (fs.existsSync(leaseFile)) fs.unlinkSync(leaseFile); } catch (_) {}
    throw e;
  }
}

function writeWithLease(filePath, content, laneName, leaseTimeoutMs = 30000) {
  if (!filePath || content === undefined) {
    throw new Error(`LEASE_WRITE_INVALID: filePath and content are required`);
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const leaseDir = path.join(dir, '.leases');
  const leaseFile = path.join(leaseDir, `${path.basename(filePath)}.lease`);

  try {
    if (!fs.existsSync(leaseDir)) {
      fs.mkdirSync(leaseDir, { recursive: true });
    }

    const leaseData = {
      lane: laneName || 'unknown',
      target: filePath,
      acquired_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + leaseTimeoutMs).toISOString()
    };
    fs.writeFileSync(leaseFile, JSON.stringify(leaseData, null, 2), 'utf8');

    fs.writeFileSync(filePath, content, 'utf8');

    try { fs.unlinkSync(leaseFile); } catch (_) {}

    return { written: true, path: filePath };
  } catch (e) {
    try { if (fs.existsSync(leaseFile)) fs.unlinkSync(leaseFile); } catch (_) {}
    throw e;
  }
}

module.exports = { moveFileWithLease, writeWithLease };

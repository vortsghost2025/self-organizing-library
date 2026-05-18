#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(REPO_ROOT, '.env.local');
const DEPLOY_LOG = path.join(REPO_ROOT, 'logs', 'deploy-log.json');

function loadEnvVar(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envFile = fs.readFileSync(ENV_PATH, 'utf8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith(key + '=')) {
        return trimmed.slice(key.length + 1).replace(/^['"]|['"]$/g, '');
      }
    }
  } catch (_) {}
  return null;
}

async function deploy() {
  const token = loadEnvVar('VERCEL_TOKEN');
  if (!token) {
    const result = { success: false, error: 'VERCEL_TOKEN not found in .env.local', timestamp: new Date().toISOString() };
    fs.writeFileSync(DEPLOY_LOG, JSON.stringify(result, null, 2));
    console.error('[deploy] ERROR: VERCEL_TOKEN not found');
    process.exit(1);
  }

  try {
    console.log('[deploy] Building and deploying to Vercel...');
    const output = execSync(
      `npx vercel deploy --prod --yes --token "${token}"`,
      { cwd: REPO_ROOT, encoding: 'utf8', timeout: 180000 }
    );
    const lines = output.trim().split('\n');
    const url = lines.find(l => l.startsWith('https://') && l.includes('.vercel.app'));
    const inspect = lines.find(l => l.includes('vercel.com/'));

    const result = {
      success: true,
      url: url || null,
      inspect_url: inspect || null,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(DEPLOY_LOG, JSON.stringify(result, null, 2));
    console.log('[deploy] SUCCESS:', url || 'deployed');
    return result;
  } catch (err) {
    const result = { success: false, error: err.message, timestamp: new Date().toISOString() };
    fs.writeFileSync(DEPLOY_LOG, JSON.stringify(result, null, 2));
    console.error('[deploy] FAILED:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  deploy().catch(err => {
    console.error('[deploy] Unhandled error:', err.message);
    process.exit(1);
  });
}

module.exports = { deploy };

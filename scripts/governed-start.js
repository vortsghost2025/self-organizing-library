#!/usr/bin/env node
/**
 * GOVERNANCE-AWARE STARTUP - Library Lane
 *
 * Purpose: Launch Library with governance context loaded
 *
 * This script wraps the normal Next.js startup to:
 * 1. Load identity from .identity/current.json
 * 2. Initialize attestation (KeyManager, Verifier)
 * 3. Configure Queue with VerifierWrapper
 * 4. Launch Next.js application
 *
 * Phase 4.4: Enforces deterministic verification for all signed items.
 *
 * Usage: node scripts/governed-start.js
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Import attestation components
const { KeyManager } = require('../src/attestation/KeyManager');
const { Signer } = require('../src/attestation/Signer');
const { Verifier } = require('../src/attestation/Verifier');
const { VerifierWrapper } = require('../src/attestation/VerifierWrapper');
const { TrustStoreManager } = require('../src/attestation/TrustStoreManager');
const { IdentityStore } = require('../src/identity/IdentityStore');

class GovernedStartup {
  constructor() {
    this.repoRoot = path.resolve(__dirname, '..');
    this.identityStore = null;
    this.keyManager = null;
    this.signer = null;
    this.verifier = null;
    this.verifierWrapper = null;
  }

  async start() {
    console.log('\n📚 Library Governance-Aware Startup\n');
    console.log('='.repeat(60));

    // Phase 4.0: Load Identity
    console.log('\n🔐 Phase 4.0: Identity Loading\n');
    this.identityStore = new IdentityStore({ repoRoot: this.repoRoot });
    const identityBootstrap = this.identityStore.bootstrap({ readOnlyIfMissing: false });

    if (!identityBootstrap.loaded) {
      console.error('\n❌ Identity bootstrap failed:', identityBootstrap.reason);
      console.error(' System cannot guarantee lane identity\n');
      process.exit(1);
    }

    console.log(` ✓ Lane: ${identityBootstrap.identity.laneId}`);
    console.log(` ✓ Session: ${identityBootstrap.identity.sessionId}`);
    console.log(` ✓ Created: ${identityBootstrap.identity.createdAt}\n`);

    // Phase 4.4: Initialize Attestation
    console.log('\n🔑 Phase 4.4: Attestation Initialization\n');

    // Check for passphrase
    const passphrase = process.env.LANE_KEY_PASSPHRASE;
    if (!passphrase) {
      console.error('\n❌ LANE_KEY_PASSPHRASE environment variable not set');
      console.error(' Set it before running governed startup\n');
      process.exit(1);
    }

    try {
      // Initialize KeyManager
      this.keyManager = new KeyManager({
        laneId: identityBootstrap.identity.laneId,
        identityDir: path.join(this.repoRoot, '.identity')
      });

      const keyInit = this.keyManager.initialize(passphrase);
      if (keyInit.generated) {
        console.log(' ✓ Generated new RSA-2048 key pair');
      } else {
        console.log(' ✓ Loaded existing RSA-2048 key pair');
      }
      console.log(` ✓ Key ID: ${keyInit.keyId}`);

       // Initialize Verifier with trust store
       this.verifier = new Verifier();

       // Load trust store manager with correct path  
       const trustStore = new TrustStoreManager({
          trustStorePath: path.join(this.repoRoot, 'lanes', 'broadcast', 'trust-store.json')
       });

       // Ensure verifier has all active keys from trust store
       const activeKeys = trustStore.getActiveKeys();
       for (const [laneId, keyEntry] of Object.entries(activeKeys)) {
          if (!this.verifier.getPublicKey(laneId)) {
             this.verifier.addTrustedKey(laneId, keyEntry.public_key_pem, keyEntry.key_id);
          }
       }

      // Trust our own key
      const publicKey = this.keyManager.loadPublicKey();
      this.verifier.addTrustedKey(identityBootstrap.identity.laneId, publicKey, keyInit.keyId);

      // Initialize Signer
      this.signer = new Signer();

      // Initialize VerifierWrapper (deterministic lane-first verification)
      this.verifierWrapper = new VerifierWrapper({
        verifier: this.verifier,
        keyManager: this.keyManager,
        signer: this.signer
      });

      console.log(' ✓ VerifierWrapper initialized (deterministic lane-first verification)');

      // Configure global Queue attestation
      const Queue = require('../src/queue/Queue');
      Queue.setAttestation(this.signer, this.verifierWrapper, this.keyManager);
      console.log(' ✓ Queue attestation configured\n');

    } catch (e) {
      console.error('\n❌ Attestation initialization failed:', e.message);
      console.error(' Aborting startup — operator intervention required\n');
      process.exit(1);
    }

    // Phase 5: Launch Next.js
    console.log('\n🚀 Phase 5: Launching Library Application\n');
    console.log('='.repeat(60) + '\n');

    // Set environment for Next.js
    process.env.LANE_ID = identityBootstrap.identity.laneId;
    process.env.LANE_SESSION_ID = identityBootstrap.identity.sessionId;

    // Spawn Next.js dev server
    const child = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: this.repoRoot,
      env: { ...process.env }
    });

    child.on('error', (err) => {
      console.error('\n❌ Failed to start Next.js:', err.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      console.log(`\n/Library application exited with code ${code}\n`);
      process.exit(code || 0);
    });

    // Handle shutdown signals
    process.on('SIGINT', () => {
      console.log('\n\nShutdown requested...');
      child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });
  }
}

// Run startup
const startup = new GovernedStartup();
startup.start().catch((err) => {
  console.error('\n❌ Startup failed:', err.message);
  process.exit(1);
});

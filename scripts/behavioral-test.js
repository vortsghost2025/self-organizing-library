/**
 * behavioral-test.js - Prove Runtime Behavior, Not Just Code Existence
 * 
 * Phase 2 Requirement: The Usage Lane must run actual flows and verify
 * that critical artifacts execute, not just exist.
 * 
 * Test Flow:
 * 1. Submit unsigned artifact
 * 2. Check if VerifierWrapper.verify was called
 * 3. Check if rejection occurred
 * 4. Verify bypass paths were not taken
 * 
 * Owner: Usage Lane (Authority 50)
 * Created: 2026-04-20
 */

const { ProbeRegistry, ProbeInstaller, ProofReport } = require('../src/usage/RuntimeProbe');
const { BypassDetector } = require('../src/usage/BypassDetector');
const { VerifierWrapper } = require('../src/attestation/VerifierWrapper');
const { QuarantineManager } = require('../src/attestation/QuarantineManager');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// TEST RESULTS
// ==============================================================================

const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    details: []
};

function test(name, fn) {
    try {
        const result = fn();
        if (result.passed) {
            testResults.passed++;
            console.log(`✓ PASS: ${name}`);
        } else {
            testResults.failed++;
            console.log(`✗ FAIL: ${name} - ${result.reason}`);
            testResults.errors.push({ name, reason: result.reason });
        }
        testResults.details.push({ name, ...result });
    } catch (e) {
        testResults.failed++;
        console.log(`✗ ERROR: ${name} - ${e.message}`);
        testResults.errors.push({ name, reason: e.message, stack: e.stack });
        testResults.details.push({ name, passed: false, error: e.message });
    }
}

// ==============================================================================
// BEHAVIORAL TEST SUITE
// ==============================================================================

console.log('\n========================================');
console.log('BEHAVIORAL TEST: Prove Runtime Execution');
console.log('========================================\n');

// ------------------------------------------------------------------------------
// Setup: Install probes
// ------------------------------------------------------------------------------

console.log('Setting up runtime probes...\n');
const probeLogPath = path.join(__dirname, '..', 'logs', 'behavioral-test-probes.log');
ProbeRegistry.init(probeLogPath);
ProbeInstaller.installCriticalProbes();

// Create test infrastructure
const tempQuarantineLog = path.join(__dirname, '..', 'logs', 'test-quarantine.log');
const quarantineManager = new QuarantineManager({ logPath: tempQuarantineLog });

const verifierWrapper = new VerifierWrapper({
    submitToRecovery: false,  // Disable recovery for test
    quarantineManager
});

// ------------------------------------------------------------------------------
// Test 1: Unsigned artifact is rejected
// ------------------------------------------------------------------------------

test('Unsigned artifact triggers verification', () => {
    const unsignedItem = {
        id: 'test-unsigned-001',
        lane: 'test-lane',
        payload: { data: 'test' }
        // No signature
    };
    
    const result = verifierWrapper.verify(unsignedItem);
    
    // Check that verification was called
    const probeStatus = ProbeRegistry.getProbeStatus('VerifierWrapper.verify');
    
    if (!probeStatus || !probeStatus.wasCalled) {
        return { 
            passed: false, 
            reason: 'VerifierWrapper.verify was NOT called - verification is DORMANT' 
        };
    }
    
    if (result.valid === true) {
        return { 
            passed: false, 
            reason: 'Unsigned artifact was ACCEPTED - verification is BYPASSED' 
        };
    }
    
    return { 
        passed: true, 
        reason: `Unsigned artifact rejected, verify() called ${probeStatus.invokeCount} time(s)` 
    };
});

// ------------------------------------------------------------------------------
// Test 2: Malformed JWS is rejected
// ------------------------------------------------------------------------------

test('Malformed JWS triggers verification and rejection', () => {
    ProbeRegistry.clear();
    ProbeRegistry.register('VerifierWrapper.verify', {
        artifact: 'src/attestation/VerifierWrapper.js',
        method: 'verify',
        critical: true
    });
    
    const malformedItem = {
        id: 'test-malformed-001',
        lane: 'test-lane',
        signature: 'not.a.valid.jws',
        payload: { data: 'test' }
    };
    
    const result = verifierWrapper.verify(malformedItem);
    
    const probeStatus = ProbeRegistry.getProbeStatus('VerifierWrapper.verify');
    
    if (!probeStatus || !probeStatus.wasCalled) {
        return { 
            passed: false, 
            reason: 'VerifierWrapper.verify was NOT called for malformed JWS' 
        };
    }
    
    if (result.valid === true) {
        return { 
            passed: false, 
            reason: 'Malformed JWS was ACCEPTED' 
        };
    }
    
    return { 
        passed: true, 
        reason: 'Malformed JWS rejected through verification path' 
    };
});

// ------------------------------------------------------------------------------
// Test 3: Quarantine is called on failure
// ------------------------------------------------------------------------------

test('Quarantine is invoked on verification failure', () => {
    ProbeRegistry.clear();
    ProbeRegistry.register('QuarantineManager.quarantine', {
        artifact: 'src/attestation/QuarantineManager.js',
        method: 'quarantine',
        critical: true
    });
    
    const failingItem = {
        id: 'test-quarantine-001',
        lane: 'test-lane',
        signature: 'invalid.signature'
    };
    
    verifierWrapper.verify(failingItem);
    
    const probeStatus = ProbeRegistry.getProbeStatus('QuarantineManager.quarantine');
    
    if (!probeStatus || !probeStatus.wasCalled) {
        return { 
            passed: false, 
            reason: 'QuarantineManager.quarantine was NOT called' 
        };
    }
    
    return { 
        passed: true, 
        reason: `Quarantine invoked ${probeStatus.invokeCount} time(s)` 
    };
});

// ------------------------------------------------------------------------------
// Test 4: All critical probes were invoked
// ------------------------------------------------------------------------------

test('All critical verification artifacts executed', () => {
    const proof = ProofReport.allCriticalProven();
    
    if (!proof.proven) {
        return { 
            passed: false, 
            reason: `Critical artifact ${proof.missingProbe} (${proof.artifact}) was NOT executed` 
        };
    }
    
    return { 
        passed: true, 
        reason: 'All critical verification artifacts executed at runtime' 
    };
});

// ------------------------------------------------------------------------------
// Test 5: No bypass paths detected
// ------------------------------------------------------------------------------

test('No bypass paths in verification flow', () => {
    const detector = new BypassDetector({
        projectRoot: path.join(__dirname, '..')
    });
    
    const bypasses = detector.scan();
    const highRiskBypasses = bypasses.filter(b => b.risk === 'HIGH');
    
    if (highRiskBypasses.length > 0) {
        return { 
            passed: false, 
            reason: `HIGH risk bypasses found: ${highRiskBypasses.map(b => b.bypass).join(', ')}` 
        };
    }
    
    return { 
        passed: true, 
        reason: `No high-risk bypass paths (${bypasses.length} total detected, all low/medium)` 
    };
});

// ==============================================================================
// RESULTS
// ==============================================================================

console.log('\n========================================');
console.log('BEHAVIORAL TEST RESULTS');
console.log('========================================');
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Total:  ${testResults.passed + testResults.failed}`);

if (testResults.failed > 0) {
    console.log('\nFailed tests:');
    testResults.errors.forEach(e => {
        console.log(`  - ${e.name}: ${e.reason}`);
    });
}

// ==============================================================================
// PROOF REPORT
// ==============================================================================

const proofReport = ProofReport.generate();
console.log('\n----------------------------------------');
console.log('PROOF REPORT');
console.log('----------------------------------------');
console.log(`Proven to execute: ${proofReport.summary.proven}/${proofReport.summary.total}`);

if (proofReport.notProven.length > 0) {
    console.log('\nNOT PROVEN:');
    proofReport.notProven.forEach(p => {
        console.log(`  - ${p.probeId} (registered ${p.registered})`);
    });
}

// ==============================================================================
// SAVE RESULTS
// ==============================================================================

const resultsPath = path.join(__dirname, '..', 'verification', 'behavioral-test-results.json');
const verificationDir = path.dirname(resultsPath);
if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
}

fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    passed: testResults.passed,
    failed: testResults.failed,
    proof: proofReport,
    details: testResults.details
}, null, 2));

console.log(`\n📄 Results: ${resultsPath}`);

// ==============================================================================
// GATE CHECK
// ==============================================================================

console.log('\n========================================');
console.log('GATE CHECK');
console.log('========================================');

if (testResults.failed > 0) {
    console.log('❌ GATE FAILED: Not all behavioral tests passed');
    console.log('   Verification artifacts cannot be proven to execute.\n');
    process.exit(1);
} else {
    console.log('✅ GATE PASSED: All behavioral tests passed');
    console.log('   Verification artifacts PROVEN to execute at runtime.\n');
    process.exit(0);
}

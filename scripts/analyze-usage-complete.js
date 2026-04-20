/**
 * analyze-usage-complete.js - Full Usage Lane Analysis with Gate Enforcement
 * 
 * Phase 2: "Cannot-Lie" Usage Lane
 * 
 * Runs:
 * 1. Static analysis (Phase 1)
 * 2. Behavioral tests (Phase 2 - runtime proof)
 * 3. Bypass detection (Phase 2)
 * 4. Gate enforcement (Phase 2)
 * 
 * Output:
 * - JSON report with all findings
 * - Markdown gate report
 * - Exit code 0 = PASS, 1 = FAIL
 * 
 * Owner: Usage Lane (Authority 50)
 * Created: 2026-04-20
 */

const { UsageLane, UsageStatus } = require('../src/usage/UsageLane');
const { BypassDetector } = require('../src/usage/BypassDetector');
const { UsageGateEnforcer, GateResult } = require('../src/usage/UsageGateEnforcer');
const { ProbeRegistry, ProbeInstaller, ProofReport } = require('../src/usage/RuntimeProbe');
const { VerifierWrapper } = require('../src/attestation/VerifierWrapper');
const { QuarantineManager } = require('../src/attestation/QuarantineManager');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
const VERIFICATION_DIR = path.join(PROJECT_ROOT, 'verification');
const CONTEXT_BUFFER_DIR = path.join(PROJECT_ROOT, 'context-buffer');

// Ensure directories exist
[LOGS_DIR, VERIFICATION_DIR, CONTEXT_BUFFER_DIR].forEach(dir => {
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}
});

// ==============================================================================
// MAIN ASYNC FUNCTION
// ==============================================================================

async function main() {

// ==============================================================================
// RUN FULL ANALYSIS
// ==============================================================================

console.log('\n========================================');
console.log('USAGE LANE COMPLETE ANALYSIS');
console.log('Phase 2: Cannot-Lie Standard');
console.log('========================================\n');

// Initialize probe registry
ProbeRegistry.init(path.join(LOGS_DIR, 'usage-analysis-probes.log'));

// ==============================================================================
// STEP 1: RUN BEHAVIORAL TESTS (Runtime Proof)
// ==============================================================================

console.log('STEP 1: Running behavioral tests...\n');

ProbeInstaller.installCriticalProbes();

const tempQuarantineLog = path.join(LOGS_DIR, 'behavioral-quarantine.log');
const quarantineManager = new QuarantineManager({ logPath: tempQuarantineLog });
const verifierWrapper = new VerifierWrapper({
    submitToRecovery: false,
    quarantineManager
});

const behavioralResults = { passed: 0, failed: 0, tests: [] };

// Test 1: Unsigned artifact rejection
const unsignedItem = { id: 'test-001', lane: 'test' };
const result1 = await verifierWrapper.verify(unsignedItem);  // AWAIT async call
const probe1 = ProbeRegistry.getProbeStatus('VerifierWrapper.verify');

if (probe1?.wasCalled && result1.valid === false) {
    behavioralResults.passed++;
    behavioralResults.tests.push({ name: 'unsigned-rejected', passed: true });
    console.log('  ✓ Unsigned artifact rejected through verification');
} else {
    behavioralResults.failed++;
    behavioralResults.tests.push({ name: 'unsigned-rejected', passed: false, reason: probe1?.wasCalled ? 'accepted' : 'not called' });
    console.log('  ✗ Unsigned artifact test FAILED');
}

// Test 2: Malformed JWS rejection
ProbeRegistry.clear();
ProbeInstaller.installCriticalProbes();

const malformedItem = { id: 'test-002', lane: 'test', signature: 'not.valid.jws' };
const result2 = await verifierWrapper.verify(malformedItem);  // AWAIT async call
const probe2 = ProbeRegistry.getProbeStatus('VerifierWrapper.verify');

if (probe2?.wasCalled && result2.valid === false) {
    behavioralResults.passed++;
    behavioralResults.tests.push({ name: 'malformed-rejected', passed: true });
    console.log('  ✓ Malformed JWS rejected through verification');
} else {
    behavioralResults.failed++;
    behavioralResults.tests.push({ name: 'malformed-rejected', passed: false });
    console.log('  ✗ Malformed JWS test FAILED');
}

// Test 3: Quarantine invoked
const probe3 = ProbeRegistry.getProbeStatus('QuarantineManager.quarantine');
if (probe3?.wasCalled) {
    behavioralResults.passed++;
    behavioralResults.tests.push({ name: 'quarantine-invoked', passed: true });
    console.log('  ✓ Quarantine invoked on failure');
} else {
    behavioralResults.failed++;
    behavioralResults.tests.push({ name: 'quarantine-invoked', passed: false });
    console.log('  ✗ Quarantine test FAILED');
}

console.log(`\nBehavioral tests: ${behavioralResults.passed}/${behavioralResults.passed + behavioralResults.failed} passed\n`);

// ==============================================================================
// STEP 2: STATIC ANALYSIS
// ==============================================================================

console.log('STEP 2: Running static analysis...\n');

const usageLane = new UsageLane({ projectRoot: PROJECT_ROOT });
const staticResults = usageLane.analyze();

// ==============================================================================
// STEP 3: BYPASS DETECTION
// ==============================================================================

console.log('\nSTEP 3: Running bypass detection...\n');

const bypassDetector = new BypassDetector({ projectRoot: PROJECT_ROOT });
const bypasses = bypassDetector.scan();
const bypassReport = bypassDetector.generateReport();

console.log(`Bypasses detected: ${bypasses.length}`);
console.log(`  High risk: ${bypassReport.summary.highRisk}`);
console.log(`  Medium risk: ${bypassReport.summary.mediumRisk}`);
console.log(`  Low risk: ${bypassReport.summary.lowRisk}`);

// ==============================================================================
// STEP 4: GATE ENFORCEMENT
// ==============================================================================

console.log('\nSTEP 4: Running gate enforcement...\n');

const gateEnforcer = new UsageGateEnforcer({ strictMode: true });
const gateResult = gateEnforcer.enforceWithBehavioralTest(
    usageLane.reports,
    behavioralResults,
    bypassReport
);

console.log(`Gate Status: ${gateResult.status}`);

if (gateResult.violations.length > 0) {
    console.log('\nViolations:');
    gateResult.violations.forEach(v => {
        console.log(`  ❌ ${v.artifact}: ${v.issue}`);
    });
}

// ==============================================================================
// GENERATE REPORTS
// ==============================================================================

const proofReport = ProofReport.generate();

const fullReport = {
    timestamp: new Date().toISOString(),
    gateStatus: gateResult.status,
    behavioral: behavioralResults,
    static: {
        active: staticResults.active,
        dormant: staticResults.dormant,
        dead: staticResults.dead
    },
    bypass: bypassReport,
    proof: proofReport,
    violations: gateResult.violations,
    warnings: gateResult.warnings,
    summary: gateResult.summary
};

// Save JSON report
const jsonPath = path.join(VERIFICATION_DIR, 'usage-lane-complete-report.json');
fs.writeFileSync(jsonPath, JSON.stringify(fullReport, null, 2));
console.log(`\n📄 JSON report: ${jsonPath}`);

// Save Markdown report
const mdPath = path.join(CONTEXT_BUFFER_DIR, `USAGE_LANE_GATE_REPORT_${new Date().toISOString().split('T')[0]}.md`);
const mdContent = gateEnforcer.generateGateReport(gateResult);
fs.writeFileSync(mdPath, mdContent);
console.log(`📄 Gate report: ${mdPath}`);

// ==============================================================================
// FINAL OUTPUT
// ==============================================================================

console.log('\n========================================');
console.log('USAGE LANE ANALYSIS COMPLETE');
console.log('========================================\n');

console.log('Five-Point Verification Standard:');
console.log('  1. Exists      - file/function present');
console.log('  2. Referenced  - static import/call');
console.log('  3. Executed    - runtime evidence');
console.log('  4. Not Bypassed - no alternate paths');
console.log('  5. Enforced    - connected to outcomes\n');

console.log('Critical Artifacts Status:');
console.log(`  VerifierWrapper: ${proofReport.proven.some(p => p.probeId.includes('Verifier')) ? '✅ EXECUTED' : '❌ NOT EXECUTED'}`);
console.log(`  QuarantineManager: ${proofReport.proven.some(p => p.probeId.includes('Quarantine')) ? '✅ EXECUTED' : '❌ NOT EXECUTED'}`);
console.log(`  Bypass Detection: ${bypassReport.summary.highRisk === 0 ? '✅ NO HIGH RISK' : '❌ BYPASSES FOUND'}\n`);

// ==============================================================================
// EXIT
// ==============================================================================

if (gateResult.status === GateResult.FAIL) {
console.log('❌ GATE FAILED');
console.log(' Verification artifacts are DORMANT, DEAD, or BYPASSED.');
console.log(' Cannot proceed to Phase 5.\n');
process.exit(1);
} else {
console.log('✅ GATE PASSED');
console.log(' All verification artifacts are ACTIVE and ENFORCED.');
console.log(' Ready for Phase 5.\n');
process.exit(0);
}
}

// Run main
main().catch(err => {
console.error('FATAL ERROR:', err.message);
process.exit(1);
});

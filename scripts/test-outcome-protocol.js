/**
 * test-outcome-protocol.js - Phase 4B Outcome Protocol Test
 *
 * Tests the following scenarios:
 * 1. Confidence calculation works correctly
 * 2. Status determination based on confidence
 * 3. Requires field for DEFER outcomes
 * 4. Routing decisions for ESCALATE
 * 5. Consensus checking for "4 minds > 1"
 *
 * Owner: Archivist (implementation)
 * Last updated: 2026-04-20
 */

const {
    OutcomeStatus,
    RequiresReason,
    ConfidenceThresholds,
    ConfidenceWeights,
    Outcome,
    ConfidenceCalculator,
    OutcomeBuilder
} = require('../src/attestation/OutcomeProtocol');

const {
    LaneAuthority,
    RouteDecision,
    RouteDecider,
    ConsensusChecker
} = require('../src/attestation/OutcomeRouter');

const fs = require('fs');
const path = require('path');

// ==============================================================================
// TEST FRAMEWORK
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
// TEST SUITE
// ==============================================================================

console.log('\n========================================');
console.log('Phase 4B: Outcome Protocol Test');
console.log('========================================\n');

// ------------------------------------------------------------------------------
// Test 1: Confidence calculation
// ------------------------------------------------------------------------------

test('Confidence calculation with all factors', () => {
    const calculator = new ConfidenceCalculator();

    const factors = {
        signatureValid: true,
        laneMatch: true,
        trustStoreAvailable: true,
        recoveryEngineConfirmed: true
    };

    const confidence = calculator.calculate(factors);

    if (confidence !== 1.0) {
        return { passed: false, reason: `Expected 1.0, got ${confidence}` };
    }

    return { passed: true, reason: `All factors true = confidence 1.0` };
});

// ------------------------------------------------------------------------------
// Test 2: Partial confidence calculation
// ------------------------------------------------------------------------------

test('Partial confidence calculation', () => {
    const calculator = new ConfidenceCalculator();

    const factors = {
        signatureValid: true,
        laneMatch: true,
        trustStoreAvailable: false,
        recoveryEngineConfirmed: false
    };

    const confidence = calculator.calculate(factors);
    const expected = ConfidenceWeights.SIGNATURE + ConfidenceWeights.LANE_MATCH;

    if (Math.abs(confidence - expected) > 0.001) {
        return { passed: false, reason: `Expected ${expected}, got ${confidence}` };
    }

    return { passed: true, reason: `Correct partial confidence: ${confidence}` };
});

// ------------------------------------------------------------------------------
// Test 3: Status determination - ACCEPT
// ------------------------------------------------------------------------------

test('Status determination for high confidence', () => {
    const calculator = new ConfidenceCalculator();

    const status = calculator.determineStatus(0.85, { retryCount: 0 });

    if (status !== OutcomeStatus.ACCEPT) {
        return { passed: false, reason: `Expected ACCEPT, got ${status}` };
    }

    return { passed: true, reason: 'High confidence (0.85) correctly gives ACCEPT' };
});

// ------------------------------------------------------------------------------
// Test 4: Status determination - ESCALATE
// ------------------------------------------------------------------------------

test('Status determination for low confidence', () => {
    const calculator = new ConfidenceCalculator();

    const status = calculator.determineStatus(0.35, { retryCount: 0, recoveryAvailable: true });

    if (status !== OutcomeStatus.ESCALATE) {
        return { passed: false, reason: `Expected ESCALATE, got ${status}` };
    }

    return { passed: true, reason: 'Low confidence (0.35) correctly gives ESCALATE' };
});

// ------------------------------------------------------------------------------
// Test 5: Status determination - QUARANTINE
// ------------------------------------------------------------------------------

test('Status determination for medium confidence', () => {
    const calculator = new ConfidenceCalculator();

    const status = calculator.determineStatus(0.65, { retryCount: 0 });

    if (status !== OutcomeStatus.QUARANTINE) {
        return { passed: false, reason: `Expected QUARANTINE, got ${status}` };
    }

    return { passed: true, reason: 'Medium confidence (0.65) correctly gives QUARANTINE' };
});

// ------------------------------------------------------------------------------
// Test 6: Outcome builder
// ------------------------------------------------------------------------------

test('Outcome builder creates valid outcome', () => {
    const outcome = new OutcomeBuilder()
        .withStatus(OutcomeStatus.ACCEPT)
        .withConfidence(0.9)
        .withLane('library')
        .withItemId('test-001')
        .withReason('VERIFICATION_PASSED')
        .build();

    if (outcome.status !== OutcomeStatus.ACCEPT) {
        return { passed: false, reason: `Status mismatch: ${outcome.status}` };
    }

    if (outcome.confidence !== 0.9) {
        return { passed: false, reason: `Confidence mismatch: ${outcome.confidence}` };
    }

    if (!outcome.isTerminal()) {
        return { passed: false, reason: 'ACCEPT should be terminal' };
    }

    return { passed: true, reason: 'Outcome builder works correctly' };
});

// ------------------------------------------------------------------------------
// Test 7: Routing decision - LOCAL
// ------------------------------------------------------------------------------

test('Route decider for ACCEPT outcome', () => {
    const decider = new RouteDecider();

    const outcome = new Outcome({
        status: OutcomeStatus.ACCEPT,
        confidence: 0.9,
        lane: 'library',
        itemId: 'test-001'
    });

    const decision = decider.decide(outcome);

    if (decision.decision !== RouteDecision.LOCAL) {
        return { passed: false, reason: `Expected LOCAL, got ${decision.decision}` };
    }

    return { passed: true, reason: 'Terminal outcomes route to LOCAL' };
});

// ------------------------------------------------------------------------------
// Test 8: Routing decision - ESCALATE
// ------------------------------------------------------------------------------

test('Route decider for ESCALATE outcome', () => {
    const decider = new RouteDecider();

    const outcome = new Outcome({
        status: OutcomeStatus.ESCALATE,
        confidence: 0.35,
        lane: 'library',
        itemId: 'test-002',
        reason: RequiresReason.INSUFFICIENT_CONFIDENCE
    });

    const decision = decider.decide(outcome);

    if (decision.decision !== RouteDecision.ESCALATE_ARCHIVIST) {
        return { passed: false, reason: `Expected ESCALATE_ARCHIVIST, got ${decision.decision}` };
    }

    return { passed: true, reason: 'ESCALATE outcomes route to Archivist' };
});

// ------------------------------------------------------------------------------
// Test 9: Routing decision - DEFER
// ------------------------------------------------------------------------------

test('Route decider for DEFER outcome', () => {
    const decider = new RouteDecider();

    const outcome = new Outcome({
        status: OutcomeStatus.DEFER,
        confidence: 0,
        lane: 'library',
        itemId: 'test-003',
        reason: RequiresReason.MISSING_KEY,
        requires: [RequiresReason.MISSING_KEY]
    });

    const decision = decider.decide(outcome);

    if (decision.decision !== RouteDecision.DEFER) {
        return { passed: false, reason: `Expected DEFER, got ${decision.decision}` };
    }

    return { passed: true, reason: 'DEFER outcomes park locally' };
});

// ------------------------------------------------------------------------------
// Test 10: Consensus checking
// ------------------------------------------------------------------------------

test('Consensus checker for unanimous agreement', () => {
    const checker = new ConsensusChecker();

    const decisions = [
        { status: OutcomeStatus.ACCEPT, confidence: 0.85, authority: 80 },
        { status: OutcomeStatus.ACCEPT, confidence: 0.90, authority: 80 },
        { status: OutcomeStatus.ACCEPT, confidence: 0.88, authority: 60 }
    ];

    const consensus = checker.checkConsensus(decisions, 2);

    if (!consensus.hasConsensus) {
        return { passed: false, reason: 'Unanimous decisions should have consensus' };
    }

    return { passed: true, reason: 'Consensus detected for unanimous decisions' };
});

// ------------------------------------------------------------------------------
// Test 11: Weighted consensus
// ------------------------------------------------------------------------------

test('Weighted consensus calculation', () => {
    const checker = new ConsensusChecker();

    const decisions = [
        { status: OutcomeStatus.ACCEPT, confidence: 0.85, authority: LaneAuthority.ARCHIVIST },
        { status: OutcomeStatus.REJECT, confidence: 0.1, authority: LaneAuthority.LIBRARY }
    ];

    const weighted = checker.calculateWeightedConsensus(decisions);

    // Archivist (80) weight should dominate Library (60)
    if (weighted.recommendation !== OutcomeStatus.ACCEPT) {
        return { passed: false, reason: `Expected ACCEPT, got ${weighted.recommendation}` };
    }

    return { passed: true, reason: 'Weighted consensus respects authority levels' };
});

// ------------------------------------------------------------------------------
// Test 12: Outcome serialization
// ------------------------------------------------------------------------------

test('Outcome serialization and deserialization', () => {
    const original = new Outcome({
        status: OutcomeStatus.QUARANTINE,
        confidence: 0.6,
        lane: 'library',
        itemId: 'test-004',
        reason: 'SIGNATURE_MISMATCH',
        retryCount: 2
    });

    const json = original.toJSON();
    const restored = Outcome.fromJSON(json);

    if (restored.status !== original.status) {
        return { passed: false, reason: 'Status not preserved' };
    }

    if (restored.confidence !== original.confidence) {
        return { passed: false, reason: 'Confidence not preserved' };
    }

    return { passed: true, reason: 'Outcome serialization works correctly' };
});

// ==============================================================================
// RESULTS
// ==============================================================================

console.log('\n========================================');
console.log('Outcome Protocol Test Results');
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

console.log('\n');

// Write results
const resultsPath = path.join(__dirname, '..', 'verification', 'outcome-protocol-results.json');
const verificationDir = path.dirname(resultsPath);
if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
}
fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    passed: testResults.passed,
    failed: testResults.failed,
    total: testResults.passed + testResults.failed,
    details: testResults.details
}, null, 2));

process.exit(testResults.failed > 0 ? 1 : 0);

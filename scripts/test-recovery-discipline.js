/**
 * test-recovery-discipline.js - Phase 4A Recovery Discipline Test
 *
 * Tests the following scenarios:
 * 1. Retry counting works correctly
 * 2. Escalation to handoff at max retries
 * 3. Handoff artifact generation
 * 4. State transitions are valid
 * 5. Audit trail is logged
 *
 * Owner: Archivist (implementation)
 * Last updated: 2026-04-20
 */

const { QuarantineManager } = require('../src/attestation/QuarantineManager');
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
// MOCK HELPERS
// ==============================================================================

function createTempLogFile() {
    const tempPath = path.join(__dirname, `test-quarantine-${Date.now()}.log`);
    return tempPath;
}

function cleanupTempFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

function createTestItem(id) {
    return {
        id: id || `test-item-${Date.now()}`,
        signature: 'test.signature.value',
        lane: 'test-lane',
        payload: { data: 'test' }
    };
}

// ==============================================================================
// RECOVERY STATE MACHINE (SIMPLIFIED)
// ==============================================================================

class RecoveryStateMachine {
    constructor(item) {
        this.item = item;
        this.state = 'NEW';
        this.retryCount = 0;
        this.history = [];
        this.maxRetries = 5;
    }

    transition(toState, metadata = {}) {
        const fromState = this.state;
        const valid = this.isValidTransition(fromState, toState);

        this.history.push({
            timestamp: new Date().toISOString(),
            from: fromState,
            to: toState,
            valid,
            metadata
        });

        if (valid) {
            this.state = toState;
        }

        return { success: valid, state: this.state, history: this.history };
    }

    isValidTransition(from, to) {
        const transitions = {
            'NEW': ['VERIFYING'],
            'VERIFYING': ['ACCEPTED', 'QUARANTINED'],
            'QUARANTINED': ['VERIFYING', 'HANDOFF', 'ESCALATED', 'DEFERRED'],
            'DEFERRED': ['QUARANTINED'],
            'HANDOFF': ['RELEASED', 'REJECTED'],
            'ESCALATED': ['ACCEPTED', 'REJECTED'],
            'ACCEPTED': [],
            'RELEASED': [],
            'REJECTED': []
        };
        return transitions[from]?.includes(to) ?? false;
    }

    incrementRetry() {
        this.retryCount++;
        return this.retryCount;
    }

    shouldHandoff() {
        return this.retryCount >= this.maxRetries;
    }
}

// ==============================================================================
// TEST SUITE
// ==============================================================================

console.log('\n========================================');
console.log('Phase 4A: Recovery Discipline Test');
console.log('========================================\n');

// ------------------------------------------------------------------------------
// Test 1: Retry counting works correctly
// ------------------------------------------------------------------------------

test('Retry counting increments correctly', () => {
    const sm = new RecoveryStateMachine(createTestItem());

    // Simulate verification -> quarantine cycle
    sm.transition('VERIFYING');
    sm.transition('QUARANTINED');

    const initialRetry = sm.retryCount;
    sm.incrementRetry();
    sm.incrementRetry();
    sm.incrementRetry();

    if (sm.retryCount !== initialRetry + 3) {
        return { passed: false, reason: `Expected retry count ${initialRetry + 3}, got ${sm.retryCount}` };
    }

    return { passed: true, reason: `Retry count correctly incremented to ${sm.retryCount}` };
});

// ------------------------------------------------------------------------------
// Test 2: Escalation to handoff at max retries
// ------------------------------------------------------------------------------

test('Handoff triggered at max retries', () => {
    const sm = new RecoveryStateMachine(createTestItem());

    // Simulate max retries
    for (let i = 0; i < 5; i++) {
        sm.incrementRetry();
    }

    if (!sm.shouldHandoff()) {
        return { passed: false, reason: `shouldHandoff() returned false at retry ${sm.retryCount}` };
    }

    return { passed: true, reason: `Handoff correctly triggered at retry ${sm.retryCount}` };
});

// ------------------------------------------------------------------------------
// Test 3: Handoff artifact generation
// ------------------------------------------------------------------------------

test('Handoff artifact contains required fields', () => {
    const tempLogPath = createTempLogFile();
    const qm = new QuarantineManager({ logPath: tempLogPath });

    try {
        const item = createTestItem('handoff-test-001');
        const reason = 'SIGNATURE_MISMATCH';

        // Quarantine multiple times
        for (let i = 0; i < 5; i++) {
            qm.quarantine(item, reason, 1000);
        }

        const entry = qm.get(item.id);

        if (!entry) {
            return { passed: false, reason: 'Entry not found in quarantine' };
        }

        // Check required fields
        const requiredFields = ['item', 'reason', 'retryCount', 'firstQuarantined'];
        const missing = requiredFields.filter(f => !entry[f]);

        if (missing.length > 0) {
            return { passed: false, reason: `Missing fields: ${missing.join(', ')}` };
        }

        if (entry.retryCount !== 5) {
            return { passed: false, reason: `Expected retryCount 5, got ${entry.retryCount}` };
        }

        return { passed: true, reason: 'Handoff artifact has all required fields' };
    } finally {
        cleanupTempFile(tempLogPath);
    }
});

// ------------------------------------------------------------------------------
// Test 4: State transitions are valid
// ------------------------------------------------------------------------------

test('Invalid state transitions are rejected', () => {
    const sm = new RecoveryStateMachine(createTestItem());

    // Valid: NEW -> VERIFYING
    let result = sm.transition('VERIFYING');
    if (!result.success) {
        return { passed: false, reason: 'Valid transition NEW->VERIFYING failed' };
    }

    // Invalid: VERIFYING -> HANDOFF (must go through QUARANTINED)
    result = sm.transition('HANDOFF');
    if (result.success) {
        return { passed: false, reason: 'Invalid transition VERIFYING->HANDOFF succeeded' };
    }

    // Valid: VERIFYING -> QUARANTINED
    result = sm.transition('QUARANTINED');
    if (!result.success) {
        return { passed: false, reason: 'Valid transition VERIFYING->QUARANTINED failed' };
    }

    return { passed: true, reason: 'State machine correctly rejects invalid transitions' };
});

// ------------------------------------------------------------------------------
// Test 5: Audit trail is logged
// ------------------------------------------------------------------------------

test('Quarantine events are logged', () => {
    const tempLogPath = createTempLogFile();
    const qm = new QuarantineManager({ logPath: tempLogPath });

    try {
        const item = createTestItem('audit-test-001');
        qm.quarantine(item, 'TEST_REASON');

        // Check log file exists
        if (!fs.existsSync(tempLogPath)) {
            return { passed: false, reason: 'Log file not created' };
        }

        // Check log content
        const logContent = fs.readFileSync(tempLogPath, 'utf8');
        const logEntry = JSON.parse(logContent.trim());

        if (logEntry.event !== 'QUARANTINE') {
            return { passed: false, reason: 'Log entry missing QUARANTINE event' };
        }

        if (!logEntry.timestamp) {
            return { passed: false, reason: 'Log entry missing timestamp' };
        }

        if (!logEntry.item_id) {
            return { passed: false, reason: 'Log entry missing item_id' };
        }

        return { passed: true, reason: 'Quarantine events logged with required fields' };
    } finally {
        cleanupTempFile(tempLogPath);
    }
});

// ------------------------------------------------------------------------------
// Test 6: Terminal states have no outgoing transitions
// ------------------------------------------------------------------------------

test('Terminal states reject all transitions', () => {
    const sm = new RecoveryStateMachine(createTestItem());

    // Get to ACCEPTED state
    sm.transition('VERIFYING');
    sm.transition('ACCEPTED');

    // Try to transition from terminal state
    const result = sm.transition('QUARANTINED');

    if (result.success) {
        return { passed: false, reason: 'Terminal state ACCEPTED allowed transition' };
    }

    return { passed: true, reason: 'Terminal states correctly reject transitions' };
});

// ------------------------------------------------------------------------------
// Test 7: Defer state for missing dependencies
// ------------------------------------------------------------------------------

test('Defer state handles missing dependencies', () => {
    const sm = new RecoveryStateMachine(createTestItem());

    // Get to QUARANTINED
    sm.transition('VERIFYING');
    sm.transition('QUARANTINED');

    // Transition to DEFERRED
    const result = sm.transition('DEFERRED', { reason: 'MISSING_KEY' });

    if (!result.success) {
        return { passed: false, reason: 'QUARANTINED->DEFERRED transition failed' };
    }

    if (sm.state !== 'DEFERRED') {
        return { passed: false, reason: `State is ${sm.state}, expected DEFERRED` };
    }

    // Deferred can go back to Quarantined when dependency resolved
    const backResult = sm.transition('QUARANTINED', { reason: 'DEPENDENCY_RESOLVED' });

    if (!backResult.success) {
        return { passed: false, reason: 'DEFERRED->QUARANTINED transition failed' };
    }

    return { passed: true, reason: 'Defer state correctly handles dependencies' };
});

// ==============================================================================
// RESULTS
// ==============================================================================

console.log('\n========================================');
console.log('Recovery Discipline Test Results');
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
const resultsPath = path.join(__dirname, '..', 'verification', 'recovery-discipline-results.json');
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

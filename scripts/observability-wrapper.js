#!/usr/bin/env node
/**
 * Observability Test Wrapper
 * 
 * Wraps any test command to capture results and store them as evidence JSON files.
 * Usage: node scripts/observability-wrapper.js "<test-command>" [options]
 * 
 * Options:
 *   --strategy=<unit|integration|e2e|recovery|resilience|performance>
 *   --suite=<suite-name>
 *   --env=<development|ci|production>
 *   --tags=<comma-separated-tags>
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/observability-wrapper.js "<test-command>" [options]');
  process.exit(1);
}

const testCommand = args[0];
const options = args.slice(1).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) acc[key.replace('--', '')] = value;
  return acc;
}, {});

const strategy = options.strategy || 'unit';
const suite = options.suite;
const environment = options.env || 'development';
const tags = options.tags ? options.tags.split(',') : [];

// Evidence directory
const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'observability', 'runs');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Generate run ID
function generateRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Write JSON file
function writeJSON(filePath, data) {
  return fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Parse test output (simple)
function parseTestOutput(stdout, stderr, exitCode) {
  const results = { total: 0, passed: 0, failed: 0, skipped: 0, tests: [] };

  // Look for lines with checkmarks or crosses
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.includes('✓') || line.includes('✖')) {
      const match = line.match(/(✓|✖)\s+(.+?)(?:\s+\(.*\))?$/);
      if (match) {
        const status = match[1] === '✓' ? 'passed' : 'failed';
        const name = match[2].trim();
        results.tests.push({ testName: name, filePath: 'unknown', status });
        results.total++;
        if (status === 'passed') results.passed++;
        else results.failed++;
      }
    }
  }

  // Fallback: if no tests parsed but exitCode non-zero, record stderr as error
  if (results.total === 0 && exitCode !== 0 && stderr) {
    results.tests.push({
      testName: 'process_error',
      filePath: 'stderr',
      status: 'failed',
      errorMessage: stderr.trim(),
    });
    results.total = 1;
    results.failed = 1;
  }

  // Determine overall status
  let status = 'passed';
  if (exitCode !== 0) status = 'failed';
  else if (results.failed > 0 && results.passed > 0) status = 'partial';
  else if (results.failed > 0) status = 'failed';

  return { ...results, status };
}

async function runAndCapture() {
  const runId = generateRunId();
  const runFilePath = path.join(EVIDENCE_DIR, `${runId}.json`);
  const startTime = Date.now();

  // Create initial run record
  const run = {
    id: runId,
    timestamp: new Date().toISOString(),
    runner: 'wrapper',
    strategy,
    suite,
    environment,
    status: 'in_progress',
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    durationMs: null,
    gitCommit: '',
    gitBranch: '',
    metadata: { command: testCommand, options },
    results: [],
    errors: [],
  };
  await writeJSON(runFilePath, run);

  console.log(`[Observability] Started test run ${runId} (${strategy})`);

  const parts = testCommand.split(' ');
  const command = parts[0];
  const commandArgs = parts.slice(1);

  const child = spawn(command, commandArgs, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    stdout += data.toString();
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    stderr += data.toString();
    process.stderr.write(data);
  });

  child.on('close', async (code) => {
    const duration = Date.now() - startTime;
    const parsed = parseTestOutput(stdout, stderr, code);

    // Record each test result
    for (const test of parsed.tests) {
      // Classify error if any
      let classification = null;
      let action = null;
      if (test.errorMessage) {
        const classificationResult = classifyError({ message: test.errorMessage });
        classification = classificationResult.classification;
        action = classificationResult.action;
      }

      run.results.push({
        id: generateRunId(),
        testName: test.testName,
        filePath: test.filePath,
        status: test.status,
        executionTimeMs: test.executionTimeMs || null,
        errorMessage: test.errorMessage || null,
        errorStack: null,
        category: inferCategory(test.testName),
        resiliencePhase: inferResiliencePhase(test.testName),
        resilienceClassification: classification,
        resilienceAction: action,
      });

      // If error, also push to errors array
      if (test.errorMessage) {
        run.errors.push({
          id: generateRunId(),
          timestamp: new Date().toISOString(),
          level: 'error',
          message: test.errorMessage,
          stack: null,
          source: test.filePath,
          classification,
          category: 'test_failure',
          testResultId: test.id,
        });
      }
    }

    // Update run summary
    run.status = parsed.status;
    run.totalTests = parsed.total;
    run.passedTests = parsed.passed;
    run.failedTests = parsed.failed;
    run.skippedTests = parsed.skipped;
    run.durationMs = duration;
    run.completedAt = new Date().toISOString();

    // Log stderr as errors if any
    if (stderr && stderr.trim()) {
      const errorLines = stderr.split('\n').filter(l => l.trim());
      for (const line of errorLines) {
        const classificationResult = classifyError({ message: line });
        run.errors.push({
          id: generateRunId(),
          timestamp: new Date().toISOString(),
          level: 'error',
          message: line,
          source: 'stderr',
          classification: classificationResult.classification,
        });
      }
    }

    try {
      await writeJSON(runFilePath, run);
      console.log(`\n[Observability] Test run ${runId} completed: ${parsed.status}`);
      console.log(`[Observability] Results: ${parsed.passed}/${parsed.total} passed, ${parsed.failed} failed`);
      console.log(`[Observability] Duration: ${duration}ms`);
      console.log(`[Observability] Evidence: ${runFilePath}`);
    } catch (err) {
      console.error('[Observability] Failed to write run file:', err);
    }

    process.exit(code || 0);
  });

  child.on('error', (error) => {
    console.error(`[Observability] Test process error: ${error.message}`);
    // Record error in run file if possible
    run.errors.push({
      id: generateRunId(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      source: 'wrapper',
      classification: 'system',
      category: 'spawn_error',
    });
    run.status = 'interrupted';
    run.completedAt = new Date().toISOString();
    writeJSON(runFilePath, run).catch(console.error);
    process.exit(1);
  });
}

function inferCategory(testName) {
  const name = testName.toLowerCase();
  if (name.includes('attestation') || name.includes('signer') || name.includes('verifier')) return 'attestation';
  if (name.includes('queue') || name.includes('consumer')) return 'queue';
  if (name.includes('governance') || name.includes('lane') || name.includes('session')) return 'governance';
  if (name.includes('resilience') || name.includes('recovery') || name.includes('retry')) return 'resilience';
  return 'general';
}

function inferResiliencePhase(testName) {
  const name = testName.toLowerCase();
  if (name.includes('detect') || name.includes('timeout') || name.includes('health')) return 'detection';
  if (name.includes('decision') || name.includes('strategy') || name.includes('retry')) return 'decision';
  if (name.includes('handle') || name.includes('recover') || name.includes('failover')) return 'handling';
  if (name.includes('observab') || name.includes('log') || name.includes('metric')) return 'observability';
  return undefined;
}

function classifyError(error) {
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('unreachable')) {
    return { classification: 'detection', action: 'retry' };
  }
  if (msg.includes('invalid') || msg.includes('unexpected') || msg.includes('malformed')) {
    return { classification: 'detection', action: 'degrade' };
  }
  if (msg.includes('validation') || msg.includes('assertion')) {
    return { classification: 'detection', action: 'abort' };
  }
  if (msg.includes('dependency') || msg.includes('module not found') || msg.includes('health check')) {
    return { classification: 'detection', action: 'failover' };
  }
  if (msg.includes('retry')) {
    return { classification: 'handling', action: 'retry' };
  }
  if (msg.includes('failover') || msg.includes('fallback')) {
    return { classification: 'handling', action: 'failover' };
  }
  if (msg.includes('cached') || msg.includes('partial data') || msg.includes('degraded')) {
    return { classification: 'handling', action: 'degrade' };
  }
  if (msg.includes('skipped') || msg.includes('queued')) {
    return { classification: 'handling', action: 'skip' };
  }
  if (msg.includes('technical difficulties') || msg.includes('down')) {
    return { classification: 'handling', action: 'abort' };
  }
  if (msg.includes('recovered') || msg.includes('restored')) {
    return { classification: 'recovery', action: 'none' };
  }
  if (msg.includes('logged') || msg.includes('metric')) {
    return { classification: 'observability', action: 'none' };
  }
  return { classification: 'system', action: 'abort' };
}

runAndCapture().catch(err => {
  console.error('[Observability] Fatal error:', err);
  process.exit(1);
});

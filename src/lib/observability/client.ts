import { writeRun, updateRun as dbUpdateRun, readRun } from './storage';
import { randomUUID } from 'crypto';
import { classifyError } from './classifier';

export async function startTestRun(params: {
  runner: string;
  strategy: 'unit' | 'integration' | 'e2e' | 'recovery' | 'resilience' | 'performance';
  suite?: string;
  environment?: 'development' | 'ci' | 'production';
  gitCommit?: string;
  gitBranch?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const runId = randomUUID();
  const now = new Date().toISOString();
  
  const run: any = {
    id: runId,
    timestamp: now,
    runner: params.runner,
    strategy: params.strategy,
    suite: params.suite,
    environment: params.environment || 'development',
    status: 'in_progress',
    gitCommit: params.gitCommit,
    gitBranch: params.gitBranch,
    metadata: params.metadata,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    durationMs: null,
    results: [],
    errors: [],
  };
  
  await writeRun(run);
  console.log(`[Observability] Started test run ${runId} (${params.strategy})`);
  return runId;
}

export async function completeTestRun(
  runId: string,
  params: {
    status: 'passed' | 'failed' | 'partial' | 'interrupted';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    durationMs: number;
  }
) {
  await dbUpdateRun(runId, {
    status: params.status,
    totalTests: params.totalTests,
    passedTests: params.passedTests,
    failedTests: params.failedTests,
    skippedTests: params.skippedTests,
    durationMs: params.durationMs,
    completedAt: new Date().toISOString(),
  });
  console.log(`[Observability] Completed test run ${runId}: ${params.status} (${params.passedTests}/${params.totalTests} passed)`);
}

export async function recordTestResult(params: {
  runId: string;
  testName: string;
  filePath: string;
  status: 'passed' | 'failed' | 'skipped' | 'timed_out';
  executionTimeMs?: number;
  errorMessage?: string;
  errorStack?: string;
  category?: string;
  resiliencePhase?: string;
}) {
  const run = await readRun(params.runId);
  if (!run) throw new Error(`Run ${params.runId} not found`);

  const result = {
    id: randomUUID(),
    testName: params.testName,
    filePath: params.filePath,
    status: params.status,
    executionTimeMs: params.executionTimeMs,
    errorMessage: params.errorMessage,
    errorStack: params.errorStack,
    category: params.category,
    resiliencePhase: params.resiliencePhase,
    resilienceClassification: params.errorMessage ? classifyError({ message: params.errorMessage }).classification : null,
    resilienceAction: params.errorMessage ? classifyError({ message: params.errorMessage }).action : null,
  };

  run.results.push(result);
  
  if (params.errorMessage) {
    run.errors.push({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: params.errorMessage,
      stack: params.errorStack,
      source: params.filePath,
      classification: result.resilienceClassification,
      category: params.category || 'test_failure',
      testResultId: result.id,
    });
  }

  await writeRun(run);
  return result.id;
}

export async function logError(params: {
  runId: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source: string;
  classification: string;
  stack?: string;
  category?: string;
  context?: any;
}) {
  const run = await readRun(params.runId);
  if (!run) throw new Error(`Run ${params.runId} not found`);

  const error = {
    id: randomUUID(),
    timestamp: params.timestamp,
    level: params.level,
    message: params.message,
    stack: params.stack,
    source: params.source,
    classification: params.classification,
    category: params.category,
    context: params.context,
    resilienceWorkflowApplied: params.classification !== 'unknown',
  };

  run.errors.push(error);
  await writeRun(run);
  return error.id;
}

export { readRun } from './storage';
export { queryRuns as listRuns } from './storage';

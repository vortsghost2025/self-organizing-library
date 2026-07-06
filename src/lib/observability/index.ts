import { eq, ne, gt, gte, lt, lte, like, notLike, ilike, notIlike, inArray, notInArray, desc, asc, and, or, sql } from 'drizzle-orm';
import { getDb, saveDatabase, tables, type TestRun, type TestCase, type TestResult, type ErrorLog } from '../../db';
import { randomUUID } from 'crypto';

/**
 * Test Observability Library
 * 
 * Central system for tracking test execution, results, errors, and improvements
 * aligned with WE4FREE Resilience Framework.
 */

// ============================================
// Utility: Ensure DB is ready
// ============================================
let dbReady: Promise<any> | null = null;
function getDB() {
  if (!dbReady) {
    dbReady = getDb();
  }
  return dbReady;
}

// ============================================
// Test Run Management
// ============================================

export async function startTestRun(params: {
  runner: string;
  strategy: 'unit' | 'integration' | 'e2e' | 'recovery' | 'resilience' | 'performance';
  suite?: string;
  environment?: 'development' | 'ci' | 'production';
  gitCommit?: string;
  gitBranch?: string;
  metadata?: Record<string, any>;
}): Promise<string> {
  const db = await getDB();
  const runId = randomUUID();
  const now = new Date().toISOString();
  
  await db.insert(tables.testRuns).values({
    id: runId,
    timestamp: now,
    runner: params.runner,
    strategy: params.strategy,
    suite: params.suite || null,
    environment: params.environment || 'development',
    status: 'in_progress',
    created_at: Math.floor(Date.now() / 1000),
    gitCommit: params.gitCommit || null,
    gitBranch: params.gitBranch || null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });

  await saveDatabase();
  
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
  const db = await getDB();
  
  await db.update(tables.testRuns)
    .set({
      status: params.status,
      totalTests: params.totalTests,
      passedTests: params.passedTests,
      failedTests: params.failedTests,
      skippedTests: params.skippedTests,
      durationMs: params.durationMs,
    })
    .where(eq(tables.testRuns.id, runId));

  await saveDatabase();
  console.log(`[Observability] Completed test run ${runId}: ${params.status} (${params.passedTests}/${params.totalTests} passed)`);
}

// ============================================
// Test Case Management
// ============================================

export async function getOrCreateTestCase(params: {
  name: string;
  filePath: string;
  strategy: string;
  category?: string;
  resiliencePhase?: 'detection' | 'decision' | 'handling' | 'observability';
  timeoutMs?: number;
  retries?: number;
  tags?: string[];
}): Promise<string> {
  const db = await getDB();
  
  const existing = await db.select()
    .from(tables.testCases)
    .where(and(
      eq(tables.testCases.name, params.name),
      eq(tables.testCases.filePath, params.filePath)
    ))
    .limit(1)
    .all();

  if (existing.length > 0) {
    return existing[0].id;
  }

  const testCaseId = randomUUID();
  
  await db.insert(tables.testCases).values({
    id: testCaseId,
    name: params.name,
    file_path: params.filePath,
    category: params.category || null,
    strategy: params.strategy,
    resilience_phase: params.resiliencePhase || null,
    timeout_ms: params.timeoutMs || null,
    retries: params.retries || 0,
    tags: params.tags ? JSON.stringify(params.tags) : null,
  });

  await saveDatabase();
  return testCaseId;
}

// ============================================
// Test Result Recording
// ============================================

export async function recordTestResult(params: {
  runId: string;
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'timed_out';
  executionTimeMs?: number;
  errorMessage?: string;
  errorStack?: string;
  resilienceClassification?: 'detection' | 'decision' | 'handling' | 'recovery' | 'none';
  resilienceAction?: 'retry' | 'failover' | 'degrade' | 'skip' | 'abort';
  errorMetadata?: Record<string, any>;
}): Promise<string> {
  const db = await getDB();
  
  const resultId = randomUUID();
  
  await db.insert(tables.testResults).values({
    id: resultId,
    run_id: params.runId,
    test_case_id: params.testCaseId,
    status: params.status,
    execution_time_ms: params.executionTimeMs || null,
    error_message: params.errorMessage || null,
    error_stack: params.errorStack || null,
    resilience_classification: params.resilienceClassification || null,
    resilience_action: params.resilienceAction || null,
    error_metadata: params.errorMetadata ? JSON.stringify(params.errorMetadata) : null,
  });

  // If there's an error, also log it to error_logs
  if (params.errorMessage) {
    await logError({
      runId: params.runId,
      testResultId: resultId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: params.errorMessage,
      stack: params.errorStack,
      source: 'test_result',
      classification: (params.resilienceClassification || 'unknown') as any,
      category: params.errorMetadata?.category || 'test_failure',
      context: params.errorMetadata ? JSON.stringify(params.errorMetadata) : undefined,
      blastRadius: params.errorMetadata?.blastRadius || 'isolated',
    });
  }

  await saveDatabase();
  return resultId;
}

// ============================================
// Error Logging
// ============================================

export async function logError(params: {
  runId: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source: string;
  classification: 'detection' | 'decision' | 'handling' | 'recovery' | 'system' | 'unknown' | 'observability';
  stack?: string;
  testResultId?: string;
  category?: string;
  context?: string;
  resilienceWorkflowApplied?: boolean;
  recoveryAttempted?: boolean;
  recoverySuccessful?: boolean;
  blastRadius?: 'isolated' | 'module' | 'system' | 'unknown';
}): Promise<string> {
  const db = await getDB();
  
  const errorId = randomUUID();
  
  await db.insert(tables.errorLogs).values({
    id: errorId,
    run_id: params.runId,
    test_result_id: params.testResultId || null,
    timestamp: params.timestamp,
    level: params.level,
    message: params.message,
    stack: params.stack || null,
    source: params.source,
    classification: params.classification,
    category: params.category,
    context: params.context,
    resilience_workflow_applied: params.resilienceWorkflowApplied ? 1 : 0,
    recovery_attempted: params.recoveryAttempted ? 1 : 0,
    recovery_successful: params.recoverySuccessful ? 1 : null,
    blast_radius: params.blastRadius,
  });

  await saveDatabase();
  return errorId;
}

// ============================================
// Error Classification
// ============================================

export function classifyError(error: {
  message?: string;
  stack?: string;
  type?: string;
  code?: string;
  category?: string;
}): {
  classification: 'detection' | 'decision' | 'handling' | 'recovery' | 'system' | 'unknown' | 'observability';
  action: 'retry' | 'failover' | 'degrade' | 'skip' | 'abort' | 'none';
  description: string;
} {
  const message = (error.message || '').toLowerCase();
  const type = (error.type || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  if (message.includes('timeout') || message.includes('connection refused') || 
      message.includes('network error') || message.includes('unreachable') ||
      type.includes('timeout') || type.includes('network')) {
    return { classification: 'detection', action: 'retry', description: 'Network or timeout error detected' };
  }

  if (message.includes('invalid') || message.includes('unexpected') || 
      message.includes('malformed') || message.includes('validation failed')) {
    return { classification: 'detection', action: 'degrade', description: 'Invalid or unexpected response detected' };
  }

  if (message.includes('threshold exceeded') || message.includes('performance') ||
      message.includes('slow') || code.includes('TIMEOUT')) {
    return { classification: 'detection', action: 'degrade', description: 'Performance threshold exceeded' };
  }

  if (message.includes('validation') || message.includes('assertion failed') ||
      message.includes('expect') || message.includes('should equal')) {
    return { classification: 'detection', action: 'abort', description: 'Validation or assertion failure' };
  }

  if (message.includes('dependency') || message.includes('module not found') ||
      message.includes('cannot find') || message.includes('health check failed')) {
    return { classification: 'detection', action: 'failover', description: 'Dependency or service unavailable' };
  }

  if (message.includes('retry') || message.includes('retrying') ||
      message.includes('attempt') && message.includes('of')) {
    return { classification: 'handling', action: 'retry', description: 'Retry mechanism in progress' };
  }

  if (message.includes('failover') || message.includes('fallback') ||
      message.includes('alternative') || message.includes('backup')) {
    return { classification: 'handling', action: 'failover', description: 'Failover to backup source' };
  }

  if (message.includes('cached') || message.includes('partial data') ||
      message.includes('degraded mode') || message.includes('limited functionality')) {
    return { classification: 'handling', action: 'degrade', description: 'Graceful degradation activated' };
  }

  if (message.includes('skipped') || message.includes('queued') ||
      message.includes('async') || message.includes('background')) {
    return { classification: 'handling', action: 'skip', description: 'Step skipped or queued for later' };
  }

  if (message.includes('technical difficulties') || message.includes('unavailable') ||
      message.includes('maintenance') || message.includes('down for')) {
    return { classification: 'handling', action: 'abort', description: 'Safe abort with user messaging' };
  }

  if (message.includes('logged') || message.includes('metric') ||
      message.includes('telemetry') || message.includes('monitoring')) {
    return { classification: 'observability', action: 'none', description: 'Observability event' };
  }

  if (message.includes('recovered') || message.includes('restored') ||
      message.includes('success after') || message.includes('retry succeeded')) {
    return { classification: 'recovery', action: 'none', description: 'System recovered from error' };
  }

  return { classification: 'system', action: 'abort', description: 'Unclassified system error' };
}

// ============================================
// Query Functions (using raw queries for simplicity)
// ============================================

export async function queryTestRuns(params: {
  startDate?: string;
  endDate?: string;
  strategy?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const db = await getDB();
  
  let query = 'SELECT * FROM test_runs WHERE 1=1';
  const conditions: string[] = [];
  const values: any[] = [];

  if (params.startDate) {
    conditions.push('timestamp >= ?');
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push('timestamp <= ?');
    values.push(params.endDate);
  }
  if (params.strategy) {
    conditions.push('strategy = ?');
    values.push(params.strategy);
  }
  if (params.status) {
    conditions.push('status = ?');
    values.push(params.status);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';
  if (params.limit) {
    query += ' LIMIT ?';
    values.push(params.limit);
    if (params.offset) {
      query += ' OFFSET ?';
      values.push(params.offset);
    }
  }

  const stmt = db.prepare(query);
  if (values.length > 0) {
    stmt.bind(values);
  }
  const results = stmt.all();
  return results;
}

export async function getErrorsForRun(runId: string): Promise<any[]> {
  const db = await getDB();
  const stmt = db.prepare('SELECT * FROM error_logs WHERE run_id = ? ORDER BY timestamp ASC');
  stmt.bind([runId]);
  return stmt.all();
}

export async function getImprovementTrends(params: {
  startDate?: string;
  endDate?: string;
  type?: string;
}): Promise<any[]> {
  const db = await getDB();
  
  let query = 'SELECT * FROM improvements WHERE 1=1';
  const conditions: string[] = [];
  const values: any[] = [];

  if (params.startDate) {
    conditions.push('timestamp >= ?');
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push('timestamp <= ?');
    values.push(params.endDate);
  }
  if (params.type) {
    conditions.push('type = ?');
    values.push(params.type);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';
  const stmt = db.prepare(query);
  if (values.length > 0) {
    stmt.bind(values);
  }
  return stmt.all();
}

export async function getRunDetails(runId: string) {
  const db = await getDB();
  
  // Get run
  const runStmt = db.prepare('SELECT * FROM test_runs WHERE id = ?');
  runStmt.bind([runId]);
  const run = runStmt.get();
  
  if (!run) {
    return null;
  }

  // Get results with test cases
  const resultsStmt = db.prepare(`
    SELECT 
      tr.*,
      tc.name as test_case_name,
      tc.file_path as test_case_file,
      tc.category as test_case_category,
      tc.strategy as test_case_strategy,
      tc.resilience_phase as test_case_resilience_phase
    FROM test_results tr
    LEFT JOIN test_cases tc ON tr.test_case_id = tc.id
    WHERE tr.run_id = ?
    ORDER BY tr.status DESC
  `);
  resultsStmt.bind([runId]);
  const results = resultsStmt.all();

  // Get errors
  const errors = await getErrorsForRun(runId);

  // Error summary
  const errorSummary = errors.reduce((acc, error) => {
    const key = error.classification;
    if (!acc[key]) {
      acc[key] = { count: 0, errors: [] };
    }
    acc[key].count++;
    acc[key].errors.push(error);
    return acc;
  }, {} as Record<string, { count: number; errors: any[] }>);

  return { run, results, errors, errorSummary };
}

// Utility function to run stats queries
export async function runStatsQuery(query: string, params: any[] = []): Promise<any> {
  const db = await getDB();
  const stmt = db.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }
  return stmt.all();
}

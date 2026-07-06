import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Test Runs table - records each test execution
export const testRuns = sqliteTable('test_runs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(), // ISO-8601
  runner: text('runner').notNull(), // e.g., 'vitest', 'custom-script', 'node'
  strategy: text('strategy').notNull(), // 'unit', 'integration', 'e2e', 'recovery', 'resilience', 'performance'
  suite: text('suite'), // test suite name or file pattern
  environment: text('environment'), // 'development', 'ci', 'production'
  status: text('status').notNull(), // 'passed', 'failed', 'partial', 'interrupted'
  totalTests: integer('total_tests'),
  passedTests: integer('passed_tests'),
  failedTests: integer('failed_tests'),
  skippedTests: integer('skipped_tests'),
  durationMs: integer('duration_ms'),
  gitCommit: text('git_commit'), // commit hash when test was run
  gitBranch: text('git_branch'),
  metadata: text('metadata'), // JSON string for additional context
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
});

// Test Cases table - definitions of individual tests
export const testCases = sqliteTable('test_cases', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  category: text('category'), // e.g., 'attestation', 'queue', 'governance', 'resilience'
  strategy: text('strategy').notNull(),
  resiliencePhase: text('resilience_phase'), // 'detection', 'decision', 'handling', 'observability'
  timeoutMs: integer('timeout_ms'),
  retries: integer('retries').default(0),
  tags: text('tags'), // JSON array of tags
});

// Test Results table - results for each test case in a run
export const testResults = sqliteTable('test_results', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => testRuns.id, { onDelete: 'cascade' }),
  testCaseId: text('test_case_id').notNull().references(() => testCases.id),
  status: text('status').notNull(), // 'passed', 'failed', 'skipped', 'timed_out'
  executionTimeMs: integer('execution_time_ms'),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  resilienceClassification: text('resilience_classification'), // detection, decision, handling, recovery, none
  resilienceAction: text('resilience_action'), // retry, failover, degrade, skip, abort
  errorMetadata: text('error_metadata'), // JSON with error details (type, code, etc.)
  createdAt: integer('created_at', { mode: 'timestamp' }).$default(() => new Date()),
});

// Errors table - detailed error logs with full context
export const errorLogs = sqliteTable('error_logs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => testRuns.id, { onDelete: 'cascade' }),
  testResultId: text('test_result_id').references(() => testResults.id),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(), // 'error', 'warning', 'info', 'debug'
  message: text('message').notNull(),
  stack: text('stack'),
  source: text('source').notNull(), // file path or component name
  classification: text('classification').notNull(), // detection, decision, handling, recovery, system, unknown
  category: text('category'), // 'timeout', 'network', 'validation', 'exception', 'dependency'
  context: text('context'), // JSON with additional context
  resilienceWorkflowApplied: integer('resilience_workflow_applied').default(0), // 0=no, 1=yes
  recoveryAttempted: integer('recovery_attempted').default(0),
  recoverySuccessful: integer('recovery_successful'),
  blastRadius: text('blast_radius'), // 'isolated', 'module', 'system', 'unknown'
});

// Improvements table - tracks code changes and their impact on test results
export const improvements = sqliteTable('improvements', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  type: text('type').notNull(), // 'bugfix', 'optimization', 'refactor', 'feature'
  description: text('description').notNull(),
  gitCommit: text('git_commit').notNull(),
  affectedTests: text('affected_tests'), // JSON array of test IDs
  beforeStats: text('before_stats'), // JSON: { passed, failed, duration, flakiness }
  afterStats: text('after_stats'), // JSON: { passed, failed, duration, flakiness }
  impactAssessment: text('impact_assessment'), // 'significant_improvement', 'improvement', 'neutral', 'regression', 'critical_regression'
  verifiedBy: text('verified_by'), // agent or user who verified
});

// Indexes for performance
export const testResultsRunIdx = index('test_results_run_idx').on(testResults.runId);
export const testResultsTestCaseIdx = index('test_results_test_case_idx').on(testResults.testCaseId);
export const errorLogsRunIdx = index('error_logs_run_idx').on(errorLogs.runId);
export const errorLogsClassificationIdx = index('error_logs_classification_idx').on(errorLogs.classification);

// Zod schemas for validation
export const insertTestRunSchema = createInsertSchema(testRuns);
export const selectTestRunSchema = createSelectSchema(testRuns);
export const insertTestCaseSchema = createInsertSchema(testCases);
export const selectTestCaseSchema = createSelectSchema(testCases);
export const insertTestResultSchema = createInsertSchema(testResults);
export const selectTestResultSchema = createSelectSchema(testResults);
export const insertErrorLogSchema = createInsertSchema(errorLogs);
export const selectErrorLogSchema = createSelectSchema(errorLogs);
export const insertImprovementSchema = createInsertSchema(improvements);
export const selectImprovementSchema = createSelectSchema(improvements);

import { drizzle } from 'drizzle-orm/sqlite';
import initSqlJs from 'sql.js';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import path from 'path';
import fs from 'fs';

const isDevelopment = process.env.NODE_ENV !== 'production';
const dbPath = isDevelopment 
  ? path.join(process.cwd(), 'observability.db')
  : path.join(process.cwd(), '.data', 'observability.db');

// Ensure data directory exists in production
if (!isDevelopment) {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

let dbInstance: any = null;

// SQLite schema definition
export const testRuns = sqliteTable('test_runs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  runner: text('runner').notNull(),
  strategy: text('strategy').notNull(),
  suite: text('suite'),
  environment: text('environment'),
  status: text('status').notNull(),
  totalTests: integer('total_tests'),
  passedTests: integer('passed_tests'),
  failedTests: integer('failed_tests'),
  skippedTests: integer('skipped_tests'),
  durationMs: integer('duration_ms'),
  gitCommit: text('git_commit'),
  gitBranch: text('git_branch'),
  metadata: text('metadata'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(() => Math.floor(Date.now() / 1000)),
});

export const testCases = sqliteTable('test_cases', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  category: text('category'),
  strategy: text('strategy').notNull(),
  resiliencePhase: text('resilience_phase'),
  timeoutMs: integer('timeout_ms'),
  retries: integer('retries').default(0),
  tags: text('tags'),
});

export const testResults = sqliteTable('test_results', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => testRuns.id, { onDelete: 'cascade' }),
  testCaseId: text('test_case_id').notNull().references(() => testCases.id),
  status: text('status').notNull(),
  executionTimeMs: integer('execution_time_ms'),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  resilienceClassification: text('resilience_classification'),
  resilienceAction: text('resilience_action'),
  errorMetadata: text('error_metadata'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(() => Math.floor(Date.now() / 1000)),
});

export const errorLogs = sqliteTable('error_logs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => testRuns.id, { onDelete: 'cascade' }),
  testResultId: text('test_result_id').references(() => testResults.id),
  timestamp: text('timestamp').notNull(),
  level: text('level').notNull(),
  message: text('message').notNull(),
  stack: text('stack'),
  source: text('source').notNull(),
  classification: text('classification').notNull(),
  category: text('category'),
  context: text('context'),
  resilienceWorkflowApplied: integer('resilience_workflow_applied').default(0),
  recoveryAttempted: integer('recovery_attempted').default(0),
  recoverySuccessful: integer('recovery_successful'),
  blastRadius: text('blast_radius'),
});

export const improvements = sqliteTable('improvements', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  gitCommit: text('git_commit').notNull(),
  affectedTests: text('affected_tests'),
  beforeStats: text('before_stats'),
  afterStats: text('after_stats'),
  impactAssessment: text('impact_assessment'),
  verifiedBy: text('verified_by'),
});

// Indexes
export const testResultsRunIdx = index('test_results_run_idx').on(testResults.runId);
export const testResultsTestCaseIdx = index('test_results_test_case_idx').on(testResults.testCaseId);
export const errorLogsRunIdx = index('error_logs_run_idx').on(errorLogs.runId);
export const errorLogsClassificationIdx = index('error_logs_classification_idx').on(errorLogs.classification);

/**
 * Get or initialize database connection
 */
export async function getDb() {
  if (dbInstance) return dbInstance;

  const SqlJs = await initSqlJs();

  // Load existing database file if it exists
  let fileBuffer: Buffer | null = null;
  if (fs.existsSync(dbPath)) {
    fileBuffer = fs.readFileSync(dbPath);
  }

  const sqliteDb = new SqlJs.Database(fileBuffer || undefined);

  // Create tables if they don't exist
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS test_runs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      runner TEXT NOT NULL,
      strategy TEXT NOT NULL,
      suite TEXT,
      environment TEXT,
      status TEXT NOT NULL,
      totalTests INTEGER,
      passedTests INTEGER,
      failedTests INTEGER,
      skippedTests INTEGER,
      durationMs INTEGER,
      git_commit TEXT,
      git_branch TEXT,
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      category TEXT,
      strategy TEXT NOT NULL,
      resilience_phase TEXT,
      timeoutMs INTEGER,
      retries INTEGER DEFAULT 0,
      tags TEXT
    );
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      test_case_id TEXT NOT NULL,
      status TEXT NOT NULL,
      execution_time_ms INTEGER,
      error_message TEXT,
      error_stack TEXT,
      resilience_classification TEXT,
      resilience_action TEXT,
      error_metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
    );
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      test_result_id TEXT,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      source TEXT NOT NULL,
      classification TEXT NOT NULL,
      category TEXT,
      context TEXT,
      resilience_workflow_applied INTEGER DEFAULT 0,
      recovery_attempted INTEGER DEFAULT 0,
      recovery_successful INTEGER,
      blast_radius TEXT,
      FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE,
      FOREIGN KEY (test_result_id) REFERENCES test_results(id)
    );
  `);

  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS improvements (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      git_commit TEXT NOT NULL,
      affected_tests TEXT,
      before_stats TEXT,
      after_stats TEXT,
      impact_assessment TEXT,
      verified_by TEXT
    );
  `);

  // Create indexes
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS test_results_run_idx ON test_results(run_id);`);
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS test_results_test_case_idx ON test_results(test_case_id);`);
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS error_logs_run_idx ON error_logs(run_id);`);
  sqliteDb.run(`CREATE INDEX IF NOT EXISTS error_logs_classification_idx ON error_logs(classification);`);

  dbInstance = drizzle(sqliteDb, { schema });
  return dbInstance;
}

/**
 * Save database to file (call after writes)
 */
export async function saveDatabase() {
  if (!dbInstance) return;
  const sqliteDb = dbInstance.client;
  const data = sqliteDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Export types
export type TestRun = typeof testRuns.$inferSelect;
export type TestCase = typeof testCases.$inferSelect;
export type TestResult = typeof testResults.$inferSelect;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type Improvement = typeof improvements.$inferSelect;

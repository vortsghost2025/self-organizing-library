import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'observability', 'runs');

/**
 * Ensure evidence directory exists
 */
function ensureDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
}

/**
 * Write a test run to disk as JSON
 */
export async function writeRun(run: any): Promise<void> {
  ensureDir();
  const filePath = path.join(EVIDENCE_DIR, `${run.id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(run, null, 2));
}

/**
 * Read a single test run by ID
 */
export async function readRun(runId: string): Promise<any | null> {
  const filePath = path.join(EVIDENCE_DIR, `${runId}.json`);
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

/**
 * List all test run summaries (for listing page)
 */
export async function listRuns(): Promise<any[]> {
  ensureDir();
  const files = await fs.promises.readdir(EVIDENCE_DIR);
  const runFiles = files.filter(f => f.endsWith('.json')).sort().reverse(); // newest first
  
  const runs = [];
  for (const file of runFiles) {
    try {
      const content = await fs.promises.readFile(path.join(EVIDENCE_DIR, file), 'utf8');
      const run = JSON.parse(content);
      // Return summary only
      runs.push({
        id: run.id,
        timestamp: run.timestamp,
        runner: run.runner,
        strategy: run.strategy,
        status: run.status,
        totalTests: run.totalTests,
        passedTests: run.passedTests,
        failedTests: run.failedTests,
        skippedTests: run.skippedTests,
        durationMs: run.durationMs,
        gitCommit: run.gitCommit,
        gitBranch: run.gitBranch,
      });
    } catch (e) {
      console.error(`Failed to parse run file ${file}:`, e);
    }
  }
  
  return runs;
}

/**
 * Query runs with filters
 */
export async function queryRuns(params: {
  startDate?: string;
  endDate?: string;
  strategy?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let runs = await listRuns();
  
  if (params.startDate) {
    runs = runs.filter(r => r.timestamp >= params.startDate!);
  }
  if (params.endDate) {
    runs = runs.filter(r => r.timestamp <= params.endDate!);
  }
  if (params.strategy) {
    runs = runs.filter(r => r.strategy === params.strategy);
  }
  if (params.status) {
    runs = runs.filter(r => r.status === params.status);
  }
  
  if (params.offset) {
    runs = runs.slice(params.offset);
  }
  if (params.limit) {
    runs = runs.slice(0, params.limit);
  }
  
  return runs;
}

/**
 * Update an existing run (for completion)
 */
export async function updateRun(runId: string, updates: any): Promise<void> {
  const existing = await readRun(runId);
  if (!existing) {
    throw new Error(`Run ${runId} not found`);
  }
  const updated = { ...existing, ...updates };
  await writeRun(updated);
}

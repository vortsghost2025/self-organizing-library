import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'observability', 'runs');

/**
 * Helper to read all run files (summaries only)
 */
async function getRunSummaries() {
  if (!fs.existsSync(EVIDENCE_DIR)) return [];
  const files = await fs.promises.readdir(EVIDENCE_DIR);
  const runFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
  
  const summaries = [];
  for (const file of runFiles) {
    try {
      const content = await fs.promises.readFile(path.join(EVIDENCE_DIR, file), 'utf8');
      const run = JSON.parse(content);
      summaries.push({
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
        suite: run.suite,
        environment: run.environment,
        gitCommit: run.gitCommit,
        gitBranch: run.gitBranch,
      });
    } catch (e) {
      console.error(`Failed to parse run file ${file}:`, e);
    }
  }
  return summaries;
}

/**
 * GET /api/observability/runs
 * Query test runs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const strategy = searchParams.get('strategy');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    let summaries = await getRunSummaries();

    if (startDate) summaries = summaries.filter(s => s.timestamp >= startDate);
    if (endDate) summaries = summaries.filter(s => s.timestamp <= endDate);
    if (strategy) summaries = summaries.filter(s => s.strategy === strategy);
    if (status) summaries = summaries.filter(s => s.status === status);

    const total = summaries.length;
    const paged = summaries.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paged,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Error fetching test runs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch test runs' }, { status: 500 });
  }
}

/**
 * POST /api/observability/runs
 * Create a new test run (used by wrapper)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runner, strategy, suite, environment, gitCommit, gitBranch, metadata } = body;

    if (!runner || !strategy) {
      return NextResponse.json({ success: false, error: 'Missing required fields: runner, strategy' }, { status: 400 });
    }

    const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const runFilePath = path.join(EVIDENCE_DIR, `${runId}.json`);

    const run = {
      id: runId,
      timestamp: now,
      runner,
      strategy,
      suite: suite || null,
      environment: environment || 'development',
      status: 'in_progress',
      gitCommit: gitCommit || null,
      gitBranch: gitBranch || null,
      metadata: metadata || null,
      results: [],
      errors: [],
    };

    if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    await fs.promises.writeFile(runFilePath, JSON.stringify(run, null, 2));

    return NextResponse.json({ success: true, data: { id: runId, timestamp: now } });
  } catch (error) {
    console.error('Error creating test run:', error);
    return NextResponse.json({ success: false, error: 'Failed to create test run' }, { status: 500 });
  }
}

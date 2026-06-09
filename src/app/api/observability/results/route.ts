import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'observability', 'runs');

/**
 * GET /api/observability/results?runId=<runId>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');
    
    if (!runId) {
      return NextResponse.json({ success: false, error: 'runId is required' }, { status: 400 });
    }

    const filePath = path.join(EVIDENCE_DIR, `${runId}.json`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Test run not found' }, { status: 404 });
    }

    const content = await fs.promises.readFile(filePath, 'utf8');
    const run = JSON.parse(content);

    // Compute error summary
    const errorSummary: Record<string, { count: number; errors: any[] }> = {};
    for (const err of run.errors) {
      const key = err.classification;
      if (!errorSummary[key]) {
        errorSummary[key] = { count: 0, errors: [] };
      }
      errorSummary[key].count++;
      errorSummary[key].errors.push(err);
    }

    return NextResponse.json({
      success: true,
      data: {
        run,
        results: run.results,
        errors: run.errors,
        errorSummary,
      },
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch test results' }, { status: 500 });
  }
}

/**
 * PATCH /api/observability/results
 * Update test result classification or add metadata
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { resultId, resilienceClassification, resilienceAction } = body;

    if (!resultId) {
      return NextResponse.json({ success: false, error: 'resultId is required' }, { status: 400 });
    }

    // For file storage, updating individual results in a run file is tricky.
    // In a real implementation, we would read the run, find the result, update it, and write back.
    // For now, we acknowledge but this is a simplification.
    return NextResponse.json({ success: true, message: 'Update not implemented in file-based mode' });
  } catch (error) {
    console.error('Error updating test result:', error);
    return NextResponse.json({ success: false, error: 'Failed to update test result' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'observability', 'runs');

/**
 * GET /api/observability/errors
 * Flatten all errors from all runs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const classification = searchParams.get('classification');
    const category = searchParams.get('category');
    const runId = searchParams.get('runId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    if (!fs.existsSync(EVIDENCE_DIR)) {
      return NextResponse.json({ success: true, data: [], summary: [] });
    }

    const files = await fs.promises.readdir(EVIDENCE_DIR);
    const runFiles = files.filter(f => f.endsWith('.json'));

    let allErrors = [];
    for (const file of runFiles) {
      try {
        const content = await fs.promises.readFile(path.join(EVIDENCE_DIR, file), 'utf8');
        const run = JSON.parse(content);
        for (const err of run.errors || []) {
          // Attach runId to error
          err.runId = run.id;
          allErrors.push(err);
        }
      } catch (e) {
        console.error(`Failed to read run file ${file}:`, e);
      }
    }

    // Sort by timestamp desc
    allErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filtered = allErrors;
    if (startDate) filtered = filtered.filter(e => e.timestamp >= startDate);
    if (endDate) filtered = filtered.filter(e => e.timestamp <= endDate);
    if (classification) filtered = filtered.filter(e => e.classification === classification);
    if (category) filtered = filtered.filter(e => e.category === category);
    if (runId) filtered = filtered.filter(e => e.runId === runId);

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    // Summary classification breakdown
    const summaryMap: Record<string, number> = {};
    for (const err of filtered) {
      const key = err.classification;
      summaryMap[key] = (summaryMap[key] || 0) + 1;
    }
    const summary = Object.entries(summaryMap).map(([classification, count]) => ({ classification, count }));

    return NextResponse.json({
      success: true,
      data: paged,
      summary,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Error fetching errors:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch error logs' }, { status: 500 });
  }
}

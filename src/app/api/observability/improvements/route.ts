import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const IMPROVEMENTS_DIR = path.join(process.cwd(), 'evidence', 'observability', 'improvements');

async function getAllImprovements() {
  if (!fs.existsSync(IMPROVEMENTS_DIR)) return [];
  const files = await fs.promises.readdir(IMPROVEMENTS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
  
  const improvements = [];
  for (const file of jsonFiles) {
    try {
      const content = await fs.promises.readFile(path.join(IMPROVEMENTS_DIR, file), 'utf8');
      improvements.push(JSON.parse(content));
    } catch (e) {
      console.error(`Failed to parse improvement file ${file}:`, e);
    }
  }
  return improvements;
}

/**
 * GET /api/observability/improvements
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    let improvements = await getAllImprovements();

    if (type) improvements = improvements.filter(i => i.type === type);

    const total = improvements.length;
    const paged = improvements.slice(offset, offset + limit);

    // Summary by impact
    const summaryMap: Record<string, number> = {};
    for (const imp of improvements) {
      const key = imp.impact_assessment || 'unassessed';
      summaryMap[key] = (summaryMap[key] || 0) + 1;
    }
    const summary = Object.entries(summaryMap).map(([impact_assessment, count]) => ({ impact_assessment, count }));

    return NextResponse.json({
      success: true,
      data: paged,
      summary,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('Error fetching improvements:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch improvements' }, { status: 500 });
  }
}

/**
 * POST /api/observability/improvements
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, description, gitCommit, affectedTests, beforeStats, afterStats, impactAssessment, verifiedBy } = body;

    if (!type || !description || !gitCommit) {
      return NextResponse.json({ success: false, error: 'Missing required fields: type, description, gitCommit' }, { status: 400 });
    }

    const improvementId = randomUUID();
    const timestamp = new Date().toISOString();
    const improvement = {
      id: improvementId,
      timestamp,
      type,
      description,
      gitCommit,
      affectedTests,
      beforeStats,
      afterStats,
      impactAssessment,
      verifiedBy,
    };

    if (!fs.existsSync(IMPROVEMENTS_DIR)) fs.mkdirSync(IMPROVEMENTS_DIR, { recursive: true });
    const filePath = path.join(IMPROVEMENTS_DIR, `${improvementId}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(improvement, null, 2));

    return NextResponse.json({ success: true, data: { id: improvementId, timestamp } });
  } catch (error) {
    console.error('Error creating improvement record:', error);
    return NextResponse.json({ success: false, error: 'Failed to create improvement record' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { collectTimelineEvents, collectSnapshotDiffs } from '@/lib/system-timeline';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const type = searchParams.get('type');
  const includeDiffs = searchParams.get('diffs') === 'true';

  try {
    let events = collectTimelineEvents(limit);
    if (type) {
      events = events.filter(e => e.type === type || e.lane === type);
    }

    const response: Record<string, any> = {
      success: true,
      events,
      count: events.length,
    };

    if (includeDiffs) {
      response.snapshot_diffs = collectSnapshotDiffs();
    }

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

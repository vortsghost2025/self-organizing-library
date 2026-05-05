import { NextRequest, NextResponse } from 'next/server';
import { collectTimelineEvents } from '@/lib/system-timeline';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const type = searchParams.get('type');

  try {
    let events = collectTimelineEvents(limit);
    if (type) {
      events = events.filter(e => e.type === type || e.lane === type);
    }

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

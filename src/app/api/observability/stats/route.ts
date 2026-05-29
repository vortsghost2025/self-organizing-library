import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'observability', 'runs');

function getDaysAgo(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 7;
    const endDate = new Date().toISOString();
    const startDate = getDaysAgo(endDate, days);

    if (!fs.existsSync(EVIDENCE_DIR)) {
      return NextResponse.json({ success: true, data: {
        period: { startDate, endDate, days },
        runsByStatusStrategy: [],
        passFailByDay: [],
        errorClassification: [],
        slowestRuns: [],
        frequentErrors: [],
        latestRuns: [],
      }});
    }

    const files = await fs.promises.readdir(EVIDENCE_DIR);
    const runFiles = files.filter(f => f.endsWith('.json'));

    const runs: any[] = [];
    for (const file of runFiles) {
      try {
        const content = await fs.promises.readFile(path.join(EVIDENCE_DIR, file), 'utf8');
        const run = JSON.parse(content);
        runs.push(run);
      } catch (e) {
        console.error(`Failed to read run file ${file}:`, e);
      }
    }

    // Filter by date range
    const filtered = runs.filter(r => r.timestamp >= startDate && r.timestamp <= endDate);

    // Summary by status and strategy
    const runsByStatusStrategy: Record<string, any> = {};
    for (const run of filtered) {
      const key = `${run.status}|${run.strategy}`;
      if (!runsByStatusStrategy[key]) {
        runsByStatusStrategy[key] = { status: run.status, strategy: run.strategy, count: 0 };
      }
      runsByStatusStrategy[key].count++;
    }
    const statusStrategyArr = Object.values(runsByStatusStrategy);

    // Pass/fail by day (aggregate test results)
    const byDay: Record<string, { passed: number; failed: number; total: number }> = {};
    for (const run of filtered) {
      const day = run.timestamp.split('T')[0];
      if (!byDay[day]) byDay[day] = { passed: 0, failed: 0, total: 0 };
      byDay[day].passed += run.passedTests || 0;
      byDay[day].failed += run.failedTests || 0;
      byDay[day].total += run.totalTests || 0;
    }
    const passFailByDay = Object.entries(byDay)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Error classification
    const classifCounts: Record<string, number> = {};
    for (const run of filtered) {
      for (const err of run.errors || []) {
        const key = err.classification;
        classifCounts[key] = (classifCounts[key] || 0) + 1;
      }
    }
    const errorClassification = Object.entries(classifCounts).map(([classification, count]) => ({ classification, count }));

    // Slowest runs
    const slowestRuns = filtered
      .filter(r => r.durationMs)
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10)
      .map(r => ({ id: r.id, timestamp: r.timestamp, strategy: r.strategy, status: r.status, durationMs: r.durationMs }));

    // Frequent error messages
    const msgCounts: Record<string, number> = {};
    for (const run of filtered) {
      for (const err of run.errors || []) {
        const key = err.message;
        msgCounts[key] = (msgCounts[key] || 0) + 1;
      }
    }
    const frequentErrors = Object.entries(msgCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Latest runs
    const latestRuns = filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(r => ({ id: r.id, timestamp: r.timestamp, strategy: r.strategy, status: r.status, totalTests: r.totalTests, passedTests: r.passedTests, durationMs: r.durationMs }));

    return NextResponse.json({
      success: true,
      data: {
        period: { startDate, endDate, days },
        runsByStatusStrategy: statusStrategyArr,
        passFailByDay,
        errorClassification,
        slowestRuns,
        frequentErrors,
        latestRuns,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd());

function readJsonSafe(relativePath: string): any | null {
  const fullPath = join(PROJECT_ROOT, relativePath);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function GET() {
  const usageReport = readJsonSafe('verification/usage-lane-complete-report.json');
  const hardeningResults = readJsonSafe('verification/hardening-drill-results.json');
  const behavioralResults = readJsonSafe('verification/behavioral-test-results.json');
  const recoveryResults = readJsonSafe('verification/recovery-discipline-results.json');

  const summary = usageReport?.summary || { total: 0, active: 0, dormant: 0, dead: 0, bypassed: 0 };
  const bypassSummary = usageReport?.bypass?.summary || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
  const proofSummary = usageReport?.proof?.summary || { total: 0, proven: 0, notProven: 0 };

  return NextResponse.json({
    artifacts: summary,
    bypass: bypassSummary,
    proof: proofSummary,
    gateStatus: usageReport?.gateStatus || 'UNKNOWN',
    lastRun: usageReport?.timestamp || null,
    drills: {
      hardening: hardeningResults
        ? { passed: hardeningResults.passed, failed: hardeningResults.failed, total: hardeningResults.total, timestamp: hardeningResults.timestamp }
        : null,
      behavioral: behavioralResults
        ? { passed: behavioralResults.passed, failed: behavioralResults.failed, timestamp: behavioralResults.timestamp }
        : null,
      recovery: recoveryResults
        ? { passed: recoveryResults.passed, failed: recoveryResults.failed, total: recoveryResults.total, timestamp: recoveryResults.timestamp }
        : null,
    },
  });
}

import { NextResponse } from 'next/server';
import { readFileSync, existsSync, readdirSync } from 'fs';
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
  const hardening = readJsonSafe('verification/hardening-drill-results.json');
  const behavioral = readJsonSafe('verification/behavioral-test-results.json');
  const recovery = readJsonSafe('verification/recovery-discipline-results.json');
  const usage = readJsonSafe('verification/usage-lane-complete-report.json');

  return NextResponse.json({
    hardening: hardening || { error: 'File not found' },
    behavioral: behavioral || { error: 'File not found' },
    recovery: recovery || { error: 'File not found' },
    usage: usage || { error: 'File not found' },
  });
}

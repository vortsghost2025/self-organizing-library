import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const req = createRequire(import.meta.url);
const path: any = req('path');
const fs: any = req('fs');
const safeJoin = (...parts: string[]): string => path.join(...parts);
const safeFs = fs;

function readJsonSafe(relativePath: string): any | null {
  try {
    const fullPath = safeJoin(process.cwd(), relativePath);
    if (!safeFs.existsSync(fullPath)) return null;
    return JSON.parse(safeFs.readFileSync(fullPath, 'utf-8'));
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

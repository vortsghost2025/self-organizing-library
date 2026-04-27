import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd());

const LANE_HEARTBEATS: Record<string, string> = {
  library: join(PROJECT_ROOT, 'lanes/library/inbox/heartbeat-library.json'),
  archivist: join('S:/Archivist-Agent/lanes/archivist/inbox/heartbeat-archivist.json'),
   swarmmind: join('S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/swarmmind/inbox/heartbeat-swarmmind.json'),
  kernel: join('S:/kernel-lane/lanes/kernel/inbox/heartbeat-kernel.json'),
};

const FRESHNESS_THRESHOLD_MS = 900 * 1000; // 15 minutes
const INDIRECT_THRESHOLD_MS = 3600 * 1000; // 1 hour

function readJsonSafe(fullPath: string): any | null {
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch {
    return null;
  }
}

function classifyFreshness(ageMs: number): string {
  if (ageMs <= FRESHNESS_THRESHOLD_MS) return 'FRESH';
  if (ageMs <= INDIRECT_THRESHOLD_MS) return 'INDIRECT';
  return 'NO_RECENT_SIGNAL';
}

export async function GET() {
  const now = Date.now();
  const lanes = Object.entries(LANE_HEARTBEATS).map(([lane, path]) => {
    const hb = readJsonSafe(path);
    if (!hb) {
      return { lane, status: 'NO_RECENT_SIGNAL', lastHeartbeat: null, ageSeconds: null };
    }
    const hbTime = hb.timestamp ? new Date(hb.timestamp).getTime() : null;
    const ageMs = hbTime ? now - hbTime : null;
    const freshness = ageMs !== null ? classifyFreshness(ageMs) : 'NO_RECENT_SIGNAL';
    return {
      lane,
      status: freshness,
      lastHeartbeat: hb.timestamp || null,
      ageSeconds: ageMs !== null ? Math.round(ageMs / 1000) : null,
      mode: hb.mode || null,
      sessionId: hb.session_id || null,
    };
  });

  return NextResponse.json(lanes);
}

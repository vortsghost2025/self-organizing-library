import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const { getSiteIndex } = await import('@/lib/site-index');
    let indexStatus = 'unknown';
    try {
      const index = getSiteIndex();
      indexStatus = index.entries.length > 0 ? 'healthy' : 'degraded';
    } catch {
      indexStatus = 'unhealthy';
    }

    const repoRoot = path.join(process.cwd());
    const lanesDir = path.join(repoRoot, 'lanes');
    const fsStatus = fs.existsSync(lanesDir) ? 'healthy' : 'unhealthy';

    const inboxPath = path.join(lanesDir, 'library', 'inbox');
    const watcherStatus = fs.existsSync(inboxPath) ? 'healthy' : 'unhealthy';

    const identityPath = path.join(repoRoot, '.identity', 'snapshot.json');
    const identityStatus = fs.existsSync(identityPath) ? 'healthy' : 'unhealthy';

    const trustStorePath = path.join(lanesDir, 'broadcast', 'trust-store.json');
    let trustStoreStatus = 'unhealthy';
    if (fs.existsSync(trustStorePath)) {
      try {
        const trustStore = JSON.parse(fs.readFileSync(trustStorePath, 'utf8'));
        const laneCount = Object.keys(trustStore).length;
        trustStoreStatus = laneCount >= 4 ? 'healthy' : 'degraded';
      } catch {
        trustStoreStatus = 'unhealthy';
      }
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        site_index: indexStatus,
        filesystem: fsStatus,
        inbox_watcher: watcherStatus,
        identity: identityStatus,
        trust_store: trustStoreStatus
      }
    };

    const allHealthy = Object.values(health.checks).every(status => status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
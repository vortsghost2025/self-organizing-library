import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { documents } from '@/db/schema';

export async function GET() {
  try {
    // Check database connectivity
    let dbStatus = 'unknown';
    try {
      const { db } = await import('@/db');
      // Simple connectivity check
      const result = await db.$count(documents);
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    // Check file system access
    const repoRoot = path.join(process.cwd());
    const lanesDir = path.join(repoRoot, 'lanes');
    const fsStatus = fs.existsSync(lanesDir) ? 'healthy' : 'unhealthy';

    // Check inbox watcher status
    const inboxPath = path.join(lanesDir, 'library', 'inbox');
    const watcherStatus = fs.existsSync(inboxPath) ? 'healthy' : 'unhealthy';

    // Check identity status
    const identityPath = path.join(repoRoot, '.identity', 'snapshot.json');
    const identityStatus = fs.existsSync(identityPath) ? 'healthy' : 'unhealthy';

    // Check trust store
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
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
      checks: {
        database: dbStatus,
        filesystem: fsStatus,
        inbox_watcher: watcherStatus,
        identity: identityStatus,
        trust_store: trustStoreStatus
      }
    };

    // Overall status is healthy only if all checks pass
    const allHealthy = Object.values(health.checks).every(status => status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
#!/usr/bin/env node
/**
 * Graph Snapshot Watcher Runner Script
 *
 * Watches lanes/broadcast/graph-snapshots/ for new graph snapshot JSON files
 * and triggers the analysis pipeline when new snapshots appear.
 *
 * Usage:
 *   node scripts/watch-graph-snapshots.ts [--once] [--interval=N]
 *
 * Options:
 *   --once         Check once and exit (don't watch continuously)
 *   --interval N   Poll interval in seconds (default: 30)
 *   --help         Show usage
 */

import { join } from 'path';
import { GraphSnapshotWatcher, ProcessingResult, GraphSnapshot } from '../src/lib/analysis/graph-snapshot-watcher';

const DEFAULT_INTERVAL = 30;

function parseArgs(): { once: boolean; interval: number } {
  const args = process.argv.slice(2);
  let once = false;
  let interval = DEFAULT_INTERVAL;

  for (const arg of args) {
    if (arg === '--once') once = true;
    else if (arg.startsWith('--interval=')) {
      interval = parseInt(arg.split('=')[1], 10) || DEFAULT_INTERVAL;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Graph Snapshot Watcher

Usage:
  node scripts/watch-graph-snapshots.ts [--once] [--interval=N]

Options:
  --once           Check once and exit
  --interval N     Poll interval in seconds (default: 30)
  --help, -h       Show this help

Description:
  Watches lanes/broadcast/graph-snapshots/ for new graph snapshots
  and triggers the analysis pipeline on each new snapshot.
`);
      process.exit(0);
    }
  }

  return { once, interval };
}

function defaultProcessor(snapshot: GraphSnapshot, filePath: string): Promise<ProcessingResult> {
  const fileName = filePath.split('/').pop() || 'unknown';
  
  // Log snapshot details
  console.log(`[${new Date().toISOString()}] Analyzing snapshot: ${fileName}`);
  console.log(`  Nodes: ${snapshot.nodes.length}, Edges: ${snapshot.edges.length}`);
  console.log(`  Clusters: ${snapshot.clusters?.length || 0}`);
  console.log(`  Entry Points: ${snapshot.entry_points?.length || 0}`);

  // Calculate basic metrics
  const statusCounts = { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  for (const node of snapshot.nodes) {
    const key = node.status.toLowerCase() as keyof typeof statusCounts;
    if (key in statusCounts) statusCounts[key]++;
  }

  const contradictionNodes = snapshot.nodes.filter(n => n.contradictionCount > 0);
  const highAuthorityNodes = snapshot.nodes.filter(n => n.authorityDepth > 50);
  const unverifiedNodes = snapshot.nodes.filter(n => n.status === 'UNVERIFIED');

  console.log(`  Status: ${JSON.stringify(statusCounts)}`);
  console.log(`  Contradiction nodes: ${contradictionNodes.length}`);
  console.log(`  High authority nodes: ${highAuthorityNodes.length}`);
  console.log(`  Unverified nodes: ${unverifiedNodes.length}`);

  // Return findings for adapter pipeline
  return Promise.resolve({
    success: true,
    findings: [
      ...contradictionNodes.map(n => ({
        node_id: n.id,
        issue_type: 'contradiction',
        severity: 'high' as const,
        description: `Node '${n.title}' has contradictionCount=${n.contradictionCount}`,
        suggested_action: 'Review contradiction source - may be CDC=39 tag-group artifact'
      })),
      ...unverifiedNodes.slice(0, 10).map(n => ({
        node_id: n.id,
        issue_type: 'unverified',
        severity: 'medium' as const,
        description: `Node '${n.title}' is unverified`,
        suggested_action: 'Verify node content or mark as intentional'
      }))
    ]
  });
}

async function main(): Promise<void> {
  const { once, interval } = parseArgs();

  const watcher = new GraphSnapshotWatcher({
    pollInterval: interval,
    logger: console.log
  });

  watcher.setProcessor(defaultProcessor);

	if (once) {
		console.log(`[${new Date().toISOString()}] Checking for new snapshots...`);
		const status = watcher.getStatus();
		console.log(`Status: ${JSON.stringify(status)}`);
		process.exit(0);
	} else {
    // Continuous watch mode
    await watcher.start();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
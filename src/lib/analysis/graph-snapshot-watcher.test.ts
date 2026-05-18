import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { GraphSnapshotWatcher, createWatcher } from './graph-snapshot-watcher';
import type { GraphSnapshot, ProcessingResult } from './graph-snapshot-watcher';
import type { GraphNode, GraphEdge, Cluster, EntryPoint } from '../graph-types';

function makeNode(id: string): GraphNode {
  return {
    id,
    title: `Node ${id}`,
    type: 'doc',
    category: 'test',
    repo: 'test-repo',
    connectionCount: 1,
    tags: [],
    status: 'UNVERIFIED',
    verificationCount: 0,
    contradictionCount: 0,
    clusterIds: [],
    governanceLayer: 'operational',
    authorityDepth: 0,
    bridgeState: 'unknown',
    graphSection: 'core',
    authorityWeight: 'normal',
    exteriorRole: '',
  };
}

function makeEdge(source: string, target: string): GraphEdge {
  return { source, target, type: 'DERIVES_FROM' };
}

function makeSnapshot(overrides: Partial<GraphSnapshot> = {}): GraphSnapshot {
  return {
    visible_node_count: 2,
    visible_edge_count: 1,
    selected_node_ids: [],
    selected_edge_ids: [],
    interpretation_status: 'observation',
    nodes: [makeNode('n1'), makeNode('n2')],
    edges: [makeEdge('n1', 'n2')],
    clusters: [],
  repo_filter: [],
  entry_points: [],
  ...overrides,
  };
}

function makeValidFilename(): string {
  const d = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  return `graph-snapshot-${d}-reduced.json`;
}

describe('GraphSnapshotWatcher', () => {
  let tmpDir: string;
  let stateFile: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'gsw-test-'));
    stateFile = join(tmpDir, 'watcher-state.json');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('constructs with custom snapshotDir', () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    expect(watcher).toBeInstanceOf(GraphSnapshotWatcher);
  });

  it('createWatcher factory returns GraphSnapshotWatcher instance', () => {
    const watcher = createWatcher({ snapshotDir: tmpDir, stateFile });
    expect(watcher).toBeInstanceOf(GraphSnapshotWatcher);
  });

  it('getStatus returns initial state', () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const status = watcher.getStatus();
    expect(status.running).toBe(false);
    expect(status.queue).toBe(0);
  });

  it('recognizes valid snapshot filenames ending in -reduced.json', () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const filename = makeValidFilename();
    const snapshot = makeSnapshot();
    writeFileSync(join(tmpDir, filename), JSON.stringify(snapshot));
    const status = watcher.getStatus();
    expect(status.processed).toBe(0);
  });

  it('processes a valid snapshot file', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const logs: string[] = [];
    const logger = (msg: string) => logs.push(msg);
    (watcher as unknown as { logger: (msg: string) => void }).logger = logger;

    const filename = makeValidFilename();
    const snapshot = makeSnapshot();
    writeFileSync(join(tmpDir, filename), JSON.stringify(snapshot));

    const result = await watcher.processSnapshot(join(tmpDir, filename));
    expect(result.success).toBe(true);
  });

  it('rejects invalid snapshot file (missing nodes)', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const filename = makeValidFilename();
    writeFileSync(join(tmpDir, filename), JSON.stringify({ edges: [] }));

    const result = await watcher.processSnapshot(join(tmpDir, filename));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  it('rejects non-JSON file', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const filename = makeValidFilename();
    writeFileSync(join(tmpDir, filename), 'not-json');

    const result = await watcher.processSnapshot(join(tmpDir, filename));
    expect(result.success).toBe(false);
  });

  it('calls registered processor on valid snapshot', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const logs: string[] = [];
    (watcher as unknown as { logger: (msg: string) => void }).logger = (msg: string) => logs.push(msg);

    let receivedSnapshot: GraphSnapshot | null = null;
    let receivedPath: string | null = null;

    watcher.setProcessor(async (snapshot, filePath) => {
      receivedSnapshot = snapshot;
      receivedPath = filePath;
      return { success: true, findings: ['test-finding'] };
    });

    const filename = makeValidFilename();
    const snapshot = makeSnapshot();
    writeFileSync(join(tmpDir, filename), JSON.stringify(snapshot));

    const result = await watcher.processSnapshot(join(tmpDir, filename));
    expect(result.success).toBe(true);
    expect(receivedSnapshot).not.toBeNull();
    expect(receivedSnapshot!.nodes).toHaveLength(2);
    expect(receivedPath).toContain(filename);
  });

  it('handles processor error gracefully', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const logs: string[] = [];
    (watcher as unknown as { logger: (msg: string) => void }).logger = (msg: string) => logs.push(msg);

    watcher.setProcessor(async () => {
      throw new Error('processor exploded');
    });

    const filename = makeValidFilename();
    const snapshot = makeSnapshot();
    writeFileSync(join(tmpDir, filename), JSON.stringify(snapshot));

    const result = await watcher.processSnapshot(join(tmpDir, filename));
    expect(result.success).toBe(false);
    expect(result.error).toContain('processor exploded');
  });

  it('succeeds without processor registered (skip analysis)', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const logs: string[] = [];
    (watcher as unknown as { logger: (msg: string) => void }).logger = (msg: string) => logs.push(msg);

    const filename = makeValidFilename();
    const snapshot = makeSnapshot();
    writeFileSync(join(tmpDir, filename), JSON.stringify(snapshot));

    const result = await watcher.processSnapshot(join(tmpDir, filename));
    expect(result.success).toBe(true);
    expect(logs.some(l => l.includes('No processor registered'))).toBe(true);
  });

  it('ignores files not matching -reduced.json pattern', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const analysisFile = `graph-snapshot-2026-05-12T09-00-00-analysis.json`;
    writeFileSync(join(tmpDir, analysisFile), JSON.stringify(makeSnapshot()));

    const validFile = makeValidFilename();
    writeFileSync(join(tmpDir, validFile), JSON.stringify(makeSnapshot()));

    const newSnapshots = (watcher as unknown as { getNewSnapshots: () => { name: string }[] }).getNewSnapshots();
    const names = newSnapshots.map(s => s.name);
    expect(names).toContain(validFile);
    expect(names).not.toContain(analysisFile);
  });

  it('does not re-process already processed snapshots with same mtime', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    const filename = makeValidFilename();
    const snapshot = makeSnapshot();
    const filePath = join(tmpDir, filename);
    writeFileSync(filePath, JSON.stringify(snapshot));

    await watcher.processSnapshot(filePath);
    const afterFirst = watcher.getStatus();
    expect(afterFirst.processed).toBe(1);

    const pollResult = (watcher as unknown as { getNewSnapshots: () => unknown[] }).getNewSnapshots();
    expect(pollResult).toHaveLength(0);
  });

  it('stop sets running to false', async () => {
    const watcher = new GraphSnapshotWatcher({ snapshotDir: tmpDir, stateFile });
    await watcher.stop();
    expect(watcher.getStatus().running).toBe(false);
  });
});

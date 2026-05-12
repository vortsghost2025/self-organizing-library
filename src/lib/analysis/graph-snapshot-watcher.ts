import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import type { GraphNode, GraphEdge, Cluster, EntryPoint } from '../graph-types';

export interface GraphSnapshot {
  snapshot_id?: string;
  created_at?: string;
  created_by?: string;
  graph_data_hash?: string;
  site_index_hash?: string;
  repo_filter: string[];
  type_filter?: string[];
  entry_point_filter?: string;
  meaning_layers_enabled?: string[];
  density_mode?: string;
  zoom_mode?: string;
  visible_node_cap?: number;
  visible_node_count: number;
  visible_edge_count: number;
  total_available_nodes?: number;
  total_available_edges?: number;
  status_counts?: { verified: number; unverified: number; conflicted: number; quarantined: number };
  selected_node_ids: string[];
  selected_edge_ids: string[];
  interpretation_status: "observation" | string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  entry_points: EntryPoint[];
}

export interface SnapshotProcessor {
  (snapshot: GraphSnapshot, filePath: string): Promise<ProcessingResult>;
}

export interface ProcessingResult {
  success: boolean;
  findings?: unknown[];
  error?: string;
}

export interface WatcherOptions {
  snapshotDir?: string;
  pollInterval?: number;
  logger?: (msg: string) => void;
  stateFile?: string;
}

export interface WatcherState {
  processed: Record<string, number>;
}

const SNAPSHOT_PATTERN = /^graph-snapshot-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/;

function isValidSnapshot(obj: unknown): obj is GraphSnapshot {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  // Must have nodes AND edges arrays (full graph format)
  // analysis JSON files have overview/contradiction_nodes etc but no nodes/edges
  return Array.isArray(s.nodes) && Array.isArray(s.edges) && s.nodes.length > 0;
}

export class GraphSnapshotWatcher {
  private snapshotDir: string;
  private processor: SnapshotProcessor | null = null;
  private stateFile: string;
  private state: WatcherState;
  private pollInterval: number;
  private logger: (msg: string) => void;
  private isRunning = false;
  private processingQueue: string[] = [];
  private isProcessing = false;

  constructor(options: WatcherOptions = {}) {
    this.snapshotDir = options.snapshotDir || join(process.cwd(), 'lanes', 'broadcast', 'graph-snapshots');
    this.pollInterval = options.pollInterval || 30;
    this.logger = options.logger || console.log;
    this.stateFile = options.stateFile || join(process.cwd(), '.cache', 'graph-snapshot-watcher-state.json');
    this.state = this.loadState();
  }

  private loadState(): WatcherState {
    try {
      if (existsSync(this.stateFile)) {
        const data = readFileSync(this.stateFile, 'utf8');
        return JSON.parse(data) as WatcherState;
      }
    } catch {
      // State file corrupted or missing, start fresh
    }
    return { processed: {} };
  }

  private saveState(): void {
  const stateDir = join(this.stateFile, '..');
  if (!existsSync(stateDir)) {
  mkdirSync(stateDir, { recursive: true });
  }
  writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  private isValidSnapshotFile(filename: string): boolean {
    // Only accept reduced.json files which have the full graph structure
    // analysis.json files have a different summary format
    return SNAPSHOT_PATTERN.test(filename) && filename.endsWith('-reduced.json');
  }

  private getSnapshotFiles(): Array<{ name: string; path: string; mtime: number }> {
    if (!existsSync(this.snapshotDir)) {
      return [];
    }

	const files = readdirSync(this.snapshotDir)
      .filter((f: string) => this.isValidSnapshotFile(f))
      .map((f: string) => {
        const fullPath = join(this.snapshotDir, f);
        return {
          name: f,
          path: fullPath,
          mtime: statSync(fullPath).mtimeMs
        };
      })
      .sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime);

    return files;
  }

  private getNewSnapshots(): Array<{ name: string; path: string; mtime: number }> {
    const files = this.getSnapshotFiles();
    return files.filter(f => {
      return !this.state.processed[f.name] || this.state.processed[f.name] < f.mtime;
    });
  }

  private async readFileWithRetry(path: string, maxRetries = 3, delay = 100): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return readFileSync(path, 'utf8');
      } catch (err) {
        if (attempt === maxRetries) throw err;
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private parseSnapshotFile(filePath: string): GraphSnapshot | null {
    try {
      const content = readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      if (isValidSnapshot(parsed)) {
        return parsed as GraphSnapshot;
      }
      return null;
    } catch {
      return null;
    }
  }

  setProcessor(processor: SnapshotProcessor): void {
    this.processor = processor;
  }

  async processSnapshot(filePath: string): Promise<ProcessingResult> {
    const fileName = basename(filePath);
    
    // Wait for file to be fully written (debounce)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate and parse snapshot
    const snapshot = this.parseSnapshotFile(filePath);
    if (!snapshot) {
      this.logger(`[WARN] Invalid snapshot format: ${fileName}`);
      return { success: false, error: 'Invalid JSON or missing required fields' };
    }

    if (!snapshot.nodes || !snapshot.edges) {
      this.logger(`[WARN] Snapshot missing nodes/edges: ${fileName}`);
      return { success: false, error: 'Missing nodes or edges in snapshot' };
    }

    this.logger(`[${new Date().toISOString()}] Processing snapshot: ${fileName}`);
    this.logger(` Nodes: ${snapshot.nodes.length}, Edges: ${snapshot.edges.length}`);

    this.state.processed[fileName] = statSync(filePath).mtimeMs;
    this.saveState();

    if (!this.processor) {
      this.logger(`[WARN] No processor registered, skipping analysis`);
      return { success: true };
    }

    try {
      const result = await this.processor(snapshot, filePath);
      return result;
    } catch (err) {
      this.logger(`[ERROR] Processing error for ${fileName}: ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;
    this.logger(`[DEBUG] Processing ${this.processingQueue.length} queued snapshots`);

    while (this.processingQueue.length > 0) {
      const filePath = this.processingQueue.shift()!;
      await this.processSnapshot(filePath);
    }

    this.isProcessing = false;
  }

  private async poll(): Promise<void> {
    const newSnapshots = this.getNewSnapshots();
    
    if (newSnapshots.length === 0) {
      return;
    }

    this.logger(`[${new Date().toISOString()}] Found ${newSnapshots.length} new snapshot(s)`);

    for (const snapshot of newSnapshots) {
      this.processingQueue.push(snapshot.path);
    }

    await this.processQueue();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.logger(`
╔══════════════════════════════════════════════════════════╗
║     GRAPH SNAPSHOT WATCHER                              ║
║     Watching: ${this.snapshotDir}
╚══════════════════════════════════════════════════════════╝
`);

    // Initial poll
    await this.poll();

    // Set up interval polling
    const interval = setInterval(async () => {
      try {
        await this.poll();
      } catch (err) {
        this.logger(`[ERROR] Poll error: ${(err as Error).message}`);
      }
    }, this.pollInterval * 1000);

    // Handle shutdown
    const shutdown = () => {
      this.logger('\nShutting down watcher...');
      this.isRunning = false;
      clearInterval(interval);
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  getStatus(): { running: boolean; queue: number; processed: number } {
    return {
      running: this.isRunning,
      queue: this.processingQueue.length,
      processed: Object.keys(this.state.processed).length
    };
  }
}

export function createWatcher(options?: WatcherOptions): GraphSnapshotWatcher {
  return new GraphSnapshotWatcher(options);
}
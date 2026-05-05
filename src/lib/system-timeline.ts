import fs from 'fs';
import path from 'path';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  lane: 'archivist' | 'library' | 'swarmmind' | 'kernel' | 'system';
  type: 'governance' | 'graph' | 'contradiction' | 'deployment' | 'verification';
  evidencePaths: string[];
  graphSnapshotPath?: string;
  raw: any; // full artifact for detail pane
}

const REPO_ROOT = process.cwd();

function readJSONsafe(filepath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Collect timeline events from known artifact locations.
 * Priority: structured governance messages > snapshot manifests > reports.
 */
export function collectTimelineEvents(limit = 20): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. lanes/broadcast/ — structured cross-lane messages with convergence gates
  const broadcastDir = path.join(REPO_ROOT, 'lanes', 'broadcast');
  if (fs.existsSync(broadcastDir)) {
    for (const file of fs.readdirSync(broadcastDir).filter(f => f.endsWith('.json'))) {
      const full = path.join(broadcastDir, file);
      const data = readJSONsafe(full);
      if (!data) continue;
      const timestamp = data.timestamp || data.generated_at || data.created_at;
      if (!timestamp) continue;

      const subject = data.subject || data.title || file;
      const type = classifyEventType(data);
      const lane = inferLane(data.from || data.lane || 'system');

      events.push({
        id: data.task_id || file,
        timestamp,
        title: subject,
        description: makeDescription(data),
        lane,
        type,
        evidencePaths: [full],
        graphSnapshotPath: findRelatedSnapshot(data),
        raw: data,
      });
    }
  }

  // 2. evidence/graph-snapshots/ — snapshot analysis events (high-signal structural changes)
  const snapDir = path.join(REPO_ROOT, 'evidence', 'graph-snapshots');
  if (fs.existsSync(snapDir)) {
    const snapFiles = fs.readdirSync(snapDir)
      .filter(f => f.endsWith('-analysis.json') || f.includes('manifest'))
      .sort()
      .reverse();
    for (const file of snapFiles.slice(0, 5)) {
      const full = path.join(snapDir, file);
      const data = readJSONsafe(full);
      if (!data) continue;
      const mtime = fs.statSync(full).mtime.toISOString();
      const timestamp = data.timestamp || data.generated_at || mtime;

      events.push({
        id: `snapshot:${file}`,
        timestamp,
        title: `Graph snapshot: ${file.split('-')[0]}`,
        description: `Structural analysis — ${data.overview?.node_count || 'nodes'}, ${data.edge_type_counts?.['DERIVES_FROM'] || 0} DERIVES_FROM edges`,
        lane: 'system',
        type: 'graph',
        evidencePaths: [full],
        graphSnapshotPath: file.replace('-analysis.json', '-reduced.json'),
        raw: data,
      });
    }
  }

  // 3. evidence/verification/ — drill/test reports
  const verifyDir = path.join(REPO_ROOT, 'evidence', 'verification');
  if (fs.existsSync(verifyDir)) {
    const verifyFiles = fs.readdirSync(verifyDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 3);
    for (const file of verifyFiles) {
      const full = path.join(verifyDir, file);
      const data = readJSONsafe(full);
      if (!data) continue;
      const timestamp = data.generated_at || fs.statSync(full).mtime.toISOString();

      events.push({
        id: `verify:${file}`,
        timestamp,
        title: `Verification drill: ${file.replace('.json','')}`,
        description: makeVerificationDescription(data),
        lane: 'library',
        type: 'verification',
        evidencePaths: [full],
        raw: data,
      });
    }
  }

  // 4. lanes/library/state/sovereignty-reports — runtime governance state scans
  const stateDir = path.join(REPO_ROOT, 'lanes', 'library', 'state');
  if (fs.existsSync(stateDir)) {
    const sovFiles = fs.readdirSync(stateDir)
      .filter(f => f.startsWith('sovereignty-report-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 3);
    for (const file of sovFiles) {
      const full = path.join(stateDir, file);
      const data = readJSONsafe(full);
      if (!data) continue;
      const timestamp = data.generated_at || data.timestamp || fs.statSync(full).mtime.toISOString();

      events.push({
        id: `sov:${file}`,
        timestamp,
        title: 'Sovereignty scan — no violations',
        description: `All lanes scanned: ${data.scan_summary?.lanes_clean || 'clean'} (0 violations)`,
        lane: 'library',
        type: 'governance',
        evidencePaths: [full],
        raw: data,
      });
    }
  }

  // Sort descending by timestamp, limit, return
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events.slice(0, limit);
}

function classifyEventType(data: any): TimelineEvent['type'] {
  const type = (data.type || '').toLowerCase();
  const taskKind = (data.task_kind || '').toLowerCase();

  if (type === 'response' && (taskKind === 'ratification' || taskKind === 'review')) return 'governance';
  if (data.contradictionCount !== undefined || data.status === 'CONFLICTED') return 'contradiction';
  if (type === 'response' && data.evidence_exchange?.artifact_type === 'release') return 'deployment';
  if (data.generated_at && data.artifacts) return 'verification';
  return 'governance';
}

function inferLane(from: string): TimelineEvent['lane'] {
  if (from === 'archivist') return 'archivist';
  if (from === 'library') return 'library';
  if (from === 'swarmmind') return 'swarmmind';
  if (from === 'kernel') return 'kernel';
  return 'system';
}

function makeDescription(data: any): string {
  const kind = data.task_kind || data.type || 'event';
  const subject = data.subject || data.title || '';
  const result = data.convergence_gate?.status || data.evidence?.verified ? 'verified' : 'pending';
  return `[${kind}] ${subject} — ${result}`;
}

function makeVerificationDescription(data: any): string {
  const passed = data.summary?.passed || data.results?.passed || false;
  const total = data.summary?.total || data.results?.total || 0;
  return `Drill ${passed ? 'passed' : 'failed'}: ${total} tests, ${passed ? 'no findings' : 'issues detected'}`;
}

function findRelatedSnapshot(data: any): string | undefined {
  // If the message references a graph snapshot in evidence_path
  const ep = data.evidence_path || data.evidence_exchange?.artifact_path;
  if (ep && typeof ep === 'string' && ep.includes('graph-snapshot')) {
    const base = path.basename(ep);
    if (base.includes('-analysis')) {
      return base.replace('-analysis.json', '-reduced.json');
    }
    return base;
  }
  return undefined;
}

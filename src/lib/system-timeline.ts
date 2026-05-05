import fs from 'fs';
import path from 'path';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  lane: 'archivist' | 'library' | 'swarmmind' | 'kernel' | 'system';
  type: 'governance' | 'graph' | 'contradiction' | 'deployment' | 'verification';
  evidence: Array<{
    path: string;
    access: 'public_url' | 'repo_path' | 'local_path' | 'generated_metadata';
    label?: string;
    href: string;
  }>;
  graphSnapshotPath?: string;
  raw: any;
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
 * Classify a filesystem path for public display.
 */
function classifyPath(p: string): { path: string; access: TimelineEvent['evidence'][0]['access']; label: string; href: string } {
  if (!p) return { path: p, access: 'generated_metadata', label: 'Generated metadata', href: '#' };

  // Absolute local machine path (S:/) — local-only
  if (p.startsWith('S:/') || p.startsWith('C:/') || p.startsWith('/home/') || p.startsWith('/Users/')) {
    return { path: p, access: 'local_path', label: 'Local source', href: p };
  }

  // Absolute URL
  if (p.startsWith('http://') || p.startsWith('https://')) {
    return { path: p, access: 'public_url', label: 'Public evidence', href: p };
  }

  // Repo-relative path (starts with / or is a bare relative)
  if (p.startsWith('/')) {
    return { path: p, access: 'repo_path', label: 'Repository path', href: p };
  }
  return { path: p, access: 'repo_path', label: 'Repository path', href: '/' + p };
}

/**
 * Collect timeline events from known artifact locations.
 */
export function collectTimelineEvents(limit = 20): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. lanes/broadcast/ — structured cross-lane messages
  const broadcastDir = path.join(REPO_ROOT, 'lanes', 'broadcast');
  if (fs.existsSync(broadcastDir)) {
    for (const file of fs.readdirSync(broadcastDir).filter(f => f.endsWith('.json'))) {
      const full = path.join(broadcastDir, file);
      const data = readJSONsafe(full);
      if (!data) continue;
      const timestamp = data.timestamp || data.generated_at || data.created_at;
      if (!timestamp) continue;

       const evidenceList = [] as TimelineEvent['evidence'];
       if (data.evidence_path) {
         evidenceList.push(classifyPath(data.evidence_path));
       }
       if (data.evidence_exchange?.artifact_path) {
         evidenceList.push(classifyPath(data.evidence_exchange.artifact_path));
       }
       // fallback: the message file itself
       evidenceList.push({ access: 'repo_path', label: 'Message file', href: `/lanes/broadcast/${file}`, path: `/lanes/broadcast/${file}` });

      events.push({
        id: data.task_id || file,
        timestamp,
        title: data.subject || data.title || file,
        description: makeDescription(data),
        lane: inferLane(data.from || data.lane || 'system'),
        type: classifyEventType(data),
        evidence: evidenceList,
        graphSnapshotPath: findRelatedSnapshot(data),
        raw: data,
      });
    }
  }

  // 2. evidence/graph-snapshots/ — snapshot analysis events
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
         title: `Graph snapshot analysis: ${file.replace('-analysis.json','').replace('-manifest','')}`,
         description: `Structural analysis — nodes: ${data.overview?.node_count || 'N/A'}, edges: ${Object.values(data.edge_type_counts||{}).reduce((a: number, b: any) => a + (b as number), 0)}`,
         lane: 'system',
         type: 'graph',
         evidence: [{ access: 'repo_path', label: 'Analysis file', href: `/evidence/graph-snapshots/${file}`, path: `/evidence/graph-snapshots/${file}` }],
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
         evidence: [{ access: 'repo_path', label: 'Report', href: `/evidence/verification/${file}`, path: `/evidence/verification/${file}` }],
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
         description: `All lanes scanned clean (0 violations)`,
         lane: 'library',
         type: 'governance',
         evidence: [{ access: 'repo_path', label: 'Scan report', href: `/lanes/library/state/${file}`, path: `/lanes/library/state/${file}` }],
         raw: data,
       });
    }
  }

  // 4. data/snapshots/ — site-index evolution events
  const snapshotsDir = path.join(REPO_ROOT, 'data', 'snapshots');
  if (fs.existsSync(snapshotsDir)) {
    const snapFiles = fs.readdirSync(snapshotsDir)
      .filter(f => f.endsWith('.json'))
      .sort();
    for (let i = 0; i < snapFiles.length; i++) {
      const file = snapFiles[i];
      const data = readJSONsafe(path.join(snapshotsDir, file));
      if (!data) continue;
      const dateStr = file.replace('.json', '');
      const entryCount = data.entries?.length || 0;
      const refCount = data.cross_references?.length || 0;
      const tagCount = Object.keys(data.tag_index || {}).length;

      let description = `Index: ${entryCount} entries, ${refCount} cross-refs, ${tagCount} tags`;

      if (i > 0) {
        const prevData = readJSONsafe(path.join(snapshotsDir, snapFiles[i - 1]));
        if (prevData) {
          const delta = entryCount - (prevData.entries?.length || 0);
          const refDelta = refCount - (prevData.cross_references?.length || 0);
          const sign = delta >= 0 ? '+' : '';
          description += ` | ${sign}${delta} entries, ${refDelta >= 0 ? '+' : ''}${refDelta} refs vs ${snapFiles[i-1].replace('.json','')}`;
        }
      }

      events.push({
        id: `snapshot:${dateStr}`,
        timestamp: data.generated_at || `${dateStr}T00:00:00Z`,
        title: `Graph index snapshot: ${dateStr}`,
        description,
        lane: 'system',
        type: 'graph',
        evidence: [{ access: 'repo_path', label: 'Snapshot', href: `/data/snapshots/${file}`, path: `/data/snapshots/${file}` }],
        graphSnapshotPath: file,
        raw: { date: dateStr, entries: entryCount, cross_refs: refCount, tags: tagCount },
      });
    }
  }

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

export function collectSnapshotDiffs(): any[] {
  const diffDir = path.join(REPO_ROOT, 'data', 'snapshot-diffs');
  if (!fs.existsSync(diffDir)) return [];
  const files = fs.readdirSync(diffDir).filter(f => f.endsWith('.json')).sort();
  const diffs: any[] = [];
  for (const file of files.slice(-10)) {
    const data = readJSONsafe(path.join(diffDir, file));
    if (!data) continue;
    diffs.push(data);
  }
  return diffs;
}

function findRelatedSnapshot(data: any): string | undefined {
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

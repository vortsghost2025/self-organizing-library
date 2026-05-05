#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function loadSnapshot(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return raw;
}

function snapshotStats(snapshot) {
  const entries = snapshot.entries || [];
  const crossRefs = snapshot.cross_references || [];
  const tagIndex = snapshot.tag_index || {};

  const byRepo = {};
  const byType = {};
  const byCategory = {};

  for (const e of entries) {
    byRepo[e.repo] = (byRepo[e.repo] || 0) + 1;
    byType[e.content_type] = (byType[e.content_type] || 0) + 1;
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  }

  return {
    date: snapshot.generated_at ? snapshot.generated_at.slice(0, 10) : 'unknown',
    total_entries: entries.length,
    total_cross_refs: crossRefs.length,
    total_tags: Object.keys(tagIndex).length,
    by_repo: byRepo,
    by_type: byType,
    by_category: byCategory,
    entry_ids: new Set(entries.map(e => e.id)),
  };
}

function diffSnapshots(older, newer) {
  const oldStats = snapshotStats(older);
  const newStats = snapshotStats(newer);

  const oldIds = oldStats.entry_ids;
  const newIds = newStats.entry_ids;

  const added = [];
  const removed = [];
  const entryMap = new Map();

  for (const e of newer.entries) entryMap.set(e.id, e);
  for (const e of older.entries) {
    if (!entryMap.has(e.id)) entryMap.set(e.id, e);
  }

  for (const id of newIds) {
    if (!oldIds.has(id)) added.push(id);
  }
  for (const id of oldIds) {
    if (!newIds.has(id)) removed.push(id);
  }

  const repoDelta = {};
  for (const repo of new Set([...Object.keys(oldStats.by_repo), ...Object.keys(newStats.by_repo)])) {
    const old = oldStats.by_repo[repo] || 0;
    const nw = newStats.by_repo[repo] || 0;
    if (old !== nw) repoDelta[repo] = { old, new: nw, delta: nw - old };
  }

  return {
    from_date: oldStats.date,
    to_date: newStats.date,
    entries_added: added.length,
    entries_removed: removed.length,
    entries_delta: newStats.total_entries - oldStats.total_entries,
    cross_refs_delta: newStats.total_cross_refs - oldStats.total_cross_refs,
    tags_delta: newStats.total_tags - oldStats.total_tags,
    repo_changes: repoDelta,
    added_ids: added.slice(0, 50),
    removed_ids: removed.slice(0, 50),
  };
}

function generateNarrative(diffs) {
  const lines = [];

  for (const diff of diffs) {
    const dir = diff.entries_delta >= 0 ? '+' : '';
    lines.push(`**${diff.to_date}**: ${dir}${diff.entries_delta} entries, ${diff.entries_added} added, ${diff.entries_removed} removed, ${diff.cross_refs_delta} cross-refs changed`);

    for (const [repo, change] of Object.entries(diff.repo_changes || {})) {
      const d = change.delta >= 0 ? '+' : '';
      lines.push(`  - ${repo}: ${change.old} -> ${change.new} (${d}${change.delta})`);
    }
  }

  return lines.join('\n');
}

function listSnapshots() {
  const dir = path.resolve(__dirname, '..', 'data', 'snapshots');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort();
}

function main() {
  const mode = process.argv[2] || 'list';

  if (mode === 'list') {
    const files = listSnapshots();
    if (files.length === 0) { console.log('No snapshots found in data/snapshots/'); return; }
    for (const f of files) {
      const s = snapshotStats(loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', f)));
      console.log(`${s.date} | ${s.total_entries} entries | ${s.total_cross_refs} cross-refs | ${s.total_tags} tags`);
    }
  } else if (mode === 'diff') {
    const files = listSnapshots();
    if (files.length < 2) { console.log('Need at least 2 snapshots to diff'); return; }
    const older = loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', files[files.length - 2]));
    const newer = loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', files[files.length - 1]));
    const diff = diffSnapshots(older, newer);
    console.log(JSON.stringify(diff, null, 2));
  } else if (mode === 'narrative') {
    const files = listSnapshots();
    if (files.length < 2) { console.log('Need at least 2 snapshots for narrative'); return; }
    const diffs = [];
    for (let i = 0; i < files.length - 1; i++) {
      const older = loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', files[i]));
      const newer = loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', files[i + 1]));
      diffs.push(diffSnapshots(older, newer));
    }
    console.log(generateNarrative(diffs));
  } else if (mode === 'all-diffs') {
    const files = listSnapshots();
    if (files.length < 2) { console.log('Need at least 2 snapshots'); return; }
    const diffs = [];
    for (let i = 0; i < files.length - 1; i++) {
      const older = loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', files[i]));
      const newer = loadSnapshot(path.resolve(__dirname, '..', 'data', 'snapshots', files[i + 1]));
      diffs.push(diffSnapshots(older, newer));
    }
    console.log(JSON.stringify(diffs, null, 2));
  } else {
    console.log('Usage: node scripts/snapshot-diff.js [list|diff|narrative|all-diffs]');
  }
}

main();

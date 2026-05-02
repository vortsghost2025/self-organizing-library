#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const siteIndexPath = path.join(__dirname, '..', 'data', 'site-index.json');
const kernelPath = 'S:/kernel-lane/evidence/graph-snapshots/bridge-derives-review-20260502.json';
const archivistPath = 'S:/Archivist-Agent/reports/work-path-bucket1-2-archivist-review-2026-05-02-p0.json';

const si = JSON.parse(fs.readFileSync(siteIndexPath, 'utf8'));
const kr = JSON.parse(fs.readFileSync(kernelPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(archivistPath, 'utf8'));

const entryMap = new Map(si.entries.map(e => [e.id, e]));
const stats = {
  kernel_state_correction: 0,
  kernel_verification_needed: 0,
  kernel_not_found: 0,
  archivist_xref_added: 0,
  archivist_dismiss_tagged: 0,
  archivist_not_found: 0,
  tag_index_keys_added: 0,
  tags_added_total: 0,
};

const newTagKeys = new Set();

const allKernelItems = [...kr.bucket5_classified, ...kr.bucket6_classified];
for (const item of allKernelItems) {
  const entry = entryMap.get(item.id);
  if (!entry) {
    stats.kernel_not_found++;
    continue;
  }
  const tagsToAdd = [];
  if (item.classification === 'state-correction-needed') {
    if (item.governance_layer === 'constitutional') {
      tagsToAdd.push('bridge-state:enforced-constitutional');
    } else if (item.governance_layer === 'operational') {
      tagsToAdd.push('bridge-state:enforced-operational');
    } else {
      tagsToAdd.push('bridge-state:enforced');
    }
    stats.kernel_state_correction++;
  } else if (item.classification === 'verification-needed') {
    tagsToAdd.push('verification-needed');
    stats.kernel_verification_needed++;
  }
  for (const tag of tagsToAdd) {
    if (!entry.tags.includes(tag)) {
      entry.tags.push(tag);
      newTagKeys.add(tag);
      stats.tags_added_total++;
    }
  }
}

const xrefCandidates = ar.items.filter(i => i.archivist_classification === 'cross-reference-candidate');
for (const item of xrefCandidates) {
  const entry = entryMap.get(item.id);
  if (!entry) {
    stats.archivist_not_found++;
    continue;
  }
  const tag = 'contradiction-candidate';
  if (!entry.tags.includes(tag)) {
    entry.tags.push(tag);
    newTagKeys.add(tag);
    stats.tags_added_total++;
    stats.archivist_xref_added++;
  }
}

const artifactDismiss = ar.items.filter(i => i.archivist_classification === 'artifact-dismiss');
for (const item of artifactDismiss) {
  const entry = entryMap.get(item.id);
  if (!entry) {
    stats.archivist_not_found++;
    continue;
  }
  const tag = 'artifact-dismiss';
  if (!entry.tags.includes(tag)) {
    entry.tags.push(tag);
    newTagKeys.add(tag);
    stats.tags_added_total++;
    stats.archivist_dismiss_tagged++;
  }
}

for (const tag of newTagKeys) {
  if (!si.tag_index[tag]) {
    si.tag_index[tag] = [];
  }
}
for (const entry of si.entries) {
  for (const tag of entry.tags) {
    if (si.tag_index[tag] && !si.tag_index[tag].includes(entry.id)) {
      si.tag_index[tag].push(entry.id);
    }
  }
}
si.tag_index = Object.fromEntries(
  Object.entries(si.tag_index).map(([k, v]) => [k, [...new Set(v)]])
);

stats.tag_index_keys_added = newTagKeys.size;

si.stats.total_entries = si.entries.length;
si.stats.total_tags = Object.keys(si.tag_index).length;
si.stats.total_cross_refs = si.cross_references ? si.cross_references.length : 0;
si.generated_at = new Date().toISOString();

fs.writeFileSync(siteIndexPath, JSON.stringify(si, null, 2), 'utf8');

console.log('=== Cross-Lane Corrections Applied ===');
console.log(JSON.stringify(stats, null, 2));
console.log('New tag keys:', [...newTagKeys]);
console.log('Site-index updated successfully.');

const fs = require('fs');
const path = require('path');

const siteIndexPath = path.join(__dirname, '..', 'data', 'site-index.json');
const data = JSON.parse(fs.readFileSync(siteIndexPath, 'utf8'));

function findConnectedEntries(entries, crossReferences) {
  const xrefIds = new Set();
  crossReferences.forEach(cr => { xrefIds.add(cr.source); xrefIds.add(cr.target); });

  const tagGroups = {};
  entries.forEach(e => {
    (e.tags || []).forEach(t => {
      if (!tagGroups[t]) tagGroups[t] = [];
      tagGroups[t].push(e.id);
    });
  });

  const queue = [...xrefIds];
  const visited = new Set(xrefIds);
  while (queue.length > 0) {
    const id = queue.shift();
    const entry = entries.find(e => e.id === id);
    if (!entry) continue;
    (entry.tags || []).forEach(t => {
      (tagGroups[t] || []).forEach(cid => {
        if (!visited.has(cid)) { visited.add(cid); queue.push(cid); }
      });
    });
  }
  return visited;
}

const connected = findConnectedEntries(data.entries, data.cross_references);
const orphans = data.entries.filter(e => !connected.has(e.id));

const repoGovernanceMap = {
  'self-organizing-library': { governanceLayer: 'operational', bridgeState: 'active' },
  'Archivist-Agent': { governanceLayer: 'constitutional', bridgeState: 'enforced' },
  'SwarmMind-Self-Optimizing-Multi-Agent-AI-System': { governanceLayer: 'operational', bridgeState: 'active' },
  'kernel-lane': { governanceLayer: 'infrastructure', bridgeState: 'active' },
  'federation': { governanceLayer: 'operational', bridgeState: 'active' },
  'FreeAgent': { governanceLayer: 'operational', bridgeState: 'active' },
  'papers': { governanceLayer: 'theoretical', bridgeState: 'reference' },
  'storytime': { governanceLayer: 'operational', bridgeState: 'active' },
  'Deliberate-AI-Ensemble': { governanceLayer: 'theoretical', bridgeState: 'reference' },
};

const categoryTagMap = {
  'governance': ['governance'],
  'verification': ['verification', 'governance'],
  'attestation': ['attestation', 'governance'],
  'audit': ['audit', 'governance'],
  'identity': ['identity', 'attestation'],
  'evidence': ['evidence', 'verification'],
  'schema': ['schema', 'architecture'],
  'config': ['config'],
  'script': ['script', 'infrastructure'],
  'code': ['code'],
  'docs': ['docs'],
  'root-doc': ['docs'],
  'reports': ['reports', 'docs'],
  'test': ['test'],
  'bridge': ['bridge', 'coordination'],
  'coordination': ['coordination'],
  'distributed': ['distributed', 'coordination'],
  'agent': ['agent', 'coordination'],
  'drift': ['drift', 'governance'],
  'architecture': ['architecture'],
  'infrastructure': ['infrastructure'],
  'ai': ['ai'],
  'game': ['game'],
  'medical': ['medical'],
  'web': ['web'],
  'public_html': ['web'],
  'data': ['data'],
  'log': ['log'],
  'quarantine': ['quarantine'],
  'monitoring': ['monitoring'],
  'benchmark': ['benchmark'],
  'resilience': ['resilience'],
  'failure-mode': ['failure-mode'],
  'we4free': ['we4free'],
};

const pathTagHints = {
  'governance': ['governance'],
  'verification': ['verification'],
  'attestation': ['attestation'],
  'constitutional': ['constitutional', 'governance'],
  'covenant': ['covenant', 'governance'],
  'constraint': ['constraint-lattice'],
  'drift': ['drift'],
  'bridge': ['bridge'],
  'coordination': ['coordination'],
  'orchestrat': ['orchestration'],
  'ensemble': ['ensemble'],
  'agent': ['agent'],
  'federation': ['federation'],
  'freeagent': ['freeagent'],
  'swarmmind': ['swarmmind'],
  'archivist': ['archivist'],
  'kernel': ['kernel'],
  'library': ['library'],
  'we4free': ['we4free'],
  'resilien': ['resilience'],
  'auth': ['authentication'],
  'identity': ['identity'],
  'key': ['key-management'],
  'spec': ['spec'],
  'config': ['config'],
  'test': ['test'],
  'benchmark': ['benchmark'],
  'monitor': ['monitoring'],
  'deploy': ['deployment'],
  'infra': ['infrastructure'],
  'script': ['script'],
  '.github': ['ci-cd'],
  'workflows': ['ci-cd'],
};

function inferTags(entry) {
  const tags = new Set(entry.tags || []);

  const repoInfo = repoGovernanceMap[entry.repo] || { governanceLayer: 'operational', bridgeState: 'active' };

  tags.add(repoInfo.governanceLayer);
  tags.add(repoInfo.bridgeState);

  const catTags = categoryTagMap[entry.category];
  if (catTags) catTags.forEach(t => tags.add(t));

  if (entry.content_type === 'code') tags.add('code');
  if (entry.content_type === 'doc' || entry.content_type === 'markdown') tags.add('docs');
  if (entry.content_type === 'data') tags.add('data');
  if (entry.content_type === 'config') tags.add('config');
  if (entry.content_type === 'schema') tags.add('schema');

  const lowerPath = (entry.path || '').toLowerCase();
  for (const [hint, hintTags] of Object.entries(pathTagHints)) {
    if (lowerPath.includes(hint)) {
      hintTags.forEach(t => tags.add(t));
    }
  }

  const repoLower = (entry.repo || '').toLowerCase();
  tags.add(repoLower.replace(/[^a-z0-9]/g, '-'));

  return [...tags].sort();
}

let taggedCount = 0;
let unchangedCount = 0;
const tagStats = {};

orphans.forEach(entry => {
  const newTags = inferTags(entry);
  const oldTags = entry.tags || [];

  if (JSON.stringify(oldTags.sort()) !== JSON.stringify(newTags)) {
    entry.tags = newTags;
    taggedCount++;
    newTags.forEach(t => { tagStats[t] = (tagStats[t] || 0) + 1; });
  } else {
    unchangedCount++;
  }
});

data.entries.forEach(entry => {
  if (entry.tags && entry.tags.length > 0) {
    entry.tags.forEach(t => {
      if (!data.tag_index[t]) data.tag_index[t] = [];
      if (!data.tag_index[t].includes(entry.id)) {
        data.tag_index[t].push(entry.id);
      }
    });
  }
});

const newConnected = findConnectedEntries(data.entries, data.cross_references);
const remainingOrphans = data.entries.filter(e => !newConnected.has(e.id));

console.log('Orphans tagged: ' + taggedCount);
console.log('Unchanged: ' + unchangedCount);
console.log('Remaining orphans after tagging: ' + remainingOrphans.length);
console.log('New tag_index size: ' + Object.keys(data.tag_index).length);
console.log('Top 20 tags applied:');
Object.entries(tagStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([tag, count]) => console.log('  ' + tag + ': ' + count));

fs.writeFileSync(siteIndexPath, JSON.stringify(data, null, 2) + '\n');
console.log('\nSite-index updated and saved.');

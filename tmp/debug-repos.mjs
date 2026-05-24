import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const siteIndex = require('../data/site-index.json');
const { explicitGraph, getGraphData } = require('../src/lib/graph-data.js');

// Check all lenses
['navigation','authority','governance','papers','repos'].forEach(l => {
  const d = getGraphData(l);
  const laneRepos = new Set(['self-organizing-library','Archivist-Agent','SwarmMind-Self-Optimizing-Multi-Agent-AI-System','kernel-lane']);
  const laneCount = d.nodes.filter(n => laneRepos.has(n.repo)).length;
  console.log(l + ': nodes=' + d.nodes.length + ' edges=' + d.edges.length + ' laneRepos=' + laneCount);
});

// Repos lens detail
const repos = getGraphData('repos');
console.log('--- repos nodes (up to 30) ---');
repos.nodes.slice(0, 30).forEach(n => {
  console.log(n.id.substring(0,20) + ' repo=' + (n.repo||'-').substring(0,20) + ' conn=' + n.connectionCount + ' status=' + n.status + ' score=' + n.authorityDepth);
});

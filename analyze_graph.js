import { promises as fs } from 'fs';
// Read the snapshot
const snapshot = JSON.parse(await fs.readFile('C:/Users/seand/Downloads/graph-snapshot-2026-05-08-02-40-00-333.json', 'utf8'));

const repoFilter = 'SwarmMind-Self-Optimizing-Multi-Agent-AI-System';
// Get SwarmMind nodes
const swarmNodes = nodes.filter(n => n.repo === repoFilter);
console.log('SwarmMind nodes:');

// Get edges where source is SwarmMind
const edgesSourceSwarm = edges.filter(e => {
  const sourceNode = nodes.find(n => n.id === e.source);
  const targetNode = nodes.find(n => n.id === e.target);
  return sourceNode && sourceNode.repo === repoFilter;
});

console.log('Edges with source in SwarmMind:');

// Get edges where target is SwarmMind
console.log('SwarmMind nodes: ' + swarmNodes.length);

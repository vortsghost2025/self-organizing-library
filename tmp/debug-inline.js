// Inline repos lens logic for debugging
const idx = require('../data/site-index.json');

const LANE_REPOS = new Set([
  "self-organizing-library",
  "Archivist-Agent",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
  "kernel-lane",
]);

// Step 1: Build connection count map from cross-refs
const connectionCountMap = new Map();
for (const ref of idx.cross_references || []) {
  connectionCountMap.set(ref.source, (connectionCountMap.get(ref.source) || 0) + 1);
  connectionCountMap.set(ref.target, (connectionCountMap.get(ref.target) || 0) + 1);
}

// Build neighbor map
const neighborMap = new Map();
for (const ref of idx.cross_references || []) {
  if (!neighborMap.has(ref.source)) neighborMap.set(ref.source, new Set());
  if (!neighborMap.has(ref.target)) neighborMap.set(ref.target, new Set());
  neighborMap.get(ref.source).add(ref.target);
  neighborMap.get(ref.target).add(ref.source);
}

// Build node records
const nodeRecords = idx.entries.map(e => ({
  id: e.id,
  repo: e.repo,
  connectionCount: connectionCountMap.get(e.id) || 0,
  status: e.status || 'UNVERIFIED',
  category: e.category || '',
  governanceLayer: e.governanceLayer || 'unknown',
  bridgeState: e.bridgeState || 'unknown',
  tags: e.tags || [],
  graphSection: e.graphSection || 'core',
  authorityDepth: e.authorityDepth || 0,
  verificationCount: e.verificationCount || 0,
  contradictionCount: e.contradictionCount || 0,
  authorityWeight: e.authorityWeight || 'normal',
  exteriorRole: e.exteriorRole || '',
}));

const nodeMap = new Map(nodeRecords.map(n => [n.id, n]));

// Step 1: collectNodeIds
const seedIds = new Set(nodeRecords.filter(n => LANE_REPOS.has(n.repo)).map(n => n.id));
console.log('Seed IDs count:', seedIds.size);

// Step 2: collectEdgeBoundNodeIds
const edgeBound = new Set(seedIds);
for (const seedId of seedIds) {
  const neighbors = neighborMap.get(seedId);
  if (!neighbors) continue;
  for (const neighborId of neighbors) {
    // Check if there's an authority or cross-ref edge
    const edge = idx.cross_references.find(
      r => (r.source === seedId && r.target === neighborId) ||
           (r.source === neighborId && r.target === seedId)
    );
    if (edge) {
      const neighborNode = nodeMap.get(neighborId);
      if (neighborNode) {
        edgeBound.add(neighborId);
      }
    }
  }
}
console.log('Edge bound count:', edgeBound.size);

// Step 3: expandByNeighbors
const NOISE_CATEGORIES = new Set(["scratch", "pending", "test-data"]);
const result = new Set(edgeBound);
let expanded = true;
while (expanded) {
  expanded = false;
  for (const id of [...result]) {
    const neighbors = neighborMap.get(id);
    if (!neighbors) continue;
    for (const neighborId of neighbors) {
      if (!result.has(neighborId)) {
        const neighborNode = nodeMap.get(neighborId);
        if (neighborNode) {
          result.add(neighborId);
          expanded = true;
        }
      }
    }
  }
}
console.log('Expanded count:', result.size);

// Step 4: limitToSet
function baseScore(n) {
  let score = 0;
  if (n.status === "VERIFIED") score += 100;
  if (n.status === "CONFLICTED") score += 80;
  if (n.status === "QUARANTINE") score += 60;
  score += (n.authorityDepth || 0) * 5;
  score += (n.verificationCount || 0) * 10;
  score += (n.connectionCount || 0);
  if (n.bridgeState === "enforced") score += 50;
  if (LANE_REPOS.has(n.repo)) score += 15;
  score += (n.governanceLayer === "core" ? 8 : 0);
  if (n.graphSection === "core") score += 5;
  if (NOISE_CATEGORIES.has(n.category)) score -= 100;
  if (n.governanceLayer === "unknown" && n.connectionCount === 0) score -= 50;
  return score;
}

const limited = [...result]
  .map(id => nodeMap.get(id))
  .filter(Boolean)
  .sort((a, b) => baseScore(b) - baseScore(a))
  .slice(0, 600);

console.log('After limitToSet 600:', limited.length);
console.log('LANE_REPOS in limited:', limited.filter(n => LANE_REPOS.has(n.repo)).length);

// Check first 10 by score
limited.slice(0, 10).forEach(n => {
  console.log('  id=' + n.id.substring(0,24) + ' repo=' + n.repo + ' conn=' + n.connectionCount + ' status=' + n.status + ' score=' + baseScore(n));
});

// Separately check expansion for connected seeds
const connected = [...seedIds].filter(id => (neighborMap.get(id)?.size || 0) > 0);
console.log('Connected seeds:', connected.length);
connected.forEach(id => {
  const n = nodeMap.get(id);
  console.log('  connected: id=' + id.substring(0,24) + ' neighbors=' + (neighborMap.get(id)?.size || 0));
});

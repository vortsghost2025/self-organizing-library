#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const BASE = 'https://deliberateensemble.works';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'graph');
const SNAP_DIR = path.join(OUT_DIR, 'snapshots');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

function makeSnapshot(nodes, edges, repoFilter, label) {
  const now = new Date().toISOString();
  const snapshotId = `snapshot-${label}-${now.replace(/[:.]/g, '-')}`;

  const filtered = repoFilter
    ? nodes.filter(n => repoFilter.includes(n.repo))
    : nodes;
  const filteredIds = new Set(filtered.map(n => n.id));
  const filteredEdges = repoFilter
    ? edges.filter(e => filteredIds.has(e.source) || filteredIds.has(e.target))
    : edges;

  const statusCounts = { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  for (const n of filtered) {
    const key = (n.status || 'UNVERIFIED').toLowerCase();
    if (key in statusCounts) statusCounts[key]++;
  }

  return {
    snapshot_id: snapshotId,
    created_at: now,
    created_by: 'script',
    repo_filter: repoFilter || [],
    visible_node_count: filtered.length,
    visible_edge_count: filteredEdges.length,
    status_counts: statusCounts,
    selected_node_ids: [],
    selected_edge_ids: [],
    interpretation_status: 'observation',
    nodes: filtered,
    edges: filteredEdges,
    clusters: [],
    entry_points: [],
  };
}

function compareSnapshots(a, b) {
  const nodesA = new Map(a.nodes.map(n => [n.id, n]));
  const nodesB = new Map(b.nodes.map(n => [n.id, n]));

  const addedNodeIds = [];
  const removedNodeIds = [];
  const changedStatuses = [];
  const changedGovernance = [];
  const changedBridge = [];
  const changedAuthority = [];

  for (const [id, nodeB] of nodesB) {
    if (!nodesA.has(id)) { addedNodeIds.push(id); continue; }
    const nodeA = nodesA.get(id);
    if (nodeA.status !== nodeB.status) changedStatuses.push({ id, title: nodeB.title, repo: nodeB.repo, field: 'status', from: nodeA.status, to: nodeB.status });
    if (nodeA.governanceLayer !== nodeB.governanceLayer) changedGovernance.push({ id, title: nodeB.title, repo: nodeB.repo, field: 'governanceLayer', from: nodeA.governanceLayer, to: nodeB.governanceLayer });
    if (nodeA.bridgeState !== nodeB.bridgeState) changedBridge.push({ id, title: nodeB.title, repo: nodeB.repo, field: 'bridgeState', from: nodeA.bridgeState, to: nodeB.bridgeState });
    if (nodeA.authorityDepth !== nodeB.authorityDepth) changedAuthority.push({ id, title: nodeB.title, repo: nodeB.repo, field: 'authorityDepth', from: nodeA.authorityDepth, to: nodeB.authorityDepth });
  }

  for (const [id] of nodesA) {
    if (!nodesB.has(id)) removedNodeIds.push(id);
  }

  function hubs(nodes, limit) {
    return nodes.filter(n => n.contradictionCount > 0)
      .sort((x, y) => y.contradictionCount - x.contradictionCount)
      .slice(0, limit)
      .map(n => ({ id: n.id, title: n.title, repo: n.repo, contradictionCount: n.contradictionCount, connectionCount: n.connectionCount, status: n.status, governanceLayer: n.governanceLayer, bridgeState: n.bridgeState, authorityDepth: n.authorityDepth }));
  }

  const scA = a.status_counts || { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  const scB = b.status_counts || { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };

  const contraA = new Map(a.nodes.filter(n => n.contradictionCount > 0).map(n => [n.id, n]));
  const contraB = new Map(b.nodes.filter(n => n.contradictionCount > 0).map(n => [n.id, n]));
  const newContra = [];
  const resolvedContra = [];
  for (const [id, nb] of contraB) { if (!contraA.has(id)) newContra.push({ id: nb.id, title: nb.title, repo: nb.repo, contradictionCount: nb.contradictionCount, connectionCount: nb.connectionCount, status: nb.status, governanceLayer: nb.governanceLayer, bridgeState: nb.bridgeState, authorityDepth: nb.authorityDepth }); }
  for (const [id, na] of contraA) { if (!contraB.has(id)) resolvedContra.push({ id: na.id, title: na.title, repo: na.repo, contradictionCount: na.contradictionCount, connectionCount: na.connectionCount, status: na.status, governanceLayer: na.governanceLayer, bridgeState: na.bridgeState, authorityDepth: na.authorityDepth }); }
  newContra.sort((x, y) => y.contradictionCount - x.contradictionCount);
  resolvedContra.sort((x, y) => y.contradictionCount - x.contradictionCount);

  return {
    snapshot_a_id: a.snapshot_id,
    snapshot_b_id: b.snapshot_id,
    compared_at: new Date().toISOString(),
    interpretation_status: 'observation',
    repo_filter_a: a.repo_filter,
    repo_filter_b: b.repo_filter,
    created_at_a: a.created_at,
    created_at_b: b.created_at,
    visible_node_count_delta: b.visible_node_count - a.visible_node_count,
    visible_edge_count_delta: b.visible_edge_count - a.visible_edge_count,
    status_counts_delta: {
      verified: scB.verified - scA.verified,
      unverified: scB.unverified - scA.unverified,
      conflicted: scB.conflicted - scA.conflicted,
      quarantined: scB.quarantined - scA.quarantined,
    },
    added_node_ids: addedNodeIds,
    removed_node_ids: removedNodeIds,
    changed_node_statuses: changedStatuses,
    changed_governance_layer: changedGovernance,
    changed_bridge_state: changedBridge,
    changed_authority_depth: changedAuthority,
    top_contradiction_hubs_a: hubs(a.nodes, 10),
    top_contradiction_hubs_b: hubs(b.nodes, 10),
    top_new_contradictions: newContra,
    top_resolved_contradictions: resolvedContra,
  };
}

function generateContradictionReport(nodes, repoFilter) {
  const filtered = repoFilter ? nodes.filter(n => repoFilter.includes(n.repo)) : nodes;
  return filtered
    .filter(n => n.contradictionCount > 0)
    .sort((a, b) => b.contradictionCount - a.contradictionCount)
    .map(n => ({
      id: n.id,
      title: n.title,
      repo: n.repo,
      connectionCount: n.connectionCount,
      contradictionCount: n.contradictionCount,
      governanceLayer: n.governanceLayer,
      authorityDepth: n.authorityDepth,
      bridgeState: n.bridgeState,
      status: n.status,
      clusterIds: n.clusterIds || [],
    }));
}

async function main() {
  fs.mkdirSync(SNAP_DIR, { recursive: true });

  console.log('Fetching graph data from', BASE);
  const data = await fetchJson(`${BASE}/api/graph-data`);
  const { nodes, edges } = data;

  console.log(`Total nodes: ${nodes.length}, Total edges: ${edges.length}`);

  const repos = [...new Set(nodes.map(n => n.repo))];
  console.log('Repos:', repos.join(', '));

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  for (const repo of repos) {
    const snapshot = makeSnapshot(nodes, edges, [repo], repo);
    const file = path.join(SNAP_DIR, `snapshot-${repo}-${ts}.json`);
    fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
    console.log(`Wrote ${file} (${snapshot.nodes.length} nodes, ${snapshot.edges.length} edges)`);
  }

  const fullSnapshot = makeSnapshot(nodes, edges, null, 'full');
  const fullFile = path.join(SNAP_DIR, `snapshot-full-${ts}.json`);
  fs.writeFileSync(fullFile, JSON.stringify(fullSnapshot, null, 2));
  console.log(`Wrote ${fullFile} (${fullSnapshot.nodes.length} nodes)`);

  for (const repo of repos) {
    const report = generateContradictionReport(nodes, [repo]);
    const file = path.join(SNAP_DIR, `contradiction-hub-${repo}-${ts}.json`);
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    console.log(`Wrote ${file} (${report.length} contradiction hubs)`);
  }

  const fullContra = generateContradictionReport(nodes, null);
  const fullContraFile = path.join(SNAP_DIR, `contradiction-hub-full-${ts}.json`);
  fs.writeFileSync(fullContraFile, JSON.stringify(fullContra, null, 2));
  console.log(`Wrote ${fullContraFile} (${fullContra.length} contradiction hubs)`);

  const existingSnaps = fs.readdirSync(SNAP_DIR)
    .filter(f => f.startsWith('snapshot-') && f.endsWith('.json') && !f.includes(ts))
    .sort();

  if (existingSnaps.length > 0) {
    console.log(`\nFound ${existingSnaps.length} existing snapshot(s) to compare against.`);
    for (const repo of repos) {
      const prevPattern = `snapshot-${repo}-`;
      const prevFile = existingSnaps.find(f => f.startsWith(prevPattern) && !f.includes(ts));
      if (prevFile) {
        const prevData = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, prevFile), 'utf-8'));
        const currData = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, `snapshot-${repo}-${ts}.json`), 'utf-8'));
        const result = compareSnapshots(prevData, currData);
        const compareFile = path.join(SNAP_DIR, `compare-${repo}-${ts}.json`);
        fs.writeFileSync(compareFile, JSON.stringify(result, null, 2));
        console.log(`Wrote ${compareFile}`);
      } else {
        console.log(`No previous snapshot for ${repo} — skipping compare.`);
      }
    }

    const prevFull = existingSnaps.find(f => f.startsWith('snapshot-full-') && !f.includes(ts));
    if (prevFull) {
      const prevData = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, prevFull), 'utf-8'));
      const currData = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, `snapshot-full-${ts}.json`), 'utf-8'));
      const result = compareSnapshots(prevData, currData);
      const compareFile = path.join(SNAP_DIR, `compare-full-${ts}.json`);
      fs.writeFileSync(compareFile, JSON.stringify(result, null, 2));
      console.log(`Wrote ${compareFile}`);
    }
  } else {
    console.log('\nNo previous snapshots found — this is the baseline run. Run again later to compare.');
  }

  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });

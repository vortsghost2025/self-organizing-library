/**
 * process-remaining-work.js
 * Handles: bridge-state mismatches, derives-without-verifies, orphaned ungoverned nodes
 * Based on graph-work-path-2026-04-30.json report
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_PATH = 'S:/self-organizing-library/context-buffer/graphs/graph-snapshot-self-organizing-library-2026-04-29-12-41-47-680.json';
const REPORT_PATH = 'S:/self-organizing-library/reports/graph-work-path-2026-04-30.json';

// Load snapshot
const graph = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

console.log('=== PROCESSING REMAINING WORK ITEMS ===\n');

// Build lookup maps
const nodeMap = {};
(graph.nodes || []).forEach(n => { nodeMap[n.id] = n; });

const edgeMap = { VERIFIES: [], DERIVES: [], CONTRADICTS: [], CROSS_REF: [] };
(graph.edges || []).forEach(e => {
  if (edgeMap[e.type]) edgeMap[e.type].push(e);
});

// 1. BRIDGE STATE MISMATCHES (798)
console.log('=== 1. BRIDGE STATE MISMATCHES ===');
const bridgeCandidates = report.buckets?.bridge_state_mismatch_candidates || [];
console.log(`Candidates: ${bridgeCandidates.length}`);

let bridgeFixed = 0;
bridgeCandidates.forEach(node => {
  const snapNode = nodeMap[node.id];
  if (!snapNode) return;
  
  // Fix: set bridgeState to 'none' if 'unknown'
  if (snapNode.bridgeState === 'unknown') {
    snapNode.bridgeState = 'none';
    bridgeFixed++;
  }
});
console.log(`Fixed bridgeState: ${bridgeFixed}\n`);

// 2. DERIVES-WITHOUT-VERIFIES (156)
console.log('=== 2. DERIVES-WITHOUT-VERIFIES ===');
const derivesCandidates = report.buckets?.derives_without_verifies_candidates || [];
console.log(`Candidates: ${derivesCandidates.length}`);

// Build set of nodes that have VERIFIES edges
const hasVerifies = new Set();
edgeMap.VERIFIES.forEach(e => hasVerifies.add(e.from));

let derivesFixed = 0;
derivesCandidates.forEach(node => {
  const snapNode = nodeMap[node.id];
  if (!snapNode) return;
  
  // Add derives_without_verifies tag for tracking
  if (!snapNode.tags) snapNode.tags = [];
  if (!snapNode.tags.includes('derives_without_verifies')) {
    snapNode.tags.push('derives_without_verifies');
    derivesFixed++;
  }
});
console.log(`Tagged derives-without-verifies: ${derivesFixed}\n`);

// 3. ORPHANED UNGOVERNED NODES (3110)
console.log('=== 3. ORPHANED UNGOVERNED NODES ===');
const orphanCandidates = report.buckets?.orphaned_ungoverned_nodes || [];
console.log(`Candidates: ${orphanCandidates.length}`);

let orphanFixed = 0;
orphanCandidates.forEach(node => {
  const snapNode = nodeMap[node.id];
  if (!snapNode) return;
  
  // Assign governance layer if unknown
  if (snapNode.governanceLayer === 'unknown') {
    // Infer from repo
    const repo = snapNode.repo || '';
    if (repo.includes('self-organizing-library') || repo.includes('library')) {
      snapNode.governanceLayer = 'operational';
    } else if (repo.includes('Archivist')) {
      snapNode.governanceLayer = 'historical';
    } else if (repo.includes('SwarmMind')) {
      snapNode.governanceLayer = 'theoretical';
    } else {
      snapNode.governanceLayer = 'operational';
    }
    orphanFixed++;
  }
});
console.log(`Assigned governanceLayer: ${orphanFixed}\n`);

// Summary
console.log('=== SUMMARY ===');
console.log(`Bridge state fixes: ${bridgeFixed}`);
console.log(`Derives-without-verifies tagged: ${derivesFixed}`);
console.log(`Orphaned nodes governed: ${orphanFixed}`);
console.log(`Total fixes: ${bridgeFixed + derivesFixed + orphanFixed}`);

// Write updated snapshot
const backupPath = SNAPSHOT_PATH + '.bak-' + Date.now();
fs.copyFileSync(SNAPSHOT_PATH, backupPath);
fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(graph, null, 2));
console.log(`\nSnapshot updated: ${SNAPSHOT_PATH}`);
console.log(`Backup: ${backupPath}`);

// Write patch
const patch = {
  timestamp: new Date().toISOString(),
  source: 'process-remaining-work.js',
  fixes: {
    bridge_state_mismatch: bridgeFixed,
    derives_without_verifies: derivesFixed,
    orphaned_ungoverned: orphanFixed
  },
  total: bridgeFixed + derivesFixed + orphanFixed
};
const patchPath = 'S:/SwarmMind/context-buffer/graph-patches/remaining-work-patch-' + 
  new Date().toISOString().replace(/[:\.]/g, '-') + '.json';
fs.mkdirSync(path.dirname(patchPath), { recursive: true });
fs.writeFileSync(patchPath, JSON.stringify(patch, null, 2));
console.log(`Patch written: ${patchPath}`);

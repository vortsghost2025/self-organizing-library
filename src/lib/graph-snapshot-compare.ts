import type { GraphNode } from "./graph-types";
import type { GraphSnapshot } from "./graph-snapshot";

export type CompareStatus = "observation" | "hypothesis" | "verified";

export interface StatusCountDelta {
  verified: number;
  unverified: number;
  conflicted: number;
  quarantined: number;
}

export interface NodeFieldChange {
  id: string;
  title: string;
  repo: string;
  field: string;
  from: string | number;
  to: string | number;
}

export interface ContradictionHubCompareEntry {
  id: string;
  title: string;
  repo: string;
  contradictionCount: number;
  connectionCount: number;
  status: string;
  governanceLayer: string;
  bridgeState: string;
  authorityDepth: number;
}

export interface SnapshotCompareResult {
  snapshot_a_id: string;
  snapshot_b_id: string;
  compared_at: string;
  interpretation_status: CompareStatus;
  repo_filter_a: string[];
  repo_filter_b: string[];
  created_at_a: string;
  created_at_b: string;
  visible_node_count_delta: number;
  visible_edge_count_delta: number;
  status_counts_delta: StatusCountDelta;
  added_node_ids: string[];
  removed_node_ids: string[];
  changed_node_statuses: NodeFieldChange[];
  changed_governance_layer: NodeFieldChange[];
  changed_bridge_state: NodeFieldChange[];
  changed_authority_depth: NodeFieldChange[];
  top_contradiction_hubs_a: ContradictionHubCompareEntry[];
  top_contradiction_hubs_b: ContradictionHubCompareEntry[];
  top_new_contradictions: ContradictionHubCompareEntry[];
  top_resolved_contradictions: ContradictionHubCompareEntry[];
}

function getContradictionHubs(nodes: GraphNode[], limit: number): ContradictionHubCompareEntry[] {
  return nodes
    .filter(n => n.contradictionCount > 0)
    .sort((a, b) => b.contradictionCount - a.contradictionCount)
    .slice(0, limit)
    .map(n => ({
      id: n.id,
      title: n.title,
      repo: n.repo,
      contradictionCount: n.contradictionCount,
      connectionCount: n.connectionCount,
      status: n.status,
      governanceLayer: n.governanceLayer,
      bridgeState: n.bridgeState,
      authorityDepth: n.authorityDepth,
    }));
}

export function compareSnapshots(a: GraphSnapshot, b: GraphSnapshot): SnapshotCompareResult {
  const nodesA = new Map(a.nodes.map(n => [n.id, n]));
  const nodesB = new Map(b.nodes.map(n => [n.id, n]));

  const addedNodeIds: string[] = [];
  const removedNodeIds: string[] = [];
  const changedStatuses: NodeFieldChange[] = [];
  const changedGovernance: NodeFieldChange[] = [];
  const changedBridge: NodeFieldChange[] = [];
  const changedAuthority: NodeFieldChange[] = [];

  for (const [id, nodeB] of nodesB) {
    if (!nodesA.has(id)) {
      addedNodeIds.push(id);
      continue;
    }
    const nodeA = nodesA.get(id)!;
    if (nodeA.status !== nodeB.status) {
      changedStatuses.push({
        id,
        title: nodeB.title,
        repo: nodeB.repo,
        field: "status",
        from: nodeA.status,
        to: nodeB.status,
      });
    }
    if (nodeA.governanceLayer !== nodeB.governanceLayer) {
      changedGovernance.push({
        id,
        title: nodeB.title,
        repo: nodeB.repo,
        field: "governanceLayer",
        from: nodeA.governanceLayer,
        to: nodeB.governanceLayer,
      });
    }
    if (nodeA.bridgeState !== nodeB.bridgeState) {
      changedBridge.push({
        id,
        title: nodeB.title,
        repo: nodeB.repo,
        field: "bridgeState",
        from: nodeA.bridgeState,
        to: nodeB.bridgeState,
      });
    }
    if (nodeA.authorityDepth !== nodeB.authorityDepth) {
      changedAuthority.push({
        id,
        title: nodeB.title,
        repo: nodeB.repo,
        field: "authorityDepth",
        from: nodeA.authorityDepth,
        to: nodeB.authorityDepth,
      });
    }
  }

  for (const [id] of nodesA) {
    if (!nodesB.has(id)) {
      removedNodeIds.push(id);
    }
  }

  const scA = a.status_counts || { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  const scB = b.status_counts || { verified: 0, unverified: 0, conflicted: 0, quarantined: 0 };
  const statusDelta: StatusCountDelta = {
    verified: scB.verified - scA.verified,
    unverified: scB.unverified - scA.unverified,
    conflicted: scB.conflicted - scA.conflicted,
    quarantined: scB.quarantined - scA.quarantined,
  };

  const hubsA = getContradictionHubs(a.nodes, 10);
  const hubsB = getContradictionHubs(b.nodes, 10);

  const contradictionsA = new Map(a.nodes.filter(n => n.contradictionCount > 0).map(n => [n.id, n]));
  const contradictionsB = new Map(b.nodes.filter(n => n.contradictionCount > 0).map(n => [n.id, n]));

  const newContradictions: ContradictionHubCompareEntry[] = [];
  const resolvedContradictions: ContradictionHubCompareEntry[] = [];

  for (const [id, nodeB] of contradictionsB) {
    if (!contradictionsA.has(id)) {
      newContradictions.push({
        id: nodeB.id,
        title: nodeB.title,
        repo: nodeB.repo,
        contradictionCount: nodeB.contradictionCount,
        connectionCount: nodeB.connectionCount,
        status: nodeB.status,
        governanceLayer: nodeB.governanceLayer,
        bridgeState: nodeB.bridgeState,
        authorityDepth: nodeB.authorityDepth,
      });
    }
  }
  newContradictions.sort((x, y) => y.contradictionCount - x.contradictionCount);

  for (const [id, nodeA] of contradictionsA) {
    if (!contradictionsB.has(id)) {
      resolvedContradictions.push({
        id: nodeA.id,
        title: nodeA.title,
        repo: nodeA.repo,
        contradictionCount: nodeA.contradictionCount,
        connectionCount: nodeA.connectionCount,
        status: nodeA.status,
        governanceLayer: nodeA.governanceLayer,
        bridgeState: nodeA.bridgeState,
        authorityDepth: nodeA.authorityDepth,
      });
    }
  }
  resolvedContradictions.sort((x, y) => y.contradictionCount - x.contradictionCount);

  return {
    snapshot_a_id: a.snapshot_id,
    snapshot_b_id: b.snapshot_id,
    compared_at: new Date().toISOString(),
    interpretation_status: "observation",
    repo_filter_a: a.repo_filter,
    repo_filter_b: b.repo_filter,
    created_at_a: a.created_at,
    created_at_b: b.created_at,
    visible_node_count_delta: b.visible_node_count - a.visible_node_count,
    visible_edge_count_delta: b.visible_edge_count - a.visible_edge_count,
    status_counts_delta: statusDelta,
    added_node_ids: addedNodeIds,
    removed_node_ids: removedNodeIds,
    changed_node_statuses: changedStatuses,
    changed_governance_layer: changedGovernance,
    changed_bridge_state: changedBridge,
    changed_authority_depth: changedAuthority,
    top_contradiction_hubs_a: hubsA,
    top_contradiction_hubs_b: hubsB,
    top_new_contradictions: newContradictions,
    top_resolved_contradictions: resolvedContradictions,
  };
}

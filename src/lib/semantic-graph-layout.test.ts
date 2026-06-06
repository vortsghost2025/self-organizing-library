import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_MAP_REGION_SPECS,
  computeSemanticGraphLayout,
  getArchitectureMapRegion,
  getSystemsMapRegion,
  SYSTEMS_MAP_REGION_SPECS,
} from "@/lib/semantic-graph-layout";
import type { GraphNode } from "@/lib/graph-types";

function makeNode(overrides: Partial<GraphNode>) {
  return {
    id: overrides.id ?? "node",
    title: overrides.title ?? overrides.id ?? "node",
    path: overrides.path ?? "docs/node.md",
    category: overrides.category ?? "docs",
    repo: overrides.repo ?? "self-organizing-library",
    type: overrides.type ?? "doc",
    connectionCount: overrides.connectionCount ?? 1,
    governanceLayer: overrides.governanceLayer,
    bridgeState: overrides.bridgeState,
    status: overrides.status,
    authorityDepth: overrides.authorityDepth,
    verificationCount: overrides.verificationCount,
    contradictionCount: overrides.contradictionCount,
    graphSection: overrides.graphSection,
    exteriorRole: overrides.exteriorRole,
  };
}

function centroid(points: Array<{ x: number; y: number }>) {
  return points.reduce(
    (acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }),
    { x: 0, y: 0 }
  );
}

describe("computeSemanticGraphLayout", () => {
  it("classifies nodes into stable systems-map regions", () => {
    expect(getSystemsMapRegion(makeNode({
      id: "source",
      category: "docs",
    }))).toBe("sources");

    expect(getSystemsMapRegion(makeNode({
      id: "claim",
      repo: "papers",
      category: "paper",
      type: "paper",
    }))).toBe("claims");

    expect(getSystemsMapRegion(makeNode({
      id: "governance",
      category: "governance",
      governanceLayer: "constitutional",
      bridgeState: "enforced",
    }))).toBe("governance");

    expect(getSystemsMapRegion(makeNode({
      id: "execution",
      category: "agent",
      type: "code",
    }))).toBe("execution");

    expect(getSystemsMapRegion(makeNode({
      id: "external",
      repo: "FreeAgent",
      category: "coordination",
      graphSection: "exterior",
    }))).toBe("external");

    expect(getSystemsMapRegion(makeNode({
      id: "conflict",
      category: "failure-mode",
      status: "CONFLICTED",
      contradictionCount: 2,
    }))).toBe("conflicts");

    expect(getArchitectureMapRegion(makeNode({
      id: "archive",
      title: "README.md",
      path: "docs/system/README.md",
      category: "docs",
    }))).toBe("archive");

    expect(getArchitectureMapRegion(makeNode({
      id: "graph",
      title: "GraphCanvas.tsx",
      path: "src/components/graph/GraphCanvas.tsx",
      category: "code",
      type: "code",
    }))).toBe("graph");

    expect(getArchitectureMapRegion(makeNode({
      id: "governance-core",
      title: "GOVERNANCE.md",
      path: "schemas/execution-gate-v1.json",
      category: "schema",
    }))).toBe("governance");

    expect(getArchitectureMapRegion(makeNode({
      id: "runtime",
      title: "lane-worker.js",
      path: "scripts/lane-worker.js",
      category: "script",
      type: "code",
    }))).toBe("runtime");

    expect(getArchitectureMapRegion(makeNode({
      id: "experience",
      title: "page.tsx",
      path: "src/app/graph/page.tsx",
      category: "code",
      type: "code",
    }))).toBe("graph");

    expect(getArchitectureMapRegion(makeNode({
      id: "site",
      title: "Sidebar.tsx",
      path: "src/components/Sidebar.tsx",
      category: "code",
      type: "code",
    }))).toBe("experience");
  });

  it("anchors major hubs near their region centers and separates regions", () => {
    const nodes = [
      makeNode({ id: "g1", category: "governance", governanceLayer: "constitutional", bridgeState: "enforced", verificationCount: 4, authorityDepth: 110, connectionCount: 18 }),
      makeNode({ id: "g2", category: "governance", governanceLayer: "operational", bridgeState: "verified", verificationCount: 2, authorityDepth: 75, connectionCount: 10 }),
      makeNode({ id: "g3", category: "governance", governanceLayer: "evidence", bridgeState: "partial", verificationCount: 1, authorityDepth: 58, connectionCount: 6 }),
      makeNode({ id: "g4", category: "governance", governanceLayer: "operational", authorityDepth: 41, connectionCount: 4 }),
      makeNode({ id: "s1", category: "docs", connectionCount: 8 }),
      makeNode({ id: "s2", category: "data", type: "data", connectionCount: 5 }),
      makeNode({ id: "e1", category: "agent", type: "code", connectionCount: 9 }),
      makeNode({ id: "e2", category: "script", type: "code", connectionCount: 5 }),
      makeNode({ id: "x1", repo: "FreeAgent", category: "coordination", graphSection: "exterior", connectionCount: 7 }),
      makeNode({ id: "c1", category: "failure-mode", status: "CONFLICTED", contradictionCount: 5, connectionCount: 6 }),
    ];
    const edges = [
      { source: "g1", target: "g2" },
      { source: "g1", target: "g3" },
      { source: "g1", target: "g4" },
      { source: "g1", target: "s1" },
      { source: "g2", target: "s2" },
      { source: "g3", target: "e1" },
      { source: "e1", target: "e2" },
      { source: "g1", target: "x1" },
      { source: "g2", target: "c1" },
    ];

    const positions = computeSemanticGraphLayout(nodes, edges);
    const governanceRegion = SYSTEMS_MAP_REGION_SPECS.governance.center;
    const sourceCenter = centroid(["s1", "s2"].map((id) => positions[id]));
    const executionCenter = centroid(["e1", "e2"].map((id) => positions[id]));
    const externalCenter = positions.x1;
    const conflictCenter = positions.c1;

    expect(Math.hypot(
      positions.g1.x - governanceRegion.x,
      positions.g1.y - governanceRegion.y,
    )).toBeLessThan(1);
    expect(sourceCenter.x).toBeLessThan(governanceRegion.x - 450);
    expect(executionCenter.y).toBeGreaterThan(governanceRegion.y + 220);
    expect(externalCenter.x).toBeGreaterThan(governanceRegion.x + 550);
    expect(conflictCenter.x).toBeGreaterThan(governanceRegion.x + 750);
  });

  it("fans neighbors around their local hubs with unique finite positions", () => {
    const nodes = Array.from({ length: 10 }, (_, index) => ({
      ...makeNode({
        id: `n${index}`,
        category: "paper",
        repo: "papers",
        type: "paper",
        authorityDepth: 90 - index * 4,
        connectionCount: 10 - index,
      }),
    }));
    const edges = nodes.slice(1).map((node) => ({
      source: "n0",
      target: node.id,
    }));

    const positions = computeSemanticGraphLayout(nodes, edges);
    const hubs = [positions.n0, positions.n1];
    const neighbors = nodes.slice(2).map((node) => positions[node.id]);
    const serialized = new Set(
      Object.values(positions).map((point) => `${point.x.toFixed(3)}:${point.y.toFixed(3)}`)
    );

    expect(Object.keys(positions)).toHaveLength(nodes.length);
    expect(serialized.size).toBe(nodes.length);
    for (const point of Object.values(positions)) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }

    for (const point of neighbors) {
      const nearestHubDistance = Math.min(
        ...hubs.map((hub) => Math.hypot(point.x - hub.x, point.y - hub.y)),
      );
      expect(nearestHubDistance).toBeGreaterThan(30);
      expect(nearestHubDistance).toBeLessThan(260);
    }
  });

  it("anchors navigation architecture clusters into fixed readable regions", () => {
    const nodes = [
      makeNode({ id: "archive-1", title: "README.md", path: "docs/README.md", category: "docs", connectionCount: 8 }),
      makeNode({ id: "archive-2", title: "site-index.json", path: "data/site-index.json", category: "data", type: "data", connectionCount: 6 }),
      makeNode({ id: "graph-1", title: "GraphCanvas.tsx", path: "src/components/graph/GraphCanvas.tsx", category: "code", type: "code", connectionCount: 16 }),
      makeNode({ id: "graph-2", title: "graph-data.ts", path: "src/lib/graph-data.ts", category: "code", type: "code", connectionCount: 12 }),
      makeNode({ id: "gov-1", title: "GOVERNANCE.md", path: "GOVERNANCE.md", category: "governance", governanceLayer: "constitutional", bridgeState: "enforced", authorityDepth: 92, connectionCount: 12 }),
      makeNode({ id: "runtime-1", title: "lane-worker.js", path: "scripts/lane-worker.js", category: "script", type: "code", connectionCount: 14 }),
      makeNode({ id: "runtime-2", title: "behavioral-test-results.json", path: "verification/behavioral-test-results.json", category: "verification", type: "data", connectionCount: 7 }),
      makeNode({ id: "exp-1", title: "page.tsx", path: "src/app/library/page.tsx", category: "code", type: "code", connectionCount: 11 }),
      makeNode({ id: "exp-2", title: "Sidebar.tsx", path: "src/components/Sidebar.tsx", category: "code", type: "code", connectionCount: 8 }),
      makeNode({ id: "conflict-1", title: "NFM-021", path: "library/docs/failure-modes/NFM-021.md", category: "failure-mode", status: "CONFLICTED", contradictionCount: 5, connectionCount: 6 }),
    ];

    const edges = [
      { source: "archive-1", target: "graph-1" },
      { source: "archive-2", target: "graph-2" },
      { source: "graph-1", target: "graph-2" },
      { source: "graph-1", target: "gov-1" },
      { source: "gov-1", target: "runtime-1" },
      { source: "runtime-1", target: "runtime-2" },
      { source: "graph-1", target: "exp-1" },
      { source: "exp-1", target: "exp-2" },
      { source: "gov-1", target: "conflict-1" },
    ];

    const positions = computeSemanticGraphLayout(nodes, edges, { preset: "architecture" });
    const archiveCenter = centroid(["archive-1", "archive-2"].map((id) => positions[id]));
    const graphCenter = centroid(["graph-1", "graph-2"].map((id) => positions[id]));
    const runtimeCenter = centroid(["runtime-1", "runtime-2"].map((id) => positions[id]));
    const experienceCenter = centroid(["exp-1", "exp-2"].map((id) => positions[id]));
    const governanceRegion = ARCHITECTURE_MAP_REGION_SPECS.governance.center;
    const conflictCenter = positions["conflict-1"];

    expect(Math.hypot(
      positions["gov-1"].x - governanceRegion.x,
      positions["gov-1"].y - governanceRegion.y,
    )).toBeLessThan(1);
    expect(archiveCenter.x).toBeLessThan(graphCenter.x - 120);
    expect(graphCenter.y).toBeLessThan(governanceRegion.y - 90);
    expect(runtimeCenter.y).toBeLessThan(graphCenter.y - 80);
    expect(experienceCenter.x).toBeGreaterThan(governanceRegion.x + 110);
    expect(conflictCenter.x).toBeGreaterThan(experienceCenter.x + 120);
  });
});

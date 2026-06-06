import type { GraphEdge, GraphNode } from "./graph-types";

export interface SemanticLayoutPosition {
  x: number;
  y: number;
}

export type SemanticLayoutPreset = "systems" | "architecture";

export type SystemsMapRegion =
  | "sources"
  | "claims"
  | "governance"
  | "execution"
  | "external"
  | "conflicts";

export type ArchitectureMapRegion =
  | "archive"
  | "graph"
  | "governance"
  | "runtime"
  | "experience"
  | "conflicts";

export type SemanticLayoutRegion = SystemsMapRegion | ArchitectureMapRegion;

export interface SystemsMapRegionSpec {
  label: string;
  center: SemanticLayoutPosition;
  hubOffsets: SemanticLayoutPosition[];
  fanCenterAngle: number;
  fanSweep: number;
  labelOffset: SemanticLayoutPosition;
}

type SemanticLayoutNode =
  Pick<GraphNode, "id" | "title" | "category" | "repo" | "type" | "connectionCount"> &
  Partial<
    Pick<
      GraphNode,
      | "governanceLayer"
      | "bridgeState"
      | "status"
      | "authorityDepth"
      | "verificationCount"
      | "contradictionCount"
      | "graphSection"
      | "exteriorRole"
      | "path"
    >
  > & {
    layoutCluster?: string;
  };

type SemanticLayoutEdge = Pick<GraphEdge, "source" | "target">;

const SYSTEMS_MAP_REGION_ORDER: SystemsMapRegion[] = [
  "sources",
  "claims",
  "governance",
  "execution",
  "external",
  "conflicts",
];

const ARCHITECTURE_MAP_REGION_ORDER: ArchitectureMapRegion[] = [
  "archive",
  "graph",
  "governance",
  "runtime",
  "experience",
  "conflicts",
];

export const SYSTEMS_MAP_REGION_SPECS: Record<SystemsMapRegion, SystemsMapRegionSpec> = {
  sources: {
    label: "Sources & Docs",
    center: { x: -760, y: 40 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -130, y: -90 },
      { x: -110, y: 96 },
    ],
    fanCenterAngle: Math.PI,
    fanSweep: 2.2,
    labelOffset: { x: 0, y: -170 },
  },
  claims: {
    label: "Claims & Papers",
    center: { x: -250, y: -210 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -120, y: 78 },
      { x: 102, y: 92 },
    ],
    fanCenterAngle: -2.15,
    fanSweep: 2.05,
    labelOffset: { x: 0, y: -150 },
  },
  governance: {
    label: "Governance & Verification",
    center: { x: 120, y: -40 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -130, y: 104 },
      { x: 128, y: 110 },
    ],
    fanCenterAngle: 0.55,
    fanSweep: 3.8,
    labelOffset: { x: 0, y: -160 },
  },
  execution: {
    label: "Execution & Agents",
    center: { x: 170, y: 210 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -120, y: 86 },
      { x: 120, y: -44 },
    ],
    fanCenterAngle: 1.28,
    fanSweep: 2.2,
    labelOffset: { x: 0, y: -145 },
  },
  external: {
    label: "External & Deployment",
    center: { x: 700, y: 60 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -120, y: -86 },
      { x: -128, y: 84 },
    ],
    fanCenterAngle: 0.1,
    fanSweep: 1.9,
    labelOffset: { x: 0, y: -150 },
  },
  conflicts: {
    label: "Conflict & Quarantine",
    center: { x: 920, y: 0 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -120, y: -88 },
      { x: -128, y: 92 },
    ],
    fanCenterAngle: -0.22,
    fanSweep: 1.95,
    labelOffset: { x: 0, y: -145 },
  },
};

export const ARCHITECTURE_MAP_REGION_SPECS: Record<ArchitectureMapRegion, SystemsMapRegionSpec> = {
  archive: {
    label: "Docs & Archive",
    center: { x: -280, y: -8 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -72, y: -78 },
      { x: -62, y: 80 },
    ],
    fanCenterAngle: Math.PI,
    fanSweep: 2.08,
    labelOffset: { x: -4, y: -118 },
  },
  graph: {
    label: "Graph Engine",
    center: { x: -18, y: -14 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -78, y: -66 },
      { x: 74, y: 70 },
    ],
    fanCenterAngle: -1.72,
    fanSweep: 2.42,
    labelOffset: { x: -6, y: -112 },
  },
  governance: {
    label: "Governance Core",
    center: { x: 118, y: 124 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -74, y: -52 },
      { x: 72, y: 58 },
    ],
    fanCenterAngle: 1.18,
    fanSweep: 2.16,
    labelOffset: { x: -2, y: -108 },
  },
  runtime: {
    label: "Automation & Verification",
    center: { x: 96, y: -162 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -54, y: 54 },
      { x: 56, y: 52 },
    ],
    fanCenterAngle: -1.5,
    fanSweep: 1.76,
    labelOffset: { x: 0, y: -104 },
  },
  experience: {
    label: "Experience & Routes",
    center: { x: 286, y: 18 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -66, y: -62 },
      { x: -68, y: 66 },
    ],
    fanCenterAngle: 0.1,
    fanSweep: 1.98,
    labelOffset: { x: 0, y: -112 },
  },
  conflicts: {
    label: "Conflict & Drift",
    center: { x: 492, y: 112 },
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -62, y: -52 },
      { x: -62, y: 56 },
    ],
    fanCenterAngle: 0.12,
    fanSweep: 1.9,
    labelOffset: { x: 6, y: -106 },
  },
};

function stableHash(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function computeNodeImportance(node: SemanticLayoutNode): number {
  let score =
    (node.authorityDepth ?? 0) +
    (node.verificationCount ?? 0) * 12 +
    node.connectionCount * 1.35 +
    (node.contradictionCount ?? 0) * 5;

  if (node.status === "VERIFIED") score += 18;
  if (node.status === "CONFLICTED") score += 26;
  if (node.status === "QUARANTINED") score += 32;
  if (node.bridgeState === "enforced") score += 18;
  if (node.bridgeState === "verified") score += 12;

  return score;
}

export function getSystemsMapRegion(node: SemanticLayoutNode): SystemsMapRegion {
  if (node.layoutCluster && node.layoutCluster in SYSTEMS_MAP_REGION_SPECS) {
    return node.layoutCluster as SystemsMapRegion;
  }

  if (
    node.status === "CONFLICTED" ||
    node.status === "QUARANTINED" ||
    node.bridgeState === "contradicted" ||
    node.category === "contradictions" ||
    node.category === "failure-mode"
  ) {
    return "conflicts";
  }

  if (
    node.repo === "papers" ||
    node.category === "paper" ||
    node.category === "papers" ||
    node.category === "paper-section" ||
    node.governanceLayer === "theoretical" ||
    node.governanceLayer === "historical"
  ) {
    return "claims";
  }

  if (
    node.repo === "FreeAgent" ||
    node.repo === "federation" ||
    node.category === "we4free" ||
    node.category === "coordination" ||
    node.category === "ai-ensemble-lab" ||
    node.category === "benchmark" ||
    node.graphSection === "exterior" ||
    node.exteriorRole === "pattern_donor" ||
    node.exteriorRole === "origin_artifact" ||
    node.exteriorRole === "simulation"
  ) {
    return "external";
  }

  if (
    node.type === "code" ||
    node.category === "agent" ||
    node.category === "script"
  ) {
    return "execution";
  }

  if (
    node.category === "data" ||
    node.category === "docs" ||
    node.category === "root-doc" ||
    node.category === "plans" ||
    node.category === "reports" ||
    node.category === "library" ||
    node.category === "reflection"
  ) {
    return "sources";
  }

  if (
    node.category === "governance" ||
    node.category === "evidence" ||
    node.governanceLayer === "constitutional" ||
    node.governanceLayer === "operational" ||
    node.governanceLayer === "evidence" ||
    node.bridgeState === "enforced" ||
    node.bridgeState === "verified" ||
    node.bridgeState === "partial"
  ) {
    return "governance";
  }

  return "sources";
}

export function getArchitectureMapRegion(node: SemanticLayoutNode): ArchitectureMapRegion {
  if (node.layoutCluster && node.layoutCluster in ARCHITECTURE_MAP_REGION_SPECS) {
    return node.layoutCluster as ArchitectureMapRegion;
  }

  if (
    node.status === "CONFLICTED" ||
    node.status === "QUARANTINED" ||
    node.bridgeState === "contradicted" ||
    node.category === "contradictions" ||
    node.category === "failure-mode" ||
    node.category === "quarantine"
  ) {
    return "conflicts";
  }

  const normalizedPath = (node.path ?? "").replace(/\\/g, "/").toLowerCase();
  const normalizedTitle = (node.title ?? "").toLowerCase();

  if (
    normalizedPath.startsWith("src/components/graph/") ||
    normalizedPath.startsWith("src/app/graph/") ||
    normalizedPath.startsWith("src/app/api/graph-data/") ||
    normalizedPath.startsWith("src/lib/") ||
    normalizedPath.startsWith("docs/graph/") ||
    normalizedPath.startsWith("evidence/graph-snapshots/") ||
    normalizedPath.startsWith("reports/graph-work-path-") ||
    normalizedTitle.includes("graph")
  ) {
    return "graph";
  }

  if (
    normalizedPath.startsWith("src/app/") ||
    normalizedPath.startsWith("src/components/") ||
    normalizedPath.startsWith("public/") ||
    normalizedPath === "src/middleware.ts"
  ) {
    return "experience";
  }

  if (
    normalizedPath.startsWith(".global/") ||
    normalizedPath.startsWith("schemas/") ||
    normalizedPath.startsWith("library/docs/archivist/") ||
    normalizedPath.startsWith("library/docs/attestation/") ||
    normalizedPath.startsWith("src/attestation/") ||
    normalizedPath.startsWith("src/identity/") ||
    normalizedPath.startsWith("src/lane/") ||
    normalizedPath.startsWith("src/queue/") ||
    normalizedPath.startsWith("src/resilience/") ||
    node.category === "governance" ||
    node.category === "attestation" ||
    node.category === "schema" ||
    normalizedTitle.includes("governance") ||
    normalizedTitle.includes("protocol") ||
    normalizedTitle.includes("covenant")
  ) {
    return "governance";
  }

  if (
    normalizedPath.startsWith("scripts/") ||
    normalizedPath.startsWith("verification/") ||
    normalizedPath.startsWith("tests/") ||
    normalizedPath.startsWith("config/") ||
    normalizedPath.startsWith("src/swarmmind/") ||
    normalizedPath.includes("/verification/") ||
    node.category === "verification" ||
    node.category === "script" ||
    node.category === "usage" ||
    node.category === "test"
  ) {
    return "runtime";
  }

  return "archive";
}

export function getSemanticLayoutRegion(
  node: SemanticLayoutNode,
  preset: SemanticLayoutPreset = "systems",
): SemanticLayoutRegion {
  return preset === "architecture"
    ? getArchitectureMapRegion(node)
    : getSystemsMapRegion(node);
}

export function getSemanticLayoutRegionSpecs(
  preset: SemanticLayoutPreset = "systems",
): Record<string, SystemsMapRegionSpec> {
  return preset === "architecture"
    ? ARCHITECTURE_MAP_REGION_SPECS
    : SYSTEMS_MAP_REGION_SPECS;
}

function getSemanticLayoutRegionOrder(
  preset: SemanticLayoutPreset = "systems",
): string[] {
  return preset === "architecture"
    ? ARCHITECTURE_MAP_REGION_ORDER
    : SYSTEMS_MAP_REGION_ORDER;
}

function buildAdjacencyMap(edges: SemanticLayoutEdge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  const addLink = (source: string, target: string) => {
    const existing = adjacency.get(source);
    if (existing) {
      existing.add(target);
    } else {
      adjacency.set(source, new Set([target]));
    }
  };

  for (const edge of edges) {
    addLink(edge.source, edge.target);
    addLink(edge.target, edge.source);
  }

  return adjacency;
}

function getHubCount(regionSize: number): number {
  if (regionSize >= 18) return 3;
  if (regionSize >= 9) return 2;
  return 1;
}

function getHubPosition(
  spec: SystemsMapRegionSpec,
  hubIndex: number,
): SemanticLayoutPosition {
  const offset = spec.hubOffsets[Math.min(hubIndex, spec.hubOffsets.length - 1)];
  return {
    x: spec.center.x + offset.x,
    y: spec.center.y + offset.y,
  };
}

function assignHubBuckets(
  nodes: SemanticLayoutNode[],
  hubs: SemanticLayoutNode[],
  adjacency: Map<string, Set<string>>,
): Map<string, SemanticLayoutNode[]> {
  const buckets = new Map<string, SemanticLayoutNode[]>();

  for (const hub of hubs) {
    buckets.set(hub.id, []);
  }

  if (hubs.length === 1) {
    buckets.set(
      hubs[0].id,
      nodes.filter((node) => node.id !== hubs[0].id),
    );
    return buckets;
  }

  for (const node of nodes) {
    let bestHubId = hubs[stableHash(node.id) % hubs.length].id;
    let bestScore = -1;
    const neighborIds = adjacency.get(node.id);

    hubs.forEach((hub, hubIndex) => {
      const directLink = neighborIds?.has(hub.id) ? 12 : 0;
      const score = directLink + (hubs.length - hubIndex);
      if (score > bestScore) {
        bestScore = score;
        bestHubId = hub.id;
      }
    });

    buckets.get(bestHubId)!.push(node);
  }

  for (const [hubId, bucket] of buckets.entries()) {
    bucket.sort((left, right) => {
      const scoreDelta = computeNodeImportance(right) - computeNodeImportance(left);
      if (scoreDelta !== 0) return scoreDelta;
      return left.id.localeCompare(right.id);
    });
    buckets.set(
      hubId,
      bucket.filter((node) => node.id !== hubId),
    );
  }

  return buckets;
}

function placeSatelliteBucket(
  bucket: SemanticLayoutNode[],
  hubPosition: SemanticLayoutPosition,
  spec: SystemsMapRegionSpec,
  hubIndex: number,
  positions: Record<string, SemanticLayoutPosition>,
): void {
  let cursor = 0;
  let ring = 0;

  while (cursor < bucket.length) {
    const nodesInRing = Math.min(bucket.length - cursor, 5 + ring * 2);
    const baseRadius = 84 + ring * 48 + hubIndex * 14;
    const fanSweep = Math.min(spec.fanSweep, 1.45 + ring * 0.24);
    const angleStart =
      spec.fanCenterAngle -
      fanSweep / 2 +
      hubIndex * 0.28 -
      ring * 0.04;

    for (let slot = 0; slot < nodesInRing; slot += 1) {
      const node = bucket[cursor + slot];
      const fraction = nodesInRing === 1 ? 0.5 : slot / (nodesInRing - 1);
      const angle = angleStart + fraction * fanSweep;
      const hash = stableHash(node.id);
      const radialJitter = ((hash % 11) - 5) * 3.5;
      const tangentJitter = (((hash >> 4) % 9) - 4) * 4.5;
      const radius = baseRadius + radialJitter;

      positions[node.id] = {
        x:
          hubPosition.x +
          Math.cos(angle) * radius +
          Math.cos(angle + Math.PI / 2) * tangentJitter,
        y:
          hubPosition.y +
          Math.sin(angle) * radius +
          Math.sin(angle + Math.PI / 2) * tangentJitter,
      };
    }

    cursor += nodesInRing;
    ring += 1;
  }
}

function runCollisionPass(
  nodeIds: string[],
  positions: Record<string, SemanticLayoutPosition>,
  hubIds: Set<string>,
): void {
  for (let pass = 0; pass < 2; pass += 1) {
    for (let leftIndex = 0; leftIndex < nodeIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nodeIds.length; rightIndex += 1) {
        const leftId = nodeIds[leftIndex];
        const rightId = nodeIds[rightIndex];
        const left = positions[leftId];
        const right = positions[rightId];
        if (!left || !right) continue;

        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const minimumSpacing =
          hubIds.has(leftId) || hubIds.has(rightId) ? 88 : 54;

        if (distance >= minimumSpacing) continue;

        const push = (minimumSpacing - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;

        if (!hubIds.has(leftId)) {
          left.x -= nx * push;
          left.y -= ny * push;
        }

        if (!hubIds.has(rightId)) {
          right.x += nx * push;
          right.y += ny * push;
        }
      }
    }
  }
}

export function computeSemanticGraphLayout(
  nodes: SemanticLayoutNode[],
  edges: SemanticLayoutEdge[] = [],
  options?: { preset?: SemanticLayoutPreset },
): Record<string, SemanticLayoutPosition> {
  const positions: Record<string, SemanticLayoutPosition> = {};
  const adjacency = buildAdjacencyMap(edges);
  const preset = options?.preset ?? "systems";
  const regionSpecs = getSemanticLayoutRegionSpecs(preset);
  const regionOrder = getSemanticLayoutRegionOrder(preset);
  const regionGroups = new Map<string, SemanticLayoutNode[]>();

  for (const region of regionOrder) {
    regionGroups.set(region, []);
  }

  for (const node of nodes) {
    regionGroups.get(getSemanticLayoutRegion(node, preset))!.push(node);
  }

  for (const region of regionOrder) {
    const regionNodes = regionGroups.get(region) || [];
    if (regionNodes.length === 0) continue;

    const spec = regionSpecs[region];
    const sortedNodes = [...regionNodes].sort((left, right) => {
      const scoreDelta = computeNodeImportance(right) - computeNodeImportance(left);
      if (scoreDelta !== 0) return scoreDelta;
      return left.id.localeCompare(right.id);
    });

    const hubCount = getHubCount(sortedNodes.length);
    const hubs = sortedNodes.slice(0, hubCount);
    const hubIds = new Set(hubs.map((node) => node.id));

    hubs.forEach((hub, hubIndex) => {
      positions[hub.id] = getHubPosition(spec, hubIndex);
    });

    const buckets = assignHubBuckets(sortedNodes, hubs, adjacency);
    hubs.forEach((hub, hubIndex) => {
      const hubPosition = positions[hub.id];
      const bucket = buckets.get(hub.id) || [];
      placeSatelliteBucket(bucket, hubPosition, spec, hubIndex, positions);
    });

    runCollisionPass(sortedNodes.map((node) => node.id), positions, hubIds);
  }

  return positions;
}

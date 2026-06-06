"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Graph from "graphology";
import Sigma from "sigma";

import { computeCameraFitFromDisplayPoints } from "@/lib/graph-camera-fit";
import type { GraphEdge, GraphLens, GraphNode } from "@/lib/graph-types";
import {
  computeSemanticGraphLayout,
  getSemanticLayoutRegion,
  getSemanticLayoutRegionSpecs,
} from "@/lib/semantic-graph-layout";
import {
  getGraphWorkspacePreset,
  getGraphWorkspaceRegionTheme,
  getGraphWorkspaceRegions,
} from "@/lib/graph-workspace-theme";

let cachedWebglAvailability: boolean | undefined;

function isWebglAvailable(): boolean {
  if (cachedWebglAvailability !== undefined) return cachedWebglAvailability;
  if (typeof window === "undefined") {
    cachedWebglAvailability = false;
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    cachedWebglAvailability = Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
    return cachedWebglAvailability;
  } catch {
    cachedWebglAvailability = false;
    return false;
  }
}

const EDGE_CURVE_PROGRAM = (Sigma as any).rendering?.EdgeCurveProgram;
const DEFAULT_EDGE_COLOR = "rgba(159, 166, 188, 0.24)";
const DIM_NODE_COLOR = "rgba(74, 78, 93, 0.38)";
const DIM_EDGE_COLOR = "rgba(70, 76, 92, 0.08)";
const MATCH_COLOR = "#F7F0B5";
const SELECTED_COLOR = "#FFFFFF";
const HOVER_RING_COLOR = "#D9E8FF";

interface NavigationClusterSpec {
  center: { x: number; y: number };
  radiusX: number;
  radiusY: number;
  rotation: number;
  ringScaleStep: number;
  labelHubCount: number;
  hubOffsets: Array<{ x: number; y: number }>;
}

const NAVIGATION_CLUSTER_SPECS: Record<string, NavigationClusterSpec> = {
  archive: {
    center: { x: -90, y: 6 },
    radiusX: 48,
    radiusY: 68,
    rotation: -0.2,
    ringScaleStep: 0.14,
    labelHubCount: 2,
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -24, y: -34 },
      { x: -26, y: 38 },
    ],
  },
  graph: {
    center: { x: -6, y: 10 },
    radiusX: 78,
    radiusY: 86,
    rotation: 0.12,
    ringScaleStep: 0.14,
    labelHubCount: 4,
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -22, y: -28 },
      { x: 26, y: -8 },
      { x: 12, y: 28 },
    ],
  },
  runtime: {
    center: { x: -4, y: 92 },
    radiusX: 52,
    radiusY: 44,
    rotation: -0.4,
    ringScaleStep: 0.14,
    labelHubCount: 2,
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -24, y: 20 },
      { x: 24, y: 22 },
    ],
  },
  governance: {
    center: { x: 8, y: -92 },
    radiusX: 56,
    radiusY: 48,
    rotation: 0.2,
    ringScaleStep: 0.14,
    labelHubCount: 2,
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -22, y: -18 },
      { x: 26, y: -16 },
    ],
  },
  experience: {
    center: { x: 104, y: 6 },
    radiusX: 48,
    radiusY: 60,
    rotation: 0.08,
    ringScaleStep: 0.1,
    labelHubCount: 2,
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -18, y: -14 },
      { x: -14, y: 18 },
    ],
  },
  conflicts: {
    center: { x: 136, y: 28 },
    radiusX: 38,
    radiusY: 48,
    rotation: 0.06,
    ringScaleStep: 0.12,
    labelHubCount: 2,
    hubOffsets: [
      { x: 0, y: 0 },
      { x: -10, y: -18 },
      { x: -10, y: 18 },
    ],
  },
};

const NAVIGATION_REGION_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  archive: { x: -18, y: 48 },
  graph: { x: 0, y: 56 },
  runtime: { x: 0, y: 34 },
  governance: { x: 0, y: -34 },
  experience: { x: 18, y: 42 },
  conflicts: { x: 16, y: 0 },
};

const NAVIGATION_REGION_COLUMNS: Record<string, number[]> = {
  archive: [-22, -4, 8],
  graph: [-26, -8, 8, 26],
  runtime: [-42, -14, 14, 42],
  governance: [-40, -12, 12, 40],
  experience: [-16, 0, 16],
  conflicts: [-14, 0, 14],
};

const BRIDGE_ROUTE_OVERRIDES: Record<
  string,
  { bend: number; normalSign: number; spread: number; axial?: number }
> = {
  "archive::graph": { bend: 0.16, normalSign: 0.92, spread: 0.08 },
  "archive::governance": { bend: 0.2, normalSign: -0.88, spread: 0.06 },
  "graph::runtime": { bend: 0.24, normalSign: 0.92, spread: 0.06 },
  "graph::governance": { bend: 0.24, normalSign: -0.92, spread: 0.06 },
  "graph::experience": { bend: 0.18, normalSign: 0.35, spread: 0.14 },
  "governance::experience": { bend: 0.22, normalSign: -0.62, spread: 0.08 },
  "governance::conflicts": { bend: 0.18, normalSign: -0.48, spread: 0.06 },
  "experience::conflicts": { bend: 0.14, normalSign: 0.24, spread: 0.09 },
  "runtime::experience": { bend: 0.18, normalSign: 0.74, spread: 0.07 },
  "runtime::conflicts": { bend: 0.18, normalSign: 0.86, spread: 0.06 },
};

const NAVIGATION_BRIDGE_CORRIDORS: Record<
  string,
  { points: Array<{ x: number; y: number }>; laneSpread: number; xSpread?: number }
> = {
  "archive::graph": { points: [{ x: -66, y: -6 }], laneSpread: 14 },
  "archive::governance": { points: [{ x: -54, y: -68 }], laneSpread: 12, xSpread: 3 },
  "graph::runtime": { points: [{ x: -8, y: 70 }], laneSpread: 14, xSpread: 2 },
  "graph::governance": { points: [{ x: -8, y: -72 }], laneSpread: 14, xSpread: 2 },
  "graph::experience": { points: [{ x: 74, y: -2 }], laneSpread: 16 },
  "governance::experience": {
    points: [
      { x: 56, y: -78 },
      { x: 104, y: -30 },
    ],
    laneSpread: 12,
    xSpread: 4,
  },
  "governance::conflicts": {
    points: [
      { x: 86, y: -82 },
      { x: 128, y: -34 },
    ],
    laneSpread: 12,
    xSpread: 4,
  },
  "experience::conflicts": { points: [{ x: 142, y: 2 }], laneSpread: 10 },
  "runtime::experience": {
    points: [
      { x: 56, y: 78 },
      { x: 102, y: 34 },
    ],
    laneSpread: 12,
    xSpread: 4,
  },
  "runtime::conflicts": {
    points: [
      { x: 82, y: 86 },
      { x: 126, y: 38 },
    ],
    laneSpread: 12,
    xSpread: 4,
  },
};

const NAVIGATION_BRIDGE_LANE_PATTERN = [0, -1, 1, -2, 2, -3, 3, -4];

const NAVIGATION_OVERVIEW_TWIG_LIMITS: Record<string, number> = {
  archive: 16,
  graph: 22,
  runtime: 14,
  governance: 14,
  experience: 14,
  conflicts: 10,
};

const NAVIGATION_OVERVIEW_HUB_LIMITS: Record<string, number> = {
  archive: 3,
  graph: 4,
  runtime: 3,
  governance: 3,
  experience: 3,
  conflicts: 2,
};

const NAVIGATION_OVERVIEW_TRUNKS: Array<{
  from: string;
  to: string;
  width: number;
  glow: number;
  lanes: number;
}> = [
  { from: "archive", to: "graph", width: 1.42, glow: 2.4, lanes: 3 },
  { from: "governance", to: "graph", width: 1.36, glow: 2.28, lanes: 3 },
  { from: "runtime", to: "graph", width: 1.36, glow: 2.28, lanes: 3 },
  { from: "graph", to: "experience", width: 1.5, glow: 2.5, lanes: 4 },
  { from: "governance", to: "experience", width: 1.18, glow: 1.98, lanes: 3 },
  { from: "runtime", to: "experience", width: 1.18, glow: 1.98, lanes: 3 },
  { from: "experience", to: "conflicts", width: 1.12, glow: 1.84, lanes: 3 },
];

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  graphLens?: GraphLens;
  searchQuery: string;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onCameraUpdate: (ratio: number) => void;
}

interface RegionLabel {
  region: string;
  label: string;
  left: number;
  top: number;
  color: string;
}

interface NavigationOverlayPath {
  d: string;
  color: string;
  width: number;
  opacity: number;
}

interface RenderNodeAttributes {
  color: string;
  edgeColor: string;
  label: string;
  layoutRegion: string;
  searchText: string;
  size: number;
  forceLabel: boolean;
  importance: number;
  x: number;
  y: number;
  navigationHub?: boolean;
  navigationHubRank?: number;
  routeGuide?: boolean;
}

export interface GraphCanvasImperativeHandle {
  fitVisible: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

type SigmaRenderer = Sigma<
  RenderNodeAttributes,
  Record<string, unknown>,
  Record<string, unknown>
>;

function trimGraphLabel(label: string, maxLength = 16): string {
  const normalized = label.replace(/^[^A-Za-z0-9]+/, "").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function deriveDisplayLabel(node: GraphNode): string {
  const normalizedPath = node.path?.replace(/\\/g, "/") ?? "";
  const pathLeaf = normalizedPath ? normalizedPath.split("/").filter(Boolean).at(-1) : null;
  const baseLabel =
    pathLeaf && /\.[A-Za-z0-9]+$/.test(pathLeaf)
      ? pathLeaf.replace(/\.[A-Za-z0-9]+$/, "")
      : node.title;

  return trimGraphLabel(
    baseLabel
      .replace(/^self-organizing-library[:/ -]*/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b(page|layout|route|index)\b/gi, (value) => value.toUpperCase()),
    14,
  );
}

function stableHash(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith("rgba(")) return color;
  const body = color.slice(5, -1).split(",").slice(0, 3).map((value) => value.trim());
  return `rgba(${body.join(", ")}, ${alpha})`;
}

function withPathAlpha(color: string, alpha: number): string {
  if (color.startsWith("rgba(")) return withAlpha(color, alpha);
  if (color.startsWith("rgb(")) {
    const body = color.slice(4, -1).split(",").slice(0, 3).map((value) => value.trim());
    return `rgba(${body.join(", ")}, ${alpha})`;
  }
  if (color.startsWith("#")) {
    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;
    const red = parseInt(normalized.slice(1, 3), 16);
    const green = parseInt(normalized.slice(3, 5), 16);
    const blue = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return color;
}

function buildPolylinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(
      2,
    )} ${points[1].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index < points.length - 2; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midpointX = (current.x + next.x) / 2;
    const midpointY = (current.y + next.y) / 2;
    path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${midpointX.toFixed(
      2,
    )} ${midpointY.toFixed(2)}`;
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  path += ` Q ${penultimate.x.toFixed(2)} ${penultimate.y.toFixed(2)} ${last.x.toFixed(
    2,
  )} ${last.y.toFixed(2)}`;

  return path;
}

function buildQuadraticPath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  curvature: number,
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const midpointX = (source.x + target.x) / 2;
  const midpointY = (source.y + target.y) / 2;
  const bend = distance * curvature * 0.65;
  const controlX = midpointX + normalX * bend;
  const controlY = midpointY + normalY * bend;

  return `M ${source.x.toFixed(2)} ${source.y.toFixed(2)} Q ${controlX.toFixed(
    2,
  )} ${controlY.toFixed(2)} ${target.x.toFixed(2)} ${target.y.toFixed(2)}`;
}

function resolveSemanticEdgeColor(
  authority: GraphEdge["authority"],
  crossRegion: boolean,
  fallbackColor: string,
): string {
  switch (authority) {
    case "CONTRADICTS":
      return crossRegion ? "rgba(240, 84, 135, 0.18)" : "rgba(240, 84, 135, 0.28)";
    case "VERIFIES":
      return crossRegion ? "rgba(80, 195, 139, 0.16)" : "rgba(80, 195, 139, 0.24)";
    case "SIGNED_BY":
      return crossRegion ? "rgba(178, 133, 255, 0.16)" : "rgba(178, 133, 255, 0.24)";
    case "DERIVES_FROM":
      return crossRegion ? "rgba(96, 165, 250, 0.14)" : "rgba(96, 165, 250, 0.2)";
    case "EXECUTES":
      return crossRegion ? "rgba(244, 166, 70, 0.16)" : "rgba(244, 166, 70, 0.24)";
    case "DEPENDS_ON":
      return crossRegion ? "rgba(159, 166, 188, 0.08)" : "rgba(159, 166, 188, 0.14)";
    default:
      return crossRegion ? withAlpha(fallbackColor, 0.1) : fallbackColor;
  }
}

function getBridgeRouteKey(leftRegion: string, rightRegion: string): string {
  return [leftRegion, rightRegion].sort().join("::");
}

function computeNavigationLocalCurvature(
  sourceId: string,
  targetId: string,
  region: string,
  channelIndex = 0,
): number {
  const [leftId, rightId] =
    sourceId.localeCompare(targetId) <= 0 ? [sourceId, targetId] : [targetId, sourceId];
  const seed = stableHash(`${region}:${leftId}:${rightId}:${channelIndex}`);
  const sign = (() => {
    switch (region) {
      case "archive":
      case "governance":
        return -1;
      case "experience":
      case "conflicts":
      case "runtime":
        return 1;
      case "graph":
      default:
        return seed % 2 === 0 ? 1 : -1;
    }
  })();
  const amplitude = 0.072 + ((seed >> 4) % 4) * 0.01 + channelIndex * 0.014;
  return sign * Math.min(0.22, amplitude);
}

function computeNavigationLocalCurvatureFromGeometry(
  sourcePoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
  region: string,
  channelIndex = 0,
): number {
  const spec = NAVIGATION_CLUSTER_SPECS[region];
  if (!spec) return computeNavigationLocalCurvature("source", "target", region, channelIndex);

  const dx = targetPoint.x - sourcePoint.x;
  const dy = targetPoint.y - sourcePoint.y;
  const span = Math.hypot(dx, dy);
  const midpointX = (sourcePoint.x + targetPoint.x) / 2 - spec.center.x;
  const midpointY = (sourcePoint.y + targetPoint.y) / 2 - spec.center.y;
  const horizontalBias = Math.abs(dx) >= Math.abs(dy);
  const sign = (() => {
    switch (region) {
      case "archive":
        return -1;
      case "experience":
      case "conflicts":
        return 1;
      case "runtime":
      case "governance":
        return midpointX >= 0 ? 1 : -1;
      case "graph":
      default:
        return midpointY >= 0 ? -1 : 1;
    }
  })();
  const regionBase =
    region === "graph"
      ? 0.11
      : region === "archive" || region === "experience"
      ? 0.102
      : 0.096;
  const amplitude =
    regionBase +
    clampNumber(span / 780, 0.018, 0.082) +
    channelIndex * 0.024 +
    (horizontalBias ? 0.014 : -0.008);

  return sign * clampNumber(amplitude, 0.082, 0.24);
}

function computeNavigationBridgeCurvature(
  leftRegion: string,
  rightRegion: string,
  bridgeIndex: number,
  bridgeCount: number,
): number {
  const routeKey = getBridgeRouteKey(leftRegion, rightRegion);
  const override = BRIDGE_ROUTE_OVERRIDES[routeKey] ?? {
    bend: 0.18,
    normalSign:
      (NAVIGATION_CLUSTER_SPECS[rightRegion]?.center.x ?? 0) >=
      (NAVIGATION_CLUSTER_SPECS[leftRegion]?.center.x ?? 0)
        ? 0.4
        : -0.4,
    spread: 0.08,
    axial: 0,
  };
  const channelCount = bridgeCount >= 6 ? 3 : bridgeCount >= 4 ? 2 : 1;
  const channelIndex = bridgeIndex % channelCount;
  const centeredIndex = channelIndex - (channelCount - 1) / 2;
  const baseCurvature = override.bend * 1.12 * override.normalSign;
  const spreadCurvature = centeredIndex * override.spread;
  const axialBias = (override.axial ?? 0) * 0.3;

  return clampNumber(
    baseCurvature + spreadCurvature + axialBias,
    -0.68,
    0.68,
  );
}

function computeNavigationSemanticCurvature(
  sourceId: string,
  targetId: string,
  sourceRegion: string,
  targetRegion: string,
): number {
  if (sourceRegion === targetRegion) {
    return computeNavigationLocalCurvature(sourceId, targetId, sourceRegion, 0);
  }

  const [leftRegion, rightRegion] =
    sourceRegion.localeCompare(targetRegion) <= 0
      ? [sourceRegion, targetRegion]
      : [targetRegion, sourceRegion];
  const [leftId, rightId] =
    sourceId.localeCompare(targetId) <= 0 ? [sourceId, targetId] : [targetId, sourceId];
  const bundleSeed = stableHash(`${leftRegion}:${rightRegion}:${leftId}:${rightId}`);
  const bundleIndex = bundleSeed % 3;
  const canonicalCurvature = computeNavigationBridgeCurvature(
    leftRegion,
    rightRegion,
    bundleIndex,
    6,
  );

  return sourceRegion === leftRegion ? canonicalCurvature : -canonicalCurvature;
}

function resolveNavigationPresentationRegion(node: GraphNode): string {
  const path = (node.path ?? "").replace(/\\/g, "/").toLowerCase();
  const title = (node.title ?? "").toLowerCase();

  if (
    /contradict|failure|quarantine|drift|false positive|trust gap/.test(title) ||
    path.includes("failure-modes/") ||
    path.includes("contradiction")
  ) {
    return "conflicts";
  }

  if (
    path.startsWith("src/app/") ||
    path.startsWith("src/components/") ||
    path === "src/middleware.ts"
  ) {
    return "experience";
  }

  if (
    path.startsWith("src/attestation/") ||
    path.startsWith(".global/") ||
    path.startsWith("schemas/") ||
    node.category === "attestation" ||
    node.category === "governance" ||
    /governance|attestation|covenant|protocol/.test(title)
  ) {
    return "governance";
  }

  if (
    path.startsWith("scripts/") ||
    path.startsWith("verification/") ||
    node.category === "verification" ||
    /recovery|presence|verdict|drill|enforcement/.test(title)
  ) {
    return "runtime";
  }

  if (
    path.startsWith("src/lib/") ||
    path.startsWith("src/app/api/graph-data/") ||
    path.startsWith("docs/graph/") ||
    path.startsWith("data/site-index") ||
    /graph|nexus/.test(title)
  ) {
    return "graph";
  }

  return "archive";
}

function computeImportance(node: GraphNode): number {
  let score =
    node.authorityDepth +
    node.verificationCount * 11 +
    node.connectionCount * 1.35 +
    node.contradictionCount * 5;

  if (node.status === "VERIFIED") score += 16;
  if (node.status === "CONFLICTED") score += 24;
  if (node.status === "QUARANTINED") score += 28;
  if (node.bridgeState === "enforced") score += 16;
  if (node.bridgeState === "verified") score += 10;

  return score;
}

function computeNodeSize(node: GraphNode): number {
  const importance = computeImportance(node);
  const baseSize = node.type === "paper" ? 9.4 : node.type === "code" ? 8.8 : 8.2;
  return Math.max(baseSize, Math.min(20, baseSize + Math.sqrt(Math.max(importance, 1)) * 0.58));
}

function shouldForceLabel(node: GraphNode): boolean {
  return (
    node.connectionCount >= 16 ||
    node.verificationCount >= 3 ||
    node.contradictionCount >= 2 ||
    node.bridgeState === "enforced" ||
    node.authorityDepth >= 70
  );
}

function adjustRenderablePosition(
  position: { x: number; y: number },
  _layoutRegion: string,
  graphLens: GraphLens,
): { x: number; y: number } {
  if (graphLens !== "navigation") {
    return position;
  }
  return {
    x: position.x,
    y: position.y,
  };
}

function clampPointToEllipse(
  point: { x: number; y: number },
  center: { x: number; y: number },
  radiusX: number,
  radiusY: number,
): { x: number; y: number } {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const normalized = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY);

  if (normalized <= 1) return point;

  const scale = 1 / Math.sqrt(normalized);
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  };
}

function runNavigationCollisionPass(
  graph: Graph<RenderNodeAttributes>,
  nodeIds: string[],
  protectedIds: Set<string>,
  spec: NavigationClusterSpec,
): void {
  for (let pass = 0; pass < 3; pass += 1) {
    for (let leftIndex = 0; leftIndex < nodeIds.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nodeIds.length; rightIndex += 1) {
        const leftId = nodeIds[leftIndex];
        const rightId = nodeIds[rightIndex];
        const left = graph.getNodeAttributes(leftId);
        const right = graph.getNodeAttributes(rightId);
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const minimumSpacing =
          protectedIds.has(leftId) || protectedIds.has(rightId) ? 27 : 17;

        if (distance >= minimumSpacing) continue;

        const push = (minimumSpacing - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;

        if (!protectedIds.has(leftId)) {
          graph.mergeNodeAttributes(
            leftId,
            clampPointToEllipse(
              { x: left.x - nx * push, y: left.y - ny * push },
              spec.center,
              spec.radiusX,
              spec.radiusY,
            ),
          );
        }

        if (!protectedIds.has(rightId)) {
          graph.mergeNodeAttributes(
            rightId,
            clampPointToEllipse(
              { x: right.x + nx * push, y: right.y + ny * push },
              spec.center,
              spec.radiusX,
              spec.radiusY,
            ),
          );
        }
      }
    }
  }
}

function computeNavigationSatellitePosition(
  region: string,
  spec: NavigationClusterSpec,
  satelliteIndex: number,
  satelliteCount: number,
  nodeId: string,
): { x: number; y: number } {
  const columns = NAVIGATION_REGION_COLUMNS[region] ?? [-18, 18];
  const columnCount = columns.length;
  const rowCount = Math.ceil(Math.max(satelliteCount, 1) / columnCount);
  const columnIndex = satelliteIndex % columnCount;
  const rowIndex = Math.floor(satelliteIndex / columnCount);
  const rowCenter = (rowCount - 1) / 2;
  const columnCenter = (columnCount - 1) / 2;
  const rowOffset = (rowIndex - rowCenter) * (region === "graph" ? 18 : 20);
  const columnDistance = Math.abs(columnIndex - columnCenter);
  const hash = stableHash(`${region}:${nodeId}`);
  const jitterX = (((hash >> 5) % 7) - 3) * 1.2;
  const jitterY = (((hash >> 9) % 7) - 3) * 1.2;

  switch (region) {
    case "archive":
      return {
        x: spec.center.x + columns[columnIndex] + rowIndex * 2.2 + jitterX,
        y: spec.center.y + rowOffset + (columnIndex - columnCenter) * 6 + jitterY,
      };
    case "graph":
      return {
        x: spec.center.x + columns[columnIndex] + jitterX,
        y:
          spec.center.y +
          rowOffset +
          (columnDistance === 0.5 ? 2 : -columnDistance * 4.5) +
          jitterY,
      };
    case "runtime":
      return {
        x: spec.center.x + columns[columnIndex] + jitterX,
        y:
          spec.center.y +
          rowOffset -
          columnDistance * 8 +
          (rowIndex % 2 === 0 ? 2 : -2) +
          jitterY,
      };
    case "governance":
      return {
        x: spec.center.x + columns[columnIndex] + jitterX,
        y:
          spec.center.y +
          rowOffset +
          columnDistance * 7 +
          (rowIndex % 2 === 0 ? -2 : 2) +
          jitterY,
      };
    case "experience":
      return {
        x: spec.center.x + columns[columnIndex] + rowIndex * 2 + jitterX,
        y: spec.center.y + rowOffset * 1.08 + (columnIndex - columnCenter) * 8 + jitterY,
      };
    case "conflicts":
      return {
        x: spec.center.x + columns[columnIndex] + jitterX * 0.7,
        y:
          spec.center.y +
          rowOffset * 1.12 +
          (columnIndex - columnCenter) * 7 +
          jitterY * 0.7,
      };
    default:
      return {
        x: spec.center.x + columns[columnIndex] + jitterX,
        y: spec.center.y + rowOffset + jitterY,
      };
  }
}

function applyNavigationPresentationLayout(graph: Graph<RenderNodeAttributes>): void {
  const regionBuckets = new Map<string, string[]>();

  graph.forEachNode((nodeId, attributes) => {
    const bucket = regionBuckets.get(attributes.layoutRegion);
    if (bucket) {
      bucket.push(nodeId);
    } else {
      regionBuckets.set(attributes.layoutRegion, [nodeId]);
    }
  });

  Object.entries(NAVIGATION_CLUSTER_SPECS).forEach(([region, spec]) => {
    const ranked = [...(regionBuckets.get(region) ?? [])].sort(
      (left, right) =>
        graph.getNodeAttribute(right, "importance") - graph.getNodeAttribute(left, "importance"),
    );

    if (ranked.length === 0) return;

    const protectedIds = new Set<string>();
    const hubCount = Math.min(spec.hubOffsets.length, ranked.length);

    for (let index = 0; index < hubCount; index += 1) {
      const hubId = ranked[index];
      const offset = spec.hubOffsets[index];
      protectedIds.add(hubId);
      graph.mergeNodeAttributes(hubId, {
        x: spec.center.x + offset.x,
        y: spec.center.y + offset.y,
        navigationHub: index < spec.labelHubCount,
        navigationHubRank: index,
      });
    }

    const satellites = ranked.slice(hubCount);
    satellites.forEach((nodeId, satelliteIndex) => {
      graph.mergeNodeAttributes(
        nodeId,
        computeNavigationSatellitePosition(
          region,
          spec,
          satelliteIndex,
          satellites.length,
          nodeId,
        ),
      );
    });

    runNavigationCollisionPass(graph, ranked, protectedIds, spec);
  });
}

function addNavigationSupportEdges(graph: Graph<RenderNodeAttributes>): void {
  const regionBuckets = new Map<string, string[]>();

  graph.forEachNode((nodeId, attributes) => {
    const bucket = regionBuckets.get(attributes.layoutRegion);
    if (bucket) {
      bucket.push(nodeId);
    } else {
      regionBuckets.set(attributes.layoutRegion, [nodeId]);
    }
  });

  const addSupportEdge = (
    source: string,
    target: string,
    color: string,
    weight: number,
    size = 0.7,
    bridge = false,
    curvature?: number,
    routeIndex = 0,
    routeGroup = `local:${source}:${target}`,
    routeStep = 0,
  ) => {
    if (source === target || graph.hasEdge(source, target)) return;
    const sourceRegion = graph.getNodeAttribute(source, "layoutRegion");
    const targetRegion = graph.getNodeAttribute(target, "layoutRegion");
    const edgeCurvature =
      curvature ??
      (sourceRegion === targetRegion
        ? computeNavigationLocalCurvature(source, target, sourceRegion, bridge ? 1 : 0)
        : computeNavigationBridgeCurvature(sourceRegion, targetRegion, 0, 1));

    graph.addEdge(source, target, {
      color,
      size,
      type: "line",
      curvature: undefined,
      weight,
      support: true,
      bridge,
      routeIndex,
      routeGroup,
      routeStep,
      routeSource: source,
      routeTarget: target,
    });
  };

  const ensureRouteGuide = (
    routeKey: string,
    bridgeIndex: number,
    stepIndex: number,
    position: { x: number; y: number },
  ): string => {
    const guideId = `__route__${routeKey}__${bridgeIndex}__${stepIndex}`;
    if (!graph.hasNode(guideId)) {
      graph.addNode(guideId, {
        color: "rgba(0, 0, 0, 0)",
        edgeColor: "rgba(0, 0, 0, 0)",
        label: "",
        layoutRegion: routeKey,
        searchText: "",
        size: 0.01,
        forceLabel: false,
        importance: -1,
        x: position.x,
        y: position.y,
        navigationHub: false,
        navigationHubRank: -1,
        routeGuide: true,
      });
    } else {
      graph.mergeNodeAttributes(guideId, { x: position.x, y: position.y });
    }
    return guideId;
  };

  const addBridgeRoute = (
    source: string,
    target: string,
    leftRegion: string,
    rightRegion: string,
    bridgeIndex: number,
    color: string,
    weight: number,
    size: number,
  ) => {
    const routeKey = getBridgeRouteKey(leftRegion, rightRegion);
    const corridor = NAVIGATION_BRIDGE_CORRIDORS[routeKey];
    const routeGroup = `bridge:${routeKey}:${source}:${target}:${bridgeIndex}`;

    if (!corridor) {
      addSupportEdge(
        source,
        target,
        color,
        weight,
        size,
        true,
        computeNavigationBridgeCurvature(leftRegion, rightRegion, bridgeIndex, 8),
        bridgeIndex,
        routeGroup,
        0,
      );
      return;
    }

    const laneFactor =
      NAVIGATION_BRIDGE_LANE_PATTERN[bridgeIndex % NAVIGATION_BRIDGE_LANE_PATTERN.length] ?? 0;
    const guideIds = corridor.points.map((point, pointIndex) =>
      ensureRouteGuide(routeKey, bridgeIndex, pointIndex, {
        x:
          point.x +
          laneFactor * (corridor.xSpread ?? 0) * (pointIndex === 0 ? 0.6 : 1),
        y: point.y + laneFactor * corridor.laneSpread,
      }),
    );

    let previous = source;
    guideIds.forEach((guideId, segmentIndex) => {
      addSupportEdge(
        previous,
        guideId,
        color,
        weight,
        size,
        true,
        computeNavigationBridgeCurvature(leftRegion, rightRegion, bridgeIndex + segmentIndex, 8),
        bridgeIndex,
        routeGroup,
        segmentIndex,
      );
      previous = guideId;
    });

    addSupportEdge(
      previous,
      target,
      color,
      weight,
      size,
      true,
      computeNavigationBridgeCurvature(
        leftRegion,
        rightRegion,
        bridgeIndex + guideIds.length,
        8,
      ),
      bridgeIndex,
      routeGroup,
      guideIds.length,
    );
  };

  for (const [region, nodeIds] of regionBuckets.entries()) {
    const theme = getGraphWorkspaceRegionTheme(region, "navigation");
    const ranked = [...nodeIds].sort(
      (left, right) =>
        graph.getNodeAttribute(right, "importance") - graph.getNodeAttribute(left, "importance"),
    );
    const hubs = ranked.slice(0, Math.min(region === "graph" ? 5 : 3, ranked.length));
    const extraHubLimit = region === "graph" ? 12 : 5;
    const siblingLimit = region === "graph" ? 12 : 5;
    const nearbyLimit = region === "graph" ? 8 : 3;
    const tertiaryLimit = region === "graph" ? 5 : 0;

    ranked.forEach((nodeId, index) => {
      hubs.forEach((hubId, hubIndex) => {
        if (nodeId === hubId) return;
        if (hubIndex > 0 && index > extraHubLimit) return;
        addSupportEdge(
          nodeId,
          hubId,
          withAlpha(theme.edgeColor, region === "graph" ? 0.22 : 0.16),
          region === "graph" ? 3.4 - hubIndex * 0.35 : 2.6 - hubIndex * 0.28,
          region === "graph" ? 0.9 : 0.72,
          false,
          computeNavigationLocalCurvature(nodeId, hubId, region, hubIndex),
          hubIndex,
        );
      });

      const siblingId = ranked[index + 1];
      if (siblingId && index < siblingLimit) {
        addSupportEdge(
          nodeId,
          siblingId,
          withAlpha(theme.edgeColor, region === "graph" ? 0.18 : 0.12),
          region === "graph" ? 2.3 : 1.6,
          region === "graph" ? 0.7 : 0.54,
          false,
          computeNavigationLocalCurvature(nodeId, siblingId, region, 1),
          1,
        );
      }

      const nearbyId = ranked[index + 2];
      if (nearbyId && index < nearbyLimit) {
        addSupportEdge(
          nodeId,
          nearbyId,
          withAlpha(theme.edgeColor, region === "graph" ? 0.15 : 0.1),
          region === "graph" ? 1.8 : 1.22,
          region === "graph" ? 0.58 : 0.44,
          false,
          computeNavigationLocalCurvature(nodeId, nearbyId, region, 2),
          2,
        );
      }

      if (region === "graph") {
        const tertiaryId = ranked[index + 3];
        if (tertiaryId && index < tertiaryLimit) {
          addSupportEdge(
            nodeId,
            tertiaryId,
            withAlpha(theme.edgeColor, 0.12),
            1.42,
            0.5,
            false,
            computeNavigationLocalCurvature(nodeId, tertiaryId, region, 3),
            3,
          );
        }
      }
    });

    hubs.forEach((hubId, index) => {
      const peerId = hubs[index + 1];
      if (peerId) {
        addSupportEdge(
          hubId,
          peerId,
          withAlpha(theme.edgeColor, 0.24),
          2.9,
          0.94,
          false,
          computeNavigationLocalCurvature(hubId, peerId, region, index),
          index,
        );
      }
    });
  }

  const bridgePairs: Array<[string, string, number]> = [
    ["archive", "graph", 5],
    ["archive", "governance", 2],
    ["graph", "runtime", 5],
    ["graph", "governance", 5],
    ["graph", "experience", 6],
    ["governance", "experience", 5],
    ["governance", "conflicts", 3],
    ["experience", "conflicts", 5],
    ["runtime", "experience", 4],
    ["runtime", "conflicts", 2],
  ];

  bridgePairs.forEach(([leftRegion, rightRegion, bridgeCount]) => {
    const leftNodes = [...(regionBuckets.get(leftRegion) ?? [])].sort(
      (left, right) =>
        graph.getNodeAttribute(right, "importance") - graph.getNodeAttribute(left, "importance"),
    );
    const rightNodes = [...(regionBuckets.get(rightRegion) ?? [])].sort(
      (left, right) =>
        graph.getNodeAttribute(right, "importance") - graph.getNodeAttribute(left, "importance"),
    );

    if (leftNodes.length === 0 || rightNodes.length === 0) return;
    const leftTheme = getGraphWorkspaceRegionTheme(leftRegion, "navigation");
    const rightTheme = getGraphWorkspaceRegionTheme(rightRegion, "navigation");

    for (let index = 0; index < bridgeCount; index += 1) {
      const leftId = leftNodes[Math.min(index, leftNodes.length - 1)];
      const rightId = rightNodes[Math.min(index, rightNodes.length - 1)];
      const bridgeColor =
        index === 0
          ? withAlpha(leftTheme.edgeColor, 0.28)
          : index % 2 === 0
          ? withAlpha(leftTheme.edgeColor, 0.16)
          : withAlpha(rightTheme.edgeColor, 0.16);

      addBridgeRoute(
        leftId,
        rightId,
        leftRegion,
        rightRegion,
        index,
        bridgeColor,
        index === 0 ? 1.6 : 1.05,
        index === 0 ? 0.62 : 0.48,
      );

      if (index === 0 && leftNodes[index + 1]) {
        addBridgeRoute(
          leftNodes[index + 1],
          rightId,
          leftRegion,
          rightRegion,
          index + 1,
          withAlpha(rightTheme.edgeColor, 0.12),
          0.94,
          0.42,
        );
      }
    }
  });
}

function applyNavigationEdgeGeometry(graph: Graph<RenderNodeAttributes>): void {
  graph.forEachEdge((edge, attributes) => {
    const [source, target] = graph.extremities(edge);
    const sourceRegion = String(attributes.sourceRegion ?? graph.getNodeAttribute(source, "layoutRegion"));
    const targetRegion = String(attributes.targetRegion ?? graph.getNodeAttribute(target, "layoutRegion"));
    const sourcePoint = {
      x: Number(graph.getNodeAttribute(source, "x")),
      y: Number(graph.getNodeAttribute(source, "y")),
    };
    const targetPoint = {
      x: Number(graph.getNodeAttribute(target, "x")),
      y: Number(graph.getNodeAttribute(target, "y")),
    };
    const sameRegion = sourceRegion === targetRegion;
    const isSupport = Boolean(attributes.support);
    const isBridge = Boolean(attributes.bridge);
    const routeIndex = clampNumber(Number(attributes.routeIndex ?? 0), 0, 8);
    const sourceHub = Boolean(graph.getNodeAttribute(source, "navigationHub"));
    const targetHub = Boolean(graph.getNodeAttribute(target, "navigationHub"));
    const channelIndex = sameRegion
      ? isSupport
        ? routeIndex
        : sourceHub || targetHub
        ? 1
        : 0
      : 0;

    const curvature = sameRegion
      ? computeNavigationLocalCurvatureFromGeometry(
          sourcePoint,
          targetPoint,
          sourceRegion,
          channelIndex,
        )
      : (() => {
          const [leftRegion, rightRegion] =
            sourceRegion.localeCompare(targetRegion) <= 0
              ? [sourceRegion, targetRegion]
              : [targetRegion, sourceRegion];
          const bundleIndex = isSupport
            ? routeIndex
            : isBridge
            ? clampNumber(
                Math.round(((sourcePoint.y + targetPoint.y) / 2 + 220) / 88),
                0,
                2,
              )
            : clampNumber(
                Math.round(((sourcePoint.y + targetPoint.y) / 2 + 220) / 108),
                0,
                2,
              );
          const channelCurvature = computeNavigationBridgeCurvature(
            leftRegion,
            rightRegion,
            bundleIndex,
            isBridge ? 8 : 4,
          );
          return sourceRegion === leftRegion ? channelCurvature : -channelCurvature;
        })();

    graph.mergeEdgeAttributes(edge, {
      curvature,
      sourceRegion,
      targetRegion,
      type: EDGE_CURVE_PROGRAM ? "curve" : "line",
    });
  });
}

function buildRenderableGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  graphLens: GraphLens,
): Graph<RenderNodeAttributes> {
  const preset = getGraphWorkspacePreset(graphLens);
  const graph = new Graph<RenderNodeAttributes>({ multi: false, type: "undirected" });
  const layoutNodes = nodes.map((node) => ({
    ...node,
    layoutCluster:
      graphLens === "navigation"
        ? resolveNavigationPresentationRegion(node)
        : getSemanticLayoutRegion(node, preset),
  }));
  const layoutPositions = computeSemanticGraphLayout(layoutNodes, edges, { preset });

  for (const node of nodes) {
    const layoutRegion =
      graphLens === "navigation"
        ? resolveNavigationPresentationRegion(node)
        : getSemanticLayoutRegion(node, preset);
    const theme = getGraphWorkspaceRegionTheme(layoutRegion, graphLens);
    const adjustedPosition = adjustRenderablePosition(
      layoutPositions[node.id] ?? { x: 0, y: 0 },
      layoutRegion,
      graphLens,
    );
    const nodeSize = computeNodeSize(node);
    graph.addNode(node.id, {
      color: theme.color,
      edgeColor: theme.edgeColor,
      label: deriveDisplayLabel(node),
      layoutRegion,
      searchText: [
        node.id,
        node.title,
        node.repo,
        node.type,
        node.category,
        ...node.tags,
      ]
        .join(" ")
        .toLowerCase(),
      size:
        graphLens === "navigation"
          ? Math.max(5.6, Math.min(12.8, nodeSize * 0.74))
          : nodeSize,
      forceLabel: shouldForceLabel(node),
      importance: computeImportance(node),
      x: adjustedPosition.x,
      y: adjustedPosition.y,
      navigationHub: false,
      navigationHubRank: -1,
    });
  }

  for (const edge of edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    if (graph.hasEdge(edge.source, edge.target)) continue;

    const sourceRegion = graph.getNodeAttribute(edge.source, "layoutRegion");
    const targetRegion = graph.getNodeAttribute(edge.target, "layoutRegion");
    const theme = getGraphWorkspaceRegionTheme(sourceRegion, graphLens);
    const isCrossRegion = sourceRegion !== targetRegion;
    const color =
      graphLens === "navigation"
        ? resolveSemanticEdgeColor(
            edge.authority,
            isCrossRegion,
            theme.edgeColor || DEFAULT_EDGE_COLOR,
          )
        : edge.authority === "CONTRADICTS"
        ? "rgba(240, 84, 135, 0.34)"
        : edge.authority === "VERIFIES"
        ? "rgba(80, 195, 139, 0.28)"
        : theme.edgeColor || DEFAULT_EDGE_COLOR;

    graph.addEdge(edge.source, edge.target, {
      color,
      size:
        graphLens === "navigation"
          ? isCrossRegion
            ? edge.authority === "CONTRADICTS"
              ? 0.88
              : edge.authority === "VERIFIES"
              ? 0.8
              : 0.56
            : edge.authority === "CONTRADICTS"
            ? 1.04
            : edge.authority === "VERIFIES"
            ? 0.94
            : 0.72
          : edge.authority === "CONTRADICTS"
          ? 1.4
          : edge.authority === "VERIFIES"
          ? 1.2
          : 1.05,
      type: graphLens === "navigation" ? "line" : EDGE_CURVE_PROGRAM ? "curve" : "line",
      curvature: undefined,
      weight:
        sourceRegion === targetRegion
          ? 3.8
          : edge.authority === "CONTRADICTS"
          ? 2.2
          : edge.authority === "VERIFIES"
          ? 2.8
          : 1.9,
      authority: edge.authority,
      sourceRegion,
      targetRegion,
      crossRegion: isCrossRegion,
    });
  }

  if (graphLens === "navigation") {
    applyNavigationPresentationLayout(graph);
    addNavigationSupportEdges(graph);
  }

  return graph;
}

const GraphCanvas = forwardRef<GraphCanvasImperativeHandle, GraphCanvasProps>(
  function GraphCanvas(
    {
      nodes,
      edges,
      graphLens = "navigation",
      searchQuery,
      selectedNodeId,
      onNodeClick,
      onCameraUpdate,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sigmaRef = useRef<SigmaRenderer | null>(null);
    const graphRef = useRef<Graph<RenderNodeAttributes> | null>(null);
    const hoveredNodeIdRef = useRef<string | null>(null);
    const hoveredNeighborIdsRef = useRef<Set<string>>(new Set());
    const searchQueryRef = useRef(searchQuery);
    const selectedNodeIdRef = useRef(selectedNodeId);
    const selectedNeighborIdsRef = useRef<Set<string>>(new Set());
    const cameraRatioRef = useRef(1);
    const [regionLabels, setRegionLabels] = useState<RegionLabel[]>([]);
    const [navigationOverlayPaths, setNavigationOverlayPaths] = useState<NavigationOverlayPath[]>([]);
    const regionThemes = useMemo(() => getGraphWorkspaceRegions(graphLens), [graphLens]);

    useEffect(() => {
      searchQueryRef.current = searchQuery;
      sigmaRef.current?.refresh();
    }, [searchQuery]);

    useEffect(() => {
      selectedNodeIdRef.current = selectedNodeId;
      const graph = graphRef.current;
        if (!graph || !selectedNodeId || !graph.hasNode(selectedNodeId)) {
        selectedNeighborIdsRef.current = new Set();
        sigmaRef.current?.refresh();
        return;
      }

      selectedNeighborIdsRef.current = new Set(graph.neighbors(selectedNodeId));
      sigmaRef.current?.refresh();
    }, [selectedNodeId]);

    const updateRegionLabels = useCallback(() => {
      const renderer = sigmaRef.current;
      const graph = graphRef.current;
      if (!renderer || !graph) return;
      if (graphLens === "navigation") {
        setRegionLabels([]);
        return;
      }

      const preset = getGraphWorkspacePreset(graphLens);
      const regionSpecs = getSemanticLayoutRegionSpecs(preset);
      const nextLabels = Object.entries(regionSpecs).flatMap(([region, spec]) => {
        const regionNodes = graph
          .nodes()
          .filter((nodeId) => graph.getNodeAttribute(nodeId, "layoutRegion") === region);

        if (regionNodes.length === 0) return [];

        const centroid = regionNodes.reduce(
          (acc, nodeId) => {
            acc.x += graph.getNodeAttribute(nodeId, "x") / regionNodes.length;
            acc.y += graph.getNodeAttribute(nodeId, "y") / regionNodes.length;
            return acc;
          },
          { x: 0, y: 0 },
        );

        const position = renderer.graphToViewport({
          x: centroid.x,
          y: centroid.y + spec.labelOffset.y * 0.28,
        });

        if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return [];
        return [
          {
            region,
            label: spec.label,
            left: position.x,
            top: position.y,
            color: getGraphWorkspaceRegionTheme(region, graphLens).color,
          },
        ];
      });

      setRegionLabels(nextLabels);
    }, [graphLens]);

    const updateNavigationOverlay = useCallback(() => {
      setNavigationOverlayPaths([]);
      return;
      /*
      const renderer = sigmaRef.current;
      const graph = graphRef.current;
      const query = searchQueryRef.current.trim().toLowerCase();
      const focusNode = selectedNodeIdRef.current ?? hoveredNodeIdRef.current;

      if (!renderer || !graph || graphLens !== "navigation" || query || focusNode) {
        setNavigationOverlayPaths([]);
        return;
      }

      const graphPointToViewport = (point: { x: number; y: number }): { x: number; y: number } | null => {
        const viewportPoint = renderer.graphToViewport(point);
        if (!Number.isFinite(viewportPoint.x) || !Number.isFinite(viewportPoint.y)) return null;
        return viewportPoint;
      };
      const toViewportPoint = (nodeId: string): { x: number; y: number } | null => {
        if (!graph.hasNode(nodeId)) return null;
        return graphPointToViewport({
          x: Number(graph.getNodeAttribute(nodeId, "x")),
          y: Number(graph.getNodeAttribute(nodeId, "y")),
        });
      };
      const toGraphPoint = (nodeId: string): { x: number; y: number } | null => {
        if (!graph.hasNode(nodeId)) return null;
        return {
          x: Number(graph.getNodeAttribute(nodeId, "x")),
          y: Number(graph.getNodeAttribute(nodeId, "y")),
        };
      };
      const createStrokePair = (
        d: string,
        color: string,
        width: number,
        glowWidth: number,
        opacity = 0.95,
      ): NavigationOverlayPath[] => [
        {
          d,
          color: withPathAlpha(color, 0.18),
          width: glowWidth,
          opacity: 0.4,
        },
        {
          d,
          color: withPathAlpha(color, 0.76),
          width,
          opacity,
        },
      ];
      const regionNodes = new Map<string, string[]>();

      graph.forEachNode((nodeId, attributes) => {
        if (attributes.routeGuide) return;
        const region = String(attributes.layoutRegion ?? "");
        if (!NAVIGATION_CLUSTER_SPECS[region]) return;
        const bucket = regionNodes.get(region);
        if (bucket) {
          bucket.push(nodeId);
        } else {
          regionNodes.set(region, [nodeId]);
        }
      });

      const overlayPaths: NavigationOverlayPath[] = [];
      const regionSummaries = new Map<
        string,
        {
          themeColor: string;
          hubs: string[];
          primaryHub: string | null;
          hubGraphPoints: Map<string, { x: number; y: number }>;
        }
      >();

      for (const region of Object.keys(NAVIGATION_CLUSTER_SPECS)) {
        const bucket = regionNodes.get(region) ?? [];
        if (!bucket.length) continue;

        const ranked = [...bucket].sort(
          (left, right) =>
            graph.getNodeAttribute(right, "importance") - graph.getNodeAttribute(left, "importance"),
        );
        const hubIds = ranked
          .filter((nodeId) => Boolean(graph.getNodeAttribute(nodeId, "navigationHub")))
          .slice(0, NAVIGATION_OVERVIEW_HUB_LIMITS[region] ?? 3);
        const hubs =
          hubIds.length > 0
            ? hubIds
            : ranked.slice(0, NAVIGATION_OVERVIEW_HUB_LIMITS[region] ?? 3);
        const primaryHub = hubs[0] ?? null;
        const themeColor = String(
          (primaryHub ? graph.getNodeAttribute(primaryHub, "color") : null) ??
            getGraphWorkspaceRegionTheme(region, "navigation").color,
        );
        const hubGraphPoints = new Map<string, { x: number; y: number }>();
        const branchAnchors = new Map<string, { x: number; y: number }>();
        const regionCenter = NAVIGATION_CLUSTER_SPECS[region].center;

        hubs.forEach((nodeId) => {
          const point = toGraphPoint(nodeId);
          if (point) {
            hubGraphPoints.set(nodeId, point);
            branchAnchors.set(nodeId, {
              x: point.x * 0.76 + regionCenter.x * 0.24,
              y: point.y * 0.76 + regionCenter.y * 0.24,
            });
          }
        });

        if (primaryHub) {
          const primaryGraphPoint = hubGraphPoints.get(primaryHub);
          const primaryViewportPoint = toViewportPoint(primaryHub);

          hubs.slice(1).forEach((hubId, hubIndex) => {
            const hubViewportPoint = toViewportPoint(hubId);
            if (!primaryViewportPoint || !hubViewportPoint) return;

            const branchAnchor = branchAnchors.get(hubId);
            const branchViewportPoint = branchAnchor
              ? graphPointToViewport(branchAnchor)
              : null;
            const path =
              branchViewportPoint && primaryGraphPoint
                ? buildPolylinePath([
                    hubViewportPoint,
                    branchViewportPoint,
                    primaryViewportPoint,
                  ])
                : buildQuadraticPath(
                    primaryViewportPoint,
                    hubViewportPoint,
                    0.1 + hubIndex * 0.03,
                  );
            overlayPaths.push(
              ...createStrokePair(path, themeColor, 1.24, 2.08, 0.96),
            );
          });

          const twigLimit = NAVIGATION_OVERVIEW_TWIG_LIMITS[region] ?? 4;
          const visibleSatellites = ranked
            .filter((nodeId) => !hubs.includes(nodeId))
            .slice(0, twigLimit);
          const satellitesByHub = new Map<
            string,
            Array<{
              nodeId: string;
              index: number;
              graphPoint: { x: number; y: number };
              viewportPoint: { x: number; y: number };
            }>
          >();

          visibleSatellites.forEach((nodeId, satelliteIndex) => {
            const satelliteGraphPoint = toGraphPoint(nodeId);
            const satelliteViewportPoint = toViewportPoint(nodeId);
            if (!satelliteGraphPoint || !satelliteViewportPoint) return;

            const assignedHub = hubs.reduce<string | null>((best, hubId) => {
              const hubPoint = hubGraphPoints.get(hubId);
              if (!hubPoint) return best;
              if (!best) return hubId;
              const bestPoint = hubGraphPoints.get(best);
              if (!bestPoint) return hubId;
              const hubDistance = Math.hypot(
                satelliteGraphPoint.x - hubPoint.x,
                satelliteGraphPoint.y - hubPoint.y,
              );
              const bestDistance = Math.hypot(
                satelliteGraphPoint.x - bestPoint.x,
                satelliteGraphPoint.y - bestPoint.y,
              );
              return hubDistance < bestDistance ? hubId : best;
            }, primaryHub);

            if (!assignedHub) return;

            const bucket = satellitesByHub.get(assignedHub);
            const entry = {
              nodeId,
              index: satelliteIndex,
              graphPoint: satelliteGraphPoint,
              viewportPoint: satelliteViewportPoint,
            };
            if (bucket) {
              bucket.push(entry);
            } else {
              satellitesByHub.set(assignedHub, [entry]);
            }
          });

          satellitesByHub.forEach((satellites, assignedHub) => {
            const assignedHubViewportPoint = toViewportPoint(assignedHub);
            const assignedHubGraphPoint = hubGraphPoints.get(assignedHub);
            if (!assignedHubViewportPoint || !assignedHubGraphPoint) return;

            const sortedSatellites = [...satellites]
              .map((satellite) => ({
                ...satellite,
                angle: Math.atan2(
                  satellite.graphPoint.y - assignedHubGraphPoint.y,
                  satellite.graphPoint.x - assignedHubGraphPoint.x,
                ),
              }))
              .sort((left, right) => left.angle - right.angle);
            const bucketCount = clampNumber(
              Math.ceil(sortedSatellites.length / 4),
              1,
              assignedHub === primaryHub ? 3 : 2,
            );

            for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
              const start = Math.floor((bucketIndex * sortedSatellites.length) / bucketCount);
              const end = Math.floor(((bucketIndex + 1) * sortedSatellites.length) / bucketCount);
              const branchSatellites = sortedSatellites.slice(start, end);
              if (!branchSatellites.length) continue;

              const centroid = branchSatellites.reduce(
                (acc, satellite) => {
                  acc.x += satellite.graphPoint.x / branchSatellites.length;
                  acc.y += satellite.graphPoint.y / branchSatellites.length;
                  return acc;
                },
                { x: 0, y: 0 },
              );
              const directionX = centroid.x - assignedHubGraphPoint.x;
              const directionY = centroid.y - assignedHubGraphPoint.y;
              const directionDistance = Math.hypot(directionX, directionY) || 1;
              const normalX = -directionY / directionDistance;
              const normalY = directionX / directionDistance;
              const anchorOffset = (bucketIndex - (bucketCount - 1) / 2) * 2.6;
              const branchAnchor = {
                x:
                  assignedHubGraphPoint.x * 0.58 +
                  centroid.x * 0.42 +
                  normalX * anchorOffset,
                y:
                  assignedHubGraphPoint.y * 0.58 +
                  centroid.y * 0.42 +
                  normalY * anchorOffset,
              };
              const branchViewportPoint = graphPointToViewport(branchAnchor);

              if (branchViewportPoint) {
                overlayPaths.push(
                  ...createStrokePair(
                    buildPolylinePath([assignedHubViewportPoint, branchViewportPoint]),
                    themeColor,
                    0.92,
                    1.52,
                    0.8,
                  ),
                );
              }

              branchSatellites.forEach((satellite, branchIndex) => {
                overlayPaths.push({
                  d:
                    branchViewportPoint
                      ? buildQuadraticPath(
                          satellite.viewportPoint,
                          branchViewportPoint,
                          0.04 + branchIndex * 0.01,
                        )
                      : buildQuadraticPath(
                          satellite.viewportPoint,
                          assignedHubViewportPoint,
                          0.07 + ((stableHash(`${region}:${satellite.nodeId}`) % 5) - 2) * 0.018,
                        ),
                  color: withPathAlpha(themeColor, satellite.index < 3 ? 0.52 : 0.4),
                  width: satellite.index < 3 ? 1.02 : 0.78,
                  opacity: satellite.index < 3 ? 0.9 : 0.7,
                });
              });
            }
          });

          if (primaryGraphPoint) {
            regionSummaries.set(region, {
              themeColor,
              hubs,
              primaryHub,
              hubGraphPoints,
            });
          }
        }
      }

      NAVIGATION_OVERVIEW_TRUNKS.forEach((trunk) => {
        const sourceSummary = regionSummaries.get(trunk.from);
        const targetSummary = regionSummaries.get(trunk.to);
        if (!sourceSummary || !targetSummary || !sourceSummary.hubs.length || !targetSummary.hubs.length) {
          return;
        }

        const routeKey = getBridgeRouteKey(trunk.from, trunk.to);
        const corridor = NAVIGATION_BRIDGE_CORRIDORS[routeKey];
        const targetAnchor =
          corridor?.points?.[0] ?? NAVIGATION_CLUSTER_SPECS[trunk.to]?.center ?? { x: 0, y: 0 };
        const sourceAnchor =
          corridor?.points?.[corridor.points.length - 1] ??
          NAVIGATION_CLUSTER_SPECS[trunk.from]?.center ??
          { x: 0, y: 0 };
        const pickPortHub = (
          summary: {
            hubs: string[];
            hubGraphPoints: Map<string, { x: number; y: number }>;
            primaryHub: string | null;
          },
          anchor: { x: number; y: number },
        ): string | null => {
          return summary.hubs.reduce<string | null>((best, hubId) => {
            const hubPoint = summary.hubGraphPoints.get(hubId);
            if (!hubPoint) return best;
            if (!best) return hubId;
            const bestPoint = summary.hubGraphPoints.get(best);
            if (!bestPoint) return hubId;
            const hubDistance = Math.hypot(hubPoint.x - anchor.x, hubPoint.y - anchor.y);
            const bestDistance = Math.hypot(bestPoint.x - anchor.x, bestPoint.y - anchor.y);
            return hubDistance < bestDistance ? hubId : best;
          }, summary.primaryHub);
        };
        const sourcePortHub = pickPortHub(sourceSummary, targetAnchor);
        const targetPortHub = pickPortHub(targetSummary, sourceAnchor);
        if (!sourcePortHub || !targetPortHub) return;

        const sortHubsByAnchorDistance = (
          summary: {
            hubs: string[];
            hubGraphPoints: Map<string, { x: number; y: number }>;
            primaryHub: string | null;
          },
          anchor: { x: number; y: number },
          preferredHub: string,
        ): string[] => {
          const candidates = Array.from(
            new Set([preferredHub, ...summary.hubs, summary.primaryHub].filter(Boolean) as string[]),
          );
          return candidates.sort((left, right) => {
            const leftPoint = summary.hubGraphPoints.get(left);
            const rightPoint = summary.hubGraphPoints.get(right);
            if (!leftPoint || !rightPoint) return 0;
            const leftDistance = Math.hypot(leftPoint.x - anchor.x, leftPoint.y - anchor.y);
            const rightDistance = Math.hypot(rightPoint.x - anchor.x, rightPoint.y - anchor.y);
            return leftDistance - rightDistance;
          });
        };
        const sourceHubs = sortHubsByAnchorDistance(sourceSummary, targetAnchor, sourcePortHub);
        const targetHubs = sortHubsByAnchorDistance(targetSummary, sourceAnchor, targetPortHub);

        for (let laneIndex = 0; laneIndex < trunk.lanes; laneIndex += 1) {
          const sourceHub =
            sourceHubs[Math.min(laneIndex, sourceHubs.length - 1)] ?? sourcePortHub;
          const targetHub =
            targetHubs[Math.min(laneIndex, targetHubs.length - 1)] ?? targetPortHub;
          const sourceHubPoint = toGraphPoint(sourceHub);
          const targetHubPoint = toGraphPoint(targetHub);
          if (!sourceHubPoint || !targetHubPoint) continue;

          const laneFactor =
            (NAVIGATION_BRIDGE_LANE_PATTERN[laneIndex % NAVIGATION_BRIDGE_LANE_PATTERN.length] ?? 0) *
            0.72;
          const adjustedCorridor = (corridor?.points ?? []).map((point, pointIndex, points) => {
            const previousPoint = pointIndex === 0 ? sourceHubPoint : points[pointIndex - 1];
            const nextPoint =
              pointIndex === points.length - 1 ? targetHubPoint : points[pointIndex + 1];
            const dx = nextPoint.x - previousPoint.x;
            const dy = nextPoint.y - previousPoint.y;
            const distance = Math.hypot(dx, dy) || 1;
            const normalX = -dy / distance;
            const normalY = dx / distance;
            const spread = (corridor?.laneSpread ?? 10) * 0.52;
            return {
              x: point.x + normalX * laneFactor * spread,
              y: point.y + normalY * laneFactor * spread,
            };
          });

          const graphPoints = [
            sourceHubPoint,
            ...adjustedCorridor,
            targetHubPoint,
          ];
          const viewportPoints = graphPoints.flatMap((point) => {
            const viewportPoint = graphPointToViewport(point);
            return viewportPoint ? [viewportPoint] : [];
          });
          if (viewportPoints.length < 2) continue;

          const path = buildPolylinePath(viewportPoints);
          const laneWidth = clampNumber(trunk.width - laneIndex * 0.12, 0.82, trunk.width);
          const laneGlow = clampNumber(trunk.glow - laneIndex * 0.14, 1.48, trunk.glow);
          overlayPaths.push(
            ...createStrokePair(
              path,
              sourceSummary.themeColor,
              laneWidth,
              laneGlow,
              laneIndex === 0 ? 0.98 : 0.86,
            ),
          );
        }
      });

      setNavigationOverlayPaths(overlayPaths);
      */
    }, [graphLens]);

    useEffect(() => {
      updateNavigationOverlay();
    }, [graphLens, searchQuery, selectedNodeId, updateNavigationOverlay]);

    const fitVisible = useCallback(() => {
      const renderer = sigmaRef.current;
      const graph = graphRef.current;
      const container = containerRef.current;
      if (!renderer || !graph || !container) return;

      const query = searchQueryRef.current.trim().toLowerCase();
      let focusIds = graph.nodes();

      if (selectedNodeIdRef.current && graph.hasNode(selectedNodeIdRef.current)) {
        const selected = selectedNodeIdRef.current;
        focusIds = [
          selected,
          ...Array.from(selectedNeighborIdsRef.current).slice(0, 14),
        ];
      } else if (query) {
        const matches = graph
          .nodes()
          .filter((nodeId) => graph.getNodeAttribute(nodeId, "searchText").includes(query));
        if (matches.length > 0) focusIds = matches;
      }

      const displayPoints = focusIds.flatMap((nodeId) => {
        const point = renderer.getNodeDisplayData(nodeId);
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return [];
        return [
          {
            // Sigma node display data is already normalized into graph display space.
            x: point.x,
            y: point.y,
          },
        ];
      });

      const fit = computeCameraFitFromDisplayPoints(displayPoints, {
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        paddingFactor:
          query || selectedNodeIdRef.current
            ? 0.7
            : graphLens === "navigation"
            ? 0.82
            : 0.86,
        trimPercentile: graphLens === "navigation" ? 0.02 : 0.01,
        minDisplayExtent: 0.16,
      });

      if (!fit) return;

      const camera = renderer.getCamera() as any;
      const previousState = camera.getState ? camera.getState() : camera;
      camera.setState({
        x: fit.x,
        y: fit.y,
        ratio: fit.ratio,
        angle: previousState.angle ?? 0,
      });

      renderer.refresh();
      updateRegionLabels();
      updateNavigationOverlay();
      onCameraUpdate(fit.ratio);
    }, [onCameraUpdate, updateNavigationOverlay, updateRegionLabels]);

    const zoomIn = useCallback(() => {
      const renderer = sigmaRef.current;
      if (!renderer) return;
      const camera = renderer.getCamera() as any;
      const current = camera.getState ? camera.getState() : camera;
      camera.setState({ ...current, ratio: Math.max(0.18, current.ratio * 0.82) });
      renderer.refresh();
      updateRegionLabels();
      updateNavigationOverlay();
      onCameraUpdate(Math.max(0.18, current.ratio * 0.82));
    }, [onCameraUpdate, updateNavigationOverlay, updateRegionLabels]);

    const zoomOut = useCallback(() => {
      const renderer = sigmaRef.current;
      if (!renderer) return;
      const camera = renderer.getCamera() as any;
      const current = camera.getState ? camera.getState() : camera;
      camera.setState({ ...current, ratio: Math.min(4.2, current.ratio * 1.18) });
      renderer.refresh();
      updateRegionLabels();
      updateNavigationOverlay();
      onCameraUpdate(Math.min(4.2, current.ratio * 1.18));
    }, [onCameraUpdate, updateNavigationOverlay, updateRegionLabels]);

    useImperativeHandle(
      ref,
      () => ({
        fitVisible,
        zoomIn,
        zoomOut,
      }),
      [fitVisible, zoomIn, zoomOut],
    );

    useEffect(() => {
      if (!isWebglAvailable()) return;
      if (!containerRef.current) return;

      const renderGraph = buildRenderableGraph(nodes, edges, graphLens);
      const renderer = new Sigma(renderGraph, containerRef.current, {
        renderLabels: true,
        renderEdgeLabels: false,
        labelFont: "DM Sans",
        labelSize: 11.5,
        labelWeight: "500",
        labelColor: { color: "#D9DCE7" },
        labelDensity: 1.35,
        labelGridCellSize: 120,
        labelRenderedSizeThreshold: 5,
        defaultEdgeColor: DEFAULT_EDGE_COLOR,
        edgeProgramClasses: EDGE_CURVE_PROGRAM ? { curve: EDGE_CURVE_PROGRAM } : {},
        minCameraRatio: 0.18,
        maxCameraRatio: 4.2,
        stagePadding: 18,
        zIndex: true,
        nodeReducer: (node, data) => {
          const attributes = data as RenderNodeAttributes & Record<string, unknown>;
          const next = { ...attributes } as Record<string, unknown>;
          const query = searchQueryRef.current.trim().toLowerCase();
          const selected = selectedNodeIdRef.current;
          const hovered = hoveredNodeIdRef.current;
          const focusNode = selected ?? hovered;
          const selectedNeighbors = selectedNeighborIdsRef.current;
          const hoveredNeighbors = hoveredNeighborIdsRef.current;
          const focusNeighbors = selected ? selectedNeighbors : hoveredNeighbors;
          const isHub = Boolean(attributes.navigationHub);
          const hubRank = Number(attributes.navigationHubRank ?? -1);
          const isRouteGuide = Boolean(attributes.routeGuide);
          const cameraRatio = cameraRatioRef.current;
          const searchMatched = query ? attributes.searchText.includes(query) : false;
          const isSelected = selected === node;
          const isNeighbor = focusNode ? focusNeighbors.has(node) : false;
          const isHovered = hovered === node;

          next.label = "";
          next.zIndex = attributes.importance;

          if (isRouteGuide) {
            next.label = "";
            next.color = "rgba(0, 0, 0, 0)";
            next.size = 0.01;
            next.zIndex = -1;
            return next;
          }

          if (query && !searchMatched && !isSelected) {
            next.color = DIM_NODE_COLOR;
            next.label = "";
            next.size = Math.max(3.4, attributes.size * 0.72);
            return next;
          }

          if (focusNode && !isSelected && !isHovered && !isNeighbor) {
            next.color = DIM_NODE_COLOR;
            next.label = "";
            next.size = Math.max(3, attributes.size * 0.7);
            return next;
          }

          if (isSelected) {
            next.color = SELECTED_COLOR;
            next.label = attributes.label;
            next.highlighted = true;
            next.size = attributes.size * 1.22;
            next.zIndex = attributes.importance + 100;
            return next;
          }

          if (isHovered) {
            next.color = HOVER_RING_COLOR;
            next.label = attributes.label;
            next.highlighted = true;
            next.size = attributes.size * 1.12;
            next.zIndex = attributes.importance + 40;
            return next;
          }

          if (searchMatched) {
            next.color = MATCH_COLOR;
            next.label = attributes.label;
            next.highlighted = true;
            next.size = attributes.size * 1.08;
            next.zIndex = attributes.importance + 24;
            return next;
          }

          if (isNeighbor) {
            next.label = attributes.label;
            next.zIndex = attributes.importance + 12;
            next.size = attributes.size * 1.04;
            return next;
          }

          if (graphLens === "navigation") {
            if (isHub) {
              next.label = attributes.label;
              next.zIndex = attributes.importance + 8 - Math.max(0, hubRank);
              return next;
            }

            if (cameraRatio <= 1.02 && attributes.importance >= 94) {
              next.label = attributes.label;
              next.zIndex = attributes.importance + 4;
              return next;
            }

            if (cameraRatio <= 0.72 && attributes.importance >= 80) {
              next.label = attributes.label;
              next.zIndex = attributes.importance + 3;
              return next;
            }

            if (cameraRatio <= 0.48 && attributes.importance >= 66) {
              next.label = attributes.label;
              next.zIndex = attributes.importance + 3;
              return next;
            }

            next.label = "";
            return next;
          }

          if (attributes.forceLabel || query) {
            next.label = attributes.label;
          }

          return next;
        },
        edgeReducer: (edge, data) => {
          const next = { ...(data as Record<string, unknown>) };
          const [source, target] = renderGraph.extremities(edge);
          const query = searchQueryRef.current.trim().toLowerCase();
          const selected = selectedNodeIdRef.current;
          const hovered = hoveredNodeIdRef.current;
          const focusNode = selected ?? hovered;
          const searchSource = renderGraph.getNodeAttribute(source, "searchText");
          const searchTarget = renderGraph.getNodeAttribute(target, "searchText");
          const matchesQuery = query
            ? searchSource.includes(query) || searchTarget.includes(query)
            : false;
          const touchesFocus = focusNode
            ? source === focusNode || target === focusNode
            : false;

          if (focusNode && !touchesFocus) {
            next.color = DIM_EDGE_COLOR;
            next.size = 0.16;
            return next;
          }

          if (query && !matchesQuery) {
            next.color = DIM_EDGE_COLOR;
            next.size = 0.45;
            return next;
          }

          if (touchesFocus) {
            next.color = "rgba(255, 255, 255, 0.28)";
            next.size = 1.3;
            next.zIndex = 32;
            return next;
          }

          if (matchesQuery) {
            next.color = "rgba(247, 240, 181, 0.22)";
            next.size = 1.15;
            next.zIndex = 24;
            return next;
          }

          if (graphLens === "navigation") {
            const isCrossRegion = Boolean(next.crossRegion);
            const authority = String(next.authority ?? "");
            next.color = withAlpha(
              String(next.color ?? DEFAULT_EDGE_COLOR),
              isCrossRegion
                ? authority === "CONTRADICTS"
                  ? 0.34
                  : authority === "VERIFIES"
                  ? 0.3
                  : 0.22
                : authority === "CONTRADICTS"
                ? 0.48
                : authority === "VERIFIES"
                ? 0.4
                : 0.28,
            );
            next.size = Math.max(Number(next.size ?? 0.45), isCrossRegion ? 0.42 : 0.56);
            next.zIndex = isCrossRegion ? 6 : 8;
            return next;
          }

          return next;
        },
      });

      graphRef.current = renderGraph;
      sigmaRef.current = renderer;

      const camera = renderer.getCamera() as any;
      const handleCameraUpdate = () => {
        const state = camera.getState ? camera.getState() : camera;
        cameraRatioRef.current = state.ratio ?? 1;
        onCameraUpdate(state.ratio ?? 1);
        updateRegionLabels();
        updateNavigationOverlay();
      };

      const anyRenderer = renderer as any;
      anyRenderer.on("clickNode", ({ node }: { node: string }) => {
        onNodeClick(node);
      });
      anyRenderer.on("enterNode", ({ node }: { node: string }) => {
        hoveredNodeIdRef.current = node;
        hoveredNeighborIdsRef.current = new Set(renderGraph.neighbors(node));
        renderer.refresh();
      });
      anyRenderer.on("leaveNode", () => {
        hoveredNodeIdRef.current = null;
        hoveredNeighborIdsRef.current = new Set();
        renderer.refresh();
      });

      camera.on("updated", handleCameraUpdate);

      const resizeObserver = new ResizeObserver(() => {
        renderer.resize();
        fitVisible();
      });
      resizeObserver.observe(containerRef.current);

      const initialFit = () => {
        renderer.resize();
        renderer.refresh();
        requestAnimationFrame(() => {
          fitVisible();
          requestAnimationFrame(() => {
            fitVisible();
          });
        });
      };

      initialFit();

      return () => {
        resizeObserver.disconnect();
        camera.removeListener("updated", handleCameraUpdate);
        if (sigmaRef.current === renderer) sigmaRef.current = null;
        if (graphRef.current === renderGraph) graphRef.current = null;
        setRegionLabels([]);
        setNavigationOverlayPaths([]);
        renderer.kill();
      };
    }, [edges, fitVisible, graphLens, nodes, onCameraUpdate, onNodeClick, updateNavigationOverlay, updateRegionLabels]);

    if (!isWebglAvailable()) {
      return (
        <div
          className="flex h-full min-h-[520px] flex-col items-center justify-center gap-4 rounded-[18px] border border-white/10 bg-[#11141c] px-6 text-center"
          role="alert"
        >
          <div className="text-4xl text-[#8f95a8]" aria-hidden="true">
            ◌
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[#eef1f8]">WebGL Not Available</h2>
            <p className="max-w-md text-sm text-[#9ea5ba]">
              The rebuilt graph uses WebGL for the network view. Enable hardware acceleration
              or open the graph in a browser with WebGL support.
            </p>
          </div>
          <Link href="/library" className="text-sm font-medium text-[#4f8df7] underline">
            Browse the library instead
          </Link>
        </div>
      );
    }

    return (
      <div
        className="relative h-full w-full overflow-hidden rounded-[18px]"
        role="application"
        aria-label="Interactive nexus graph"
      >
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top, rgba(38,46,66,0.18), transparent 32%), linear-gradient(180deg, #0f1218 0%, #0b0e14 100%)",
          }}
        />

        {navigationOverlayPaths.length > 0 ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {navigationOverlayPaths.map((path, index) => (
              <path
                key={`${index}-${path.color}-${path.width}`}
                d={path.d}
                fill="none"
                stroke={path.color}
                strokeWidth={path.width}
                strokeOpacity={path.opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        ) : null}

        {regionLabels.map((item) => (
          <div
            key={item.region}
            className="pointer-events-none absolute rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] backdrop-blur-sm"
            style={{
              left: item.left,
              top: item.top,
              transform: "translate(-50%, -50%)",
              color: item.color,
              borderColor: `${item.color}55`,
              background: "rgba(7, 10, 16, 0.62)",
              boxShadow: `0 0 0 1px ${item.color}18`,
            }}
          >
            {item.label}
          </div>
        ))}

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-[14px] border border-white/8 bg-[rgba(9,12,19,0.76)] px-3 py-2 text-[#dfe3ef] backdrop-blur-sm">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8f95a8]">
            Clusters
          </div>
          <div className="flex flex-col gap-1.5 text-[11px]">
            {regionThemes.slice(0, 4).map((theme) => (
              <div key={theme.region} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: theme.color, boxShadow: `0 0 12px ${theme.glowColor}` }}
                />
                <span>{theme.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

export default GraphCanvas;

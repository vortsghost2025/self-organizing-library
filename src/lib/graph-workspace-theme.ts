import type { GraphLens } from "./graph-types";
import type { SemanticLayoutPreset } from "./semantic-graph-layout";

export interface GraphWorkspaceRegionTheme {
  region: string;
  label: string;
  color: string;
  edgeColor: string;
  glowColor: string;
}

const SYSTEMS_REGIONS: GraphWorkspaceRegionTheme[] = [
  {
    region: "sources",
    label: "Sources & Docs",
    color: "#4F8DF7",
    edgeColor: "rgba(79, 141, 247, 0.24)",
    glowColor: "rgba(79, 141, 247, 0.16)",
  },
  {
    region: "claims",
    label: "Claims & Papers",
    color: "#F4A646",
    edgeColor: "rgba(244, 166, 70, 0.24)",
    glowColor: "rgba(244, 166, 70, 0.16)",
  },
  {
    region: "governance",
    label: "Governance",
    color: "#50C38B",
    edgeColor: "rgba(80, 195, 139, 0.24)",
    glowColor: "rgba(80, 195, 139, 0.16)",
  },
  {
    region: "execution",
    label: "Execution",
    color: "#B285FF",
    edgeColor: "rgba(178, 133, 255, 0.24)",
    glowColor: "rgba(178, 133, 255, 0.16)",
  },
  {
    region: "external",
    label: "External",
    color: "#F56C6C",
    edgeColor: "rgba(245, 108, 108, 0.24)",
    glowColor: "rgba(245, 108, 108, 0.16)",
  },
  {
    region: "conflicts",
    label: "Conflicts",
    color: "#F05487",
    edgeColor: "rgba(240, 84, 135, 0.24)",
    glowColor: "rgba(240, 84, 135, 0.16)",
  },
];

const ARCHITECTURE_REGIONS: GraphWorkspaceRegionTheme[] = [
  {
    region: "archive",
    label: "Docs & Archive",
    color: "#4F8DF7",
    edgeColor: "rgba(79, 141, 247, 0.24)",
    glowColor: "rgba(79, 141, 247, 0.16)",
  },
  {
    region: "graph",
    label: "Graph Engine",
    color: "#F4A646",
    edgeColor: "rgba(244, 166, 70, 0.24)",
    glowColor: "rgba(244, 166, 70, 0.16)",
  },
  {
    region: "governance",
    label: "Governance Core",
    color: "#50C38B",
    edgeColor: "rgba(80, 195, 139, 0.24)",
    glowColor: "rgba(80, 195, 139, 0.16)",
  },
  {
    region: "runtime",
    label: "Automation",
    color: "#B285FF",
    edgeColor: "rgba(178, 133, 255, 0.24)",
    glowColor: "rgba(178, 133, 255, 0.16)",
  },
  {
    region: "experience",
    label: "Experience",
    color: "#55C9C2",
    edgeColor: "rgba(85, 201, 194, 0.24)",
    glowColor: "rgba(85, 201, 194, 0.16)",
  },
  {
    region: "conflicts",
    label: "Conflict & Drift",
    color: "#F05487",
    edgeColor: "rgba(240, 84, 135, 0.24)",
    glowColor: "rgba(240, 84, 135, 0.16)",
  },
];

export function getGraphWorkspacePreset(
  lens: GraphLens = "navigation",
): SemanticLayoutPreset {
  return lens === "navigation" ? "architecture" : "systems";
}

export function getGraphWorkspaceRegions(
  lens: GraphLens = "navigation",
): GraphWorkspaceRegionTheme[] {
  return getGraphWorkspacePreset(lens) === "architecture"
    ? ARCHITECTURE_REGIONS
    : SYSTEMS_REGIONS;
}

export function getGraphWorkspaceRegionTheme(
  region: string,
  lens: GraphLens = "navigation",
): GraphWorkspaceRegionTheme {
  return (
    getGraphWorkspaceRegions(lens).find((entry) => entry.region === region) ?? {
      region,
      label: region,
      color: "#A1A1AA",
      edgeColor: "rgba(161, 161, 170, 0.18)",
      glowColor: "rgba(161, 161, 170, 0.12)",
    }
  );
}

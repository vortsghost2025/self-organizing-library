export type AuthorityEdgeType =
  | "VERIFIES"
  | "DERIVES_FROM"
  | "CONTRADICTS"
  | "SIGNED_BY"
  | "EXECUTES"
  | "DEPENDS_ON";

export type NodeStatus = "UNVERIFIED" | "VERIFIED" | "CONFLICTED" | "QUARANTINED";

export type MeaningLayer = "structure" | "conflicts" | "verification" | "execution";

export type DensityLevel = "overview" | "mid" | "focus";

export interface GraphNode {
  id: string;
  title: string;
  type: string;
  category: string;
  repo: string;
  connectionCount: number;
  tags: string[];
  status: NodeStatus;
  verificationCount: number;
  contradictionCount: number;
  clusterIds: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  authority?: AuthorityEdgeType;
}

export interface Cluster {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  kind: "repo" | "tag";
  representativeId: string;
}

export interface EntryPoint {
  id: string;
  label: string;
  description: string;
  nodeIds: string[];
  icon: string;
  kind: "authority" | "contradictions" | "cluster" | "repo";
}

export const MEANING_LAYER_EDGES: Record<MeaningLayer, AuthorityEdgeType[]> = {
  structure: ["DERIVES_FROM", "DEPENDS_ON"],
  conflicts: ["CONTRADICTS"],
  verification: ["VERIFIES", "SIGNED_BY"],
  execution: ["EXECUTES"],
};

export const DEFAULT_LAYERS: MeaningLayer[] = ["structure", "verification"];

export const TYPE_COLORS: Record<string, string> = {
  doc: "#7C3AED",
  paper: "#06B6D4",
  code: "#10B981",
  data: "#F59E0B",
  config: "#EC4899",
  schema: "#8B5CF6",
  "test-data": "#F97316",
};

export const REPO_COLORS: Record<string, string> = {
  "self-organizing-library": "#7C3AED",
  "Archivist-Agent": "#06B6D4",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": "#10B981",
  "kernel-lane": "#F59E0B",
  federation: "#EC4899",
  FreeAgent: "#8B5CF6",
};

export const STATUS_COLORS: Record<NodeStatus, string> = {
  VERIFIED: "#22C55E",
  UNVERIFIED: "#6B7280",
  CONFLICTED: "#EF4444",
  QUARANTINED: "#A855F7",
};

export const AUTHORITY_EDGE_COLORS: Record<AuthorityEdgeType, string> = {
  VERIFIES: "#22C55E",
  DERIVES_FROM: "#3B82F6",
  CONTRADICTS: "#EF4444",
  SIGNED_BY: "#A855F7",
  EXECUTES: "#F59E0B",
  DEPENDS_ON: "#6B7280",
};

export const AUTHORITY_EDGE_SIZE: Record<AuthorityEdgeType, number> = {
  VERIFIES: 1.8,
  DERIVES_FROM: 1.2,
  CONTRADICTS: 1.5,
  SIGNED_BY: 1.8,
  EXECUTES: 1.4,
  DEPENDS_ON: 0.5,
};

export const LAYER_META: Record<MeaningLayer, { label: string; icon: string; color: string }> = {
  structure: { label: "Structure", icon: "\u25C7", color: "#3B82F6" },
  conflicts: { label: "Conflicts", icon: "\u26A0", color: "#EF4444" },
  verification: { label: "Verification", icon: "\u2713", color: "#22C55E" },
  execution: { label: "Execution", icon: "\u25B6", color: "#F59E0B" },
};

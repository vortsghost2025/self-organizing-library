export type AuthorityEdgeType =
  | "VERIFIES"
  | "DERIVES_FROM"
  | "CONTRADICTS"
  | "SIGNED_BY"
  | "EXECUTES"
  | "DEPENDS_ON";

export type NodeStatus = "UNVERIFIED" | "VERIFIED" | "CONFLICTED" | "QUARANTINED";

export type GovernanceLayer = "constitutional" | "operational" | "theoretical" | "historical" | "evidence" | "application_adjacent" | "unknown";

export type BridgeState = "enforced" | "verified" | "partial" | "documented_only" | "contradicted" | "obsolete" | "unknown";

export type ContradictionKind = "design_vs_runtime" | "schema_vs_behavior" | "claim_vs_evidence" | "theory_under_specified" | "stale_historical_claim" | "authority_mismatch" | "observability_boundary" | "implementation_gap" | "none";

export type MeaningLayer = "structure" | "conflicts" | "verification" | "execution" | "governance";

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
  governanceLayer: GovernanceLayer;
  authorityDepth: number;
  bridgeState: BridgeState;
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
  governance: ["VERIFIES", "SIGNED_BY", "CONTRADICTS", "DERIVES_FROM"],
};

export const DEFAULT_LAYERS: MeaningLayer[] = ["structure", "verification", "execution", "governance"];

export const TYPE_COLORS: Record<string, string> = {
  doc: "#7C3AED",
  paper: "#06B6D4",
  code: "#10B981",
  data: "#F59E0B",
  config: "#EC4899",
  schema: "#8B5CF6",
  "test-data": "#F97316",
};

export const NODE_SHAPE_MAP: Record<string, string> = {
  paper: "",
  doc: "border",
  code: "square",
  data: "square",
  config: "",
  schema: "square",
  "test-data": "",
};

export const NODE_BORDER_COLORS: Record<string, string> = {
  doc: "#ffffff",
};

export const SHAPE_LABELS: Record<string, string> = {
  "": "Circle",
  square: "Square",
  border: "Bordered Circle",
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
  UNVERIFIED: "#9CA3AF",
  CONFLICTED: "#EF4444",
  QUARANTINED: "#C084FC",
};

export const AUTHORITY_EDGE_COLORS: Record<AuthorityEdgeType, string> = {
  VERIFIES: "#22C55E",
  DERIVES_FROM: "#60A5FA",
  CONTRADICTS: "#EF4444",
  SIGNED_BY: "#C084FC",
  EXECUTES: "#F59E0B",
  DEPENDS_ON: "#9CA3AF",
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
  governance: { label: "Governance Depth", icon: "\u25C8", color: "#8B5CF6" },
};


export const GOVERNANCE_LAYER_COLORS: Record<GovernanceLayer, string> = {
  constitutional: "#7C3AED",
  operational: "#10B981",
  theoretical: "#06B6D4",
  historical: "#9CA3AF",
  evidence: "#22C55E",
  application_adjacent: "#8B5CF6",
  unknown: "#4B5563",
};

export const GOVERNANCE_LAYER_LABELS: Record<GovernanceLayer, string> = {
  constitutional: "Constitutional",
  operational: "Operational",
  theoretical: "Theoretical",
  historical: "Historical",
  evidence: "Evidence",
  application_adjacent: "Application Adjacent",
  unknown: "Unknown",
};

export const BRIDGE_STATE_COLORS: Record<BridgeState, string> = {
  enforced: "#22C55E",
  verified: "#60A5FA",
  partial: "#F59E0B",
  documented_only: "#9CA3AF",
  contradicted: "#EF4444",
  obsolete: "#6B7280",
  unknown: "#4B5563",
};

export const BRIDGE_STATE_LABELS: Record<BridgeState, string> = {
  enforced: "Enforced",
  verified: "Verified",
  partial: "Partial Bridge",
  documented_only: "Documented Only",
  contradicted: "Contradicted",
  obsolete: "Obsolete",
  unknown: "Unknown",
};

export type GraphMode = "understand" | "explore" | "full";
export type GraphLens = "navigation" | "authority" | "governance" | "papers" | "repos" | "full" | "canonical";

export const DEFAULT_MODE: GraphMode = "explore";
export const DEFAULT_LENS: GraphLens = "navigation";

export const LENS_CONFIG: Record<GraphLens, {
  label: string;
  description: string;
  advanced?: boolean;
}> = {
  navigation: {
    label: "Navigation Map",
    description: "Default map for people and agents: core archive, papers, and active issues.",
  },
  authority: {
    label: "Authority Map",
    description: "Explicit authority, verification, and bridge-state relationships.",
  },
  governance: {
    label: "Governance Map",
    description: "Governance rules, enforcement surfaces, and contradiction boundaries.",
  },
  papers: {
    label: "Paper Map",
    description: "Theory-to-implementation path from papers into the live system.",
  },
  repos: {
    label: "Repository Map",
    description: "High-signal view across the lane repositories.",
  },
  full: {
    label: "Full Explicit Graph",
    description: "All indexed nodes with explicit references only.",
    advanced: true,
  },
  canonical: {
    label: "Canonical Graph",
    description: "Offline-grade graph including tag-derived inference edges.",
    advanced: true,
  },
};

export const MODE_CONFIG: Record<GraphMode, {
  label: string;
  description: string;
  density: DensityLevel;
  layers: MeaningLayer[];
  showUnverified: boolean;
  showQuarantined: boolean;
  entryPointFilter?: (ep: EntryPoint) => boolean;
  highlightCoreNodes: boolean;
  groupEntryPoints: "start" | "investigate" | "advanced";
}> = {
  understand: {
    label: "Verified Core",
    description: "Human-friendly entry — verified cores only",
    density: "mid",
    layers: ["structure", "verification", "execution", "governance"],
    showUnverified: true,
    showQuarantined: true,
    highlightCoreNodes: true,
    groupEntryPoints: "start",
  },
  explore: {
    label: "Contradictions & Quarantine",
    description: "See how system detects and isolates problems",
    density: "mid",
    layers: ["structure", "verification", "conflicts", "execution", "governance"],
    showUnverified: true,
    showQuarantined: true,
    highlightCoreNodes: false,
    groupEntryPoints: "investigate",
  },
  full: {
    label: "Full Lens",
    description: "All statuses inside the current graph lens",
    density: "focus",
    layers: ["structure", "conflicts", "verification", "execution", "governance"],
    showUnverified: true,
    showQuarantined: true,
    highlightCoreNodes: false,
    groupEntryPoints: "advanced",
  },
};

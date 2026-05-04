export type AuthorityEdgeType =
  | "VERIFIES"
  | "DERIVES_FROM"
  | "CONTRADICTS"
  | "SIGNED_BY"
  | "EXECUTES"
  | "DEPENDS_ON";

export type NodeStatus =
  | "UNVERIFIED"
  | "VERIFIED"
  | "CONFLICTED"
  | "QUARANTINED";

export type GovernanceLayer =
  | "constitutional"
  | "operational"
  | "theoretical"
  | "historical"
  | "evidence"
  | "application_adjacent"
  | "unknown";

export type BridgeState =
  | "enforced"
  | "verified"
  | "partial"
  | "documented_only"
  | "contradicted"
  | "obsolete"
  | "unknown";

export interface AuthorityEdge {
  source: string;
  target: string;
  authority: AuthorityEdgeType;
}

export interface NodeStatusEntry {
  id: string;
  status: NodeStatus;
  verificationCount: number;
  contradictionCount: number;
  authorityEdges: AuthorityEdgeType[];
}

export interface GovernanceDepthEntry {
  id: string;
  governanceLayer: GovernanceLayer;
  authorityDepth: number;
  bridgeState: BridgeState;
}

const VERIFICATION_TAGS = new Set([
  "Verification",
  "Attestation",
  "Identity Enforcement",
  "Convergence Gate",
]);

const SIGNING_TAGS = new Set([
  "Attestation",
  "Identity Enforcement",
]);

const EXECUTION_TAGS = new Set([
  "Kernel",
  "Swarmmind",
  "Multi-Agent",
]);

const GOVERNANCE_TAGS = new Set([
  "Governance",
  "Constitutional AI",
  "Covenant",
  "Constraint Lattice",
]);

const CONTRADICTION_TAGS = new Set([
  "Failure Mode",
  "Drift",
]);

const DERIVATION_CATEGORIES = new Set([
  "verification",
  "attestation",
  "governance",
  "spec",
  "paper",
]);

const VERIFICATION_CATEGORIES = new Set([
  "verification",
  "attestation",
  "audit",
]);

const QUARANTINE_CATEGORIES = new Set([
  "scratch",
  "pending",
  "sensitive",
]);

const CODE_TYPES = new Set(["code", "config"]);

const LANE_REPOS = new Set([
  "self-organizing-library",
  "Archivist-Agent",
  "SwarmMind",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
  "kernel-lane",
]);

const GAME_CATEGORIES = new Set([
  "game",
  "uss-chaosbringer",
  "uss_chaosbringer",
]);

const FREEAGENT_SUBCATEGORY_MAP: Record<string, GovernanceLayer> = {
  "medical": "application_adjacent",
  "we4free": "application_adjacent",
  "we": "application_adjacent",
  "distributed": "operational",
  "infrastructure": "operational",
  "shared-infra": "operational",
  "connection-bridge": "operational",
  "ui": "application_adjacent",
  "data": "evidence",
  "docs": "theoretical",
  "agent": "operational",
  "coordination": "operational",
  "project": "operational",
  "game": "application_adjacent",
  "phase-6": "theoretical",
  "scratch": "historical",
  "config": "operational",
  "public_html": "application_adjacent",
  "log": "historical",
  "script": "operational",
  "orchestrator": "operational",
};

const CONSTITUTIONAL_CATEGORIES = new Set([
  "governance",
  "verification",
  "attestation",
  "spec",
]);

const OPERATIONAL_CATEGORIES = new Set([
  "code",
  "scripts",
  "config",
]);

const THEORETICAL_TAGS = new Set([
  "Rosetta Stone",
  "CAISC",
  "Constraint Lattice",
  "paper",
]);

const EVIDENCE_CATEGORIES = new Set([
  "verification",
  "audit",
  "test-data",
]);

const HISTORICAL_CATEGORIES = new Set([
  "scratch",
  "pending",
]);

const REPO_AUTHORITY_DEPTH: Record<string, number> = {
  "Archivist-Agent": 95,
  "self-organizing-library": 90,
  "SwarmMind": 80,
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": 80,
  "kernel-lane": 75,
  "federation": 50,
  "FreeAgent": 40,
  "Deliberate-AI-Ensemble": 60,
  "storytime": 30,
  "papers": 70,
};

interface Entry {
  id: string;
  repo: string;
  category: string;
  content_type: string;
  tags: string[];
  date: string | null;
}

interface CrossRef {
  source: string;
  target: string;
  type: string;
  label: string;
}

function hasAnyTag(tags: string[], tagSet: Set<string>): boolean {
  return tags.some((t) => tagSet.has(t));
}

export function computeAuthorityEdges(
  entries: Entry[],
  crossRefs: CrossRef[],
  tagIndex: Record<string, string[]>
): AuthorityEdge[] {
  const entryMap = new Map<string, Entry>();
  for (const e of entries) entryMap.set(e.id, e);

  const edges: AuthorityEdge[] = [];
  const seen = new Set<string>();

  const addEdge = (
    source: string,
    target: string,
    authority: AuthorityEdgeType
  ) => {
    const key = `${source}:${target}:${authority}`;
    if (seen.has(key)) return;
    if (!entryMap.has(source) || !entryMap.has(target)) return;
    seen.add(key);
    edges.push({ source, target, authority });
  };

  for (const ref of crossRefs) {
    const src = entryMap.get(ref.source);
    const tgt = entryMap.get(ref.target);
    if (!src || !tgt) continue;

    if (hasAnyTag(src.tags, VERIFICATION_TAGS) && VERIFICATION_CATEGORIES.has(src.category)) {
      addEdge(ref.source, ref.target, "VERIFIES");
    } else if (hasAnyTag(src.tags, SIGNING_TAGS) && src.category === "attestation") {
      addEdge(ref.source, ref.target, "SIGNED_BY");
    } else if (hasAnyTag(src.tags, EXECUTION_TAGS) && CODE_TYPES.has(src.content_type)) {
      addEdge(ref.source, ref.target, "EXECUTES");
    } else if (hasAnyTag(src.tags, CONTRADICTION_TAGS)) {
      addEdge(ref.source, ref.target, "CONTRADICTS");
    } else if (DERIVATION_CATEGORIES.has(src.category)) {
      addEdge(ref.source, ref.target, "DERIVES_FROM");
    } else {
      addEdge(ref.source, ref.target, "DEPENDS_ON");
    }
  }

const TAG_GROUP_CAP = 40;
const TAG_GROUP_LARGE_SAMPLE = 15;

  const tagPairs: [string, Set<string>][] = [];
  for (const [tag, ids] of Object.entries(tagIndex)) {
    let filteredIds = ids.filter((id) => entryMap.has(id));
    if (filteredIds.length < 2) continue;

    if (filteredIds.length > TAG_GROUP_CAP) {
      const stride = Math.max(1, Math.floor(filteredIds.length / TAG_GROUP_LARGE_SAMPLE));
      const sampled: string[] = [];
      for (let i = 0; i < filteredIds.length; i += stride) {
        sampled.push(filteredIds[i]);
        if (sampled.length >= TAG_GROUP_LARGE_SAMPLE) break;
      }
      filteredIds = sampled;
    }

    const idSet = new Set(filteredIds);
    if (idSet.size < 2) continue;
    tagPairs.push([tag, idSet]);
  }

  for (const [tag, idSet] of tagPairs) {
    const ids = [...idSet];

    const MAX_PAIR_EDGES = 20;
    let pairEdgeCount = 0;

    if (VERIFICATION_TAGS.has(tag)) {
      for (let i = 0; i < ids.length && pairEdgeCount < MAX_PAIR_EDGES; i++) {
        for (let j = i + 1; j < ids.length && pairEdgeCount < MAX_PAIR_EDGES; j++) {
          addEdge(ids[i], ids[j], "VERIFIES");
          addEdge(ids[j], ids[i], "VERIFIES");
          pairEdgeCount++;
        }
      }
    } else if (CONTRADICTION_TAGS.has(tag)) {
      for (let i = 0; i < ids.length && pairEdgeCount < MAX_PAIR_EDGES; i++) {
        for (let j = i + 1; j < ids.length && pairEdgeCount < MAX_PAIR_EDGES; j++) {
          addEdge(ids[i], ids[j], "CONTRADICTS");
          addEdge(ids[j], ids[i], "CONTRADICTS");
          pairEdgeCount++;
        }
      }
    } else if (SIGNING_TAGS.has(tag)) {
      for (let i = 0; i < ids.length && pairEdgeCount < MAX_PAIR_EDGES; i++) {
        for (let j = i + 1; j < ids.length && pairEdgeCount < MAX_PAIR_EDGES; j++) {
          addEdge(ids[i], ids[j], "SIGNED_BY");
          addEdge(ids[j], ids[i], "SIGNED_BY");
          pairEdgeCount++;
        }
      }
    } else if (EXECUTION_TAGS.has(tag)) {
      for (let i = 0; i < ids.length && pairEdgeCount < MAX_PAIR_EDGES; i++) {
        for (let j = i + 1; j < ids.length && pairEdgeCount < MAX_PAIR_EDGES; j++) {
          addEdge(ids[i], ids[j], "EXECUTES");
          addEdge(ids[j], ids[i], "EXECUTES");
          pairEdgeCount++;
        }
      }
    } else if (GOVERNANCE_TAGS.has(tag)) {
      for (let i = 0; i < ids.length && pairEdgeCount < MAX_PAIR_EDGES; i++) {
        for (let j = i + 1; j < ids.length && pairEdgeCount < MAX_PAIR_EDGES; j++) {
          addEdge(ids[i], ids[j], "DERIVES_FROM");
          addEdge(ids[j], ids[i], "DERIVES_FROM");
          pairEdgeCount++;
        }
      }
    }
  }

  return edges;
}

export function computeNodeStatuses(
  entries: Entry[],
  authorityEdges: AuthorityEdge[]
): NodeStatusEntry[] {
  const incomingVerifies = new Map<string, Set<string>>();
  const incomingContradicts = new Map<string, Set<string>>();
  const nodeAuthorityTypes = new Map<string, Set<AuthorityEdgeType>>();

  for (const edge of authorityEdges) {
    if (edge.authority === "VERIFIES") {
      if (!incomingVerifies.has(edge.target))
        incomingVerifies.set(edge.target, new Set());
      incomingVerifies.get(edge.target)!.add(edge.source);
    }
    if (edge.authority === "CONTRADICTS") {
      if (!incomingContradicts.has(edge.target))
        incomingContradicts.set(edge.target, new Set());
      incomingContradicts.get(edge.target)!.add(edge.source);
      if (!incomingContradicts.has(edge.source))
        incomingContradicts.set(edge.source, new Set());
      incomingContradicts.get(edge.source)!.add(edge.target);
    }
    if (!nodeAuthorityTypes.has(edge.source))
      nodeAuthorityTypes.set(edge.source, new Set());
    nodeAuthorityTypes.get(edge.source)!.add(edge.authority);
  }

  const entryMap = new Map<string, Entry>();
  for (const e of entries) entryMap.set(e.id, e);

  return entries.map((entry) => {
    const vCount = (incomingVerifies.get(entry.id) || new Set()).size;
    const cCount = (incomingContradicts.get(entry.id) || new Set()).size;
    const authTypes = [
      ...(nodeAuthorityTypes.get(entry.id) || new Set()),
    ];

    let status: NodeStatus = "UNVERIFIED";

    if (QUARANTINE_CATEGORIES.has(entry.category)) {
      status = "QUARANTINED";
    } else if (cCount > 0 && vCount >= 2) {
      status = "CONFLICTED";
    } else if (cCount > 0) {
      status = "CONFLICTED";
    } else if (vCount >= 2) {
      status = "VERIFIED";
    } else if (VERIFICATION_CATEGORIES.has(entry.category)) {
      status = "VERIFIED";
    } else if (hasAnyTag(entry.tags, VERIFICATION_TAGS)) {
      status = "VERIFIED";
    }

    return {
      id: entry.id,
      status,
      verificationCount: vCount,
      contradictionCount: cCount,
      authorityEdges: authTypes,
    };
  });
}


export function computeGovernanceLayer(entry: Entry): GovernanceLayer {
  if (LANE_REPOS.has(entry.repo) && CONSTITUTIONAL_CATEGORIES.has(entry.category)) return "constitutional";
  if (LANE_REPOS.has(entry.repo) && OPERATIONAL_CATEGORIES.has(entry.category)) return "operational";
  if (entry.category === "paper" || hasAnyTag(entry.tags, THEORETICAL_TAGS)) return "theoretical";
  if (EVIDENCE_CATEGORIES.has(entry.category)) return "evidence";
  if (HISTORICAL_CATEGORIES.has(entry.category)) return "historical";
  if (entry.date) {
    const age = Date.now() - new Date(entry.date).getTime();
    if (age > 180 * 86400000) return "historical";
  }
  if (GAME_CATEGORIES.has(entry.category)) return "application_adjacent";
  if (entry.repo === "FreeAgent") {
    return FREEAGENT_SUBCATEGORY_MAP[entry.category] || "application_adjacent";
  }
  if (entry.repo === "federation") {
    if (OPERATIONAL_CATEGORIES.has(entry.category) || entry.category === "code" || entry.category === "script") return "operational";
    if (entry.category === "docs" || entry.category === "root-doc") return "theoretical";
    if (GAME_CATEGORIES.has(entry.category)) return "application_adjacent";
    return "operational";
  }
  if (entry.repo === "Deliberate-AI-Ensemble") {
    if (entry.category === "governance" || entry.category === "architecture") return "constitutional";
    if (entry.category === "paper" || entry.category === "drift" || entry.category === "resilience") return "theoretical";
    return "operational";
  }
  if (entry.repo === "storytime") return "application_adjacent";
  if (entry.repo === "papers") return "theoretical";
  return "unknown";
}

export function computeAuthorityDepth(repo: string): number {
  return REPO_AUTHORITY_DEPTH[repo] ?? 0;
}

export function computeGovernanceDepths(
  entries: Entry[],
  authorityEdges: AuthorityEdge[],
  nodeStatuses: NodeStatusEntry[]
): GovernanceDepthEntry[] {
  const entryMap = new Map<string, Entry>();
  for (const e of entries) entryMap.set(e.id, e);

  const statusMap = new Map<string, NodeStatusEntry>();
  for (const s of nodeStatuses) statusMap.set(s.id, s);

  const outgoingByNode = new Map<string, AuthorityEdge[]>();
  const incomingByNode = new Map<string, AuthorityEdge[]>();
  for (const edge of authorityEdges) {
    if (!outgoingByNode.has(edge.source)) outgoingByNode.set(edge.source, []);
    outgoingByNode.get(edge.source)!.push(edge);
    if (!incomingByNode.has(edge.target)) incomingByNode.set(edge.target, []);
    incomingByNode.get(edge.target)!.push(edge);
  }

  const govLayerCache = new Map<string, GovernanceLayer>();
  const getGovLayer = (id: string): GovernanceLayer => {
    if (govLayerCache.has(id)) return govLayerCache.get(id)!;
    const e = entryMap.get(id);
    const layer = e ? computeGovernanceLayer(e) : "unknown";
    govLayerCache.set(id, layer);
    return layer;
  };

  return entries.map((entry) => {
    const governanceLayer = computeGovernanceLayer(entry);
    const authorityDepth = computeAuthorityDepth(entry.repo);
    const status = statusMap.get(entry.id);
    const outgoing = outgoingByNode.get(entry.id) || [];
    const incoming = incomingByNode.get(entry.id) || [];

    let bridgeState: BridgeState = "unknown";

    if (outgoing.some((e) => e.authority === "CONTRADICTS") || incoming.some((e) => e.authority === "CONTRADICTS")) {
      bridgeState = "contradicted";
    } else if (
      outgoing.some((e) => (e.authority === "VERIFIES" || e.authority === "SIGNED_BY") &&
        (getGovLayer(e.target) === "constitutional" || getGovLayer(e.target) === "operational")) ||
      incoming.some((e) => (e.authority === "VERIFIES" || e.authority === "SIGNED_BY") &&
        (getGovLayer(e.source) === "constitutional" || getGovLayer(e.source) === "operational"))
    ) {
      bridgeState = "enforced";
    } else if (
      status && status.status === "VERIFIED" &&
      [...outgoing, ...incoming].some((e) => {
        const otherId = e.source === entry.id ? e.target : e.source;
        return entryMap.has(otherId) && entryMap.get(otherId)!.repo !== entry.repo;
      })
    ) {
      bridgeState = "verified";
    } else if (
      (governanceLayer === "theoretical" || governanceLayer === "historical") &&
      [...outgoing, ...incoming].some((e) => e.authority === "DERIVES_FROM")
    ) {
      bridgeState = "partial";
    } else if (
      (governanceLayer === "theoretical" || governanceLayer === "historical") &&
      outgoing.length === 0 && incoming.length === 0
    ) {
      bridgeState = "obsolete";
    } else if (governanceLayer === "theoretical" || governanceLayer === "historical") {
      bridgeState = "documented_only";
    }

    return {
      id: entry.id,
      governanceLayer,
      authorityDepth,
      bridgeState,
    };
  });
}

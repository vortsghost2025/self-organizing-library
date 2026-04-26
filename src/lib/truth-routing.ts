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

interface Entry {
  id: string;
  repo: string;
  category: string;
  content_type: string;
  tags: string[];
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

  const tagPairs: [string, Set<string>][] = [];
  for (const [tag, ids] of Object.entries(tagIndex)) {
    if (ids.length < 2 || ids.length > 80) continue;
    const idSet = new Set(ids.filter((id) => entryMap.has(id)));
    if (idSet.size < 2) continue;
    tagPairs.push([tag, idSet]);
  }

  for (const [tag, idSet] of tagPairs) {
    const ids = [...idSet];

    if (VERIFICATION_TAGS.has(tag)) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addEdge(ids[i], ids[j], "VERIFIES");
          addEdge(ids[j], ids[i], "VERIFIES");
        }
      }
    } else if (CONTRADICTION_TAGS.has(tag)) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addEdge(ids[i], ids[j], "CONTRADICTS");
          addEdge(ids[j], ids[i], "CONTRADICTS");
        }
      }
    } else if (SIGNING_TAGS.has(tag)) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addEdge(ids[i], ids[j], "SIGNED_BY");
          addEdge(ids[j], ids[i], "SIGNED_BY");
        }
      }
    } else if (EXECUTION_TAGS.has(tag)) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addEdge(ids[i], ids[j], "EXECUTES");
          addEdge(ids[j], ids[i], "EXECUTES");
        }
      }
    } else if (GOVERNANCE_TAGS.has(tag)) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          addEdge(ids[i], ids[j], "DERIVES_FROM");
          addEdge(ids[j], ids[i], "DERIVES_FROM");
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

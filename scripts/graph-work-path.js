#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SITE_INDEX_PATH = path.join(__dirname, "..", "data", "site-index.json");
const OUTPUT_DIR = path.join(__dirname, "..", "reports");

const VERIFICATION_TAGS = new Set([
  "Verification",
  "Attestation",
  "Identity Enforcement",
  "Convergence Gate",
]);

const SIGNING_TAGS = new Set(["Attestation", "Identity Enforcement"]);

const EXECUTION_TAGS = new Set(["Kernel", "Swarmmind", "Multi-Agent"]);

const GOVERNANCE_TAGS = new Set([
  "Governance",
  "Constitutional AI",
  "Covenant",
  "Constraint Lattice",
]);

const CONTRADICTION_TAGS = new Set(["Failure Mode", "Drift"]);

const DERIVATION_CATEGORIES = new Set([
  "verification",
  "attestation",
  "governance",
  "spec",
  "paper",
]);

const VERIFICATION_CATEGORIES = new Set(["verification", "attestation", "audit"]);

const QUARANTINE_CATEGORIES = new Set(["scratch", "pending", "sensitive"]);

const CODE_TYPES = new Set(["code", "config"]);

const LANE_REPOS = new Set([
  "self-organizing-library",
  "Archivist-Agent",
  "SwarmMind",
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
  "kernel-lane",
]);

const CONSTITUTIONAL_CATEGORIES = new Set([
  "governance",
  "verification",
  "attestation",
  "spec",
]);

const OPERATIONAL_CATEGORIES = new Set(["code", "scripts", "config"]);

const THEORETICAL_TAGS = new Set([
  "Rosetta Stone",
  "CAISC",
  "Constraint Lattice",
  "paper",
]);

const EVIDENCE_CATEGORIES = new Set(["verification", "audit", "test-data"]);

const HISTORICAL_CATEGORIES = new Set(["scratch", "pending"]);

const GAME_CATEGORIES = new Set(["game", "uss-chaosbringer", "uss_chaosbringer"]);

const FREEAGENT_SUBCATEGORY_MAP = {
  medical: "application_adjacent",
  we4free: "application_adjacent",
  we: "application_adjacent",
  distributed: "operational",
  infrastructure: "operational",
  "shared-infra": "operational",
  "connection-bridge": "operational",
  ui: "application_adjacent",
  data: "evidence",
  docs: "theoretical",
  agent: "operational",
  coordination: "operational",
  project: "operational",
  game: "application_adjacent",
  "phase-6": "theoretical",
  scratch: "historical",
  config: "operational",
  public_html: "application_adjacent",
  log: "historical",
  script: "operational",
  orchestrator: "operational",
};

const REPO_AUTHORITY_DEPTH = {
  "Archivist-Agent": 95,
  "self-organizing-library": 90,
  SwarmMind: 80,
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": 80,
  "kernel-lane": 75,
  federation: 50,
  FreeAgent: 40,
  "Deliberate-AI-Ensemble": 60,
  storytime: 30,
  papers: 70,
};

function hasAnyTag(tags, tagSet) {
  return tags.some((t) => tagSet.has(t));
}

function computeGovernanceLayer(entry) {
  if (LANE_REPOS.has(entry.repo) && CONSTITUTIONAL_CATEGORIES.has(entry.category))
    return "constitutional";
  if (LANE_REPOS.has(entry.repo) && OPERATIONAL_CATEGORIES.has(entry.category))
    return "operational";
  if (entry.category === "paper" || hasAnyTag(entry.tags, THEORETICAL_TAGS))
    return "theoretical";
  if (EVIDENCE_CATEGORIES.has(entry.category)) return "evidence";
  if (HISTORICAL_CATEGORIES.has(entry.category)) return "historical";
  if (GAME_CATEGORIES.has(entry.category)) return "application_adjacent";
  if (entry.repo === "FreeAgent") {
    return FREEAGENT_SUBCATEGORY_MAP[entry.category] || "application_adjacent";
  }
  if (entry.repo === "federation") {
    if (
      OPERATIONAL_CATEGORIES.has(entry.category) ||
      entry.category === "code" ||
      entry.category === "script"
    )
      return "operational";
    if (entry.category === "docs" || entry.category === "root-doc") return "theoretical";
    if (GAME_CATEGORIES.has(entry.category)) return "application_adjacent";
    return "operational";
  }
  if (entry.repo === "Deliberate-AI-Ensemble") {
    if (entry.category === "governance" || entry.category === "architecture")
      return "constitutional";
    if (
      entry.category === "paper" ||
      entry.category === "drift" ||
      entry.category === "resilience"
    )
      return "theoretical";
    return "operational";
  }
  if (entry.repo === "storytime") return "application_adjacent";
  if (entry.repo === "papers") return "theoretical";
  return "unknown";
}

function computeAuthorityEdges(entries, crossRefs, tagIndex) {
  const entryMap = new Map();
  for (const e of entries) entryMap.set(e.id, e);

  const edges = [];
  const seen = new Set();

  const addEdge = (source, target, authority, provenance) => {
    const key = `${source}:${target}:${authority}`;
    if (seen.has(key)) return;
    if (!entryMap.has(source) || !entryMap.has(target)) return;
    seen.add(key);
    edges.push({ source, target, authority, provenance });
  };

  for (const ref of crossRefs) {
    const src = entryMap.get(ref.source);
    const tgt = entryMap.get(ref.target);
    if (!src || !tgt) continue;

    if (
      hasAnyTag(src.tags, VERIFICATION_TAGS) &&
      VERIFICATION_CATEGORIES.has(src.category)
    ) {
      addEdge(ref.source, ref.target, "VERIFIES", "cross_ref");
    } else if (
      hasAnyTag(src.tags, SIGNING_TAGS) &&
      src.category === "attestation"
    ) {
      addEdge(ref.source, ref.target, "SIGNED_BY", "cross_ref");
    } else if (
      hasAnyTag(src.tags, EXECUTION_TAGS) &&
      CODE_TYPES.has(src.content_type)
    ) {
      addEdge(ref.source, ref.target, "EXECUTES", "cross_ref");
    } else if (hasAnyTag(src.tags, CONTRADICTION_TAGS)) {
      addEdge(ref.source, ref.target, "CONTRADICTS", "cross_ref");
    } else if (DERIVATION_CATEGORIES.has(src.category)) {
      addEdge(ref.source, ref.target, "DERIVES_FROM", "cross_ref");
    } else {
      addEdge(ref.source, ref.target, "DEPENDS_ON", "cross_ref");
    }
  }

  const TAG_GROUP_CAP = 80;
  const TAG_GROUP_LARGE_SAMPLE = 40;

  for (const [tag, ids] of Object.entries(tagIndex)) {
    let filteredIds = ids.filter((id) => entryMap.has(id));
    if (filteredIds.length < 2) continue;

    if (filteredIds.length > TAG_GROUP_CAP) {
      const stride = Math.max(
        1,
        Math.floor(filteredIds.length / TAG_GROUP_LARGE_SAMPLE)
      );
      const sampled = [];
      for (let i = 0; i < filteredIds.length; i += stride) {
        sampled.push(filteredIds[i]);
        if (sampled.length >= TAG_GROUP_LARGE_SAMPLE) break;
      }
      filteredIds = sampled;
    }

    const idSet = new Set(filteredIds);
    if (idSet.size < 2) continue;

    const idArr = [...idSet];

    if (VERIFICATION_TAGS.has(tag)) {
      for (let i = 0; i < idArr.length; i++) {
        for (let j = i + 1; j < idArr.length; j++) {
          addEdge(idArr[i], idArr[j], "VERIFIES", "tag_group");
          addEdge(idArr[j], idArr[i], "VERIFIES", "tag_group");
        }
      }
    } else if (CONTRADICTION_TAGS.has(tag)) {
      for (let i = 0; i < idArr.length; i++) {
        for (let j = i + 1; j < idArr.length; j++) {
          addEdge(idArr[i], idArr[j], "CONTRADICTS", "tag_group");
          addEdge(idArr[j], idArr[i], "CONTRADICTS", "tag_group");
        }
      }
    } else if (SIGNING_TAGS.has(tag)) {
      for (let i = 0; i < idArr.length; i++) {
        for (let j = i + 1; j < idArr.length; j++) {
          addEdge(idArr[i], idArr[j], "SIGNED_BY", "tag_group");
          addEdge(idArr[j], idArr[i], "SIGNED_BY", "tag_group");
        }
      }
    } else if (EXECUTION_TAGS.has(tag)) {
      for (let i = 0; i < idArr.length; i++) {
        for (let j = i + 1; j < idArr.length; j++) {
          addEdge(idArr[i], idArr[j], "EXECUTES", "tag_group");
          addEdge(idArr[j], idArr[i], "EXECUTES", "tag_group");
        }
      }
    } else if (GOVERNANCE_TAGS.has(tag)) {
      for (let i = 0; i < idArr.length; i++) {
        for (let j = i + 1; j < idArr.length; j++) {
          addEdge(idArr[i], idArr[j], "DERIVES_FROM", "tag_group");
          addEdge(idArr[j], idArr[i], "DERIVES_FROM", "tag_group");
        }
      }
    }
  }

  return edges;
}

function computeNodeStatuses(entries, authorityEdges) {
  const incomingVerifies = new Map();
  const incomingContradicts = new Map();
  const outgoingByNode = new Map();
  const incomingByNode = new Map();

  for (const edge of authorityEdges) {
    if (edge.authority === "VERIFIES") {
      if (!incomingVerifies.has(edge.target))
        incomingVerifies.set(edge.target, new Set());
      incomingVerifies.get(edge.target).add(edge.source);
    }
    if (edge.authority === "CONTRADICTS") {
      if (!incomingContradicts.has(edge.target))
        incomingContradicts.set(edge.target, new Set());
      incomingContradicts.get(edge.target).add(edge.source);
      if (!incomingContradicts.has(edge.source))
        incomingContradicts.set(edge.source, new Set());
      incomingContradicts.get(edge.source).add(edge.target);
    }
    if (!outgoingByNode.has(edge.source)) outgoingByNode.set(edge.source, []);
    outgoingByNode.get(edge.source).push(edge);
    if (!incomingByNode.has(edge.target)) incomingByNode.set(edge.target, []);
    incomingByNode.get(edge.target).push(edge);
  }

  return entries.map((entry) => {
    const vCount = (incomingVerifies.get(entry.id) || new Set()).size;
    const cCount = (incomingContradicts.get(entry.id) || new Set()).size;
    const outgoing = outgoingByNode.get(entry.id) || [];
    const incoming = incomingByNode.get(entry.id) || [];

    let status = "UNVERIFIED";

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
      outgoing,
      incoming,
    };
  });
}

function computeGovernanceDepths(entries, authorityEdges, nodeStatuses) {
  const entryMap = new Map();
  for (const e of entries) entryMap.set(e.id, e);

  const statusMap = new Map();
  for (const s of nodeStatuses) statusMap.set(s.id, s);

  const outgoingByNode = new Map();
  const incomingByNode = new Map();
  for (const edge of authorityEdges) {
    if (!outgoingByNode.has(edge.source)) outgoingByNode.set(edge.source, []);
    outgoingByNode.get(edge.source).push(edge);
    if (!incomingByNode.has(edge.target)) incomingByNode.set(edge.target, []);
    incomingByNode.get(edge.target).push(edge);
  }

  const govLayerCache = new Map();
  const getGovLayer = (id) => {
    if (govLayerCache.has(id)) return govLayerCache.get(id);
    const e = entryMap.get(id);
    const layer = e ? computeGovernanceLayer(e) : "unknown";
    govLayerCache.set(id, layer);
    return layer;
  };

  return entries.map((entry) => {
    const governanceLayer = computeGovernanceLayer(entry);
    const authorityDepth = REPO_AUTHORITY_DEPTH[entry.repo] ?? 0;
    const status = statusMap.get(entry.id);
    const outgoing = outgoingByNode.get(entry.id) || [];
    const incoming = incomingByNode.get(entry.id) || [];

    let bridgeState = "unknown";

    if (
      outgoing.some((e) => e.authority === "CONTRADICTS") ||
      incoming.some((e) => e.authority === "CONTRADICTS")
    ) {
      bridgeState = "contradicted";
    } else if (
      outgoing.some(
        (e) =>
          (e.authority === "VERIFIES" || e.authority === "SIGNED_BY") &&
          (getGovLayer(e.target) === "constitutional" ||
            getGovLayer(e.target) === "operational")
      ) ||
      incoming.some(
        (e) =>
          (e.authority === "VERIFIES" || e.authority === "SIGNED_BY") &&
          (getGovLayer(e.source) === "constitutional" ||
            getGovLayer(e.source) === "operational")
      )
    ) {
      bridgeState = "enforced";
    } else if (
      status &&
      status.status === "VERIFIED" &&
      [...outgoing, ...incoming].some((e) => {
        const otherId = e.source === entry.id ? e.target : e.source;
        return entryMap.has(otherId) && entryMap.get(otherId).repo !== entry.repo;
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
      outgoing.length === 0 &&
      incoming.length === 0
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

function classifySignals(entries, authorityEdges, nodeStatuses, govDepths) {
  const entryMap = new Map();
  for (const e of entries) entryMap.set(e.id, e);

  const statusMap = new Map();
  for (const s of nodeStatuses) statusMap.set(s.id, s);

  const govMap = new Map();
  for (const g of govDepths) govMap.set(g.id, g);

  const contradictsEdgesDirect = authorityEdges.filter(
    (e) => e.authority === "CONTRADICTS" && e.provenance === "cross_ref"
  );
  const contradictsEdgesTagGroup = authorityEdges.filter(
    (e) => e.authority === "CONTRADICTS" && e.provenance === "tag_group"
  );

  const directContradictsTargets = new Set();
  for (const e of contradictsEdgesDirect) {
    directContradictsTargets.add(e.source);
    directContradictsTargets.add(e.target);
  }

  const tagGroupContradictsTargets = new Set();
  for (const e of contradictsEdgesTagGroup) {
    tagGroupContradictsTargets.add(e.source);
    tagGroupContradictsTargets.add(e.target);
  }

  const bucket1 = [];
  const bucket2 = [];
  const bucket3 = [];
  const bucket4 = [];
  const bucket5 = [];
  const bucket6 = [];
  const bucket7 = [];

  const verifiesIncoming = new Map();
  const derivesFromOutgoing = new Map();
  for (const edge of authorityEdges) {
    if (edge.authority === "VERIFIES") {
      if (!verifiesIncoming.has(edge.target)) verifiesIncoming.set(edge.target, new Set());
      verifiesIncoming.get(edge.target).add(edge.source);
    }
    if (edge.authority === "DERIVES_FROM") {
      if (!derivesFromOutgoing.has(edge.source))
        derivesFromOutgoing.set(edge.source, new Set());
      derivesFromOutgoing.get(edge.source).add(edge.target);
    }
  }

  for (const entry of entries) {
    const status = statusMap.get(entry.id);
    const gov = govMap.get(entry.id);

    if (!status || !gov) continue;

    const hasDirectContradicts = directContradictsTargets.has(entry.id);
    const hasTagGroupContradicts = tagGroupContradictsTargets.has(entry.id);

    if (status.contradictionCount > 0 && hasDirectContradicts) {
      bucket1.push({
        id: entry.id,
        title: entry.title,
        repo: entry.repo,
        category: entry.category,
        tags: entry.tags,
        contradictionCount: status.contradictionCount,
        verificationCount: status.verificationCount,
        governanceLayer: gov.governanceLayer,
        bridgeState: gov.bridgeState,
        authorityDepth: gov.authorityDepth,
        signal: "direct_contradiction",
        explanation: `Has ${status.contradictionCount} CONTRADICTS edges. At least one has cross_ref provenance (source document with CONTRADICTION_TAGS links to target via markdown reference). NOTE: cross_ref CONTRADICTS does not guarantee semantic conflict — it means the source has Failure Mode/Drift tags and references the target. Verify before treating as genuine contradiction.`,
        priority: "P0",
        priorityReason: "Cross-reference contradiction candidate — verify before escalating",
      });
    }

    if (
      (status.status === "CONFLICTED" || status.contradictionCount > 0) &&
      !hasDirectContradicts &&
      hasTagGroupContradicts
    ) {
      const isArtifact =
        status.contradictionCount >= 39 ||
        (hasAnyTag(entry.tags, CONTRADICTION_TAGS) &&
          status.contradictionCount > 0);

      let priority = "P2";
      let priorityReason =
        "Tag-group artifact — taxonomy cleanup only";

      if (isArtifact && gov.authorityDepth >= 70) {
        priority = "P0";
        priorityReason =
          "Tag-group artifact on HIGH-AUTHORITY node — public wording may be misleading or cause unsafe authority claims";
      } else if (isArtifact && gov.bridgeState === "contradicted") {
        priority = "P1";
        priorityReason =
          "Artifact-class node with contradicted bridgeState — status semantics need correction";
      } else if (status.status === "CONFLICTED") {
        priority = "P1";
        priorityReason =
          "CONFLICTED status without direct CONTRADICTS — status semantics need correction";
      }

      bucket2.push({
        id: entry.id,
        title: entry.title,
        repo: entry.repo,
        category: entry.category,
        tags: entry.tags,
        contradictionCount: status.contradictionCount,
        verificationCount: status.verificationCount,
        governanceLayer: gov.governanceLayer,
        bridgeState: gov.bridgeState,
        authorityDepth: gov.authorityDepth,
        signal: "tag_sampled_contradiction_artifact",
        artifact_class: "tag_group",
        explanation: `contradictionCount=${status.contradictionCount} but ALL CONTRADICTS edges are tag-group provenance (K(40) stride-sampling artifact). No direct cross-reference contradictions.`,
        priority,
        priorityReason,
      });
    }

    if (status.status === "QUARANTINED") {
      bucket3.push({
        id: entry.id,
        title: entry.title,
        repo: entry.repo,
        category: entry.category,
        tags: entry.tags,
        contradictionCount: status.contradictionCount,
        verificationCount: status.verificationCount,
        governanceLayer: gov.governanceLayer,
        bridgeState: gov.bridgeState,
        authorityDepth: gov.authorityDepth,
        signal: "quarantine_triage",
        explanation: `QUARANTINED status (category: ${entry.category}). Needs triage: test artifact, malformed, or legitimate.`,
        priority: "P1",
        priorityReason: "Quarantined nodes block downstream processing until triaged",
      });
    }

    if (
      status.status === "UNVERIFIED" &&
      gov.authorityDepth >= 70 &&
      status.verificationCount === 0
    ) {
      bucket4.push({
        id: entry.id,
        title: entry.title,
        repo: entry.repo,
        category: entry.category,
        tags: entry.tags,
        contradictionCount: status.contradictionCount,
        verificationCount: status.verificationCount,
        governanceLayer: gov.governanceLayer,
        bridgeState: gov.bridgeState,
        authorityDepth: gov.authorityDepth,
        signal: "unverified_high_authority",
        explanation: `UNVERIFIED node with authorityDepth=${gov.authorityDepth} (repo: ${entry.repo}) and zero VERIFIES edges. High-trust source with no verification is a system integrity gap.`,
        priority: "P1",
        priorityReason:
          "High-authority unverified node — trust without evidence is fragile",
      });
    }

    if (
      (gov.governanceLayer === "constitutional" || gov.governanceLayer === "operational") &&
      (gov.bridgeState === "documented_only" || gov.bridgeState === "unknown" || gov.bridgeState === "obsolete")
    ) {
      bucket5.push({
        id: entry.id,
        title: entry.title,
        repo: entry.repo,
        category: entry.category,
        tags: entry.tags,
        contradictionCount: status.contradictionCount,
        verificationCount: status.verificationCount,
        governanceLayer: gov.governanceLayer,
        bridgeState: gov.bridgeState,
        authorityDepth: gov.authorityDepth,
        signal: "bridge_state_mismatch",
        explanation: `${gov.governanceLayer} layer node with bridgeState="${gov.bridgeState}" — governance content should have enforced/verified bridges.`,
        priority: "P1",
        priorityReason:
          "Constitutional/operational content without enforcement bridges is governance theater",
      });
    }

    const derivesFrom = derivesFromOutgoing.get(entry.id);
    if (derivesFrom && derivesFrom.size > 0) {
      const vIncoming = verifiesIncoming.get(entry.id);
      if (!vIncoming || vIncoming.size === 0) {
        if (status.status !== "QUARANTINED") {
          bucket6.push({
            id: entry.id,
            title: entry.title,
            repo: entry.repo,
            category: entry.category,
            tags: entry.tags,
            contradictionCount: status.contradictionCount,
            verificationCount: status.verificationCount,
            governanceLayer: gov.governanceLayer,
            bridgeState: gov.bridgeState,
            authorityDepth: gov.authorityDepth,
            derivesFromCount: derivesFrom.size,
            signal: "derives_without_verifies",
            explanation: `DERIVES_FROM ${derivesFrom.size} source(s) but has ZERO incoming VERIFIES. Claim is derived but never independently verified.`,
            priority: "P1",
            priorityReason:
              "Derived but unverified claims propagate assumptions without evidence",
          });
        }
      }
    }

    const outgoingAuth = new Set();
    const incomingAuth = new Set();
    for (const edge of authorityEdges) {
      if (edge.source === entry.id) outgoingAuth.add(edge.authority);
      if (edge.target === entry.id) incomingAuth.add(edge.authority);
    }

    if (
      outgoingAuth.size === 0 &&
      incomingAuth.size === 0 &&
      status.status !== "QUARANTINED"
    ) {
      bucket7.push({
        id: entry.id,
        title: entry.title,
        repo: entry.repo,
        category: entry.category,
        tags: entry.tags,
        contradictionCount: status.contradictionCount,
        verificationCount: status.verificationCount,
        governanceLayer: gov.governanceLayer,
        bridgeState: gov.bridgeState,
        authorityDepth: gov.authorityDepth,
        signal: "orphaned_ungoverned",
        explanation: `Zero authority edges (in or out). Node is disconnected from the governance/verification graph.`,
        priority: gov.authorityDepth >= 50 ? "P1" : "P2",
        priorityReason:
          gov.authorityDepth >= 50
            ? "High-authority repo node with no governance edges — orphaned authority"
            : "No governance edges — low priority taxonomy concern",
      });
    }
  }

  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const sortFn = (a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return b.authorityDepth - a.authorityDepth;
  };

  bucket1.sort(sortFn);
  bucket2.sort(sortFn);
  bucket3.sort(sortFn);
  bucket4.sort(sortFn);
  bucket5.sort(sortFn);
  bucket6.sort(sortFn);
  bucket7.sort(sortFn);

  return { bucket1, bucket2, bucket3, bucket4, bucket5, bucket6, bucket7 };
}

function emitMarkdownReport(buckets, stats, generatedAt) {
  const lines = [];

  lines.push("# Graph Work-Path Analysis Report");
  lines.push("");
  lines.push(
    `**Generated:** ${new Date(generatedAt).toISOString()}  `
  );
  lines.push(
    `**Source:** data/site-index.json (${stats.totalNodes} nodes, ${stats.totalEdges} authority edges, ${stats.totalCrossRefs} cross-references)`
  );
  lines.push("");
  lines.push("> **Disclaimer:** Conflict labels may be artifact-class when no direct CONTRADICTS edges exist. Treat as roadmap signal, not proof.");
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## Executive Summary");
  lines.push("");
  lines.push("| Bucket | Signal | Count | P0 | P1 | P2 |");
  lines.push("|--------|--------|-------|----|----|----|");

  const bucketNames = [
    ["bucket1", "1. Direct Semantic Contradictions", buckets.bucket1],
    ["bucket2", "2. Tag-Sampled Contradiction Artifacts", buckets.bucket2],
    ["bucket3", "3. Quarantine Triage Candidates", buckets.bucket3],
    ["bucket4", "4. Unverified High-Authority Nodes", buckets.bucket4],
    ["bucket5", "5. Bridge-State Mismatches", buckets.bucket5],
    ["bucket6", "6. Derives-Without-Verifies", buckets.bucket6],
    ["bucket7", "7. Orphaned / Ungoverned Nodes", buckets.bucket7],
  ];

  for (const [, label, bucket] of bucketNames) {
    const p0 = bucket.filter((i) => i.priority === "P0").length;
    const p1 = bucket.filter((i) => i.priority === "P1").length;
    const p2 = bucket.filter((i) => i.priority === "P2").length;
    lines.push(`| ${label} | ${bucket[0]?.signal || "-"} | ${bucket.length} | ${p0} | ${p1} | ${p2} |`);
  }

  lines.push("");
  lines.push(
    `**Total work-path items:** ${bucketNames.reduce((sum, [, , b]) => sum + b.length, 0)}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  const bucketDescriptions = {
    bucket1:
      "Nodes with CONTRADICTS edges from cross-references (provenance=cross_ref). The source document has CONTRADICTION_TAGS (Failure Mode, Drift) and links to the target via markdown. This does NOT guarantee a semantic contradiction — it means a failure-mode/drift-tagged document references the target. These are candidates for review, not proven conflicts. Verify before escalating.",
    bucket2:
      "Nodes marked CONFLICTED or with contradictionCount > 0 but NO direct CONTRADICTS edges. These are tag-group co-occurrence artifacts from the K(40) stride-sampling algorithm. NOT semantic conflicts. Ranked P0 only if high-authority node with misleading public status; P1 if status semantics need correction; P2/P3 for taxonomy cleanup.",
    bucket3:
      "QUARANTINED nodes needing triage: test artifact (delete), malformed (fix schema), or legitimate (process through lane-worker).",
    bucket4:
      "UNVERIFIED nodes in high-authority repos (authorityDepth >= 70) with zero incoming VERIFIES. Trust without evidence is fragile.",
    bucket5:
      "Constitutional or operational layer nodes with bridgeState = documented_only, unknown, or obsolete. Governance content without enforcement bridges is governance theater.",
    bucket6:
      "Nodes that DERIVES_FROM sources but have zero incoming VERIFIES. Claims are derived but never independently verified — assumptions propagate without evidence.",
    bucket7:
      "Nodes with zero authority edges in or out. Disconnected from the governance/verification graph. High-authority repo orphans are P1; others are P2.",
  };

  for (const [key, label, bucket] of bucketNames) {
    lines.push(`## ${label}`);
    lines.push("");
    lines.push(bucketDescriptions[key]);
    lines.push("");

    if (bucket.length === 0) {
      lines.push("_No items in this bucket._");
      lines.push("");
      continue;
    }

    lines.push("| # | Priority | Title | Repo | Auth | Contr. | Verif. | Gov Layer | Bridge | Reason |");
    lines.push("|---|----------|-------|------|------|--------|--------|-----------|--------|--------|");

    const display = bucket.slice(0, 50);
    for (let i = 0; i < display.length; i++) {
      const item = display[i];
      const title =
        item.title.length > 40
          ? item.title.slice(0, 37) + "..."
          : item.title;
      const reason =
        item.priorityReason.length > 50
          ? item.priorityReason.slice(0, 47) + "..."
          : item.priorityReason;
      lines.push(
        `| ${i + 1} | ${item.priority} | ${title} | ${item.repo} | ${item.authorityDepth} | ${item.contradictionCount} | ${item.verificationCount} | ${item.governanceLayer} | ${item.bridgeState} | ${reason} |`
      );
    }

    if (bucket.length > 50) {
      lines.push("");
      lines.push(
        `_...and ${bucket.length - 50} more (see JSON report for full list)_`
      );
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## Edge Type Distribution");
  lines.push("");
  lines.push("| Edge Authority Type | Count | Cross-Ref | Tag-Group |");
  lines.push("|---------------------|-------|-----------|-----------|");

  const edgeTypeCounts = {};
  const edgeProvenanceCounts = {};
  for (const edge of stats.authorityEdges) {
    edgeTypeCounts[edge.authority] = (edgeTypeCounts[edge.authority] || 0) + 1;
    const pKey = `${edge.authority}:${edge.provenance || "unknown"}`;
    edgeProvenanceCounts[pKey] = (edgeProvenanceCounts[pKey] || 0) + 1;
  }
  for (const [type, count] of Object.entries(edgeTypeCounts).sort(
    (a, b) => b[1] - a[1]
  )) {
    const crossRef = edgeProvenanceCounts[`${type}:cross_ref`] || 0;
    const tagGroup = edgeProvenanceCounts[`${type}:tag_group`] || 0;
    lines.push(`| ${type} | ${count.toLocaleString()} | ${crossRef.toLocaleString()} | ${tagGroup.toLocaleString()} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Methodology");
  lines.push("");
  lines.push("1. Load `data/site-index.json` (entries + cross-references + tag index)");
  lines.push("2. Run `computeAuthorityEdges()` — classifies cross-refs and tag-group connections into authority types");
  lines.push("3. Run `computeNodeStatuses()` — computes UNVERIFIED/VERIFIED/CONFLICTED/QUARANTINED + counts");
  lines.push("4. Run `computeGovernanceDepths()` — computes governanceLayer, authorityDepth, bridgeState");
  lines.push("5. Classify each node into signal buckets based on edge composition, status, and governance metadata");
  lines.push("6. Score priority: P0 = misleading/unsafe, P1 = status/governance gap, P2/P3 = taxonomy cleanup");
  lines.push("");
  lines.push("### Artifact-Class Detection");
  lines.push("");
  lines.push("- Each authority edge is tagged with `provenance`: `cross_ref` (from markdown links) or `tag_group` (from tag-index pairing)");
  lines.push("- A CONTRADICTS edge with `provenance=cross_ref` is a **direct semantic contradiction** — the source document explicitly references and contradicts the target");
  lines.push("- A CONTRADICTS edge with `provenance=tag_group` is a **tag-group artifact** — the source and target share a CONTRADICTION_TAG (Failure Mode, Drift) and were paired by the K(40) stride-sampling algorithm, NOT by explicit cross-reference");
  lines.push("- contradictionCount >= 39 is the signature of the K(40) complete-graph artifact (K(40) = 780 edges, each node touches 39)");
  lines.push("- These should be reclassified as artifact-class before any escalation");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("_This report is READ-ONLY. No graph mutations were performed. No lane dispatch was issued._");

  return lines.join("\n");
}

function main() {
  console.log("Loading site-index.json...");
  const siteIndex = JSON.parse(fs.readFileSync(SITE_INDEX_PATH, "utf-8"));

  const { entries, cross_references, tag_index } = siteIndex;

  console.log(
    `Loaded ${entries.length} entries, ${cross_references.length} cross-references, ${Object.keys(tag_index).length} tags`
  );

  console.log("Computing authority edges...");
  const authorityEdges = computeAuthorityEdges(entries, cross_references, tag_index);

  console.log(
    `Computed ${authorityEdges.length} authority edges (${authorityEdges.filter((e) => e.authority === "CONTRADICTS").length} CONTRADICTS)`
  );

  console.log("Computing node statuses...");
  const nodeStatuses = computeNodeStatuses(entries, authorityEdges);

  console.log("Computing governance depths...");
  const govDepths = computeGovernanceDepths(entries, authorityEdges, nodeStatuses);

  console.log("Classifying signals...");
  const buckets = classifySignals(entries, authorityEdges, nodeStatuses, govDepths);

  const totalItems = Object.values(buckets).reduce(
    (sum, b) => sum + b.length,
    0
  );
  console.log(`Classified ${totalItems} work-path items across 7 buckets`);

  const stats = {
    totalNodes: entries.length,
    totalEdges: authorityEdges.length,
    totalCrossRefs: cross_references.length,
    authorityEdges,
    bucketCounts: {
      direct_contradictions: buckets.bucket1.length,
      tag_sampled_artifacts: buckets.bucket2.length,
      quarantine_triage: buckets.bucket3.length,
      unverified_high_authority: buckets.bucket4.length,
      bridge_state_mismatch: buckets.bucket5.length,
      derives_without_verifies: buckets.bucket6.length,
      orphaned_ungoverned: buckets.bucket7.length,
    },
  };

  console.log("Generating markdown report...");
  const md = emitMarkdownReport(buckets, stats, siteIndex.generated_at);

  console.log("Generating JSON report...");
  const jsonReport = {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    source_generated_at: siteIndex.generated_at,
    disclaimer:
      "Conflict labels may be artifact-class when no direct CONTRADICTS edges exist. Treat as roadmap signal, not proof.",
    stats: {
      totalNodes: stats.totalNodes,
      totalAuthorityEdges: stats.totalEdges,
      totalCrossRefs: stats.totalCrossRefs,
      contradictsEdgeCount: authorityEdges.filter((e) => e.authority === "CONTRADICTS").length,
    contradictsCrossRefCount: authorityEdges.filter(
      (e) => e.authority === "CONTRADICTS" && e.provenance === "cross_ref"
    ).length,
    contradictsTagGroupCount: authorityEdges.filter(
      (e) => e.authority === "CONTRADICTS" && e.provenance === "tag_group"
    ).length,
      bucketCounts: stats.bucketCounts,
    },
    buckets: {
      direct_semantic_contradictions: buckets.bucket1,
      tag_sampled_contradiction_artifacts: buckets.bucket2,
      quarantine_triage_candidates: buckets.bucket3,
      unverified_high_authority_nodes: buckets.bucket4,
      bridge_state_mismatch_candidates: buckets.bucket5,
      derives_without_verifies_candidates: buckets.bucket6,
      orphaned_ungoverned_nodes: buckets.bucket7,
    },
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const mdPath = path.join(OUTPUT_DIR, `graph-work-path-${timestamp}.md`);
  const jsonPath = path.join(OUTPUT_DIR, `graph-work-path-${timestamp}.json`);

  fs.writeFileSync(mdPath, md, "utf-8");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), "utf-8");

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`Direct Semantic Contradictions:  ${buckets.bucket1.length}`);
  console.log(`Tag-Sampled Artifacts:           ${buckets.bucket2.length} (P0: ${buckets.bucket2.filter((i) => i.priority === "P0").length}, P1: ${buckets.bucket2.filter((i) => i.priority === "P1").length}, P2: ${buckets.bucket2.filter((i) => i.priority === "P2").length})`);
  console.log(`Quarantine Triage:               ${buckets.bucket3.length}`);
  console.log(`Unverified High-Authority:       ${buckets.bucket4.length}`);
  console.log(`Bridge-State Mismatch:           ${buckets.bucket5.length}`);
  console.log(`Derives-Without-Verifies:        ${buckets.bucket6.length}`);
  console.log(`Orphaned / Ungoverned:           ${buckets.bucket7.length}`);
  console.log(`TOTAL WORK-PATH ITEMS:           ${totalItems}`);
  console.log("");
  console.log(`Markdown report: ${mdPath}`);
  console.log(`JSON report:     ${jsonPath}`);
}

main();

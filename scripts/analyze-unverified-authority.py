#!/usr/bin/env python3
import json, os, sys
from datetime import datetime

SNAPSHOT_PATHS = [
    "S:/self-organizing-library/context-buffer/graphs/graph-snapshot-self-organizing-library-2026-04-29-12-41-47-680.json",
    "C:/Users/seand/Downloads/graph-snapshot-2026-04-30-14-25-58-478.json",
]

SNAPSHOT = None
for p in SNAPSHOT_PATHS:
    if os.path.exists(p):
        SNAPSHOT = p
        break

if not SNAPSHOT:
    print("ERROR: No snapshot found")
    sys.exit(1)

print("=== VERIFICATION TRIAGE ===\n")
print("Using:", SNAPSHOT)

with open(SNAPSHOT, "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("nodes", [])
edges = data.get("edges", [])
print(f"Graph: {len(nodes)} nodes, {len(edges)} edges")
print("Status:", data.get("status_counts", {}))

# Filter UNVERIFIED + authorityDepth >= 70
candidates = []
for n in nodes:
    if n.get("status") != "UNVERIFIED":
        continue
    auth = n.get("authorityDepth", n.get("connectionCount", 0))
    if auth >= 70:
        candidates.append(n)

print(f"\nCandidates (UNVERIFIED, authDepth>=70): {len(candidates)}")

if not candidates:
    sys.exit(0)

# Patterns
structural_exts = [
    ".yml",
    ".yaml",
    ".json",
    ".lock",
    ".sum",
    ".mod",
    ".pbxproj",
    ".xcworkspace",
    ".xcodeproj",
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    ".npmrc",
    ".yarnrc",
    ".env",
    ".config",
]
structural_kw = [
    "lock",
    "manifest",
    "dependency",
    "dependencies",
    "build",
    "ci",
    "workflow",
    "config",
    "configuration",
    "ignore",
    "git",
    "license",
    "docker",
    "container",
    "deploy",
    "release",
    "package-lock",
    "yarn.lock",
    "package.json",
    "requirements.txt",
    "pipfile",
    "poetry.lock",
    "cargo.lock",
    "go.sum",
    "go.mod",
    "composer.lock",
    "podfile",
    "gradle",
    "maven",
    "ant",
    "makefile",
    "cmake",
    "configure",
    "autogen",
    "generated",
    "auto-generated",
    "synthetic",
]
structural_paths = [
    ".github",
    "scripts",
    "config",
    "build",
    "ci",
    "test",
    "tests",
    "spec",
    "specs",
    "fixtures",
    "mocks",
    "stubs",
    "examples",
    "sample",
    "template",
    "templates",
    "docker",
    "containers",
    "deploy",
    "deployment",
    "infra",
    "infrastructure",
    "pipeline",
    "pipelines",
    "workflows",
    "actions",
    "tasks",
    "jobs",
]
structural_tags = [
    "build",
    "ci",
    "cd",
    "continuous-integration",
    "continuous-deployment",
    "config",
    "configuration",
    "dependency",
    "dependencies",
    "manifest",
    "lockfile",
    "docker",
    "container",
    "deployment",
    "infrastructure",
    "pipeline",
    "workflow",
    "automation",
    "generated",
    "auto-generated",
    "synthetic",
    "test",
    "testing",
    "spec",
    "example",
    "sample",
    "template",
]

governance_kw = [
    "governance",
    "policy",
    "protocol",
    "framework",
    "constitution",
    "covenant",
    "charter",
    "bylaw",
    "ordinance",
    "directive",
    "guideline",
    "standard",
    "specification",
    "spec",
    "architecture",
    "design",
    "principle",
    "tenet",
    "value",
    "ethic",
    "attestation",
    "audit",
    "compliance",
    "enforcement",
    "verification",
    "validation",
    "certification",
    "approval",
    "sign-off",
    "review",
    "board",
    "committee",
    "council",
    "stewardship",
    "oversight",
    "trust",
    "trusted",
    "trustworthy",
    "transparency",
    "accountability",
    "security",
    "safety",
    "alignment",
    "ethics",
    "fairness",
    "explainability",
    "interpretability",
    "robustness",
    "privacy",
    "confidentiality",
    "integrity",
    "availability",
    "resilience",
    "reliability",
]
governance_tags = [
    "governance",
    "policy",
    "protocol",
    "framework",
    "constitution",
    "covenant",
    "charter",
    "bylaw",
    "standard",
    "specification",
    "architecture",
    "design",
    "principle",
    "tenet",
    "value",
    "ethic",
    "attestation",
    "audit",
    "compliance",
    "enforcement",
    "verification",
    "validation",
    "certification",
    "approval",
    "review",
    "stewardship",
    "oversight",
    "trust",
    "transparency",
    "accountability",
    "security",
    "safety",
    "alignment",
    "ethics",
    "fairness",
    "explainability",
    "interpretability",
    "robustness",
    "privacy",
    "integrity",
    "resilience",
    "reliability",
]

structural = []
needs_verification = []
ambiguous = []

for node in candidates:
    title = (node.get("title") or "").lower()
    tags = [t.lower() for t in node.get("tags", [])]
    repo = (node.get("repo") or "").lower()

    # Structural?
    is_structural = False
    if any(ext in title for ext in structural_exts):
        is_structural = True
    elif any(kw in title for kw in structural_kw):
        is_structural = True
    elif any(path in repo for path in structural_paths):
        is_structural = True
    elif any(t in tags for t in structural_tags):
        is_structural = True

    if is_structural:
        structural.append({"node": node, "reason": "structural pattern"})
        continue

    # Governance?
    is_governance = False
    if any(kw in title for kw in governance_kw):
        is_governance = True
    elif any(t in tags for t in governance_tags):
        is_governance = True

    if is_governance:
        needs_verification.append({"node": node, "reason": "governance pattern"})
    else:
        ambiguous.append({"node": node, "reason": "no clear pattern"})

print("\nClassification:")
print(f"  Structural (low priority): {len(structural)}")
print(f"  Needs verification (high priority): {len(needs_verification)}")
print(f"  Ambiguous (manual review): {len(ambiguous)}")

# By repo
by_repo = {}


def add_repo(node, cat):
    r = node.get("repo", "unknown")
    if r not in by_repo:
        by_repo[r] = {
            "structural": 0,
            "needs_verification": 0,
            "ambiguous": 0,
            "total": 0,
        }
    by_repo[r][cat] += 1
    by_repo[r]["total"] += 1


for item in structural:
    add_repo(item.node, "structural")
for item in needs_verification:
    add_repo(item.node, "needs_verification")
for item in ambiguous:
    add_repo(item.node, "ambiguous")

print("\nTop repositories by candidate count:")
for r, c in sorted(by_repo.items(), key=lambda x: x[1]["total"], reverse=True)[:10]:
    print(
        f"  {r}: {c['total']} total | struct:{c['structural']} need:{c['needs_verification']} ambig:{c['ambiguous']}"
    )

# Examples
if structural:
    print("\nTop 10 Structural (likely skip):")
    for i, item in enumerate(structural[:10], 1):
        n = item.node
        auth = n.get("authorityDepth", n.get("connectionCount", 0))
        print(
            f"  {i}. {n.get('id')} | {(n.get('title') or '').strip()[:50]} | {n.get('repo')} | auth:{auth}"
        )

if needs_verification:
    print("\nTop 10 Needs Verification (high priority):")
    for i, item in enumerate(needs_verification[:10], 1):
        n = item.node
        auth = n.get("authorityDepth", n.get("connectionCount", 0))
        print(
            f"  {i}. {n.get('id')} | {(n.get('title') or '').strip()[:50]} | {n.get('repo')} | auth:{auth}"
        )

# Build patch
ts = datetime.now().strftime("%Y-%m-%d")
patch = {
    "analysis_type": "verification_triage",
    "snapshot_id": data.get("snapshot_id", "unknown"),
    "created_at": datetime.now().isoformat(),
    "summary": {
        "total_candidates": len(candidates),
        "by_category": {
            "structural": len(structural),
            "needs_verification": len(needs_verification),
            "ambiguous": len(ambiguous),
        },
    },
    "proposed_tags": (
        [
            {
                "node_id": item.node["id"],
                "tags_to_add": [
                    "verification_priority:low",
                    "auto_tagged:structural",
                    f"triage_date:{ts}",
                ],
                "category": "structural",
            }
            for item in structural
        ]
        + [
            {
                "node_id": item.node["id"],
                "tags_to_add": [
                    "verification_priority:high",
                    "auto_tagged:governance",
                    f"triage_date:{ts}",
                ],
                "category": "needs_verification",
            }
            for item in needs_verification
        ]
        + [
            {
                "node_id": item.node["id"],
                "tags_to_add": [
                    "verification_priority:medium",
                    "auto_tagged:ambiguous",
                    "needs_manual_review:true",
                    f"triage_date:{ts}",
                ],
                "category": "ambiguous",
            }
            for item in ambiguous
        ]
    ),
    "files_would_be_modified": [SNAPSHOT],
    "projected_impact": {
        "structural_nodes_auto_verified": len(structural),
        "high_priority_verification_nodes": len(needs_verification),
        "remaining_ambiguous": len(ambiguous),
    },
}

# Write outputs
patch_dir = "S:/SwarmMind/context-buffer/graph-patches"
os.makedirs(patch_dir, exist_ok=True)
patch_path = os.path.join(patch_dir, f"verification-triage-patch-{ts}.json")
with open(patch_path, "w", encoding="utf-8") as f:
    json.dump(patch, f, indent=2)

report_dir = "S:/Archivist-Agent/docs/graph"
os.makedirs(report_dir, exist_ok=True)
report_path = os.path.join(report_dir, f"VERIFICATION_TRIAGE_REPORT_{ts}.md")

md = (
    f"""# Verification Triage Report — High-Authority Unverified Nodes

**Generated**: {datetime.now().isoformat()}  
**Analyzed by**: SwarmMind (dry-run)  
**Snapshot**: {data.get("snapshot_id")}

---

## Executive Summary

| Metric | Count |
|---|---|
| Unverified nodes with authorityDepth ≥ 70 | **{len(candidates)}** |
| Likely structural (low priority) | **{len(structural)}** |
| Needs verification (high priority) | **{len(needs_verification)}** |
| Ambiguous (manual review) | **{len(ambiguous)}** |

---

## Classification Logic

- **Structural**: File names/tags indicate configs, builds, CI, dependencies, licenses, etc. These don't need content verification.
- **Needs verification**: Titles/tags indicate governance, protocols, policies, frameworks, specs — must be verified.
- **Ambiguous**: No clear pattern; requires human judgment.

---

## Repository Breakdown (Top 10)

"""
    + "\n".join(
        [
            f"| {repo} | {c['total']} | {c['structural']} | {c['needs_verification']} | {c['ambiguous']} |"
            for repo, c in sorted(
                by_repo.items(), key=lambda x: x[1]["total"], reverse=True
            )[:10]
        ]
    )
    + """

---

## Top Structural Candidates (Low Priority)

These are likely config/build files that can be auto-tagged as `verification_priority:low`.

"""
    + "\n".join(
        [
            f"- {item.node['id']}: {(item.node.get('title') or '').strip()[:50]} ({item.node.get('repo')}) authorityDepth:{item.node.get('authorityDepth', item.node.get('connectionCount', 0))}"
            for item in structural[:20]
        ]
    )
    + """

---

## Top High-Priority Verification Candidates

These are governance/docs that should be prioritized for verification.

"""
    + "\n".join(
        [
            f"- {item.node['id']}: {(item.node.get('title') or '').strip()[:50]} ({item.node.get('repo')}) authorityDepth:{item.node.get('authorityDepth', item.node.get('connectionCount', 0))}"
            for item in needs_verification[:20]
        ]
    )
    + """

---

## Patch Preview

If approved, tags would be added:

| Category | Tag | Purpose |
|---|---|---|
| Structural | verification_priority:low | Suppress verification alerts |
| Governance | verification_priority:high | Mark for priority verification |
| Ambiguous | verification_priority:medium, needs_manual_review:true | Flag for human triage |

**Files modified**: Only the graph snapshot (backup if apply is run)

---

## Next Steps

1. Review report and candidate lists
2. If classification looks correct, run: `python analyze-unverified-authority.py --apply`
3. After apply, run lane-worker to propagate tags
4. Monitor verification queue — should be better prioritized

---

**Confidence**: MEDIUM — heuristics based on common patterns; spot-check a sample before full apply.
"""
)

with open(report_path, "w", encoding="utf-8") as f:
    f.write(md)

print("\n=== OUTPUTS ===")
print("Patch preview:", patch_path)
print("Report:", report_path)
print(f"\nCandidates: {len(candidates)} analyzed")
print(f"  Structural: {len(structural)}")
print(f"  Needs verification: {len(needs_verification)}")
print(f"  Ambiguous: {len(ambiguous)}")
print("\nIf heuristics look correct, run with --apply to tag nodes.")

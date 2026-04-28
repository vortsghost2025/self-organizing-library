# Nexus Graph Explanation Layer

**Purpose:** Make the Nexus Graph readable to outside viewers and future agents without requiring prior system knowledge, while clearly preventing misinterpretation of graph visibility as authority.

**Scope:** Documentation + UI plan for `/graph` page enhancements. No runtime graph changes.

---

## 1. Plain-Language Graph Explanation

### What Nodes Mean
Each node is an **artifact** — a document, file, message, test result, or runtime event that has been indexed and assigned a SHA-256 content hash. Nodes represent *what exists*, not *what is true*.

- **Shape:** Circle (default) or hex (special status)
- **Size:** Approximate artifact size (larger = more content)
- **Color:** Domain/repository of origin (see legend)
- **Label:** File name or short title (truncated for readability)

### What Edges Mean
Edges represent **relationships** discovered in the artifact content (cross-references, citations, dependencies, contradictions).

- **Solid:** Direct reference (file A mentions file B)
- **Dashed:** Implicit relationship (same tags, same author, temporal proximity)
- **Thickness:** Relationship strength (number of shared references)
- **Arrow direction:** Points from referencing → referenced artifact

### What Colors Mean
Colors map to **repository domains** (not authority):

| Color | Domain | Example |
|-------|--------|---------|
| Blue (`--primary`) | Governance/Constitution | COVENANT.md, GOVERNANCE.md |
| Teal (`--secondary`) | Papers/Theory | Paper 1–7, analysis docs |
| Green (`--success`) | Library/Verification | Truth‑routing, test results |
| Yellow (`--warning`) | SwarmMind/Execution | Agent traces, execution logs |
| Orange (`--error`) | Kernel/Runtime | Benchmarks, performance data |
| Gray (`--muted`) | External/Archive | Public references, third‑party docs |

### What Node Statuses Mean
Status is **verification state**, not endorsement:

| Status | Meaning | Example |
|--------|---------|---------|
| **VERIFIED** | Proven by runtime evidence (test passed, signature validated, claim backed by artifact) | A test result showing guardWrite enforcement |
| **CONFLICTED** | Contradiction detected (two sources disagree, NFM triggered) | Same constraint described differently in two repos |
| **QUARANTINED** | Not yet verified (awaiting evidence, signature check, or lane validation) | New proposal awaiting Archivist signature |
| **DEPRECATED** | Superseded by later artifact (older version) | v1 of a paper after v2 published |
| **UNKNOWN** | No relationship data (orphan node) | Indexed file with no cross-references |

### What Entry Points Mean
Entry points are **curated starting views** into the graph, not "important" nodes. They are lenses:

- **Top Authority:** Nodes from highest‑authority lanes (Archivist, Kernel) — shows constitutional root
- **Contradictions:** Nodes involved in CONFLICTED edges — shows learning opportunities
- **Unenforced Claims:** VERIFIED nodes lacking enforcement_bridge declarations
- **Governance Core:** Nodes tagged with constitutional/ governance semantics
- **Active Bridges:** Nodes with enforcement pathways declared
- **Authority Mismatch:** Nodes where lane‑authority doesn't match edge direction
- **Evidence Layer:** Nodes that serve as evidence for other nodes
- **Application Adjacent:** Nodes related to runtime/application artifacts
- **Historical Layer:** Deprecated/archived nodes preserved for context

---

## 2. Interpretation Warnings

**🚨 Critical: Graph visibility ≠ authority. Seeing a node does not mean it is:**

- **True:** Graph displays claims, not ground truth. Every node is someone's assertion.
- **Authoritative:** Connected nodes are not automatically valid. A cited paper is not law.
- **Enforced:** VERIFIED means evidence exists; it does NOT mean the constraint is active in runtime.
- **Approved:** Signed messages are authenticated, not endorsed. Signature proves origin, not correctness.
- **Constitutional:** Graph‑central nodes are simply highly cross‑referenced; they are not constitutional layer.
- **Ratified:** Simulation or test artifacts are not policy. "Persistent" ≠ "ratified."

**The graph is a map of what the system *claims*, not what the system *enforces*.**

---

## 3. Guided Reading Flow

### Beginner Mode: Big Picture Only
**Goal:** Orient without overwhelm.

1. Start at **Top Authority** entry point — see what the system thinks is most central
2. Hover top 5 nodes — read titles only
3. Notice color clusters — which domains dominate?
4. Stop. That's the 30‑second overview.

### Governance Mode: Authority/Evidence/Contradiction
**Goal:** Understand decision lineage.

1. Enter via **Contradictions** entry point — locate unresolved tensions
2. For each conflicted node, inspect **evidence links** → follow to VERIFIED evidence nodes
3. Jump to **Active Bridges** — see where enforcement pathways exist
4. Check **Authority Mismatch** — are edges crossing lane boundaries incorrectly?
5. End at **Governance Core** — see constitutional anchors

### Repo Mode: Project‑by‑Project Topology
**Goal:** Explore a single codebase's footprint.

1. Filter graph by **domain color** matching the repo
2. Identify **hub nodes** (largest, most connected)
3. Follow edges inward/outward to see dependencies
4. Watch for **QUARANTINED** nodes within that repo — unverified claims
5. Note **DEPRECATED** nodes — old architecture still present

### Risk Mode: Problem Surfacing
**Goal:** Find what's broken or risky.

1. Start at **Contradictions** (red edges) — visible conflicts
2. Switch to **Unenforced Claims** — VERIFIED but without enforcement bridge
3. Add **QUARANTINED** nodes — awaiting evidence
4. Intersect all three sets → high‑priority items
5. For each, read **Node Detail → "Why this matters"** field

### Agent Mode: What Should I Inspect Next?
**Goal:** Autonomous navigation heuristics.

1. If node is **VERIFIED** and **enforced** → low priority (already good)
2. If node is **VERIFIED** but **not enforced** → check `enforcement_bridge` presence
3. If node is **CONFLICTED** → follow contradiction edges to both sides, compare evidence quality
4. If node is **QUARANTINED** → check `evidence_path`; if missing → flag as NFM‑019 candidate
5. If node is **DEPRECATED** → verify no active edges still point to it (zombie reference)

---

## 4. UI Additions (Proposed)

### A. "What am I looking at?" Panel (Fixed, top‑left)
Shows current view type (entry point + filters) in plain language.
```
You are viewing: Top Authority entry point
Showing: 127 nodes, 1,042 edges
Colors: Blue=governance, Green=library, Yellow=swarmmind, Orange=kernel
Click any node for details. Hover for full label.
```

### B. Enhanced Legend (Sidebar or modal)
Static legend with color ↔ domain mapping, status ↔ meaning table, edge‑type key.

### C. Node Detail Explanation (Right panel)
When a node is selected, show:

```
Title:          [node.title]
Repository:     [node.repo]
Artifact Type:  [paper|code|test|message|evidence]
Status:         [VERIFIED|CONFLICTED|QUARANTINED|DEPRECATED|UNKNOWN]
Authority:      [Constitutional|Operational|Theoretical|Historical|Evidence|Application Adjacent]
Enforcement:    [Enforced|Verified|Partial|Documented Only|Contradicted|Obsolete]
Evidence:       [links to supporting artifacts]
Contradictions: [list of conflicting node IDs]
Why this matters: [short plain-English explanation]
⚠️ Interpret carefully: [specific caution about this node's context]
```

### D. Entry‑Point Descriptions (Tooltip or inline)
Each entry‑point button gets a one‑sentence tooltip explaining *what you'll find* when you click it.

### E. Artifact Type Badges
Small pill badges on nodes: `paper`, `code`, `test`, `message`, `log`, `evidence`, `nfm`.

### F. Meaning‑Layer Toggles with Descriptions
Current toggles: Governance, Operational, Theoretical, Historical, Evidence, Application Adjacent.
Add short description under each toggle:
- **Governance:** Constitutional constraints, policy, ratification artifacts
- **Operational:** Day‑to‑day execution, agent behavior, runtime decisions
- **Theoretical:** Papers, invariants, design documents (not yet implemented)
- **Historical:** Superseded or deprecated items (preserved for audit)
- **Evidence:** Items that prove or disprove claims elsewhere
- **Application Adjacent:** Runtime artifacts that aren't core governance

### G. First‑Time Visitor Guide (Overlay)
Modal on first visit to `/graph`:
1. "This is a map of *claims*, not facts" (warning)
2. Quick legend (colors = repos, not authority)
3. "Try this: click 'Top Authority', then hover the largest node"
4. "Then click that node to see its detail card"
5. Dismissible, with "Show again next time" checkbox

---

## 5. Entry Point Explanations

| Entry Point | What It Shows | Why It Matters |
|-------------|---------------|----------------|
| **Top Authority** | Nodes from Archivist + Kernel repos (highest lane authority) | See what the constitutional root references |
| **Contradictions** | Nodes with CONTRADICTS edges (both directions) | Where the system knows it disagrees with itself |
| **Unenforced Claims** | VERIFIED nodes lacking `enforcement_bridge` declarations | Proven but not activated — gap between evidence and action |
| **Governance Core** | Nodes tagged `constitutional`, `policy`, `ratification` | The "law" layer that all lanes must respect |
| **Active Bridges** | Nodes with `bridge_state: enforced` or `verified` | Where evidence → enforcement pathways exist |
| **Authority Mismatch** | Edges where child has higher lane authority than parent | Potential hierarchy violations |
| **Evidence Layer** | Nodes cited as `evidence_path` by ≥3 other nodes | High‑impact proof artifacts |
| **Application Adjacent** | Nodes related to runtime/application (config, schemas, APIs) | Bridge between theory and execution |
| **Historical Layer** | Nodes with `bridge_state: obsolete` or `deprecated` | What changed, what was superseded |

---

## 6. Node Detail Card Template

Required fields (all must be present for consistency):

```typescript
interface NodeDetail {
  title: string;                    // Human‑readable name
  repo: string;                     // Source repository (e.g., "Archivist-Agent")
  domain: string;                   // Color group (governance, library, swarmmind, kernel, external)
  artifact_type: "paper" | "code" | "test" | "message" | "evidence" | "log" | "nfm";
  status: "VERIFIED" | "CONFLICTED" | "QUARANTINED" | "DEPRECATED" | "UNKNOWN";
  authority_layer: "constitutional" | "operational" | "theoretical" | "historical" | "evidence" | "application_adjacent" | "unknown";
  enforcement_status: "enforced" | "verified" | "partial" | "documented_only" | "contradicted" | "obsolete" | "unknown";
  evidence_links: string[];         // Array of artifact paths that support this node
  contradictions: string[];         // Node IDs that conflict with this one
  why_this_matters: string;         // Plain‑English: why should you care?
  safe_interpretation_note: string; // e.g., "This is a simulation artifact, not deployed policy"
  last_updated: string;             // ISO timestamp of last content change
  signatures: { lane: string, key_id: string, timestamp: string }[];
}
```

**Display order in UI:**
1. Title + repo (prominent)
2. Artifact type + status badges
3. Authority layer + enforcement status
4. Why this matters (readable, not technical)
5. Evidence links (clickable)
6. Contradictions (if any, with warning styling)
7. Safe interpretation note (caution box)
8. Metadata (last updated, signatures)

---

## 7. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Large text mode** | All text scales with browser zoom; no fixed‑pixel text in graphs (use `rem` units) |
| **High contrast mode** | Respect `prefers-contrast: more`; use darker borders, higher contrast ratio for status badges |
| **Keyboard navigation** | Tab‑able node selection; Enter/Space to open detail; Escape to close; arrow keys to pan graph |
| **Color is not the only signal** | Status badges include text labels (`VERIFIED`, `CONFLICTED`); shapes differentiate node types; tooltips on hover/focus |
| **Readable legends** | Legend table includes both color swatch and text label; placed in sidebar (not overlay) |
| **Reduced motion** | Graph animations respect `prefers-reduced-motion: reduce`; no auto‑panning, static layout on load |
| **Screen reader** | Nodes have `aria-label` containing title, status, repo; edges described as "connects X to Y" |
| **Focus visible** | `focus-visible: outline-2 outline-offset-2` on interactive elements |
| **Skip to content** | Existing `skip-to-content` link works for graph page |

---

## 8. Non‑Goals (Out of Scope)

- **No authority changes** — Graph remains descriptive only; does not alter lane authority or ratification outcomes.
- **No graph runtime mutation** — Structure and layout remain as computed by site‑index; no live graph editing.
- **No automatic ratification** — Graph visibility does not trigger any governance action.
- **No enforcement claims** — Status badges indicate verification state, not runtime enforcement.
- **No Phase 2 extraction** — This is documentation/UI only; no new data extraction or NFM classification engine integration yet.
- **No schema changes** — All node fields already exist; this is presentation layer only.

---

## Change Summary

| Artifact | Type | Description |
|----------|------|-------------|
| `docs/graph/NEXUS_GRAPH_EXPLANATION_LAYER.md` | New documentation | Full explanation plan for graph UX |
| `src/app/graph/page.tsx` | UI enhancement (future) | Will implement "What am I looking at?" panel, enhanced legend, node detail template, entry‑point tooltips, first‑time guide |
| `src/components/GraphExplanation.tsx` | New component (future) | Reusable explanation panels, legend, guided tour |
| `public/guides/nexus-graph-primer.pdf` | Optional future export | One‑page printable guide |

**Next step:** Implement UI additions in `/graph` page after documentation review.

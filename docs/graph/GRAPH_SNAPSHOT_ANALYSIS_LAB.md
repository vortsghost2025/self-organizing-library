# Graph Snapshot Analysis Lab — Detailed Design

**Phase 0:** Documentation only  
**Goal:** Turn visual graph states into evidence-linked, comparable, annotatable snapshots.

---

## 1. Purpose

This is not screenshot storage. It is an **analysis surface** for turning graph states into evidence-linked observations that can be:
- captured reproducibly
- compared across time and filters
- annotated with human insight
- handed off to Library for verification
- connected back to papers, repos, commits, and lane cycles

---

## 2. Problem Statement

The Nexus Graph now shows meaningful structure through meaning layers, entry points, and repo filters. However, analysis is still manual:
- Sean can see visual patterns (clusters, gaps, contradictions)
- Those patterns are hard to capture, compare, and express as verifiable artifacts
- No structured way to freeze "what my eyes are seeing" so lanes can verify "what my brain noticed"

We need a repeatable **capture → annotate → send → verify** workflow.

---

## 3. Snapshot Object Model

### Single Snapshot

```typescript
interface GraphSnapshot {
  snapshot_id: string;            // UUID or semantic ID
  created_at: string;             // ISO 8601
  created_by: string;             // "sean" or lane identifier
  graph_data_hash: string;        // SHA-256 of graph dataset used
  site_index_hash?: string;       // SHA-256 of site-index at capture time
  repo_filter: string[];          // e.g. ["self-organizing-library", "Archivist-Agent", ...]
  type_filter?: string[];         // ["paper","code","test",...]
  entry_point_filter?: string;    // "contradictions", "top-authority", etc.
  meaning_layers_enabled?: string[]; // ["structure","conflicts","verification",...]
  density_mode?: "overview" | "explore" | "focus";
  zoom_mode?: "region" | "node";
  visible_node_cap?: number;      // cap applied during capture
  visible_node_count: number;     // how many nodes actually visible
  visible_edge_count: number;     // how many edges actually visible
  total_available_nodes?: number; // total nodes matching filters (pre-cap)
  total_available_edges?: number; // total edges matching filters
  status_counts?: {
    verified: number;
    unverified: number;
    conflicted: number;
    quarantined: number;
  };
  selected_node_ids?: string[];   // nodes explicitly selected by user
  selected_edge_ids?: string[];   // edges explicitly selected
  screenshot_path?: string;       // PNG path if captured
  notes_path?: string;            // Markdown notes path if saved
  linked_papers: string[];        // e.g. ["paper-3", "rosetta-stone"]
  linked_repos: string[];         // repository names
  linked_commits: string[];       // commit SHAs
  linked_lane_messages: string[]; // task IDs or message IDs
  linked_cycles: string[];        // work cycle identifiers
  interpretation_status: "observation" | "hypothesis" | "verified" | "rejected" | "superseded";
}
```

---

## 4. Snapshot Types

Define common use‑case templates:

- **full graph baseline** — all repos, no filters; used as reference state.
- **repo‑focused snapshot** — one repo selected, others excluded.
- **entry‑point snapshot** — specific entry point active (e.g., Contradictions).
- **meaning‑layer snapshot** — specific layer combination (e.g., Governance Depth only).
- **pre/post‑index‑regeneration** — same filters, different index version.
- **pre/post‑graph‑mapper‑patch** — same index, different graph generation rules.
- **paper‑mapping snapshot** — filters set to trace a paper’s concept across repos.
- **lane‑cycle snapshot** — captured at different phases of a lane’s work cycle.
- **deployment snapshot** — captured after a deployment to verify graph stability.
- **contradiction snapshot** — focused on conflict clusters.

---

## 5. Snapshot Set Model

A **Snapshot Set** captures the *same graph lens* across multiple variable parameters to enable comparative analysis.

```typescript
interface SnapshotSet {
  snapshot_set_id: string;
  created_at: string;
  created_by: string;
  purpose: string;                 // e.g., "Compare repo coverage", "Layer sweep"
  base_graph_data_hash: string;    // graph dataset version
  base_site_index_hash?: string;   // site-index version
  fixed_parameters: {
    density_mode?: string;
    entry_point_filter?: string;
    meaning_layers_enabled?: string[];
    type_filter?: string[];
    zoom_mode?: string;
    visible_node_cap?: number;
  };
  variable_parameter: "repo_filter" | "entry_point_filter" | "meaning_layers_enabled" | "density_mode";
  captures: Array<{
    snapshot_id: string;
    variable_value: string;        // e.g. repo name, layer name, density value
    visible_node_count: number;
    visible_edge_count: number;
    total_available_nodes?: number;
    total_available_edges?: number;
    status_counts: { verified: number; unverified: number; conflicted: number; quarantined: number };
    screenshot_path?: string;
    snapshot_json_path: string;
  }>;
  comparison_notes?: string;
  suspected_mapping_issues?: string[];
  linked_papers: string[];
  linked_repos: string[];
  linked_commits: string[];
  interpretation_status: "observation" | "hypothesis" | "verified" | "rejected" | "superseded";
}
```

**Variable parameter choices:**
- `repo_filter`: same lens across multiple repos → see which repos are rich/silent on a topic
- `entry_point_filter`: same filters, switch entry points → compare what each entry point surfaces
- `meaning_layers_enabled`: toggle layers → see layer‑specific structure
- `density_mode`: same filters at overview/explore/focus → see scale effects

---

## 6. Compare Model

When comparing two snapshots or a snapshot set:

**Metrics:**
- `node_count_delta` — net change in visible nodes
- `edge_count_delta` — net change in visible edges
- `status_count_delta` — changes per status (verified±, conflicted±, quarantined±)
- `added_nodes` — node IDs present in B but not A
- `removed_nodes` — node IDs present in A but not B
- `added_edges` — new relationships
- `removed_edges` — disappeared relationships
- `changed_statuses` — nodes whose status flipped
- `authority_depth_delta` — changes in governance layer depth
- `bridge_state_delta` — changes in enforcement bridge states
- `contradiction_cluster_delta` — size/location of conflict clusters
- `verification_cluster_delta` — evidence network changes
- `paper_mapping_delta` — which papers appear/disappear
- `repo_mapping_delta` — which repos gain/lose visibility
- `density_change` — how overall graph density shifted

**Interpretive guidance:**
- Sudden node count increase → index expansion or new category inclusion
- Edge density increase → new cross-references discovered
- Contradiction cluster growth → unresolved tensions accumulating
- Authority depth shifts → governance layer reclassification
- Bridge state changes → new enforcement pathways (or broken links)
- Repo disappearance in set → that repo may be under‑mapped conceptually

---

## 7. Human Interpretation Workflow

1. **Capture snapshot** — set graph filters + meaning layers, optionally select nodes.
2. **Write observation** — free‑text note: what pattern do you see?
3. **Tag related artifacts** — link to papers, repos, commits, lane messages.
4. **Choose status** — `observation` (neutral record) or `hypothesis` (tentative claim).
5. **Send to Library for verification** — hand off snapshot JSON as evidence artifact.
6. **Library verifies** — checks graph data hash, linked artifacts, supports claim.
7. **Promote only with evidence** — becomes `verified` if data backs it; else `rejected`/`quarantined`.
8. **Never treat visual pattern as authority** — until lanes approve.

---

## 8. Agent Verification Workflow

When Library receives a snapshot for verification:

1. **Read snapshot metadata** — validate required fields and version.
2. **Verify graph data hash** — ensure graph dataset matches known good state.
3. **Verify site index hash** — if provided, confirm site-index integrity.
4. **Check linked artifacts** — each `linked_*` reference must exist and be accessible.
   - `linked_papers` → confirm file exists in repo
   - `linked_commits` → check Git commit exists
   - `linked_lane_messages` → verify signature and schema
5. **Classify visual claim**:
   - Concrete structural change with data support → `verified`
   - Vague or unsupported → `quarantined` (needs more evidence)
   - Contradicted by known evidence → `rejected`
   - Superseded by newer snapshot → `superseded`
6. **Output decision** — create a Library response message (type `response`, task_kind `verification`) with `verdict: "approved" | "rejected" | "amended" | "quarantined"` and reasoning.
7. **If verified**, the insight may become:
   - Evidence in a Governance proposal
   - Input to a paper/work cycle
   - Artifact in a lane message (e.g., `graph-observation-<id>.json`)

---

## 9. UI Plan

**On `/graph` page:**
- **Capture Snapshot** button — opens modal with fields: title, notes, interpretation status, and checkboxes to include screenshot
- **Capture Set…** submenu:
  - "Capture all repo filters" — iterates repo_filter over all known repos
  - "Capture all entry points" — iterates entry_point_filter
  - "Capture all meaning layers" — iterates meaning_layers_enabled combos
- **Export Snapshot JSON** — download `.snapshot.json` file
- **Export Snapshot Set ZIP** — if screenshots included, bundle all JSONs + PNGs
- **Add Note** panel — free‑text editor, saved to `notes_path`
- **Interpretation status** selector — observation/hypothesis/verified/rejected/superseded
- **Gallery** page (`/graph/snapshots`) — lists committed snapshots and snapshot sets in `docs/graph/snapshots/`
- **Compare Snapshots** view — select two items (or two sets) and show delta table
- **Paper/Repo/Lane‑Cycle tags** — multi‑select to link analysis to specific works
- **"Send to Library for verification"** — creates a signed task with `evidence_path` pointing to snapshot JSON(s)

**Placement:** Snapshot controls as a fixed toolbar on the graph page; gallery accessible via main navigation link.

---

## 10. Storage Plan

**Safe paths:**
- `docs/graph/snapshots/` — curated example snapshots (committed to repo, public)
- `data/graph-snapshots/` — structured metadata if site needs a JSON index
- User local `~/graph-snapshots/` for private drafts (not committed)

**Naming convention:**
```
docs/graph/snapshots/YYYY-MM-DD/<snapshot-id>.json
docs/graph/snapshots/YYYY-MM-DD/<snapshot-id>.png
docs/graph/snapshots/YYYY-MM-DD/<snapshot-id>.md
```

**Constraints:**
- No raw secret paths (avoid leaking `/home/user/.ssh`).
- No PHI.
- No API keys.
- No recursive file ingestion (keep list explicit).

---

## 11. Safety Boundaries

Critical reminders (to be displayed in UI near capture controls):

- **Snapshot does not prove truth** — it only records what was visible at a moment.
- **Screenshot does not prove authority** — visual salience ≠ constitutional validity.
- **Graph centrality does not prove enforcement** — a large cluster may be entirely theoretical.
- **Visual similarity does not prove continuity** — two clusters that look alike may represent different concepts.
- **Annotation is hypothesis until verified** — human observation becomes evidence only after lane verification.
- **Graph inclusion does not grant authority** — being in the graph is necessary for discussion but not sufficient for governance.
- **Snapshot comparison does not authorize code/runtime changes** — it is an analytical tool only.

---

## 12. Implementation Phases

**Phase 0:** Documentation only (this document).

**Phase 1:** Export current graph state as JSON
- Add "Capture Snapshot" button
- Serialize current graph state into `GraphSnapshot` object
- Download `.snapshot.json`

**Phase 2:** Add client‑side PNG capture
- "Capture PNG" button (canvas → blob)
- Optionally auto‑associate PNG with snapshot JSON

**Phase 3:** Snapshot Gallery
- Simple listing page `/graph/snapshots`
- Each snapshot has a detail page with metadata and thumbnail

**Phase 4:** Compare Snapshots
- Select two snapshots (or two snapshot sets)
- Compute delta metrics (node/edge counts, status changes, added/removed items)
- Visual diff highlighting

**Phase 5:** Paper/Repo/Lane‑Cycle Linking
- Add tagging UI to snapshot capture
- Store linked identifiers in snapshot metadata

**Phase 6:** Library verification handoff
- "Send to Library for verification" creates a signed task
- Library agent processes snapshot as evidence
- Verdict returned and recorded

---

## 13. Non‑Goals

- No graph authority changes.
- No automatic ratification.
- No enforcement claims.
- No deletion/cleanup of existing graph data.
- No recursive repository scan.
- No Phase 2 extraction (NFM classification engine).
- No runtime graph mutation in this pass.
- No assumption that visual pattern equals truth.

---

## 14. Success Criteria

- Sean can capture what he visually sees in a structured, reproducible format.
- Library can verify what the snapshot claims about the graph.
- Snapshots can be compared across repo filters, entry points, and meaning layers.
- Graph evolution can be linked back to specific papers, repos, commits, and lane cycles.
- Visual insight becomes auditable without becoming authority.

---

**Next step after approval:** Implement Phase 1 (`GraphSnapshot` interface + export button) and design `src/lib/graph-snapshot-schema.ts`.

**Commit message template:**
```
docs: plan graph snapshot analysis lab
```


---

**Remember:** The graph shows structure; snapshots let us study structural change.
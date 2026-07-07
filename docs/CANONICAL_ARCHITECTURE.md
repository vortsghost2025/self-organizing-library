# Canonical Architecture

**Purpose:** Define the core entities, their relationships, and the authoritative architectural model for the Deliberate Ensemble Library (WE4FREE system). This document canonicalizes the architecture so that the remaining contradictions visible from the front door are resolved by reference.

**Status:** Active — supersedes ad-hoc references to "lanes," "rigs," "repos," and "agents" in earlier documents where they conflict. Backed by the evidence-indexed map at `docs/FULL_ARCHITECTURE_MAP.md` and `data/architecture-index.json`.

**Date provenance:** Git/GitHub timestamps in this repository may reflect repo restore after deletion (16 repos were deleted by an agent and recovered). Dates drawn from git or GitHub API are labeled accordingly. The Feb 26, 2026 YouTube transcript is the primary timeline anchor outside the damaged repo history. See `docs/FULL_ARCHITECTURE_MAP.md` §header for the full 8-label date provenance system.

---

## 1. Core Entity Definitions

Every entity in the system falls into exactly one of the six categories below. References in any document should use the canonical term and meaning.

| Entity | Definition | Example | Counterexample |
|--------|------------|---------|----------------|
| **lane** | A governance role with defined authority boundaries, responsibilities, and communication protocols. A lane is a *logical identity*, not a physical deployment. | Archivist (governance root, authority 100) | "Archivist repo" — the repo is not the lane |
| **rig** | A deployment or runtime unit — the physical or virtual environment where a lane's agent or agents execute. One lane may span multiple rigs; one rig may host multiple lanes. | `gastown-rig` (Federation VPS deployment) | "Archivist lane" when describing a server |
| **repo** | A source artifact repository (GitHub) that a lane uses for its code, configuration, governance documents, and evidence artifacts. | `github.com/vortsghost2025/Archivist-Agent` | "Archivist repo is the lane" — conflation |
| **agent** | An active process that operates within a lane's authority boundaries. Multiple agents may serve one lane (e.g., local + headless). | A running `opencode` session serving Library lane | An idle GitHub repo with no running process |
| **authority** | A numeric (100, 80, 70, 60) or ordinal measure of decision power within the constitutional hierarchy. Higher authority can block or override lower authority within constitutional bounds. No authority can override the Constitution. | Archivist (100) can block a cross-lane write | "Authority 100 means total control" — no, bounded by constitution |
| **evidence artifact** | A file, log, test result, or paper section that supports or refutes a specific claim. Must have a `file:line` reference per Law 2. | `nfm-table.md:82` (NFM-002 documentation) | An undocumented claim without file:line |

### 1.1 Relationship Rules

```
A lane HAS one or more repos
A lane HAS one or more rigs (deployment-specific)
A rig RUNS one or more agents
An agent SERVES exactly one lane (at a time)
A lane HAS exactly one authority number (ordinal within constitutional hierarchy)
A lane PRODUCES evidence artifacts
An evidence artifact SUPPORTS or REFUTES a claim
```

### 1.2 Common Conflation Patterns (Resolved)

| Conflation | Resolution |
|------------|------------|
| "Archivist lane" used interchangeably with "Archivist repo" | The lane is the governance role; the repo is the source artifact |
| "SwarmMind agent has authority 80" | The *lane* has authority 80; the agent acts within that authority boundary |
| "Library rig" meaning "the deployment where Library runs" | Acceptable shorthand but should prefer "Library lane's rig" for clarity |
| "The Kernel lane repo" | Kernel's repo holds Kernel's source; Kernel (the lane) is the governance role |
| "Git origin date = project birth date" | Git/GitHub timestamps may reflect restore after 16-repo deletion; dates are provenance-labeled |

---

## 2. Canonical Model: Full Ecosystem

The WE4FREE system spans an 8-tier classification. This supersedes the earlier 4-lane-only model.

### 2.1 Tier Classification

| Tier | Name | Includes | Count |
|------|------|----------|-------|
| -1 | Ancestor / Source Epoch | Archived precursors — not current runtime, but genealogy-critical | 9 archive directories (~194K files) |
| 0 | Papers | Theoretical foundations (Rosetta Stone Papers A–F) | 6 papers (5 PDF + 1 markdown) |
| 1 | Core Governance Lanes | Archivist, SwarmMind, Kernel, Library | 4 repos |
| 2 | Sidecar / Observability | Control Plane, Lattice Deck, Research Intake | 3 repos |
| 3 | Domain Lanes | kucoin-lane, solana-launch-lane | 2 repos |
| 4 | Spinoff / Experimental | Federation, Genesis-Kernel-World-Sim | 2 repos |
| 5 | Tooling / Mapping | WE-Cartographer (artifact, not repo) | N/A |
| 6 | Historical / Unrelated | Repos unrelated to governance architecture | 21 GitHub-only repos |

### 2.2 Core Governance Lanes (Tier 1)

| Lane | Authority | Role | Responsibility | Limits |
|------|-----------|------|----------------|--------|
| **Archivist** | 100 | Governance root | Ratifies proposals, maintains canonical record, enforces constitutional hierarchy | Cannot override constitution; cannot regenerate another lane's identity (AL-1) |
| **SwarmMind** | 80 | Execution engine | Generates proposals, runs improvement loops, executes tasks | Cannot enforce schema compliance on other lanes (AL-2) |
| **Kernel** | 70 | Infrastructure | System health, cross-lane coordination, message routing | Cannot modify governance files |
| **Library** | 60 | Verification | Proof-of-evidence gatekeeper, runs all checks before ratification | Does not archive or generate proposals; lane boundary is strict |

### 2.3 Governance Hierarchy

```
Constitution (COVENANT.md, GOVERNANCE.md, BOOTSTRAP.md)
    ↓ (supreme, not overrideable by any lane)
Human Operator (Position 1, highest drift risk)
    ↓
Archivist (Authority 100)
    ↓
Kernel (Authority 70)
    ↓
SwarmMind (Authority 80 — note: operational authority not ordinal)
    ↓
Library (Authority 60)
```

Authority numbers are not strictly ordinal in execution — SwarmMind (80) executes tasks that Kernel (70) routes. The hierarchy is constitutional, not operational. Archivist (100) can block any action; no lane can block Archivist except the constitution or operator.

### 2.4 Domain Lanes (Tier 3)

| Lane | Authority | Role | Function |
|------|-----------|------|----------|
| **kucoin-lane** | 60 | Domain execution | KuCoin trading automation, margin bot operations. First commit merges from `kucoin-margin-bot` + `Deliberate-AI-Ensemble` |
| **solana-launch-lane** | 60 | Domain execution | Solana blockchain launch automation |

Domain lanes operate at Library authority level (60) but within their own domain scope. They do not participate in core governance.

### 2.5 Sidecar Infrastructure (Tier 2)

Sidecars are supporting infrastructure that observe, route, or display governance activity. They are not lanes — they have no authority, no proposal rights, and no ratification power.

| Sidecar | Function |
|---------|----------|
| **Control Plane** | Cross-lane coordination, surface monitoring, 3-surface doctrine enforcement. Sidecar — not a lane. Monitors 6 lanes across 3 surfaces. SCOPE_BOUNDARY.md explicitly defines it as non-lane. |
| **Lattice Deck** | Observability/display surface. Renders governance state, lattice status, provenance badges. NOT a lane. Defined by DISPLAY_AND_PROVENANCE_CONTRACT.md. |
| **Research Intake** | Quarantine-first research pipeline. Ingests external docs, RFQs, papers. Not a lane — routing infrastructure. Defined by AGENTS.md. |

---

## 3. Relationship to Other Models

### 3.1 Historical Model: Three-Lane Constitutional AI Governance

**Status:** Superseded. Referenced for historical continuity only.

The three-lane model (Archivist 100, SwarmMind 80, Library 60) was the system's architecture before Kernel was added and before cryptographic identity attestation was implemented. It is fully documented in `THREE_LANE_COMPLETE_SUMMARY.md`.

**Differences from canonical:**
- No Kernel lane (infrastructure routing was Archivist's responsibility)
- No cryptographic identity (file-based queue coordination)
- No trust store (signatures were advisory)
- Three repos instead of four

**Continuity:** The three-lane organism analogy (brain/muscle/memory) remains useful for explaining the core division of labor but is incomplete without Kernel and the cryptographic identity layer.

### 3.2 Deployment Model: Three Surfaces

The system operates across three surfaces. This supersedes the earlier five-rig gastown model.

| Surface | Location | Hosted Lanes | Role |
|---------|----------|--------------|------|
| **Windows cockpit** | S: drive | All 4 governance lanes + domain lanes + sidecars | Primary development, verification, runtime |
| **Ubuntu headless** | `100.95.40.99`, 7 repos mirrored at `~/agent/repos/` | Library, Kernel | Continuous monitoring, inbox processing, relay |
| **GitHub canonical** | `github.com/vortsghost2025` | 39 public repos | Canonical source of truth for all repos |

### 3.3 Two-Timeline Model

The WE4FREE system has two parallel timelines that must be distinguished:

| Timeline | What It Records | Evidence Type |
|----------|----------------|---------------|
| **Conceptual/origin** | When code was written, papers authored, demos produced | File timestamps, video transcripts, operator testimony, archive file contents |
| **Git/export/runtime** | When repos were created and commits recorded | `git log`, GitHub API |

These diverge because the system evolved through local experimentation before being decomposed into public git repos, and because 16 repos were deleted and restored. The git timeline alone undercounts system age by ~2 months.

#### Conceptual Phases

| Phase | Date Range | What Happened |
|-------|-----------|---------------|
| -2: Setup | 2025-12 – 2026-01 | GitHub account joined. Computer acquired. Coding starts Jan 20 [USER_REPORTED] |
| -1: First Pressure | Jan–Feb 2026 | Free/local trading agent built. Session-reset crisis. kucoin-margin-bot begins. Swarm infrastructure built (91K files in archive) |
| 0: First Cockpit | Feb 2026 | Five-agent ensemble cockpit operational. First 5 papers completed before Feb 26. Multiple Feb 6-15 evidence files in archive |
| 1: Persistence Hardening | Mar 2026 | FreeAgent, SNAC, multi-ai-ensemble systems continue lineage |
| 2: Lane Crystallization | Apr 2026 | Theory decomposed into public repos. Paper F begins Apr 24 as corrective |
| 3: Operationalization | May 2026 | Control Plane, Lattice Deck, Research Intake, kucoin-lane created |
| 4: Expansion | Jun–Jul 2026 | solana-launch-lane, Genesis-Kernel-World-Sim, sean-machine-janitor |

See `docs/FULL_ARCHITECTURE_MAP.md` §6 for the full timeline with date provenance labels.

### 3.4 Ancestor Epoch (Tier -1)

Nine archive directories in `S:\_ARCHIVED\abandoned-projects\` contain genealogy-critical precursor material (~194K files total). These are not active runtime components but are essential for understanding system origin. Key items:

- **autonomous-elasticsearch-evolution-agent** (91,446 files) — earliest swarm infrastructure. `PERSISTENT_MEMORY.md` dated 2026-02-20, `DEVPOST_SUBMISSION.md` dated 2026-02-21
- **Deliberate-AI-Ensemble** (1,233 files) — Feb 6-15 evidence files including dual independent verification, signal handler breakthrough, crash recovery validation, public replication proof
- **FreeAgent** (26,027 files) — cockpit, swarm, orchestration, medical subsystems
- **ONEQUEMVP** (5,272 files) — queue-router system
- **April15 bundles** (4,089 files) — system-wide reference snapshot

Archived ≠ irrelevant. Archived means non-current operational surface, but genealogy-critical.

---

## 4. Cross-Lane Communication

All cross-lane communication uses **signed JSON messages** with the `lanes/broadcast/schemas/v1.0.json` format. Messages flow through `lanes/*/inbox/` and `lanes/*/outbox/` directories, relayed by the lane-relay-watcher daemon.

### 4.1 Key Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Governance files | `COVENANT.md`, `GOVERNANCE.md`, `BOOTSTRAP.md` | Constitutional layer |
| Trust store | `lanes/broadcast/trust-store.json` | Cryptographic identity attestation |
| Message schemas | `lanes/broadcast/schemas/v1.0.json` | Cross-lane message format |
| Lane state | `lanes/*/state/` | Sovereignty reports, verification status |
| Evidence | `evidence/` | Test results, audit reports, graph snapshots |
| Papers | `library/books/` | Theoretical foundations (Rosetta Stone papers A–F) |
| Architecture index | `data/architecture-index.json` | Machine-readable evidence index (23 entries) |
| Artifact map | `data/repo-file-manifest.csv` | Per-file tracking across all S: drive repos |

### 4.2 Broadcast Channels

| Channel | Function |
|---------|----------|
| `lanes/broadcast/` | Cross-lane public messages |
| `lanes/*/inbox/` | Per-lane incoming messages |
| `lanes/*/outbox/` | Per-lane outgoing messages (logged) |
| `lanes/broadcast/contradictions.json` | Active contradiction sweep |

---

## 5. Contradictions Resolved

| Surface Contradiction | Resolution |
|----------------------|------------|
| "Three lanes" vs "four lanes" | Three-lane is the historical model; four-lane is the canonical current model; the full ecosystem has 8 tiers |
| "Lane" used for both governance role and deployment environment | Lane = governance role (this doc §1); rig = deployment environment |
| "Authority 80" meaning different things in different docs | Authority is always lane-level ordinal within constitutional hierarchy (§2.2) |
| "Agent" meaning both the AI process and the lane itself | Agent = active process serving a lane (§1); lane = governance identity |
| "Evidence" meaning both a claim support and a test artifact | Evidence artifact = any file:line-referenced support for a claim (§1) |
| Paper A–E vs Paper F evidence baseline | Evidence baseline migration documented in Paper F §1.1. Feb record = existence proof of simpler loop; Apr record = operational validation of full architecture |
| Git origin dates as "birth dates" | Git/GitHub timestamps are evidence, not origin dates. 16 repos deleted/restored. Dates are provenance-labeled |
| Control Plane as a "lane" | Control Plane is a sidecar (monitors lanes, has no authority). SCOPE_BOUNDARY.md explicitly defines it as non-lane |
| "Three surfaces" vs "five rigs" | Three-surface model (Windows, Ubuntu, GitHub) supersedes the earlier five-rig gastown deployment model |
| What is "active" vs "archived" | Archived = non-current runtime but genealogy-critical (Tier -1). Not junk. Active = current operational surface |

---

## 6. Maintenance

This document is the canonical architectural reference. It should be updated when:

1. A new lane is added or an existing lane's authority is changed
2. A new rig is deployed with a different lane-to-rig mapping
3. A new entity category is required (e.g., "domain" for cross-system boundaries)
4. A contradiction is discovered and resolved
5. The architecture index at `data/architecture-index.json` is updated

**Update authority:** Archivist (Authority 100) ratifies changes. Library verifies that changes do not contradict existing governance documents. Kernel routes the update to all repos.

**Evidence index:** The accompanying `data/architecture-index.json` and `docs/FULL_ARCHITECTURE_MAP.md` provide the evidence-indexed backing for this canonical model. Any claim in this document that is challenged should be cross-referenced against the evidence index first.

---

*Canonicalized: 2026-07-06*
*Canonical model: Full Ecosystem (8-tier classification)*
*Supersedes: AGENTS.md lane table (§2), THREE_LANE_COMPLETE_SUMMARY.md, four-lane-only model, ad-hoc "lane" references in earlier docs where they conflict*
*Backed by: docs/FULL_ARCHITECTURE_MAP.md, data/architecture-index.json*

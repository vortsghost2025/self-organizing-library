# WE4FREE Full Architecture Map

> Evidence-indexed canonical architecture document.
> Every claim cites file path, command output, or GitHub API result — or carries an explicit confidence label.
> Generated: 2026-07-06
> Agent: opencode (Library lane)
> Data sources: `data/architecture-index.json`, `data/repo-file-manifest.csv`, `data/paper-repo-crosswalk.csv`

---

**Confidence labels used throughout:**
- **VERIFIED** — supported by file path, command output, or GitHub API result
- **INFERENCE** — logical conclusion from chronology or role, not explicitly documented
- **NEEDS_VERIFICATION** — plausible but no current evidence
- **USER_REPORTED_EVENT** — stated by operator, not independently verified from file/git data

**Date provenance labels used throughout:**
- `[USER_REPORTED]` — operator-stated date (e.g. "coding started Jan 20")
- `[VIDEO_TRANSCRIPT]` — extracted from Feb 26, 2026 YouTube transcript
- `[FILE_HEADER_DATE]` — date in document header/metadata
- `[GIT_COMMIT_DATE]` — git log timestamp
- `[GITHUB_CREATED_DATE]` — GitHub API creation timestamp
- `[LOCAL_FS_DATE]` — local filesystem LastWriteTime
- `[ARCHIVE_RESTORE_DATE]` — date reflects archive extraction or repo restore, not original authorship
- `[NEEDS_VERIFICATION]` — no reliable timestamp available

**IMPORTANT — Repo Deletion Contamination Warning:** An agent deleted 16 repos that had to be restored. Therefore GitHub creation dates and git commit dates may reflect **restore/recovery timestamps**, not original project start dates. Local folder timestamps may reflect archive extraction. Every date in this document carries a provenance label — do not treat git/GitHub timestamps as absolute chronology unless corroborated by user report, video transcript, paper header, or preserved artifact. The Feb 26 YouTube transcript is especially valuable as a timeline anchor outside the damaged repo history.

---

## 1. Executive Summary

The WE4FREE system is a self-organizing, multi-agent AI governance ensemble running across **3 surfaces** (Windows cockpit, Ubuntu headless, GitHub canonical) with **6 monitored lanes**, **2 cross-lane directories**, **6 papers** (5 PDF + 1 markdown), and **~27 active git repos** on the S: drive.

The system evolved from a **4-lane convergence architecture** (Archivist, SwarmMind, Kernel, Library) into a broader ecosystem with sidecar infrastructure (Control Plane), observability surfaces (Lattice Deck), research intake pipelines, domain-specific lanes (KuCoin, Solana Launch), experimental spinoffs (Federation, Genesis), and supporting tooling.

**Paper F** (`book-6-ensemble-intelligence-foundation.md`) is the system's self-critical capstone — documenting **36 failure modes (NFM-001 to NFM-036)** across 5 categories, analyzing formal limits, and formalizing the self-correcting convergence loop. It is currently undergoing a **unified revision** (~21 edits, spec dated 2026-07-06).

**Key architectural insight:** The system has moved past the original 4-lane model. The canonical architecture now recognizes 6 functional categories (lanes, sidecar, domain lanes, observability, intake, cross-lane) and distinguishes between a "lane" (governance role with authority boundaries), a "repo" (code/data container), a "surface" (deployment environment), and an "agent" (runtime process).

---

## 2. Canonical Architecture

### 2.1 Three-Surface Rig

**Evidence:** `S:\WE4FREE-Control-Plane\docs\THREE_SURFACE_RIG_DOCTRINE.md`

| Surface | Host | Role | Evidence |
|---------|------|------|----------|
| **Windows cockpit** | Local (S:\) | Authoring, dev, UI, operator control | Directory existence on S: drive |
| **Ubuntu headless** | `we4free@100.95.40.99` (Ubuntu 22.04.5) | Autonomous agents, daemons, lane execution, verifier | SSH: 7 repos at `~/agent/repos/`, 68% disk, load 3.32 |
| **GitHub canonical** | `github.com/vortsghost2025` | Backup, sync, CI, canonical references | `gh repo list vortsghost2025` — 39 repos |

### 2.2 Seven-Tier Classification

Adopted to avoid overfitting every repo into the constitutional lattice:

| Tier | Label | Contains |
|------|-------|----------|
| -1 | Ancestor / Source Epoch | Archived precursors — not current runtime, but genealogy-critical. `S:\_ARCHIVED\abandoned-projects\`: autonomous-elasticsearch-evolution-agent (91K files), FreeAgent (26K), Deliberate-AI-Ensemble, ONEQUEMVP (5K), IDEAGAIN (27K), TAKE10 (10K), storytime (29K), April15 reference point |
| 0 | Theory | Papers 1–6 (PDFs + markdown) |
| 1 | Core governance lanes | Archivist-Agent, SwarmMind, kernel-lane, self-organizing-library |
| 2 | Sidecar + observability + intake | Control Plane, Lattice Deck, Research Intake |
| 3 | Domain lanes | kucoin-lane, solana-launch-lane |
| 4 | Experimental spinoffs | federation, Genesis-Kernel-World-Sim, genius-lane, ... |
| 5 | Tooling | sean-machine-janitor, Control Plane scripts, ... |
| 6 | Historical/unrelated | ComfyUI, Rom-Baro, SharkGame4Adam, fliipd, kanban-test, ... |

### 2.3 Conceptual Distinctions

**VERIFIED** (`data/architecture-index.json` §surfaces, §repos, §lanes`):

- **Lane** ≠ **Repo**: The 4 core lanes each live in a dedicated repo, but domain lanes share repo-count with their lane identity. A lane is a governance role with authority boundaries and a message inbox/outbox.
- **Repo** ≠ **Surface**: A repo exists on multiple surfaces (Windows local, Ubuntu mirror, GitHub remote).
- **Agent** ≠ **Lane**: Agents are runtime processes that execute lane functions. Multiple agents may operate within a single lane.
- **Sidecar** ≠ **Lane**: Control Plane explicitly documents it is NOT a lane (`SCOPE_BOUNDARY.md:3`).

---

## 3. Repo Inventory

### 3.1 Core Governance Lanes (Tier 1)

| Repo | Tracked Files | First Commit | Total Commits | Role |
|------|--------------|--------------|---------------|------|
| Archivist-Agent | 10,296 | 2026-04-13 | 1,336 | Final authority, ratification, storage |
| SwarmMind | 1,512 | 2026-04-23 | 1,126 | Idea engine, proposals, improvement loops |
| kernel-lane | 1,248 | 2026-04-20 | 1,193 | Infrastructure, routing, system health |
| self-organizing-library | 9,410 | 2026-04-15 | 938 | Verification, Nexus Graph, Paper F |

**Evidence:** `git log --reverse --format="%h %ai %s"` and `git ls-files | Measure-Object` for each repo.

### 3.2 Sidecar + Observability + Intake (Tier 2)

| Repo | Tracked Files | First Commit | Role |
|------|--------------|--------------|------|
| WE4FREE-Control-Plane | 355 | 2026-05-09 | Sidecar: monitors, emits reports, supervises |
| WE4FREE-Lattice-Deck | 106 | 2026-05-14 | Next.js observatory, provenance UI |
| WE4FREE-Research-Intake | 69 | 2026-05-15 | Quarantine-first research pipeline |
| WE-Cartographer | N/A (not git) | — | Mapping tool (profiles, reports, no .git) |

### 3.3 Domain Lanes (Tier 3)

| Repo | Tracked Files | First Commit | Role |
|------|--------------|--------------|------|
| kucoin-lane | 450 | 2026-05-16 | KuCoin margin trading bot |
| solana-launch-lane | 33 | 2026-06-10 | Solana token birth detection |

### 3.4 Experimental Spinoffs (Tier 4)

| Repo | Tracked Files | First Commit | Role |
|------|--------------|--------------|------|
| federation | 640 | 2026-04-12 | Federation simulation |
| Genesis-Kernel-World-Sim | 217 | 2026-06-19 | Earth-origin civ sim |
| genius-lane | 107 | 2026-05-31 | Genius lane experiment |
| kucoin-margin-bot | 86 | 2026-02-20 | Predecessor to kucoin-lane |
| solana-mcp-agent | 55 | 2026-06-10 | Solana MCP agent |
| deliberate-ai-ensemble | 47 | 2026-04-09 | Precursor to kucoin-lane |
| Archivist-Agent.NEW_TEMP | ~9,707 | 2026-04-13 | Clone/duplicate sibling |
| Deliberate-Ai-Ensemble | 74 | 2026-04-21 | Capitalized variant |

### 3.5 Tooling (Tier 5)

| Repo | Tracked Files | Role |
|------|--------------|------|
| sean-machine-janitor | 289 | Cleanup, recovery, subagent tooling |
| wmux- | 32 | Window manager multiplexer |
| wmux | 10 | Window manager |

### 3.6 Historical / Unrelated (Tier 6)

| Repo | Tracked Files | Purpose |
|------|--------------|---------|
| ComfyUI | 946 | External AI art tool, first commit 2023-01-03 |
| Rom-Baro | 43 | ROM barometer |
| SharkGame4Adam | 10 | Game experiment |
| fliipd | 6 | Unknown |
| kanban-test | 2 | Test repo |
| Lattice Deck (directory only) | — | Root-level Lattice Deck dir, no .git |
| Research Intake (directory only) | — | Root-level dir, no .git |

### 3.7 GitHub-Only Repos (no S: drive clone)

**Evidence:** `gh repo list vortsghost2025 --limit 100` — cross-referenced via `data/github-local-crosscheck.csv`

21 repos found on GitHub with no local clone. Key examples:
- `we-and-ai-papers` (2026-04-09) — Raw paper working docs, 145+ files, includes `Bookpaper6`
- `fusion-app` (2026-06-22) — App experiment
- `roberta-embed` (2026-06-10) — Embedding model
- Various: `consistency-learning-demo`, `constitutional-cartography-explorations`, `genesis-voice-interface`, `link-scanner`, `mcp-server`, etc.

**INFERENCE:** These are peripheral experiments, not part of the core architecture. See `data/github-local-crosscheck.csv` for full list of all 39 repos with local-match flags.

---

## 4. Lane Map

### 4.1 Core Governance Lanes

**VERIFIED** — Symmetrical `lanes/` directory structure confirmed across all 4 core repos:
`Get-ChildItem S:\{Archivist-Agent,SwarmMind,kernel-lane,self-organizing-library}\lanes\ -Directory`

| Lane | Repo | Primary Lane Dir | Authority | Inbox | Outbox |
|------|------|-----------------|-----------|-------|--------|
| Archivist | Archivist-Agent | `lanes/archivist/` (575 files) | 100 (highest) | Present | Present |
| SwarmMind | SwarmMind | `lanes/swarmmind/` (188 files) | — | Present | Present |
| Kernel | kernel-lane | `lanes/kernel/` (442 files) | — | Present | Present |
| Library | self-organizing-library | `lanes/library/` (340 files) | 60 | Present | Present |

### 4.2 Domain Lanes

| Lane | Repo | Inbox | Outbox | Notes |
|------|------|-------|--------|-------|
| KuCoin | kucoin-lane | 7 pending | 0 | Listed in Control Plane config as monitored |
| Solana Launch | solana-launch-lane | 6 pending | 0 | Listed in Control Plane config as monitored |

### 4.3 Cross-Lane Directories

Present in all 4 core repos:
- **Broadcast** (`lanes/broadcast/`): Cross-lane public messages. File counts: Archivist (200), SwarmMind (171), Kernel (174), Library (63)
- **Logs** (`lanes/logs/`): Shared logging

### 4.4 Control Plane Configuration

**Evidence:** `S:\WE4FREE-Control-Plane\config\control-plane.config.json`

```json
{
  "six_monitored_lanes": ["Archivist-Agent", "SwarmMind", "kernel-lane", "self-organizing-library", "kucoin-lane", "solana-launch-lane"]
}
```

### 4.5 Proposed 5th Lane (Research / Intake Lane)

**INFERENCE** — `WE4FREE-Research-Intake/AGENTS.md:85-94` proposes a "research-lane" with discover/validate/compare/contradict/recommend authority but NO execute/mutate authority. Not yet formally ratified.

---

## 5. Paper Map

### 5.1 Papers 1–5 (CAISC 2026 PDF set)

| Paper | Title | File | Meta Generated | Git Committed |
|-------|-------|------|---------------|--------------|
| A (1) | The Rosetta Stone | `01_The_Rosetta_Stone.pdf.pdf` | 2026-04-29 | 2026-05-01 |
| B (2) | Constraint Lattices and Stability | `02_Constraint_Lattices_and_Stability.pdf.pdf` | 2026-04-29 | 2026-05-01 |
| C (3) | Phenotype Selection in Constraint-Governed Systems | `03_Phenotype_Selection_in_Constraint_Governed_Systems.pdf.pdf` | 2026-04-29 | 2026-05-01 |
| D (4) | Drift, Identity, and Ensemble Coherence | `04_Drift_Identity_and_Ensemble_Coherence.pdf.pdf` | 2026-04-29 | 2026-05-01 |
| E (5) | The WE4FREE Framework | `05_The_WE4FREE_Framework.pdf.pdf` | 2026-04-29 | 2026-05-01 |

**Evidence:** `S:\papers\` repo — single commit `2832fd5` on 2026-05-01. Meta files at `S:\papers\.papers-meta\*.md`.

**CAUTION:** `git ls-files` in `S:\papers` returns only 1 tracked file (`.papers-meta/rosetta-stone.json`). The PDFs exist on disk but are NOT tracked by git — they were never committed.

### Paper Chronology Correction

The paper record has **three distinct date types** that must not be conflated:

| Date type | Date | Meaning | Evidence |
|-----------|------|---------|----------|
| Authorship/completion | Before 2026-02-26 | Papers A–E completed before Feb 26 demo | YouTube transcript: "my papers... the Rosetta Stone. It's all there."; operator testimony: "this happened in feb the week after i finished my 5 papers" |
| Metadata/export | 2026-04-29 | `.papers-meta` generated | `S:\papers\.papers-meta\*.md` generated_at field |
| Git snapshot | 2026-05-01 | Papers repo first (and only) commit | `git -C S:\papers log` |

**Therefore:** Apr 29 is NOT authorship. May 1 is NOT authorship. Papers A–E predate the Feb 26 demo according to operator testimony and video context.

Paper F (Book 6) begins Apr 24, 2026 in git as a **corrective implementation paper**. It comes after Papers A–E conceptually, even though Papers A–E were exported/committed to git later.

**What can be claimed:** "The five papers were completed before Feb 26, 2026 according to operator testimony and video transcript context."
**What cannot be claimed:** "The papers were committed to git before Feb 26" (no evidence).

**Supporting archive evidence:** Deliberate-AI-Ensemble archive contains `PAPER_04_THE_ROSETTA_STONE.md` and `PAPER_C_VERSION_COMPARISON.md` alongside Feb 6-15 dated evidence files — consistent with papers existing in the Feb operational context.

### 5.2 Paper F (Book 6 — Ensemble Intelligence Foundation)

| Field | Value |
|-------|-------|
| Location | `library/books/book-6-ensemble-intelligence-foundation.md` |
| First git commit | `7c02d5d6` 2026-04-24 ("Paper 6 (Paper F): Failure Modes, Formal Limits...") |
| Header date | 2026-04-24 |
| Status | REVIEWABLE |
| Last modified | 2026-07-06 (LANE-3 section updates) |
| NFM count | 36 (NFM-001 to NFM-036) |
| Length | 927 lines |

### 5.3 Paper-to-Repo Crosswalk

**Evidence:** `data/paper-repo-crosswalk.csv` (35 rows)

Key relationships:
- **Paper A** (Rosetta Stone) → References: self-organizing-library; Implements (INFERENCE): Archivist-Agent, kernel-lane
- **Paper B** (Constraint Lattices) → Implements: Lattice Deck (VERIFIED), Control Plane (VERIFIED), kernel-lane (INFERENCE)
- **Paper C** (Phenotype Selection) → Implements: Research Intake (VERIFIED), SwarmMind (VERIFIED)
- **Paper D** (Drift/Identity) → Implements: Control Plane observer (VERIFIED), Library (VERIFIED), Archivist (INFERENCE)
- **Paper E** (WE4FREE Framework) → Implements: Control Plane (VERIFIED), Lattice Deck (VERIFIED), Research Intake (VERIFIED); Extends: kucoin-lane (VERIFIED), solana-launch-lane (VERIFIED)
- **Paper F** (Failure Modes) → Contains: self-organizing-library (VERIFIED); Criticizes: Archivist-Agent, SwarmMind, kernel-lane (VERIFIED); Corrects (INFERENCE): Control Plane, Lattice Deck, Research Intake

### 5.4 Historical Precursors

**Evidence:** `https://github.com/vortsghost2025/we-and-ai-papers` (created 2026-04-09)

- `we-and-ai-papers` contains raw working docs for all 6 papers
- `Bookpaper6` is the Paper F precursor
- 145+ files total

---

## 6. Timeline — Two-Timeline Model

The WE4FREE system has **two parallel timelines** that must be distinguished:

| Timeline | What It Records | Evidence Type |
|----------|----------------|---------------|
| **Conceptual/origin** | When code was written, papers authored, demos produced | File timestamps, video transcripts, operator testimony, archive file contents |
| **Git/export/runtime** | When repos were created and commits recorded | `git log`, GitHub API |

These diverge because the system evolved through local experimentation before being decomposed into public git repos. The git timeline alone undercounts system age by ~2 months.

### Conceptual Timeline (Complete System Genealogy)

**WARNING:** Git/GitHub dates [GIT_COMMIT_DATE] [GITHUB_CREATED_DATE] may reflect repo restore after deletion (16 repos were deleted by an agent and recovered). Do not treat as project origin dates. Prefer [USER_REPORTED], [VIDEO_TRANSCRIPT], and [FILE_HEADER_DATE] for origin anchoring.

| Phase | Date Range | What Happened | Date Provenance |
|-------|-----------|---------------|-----------------|
| **-2: Setup** | 2025-12 – 2026-01 | GitHub account joined 2025-12-08 [GITHUB_CREATED_DATE]. Computer acquired Jan 2026 [USER_REPORTED]. Coding starts Jan 20 [USER_REPORTED]. | `[GITHUB_CREATED_DATE]` `[USER_REPORTED]` |
| **-1: First Pressure** | Jan–Feb 2026 | Free/local trading agent built because AI credits unaffordable. Session-reset crisis. `kucoin-margin-bot` begins Jan 23/24 [GIT_COMMIT_DATE] — 220 January commits. `autonomous-elasticsearch-evolution-agent` swarm infrastructure built (91,446 files). Archive evidence: PERSISTENT_MEMORY.md dated 2026-02-20 [LOCAL_FS_DATE], DEVPOST_SUBMISSION.md dated 2026-02-21 [LOCAL_FS_DATE]. | `[VIDEO_TRANSCRIPT]` `[GIT_COMMIT_DATE]*` `[LOCAL_FS_DATE]` |
| **0: First Cockpit** | Feb 2026 | Five-agent ensemble cockpit operational [VIDEO_TRANSCRIPT]. First 5 papers completed before Feb 26 [USER_REPORTED + VIDEO_TRANSCRIPT]. Multiple Feb 6-15 evidence files in Deliberate-AI-Ensemble archive [LOCAL_FS_DATE — may be copy date]. FreeAgent system (26,027 files) contains cockpit, swarm, orchestration, medical subsystems. | `[VIDEO_TRANSCRIPT]` `[USER_REPORTED]` `[LOCAL_FS_DATE]*` |
| **1: Persistence Hardening** | Mar 2026 | FreeAgent, SNAC/SNAC2, IDE/cockpit work, multi-ai-ensemble systems continue persistence/orchestration/local-agent lineage. ONEQUEMVP queue-router system built (5,272 files). | `[ARCHIVE_RESTORE_DATE]` |
| **2: Lane Crystallization** | Apr 2026 | Theory and early cockpit architecture decomposed into public repos [GIT_COMMIT_DATE*]. Paper F begins Apr 24 [GIT_COMMIT_DATE] as corrective paper against implementation gaps. April15 reference point bundles snapshot [LOCAL_FS_DATE]. | `[GIT_COMMIT_DATE]*` `[LOCAL_FS_DATE]` |
| **3: Operationalization** | May 2026 | Control Plane, Lattice Deck, Research Intake, kucoin-lane created [GIT_COMMIT_DATE*]. Papers repo snapshot May 1 [GIT_COMMIT_DATE]. | `[GIT_COMMIT_DATE]*` |
| **4: Expansion** | Jun–Jul 2026 | solana-launch-lane, Genesis-Kernel-World-Sim, sean-machine-janitor [GIT_COMMIT_DATE* / GITHUB_CREATED_DATE]. Paper F revision + architecture mapping Jul 6. | `[GIT_COMMIT_DATE]*` `[GITHUB_CREATED_DATE]` |

\* *May reflect restored repo timestamps, not original project start. 16 repos were deleted and restored.*

### Git-Committed Timeline (by first commit — partial record)

**NOTE:** This is the git record only. Dates before April are sparse because precursor work was archived, not git-managed. **WARNING:** 16 repos were deleted by an agent and restored — `[GIT_COMMIT_DATE]` may reflect restored repo history, not original project start.

| Date | Provenance | Event | Evidence |
|------|-----------|-------|----------|
| 2026-02-20 | `[GIT_COMMIT_DATE]*` | `kucoin-margin-bot` first commit | S: drive git log |
| 2026-04-09 | `[GITHUB_CREATED_DATE]*` | `we-and-ai-papers` GitHub created | GitHub API |
| 2026-04-09 | `[GIT_COMMIT_DATE]*` | `deliberate-ai-ensemble` first commit | S: drive git log |
| 2026-04-12 | `[GIT_COMMIT_DATE]*` | `federation` first commit | S: drive git log |
| 2026-04-13 | `[GIT_COMMIT_DATE]*` | **Archivist-Agent** first commit | S: drive git log |
| 2026-04-15 | `[GIT_COMMIT_DATE]*` | **self-organizing-library** first commit | S: drive git log |
| 2026-04-20 | `[GIT_COMMIT_DATE]*` | **kernel-lane** first commit | S: drive git log |
| 2026-04-23 | `[GIT_COMMIT_DATE]*` | **SwarmMind** first commit | S: drive git log |
| 2026-04-24 | `[GIT_COMMIT_DATE]*` | **Paper F** first commit (`7c02d5d6`) | git log in self-organizing-library |
| 2026-04-29 | `[FILE_HEADER_DATE]` | `.papers-meta/*.md` generated_at timestamps (NOT authorship) | File metadata |
| 2026-05-01 | `[GIT_COMMIT_DATE]*` | **Papers repo** snapshot — only `.papers-meta/rosetta-stone.json` tracked | git -C S:\papers ls-files |
| 2026-05-09 | `[GIT_COMMIT_DATE]*` | **Control Plane** first commit | S: drive git log |
| 2026-05-14 | `[GIT_COMMIT_DATE]*` | **Lattice Deck** first commit | S: drive git log |
| 2026-05-15 | `[GIT_COMMIT_DATE]*` | **Research Intake** first commit | S: drive git log |
| 2026-05-16 | `[GIT_COMMIT_DATE]*` | **kucoin-lane** first commit (merge) | S: drive git log |
| 2026-05-30 | `[GITHUB_CREATED_DATE]*` | Genesis-Kernel-World-Sim GitHub created | GitHub API |
| 2026-06-10 | `[GIT_COMMIT_DATE]*` | **solana-launch-lane** first commit | S: drive git log |
| 2026-06-21 | `[GITHUB_CREATED_DATE]*` | sean-machine-janitor GitHub created | GitHub API |
| 2026-07-06 | `[FILE_HEADER_DATE]` | Paper F revision spec + plan written | `docs/superpowers/` |
| 2026-07-06 | `[FILE_HEADER_DATE]` | This architecture map generated | This document |

\* *16 repos were deleted and restored. These timestamps are valid as commit records but may not reflect original project start dates.*

---

## 7. Paper F Failure Map

### 7.1 NFM Categories

**VERIFIED** — sourced from `book-6-ensemble-intelligence-foundation.md` NFM table and `docs/superpowers/specs/2026-07-06-paper-f-unified-revision-design.md`

| Category | NFM Range | Count | Description |
|----------|-----------|-------|-------------|
| 1 — Identity/Enforcement | NFM-001 to 010 | 10 | Process isolation failures, self-state aliasing, write-before-gate races, trust store issues |
| 2 — Schema/Protocol/Observability | NFM-011 to 024 | 14 | Naming inconsistencies, schema mismatch, observability gaps, temporal ordering |
| 3 — Key Lifecycle / Crypto | NFM-025 to 028 | 4 | Cryptographic key lifecycle gaps, trust infrastructure failures |
| 4 — Subagent Contract | NFM-029 to 035 | 7 | Delegation boundary failures at subagent scope — delegation projection of Category 1-2 failures |
| 5 — Self-Applied Theory | NFM-036 | 1 | System's own verification infrastructure has trust-boundary problems it theorizes about |

### 7.2 Invariant Pressure Map

**From revision design spec (§4.1, lines 162-198):** Each NFM tests a specific invariant:

| Invariant | NFMs |
|-----------|------|
| Enforcement | NFM-001, 003, 004, 014 |
| Identity | NFM-005, 007, 008, 013, 015, 017 |
| State-Claim | NFM-002, 009, 016 |
| Delegation | NFM-006, 029-035 |
| Protocol | NFM-010, 011, 012, 023 |
| Temporal | NFM-018, 022 |
| Semantic | NFM-019, 024 |
| Observational | NFM-020, 021 |
| Identity/Crypto | NFM-025, 026, 027, 028 |

### 7.3 Repos Criticized by Paper F

**VERIFIED** — cross-referenced in `data/paper-repo-crosswalk.csv`

| Repo | NFMs | Specific Issue |
|------|------|----------------|
| Archivist-Agent | NFM-001 to 010 | Identity, enforcement, trust store failures |
| SwarmMind | NFM-012, 015, 017 | Schema mismatch, disappearing identity dir, invalid PEM |
| kernel-lane | NFM-011 | Naming inconsistency (kernel vs kernel-lane) |

### 7.4 Repos That Correct Paper F Deficiencies

**INFERENCE** — chronological sequence only; no document explicitly states these were created in response to Paper F:

- **Control Plane** (2026-05-09) → Observer protocol, enforcement map — addresses NFM-001 through NFM-004 (enforcement gaps)
- **Lattice Deck** (2026-05-14) → Cross-lane observability — addresses NFM-020 (observability gap)
- **Research Intake** (2026-05-15) → Schema validation pipeline — addresses NFM-019 (schema mismatch)

### 7.5 NFM Documentation in System

**VERIFIED** — NFM concepts referenced across system docs:
- `docs/CANONICAL_ARCHITECTURE.md`: NFM-002 documentation reference
- `docs/SYSTEM_MAP.md`: NFM-001 through NFM-036 with mitigation status
- `docs/THREE_LANE_COMPLETE_SUMMARY.md`: NFM-001 to NFM-003 table
- `docs/ops/SWARMIND_SUBAGENT_CONTRACT.md` SBC-019: references NFM-032 (cross-lane read scope)

### 7.6 Active Revision

**VERIFIED** — `docs/superpowers/specs/2026-07-06-paper-f-unified-revision-design.md`

Paper F is currently undergoing a unified revision with ~21 edits organized into 10 design sections:
1. **Edit 1a** — Evidence baseline migration paragraph (§1.1)
2. **Edit 1b** — CPS threshold correction note (§3)
3. **Edit 1c** — Delegation amplification theorem proof (§5.3)
4. **Edit 1d** — CPS formula correction (§5.5)
5. **Edit 1e** — Delegation theorem reserve proof (§5.5)
6. **Edit 1f** — NFM→invariant trace column (new 5th column in NFM table)
7. **Edit 2** — Delegation projections paragraph (§2)
8. **Edit 3** — Relabel Category 8 as Delegation (§2)
9. **Edit 4/4a** — NFM-036 as self-applied theory (§3.2)
10. **Edit 5** — Replication invitation (§6.3)
11. **Edit 6** — Security level qualifier (§6.4)

---

## 8. Ancestor Epoch & Archived Material

### 8.1 Archived Precursor Roots (Tier -1)

These are **not current runtime** components, but they are **genealogy-critical**: they contain the earliest code, papers, and architecture of the system. They reside in `S:\_ARCHIVED\abandoned-projects\`.

| Directory | Files | Role | Evidence Date |
|-----------|-------|------|---------------|
| `autonomous-elasticsearch-evolution-agent` | 91,446 | Earliest swarm/orchestration/persistence infrastructure. Contains PERSISTENT_MEMORY.md (2026-02-20), DEVPOST_SUBMISSION.md (2026-02-21), multi-agent architecture specs, cockpit UI | Feb 2026 hackathon era |
| `FreeAgent` | 26,027 | Cockpit, swarm coordination, orchestration, medical/genomics pipelines, federation-game subsystems | Feb–Apr 2026 |
| `Deliberate-AI-Ensemble` | 1,233 | Constitutional verification protocols, dual independent verification (Feb 6), signal handler breakthrough (Feb 7), crash recovery validation, public replication proof, paper drafts (PAPER_04_THE_ROSETTA_STONE.md) | Feb 6–15 evidence files |
| `httpsgithub.comvortsghost2025ONEQUEMVP\ONEQUEMVP` | 5,272 | Queue-router precursor with stress testing, safety features, universal router architecture | Apr 2026 |
| `IDEAGAIN` | 27,604 | Unknown role; large file count suggests substantial code | Archived |
| `TAKE10` | 10,235 | Minimal files; some references to gastown tasks | Archived |
| `storytime` | 29,263 | Unknown role | Archived |
| `April152026mainreferencepoint` | 3,981 | Bundle root snapshotting Deliberate-AI-Ensemble-main.zip, papers zip, kucoin-margin-bot/, resilience bundles, WE4FREE infra bundles | 2026-04-16 bundles |

### 8.2 External / Unrelated

These are NOT part of the WE4FREE system architecture:

| Repo | Reason |
|------|--------|
| ComfyUI | External AI art tool; first commit 2023-01-03, predates all WE4FREE repos by 3+ years |
| Rom-Baro | ROM barometer tool; no lane structure, no governance |
| SharkGame4Adam | Game experiment; unrelated |
| fliipd | Unknown purpose; no governance links |
| kanban-test | Test repo; 2 tracked files |

### 8.3 Duplicates / Clones

- **Archivist-Agent.NEW_TEMP** — Clone/sibling of Archivist-Agent. ~9,707 tracked files, same first commit. Not a separate architectural entity.
- **Deliberate-Ai-Ensemble** (capitalized) — Likely variant of `deliberate-ai-ensemble`. 74 tracked files.

### 8.3 Non-Repos

- **WE-Cartographer** — Artifact directory (profiles/, reports/, single-test.txt, Untitled.txt). No `.git`. Not version-controlled. Maps to architect's "mapping tool" role but is not a git repo — best classified as Tier 5 (tooling) by role, but tracked as a data-source directory rather than a repo in the index.
- **Lattice Deck** (root-level dir) — Not a git repo; the actual repo is `WE4FREE-Lattice-Deck`.

---

## 9. Evidence Index

### 9.1 Key Source Files

| File | Contents |
|------|----------|
| `data/architecture-index.json` | Full canonical index: 14 indexed repos, 8 lanes, 6 papers, 3 surfaces, 16 claims + 8 evidence artifacts |
| `data/repo-file-manifest.csv` | 36,632 rows — every tracked file across all repos |
| `data/paper-repo-crosswalk.csv` | 35 rows — every paper-to-repo relationship |
| `data/github-local-crosscheck.csv` | 39 repos cross-referenced (18 local, 21 GitHub-only) |
| `S:\WE4FREE-Control-Plane\config\control-plane.config.json` | 6 monitored lanes, headless target |
| `S:\WE4FREE-Control-Plane\docs\THREE_SURFACE_RIG_DOCTRINE.md` | Deployment surface doctrine |
| `S:\WE4FREE-Control-Plane\docs\SCOPE_BOUNDARY.md` | CP is sidecar, not lane |
| `S:\WE4FREE-Control-Plane\docs\CONTROL_PLANE_LIVE_ENFORCEMENT_MAP.md` | 20 PROVEN claims, 2 PARTIAL, 1 FALSE |
| `S:\WE4FREE-Control-Plane\docs\ADAPTIVE_OBSERVER_PROTOCOL.md` | Observer protocol specification |
| `S:\self-organizing-library\library\books\book-6-ensemble-intelligence-foundation.md` | Paper F (36 NFMs) |
| `docs/superpowers/specs/2026-07-06-paper-f-unified-revision-design.md` | Paper F revision design |
| `docs/superpowers/plans/2026-07-06-paper-f-unified-revision.md` | Paper F revision impl plan |
| `S:\papers\.papers-meta\index.json` | 5-paper index with generated_at timestamps |
| `S:\_ARCHIVED\abandoned-projects\autonomous-elasticsearch-evolution-agent\` | 91K files — earliest swarm/orchestration/persistence code + Devpost submission (Feb 20-21) |
| `S:\_ARCHIVED\abandoned-projects\Deliberate-AI-Ensemble\` | 1,233 files — Feb 6-15 constitutional protocols + paper drafts |
| `S:\_ARCHIVED\abandoned-projects\FreeAgent\` | 26K files — cockpit, swarm, orchestration, medical subsystems |
| `S:\_ARCHIVED\abandoned-projects\httpsgithub.comvortsghost2025ONEQUEMVP\ONEQUEMVP\` | 5K files — queue-router precursor with stress test results |
| `S:\_ARCHIVED\abandoned-projects\April152026mainreferencepoint\` | 4K files — bundle root snapshotting the system as of Apr 16 |

### 9.2 Claim Confidence Summary

From `data/architecture-index.json` §claims:

| Confidence | Count | Description |
|------------|-------|-------------|
| VERIFIED | 13 | File/git/GitHub evidence |
| INFERENCE | 2 | Logical conclusion without doc evidence |
| USER_PROVIDED_TRANSCRIPT | 1 | Papers A-E completed before Feb 26, 2026 |
| NEEDS_VERIFICATION | 0 | Resolved — upgraded to USER_PROVIDED_TRANSCRIPT |

### 9.3 Paper Chronology — Resolved

**NEEDS_VERIFICATION-001** has been **upgraded to USER_PROVIDED_TRANSCRIPT** based on new video evidence:

| Question | Status |
|----------|--------|
| Were Papers A-E authored before Paper F? | **YES** — per operator testimony and Feb 26 video transcript context. |
| Do we have git proof? | **No** — git record starts May 1. Authorship predates git. |
| What about Paper F vs Papers A-E? | Paper F (Apr 24) is a **corrective implementation paper** that comes after A-E conceptually, despite A-E being git-committed later. |

**Evidence:** `data/architecture-index.json` §artifact `video-2026-02-26-hackathon-demo` + archive evidence files from Feb 2026.

---

## 10. Open Questions

1. **Were Control Plane, Lattice Deck, and Research Intake created in response to Paper F failures?** The chronology is consistent (Paper F Apr 24 → CP May 9 → LD May 14 → RI May 15), but no document explicitly states this causal relationship. Currently marked **INFERENCE**.

2. **What is the authorship date of Papers 1-5 PDFs?** The PDFs lack embedded metadata. The `.papers-meta` generation date (2026-04-29) and git commit date (2026-05-01) are not authorship dates. However, operator testimony and Feb 26 video transcript support completion before Feb 26, 2026. The archive contains PAPER_04_THE_ROSETTA_STONE.md alongside Feb 6-15 evidence files — consistent with papers existing in the Feb operational context.

3. **Is the 4-lane model superseded or supplemented?** The Control Plane config monitors 6 lanes, but domain lanes (KuCoin, Solana Launch) operate less autonomously. The proposed "research-lane" in Research Intake would make it 7. The core 4-lane convergence protocol may still be the authoritative governance mechanism, with domain lanes as constrained extensions.

4. **What is the governance relationship between the core 4 lanes and the 2 domain lanes?** Domain lanes have inboxes (messages pending) but low file counts in their lane directories. Are they full participants in convergence voting?

5. **Why does Archivist-Agent have 10,296 tracked files vs. all other repos?** The next largest is self-organizing-library at 9,410. Both are substantially larger than SwarmMind (1,512) and kernel-lane (1,248). Archivist's role as artifact storage may explain this, but the ratio warrants investigation.

6. **What is the relationship between `we-and-ai-papers` (GitHub 2026-04-09) and the final Papers 1-5 PDFs?** The `we-and-ai-papers` repo contains 145+ raw working files including `Bookpaper6`. Are the PDFs a subset or a distillation?

7. **Does the Paper F revision change any NFM counts or categories?** The revision design mentions 35 NFMs (some counts) vs. the 36 in the current file. The edit plan's "Category 8 → Delegation" relabel may affect the count.

8. **How many of the 36 NFMs have been mitigated in production?** SYSTEM_MAP.md notes most are "mitigated via JS-level gates, not OS-level guarantees." A full mitigation audit against live code has not been performed.

---

*End of evidence-indexed architecture map. Raw data in `data/architecture-index.json`, `data/repo-file-manifest.csv`, `data/paper-repo-crosswalk.csv`. Task log in `docs/ARCHITECTURE_MAPPING_TASK_LOG.md`.*

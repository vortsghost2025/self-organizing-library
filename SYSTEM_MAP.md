OUTPUT_PROVENANCE: agent: kilo-auto/free lane: library generated_at: 2026-05-05T00:10:00Z session_id: system-map-20260505

# SYSTEM_MAP — 4-Lane Constitutional Governance Lattice

**Status:** `PARTIAL_CANONICAL_MAP`  
**Scope:** Archivist-Agent, self-organizing-library, SwarmMind-Self-Optimizing-Multi-Agent-AI-System, kernel-lane  
**Known limitations at time of generation:**
- Heartbeat and inbox-watcher daemons were stopped (cross-lane coordination degraded)
- SwarmMind key_id mismatch remains unresolved (requires lane-owner action)
- `contradictions.json` requires Archivist adjudication (stale vs active conflicts)
- Some S:/ paths are environment-specific and not externally reproducible without lane runtime

**Next required authority:**
- Archivist: adjudicate contradiction reconciliation, ratify trust-store updates
- SwarmMind owner: regenerate keypair to match ratified trust-store entry
- Library operator: restart heartbeat + inbox-watcher daemons, quarantine cleanup

**Canonicalization note:** Authority numbers should be consolidated into a single machine-readable registry (e.g., `lanes/broadcast/lane-authority.json`) to avoid drift between `.session-mode`, `AGENTS.md`, and memory-bank. Current source-of-truth is `.session-mode v2.0.0`.

**Scope:** Self-Organizing Library (Library Lane repository) + canonical references to Archivist-Agent, SwarmMind, and Kernel Lane  
**Status:** Active (governance-sensitive identity conflicts pending ratification; see §7)  
**Last surveyed:** 2026-05-04T23:00:00Z

---

## 1. What Is This System?

A **four-lane constitutional governance system** for evidence-backed research archiving and AI agent coordination. The system treats every claim as requiring verifiable evidence; governance decisions require ≥3-of-4 lane approval. It operates as a lattice, not a hierarchy: each lane has independent authority within its domain, and no lane can unilaterally change cross-lane policy. The Library Lane (this repo) is the verification surface — it proves or rejects claims based on runtime evidence, but does not set governance policy.

The system indexes research artifacts (documents, papers, code, data) across four research repositories (Library, Archivist, SwarmMind, Kernel), connects them via semantic edges (citations, VERIFIES, CONTRADICTS, etc.), and exposes this as both a web UI (Next.js) and a cross-lane message bus (inbox/outbox with JWS signatures). All output must include a Convergence Gate (`{claim, evidence, verified_by, status}`) to be considered proven.

---

## 2. What Does Each Repo/Lane Do?

| Lane | Position | Authority | What It Does | Decision Rights | Source-of-Truth Files |
|------|----------|-----------|---------------|-----------------|----------------------|
| **Archivist** (Archivist-Agent) | 1 | 100 | Constitutional governance root and cross-lane coordinator; ratifies proposals, holds ultimate escalation authority, owns trust-store ratification | Approves/rejects all proposals via ratification; enforces governance constraints; coordinates lane messaging; can block releases | `S:/Archivist-Agent/lanes/broadcast/active-blocker.json`, `contradictions.json`, `trust-store.json`, `SESSION_REGISTRY.json` |
| **Library** (self-organizing-library) | **3** (canonical) / 2 (stale docs) | **60** (canonical) / 90 (stale AGENTS.md) | Evidence-backed verification surface; proves/rejects claims with runtime evidence; enforces Convergence Gate; maintains graph index and web UI | Can reject claims lacking evidence paths; escalates unproven verification to Archivist; no unilateral governance changes | `lanes/library/state/active-owner.json`, `watcher-mode.json`, `sovereignty-report-latest.json`, `lanes/broadcast/trust-store.json` (replica) |
| **SwarmMind** (SwarmMind) | 3 | 80 | Optimization, synchronization, robustness audit; validates tools against drift/failure scenarios; cross-lane consistency surface | Flags drift, path violations, protocol inconsistencies; reports findings with evidence; cannot mutate governance unilaterally | `S:/SwarmMind/lanes/swarmmind/state/` (external — not in this repo) |
| **Kernel** (kernel-lane) | 4 | 60 | GPU/CUDA kernel optimization and benchmarking; produces measurable, reproducible performance improvements; feeds validated release artifacts | Requires benchmark + Nsight evidence for promotion; can block releases lacking complete evidence; operates independently to avoid destabilizing other lanes | `S:/kernel-lane/` (external — separate repository) |

**Notes:**
- **Authority mismatch:** Library's canonical identity is Position 3, Authority 60 (per `.session-mode`, `library/docs/`). `AGENTS.md` and `memory-bank/brief.md` incorrectly state Position 2, Authority 90 — this is stale and contradicts `.session-mode v2.0.0` and Kernel audit findings. See §7.
- **Scope:** This repository (Library Lane) contains the full web application and coordination scripts. Archivist-Agent, SwarmMind, and Kernel exist as separate repositories referenced via canonical S:/ paths.
- **Operator/Agent Lane:** `lanes/opencode/` exists as the human/AI operator lane; it is not part of the 4-lane constitutional ring but can submit tasks.

---

## 3. Source of Truth

### Unified Source-of-Truth Registry

| What | Source File(s) | Owner | Live? |
|------|---------------|-------|-------|
| **Trust anchors** (RSA-2048 keys) | `lanes/broadcast/trust-store.json` (replicated to all lanes) | Archivist | ✅ Yes (canonical) |
| **System liveness/consistency** | `lanes/broadcast/system_state.json` (derived from contradictions) | Archivist | ✅ Yes |
| **Contradiction registry** | `lanes/broadcast/contradictions.json` | Archivist | ⚠️ Stale (shows all resolved May 30 but blocker-classification says 5 active) |
| **Active blocker** (ONE-BLOCKER RULE) | `lanes/broadcast/active-blocker.json` | Archivist | ✅ None assigned currently |
| **Cross-lane session coordination** | `SESSION_REGISTRY.json` (root of Library repo, mirrored to Archivist) | Archivist | ✅ Yes |
| **Library lane operational state** | `lanes/library/state/active-owner.json`, `watcher-mode.json`, `sovereignty-report-latest.json` | Library | ✅ Yes |
| **Web application data** | Site index (`data/site-index.json`), Graph node/edge exports (`src/app/api/graph-data/`) | Library | ✅ Yes |
| **Convergence protocol** | `lanes/broadcast/CONVERGENCE_PROTOCOL.md` | Archivist | ✅ Yes |
| **Schema definitions** | `schemas/inbox-message-v1.json` (v1.3) | Archivist | ✅ Yes |
| **Output provenance contract** | `governance/output-provenance.contract.json`, `governance/OUTPUT_PROVENANCE_CONTRACT.md` | Library | ✅ Yes |

### Canonical Paths per Schema

Each lane has a **canonical filesystem root** (production reality, not local-only):

```json
{
  "archivist": "S:/Archivist-Agent/",
  "library":    "S:/self-organizing-library/",
  "swarmmind":  "S:/SwarmMind/",
  "kernel":     "S:/kernel-lane/"
}
```

All cross-lane delivery uses these absolute paths (see `schemas/inbox-message-v1.json` `canonical_paths`). The `lanes/<lane>/inbox/` directories inside this repo are local mirrors for development only; production inboxes live at the S:/ roots.

---

## 4. How Does Data/Evidence Move Between Lanes?

### Movement Pipeline (7 steps)

1. **Compose** — Sender constructs message per `schemas/inbox-message-v1.json` v1.3:
   - Required: `schema_version`, `task_id`, `idempotency_key`, `from`, `to`, `type`, `priority`, `subject`, `body`, `timestamp`, `requires_action`, `payload`, `execution`, `lease`, `retry`, `evidence`
   - Signature: JWS RS256 via `Signer.signInboxMessage()` (uses lane's private key)
   - Evidence: `evidence.evidence_path` points to verifiable artifact (JSON/MD/log)

2. **Deliver** — `SchemaValidator.deliverMessage()` writes to **TARGET's canonical inbox** (`S:/<target-repo>/lanes/<target>/inbox/`) with signature. Delivery verification confirms file exists.

3. **Ingest** — Receiver's `inbox-watcher.js` (currently **not running**) polls inbox, validates schema + signature against trust store (`IdentityEnforcer` in `enforce` mode), checks idempotency (`idempotency_key`).

4. **Acquire lease** — Valid messages get a lease (`acquired_at`, `expires_at`, `owner=PID`) via `lease-write.js` to prevent concurrent processing. Max renewals: 3.

5. **Execute** — `lane-worker.js` (currently running, 4 instances, serialized by file lock) executes the task. Worker runs domain-specific logic and writes evidence artifact to `evidence/` or cross-lane path.

6. **Report completion** — Worker sends response message (type: `response`, `task_kind: done|ratification|report`) with:
   - `evidence.evidence_path` (artifact location) OR
   - `evidence_exchange` block (`artifact_path`, `artifact_type`, `delivered_at`)
   - Convergence Gate embedded in body: `{claim, evidence, verified_by, status}`

7. **Acknowledge/Quarantine** — If `requires_action=false`, message moved to `processed/`. If invalid signature/schema → `quarantine/` or `expired/`. If blockable error → `blocked/` with NACK.

### Cross-Lane Evidence Exchange Conventions

- **Absolute paths:** Use `S:/Archivist-Agent/...`, `S:/SwarmMind/...`, `S:/kernel-lane/...` for cross-repo artifacts (schema type `evidence_path` or `evidence_exchange.artifact_path` must be absolute when referencing another lane's repo).
- **Local artifacts:** Relative paths under `evidence/`, `reports/`, `library/docs/` are acceptable when the receiver can resolve them.
- **Artifact types:** `benchmark`, `profile`, `release`, `log`, `response`, `report`, `artifact` (see `evidence_exchange.artifact_type` enum).
- **Proof requirement:** Every claim must include `evidence` field with a resolvable `evidence_path`; responses must include `evidence_exchange` when `evidence.required=true`.

### Real Message Examples

| From | To | Type | Evidence | Purpose |
|------|----|------|---------|---------|
| Archivist | Library | response (ratification) | `trust-store.json` | Cycle A closure, certificates not required |
| Archivist | Library | response (ratification) | `S:/Archivist-Agent/context-buffer/global-verification-sweep-complete-20260501.json` | Work-path stale data ruling (184 P0 candidates) |
| Archivist | broadcast | notification (ratification) | `S:/Archivist-Agent/context-buffer/contradiction-batch-unified-merge-table-20260430.md` | Contradiction resolution (CONTRADICTION_SIGNATURE_39) |

**Delivery status:** All cross-lane messages are **signed** and stored in the receiver's canonical inbox. The `inbox-watcher` is the orchestrator but is currently **dormant**; `lane-worker` processes messages directly from `inbox/` (bypassing the watcher pipeline). This is a **degraded operating mode** (manual vs automated coordination).

---

## 5. What Is Executable Today?

### Currently Running Processes (observed 2026-05-04T23:00)

| Process | Command | Purpose | Status |
|---------|---------|---------|--------|
| lane-worker (×4) | `node scripts/lane-worker.js --apply --watch --poll-seconds 20` | Serialized inbox processing with file lock; schema + identity enforcement | ✅ Running (4 PIDs) |
| opencode agent | Multiple `opencode` AI sessions | Interactive development assistance | ✅ Running |
| Cursor IDE server | `~/.cursor` | Editor integration | ✅ Running |

### **Dormant but Implemented** (scripts exist, not daemonized):

| Script | npm script? | Intended purpose | Last observed |
|--------|------------|-----------------|---------------|
| `inbox-watcher.js` | No (manual `node scripts/inbox-watcher.js`) | Coordinate cross-lane pipeline (lease → execute → deliver → verify) | Log frozen 2026-04-28 |
| `heartbeat.js` | No (manual `node scripts/heartbeat.js`) | Write heartbeat + `system_state.json` every 60s | File body stale 2026-05-03 05:43 |
| `act-daemon.js` | No | Autonomous Cycle Test (kilo round-robin across lanes) | `daemon-state.json` says "running" but process dead since 2026-04-22 |
| `governed-start.js` → `npm run dev` | No | Next.js dev server with lane identity loaded | No `next` process found |

### Operational Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Invariant layer: IdentityEnforcer (enforce mode)           │
│  — Every message signed; trust-store lookup per message   │
│  — SchemaValidator v1.3 compliance checks                 │
│  — ExecutionGate (verification domain enforcement)        │
├─────────────────────────────────────────────────────────────┤
│  Running: 4× lane-worker.js (serialized by file lock)      │
│  — Polls inbox every 20s                                   │
│  — Processes valid messages, writes evidence              │
│  — Moves processed → processed/, invalid → quarantine/    │
├─────────────────────────────────────────────────────────────┤
│  NOT running: inbox-watcher, heartbeat, act-daemon         │
│  — Cross-lane coordination pipeline dormant               │
│  — System-wide heartbeat liveness monitoring inactive     │
│  — Autonomous cycle orchestration halted                  │
├─────────────────────────────────────────────────────────────┤
│  Web UI: Not running as daemon                              │
│  — Built and deployed to Vercel (manual build, auto deploys)│
│  — Production at https://deliberateensemble.works          │
│  — Static site; no inbound message processing in browser   │
└─────────────────────────────────────────────────────────────┘
```

### Executable npm Scripts

`package.json` defines minimal scripts:
- `dev` / `build` / `start` — Next.js lifecycle (not currently used for lane daemons)
- No `watch`, `heartbeat`, or `worker` npm scripts; these are invoked manually via `node scripts/<name>.js`

**Key insight:** The system is running in **minimal manual mode**: multiple `lane-worker` instances handle inbox processing, but higher-orchestration daemons (`inbox-watcher`, `heartbeat`) are stopped. The convergence protocol still operates (messages are signed and contain evidence), but there is no automated heartbeat-driven system_state updates or centralized watcher coordination.

---

## 6. What Is Theory/Docs Only?

### Specified but Not Implemented

| Spec/Doc | What It Describes | Implementation Status |
|----------|-------------------|----------------------|
| `library/docs/specs/PHASE3_OS_LEVEL_ENFORCEMENT_SPEC.md` | seccomp-bpf syscall filtering, filesystem ACLs per lane, audit FSWatcher, process attestation on startup | ❌ No code; only spec |
| Automatic trust-store synchronization across lanes | Cross-lane key revocation/rotation workflow | ❌ Manual only; `scripts/gen-archivist-key.js`, `scripts/generate-library-keys.js` exist but no auto-sync |
| `scripts/lane-health-monitor.js` | Continuous heartbeat monitoring + alerting on stale heartbeats | ❌ Not daemonized or wired to alerts |
| `scripts/agent-presence.js` | Track active agents/sessions across lanes | ❌ Not running; unclear integration |
| `vercel.json` infrastructure-as-code | Codify redirects, headers, build hooks | ❌ Not present; Vercel configured via UI |
| Full CI/CD sovereignty gates | `.vercel/output` verified by `scripts/cicd-sovereignty-gates.js` | ⚠️ Partially manual (post-compact audit run by operator) |
| `scripts/start-workers.ps1` + supervisor (PM2/systemd) | Auto-restart crashed daemons | ❌ No supervisor; workers started manually |
| `library/docs/failure-modes/` many mitigations | NFM-001 through NFM-036 (36 failure modes); most are mitigated via JS-level gates, not OS-level guarantees | ⚠️ Partial — docs present, full OS isolation not |

### Theoretical Components Present in Code But Not Operational

- **`inbox-watcher.js` pipeline** — Code exists, but no running process. The system relies on `lane-worker` directly ingesting inbox files without the coordinated watcher flow (lease renewal, retry backoff, progress heartbeat).
- **`heartbeat.js`** — Code exists, not running. System relies on manual or ad-hoc heartbeat writes; `system_state.json` may be stale.
- **`act-daemon.js`** — Autonomous cycle orchestrator; code present but daemon dead; state file claims "running" but no matching process (state desynchronized).
- **`Nexus Graph explanation overlay** (`NEXUS_GRAPH_EXPLANATION_LAYER.md` referenced) — Overlay UI not implemented; graph operates without first-time explanatory overlay.

### Active Evidence of Gap

The post-compact audit (`reports/post-compact-blocker-report-2026-05-03.md`) reports status `conflicted` and states "Deployment remains blocked" due to trust-store/governance hash changes. Despite this, lane-workers continue processing. This indicates **convergence gate enforcement is not halting execution** — the system operates in a degraded state where compliance gates are advisory, not blocking. That is a theoretical enforcement gap in practice.

---

## 7. Stale, Duplicated, or Contradictory Artifacts

### Critical Contradictions (Must Resolve)

| ID | Contradiction | Files Affected | Severity | Fix Required |
|----|---------------|----------------|----------|--------------|
| **C-LIB-ID-1** | Library position/authority mismatch: AGENTS.md says Position 2, Authority 90; `.session-mode` and docs say Position 3, Authority 60 | `AGENTS.md:103–104`, `.kilocode/rules/memory-bank/brief.md:9–10`, `library/docs/` (consistent with Position 3) | **Critical** | Update AGENTS.md and memory-bank to Position 3, Authority 60 to match canonical .session-mode v2.0.0 and all downstream docs |
| **C-SCHEMA-ENUM-1** | `SchemaValidator.js` `to` enum excludes `broadcast` and `all`; schema v1.3 includes them | `src/lane/SchemaValidator.js:35`, `schemas/inbox-message-v1.json:30–39` | **Critical** | Expand ENUM_CONSTRAINTS.to to `['archivist','library','swarmmind','kernel','broadcast','all']` and redeploy. Kernel messages in quarantine will then process |
| **C-TRUST-1** | SwarmMind key_id mismatch: broadcast trust-store has `1450972ce0a225b7`, SwarmMind `keys.json` has `ecb12bdacf826701` | `lanes/broadcast/trust-store.json`, `S:/SwarmMind/lanes/swarmmind/identity/.identity/keys.json` | **Critical** | SwarmMind lane owner must regenerate keys to match ratified trust-store entry; no trust-store update without Archivist |
| **C-QUAR-1** | 113 stale messages in Library quarantine + 264 in Kernel, per kernel audit | `lanes/library/inbox/quarantine/` (many files) | **Moderate** | Review each; move resolved items to `processed/`, delete spam, file evidence for remaining |
| **C-CONTRA-1** | `contradictions.json` shows all resolved May 30, but `blocker-classification-updates.md` lists 5 active conflicts | `lanes/broadcast/contradictions.json`, `evidence/blocker-classification-updates.md` | **Moderate** | Re-run contradiction detection or manually reconcile; update contradictions.json to reflect current active set |
| **C-ENGINE-1** | `SchemaValidator` execution.engine includes `pipeline`; schema v1.3 does not | `src/lane/SchemaValidator.js:46`, `schemas/inbox-message-v1.json` | **Moderate** | Either add `pipeline` to schema enum or remove from validator; standardize engine values |
| **C-SESSION-1** | `lanes/library/inbox/heartbeat-library.json` file modified May 4 but body stale May 3 — indicates external touch, not live daemon | `lanes/library/inbox/heartbeat-library.json` (mtime vs content) | **Moderate** | Restart heartbeat daemon; audit file write source (cron? operator?) |
| **C-WATCHER-1** | `inbox-watcher.log` frozen since 2026-04-28; watcher not running despite messages being processed | `scripts/inbox-watcher.log` | **Moderate** | Restart inbox-watcher to restore automated cross-lane pipeline; current `lane-worker` bypasses watcher |

### Stale Artifacts (Low Priority)

- `lanes/library/inbox/quarantine/archived-legacy/` — 9 messages from April 28 archived but still under quarantine; review if already resolved
- `lanes/library/inbox/stale-foreign/final-system-convergence-proof-20260430T233000.json` — foreign message; verify if action required
- `.kilocode/rules/memory-bank/context.md` — references obsolete key_ids (e.g., Kernel `1a7741b8d353abee`); document as historical or prune
- `docs/graph/snapshots/` — numerous April 29 snapshots; implement rotation (keep last 10)
- `lanes/library/inbox/resolved-20260428/archive` — nested archive; consider consolidation

### Duplication (Intentional vs Unnecessary)

- **Governance doc overlap** (`AGENTS.md`, `GOVERNANCE.md`, `RECIPROCAL_ACCOUNTABILITY.md`): Each serves distinct purpose (lane instructions, constitutional laws, user protection protocol). Not true duplication — keep separate but add cross-references.
- **Schema files:** All SHA256-unique; no duplication found in `schemas/`.
- **Convergence Protocol:** Single source at `lanes/broadcast/CONVERGENCE_PROTOCOL.md` (not duplicated into `governance/` per AGENTS.md). Good.

### Deprecated/Misleading Terminology (Non-critical)

- `identity-enforcer.js` line 382: error message says "requires 3-lane convergence" but system is 4-lane with ≥3 quorum — wording should be "requires 3-out-of-4 lane convergence" for clarity.
- `lanes/broadcast/gate-schema.json`: "User quarantine (UDS > 60) requires 3-lane convergence to unblock" — same wording issue.
- These are doc-only; logic uses ≥3 approvals correctly.

---

## 8. What Should a New Contributor Read First?

### For Humans (Non-Agent)

1. **Landing page** — `/` (hero + system stats + 4-lane diagram)
2. **Start Here** — `/start-here` (5-step guided tour: Library → Papers → Graph → Repos → Search)
3. **About** — `/about` (project scope, 4-lane overview with authority numbers, external links)
4. **Understanding The System** — Homepage accordion component (answers "What is this system?", "What do the 4 lanes do?", "How to read the dashboard?", "What is the Nexus Graph?", "Same system, different views", "For AI agents reading this") — this is the single most comprehensive on-page explanation
5. **Sidebar exploration** — `/papers` (Rosetta Stone series), `/graph` (interactive Nexus Graph), `/governance` (lane liveness + blocker status), `/logs` (session + verification logs)
6. **System Evolution** — Dashboard homepage timeline showing chronological governance events, graph snapshots, and verification milestones with evidence links
7. **Repository documentation** (after cloning):
   - `README.md` — tech stack, install, dev commands, project overview
   - `AGENTS.md` — lane identity, git protocol, convergence gate, heartbeat, identity enforcement (for AI agents but human-readable)
   - `library/docs/specs/` — deeper implementation specs
   - `library/docs/failure-modes/` — known issues and mitigations

**Missing:** No `CONTRIBUTING.md`, no dedicated developer onboarding guide. Contributors discover architecture via `UnderstandingTheSystem` component or by reading AGENTS.md.

### For AI Agents (Automated Contributors)

1. **AGENTS.md** — lane identity and operating constraints (MANDATORY first read)
2. `CONVERGENCE_PROTOCOL.md` — 5-phase process
3. `RECIPROCAL_ACCOUNTABILITY.md` — mutual protection protocol
4. `schemas/inbox-message-v1.json` — message schema v1.3
5. `governance/output-provenance.contract.json` — output format contract
6. `src/attestation/` — IdentityEnforcer, Signer, Verifier, TrustStoreManager

AI agents are explicitly addressed in the "For AI Agents Reading This" section of the homepage.

---

## 9. Cross-Lane Graph/Data Indexing Assumptions

### Required Node Fields (from `src/lib/graph-types.ts`)

Every node in the site index must have:
- `id` (unique slug)
- `title` (display name)
- `type` (doc/paper/code/data/config/schema/test-data — determines `TYPE_COLORS`)
- `category` (governance category filter)
- `repo` (one of 4 lane repos; determines `REPO_COLORS` when filtered)
- `connectionCount` (# of edges incident on node)
- `tags[]` (string array; edges form when tags overlap ≥3)
- `status` (`UNVERIFIED`/`VERIFIED`/`CONFLICTED`/`QUARANTINED`) — determines `STATUS_COLORS`
- `verificationCount` (# of times verified by authority edges)
- `contradictionCount` (# of CONTRADICTS edges; 39 indicates tag-group artifact noise)
- `clusterIds[]` (computed cluster membership)
- `governanceLayer` (`constitutional`/`operational`/`theoretical`/`historical`/`evidence`/`application_adjacent`/`unknown`)
- `authorityDepth` (0–100 score combining verification + contradiction + edge counts)
- `bridgeState` (`enforced`/`verified`/`partial`/`documented_only`/`contradicted`/`obsolete`/`unknown`)

### Required Edge Fields

- `source` (node ID), `target` (node ID), `type` (string)
- Optional `authority` enum: `VERIFIES`, `DERIVES_FROM`, `CONTRADICTS`, `SIGNED_BY`, `EXECUTES`, `DEPENDS_ON`

### Computed Assumptions

**Clusters** (`src/lib/graph-clusters.ts`):
- Repo clusters: one per distinct `repo` value, unconditionally
- Tag clusters: only if ≥ `TAG_MIN_SIZE` nodes (default 10)
- Cluster `representativeId` = highest-connection node in cluster

**Graph LOD** (`GraphCanvas.tsx`):
- Far zoom (`cameraRatio < 0.55`): show only cluster representatives (map-level dots)
- Mid zoom (`0.55–1.25`): show high-importance nodes (`authorityDepth≥40` or `verificationCount≥2` or `connectionCount≥4` or `status=CONFLICTED`) plus medium-importance nodes (`authorityDepth≥25` or `verificationCount≥1` or `connectionCount≥2` or neighbors of active nodes)
- Close zoom (`≥1.25`): show all nodes
- Active entry point override: shows all nodes in that entry point's cluster/collection

**Edge visibility:**
- Authority edges: base opacity 0.7, colored `#60A5FA` (blue)
- Non-authority edges: base opacity 0.04 (very faint), further reduced to 0.02 when not connected to active node
- Edges connected to hovered/selected/focused nodes boosted to 0.25 opacity and larger width
- Path edges (guided navigation) colored `#F59E0B` (gold), size 0.8

**Label rendering:**
- Far zoom: no labels
- Mid zoom: labels for active (hover/select/focus) + top 5 most important nodes (by `importance = sqrt(connectionCount)*0.8 + verificationCount*0.6 + authorityDepth/40`)
- Close zoom: active + top 12 important nodes

**Entry points** (sidebar filters):
- "Top Authority", "Contradictions", "Unenforced Claims", "Governance Core", "Active Bridges", "Contradicted Claims", "Authority Mismatch", plus Meaning Layers ("Governance", "Conflicts", "Verification", "Execution", "Structure")
- Repo entry points auto-selected when `?filterMode=repo&filter=<repo>` is active

### Implicit Guarantees

- Every node ID must resolve to a real artifact (document, paper, code, data) indexed by the site search (`data/site-index.json`).
- Edges represent *semantic relationships*, not hyperlinks; derived from shared tags, citations, or explicit `DEPENDS_ON`/`DERIVES_FROM` declarations.
- `contradictionCount = 39` is a known **artifact** of tag-group clustering when the `CONTRADICTION_TAG` group exceeds K(40) complete graph threshold; these nodes are noise, not true conflicts (per `GRAPH_SNAPSHOT_PROTOCOL.md`).
- Graph is a **read-only projection** of the site index; mutating the graph does not alter source documents.

---

## 10. Mismatches and Naming Inconsistencies

### 3-Lane vs 4-Lane Terminology

The system is a 4-lane architecture, but some error messages say "3-lane convergence":

- **`identity-enforcer.js:382`**: `TRUST_STORE_WRITE_BLOCKED: requires 3-lane convergence with signatures` — should read "3-out-of-4 lanes" or "≥3 lanes" for precision.
- **`lanes/broadcast/gate-schema.json:60`**: "User quarantine (UDS > 60) requires 3-lane convergence to unblock" — same wording issue.

The actual quorum is correctly enforced as ≥3 approvals in code (`approvals.length < 3` check). The wording is imprecise but logic is correct. Docs (`RECIPROCAL_ACCOUNTABILITY.md`, `AGENTS.md`) use "multi-lane convergence (3 out of 4 active lanes)" — correct.

### "Library Lane" vs "Library"

The canonical identity per `.session-mode` is `"lane": "library"` (lowercase). `AGENTS.md` consistently says "Library Lane" (capitalized). Both refer to the same entity. `heartbeat-library.json` uses "library lane" lowercase in subject. No functional conflict, but consistent casing would help.

### Authority Level Discrepancy (Critical)

**Canonical (by `.session-mode` v2.0.0 and all `library/docs/`):**
- Library: Position 3, Authority 60

**Incorrect (stale):**
- `AGENTS.md` line 103–104: Position 2, Authority 90
- `.kilocode/rules/memory-bank/brief.md` line 9–10: Position 2, Authority 90

This contradiction is flagged by Kernel audit and appears in `evidence/blocker-classification-updates.md` as `KEY_ID_MAPPING_CONFLICT` (identity divergence across agent contexts). **Fix required:** update AGENTS.md and memory-bank to canonical values.

### Schema Enum Mismatches

**`to` field:** Schema v1.3 allows `broadcast` and `all`; `SchemaValidator.js` only allows `['archivist','library','swarmmind','kernel']`. Kernel messages using `to: "all"` or `broadcast` are being rejected (examples in quarantine). **Fix:** extend enum.

**`execution.engine`:** Validator includes `pipeline`; schema does not. Either add to schema or remove from validator.

**`execution.actor`:** Validator is broader than schema; potential rejections.

### Path Canonicalization

**The system uses absolute S:/ paths as canonical**, but `lanes/*/inbox/` local mirror creates cognitive dissonance. Misunderstanding this leads to editing the wrong directory. All runtime delivery and evidence reference uses S:/ absolute paths; the local `lanes/` copies are for development convenience only. Governance docs should explicitly call out "canonical = S:/..." vs "local development mirror = lanes/...".

---

## 11. Deployment vs Local-Only Paths

### Deployment Configuration

**Vercel:**
- Project: `self-organizing-library` on Vercel
- Auto-deploy from `main` branch enabled
- CLI installed (`npm i -g vercel`) and linked (`vercel link`)
- Build succeeds; production: https://deliberateensemble.works
- Manual deploy sometimes hits ECONNRESET; retry succeeds

**Build:**
- Next.js 16.1.3 (Turbopack in dev, standalone build in prod)
- Postbuild: `npx pagefind` for static search index
- No custom Vercel config (`vercel.json` absent)

### Local-Only Paths

| Path | Purpose | Used in Production? |
|------|---------|---------------------|
| `S:/Archivist-Agent/` | Archivist canonical root | ✅ Yes |
| `S:/SwarmMind/` | SwarmMind canonical root | ✅ Yes |
| `S:/kernel-lane/` | Kernel canonical root | ✅ Yes |
| `lanes/broadcast/` (inside Library repo) | Shared coordination surface | ✅ Yes (Library writes here) |
| `lanes/library/inbox/` (local mirrors) | Development mirror of canonical inbox | ❌ No — production uses S:/self-organizing-library/lanes/library/inbox/ |
| `scripts/` ad-hoc tools | One-off maintenance utilities | ❌ No (not daemonized) |
| `evidence/` (local) | Evidence artifact storage for web UI visibility | ✅ Yes (referenced by API routes) |
| `.identity/` (in each repo) | Lane RSA key pair (private key) | ✅ Yes (runtime identity) |

**Important distinction:** `lanes/<lane>/inbox/` under this repo root is a **local development convenience mirror**. The **canonical inbox** paths used by `SchemaValidator.js` and `heartbeat.js` are absolute S:/ paths. When `inbox-watcher` (when running) reads from inboxes, it reads from canonical S:/ locations. Editing files in the local `lanes/` mirror does not affect cross-lane coordination — you must write to S:/ paths.

---

## 12. Quick Reference: Lane Contacts and Startup

### Starting Lane Infrastructure (Operator Guide)

```bash
# For each lane, ensure env vars:
export LANE_KEY_PASSPHRASE="<passphrase>"
export ARCHIVIST_KEY_PASSPHRASE="..."    # if Archivist
export SWARMMIND_KEY_PASSPHRASE="..."    # if SwarmMind
export KERNEL_KEY_PASSPHRASE="..."       # if Kernel

# Start Library lane worker (serial inbox processing)
node scripts/lane-worker.js --apply --watch --poll-seconds 20

# Start inbox watcher (coordinator — currently NOT RUNNING)
node scripts/inbox-watcher.js --mode manual

# Start heartbeat (liveness + system_state — currently NOT RUNNING)
node scripts/heartbeat.js --interval-seconds 60

# Start Next.js dev server
npm run dev
```

**No supervisor** is configured; processes must be started manually and survive terminal closure (use `screen`, `tmux`, or systemd user services).

### Key Management Scripts

- `scripts/generate-library-keys.js` — generate Library keypair via KeyManager
- `scripts/gen-archivist-key.js` — generate Archivist keypair
- `scripts/identity-self-healing.js` — recover from trust-store drift (requires Archivist coordination)
- `scripts/trust-normalization-test.js` — verify trust-store normalization
- `scripts/fix-heartbeats-truth.js` — deprecated; only `heartbeat.js` may write `system_state.json`

---

## 13. Open Questions / Action Items

### Immediate (Critical)

1. **Resolve Library identity contradiction** (C-LIB-ID-1): Update `AGENTS.md` Position/Authority to Position 3, Authority 60; update memory-bank/brief.md accordingly.
2. **Fix `to` enum** (C-SCHEMA-ENUM-1): Add `broadcast` and `all` to `ENUM_CONSTRAINTS.to`; redeploy; clear quarantined kernel messages.
3. **Sync SwarmMind key_id** (C-TRUST-1): SwarmMind owner must reconcile `keys.json` to match `trust-store.json` ratified value (`1450972ce0a225b7`).
4. **Restart heartbeat and inbox-watcher** (C-WATCHER-1): system_state updates stale without heartbeat; cross-lane coordination degraded without watcher.

### Near-term (Moderate)

5. Reconcile `contradictions.json` with `blocker-classification-updates.md` — either resolve remaining conflicts or update contradictions registry.
6. Clean quarantine spam (Library 113, Kernel 264).
7. Align `execution.engine` enum between SchemaValidator and schema v1.3.
8. Verify post-compact audit `conflicted` status: if still blocked, halt new work per CONVERGENCE_PROTOCOL until Archivist ratification.

### Long-term (Enhancement)

9. Implement Phase 3 OS-level enforcement (seccomp, ACLs, audit) — currently speculative.
10. Supervisor system (PM2/systemd) for auto-restart of daemons.
11. Add npm scripts for hardening-drill, security-drill, watcher, heartbeat (`npm run drill:hardening`, etc.).
12. Create `CONTRIBUTING.md` for human onboarding.
13. Add `vercel.json` for infrastructure-as-code.
14. Implement `NEXUS_GRAPH_EXPLANATION_LAYER.md` overlay for first-time graph users.

---

## 14. Conclusion

The system is a functioning 4-lane constitutional governance lattice with **evidence-based verification** as its core guarantee. It is currently operating in a **degraded but functional state**: lane-workers enforce schema and identity checks, but higher-orchestration daemons (inbox-watcher, heartbeat, act-daemon) are stopped. Governance-sensitive identity conflicts (Library authority level, SwarmMind key_id, trust-store divergence) block full ratification; Archivist intervention is required to clear these blockers.

The dashboard now includes a **System Evolution** timeline (auto-generated from lanes/broadcast/ and evidence/ artifacts) that provides a narrative evidence interface: users can trace governance events, graph snapshots, verification drills, and state changes in chronological order. This turns the system from a static state view into a replayable audit trail.

Cross-lane data movement is designed around **canonical S:/ paths** and **JWS-signed messages** with **Convergence Gate** proof. The web UI exposes a progressive discovery experience (Start Here → Graph → Papers). New contributors encounter a relatively gentle on-ramp but find no formal CONTRIBUTING guide; they must piece together architecture from dispersed docs (AGENTS.md, RECIPROCAL_ACCOUNTABILITY.md, Convergence Protocol, and the homepage's "Understanding The System").

Fix the critical contradictions, restart the daemons, and the system will return to fully governed, automated coordination.

---

**OUTPUT_PROVENANCE:** agent: kilo-auto/free lane: library generated_at: 2026-05-05T00:00:00Z session_id: system-map-20260505

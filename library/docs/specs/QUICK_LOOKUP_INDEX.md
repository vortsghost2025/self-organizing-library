# Quick Lookup Index: Pattern → File → Paper

**One-page cross-reference:** Find any concept, pattern, or rule across the three-lane system.

**Format:**  
`[PATTERN]` — What you observe  
`[APPLIES]` — Which file implements it  
`[SOURCE PAPER]` — Which WE4FREE paper founded it  
`[LANE]` — Which lane owns it

---

## Governance & Constitutional

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Single entry point (all logic routes through one file) | `S:\Archivist-Agent\BOOTSTRAP.md` | Paper 4 (Architecture) | Lane 1 |
| Constitutional constraints hierarchy | `S:\Archivist-Agent\GOVERNANCE.md` | Paper 2 (Constitution-Preserving) | Lane 1 |
| Values (what we believe) | `S:\Archivist-Agent\COVENANT.md` | Paper 2 | Lane 1 |
| Enforcement mechanisms | `S:\Archivist-Agent\CPS_ENFORCEMENT.md` | Paper 1 (Error Handling) | Lane 1 |
| Drift firewall (epistemic integrity) | `S:\Archivist-Agent\DRIFT_FIREWALL.md` | Paper 2 | Lane 1 |
| Dual verification (Lane L + Lane R) | `S:\Archivist-Agent\VERIFICATION_LANES.md` | Paper 4 | Lane 1 |
| 6 verification checkpoints | `S:\Archivist-Agent\CHECKPOINTS.md` | Paper 4 | Lane 1 |
| Self-state resolution precedence | `S:\Archivist-Agent\GOVERNANCE.md` (proposed amendment) | Paper 1 (derived from incident) | Lane 1 |
| Cross-lane write policy | `FILE_OWNERSHIP_REGISTRY.json` (Archivist-Agent root) | Paper 2 (Structure > Identity) | Lane 1 |

---

## Session & State Management

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Session lock format (`.session-lock`) | `S:\SwarmMind\.session-lock` (live) | Paper 1 (state management) | Lane 2 |
| Session registry (master list) | `S:\Archivist-Agent\SESSION_REGISTRY.json` | Paper 1 | Lane 1 |
| Runtime state | `S:\SwarmMind\RUNTIME_STATE.json` | Paper 1 | Lane 2 |
| Session ID fragmentation bug | `SESSION_ID_FRAGMENTATION_FIX.md` (both repos) | Paper 1 (identified failure mode) | Lane 2/3 |
| Self-state aliasing failure mode | `SELF_STATE_ALIASING_FAILURE_MODE.md` (Library) | Paper 1 (new classification) | Lane 3 |
| Source-of-truth precedence rule | `GOVERNANCE.md` (proposed addition) | Paper 1 | Lane 1 |

---

## Lane-Context & Cross-Lane Enforcement

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Lane identity from pwd | `laneContextGate.js:determineLaneFromPath()` | Paper 2 (Structure > Identity) | Lane 2 |
| Ownership registry schema | `FILE_OWNERSHIP_REGISTRY.json` | Paper 4 (Architecture) | Lane 1 |
| Pre-write gate hook | `laneContextGate.js:preWriteGate()` | Paper 1 (constraint enforcement) | Lane 2 |
| Global fs monkey-patch | `laneContextGate.js:patchFs()` | Paper 1 (ubiquitous enforcement) | Lane 2 |
| HOLD state on violation | `laneContextGate.js:enterHold()` | Paper 1 (quarantine protocol) | Lane 2 |
| Operator resolution requirement | `laneContextGate.js:exitHold()` | Paper 5 (Decision Matrix → escalate) | Lane 2 |
| Cross-lane write policy rule | `FILE_OWNERSHIP_REGISTRY.json:cross_lane_write_policy` | Paper 2 | Lane 1 |
| Lane-context reconciliation | `governed-start.js` (initialization sequence) | Paper 4 (pre-flight check) | Lane 2 |

---

## Verification & Testing

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Formal verification gate (Phase 2) | `FORMAL_VERIFICATION_GATE_PHASE2.md` (Library) | Paper 4 (checklist application) | Lane 3 |
| System verification script | `verify.js` | Paper 1 (test-production separation) | Lane 2 |
| Phase 2 integration tests | `test-lane-gate.js`, `verify-phase2.js` | Paper 4 (verification lanes) | Lane 2 |
| Verification lane L (structural) | `VERIFICATION_LANES.md` (Archivist) | Paper 4 | Lane 1 |
| Verification lane R (operational) | `VERIFICATION_LANES.md` (Archivist) | Paper 4 | Lane 1 |
| Consensus rules (L + R agree) | `VERIFICATION_LANES.md` | Paper 4 | Lane 1 |
| Confidence scoring formula | `VERIFICATION_LANES.md:6` | Paper 5 (confidence-adjusted strategy) | Lane 1 |

---

## Error Handling & Resilience

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Decision matrix (domain→strategy→budget) | `S:\Archivist-Agent\DECISION_MATRIX.md` | Paper 5 (core) | Lane 1 |
| Constraint-aware error routing | `laneContextGate.js` (block patterns) | Paper 1 | Lane 2 |
| Quarantine protocol (verification failure) | `resolve-governance-v2.js:enterQuarantine()` | Paper 1 (state transition) | Lane 2 |
| Circuit breaker pattern | `DECISION_MATRIX.md` → Infrastructure domain | Paper 1 | Lane 1 |
| Retry with backoff | `DECISION_MATRIX.md` → Timeout domain | Paper 1 | Lane 1 |
| Graceful degradation | `COVENANT.md` (preserve values while failing) | Paper 2 | Lane 1 |

---

## Multi-Project Coordination

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Three-lane architecture diagram | `MULTI_PROJECT_GIT_SYNTHESIS.md` | Paper 4 (system architecture) | Lane 2 |
| Cross-lane commit convention | `MULTI_PROJECT_GIT_SYNOPSIS.md` (commit format) | Paper 4 (coordination protocol) | Lane 2 |
| Meta-repository proposal | `MULTI_PROJECT_GIT_SYNTHESIS.md` (Option B) | Paper 4 (coordination layer) | Lane 2 |
| Lane relay inbox pattern | `.lane-relay/` directories (mentioned in Archivist) | Paper 4 (message passing) | Lane 1→2, 2→3 |
| Session handoff protocol | `SESSION_HANDOFF_2026-04-17.md` (both repos) | Paper 1 (state continuity) | Lane 1/2 |

---

## Knowledge Library (Lane 3 Specific)

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| NexusGraph spec (self-organizing library) | `S:\self-organizing-library\SPEC.md` | Paper 4 (knowledge architecture) | Lane 3 |
| Bi-directional citations `[[doc-id]]` | `SPEC.md` (Cross-Linking System) | Paper 4 (graph structure) | Lane 3 |
| External source connectors | `SPEC.md` (GitHub, Medium, DOI) | Paper 1 (integration resilience) | Lane 3 |
| Document ingestion pipeline | `SPEC.md` (Document Management) | Paper 5 (workflow automation) | Lane 3 |
| Search + vector embeddings | `SPEC.md` (Search & Indexing) | Paper 1 (semantic retrieval) | Lane 3 |
| Graph visualization | `SPEC.md` (Graph Visualization) | Paper 4 (visual representation) | Lane 3 |
| Library docs categorization | `library/docs/{archivist,failure-modes,papers,pending,specs,verification}/` | Paper 4 (information architecture) | Lane 3 |

---

## Laws, Invariants, Forbidden Patterns

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Law 1: Exhaustive verification | `GOVERNANCE.md:Law 1` | Paper 4 (verification mandatory) | Lane 1 |
| Law 2: Evidence-linked documentation | `GOVERNANCE.md:Law 2` | Paper 1 (evidence before assertion) | Lane 1 |
| Law 3: Test-production separation | `GOVERNANCE.md:Law 3` | Paper 1 (environment isolation) | Lane 1 |
| Law 4: Human intuition override | `GOVERNANCE.md:Law 4` | Paper 2 (human in loop) | Lane 1 |
| Law 5: Confidence ratings mandatory | `GOVERNANCE.md:Law 5` | Paper 5 (confidence-adjusted) | Lane 1 |
| Law 6: Launch documentation required | `GOVERNANCE.md:Law 6` | Paper 4 (audit trail) | Lane 1 |
| Law 7: Evidence before assertion | `GOVERNANCE.md:Law 7` | Paper 1 (CRITICAL) | Lane 1 |
| Invariant 1: Global veto supremacy | `GOVERNANCE.md:Invariant 1` | Paper 2 (stop on veto) | Lane 1 |
| Invariant 2: Drift limit (20%) | `GOVERNANCE.md:Invariant 2` | Paper 1 (outlier detection) | Lane 1 |
| Invariant 3: Structure supremacy | `GOVERNANCE.md:Invariant 3` | Paper 2 (Structure > Identity) | Lane 1 |
| Forbidden: Agreement without verification | `GOVERNANCE.md:Forbidden Patterns` | Paper 1 (drift signal +15) | Lane 1 |
| Forbidden: Identity fusion ("we") | `GOVERNANCE.md:Forbidden Patterns` | Paper 2 (+20 drift) | Lane 1 |
| Forbidden: Confidence mirroring | `GOVERNANCE.md:Forbidden Patterns` | Paper 5 (+15 drift) | Lane 1 |

---

## Failure Modes & Incidents

| Failure Mode | Document File | Root Cause | Fix |
|--------------|---------------|------------|-----|
| Session ID fragmentation | `SESSION_ID_FRAGMENTATION_FIX.md` (SwarmMind) | No unified session identity across lanes | Sync `.session-lock` ↔ `RUNTIME_STATE.json` ↔ `SESSION_REGISTRY.json` on startup |
| Self-state aliasing | `SELF_STATE_ALIASING_FAILURE_MODE.md` (Library) | Stale artifacts prioritized over live runtime | Source-of-truth precedence (runtime > lock > registry > history) |
| Cross-lane write gap (pre-phase2) | `ARCHIVIST_HALLUCINATION_ANALYSIS.md` (SwarmMind) | No pre-write gate | Implement `LaneContextGate` with global fs patch |
| Context boundary failure | `CONTEXT_BOUNDARY_FAILURE_2026-04-16.md` (SwarmMind) | Governance not discovered | `GOVERNANCE_MANIFEST.json` + resolver |
| Lane identity confusion | `THREE_LANE_STATUS_2026-04-17.md` (SwarmMind) | `.session-lock` bound to different lane than pwd | Lane-context reconciliation at startup |

---

## Configuration & Schema Files

| Pattern | File | Paper | Lane |
|---------|------|-------|------|
| Governance manifest schema | `GOVERNANCE_MANIFEST.json` | Paper 4 (configuration) | Lane 2 |
| Governance resolution output | `GOVERNANCE_RESOLUTION.json` | Paper 1 (runtime state) | Lane 2 |
| File ownership registry schema | `FILE_OWNERSHIP_REGISTRY.json` | Paper 4 (boundary definition) | Lane 1 |
| Session mode templates | `SESSION_MODE_TEMPLATE.md` (spec) | Paper 4 (mode config) | Lane 1 |
| Kilo agent config | `kilo.json` | Paper 5 (orchestrator config) | Lane 2 |
| SwarmMind config | `swarmmind-config.json` | Paper 5 (agent behavior) | Lane 2 |

---

## Commands & Cheat Sheets

| Command | Purpose | Lane Context |
|---------|---------|--------------|
| `npm start` (governed) | Start SwarmMind with governance | Requires `S:\Archivist-Agent\` accessible |
| `node scripts/governed-start.js` | Same as above (explicit) | Same |
| `node src/app.js` | Isolated demo (no governance) | Single-lane only |
| `node scripts/verify-phase2.js` | Check Phase 2 gate integration | Lane 2 self-test |
| `node scripts/test-lane-gate.js` | Full gate behavior test | Lane 2 unit tests |
| `node -e "...fs.writeFileSync..."` | Manual cross-lane write test | Will be blocked by gate (if in same process) |
| `git commit -m "[LANE-2]..."` | Cross-lane commit convention | Requires referencing dependent lanes |

---

## Three-Lane Quick Reference

```
LANE 1 — Archivist-Agent (Authority 100)
  Role: Governance Root & Structural Verification (Lane L)
  Key files: BOOTSTRAP.md, GOVERNANCE.md, FILE_OWNERSHIP_REGISTRY.json
  Commands: (Tauri app; not node-based)
  Authority: Can write anywhere; defines lane boundaries

LANE 2 — SwarmMind (Authority 80)
  Role: Execution & Self-Optimization (Multi-Agent Swarm)
  Key files: src/core/laneContextGate.js, scripts/governed-start.js
  Commands: npm start, node scripts/governed-start.js
  Authority: Can write to own lane only; blocked from Archivist (100) and Library (60)

LANE 3 — self-organizing-library (Authority 60)
  Role: Knowledge Graph & Verification (Lane R)
  Key files: SPEC.md, AGENTS.md, library/docs/
  Commands: (Next.js app; npm run dev)
  Authority: Can write to own lane only; lowest in hierarchy
```

---

## Emergency Reference

**Problem:** "System is frozen, won't write anything"  
**Cause:** HOLD state active from cross-lane block or lane-context mismatch  
**Fix:** `gate.exitHold('operator-clear')` or restart with corrected `.session-lock`

**Problem:** "Gate not loading, cross-lane writes succeed"  
**Cause:** `governed-start.js` not used; running isolated mode  
**Fix:** Use `npm start` (not `node src/app.js`); ensure `patchFs()` called

**Problem:** "Session ID mismatch errors"  
**Cause:** `.session-lock` and `RUNTIME_STATE.json` out of sync  
**Fix:** On startup, gate auto-syncs; if manual: copy `.session-lock.session_id` → `RUNTIME_STATE.json.session.id`

**Problem:** "Cannot determine lane from path"  
**Cause:** Path not in FILE_OWNERSHIP_REGISTRY  
**Fix:** Registry defaults to `archivist-agent`; add path to registry if new lane created

---

**Index maintained by:** Library Lane 3 (self-organizing-library)  
**Source material:** `S:\self-organizing-library\context-buffer\` (20 documents)  
**Last synchronized:** 2026-04-18T12:20:24-04:00  
**Status:** STABLE — Aligned with Phase 2 implementation commit `fc988c9`

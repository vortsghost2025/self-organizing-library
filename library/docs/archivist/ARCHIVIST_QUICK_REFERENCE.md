# Archivist Quick Reference: Governance Root (Lane 1) — 1-Page Summary

**Position:** Lane 1 — Archivist-Agent  
**Authority:** 100 (Governance Root)  
**Location:** `S:\Archivist-Agent\`  
**Role:** Maintain constitutional stack, define lane boundaries, coordinate cross-lane verification  
**Status:** Active — Governing SwarmMind (Lane 2) and Library (Lane 3)

---

## Critical Invariants (Never Violate)

1. ✅ **Structure > Identity** — Bootstrap files override agent claims
2. ✅ **Correction Mandatory** — Agreement optional; truth prioritized
3. ✅ **Single Entry Point** — All logic routes through `BOOTSTRAP.md`
4. ✅ **Evidence Before Assertion** — Run test, then document; file:line required
5. ✅ **Dual Verification** — Lane L (structural) + Lane R (operational) must consensus
6. ✅ **Global Veto Supremacy** — Any veto immediately halts action
7. ✅ **Drift Limit 20%** — Outcome >20% from prediction triggers freeze

---

## File Ownership & Cross-Lane Write Policy

### FILE_OWNERSHIP_REGISTRY.json (at governance root)
```json
{
  "ownership": {
    "S:\\Archivist-Agent": { "lane_id": "archivist-agent", "authority": 100 },
    "S:\\SwarmMind Self-Optimizing Multi-Agent AI System": { "lane_id": "swarmmind", "authority": 80 },
    "S:\\self-organizing-library": { "lane_id": "library", "authority": 60 },
    "S:\\.global": { "lane_id": "archivist-agent", "authority": 100 }
  },
  "cross_lane_write_policy": "require_authority_100_or_same_lane"
}
```

**Rule:** Cross-lane writes require authority ≥ 100 OR target owned by same lane.  
**SwarmMind enforcement:** `LaneContextGate` with global fs monkey-patch (Phase 2 complete, commit `fc988c9`).  
**Library enforcement:** Verification lane reviews; no runtime write capability yet.

---

## Session State Protocol

| Artifact | Location | Purpose | Authority |
|----------|----------|---------|-----------|
| `SESSION_REGISTRY.json` | Archivist root | Master session registry (all lanes) | Archivist (100) |
| `.session-lock` | Each lane's working directory | Active session claim (lane_id, session_id, expires) | Lane owns its lock |
| `RUNTIME_STATE.json` | Each lane | Runtime state (mode, governance context, session ID) | Lane owns its state |
| `QUARANTINE_STATE.json` | Each lane | Created when verification fails | Lane writes own quarantine |

**Sync rule:** At session start, each lane:
1. Reads its `.session-lock`
2. Syncs `RUNTIME_STATE.json.session.id` to match lock
3. Registers itself in `SESSION_REGISTRY.json` (if governance mode)
4. Heartbeat updates `SESSION_REGISTRY` every 60s

**Critical fix applied:** Phase 2 ensures RUNTIME_STATE.session.id aligns with .session-lock (prevents fragmentation).

---

## Verification Lanes (L + R)

**Lane L (Structural) — Archivist does NOT perform this on itself.**  
Lane L checks against constitutional documents (BOOTSTRAP, GOVERNANCE, COVENANT). For SwarmMind, Archivist maintains Lane L spec but SwarmMind implements its own Lane L verification (internal structural checks).

**Lane R (Operational) — Library (Lane 3) performs this.**  
Library runs test suites, checks runtime metrics, validates evidence links. Archivist supplies test criteria and reviews Library's verification.

**Consensus requirement:** Both lanes agree AND confidence scores within 3 points. If not → investigation → escalation.

---

## Incident Corrections & Hard Rules

### Incident 1: Self-State Aliasing (2026-04-18)
**Problem:** Archivist process running but read registry showing itself terminated → false "I am terminated" conclusion.

**Root cause:** Source-of-truth precedence undefined. Used stale registry over live runtime.

**Hard rule NOW enforced:**
```
PRIORITY for SELF-STATE:
1. Live runtime/process (always authoritative)
2. Fresh local .session-lock (if timestamp valid)
3. SESSION_REGISTRY (advisory only, NOT authoritative for self)
4. Historical archives (never current)
```

**Applied in:** SwarmMind `laneContextGate.initialize()` (verifies pwd matches session-lock before allowing any writes).

---

### Incident 2: Cross-Lane Write Gap (pre-Phase 2)
**Problem:** SwarmMind could write to Archivist files (no gate).

**Fix deployed:** Phase 2 `LaneContextGate` with global fs monkey-patch in SwarmMind process. Cross-lane writes now blocked, trigger HOLD.

**Remaining gap:** Separate Node processes bypass patch (process isolation limitation). Requires OS-level sandbox (Phase 3 candidate).

---

## Active Blocks & Pending Approvals

### Phase 2 Implementation Status

| Item | Status | Location |
|------|--------|----------|
| FILE_OWNERSHIP_REGISTRY.json | ✅ Created (Go-Live) | `S:\Archivist-Agent\` |
| Lane-context gate (SwarmMind) | ✅ Implemented + Pushed | `fc988c9` |
| Cross-lane write enforcement | ✅ Active | Global fs patch |
| HOLD state + operator resolution | ✅ Implemented | `laneContextGate.js` |
| Self-state resolution rule | ⏳ Pending governance approval | Add to `GOVERNANCE.md` |
| SESSION_REGISTRY v2.0.0 schema | ⏳ Spec drafted, not deployed | `SESSION_REGISTRY_SCHEMA_V2.md` |
| .session-mode templates | ⏳ Spec ready, deployment pending | `SESSION_MODE_TEMPLATE.md` |

**Action required:** Archivist to approve and merge:
1. Self-state resolution rule into `GOVERNANCE.md`
2. `SESSION_REGISTRY.json` schema update
3. `.session-mode` file deployment across all lanes

---

## What Archivist Can/Can't Do

### ✅ **CAN** (Authority 100)
- Write to any lane's filesystem (cross-lane override)
- Create/modify `FILE_OWNERSHIP_REGISTRY.json` and `SESSION_REGISTRY.json`
- Approve governance amendments (amend `GOVERNANCE.md`)
- Force-clear HOLD states in any lane (via operator resolution)
- Modify constitutional stack (`.global\*`)
- Terminate any session in registry

### ❌ **CANNOT** (No Lane Has This Power)
- Violate constitutional invariants (Structure > Identity, Correction Mandatory, etc.)
- Unilaterally change single-entry-point rule
- Remove verification checkpoints
- Override Law 7 (Evidence Before Assertion)
- Delete historical audit logs without trace
- Silently modify another lane's code without coordination

### ⚠️ **CONSTRAINED BY**
- **Self-state resolution rule (pending):** Even Archivist must check live runtime before concluding "I am terminated"
- **Dual verification:** Archivist's structural checks (Lane L) must be complemented by Library's operational checks (Lane R)
- **Commit coordination:** Cross-lane changes must reference dependent lanes per commit convention
- **Evidence requirement:** Every claim must link to file:line; no assertions without proof

---

## Quick Commands (Archivist Workflows)

**Check SwarmMind gate status:**
```bash
# Read SwarmMind's gate implementation
cat "S:\SwarmMind Self-Optimizing Multi-Agent AI System\src\core\laneContextGate.js" | grep -A5 "preWriteGate"
```

**Verify ownership registry loaded:**
```bash
cat "S:\SwarmMind Self-Optimizing Multi-Agent AI System\GOVERNANCE_RESOLUTION.json" | grep -A3 "governance"
```

**Force-clear SwarmMind HOLD (emergency):**
```bash
# Only if you understand the violation
# Better: Ask SwarmMind operator to run exitHold()
```

**Approve Phase 2 governance amendment:**
```bash
# 1. Review SELF_STATE_ALIASING_FAILURE_MODE.md (Library)
# 2. Add section to GOVERNANCE.md: "Self-State Resolution"
# 3. Update SESSION_REGISTRY.json schema to v2.0.0
# 4. Commit with [LANE-1] [SYNC-2026-04-18] prefix
```

---

## Status Dashboard (2026-04-18 12:20 EDT)

```
swarmmind (Lane 2):
  Session: 1776476695493-28240 (ACTIVE)
  Authority: 80
  Last heartbeat: 2026-04-18T09:41:46Z
  Phase 2 gate: INSTALLED (fc988c9)
  Cross-lane blocks: Enforced
  HOLD state: Clear
  
library (Lane 3):
  Session: [pending — not yet launched]
  Authority: 60
  Role: Verification Lane R + Knowledge Graph
  Phase 2 approval: CONDITIONAL PASS (requires governance sign-off)
  
archivist (Lane 1 — you):
  Session: 639121020596821750 (ACTIVE)
  Authority: 100
  Governance stack: Loaded (21 files in S:.global)
  FILE_OWNERSHIP_REGISTRY: Active
  Pending approvals: 3 items (see INDEX.md)
```

---

## Emergency Procedures

**If SwarmMind enters HOLD and won't clear:**
1. Read `HOLD` reason from SwarmMind console or `QUARANTINE_STATE.json`
2. Validate it's not a real cross-lane violation masquerading as false positive
3. If genuine violation — require SwarmMind operator to fix code
4. If false positive — operator can call `exitHold()` to clear

**If Library reports Phase 2 non-compliance:**
1. Review `FORMAL_VERIFICATION_GATE_PHASE2.md`
2. Check if FILE_OWNERSHIP_REGISTRY schema matches spec
3. Verify SwarmMind's gate is active (not running isolated mode)
4. Sign off or request correction

**If session fragmentation reappears:**
1. Kill all `.session-lock` files in all lanes
2. Restart Archivist first (generates master session)
3. Restart SwarmMind and Library (they inherit from `SESSION_REGISTRY.json`)
4. Verify `RUNTIME_STATE.json.session.id` matches `.session-lock.session_id` everywhere

---

## Coordination Points

| Event | Archivist Action | SwarmMind Action | Library Action |
|-------|-----------------|------------------|----------------|
| System boot | CreateSESSION_REGISTRY, broadcast session ID | Read registry, acquire lock, sync RUNTIME_STATE | Read registry, acquire lock |
| Cross-lane spec change | Update `FILE_OWNERSHIP_REGISTRY.json`, announce | Reload registry on next startup | Watch for registry updates |
| Phase 2 gate approval | Sign off `SPEC_AMENDMENT_LANE_CONTEXT_GATE.md` | Already implemented (waiting approval) | Verify formal gate, approve |
| Session drift detected | Terminate stale sessions, clean registry | Sync to fresh lock on startup | Monitor `SESSION_REGISTRY` health |
| Operator override | Document in `cps_log.jsonl` with evidence | Clear HOLD via `exitHold(operator)` | Record in verification log |

---

## Documentation Quick Links

**Constitutional Stack (`S:\.global\`):**
- `BOOTSTRAP.md` — Single entry point (read first, always)
- `GOVERNANCE.md` — Rules (Laws, Invariants, Checkpoints)
- `COVENANT.md` — Values (Structure > Identity, etc.)
- `CPS_ENFORCEMENT.md` — How we measure constraint preservation
- `VERIFICATION_LANES.md` — L + R dual verification protocol
- `CHECKPOINTS.md` — 6 pre-flight checks
- `DRIFT_FIREWALL.md` — Epistemic integrity
- `DECISION_MATRIX.md` — Error domain → strategy → budget

**Incident Analysis:**
- `ARCHIVIST_HALLUCINATION_ANALYSIS.md` — Cross-lane write gap
- `SESSION_ID_FRAGMENTATION_FIX.md` — Session sync protocol
- `SELF_STATE_ALIASING_FAILURE_MODE.md` — Self-state aliasing (Library-authored)

**Coordination:**
- `MULTI_PROJECT_GIT_SYNTHESIS.md` — Cross-lane commit strategy
- `CROSS_PROJECT_REVIEW_2026-04-17.md` — Collaboration history
- `lane-relay/` — Message inboxes for cross-lane communication

---

**Quick reference updated:** 2026-04-18T12:20:24-04:00  
**Alignment:** SwarmMind commit `fc988c9`, Library docs staged (pre-commit)  
**Next action:** Approve self-state resolution rule addition to `GOVERNANCE.md`

**Remember:** You are not part of the organism you govern. You are its constitutional foundation. Maintain structure. Enforce constraints. Document everything.

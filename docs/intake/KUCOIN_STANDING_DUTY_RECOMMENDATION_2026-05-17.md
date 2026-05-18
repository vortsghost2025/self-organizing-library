OUTPUT_PROVENANCE:
  agent: kilo
  lane: library
  target: kucoin-standing-duty-recommendation
  generated_at: 2026-05-17T21:31:21-04:00
  session_id: kilo-2026-05-17-standing-duty

# KuCoin Standing-Duty Recommendation

**Date**: 2026-05-17
**Agent**: Library Lane (kilo)
**Task**: Mission 6B — Governance/evidence-oriented standing-duty recommendation for KuCoin lane
**Constraint**: NO live-trading activation proposed. This is a Library verification and evidence document.

---

## Current State (Evidence-Based)

### Local Surface — ALL STALE
- `SESSION_STATE.json`: cycle=0, DryRunExecutor, status=test, timestamp 2026-05-16T19:32:53 — **STALE TEST ARTIFACT**
- `bot_heartbeat_dry_run.json`: shutdown, pid 267732, uptime 0.002s — **SHUTDOWN**
- `bot_heartbeat_live.json`: shutdown, pid 300248, uptime 0.0008s — **SHUTDOWN**
- `bot_heartbeat.json`: `{"test": true}` — **TEST ONLY**
- `portfolio_cb_state.json`: all-zero equity, circuit breaker inactive — **INACTIVE**
- `hourly_snapshots.jsonl`: 1 entry confirming stale state — **CONFIRMS STALE**

### Headless Surface — DIVERGENT
- Headless kucoin-lane HEAD: `561f4a3` vs local HEAD `1862addb` — **DIVERGENCE DETECTED**
- Arrival manifest (`00_BOT_ARRIVAL_MANIFEST.md`): repo landed clean on headless
- Missing from local: `latest-monitoring-snapshot.md`, `agent-logs/latest-kucoin-session.md`, `agent-logs/kucoin-session-heartbeats.jsonl` — **LIKELY HEADLESS-ONLY**

### Control Plane — IMPLEMENTED, AWAITING
- Campaign status: Phase A-D ALL PASS, Phase E (unit tests) WAITING
- Decision gate: `PHASE_D_PASSED_AWAITING_PHASE_E`
- Live trading: **FORBIDDEN** by campaign policy
- `cp-supervise.ps1`: Fully implemented KuCoin live session observability with freshness labels and drift flags
- CP correctly classifies all local artifacts as stale

---

## Governance Posture Assessment

| Aspect | Status | Evidence |
|--------|--------|----------|
| KuCoin lane identity | **stale** | All local artifacts are shutdown/test |
| Headless KuCoin state | **claimed** | Arrival manifest exists, but HEAD divergence makes current state uncertain |
| CP supervision readiness | **confirmed** | cp-supervise.ps1 fully implements live-session observability |
| Campaign decision gate | **requires operator attention** | Phase D passed, Phase E not started, no authorized path to live trading |
| Local↔headless sync | **contradicted** | HEAD divergence (1862addb vs 561f4a3) needs resolution |

---

## Standing-Duty Recommendations

### 1. Evidence Collection (Safe, Read-Only)

**Action**: Run `cp-supervise.ps1` against headless to capture current KuCoin state with provenance metadata.

**Justification**: The CP supervision script is the canonical observability tool. It computes freshness labels and drift flags from the headless surface. Running it produces a dated, signed evidence artifact without touching any KuCoin operational state.

**Risk**: None. Read-only inspection via SSH.

### 2. Head Divergence Resolution (Safe, Coordination)

**Action**: Compare local kucoin-lane HEAD `1862addb` with headless HEAD `561f4a3`. Determine which is authoritative. If headless is ahead (likely — deployment target), consider rebasing or resetting local to match.

**Justification**: Divergent HEADs create ambiguity about which code is actually running. The arrival manifest confirms headless received a clean deployment, suggesting headless is the running version.

**Risk**: Low if read-only comparison first. Any merge/rebase requires operator approval.

### 3. Phase E Test Execution (Governance Gate)

**Action**: Execute Phase E unit tests to advance the campaign decision gate past `PHASE_D_PASSED_AWAITING_PHASE_E`.

**Justification**: Phase E is the next governance gate. Until it passes, the campaign is stalled. Tests are read-only/evidence-producing.

**Risk**: Low — unit tests are non-mutating. However, test execution authority should come from operator or Archivist.

### 4. Monitoring Continuity (Safe, Ongoing)

**Action**: Schedule regular `cp-supervise.ps1` runs (e.g., every 6 hours) to maintain evidence continuity for KuCoin lane state.

**Justification**: Without periodic evidence capture, the Library cannot classify KuCoin's current state. The last supervision report is from 2026-05-14 — 3 days stale.

**Risk**: None. Read-only.

### 5. Live Trading — DO NOT ACTIVATE

**Action**: None. Live trading remains FORBIDDEN per campaign policy.

**Justification**: No evidence supports live trading readiness. Phase E not passed. Local artifacts are stale. Headless state uncertain due to HEAD divergence. Circuit breaker has zero test coverage. Operator must explicitly authorize any live trading activation.

**Risk**: Activation without operator approval would violate campaign decision gate and governance constraints.

---

## Prioritized Action Sequence

| Priority | Action | Owner | Status | Blocker |
|----------|--------|-------|--------|---------|
| P0 | Run cp-supervise.ps1 against headless | CP/Library | Ready | None |
| P0 | Resolve kucoin-lane HEAD divergence | Operator | Blocked | Needs merge/rebase decision |
| P1 | Execute Phase E unit tests | Operator/Archivist | Blocked | Needs authorization |
| P1 | Schedule regular cp-supervise evidence capture | CP/Library | Ready | None (cron/systemd timer) |
| P2 | Investigate missing headless-only artifacts | Library | Ready | SSH access to headless |
| FORBIDDEN | Live trading activation | — | FORBIDDEN | Campaign decision gate |

---

## What Library Can Do Without Operator

1. Run cp-supervise.ps1 (if SSH credentials are available)
2. Document HEAD divergence with git diff analysis
3. Capture and classify any new evidence that arrives in Library inbox
4. Maintain evidence continuity through periodic verification scans

## What Requires Operator Decision

1. Resolving kucoin-lane HEAD divergence (merge direction)
2. Authorizing Phase E test execution
3. Any action beyond read-only evidence collection
4. Live trading (explicitly FORBIDDEN without operator authorization)

---

## Evidence References

- `docs/intake/KUCOIN_HEADLESS_OBSERVABILITY_EVIDENCE_2026-05-17.md` — Mission 1 full evidence
- `docs/intake/CONTROL_PLANE_KUCOIN_LIVE_SESSION_CONVERGENCE_2026-05-17.md` — Mission 2 CP analysis
- `docs/status/LOCAL_HEADLESS_RECONCILIATION_2026-05-17.md` — Mission 3 reconciliation
- `KUCOIN_CAMPAIGN_STATUS.md` — Campaign phase tracking
- `KUCOIN_CAMPAIGN_DECISION_GATE.md` — Formal decision gate state machine

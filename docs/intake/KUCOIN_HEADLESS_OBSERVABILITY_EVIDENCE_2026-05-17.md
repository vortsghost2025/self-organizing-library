OUTPUT_PROVENANCE:
  agent: kilo
  lane: library
  target: kucoin-evidence-intake
  generated_at: 2026-05-17T20:14:28-04:00
  session_id: kilo-2026-05-17-standing-duty

# KuCoin Headless Observability Evidence — 2026-05-17

**Classification:** LIBRARY EVIDENCE — READ-ONLY INTAKE
**Posture:** stale / requires operator attention
**Inspector:** Library Lane (kilo runtime)
**Scope:** Local surface only (headless artifacts not directly accessible; see Q6)

---

## Q1: Freshness — Are the local KuCoin artifacts fresh enough to represent a live session?

**Verdict: NO — all artifacts are stale, shutdown, or test-only.**

| Artifact | Timestamp | Status | Freshness |
|----------|-----------|--------|-----------|
| `SESSION_STATE.json` | 2026-05-16T19:32:53Z | `status: test`, `cycle: 0`, `uptime: 0.000136s` | **STALE** — test artifact, not a live session |
| `bot_heartbeat_dry_run.json` | 2026-05-16T16:34:19Z | `status: shutdown`, `pid: 267732` | **STALE** — shutdown >24h ago |
| `bot_heartbeat_live.json` | 2026-05-16T15:16:09Z | `status: shutdown`, `pid: 300248` | **STALE** — shutdown >24h ago |
| `bot_heartbeat.json` (generic) | epoch 1778963659 (~2026-05-16) | `test: true` | **STALE** — test-only, no operational data |
| `portfolio_cb_state.json` | (no timestamp) | all-zero equity, `tripped: false` | **INACTIVE** — circuit breaker never activated |
| `hourly_snapshots.jsonl` | 2026-05-16T23:49:31Z | 1 entry, records stale SESSION_STATE | **STALE** — snapshot of stale state |

**Conclusion:** No live session exists on the local surface. The most recent operational timestamp is 2026-05-16T19:32:53Z (>24h old) and that was a test artifact, not a production session. The last genuine heartbeat (live) shut down at 2026-05-16T15:16:09Z.

---

## Q2: Coherence — Do the artifacts tell a consistent story?

**Verdict: PARTIALLY COHERENT — they consistently describe "no live session", but artifact types are incomplete.**

The artifacts that DO exist are coherent: SESSION_STATE says test/shutdown, both heartbeats say shutdown, portfolio circuit breaker shows no activity, and the single hourly snapshot confirms stale state. There is no contradiction among the present artifacts.

However, coherence is undermined by **missing artifacts**:
- `agent-logs/latest-kucoin-session.md` — NOT PRESENT on local
- `agent-logs/kucoin-session-heartbeats.jsonl` — NOT PRESENT on local
- `docs/automation/latest-monitoring-snapshot.md` — NOT PRESENT on local

These are expected by the Control Plane's `Get-KucoinLiveSessionCard` function but do not exist on the local Windows surface. They likely exist only on the headless (Ubuntu) deployment.

**Coherence assessment:** The present artifacts are mutually consistent. The absent artifacts create an incomplete picture — the local surface cannot provide the full observability story that the headless surface can.

---

## Q3: Heartbeat Plausibility — Are heartbeat values plausible for a running bot?

**Verdict: NOT PLAUSIBLE — all heartbeats represent shutdown or test states, not a running bot.**

| Heartbeat | PID | Uptime | Status | Plausible? |
|-----------|-----|--------|--------|------------|
| dry_run | 267732 | 0.002s | shutdown | No — uptime too short for operational session |
| live | 300248 | 0.0008s | shutdown | No — uptime too short for operational session |
| generic | (none) | (none) | test=true | No — test flag, no operational data |

No heartbeat shows an uptime consistent with a running trading bot (which would typically show uptime of minutes to hours). The sub-second uptimes indicate the processes started and immediately exited — consistent with test invocations or startup failures, not sustained operation.

---

## Q4: Snapshot Consistency — Does the monitoring snapshot match the raw state?

**Verdict: CONSISTENT — the single hourly snapshot accurately reflects the stale raw state.**

The `hourly_snapshots.jsonl` entry (2026-05-16T23:49:31Z) records:
- `session_status: test` — matches SESSION_STATE.json
- `heartbeat_status: shutdown` — matches both heartbeat files
- Timestamp is later than the raw artifacts, confirming it was captured after the session ended

The snapshot is an accurate reflection of the underlying state. However, with only 1 snapshot entry, there is no time-series to analyze trend or degradation patterns.

---

## Q5: Discrepancy vs Claims — Do any KuCoin claims contradict the evidence?

**Verdict: NO ACTIVE CONTRADICTION — but only because no recent claims have been made.**

The KuCoin Campaign Status (`KUCOIN_CAMPAIGN_STATUS.md` from CP intake) records:
- Phase A-D: ALL PASS
- Phase E (unit tests): WAITING
- Live trading: FORBIDDEN
- Decision gate: `PHASE_D_PASSED_AWAITING_PHASE_E`

This is **consistent** with the observed state: Phases A-D passed in controlled testing, Phase E is not yet attempted, and no live trading is authorized. The stale/shutdown heartbeats are expected because the bot has not been deployed for sustained operation.

**Prior claim check:** The CP supervision report (2026-05-14) showed 4 P0 and 9 P1 stale alerts from April 19. These are old alerts and do not contradict current evidence — they represent a known historical gap, not an active mismatch.

---

## Q6: Source-of-Truth Map — Where should each artifact be read from?

**Verdict: HEADLESS is the authoritative source for all live observability data. LOCAL is a mirror/test surface only.**

| Artifact | Local Path | Headless Path | Authoritative Source | Notes |
|----------|------------|---------------|---------------------|-------|
| SESSION_STATE.json | `kucoin-lane/inbox/` | `~/kucoin-lane/inbox/` | **Headless** | Local is test artifact |
| bot_heartbeat_live.json | `kucoin-lane/` | `~/kucoin-lane/` | **Headless** | Local is shutdown |
| bot_heartbeat_dry_run.json | `kucoin-lane/` | `~/kucoin-lane/` | **Headless** | Local is shutdown |
| hourly_snapshots.jsonl | `kucoin-lane/state/monitoring/` | `~/kucoin-lane/state/monitoring/` | **Headless** | Local has 1 entry only |
| latest-kucoin-session.md | **MISSING** | `~/kucoin-lane/agent-logs/` | **Headless-only** | Does not exist locally |
| kucoin-session-heartbeats.jsonl | **MISSING** | `~/kucoin-lane/agent-logs/` | **Headless-only** | Does not exist locally |
| latest-monitoring-snapshot.md | **MISSING** | `~/kucoin-lane/docs/automation/` | **Headless-only** | Does not exist locally |
| portfolio_cb_state.json | `kucoin-lane/` | `~/kucoin-lane/` | **Headless** | Both show inactive; headless may differ |

**Key finding:** 3 of 7 expected observability artifacts do not exist on the local surface at all. The Control Plane's `cp-supervise.ps1` correctly handles this by probing headless first via SSH (`Get-HeadlessFileBundle`), falling back to Windows mirror paths. This design is appropriate given the local surface is incomplete.

---

## Summary Classification

| Dimension | Classification | Confidence |
|-----------|---------------|------------|
| Freshness | **stale** | Confirmed — all artifacts >24h old, test/shutdown |
| Coherence | **stale** (partial) | Confirmed — present artifacts consistent, 3 missing |
| Heartbeat plausibility | **stale** | Confirmed — no plausible running-bot heartbeat |
| Snapshot consistency | **confirmed** | Confirmed — snapshot matches raw state |
| Discrepancy vs claims | **confirmed** (no contradiction) | Confirmed — campaign status matches observed state |
| Source-of-truth | **confirmed** | Confirmed — headless is authoritative for 7/7 artifacts |

**Overall verdict:** All local KuCoin artifacts are stale/shutdown/test. No live session evidence exists on the local surface. Headless is the sole authoritative source. No contradiction with campaign claims. **Requires operator attention** for: (1) Phase E unit test execution decision, (2) headless artifact freshness verification, (3) local mirror synchronization if local observability is desired.

---

_Evidence captured by Library Lane (kilo runtime) on 2026-05-17. Read-only intake — no mutations performed._

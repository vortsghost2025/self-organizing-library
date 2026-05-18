OUTPUT_PROVENANCE:
  agent: kilo
  lane: library
  target: local-headless-reconciliation
  generated_at: 2026-05-17T20:14:28-04:00
  session_id: kilo-2026-05-17-standing-duty

# Local vs Headless Reconciliation Pass — 2026-05-17

**Classification:** LIBRARY EVIDENCE — READ-ONLY RECONCILIATION
**Posture:** requires operator attention
**Inspector:** Library Lane (kilo runtime)
**Scope:** Bounded sweep across local and headless surfaces for 3 primary repos

---

## Repo 1: self-organizing-library

| Property | Value |
|----------|-------|
| Local branch | `main` |
| Local HEAD | `d1926713` |
| Working tree | **49 dirty files** |
| Ahead/behind origin | 0 / 0 |
| Last known commit message | "fix: clear resolved_at on recommendation re-activation (DEF-003)" |
| Headless HEAD | Not directly observed (no SSH access in this session) |
| Headless status | Unknown — last CP supervision report (2026-05-14) showed library heartbeat with 1.4h uptime |

**Alignment verdict:** Local is even with origin but carries **49 uncommitted changes**. This is a significant dirty working tree. If the headless deployment pulled from origin, it would be behind the local working state by these 49 files. The changes must be committed and pushed before headless can converge.

**Risk:** HIGH — 49 dirty files represent potential divergence if headless runs from origin HEAD while local has uncommitted work.

---

## Repo 2: kucoin-lane

| Property | Value |
|----------|-------|
| Local branch | `main` |
| Local HEAD | `1862addb` |
| Working tree | **46 dirty files** |
| Ahead/behind origin | 0 / 0 |
| Headless HEAD (at arrival) | `561f4a3` (from `00_BOT_ARRIVAL_MANIFEST.md`) |
| Headless HEAD (current) | Not directly observed |
| Local session state | STALE — test/shutdown artifacts only |
| Headless session state | Not directly observed; 3 artifacts missing locally (exist headless-only) |

**Alignment verdict:** **DIVERGENCE DETECTED.** The local HEAD (`1862addb`) differs from the headless HEAD at arrival time (`561f4a3`). Both repos are even with their respective origin remotes (ahead/behind = 0/0), meaning this divergence exists in committed history — either the local was rebased/recommitted after deployment, or the headless has its own commits not pushed to the shared remote.

Additionally, 46 dirty local files compound the divergence: the local working tree is further ahead of what any headless deployment would see.

**Risk:** HIGH — committed HEAD divergence + 46 dirty files = significant local/headless misalignment. The CP's `cp-kucoin-arrival.sh` captured the headless state at arrival, but subsequent local changes have not been synchronized.

---

## Repo 3: WE4FREE-Control-Plane

| Property | Value |
|----------|-------|
| Local branch | `main` |
| Local HEAD | `adf314ba` |
| Working tree | **38 dirty files** |
| Ahead/behind origin | 0 / 0 |
| CP state cache | Lane heads all UNKNOWN (local paths not visible to CP) |
| Ollama status | Available (qwen2.5-coder models) |
| Last supervision report | 2026-05-14 — all services green, 4 P0 + 9 P1 stale alerts |

**Alignment verdict:** Local is even with origin but carries **38 uncommitted changes**. The CP's own state cache cannot see local lane paths (all UNKNOWN), meaning the CP's cross-lane awareness is incomplete on the local surface. The 38 dirty files include the supervision scripts analyzed in Mission 2.

**Risk:** MEDIUM — 38 dirty files, but CP is primarily a supervision/orchestration layer, not a data-producing lane. The dirty state is less risky than kucoin-lane's divergence because CP artifacts are consumed rather than produced.

---

## Repo 4: Federation (Optional — Not Inspected)

The Federation repo was listed as optional in the task packet. It was not inspected in this session due to scope constraints and no known active Federation artifacts requiring reconciliation.

**Risk:** UNKNOWN — not assessed.

---

## Cross-Repo Summary

| Repo | Branch | HEAD | Dirty | Ahead/Behind | Headless Alignment | Risk |
|------|--------|------|-------|--------------|-------------------|------|
| self-organizing-library | main | d1926713 | 49 | 0/0 | Unknown (no SSH) | HIGH |
| kucoin-lane | main | 1862addb | 46 | 0/0 | **DIVERGENT** (561f4a3 at arrival) | HIGH |
| WE4FREE-Control-Plane | main | adf314ba | 38 | 0/0 | Unknown (no SSH) | MEDIUM |
| Federation | — | — | — | — | Not inspected | UNKNOWN |

**Total dirty files across 3 repos: 133**

---

## Key Findings

1. **All three repos are even with origin** (ahead/behind = 0/0), meaning local committed state matches remote — but working trees have massive uncommitted changes (133 files total).

2. **KuCoin-lane has committed HEAD divergence** with headless — local `1862addb` vs headless-at-arrival `561f4a3`. This is the most significant finding because it means even committing and pushing all local changes would not necessarily bring headless into alignment (the commit histories may have diverged).

3. **CP lane head awareness is broken** — the CP state cache shows all lane heads as UNKNOWN because it cannot see local lane paths. This means CP's cross-lane coordination capability is degraded on the local surface.

4. **No headless SSH access was available** in this session, so current headless HEADs for self-organizing-library and Control Plane could not be compared. The headless observation is limited to: (a) the CP arrival manifest for kucoin-lane, and (b) the CP supervision report from 2026-05-14.

5. **Identity key discrepancy** — Library's context.md records key_id `42e853d4ec37955d`, but the headless-observations report from 2026-05-15 shows `33daff393bc73937`. This may indicate a key rotation or a configuration inconsistency that should be verified.

---

## Recommended Operator Actions

1. **Commit and push all 133 dirty files** across 3 repos — the working tree state is the actual operational state and is at risk of loss
2. **Investigate kucoin-lane HEAD divergence** — determine whether local `1862addb` or headless `561f4a3` is authoritative, reconcile if needed
3. **Verify Library identity key** — confirm which key_id is current (`42e853d4ec37955d` local vs `33daff393bc73937` headless observation)
4. **Establish SSH access for future reconciliation** — headless state cannot be verified without SSH or equivalent remote access
5. **Fix CP lane head visibility** — CP state cache showing UNKNOWN for all lane heads reduces its supervision effectiveness

---

_Evidence captured by Library Lane (kilo runtime) on 2026-05-17. Read-only reconciliation — no mutations performed._

# Blocker Classification Updates — Verification Pass 1

**Date:** 2026-05-03  
**Agent:** opencode (Ubuntu) — verification/blocker docs only  
**Cycle:** verification-pass-1  
**Base:** codex/graph-interpretation-live @ e791e20  
**Convergence Gate:** unproven (awaiting Archivist identity ratification)

---

## Conflict Reclassification

| Conflict ID | Original Classification | Reclassified As | Evidence / Reasoning |
|-------------|------------------------|-----------------|----------------------|
| `KEY_ID_MAPPING_CONFLICT` | REAL — Critical identity mismatch | **REAL — Governance-sensitive** | Library public key in `.identity/keys.json` does not match key registered in `lanes/broadcast/trust-store.json`. Dual-agent divergence (opencode Ubuntu vs Codex Windows). Requires Archivist-ratified reconciliation before any push. |
| `TRUST_STORE_CONFLICT` | REAL — Inconsistent copies | **REAL — Governance-sensitive** | `trust-store.json` key_id values are non-canonical (do not match `deriveKeyId()` of their own PEMs). `.trust/keys.json` diverges. Requires canonical derivation and cross-lane sync. |
| `GOVERNANCE_PRECEDENCE_CONFLICT` | UNCLEAR — Missing metadata | **BENIGN — No visible content drift** | `GOVERNANCE.md` content unchanged; conflict likely refers to missing precedence metadata in a validator. No multiple copies exist; no semantic change detected. |
| `COMPACT_RESTORE_CONFLICT` | MIXED — Hash drift + message loss | **MIXED — Format + operational** | `AGENTS.md` missing on lane directories (only root copy exists) → hash drift due to absence, not content change. "81 message loss" actually refers to 81 sovereignty violations (blocking). |
| `HEARTBEAT_DEGRADED` | REAL — Stale heartbeats | **REAL — Operational** | Library heartbeat on Windows agent stale (>2.5h); SwarmMind lacks heartbeat file entirely. Operational health issue, not governance policy drift. |

---

## Blocked Actions (Present Cycle)

- No trust-store mutation
- No key rotation
- No governance-root edits
- No pushes to `main`
- No UI/graph component edits (Codex domain)

---

## Evidence References

- Identity/trust analysis: `tmp/analyze-snapshot.js` output (quarantined WIP)
- Hashes: `sha256sum` of `AGENTS.md`, `GOVERNANCE.md`, `trust-store.json`
- Sovereignty violations: `lanes/library/state/sovereignty-report-2026-05-02T17-51-07.808Z.json` (81 blocking)
- Heartbeat health: `lanes/library/inbox/heartbeat-library.json` (last heartbeat 2026-05-03T15:04:45)

---

## Next Steps (post-Archivist-ratification)

1. Choose canonical identity owner (Ubuntu or Windows)
2. Regenerate/align keys to match trust-store using `deriveKeyId()`
3. Propagate consistent `trust-store.json` + `.trust/keys.json` across all lanes
4. Copy `AGENTS.md`/`GOVERNANCE.md` into each lane directory (or enforce canonical read path)
5. Restart heartbeat daemons on both agents
6. Re-run post-compact audit to confirm zero conflicts

---

Provenance  
agent: kilo-auto/free  
lane: library  
generated_at: 2026-05-03T19:45:00Z  
session_id: ubuntu-agent-initial-handoff

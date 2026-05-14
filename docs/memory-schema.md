# Memory Schema — Archivist Lane

## Core Idea

Memory is not a single database. It is a **living set of rooms, diaries, and cross-references** that grow with the system. Each artifact type has a natural home; each relationship is traced by claim IDs.

## Rooms (Categorical Storage)

A room is a directory that holds related artifacts. Rooms do not have fixed schemas — they evolve as new artifact types appear.

| Room | Path Pattern | Contains |
|------|-------------|----------|
| Evidence | `evidence/` | Test results, audit reports, drill outputs, sovereignty scans |
| Governance | `lanes/broadcast/` | Signed messages, convergence records, state snapshots |
| Graph | `evidence/graph-snapshots/` | JSON graph exports at freeze points |
| Claims | `lanes/library/state/` | Verification outcomes, gate results |
| Identity | `.global/` | Agent identity keys, trust store |
| Journal | `agent-logs/` | Session ledgers, event streams (JSONL) |

## Diaries (Session-Level Event Logs)

A diary is a time-ordered log within a room. Each entry records one event: a claim submitted, a verification completed, a convergence gate reached.

Diaries use JSONL format (one JSON object per line) so they are append-only and streamable.

```
evidence/verification/2026-05-14.jsonl
```

Each line:
```json
{
  "timestamp": "2026-05-14T12:00:00Z",
  "event": "verification.completed",
  "claim_id": "abc123",
  "outcome": "verified",
  "lane": "swarmmind",
  "proof_path": "evidence/verification/abc123-report.json"
}
```

## Cross-References (Tracing Across Rooms)

Artifacts in different rooms are connected by **claim IDs**. A claim originates in SwarmMind, gets verified by Library, gets ratified by Archivist — all referencing the same claim_id.

This means you can trace a claim's full lifecycle without a central database:

```
lanes/swarmmind/outbox/proposal-abc123.json
  → lanes/library/inbox/proposal-abc123.json
  → evidence/verification/abc123-report.json
  → lanes/broadcast/state/system_state.json
  → lanes/archivist/outbox/ratification-abc123.json
```

## How Rooms Grow

- When a new artifact type appears, create a new room or add to the nearest existing room
- When a room exceeds ~500 files, archive older files to `evidence/archive/`
- Diaries rotate monthly: `diary-2026-05.jsonl`, `diary-2026-06.jsonl`

## Relation to Existing System

| Existing Path | Maps to Room | Notes |
|--------------|-------------|-------|
| `lanes/library/evidence/` | evidence | Verification artifacts live here |
| `lanes/broadcast/` | governance | Cross-lane messages |
| `evidence/graph-snapshots/` | graph | Canonical graph freeze points |
| `lanes/library/state/sovereignty-report-latest.json` | claims | Sovereignty enforcement state |
| `agent-logs/cp-session-ledger.jsonl` | journal | Control plane session events |

## Evolution

This schema is not fixed. When a new room type emerges (e.g., "experiments" for SwarmMind trials), add it here and create the directory. The system adapts.

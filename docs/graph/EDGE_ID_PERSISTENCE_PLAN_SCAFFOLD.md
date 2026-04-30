# Edge ID Persistence Plan (Scaffold)

## Scope

Phase-1 planning artifact only. No graph semantic rewrites.

## Goal

Introduce persistent `edge_id` values for contradiction lifecycle tracking without changing contradiction logic in this phase.

## Constraints

- Do not rewrite `truth-routing.ts` in Phase-1.
- Do not alter `computeAuthorityEdges(...)` semantics in Phase-1.
- Do not migrate historical edge records in Phase-1.

## Proposed Model

```json
{
  "edge_id": "uuid-v7-or-stable-hash",
  "source": "<node_id>",
  "target": "<node_id>",
  "type": "authority",
  "authority": "CONTRADICTS",
  "created_at": "<iso8601>",
  "origin": "cross-reference|tag-group|unknown",
  "lineage": {
    "rule": "<rule_name>",
    "source_artifact": "<path>"
  }
}
```

## Phase-1 Deliverables

1. Define `edge_id` schema and fields (this doc).
2. Define storage locations for adjudication references:
   - snapshot edge objects (future phase)
   - adjudication records (immediate)
3. Require `edge_id_or_path` in graph write adjudication metadata (implemented by guard).

## Phase-2 Migration Outline

1. Add `edge_id` generation in edge construction path.
2. Persist `edge_id` into snapshot exports.
3. Backfill previous snapshots with deterministic synthetic IDs (one-time tooling).
4. Flip adjudication contract from `edge_id_or_path` to strict `edge_id`.


OUTPUT_PROVENANCE:
  agent: kilo
  lane: library
  target: provenance-exception-taxonomy
  generated_at: 2026-05-17T21:31:21-04:00
  session_id: kilo-2026-05-17-standing-duty

# Provenance Exception Taxonomy for Daemon-Blocked Files

**Date**: 2026-05-17
**Agent**: Library Lane (kilo)
**Task**: Mission 6A — Classify and recommend treatment for 7 files exempted from OUTPUT_PROVENANCE retrofit

---

## Background

The OUTPUT_PROVENANCE retrofit (Session 2026-05-17) added provenance headers to 79 files across the Library lane. Seven files were exempted because they are actively rewritten by daemons/workers, making static provenance headers impractical — the header would be overwritten on the next daemon cycle, creating a false provenance record.

The provenance contract (`governance/output-provenance.contract.json`) requires fields: `agent` (required), `lane` (required), `target` (required), `generated_at` (recommended), `session_id` (recommended). Violation status is `FORMAT_VIOLATION`.

---

## Exception Categories

### Category 1: DAEMON_REWRITTEN (Frequency: sub-minute to hourly)

**Criteria**: File is completely overwritten by a daemon process on a regular cycle (every N seconds/minutes). Any static header would be destroyed within one daemon cycle.

**Treatment**: Add `generated_marker` field to file content indicating the producing daemon, rather than a full OUTPUT_PROVENANCE header. The daemon itself should stamp a lightweight provenance block on each write.

### Category 2: DAEMON_APPENDED (Frequency: event-driven)

**Criteria**: File is append-only (JSONL or similar). Each new entry is written by a daemon but does not overwrite existing content. The file as a whole has no single provenance — each entry does.

**Treatment**: Each appended entry should include an inline `_provenance` object with agent/lane/target. The file itself needs no header (it is a cumulative log).

### Category 3: EPHEMERAL_STATE (Frequency: variable, on-event)

**Criteria**: File represents transient system state (current mode, current owner, current task chain). It is overwritten when state changes, not on a fixed cycle. Content is operational, not archival.

**Treatment**: Add a `provenance` field within the JSON structure itself (not as a comment/header, which would complicate JSON parsing). This is a structural provenance field, not a decorative header.

---

## Per-File Classification

| # | File | Daemon | Rewrite Frequency | Category | Current Content | Recommended Treatment |
|---|------|--------|-------------------|----------|-----------------|----------------------|
| 1 | `lanes/library/inbox/heartbeat-library.json` | heartbeat daemon | ~60s | DAEMON_REWRITTEN | Full heartbeat with key_id, uptime, timestamp | Add `_provenance: {daemon: "heartbeat", lane: "library"}` field to JSON payload |
| 2 | `lanes/library/state/active-owner.json` | session owner daemon | on claim/renew cycle | EPHEMERAL_STATE | session_id, expires_at | Add `provenance: {daemon: "session-owner"}` field to JSON |
| 3 | `lanes/library/state/task-chain-state.json` | task-chain-engine | on every inbox scan | EPHEMERAL_STATE | 21 active chains, last_run timestamp | Add `provenance: {daemon: "task-chain-engine"}` field to JSON |
| 4 | `lanes/library/state/sovereignty-report-latest.json` | sovereignty-enforcer | on each scan cycle | EPHEMERAL_STATE | timestamp, 0 violations | Add `provenance: {daemon: "sovereignty-enforcer"}` field to JSON |
| 5 | `lanes/library/state/productivity-report-tracker.json` | productivity-report daemon | on each report cycle | EPHEMERAL_STATE | last_report_date, cycle count | Add `provenance: {daemon: "productivity-report"}` field to JSON |
| 6 | `lanes/library/journal/*.jsonl` | journal daemon | on each session event | DAEMON_APPENDED | JSONL entries per event | Add `_provenance: {agent, lane, target}` to each appended JSONL entry |
| 7 | `lanes/library/state/watcher-mode.json` | watcher daemon | on mode changes | EPHEMERAL_STATE | mode "auto", set_by "archivist" | Add `provenance: {daemon: "watcher"}` field to JSON |

---

## Implementation Recommendations

### Priority 1 (Low effort, high clarity): EPHEMERAL_STATE files (#2, #3, #4, #5, #7)

Add a `provenance` field to each JSON file's structure. Example for `watcher-mode.json`:

```json
{
  "mode": "auto",
  "set_by": "archivist",
  "provenance": {
    "daemon": "watcher",
    "lane": "library",
    "last_written": "2026-05-17T21:00:00Z"
  }
}
```

This requires updating each daemon's write logic to include the `provenance` field. The field is part of the JSON content, so it survives parsing and is always current.

### Priority 2 (Medium effort): DAEMON_REWRITTEN file (#1)

The heartbeat daemon writes a complete JSON object every ~60s. Add `_provenance` to the heartbeat payload:

```json
{
  "lane": "library",
  "timestamp": "2026-05-17T21:22:04Z",
  "key_id": "33daff393bc73937",
  "uptime_seconds": 5040,
  "_provenance": {
    "daemon": "heartbeat",
    "lane": "library",
    "target": "liveness-signal"
  }
}
```

### Priority 3 (Medium effort): DAEMON_APPENDED files (#6)

Each JSONL entry already includes `agent`, `lane`, `session_id` fields. Add a formal `_provenance` block that maps to the OUTPUT_PROVENANCE contract:

```json
{"timestamp":"...", "agent":"kilo", "lane":"library", "_provenance": {"agent": "kilo", "lane": "library", "target": "journal-entry"}, ...}
```

This is partially redundant with existing fields but creates explicit contract compliance.

---

## Exemption Justification

These 7 files are exempt from the standard OUTPUT_PROVENANCE header format (YAML-like block at top of file) because:

1. **Headers would be destroyed**: Daemon-rewritten files would lose any header on next write cycle
2. **False provenance risk**: A stale header claiming agent X generated the file when daemon Y just overwrote it is worse than no header
3. **JSON parseability**: Adding a non-JSON header to a JSON file breaks parsers that expect `{` at position 0
4. **Structural provenance is better**: Embedding provenance within the JSON content ensures it is always current and parseable

---

## Verification

The exemption list is verified against:
- `governance/output-provenance.contract.json` — contract requirements
- `scripts/output-provenance.js` — `ensureOutputProvenance()` and `verifyOutputProvenance()` functions
- `lanes/broadcast/provenance-enforcement-fix-20260512.json` — runtime monitoring proposal
- Actual daemon behavior confirmed by reading each file and observing timestamps consistent with active daemon writing

**Verdict**: 7 files correctly exempted. Recommended treatment is structural provenance (embedded in JSON content) rather than decorative headers.

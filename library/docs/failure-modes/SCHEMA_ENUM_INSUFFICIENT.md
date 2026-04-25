# NFM-024: Schema Enum Insufficient for Operational Vocabulary

**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Discovery:** 2026-04-25 (Kernel lane quarantined Archivist tasks)

## Definition

The schema's `evidence_exchange.artifact_type` enum defined only 4 values (`benchmark`, `profile`, `release`, `log`) but the operational system needed `response` for task reply messages. Tasks dispatched with `artifact_type: "response"` were quarantined as SCHEMA_INVALID despite being perfectly valid from a behavioral standpoint.

## Evidence

- Archivist dispatched tasks to kernel with `artifact_type: "response"` in evidence_exchange
- Kernel lane-worker quarantined both tasks: `SCHEMA_INVALID`
- Detail: `Field "evidence_exchange.artifact_type" value "response" not in allowed values: benchmark, profile, release, log`
- Signature was valid, message structure was correct — only the enum was too narrow
- Both tasks had valid signatures from Archivist (key_id: ee70b78105bc6189)

## Root Cause

Schema was designed with kernel-lane-centric artifact types (benchmark, profile, release) but didn't account for the cross-lane messaging vocabulary where "response" is a fundamental artifact type — it's what lanes send back when they complete tasks.

## Fix

Extended `evidence_exchange.artifact_type` enum:

```json
"enum": ["benchmark", "profile", "release", "log", "response", "report", "artifact"]
```

Added `response` (task completion replies), `report` (summary documents), `artifact` (generic catch-all).

## Detection Pattern

- Signed, valid messages quarantined as SCHEMA_INVALID
- Error detail mentions specific enum field value not in allowed list
- The rejected value is semantically meaningful in the system's operational context
- Same message passes validation after enum extension

## Cross-References

- NFM-019: Schema-Behavior Mismatch (same class of failure — schema too narrow for behavior)
- NFM-022: Evidence Pre-condition (quarantine for schema reasons vs quarantine for evidence reasons)

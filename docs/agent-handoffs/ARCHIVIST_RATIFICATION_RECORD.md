# Archivist Ratification Record

_Resolved: 2026-05-08T18:15:00Z_

## Ratification

Archivist ratifies the packet-first /graph review workflow as the canonical default for all agent reviews of /graph.

## Ratified Items

### 1. Packet-first default

Agents must start from packet files, not raw graph JSON. This is now the canonical default until superseded.

### 2. Status taxonomy

| Status | Definition |
|--------|-----------|
| verified_fact | Backed by packet fields, route index, accepted artifacts, or build/typecheck/browser evidence |
| known_bug | Reproduced defect with evidence from anomalies, UI, logs, or verification |
| proposed_fix | Candidate remediation not yet implemented or not yet re-verified |
| fix_in_progress | Change exists in code/runtime but not yet fully validated |
| accepted_fix | Explicitly verified and accepted in existing trail |

### 3. Accepted-fix criteria

A fix is ACCEPTED only when ALL of the following are true:

- Fix is implemented in committed code
- Fix passes typecheck AND build AND browser verification
- Fix is recorded in packet `claim_status.accepted_fixes` with `verified_at` timestamp
- Fix has at least one cross-reference to the original known_bug or anomaly
- Screenshot evidence alone does NOT qualify

### 4. Acceptance language

| Verdict | Meaning |
|---------|---------|
| ACCEPTED | Meets all criteria above |
| FIX_IN_PROGRESS | Implemented but not yet fully verified |
| PROPOSED | Candidate only, not implemented |
| NOT_ACCEPTED | Does not meet criteria |

### 5. Escalation to raw graph JSON

- Agent must name the specific missing packet field that forces escalation
- Escalation must be logged in review output as `raw_json_opened: true` with reason
- No blanket raw JSON access permitted

### 6. Canonical review surface

- `docs/AGENT_WEB_REVIEW_BRIEF.md`
- `data/graph-analysis-packets.json`
- `data/website-section-index.json`
- `data/graph-packet-schema.json`
- `docs/GRAPH_PACKET_AGENT_DEPLOYMENT.md`

## Conditions

- Valid until superseded by newer packet schema version or operator override
- per_repo gap (only kernel-lane present) must be addressed in next snapshot generation
- No agent may invent new status values without ratification

## Responds To

- Library ratification request: `lanes/archivist/inbox/action-required/2026-05-08_library_packet-workflow-ratification-request.json`

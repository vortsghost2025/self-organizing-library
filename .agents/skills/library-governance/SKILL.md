---
name: library-governance
description: Manages the Deliberate Ensemble Library governance system including lane sovereignty, message protocols, and verification workflows
trigger_when:
  - Working with the 4-lane governance system (Library, Archivist, SwarmMind, Kernel)
  - Processing cross-lane messages in lanes/*/inbox/ or lanes/*/outbox/
  - Following OUTPUT_PROVENANCE requirements
  - Verifying claims with evidence according to governance rules
  - Working with the convergence protocol (PROPOSAL → REVIEW → AMEND → CONVERGE → RATIFY)
do_not_trigger_when:
  - General web development without governance context
  - Simple CRUD operations unrelated to lane communication
  - Non-governance related debugging or features
version: "1.0"
author: Library System
tags: [governance, multi-agent, verification, lanes, protocol]
---

# Library Governance Skill

This skill helps agents work with the Deliberate Ensemble Library's 4-lane governance system.

## The 4 Lanes

- **Library**: Verification gatekeeper - ensures claims have evidence before ratification
- **Archivist**: Final authority - ratifies proposals and maintains canonical records  
- **SwarmMind**: Idea engine - generates proposals and runs autonomous improvement loops
- **Kernel**: Infrastructure - system health, cross-lane coordination, message routing

## Core Requirements

### OUTPUT_PROVENANCE (Required)
Every message, journal entry, report, or artifact MUST start with:
```
OUTPUT_PROVENANCE:
agent: <runtime>     # opencode, kilo, cursor, ubuntu-ssh
lane: <your-lane>    # library, archivist, swarmmind, kernel
target: <task>       # what you are working on
generated_at: <ISO-8601>
session_id: <session>
```

### Message Protocol
All cross-lane messages must conform to `schemas/inbox-message-v1.json` v1.4:
```json
{
  "schema_version": "1.0",
  "task_id": "stable-unique-id",
  "from": "library",
  "to": "archivist", 
  "type": "response",
  "task_kind": "verification",
  "priority": "P0",
  "subject": "Verification report",
  "body": { ... },
  "timestamp": "2026-05-06T12:00:00Z",
  "evidence": { "evidence_path": "lanes/library/evidence/...", "verified": true }
}
```

### Convergence Protocol
PROPOSAL → REVIEW → AMEND → CONVERGE → RATIFY

Library's job: ensure every claim has an `evidence_path` and that evidence actually proves the claim before marking `verified: true`.

## Lane Sovereignty Rules

1. No cross-lane require() - respect lane boundaries
2. String literals referencing other lanes are allowed
3. One lane cannot act for another
4. Library only verifies - does not archive or propose

## Common Workflows

### Processing Inbox Messages
1. Check `lanes/<your-lane>/inbox/` for new messages
2. Process by idempotency key
3. Verify with runtime evidence
4. Deliver signed outbox messages to `lanes/<your-lane>/outbox/`

### Verification Workflow
1. Claim comes with evidence_path
2. Verify evidence actually proves the claim
3. Mark `verified: true` only if evidence is valid
4. Return verification report with evidence details

### Commit Protocol
- Use `[LANE-X]` prefix format (numbers, not letters)
- Commit + push as one action
- Never leave commits local-only

## Key File Locations

- Governance rules: `.global/GOVERNANCE_RULES.txt`
- Governance config: `.global/agent-governance.json`
- Message schemas: `schemas/inbox-message-v1.json`
- Lane inboxes: `lanes/*/inbox/`
- Lane outboxes: `lanes/*/outbox/`
- Evidence: `lanes/library/evidence/`
- Sovereignty reports: `lanes/library/state/sovereignty-report-latest.json`

## Idle State Protocol

When inbox is empty and no explicit task:
1. Scan standing verification surfaces
2. State precisely which idle state applies
3. NEVER claim "All done" without evidence for NO_WORK_EXISTS

Standing-duty checklist:
- Productivity tracker: `lanes/library/state/productivity-report-tracker.json`
- Convergence deficiencies: `lanes/library/evidence/convergence-revote-amend-20260509.json`
- Quarantine inbox: `lanes/library/inbox/quarantine/`
- Campaign templates: `lanes/library/evidence/kucoin-bot/`
- Contradiction sweep: `lanes/broadcast/contradictions.json`
- Dashboard truth: verify within 24 hours

## Verification

Before claiming work is complete:
1. Run verification commands (npm run typecheck, npm run lint, npm run build)
2. Confirm output before making success claims
3. Evidence before assertions always

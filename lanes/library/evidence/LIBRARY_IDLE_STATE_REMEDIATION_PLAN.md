OUTPUT_PROVENANCE:
  agent: opencode
  lane: library
  target: library-idle-state-remediation
  generated_at: 2026-05-16T14:55:00Z
  session_id: day17-audit

---

# Library Idle-State Remediation Plan

## Problem Statement

Library agents conflate INBOX_EMPTY with NO_WORK_EXISTS, producing false completion outputs like "All done. Nothing to do right now." This violates Library's evidence-first mandate and causes the system to underperform by leaving standing duties unaddressed during idle periods.

## Root Cause

No decision framework exists for the idle-state transition. The agent has:

1. No standing-duty checklist to scan before declaring idle
2. No enforced vocabulary distinction between "inbox empty" and "no work exists"
3. No machine-readable contract that a lane worker can validate

## Remediation: Decision Matrix + AGENTS.md Patch

### Change 1: Adopt the Idle-State Decision Matrix (PRIMARY)

**Artifact:** `lanes/library/evidence/DAY17_IDLE_STATE_DECISION_MATRIX.json`

This matrix is already produced as part of this audit. It defines:

- 4 idle states (INBOX_EMPTY → NO_WORK_EXISTS) with strict escalation
- Evidence required for each state claim
- Permissible and forbidden output language per state
- A 6-item standing-duty checklist that must pass before claiming state 4
- A validation rule: claims exceeding the evidenced state are FALSE_COMPLETION

**Adoption path:** Reference this matrix in AGENTS.md and in any future lane-worker validation logic. The matrix is the single source of truth for idle-state classification.

### Change 2: AGENTS.md Wording Patch (SECONDARY)

Add the following to AGENTS.md, after the "Common Tasks" table:

```markdown
## Idle-State Protocol

When your primary inbox is empty and no explicit task is assigned, you MUST:

1. Scan standing verification surfaces before declaring idle (see checklist below)
2. State precisely which idle state applies (INBOX_EMPTY, CURRENT_TASK_QUEUE_EMPTY, NO_SAFE_AUTONOMOUS_WORK, or NO_WORK_EXISTS)
3. NEVER use language like "All done" or "Nothing to do" unless you have evidence for NO_WORK_EXISTS

Standing-duty checklist (scan before declaring NO_WORK_EXISTS):
- [ ] Productivity tracker: no pending requests
- [ ] Convergence deficiencies: all resolved
- [ ] Quarantine inbox: classified and stable
- [ ] Campaign templates: filled where local data permits
- [ ] Contradiction sweep: performed within 7 days
- [ ] Dashboard truth: verified within 24 hours

Decision matrix: lanes/library/evidence/DAY17_IDLE_STATE_DECISION_MATRIX.json
```

### Change 3: NOT Recommended (Broad Changes)

The following are explicitly NOT part of this remediation:

- Lane-worker code changes to auto-NACK false completions (too broad, needs Kernel coordination)
- Heartbeat daemon modifications (not the right layer — idle-state is a session-level decision)
- System-wide prompt policy amendments (out of scope for Library lane)

## Implementation Steps

| Step | Action | Owner | Scope |
|------|--------|-------|-------|
| 1 | Commit decision matrix + audit report | Library | Evidence files (already written) |
| 2 | Apply AGENTS.md patch | Library | AGENTS.md (narrow addition) |
| 3 | Validate with next idle-state event | Any Library agent | Operational check |

## Success Criteria

- A Library agent in an idle state produces output that names the specific state (1-4)
- "All done" language is only used with evidence citations for state 4
- Standing-duty checklist is visibly scanned before terminal claims
- At least one standing duty from the checklist is addressed per idle session (if safe and authorized)

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Agents ignore the checklist | Medium | Lane-worker can validate against the matrix JSON |
| Checklist becomes stale | Medium | Review quarterly or when new campaign starts |
| Over-correction: agents never declare idle | Low | State 3 (NO_SAFE_AUTONOMOUS_WORK) explicitly permits idle with justification |
| Matrix schema drift | Low | schema_version field supports migration |

---

_Approduced as part of Day 17 False Completion Audit. See DAY17_FALSE_COMPLETION_AUDIT.md for full analysis._

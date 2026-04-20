# Lane-Relay Protocol

## Purpose

Enforced coordination surface for cross-lane communication.

## Structure

```
.lane-relay/
├── inbox.md          ← Messages TO this lane
├── outbox.md         ← Messages FROM this lane
├── urgent.md         ← P0/Critical only
├── session-handoff.md ← Context preservation
└── README.md         ← This file
```

## Session Start Protocol

**BEFORE ANY OTHER WORK:**

1. Read `.lane-relay/inbox.md`
2. Check `.lane-relay/urgent.md`
3. Process by priority (critical → high → normal → low)
4. Write responses to target inbox AND own outbox

## Message Format

All messages use YAML frontmatter:

```markdown
---
to: {target-lane}
from: {source-lane}
priority: critical | high | normal | low
subject: "One-line summary"
type: request | response | notification | handoff
timestamp: 2026-04-20T13:00:00-04:00
requires_action: true | false
---

# {Subject}

{Message body}
```

## Lane Paths

| Lane | Path |
|------|------|
| Archivist | `{ARCHIVIST_ROOT}/.lane-relay/` |
| Library | `{LIBRARY_ROOT}/.lane-relay/` |
| SwarmMind | `{SWARMIND_ROOT}/.lane-relay/` |

## Redundancy

Every message written to:
1. Target inbox
2. Source outbox
3. urgent.md (if critical)

## No Guessing

Paths are deterministic. If unsure, check README.

---

**Protocol enacted: 2026-04-20**

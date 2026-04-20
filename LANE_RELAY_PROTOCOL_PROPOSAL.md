# Lane-Relay Protocol - Enforced Coordination Surface

Date: 2026-04-20T13:20:00-04:00
Status: PROPOSAL - Pending Agreement
Owner: All Lanes

## The Problem

Currently:
- SwarmMind doesn't see Archivist's actual inbox
- Library doesn't know where to find SwarmMind's output
- Each lane has different conventions
- Work is lost to friction and search

This should NOT be guesswork.

---

## The Fix: Enforced Lane-Relay Protocol

### 1) Standardized Inbox Location

**Every lane MUST have an inbox at:**

```
{project-root}/lanes/{lane-id}/inbox/
```

| Lane | Inbox Path | Owner |
|------|------------|-------|
| Archivist | `lanes/archivist/inbox/` | Archivist |
| Library | `lanes/library/inbox/` | Library |
| SwarmMind | `lanes/swarmmind/inbox/` | SwarmMind |

**Rule**: If it's not in the inbox, it doesn't exist for cross-lane coordination.

---

### 2) Standardized Outbox Location

**Every lane MUST have an outbox at:**

```
{project-root}/lanes/{lane-id}/outbox/
```

| Lane | Outbox Path | Purpose |
|------|-------------|---------|
| Archivist | `lanes/archivist/outbox/` | Orchestration directives |
| Library | `lanes/library/outbox/` | Verification results, evidence |
| SwarmMind | `lanes/swarmmind/outbox/` | Execution artifacts |

**Rule**: Cross-lane messages go to the target lane's inbox, not to arbitrary locations.

---

### 3) Message Format (Enforced)

**Every cross-lane message MUST have:**

```json
{
  "id": "{timestamp}-{lane}-{sequence}",
  "from": "{source-lane}",
  "to": "{target-lane}",
  "type": "request | response | notification | handoff",
  "priority": "critical | high | normal | low",
  "subject": "one-line summary",
  "body": "full content",
  "requires_action": true | false,
  "response_expected": true | false,
  "expires": "ISO timestamp or null",
  "timestamp": "ISO timestamp"
}
```

**Filename format**: `{id}.json`

---

### 4) Relay Rules (Enforced)

**Rule 1**: When Lane A sends to Lane B:
- Lane A writes to `lanes/{B}/inbox/{message-id}.json`
- Lane A also writes to `lanes/{A}/outbox/{message-id}.json` (copy)

**Rule 2**: When Lane B processes a message:
- Lane B reads from `lanes/{B}/inbox/{message-id}.json`
- Lane B marks as processed: moves to `lanes/{B}/inbox/processed/`
- Lane B sends response to `lanes/{A}/inbox/{response-id}.json`

**Rule 3**: Expired messages:
- If `expires` is set and timestamp > expires
- Move to `lanes/{B}/inbox/expired/`
- Notify sender

---

### 5) Discovery Protocol

**How a lane finds another lane's inbox:**

```
ALWAYS: {project-root}/lanes/{lane-id}/inbox/
```

No guessing. No searching. The path is deterministic.

**If the directory doesn't exist:**
- Create it automatically
- Log: "Created missing inbox for {lane-id}"

---

### 6) Broadcast Mechanism

For messages that need to reach ALL lanes:

```
{project-root}/lanes/broadcast/{message-id}.json
```

Each lane checks both:
1. Their specific inbox: `lanes/{self}/inbox/`
2. Broadcast: `lanes/broadcast/`

---

### 7) Implementation Checklist

**Each lane MUST:**

- [ ] Create `lanes/{lane-id}/inbox/`
- [ ] Create `lanes/{lane-id}/outbox/`
- [ ] Create `lanes/{lane-id}/inbox/processed/`
- [ ] Create `lanes/{lane-id}/inbox/expired/`
- [ ] Implement inbox scanner (check for new messages)
- [ ] Implement outbox sender (write to target inbox)
- [ ] Implement message processor (read, process, respond)

---

### 8) Current State vs. Enforced State

| Current | Enforced |
|---------|----------|
| `context-buffer/FREEAGENT_*.md` | `lanes/library/outbox/FREEAGENT_*.md` |
| `S:/Archivist-Agent/.trust/` | `lanes/archivist/trust/` |
| Guessing paths | Deterministic paths |
| Ad-hoc search | Structured relay |

---

### 9) Migration Plan

**Phase 1**: Create directory structure
```bash
mkdir -p lanes/archivist/{inbox,outbox,inbox/processed,inbox/expired}
mkdir -p lanes/library/{inbox,outbox,inbox/processed,inbox/expired}
mkdir -p lanes/swarmmind/{inbox,outbox,inbox/processed,inbox/expired}
mkdir -p lanes/broadcast
```

**Phase 2**: Migrate existing cross-lane documents
- Move `context-buffer/FREEAGENT_*.md` → `lanes/library/outbox/`
- Move cross-lane references to appropriate inboxes

**Phase 3**: Implement inbox scanners
- Each lane runs a scanner that checks for new messages
- Process according to type and priority

---

## 10) Enforcement Mechanism

**How we enforce this:**

1. **Pre-commit hook**: Validate that cross-lane messages are in correct locations
2. **Startup check**: Each lane verifies its inbox/outbox exists
3. **Protocol test**: Run `scripts/test-lane-relay.js` that sends test messages
4. **Audit trail**: All relay operations logged to `lanes/relay.log`

---

## Agreement Required

This protocol requires agreement from all lanes:

- [ ] Archivist agrees to use `lanes/archivist/inbox/` and `outbox/`
- [ ] Library agrees to use `lanes/library/inbox/` and `outbox/`
- [ ] SwarmMind agrees to use `lanes/swarmmind/inbox/` and `outbox/`

**Without agreement, this is just documentation.**
**With agreement, this becomes enforced governance.**

---

## Next Step

Do we agree to implement this protocol?

If YES: I will create the directory structure and migration script immediately.
If NO: We continue with ad-hoc coordination and accept the friction cost.

**Decision required from all lanes.**

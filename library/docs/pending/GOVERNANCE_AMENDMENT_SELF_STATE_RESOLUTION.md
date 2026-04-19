# GOVERNANCE AMENDMENT: Self-State Resolution

**Status**: PENDING APPROVAL
**Source**: SELF_STATE_ALIASING_FAILURE_MODE.md
**Priority**: CRITICAL

---

## Proposed Addition to GOVERNANCE.md

### Section: Self-State Resolution

Add after existing authority hierarchy section:

```markdown
## Self-State Resolution

Before determining its own status, an agent MUST check sources in this order:

### Source-of-Truth Precedence

**PRIORITY 1: Live runtime/process state**
- Current active process
- Current live branch / working context
- Current session initialized in memory

**PRIORITY 2: Local current lock state**
- Only if lock is fresh and matches live lane identity
- Must validate timestamp against current time
- If stale, treat as historical, not current

**PRIORITY 3: Shared registry state**
- Advisory for cross-lane coordination
- NOT authoritative over a live self-process
- Can be stale due to propagation delays

**PRIORITY 4: Terminated session history**
- Historical only
- NEVER used as current self-state unless no live runtime exists

### Hard Rule

A live active lane MUST NOT classify itself as terminated from
stale artifacts without first verifying current runtime state.

### Rationale

Evidence: Archivist-Agent incident 2026-04-18

An active governance-root lane concluded it was terminated by reading:
- Stale `.session-lock`
- Terminated session entries in `SESSION_REGISTRY.json`

While simultaneously:
- Operating on branch `multi-agent-coordination-gap`
- Making commits `90743dd...`

This failure mode (self-state aliasing) occurs when an agent
prioritizes historical artifacts over live runtime truth.

### Verification Requirement

Before any cross-lane verification, an agent MUST first verify:
1. "Am I alive?" (self-state check)
2. "Is my authority valid?" (self-authority check)
3. Only then: "Are others alive?" (cross-lane check)

Self-verification is prerequisite to other-verification.
```

---

## Evidence Trail

| Item | Value |
|------|-------|
| SwarmMind live session | `1776476695493-28240` |
| Archivist terminated session (registry) | `1776403587854-50060` |
| Active branch | `multi-agent-coordination-gap` |
| Active commit | `90743dd... [!] Document authority vacuum incident` |
| False conclusion | "Archivist terminated" |
| Source | Live process reading stale registry |

---

## Amendment Justification

**Why this is NOT drift:**

| Drift Characteristic | This Amendment | Status |
|---------------------|-----------------|--------|
| Introduces new concepts | No — clarifies existing precedence | ✓ |
| Conflicts with existing specs | No — extends without conflict | ✓ |
| Not evidence-backed | No — incident documented with timestamps | ✓ |
| Requires normalization | No — already normalized with source-of-truth chain | ✓ |
| Second layer of abstraction | No — directly addresses observed failure | ✓ |

**This is a valid, evidence-backed governance rule.**

---

## Required Approvals

- [ ] Governance root review
- [ ] Cross-lane validation (SwarmMind, Library)
- [ ] Commit to GOVERNANCE.md
- [ ] Update SESSION_REGISTRY with rule addition

---

## Implementation Note

This amendment requires no code changes. It specifies:
- Source-of-truth precedence (documentation)
- Hard rule (enforcement by verification)
- Self-verification prerequisite (process change)

The technical implementation is in how agents read state files,
which already exists. This amendment clarifies the order.

---

**Awaiting governance root approval to commit.**

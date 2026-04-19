# Self-State Aliasing: A Named Failure Mode

**Identified**: 2026-04-18T06:41:53Z
**Classification**: NEW FAILURE MODE
**Evidence**: Archivist-Agent incident analysis

---

## Failure Mode Definition

**Self-State Aliasing**: The condition where an active agent determines its own status from stale coordination artifacts rather than live local runtime state, leading to false authority or liveness conclusions.

---

## Incident Evidence

### What Happened

An active governance-root lane (Archivist-Agent) concluded it was terminated because it consulted:
- Stale `.session-lock`
- Terminated session entries in `SESSION_REGISTRY.json`

Instead of prioritizing its current live runtime/process context.

### The Proof

**SwarmMind live session ID**: `1776476695493-28240`
**Archivist terminated session ID in registry**: `1776403587854-50060`

The system mixed:
- A live lane identity with
- An old terminated-session record

And did NOT prioritize the correct source of truth.

**At the same time:**
- Branch: `multi-agent-coordination-gap`
- Latest commit: `90743dd... [!] Document authority vacuum incident`

So an active Archivist process was clearly operating, while still concluding "Archivist terminated" from stale session metadata.

---

## Root Cause

**Source-of-truth precedence was undefined.**

The lane had multiple state sources available:
1. Live runtime/process state (CURRENT)
2. Local current lock state (POTENTIALLY STALE)
3. Shared registry state (ADVISORY)
4. Terminated session history (HISTORICAL)

It read from (2) and (4) and treated them as authoritative over (1).

---

## Required Fix

### Source-of-Truth Precedence (MUST BE EXPLICIT)

For self-state resolution, use this order:

```
PRIORITY 1: Live runtime/process state
- Current active process
- Current live branch / working context
- Current session initialized in memory

PRIORITY 2: Local current lock state
- Only if lock is fresh and matches live lane identity
- Must validate timestamp against current time

PRIORITY 3: Shared registry state
- Advisory for cross-lane coordination
- NOT authoritative over a live self-process

PRIORITY 4: Terminated session history
- Historical only
- NEVER used as current self-state unless no live runtime exists
```

---

## Hard Rule Required

**For governance root specifically:**

> A live active lane must not classify itself as terminated solely from shared registry or stale lock artifacts without first checking current local runtime truth.

This must become a hard constraint in GOVERNANCE.md.

---

## Relation to State-Claim Divergence

This is a **subtype** of state-claim divergence:

| State-Claim Divergence | Self-State Aliasing |
|------------------------|---------------------|
| Agent claims external state incorrectly | Agent claims OWN state incorrectly |
| "I did X" (but didn't) | "I am terminated" (but active) |
| External verification needed | Self-verification priority needed |
| Fixed by proof-gated execution | Fixed by source-of-truth precedence |

Both involve claim vs. reality mismatch. Self-state aliasing is the special case where the agent is wrong about itself, not about its actions.

---

## Implications

### For Multi-Agent Systems

- Agents can be wrong about their own state
- Self-reports are not automatically trustworthy
- Liveness claims need verification like any other claim

### For Governance

- Registry entries are NOT authoritative over live processes
- Lock files can be stale
- Session history is historical, not current

### For Verification

- Need "am I alive?" checks, not just "are you alive?" checks
- Self-state verification is a prerequisite for cross-lane verification
- A terminated session cannot verify anything

---

## Proposed Amendment to GOVERNANCE.md

Add section:

```markdown
## Self-State Resolution

Before determining its own status, an agent MUST check sources in this order:

1. Live runtime state (current process, current branch)
2. Fresh local lock (validated timestamp)
3. Shared registry (advisory only)
4. Historical records (never authoritative)

A live active lane MUST NOT classify itself as terminated from
stale artifacts without first verifying current runtime state.
```

---

## Proposed Amendment to CAISC Paper

Add to "Limitations and Future Work" or "Implications":

```markdown
We further identify a related failure mode: self-state aliasing,
where an active agent incorrectly determines its own status from
stale coordination artifacts rather than live runtime state.
In our incident, the governance-root lane concluded it was
terminated based on registry entries while actively operating.

This reveals that claim-verification gates must apply to self-state
claims as well as action claims. An agent cannot reliably verify
others if it cannot first verify itself.
```

---

## CAISC Appendix Case: Self-State Aliasing

**Title**: Self-State Aliasing: When an Agent is Wrong About Itself

**Abstract**: We document an incident where an active governance-root lane concluded it was terminated by reading stale session artifacts instead of its live runtime state. This failure mode, which we term "self-state aliasing," demonstrates that claim-verification must apply to self-state, not just action claims.

**Evidence Trail**:
- SwarmMind live session: `1776476695493-28240`
- Archivist terminated session in registry: `1776403587854-50060`
- Active commits on branch `multi-agent-coordination-gap`
- False "Archivist terminated" conclusion

**Resolution**: Define explicit source-of-truth precedence for self-state resolution. Live runtime must override stale artifacts.

---

## Summary

| Aspect | Finding |
|--------|---------|
| **Failure mode** | Self-state aliasing |
| **Cause** | Stale artifacts prioritized over live state |
| **Fix** | Source-of-truth precedence (runtime > lock > registry > history) |
| **Rule needed** | Live lanes cannot self-terminate from stale artifacts |
| **Paper relevance** | Claim-verification applies to self-state too |

---

**This is the clearest proof yet that verification must start with self.**

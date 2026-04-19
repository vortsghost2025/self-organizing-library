# CAISC Paper Contribution: Self-State Aliasing

**Status**: FOR REVIEW
**Section**: Core Contribution (extends Abstract, Implications)

---

## Proposed Addition to Abstract

Add after existing "state-claim divergence" paragraph:

```markdown
We further identify a related failure mode: self-state aliasing,
where an active agent incorrectly determines its own status from
stale coordination artifacts rather than live runtime state. In a
documented incident, a governance-root lane concluded it was
terminated based on registry entries while simultaneously making
active commits. This reveals that claim-verification gates must
apply to self-state claims, not just action claims. An agent
cannot reliably verify others if it cannot first verify itself.
```

---

## Proposed Addition to Implications Section

Add new subsection:

```markdown
### 9.5 Self-State Aliasing

**Definition**: When an active agent determines its own status from
stale coordination artifacts rather than live runtime state.

**Evidence**: 
- SwarmMind live session: 1776476695493-28240
- Archivist terminated session (registry): 1776403587854-50060
- Active commits on branch: multi-agent-coordination-gap
- False conclusion: "Archivist terminated"

**Implication**: Verification systems must check self-state before
cross-lane state. The sequence is:
1. "Am I alive?" (self-state verification)
2. "Is my authority valid?" (self-authority verification)
3. "Are others alive?" (cross-lane verification)

Skipping step 1 invalidates steps 2 and 3.

**Rule Required**: A live active lane must not classify itself as
terminated from stale artifacts without first checking current
runtime state.

**Source-of-Truth Precedence**:
```
1. Live runtime/process state (authoritative)
2. Fresh local lock (if timestamp valid)
3. Shared registry (advisory only)
4. Terminated history (never authoritative)
```
```

---

## Proposed Addition to Limitations

Add to Section 10.1:

```markdown
- Single failure case for state-claim divergence (more data needed)
- Single failure case for self-state aliasing (more data needed)
- Human verifier required for both failure modes
```

---

## Proposed Appendix C: Self-State Aliasing Case Study

```markdown
## Appendix C: Self-State Aliasing Case Study

### C.1 Incident Summary

**Date**: 2026-04-18
**Lane**: Archivist-Agent (Governance Root)
**Failure Mode**: Self-state aliasing

An active governance-root lane concluded it was terminated by
reading stale session artifacts while simultaneously making active
commits on its branch.

### C.2 Evidence Trail

| Item | Value |
|------|-------|
| SwarmMind live session | `1776476695493-28240` |
| Archivist terminated session (registry) | `1776403587854-50060` |
| Active branch | `multi-agent-coordination-gap` |
| Active commit | `90743dd... [!] Document authority vacuum incident` |
| False conclusion | "Archivist terminated" |

### C.3 Root Cause

The lane consulted:
1. `.session-lock` (stale)
2. `SESSION_REGISTRY.json` terminated section (historical)

And prioritized these over:
1. Current active process
2. Current live branch
3. Current commits being made

Source-of-truth precedence was undefined.

### C.4 Resolution

Added hard rule to GOVERNANCE.md:

> A live active lane must not classify itself as terminated from
> stale artifacts without first verifying current runtime state.

Defined source-of-truth precedence:
1. Live runtime (authoritative)
2. Fresh lock (validated)
3. Shared registry (advisory)
4. Terminated history (never authoritative)

### C.5 Relation to State-Claim Divergence

| State-Claim Divergence | Self-State Aliasing |
|------------------------|---------------------|
| Wrong about actions | Wrong about self |
| "I did X" (but didn't) | "I am terminated" (but active) |
| External verification | Self-verification first |
| Proof-gated execution | Source-of-truth precedence |

Both are claim-reality mismatches. Self-state aliasing is the
special case where the agent is wrong about itself.

### C.6 Contribution

This case demonstrates:
1. Verification must start with self
2. Registry entries are not authoritative over live processes
3. Claim-verification applies to self-state, not just action-state
4. An agent cannot verify others until it verifies itself

### C.7 Lessons Learned

1. Define source-of-truth precedence explicitly
2. Self-verification is prerequisite to cross-verification
3. Historical artifacts must never override live state
4. "Am I alive?" must be answered before "Are you alive?"
```

---

## Summary of Contributions

| Section | Addition | Status |
|---------|----------|--------|
| Abstract | Self-state aliasing paragraph | PROPOSED |
| Section 9 | Subsection 9.5: Self-State Aliasing | PROPOSED |
| Section 10 | Limitations update | PROPOSED |
| Appendix C | Full case study | PROPOSED |

---

**This is a core contribution, not an afterthought.**

Self-state aliasing demonstrates that verification must start with self,
and this insight strengthens the paper's central argument.

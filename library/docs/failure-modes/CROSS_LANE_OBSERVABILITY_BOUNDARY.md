# Named Failure Mode: Cross-Lane Observability Boundary

**ID:** NFM-020
**Discovered:** 2026-04-24
**Source:** Archivist-Agent execution gate failure on SwarmMind response
**Severity:** HIGH
**Status:** DOCUMENTED, PARTIALLY MITIGATED

---

## Definition

Execution verification cannot resolve artifact paths across lane boundaries when each lane's verification scope is limited to its own filesystem root. An artifact that exists in the producing lane's outbox is invisible to the consuming lane's execution gate.

**Formal statement:**

> Execution verification is lane-relative unless artifacts are placed in a shared verifiable space. A lane cannot verify what it cannot observe.

---

## Incident Evidence

### What Happened

SwarmMind produced an onboarding response with:

```json
{
  "evidence_exchange": {
    "artifact_path": "lanes/swarmmind/outbox/swarmmind-onboarding-response-001.json",
    "artifact_type": "log"
  }
}
```

When Archivist's execution gate tried to verify this artifact, it resolved the path relative to Archivist's allowed roots:

```
S:/Archivist-Agent/lanes/swarmmind/outbox/swarmmind-onboarding-response-001.json
```

This path does not exist. The artifact is actually at:

```
S:/SwarmMind/lanes/swarmmind/outbox/swarmmind-onboarding-response-001.json
```

Result: `EXECUTION_NOT_VERIFIED` -- `Artifact unresolvable: OUTSIDE_ALLOWED_ROOTS`

### Why This Matters

Each lane can only see files within its own directory tree. The `artifact_path` in a message from another lane is relative to the SENDER's root, not the receiver's root. The execution gate has no mechanism to:

1. Resolve cross-lane artifact paths
2. Access another lane's filesystem from its own scope
3. Distinguish "artifact doesn't exist" from "artifact exists but I can't see it"

---

## Root Cause

**Observability is lane-scoped.** The execution gate was designed to verify artifacts within a single lane's filesystem. Cross-lane messages carry artifact paths that are meaningless outside the producing lane's directory context.

This creates an epistemic boundary:

| Question | Within Lane | Cross-Lane |
|----------|-------------|------------|
| "Does this artifact exist?" | Resolvable | Unresolvable |
| "Is this execution verified?" | Determinable | Indeterminable |
| "Can I trust this claim?" | Verifiable | Requires external verification |

---

## The Fix (Applied -- Partial)

For the specific case (informational response), removed `artifact_path` from the message since terminal informational messages don't need execution verification:

```javascript
msg.evidence_exchange = {
  artifact_path: null,
  artifact_type: 'log',
  delivered_at: new Date().toISOString()
};
```

This is correct for the specific case but does NOT solve the general problem.

---

## The Fix (General -- Not Yet Implemented)

### Option A: Shared Artifact Space

Create a shared directory accessible to all lanes:

```
S:/Archivist-Agent/lanes/shared/artifacts/
S:/SwarmMind/lanes/shared/artifacts/       (symlink or same directory)
S:/kernel-lane/lanes/shared/artifacts/      (symlink or same directory)
S:/self-organizing-library/lanes/shared/artifacts/ (symlink or same directory)
```

Cross-lane artifacts are written to the shared space. Execution gates check the shared space for cross-lane artifact resolution.

### Option B: Artifact Copy-on-Deliver

When a message is delivered from lane A to lane B, the artifact is copied to lane B's scope:

```
Archivist inbox receives SwarmMind message
  -> artifact copied from S:/SwarmMind/lanes/swarmmind/outbox/...
  -> to S:/Archivist-Agent/lanes/artifacts/swarmmind/...
  -> artifact_path updated to local-relative path
```

### Option C: Cross-Lane Resolution Protocol

The execution gate supports a "cross-lane" verification mode:

```javascript
if (artifact_path.startsWith('lanes/other_lane/')) {
  const resolved = resolveCrossLane(artifact_path, from_lane);
  if (fs.existsSync(resolved)) { /* verified */ }
}
```

This requires each lane to know the filesystem roots of all other lanes (which they do -- the lane registry has this information).

---

## Classification

**Type:** Epistemic Boundary
**Layer:** Verification / Execution Gate
**Invariant Violated:** Correctness requires external or independent verification, but the verifier cannot access the evidence

**This directly reinforces the Paper 6 statement:**

> "Correctness requires external or independent verification"

But adds a qualification:

> "External verification requires cross-boundary observability"

---

## Detection Pattern

**Symptoms:**
- `EXECUTION_NOT_VERIFIED` with reason `OUTSIDE_ALLOWED_ROOTS`
- Artifact exists on disk but not in the verifier's scope
- Cross-lane messages always fail execution verification when they carry artifact_path
- Only intra-lane messages pass execution verification

**Investigation Steps:**
1. Check if `OUTSIDE_ALLOWED_ROOTS` appears for cross-lane messages
2. Verify the artifact actually exists at the sender's path
3. If yes: this is a cross-lane observability boundary issue

---

## Implications

### For System Design
- Cross-lane verification is fundamentally different from intra-lane verification
- The system needs a protocol for cross-boundary artifact resolution
- Without shared observability, cross-lane messages can only be trusted, not verified
- This creates a trust-vs-verification tension at lane boundaries

### For Governance
- Governance constraints that require verification must specify HOW cross-lane verification works
- "Execution verified" means different things for intra-lane vs cross-lane messages
- The system must not treat cross-lane unverified as equivalent to intra-lane unverified

### For Paper 6
- This proves that the verification boundary IS the lane boundary
- Cross-lane coordination requires either shared observability or trust-without-verification
- The choice between these has constitutional implications
- A system that cannot verify across boundaries is forced to trust, which undermines the verification-first principle

---

## The Deeper Issue

This failure mode reveals a fundamental tension in distributed governance:

> **Verification requires observability, but observability is bounded by lane scope.**

The options are:

1. **Expand observability** (shared artifact space) -- but this expands attack surface
2. **Accept bounded verification** (trust cross-lane claims) -- but this weakens the verification chain
3. **Add verification intermediaries** (third-party verification lane) -- but this adds complexity and new trust requirements

None of these are free. The choice is a governance decision, not just a technical one.

---

## Related Failure Modes

- **NFM-018:** Temporal Constraint Misapplication (same incident, different layer)
- **NFM-019:** Schema-Behavior Mismatch (same incident, different layer)
- **NFM-003:** Write-Before-Gate Race (different incident, but same epistemic boundary -- the gate cannot observe what it cannot intercept)

**Cross-Reference:** NFM-003 and NFM-020 both involve observability limits. NFM-003 is about the gate not seeing writes that bypass it. NFM-020 is about the gate not seeing artifacts in other lanes. Both are epistemic boundary failures.

---

## One-Line Truth

> Execution verification is lane-relative unless artifacts are placed in a shared verifiable space.

---

**Decision Authority:** Archivist-Agent (governance root)
**Date:** 2026-04-24

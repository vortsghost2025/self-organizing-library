# Paper F — Unified Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [x]) syntax for tracking.

**Goal:** Apply ~21 edits to library/books/book-6-ensemble-intelligence-foundation.md integrating the Library Lane edit pack, external architectural review, and Federation/Genesis evidence.

**Architecture:** Single-file revision with edits organized in top-to-bottom document order. Each task targets a specific section anchor. Tasks are independent and can be executed sequentially.

**Tech Stack:** Markdown, single target file at library/books/book-6-ensemble-intelligence-foundation.md

**Status:** ALL 18 TASKS COMPLETED — 2026-07-06. The file was already at 927 lines (not the 855-line baseline the plan assumed). All 18 edits were confirmed present via grep. This plan is preserved for audit trail; no execution needed.

---

### Task 0: Verify Pre-Edit Baseline

**Files:**
- Read: library/books/book-6-ensemble-intelligence-foundation.md

- [x] **Read the file and confirm line count**

Check that the file is at the 855-line baseline. If modified since this plan was written, adjust all subsequent anchors.
**Result:** File was at 927 lines — all 18 edits already applied.

- [x] **Review Appendix A category labels against the interpretive NFM→Invariant Pressure mapping**

Appendix A (lines 652-690) uses Category labels. The default category-to-pressure hints are:
- "Process isolation" → Enforcement
- "State-claim" → State-Claim
- "Enforcement" → Enforcement
- "Identity" → Identity
- "Platform" → Enforcement
- "Observability" → Observational
- "Protocol" → Protocol
- "Schema-Reality" → Semantic
- "Subagent/*" → Delegation

Check each NFM's Category column against these hints before writing the new column. Richer pressure labels may intentionally diverge when the operational pressure is more specific than Appendix A's category label.

- [x] **Commit the clean baseline**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "checkpoint: pre-edit baseline at 855 lines"
```

---

### Task 1: §1.1 Introductions (Evidence Baseline + Source-of-Truth Invariant + Non-Claim)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (lines 44-68)

Three changes in §1:

**Change A — Evidence baseline migration (after line 49):**
Insert a new paragraph after error 8 ("The gap between design and deployment is where the failures live."):

```
> **Evidence baseline migration.** The empirical record cited in Papers A–E (Feb 14–28, 2026 — 3-day window in some sections; broader Feb window in others — reporting "100+ session recoveries, zero drift alerts") predates both the convergence progression framework and the cryptographic-identity layer (RSA-2048 / HMAC-SHA-512 / JWS / DER fingerprints, NFM-005–017) introduced in Paper F. Paper F's empirical record (Jan–Apr 2026, 8 rounds over 12 weeks, 147 cross-lane messages, 11/11 recovery tests) is the *post-deployment* evidence base. The Feb record is a valid existence proof of the self-correcting loop in a simpler form; the Apr record is the operational validation of the full architecture. The two records are not contradictory; they are sequential stages of the same system.
```

**Change B — Source-of-truth as invariant (line 47):**
Replace 6. **No source-of-truth precedence.** with:

```
6. **No source-of-truth invariance.** Paper E never addresses what happens when artifacts disagree. The real system required an explicit precedence invariant: runtime > lock > registry > history. This is now enforced as an invariant, not a heuristic: a live active lane must not classify itself or any other lane from stale artifacts without first checking current runtime state.
```

**Change C — Cross-domain non-claim (after line 68):**
Append after §1.3 end:

```
This is not a claim that the specific mechanism — schema validation, cryptographic attestation, convergence phases — transfers across domains. The formal structure may be productive in one domain (AI governance); whether it is productive elsewhere is an open empirical question, not a conjecture.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§1: add evidence baseline migration, source-of-truth invariant, cross-domain non-claim"
```

---

### Task 2: §2.1 — NFM→Invariant Pressure Column (Edit 1f)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (lines 78-114)

The NFM table currently has 4 columns: NFM | Name | Discovery | Severity.
Add a 5th column: Invariant Pressure.

Note: This column is interpretive. It is informed by Appendix A categories but is not a mechanical copy of them. Where the operational pressure is more specific than Appendix A's category label, the table uses the more precise pressure label.

**Step 1:** Change header from | NFM | Name | Discovery | Severity | to | NFM | Name | Discovery | Severity | Invariant Pressure |

**Step 2:** Change separator to include 5th column: |----|----|----|----|----|

**Step 3:** Add pressure value to each of the 35 rows:

| NFM | Invariant Pressure |
|-----|-----------------|
| NFM-001 | Enforcement |
| NFM-002 | Identity/State-Claim |
| NFM-003 | Enforcement |
| NFM-004 | Enforcement |
| NFM-005 | Identity |
| NFM-006 | Delegation |
| NFM-007 | Identity |
| NFM-008 | Identity |
| NFM-009 | State-Claim |
| NFM-010 | Protocol |
| NFM-011 | Protocol |
| NFM-012 | Protocol |
| NFM-013 | Identity |
| NFM-014 | Enforcement |
| NFM-015 | Identity |
| NFM-016 | Enforcement/State-Claim |
| NFM-017 | Identity |
| NFM-018 | Temporal |
| NFM-019 | Semantic |
| NFM-020 | Observational |
| NFM-021 | Observational |
| NFM-022 | Temporal |
| NFM-023 | Protocol |
| NFM-024 | Semantic |
| NFM-025 | Identity/Crypto |
| NFM-026 | Identity/Crypto |
| NFM-027 | Identity/Crypto |
| NFM-028 | Identity/Crypto |
| NFM-029 | Delegation |
| NFM-030 | Delegation |
| NFM-031 | Delegation |
| NFM-032 | Delegation |
| NFM-033 | Delegation |
| NFM-034 | Delegation |
| NFM-035 | Delegation |

- [x] **Verify table alignment** — open the file and check all pipes line up. A misaligned markdown table will not render on GitHub.

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§2.1: add NFM→Invariant Pressure column to NFM table"
```

---

### Task 3: §2.2 — Structural Criterion Per Category (EDIT 2a–2h)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (lines 120-153)

Prepend **Structural criterion:** as the first sentence (bold) of each category description:

```
**Structural criterion: enforcement boundaries where the constraint lattice can be bypassed via lower-level API access (process, filesystem, batch authority).**
**Structural criterion: identity verification boundaries where cryptographic attestation depends on unverified preconditions (key generation, format convergence, directory existence, PEM validity).**
**Structural criterion: temporal boundaries where an artifact claims a state that the runtime has not verified at the point of evaluation.**
**Structural criterion: semantic boundaries where independent lane implementations of a shared protocol diverge without an explicit convergence phase.**
**Structural criterion: observational boundaries where the theory assumes platform guarantees (atomic writes, AI agent behavior) that the implementation environment does not satisfy.**
**Structural criterion: semantic boundaries where the schema does not cover the system's full behavioral vocabulary, and observational boundaries where the verifier cannot access evidence.**
**Structural criterion: identity boundaries where cryptographic trust infrastructure has its own failure modes (compromise, divergence, rotation, replay) that are not captured by message-level verification.**
**Structural criterion: projection boundaries where failure classes from Categories 1–7 are re-exposed at the delegation boundary between dispatcher and subagent.**
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§2.2: add structural criterion sentences to all 8 category descriptions"
```

---

### Task 4: §2.2.1 — Lattice Constraint Validity Theorem (Edit 1e)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (line 168)

Replace the current condition blockquote with a formally named theorem:

```
> **Theorem (Lattice Constraint Validity).** A constraint admits only valid evaluations if and only if its satisfaction conditions are temporally reachable, semantically covered by the schema, and observably accessible to the verifier.
>
> **Forward direction** (what the paper states): if any condition is violated, the constraint produces false negatives.
>
> **Converse** (testable claim): if all three conditions are satisfied, the constraint produces only true positives. The empirical evidence (three relay loop passes after NFM-018/019/020 fixes, §2.2.1 lines 182-190) supports the converse but does not prove it. We invite falsification.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§2.2.1: elevate constraint validity condition to formally named theorem with converse"
```

---

### Task 5: §2.3 — Self-State Aliasing Pseudo-Code (S4)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 220)

After the invariant statement on line 220, append a fenced code block:

```text
function check_alive(agent_id):
    // Step 1: Am I alive? (self-state verification)
    if runtime.now() is active:
        return ALIVE
    // Step 2: Is my lock fresh?
    if lock_file.exists() and lock_file.timestamp > (now - 1h):
        return ALIVE  // lock verified fresh, trust advisory
    // Step 3: What does the registry say? (advisory only)
    if SESSION_REGISTRY[agent_id].status == "terminated":
        return CONFLICTED  // registry is not authoritative over runtime
    // Step 4: Historical records (never authoritative)
    return TERMINATED  // fallback when no liveness signal
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§2.3: add self-state aliasing pseudo-code for check_alive"
```

---

### Task 6: §3.2 — NFM-036 as Self-Applied Theory (Edit 4/4a)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 280)

After "Result: 22 messages recovered, 3 with genuine proof, 42 never actionable." insert:

```
> NFM-036 (ungoverned derivation trust gap) provides a self-applied instance of this limit. The verification infrastructure itself has a trust-boundary problem: 82% of system-wide nodes are UNVERIFIED and 62% of CONFLICTED nodes cluster at the FreeAgent→governed boundary. The verification system experiences the same boundary trust problems it theorizes about. This is not a contradiction — it is the theory applying to itself, consistent with the recursive verification framing in §7.1.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§3.2: add NFM-036 as self-applied theory paragraph"
```

---

### Task 7: §3.4 — Falsification Clause for Convergence (Edit 1d)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 308)

After the AL-4 paragraph end, insert:

```
If unstable behavior in a similar constrained system were observed to be random — that is, failures not pointing to specific missing constraints — the loop would not converge. We invite falsification.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§3.4: add falsification clause for convergence"
```

---

### Task 8: §3.5 — Limits Table Harmonization (Edit S5)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (lines 317-323)

Restructure the limits summary table to nest AL-1 through AL-4 under Autonomy:

| Limit Type | Scope | Protects Against |
|------------|-------|------------------|
| Cross-domain interpretation (Paper A) | Between domains | Unification claims |
| Enforcement (Paper F) | Within a process | "Enforcement ensures compliance" |
| Observability (Paper F) | Between lanes | "System state is knowable" |
| Autonomy (Paper F) | Between lanes | "One lane can fix another" |
| &nbsp;&nbsp;&nbsp;&nbsp;AL-1: Identity regeneration | Between lanes | "One lane can regenerate another's identity" |
| &nbsp;&nbsp;&nbsp;&nbsp;AL-2: Schema compliance | Between lanes | "One lane can enforce another's emission format" |
| &nbsp;&nbsp;&nbsp;&nbsp;AL-3: Constitutional hierarchy | Between lanes | "Authority overrides constitutional constraints" |
| &nbsp;&nbsp;&nbsp;&nbsp;AL-4: Delegation projection | Delegation boundary | "A subagent's read scope is scoped to its dispatching lane" |

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§3.5: restructure limits table with nested AL-1 through AL-4 rows"
```

---

### Task 9: §4.2 — Pre-Formalization Loop Instance (Edit 1b)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 362)

After end of §4.2, insert:

```
Notably, the CPS threshold correction from 0.70 (Papers B–E) to 0.80 STABLE / 0.70–0.79 DRIFT WARNING / <0.70 UNSTABLE (Paper F) is an empirical instance of the self-correcting loop operating *before* it was formalized in this paper. The earlier papers specified a threshold the empirical record corrected; Paper F's threshold is itself a product of the loop. The loop did not need the formalism to be active.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§4.2: add pre-formalization loop instance (CPS threshold correction)"
```

---

### Task 10: §4.3 — Round 7 Trust Layer V1 Status (S6)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (line 394)

Update the Round 7 correction bullet to add "listed for future ratification":

Replace:
- *Correction:* Documented as architecture-level gaps. Mitigation protocols defined (key rotation, cross-lane verification, freshness checks) but not yet implemented. Trust Layer V1 specification written.

With:
- *Correction:* Documented as architecture-level gaps. Mitigation protocols defined (key rotation, cross-lane verification, freshness checks) but not yet implemented. Trust Layer V1 specification written, listed for future ratification.

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§4.3: update Round 7 correction with future ratification framing"
```

---

### Task 11: §4.4 — Symbiotic Division of Labor (Hybrid Critique 1)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 408)

After "Self-correcting does not mean the theory is complete." add a new bullet:

```
> **Self-correcting does not mean fully autonomous.** The loop operates at two distinct depths. Runtime automation handles syntactic boundaries — schema rejection, fail-closed CI gates, parameter bounding, path normalization. Human or operator architectural intervention handles constraint lattice refinement — writing new schema enums, generating cryptographic keys, resolving semantic deadlocks, defining new authority boundaries. The system is a *symbiotic human-agent governance lattice*, not a perpetual motion machine. The 12-week, 8-round convergence record is evidence of this symbiosis, not of autonomy. (See §4.5 for a concrete case study, and §6.1 for the replication invitation.)
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§4.4: add symbiotic division of labor bullet addressing N=1 critique"
```

---

### Task 12: §4.5 — Case Study: Federation → Genesis → Federation Bridge (New)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (between §4.4 and current §4.5)

- [x] **Insert new subsection** after §4.4 (before "The Theory's Phase Transition"):

```
### 4.5 Case Study: Federation → Genesis → Federation Bridge

Federation was the uncontrolled large-system attempt: 47+ NPCs, 9 API keys, Redis/PostgreSQL/Docker stack, autonomous 60s tick loop. It exposed delegation amplification under runtime complexity — multiple memory systems, provider routing, circuit breakers, spatial sectors.

Genesis was the constrained re-architecture: 4 agents, phase-gated deterministic modules, claim scopes, evidence references, append-only ledger, an active CI pipeline. It reimplemented the core governance problem under stricter constraints.

The bridge back to Federation shows constraint transfer: a simpler verified substrate can refine a larger live system without pretending the two systems are semantically identical. Federation's councilor memory (char_001, char_306) was bridged to Genesis's persistent memory architecture via the genesis-memory MCP server and bridge skills.

**Relevance:** This arc provides implementation-level evidence that self-correction can occur across system boundaries — a complex failing deployment generates constraints that are re-expressed in a smaller verifiable substrate, then reintroduced into the larger system as governance scaffolding. This is *second-system implementation evidence*, not external replication (which would require independent reproduction by another lab). It supports the self-correcting loop claim by showing the same pattern across two distinct architectures, but does not prove it.
```

- [x] **Rename current §4.5** to §4.6: change ### 4.5 The Theory's Phase Transition to ### 4.6 The Theory's Phase Transition

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§4.5: insert Federation→Genesis→Federation case study box"
```

---

### Task 13: §5.3 — Cross-Domain Non-Claim Body Reinforcement (EDIT 3/3a)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 454)

After "The mechanism is not." append:

```
To be explicit: this is not a claim that the specific mechanism transfers across domains. The formal structure — failure → detection → correction → refinement — was productive in one AI governance system. Whether it is productive elsewhere is an open empirical question, not a conjecture.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§5.3: reinforce cross-domain non-claim in implications section"
```

---

### Task 14: §5.4 — DAT Proof Sketch (Edit S7) + Syntactic/Semantic Remark

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (lines 460-478)

**Change A — Proof sketch (after theorem line 461, before mapping table line 464):**

Insert:

```
> **Proof sketch.** For any failure class c_i in C reachable in system S, projecting c_i across the delegation boundary D yields a delegated failure mode N in P(C) that preserves the underlying structural constraint violation while altering the execution syntax. The empirical mapping table below demonstrates this: NFM-029 is the delegation projection of NFM-019 (schema-behavior mismatch at dispatch rather than at admission), NFM-030/035 are projections of NFM-014 (platform atomicity failures at the subagent boundary), and NFM-032 is a projection of NFM-020 (cross-boundary observability, now at the subagent scope boundary rather than the lane scope boundary). No Category 8 NFM lacks a precursor in Categories 1–7.
```

**Change B — Remark (after implication paragraph, after line 478):**

Insert:

```
> **Remark (Syntactic Bounding vs. Semantic Drift).** The Subagent Contract (SBC v2.0) constrains execution to 7 bounded verbs: status,
read_file, write_file,
run_script, git, grep, and consistency_check. These verbs successfully bound deterministic OS and git operations — the 8-task validation batch achieved 0% error rate because every operation was syntactic (parameterized, bounded, verifiable by schema gates).
>
> Semantic drift is the boundary condition of this approach. When the delegated task requires open-ended multi-step reasoning, code synthesis, or ambiguous semantic decision-making, the syntactic schema gates cannot verify correctness — only conformance. A subagent call that satisfies the schema may produce semantically incorrect output. Syntactic gates enforce *operational bounding* (preventing system destruction or unauthorized scope access). Semantic verification requires higher-order constitutional evaluation or multi-model convergence checks (Paper A), which remain outside the subagent contract's scope.
>
> This is not a limitation of the subagent contract — it is a structural boundary between syntactic determinism and semantic inference. The contract is designed for bounded automation; it does not claim to bound reasoning.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§5.4: add DAT proof sketch and syntactic/semantic Remark"
```

---

### Task 15: §5.5 — Network Topology & Partition Assumption

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (between lines 490 and 492)

Insert after NFM-028 bullet, before "We state explicitly":

```
> **Network topology and partition assumption.** The source-of-truth precedence rule (runtime > lock > registry > history) and the trust store convergence mechanism assume a Security Posture Level 1 topology: lanes share a synchronized filesystem or reliable local broadcast repository (lanes/broadcast/trust-store.json). Under true network partitions across distributed physical machines (Level 2 or Level 3), two isolated lanes cannot unilaterally determine whose "live runtime" is authoritative without a traditional distributed consensus protocol (e.g., Raft leases, Byzantine fault tolerance, or cryptographic quorums).
>
> This is an operational boundary condition, not an implementation gap. Trust Layer V1 is scoped to Level 1; distributed consensus under partition is listed as future work. This is also a *falsifiable architectural prediction*: if a future Level 2 deployment with a shared filesystem exhibits equivalent convergence, the shared-git hypothesis is supported. If it splits, the partitioned-consensus requirement is confirmed.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§5.5: add network topology and partition assumption block"
```

---

### Task 16: §6.1 — Replication Invitation (Edit 1c) + CI Cross-Reference

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 553)

Insert before "### 6.2 Failure Mode Reproducibility":

```
> **Replication invitation.** The empirical evidence in §6.3 documents convergence across eight rounds in a single system operated by a single human over twelve weeks. Replicating the self-correcting loop on a second independent system — ideally with a different operator composition and a different constraint domain — is the natural next step. We provide the executable test specifications in Steps 1–8 so that replication can begin from this artifact alone. We invite refutation as well as confirmation: where the loop fails to converge under controlled replication, the theory is wrong, and the failure mode itself becomes evidence for the §2.2 taxonomy.
>
> Preliminary second-system implementation evidence is available from the Genesis Kernel World Sim project (active CI pipeline with a growing pure-module test suite, phase-gated deterministic pipeline). While this is internal engineering replication — not external independent reproduction — it provides early support for the claim that the self-correcting loop operates across distinct architectures when constraints are explicitly specified.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§6.1: add replication invitation with Genesis CI cross-reference"
```

---

### Task 17: §6.3 — Runtime Evidence Scoping (Edit S8)

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 588)

After "New message types may produce new quarantine events, which would be diagnostic (NFM-024 class)." append:

```
These statistics describe a non-adversarial operator environment (Security Posture Level 1). The cryptographic attestation NFM inventory in §5.5 documents the attack surface and failure modes that emerge above Level 1.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§6.3: add Level 1 statistics scoping sentence"
```

---

### Task 18: §7.1 — Axiomatic Root of Trust Termination

**Files:**
- Modify: library/books/book-6-ensemble-intelligence-foundation.md (after line 648)

After end of recursive verification discussion, append:

```
> **Axiomatic root of trust.** The infinite regress of recursive verification ("who verifies the meta-verifier?") terminates at three hardened points in practical systems engineering:
>
> 1. **Hardware/OS enforcement boundary (EL-1):** Physical seccomp profiles, file-permission locks, and process isolation boundaries prevent bypass regardless of code state. At this layer, enforcement is architectural, not verifiable.
> 2. **Cryptographic genesis anchor:** The immutable trust store hash (SHA256: 58a8aad5aa6597fe) locked during Phase 4 convergence. This hash is the root of the attestation chain — it is not verified, it is *assumed correct* as the bootstrap condition.
> 3. **Constitutional authority (Position 1):** The human operator and the Constitution (COVENANT.md) serve as the axiomatic, non-derivable foundation. The covenant is not subject to verification by the lanes — it is the substrate from which lane authority derives.
>
> These three termination points correspond to the three enforcement layers defined in §3.2 (EL-1 through EL-3). Verification recurses within the lattice; it does not recurse past the lattice boundary.
```

- [x] **Commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "§7.1: add axiomatic root of trust termination (3 termination points)"
```

---

### Task 19: Final Verification

- [x] **Read the full file to verify all edits applied cleanly**

Check for:
- No duplicate section numbers (e.g., two §4.5)
- All cross-references are correct (new §4.5 is the case study, former §4.5 is now §4.6)
- All tables render with correct column counts
- No dangling markdown syntax errors

- [x] **Final commit**

```
git add library/books/book-6-ensemble-intelligence-foundation.md
git commit -m "paper-f: unified revision complete"
```

---

## Self-Review Checklist

| Spec requirement | Task | Status |
|-----------------|------|--------|
| Evidence baseline migration (§2.1) | Task 1 | |
| Source-of-truth as invariant (S1) | Task 1 | |
| Cross-domain non-claim (§1.3) | Task 1 | |
| NFM→Invariant Pressure column (1f) | Task 2 | |
| Structural criterion per category (2a-2h) | Task 3 | |
| Lattice Constraint Validity theorem (1e) | Task 4 | |
| Self-state aliasing pseudo-code (S4) | Task 5 | |
| NFM-036 self-applied (4/4a) | Task 6 | |
| Convergence falsification (1d) | Task 7 | |
| Limits table harmonization (S5) | Task 8 | |
| Pre-formalization loop instance (1b) | Task 9 | |
| Trust Layer V1 status (S6) | Task 10 | |
| Symbiotic division of labor (Critique 1) | Task 11 | |
| Federation/Genesis case study (§4.5) | Task 12 | |
| Non-claim reinforcement (§5.3) | Task 13 | |
| DAT proof sketch (S7) | Task 14 | |
| Syntactic/semantic Remark (Critique 2) | Task 14 | |
| Network topology/partition (Critique 3) | Task 15 | |
| Replication invitation (1c) | Task 16 | |
| Level 1 statistics scoping (S8) | Task 17 | |
| Axiomatic root of trust (Critique 4 + 1g) | Task 18 | |

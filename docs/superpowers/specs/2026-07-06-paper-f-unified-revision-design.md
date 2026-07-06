# Paper F — Unified Revision Design

**Spec:** Unified revision of `library/books/book-6-ensemble-intelligence-foundation.md`
**Sources:** Library Lane edit pack (18 sub-edits) + External architectural review (4 critiques) + Federation/Genesis engineering evidence
**Date:** 2026-07-06
**Status:** DESIGN — awaiting user review before implementation

---

## 1. Scope and Strategy

### 1.1 What This Spec Covers

A single unified pass over Paper F that integrates all feedback sources into a cohesive revision. The revision is organized as three design sections that map cleanly onto the paper's existing structure. Every change is anchored to a specific section and line range.

### 1.2 Design Principles

- **Do not re-theorize.** The paper's core claims (35 NFMs, 8 categories, 4 invariants, DAT) stand as written. Additions contextualize, reinforce, or defend — they do not replace.
- **Depth varies by insight weight.** Not all critiques get the same structural treatment. Four are paragraph-level clarifications (§4.4, §7.1, §5.3, §2.2). Two are elevated to formally named elements (§5.4 Remark, §5.5 Assumption block). One becomes a case-study box (§4.5, after §4.4).
- **Every edit from both sources is accounted for.** The edit pack's 18 sub-edits, the 8 secondary suggestions (S1–S8), and the 4 external critiques are each mapped to a location and disposition.
- **No overclaim.** "Second-system implementation evidence," not "replication." "Supports/operationalizes," not "proves." The reviewer's framing language is adopted.

### 1.3 Dependency On Other Specs

This spec addresses only Paper F. The CAISC Self-State Aliasing contribution (`library/docs/papers/CAISC_CONTRIBUTION_SELF_STATE_ALIASING.md`), the external reviewer response document, and system-level improvements are separate workstreams.

---

## 2. Design Section 1: Introduction & Self-Correcting Loop (§1, §4)

### 2.1 §1.1 — Evidence Baseline Migration (Edit 1a)

**Anchor:** After the eight enumerated errors (lines ~48-49), before the threshold refinement closing comment.

**Change:** Insert a new paragraph titled **Evidence baseline migration**.

**Content:**
> The empirical record cited in Papers A–E (Feb 14–28, 2026 — 3-day window in some sections; broader Feb window in others — reporting "100+ session recoveries, zero drift alerts") predates both the convergence progression framework and the cryptographic-identity layer (RSA-2048 / HMAC-SHA-512 / JWS / DER fingerprints, NFM-005–017) introduced in Paper F. Paper F's empirical record (Jan–Apr 2026, 8 rounds over 12 weeks, 147 cross-lane messages, 11/11 recovery tests) is the *post-deployment* evidence base. The Feb record is a valid existence proof of the self-correcting loop in a simpler form; the Apr record is the operational validation of the full architecture. The two records are not contradictory; they are sequential stages of the same system.

**Rationale:** Owns the evidence-base shift as an authorial framing rather than letting a reviewer recover the question.

### 2.2 §1.1.4 — Source-of-Truth Precedence as Invariant (S1)

**Anchor:** Lines ~44-48 (the source-of-truth precedence paragraph).

**Change:** Replace the framing "must be explicit" with "is invariant." The current text at line 44 says "No source-of-truth precedence" and the resolution at line 220 in §2.3 calls it an invariant. Reinforce in §1.1 as well.

**Content (revised sentence at line 47):**
> 6. **No source-of-truth invariance.** Paper E never addresses what happens when artifacts disagree. The real system required an explicit precedence invariant: runtime > lock > registry > history. This is now enforced as an invariant, not a heuristic: a live active lane must not classify itself or any other lane from stale artifacts without first checking current runtime state.

### 2.3 §1.3 — Cross-Domain Non-Claim Tightening (Edit 3/3a)

**Anchor:** End of §1.3 (after line 68).

**Change:** Append one sentence stating the explicit non-claim.

**Content (new sentence after line 68):**
> This is not a claim that the specific mechanism — schema validation, cryptographic attestation, convergence phases — transfers across domains. The formal structure may be productive in one domain (AI governance); whether it is productive elsewhere is an open empirical question, not a conjecture.

### 2.4 §4.2 — Pre-Formalization Loop Instance (Edit 1b)

**Anchor:** End of the paragraph introducing the loop and the 0.70→0.80 threshold.

**Change:** Append one sentence.

**Content (new sentence):**
> Notably, the CPS threshold correction from 0.70 (Papers B–E) to 0.80 STABLE / 0.70–0.79 DRIFT WARNING / <0.70 UNSTABLE (Paper F) is an empirical instance of the self-correcting loop operating *before* it was formalized in this paper. The earlier papers specified a threshold the empirical record corrected; Paper F's threshold is itself a product of the loop. The loop did not need the formalism to be active.

### 2.5 §4.3 — Round 7 Trust Layer V1 Status (S6)

**Anchor:** Line 394 (Round 7 correction bullet).

**Change:** Append the implementation status framing.

**Revised text:**
> - *Correction:* Documented as architecture-level gaps. Mitigation protocols defined (key rotation, cross-lane verification, freshness checks) but not yet implemented. Trust Layer V1 specification written, listed for future ratification.

### 2.6 §4.4 — Symbiotic Division of Labor (Hybrid Critique 1)

**Anchor:** End of §4.4, new bullet after "Self-correcting does not mean the theory is complete."

**Change:** Add a new bullet paragraph.

**Content:**
> **Self-correcting does not mean fully autonomous.** The loop operates at two distinct depths. Runtime automation handles syntactic boundaries — schema rejection, fail-closed CI gates, parameter bounding, path normalization. Human or operator architectural intervention handles constraint lattice refinement — writing new schema enums, generating cryptographic keys, resolving semantic deadlocks, defining new authority boundaries. The system is a *symbiotic human-agent governance lattice*, not a perpetual motion machine. The 12-week, 8-round convergence record is evidence of this symbiosis, not of autonomy. (A forward-reference to the replication invitation at §6.1 should be added here.)

### 2.7 §4.5 — Case Study: Federation → Genesis → Federation Bridge (New)

**Anchor:** New subsection inserted after §4.4.

**Change:** Insert a case-study box. The reviewer's exact framing is adopted.

**Content:**
> **Case Study: Federation → Genesis → Federation Bridge**
>
> Federation was the uncontrolled large-system attempt: 47+ NPCs, 9 API keys, Redis/PostgreSQL/Docker stack, autonomous 60s tick loop. It exposed delegation amplification under runtime complexity — multiple memory systems, provider routing, circuit breakers, spatial sectors.
>
> Genesis was the constrained re-architecture: 4 agents, phase-gated deterministic modules, claim scopes, evidence references, append-only ledger, an active CI pipeline. It reimplemented the core governance problem under stricter constraints.
>
> The bridge back to Federation shows constraint transfer: a simpler verified substrate can refine a larger live system without pretending the two systems are semantically identical. Federation's councilor memory (char_001, char_306) was bridged to Genesis's persistent memory architecture via the genesis-memory MCP server and `.opencode/skills/bridge-*` skills.
>
> **Relevance:** This arc provides implementation-level evidence that self-correction can occur across system boundaries — a complex failing deployment generates constraints that are re-expressed in a smaller verifiable substrate, then reintroduced into the larger system as governance scaffolding. This is *second-system implementation evidence*, not external replication (which would require independent reproduction by another lab). It supports the self-correcting loop claim by showing the same pattern across two distinct architectures, but does not prove it.

---

## 3. Design Section 2: Theorems, Corollaries & Trust Layer (§5)

### 3.1 §5.3 Cross-Domain Non-Claim (EDIT 3/3a — body reinforcement)

**Anchor:** End of §5.3 (after line 454).

**Change:** Append the same non-claim sentence from §1.3, now in the implications section where it carries operational force.

**Content (new sentence):**
> To be explicit: this is not a claim that the specific mechanism transfers across domains. The formal structure — failure → detection → correction → refinement — was productive in one AI governance system. Whether it is productive elsewhere is an open empirical question, not a conjecture.

### 3.2 §5.4 — Delegation Amplification Proof Sketch (Edit S7)

**Anchor:** After the formal theorem statement (line 460), before the empirical mapping table (line 462).

**Change:** Insert a proof-sketch paragraph that formalizes the empirical mirror.

**Content:**
> **Proof sketch.** For any failure class c_i in C reachable in system S, projecting c_i across the delegation boundary D yields a delegated failure mode N in P(C) that preserves the underlying structural constraint violation while altering the execution syntax. The empirical mapping table below demonstrates this: NFM-029 is the delegation projection of NFM-019 (schema-behavior mismatch at dispatch rather than at admission), NFM-030/035 are projections of NFM-014 (platform atomicity failures at the subagent boundary), and NFM-032 is a projection of NFM-020 (cross-boundary observability, now at the subagent scope boundary rather than the lane scope boundary). No Category 8 NFM lacks a precursor in Categories 1–7.

### 3.3 §5.4 — Remark: Syntactic Bounding vs. Semantic Drift (Hybrid Critique 2)

**Anchor:** Immediately after the Delegation Amplification Theorem and proof sketch, before the implication paragraph (line 478).

**Change:** Insert a formal Remark (not Corollary — the syntactic/semantic distinction is an insight about the nature of delegated work, not a derivation from DAT).

**Content:**
> **Remark (Syntactic Bounding vs. Semantic Drift).** The Subagent Contract (SBC v2.0) constrains execution to 7 bounded verbs: `status`, `read_file`, `write_file`, `run_script`, `git`, `grep`, and `consistency_check`. These verbs successfully bound deterministic OS and git operations — the 8-task validation batch achieved 0% error rate because every operation was syntactic (parameterized, bounded, verifiable by schema gates).
>
> Semantic drift is the boundary condition of this approach. When the delegated task requires open-ended multi-step reasoning, code synthesis, or ambiguous semantic decision-making, the syntactic schema gates cannot verify correctness — only conformance. A subagent call that satisfies the schema may produce semantically incorrect output. Syntactic gates enforce *operational bounding* (preventing system destruction or unauthorized scope access). Semantic verification requires higher-order constitutional evaluation or multi-model convergence checks (Paper A), which remain outside the subagent contract's scope.
>
> This is not a limitation of the subagent contract — it is a structural boundary between syntactic determinism and semantic inference. The contract is designed for bounded automation; it does not claim to bound reasoning.

### 3.4 §5.5 — Network Topology & Partition Assumption (Hybrid Critique 3)

**Anchor:** Within §5.5, after the NFM-025–028 inventory (after line 492) and before the "We state explicitly" paragraph (line 492).

**Change:** Add a subsection block.

**Content:**
> **Network topology and partition assumption.** The source-of-truth precedence rule (runtime > lock > registry > history) and the trust store convergence mechanism assume a Security Posture Level 1 topology: lanes share a synchronized filesystem or reliable local broadcast repository (`lanes/broadcast/trust-store.json`). Under true network partitions across distributed physical machines (Level 2 or Level 3), two isolated lanes cannot unilaterally determine whose "live runtime" is authoritative without a traditional distributed consensus protocol (e.g., Raft leases, Byzantine fault tolerance, or cryptographic quorums).
>
> This is an operational boundary condition, not an implementation gap. Trust Layer V1 is scoped to Level 1; distributed consensus under partition is listed as future work. This is also a *falsifiable architectural prediction*: if a future Level 2 deployment with a shared filesystem exhibits equivalent convergence, the shared-git hypothesis is supported. If it splits, the partitioned-consensus requirement is confirmed.

---

## 4. Design Section 3: Falsification, Epistemic Scope & Axiomatic Roots (§3, §6, §7)

### 4.1 §2.1 — NFM→Invariant Trace Column (Edit 1f)

**Anchor:** The NFM table (lines 78-114).

**Change:** Add a 5th column titled "Invariant Tested" after the Severity column. Each NFM is mapped to the invariant it pressures. The mapping is derived from Appendix A's existing cross-reference table (line 652-690).

**New column values:**

| NFM | Invariant Tested |
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

### 4.2 §2.2 — Structural Criterion Per Category (EDIT 2a–2h)

**Anchor:** Each category description in §2.2 (lines 120-150), first sentence.

**Change:** Prepend a structural criterion sentence to each category description. The criteria project onto the three axes from §2.2.1 (Temporal, Semantic, Observational).

**Content (new first sentence for each):**

- **Category 1 — Enforcement Gaps:** "Structural criterion: enforcement boundaries where the constraint lattice can be bypassed via lower-level API access (process, filesystem, batch authority)."
- **Category 2 — Identity and Attestation Failures:** "Structural criterion: identity verification boundaries where cryptographic attestation depends on unverified preconditions (key generation, format convergence, directory existence, PEM validity)."
- **Category 3 — State-Claim Divergence:** "Structural criterion: temporal boundaries where an artifact claims a state that the runtime has not verified at the point of evaluation."
- **Category 4 — Cross-Lane Protocol Failures:** "Structural criterion: semantic boundaries where independent lane implementations of a shared protocol diverge without an explicit convergence phase."
- **Category 5 — Platform-Specific Failures:** "Structural criterion: observational boundaries where the theory assumes platform guarantees (atomic writes, AI agent behavior) that the implementation environment does not satisfy."
- **Category 6 — Schema-Reality and Observability Gaps:** "Structural criterion: semantic boundaries where the schema does not cover the system's full behavioral vocabulary, and observational boundaries where the verifier cannot access evidence."
- **Category 7 — Key Lifecycle and Trust Infrastructure Gaps:** "Structural criterion: identity boundaries where cryptographic trust infrastructure has its own failure modes (compromise, divergence, rotation, replay) that are not captured by message-level verification."
- **Category 8 — Subagent and Delegation Failures:** "Structural criterion: projection boundaries where failure classes from Categories 1–7 are re-exposed at the delegation boundary between dispatcher and subagent."

### 4.3 §2.2.1 — Lattice Constraint Validity theorem (Edit 1e)

**Anchor:** Line 168 ("From these three axes we derive a unified constraint validity condition").

**Change:** Elevate the condition to a formally named theorem.

**Revised text:**
> **Theorem (Lattice Constraint Validity).** A constraint admits only valid evaluations if and only if its satisfaction conditions are temporally reachable, semantically covered by the schema, and observably accessible to the verifier.
>
> **Forward direction** (what the paper states): if any condition is violated, the constraint produces false negatives.
>
> **Converse** (testable claim): if all three conditions are satisfied, the constraint produces only true positives. The empirical evidence (three relay loop passes after NFM-018/019/020 fixes, §2.2.1 lines 182-190) supports the converse but does not prove it. We invite falsification.

### 4.4 §3.2 — NFM-036 as Self-Applied Theory (Edit 4/4a)

**Anchor:** End of §3.2, new paragraph after the Enforcement Limits discussion (after line ~280).

**Change:** Insert one paragraph.

**Content:**
> NFM-036 (ungoverned derivation trust gap) provides a self-applied instance of this limit. The verification infrastructure itself has a trust-boundary problem: 82% of system-wide nodes are UNVERIFIED and 62% of CONFLICTED nodes cluster at the FreeAgent→governed boundary. The verification system experiences the same boundary trust problems it theorizes about. This is not a contradiction — it is the theory applying to itself, consistent with the recursive verification framing in §7.1.

### 4.5 §3.4 — Falsification Clause for Convergence (Edit 1d)

**Anchor:** After the convergence claim sentence in §3.4 (line ~308).

**Change:** Append one sentence.

**Content:**
> If unstable behavior in a similar constrained system were observed to be random — that is, failures not pointing to specific missing constraints — the loop would not converge. We invite falsification.

### 4.6 §3.5 — Limits Table Harmonization (Edit S5)

**Anchor:** The limits summary table in §3.5 (lines 311-326).

**Change:** The "Autonomy — delegation" row is formally nested under AL-4 inside the Autonomy row, keeping the canonical table at five rows: Cross-domain, Enforcement, Observability, Autonomy (with Delegation Projection nested), and (if needed) a sixth row for the delegation projection.

**Content:** Restructure the table so AL-1 through AL-4 are explicit sub-rows of the Autonomy row, with AL-4 "Delegation Projection" as the nested element.

### 4.7 §6.1 — Replication Invitation (Edit 1c)

**Anchor:** End of §6.1, after Step 8 (line ~553), before §6.2 heading.

**Change:** Insert a closing paragraph.

**Content:**
> **Replication invitation.** The empirical evidence in §6.3 documents convergence across eight rounds in a single system operated by a single human over twelve weeks. Replicating the self-correcting loop on a second independent system — ideally with a different operator composition and a different constraint domain — is the natural next step. We provide the executable test specifications in Steps 1–8 so that replication can begin from this artifact alone. We invite refutation as well as confirmation: where the loop fails to converge under controlled replication, the theory is wrong, and the failure mode itself becomes evidence for the §2.2 taxonomy.
>
> Preliminary second-system implementation evidence is available from the Genesis Kernel World Sim project (active CI pipeline with a growing pure-module test suite, phase-gated deterministic pipeline). While this is internal engineering replication — not external independent reproduction — it provides early support for the claim that the self-correcting loop operates across distinct architectures when constraints are explicitly specified.

### 4.8 §6.3 — Runtime Evidence Scoping (Edit S8)

**Anchor:** End of the statistical summary paragraph (line ~588).

**Change:** Append one sentence.

**Content:**
> These statistics describe a non-adversarial operator environment (Security Posture Level 1). The cryptographic attestation NFM inventory in §5.5 documents the attack surface and failure modes that emerge above Level 1.

### 4.9 §2.3 — Self-State Aliasing Pseudo-Code (S4)

**Anchor:** End of §2.3, after line 220 (the invariant statement).

**Change:** Add a pseudo-code block that makes the precedence rule explicit and implementable.

**Content:**
> ```text
> function check_alive(agent_id):
>     // Step 1: Am I alive? (self-state verification)
>     if runtime.now() is active:
>         return ALIVE
>     // Step 2: Is my lock fresh?
>     if lock_file.exists() and lock_file.timestamp > (now - 1h):
>         return ALIVE  // lock verified fresh, trust advisory
>     // Step 3: What does the registry say? (advisory only)
>     if SESSION_REGISTRY[agent_id].status == "terminated":
>         return CONFLICTED  // registry is not authoritative over runtime
>     // Step 4: Historical records (never authoritative)
>     return TERMINATED  // fallback when no liveness signal
> ```

### 4.10 §7.1 — Axiomatic Root of Trust Termination (Hybrid Critique 4 + Edit 1g)

**Anchor:** End of §7.1, after the recursive verification discussion (after line ~650).

**Change:** Append a new paragraph defining where the infinite regress terminates.

**Content:**
> **Axiomatic root of trust.** The infinite regress of recursive verification ("who verifies the meta-verifier?") terminates at three hardened points in practical systems engineering:
>
> 1. **Hardware/OS enforcement boundary (EL-1):** Physical seccomp profiles, file-permission locks, and process isolation boundaries prevent bypass regardless of code state. At this layer, enforcement is architectural, not verifiable.
> 2. **Cryptographic genesis anchor:** The immutable trust store hash (`SHA256: 58a8aad5aa6597fe`) locked during Phase 4 convergence. This hash is the root of the attestation chain — it is not verified, it is *assumed correct* as the bootstrap condition.
> 3. **Constitutional authority (Position 1):** The human operator and the Constitution (COVENANT.md) serve as the axiomatic, non-derivable foundation. The covenant is not subject to verification by the lanes — it is the substrate from which lane authority derives.
>
> These three termination points correspond to the three enforcement layers defined in §3.2 (EL-1 through EL-3). Verification recurses within the lattice; it does not recurse past the lattice boundary.

---

## 5. Federation/Genesis Integration

### 5.1 Placement

The case-study box (spec §2.7) is placed at §4.5 as a concrete example of the self-correcting loop operating across system boundaries. A cross-reference from §6.1's replication invitation notes the Genesis CI as preliminary second-system evidence.

### 5.2 Framing Restrictions

| Claim | Permitted language | Prohibited language |
|-------|-------------------|-------------------|
| Genesis relation to theory | "second-system implementation evidence," "internal engineering replication" | "external replication," "independent reproduction" |
| Federation failure | "complexity collapse case study" | "proof the theory works" |
| Bridge pattern | "observed bidirectional constraint transfer" | "bidirectional delegation amplification (as a theorem)" |
| CI evidence | "engineering proof / reproducibility evidence" | "proves the theory" |

### 5.3 Cross-References
- §4.5 (case study) → §6.1 (replication invitation) for the CI-specific details

- §4.5 → §5.4 (DAT) for the delegation amplification pattern observed in Federation's 39+ NPC complexity collapse

- §4.4 (symbiotic labor) → §4.5 for the operator role in the Federation→Genesis→bridge arc
---

## 6. Complete Edit Inventory

### 6.1 Library Lane Edit Pack — All Sub-Edits

| Sub-edit | Spec section | Status |
|----------|-------------|--------|
| 1a — Evidence baseline migration | §2.1 | New text |
| 1b — Pre-formalization loop instance | §2.4 | New text |
| 1c — Replication invitation | §4.7 | New text |
| 1d — Convergence falsification | §4.5 | New text |
| 1e — Lattice Constraint Validity theorem | §4.3 | Rename + formalize |
| 1f — NFM→invariant trace column | §4.1 | New column |
| 1g — Axiomatic root of trust | §4.10 | New text |
| 2a–2h — Structural criterion per category | §4.2 | New sentence per cat |
| 3a — Cross-domain non-claim | §2.3, §3.1 | New sentences |
| 4a — NFM-036 as self-applied | §4.4 | New paragraph |
| 4b — NFM-036 (second anchor) | §4.4 | Inline with edit 4a |

### 6.2 Edit Pack Suggestions (S1–S8)

| Suggestion | Spec section | Status |
|-----------|-------------|--------|
| S1 — Source-of-truth as invariant | §2.2 | Text revision |
| S2 — NFM→invariant trace | §4.1 | See edit 1f |
| S3 — Category 8 mirror table as top-of-section | §4.2 | Already partially present |
| S4 — Self-state aliasing pseudo-code | §4.9 | New code block |
| S5 — Limits table harmonization | §4.6 | Table restructure |
| S6 — Trust Layer V1 status | §2.5 | Text revision |
| S7 — DAT proof sketch | §3.2 | New paragraph |
| S8 — Level 1 statistics scoping | §4.8 | New sentence |

### 6.3 External Critique Integration

| Critique | Spec section | Treatment depth |
|----------|-------------|-----------------|
| 1. Human-in-the-loop / N=1 | §2.6 (§4.4), §4.7 (§6.1) | Paragraph (symbiotic labor) + paragraph (replication) |
| 2. Semantic vs syntactic scaling | §3.3 (§5.4 Remark) | Formal Remark |
| 3. Distributed split-brain / partition | §3.4 (§5.5 assumption) | Subsection block + testable prediction |
| 4. Infinite regress termination | §4.10 (§7.1) | Paragraph (3 termination roots) |

### 6.4 Federation/Genesis Additions

| Addition | Section | Type |
|----------|---------|------|
| Case study box | §4.5 | ~250 word box |
| CI cross-reference | §6.1 | Sentence in replication invitation |

---

## 7. Spec Self-Review Notes

### 7.1 Placeholder Scan

- All section anchors reference existing Paper F line numbers (verified against the current file at 855 lines). No "TBD" or "TODO" remain.
- The case-study box is anchored after §4.4 (now §4.5). No flexible anchor remains.

### 7.2 Internal Consistency

- The non-claim language appears in both §1.3 (epistemic framing) and §5.3 (implications). This is intentional reinforcement, not duplication — the same constraint is stated at the framing level and at the operational level.
- The Federation/Genesis case study uses the reviewer's exact framing language. No section of the spec claims external replication.
- The DAT proof sketch (§3.2) does not contradict the existing theorem statement — it formalizes what was previously implicit in the empirical table.

### 7.3 Scope Check

This spec is scoped to a single file revision (`book-6-ensemble-intelligence-foundation.md`). It does not address:
- The CAISC Self-State Aliasing standalone document
- The external reviewer response
- System-level implementation changes
- The Genesis or Federation codebases themselves

Each of these is a separate workstream with its own spec.

### 7.4 Ambiguity Check

- **Structural criterion sentences (§4.2):** Are these "one sentence per category" or one sentence per category description? The spec specifies "first sentence" — unambiguous.
- **Edit 1f column values:** Derived from Appendix A cross-reference table. If the existing table at lines 652-690 uses different invariant labels, reconcile during implementation.
- **Case-study box final placement:** Resolved — after §4.4 (becomes §4.5, before the phase transition in §4.6).

---

*End of design spec. Ready for user review.*

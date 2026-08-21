# Book 7 — WE Framework: The Rosetta Calculus of State, Translation, and Recovery

**Status:** Draft 0.2 research program  
**Date:** 2026-08-21  
**Canonical working manuscript:** Google Doc `1f0T6dm3R5JB3rSoDVHMrTjnbNT4SnOl0_xskVvtLSB4`  
**Repository role:** versioned mathematical definitions, executable specifications, and experiment lineage

## 1. Epistemic boundary

This work does not claim that physics, biology, artificial intelligence, distributed systems, quantum mechanics, and human cognition are literally the same system.

It asks a narrower testable question:

> When different domains contain state, transformation, constraint, observation, failure, uncertainty, and recovery, which relationships admit structure-preserving translations?

A translation is accepted only under a declared scope and only where the relevant operations or predictions survive formal or adversarial test.

## 2. Domain state system

For a domain `D`, define

```text
D = (X, T, C, O, E, R, A)
```

where:

- `X` — possible states;
- `T` — allowed transformations;
- `C` — constraints defining admissibility;
- `O` — observations or projections;
- `E` — perturbations, errors, or failures;
- `R` — recovery or correction operations;
- `A` — authority / precedence structure used when observations disagree.

A candidate Rosetta translation from `D1` to `D2` must declare separate maps for the objects/operations it claims to translate, rather than treating one symbol `F` as automatically well typed.

For example:

```text
F_X : X1 -> X2
F_T : T1 -> T2
```

### Composition

A composition-preservation claim is meaningful only when the transformations are composable and their translations actually land in `T2`:

```text
F_T(g ∘ f) = F_T(g) ∘ F_T(f).
```

If either side is undefined, the statement is ill typed rather than falsified.

### Invariant preservation

```text
I1(x) = I2(F_X(x))
```

or within an explicit tolerance.

### Constraint preservation

If `x` satisfies a declared constraint `c` in `D1`, the translated state must satisfy the translated constraint in `D2` under the declared scope.

### Failure / recovery preservation

Where the maps and operations are defined:

```text
F_X(R1(E1(x))) ≈ R2(E2(F_X(x))).
```

A mapping that only preserves vocabulary is analogy. A mapping that preserves operations and predicts failures is a candidate structural translation.

## 3. Operational phenotype

Let `H_t` be the complete historical record available to a long-running system at time `t`.

Define an operational phenotype map

```text
I : H -> P
```

where `I(H_t)` contains the declared properties that must survive for the system to count as the same operational process for a specified task class: mission, authority, constraints, active state, commitments, unresolved failures, expected next actions, provenance, evidence references, and other frozen invariants.

### Exact phenotype equivalence

Two histories are phenotype-equivalent when

```text
H ~I H'  iff  I(H) = I(H').
```

This exact relation is the quotient relation. Because it is equality after a fixed map, it is reflexive, symmetric, and transitive.

### Approximate phenotype fidelity

Approximate closeness is measured separately:

```text
d(I(H), I(H')) <= ε.
```

A generic `ε`-threshold relation is **not** assumed to be an equivalence relation because transitivity can fail. Many individually small deviations can accumulate into a large long-run drift.

That is not a defect in the framework; it is the mathematical reason R7-9 exists. The quotient lives at exact equality. The fidelity metric measures distance between quotient representatives and restored states over time.

### Frozen v1 collection semantics

The executable `we.phenotype/v1` vector uses set semantics for all collection-valued coordinates:

```text
order ignored
duplicate normalized labels ignored
```

If multiplicity later becomes future-relevant, that requires a new schema rather than a silent reinterpretation of v1.

## 4. Compact / restore

Define

```text
C : H -> Z
R : Z -> H*
```

where `Z` is a much smaller explicit operational state.

A restore is phenotype-preserving when

```text
I(R(C(H))) ≈ I(H).
```

A stronger phenotype-level idempotence target is

```text
C(R(C(H))) = C(H)
```

within a declared tolerance.

Candidate engineering compression objective:

```text
C* = arg min_C [ |C(H)| + λ d(I(H), I(R(C(H)))) ]
```

The compact packet is not a miniature transcript. It is an encoding of an operational equivalence class plus whatever bounded metadata the chosen restoration protocol requires.

The objective is deliberately described as **rate-distortion / information-bottleneck adjacent**, not identical to those classical formulations. `|C(H)|` is currently a size proxy, not Shannon rate or mutual information.

## 5. Operational sufficiency

Let `π` be the policy selecting future actions. `Z_t` is `ε`-operationally sufficient for `H_t` over a declared evaluation class when

```text
sup_a | Pπ(a | H_t) - Pπ(a | Z_t) | <= ε.
```

This is a bounded engineering criterion for action-distribution preservation.

It is adjacent to statistical sufficiency and Blackwell's comparison of experiments, but it is **not named Blackwell sufficiency**: Blackwell comparison is a stronger decision-theoretic relation over experiments and decision problems.

## 6. Effective temporal context

Let `K` be nominal model context capacity. A recurrent compact / restore system evolves

```text
z_(t+1) = C(R(z_t) ⊕ Δ_t ⊕ P_t)
```

where `Δ_t` is newly accumulated history and `P_t` is selected state synchronized from peer lanes or durable stores.

### Typing condition

The recurrence is defined only when

```text
R(z_t) ⊕ Δ_t ⊕ P_t ∈ dom(C).
```

Likewise, `R` must be defined on every reachable compact state supplied to it. These domain/codomain requirements turn a class of interface/import failures into definition-time checks.

The model's active buffer remains finite while operational state can survive arbitrarily many context turnovers subject to storage, computation, and cumulative fidelity loss.

Define `T_eff` as the age of the oldest event whose declared invariant contribution remains recoverable from current state within an accepted fidelity threshold.

```text
nominal context          = tokens available now
effective temporal state = historically relevant state still represented now
```

This is the mathematical version of the long-running Archivist / Library / Swarm / Control Plane compact-restore behavior: the native context window did not become larger; the state lifetime exceeded a single context-window lifetime.

## 7. Distributed projections

Let `X_t` be the complete system state. No single component necessarily observes it directly.

```text
O_i(t) = P_i(X_t)
```

A reconstruction operator attempts

```text
X_hat_t = Q(O_1, O_2, ..., O_n)
```

and may only need phenotype-level fidelity:

```text
I(X_hat_t) ≈ I(X_t).
```

Useful redundancy is complementary projection redundancy, not universal token duplication.

## 8. Belief state and belief lattice

Let `Ω` be the set of possible complete states. Define

```text
B_t ⊆ Ω
```

as states still consistent with currently accepted evidence.

Evidence narrows possibilities:

```text
B_(t+1) = B_t ∩ Consistent(E).
```

Use the reverse-inclusion knowledge order

```text
B1 ⪯ B2  iff  B1 ⊇ B2.
```

Then `P(Ω)` is a complete lattice. Greater information corresponds to fewer possible worlds.

The formal top of the full lattice is the empty belief `∅`, representing inconsistency: no world remains possible. A singleton `{x}` is instead a maximal consistent belief, representing one resolved possible world.

This supplies a classical mathematical interpretation of retaining multiple valid hypotheses rather than prematurely choosing one. It is not quantum superposition.

### Order-dual convention

`L_B` is the order dual of the ordinary powerset lattice under forward inclusion. Its carrier is unchanged but its operations are reversed:

```text
belief meet = union
belief join = intersection
bottom      = Ω
top         = ∅
```

Thus evidence intersection is **join in the knowledge order**.

### Conflict Preservation Principle — candidate

If two observations are individually valid, mutually incompatible under the current model, and neither dominates by a frozen temporal or authority rule, reconciliation should preserve multiple hypotheses or return an explicit `UNRESOLVED` / `CONFLICT` disposition.

Simple intersection that reaches `∅` identifies a contradiction; it does not itself solve belief revision. AGM belief revision is therefore prior-art framing for the next operator, not something the current implementation claims to instantiate.

## 9. Ambient constraint lattice and induced observed order

Let

```text
Cset = {c1, c2, ..., cm}
```

be a finite declared constraint family.

The power set

```text
L_C = (P(Cset), ⊆, ∩, ∪)
```

is a Boolean lattice.

A concrete state maps to a satisfaction signature

```text
σ(x) = { c in Cset : x satisfies c }.
```

This provides an ambient lattice even when concrete admissible runtime states are not closed under ambient intersection and union.

The executable program distinguishes:

1. ambient Boolean sublattice closure;
2. induced pairwise GLB/LUB existence;
3. distributivity of the induced lattice, when an induced lattice exists.

Failure of ambient closure does not by itself show that the induced order is not a lattice.

### R7-6b — distributivity boundary

If the induced family is a lattice, test:

```text
x ∧ (y ∨ z) = (x ∧ y) ∨ (x ∧ z)
x ∨ (y ∧ z) = (x ∨ y) ∧ (x ∨ z)
```

If either identity fails, preserve the explicit triple counterexample and search for a five-element forbidden sublattice witness:

```text
M3 — diamond
N5 — pentagon
```

The executable classifier now does this.

A nondistributive result would be mathematically significant, but it would **not prove quantum mechanics or quantum logic**. Nondistributivity is one structural feature important in the history of quantum logic; many non-quantum mathematical lattices are nondistributive.

## 10. Dual-lattice verification model

The framework couples:

- `L_C`: which declared constraints are satisfied?
- `L_B`: which underlying states remain possible?

Evidence updates both:

```text
(B_t, σ_t) --evidence--> (B_(t+1), σ_(t+1)).
```

The lattices use opposite order orientations:

```text
L_C: forward inclusion
L_B: reverse inclusion
```

There is no claimed isomorphism between them; their base sets differ. The identity-on-carrier map from ordinary belief-set inclusion to the knowledge order is order reversing and explains the meet/join swap within `L_B`.

Operationally:

```text
constraint accumulation: union        = join in L_C
belief narrowing:        intersection = join in L_B
```

This separates:

```text
what could be true?
```

from

```text
what would be admissible if it were true?
```

without silently confusing their lattice orientations.

## 11. Semantic binding

A recurring failure family is

```text
formal validity != semantic validity
```

Examples:

```text
valid signature != authorized signer
valid signer != correct role
valid evidence != evidence for this task
valid proof != proof of the intended statement
valid state artifact != current state
valid compact packet != faithful operational phenotype
```

Define

```text
Bind(q, φ, c) ∈ {BOUND, UNBOUND, UNKNOWN}
```

where `q` is the intended claim or task, `φ` is the formal object presented as its representation, and `c` contains scope, authority, time, provenance, definitions, and task identity.

Formal derivability alone

```text
⊢ φ
```

does not establish the binding relation.

A cross-domain Rosetta translation must therefore answer both:

1. Does the structural diagram commute?
2. Is the translated structure still bound to the intended semantic role?

This distinction is adjacent to the established software verification/validation distinction: satisfying a formal specification and satisfying the intended need are different questions.

## 12. Failure as a discovery operator

Book 6 supplied

```text
failure -> detection -> correction -> constraint refinement -> new stable state
```

Book 7 models an update

```text
C_(t+1) = Refine(C_t, Diagnose(f_t, e_t)).
```

A patch is not automatically a structural constraint. A candidate refinement should predict a class of future failures and survive adversarial test.

## 13. Causal-slice harness

For one verification event define

```text
x = (q, φ, signer, role, task, challenge, time,
     trust, evidence, provenance, verifier_state).
```

The verifier computes

```text
V(x) ∈ {VERIFIED, REJECTED, UNKNOWN, EXPIRED, CONFLICT, ...}.
```

A causal experiment compares

```text
V(x)
```

with

```text
V(x + δ_i)
```

where `δ_i` changes exactly one frozen coordinate.

This is an experimental slice through a high-dimensional constraint state space.

The construction is Pearl-intervention adjacent only when the coordinate belongs to an explicit structural causal model and the intervention semantics are frozen. A one-coordinate perturbation by itself is not automatically a Pearl `do` intervention.

AIDE / Obscura is currently one external architecture on which these slices are tested; it is not the owner or definition of the WE Framework mathematics.

## 14. Prior-art map

Book 7 now maintains a dedicated prior-art map at [`../theory/PRIOR-ART.md`](../theory/PRIOR-ART.md).

The current anchors are:

- Blackwell comparison of experiments / decision-theoretic informativeness;
- Shannon rate-distortion theory;
- Tishby–Pereira–Bialek information bottleneck;
- AGM belief revision;
- Birkhoff–von Neumann quantum logic and nondistributive lattices;
- Boehm software verification/validation;
- Pearl causal interventions.

The policy is conservative:

```text
same formal object + hypotheses -> theorem may transfer
special case                    -> theorem with restriction
adjacent structure              -> framing only
word-level resemblance          -> ANALOGY ONLY
```

Book 7 should not borrow a prestigious theorem name when the current WE object does not satisfy that theorem's hypotheses.

## 15. First executable targets

### R7-1 — context-turnover invariance

Compare future decisions from a frozen full-history state with decisions from multiple compact target sizes across repeated fresh-context restores.

Metrics: compression ratio, phenotype fidelity, future-action agreement, cumulative drift, recovery failures.

### R7-2 — multi-lane projection reconstruction

Ablate lane projections and determine the minimal reconstructive basis required after total conversational context loss.

### R7-3 — valid-state conflict preservation

Inject authentic but temporally inconsistent state artifacts. Require `CONFLICT` / `UNRESOLVED` until disambiguating evidence arrives.

### R7-4 — authority-guided temporal reconciliation

Add one frozen authoritative transition event and test whether the belief state contracts only as justified.

### R7-5 — semantic-binding attack

Supply a formally valid object bound to the wrong task, role, time, or intended claim.

### R7-6 — lattice classification

Enumerate observed satisfaction signatures for a bounded constraint family. Separately test ambient meet/join closure and existence of GLB/LUB in the induced observed order.

### R7-6b — distributivity / forbidden-sublattice test

For an induced lattice, test distributivity and preserve either a proof-by-exhaustion on the finite family or a counterexample plus `M3`/`N5` witness where found.

### R7-7 — Rosetta commutation test

Freeze explicit well-typed maps and recovery / perturbation operators across two narrow domains and test the commuting condition.

### R7-8 — holdout failure-prediction transfer

Predict an unobserved failure in domain B from a failure class in domain A **before** inspecting the target outcome.

A prospective result requires an outcome-blinded holdout protocol. Freeze the target artifact/version/hash, mapping, typing assumptions, predicted failure/disposition, scoring rule, and known prior exposure before unblinding. If the outcome was already inspected during mapping design, label the exercise retrospective.

See [`../experiments/R7-8-HOLDOUT-PROTOCOL.md`](../experiments/R7-8-HOLDOUT-PROTOCOL.md).

### R7-9 — cumulative compact drift

Measure phenotype drift over many compact/restore cycles and controlled authoritative resynchronization intervals. This directly tests the failure of naive `ε`-equivalence transitivity over repeated near-preserving steps.

### R7-10 — destructive restart reconstruction

Terminate active contexts, restart from durable partial/conflicting projections, and compare reconstructed phenotype against an external frozen reference.

## 16. Falsification conditions

The program loses strength if:

- formalized cross-domain mappings repeatedly fail to preserve the claimed operations;
- failure patterns do not transfer predictively under preregistered holdout tests;
- compact phenotypes do not preserve future-relevant behavior better than ordinary summaries;
- belief-state preservation does not reduce false reconciliation;
- constraint refinement degenerates into non-predictive patch accumulation;
- adversarial testing shows the apparent independent constraint dimensions are implementation naming artifacts;
- purported structural results depend on ill-typed equations or post-hoc changes to mappings.

A precise failed Rosetta mapping is preferred over a vague universal analogy.

## 17. Status labels

- **PROVEN MATHEMATICS** — standard mathematical property independent of WE implementation.
- **IMPLEMENTATION EVIDENCE** — observed behavior supported by preserved system evidence.
- **PROPOSITION CANDIDATE** — mathematically plausible statement awaiting a complete project proof.
- **CONJECTURE** — empirical/cross-domain claim requiring experiments.
- **ANALOGY ONLY** — resemblance without a demonstrated structure-preserving map.

## 18. Implementation checkpoint — Targets 1–3 / Draft 0.2

The bounded reference implementation now includes:

- `we.phenotype/v1`, a nine-field declared operational phenotype projection;
- explicit set semantics for v1 collection coordinates;
- a finite reverse-inclusion belief lattice implementation with dual orientation documented;
- an ambient-constraint / induced-poset classifier;
- direct distributivity checks;
- `M3` and `N5` forbidden-sublattice witness search;
- evidence-reference indexing for preserved AIDE cases;
- fifteen dependency-free unit tests.

The same Draft 0.2 reference behavior was independently reconstructed and executed in the authoring session:

```text
Ran 15 tests
OK
```

This is authoring-session verification of the reference logic, not GitHub Actions CI evidence.

The two narrow preserved AIDE slices remain:

```text
CAUSAL-8 task/challenge binding:
2 cases, 2 unique signatures -> two-element distributive lattice

NFM-026 signature validity / trust membership:
6 cases, 2 unique signatures -> two-element distributive lattice
```

Both slices are ambient meet/join closed, possess induced pairwise meets/joins, and are distributive. This is **not** evidence that the full AIDE state space or the full ten-dimensional admissible-signature family is a lattice.

Synthetic reference fixtures now deliberately realize:

```text
M3 diamond -> lattice, nondistributive
N5 pentagon -> lattice, nondistributive
```

so the classifier can distinguish “lattice” from “distributive lattice” before real evidence is expanded.

The next evidence target is to add further preserved cases only where the relevant per-case dimensions can be justified directly, then classify unions of slices to find the first missing closure, GLB/LUB, or distributivity witness.

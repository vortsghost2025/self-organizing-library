# WE Framework Theory Index

This directory separates mathematical objects from particular implementations.

## Canonical Python import surface

The repository directory is named `we-framework/`, but the Python package is canonically imported as:

```python
import we_framework
```

Run reference code from repository root with `PYTHONPATH=we-framework/python`. The hyphenated repository directory name is never a Python import name.

## Core objects

### Operational phenotype

`I : H -> P`

A declared vector of properties whose preservation is required for restored execution to count as the same operational process for a specified task class.

### Phenotype equivalence

Exact equivalence is:

`H ~I H' iff I(H) = I(H')`.

This exact equality relation is the relation used for the quotient `H/~I`. It is reflexive, symmetric, and transitive because equality is.

Approximate fidelity is deliberately **not** called equivalence:

`d(I(H), I(H')) <= ε`.

For a generic metric this threshold relation need not be transitive, so it does not in general define quotient classes. Small per-cycle deviations can accumulate; R7-9 measures that drift directly.

The difficult research problem is empirical: whether the frozen phenotype omits future-relevant state.

### Compact / restore

`C : H -> Z`, `R : Z -> H*`

Primary fidelity target:

`d(I(H), I(R(C(H)))) <= ε`

Candidate phenotype-level idempotence:

`C(R(C(H))) = C(H)`

within declared tolerance.

Typing requirement: the reconstructed/update expression supplied to `C` must actually lie in `dom(C)`. For a recurrence such as

`z_(t+1) = C(R(z_t) ⊕ Δ_t ⊕ P_t)`,

we require

`R(z_t) ⊕ Δ_t ⊕ P_t ∈ dom(C)`.

This makes composition failures explicit at the definition boundary instead of treating them as runtime surprises.

### Effective temporal context

The age of the oldest event whose declared invariant contribution remains recoverable from the current finite operational state at or above a frozen fidelity threshold.

This is not native token-window expansion.

### Belief state

`B_t ⊆ Ω`

The set of complete states still consistent with accepted evidence. Under reverse inclusion, `P(Ω)` is a complete knowledge lattice.

The belief lattice is the **order dual** of ordinary powerset inclusion. Its carrier is still `P(Ω)`, but:

- belief meet = union;
- belief join = intersection;
- bottom = `Ω`;
- formal top = `∅`.

A singleton is a maximal consistent belief, not the formal top.

### Constraint signature

`σ(x) = {c ∈ C : x satisfies c}`

`P(C)` supplies an ambient Boolean lattice under forward inclusion. Concrete observed signatures are classified separately under their induced order.

The classifier now asks three different questions:

1. Is the observed family closed under ambient intersection/union, making it an ambient sublattice?
2. Does the induced observed order have a GLB and LUB for every pair, making it a lattice even if ambient closure fails?
3. If it is a lattice, is it distributive? If not, can an `M3` or `N5` forbidden-sublattice witness be exhibited?

Non-distributivity is an order-theoretic result only. It does **not** by itself establish quantum mechanics, quantum computation, or quantum logic.

### Dual-lattice coupling convention

`L_C` and `L_B` use opposite order orientations:

```text
L_C: forward inclusion of satisfied constraints
L_B: reverse inclusion of possible worlds
```

The identity-on-carrier map from ordinary belief-set inclusion to the knowledge order is order reversing: it is the dualization that swaps meet and join. There is no claimed isomorphism between `L_C` and `L_B`; their base sets are different. The coupling is a product/update discipline, not an identification of the two lattices.

Therefore evidence that narrows a belief set uses intersection, which is **join in `L_B`**, while accumulating satisfied constraints uses union, which is **join in `L_C`**. Same operation name, different underlying set operation.

### Semantic binding

`Bind(q, φ, c) ∈ {BOUND, UNBOUND, UNKNOWN}`

Formal validity and semantic binding are separate dimensions.

### Rosetta translation

A map `F : D1 -> D2` accompanied by an explicit declaration of the operations, invariants, evidence relations, semantic roles, failure behaviors, and recovery behaviors it is claimed to preserve.

Typing is part of the claim. For each declared transformation `f ∈ T1`, a translation that claims composition preservation must establish that the translated transformation `F_T(f)` lies in `T2` and that all compositions appearing in

`F_T(g ∘ f) = F_T(g) ∘ F_T(f)`

are defined. A commuting equation with an undefined side is not a failed theorem; it is an ill-typed statement.

## Prior-art discipline

See [`PRIOR-ART.md`](./PRIOR-ART.md).

The WE Framework records adjacent established mathematics without claiming identity where the formal objects differ. In particular:

- operational decision preservation is adjacent to Blackwell comparison/sufficiency but the current total-variation policy criterion is not itself Blackwell's theorem;
- compact/fidelity optimization is rate-distortion / information-bottleneck adjacent, but `|C(H)|` is currently an engineering size proxy rather than Shannon rate or mutual information;
- contradictory belief updates motivate comparison with AGM belief revision, but the current possible-world intersection model is not an implementation of AGM postulates;
- non-distributive lattices are relevant to the history of quantum logic, but non-distributivity alone is not evidence of quantum structure;
- semantic binding is adjacent to software verification/validation distinctions;
- one-coordinate causal slices become Pearl-style interventions only when a structural causal model and intervention semantics are frozen.

## Core research rule

A cross-domain resemblance is **ANALOGY ONLY** until a bounded structure-preservation claim is frozen and tested.

Preferred progression:

`Observe -> Translate -> Formalize -> Attack -> Refine`

## Current formal targets

1. Freeze a concrete operational phenotype vector from historical compact/restore evidence.
2. Use exact phenotype equality for the quotient; measure approximate fidelity and cumulative drift separately.
3. Implement a bounded belief-lattice reference model with explicit dual orientation.
4. Classify bounded observed constraint-signature families as lattice, semilattice, or poset; when lattice, test distributivity and search for `M3`/`N5` witnesses.
5. Define one well-typed Rosetta commuting square over already-preserved evidence.
6. Attempt a prospectively preregistered failure-prediction transfer against an outcome-blinded holdout target rather than retrospective analogy.

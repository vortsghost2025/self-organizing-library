# WE Framework Theory Index

This directory separates mathematical objects from particular implementations.

## Core objects

### Operational phenotype

`I : H -> P`

A declared vector of properties whose preservation is required for restored execution to count as the same operational process for a specified task class.

### Phenotype equivalence

`H ~I H' iff I(H) = I(H')`, or within a frozen tolerance.

The quotient `H/~I` is standard mathematics once `I` and the equivalence relation are well defined. The difficult research problem is empirical: whether the chosen phenotype omits future-relevant state.

### Compact / restore

`C : H -> Z`, `R : Z -> H*`

Primary fidelity target:

`d(I(H), I(R(C(H)))) <= ε`

Candidate phenotype-level idempotence:

`C(R(C(H))) = C(H)`

within declared tolerance.

### Effective temporal context

The age of the oldest event whose declared invariant contribution remains recoverable from the current finite operational state at or above a frozen fidelity threshold.

This is not native token-window expansion.

### Belief state

`B_t ⊆ Ω`

The set of complete states still consistent with accepted evidence. Under reverse inclusion, `P(Ω)` is a complete knowledge lattice.

### Constraint signature

`σ(x) = {c ∈ C : x satisfies c}`

`P(C)` supplies an ambient Boolean lattice. Concrete admissible signatures must be tested for meet/join closure before calling the runtime family a lattice.

### Semantic binding

`Bind(q, φ, c) ∈ {BOUND, UNBOUND, UNKNOWN}`

Formal validity and semantic binding are separate dimensions.

### Rosetta translation

A map `F : D1 -> D2` accompanied by an explicit declaration of the operations, invariants, evidence relations, semantic roles, failure behaviors, and recovery behaviors it is claimed to preserve.

## Core research rule

A cross-domain resemblance is **ANALOGY ONLY** until a bounded structure-preservation claim is frozen and tested.

Preferred progression:

`Observe -> Translate -> Formalize -> Attack -> Refine`

## Current formal targets

1. Freeze a concrete operational phenotype vector from historical compact/restore evidence.
2. Prove the quotient construction for that frozen `I`.
3. Implement a bounded belief-lattice reference model.
4. Classify a bounded observed constraint-signature family as lattice, semilattice, or poset.
5. Define one Rosetta commuting square over already-preserved evidence.
6. Attempt a prospective failure-prediction transfer rather than retrospective analogy.

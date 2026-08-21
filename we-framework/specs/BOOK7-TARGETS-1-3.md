# Book 7 Targets 1–3 — Executable Reference Specification

**Status:** bounded reference implementation, 2026-08-21  
**Scope:** WE Framework / Rosetta Calculus  
**External test beds:** not modified by this work

## Purpose

This specification turns the first three Book 7 formal targets into executable, dependency-free Python reference models. It does **not** claim that the current AIDE implementation has already been classified as a lattice. The code freezes the mathematical objects and provides the classifier that later evidence can populate.

## Target 1 — Freeze a concrete operational phenotype

The v1 phenotype vector is:

1. `mission`
2. `authority_bindings`
3. `constraints`
4. `active_work_items`
5. `commitments`
6. `unresolved_failures`
7. `next_actions`
8. `provenance_refs`
9. `evidence_refs`

For a bounded history record `H`, the reference projection is `I(H) = phenotype(H)`.

Exact phenotype equivalence is

```text
H ~I H'  iff  I(H) = I(H').
```

The tests demonstrate that arbitrary transcript noise can change while the phenotype remains equal, while a declared invariant change breaks equivalence. The phenotype has a canonical SHA-256 fingerprint for integrity. The fingerprint is explicitly **not** treated as proof that the phenotype extraction was semantically correct.

This freezes the quotient relation; it does not yet prove that the chosen invariant vector is sufficient for every future task class. That remains an empirical target.

## Target 2 — Implement the bounded belief lattice

For finite universe `Ω`, beliefs are subsets `B ⊆ Ω` ordered by reverse inclusion:

```text
B1 <= B2  iff  B1 ⊇ B2.
```

Under this order:

```text
meet(B1, B2) = B1 ∪ B2
join(B1, B2) = B1 ∩ B2
bottom         = Ω
formal top     = ∅
```

### Mathematical correction found during implementation

An earlier Book 7 draft described a singleton `{x}` as the top when exactly one state remains possible. That is not the top of the full complete lattice `P(Ω)` under reverse inclusion.

The actual top is `∅`, representing an inconsistent/impossible belief state. Singleton beliefs are **maximal consistent states**: they are fully resolved while still permitting one possible world.

This distinction matters operationally. A verifier should not confuse:

```text
{x}   one resolved possible world
∅     no possible world consistent with the accepted evidence
```

The reference model therefore exposes `consistent(B)` and treats empty belief as contradiction rather than successful resolution.

Evidence update is:

```text
B' = B ∩ Consistent(E).
```

## Target 3 — Classify a bounded constraint-signature family

The frozen AIDE-facing v1 ambient constraint vocabulary is:

```text
signature_validity
issuer_identity
role_authorization
task_binding
challenge_binding
freshness
trust_state_membership
provenance
evidence_sufficiency
semantic_scope
```

For declared constraint set `C`, the ambient space `P(C)` is a Boolean lattice under inclusion. A concrete state maps to a signature

```text
σ(x) = {c ∈ C : x satisfies c}.
```

The classifier reports two different properties that must not be conflated:

### A. Ambient closure / sublattice test

For every observed pair `a,b`, test whether

```text
a ∩ b
```

and

```text
a ∪ b
```

are themselves observed signatures.

If both are always present, the observed family is a sublattice of the ambient Boolean lattice.

### B. Induced-order lattice test

Failure of ambient closure does **not** prove the observed family is not a lattice. The induced poset can still possess a greatest lower bound and least upper bound for every pair even when the ambient set intersection or union is absent.

The implementation therefore separately computes the unique GLB and LUB inside the observed family.

Classification is:

```text
lattice
meet-semilattice
join-semilattice
poset
```

according to existence of induced pairwise meets and joins.

### Mathematical correction found during implementation

The earlier experimental wording said, in effect, “if observed signatures are not closed under ambient meet/join, classify them as a semilattice or poset.” That criterion is too strong.

Ambient closure is sufficient for being a sublattice, but not necessary for the induced observed order itself to form a lattice.

A four-element fixture now proves the distinction: an observed family can omit the ambient intersection of two signatures while still having a different unique observed GLB, and therefore still form an induced lattice.

## Executable files

```text
we-framework/python/we_framework/reference/phenotype.py
we-framework/python/we_framework/reference/belief_lattice.py
we-framework/python/we_framework/reference/constraint_poset.py
we-framework/tests/test_book7_targets_1_3.py
```

Run from repository root:

```text
PYTHONPATH=we-framework/python python -m unittest discover -s we-framework/tests -v
```

## Verification result

Local pre-commit execution on 2026-08-21:

```text
Ran 10 tests
OK
```

The tests cover:

- phenotype invariance under non-declared transcript noise;
- phenotype divergence after a declared invariant changes;
- reflexive/symmetric/transitive fixture checks for `~I`;
- reverse-inclusion belief ordering;
- correct meet/join/bottom/top definitions;
- evidence narrowing;
- contradiction reaching empty belief rather than fabricated certainty;
- ambient Boolean sublattice closure;
- induced lattice without ambient meet closure;
- a true poset fixture lacking pairwise GLB/LUB.

## What is proven versus pending

**Standard mathematics instantiated by code:**
- equality under a fixed phenotype projection induces an equivalence relation;
- `P(Ω)` under reverse inclusion is a complete lattice;
- `P(C)` under inclusion is a Boolean lattice;
- induced finite-poset GLB/LUB existence can be checked exhaustively.

**Frozen engineering definition:**
- the nine-field `we.phenotype/v1` vector;
- the ten-field AIDE-facing ambient constraint vocabulary.

**Not yet proven:**
- that the phenotype vector is sufficient for all long-running WE tasks;
- that actual AIDE admissible-state signatures form a lattice or semilattice;
- that any cross-domain Rosetta translation is valid.

The next evidence step is to extract a bounded set of actual AIDE verification cases into signatures without changing frozen AIDE evidence, then run the classifier over those references.

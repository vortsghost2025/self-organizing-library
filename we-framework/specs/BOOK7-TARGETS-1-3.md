# Book 7 Targets 1–3 — Executable Reference Specification

**Status:** Draft 0.2 bounded reference implementation, 2026-08-21  
**Scope:** WE Framework / Rosetta Calculus  
**External test beds:** not modified by this work

## Purpose

This specification turns the first three Book 7 formal targets into executable, dependency-free Python reference models. It does **not** claim that the current AIDE implementation as a whole is a lattice. The code freezes the mathematical objects and provides classifiers that preserved evidence can populate.

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

Only exact phenotype equality defines the quotient relation. Approximate fidelity

```text
d(I(H), I(H')) <= ε
```

is a metric threshold layered on top; it is not called equivalence because it need not be transitive. R7-9 measures cumulative drift across repeated near-equal restores.

The tests demonstrate that arbitrary transcript noise can change while the phenotype remains equal, while a declared invariant change breaks equivalence. The phenotype has a canonical SHA-256 fingerprint for integrity. The fingerprint is explicitly **not** treated as proof that the phenotype extraction was semantically correct.

### Frozen collection semantics

Every collection field in `we.phenotype/v1` is **set-semantic**:

```text
order does not matter
duplicate copies of the same normalized label do not matter
```

If multiplicity later becomes operationally relevant, that requires a schema revision rather than a silent reinterpretation of v1.

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

This is the order-dual of the ordinary powerset lattice under forward inclusion. The carrier is identical, but meet and join swap roles.

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

Because the knowledge order is reverse inclusion, this intersection is **join in `L_B`**: accepted evidence moves the belief upward toward more information or, if inconsistent, to formal top.

## Dual-coupling convention

Book 7 couples two powerset constructions with opposite order orientations:

```text
L_C = constraint satisfaction under forward inclusion
L_B = possible worlds under reverse inclusion
```

There is no claimed isomorphism between `L_C` and `L_B`; their underlying base sets differ. The identity-on-carrier map from ordinary belief-set inclusion to the knowledge order is order reversing and explains why belief meet/join are swapped.

Operational consequence:

```text
constraint accumulation: union = join in L_C
belief narrowing:        intersection = join in L_B
```

The common word `join` must not be assumed to mean the same raw set operation in both modules.

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

The classifier reports three different properties that must not be conflated.

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

### C. R7-6b distributivity test

If the induced family is a lattice, test both distributive identities directly:

```text
x ∧ (y ∨ z) = (x ∧ y) ∨ (x ∧ z)
x ∨ (y ∧ z) = (x ∨ y) ∧ (x ∨ z)
```

If either fails, preserve the explicit `(x,y,z)` counterexample and search for a five-element sublattice isomorphic to:

```text
M3 — diamond
N5 — pentagon
```

The reference implementation includes fixtures for both.

A non-distributive observed lattice is a genuine order-theoretic result. It is **not**, by itself, evidence that WE/AIDE is quantum mechanical or implements quantum logic. Birkhoff–von Neumann is prior-art context for why distributivity is an interesting boundary, not a license to promote the result beyond what was measured.

### Mathematical correction found during implementation

The earlier experimental wording said, in effect, “if observed signatures are not closed under ambient meet/join, classify them as a semilattice or poset.” That criterion is too strong.

Ambient closure is sufficient for being a sublattice, but not necessary for the induced observed order itself to form a lattice.

A four-element fixture proves the distinction: an observed family can omit the ambient intersection of two signatures while still having a different unique observed GLB, and therefore still form an induced lattice.

## Typing rules promoted to definition-level constraints

### Rosetta composition

A claimed composition law

```text
F(g ∘ f) = F(g) ∘ F(f)
```

is only a mathematical statement when the translated transformations land in the target transformation class and both sides are defined. Ill-typed composition is rejected before semantic evaluation.

### Compact recurrence

For

```text
z_(t+1) = C(R(z_t) ⊕ Δ_t ⊕ P_t)
```

require explicitly:

```text
R(z_t) ⊕ Δ_t ⊕ P_t ∈ dom(C).
```

This is the mathematical analogue of catching missing/undefined interfaces before execution.

## Executable files

```text
we-framework/python/we_framework/reference/phenotype.py
we-framework/python/we_framework/reference/belief_lattice.py
we-framework/python/we_framework/reference/constraint_poset.py
we-framework/python/we_framework/tools/classify_aide_signatures.py
we-framework/tests/test_book7_targets_1_3.py
we-framework/tests/test_r7_6_real_evidence.py
```

Canonical Python package import:

```python
import we_framework
```

The repository directory is `we-framework/`; the hyphenated directory name is never a Python import name.

Run from repository root:

```text
PYTHONPATH=we-framework/python python -m unittest discover -s we-framework/tests -v
```

## Verification result

The original Draft 0.2 reference logic was independently reconstructed and executed in the authoring session after the initial hardening:

```text
Ran 15 tests
OK
```

This is an authoring-session verification of the reference behavior, not a GitHub Actions CI result. Three additional real-evidence tests are now committed and remain **pending explicit local or CI execution** before the project may claim an 18-test PASS.

## What is proven versus pending

**Standard mathematics instantiated by code:**
- equality under a fixed phenotype projection induces an equivalence relation;
- a generic `ε`-threshold metric relation is not assumed transitive;
- `P(Ω)` under reverse inclusion is a complete lattice and the order-dual of forward inclusion;
- `P(C)` under inclusion is a Boolean lattice;
- induced finite-poset GLB/LUB existence can be checked exhaustively;
- distributivity can be tested by identities, and finite nondistributive lattices admit `M3`/`N5` forbidden-sublattice witnesses.

**Frozen engineering definition:**
- the nine-field `we.phenotype/v1` vector;
- set semantics for its collection fields;
- the ten-field AIDE-facing ambient constraint vocabulary;
- the `L_C` forward / `L_B` reverse order convention.

**Not yet proven:**
- that the phenotype vector is sufficient for all long-running WE tasks;
- that actual AIDE admissible-state signatures globally form a lattice or semilattice;
- that a larger observed WE/AIDE lattice is distributive or non-distributive;
- that any cross-domain Rosetta translation is valid.

## Evidence projection rule — FALSE is not UNKNOWN

A frozen external case is projected into a Boolean satisfaction signature only when every declared coordinate of that slice is directly supported for every included case.

```text
FALSE   = evidence supports failure of the declared constraint
UNKNOWN = the experiment did not establish that coordinate
```

`UNKNOWN` must never be encoded as simple absence from a Boolean signature merely to align dimensions. Doing so would collapse epistemic uncertainty into constraint failure and silently mix the `L_B` knowledge problem with the `L_C` satisfaction problem.

## Evidence-backed classifications

The original read-only extraction produced narrow distributive two-element lattices for CAUSAL-8 task/challenge binding and NFM-026 signature-validity/trust-membership.

The CAUSAL-9 / CAUSAL-9B read-only expansion adds seven local two-case axes that also classify as distributive two-element lattices in their declared subspaces:

- CAUSAL-9 issuer identity;
- CAUSAL-9 algorithm binding;
- CAUSAL-9 role authorization;
- CAUSAL-9 task/challenge binding;
- CAUSAL-9B current-authority binding;
- CAUSAL-9B role authorization;
- CAUSAL-9B rotation-state validity.

These local results do not establish a global lattice.

## First multi-axis real-data break

Across all five frozen CAUSAL-9 cases, the common directly evidenced coordinate domain is:

```text
signature_validity
issuer_identity
algorithm_binding
task_binding
challenge_binding
```

The five cases collapse to four unique observed signatures. Their induced order classifies as:

```text
kind                  = join-semilattice
ambient meet closed   = false
ambient join closed   = true
all induced meets     = false
all induced joins     = true
distributivity        = not applicable
```

Representative missing meet signatures are:

```text
{signature_validity, algorithm_binding}
{signature_validity, task_binding, challenge_binding}
{signature_validity, issuer_identity}
```

No alternative observed GLB exists for the corresponding pairs.

This is an **observed-family** result. It does not prove that the full AIDE admissible state space lacks meets. The missing signatures correspond to joint-failure combinations not exercised by the frozen one-shot CAUSAL-9 matrix; the current break is therefore also an experimental-coverage / observability finding.

No real `M3` or `N5` witness has been observed. The combined CAUSAL-9 family fails the lattice prerequisite before distributivity is reached.

## Cross-slice gluing gate

The intended union

```text
CAUSAL-8 ∪ CAUSAL-9 ∪ CAUSAL-9B ∪ NFM-026
```

cannot yet be classified as one satisfaction poset without inventing values. The whole-experiment common coordinate domains are:

```text
CAUSAL-8  = {task_binding, challenge_binding}
CAUSAL-9  = {signature_validity, issuer_identity, algorithm_binding,
             task_binding, challenge_binding}
CAUSAL-9B = {signature_validity}
NFM-026   = {signature_validity, trust_state_membership}
```

Their total intersection is empty. The global satisfaction-poset classification is therefore:

```text
UNDERDETERMINED
```

rather than `lattice`, `semilattice`, or `poset`.

A heterogeneous union may be promoted to one global constraint-order claim only if at least one of these gates is satisfied:

1. a non-empty jointly observed coordinate domain across all included cases;
2. same-state observations that bridge the local coordinate charts;
3. a separately frozen and justified gluing rule, with synthetic combinations explicitly labeled inferred rather than observed.

A three-valued `TRUE/FALSE/UNKNOWN` product can be studied separately as an epistemic structure, but it is not a drop-in replacement for the Boolean satisfaction poset because that would erase the `L_B` / `L_C` typing boundary.

## Prior-art map

See [`../theory/PRIOR-ART.md`](../theory/PRIOR-ART.md). The document deliberately uses “adjacent to” rather than importing stronger theorem names when WE's current objects do not satisfy the classical hypotheses.

## Evidence checkpoint

See [`../evidence/R7-6-REAL-DATA-CHECKPOINT-2026-08-21.md`](../evidence/R7-6-REAL-DATA-CHECKPOINT-2026-08-21.md) for the immutable-reference identities, the observed signatures, missing-meet witnesses, and the explicit scope boundary.

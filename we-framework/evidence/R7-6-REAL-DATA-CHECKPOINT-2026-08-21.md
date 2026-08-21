# R7-6 Real-Data Checkpoint — CAUSAL-9 / CAUSAL-9B

**Date:** 2026-08-21  
**Status:** IMPLEMENTATION_EVIDENCE / bounded observed-family classification  
**Rule:** frozen AIDE evidence was read only. No experiment was rerun, rewritten, moved, or normalized to fit the mathematics.

## Evidence readback

The local AIDE lab was clean at read time on:

```text
HEAD   522afddbdec0156a7f8032b450cf08f876944db3
branch lab/nfm-026-trust-store-divergence
```

The read-only extraction recovered the frozen CAUSAL-9 and CAUSAL-9B notes plus the write-once evidence roots.

### CAUSAL-9

```text
branch      lab/causal-9-authority-issuer-binding
producer    09fe611aef3c49999a37730811a8822bde947e41
evidence    S:\AIDE-External-Evidence\2026-08-21\authority-issuer-binding-v1
matrix      5a551561ea025e34745195af832cd7911ac248cff21f32a17e08104ff58abcc5
report      589b2d4154831997f85abd2fcea648093389c15cec34987d5e3e5ad7c5cd5bcc
policy      f237c902f2999220316561d9db19fcb8ba1bd3080a6d729f24b94951f43cf7eb
note        74f6211720af1f5c10d3b2cfe51999c1b3a175ddff443777db283974fc263ca7
```

Observed hardened dispositions:

```text
A attacker bundled key                 REJECTED issuer-mismatch
B trusted authority / current Task B   VERIFIED
C trusted authority / stale Task A     REJECTED task-mismatch
D known witness key / wrong role       REJECTED role-mismatch
E trusted key / conflicting algorithm  REJECTED algorithm-mismatch
```

All cases preserve a cryptographically valid signature under the intended naive cryptographic check; the hardened verifier separates issuer identity, role, task/challenge, and algorithm binding.

### CAUSAL-9B

```text
contract    1216b75892b99a362006b6aa32222c2398f3d9e3
producer    81a3112f7523b904bfd713d7d452bc9e0eb33d97
evidence    S:\AIDE-External-Evidence\2026-08-21\key-rotation-binding-v1
matrix      250c3b27fb6f1f6fe336f993af1ba53d6cb1dd369f3bb427600e01de6eb8a428
report      b846d45791c65a37eae78a36cb0bb27b0c61435854488eeb6b591e3fcd381958
note        7719008b265d71133459b1a8af927ced5160ba2bb448282ccd25983158f5a645
```

Observed hardened dispositions:

```text
H trusted predecessor grants successor          VERIFIED
S successor self-grants                         REJECTED issuer-not-current-authority
R predecessor grants wrong role                 REJECTED role-mismatch
V revoked successor used inside original window REJECTED revoked-successor
```

All required signatures are cryptographically valid. CAUSAL-9B therefore separates signature validity from current-authority binding, typed role authorization, and rotation lifecycle state.

## UNKNOWN rule

A missing coordinate is not encoded as `false`.

A Boolean satisfaction signature is emitted only for a slice whose declared coordinates are directly evidenced for **every case in that slice**. This preserves the distinction:

```text
FALSE   = evidence supports constraint failure
UNKNOWN = the experiment did not establish that coordinate for that case
```

Collapsing `UNKNOWN -> FALSE` would mix the belief/knowledge order with the constraint-satisfaction order and would manufacture lattice points that were never observed.

## Local axis results

The following bounded two-case slices are distributive two-element lattices in their declared subspaces:

- CAUSAL-9 issuer identity: A vs B;
- CAUSAL-9 algorithm binding: B vs E;
- CAUSAL-9 role authorization: B vs D;
- CAUSAL-9 task/challenge binding: B vs C;
- CAUSAL-9B current-authority binding: H vs S;
- CAUSAL-9B role authorization: H vs R;
- CAUSAL-9B rotation-state validity: H vs V.

These results establish only the local bounded axes.

## First combined real-data break

For CAUSAL-9, five coordinates are directly supported across all five cases:

```text
signature_validity
issuer_identity
algorithm_binding
task_binding
challenge_binding
```

The resulting observed signatures are:

```text
A = {signature_validity, algorithm_binding, task_binding, challenge_binding}
B = {signature_validity, issuer_identity, algorithm_binding, task_binding, challenge_binding}
C = {signature_validity, issuer_identity, algorithm_binding}
D = {signature_validity, issuer_identity, algorithm_binding, task_binding, challenge_binding}
E = {signature_validity, issuer_identity, task_binding, challenge_binding}
```

`B` and `D` coincide in this projection because the role coordinate is deliberately outside the common five-coordinate domain.

The four unique observed signatures classify as:

```text
kind                  = join-semilattice
ambient meet closed   = false
ambient join closed   = true
all induced meets     = false
all induced joins     = true
distributivity        = not applicable (not a lattice)
```

Three missing ambient/induced meet witnesses are immediately visible:

```text
A ∩ C = {signature_validity, algorithm_binding}
A ∩ E = {signature_validity, task_binding, challenge_binding}
C ∩ E = {signature_validity, issuer_identity}
```

None of those signatures was observed in the frozen CAUSAL-9 matrix, and there is no alternative observed greatest lower bound for the corresponding pairs.

### Interpretation boundary

This does **not** prove that the full AIDE admissible state space is a join-semilattice or lacks meets.

It proves something narrower and useful:

> the frozen CAUSAL-9 observed family is not meet-complete under its five-coordinate common projection.

The missing meets correspond naturally to **untested joint-failure combinations**. For example, the experiment did not include a case simultaneously combining issuer failure with stale task binding, or algorithm failure with another independent failure. The mathematical break may therefore be an **observability / experimental-coverage gap**, not a structural impossibility.

That is a Book-6-style result: attempting the stronger Book-7 classification exposed which additional combinations would need evidence before the structure could be promoted from observed join-semilattice to a larger lattice claim.

## Cross-experiment gluing gate

The intended union was:

```text
CAUSAL-8 ∪ CAUSAL-9 ∪ CAUSAL-9B ∪ NFM-026
```

The common domains currently supported across whole experiment families are:

```text
CAUSAL-8  = {task_binding, challenge_binding}
CAUSAL-9  = {signature_validity, issuer_identity, algorithm_binding,
             task_binding, challenge_binding}
CAUSAL-9B = {signature_validity}
NFM-026   = {signature_validity, trust_state_membership}
```

Their total intersection is empty.

Therefore the four-experiment union is currently:

```text
GLOBAL SATISFACTION-POSET CLASSIFICATION = UNDERDETERMINED
```

not `lattice`, `semilattice`, or `poset`.

A three-valued `TRUE/FALSE/UNKNOWN` product could be constructed, but that would primarily order **knowledge about constraints**, not constraint satisfaction itself. Book 7 does not use that shortcut because it would blur the explicit `L_B` / `L_C` typing boundary.

## New gate

Before combining heterogeneous experiment slices into one constraint-poset claim, require at least one of:

1. a non-empty jointly observed coordinate domain across all included cases;
2. same-state observations that bridge the local coordinate charts;
3. a frozen, separately justified gluing rule whose synthetic combinations are clearly labeled as inferred rather than observed.

Until then, local classifications remain valid and the global structure remains underdetermined.

## Exact branch verification

After the real-evidence assertions were committed, the exact GitHub branch was cloned into a disposable temporary directory and executed independently of the user's existing working tree.

```text
repository  vortsghost2025/self-organizing-library
branch      book7/we-framework-rosetta-calculus
HEAD        29ef942d1923267bcd21db7f8ed6ce0115b871f1
command     python -m unittest discover -s we-framework/tests -v
result      Ran 18 tests in 0.007s — OK
```

All 18 tests passed, including the three real-evidence assertions:

```text
test_causal9_combined_common_projection_is_join_semilattice       PASS
test_causal9_local_axes_are_two_element_distributive_lattices     PASS
test_global_union_gate_preserves_unknown_instead_of_imputing_false PASS
```

The temporary clone was removed after execution. This is exact-branch local verification supplied from the user's machine; it is not GitHub Actions CI evidence.

Subsequent documentation-only commits do not alter the executable files validated at `29ef942d1923267bcd21db7f8ed6ce0115b871f1`.

## Current result

The first real-data expansion therefore produced **both** outcomes we wanted:

1. local axes remain clean distributive lattices;
2. the first multi-axis CAUSAL-9 observed family breaks from lattice to **join-semilattice** because meet witnesses are absent.

No real `M3` or `N5` witness has been observed. Distributivity is not reached for the combined CAUSAL-9 family because the lattice prerequisite already fails.

The next step is prospective rather than retrospective: freeze predictions for the missing meet states before constructing or executing any new AIDE cases.

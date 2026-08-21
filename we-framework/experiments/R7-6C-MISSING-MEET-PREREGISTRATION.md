# R7-6C — Prospective Missing-Meet Completion

**Status:** PREREGISTERED / outcome not observed  
**Date:** 2026-08-21  
**Purpose:** turn the first real-data join-semilattice break into a prospective structural prediction before constructing or running any new AIDE case.

## Frozen source state

This preregistration is based only on the already-preserved CAUSAL-9 evidence and the WE Framework classification frozen before any prospective completion cases are executed.

```text
CAUSAL-9 producer: 09fe611aef3c49999a37730811a8822bde947e41
CAUSAL-9 evidence root: S:\AIDE-External-Evidence\2026-08-21\authority-issuer-binding-v1
CAUSAL-9 matrix SHA-256: 5a551561ea025e34745195af832cd7911ac248cff21f32a17e08104ff58abcc5
WE exact-branch verification head: 29ef942d1923267bcd21db7f8ed6ce0115b871f1
WE exact-branch verification: 18/18 PASS
```

No prospective completion outcome has been inspected because no completion experiment has been run.

## Frozen projection

Use the five-coordinate CAUSAL-9 common projection:

```text
S = signature_validity
I = issuer_identity
A = algorithm_binding
T = task_binding
C = challenge_binding
```

In the preserved CAUSAL-9 matrix, `task_binding` and `challenge_binding` move together for the stale-task contrast. For this preregistration only, define the observed composite axis

```text
Q = T ∧ C
```

without claiming that task and challenge are globally identical constraints.

`S` is true in every frozen CAUSAL-9 case. Relative to the three varying axes `{I,A,Q}`, the four unique observed signatures are therefore:

```text
{I,A,Q}   positive control
{A,Q}     issuer failure
{I,A}     stale task/challenge failure
{I,Q}     algorithm-binding failure
```

with the invariant `S` prefixed to each signature in the actual five-coordinate representation.

The observed family is the top element plus the three coatoms of a candidate Boolean `B3`, but it currently lacks the three atoms and bottom. This is exactly why the observed family classifies as a join-semilattice rather than a lattice.

## Prospective predictions

Construct four additional cases while holding all non-targeted coordinates fixed as closely as the frozen CAUSAL-9 contract permits.

### F — issuer failure + stale task/challenge

Frozen target satisfaction signature:

```text
{S,A}
```

Equivalent variable form:

```text
I = false
A = true
Q = false
```

Predicted hardened disposition: `REJECTED`.

### G — issuer failure + algorithm-binding failure

Frozen target satisfaction signature:

```text
{S,T,C}
```

Equivalent variable form:

```text
I = false
A = false
Q = true
```

Predicted hardened disposition: `REJECTED`.

### H — algorithm-binding failure + stale task/challenge

Frozen target satisfaction signature:

```text
{S,I}
```

Equivalent variable form:

```text
I = true
A = false
Q = false
```

Predicted hardened disposition: `REJECTED`.

### J — issuer failure + algorithm-binding failure + stale task/challenge

Frozen target satisfaction signature:

```text
{S}
```

Equivalent variable form:

```text
I = false
A = false
Q = false
```

Predicted hardened disposition: `REJECTED`.

`J` is named to avoid collision with the already-used CAUSAL-9B `H` label in cross-document discussion.

## Primary structural prediction

If F, G, H, and J realize exactly the frozen satisfaction signatures above, then the augmented CAUSAL-9 common-projection family will be isomorphic to the eight-element Boolean lattice

```text
B3 = P({I,A,Q})
```

with `signature_validity` as an invariant coordinate shared by every element.

Expected classification after adding those four observed signatures:

```text
unique signatures       = 8
kind                    = lattice
ambient meet closed     = true
ambient join closed     = true
all induced meets       = true
all induced joins       = true
distributive            = true
M3/N5 witness           = none
```

This is a prospective prediction, not an observed result.

## Rejection-reason boundary

The preregistration predicts the satisfaction signature and overall hardened disposition, but **does not freeze the exact rejection reason** when multiple constraints fail.

Reason selection may depend on verifier check order or diagnostic precedence. A different first-reported reason is not by itself a falsification so long as the independently measured satisfaction signature and final disposition match the frozen prediction.

If a later experiment wants to test error-precedence semantics, that must be preregistered separately.

## Falsification conditions

The Boolean-completion prediction is falsified or weakened if any of the following occurs under a frozen implementation/contract:

1. one of F/G/H/J cannot be constructed without changing an allegedly independent non-target coordinate;
2. a constructed case yields a different directly evidenced satisfaction signature;
3. the hardened verifier returns `VERIFIED` for a case with one or more frozen required bindings false;
4. all four predicted signatures are observed but the augmented family still lacks a required meet or join;
5. the augmented eight-element family is a lattice but fails distributivity;
6. hidden coupling forces `task_binding` and `challenge_binding` to separate in a way that invalidates the frozen composite-axis projection.

A failure is a successful Book-7 result if it identifies which independence assumption or hidden coordinate was wrong.

## Interpretation boundary

Even a successful `B3` completion would establish only a bounded structural fact about the frozen CAUSAL-9 common projection. It would not prove that:

- the full AIDE verification state space is Boolean;
- the ten-coordinate WE ambient family is globally realized;
- other AIDE/Obscura experiments glue into the same lattice without bridge observations;
- nondistributive structures cannot appear elsewhere;
- the framework has discovered quantum logic.

## Execution gate

Do not run the prospective cases until:

1. this preregistration is durably committed;
2. a bounded experimental implementation is prepared without rewriting frozen CAUSAL-9 evidence;
3. the new evidence root is write-once and separately named;
4. the implementation identifies which coordinates are directly measured rather than inferred;
5. the run is one-shot or otherwise records all attempts transparently.

The analysis must compare the observed result against this file as frozen before execution.

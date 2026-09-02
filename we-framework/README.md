# WE Framework

This subtree is the canonical home for the **WE Framework / Rosetta Calculus** research program.

It is intentionally separated from external systems used as test subjects. AIDE External-Run Veritas / Obscura is an important adversarial test bed, but it is **not** the parent framework and its repositories are not the canonical home of this theory.

## Research lineage

```text
Rosetta Stone Papers A-E
        |
        v
Paper F / Book 6
failure -> detection -> correction -> constraint refinement
        |
        v
Named Failure Modes + WE4FREE / Archivist / Library / Swarm / Control Plane
        |
        v
Book 7: WE Framework — The Rosetta Calculus
        |
        +--> compact / restore mathematics
        +--> effective temporal context
        +--> belief-state lattice
        +--> ambient / induced constraint lattices
        +--> distributivity and M3/N5 witnesses
        +--> semantic binding
        +--> causal-slice falsification
        +--> cross-domain Rosetta translations
        +--> prospective holdout prediction
        |
        v
External test beds
AIDE / Obscura, Cordis, distributed systems, proof verification,
long-context AI, and other bounded domains
```

## Scientific boundary

The WE Framework does **not** claim that all systems are the same, that every runtime state space is a lattice, that nondistributivity implies quantum mechanics, or that one universal equation explains every domain.

The narrower program is to test whether explicitly declared structures survive translation between domains. A proposed Rosetta mapping is promoted only when operations, invariants, evidence relations, semantic binding, failure behavior, or recovery behavior survive formal or adversarial tests.

A precise failed mapping is a successful result.

## Repository policy

- Historical Book 6 and Named Failure Mode evidence is preserved in place.
- Frozen AIDE / Obscura evidence stays in its original repositories and evidence roots.
- This subtree links to external evidence by repository, commit, branch, digest, or evidence path rather than copying or rewriting it.
- New WE Framework theory and cross-domain experimental specifications belong here.
- External-project-specific adapters belong under `bridges/`.
- A bridge never silently transfers authority from the external system into the WE Framework or vice versa.

## Current structure

- `book-7/` — Book 7 versioned manuscript.
- `theory/` — mathematical definitions, prior-art map, and conjectures.
- `harness/` — causal-slice and falsification methodology.
- `experiments/` — WE Framework experiment registry and preregistration gates.
- `bridges/` — external-system adapters and attribution boundaries.
- `evidence/` — evidence-index policy and bounded evidence-reference extractions; immutable external evidence is not copied by default.
- `python/` — dependency-free executable reference mathematics.
- `specs/` — bounded executable specifications and proof-status boundaries.
- `tests/` — verification tests for executable targets.

## Current Book 7 checkpoint — Draft 0.2

Targets 1–3 are executable. The branch currently:

- freezes a nine-field exact operational phenotype quotient with separate approximate-fidelity metrics;
- declares v1 collection fields set-semantic;
- implements the finite reverse-inclusion belief lattice and its order-dual convention;
- distinguishes ambient Boolean sublattice closure from lattice structure in the induced observed constraint order;
- tests distributivity when an induced lattice exists;
- produces explicit `M3` / `N5` witnesses for finite nondistributive fixtures;
- freezes a prospective holdout protocol for R7-8;
- records established mathematical prior art without importing stronger theorem names than the WE objects justify.

Exact executable checkpoint:

```text
head   29ef942d1923267bcd21db7f8ed6ce0115b871f1
tests  18/18 PASS
mode   disposable exact-branch clone on the user's machine
```

That is local exact-branch verification, not GitHub Actions CI. Documentation-only commits after that checkpoint do not alter the executable files that were tested.

## First real-data expansion

The evidence index now covers preserved CAUSAL-8, CAUSAL-9, CAUSAL-9B, and NFM-026 slices without rerunning the external experiments.

Narrow adversarial axes remain distributive two-element lattices in their declared subspaces. However, the five-coordinate common projection across all five CAUSAL-9 cases produces four unique observed signatures that classify as a **join-semilattice**:

```text
ambient meet closed = false
ambient join closed = true
all induced meets   = false
all induced joins   = true
```

This is the first evidence-backed point where a multi-axis observed family stops being a lattice. The missing meets correspond to joint-failure combinations absent from the frozen experiment, so the result is an observed-coverage statement rather than a theorem that the full AIDE state space lacks meets.

The attempted four-experiment union is also correctly blocked: CAUSAL-8, CAUSAL-9, CAUSAL-9B, and NFM-026 have no non-empty coordinate domain observed across every case family. Missing coordinates remain `UNKNOWN`; they are not silently converted to failed constraints. The global satisfaction-poset classification is therefore **UNDERDETERMINED** until bridging observations or a separately justified gluing rule exist.

See `evidence/R7-6-REAL-DATA-CHECKPOINT-2026-08-21.md`.

## Prospective R7-6C prediction

Before constructing any new CAUSAL-9 completion cases, Book 7 freezes the missing-meet prediction in:

`experiments/R7-6C-MISSING-MEET-PREREGISTRATION.md`

Relative to the three varying axes `issuer_identity`, `algorithm_binding`, and the observed composite `task_binding ∧ challenge_binding`, the current four unique signatures are the top plus the three coatoms of a candidate Boolean `B3`.

The preregistered prediction is that four joint-failure cases will realize the three missing atoms plus the bottom. If that occurs, the augmented eight-signature family will be an ambient-closed, distributive Boolean lattice isomorphic to `B3`, with `signature_validity` invariant across all eight states.

This is **not yet observed**. Failure to realize those signatures is equally valuable because it identifies hidden coupling or a missing coordinate.

## Status

**Draft research program.** Standard mathematical facts are separated from proposition candidates, conjectures, implementation evidence, and analogy-only comparisons. No universal-theory claim is implied by this repository structure.

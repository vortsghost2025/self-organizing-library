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

The Draft 0.2 reference suite contains 15 tests. The same reference behavior was independently reconstructed and executed during the authoring pass with all 15 passing; this is authoring-session verification, not GitHub Actions CI evidence.

The first evidence-reference classifier covers two narrow preserved AIDE slices. CAUSAL-8 task/challenge binding and NFM-026 signature-validity/trust-membership each form a **distributive two-element lattice** within their declared subspaces. This is not a claim that the full AIDE state space is a lattice.

## Status

**Draft research program.** Standard mathematical facts are separated from proposition candidates, conjectures, implementation evidence, and analogy-only comparisons. No universal-theory claim is implied by this repository structure.

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
        +--> ambient constraint lattice
        +--> semantic binding
        +--> causal-slice falsification
        +--> cross-domain Rosetta translations
        |
        v
External test beds
AIDE / Obscura, Cordis, distributed systems, proof verification,
long-context AI, and other bounded domains
```

## Scientific boundary

The WE Framework does **not** claim that all systems are the same, that every runtime state space is a lattice, or that one universal equation explains every domain.

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

- `book-7/` — Book 7 manuscript seed and formal targets.
- `theory/` — mathematical definitions and conjectures.
- `harness/` — causal-slice and falsification methodology.
- `experiments/` — WE Framework experiment registry.
- `bridges/` — external-system adapters and attribution boundaries.
- `evidence/` — evidence-index policy; no copied immutable evidence by default.

## Status

**Draft research program.** Standard mathematical facts are separated from proposition candidates, conjectures, implementation evidence, and analogy-only comparisons. No universal-theory claim is implied by this repository structure.

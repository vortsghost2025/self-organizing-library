# WE Framework Evidence Index Policy

This directory records evidence identities and bounded evidence-reference extractions for WE Framework claims. It is not a replacement home for immutable evidence produced by external test beds.

## Preservation rule

Frozen evidence remains where it was produced. WE Framework records should reference it by enough immutable identity to recover the exact basis of a claim, for example:

- repository and commit SHA;
- branch used for historical lineage;
- external evidence root;
- contract or fixture-freeze commit;
- artifact SHA-256 when available;
- timestamp semantics;
- what the evidence actually demonstrates;
- explicit non-claims.

Do not copy immutable external evidence merely to make the WE tree self-contained. Link it by immutable identity unless preservation requires a separately declared archival copy.

## Bounded derived indexes

A derived index may encode a narrow mathematical projection of preserved evidence when:

1. every encoded dimension is directly supported by the preserved checkpoint;
2. no missing dimension is silently guessed;
3. the source identities are recorded;
4. the derived object is clearly distinguished from the original evidence;
5. the original experiment is not rerun or rewritten merely to populate the index.

Current derived index:

`aide-observed-signatures-v1.json`

It now contains bounded slices from:

- CAUSAL-8 task/challenge binding;
- CAUSAL-9 issuer identity, algorithm binding, role authorization, task/challenge binding, plus a five-coordinate common projection;
- CAUSAL-9B current-authority binding, role authorization, and rotation-state validity;
- NFM-026 signature validity / trust-state membership.

Every slice is typed by its own declared constraint domain. Coordinates that are not directly evidenced for every case in a slice remain **UNKNOWN** and are omitted; they are never encoded as failed constraints merely to make dimensions line up.

## First real-data multi-axis result

The local CAUSAL-9 and CAUSAL-9B adversarial axes each classify as distributive two-element lattices in their narrow declared subspaces.

The five-coordinate CAUSAL-9 common projection is different: its four unique observed signatures form a **join-semilattice**, not a lattice. Ambient joins are present, while several required meets are absent from the observed family and no alternative observed GLB exists.

See:

`R7-6-REAL-DATA-CHECKPOINT-2026-08-21.md`

This is an **observed-family** result. It does not establish that the full AIDE admissible state space lacks meets. The missing meet signatures correspond to joint-failure combinations that the frozen matrix did not exercise.

The corresponding three real-evidence test assertions are committed in `../tests/test_r7_6_real_evidence.py` but have not yet been executed in the repository or CI. Do not label them PASS until an explicit run is preserved.

## Cross-slice UNKNOWN / gluing gate

A direct union of CAUSAL-8, CAUSAL-9, CAUSAL-9B, and NFM-026 cannot yet be classified as one satisfaction poset without inventing values. Their whole-experiment common coordinate domains have an empty total intersection.

Therefore the current global result is:

`UNDERDETERMINED`

not `lattice`, `semilattice`, or `poset`.

Book 7 deliberately does not convert UNKNOWN into FALSE. A three-valued knowledge structure would belong to the epistemic side of the model and must not be silently substituted for the constraint-satisfaction order.

## Book 7 status labels

- `PROVEN_MATHEMATICS`
- `IMPLEMENTATION_EVIDENCE`
- `PROPOSITION_CANDIDATE`
- `CONJECTURE`
- `ANALOGY_ONLY`

A claim should not silently move upward in this hierarchy just because a test harness exists.

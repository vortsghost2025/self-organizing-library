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

It contains two bounded slices:

- CAUSAL-8 task/challenge binding;
- NFM-026 signature validity / trust-state membership.

Each currently classifies as a two-element lattice **inside that declared subspace only**. This does not classify the full AIDE system or its complete admissible-state family.

## Book 7 status labels

- `PROVEN_MATHEMATICS`
- `IMPLEMENTATION_EVIDENCE`
- `PROPOSITION_CANDIDATE`
- `CONJECTURE`
- `ANALOGY_ONLY`

A claim should not silently move upward in this hierarchy just because a test harness exists.

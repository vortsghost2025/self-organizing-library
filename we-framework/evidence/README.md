# WE Framework Evidence Index Policy

This directory indexes evidence. It is not a dumping ground for copied external artifacts.

## Evidence precedence

Preferred order:

1. preserved run matrix / report / manifest;
2. durable contemporaneous handoff;
3. exact Git commit or immutable file read-back;
4. harness design;
5. narrative inference.

A lower-ranked source cannot silently upgrade a claim contradicted by stronger evidence.

## External evidence

When an experiment uses another repository or evidence root, record:

- repository / system;
- branch where historically relevant;
- immutable commit SHA where available;
- evidence root or artifact path;
- artifact digest where available;
- timestamp semantics;
- what the evidence actually demonstrates;
- explicit non-claims.

Do not copy immutable external evidence merely to make the WE tree self-contained. Link it by immutable identity unless preservation requires a separately declared archival copy.

## Book 7 status labels

- `PROVEN_MATHEMATICS`
- `IMPLEMENTATION_EVIDENCE`
- `PROPOSITION_CANDIDATE`
- `CONJECTURE`
- `ANALOGY_ONLY`
- `UNRESOLVED`

Every strong Book 7 statement should eventually be traceable to one of these statuses and an evidence or proof path.

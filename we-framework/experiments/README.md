# WE Framework Experiment Registry

This directory owns new WE Framework experiment specifications.

External systems are test subjects, not canonical theory homes.

## Book 7 experiment series

| ID | Experiment | Primary question |
|---|---|---|
| R7-1 | Context-turnover invariance | Does compact state preserve future operational decisions compared with full history? |
| R7-2 | Multi-lane projection reconstruction | Which partial projections are necessary and sufficient after context loss? |
| R7-3 | Valid-state conflict preservation | Can the verifier preserve multiple authentic hypotheses without premature collapse? |
| R7-4 | Authority-guided temporal reconciliation | Does authoritative transition evidence contract the belief state correctly? |
| R7-5 | Semantic-binding attack | Can formal validity pass while semantic binding correctly fails or remains unknown? |
| R7-6 | Lattice classification | Do observed admissible signatures form a lattice, semilattice, or only a poset? |
| R7-6b | Distributivity / forbidden-sublattice test | If an induced lattice exists, is it distributive; if not, can an M3 or N5 witness be exhibited? |
| R7-7 | Rosetta commutation test | Does one declared cross-domain operation actually commute under explicit typing? |
| R7-8 | Holdout failure-prediction transfer | Can a frozen mapping predict a failure in an outcome-blinded target domain before unblinding? |
| R7-9 | Cumulative compact drift | How does phenotype error evolve over repeated compact/restore cycles? |
| R7-10 | Destructive restart reconstruction | Can durable partial/conflicting projections recover the frozen operational phenotype after active context loss? |

## Promotion rule

An experiment progresses through:

```text
QUESTION
-> FROZEN CLAIM
-> FROZEN VARIABLES
-> HARNESS
-> OBSERVATION
-> PRESERVED EVIDENCE
-> INTERPRETATION
-> OPTIONAL STRUCTURAL CLAIM
```

The structural claim is never inferred solely from the harness design.

## R7-6 / R7-6b lattice rule

The classifier must distinguish:

```text
ambient Boolean sublattice closure
!=
induced lattice existence
!=
induced distributivity
```

If the induced family is a lattice, test both distributive identities. If either fails, preserve an explicit triple witness and search for a five-element `M3` or `N5` sublattice witness.

A non-distributive result is an order-theoretic result only. It must not be promoted to a quantum-mechanics or quantum-logic claim without additional structure-preservation evidence.

## R7-8 holdout rule

“Prospective” requires more than writing the mapping down before describing the result.

Before inspecting the target outcome/evidence:

1. freeze the source-domain failure class;
2. freeze the cross-domain mapping and its typing assumptions;
3. freeze the predicted target failure/disposition and scoring rule;
4. freeze the target artifact/version/hash while withholding its relevant outcome evidence;
5. record who/what had access to the outcome before the freeze;
6. only then unblind and score the prediction.

If the target outcome was already inspected during mapping design, classify the exercise as retrospective, not prospective.

See [`R7-8-HOLDOUT-PROTOCOL.md`](./R7-8-HOLDOUT-PROTOCOL.md).

## Cross-domain rule

For R7-7 and R7-8, define the mapping **before** inspecting the target-domain outcome wherever feasible. Prospective prediction is stronger evidence than retrospective resemblance.

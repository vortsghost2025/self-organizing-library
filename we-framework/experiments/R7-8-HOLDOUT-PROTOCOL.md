# R7-8 — Prospective Rosetta Failure-Prediction Holdout Protocol

**Status:** experiment gate, not yet executed.

## Purpose

R7-8 tests the strongest version of a Rosetta claim: a failure structure learned in domain A predicts a previously uninspected failure in domain B.

Retrospective analogy is not enough. The relevant target outcome must remain blinded until the prediction is frozen.

## Freeze packet

Before unblinding, create an immutable packet containing:

```text
source_failure_id
target_domain_id
target_artifact_or_version_hash
mapping_definition
mapping_type_conditions
predicted_target_failure
predicted_disposition
scoring_rule
allowed_auxiliary_information
known_prior_exposure
timestamp
producer_identity
packet_sha256
```

The packet must distinguish facts already known about the target domain from the specific outcome/evidence being held out.

## Eligibility

A target is **PROSPECTIVE-ELIGIBLE** only when:

1. the target artifact/version can be frozen before outcome inspection;
2. the evaluator can identify the relevant held-out outcome/evidence;
3. the mapping and prediction are committed before that evidence is read;
4. no post-unblinding change to the mapping is counted as part of the original prediction.

If those conditions cannot be established, label the experiment `RETROSPECTIVE` or `EXPLORATORY` instead.

## Mapping freeze

The mapping must specify the objects and operations being translated. At minimum:

```text
F_X : source states -> target states or observations
F_E : source failure/perturbation -> target failure/perturbation
F_R : source recovery -> target recovery, if recovery is claimed
```

Every composition used in the prediction must be typed. Undefined translated operations invalidate the experiment specification before any result is scored.

## Prediction freeze

The prediction must be specific enough to be wrong.

Bad:

```text
something similar may fail
```

Acceptable:

```text
under target condition T, mechanism M will produce observable O,
which the frozen evaluator will classify as disposition D
```

The scoring rule must be frozen alongside the prediction.

## Unblinding

After the freeze packet is immutable:

1. reveal only the held-out target evidence needed for the frozen score;
2. preserve the raw observation before interpretation;
3. compute the score exactly under the frozen rule;
4. record misses, partial hits, and unexpected failure modes without rewriting the original packet.

## Interpretation labels

```text
PROSPECTIVE_HIT
PROSPECTIVE_PARTIAL
PROSPECTIVE_MISS
INCONCLUSIVE
PROTOCOL_INVALID
RETROSPECTIVE_ONLY
```

A miss is valuable evidence against the proposed Rosetta mapping.

## Anti-leakage rule

If a model, human, repository note, search result, or prior experiment exposed the held-out target outcome before the mapping freeze, record that exposure. Do not silently call the result prospective.

The aim is not to prove that nobody anywhere knew the answer. The aim is to preserve a defensible chain showing that the prediction under test was not fitted to the outcome during this experiment.

# WE Framework Adversarial Harness

The harness exists to falsify WE Framework claims, not to make demonstrations pass.

## Verification event

For one event:

```text
x = (q, φ, signer, role, task, challenge, time,
     trust, evidence, provenance, verifier_state)
```

and

```text
V(x) -> disposition
```

A bounded causal slice changes one frozen coordinate:

```text
V(x)  versus  V(x + δ_i)
```

## Interpretation

- Expected disposition changes reveal enforced boundaries.
- Missing expected changes can reveal an unenforced constraint.
- Unrelated changes affecting the disposition expose hidden coupling.
- A successful harness run is evidence only for the tested implementation and frozen scope.
- Harness existence is not evidence that the claimed property holds.

## Rosetta role

For a proposed translation `F`, the harness should attack a declared commuting relation such as:

```text
F(R1(E1(x))) ≈ R2(E2(F(x)))
```

The preferred result is the truth: commute, fail to commute, or remain unresolved under available evidence.

## Safety / evidence discipline

- Do not rewrite historical evidence to fit Book 7 terminology.
- Do not rerun frozen experiments merely to change labels.
- New analysis should point to old evidence by immutable identifiers.
- If an old experiment lacks enough evidence for a new claim, mark the new claim unresolved and design a future experiment.
- Separate formal proof, implementation evidence, conjecture, and analogy.

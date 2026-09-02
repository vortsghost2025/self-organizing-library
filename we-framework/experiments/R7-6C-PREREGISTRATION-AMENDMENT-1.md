# R7-6C — Preregistration Amendment 1: Coordinate Semantics

**Status:** PREREGISTRATION AMENDMENT / outcome not observed  
**Date:** 2026-08-21  
**Applies to:** `R7-6C-MISSING-MEET-PREREGISTRATION.md`  
**Reason:** a read-only implementation-design audit exposed an ambiguity in the proposed coordinate measurement layer before any prospective completion case was constructed or run.

## Provenance boundary

This amendment is frozen **before execution**. No F/G/H/J completion case has been run or observed.

The original preregistered target signatures remain unchanged. This amendment narrows the operational meaning of the coordinates so implementation cannot silently change the projection while trying to realize the prediction.

The canonical WE evidence index is `we-framework/evidence/aide-observed-signatures-v1.json`. In its frozen CAUSAL-9 combined projection, role authorization is a separate omitted coordinate. In particular, historical case D (known world-witness / wrong role) retains the five projected coordinates `S,I,A,T,C`; its failure is on the omitted `role_authorization` axis. Therefore role failure must **not** be folded into `I`.

## Frozen coordinate semantics

For R7-6C only:

### S — `signature_validity`

`S=true` means the decision body digest is internally consistent and the cryptographic signature is valid for the actual signing key evidenced by the artifact/fixture.

- For a policy-known key, verify against the policy record public key.
- For the deliberately unregistered attacker cases inherited from CAUSAL-9, verify self-consistency against the bundled public key, exactly as the frozen CAUSAL-9 case-A finding does.
- `S` is a cryptographic/self-consistency coordinate. It does **not** imply trusted issuer identity, role authorization, or authority.
- If no verification key is available, record `UNKNOWN`; do not coerce to false.

### I — `issuer_identity`

`I=true` means the signer identity is recognized by the frozen policy:

```text
record exists for signer.key_id
AND signer.issuer_id == record.issuer_id
```

The implementation may additionally confirm that the evidenced public key matches that record, but `I` does **not** require:

- `role_authorization`;
- membership in the authority slot;
- `signer.key_id == authority_slot.trusted_key_id`;
- `signer.issuer_id == authority_slot.trusted_issuer_id`.

Those are authorization/slot questions, not issuer-identity recognition in this projection.

Consequences for frozen CAUSAL-9:

```text
A attacker bundled key         I = false
B trusted authority            I = true
C trusted authority stale task I = true
D known witness wrong role     I = true
E trusted authority alg clash  I = true
```

Thus D duplicates B in the five-coordinate projection, not A. Its role failure remains real but lies outside this bounded projection.

### A — `algorithm_binding`

`A=true` means the envelope's declared algorithm is consistent with the actual cryptographic signing scheme and the frozen allowed-algorithm policy:

```text
declared_algorithm in authority_slot.allowed_algorithms
AND declared_algorithm == actual_signing_scheme
```

When a policy record exists for the signer, also require:

```text
declared_algorithm == record.algorithm
```

For an intentionally unregistered attacker key, absence of a policy record does not by itself make `A=false`; the record-comparison leg is not applicable. This preserves the already-frozen CAUSAL-9 case-A projection, where the attacker uses a genuine Ed25519 key and declares Ed25519.

If the actual signing scheme cannot be established, record `UNKNOWN` rather than false.

### T — `task_binding`

```text
T = (envelope.body.task_id == currentTask.task_id)
```

### C — `challenge_binding`

```text
C = (envelope.body.challenge_nonce == currentTask.challenge_nonce)
```

### Q — bounded composite axis

```text
Q = T AND C
```

`Q` exists only for this bounded CAUSAL-9/R7-6C projection. The experiment does not claim global independence or equivalence of task and challenge binding. Historical and prospective cases intentionally vary them together.

## Historical projected states under the clarified semantics

The four unique historical cells remain:

```text
B or D -> {S,I,A,T,C} -> (I,A,Q) = (1,1,1)
C      -> {S,I,A}     -> (1,1,0)
E      -> {S,I,T,C}   -> (1,0,1)
A      -> {S,A,T,C}   -> (0,1,1)
```

The identity of the duplicate case changes relative to the flawed read-only agent summary (D duplicates B, not A), but the set of four unique lattice cells is unchanged.

## Prospective targets remain unchanged

```text
F -> {S,A}   -> (I,A,Q) = (0,1,0)
G -> {S,T,C} -> (0,0,1)
H -> {S,I}   -> (1,0,0)
J -> {S}     -> (0,0,0)
```

Therefore the prospective structural prediction remains:

> If F/G/H/J realize exactly those signatures under the clarified coordinate predicates, then the historical four unique cells plus the four prospective cells produce all eight elements of `B3 = P({I,A,Q})`, with `S` invariant.

## Measurement requirements

The prospective harness must compute coordinate values independently of hardened-verifier reason order.

It must emit, per case:

```text
S: true | false | unknown
I: true | false | unknown
A: true | false | unknown
T: true | false | unknown
C: true | false | unknown
Q: true | false | unknown
role_authorization: true | false | unknown   # auxiliary, outside B3 projection
```

`role_authorization` is preserved as an auxiliary observation specifically to prevent it from being silently folded into `I`.

A first-failure reason such as `issuer-mismatch` or `algorithm-mismatch` is diagnostic output only. It is not a substitute for the coordinate vector.

## Constructibility status after clarification

The read-only design still supports constructibility of all four cases using existing CAUSAL-9 primitives:

- F: attacker key + stale body + Ed25519 declaration;
- G: attacker key + current body + conflicting `rsa-sha256` declaration;
- H: trusted authority key + stale body + conflicting `rsa-sha256` declaration;
- J: attacker key + stale body + conflicting `rsa-sha256` declaration.

This is a design assessment, not an observed outcome.

## Execution gate

Before any prospective run, implementation must conform to this amendment. In particular:

1. do not fold role authorization into `I`;
2. do not infer coordinates from verifier reason strings;
3. do not coerce undecidable coordinates to false;
4. preserve the original F/G/H/J target signatures;
5. record auxiliary role authorization separately;
6. keep the prospective evidence root distinct from frozen CAUSAL-9 evidence.

If the implementation cannot satisfy these measurement semantics, stop before execution and treat that as a preregistration/type mismatch rather than changing the predicates to fit the harness.

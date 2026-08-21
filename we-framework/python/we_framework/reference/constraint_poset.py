"""Bounded reference model for Book 7 Target 3: constraint signatures.

The ambient signature space P(C) is a Boolean lattice under inclusion. An
observed subset of signatures need not be closed under ambient intersection or
union. Importantly, lack of ambient closure does NOT by itself prove that the
observed subset fails to be a lattice under its induced order; its internal GLB
or LUB may exist at a different observed signature. This module reports both.
"""
from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations_with_replacement
from typing import FrozenSet, Iterable, Optional

Signature = FrozenSet[str]

AIDE_CONSTRAINTS_V1: FrozenSet[str] = frozenset(
    {
        "signature_validity",
        "issuer_identity",
        "role_authorization",
        "task_binding",
        "challenge_binding",
        "freshness",
        "trust_state_membership",
        "provenance",
        "evidence_sufficiency",
        "semantic_scope",
    }
)


def sig(*constraints: str) -> Signature:
    return frozenset(constraints)


@dataclass(frozen=True)
class PairWitness:
    left: Signature
    right: Signature
    expected_ambient: Signature


@dataclass(frozen=True)
class Classification:
    kind: str
    ambient_meet_closed: bool
    ambient_join_closed: bool
    induced_has_all_meets: bool
    induced_has_all_joins: bool
    meet_closure_witness: Optional[PairWitness]
    join_closure_witness: Optional[PairWitness]
    missing_meet_pair: Optional[tuple[Signature, Signature]]
    missing_join_pair: Optional[tuple[Signature, Signature]]


def _validate_family(constraints: FrozenSet[str], family: Iterable[Iterable[str]]) -> tuple[Signature, ...]:
    normalized = tuple(dict.fromkeys(frozenset(s) for s in family))
    if not normalized:
        raise ValueError("observed signature family must be non-empty")
    for s in normalized:
        if not s.issubset(constraints):
            raise ValueError(f"signature contains undeclared constraints: {sorted(s - constraints)}")
    return normalized


def ambient_meet(a: Signature, b: Signature) -> Signature:
    return a & b


def ambient_join(a: Signature, b: Signature) -> Signature:
    return a | b


def induced_glb(a: Signature, b: Signature, family: tuple[Signature, ...]) -> Optional[Signature]:
    lower = [x for x in family if x.issubset(a) and x.issubset(b)]
    winners = [x for x in lower if all(y.issubset(x) for y in lower)]
    return winners[0] if len(winners) == 1 else None


def induced_lub(a: Signature, b: Signature, family: tuple[Signature, ...]) -> Optional[Signature]:
    upper = [x for x in family if a.issubset(x) and b.issubset(x)]
    winners = [x for x in upper if all(x.issubset(y) for y in upper)]
    return winners[0] if len(winners) == 1 else None


def classify(
    family: Iterable[Iterable[str]], constraints: FrozenSet[str] = AIDE_CONSTRAINTS_V1
) -> Classification:
    observed = _validate_family(constraints, family)
    observed_set = set(observed)

    meet_witness = None
    join_witness = None
    missing_meet = None
    missing_join = None
    all_meets = True
    all_joins = True

    for a, b in combinations_with_replacement(observed, 2):
        m = ambient_meet(a, b)
        j = ambient_join(a, b)
        if meet_witness is None and m not in observed_set:
            meet_witness = PairWitness(a, b, m)
        if join_witness is None and j not in observed_set:
            join_witness = PairWitness(a, b, j)

        if induced_glb(a, b, observed) is None:
            all_meets = False
            if missing_meet is None:
                missing_meet = (a, b)
        if induced_lub(a, b, observed) is None:
            all_joins = False
            if missing_join is None:
                missing_join = (a, b)

    ambient_meet_closed = meet_witness is None
    ambient_join_closed = join_witness is None

    if all_meets and all_joins:
        kind = "lattice"
    elif all_meets:
        kind = "meet-semilattice"
    elif all_joins:
        kind = "join-semilattice"
    else:
        kind = "poset"

    return Classification(
        kind=kind,
        ambient_meet_closed=ambient_meet_closed,
        ambient_join_closed=ambient_join_closed,
        induced_has_all_meets=all_meets,
        induced_has_all_joins=all_joins,
        meet_closure_witness=meet_witness,
        join_closure_witness=join_witness,
        missing_meet_pair=missing_meet,
        missing_join_pair=missing_join,
    )

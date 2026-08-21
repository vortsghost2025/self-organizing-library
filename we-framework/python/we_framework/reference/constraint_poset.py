"""Bounded reference model for Book 7 Target 3: constraint signatures.

The ambient signature space P(C) is a Boolean lattice under inclusion. An
observed subset of signatures need not be closed under ambient intersection or
union. Importantly, lack of ambient closure does NOT by itself prove that the
observed subset fails to be a lattice under its induced order; its internal GLB
or LUB may exist at a different observed signature. This module reports both.

If the induced observed order is a lattice, the classifier additionally tests
the distributive laws directly. For finite lattices it also searches for a
five-element sublattice witness isomorphic to M3 (diamond) or N5 (pentagon),
the standard forbidden sublattices for distributivity. A non-distributive
result is an order-theoretic fact; by itself it is NOT evidence that the system
is quantum mechanical or implements quantum logic.
"""
from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations, combinations_with_replacement, product
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
class DistributivityWitness:
    law: str
    x: Signature
    y: Signature
    z: Signature
    left_value: Signature
    right_value: Signature


@dataclass(frozen=True)
class ForbiddenSublatticeWitness:
    kind: str
    elements: tuple[Signature, ...]


@dataclass(frozen=True)
class Classification:
    kind: str
    ambient_meet_closed: bool
    ambient_join_closed: bool
    induced_has_all_meets: bool
    induced_has_all_joins: bool
    distributive: Optional[bool]
    meet_closure_witness: Optional[PairWitness]
    join_closure_witness: Optional[PairWitness]
    missing_meet_pair: Optional[tuple[Signature, Signature]]
    missing_join_pair: Optional[tuple[Signature, Signature]]
    distributivity_witness: Optional[DistributivityWitness]
    forbidden_sublattice_witness: Optional[ForbiddenSublatticeWitness]


def _validate_family(
    constraints: FrozenSet[str], family: Iterable[Iterable[str]]
) -> tuple[Signature, ...]:
    normalized = tuple(dict.fromkeys(frozenset(s) for s in family))
    if not normalized:
        raise ValueError("observed signature family must be non-empty")
    for s in normalized:
        if not s.issubset(constraints):
            raise ValueError(
                f"signature contains undeclared constraints: {sorted(s - constraints)}"
            )
    return normalized


def ambient_meet(a: Signature, b: Signature) -> Signature:
    return a & b


def ambient_join(a: Signature, b: Signature) -> Signature:
    return a | b


def induced_glb(
    a: Signature, b: Signature, family: tuple[Signature, ...]
) -> Optional[Signature]:
    lower = [x for x in family if x.issubset(a) and x.issubset(b)]
    winners = [x for x in lower if all(y.issubset(x) for y in lower)]
    return winners[0] if len(winners) == 1 else None


def induced_lub(
    a: Signature, b: Signature, family: tuple[Signature, ...]
) -> Optional[Signature]:
    upper = [x for x in family if a.issubset(x) and b.issubset(x)]
    winners = [x for x in upper if all(x.issubset(y) for y in upper)]
    return winners[0] if len(winners) == 1 else None


def _check_distributivity(
    family: tuple[Signature, ...],
) -> tuple[bool, Optional[DistributivityWitness]]:
    """Check both distributive identities in a finite induced lattice."""
    for x, y, z in product(family, repeat=3):
        y_join_z = induced_lub(y, z, family)
        x_meet_y = induced_glb(x, y, family)
        x_meet_z = induced_glb(x, z, family)
        left = induced_glb(x, y_join_z, family)
        right = induced_lub(x_meet_y, x_meet_z, family)
        if left != right:
            return False, DistributivityWitness(
                law="meet_over_join",
                x=x,
                y=y,
                z=z,
                left_value=left,
                right_value=right,
            )

        y_meet_z = induced_glb(y, z, family)
        x_join_y = induced_lub(x, y, family)
        x_join_z = induced_lub(x, z, family)
        left = induced_lub(x, y_meet_z, family)
        right = induced_glb(x_join_y, x_join_z, family)
        if left != right:
            return False, DistributivityWitness(
                law="join_over_meet",
                x=x,
                y=y,
                z=z,
                left_value=left,
                right_value=right,
            )

    return True, None


def _is_closed_sublattice(
    subset: tuple[Signature, ...], family: tuple[Signature, ...]
) -> bool:
    subset_set = set(subset)
    for a, b in combinations_with_replacement(subset, 2):
        if induced_glb(a, b, family) not in subset_set:
            return False
        if induced_lub(a, b, family) not in subset_set:
            return False
    return True


def _bounded_elements(
    subset: tuple[Signature, ...],
) -> tuple[Optional[Signature], Optional[Signature]]:
    bottoms = [x for x in subset if all(x.issubset(y) for y in subset)]
    tops = [x for x in subset if all(y.issubset(x) for y in subset)]
    if len(bottoms) != 1 or len(tops) != 1:
        return None, None
    return bottoms[0], tops[0]


def _find_forbidden_sublattice(
    family: tuple[Signature, ...],
) -> Optional[ForbiddenSublatticeWitness]:
    """Find an M3 or N5 sublattice witness in a finite lattice, if present."""
    if len(family) < 5:
        return None

    for subset in combinations(family, 5):
        if not _is_closed_sublattice(subset, family):
            continue

        bottom, top = _bounded_elements(subset)
        if bottom is None or top is None:
            continue

        middle = [x for x in subset if x not in (bottom, top)]
        comparable_pairs: list[tuple[Signature, Signature]] = []
        for a, b in combinations(middle, 2):
            if a.issubset(b) or b.issubset(a):
                comparable_pairs.append((a, b))

        ordered = tuple(
            sorted(subset, key=lambda s: (len(s), tuple(sorted(s))))
        )

        # M3: bottom + top + three pairwise incomparable middle elements.
        if len(comparable_pairs) == 0:
            return ForbiddenSublatticeWitness(kind="M3", elements=ordered)

        # N5: bottom + top + a two-element middle chain and one middle
        # element incomparable with both members of that chain.
        if len(comparable_pairs) == 1:
            a, b = comparable_pairs[0]
            lo, hi = (a, b) if a.issubset(b) else (b, a)
            third = next(x for x in middle if x not in (a, b))
            if not (
                third.issubset(lo)
                or lo.issubset(third)
                or third.issubset(hi)
                or hi.issubset(third)
            ):
                return ForbiddenSublatticeWitness(kind="N5", elements=ordered)

    return None


def classify(
    family: Iterable[Iterable[str]],
    constraints: FrozenSet[str] = AIDE_CONSTRAINTS_V1,
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

    distributive: Optional[bool] = None
    distributivity_witness = None
    forbidden_sublattice_witness = None
    if kind == "lattice":
        distributive, distributivity_witness = _check_distributivity(observed)
        if not distributive:
            forbidden_sublattice_witness = _find_forbidden_sublattice(observed)

    return Classification(
        kind=kind,
        ambient_meet_closed=ambient_meet_closed,
        ambient_join_closed=ambient_join_closed,
        induced_has_all_meets=all_meets,
        induced_has_all_joins=all_joins,
        distributive=distributive,
        meet_closure_witness=meet_witness,
        join_closure_witness=join_witness,
        missing_meet_pair=missing_meet,
        missing_join_pair=missing_join,
        distributivity_witness=distributivity_witness,
        forbidden_sublattice_witness=forbidden_sublattice_witness,
    )

"""Bounded reference model for Book 7 Target 2: finite belief lattice.

For a finite universe Ω, P(Ω) under reverse inclusion is a complete lattice.
Knowledge order: B1 <= B2 iff B1 is a superset of B2. Thus fewer possible
worlds means more information.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import FrozenSet, Hashable, Iterable

World = Hashable
Belief = FrozenSet[World]


@dataclass(frozen=True)
class BeliefLattice:
    universe: Belief

    def __init__(self, universe: Iterable[World]):
        frozen = frozenset(universe)
        if not frozen:
            raise ValueError("universe Ω must be non-empty")
        object.__setattr__(self, "universe", frozen)

    def validate(self, belief: Iterable[World]) -> Belief:
        b = frozenset(belief)
        if not b.issubset(self.universe):
            extra = b - self.universe
            raise ValueError(f"belief contains worlds outside Ω: {sorted(map(str, extra))}")
        return b

    def leq(self, left: Iterable[World], right: Iterable[World]) -> bool:
        """Reverse-inclusion knowledge order: left <= right iff left ⊇ right."""
        a, b = self.validate(left), self.validate(right)
        return a.issuperset(b)

    def meet(self, left: Iterable[World], right: Iterable[World]) -> Belief:
        """Greatest lower bound under reverse inclusion = set union."""
        a, b = self.validate(left), self.validate(right)
        return a | b

    def join(self, left: Iterable[World], right: Iterable[World]) -> Belief:
        """Least upper bound under reverse inclusion = set intersection."""
        a, b = self.validate(left), self.validate(right)
        return a & b

    @property
    def bottom(self) -> Belief:
        """Least information / total ignorance."""
        return self.universe

    @property
    def top(self) -> Belief:
        """Formal top of P(Ω): the inconsistent/impossible belief ∅."""
        return frozenset()

    def consistent(self, belief: Iterable[World]) -> bool:
        """A practical belief is consistent iff at least one world remains."""
        return bool(self.validate(belief))

    def update(self, belief: Iterable[World], evidence_consistent_worlds: Iterable[World]) -> Belief:
        """Evidence update by intersection: B' = B ∩ Consistent(E)."""
        b = self.validate(belief)
        e = self.validate(evidence_consistent_worlds)
        return b & e

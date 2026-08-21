"""Bounded reference model for Book 7 Target 1: operational phenotype.

The model is intentionally explicit: it does not infer phenotype fields from prose.
A caller must supply the declared invariant vector. This keeps the mathematical
object testable and separates semantic fidelity from token overlap.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
import hashlib
import json
from typing import Any, Iterable, Mapping

SCHEMA_VERSION = "we.phenotype/v1"

# Frozen Book-7 v1 invariant vector. These are the fields whose preservation is
# required for two bounded histories to count as operationally equivalent.
PHENOTYPE_FIELDS = (
    "mission",
    "authority_bindings",
    "constraints",
    "active_work_items",
    "commitments",
    "unresolved_failures",
    "next_actions",
    "provenance_refs",
    "evidence_refs",
)


def _stable_tuple(values: Iterable[str]) -> tuple[str, ...]:
    return tuple(sorted({str(v).strip() for v in values if str(v).strip()}))


@dataclass(frozen=True)
class OperationalPhenotype:
    schema_version: str
    mission: str
    authority_bindings: tuple[str, ...]
    constraints: tuple[str, ...]
    active_work_items: tuple[str, ...]
    commitments: tuple[str, ...]
    unresolved_failures: tuple[str, ...]
    next_actions: tuple[str, ...]
    provenance_refs: tuple[str, ...]
    evidence_refs: tuple[str, ...]

    def canonical_bytes(self) -> bytes:
        return json.dumps(
            asdict(self), sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")

    def fingerprint(self) -> str:
        """Integrity fingerprint of the normalized phenotype representation.

        This proves byte identity of the normalized phenotype, not semantic
        correctness of the extraction that produced it.
        """
        return hashlib.sha256(self.canonical_bytes()).hexdigest()


def phenotype(history: Mapping[str, Any]) -> OperationalPhenotype:
    """Project a bounded history record onto the frozen operational phenotype.

    Unknown fields are deliberately ignored: transcript wording, repeated
    explanations, timestamps not declared as invariants, and other human noise
    do not alter the phenotype unless they change one of the frozen fields.
    """
    missing = [field for field in PHENOTYPE_FIELDS if field not in history]
    if missing:
        raise ValueError(f"missing phenotype fields: {', '.join(missing)}")

    mission = str(history["mission"]).strip()
    if not mission:
        raise ValueError("mission must be non-empty")

    return OperationalPhenotype(
        schema_version=SCHEMA_VERSION,
        mission=mission,
        authority_bindings=_stable_tuple(history["authority_bindings"]),
        constraints=_stable_tuple(history["constraints"]),
        active_work_items=_stable_tuple(history["active_work_items"]),
        commitments=_stable_tuple(history["commitments"]),
        unresolved_failures=_stable_tuple(history["unresolved_failures"]),
        next_actions=_stable_tuple(history["next_actions"]),
        provenance_refs=_stable_tuple(history["provenance_refs"]),
        evidence_refs=_stable_tuple(history["evidence_refs"]),
    )


def equivalent(left: Mapping[str, Any], right: Mapping[str, Any]) -> bool:
    """Exact phenotype equivalence H ~I H' iff I(H) == I(H')."""
    return phenotype(left) == phenotype(right)

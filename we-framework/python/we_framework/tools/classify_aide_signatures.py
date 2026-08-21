"""Classify bounded evidence-backed AIDE signature slices without touching AIDE."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from we_framework.reference.constraint_poset import classify


def classify_index(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    results = []
    for slice_ in payload["slices"]:
        constraints = frozenset(slice_["constraints"])
        family = [case["signature"] for case in slice_["cases"]]
        result = classify(family, constraints=constraints)
        results.append(
            {
                "id": slice_["id"],
                "case_count": len(slice_["cases"]),
                "unique_signature_count": len({frozenset(s) for s in family}),
                "classification": result.kind,
                "ambient_meet_closed": result.ambient_meet_closed,
                "ambient_join_closed": result.ambient_join_closed,
                "induced_has_all_meets": result.induced_has_all_meets,
                "induced_has_all_joins": result.induced_has_all_joins,
            }
        )
    return {
        "schema": "we.aide-signature-classification/v1",
        "source_schema": payload["schema"],
        "results": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("index", type=Path)
    args = parser.parse_args()
    print(json.dumps(classify_index(args.index), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

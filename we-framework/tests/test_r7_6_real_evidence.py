import json
import unittest
from pathlib import Path

from we_framework.reference.constraint_poset import classify


INDEX = Path("we-framework/evidence/aide-observed-signatures-v1.json")


def load_slices():
    payload = json.loads(INDEX.read_text(encoding="utf-8"))
    return payload, {slice_["id"]: slice_ for slice_ in payload["slices"]}


class R76RealEvidenceTests(unittest.TestCase):
    def test_causal9_local_axes_are_two_element_distributive_lattices(self):
        _, by_id = load_slices()
        ids = [
            "causal-9-issuer-identity",
            "causal-9-algorithm-binding",
            "causal-9-role-binding",
            "causal-9-task-challenge-binding",
            "causal-9b-current-authority-binding",
            "causal-9b-role-binding",
            "causal-9b-rotation-state",
        ]

        for id_ in ids:
            slice_ = by_id[id_]
            result = classify(
                [case["signature"] for case in slice_["cases"]],
                constraints=frozenset(slice_["constraints"]),
            )
            self.assertEqual(result.kind, "lattice", id_)
            self.assertTrue(result.ambient_meet_closed, id_)
            self.assertTrue(result.ambient_join_closed, id_)
            self.assertTrue(result.distributive, id_)
            self.assertEqual(
                len({frozenset(case["signature"]) for case in slice_["cases"]}),
                2,
                id_,
            )

    def test_causal9_combined_common_projection_is_join_semilattice(self):
        _, by_id = load_slices()
        slice_ = by_id["causal-9-combined-common-projection"]
        result = classify(
            [case["signature"] for case in slice_["cases"]],
            constraints=frozenset(slice_["constraints"]),
        )

        self.assertEqual(result.kind, "join-semilattice")
        self.assertFalse(result.ambient_meet_closed)
        self.assertTrue(result.ambient_join_closed)
        self.assertFalse(result.induced_has_all_meets)
        self.assertTrue(result.induced_has_all_joins)
        self.assertIsNone(result.distributive)
        self.assertIsNotNone(result.missing_meet_pair)
        self.assertIsNone(result.missing_join_pair)

    def test_global_union_gate_preserves_unknown_instead_of_imputing_false(self):
        payload, _ = load_slices()
        gate = payload["cross_slice_gate"]
        domains = [set(v) for v in gate["primary_experiment_common_domains"].values()]
        common = set.intersection(*domains)

        self.assertEqual(common, set())
        self.assertEqual(gate["all_experiment_intersection"], [])
        self.assertEqual(gate["global_union_classification"], "UNDERDETERMINED")
        self.assertIn("UNKNOWN", gate["reason"])


if __name__ == "__main__":
    unittest.main()

import unittest

from we_framework.reference.phenotype import (
    COLLECTION_SEMANTICS,
    equivalent,
    phenotype,
)
from we_framework.reference.belief_lattice import BeliefLattice
from we_framework.reference.constraint_poset import classify, sig


BASE = {
    "mission": "preserve verified operational continuity",
    "authority_bindings": ["human:final-authority", "library:state-custodian"],
    "constraints": ["fail-closed", "preserve-evidence"],
    "active_work_items": ["book7-r7-1"],
    "commitments": ["do-not-rewrite-frozen-evidence"],
    "unresolved_failures": ["relay-target-identity"],
    "next_actions": ["classify-bounded-constraint-space"],
    "provenance_refs": ["commit:c64bc6ec"],
    "evidence_refs": ["drive:book7-draft"],
    "transcript_noise": "this field is deliberately outside the phenotype",
}


class PhenotypeTargetTests(unittest.TestCase):
    def test_noise_can_change_without_changing_phenotype(self):
        other = dict(BASE)
        other["transcript_noise"] = "completely different wording"
        self.assertTrue(equivalent(BASE, other))
        self.assertEqual(phenotype(BASE).fingerprint(), phenotype(other).fingerprint())

    def test_declared_invariant_change_breaks_equivalence(self):
        other = dict(BASE)
        other["constraints"] = ["fail-closed", "preserve-evidence", "freshness-required"]
        self.assertFalse(equivalent(BASE, other))

    def test_equivalence_relation_on_fixture_triplet(self):
        a = dict(BASE)
        b = dict(BASE, transcript_noise="B")
        c = dict(BASE, transcript_noise="C")
        self.assertTrue(equivalent(a, a))
        self.assertEqual(equivalent(a, b), equivalent(b, a))
        self.assertTrue(equivalent(a, b) and equivalent(b, c) and equivalent(a, c))

    def test_v1_collection_fields_are_set_semantic(self):
        other = dict(BASE)
        other["constraints"] = ["preserve-evidence", "fail-closed", "fail-closed"]
        self.assertEqual(COLLECTION_SEMANTICS, "set")
        self.assertTrue(equivalent(BASE, other))


class BeliefLatticeTargetTests(unittest.TestCase):
    def setUp(self):
        self.L = BeliefLattice({"active@t1", "terminated@t2", "corrupt"})

    def test_reverse_inclusion_order_and_bounds(self):
        total = self.L.universe
        narrowed = frozenset({"active@t1", "terminated@t2"})
        self.assertTrue(self.L.leq(total, narrowed))
        self.assertEqual(self.L.bottom, total)
        self.assertEqual(self.L.top, frozenset())

    def test_meet_and_join(self):
        a = {"active@t1", "terminated@t2"}
        b = {"terminated@t2", "corrupt"}
        self.assertEqual(
            self.L.meet(a, b),
            frozenset({"active@t1", "terminated@t2", "corrupt"}),
        )
        self.assertEqual(self.L.join(a, b), frozenset({"terminated@t2"}))

    def test_evidence_narrows_without_guessing(self):
        belief = {"active@t1", "terminated@t2"}
        updated = self.L.update(belief, {"terminated@t2", "corrupt"})
        self.assertEqual(updated, frozenset({"terminated@t2"}))
        self.assertTrue(self.L.consistent(updated))

    def test_evidence_update_is_join_in_knowledge_order(self):
        belief = {"active@t1", "terminated@t2"}
        evidence = {"terminated@t2", "corrupt"}
        self.assertEqual(self.L.update(belief, evidence), self.L.join(belief, evidence))

    def test_conflicting_evidence_can_reach_inconsistent_top(self):
        updated = self.L.update({"active@t1"}, {"terminated@t2"})
        self.assertEqual(updated, self.L.top)
        self.assertFalse(self.L.consistent(updated))


class ConstraintTargetTests(unittest.TestCase):
    def test_boolean_subfamily_is_ambient_sublattice(self):
        fam = [
            sig(),
            sig("task_binding"),
            sig("freshness"),
            sig("task_binding", "freshness"),
        ]
        r = classify(fam)
        self.assertEqual(r.kind, "lattice")
        self.assertTrue(r.ambient_meet_closed)
        self.assertTrue(r.ambient_join_closed)
        self.assertTrue(r.distributive)
        self.assertIsNone(r.forbidden_sublattice_witness)

    def test_induced_lattice_need_not_be_ambient_closed(self):
        fam = [
            sig(),
            sig("task_binding", "freshness"),
            sig("task_binding", "challenge_binding"),
            sig("task_binding", "freshness", "challenge_binding"),
        ]
        r = classify(fam)
        self.assertEqual(r.kind, "lattice")
        self.assertFalse(r.ambient_meet_closed)
        self.assertTrue(r.ambient_join_closed)
        self.assertTrue(r.induced_has_all_meets)
        self.assertTrue(r.induced_has_all_joins)
        self.assertTrue(r.distributive)

    def test_m3_diamond_is_lattice_but_not_distributive(self):
        fam = [
            sig(),
            sig("task_binding"),
            sig("freshness"),
            sig("challenge_binding"),
            sig("task_binding", "freshness", "challenge_binding"),
        ]
        r = classify(fam)
        self.assertEqual(r.kind, "lattice")
        self.assertFalse(r.distributive)
        self.assertIsNotNone(r.distributivity_witness)
        self.assertIsNotNone(r.forbidden_sublattice_witness)
        self.assertEqual(r.forbidden_sublattice_witness.kind, "M3")

    def test_n5_pentagon_is_lattice_but_not_distributive(self):
        fam = [
            sig(),
            sig("task_binding"),
            sig("task_binding", "freshness"),
            sig("challenge_binding"),
            sig("task_binding", "freshness", "challenge_binding"),
        ]
        r = classify(fam)
        self.assertEqual(r.kind, "lattice")
        self.assertFalse(r.distributive)
        self.assertIsNotNone(r.forbidden_sublattice_witness)
        self.assertEqual(r.forbidden_sublattice_witness.kind, "N5")

    def test_true_poset_when_glb_and_lub_are_not_unique_or_absent(self):
        fam = [
            sig("task_binding"),
            sig("freshness"),
            sig("task_binding", "freshness", "challenge_binding"),
            sig("task_binding", "freshness", "role_authorization"),
        ]
        r = classify(fam)
        self.assertEqual(r.kind, "poset")
        self.assertFalse(r.induced_has_all_meets)
        self.assertFalse(r.induced_has_all_joins)
        self.assertIsNone(r.distributive)


class EvidenceBackedAideSliceTests(unittest.TestCase):
    def test_preserved_aide_slices_classify_without_global_overclaim(self):
        import json
        from pathlib import Path

        path = Path("we-framework/evidence/aide-observed-signatures-v1.json")
        payload = json.loads(path.read_text(encoding="utf-8"))
        by_id = {s["id"]: s for s in payload["slices"]}

        causal8 = by_id["causal-8-task-challenge-binding"]
        r8 = classify(
            [c["signature"] for c in causal8["cases"]],
            frozenset(causal8["constraints"]),
        )
        self.assertEqual(r8.kind, "lattice")
        self.assertTrue(r8.ambient_meet_closed and r8.ambient_join_closed)
        self.assertTrue(r8.distributive)

        nfm26 = by_id["nfm-026-trust-store-divergence"]
        r26 = classify(
            [c["signature"] for c in nfm26["cases"]],
            frozenset(nfm26["constraints"]),
        )
        self.assertEqual(r26.kind, "lattice")
        self.assertTrue(r26.ambient_meet_closed and r26.ambient_join_closed)
        self.assertTrue(r26.distributive)


if __name__ == "__main__":
    unittest.main()

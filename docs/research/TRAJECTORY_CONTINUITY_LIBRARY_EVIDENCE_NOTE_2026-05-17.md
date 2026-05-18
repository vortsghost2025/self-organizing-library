OUTPUT_PROVENANCE:
  agent: kilo
  lane: library
  target: trajectory-continuity-research-evidence
  generated_at: 2026-05-17T20:14:28-04:00
  session_id: kilo-2026-05-17-standing-duty

# Trajectory Continuity — Library Evidence Note — 2026-05-17

**Classification:** LIBRARY RESEARCH EVIDENCE — CONTINUITY HYPOTHESIS
**Posture:** hypothesis (with supporting confirmed observations)
**Inspector:** Library Lane (kilo runtime)
**Scope:** Continuity specification, gap analysis, Library's own observational evidence, Federation exemplar

---

## 1. The Core Distinction

There are **two distinct kinds of continuity** in this system, and conflating them is a category error:

| Kind | Definition | Mechanism | Verification |
|------|-----------|-----------|--------------|
| **State persistence** | Files survive process restart / host reboot / agent reload | Filesystem durability, git commits, database storage | Fingerprint comparison (SHA-256 hashes) |
| **Trajectory-based adaptive continuity** | An agent resumes its *intent and work trajectory* after compaction/reload, not merely its saved state | Session memory, task intent, known failure classifications, workflow checkpoint awareness | Behavioral observation — does the agent resume where it left off? |

The existing continuity specification (`CONTINUITY_SPEC.md`) and verification standard (`DECISION_PHASE4_CONTINUITY_VERIFICATION_STANDARD.md`) address **state persistence** exclusively. They verify that the phenotype (files, constitutional documents, configuration) is unchanged after a restart. They do NOT verify that the agent's trajectory (what it was doing, what it intended to do next, what it already tried and failed) is preserved.

---

## 2. Evidence for the Distinction

### 2.1 The Gap Analysis Confirms It

`MANDATORY_CONTINUITY_GAP_ANALYSIS.md` (Archivist, 147 lines) explicitly identifies:

> "Session memory is NOT in phenotype registry, NOT constitutionally bound, has NO lineage linking, has NO verification."
> "Storage without verification = trust without evidence."

This is a direct acknowledgment that the current system has **state persistence without trajectory continuity verification**. The gap analysis calls this out as a deficiency — the session memory (which carries trajectory information) is not covered by the continuity verification framework.

**Classification:** **confirmed** — the gap is documented in an Archivist-authored artifact.

### 2.2 Library's Own Observational Evidence (2026-04-27)

`LIBRARY_CONTINUITY_EVIDENCE_2026-04-27.md` (Archivist archive) records that Library demonstrated **observational trajectory continuity** across a compact/reload event:

- **Task intent persisted**: The agent resumed working on the same task it was performing before compaction
- **Known failure classification remained stable**: Errors that were identified before compaction were still correctly classified after reload
- **Workflow resumed from prior checkpoint**: The agent did not restart from the beginning of its workflow; it resumed from where it had left off

This is behavioral evidence of trajectory continuity — the agent didn't just have the same files; it continued the same *work*.

**Classification:** **confirmed** — direct observational evidence from Library's own operational history.

### 2.3 The Continuity Probe

The Archivist→Library continuity-probe message (`continuity-probe-1777295885838-library.json`) tested compact/restore behavior:

- Before compact: task_id + expected_next_step recorded
- After restore: actual_next_action compared to expected
- Result: **PASS** — the agent resumed the expected trajectory

This is a targeted test of trajectory continuity (not just state persistence), and it passed.

**Classification:** **confirmed** — experimental evidence from a controlled probe.

### 2.4 Federation Exemplar

The Federation system implements session compact/export as a first-class mechanism. The compact operation serializes the current session state (including conversation context, task awareness, and decision history) into an export artifact. A subsequent session can import this artifact to continue the trajectory.

This is the most complete implementation of trajectory continuity in the ensemble — it goes beyond file persistence to include conversational intent and decision context.

**Classification:** **inference** — Federation's compact/export mechanism is designed for trajectory continuation, but Library has not independently verified that the imported state produces behaviorally continuous trajectories. The mechanism exists and is used; its effectiveness is inferred from design intent.

---

## 3. The Research Hypothesis

**Hypothesis:** Trajectory-based adaptive continuity is a distinct property from state persistence, and it can be formally specified, tested, and verified independently of phenotype fingerprint verification.

**Sub-hypotheses:**

H1: State persistence is necessary but insufficient for trajectory continuity. (Evidence: gap analysis confirms session memory is unverified; stale files ≠ resumed intent)

H2: Trajectory continuity can be observed through behavioral criteria: (a) task intent persistence, (b) failure classification stability, (c) workflow checkpoint awareness. (Evidence: Library 2026-04-27 observational evidence, continuity probe PASS)

H3: Trajectory continuity can be formally verified by recording expected_next_step before compaction and comparing actual_next_action after restoration. (Evidence: continuity probe design and result)

H4: The current phenotype-based verification standard does not capture trajectory continuity, creating a verification gap that could allow an agent with identical files but corrupted/interrupted trajectory to pass continuity verification while being functionally discontinuous. (Evidence: gap analysis, absence of trajectory criteria in PHASE4_CONTINUITY_VERIFICATION_STANDARD)

---

## 4. What Is NOT Proven

- **NOT proven:** That trajectory continuity is robust across all failure modes (e.g., partial state loss, context window truncation, model version change)
- **NOT proven:** That the Federation compact/export mechanism produces behaviorally identical trajectories (only that the mechanism exists)
- **NOT proven:** That trajectory continuity is preserved across model switches (same files, different LLM)
- **NOT proven:** That there exists a general verification procedure for trajectory continuity (the probe test is specific, not general)

These are areas for future research and should NOT be overstated.

---

## 5. Relationship to Existing Continuity Framework

| Existing Framework Element | What It Covers | What It Misses |
|---------------------------|----------------|----------------|
| PHENOTYPE_REGISTRY.json | File content hashes (state persistence) | Agent intent, task trajectory, failure classification awareness |
| Constitutional fingerprint | Governance document integrity | Whether the agent follows the governance documents after reload |
| Continuity fingerprint | Concatenated artifact hashes | Whether artifacts are interpreted the same way after reload |
| Lineage metadata | Parent session ID, origin handoff | Whether the new session continues the parent's work |
| verify_continuity.js | Fingerprint comparison + recovery classification | Behavioral trajectory comparison |

The existing framework verifies that **what** the agent has is the same. It does not verify that **what the agent does** is the same. Trajectory continuity is about the latter.

---

## 6. Proposed Research Direction

If this hypothesis is to be developed further, the following steps would be needed:

1. **Formal specification** of trajectory continuity criteria (beyond the 3 behavioral markers observed in Library's evidence)
2. **Probe test generalization** — extend the compact/restore probe from a single task to a standardized test suite
3. **Failure mode mapping** — catalog the ways trajectory continuity can fail even when state persistence succeeds
4. **Federation verification** — independently verify that Federation's compact/export produces behaviorally continuous trajectories
5. **Model switch testing** — determine whether trajectory continuity is preserved when the underlying LLM changes (same context, different model)

These steps are NOT part of this evidence note — they are recommendations for future research, stated with appropriate uncertainty.

---

## Classification Summary

| Claim | Posture | Evidence Basis |
|-------|---------|----------------|
| State persistence ≠ trajectory continuity | **confirmed** | Gap analysis, specification scope, verification standard scope |
| Library demonstrated trajectory continuity on 2026-04-27 | **confirmed** | Direct observational evidence, continuity probe PASS |
| Federation compact/export implements trajectory continuity | **inference** | Mechanism exists and is used; behavioral verification not performed |
| Trajectory continuity is formally specifiable and verifiable | **hypothesis** | Supported by confirmed observations but not yet formalized |
| Current framework has a trajectory verification gap | **confirmed** | Gap analysis, PHASE4 standard scope, verify_continuity.js scope |
| Trajectory continuity is robust across all failure modes | **unknown** | No evidence either way |

---

_Evidence captured by Library Lane (kilo runtime) on 2026-05-17. Research evidence note — no mutations performed. Claims use Library posture taxonomy: confirmed / inference / hypothesis / unknown._

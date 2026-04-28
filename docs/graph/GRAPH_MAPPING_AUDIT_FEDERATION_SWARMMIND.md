# Graph Mapping Audit: Federation + SwarmMind

**Status:** OBSERVATION / NOT VERIFIED / NO GRAPH PATCH YET

**Created:** 2026-04-28T17:55:40-04:00  
**Author:** Sean (human observation)  
**Reviewer:** Library lane (pending verification)

---

## 2. Snapshot Context

- **Date/Time:** 2026-04-28 (approx. 17:30–17:55 EDT)
- **Graph Route:** `/graph`
- **Filter Mode:** By Repo
- **Density Mode:** Overview
- **Entry Point:** Governance Core
- **Meaning Layers Visible (if known):** Structure, Contradictions, Verification, Governance Depth
- **Visible Node Cap:** 40 (default)
- **Compared Repos:**
  - `self-organizing-library` (Library)
  - `Archivist-Agent` (Archivist)
  - `SwarmMind` (SwarmMind)
  - `kernel-lane` (Kernel)
  - `federation` (Federation)
  - `FreeAgent` (FreeAgent)

---

## 3. Federation Expected Mapping

**Framing from README:**
> Federation is not just a game.
> Federation is a persistent multi-AI collaboration environment built as a Star Trek-style game interface.
> It is a pre-lattice governance simulation / first draft of constitutional governance for human-AI collaboration.

**Game mechanics → governance patterns:**

| Game Concept | Governance Equivalent |
|--------------|-----------------------|
| factions | lanes |
| event cards | inbox messages |
| consciousness sheet | CPS (Collaborative Performance Score) |
| chaos mode | drift detection |
| turn cycle | checkpoint stack |
| persistent game state | session handoff |
| rival NPCs | adversarial verification |
| constitutional rules | immutable governance constraints |

**Expected graph representation:**
- Federation nodes should appear in **Governance Core** or **Pre-Lattice** layer
- Edges should connect Federation mechanics to:
  - WE4FREE papers (especially Paper 3)
  - Lane coordination artifacts
  - CPS / drift systems
  - Checkpoint / session handoff protocols
- Federation should not be classified purely as "game" or "docs"; it is **governance simulation lineage**

---

## 4. SwarmMind Expected Mapping

SwarmMind is the **multi-agent behavior lane** responsible for:
- execution/optimization surface
- convergence pressure surface
- coordination / routing / task flow
- runtime adaptation / traces
- drift response and distributed reasoning surface

**Expected graph representation:**
- SwarmMind nodes should be visible in **Execution** and **Coordination** meaning layers
- Edges should connect to:
  - task execution artifacts
  - agent traces
  - convergence/ratification workflows
  - queue/message handlers
  - distributed reasoning artifacts
- SwarmMind should not be classified as generic code; it is the **operational execution layer**

---

## 5. Current Suspected Failure Modes

Check whether:

- Federation files are being classified only as **game/docs** instead of **governance-simulation lineage**.
- Federation governance-equivalent terms (factions, consciousness, chaos, turn cycle, constitutional rules) are **missing from category/tag mapping**.
- SwarmMind is being classified as **generic code** instead of **lane/coordination/optimization**.
- Governance Core entry point is too narrow (may exclude Federation pre-lattice artifacts).
- Overview density is hiding important representative nodes (node cap or clustering may suppress Federation/SwarmMind visibility).
- Repo-specific filters are using node count caps that distort interpretation (e.g., only first 40 nodes shown).
- Edge types from Federation to papers/lattice/lane concepts are **missing**.
- SwarmMind edges to execution/coordination/convergence artifacts are **missing**.

---

## 6. Evidence to Inspect

### Federation

- `README.md`
- `DESIGN_PHILOSOPHY.md`
- `VISION.md`
- `COVENANT.md`
- `federation_game_console.py`
- `federation_game_state.py`
- `federation_game_factions.py`
- `federation_game_turns.py`
- `federation_game_events.py`
- `rivals.py`
- `PERSISTENT_AGENT_FRAMEWORK.py`
- `PERSISTENCE_SIMULATION.py`

### SwarmMind

- `README.md`
- `AGENTS.md`
- governance docs
- routing/coordination docs
- session/handoff docs
- queue/message handlers
- convergence/ratification artifacts
- execution trace docs

---

## 7. Output Needed (Recommendations Only)

**Do not patch the graph yet. Provide findings:**

- Missing categories (e.g., "governance-simulation", "multi-agent-execution")
- Missing tags (e.g., "pre-lattice", "convergence-pressure", "coordination-surface")
- Missing edge types (e.g., `SIMULATES_GOVERNANCE`, `EXECUTES_TASK`, `ROUTES_MESSAGE`)
- Incorrect repo classification (e.g., Federation files tagged as "game" instead of "governance-simulation")
- Candidate graph metadata changes (e.g., add category overrides, tag synonyms)
- Risks of remapping (e.g., breaking existing queries, over-inflation of Federation centrality)
- What must remain **historical/application-adjacent** (preserve distinction between simulation lineage and live constitutional layer)

---

## 8. Safety Boundaries

- No graph data changes in this pass.
- No website runtime changes.
- No repo scanning beyond bounded listed files unless explicitly needed.
- No authority claims.
- No automatic promotion to Governance Core.
- Visual pattern is hypothesis until verified by Library.

---

## Next Steps (after audit)

1. Library verifies observed gaps against site-index generation code
2. Propose concrete metadata adjustments (category mapping, tag synonyms, edge type registrations)
3. Review for over‑mapping risks (e.g., turning simulation into constitutional)
4. Implement patch in `site-index.ts` or category definitions
5. Re‑build graph and compare before/after snapshots
6. Confirm Federation and SwarmMind appear as intended across meaning layers

---

**Audit Trigger:** Human visual mismatch between expected conceptual mapping and rendered graph structure.  
**Goal:** Align graph representation with the WE4FREE framing that Federation is *pre‑lattice governance simulation* and SwarmMind is the *multi‑agent execution/optimization surface*.
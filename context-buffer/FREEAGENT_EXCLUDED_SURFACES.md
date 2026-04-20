# FREEAGENT PRODUCTION PHENOTYPE - EXCLUDED SURFACES

Date: 2026-04-19T21:04:00-04:00
Status: PENDING HUMAN GATE APPROVAL
Reference: FREEAGENT_PRODUCTION_PHENOTYPE_ROADMAP_2026-04-19.md

## 1) ROADMAP-DEFERRED TRACKS (Not in Production Phenotype)

The following modules are explicitly excluded by roadmap Section 1:

| Track | Status | Notes |
|-------|--------|-------|
| `medical/*` | NOT PRESENT | Deferred - not required for core orchestration |
| `DISTRIBUTED_MICROSERVICES_UNIVERSE/*` | NOT PRESENT | Deferred - not required for core orchestration |
| `_root/*` | NOT PRESENT | Deferred - not required for core orchestration |
| Legacy side projects | NOT PRESENT | Deferred - not required for core orchestration |

## 2) EXCLUDED: SwarmMind Reference Clone

**Directory**: `SwarmMind-Self-Optimizing-Multi-Agent-AI-System/`

This directory contains a **complete copy** of the SwarmMind multi-agent system. It is EXCLUDED from production phenotype because:

1. It is a reference/clone, not Library production code
2. The actual SwarmMind runtime exists in a separate repository
3. Library lane provides verification, not agent execution

| Component | Path | Exclusion Reason |
|-----------|------|------------------|
| Agent Framework | src/core/agent.js | SwarmMind execution lane |
| ScalingManager | src/core/scalingManager.js | SwarmMind execution lane |
| ExperimentationEngine | src/core/experimentationEngine.js | SwarmMind execution lane |
| Planner Agent | src/agents/planner.js | SwarmMind execution lane |
| Coder Agent | src/agents/coder.js | SwarmMind execution lane |
| Reviewer Agent | src/agents/reviewer.js | SwarmMind execution lane |
| Executor Agent | src/agents/executor.js | SwarmMind execution lane |
| GeneralistAgent | src/agents/generalist/GeneralistAgent.js | SwarmMind execution lane |
| SwarmMindApp | src/app.js | SwarmMind execution lane |
| All scripts | scripts/*.js | SwarmMind verification scripts |

## 3) EXCLUDED: NexusGraph Product Application

The main Next.js application is the **product**, not FreeAgent orchestration:

| Directory | Status | Notes |
|-----------|--------|-------|
| `src/app/**/*` | EXCLUDED | Next.js App Router - product UI |
| `src/components/**/*` | EXCLUDED | React components - product UI |
| `src/db/**/*` | EXCLUDED | Database schema - product data layer |
| `src/lib/**/*` | EXCLUDED | Product utilities |

**Rationale**: NexusGraph is the knowledge management product. FreeAgent infrastructure provides attestation/verification services that may be consumed by the product, but the product itself is not part of the production phenotype for this roadmap.

## 4) EXCLUDED: Session Memory (Requires Clarification)

| Component | Path | Status |
|-----------|------|--------|
| SessionMemory.js | src/memory/SessionMemory.js | UNDECIDED |

**Question for Human**: Is session memory part of orchestration or product? Currently used by attestation system.

## 5) UNDECIDED: Documentation Directories

| Directory | File Count | Question |
|-----------|------------|----------|
| `context-buffer/` | 29+ files | Should roadmap docs be indexed or excluded? |
| `library/docs/` | 28+ files | Should architecture docs be indexed or excluded? |

**Question for Human**: These contain inter-lane communications and architecture documentation. Should they be:
- A) Included as evidence index references
- B) Excluded from production phenotype
- C) Partially included (specific files only)

## 6) EXCLUSION SUMMARY

| Category | Item Count | Reason |
|----------|------------|--------|
| Roadmap Deferred | 4 tracks | Not on critical path |
| SwarmMind Clone | ~15 files | External reference, not production |
| NexusGraph Product | ~50+ files | Product, not orchestration |
| Undecided | 3 items | Needs human decision |

## 7) GATE CONDITIONS

Before proceeding to Phase 1, human must approve:

- [ ] Confirm SwarmMind-Self-Optimizing-Multi-Agent-AI-System/* is correctly excluded
- [ ] Confirm NexusGraph product (src/app, src/components, src/db, src/lib) is correctly excluded
- [ ] Decide on SessionMemory.js status
- [ ] Decide on context-buffer/ and library/docs/ status

---

**GATE STATUS**: ⏳ PENDING HUMAN APPROVAL

## 8) IMPLICATIONS

Excluding these surfaces means:
1. Verification scripts will NOT test SwarmMind clone functionality
2. Health checks will NOT cover product UI routes
3. Production phenotype scope is limited to attestation infrastructure
4. Documentation directories may need separate indexing strategy

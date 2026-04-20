# FreeAgent Production Phenotype Roadmap (Archivist + Library)

Date: 2026-04-19  
Authoring lane: interior verification handoff draft  
Execution model: Archivist implements, Library maps/docs/indexes, Human approves gates

## 1) Objective

Move from "many interleaved systems" to one stable, auditable production phenotype with deterministic verification and minimal moving parts.

Primary target runtime (to be confirmed by Phase 0/0.5 anchor):
- default target: `orchestrator` + `agent1` + `agent2` + `agent3` from FreeAgent
- if Phase 0 evidence shows current production is lane-based single-process, anchor must explicitly record that mode and replace this default graph

Deferred tracks (not on critical path):
- `medical/*`
- `DISTRIBUTED_MICROSERVICES_UNIVERSE/*`
- `_root/*`
- legacy side projects not required for core orchestration

## 2) Non-Negotiables

- Keep governance and verification deterministic.
- No hidden fallback paths in production phenotype.
- One canonical startup path.
- Every acceptance claim must be backed by executable checks.
- Any fail at gate => full stop, rollback to last known good.

## 3) Lane Ownership

### Archivist lane (implementation owner)
- Implement code changes and runtime wiring.
- Create scripts for health checks and smoke tests.
- Enforce single-path startup and strict failure behavior.

### Library lane (mapping/documentation owner)
- Produce component map and dependency graph.
- Maintain index of runtime contracts, env vars, ports, and APIs.
- Document current state and deltas after each phase.

## 4) Phase Plan (Execution Order)

## Phase 0 - Freeze and Scope Lock (same day)
Owner: Archivist + Library

Deliverables:
- `FREEAGENT_SCOPE_LOCK.md`
- `FREEAGENT_EXCLUDED_SURFACES.md`
- branch freeze note and baseline commit hash

Tasks:
- Choose one branch for execution baseline (recommend `main` if already active).
- Record baseline commit hash.
- Explicitly mark excluded modules as "not in production phenotype."

Gate:
- Human sign-off on included/excluded surfaces.

## Phase 0.5 - Context Lock / System Anchor (mandatory)
Owner: Archivist (implementation), Library (validation docs)

Deliverables:
- `FREEAGENT_SYSTEM_ANCHOR.json`
- `FREEAGENT_SYSTEM_ANCHOR_SCHEMA.md`
- `scripts/validate-system-anchor.js` (or `.ps1`)
- `FREEAGENT_CONTEXT_ARBITRATION.md`

Anchor minimum contract:
- `primary_root`
- `architecture_mode` (`distributed_orchestrator_agents` or `lane_single_process`)
- `production_phenotype` (canonical allowed components)
- `allowed_ports`
- `forbidden_surfaces`
- `strict_mode: true`

Tasks:
- Encode canonical graph from Phase 0 evidence into anchor file.
- Validate anchor before any boot/start script executes.
- If observed runtime differs from anchor, hard fail startup.
- Explicitly reject undeclared components/ports.

Gate:
- `validate-system-anchor` must pass before `start-core`.
- Any mismatch produces deterministic hard fail and no partial startup.

## Phase 1 - Topology and Contract Map (parallel, Library heavy)
Owner: Library (primary), Archivist (support)

Deliverables:
- `FREEAGENT_COMPONENT_MAP.md`
- `FREEAGENT_RUNTIME_CONTRACTS.md`
- `FREEAGENT_PORT_BINDINGS.md`
- `FREEAGENT_ENV_MATRIX.md`

Required map content:
- Architecture mode confirmed against anchor (`distributed_orchestrator_agents` vs `lane_single_process`)
- Node/service boundaries for anchored production phenotype only
- Port contracts: `3847`, `54121`, `54122`, `54123` (plus any WS endpoints)
- API routes per service and call direction
- Required env vars and defaults
- Startup dependencies (hard and soft)

Gate:
- Map must let a third party boot the core path with no guessing.

## Phase 2 - Boot Path Unification (Archivist heavy)
Owner: Archivist

Deliverables:
- `scripts/start-core.ps1` (or equivalent canonical launcher)
- `scripts/health-core.ps1`
- `scripts/smoke-core.ps1`
- `FREEAGENT_BOOT_SEQUENCE.md`

Tasks:
- Create one canonical startup order:
  1. orchestrator
  2. agent1/agent2/agent3
- Make health endpoint checks blocking.
- Fail fast if required dependency is absent.
- Remove ambiguous startup variants from "production" docs.

Gate:
- Fresh boot from stopped machine must pass health + smoke with one command chain.

## Phase 3 - Deterministic Verification Hardening
Owner: Archivist (implementation), Library (test doc + evidence index)

Deliverables:
- `scripts/test-hardening-drill.js` (or updated equivalent)
- `FREEAGENT_HARDENING_EVIDENCE.md`
- `FREEAGENT_BYPASS_REGISTER.md`

Tasks:
- Ensure malformed JWS returns structured rejection/quarantine (no uncaught crash path).
- Ensure no operational fallback path silently re-accepts rejected artifacts.
- Ensure revoked keys are terminally rejected.
- Ensure lane mismatch and key-id mismatch are both enforced before trust decisions.
- Run explicit fallback surface elimination checklist:
  - no alternate verification path remains callable in production
  - no recovery path can override local deterministic rejection
  - no legacy acceptance mode can return valid on missing signature
  - deterministic failures always terminate or quarantine

Gate:
- Hardening drill must pass all scenarios end-to-end.
- Failures include exact reason code and log evidence.

## Phase 4 - Reliability Pass and Recovery Discipline
Owner: Archivist

Deliverables:
- `FREEAGENT_RECOVERY_POLICY.md`
- `FREEAGENT_OPERATOR_HANDOFF_RUNBOOK.md`

Tasks:
- Confirm retry boundaries and quarantine escalation are explicit.
- Confirm operator handoff artifacts are generated on terminal conditions.
- Ensure no "success by side effect" after local deterministic failure.

Gate:
- Simulated dependency outage and invalid artifact both produce expected terminal behavior.

## Phase 5 - Documentation Lock and Index Publish
Owner: Library

Deliverables:
- `FREEAGENT_PRODUCTION_INDEX.md`
- `FREEAGENT_CHANGELOG_PRODUCTION_WAVE.md`
- update pointers in existing context-buffer index

Tasks:
- Publish final "what runs / what does not run" index.
- Link every acceptance claim to evidence file + command.
- Mark obsolete docs as archived or superseded.

Gate:
- New operator can follow index and reproduce production phenotype in one session.

## 5) Acceptance Test Matrix (must run before production tag)

Minimum required checks:

1. Anchor and startup integrity
- `validate-system-anchor` passes before boot
- undeclared component or port causes hard fail
- `node --check` on core entry files
- startup script returns success on clean boot

2. Health checks
- orchestrator health endpoint
- agent1/2/3 health endpoints

3. Routing checks
- simple chat/request through each agent
- orchestrator route consistency

4. Verification checks
- lane mismatch rejection
- key-id mismatch rejection
- malformed JWS structured rejection
- revoked key rejection
- missing signature rejection (no valid fallback mode)
- recovery response cannot convert local deterministic reject into valid

5. Recovery checks
- simulated orchestrator unreachability path
- quarantine and handoff artifact generation

## 6) Stop Conditions (Full Stop)

Immediate stop and quarantine if any of the following occur:
- contradictory status between tests and runtime logs
- startup passes but health probes disagree
- deterministic failure converted to success without explicit operator approval
- uncaught exception in verification path

Rollback policy:
- hard reset to last known phenotype commit hash
- re-run acceptance matrix
- compare outputs before reattempting changes

## 7) Work Split for Next 24 Hours

Archivist next actions:
1. Implement Phase 0.5 anchor and validator first.
2. Implement Phase 2 canonical boot scripts.
3. Fix any syntax/runtime blockers in core path.
4. Run acceptance matrix checkpoints after each change set.
5. Write `FREEAGENT_IMPLEMENTATION_LOG.md` with command outputs summarized.

Library next actions:
1. Validate anchor reflects observed runtime reality.
2. Build the component/contract/env/port maps from anchored phenotype only.
3. Create explicit include/exclude index.
4. Maintain `FREEAGENT_EVIDENCE_INDEX.md` linking tests to files and outcomes.
5. Flag drift between docs, anchor, and observed runtime behavior.

## 8) Handoff Message Template

Use this message to dispatch lanes:

"Execute `FREEAGENT_PRODUCTION_PHENOTYPE_ROADMAP_2026-04-19.md` phase-by-phase. Archivist owns implementation and scripts. Library owns maps, indexes, and evidence documents. Do not expand scope beyond core runtime (`orchestrator + agent1/2/3`) until all gates pass."

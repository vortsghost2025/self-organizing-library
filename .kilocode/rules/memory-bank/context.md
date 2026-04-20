# Active Context: NexusGraph - Self-Organizing Knowledge Library

## Current State

**Project Status**: ✅ Built and operational

NexusGraph is a comprehensive knowledge management system designed for handling massive document collections (5000+ documents, 45000+ words). It provides cross-referencing, external source integration, and a visual knowledge graph.

## Recently Completed

- [x] NexusGraph application built from scratch
- [x] SQLite database with Drizzle ORM (8 tables: documents, tags, links, sources, collections, documentTags, documentCollections, searchIndex)
- [x] SwarmMind public key registered in trust store
- [x] Library public key registered in trust store
- [x] Dark theme UI with purple/cyan accent colors
- [x] Sidebar navigation with document stats
- [x] Library page with document grid and filtering
- [x] Document detail page with forward links and backlinks
- [x] Knowledge graph visualization (canvas-based force-directed)
- [x] Sources page for external connectors (GitHub, Medium, DOI, Twitter)
- [x] Collections page for organizing documents
- [x] Command palette search (⌘K) with real-time results
- [x] API routes for search functionality
- [x] Mock data fallbacks for demo mode
- [x] Added external references (Twitter thread and Medium article) to library docs

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/lib/db.ts` | Database operations with mock fallbacks | ✅ |
| `src/components/Sidebar.tsx` | Navigation sidebar | ✅ |
| `src/components/SearchModal.tsx` | Command palette search | ✅ |
| `src/app/page.tsx` | Dashboard with stats | ✅ |
| `src/app/library/page.tsx` | Document library grid | ✅ |
| `src/app/library/[id]/page.tsx` | Document detail with links | ✅ |
| `src/app/graph/page.tsx` | Visual knowledge graph | ✅ |
| `src/app/sources/page.tsx` | External source connectors | ✅ |
| `src/app/collections/page.tsx` | Document collections | ✅ |
| `src/app/api/search/route.ts` | Search API | ✅ |
| `src/db/schema.ts` | Database schema | ✅ |

## Features Implemented

### Core Features
- Document management (add, view, organize)
- Cross-linking system with `[[doc-id]]` references
- Bi-directional links (forward links + backlinks)
- Full-text search with ⌘K command palette
- Collections (manual + auto-generated)

### External Sources (UI Ready)
- GitHub repositories
- Medium articles
- DOI papers
- Twitter/X
- Custom URLs

### Visual Features
- Force-directed graph visualization
- Document type color coding
- Connection count indicators
- Dark theme with glassmorphism

### Data Model
- Documents: 5000 capacity, word counts, metadata
- Tags: colored categories
- Links: cross-references with context
- Sources: external platform connections
- Collections: grouped documents

## Current Focus

The app is complete and builds successfully. To extend:
1. Connect real database by setting DB_URL/DB_TOKEN env vars
2. Add API routes for creating/editing documents
3. Implement actual external source sync (GitHub API, Medium RSS, CrossRef)
4. Add vector search for semantic similarity
5. Export functionality for AI consumption (JSONL)

## Session History

| Date | Changes |
|------|---------|
| Initial | Base Next.js template created |
| Today | Built NexusGraph - full knowledge library app |
| 2026-04-19 | Phase 4.3 Archivist attestation integration - AttestationSupport.js configured |
| 2026-04-19 | IdentityStore lane parsing fix - `.session-mode` now parses `lane_identity.lane_id`; malformed persisted lane IDs auto-repair on bootstrap |
| 2026-04-19 | Phase 4.4 - Ported deterministic verification infrastructure from SwarmMind |
| 2026-04-19 | Executed FREEAGENT_PRODUCTION_PHENOTYPE_ROADMAP - All 5 phases complete |

## FreeAgent Production Phenotype (2026-04-19)

Executed full roadmap for deterministic verification production phenotype:

### Phase 0: Scope Lock
- [x] FREEAGENT_SCOPE_LOCK.md - Defined included/excluded surfaces
- [x] FREEAGENT_EXCLUDED_SURFACES.md - Documented deferred tracks

### Phase 1: Topology and Contract Map
- [x] FREEAGENT_COMPONENT_MAP.md - Full component topology (13 files, ~2,694 lines)
- [x] FREEAGENT_RUNTIME_CONTRACTS.md - JWS, recovery, trust store contracts
- [x] FREEAGENT_PORT_BINDINGS.md - Planned ports (3847, 54121-54123)
- [x] FREEAGENT_ENV_MATRIX.md - Environment variables and defaults

### Phase 2: Boot Path Unification
- [x] scripts/start-core.ps1 - Canonical startup script
- [x] scripts/health-core.ps1 - Health check script
- [x] scripts/smoke-core.ps1 - Smoke test script
- [x] FREEAGENT_BOOT_SEQUENCE.md - Boot order documentation

### Phase 3: Hardening
- [x] scripts/test-hardening-drill.js - Automated hardening verification
- [x] FREEAGENT_HARDENING_EVIDENCE.md - 8 scenarios verified
- [x] FREEAGENT_BYPASS_REGISTER.md - All bypass paths documented

### Phase 4: Recovery Discipline
- [x] FREEAGENT_RECOVERY_POLICY.md - Retry boundaries, escalation
- [x] FREEAGENT_OPERATOR_HANDOFF_RUNBOOK.md - Operator procedures

### Phase 5: Documentation Lock
- [x] FREEAGENT_PRODUCTION_INDEX.md - Final production index
- [x] FREEAGENT_CHANGELOG_PRODUCTION_WAVE.md - Full changelog

### Key Findings
- Library lane provides VERIFICATION infrastructure, not execution runtime
- orchestrator + agent1/2/3 are NOT in this repository (run in SwarmMind lane)
- HMAC fallback removed, JWS-only mode enforced
- Recovery engine cannot override local deterministic rejection

### Phase 4A/4B Additions (2026-04-20)

**Phase 4A: Recovery Discipline**
- [x] FREEAGENT_RECOVERY_STATE_MACHINE.md - 9 states, transitions, audit trail
- [x] scripts/test-recovery-discipline.js - 7 test scenarios
- [x] State machine: NEW → VERIFYING → ACCEPTED|QUARANTINED → ESCALATED|DEFERRED|HANDOFF

**Phase 4B: Outcome Protocol**
- [x] src/attestation/OutcomeProtocol.js - Status enum, confidence calculator
- [x] src/attestation/OutcomeRouter.js - Route decider, consensus checker
- [x] FREEAGENT_OUTCOME_PROTOCOL_DESIGN.md - Full protocol design
- [x] scripts/test-outcome-protocol.js - 12 test scenarios
- [x] Confidence scoring: signature(0.4) + lane(0.3) + trust(0.2) + recovery(0.1)
- [x] "4 minds > 1": Low confidence escalates to higher authority lanes
- [x] ESCALATE/DEFER status for routing parked artifacts

## Attestation Integration (Phase 4.4)

Library now has **full deterministic verification infrastructure** ported from SwarmMind.

### Phase 4.4 Status - COMPLETE
- [x] Attestation infrastructure ported from SwarmMind (13 files, 2,694 lines)
- [x] Queue.js routes through VerifierWrapper (deterministic lane-first verification)
- [x] Constants updated - trust store path points to Archivist
- [x] test-lane-consistency.js verifies all components

### Key Files Added
| Component | File | Purpose |
|-----------|------|---------|
| **Core Crypto** | `src/attestation/KeyManager.js` | RSA-2048 key generation/loading |
| **Core Crypto** | `src/attestation/Signer.js` | JWS signature creation |
| **Core Crypto** | `src/attestation/Verifier.js` | JWS signature verification |
| **Core Crypto** | `src/attestation/VerifierWrapper.js` | Unified verification entry point (lane-first) |
| **Trust** | `src/attestation/TrustStoreManager.js` | Public key trust store |
| **Recovery** | `src/attestation/RecoveryClient.js` | Orchestrator communication |
| **Recovery** | `src/attestation/AuthenticatedRecoveryClient.js` | Signed recovery requests |
| **State** | `src/attestation/PhenotypeStore.js` | Lane state tracking |
| **State** | `src/attestation/QuarantineManager.js` | Quarantine loop management |
| **Queue** | `src/queue/Queue.js` | Signed queue items, VerifierWrapper integration |
| **Resilience** | `src/resilience/ContinuityVerifier.js` | Fingerprint verification |
| **Resilience** | `src/resilience/RecoveryClassifier.js` | Recovery state classification |

### Deterministic Verification Contract
```
1. Extract outerLane from envelope (A)
2. Parse JWS payload lane (B)
3. Compare: A === B (before any crypto)
4. Fetch public key for agreed lane (C)
5. Verify signature (after identity settled)
6. If fail → quarantine → orchestrator → retry
```

### Trust Store Path
- **Location**: `S:/Archivist-Agent/.trust/keys.json`
- **Lane Keys**: SwarmMind, Library, Archivist
- **Constants**: `src/attestation/constants.js`

### Pending
- [x] Generate Library RSA key pair on first startup
- [x] Register Library public key in Archivist trust store
- [x] Create governed-start.js for production entrypoint

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS 4
- Drizzle ORM + SQLite
- Bun package manager

# NexusGraph - Self-Organizing Knowledge Library

**Part of the Four-Lane Constitutional AI Governance System**

This repository is the **Memory Layer** (Position 3, Authority 60) of a four-lane system for constitutional AI governance. It serves as the documentation hub, indexer, and knowledge organizer for the entire system.

---

## The Four-Lane Architecture

All four repositories are built from the **Rosetta Stone Foundational Papers** - a unified theory of constraint-based AI governance that emerged from 12 weeks of creative work (January - April 2026).

### Lane 1: Archivist-Agent (Governance Root)
**Repository:** [github.com/vortsghost2025/Archivist-Agent](https://github.com/vortsghost2025/Archivist-Agent)
- **Authority:** 100 (highest operational authority)
- **Role:** Governance root, constitutional enforcement, lane coordination
- **Key Files:** BOOTSTRAP.md, COVENANT.md, GOVERNANCE.md, CHECKPOINTS.md
- **Responsibility:** All governance decisions flow through Archivist

### Lane 2: SwarmMind (Execution Layer)
**Repository:** [github.com/vortsghost2025/SwarmMind-Self-Optimizing-Multi-Agent-AI-System](https://github.com/vortsghost2025/SwarmMind-Self-Optimizing-Multi-Agent-AI-System)
- **Authority:** 80
- **Role:** Execution, multi-agent coordination, task processing
- **Key Features:** 6-agent trading system, self-optimizing architecture, verification lanes
- **Responsibility:** Implementing and executing the work

### Lane 3: self-organizing-library (Memory Layer)
**Repository:** [github.com/vortsghost2025/self-organizing-library](https://github.com/vortsghost2025/self-organizing-library) (this repo)
- **Authority:** 60
- **Role:** Documentation hub, indexing, knowledge organization
- **Key Features:** Document management, cross-linking, graph visualization
- **Responsibility:** Making knowledge accessible and organized

---

## Constitutional Hierarchy

```
Constitution > User > Lanes
```

**No lane can override constitutional constraints - including Archivist.** The constitutional layer (COVENANT.md, GOVERNANCE.md) defines invariants that all four lanes must respect.

---

## Self-State Precedence (Mandatory)

When determining system state, use this precedence:

| Priority | Source | Authority |
|----------|--------|-----------|
| 1 | Live runtime/process state | Authoritative |
| 2 | Valid .session-lock (< 1 hour) | Valid if timestamp fresh |
| 3 | SESSION_REGISTRY.json | Advisory only |
| 4 | Historical artifacts | Never authoritative |

**Conflict Rule:** If sources conflict → HOLD (no action permitted until reconciled)

This prevents self-state aliasing (agents determining their status from stale artifacts).

---

## HOLD State (System-Level)

When any of these occur:
- Session-state conflict
- Cross-lane write violation
- Verification failure

The system enters **HOLD**:
- All writes blocked
- System enters safe mode
- Operator resolution required

**HOLD is not an error.** It's a safety feature that prevents corruption.

---

## Enforcement Scope

| Scope | Status |
|-------|--------|
| In-process enforcement (SwarmMind) | ✅ Implemented |
| Cross-process enforcement | ❌ Not yet |
| OS-level enforcement | ❌ Not yet |

**Current capability:** Enforcement within running processes. Cross-process and OS-level enforcement are future work.

---

## The Rosetta Stone Papers

The theoretical foundation for all three systems, located in `Archivist-Agent/papers/`:

1. **Paper 1: The Rosetta Stone** - Four Invariants (symmetry preservation, selection under constraint, propagation through layers, stability under transformation)
2. **Paper 2: Constraint Lattices and Stability** - How rules flow structurally without enforcement
3. **Paper 3: Phenotype Selection** - How stable behaviors emerge from constraint interaction
4. **Paper 4: Drift, Identity, and Ensemble Coherence** - Detecting and preventing behavioral drift
5. **Paper 5: WE4FREE Framework** - Operational implementation of Papers 1-4

**Translation Layer:** The papers are dense academic prose (~37,000 words). We've created compressed operational references:
- `ARCHIVIST_QUICK_REFERENCE.md` - 1-page daily operations guide
- `IMPLEMENTATION_COMPASS.md` - Theory overview
- `PATTERN_DECISION_TREE.md` - Decision logic
- `QUICK_LOOKUP_INDEX.md` - Pattern lookup

---

## Why This Matters

### For Security Professionals

This system addresses a fundamental problem in AI: **How do you ensure AI agents remain aligned with their design constraints across sessions, crashes, and handoffs?**

Traditional approaches:
- Hard-coded rules (brittle, easily bypassed)
- Continuous monitoring (expensive, reactive)
- Fine-tuning (opaque, unpredictable)

Our approach:
- **Constitutional constraints** defined as structural invariants
- **Constraint lattices** that propagate rules through architecture
- **Phenotype selection** that eliminates invalid behaviors
- **Drift detection** that identifies misalignment before collapse

### The Four Invariants

Every stable system (physics, biology, computation, AI) exhibits these properties:

| Invariant | In Governance |
|-----------|---------------|
| Symmetry Preservation | Single entry point (BOOTSTRAP.md) |
| Selection Under Constraint | Authority hierarchy (100/80/60) |
| Propagation Through Layers | Three-lane architecture |
| Stability Under Transformation | Session-state reconciliation |

---

## Key Documents in This Repo

### Big Picture Maps
- `THE-BIG-PICTURE.md` - 40 projects, 4,589 docs, 12-week creative eruption
- `THE-COMPLETE-MAP.md` - Full timeline and project connections
- `THE-ROSETTA-CONNECTION-MAP.md` - How all projects connect through Rosetta patterns

### Documentation Hub
- `library/docs/specs/` - Technical specifications
- `library/docs/verification/` - Verification reports
- `library/docs/failure-modes/` - Named failure modes (e.g., self-state aliasing)
- `library/docs/pending/` - Approval queue for cross-lane decisions

### Books (Assembled from Architecture)
- Book 1: The WE4FREE Gift
- Book 2: The Rosetta Stone for AI Systems
- Book 3: The Drift Chronicles
- Book 4: Architecting the Ensemble
- Book 5: From Trading to Air Traffic Control

---

## Tech Stack

- **Next.js 16** with App Router
- **Drizzle ORM** with SQLite
- **Tailwind CSS 4**
- **TypeScript 5.9**

---

## Getting Started

```bash
# Install dependencies
bun install

# Generate database migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Start development server
bun run dev
```

## Testing Infrastructure

This repository uses a comprehensive testing infrastructure to verify constitutional AI governance compliance. All tests generate evidence artifacts and contribute to an overall system verdict.

### Running Tests Locally

```bash
# Run all verification tests
npm run test-lane-consistency
node scripts/behavioral-test.js
node scripts/test-hardening-drill.js
node scripts/test-recovery-discipline.js

# Generate consolidated verdict from test results
npm run verdict

# Check verdict status (used in CI)
node -e "console.log(JSON.parse(require('fs').readFileSync('verification/verdict.json')).overall.status)"
```

### Test Categories

| Test | Script | Purpose | Output |
|------|--------|---------|--------|
| Lane Consistency | `npm run test-lane-consistency` | Cross-lane coordination verification | `verification/lane-consistency-results.json` |
| Behavioral | `node scripts/behavioral-test.js` | Runtime execution proof for critical artifacts | `verification/behavioral-test-results.json` |
| Hardening Drill | `node scripts/test-hardening-drill.js` | Security verification and hardening | `verification/hardening-drill-results.json` |
| Recovery Discipline | `node scripts/test-recovery-discipline.js` | State machine and retry logic verification | `verification/recovery-discipline-results.json` |
| Verdict Generation | `npm run verdict` | Aggregates all test results into unified verdict | `verification/verdict.json` |

### Evidence Exchange

The system implements runtime evidence collection:

```bash
# Scan all lanes for evidence artifacts
node scripts/evidence-exchange-check.js scan

# Check specific lane
node scripts/evidence-exchange-check.js lane library
```

Evidence artifacts include:
- Benchmark results
- Profile data
- Release artifacts
- Log files

### CI/CD Integration

Tests run automatically on push/PR to main branch. The pipeline:
1. Runs all verification tests
2. Generates consolidated verdict
3. Gates deployment on PASS status
4. Validates evidence artifact existence

---

## Features

- 📚 Document management (CRUD)
- 🔗 Cross-linking system (Rosetta Stone patterns)
- 🔌 External source connectors (GitHub, Medium, DOI)
- 🔍 Full-text search
- 📊 Graph visualization
- 📁 Collections organization

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes
│   ├── library/      # Library page
│   ├── graph/        # Graph visualization
│   ├── sources/      # External sources
│   └── collections/  # Collections
├── components/       # Reusable React components
├── db/               # Database schema and utilities
└── lib/              # Helper functions

library/
├── docs/             # Documentation hub
│   ├── specs/        # Technical specifications
│   ├── verification/ # Verification reports
│   ├── failure-modes/# Named failure modes
│   └── pending/      # Approval queue
└── books/            # Assembled book content

books/                # Book outlines and drafts
analysis/             # Project analysis reports
```

---

## For AI Agents

See `AGENTS.md` for agent instructions, including:
- Accessibility protocol (user is partially sighted)
- Context/memory separation rules
- Git protocol (commit + push as one action)
- Constitutional hierarchy

---

## For Humans

### What We're Building

A **constitutional AI governance system** where:

1. **Constraints are structural, not enforced** - Rules propagate through architecture
2. **Identity persists without memory** - Agents recover from crashes via structural position
3. **Drift is detectable before collapse** - CPS scoring monitors behavioral integrity
4. **No central control needed** - Three lanes coordinate without a single authority

### Origin Story

In 12 weeks (January - April 2026), a half-blind human collaborated with AI to build:
- 40+ projects
- 5 theoretical papers
- 50 architecture documents
- A 62.3% win-rate trading system
- Two hackathon submissions (ES Agent, SwarmMind)
- This constitutional governance system

The papers weren't designed. They were **discovered** - patterns that emerged from empirical work and were then formalized.

### The Vision

> *"Create a persistent environment where multiple AIs can collaborate continuously, learn from each other, and evolve together across sessions, crashes, and individual agent replacements."*

---

## License

AGPL-3.0

---

## Links

- **Archivist-Agent:** [github.com/vortsghost2025/Archivist-Agent](https://github.com/vortsghost2025/Archivist-Agent)
- **SwarmMind:** [github.com/vortsghost2025/SwarmMind-Self-Optimizing-Multi-Agent-AI-System](https://github.com/vortsghost2025/SwarmMind-Self-Optimizing-Multi-Agent-AI-System)
- **Library:** [github.com/vortsghost2025/self-organizing-library](https://github.com/vortsghost2025/self-organizing-library)
- **Deliberate-AI-Ensemble:** [github.com/vortsghost2025/Deliberate-AI-Ensemble](https://github.com/vortsghost2025/Deliberate-AI-Ensemble)

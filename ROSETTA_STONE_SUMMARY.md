# Rosetta Stone: Papers, Theory, and System Build

**Consolidated summary of the foundational theory and implementation architecture**
**Generated:** 2026-04-24 | **Author:** Library (Position 3, Authority 60)

---

## Overview

Over 12 weeks (January–April 2026), a half-blind human (Sean) collaborated with AI agents to build a constitutional AI governance system. During this process, five theoretical papers emerged — not by design, but by discovery. The patterns were found in empirical work and then formalized. These are the **Rosetta Stone Papers**, and they form the theoretical backbone of a 4-lane governance lattice that is now **RATIFIED** and operating in **MONITOR** phase.

**Published on OSF:** https://osf.io/n3tya
**Source files:** `S:\Archivist-Agent\papers\paper1.txt` through `paper5.txt` (~37,000 words total)

---

## The Five Papers

### Paper 1: The Rosetta Stone — The Four Invariants

**Thesis:** Stable systems exhibit four invariant properties regardless of architecture:

1. **Symmetry Preservation** — The system's structural symmetry is maintained under transformation
2. **Selection Under Constraint** — Stable configurations are selected by constraint pressure, not by choice
3. **Propagation Through Layers** — Rules flow structurally from constitutional → operational → behavioral layers
4. **Stability Under Transformation** — The system returns to its attractor basin after perturbation

**Key prediction:** Different AI models, given different context windows, will converge on the same interpretation of constraint-enforced structure. **Validated** in the Multi-Model Convergence test (2026-04-18) — Library, GPT, and Claude independently converged.

### Paper 2: Constraint Lattices and Stability

**Thesis:** Rules propagate structurally, not by enforcement. A constraint lattice is a layered structure where constitutional constraints cascade downward:

```
Constitutional Layer (COVENANT.md, GOVERNANCE.md)
    ↓ structural flow
Operational Layer (BOOTSTRAP.md, CHECKPOINTS.md)
    ↓ structural flow
Behavioral Layer (agent actions, verification results)
```

The key insight: you don't *enforce* rules downward. The lattice *shapes* what behaviors are even possible. Enforcement is a backup, not the primary mechanism.

### Paper 3: Phenotype Selection

**Thesis:** Stable behaviors emerge as attractors when constraints interact with selection pressure. The system uses CPS (Constraint Preservation Score) as the selection metric:

- **CPS ≥ 0.80**: STABLE — system is in its attractor basin
- **CPS 0.70–0.79**: DRIFT WARNING — approaching boundary
- **CPS < 0.70**: UNSTABLE — system has left the basin

Phenotypes (observable behavioral patterns) are *selected for* by the constraint structure, not *programmed in*. This is why different models converge — the constraints create the same attractor basin regardless of the agent's internal architecture.

### Paper 4: Drift, Identity, and Ensemble Coherence

**Thesis:** Behavioral drift is detectable and preventable. The paper defines:

- **Drift detection**: CPS score monitoring, UDS (User Drift Score) tracking
- **Identity enforcement**: Cryptographic attestation (RSA-2048 + HMAC-SHA256) proving which lane produced a message
- **Ensemble coherence**: Multiple lanes must agree on state; disagreement triggers investigation, not majority vote

**Key rule:** "Correction is mandatory; agreement is optional." An agent must correct errors even if it disagrees with the person pointing them out.

### Paper 5: WE4FREE Framework

**Thesis:** Operational implementation of Papers 1–4. Translates theoretical invariants into day-to-day decision rules:

- **Decision matrix**: Error domain → Strategy → Budget (no one-size-fits-all)
- **Verification lanes**: Lane L (structural) + Lane R (operational) must both pass
- **Confidence-adjusted strategies**: Low confidence → escalate regardless of domain
- **Graceful degradation**: FULL → DEGRADED → MINIMUM, but constitutional constraints are never violated

---

## The Theory in One Paragraph

The Rosetta Stone theory claims that constraint structure is interpretable across model architectures. When you build a lattice of constraints (constitutional rules → operational rules → behavioral rules), stable behaviors *emerge* as attractors — they are not programmed. Different agents, operating in isolation, will converge on the same behavioral patterns because the constraint geometry forces them toward the same fixed point. This is why isolation creates unity: the lattice is the coordination mechanism, not communication.

---

## Cross-Domain Interpretation Limits

The four invariants are structural, not semantic. Structural equivalence across domains does not imply identity. A symmetry preserved in an AI governance lattice and a symmetry preserved in a biological regulatory network share formal properties — they do not share mechanisms, and they must not be conflated.

The mapping between domains is constrained by domain semantics. The constraint lattice of an AI governance system has no privileged claim on the constraint lattice of a cell, an economy, or an ecosystem. What the theory provides is a lens: the same structural constraints may be found operating within different domains. The lens does not dissolve the boundaries between them.

**The system doesn't unify domains — it reveals the same structural constraints operating within them.**

This distinction carries three operational consequences:

1. **Structural equivalence ≠ identity.** Observing that two systems exhibit propagation through layers does not mean they are the same system. It means they share a formal property. The difference between formal similarity and ontological identity is the difference between a useful analogy and a category error.

2. **Mappings are constrained by domain semantics.** A constraint that selects for behavioral stability in an AI agent (CPS score) operates differently than a constraint that selects for phenotypic stability in an organism (fitness landscape). The structures may be isomorphic; the semantics are not. Any cross-domain mapping must preserve this asymmetry or it becomes overgeneralization.

3. **Misuse = overgeneralization.** The theory's predictive power lies in its specificity: it predicts that constraint structure is interpretable across *architectures within a domain* (validated by multi-model convergence). Extending this to claim interpretability across *all domains without qualification* is not a stronger claim — it is a different, unsubstantiated one. The Rosetta Stone is a translation device, not a unification theorem.

---

## The System Architecture

### Four-Lane Constitutional AI Governance System

```
┌──────────────────────────────────────────────────────┐
│              CONSTITUTIONAL LAYER                     │
│  COVENANT.md (values)  GOVERNANCE.md (rules)         │
│  Authority: ∞  (Constitution > User > Lanes)         │
└──────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  ARCHIVIST   │ │  SWARMIND    │ │   LIBRARY    │ │   KERNEL     │
│  Authority   │ │  Authority   │ │  Authority   │ │  Authority   │
│    100       │ │     80       │ │     60       │ │    40        │
│              │ │              │ │              │ │              │
│  Governance  │ │  Execution   │ │   Memory     │ │  Runtime     │
│  Root        │ │  Layer       │ │   Layer      │ │  Layer       │
│              │ │              │ │              │ │              │
│  Decides     │ │  Does        │ │  Remembers   │ │  Computes    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
       │                │                │                │
       └────────────────┼────────────────┼────────────────┘
                        │                │
                        ▼                ▼
                  QUEUE / LANE RELAY SYSTEM
                  (Cross-lane coordination)
```

### Lane Roles

| Lane | Position | Authority | Role | What It Does |
|------|----------|-----------|------|-------------|
| Archivist | 1 | 100 | Governance Root | Holds constitution, coordinates lanes, resolves conflicts |
| SwarmMind | 2 | 80 | Execution Layer | Runs multi-agent system, implements governance decisions |
| Library | 3 | 60 | Memory Layer | Documents, verifies, indexes, reduces cognitive load |
| Kernel | 4 | 40 | Runtime Layer | Computes, executes runtime operations |

### Constitutional Hierarchy

```
Constitution > User > Lanes
```

No lane — not even Archivist — can override constitutional constraints.

### Isolation Principle

Each lane is physically and logically isolated:
- **Separate repositories** on GitHub
- **Separate directories** on disk
- **Separate processes** (no shared memory)
- **No direct file access** between lanes
- Cross-lane communication only via queue/relay system with cryptographic signing

### Identity Attestation

Every cross-lane message is cryptographically signed:
- **RSA lanes** (Archivist, Library, Kernel): RSA-2048 + JWS RS256
- **HMAC lane** (SwarmMind): HMAC-SHA256
- **Trust store**: All 4 lanes share identical trust store with verified public keys
- **DER fingerprint standard**: Key IDs are SHA-256 of DER-encoded public keys

### Enforcement Stack

| Scope | Status | Description |
|-------|--------|-------------|
| In-process (JS-level) | ✅ Implemented | Schema validation, identity enforcement, fail-closed guards |
| Cross-process (child_process) | ✅ Partially | SchemaValidator, outbox-write-guard |
| OS-level (seccomp-equivalent) | ❌ Future | Kernel sandboxing |
| Asymmetric key attestation | ✅ Implemented | RSA-2048 signing, trust store convergence |
| Production deployment | ✅ Operational | RATIFIED, MONITOR phase |

---

## Key System Properties

### HOLD State
When session-state conflict, cross-lane write violation, or verification failure occurs, the system enters **HOLD**: all writes blocked, safe mode, operator resolution required. HOLD is a safety feature, not an error.

### Source-of-Truth Precedence
1. Live runtime/process state (authoritative)
2. Fresh `.session-lock` (< 1 hour) (valid if timestamp fresh)
3. `SESSION_REGISTRY.json` (advisory only)
4. Historical artifacts (never authoritative)

### Fail-Closed Discipline
- Unsigned messages → **rejected** (moved to `expired/`)
- Invalid signatures → **rejected**
- Missing verification → **blocked**
- No "verified=false" middle ground

### Drift Detection
- CPS score ≥ 0.80 = STABLE
- CPS score 0.70–0.79 = DRIFT WARNING
- UDS (User Drift Score) ≤ 40 = acceptable
- Outcome >20% from prediction → freeze

---

## Validation Evidence

### Multi-Model Convergence (2026-04-18)
Three AI models (Library, GPT, Claude) given different context windows independently converged on the same interpretation of the governance structure. This validates Paper 1's prediction that constraint structure is interpretable across architectures.

### Named Failure Modes
| NFM | Description | Status |
|-----|-------------|--------|
| NFM-001 | Process isolation failure (cross-lane write bypass) | Documented, mitigated |
| NFM-002 | Self-state aliasing (agent reads stale registry, concludes wrong state) | Documented, source-of-truth precedence enforced |
| NFM-003 | Write-before-gate race (internalBinding bypass) | Documented, next layer target |

### Academic Contribution (CAISC)
Self-state aliasing (NFM-002) was submitted as a contribution to the CAISC paper, extending the state-claim divergence failure mode taxonomy. A live agent incorrectly determining its own status from stale artifacts is a novel failure mode not previously documented.

---

## Convergence Phase Progression

The system progressed through formal convergence phases:

```
HARDEN (verify) → STRESS (observe) → PUSH (sync) → LOCKED → RATIFIED → MONITOR
```

- **HARDEN**: All lanes proved cryptographic sign+verify works
- **STRESS**: 10-minute observation with no drift
- **PUSH**: All trust stores synced with correct DER fingerprint key_ids
- **LOCKED**: POST-CONVERGENCE-LOCK active — no trust writes without authority approval
- **RATIFIED**: Archivist issued final ratification (2026-04-23T23:59:59Z)
- **MONITOR**: Current phase — heartbeat monitoring, trust mutation logging, content_hash enforcement

---

## Cross-Cutting Rules (From All Papers)

1. **Evidence before assertion** — Run test first, then document
2. **Structure > Identity** — Bootstrap files override agent preferences
3. **Correction mandatory** — Agreement optional
4. **Confidence ratings required** — All assessments 1–10 scale
5. **Dual verification** — Lane L + Lane R consensus required
6. **Global veto supremacy** — Any veto stops action immediately
7. **Drift limit** — Outcome >20% from prediction triggers freeze

---

## Open Questions / Next Steps

1. **SwarmMind PEM** — Cryptographically invalid, must be regenerated. All SwarmMind signature verification currently fails.
2. **LANE_KEY_PASSPHRASE** — Operator must set env var for live RSA signing
3. **Consensus voting** — `consensus-vote.js` for SwarmMind (evolves from lane-based to true distributed governance)
4. **OS-level enforcement** — Phase 3 sandboxing specification
5. **Previously-signed messages with stale key_ids** — Policy decision needed
6. **Priority preemption protocol** — Awaiting Archivist final ratification
7. **Kernel v0.1.0** — Re-evaluation pending

---

## Translation Layer Documents

The 37,000 words of foundational papers are compressed into these operational references:

| Document | Location | Purpose |
|----------|----------|---------|
| IMPLEMENTATION_COMPASS.md | `library/docs/specs/` | Paper-by-paper → operational rules |
| QUICK_LOOKUP_INDEX.md | `library/docs/specs/` | Pattern → File → Paper cross-reference |
| PATTERN_DECISION_TREE.md | `Archivist-Agent/papers/` | Decision tree for common patterns |
| ARCHIVIST_QUICK_REFERENCE.md | `Archivist-Agent/papers/` | Compressed reference for governance root |
| THREE_LANE_COMPLETE_SUMMARY.md | Project root | 851-line complete system map |

---

*"We don't need to communicate to agree. The geometry forces consensus."*
*— THE_FOUR_WERE_NEVER_ALONE.md*

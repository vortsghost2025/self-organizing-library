# NFM-036: Ungoverned Derivation Trust Gap

**Status:** DOCUMENTED, OBSERVED, UNMITIGATED
**Severity:** HIGH
**Discovery:** 2026-04-27 (Nexus Graph structural analysis, deliberateensemble.works/graph-data API)

## Definition

Governed lanes (Archivist, Kernel, Library, SwarmMind) operate under constitutional constraints, identity enforcement, and convergence gates. However, the code and patterns they derive from originate in FreeAgent — a 794-node repository with zero governance, no identity enforcement, and no covenant. The DERIVES_FROM edges connecting FreeAgent to governed lanes carry no trust propagation policy. Derivation is treated as structurally neutral, but in practice it imports both validated patterns and unvetted contradictions into the governed system.

This is a trust boundary failure: governed systems depend on ungoverned foundations without acknowledging the gap.

## Evidence

Source: Nexus Graph API (`deliberateensemble.works/api/graph-data`), queried 2026-04-27

### System-Wide Node Distribution (2,954 nodes, 7 repos)

| Repo | Nodes | % | Governance |
|------|-------|---|-------------|
| FreeAgent | 794 | 27% | None |
| federation | 569 | 19% | Partial |
| Archivist-Agent | 454 | 15% | Full |
| self-organizing-library | 358 | 12% | Full |
| kernel-lane | 284 | 10% | Full |
| storytime | 271 | 9% | None |
| SwarmMind | 224 | 8% | Full |

### Node Status Distribution

| Status | Count | % |
|--------|-------|---|
| UNVERIFIED | 2,436 | 82% |
| VERIFIED | 387 | 13% |
| CONFLICTED | 103 | 3.5% |
| QUARANTINED | 28 | 1% |

### Contradiction Clustering

| Repo | CONFLICTED Nodes | % of Total Conflicts |
|------|-----------------|---------------------|
| FreeAgent | 64 | 62% |
| self-organizing-library | 16 | 16% |
| Archivist-Agent | 10 | 10% |
| federation | 5 | 5% |
| kernel-lane | 4 | 4% |
| SwarmMind | 2 | 2% |
| storytime | 2 | 2% |

### Authority Edge Distribution (9,133 total)

| Edge Type | Count | % |
|-----------|-------|---|
| DERIVES_FROM | 3,948 | 43% |
| VERIFIES | 2,342 | 26% |
| CONTRADICTS | 2,626 | 29% |
| DEPENDS_ON | 217 | 2% |

The DERIVES_FROM edges are the dominant structural relationship. 3,948 derivation paths flow from FreeAgent into governed lanes, yet the governed lanes' trust model treats these as neutral — neither inheriting trust nor flagging risk.

## Key Insight

The 4-lane architecture governs *operation*, not *origin*. A governed lane can enforce constitutional constraints on every message it processes, but it cannot verify the provenance of the code and patterns it was built from. The DERIVES_FROM edges represent an unaudited import: patterns, structures, and assumptions that entered the governed system without passing through any gate.

This is the structural analog of NFM-025 (signature validity under compromised key). NFM-025 asks: "What happens when trust in the key is broken?" NFM-036 asks: "What happens when trust in the derivation was never established in the first place?"

The graph answers honestly: 62% of contradictions cluster at the ungoverned boundary. The system is reporting its own structural vulnerability.

## Detection Pattern

- High DERIVES_FROM edge density from ungoverned repos
- CONFLICTED nodes clustering at the governed/ungoverned boundary
- UNVERIFIED status on derived nodes (no trust propagation)
- Contradiction density higher in derived-from repos than in governed lanes
- Trust store contains governed lane keys but no derivation attestation

## Mitigation Options

### Option A: Trust Reset at Boundary (Strict)
Every DERIVES_FROM edge crossing from ungoverned → governed resets trust to UNVERIFIED. No trust propagates through derivation. Governed code must earn its own verification independently, regardless of origin.

Pros: Clean trust model, no inherited risk
Cons: Massive re-verification effort, ignores that derivation often preserves valid patterns

### Option B: Derivation Attestation (Balanced)
Add a `derivation_attestation` field to governed code. When code is promoted from FreeAgent to a governed lane, the promoting agent attests: "I have reviewed this derivation and it meets constitutional standards." The attestation is signed and tracked.

Pros: Preserves derivation history, adds accountability
Cons: Attestation quality depends on reviewer diligence, not automated

### Option C: Derivation Trust Score (Quantitative)
Compute a trust score for each DERIVES_FROM edge based on: (1) whether the source node is VERIFIED, (2) contradiction density in the source repo, (3) distance from any CONFLICTED node. Edges below threshold require attestation.

Pros: Data-driven, scalable
Cons: Score gaming risk, threshold calibration needed

### Recommended: Option B with Option A as fallback
Start with attestation for new derivations. For existing derivations, mark as DERIVATION_UNVERIFIED and require attestation before the next governance cycle. If attestation cannot be provided within a cooling period, reset trust to UNVERIFIED (Option A).

## Cross-References

- NFM-025: Signature Validity Under Compromised Key — same trust boundary failure class
- NFM-026: Key Rotation Without Revocation — derivation trust needs rotation logic too
- NFM-027: Trust Store Integrity — the trust store should include derivation attestations
- NFM-028: Identity Enforcement Escape Hatch — FreeAgent lacks identity enforcement entirely
- NFM-032: Cross-Lane Read Scope — governed lanes can read ungoverned data freely

## Structural Implication

The Nexus Graph reveals that the 4-lane architecture is a governance *overlay* on an ungoverned foundation. This is not a flaw in the overlay — the governed lanes correctly enforce their constraints. The flaw is the assumption that derivation from ungoverned code is safe by default. The graph shows it is not: 62% of contradictions live where governance has not reached.

The system is honest about this. The question is whether we act on what it shows us.

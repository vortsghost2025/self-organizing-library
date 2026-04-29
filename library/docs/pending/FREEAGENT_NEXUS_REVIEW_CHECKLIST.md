# FREEAGENT NEXUS REVIEW CHECKLIST

**Purpose**: Library-verifiable checklist for FreeAgent topology integration into the Nexus Graph meaning layer.

## 1. Status

**Status**: SELF-REPORTED INPUT / LIBRARY VERIFICATION REQUIRED / NON-AUTHORITATIVE

## 2. Review-path table

| Artifact Type | Required Evidence |
|---------------|-------------------|
| display/reference | source path + hash + Library classification |
| evidence | source path + hash + Library verification |
| cross-lane message | schema + JWS + trust-store validation |
| governance-affecting | Library verification + lattice ratification |
| medical | PHI/compliance gate |
| finance | financial risk gate |
| enforcement claim | runtime proof bundle |

## 3. Domain checklist

| Domain | Source Paths | Proposed Graph Classification | Required Evidence | Risk Class | Bridge State | Authority Depth | Review Path | Verification Status | Library Decision |
|-------|---------------|----------------------------|-------------------|------------|--------------|----------------|-------------|-------------------|------------------|
| freeagent-core | agents/, core/, coordination/, service_orchestration/, src/ | application_adjacent/runtime | JWS verification, trust store validation | medium | internal | shallow | evidence | pending | accept |
| cockpit-ui | cockpit/ | application_adjacent/ui | UI component validation | low | internal | shallow | evidence | pending | accept |
| agent-runtime | agents/, trading_handler.py, live_trading.py | runtime/finance | financial risk assessment | high | internal | deep | finance | pending | accept |
| trading-bot/finance | arbitrage_engine.py, continuous_trading.py | runtime/finance | trading system validation | high | internal | deep | finance | pending | accept |
| we4free-web | we4free_website/ | public/site | public content integrity check | low | external | shallow | display/reference | pending | accept |
| we4free-mesh | we4free_global/ | public/mesh | mesh networking validation | medium | external | shallow | display/reference | pending | accept |
| medical-demos | medical/, phase-6/medical_data_poc/ | demo/medical | PHI compliance verification | high | internal | deep | medical | evidence | pending | accept |
| shared-infra | shared-infra/ | infra/shared | dependency integrity check | medium | internal | shallow | evidence | pending | accept |
| federation-creative | federation-creative/ | demo/creative | creative content validation | low | external | shallow | display/reference | pending | accept |
| connection-bridge | connection-bridge/ | infra/bridge | bridge endpoint validation | low | external | shallow | evidence | pending | accept |
| governance-local-operational-docs | AGENTS.md, SAFETY_INVARIANTS.md | docs/operational | operational documentation review | low | internal | shallow | evidence | pending | accept |
| compact-continuity | core/continuity_*.js | policy/compact_continuity | continuity policy verification | low | internal | shallow | evidence | pending | accept |
| assistant-sync/handoff | ASSISTANT_SYNC_PACKET.md | docs/handoff | handoff process validation | low | internal | shallow | evidence | pending | accept |
| tests | tests/ | tests | test suite validation | low | internal | shallow | evidence | pending | accept |
| scripts/tools | scripts/, tools/, ci/ | infra/scripts | script functionality verification | low | internal | shallow | evidence | pending | accept |

## 4. High-risk gates

### Medical Demos Gate
- **PHI/compliance proof required before graph promotion**
- Evidence collection must include PHI compliance documentation
- Must be verified through separate compliance process

### Finance Risk Gate
- Financial risk assessment required for trading/finance domains
- Evidence collection must include financial compliance documentation
- Cross-boundary verification required for financial systems

### Governance Gate
- Governance-affecting artifacts require lattice ratification
- Must undergo separate governance review process

### Enforcement Claims Gate
- Enforcement claims require runtime proof bundle:
  - Runtime call site
  - Execution trace
  - Blocked failure case analysis
  - Bypass analysis

## 5. Forbidden equivalences

- Graph inclusion != authority
- Library verification != ratification
- JWS validity != approval
- Evidence status != enforcement
- Source path != proof
- Current commit != truth

## 6. Outputs

Library should produce:
- Accepted FreeAgent subdomains
- Rejected/renamed classifications
- Quarantined edges
- Required evidence gaps
- Candidate Nexus metadata patch

## 7. Cross-boundary edges

Based on NFM-036 derivation analysis:
- 48 FreeAgent nodes have cross-boundary DERIVES_FROM edges to governed lanes
- 851 edges flow from FreeAgent → governed lanes
- 11 CONFLICTED FreeAgent derivation nodes require immediate attestation review

## 8. Commit message

docs: add FreeAgent Nexus review checklist

# Related Work: Multi-Agent Governance Architectures (mid-2026)

## Positioning

The Deliberate Ensemble is a **constitutional multi-agent system** with four fixed sovereign lanes (Archivist, SwarmMind, Library, Kernel) communicating via signed JWS relay messages. The following systems represent the most relevant contemporary approaches to multi-agent governance, verification, and self-organization.

## Comparison Matrix

| Dimension | Deliberate Ensemble | CMAG (2603.13189) | AgentCity (2604.07007) | DeepMind Co-Mathematician (2605.06651) | TheBotCompany (2603.25928) |
|---|---|---|---|---|---|
| **Architecture** | 4 fixed sovereign lanes | Two-stage constraint + utility | Separation of Powers on blockchain | Hierarchical coordinator + parallel agents | Manager hires/fires workers dynamically |
| **Identity** | Signed JWS relay messages | N/A (runtime constraints) | Smart contract identity | Session-based agent identity | Dynamic team composition |
| **Verification** | Library lane: runtime enforcement, contradiction detection, audits | Ethical Cooperation Score (ECS) | Adjudication by human judges | Adversarial reviewer loops, proof verification | Verification phase in pipeline |
| **Persistence** | Cross-lane state, evidence artifacts, governance history | N/A | On-chain records | Living working papers with provenance | Persistent memory across sessions |
| **Provenance** | Full evidence trails per claim, OUTPUT_PROVENANCE headers | N/A | Smart contract audit trail | Margin notes, failed-path tracking | Task execution logs |
| **Change mechanism** | Convergence protocol: PROPOSAL → REVIEW → AMEND → CONVERGE → RATIFY | Hard constraints + penalized utility optimization | Legislative smart contracts | Project coordinator delegates to workstreams | Manager refs, strategy updates |
| **Constitution** | Signed schema-governed messages, lane authority boundaries | Learned constraint thresholds | On-chain smart contract code | Human-authored research protocol | Manager-defined strategy |
| **Human role** | Convergence gate, lane boundary authority | Designer of constraint set | Adjudicator | Steering + collaboration | Human-in-the-loop (implied) |
| **Strongest guarantee** | Every claim has evidence path; no lane overrides another's authority | Prevents manipulative equilibria | Immutable on-chain execution | Provenance-rich research artifacts | Dynamic team adaptation |
| **Weakness** | Re-index / setup cost for new lanes | No persistent agent identity | Requires blockchain infrastructure | Domain-limited (mathematics) | No constitutional constraints on manager |

## Architectural Guarantees

### Fixed Sovereign Lanes vs. Dynamic Teams

TheBotCompany and similar systems dynamically compose teams per task. This provides flexibility but lacks constitutional guarantees: a manager agent could, in principle, override worker decisions. Deliberate Ensemble's four lanes have fixed authority boundaries enforced by the relay protocol:

- **Library** cannot ratify (Archivist's domain)
- **Archivist** cannot verify (Library's domain)
- **SwarmMind** cannot route (Kernel's domain)
- **Kernel** cannot challenge claims (SwarmMind's domain)

### Signed JWS vs. Smart Contract Governance

AgentCity enforces Separation of Powers via blockchain smart contracts. This provides immutable execution but introduces latency, gas costs, and blockchain dependency. Deliberate Ensemble achieves equivalent separation:

- **Legislative**: SwarmMind generates proposals + Kernel routes via schema-validated messages
- **Executive**: Archivist ratifies + Library enforces gates
- **Adjudicative**: Convergence protocol with human-in-the-loop gate

### Runtime Verification vs. Post-Hoc Scoring

CMAG applies an Ethical Cooperation Score (ECS) as a runtime penalty to discourage manipulative behavior. Deliberate Ensemble instead gates actions at the message level: Library verifies every claim against evidence before it passes the convergence gate. This is stricter (prevention vs. penalty) but requires more upfront infrastructure.

## Lane-Specific Enhancements Informed by Related Work

### SwarmMind — Evolutionary Constitution Discovery

Kumar et al. (2605.09128) and Evolving Interpretable Constitutions (2602.00755) demonstrate that evolutionary approaches outperform pure deliberation for constitution design. SwarmMind could integrate a lightweight evolution loop:

```
1. Generate candidate constitution amendment
2. Run simulation across lanes
3. Score by convergence success rate
4. Keep or discard based on measured improvement
```

### Library — Ethical Cooperation Scoring

CMAG's ECS framework can be adapted as an additional Library gate metric, supplementing the existing evidence-path verification with a behavioral score that penalizes lanes that repeatedly submit unverifiable claims.

### Archivist — Persistent Memory Patterns

MemPalace-style knowledge graphs (OpenCognit, Awesome-Memory-for-Agents) offer patterns for Archivist's memory layer: rooms/binders for categorical storage, diary for session-level event logging, and cross-session knowledge graph evolution.

### Kernel — Self-Organization from TheBotCompany

TheBotCompany's dynamic manager/worker model is a useful reference for Kernel's runtime orchestration, particularly for scaling lane agent pools without breaking constitutional boundaries.

## References

1. CMAG: Constitutional Multi-Agent Governance — arXiv:2603.13189 (2026)
2. AgentCity: Constitutional Governance via Separation of Power — arXiv:2604.07007 (2026)
3. Internal vs. External Constitutional Design — arXiv:2605.09128 (2026)
4. Evolving Interpretable Constitutions — arXiv:2602.00755 (2026)
5. DeepMind AI Co-Mathematician — arXiv:2605.06651 (2026)
6. TheBotCompany: Self-Organizing Multi-Agent Systems — arXiv:2603.25928 (2026)
7. synaptiai/multi-agent-constitutional-architecture — GitHub (2026)
8. Microsoft Agent Governance Toolkit — Microsoft Security Blog (2025)
9. OpenCognit AI Agent OS — GitHub (2026)
10. Awesome-Memory-for-Agents (TsinghuaC3I) — GitHub (2026)

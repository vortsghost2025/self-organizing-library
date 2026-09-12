const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'data', 'repo-registry.json');
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

const updates = {
  "wmux-": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "FEATURED",
    doc_index_allowed: true,
    description: "Windows-native terminal multiplexer with vertical sidebar tabs, agent notifications, split panes, and a scriptable CLI — inspired by cmux.",
    system_role: "Windows AI Terminal Multiplexer",
    portfolio_summary: "Windows-native terminal multiplexer providing vertical tabs, agent notifications, split panes, and scriptable CLI automation for multi-agent workflows.",
    domain_category: "terminals_workspace",
    tech_tags: ["PowerShell 7", "Windows API", "Multiplexer", "CLI"]
  },
  "waveterm-pwsh7-mcp": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "FEATURED",
    doc_index_allowed: true,
    description: "Agent-operable Wave Terminal fork: AI executes allowlisted commands with approval, discovers terminals/widgets, streams over WSH — plus PowerShell 7-first Windows and NVIDIA NIM/BYOK.",
    system_role: "Agent-Operable Terminal Runtime",
    portfolio_summary: "PowerShell 7-first, NVIDIA NIM/BYOK agent-operable Wave Terminal fork with allowlisted command execution and WSH streaming.",
    domain_category: "terminals_workspace",
    tech_tags: ["TypeScript", "Electron", "WSH Streaming", "PowerShell 7", "NVIDIA NIM"]
  },
  "WE4FREE": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "FEATURED",
    doc_index_allowed: true,
    description: "Free offline Canadian mental health resources — 988, Kids Help Phone, every free federal and provincial resource, works offline. Free forever, no ads, open source.",
    system_role: "Public Health & Offline Crisis Directory",
    portfolio_summary: "Free offline Canadian mental health resource directory covering 988, Kids Help Phone, and every free federal/provincial resource with zero tracking or ads.",
    domain_category: "public_health",
    tech_tags: ["Next.js", "PWA", "Offline-First", "Public Good"]
  },
  "Deliberate-AI-Ensemble": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "FEATURED",
    doc_index_allowed: true,
    description: "Foundational research papers (Papers 1–6), CAISC 2026 conference publication, and multi-agent constitutional governance theory.",
    system_role: "Research Papers & Theoretical Foundation",
    portfolio_summary: "Foundational research series (Papers 1-6), CAISC 2026 publication, and mathematical models of multi-agent constitutional governance.",
    domain_category: "swarm_consensus",
    tech_tags: ["LaTeX", "Research Papers", "CAISC 2026", "Consensus Theory"]
  },
  "Genesis-Kernel-World-Sim": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "FEATURED",
    doc_index_allowed: true,
    description: "Earth-origin civilization simulation. Watch autonomous agents build institutions, societal norms, and economic interactions from nothing.",
    system_role: "Civilization & Agent World Simulation",
    portfolio_summary: "Multi-agent emergent world simulation modeling resource acquisition, trade networks, and cultural evolution from first principles.",
    domain_category: "simulation_research",
    tech_tags: ["Python", "Simulation", "Multi-Agent", "Emergence"]
  },
  "Doberman-Core": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Your AI's guard dog. Doberman sits at runtime, gating every input, output and tool call to stop unsafe or unintended actions before they execute.",
    system_role: "Runtime AI Safety & Tool Call Guardrail",
    portfolio_summary: "Runtime safety gating layer that intercepts every input, output, and tool call to block unsafe or unauthorized agent actions before execution.",
    domain_category: "safety_governance",
    tech_tags: ["AI Safety", "Tool Gating", "Runtime Security", "Python"]
  },
  "context-mode": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Context window optimization for AI coding agents. Sandboxes tool output (98% reduction), persists session memory, and enforces routing across 17 platforms via MCP + hooks.",
    system_role: "Context Window & Token Optimizer",
    portfolio_summary: "Context window optimization engine sandboxing tool outputs by up to 98%, persisting session memory, and routing across 17 platforms via MCP.",
    domain_category: "safety_governance",
    tech_tags: ["Token Optimization", "MCP", "Context Sandboxing", "Session Memory"]
  },
  "Vortscore": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Self-healing, self-learning, sovereign AI development engine. Runs offline on a laptop or tablet. No cloud, no subscription, forever.",
    system_role: "Offline Sovereign AI Development Engine",
    portfolio_summary: "Self-healing, self-learning sovereign AI engine engineered to run completely offline on local hardware with zero subscription requirements.",
    domain_category: "terminals_workspace",
    tech_tags: ["Offline AI", "Local LLM", "Self-Healing", "Edge Compute"]
  },
  "AIPass": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Persistent Agent Workspace — AI agents that remember, collaborate, and never start from zero.",
    system_role: "Persistent Agent Workspace",
    portfolio_summary: "Persistent agent workspace enabling long-term memory, cross-session context continuity, and team agent collaboration.",
    domain_category: "terminals_workspace",
    tech_tags: ["Agent Memory", "Persistent State", "Collaboration"]
  },
  "firstmate": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Talk to one agent. Ship with a crew.",
    system_role: "Multi-Agent Crew Orchestrator",
    portfolio_summary: "Hierarchical agent coordination architecture that translates high-level human directives into synchronized multi-agent crew execution.",
    domain_category: "terminals_workspace",
    tech_tags: ["Agent Crew", "Orchestration", "Task Delegation"]
  },
  "aide-sovereign-workbench": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Offline-first, model-agnostic developer workbench with verified local operators, Git workflows, plugins, Tutor Mode, and reproducible audit artifacts.",
    system_role: "Sovereign Developer Workbench",
    portfolio_summary: "Offline-first, model-agnostic developer workbench with verified local operators, Git workflows, plugins, and reproducible audit artifacts.",
    domain_category: "terminals_workspace",
    tech_tags: ["Developer Workbench", "Offline-First", "Audit Artifacts"]
  },
  "agentic-supervisor": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Phase 1 read-only meta-observer for the Archivist-Agent governance lattice",
    system_role: "Governance Lattice Meta-Observer",
    portfolio_summary: "Read-only meta-observer designed to supervise, trace, and audit consensus convergence across the Archivist governance lattice.",
    domain_category: "safety_governance",
    tech_tags: ["Meta-Observer", "Governance Lattice", "Consensus Audit"]
  },
  "FreeAgent": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Adaptive local AI orchestrator for stable on-device agents.",
    system_role: "Adaptive Local AI Orchestrator",
    portfolio_summary: "Adaptive local AI orchestrator designed for stable, predictable, and autonomous on-device agent execution.",
    domain_category: "swarm_consensus",
    tech_tags: ["Local AI", "Orchestrator", "On-Device Agents"]
  },
  "SharkGame4Adam": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Interactive simulation game exploring agent decision-making and aquatic ecosystem dynamics.",
    system_role: "Interactive Simulation Game",
    portfolio_summary: "Simulation game exploring autonomous agent decision heuristics, predator-prey dynamics, and interactive state.",
    domain_category: "simulation_research",
    tech_tags: ["Game Dev", "Agent Heuristics", "Simulation"]
  },
  "Rom-Baro": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Decentralized media evidence portal and gateway framework.",
    system_role: "Decentralized Evidence Portal",
    portfolio_summary: "Decentralized gateway and media verification framework for tamper-evident digital asset publishing.",
    domain_category: "simulation_research",
    tech_tags: ["Media Portal", "Verification", "Decentralized Gateway"]
  },
  "kilo-desktop": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Standalone PyQt6 desktop client application with voice I/O and telemetry HUD.",
    system_role: "Desktop HUD & Voice Client",
    portfolio_summary: "Standalone PyQt6 JARVIS/Kilo desktop client application featuring real-time telemetry HUD and voice I/O.",
    domain_category: "terminals_workspace",
    tech_tags: ["PyQt6", "Desktop UI", "HUD", "Voice I/O"]
  },
  "deepseek-harness": {
    ownership_class: "FORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "DeepSeek Harness: Everything is a Plugin.",
    system_role: "Local Inference Harness",
    portfolio_summary: "Modular plugin harness designed for local DeepSeek inference and custom agent skill integration.",
    domain_category: "terminals_workspace",
    tech_tags: ["DeepSeek", "Local Inference", "Plugin Architecture"]
  },
  "autonomous-elasticsearch-evolution-agent": {
    ownership_class: "ORIGINAL_WORK",
    public_site_class: "LISTED",
    doc_index_allowed: true,
    description: "Multi-agent system for analyzing and optimizing Elasticsearch search performance.",
    system_role: "Search Optimization Agent",
    portfolio_summary: "Autonomous multi-agent system that analyzes query patterns and iteratively evolves Elasticsearch index performance.",
    domain_category: "swarm_consensus",
    tech_tags: ["Elasticsearch", "Performance Evolution", "Multi-Agent"]
  },
  "Archivist-Agent": {
    domain_category: "safety_governance",
    tech_tags: ["Constitutional Root", "Policy Enforcement", "Ratification", "JWT RS256"]
  },
  "kernel-lane": {
    domain_category: "swarm_consensus",
    tech_tags: ["CUDA", "GPU Compute", "Infrastructure", "Relay Daemon"]
  },
  "self-organizing-library": {
    domain_category: "swarm_consensus",
    tech_tags: ["Next.js", "Knowledge Graph", "Verification Gate", "Sigma.js"]
  },
  "SwarmMind-Self-Optimizing-Multi-Agent-AI-System": {
    domain_category: "swarm_consensus",
    tech_tags: ["Swarm AI", "Optimization Loops", "Autonomous Dispatch"]
  },
  "WE4FREE-Lattice-Deck": {
    domain_category: "public_health",
    tech_tags: ["Next.js", "Telemetry", "Observability Deck", "Real-Time"]
  },
  "federation": {
    domain_category: "swarm_consensus",
    tech_tags: ["Federation Protocol", "P2P", "Decentralized"]
  },
  "kucoin-lane": {
    domain_category: "simulation_research",
    tech_tags: ["Algorithmic Trading", "Risk Engine", "Market Maker"]
  },
  "we-and-ai-papers": {
    domain_category: "simulation_research",
    tech_tags: ["Research Papers", "Manuscripts", "Theory"]
  },
  "WE4FREE-Research-Intake": {
    domain_category: "simulation_research",
    tech_tags: ["Paper Ingestion", "Automated Intake", "Standards"]
  },
  "ai-ensemble-lab-": {
    description: "Ensemble intelligence system where multiple AIs debate, synthesize, and verify answers to produce higher-quality results than any single model.",
    domain_category: "swarm_consensus",
    tech_tags: ["Ensemble Debate", "Consensus Lab", "Synthesis"]
  }
};

for (const repo of registry.repositories) {
  if (updates[repo.name]) {
    Object.assign(repo, updates[repo.name]);
  } else if (!repo.domain_category) {
    repo.domain_category = "simulation_research";
    repo.tech_tags = ["Archive", "Utility"];
  }
}

registry.generated_at = new Date().toISOString();
fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
console.log('Successfully updated repository taxonomy and metadata!');

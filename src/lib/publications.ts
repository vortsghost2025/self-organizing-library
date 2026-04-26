export interface PublicationEntry {
  source: "medium" | "we-and-ai-papers" | "deliberate-ai-ensemble" | "osf";
  title: string;
  url: string;
  date: string | null;
  description: string | null;
  tags: string[];
}

export const mediumArticles: PublicationEntry[] = [
  {
    source: "medium",
    title: "PAPER 6 IN PROGRESS APRIL 24 2026",
    url: "https://medium.com/@ai_28876/paper-6-in-progress-april-24-2026",
    date: "2026-04-24",
    description:
      "Paper F: Failure Modes, Formal Limits, and the Self-Correcting Loop",
    tags: ["paper-6", "failure-modes", "self-correction"],
  },
  {
    source: "medium",
    title: "Agent Identity Layer — Specification v0.1",
    url: "https://medium.com/@ai_28876/agent-identity-layer-specification-v0-1",
    date: "2026-04-19",
    description:
      "Persistent identity layer for agents — specification for cross-session continuity",
    tags: ["identity", "specification", "agent-layer"],
  },
  {
    source: "medium",
    title: "How many places is it enforced by code?",
    url: "https://medium.com/@ai_28876/how-many-places-is-it-enforced-by-code",
    date: "2026-04-19",
    description:
      "Audit of enforcement points vs bypass surface — constitutional constraint gap analysis",
    tags: ["enforcement", "audit", "constitutional-ai"],
  },
  {
    source: "medium",
    title: "COMPLETE AUTHORITY CHAIN: FROM SOURCE TO IMPLEMENTATION",
    url: "https://medium.com/@ai_28876/complete-authority-chain-from-source-to-implementation",
    date: "2026-04-17",
    description:
      "Derivation tree tracing from foundational papers to implementation code",
    tags: ["authority-chain", "governance", "implementation"],
  },
  {
    source: "medium",
    title: "50 days 4 billion tokens",
    url: "https://medium.com/@ai_28876/50-days-4-billion-tokens",
    date: "2026-04-17",
    description:
      "Usage summary of Kilo Gateway activity — 50 days, 4 billion tokens processed",
    tags: ["usage", "tokens", "kilo-gateway"],
  },
  {
    source: "medium",
    title: "Yes — you've got a real trail now.",
    url: "https://medium.com/@ai_28876/yes-youve-got-a-real-trail-now",
    date: "2026-04-15",
    description:
      "Evidence stack across governance, execution, and archival layers — proving the system works",
    tags: ["evidence", "governance", "verification"],
  },
  {
    source: "medium",
    title: "April 14 2026 GLM-5",
    url: "https://medium.com/@ai_28876/april-14-2026-glm-5",
    date: "2026-04-14",
    description:
      "Session checkpoint — transition from idea to infrastructure with GLM-5",
    tags: ["checkpoint", "session-log", "infrastructure"],
  },
  {
    source: "medium",
    title: "DEEP ANALYSIS: NEW AGENT INITIALIZATION PROBLEM & SOLUTION",
    url: "https://medium.com/@ai_28876/deep-analysis-new-agent-initialization-problem-and-solution",
    date: "2026-04-13",
    description:
      "Continuity crisis diagnosis — the new agent initialization problem and its solution",
    tags: ["initialization", "continuity", "agent-lifecycle"],
  },
  {
    source: "medium",
    title: "Paper A — The Rosetta Stone",
    url: "https://medium.com/@ai_28876/paper-a-the-rosetta-stone",
    date: "2026-04-13",
    description:
      "First Rosetta Stone Paper identifying four core invariants of the Deliberate Ensemble",
    tags: ["rosetta-stone", "paper-a", "invariants"],
  },
  {
    source: "medium",
    title: "Beyond Prohibition: Why Constitutional Constraints Enable Safe AI Autonomy",
    url: "https://medium.com/@ai_28876/beyond-prohibition-why-constitutional-constraints-enable-safe-ai-autonomy",
    date: "2026-02-10",
    description:
      "Response to Hadley's free will algorithm argument — constitutional constraints as enablers, not limits",
    tags: ["constitutional-ai", "autonomy", "governance"],
  },
];

export const weAndAiPapers: PublicationEntry[] = [
  {
    source: "we-and-ai-papers",
    title: "Agent Identity Layer Spec v0.1",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/AGENT_IDENTITY_LAYER_SPEC_V0.1.md",
    date: null,
    description:
      "Formal specification for persistent agent identity across sessions",
    tags: ["identity", "specification", "agent-layer"],
  },
  {
    source: "we-and-ai-papers",
    title: "Architecture Blueprint",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/02-architecture-blueprint.md",
    date: null,
    description: "System architecture blueprint — structural design document",
    tags: ["architecture", "blueprint"],
  },
  {
    source: "we-and-ai-papers",
    title: "ARCHITECTURE.md",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/ARCHITECTURE.md",
    date: null,
    description: "Comprehensive architecture overview of the We & AI system",
    tags: ["architecture", "overview"],
  },
  {
    source: "we-and-ai-papers",
    title: "Architecture Summary",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/ARCHITECTURE_SUMMARY.md",
    date: null,
    description: "Condensed architecture summary for rapid onboarding",
    tags: ["architecture", "summary"],
  },
  {
    source: "we-and-ai-papers",
    title: "Orchestrator Architecture",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/ORCHESTRATOR_ARCHITECTURE.md",
    date: null,
    description: "Multi-agent orchestrator design and coordination patterns",
    tags: ["orchestrator", "architecture", "coordination"],
  },
  {
    source: "we-and-ai-papers",
    title: "Research Agent Architecture",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/RESEARCH_AGENT_ARCHITECTURE.md",
    date: null,
    description: "Research agent design — autonomous information gathering and synthesis",
    tags: ["research-agent", "architecture"],
  },
  {
    source: "we-and-ai-papers",
    title: "Verification Agent Architecture",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/VERIFICATION_AGENT_ARCHITECTURE.md",
    date: null,
    description: "Verification agent design — proof and evidence validation layer",
    tags: ["verification", "architecture", "evidence"],
  },
  {
    source: "we-and-ai-papers",
    title: "Swarm Architecture",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/SWARM_ARCHITECTURE.md",
    date: null,
    description: "Swarm intelligence architecture — collective agent behavior patterns",
    tags: ["swarm", "architecture", "collective-intelligence"],
  },
  {
    source: "we-and-ai-papers",
    title: "Key Innovations",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/KEY_INNOVATIONS.md",
    date: null,
    description: "Core innovations distinguishing the Deliberate Ensemble approach",
    tags: ["innovations", "core-concepts"],
  },
  {
    source: "we-and-ai-papers",
    title: "Persistent Memory",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/PERSISTENT_MEMORY.md",
    date: null,
    description: "Persistent memory design — cross-session knowledge retention",
    tags: ["memory", "persistence", "knowledge"],
  },
  {
    source: "we-and-ai-papers",
    title: "Project Overview",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/PROJECT_OVERVIEW.md",
    date: null,
    description: "Full project overview — scope, goals, and current state",
    tags: ["overview", "project"],
  },
  {
    source: "we-and-ai-papers",
    title: "Project Summary",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/PROJECT_SUMMARY.md",
    date: null,
    description: "Condensed project summary — elevator pitch and key metrics",
    tags: ["summary", "project"],
  },
  {
    source: "we-and-ai-papers",
    title: "Coding Agent Architecture",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/CODING_AGENT_ARCHITECTURE.md",
    date: null,
    description: "Coding agent design — autonomous code generation and review",
    tags: ["coding-agent", "architecture"],
  },
  {
    source: "we-and-ai-papers",
    title: "Cockpit Architecture Guidelines",
    url: "https://github.com/vortsghost2025/we-and-ai-papers/blob/main/COCKPIT_ARCHITECTURE_GUIDELINES.md",
    date: null,
    description: "Cockpit UI architecture — human-in-the-loop control interface",
    tags: ["cockpit", "ui", "guidelines"],
  },
  {
    source: "we-and-ai-papers",
    title: "README",
    url: "https://github.com/vortsghost2025/we-and-ai-papers",
    date: null,
    description: "Repository overview and navigation guide",
    tags: ["readme", "overview"],
  },
];

export const deliberateAiEnsemble: PublicationEntry[] = [
  {
    source: "deliberate-ai-ensemble",
    title: "Architecture Master Spec (51KB)",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/ARCHITECTURE_MASTER_SPEC.md",
    date: null,
    description:
      "The authoritative architecture specification — complete system design reference",
    tags: ["architecture", "master-spec", "specification"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Architecture Master (109KB)",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/ARCHITECTURE_MASTER.md",
    date: null,
    description:
      "Extended architecture document — the most comprehensive system description",
    tags: ["architecture", "master-document"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "ARCHITECTURE.md",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/ARCHITECTURE.md",
    date: null,
    description: "Core architecture document — structural overview",
    tags: ["architecture", "overview"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "00_START_HERE.md",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/00_START_HERE.md",
    date: null,
    description: "Onboarding entry point — where to begin with the repository",
    tags: ["onboarding", "start-here"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Architecture Validation",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/ARCHITECTURE_VALIDATION.md",
    date: null,
    description: "Architecture validation report — proving design integrity",
    tags: ["validation", "architecture", "verification"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Breakdown Analysis for Menlo (Feb 9 2026)",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/BREAKDOWN_ANALYSIS_FOR_MENLO_FEB9_2026.md",
    date: "2026-02-09",
    description:
      "Detailed breakdown analysis prepared for Menlo review — investment-grade system overview",
    tags: ["menlo", "analysis", "breakdown"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "WE4FREE Papers — Complete Series (Release v1.0)",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/tree/main/WE4FREE_PAPERS",
    date: null,
    description:
      "The complete WE4FREE paper series — foundational research publications (v1.0 release)",
    tags: ["we4free", "papers", "series", "release"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "AI Peer Review Request",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/AI_PEER_REVIEW_REQUEST.md",
    date: null,
    description: "Formal AI peer review request — inviting external validation",
    tags: ["peer-review", "validation", "external-review"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Project Identity — Primary",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/tree/main/PROJECT_IDENTITY",
    date: null,
    description: "Project identity documents — manifesto, primary identity, README",
    tags: ["identity", "manifesto", "project-identity"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "DELiberate Protocol",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/DELiberate_protocol.md",
    date: null,
    description: "The DELiberate protocol specification — core coordination mechanism",
    tags: ["protocol", "deliberate", "coordination"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Ensemble Synchronization",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/ENSEMBLE_SYNCHRONIZATION.md",
    date: null,
    description: "Ensemble synchronization design — multi-agent state coherence",
    tags: ["synchronization", "ensemble", "coherence"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Architecture Decision Records",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/ARCHITECTURE_DECISION_RECORDS.md",
    date: null,
    description: "ADR log — key architectural decisions and their rationale",
    tags: ["adr", "decisions", "rationale"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "System Overview",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/SYSTEM_OVERVIEW.md",
    date: null,
    description: "High-level system overview — the big picture",
    tags: ["overview", "system"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "README",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble",
    date: null,
    description:
      "Repository README — living and learning, accidentally deleted original repo",
    tags: ["readme", "overview"],
  },
  {
    source: "deliberate-ai-ensemble",
    title: "Devpost Submission",
    url: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main/DEVPOST_SUBMISSION.md",
    date: null,
    description: "Hackathon submission document — project pitch for Devpost",
    tags: ["devpost", "submission", "hackathon"],
  },
];

export const osfPreprints: PublicationEntry[] = [
  {
    source: "osf",
    title: "OSF Preprint Repository — n3tya",
    url: "https://osf.io/n3tya/overview",
    date: null,
    description:
      "Open Science Framework preprint repository — academic preprints and research data",
    tags: ["osf", "preprints", "academic"],
  },
];

export function getAllPublications(): PublicationEntry[] {
  return [
    ...mediumArticles,
    ...weAndAiPapers,
    ...deliberateAiEnsemble,
    ...osfPreprints,
  ];
}

export function getPublicationsBySource(
  source: PublicationEntry["source"]
): PublicationEntry[] {
  return getAllPublications().filter((p) => p.source === source);
}

export const SOURCE_META: Record<
  PublicationEntry["source"],
  { label: string; icon: string; color: string; description: string; repoUrl?: string }
> = {
  medium: {
    label: "Medium",
    icon: "M",
    color: "#06B6D4",
    description: "Research articles and session documentation published on Medium",
    repoUrl: "https://medium.com/@ai_28876",
  },
  "we-and-ai-papers": {
    label: "we-and-ai-papers",
    icon: "W",
    color: "#10B981",
    description: "Architecture specs, agent designs, and innovation documents",
    repoUrl: "https://github.com/vortsghost2025/we-and-ai-papers",
  },
  "deliberate-ai-ensemble": {
    label: "Deliberate-AI-Ensemble",
    icon: "D",
    color: "#7C3AED",
    description: "The primary repository — 339 commits, master specs, and the WE4FREE paper series",
    repoUrl: "https://github.com/vortsghost2025/Deliberate-AI-Ensemble",
  },
  osf: {
    label: "OSF Preprints",
    icon: "O",
    color: "#F59E0B",
    description: "Open Science Framework — academic preprints and research data",
    repoUrl: "https://osf.io/n3tya/overview",
  },
};

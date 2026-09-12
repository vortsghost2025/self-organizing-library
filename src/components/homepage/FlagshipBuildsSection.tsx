"use client";

import { useState } from "react";
import Link from "next/link";

interface FlagshipProject {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: string;
  role: string;
  headline: string;
  description: string;
  whyItsInsane: string[];
  codeSnippet?: { title: string; language: string; code: string };
  techStack: string[];
  primaryLink: { label: string; url: string; isExternal: boolean };
  secondaryLink?: { label: string; url: string; isExternal: boolean };
  statsBadge?: string;
}

const FLAGSHIP_PROJECTS: FlagshipProject[] = [
  {
    id: "waveterm-pwsh7-mcp",
    name: "Wave Terminal + PowerShell 7 MCP Runtime",
    badge: "FLAGSHIP SOURCE BUILD",
    badgeColor: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
    icon: "⚡",
    role: "Agent-Operable Terminal Runtime & Multiplexer",
    headline: "Cross-platform Electron terminal built for autonomous AI agents with PowerShell 7 and WSH streaming.",
    description:
      "A custom source build of Wave Terminal engineered specifically for agentic execution on Windows. Integrates a Model Context Protocol (MCP) server that empowers agents to safely discover terminals, execute allowlisted shell commands with user approval, stream terminal buffers over WSH, and tap into local NVIDIA NIM inference.",
    whyItsInsane: [
      "Native Model Context Protocol (MCP) server for Windows PowerShell 7",
      "Interactive allowlisted safety gate that intercepts high-risk commands",
      "Zero-latency real-time terminal output streaming over WSH protocols",
      "Integrated BYOK & NVIDIA NIM GPU-accelerated local AI inference",
    ],
    codeSnippet: {
      title: "Wave + PWSH7 MCP Tool Definition",
      language: "powershell",
      code: `# Agent Terminal Interception & WSH Streaming
$mcp.RegisterTool("execute_command", @{
    CommandLine = "git status --short"
    SafetyGate  = "StrictAllowlist"
    StreamWSH   = $true
    TimeoutMs   = 15000
})
# Dispatches to WaveTerm Electron runtime with user approval`,
    },
    techStack: ["TypeScript", "Electron", "Go", "PowerShell 7", "MCP", "NVIDIA NIM"],
    primaryLink: {
      label: "View on GitHub",
      url: "https://github.com/vortsghost2025/waveterm-pwsh7-mcp",
      isExternal: true,
    },
    secondaryLink: {
      label: "Inspect Details",
      url: "/repos?tab=all&selected=waveterm-pwsh7-mcp",
      isExternal: false,
    },
    statsBadge: "⚡ Live MCP Runtime",
  },
  {
    id: "kilo-mcp",
    name: "Kilo Platform Contributions & Desktop HUD",
    badge: "ACTIVE UPSTREAM CONTRIBUTIONS",
    badgeColor: "border-purple-500/50 bg-purple-500/10 text-purple-300",
    icon: "🤖",
    role: "Agentic Engineering Platform & Telemetry HUD",
    headline: "Upstream source contributions to Kilo coding agent, Model Context Protocol tooling, and desktop voice HUD.",
    description:
      "Active source contributions to the Kilo agentic engineering ecosystem (Kilo-Org/kilocode). Building custom MCP server tools, agent workflow hooks, and a standalone PyQt6 Desktop client (kilo-desktop) featuring a live telemetry HUD and voice I/O. Actively contributing to achieve official GitHub organization contributor recognition.",
    whyItsInsane: [
      "Active upstream contributions to the Kilo open-source coding agent platform",
      "Comprehensive Model Context Protocol (MCP) tool server integration",
      "Standalone PyQt6 desktop client with voice commands & real-time telemetry HUD",
      "Enables autonomous agent pair programming with persistent workspace hooks",
    ],
    codeSnippet: {
      title: "Kilo Desktop Telemetry & Voice Hook",
      language: "python",
      code: `# Kilo Desktop Hook: Voice I/O & Telemetry HUD
@kilo_hook("on_agent_turn")
def route_telemetry(session):
    hud.stream_metrics(pulse=session.live_pulse)
    if session.has_conflicts:
        voice.alert("Warning: Contradiction boundary reached.")
    hud.refresh_view()`,
    },
    techStack: ["Python", "PyQt6", "TypeScript", "Model Context Protocol", "Voice I/O"],
    primaryLink: {
      label: "Kilo Desktop Repo",
      url: "https://github.com/vortsghost2025/kilo-desktop",
      isExternal: true,
    },
    secondaryLink: {
      label: "Kilo Upstream Fork",
      url: "https://github.com/vortsghost2025/kilocode",
      isExternal: true,
    },
    statsBadge: "🐙 Contributor Journey",
  },
  {
    id: "context-mode",
    name: "Context-Mode — 98% Token Window Optimizer",
    badge: "PERFORMANCE OPTIMIZER",
    badgeColor: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    icon: "🧠",
    role: "Context Window Sandboxing & Token Conservation",
    headline: "Compresses tool and command outputs by up to 98% while preserving agent session memory across 17 platforms.",
    description:
      "A high-performance context compression engine that solves token exhaustion in autonomous coding workflows. Sandboxes verbose build logs, compiler outputs, and filesystem scans, routing compressed high-signal context across 17 major AI agent platforms via MCP and lifecycle hooks.",
    whyItsInsane: [
      "Up to 98% reduction in token consumption on verbose shell/tool commands",
      "Cross-session memory persistence preventing agent context amnesia",
      "Universal MCP adapter connecting seamlessly to 17 developer IDEs and agents",
      "Deterministic output sandboxing that keeps model reasoning clean and focused",
    ],
    codeSnippet: {
      title: "Context-Mode Sandboxing Rules",
      language: "json",
      code: `{
  "context_optimizer": "context-mode-v2",
  "compression_rate": "98.2%",
  "rules": ["strip_duplicate_lines", "compress_stacktraces"],
  "target_platforms": ["claude_code", "copilot", "cursor", "kilo"]
}`,
    },
    techStack: ["Token Optimization", "MCP", "Context Sandboxing", "Session Memory", "Python"],
    primaryLink: {
      label: "View on GitHub",
      url: "https://github.com/vortsghost2025/context-mode",
      isExternal: true,
    },
    secondaryLink: {
      label: "Inspect Details",
      url: "/repos?tab=all&selected=context-mode",
      isExternal: false,
    },
    statsBadge: "📉 98% Token Reduction",
  },
  {
    id: "swarmmind",
    name: "SwarmMind Autonomous Multi-Agent Network",
    badge: "AUTONOMOUS SWARM",
    badgeColor: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    icon: "🌐",
    role: "Autonomous Execution Engine & Self-Optimizing Loops",
    headline: "Self-optimizing multi-agent AI system featuring parallel code execution and autonomous improvement loops.",
    description:
      "The idea and execution engine of the Deliberate Ensemble. SwarmMind coordinates multiple specialized agent personas in autonomous discovery loops, executing tests, benchmarking algorithms, and proposing verified system enhancements with full cryptographic provenance.",
    whyItsInsane: [
      "Parallel multi-agent execution loops with autonomous task dispatch",
      "Self-optimizing code refinement based on test output convergence",
      "Live YouTube system demonstration showing emergent agent coordination",
      "Integrated into the 4-lane constitutional governance verification pipeline",
    ],
    codeSnippet: {
      title: "SwarmMind Convergence Loop",
      language: "typescript",
      code: `// Multi-agent consensus verification
const proposal = await swarm.synthesizeClaims({ lane: "archivist" });
const verified = await library.verifyEvidence(proposal.evidencePath);
if (verified) {
  await kernel.broadcastRatification(proposal.taskId);
}`,
    },
    techStack: ["Swarm AI", "Optimization Loops", "Multi-Agent Consensus", "Python", "Node.js"],
    primaryLink: {
      label: "View on GitHub",
      url: "https://github.com/vortsghost2025/SwarmMind-Self-Optimizing-Multi-Agent-AI-System",
      isExternal: true,
    },
    secondaryLink: {
      label: "Watch YouTube Demo",
      url: "https://www.youtube.com/watch?v=R0-judyIpJk",
      isExternal: true,
    },
    statsBadge: "▶ YouTube Demo Available",
  },
];

export function FlagshipBuildsSection() {
  const [activeTabs, setActiveTabs] = useState<Record<string, "arch" | "code">>({});

  const toggleTab = (id: string, tab: "arch" | "code") => {
    setActiveTabs((prev) => ({ ...prev, [id]: tab }));
  };

  return (
    <section className="space-y-6 animate-fade-in" aria-label="Flagship Source Builds and MCP Contributions">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>⚡ Featured Engineering</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Flagship Source Builds &amp; MCP Tooling
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
            High-performance open-source runtimes, terminal multiplexers, and upstream contributions engineered
            for autonomous agent execution, context window optimization, and human-in-the-loop safety.
          </p>
        </div>
        <a
          href="https://github.com/vortsghost2025"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs md:text-sm font-semibold text-cyan-300 hover:text-white inline-flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-white/10 hover:border-cyan-400 transition-all"
        >
          <span>🐙 Follow on GitHub</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* Flagship Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {FLAGSHIP_PROJECTS.map((project) => {
          const currentTab = activeTabs[project.id] || "arch";

          return (
            <div
              key={project.id}
              className="card p-6 md:p-8 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-200 group relative border border-white/10 bg-[var(--bg-surface)] rounded-2xl shadow-lg"
            >
              <div className="space-y-4">
                {/* Header row: Badge + Stats */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${project.badgeColor}`}
                  >
                    {project.badge}
                  </span>
                  {project.statsBadge && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {project.statsBadge}
                    </span>
                  )}
                </div>

                {/* Title & Role */}
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" aria-hidden="true">
                      {project.icon}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  <div className="text-xs md:text-sm font-medium text-cyan-400/90 mt-1">
                    {project.role}
                  </div>
                </div>

                {/* Headline */}
                <p className="text-sm md:text-base font-medium text-slate-200 leading-snug">
                  {project.headline}
                </p>

                {/* Detailed Description */}
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {project.description}
                </p>

                {/* Interactive Mode Switcher: Architecture vs Code Hook */}
                <div className="flex items-center gap-2 pt-1 border-b border-white/10 pb-2">
                  <button
                    type="button"
                    onClick={() => toggleTab(project.id, "arch")}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      currentTab === "arch"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    ✦ Architecture &amp; Capabilities
                  </button>
                  {project.codeSnippet && (
                    <button
                      type="button"
                      onClick={() => toggleTab(project.id, "code")}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        currentTab === "code"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      <span>💻 Live Code Hook</span>
                    </button>
                  )}
                </div>

                {/* Tab 1: Architecture Highlights */}
                {currentTab === "arch" && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 animate-fade-in">
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {project.whyItsInsane.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyan-400 text-sm leading-none">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tab 2: Live Code Hook */}
                {currentTab === "code" && project.codeSnippet && (
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-500/30 space-y-2 font-mono text-xs animate-fade-in">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-1.5">
                      <span className="text-purple-300 flex items-center gap-1 font-bold">
                        <span>▶</span>
                        <span>{project.codeSnippet.title}</span>
                      </span>
                      <span className="uppercase text-[10px] bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                        {project.codeSnippet.language}
                      </span>
                    </div>
                    <pre className="text-slate-200 overflow-x-auto p-1 leading-relaxed text-[11px]">
                      <code>{project.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 font-mono"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <a
                href={project.primaryLink.url}
                target={project.primaryLink.isExternal ? "_blank" : undefined}
                rel={project.primaryLink.isExternal ? "noopener noreferrer" : undefined}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold transition-all shadow-md inline-flex items-center gap-2"
              >
                <span>{project.primaryLink.label}</span>
                <span aria-hidden="true">↗</span>
              </a>

              {project.secondaryLink && (
                project.secondaryLink.isExternal ? (
                  <a
                    href={project.secondaryLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <span>{project.secondaryLink.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link
                    href={project.secondaryLink.url}
                    className="text-xs md:text-sm font-semibold text-purple-300 hover:text-purple-100 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{project.secondaryLink.label}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                )
              )}
            </div>
          </div>
        );
      })}
      </div>
    </section>
  );
}

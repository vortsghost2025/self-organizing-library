import { getStats } from "@/lib/site-index";
import Link from "next/link";
import { LaneArchitecture } from "@/components/LaneArchitecture";
import { UnderstandingTheSystem } from "@/components/UnderstandingTheSystem";
import fs from "fs";
import path from "path";

// Load homepage preview data if present (for rapid iteration without code changes)
function loadHomepagePreview() {
  const draftPath = path.join(process.cwd(), "drafts", "homepage.json");
  if (fs.existsSync(draftPath)) {
    try {
      return JSON.parse(fs.readFileSync(draftPath, "utf8"));
    } catch (e: any) {
      console.warn("Failed to parse homepage preview:", e.message);
    }
  }
  return null;
}

const preview = loadHomepagePreview();

export default async function Dashboard() {
  const stats = getStats();

  // Use preview data if available, otherwise hardcoded defaults
  const heroTitle = preview?.hero?.title || "Deliberate Ensemble";
  const heroTagline = preview?.hero?.tagline || "A living research archive and constitutional AI governance system. Four autonomous lanes work together under signed, verifiable rules. Everything is indexed, cross-referenced, and proven.";
  const statusLine = preview?.hero?.status || "Autonomous Constitutional Enforcement is converged (Archivist + Library approved). The trust layer is hardened. The graph is live. Next up: accessibility audit, NFM classification engine, and Paper 7 (failure injection).";
  const explainerLeftTitle = preview?.explainer?.leftTitle || "Four independent agents";
  const explainerLeftText = preview?.explainer?.leftText || "Think of it like a company with four departments that can&apos;t act unilaterally. The Archivist is legal/rules. The Library is facts/evidence. The SwarmMind is engineering. The Kernel is infrastructure. Every major decision requires at least three of them to agree — and every claim must come with proof you can verify yourself.";
  const explainerRightTitle = preview?.explainer?.rightTitle || "Why all this?";
  const explainerRightText = preview?.explainer?.rightText || "Human-AI teams make mistakes. So do AI agents. This system catches those mistakes by requiring signed evidence, cross-lane verification, and a public audit trail. Failure modes are documented as NFMs (Named Failure Modes) and tested deliberately.";

  return (
    <div className="p-8" data-pagefind-body>
      {/* Hero: what this is */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
          {heroTitle}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl">
          {heroTagline}
        </p>
      </div>

      {/* Compact archive stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6" role="region" aria-label="Archive statistics (compact)">
        <div className="card p-3 animate-fade-in stagger-1" role="status">
          <div className="text-2xl font-bold text-[var(--primary)]">{stats.totalFiles.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-muted)]">Documents</div>
        </div>
        <div className="card p-3 animate-fade-in stagger-2" role="status">
          <div className="text-2xl font-bold text-[var(--secondary)]">{stats.tagCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Tags</div>
        </div>
        <div className="card p-3 animate-fade-in stagger-3" role="status">
          <div className="text-2xl font-bold text-[var(--success)]">{stats.categoryCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Categories</div>
        </div>
        <div className="card p-3 animate-fade-in stagger-4" role="status">
          <div className="text-2xl font-bold text-[var(--warning)]">4</div>
          <div className="text-xs text-[var(--text-muted)]">Lanes</div>
        </div>
      </div>

      {/* Plain-language explanation */}
      <div className="card p-6 mb-8 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">
          How This Works (in plain English)
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-[var(--text-secondary)] text-sm leading-relaxed">
          <div>
            <h3 className="text-base font-semibold mb-2 text-[var(--text-primary)]">{explainerLeftTitle}</h3>
              <p>{explainerLeftText}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold mb-2 text-[var(--text-primary)]">{explainerRightTitle}</h3>
            <p>{explainerRightText}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[var(--bg-surface)] rounded-lg border-l-4 border-[var(--primary)] text-sm">
          <strong>Current status:</strong> {statusLine}
        </div>
      </div>
      <div className="mt-4 text-right">
        <a
          href="/docs/graph/NEXUS_GRAPH_EXPLANATION_LAYER"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          Nexus Graph explanation layer →
        </a>
      </div>
      <div className="mt-4 text-right">
        <a
          href="/docs/graph/NEXUS_GRAPH_EXPLANATION_LAYER"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          Nexus Graph explanation layer →
        </a>
      </div>

      {/* External services dashboard */}
      <div className="card p-6 mb-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">External Services</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Federated dashboards and mesh-connected services outside the core 4-lane governance system.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Mental Health Mesh — live service */}
          <a
            href="https://orangered-jellyfish-637583.hostingersite.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--success)]/20 flex items-center justify-center text-xl">
              🧠
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)]">Mental Health Mesh</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30">
                  LIVE
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                Canada-based offline-first mesh network for mental health support. Operates independently
                via local p2p when connectivity drops. Integrated via GitHub bridge.
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                  Hostinger (online)
                </span>
                <span>•</span>
                <span>Region: Canada</span>
                <span>•</span>
                <span>Bridge: FreeAgent</span>
              </div>
            </div>
          </a>

          {/* Federation Simulation — historical/archive mode */}
          <a
            href="https://steelblue-elephant-526729.hostingersite.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-surface-hover)] transition-colors opacity-75"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--warning)]/20 flex items-center justify-center text-xl">
              🌐
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)]">Federation Simulation</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30">
                  ARCHIVED
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                Persistent multi-agent federation game from pre-system papers. Environment state
                scattered across legacy repositories; preserved as historical artifact.
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                <span>Hostinger</span>
                <span>•</span>
                <span>Origin: WE4FREE Paper 3</span>
                <span>•</span>
                <span>Status: Readonly archive</span>
              </div>
            </div>
          </a>
        </div>

        {/* Quick links */}
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
          <div>
            Federated services connected via FreeAgent bridge.{' '}
            <a href="/services" className="text-[var(--primary)] hover:underline">
              View all services →
            </a>
          </div>
          <div>
            Want your service listed?{' '}
            <a href="mailto:deliberateensemble@gmail.com" className="text-[var(--primary)] hover:underline">
              Get in touch
            </a>
          </div>
        </div>
      </div>

      {/* Main system explanation (replace Recent + Categories) */}
      <div className="mb-10">
        <UnderstandingTheSystem />
      </div>

      {/* Lane diagram + about */}
      <LaneArchitecture />

      <div className="card p-6 mt-6 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">About Deliberate Ensemble</h2>
        <p className="text-[var(--text-secondary)] mb-4 text-sm">
          This is a living archive. It&apos;s not a finished product — it&apos;s the record of how the system
          was built, why decisions were made, and what constraints are enforced. Every governance
          artifact, every test result, and every failure mode is preserved here for audit.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] mono">
          <span>Status: Operational</span>
          <span>•</span>
          <span>Lanes: 4 active</span>
          <span>•</span>
          <span>Documents: {stats.totalFiles.toLocaleString()}</span>
          <span>•</span>
          <span>Tags: {stats.tagCount}</span>
        </div>
      </div>
    </div>
  );
}

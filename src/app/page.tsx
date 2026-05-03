import { getStats } from "@/lib/site-index";
import Link from "next/link";
import { LaneArchitecture } from "@/components/LaneArchitecture";
import fs from "fs";
import path from "path";
import { HeroSection } from "@/components/homepage/HeroSection";
import { PapersToSystemBridge } from "@/components/homepage/PapersToSystemBridge";
import { ArchiveStats } from "@/components/homepage/ArchiveStats";

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

  // Use preview data if available, otherwise use the required new defaults
  const heroTitle = preview?.hero?.title || "An AI system that proves what it knows.";
  const heroTagline = preview?.hero?.tagline || "Deliberate Ensemble is a multi-agent system where every claim is verified, tracked, and challenged over time.";

  return (
    <div className="p-8" data-pagefind-body>
      {/* HERO SECTION — top of page, clear and dominant */}
      <HeroSection
        title={heroTitle}
        tagline={heroTagline}
      />

      {/* HOW IT WORKS — 3-step human explanation, directly under hero */}
      <div className="card p-6 mb-12 animate-fade-in">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">1</div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Agents generate ideas</h3>
            <p className="text-sm text-[var(--text-secondary)]">Documentation, code, and claims are created across the system.</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">2</div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Other agents verify or challenge</h3>
            <p className="text-sm text-[var(--text-secondary)]">Each claim is tested. If it doesn&apos;t hold, it&apos;s marked and tracked.</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">3</div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">The system tracks truth over time</h3>
             <p className="text-sm text-[var(--text-secondary)]">You see what&apos;s proven, what&apos;s contested, and what&apos;s still unknown.</p>
          </div>
        </div>
      </div>

      {/* CHOOSE YOUR PATH — clear entry points for different needs */}
      <div className="card p-6 mb-12 animate-fade-in">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Choose Your Path</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/start-here"
            className="flex items-start gap-4 p-5 rounded-lg border-2 border-[var(--success)] hover:border-[var(--success)]/70 hover:bg-[var(--success)]/10 transition-all group"
          >
            <div className="text-3xl flex-shrink-0" aria-hidden="true">🟢</div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--success)] transition-colors">I want to understand the idea</h3>
              <p className="text-sm text-[var(--text-secondary)]">Start with the foundational documents and core principles.</p>
            </div>
          </a>
          <a
            href="/graph"
            className="flex items-start gap-4 p-5 rounded-lg border-2 border-[var(--primary)] hover:border-[var(--primary)]/70 hover:bg-[var(--primary)]/10 transition-all group"
          >
            <div className="text-3xl flex-shrink-0" aria-hidden="true">🔵</div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">I want to see it in action</h3>
              <p className="text-sm text-[var(--text-secondary)]">Explore the live graph to see how ideas connect and conflict.</p>
            </div>
          </a>
          <a
            href="/papers"
            className="flex items-start gap-4 p-5 rounded-lg border-2 border-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/10 transition-all group"
          >
            <div className="text-3xl flex-shrink-0" aria-hidden="true">🟣</div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--warning)] transition-colors">I want the deep technical theory</h3>
              <p className="text-sm text-[var(--text-secondary)]">Read the full Rosetta Stone paper series and architecture specs.</p>
            </div>
          </a>
        </div>
      </div>

      {/* NEXUS GRAPH INTRO — positioned before graph to frame its purpose */}
      <div className="card p-6 mb-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Live System Map</h2>
        <p className="text-[var(--text-secondary)] mb-0">
          This is a live map of how ideas connect, conflict, and get verified.
          <Link href="/graph" className="text-[var(--primary)] hover:underline ml-1">Open the Nexus Graph →</Link>
        </p>
      </div>

      {/* Papers to system bridge */}
      <PapersToSystemBridge />

      {/* External services dashboard */}
      <div className="card p-6 mb-12 animate-fade-in">
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
                via local p2p when connectivity drops. Integrated with the Deliberate Ensemble governance via GitHub bridge.
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
          {/* Mental health resources link */}
          <div className="mt-2 pl-2">
            <a
              href="https://orangered-jellyfish-637583.hostingersite.com/resources.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Mental health resources →
            </a>
          </div>

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

      {/* ARCHIVE STATS — moved well below the fold, after services */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">Archive at a Glance</h2>
        <ArchiveStats />
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

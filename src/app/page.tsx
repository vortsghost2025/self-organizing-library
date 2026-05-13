import Link from "next/link";
import { LaneArchitecture } from "@/components/LaneArchitecture";
import { HeroSection } from "@/components/homepage/HeroSection";
import { LiveSystemPulse } from "@/components/homepage/LiveSystemPulse";
import HomeSystemStateStrip from "@/components/homepage/HomeSystemStateStrip";
import SystemOverview from "@/components/SystemOverview";

export default async function Dashboard() {
  const heroTitle = "An AI system that proves what it knows.";
  const heroTagline = "Most AI gives answers. This one verifies them.";

  return (
    <div className="p-8" data-pagefind-body>
      <div id="build-marker" style={{background:'#000',color:'#0f0',padding:'8px 16px',fontFamily:'monospace',fontSize:'14px',textAlign:'center',letterSpacing:'1px'}}>BUILD_MARKER_2026_05_05</div>

      <HeroSection
        title={heroTitle}
        tagline={heroTagline}
      />
      <LiveSystemPulse />

      <HomeSystemStateStrip />
      <SystemOverview />

      <div className="card p-6 mb-12 animate-fade-in">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">1</div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Agents generate ideas</h3>
          </div>
          <div>
            <div className="text-3xl mb-2">2</div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">Other agents challenge them</h3>
          </div>
          <div>
            <div className="text-3xl mb-2">3</div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">The system tracks what survives</h3>
          </div>
        </div>
      </div>

      <LaneArchitecture />

      <div className="mb-12">
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/start-here"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--success)] hover:border-[var(--success)]/70 hover:bg-[var(--success)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">🟢</div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--success)] transition-colors">Understand the idea</h3>
              <p className="text-sm text-[var(--text-secondary)]">Start with the foundational concepts.</p>
            </div>
          </a>
          <a
            href="/timeline"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--primary)] hover:border-[var(--primary)]/70 hover:bg-[var(--primary)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">🔵</div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">See the evolution</h3>
              <p className="text-sm text-[var(--text-secondary)]">Explore the chronological time-lapse of the system.</p>
            </div>
          </a>
          <a
            href="/papers"
            className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/10 transition-all group"
          >
            <div className="text-4xl" aria-hidden="true">🟣</div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--warning)] transition-colors">Read the theory</h3>
              <p className="text-sm text-[var(--text-secondary)]">Deep technical papers and specs.</p>
            </div>
          </a>
        </div>
      </div>

  <div className="mb-12">
    <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">Community Work &amp; Advocacy</h2>
    <p className="text-sm text-[var(--text-secondary)] mb-6">
      Mental health advocacy and community resource work — built to lower barriers, share lived experience, and connect people to support.
    </p>
    <div className="grid md:grid-cols-2 gap-4">
      <a
        href="https://orangered-jellyfish-637583.hostingersite.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--success)] hover:border-[var(--success)]/70 hover:bg-[var(--success)]/10 transition-all group"
      >
        <div className="text-4xl" aria-hidden="true">💚</div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--success)] transition-colors">Mental Health Website</h3>
          <p className="text-sm text-[var(--text-secondary)]">A dedicated space for mental health awareness, lived experience, and community support.</p>
          <span className="inline-block mt-3 text-xs font-medium text-[var(--success)]">Visit site →</span>
        </div>
      </a>
      <a
        href="https://orangered-jellyfish-637583.hostingersite.com/resources.html"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--secondary)] hover:border-[var(--secondary)]/70 hover:bg-[var(--secondary)]/10 transition-all group"
      >
        <div className="text-4xl" aria-hidden="true">🧠</div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--secondary)] transition-colors">Mental Health Resources</h3>
          <p className="text-sm text-[var(--text-secondary)]">Curated resources, coping strategies, and support links for those navigating mental health challenges.</p>
          <span className="inline-block mt-3 text-xs font-medium text-[var(--secondary)]">View resources →</span>
        </div>
      </a>
      <a
        href="https://www.linkedin.com/in/sean-david-ramsingh-2143a63ab/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--primary)] hover:border-[var(--primary)]/70 hover:bg-[var(--primary)]/10 transition-all group"
      >
        <div className="text-4xl" aria-hidden="true">💼</div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">LinkedIn</h3>
          <p className="text-sm text-[var(--text-secondary)]">Professional profile, background, and career experience.</p>
          <span className="inline-block mt-3 text-xs font-medium text-[var(--primary)]">View profile →</span>
        </div>
      </a>
      <a
        href="https://medium.com/@ai_28876"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-4 p-6 rounded-xl border-2 border-[var(--warning)] hover:border-[var(--warning)]/70 hover:bg-[var(--warning)]/10 transition-all group"
      >
        <div className="text-4xl" aria-hidden="true">✍️</div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--warning)] transition-colors">Medium Articles</h3>
          <p className="text-sm text-[var(--text-secondary)]">Research publications on AI governance, multi-agent systems, and constitutional constraints.</p>
          <span className="inline-block mt-3 text-xs font-medium text-[var(--warning)]">Read articles →</span>
        </div>
      </a>
    </div>
  </div>

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
          <span>Documents: 2,954</span>
          <span>•</span>
          <span>Tags: 1,744</span>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import Image from "next/image";
import { YouTubeBrandIcon } from "@/components/YouTubeBrandIcon";

interface HeroSectionProps {
  title: string;
  tagline: string;
  onStartWalkthrough?: () => void;
}

export function HeroSection({ title, tagline, onStartWalkthrough }: HeroSectionProps) {
  return (
    <div className="mb-12 animate-fade-in">
      <div className="relative mb-6 h-36 w-full max-w-full overflow-hidden rounded-lg border border-[var(--border)] sm:mb-8 sm:h-64 md:h-80">
        <Image
          src="/banner-singularity.svg"
          alt="Technological singularity visualization: four governance lanes converging into a central nexus core"
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 280px)"
          className="object-cover"
        />
        <div className="absolute inset-0 flex max-w-full flex-col items-center justify-center px-3 text-center pointer-events-none">
          <h2
            className="max-w-full text-xl font-bold tracking-tight text-white sm:text-3xl md:text-5xl"
            style={{
              fontFamily: "'Outfit', sans-serif",
              textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 0 60px rgba(139,92,246,0.3)",
            }}
          >
            DELIBERATE ENSEMBLE
          </h2>
          <p
            className="mt-1 max-w-full text-sm tracking-wide text-white/90 sm:mt-2 sm:text-base md:text-xl"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              textShadow: "0 2px 16px rgba(0,0,0,0.9)",
            }}
          >
            Four-Lane Constitutional Governance
          </p>
          <div className="mt-2 flex max-w-full flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-medium sm:mt-4 sm:text-xs md:text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-[#10B981]">■ LIBRARY</span>
            <span className="text-[#7C3AED]">■ ARCHIVIST</span>
            <span className="text-[#06B6D4]">■ SWARMMIND</span>
            <span className="text-[#F59E0B]">■ KERNEL</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary-text)] text-xs font-bold uppercase tracking-wider">
          Principal AI Systems Architect &amp; Researcher
        </div>
        <h1 className="max-w-full text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight break-words">
          {title}
        </h1>
        <p className="text-base md:text-xl text-[var(--text-secondary)] max-w-4xl leading-relaxed">
          {tagline}
        </p>

        <div className="flex max-w-full flex-wrap gap-3 pt-1">
          <Link
            href="/hire"
            className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-bold hover:bg-[var(--primary-hover)] transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
          >
            Hire me
          </Link>
          <Link
            href="/repos"
            className="px-6 py-3 border-2 border-[var(--primary)] text-[var(--text-primary)] rounded-xl font-bold hover:bg-[var(--primary)]/15 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] flex items-center gap-2"
          >
            <span>Explore All 27 Systems</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/papers"
            className="px-6 py-3 border-2 border-[var(--primary)] text-[var(--text-primary)] rounded-xl font-bold hover:bg-[var(--primary)]/15 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
          >
            Research Papers &amp; Theory
          </Link>
          <Link
            href="/graph"
            className="px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-semibold hover:bg-[var(--bg-surface-hover)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
          >
            Interactive Nexus Graph
          </Link>
          <Link
            href="/start-here"
            className="px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-semibold hover:bg-[var(--bg-surface-hover)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
            onClick={onStartWalkthrough}
          >
            System Orientation
          </Link>
        </div>

        {/* Executive Credential & Social Links */}
        <div className="flex max-w-full flex-wrap items-center gap-3 pt-2 text-xs md:text-sm">
          <a
            href="https://github.com/vortsghost2025"
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full px-3.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-white/20 text-[var(--text-primary)] hover:border-purple-400 hover:text-white transition-all flex flex-wrap items-center gap-2 font-semibold shadow-sm"
          >
            <span>🐙 GitHub</span>
            <span className="text-purple-300 font-mono">@vortsghost2025</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 uppercase font-bold tracking-wider">
              MCP Contributor
            </span>
          </a>
          <a
            href="https://www.youtube.com/@seandavidramsingh-s9z"
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full px-3.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 hover:border-red-400 hover:text-white transition-all flex flex-wrap items-center gap-2 font-semibold shadow-sm"
          >
            <YouTubeBrandIcon size={24} />
            <span>YouTube</span>
            <span className="text-red-300/80 font-mono text-xs">@seandavidramsingh-s9z</span>
          </a>
          <a
            href="https://www.tiktok.com/@we4free"
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full px-3.5 py-1.5 rounded-lg bg-pink-950/40 border border-pink-500/40 text-pink-200 hover:border-pink-400 hover:text-white transition-all flex flex-wrap items-center gap-2 font-semibold shadow-sm"
          >
            <span>🎵</span>
            <span>TikTok</span>
            <span className="text-pink-300/80 font-mono text-xs">@we4free</span>
          </a>
          <Link
            href="/meshcast"
            className="max-w-full px-3.5 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/50 text-purple-200 hover:border-purple-300 hover:text-white transition-all flex flex-wrap items-center gap-2 font-semibold shadow-sm"
          >
            <span>🎙️</span>
            <span>MeshCast</span>
            <span className="text-purple-300/80 text-xs">Podcast Series</span>
          </Link>
          <a
            href="https://www.linkedin.com/in/sean-david-ramsingh-2143a63ab/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-cyan-400 hover:text-cyan-200 transition-all flex items-center gap-1.5 font-medium"
          >
            <span>💼 LinkedIn</span>
            <span className="text-[var(--text-muted)]">Profile</span>
          </a>
          <a
            href="https://osf.io/n3tya"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center gap-1.5 font-medium"
          >
            <span>📄 OSF Preprints</span>
            <span className="text-[var(--text-muted)]">Theory Papers</span>
          </a>
          <a
            href="https://medium.com/@ai_28876"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-amber-400 hover:text-amber-200 transition-all flex items-center gap-1.5 font-medium"
          >
            <span>✍️ Medium</span>
            <span className="text-[var(--text-muted)]">Articles</span>
          </a>
          <a
            href="https://github.com/vortsghost2025/WE4FREE"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:text-emerald-200 transition-all flex items-center gap-1.5 font-medium"
          >
            <span>💚 WE4FREE</span>
            <span className="text-emerald-400/80">Crisis Directory</span>
          </a>
        </div>
      </div>

    </div>
  );
}
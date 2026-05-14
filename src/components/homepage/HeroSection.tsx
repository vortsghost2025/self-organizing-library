"use client";

import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  title: string;
  tagline: string;
  onStartWalkthrough?: () => void;
}

export function HeroSection({ title, tagline, onStartWalkthrough }: HeroSectionProps) {
  return (
    <div className="mb-12 animate-fade-in">
      <div className="mb-8 w-full h-64 md:h-80 overflow-hidden rounded-lg border border-[var(--border)] relative">
        <Image
          src="/banner-singularity.svg"
          alt="Technological singularity visualization: four governance lanes converging into a central nexus core"
          width={1920}
          height={500}
          priority
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h2
            className="text-3xl md:text-5xl font-bold text-white tracking-tight"
            style={{
              fontFamily: "'Outfit', sans-serif",
              textShadow: "0 2px 20px rgba(0,0,0,0.9), 0 0 60px rgba(139,92,246,0.3)",
            }}
          >
            DELIBERATE ENSEMBLE
          </h2>
          <p
            className="text-base md:text-xl text-white/90 mt-2 tracking-wide"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              textShadow: "0 2px 16px rgba(0,0,0,0.9)",
            }}
          >
            Four-Lane Constitutional Governance
          </p>
          <div className="flex gap-6 mt-4 text-xs md:text-sm font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-[#10B981] opacity-80">■ LIBRARY</span>
            <span className="text-[#7C3AED] opacity-80">■ ARCHIVIST</span>
            <span className="text-[#06B6D4] opacity-70">■ SWARMMIND</span>
            <span className="text-[#F59E0B] opacity-70">■ KERNEL</span>
          </div>
        </div>
      </div>
      <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
        {title}
      </h1>
      <p className="text-lg text-[var(--text-secondary)] max-w-3xl mb-8">
        {tagline}
      </p>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href="/start-here"
          className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
          onClick={onStartWalkthrough}
        >
          Start Here
        </Link>
        <Link
          href="/graph"
          className="px-6 py-3 border-2 border-[var(--primary)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--primary)]/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
        >
          Explore Live Graph
        </Link>
      </div>
    </div>
  );
}
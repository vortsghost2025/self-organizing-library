"use client";

import Link from "next/link";

interface HeroSectionProps {
  title: string;
  tagline: string;
  onStartWalkthrough?: () => void;
}

export function HeroSection({ title, tagline, onStartWalkthrough }: HeroSectionProps) {
  return (
    <div className="mb-12 animate-fade-in">
      <div className="mb-8 w-full h-64 md:h-80 overflow-hidden rounded-lg border border-[var(--border)]">
        <img
          src="/sigularity2.jpg"
          alt="Deliberate Ensemble banner"
          className="w-full h-full object-center object-cover"
        />
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

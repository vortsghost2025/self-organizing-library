"use client";

import Link from "next/link";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface HeroSectionProps {
  title: string;
  tagline: string;
  onStartWalkthrough?: () => void;
}

export function HeroSection({ title, tagline, onStartWalkthrough }: HeroSectionProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="mb-12" data-revealed>
      <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4 hero-shimmer">
        {title}
      </h1>
      <p className="text-lg text-[var(--text-secondary)] max-w-3xl mb-8 reveal-delay-1" data-revealed>
        {tagline}
      </p>

      <div className="flex flex-wrap gap-4 mb-8 reveal-delay-2" data-revealed>
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

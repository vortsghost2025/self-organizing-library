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
          Start the Walkthrough
        </Link>
        <Link 
          href="/graph" 
          className="px-6 py-3 border-2 border-[var(--primary)] text-[var(--primary)] rounded-lg font-medium hover:bg-[var(--primary)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
        >
          Explore Nexus Graph
        </Link>
        <Link 
          href="/papers" 
          className="px-6 py-3 border-2 border-[var(--secondary)] text-[var(--secondary)] rounded-lg font-medium hover:bg-[var(--secondary)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
        >
          Read the Papers
        </Link>
        <Link 
          href="/lanes" 
          className="px-6 py-3 border-2 border-[var(--success)] text-[var(--success)] rounded-lg font-medium hover:bg-[var(--success)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--success)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
        >
          View the 4 Lanes
        </Link>
      </div>
    </div>
  );
}
"use client";

import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const NexusGraph = dynamic(() => import('@/components/NexusGraph'), { ssr: false });

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Understand — Deliberate Ensemble',
    description: 'Explore the governance graph in understand mode, focusing on verified, high-authority nodes.',
  };
}

export default function UnderstandPage() {
  return (
    <div className="p-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Understand</h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Understand mode visualizes the trusted core of the system. It highlights verified nodes with high authority depth,
          showing how knowledge is structured and verified. Start with the core and explore connections.
        </p>
      </div>
      <NexusGraph initialMode="understand" />
    </div>
  );
}

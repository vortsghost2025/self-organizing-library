"use client";

import Link from "next/link";

const bridgeItems = [
  {
    id: "constraint",
    title: "Constraint Lattice",
    description: "The theoretical framework for constraint-based governance",
    system: "Governance docs / authority layers",
    link: "/docs/theory/CONSTRAINT_LATTICE"
  },
  {
    id: "drift",
    title: "Drift",
    description: "Conceptual drift detection and identity management",
    system: "Contradiction layer / compact recovery / SwarmMind",
    link: "/docs/theory/DRIFT_IDENTITY_ENSEMBLE"
  },
  {
    id: "phenotype",
    title: "Phenotype Selection",
    description: "Multi-agent phenotype selection mechanisms",
    system: "Continuity and identity checks",
    link: "/docs/theory/PHENOTYPE_SELECTION"
  },
  {
    id: "ensemble",
    title: "Ensemble Coherence",
    description: "Multi-agent ensemble coherence and collaboration",
    system: "4-lane ratification loops",
    link: "/docs/theory/ENSEMBLE_COHERENCE"
  },
  {
    id: "enforcement",
    title: "Enforcement Reality",
    description: "Runtime proof requirements and enforcement mechanisms",
    system: "Runtime proof requirements / NFM records",
    link: "/docs/enforcement/ENFORCEMENT_REALITY"
  },
  {
    id: "federation",
    title: "Federation Simulation",
    description: "Pre-lattice governance model simulation",
    system: "Pre-lattice governance model",
    link: "/repos/federation"
  }
];

export function PapersToSystemBridge() {
  return (
    <section className="card p-6 mb-12 animate-fade-in">
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        From Papers to System
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {bridgeItems.map((item) => (
          <div 
            key={item.id} 
            className="border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)] transition-colors"
          >
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">{item.description}</p>
            <p className="text-xs text-[var(--text-muted)] mb-2">Maps to: {item.system}</p>
            <Link 
              href={item.link} 
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
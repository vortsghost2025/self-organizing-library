"use client";

import Link from "next/link";

export function NexusGraphExplanation() {
  return (
    <section className="card p-6 mb-12 animate-fade-in">
      <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        Understanding the Nexus Graph
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What You See</h3>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--primary)] mt-1">•</span>
              <span><strong>Nodes</strong> = artifacts (documents, code, data)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--primary)] mt-1">•</span>
              <span><strong>Edges</strong> = relationships (cross-references, shared tags)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--primary)] mt-1">•</span>
              <span><strong>Colors</strong> = repos/domains</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--primary)] mt-1">•</span>
              <span><strong>Statuses</strong> = verification state (verified, unverified, conflicted)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--primary)] mt-1">•</span>
              <span><strong>Meaning layers</strong> = different questions over the same data</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What It Means</h3>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[var(--warning)] mt-1">•</span>
              <span><strong>Displayed</strong> does not mean true</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--warning)] mt-1">•</span>
              <span><strong>Connected</strong> does not mean authoritative</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--warning)] mt-1">•</span>
              <span><strong>Verified</strong> does not mean enforced</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--warning)] mt-1">•</span>
              <span><strong>Signed</strong> does not mean approved</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--warning)] mt-1">•</span>
              <span><strong>Simulated</strong> does not mean ratified</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-[var(--bg-surface)] rounded-lg border-l-4 border-[var(--primary)]">
        <p className="text-sm">
          <strong>The graph is the map, not the authority.</strong> It shows relationships between artifacts but does not confer authority. 
          The visualization is a tool for understanding connections, not a statement of truth.
        </p>
        <div className="mt-3">
          <Link 
            href="/graph" 
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Open the Nexus Graph →
          </Link>
        </div>
      </div>
    </section>
  );
}
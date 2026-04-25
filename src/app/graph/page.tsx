"use client";

import dynamic from "next/dynamic";

const NexusGraph = dynamic(() => import("@/components/NexusGraph"), {
  ssr: false,
  loading: () => (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Nexus Graph
          </h1>
          <p className="text-[var(--text-secondary)]">
            Loading interactive graph...
          </p>
        </div>
      </div>
      <div
        className="card flex items-center justify-center"
        style={{ height: "650px" }}
      >
        <span className="text-[var(--text-muted)]">Initializing WebGL...</span>
      </div>
    </div>
  ),
});

export default function GraphPage() {
  return <NexusGraph />;
}

"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

function GraphContent() {
  const searchParams = useSearchParams();
  const filterMode = searchParams.get("filterMode") as "type" | "repo" | null || "type";
  const filter = searchParams.get("filter") || "all";

  return <NexusGraph initialFilter={filter} initialFilterMode={filterMode} />;
}

export default function GraphPage() {
  return (
    <>
      <noscript>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Nexus Graph</h1>
          <p className="text-[var(--text-secondary)]">
            The interactive nexus graph requires JavaScript to render. Please enable JavaScript
            to explore the connections.
          </p>
          <p className="text-[var(--text-muted)] mt-4">
            Alternatively, browse the <a href="/library" className="text-[var(--primary)] underline">Library</a> or <a href="/repos" className="text-[var(--primary)] underline">Repositories</a> pages.
          </p>
        </div>
      </noscript>
      <Suspense fallback={<div className="p-8 text-[var(--text-muted)]">Loading graph...</div>}>
        <GraphContent />
      </Suspense>
    </>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

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
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/graph?mode=overview" className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2">
                Overview (lanes only)
              </Link>
              <Link href="/graph" className="px-4 py-2 border-2 border-[var(--primary)] text-[var(--text-primary)] rounded hover:bg-[var(--primary)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2">
                Full graph
              </Link>
            </div>
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
  const filterMode = (searchParams.get("filterMode") as "type" | "repo" | null) || "type";
  const filter = searchParams.get("filter") || "all";
  const mode = searchParams.get("mode");

  return <NexusGraph initialFilter={filter} initialFilterMode={filterMode} initialMode={mode ?? undefined} />;
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
            Alternatively, browse the <Link href="/library" className="text-[var(--primary)] underline">Library</Link> or <Link href="/repos" className="text-[var(--primary)] underline">Repositories</Link> pages.
          </p>
        </div>
      </noscript>
      <Suspense fallback={<div className="p-8 text-[var(--text-muted)]">Loading graph...</div>}>
        <GraphContent />
      </Suspense>
    </>
  );
}

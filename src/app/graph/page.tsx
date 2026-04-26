"use client";

import dynamic from "next/dynamic";
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
  return (
    <>
      <noscript>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Nexus Graph</h1>
          <p className="text-[var(--text-secondary)]">
            The interactive nexus graph requires JavaScript to render. Please enable JavaScript
            to explore the connections between repositories, documents, and tags in the
            Deliberate Ensemble project.
          </p>
          <p className="text-[var(--text-muted)] mt-4">
            Alternatively, browse the <Link href="/library" className="text-[var(--primary)] underline">Library</Link> or <Link href="/repos" className="text-[var(--primary)] underline">Repositories</Link> pages for a non-interactive view.
          </p>
        </div>
      </noscript>
      <NexusGraph />
    </>
  );
}

import Link from "next/link";

const services = [
  {
    id: "mental-health-mesh",
    title: "Mental Health Mesh",
    subtitle: "Offline-first p2p support network",
    description: `A Canada-based mesh network for mental health support that operates completely offline when connectivity is unavailable. Uses local peer-to-peer communication to maintain connectivity in remote areas or during outages. The temporary public preview address is no longer linked. The project source is on GitHub.`,
    url: "https://github.com/vortsghost2025/WE4FREE",
    linkLabel: "View source on GitHub",
    status: "source" as const,
    host: "GitHub",
    region: "Canada",
    bridge: "FreeAgent",
    icon: "🧠",
    tags: ["mental health", "p2p", "offline-first", "mesh network"],
    lastSeen: "2026-04-28"
  },
  {
    id: "federation-simulation",
    title: "Federation Simulation",
    subtitle: "Persistent multi-agent federation game",
    description: `The original federated simulation from the WE4FREE papers (Paper 3). It was a playable persistent game demonstrating multi-agent coordination across independent nodes. The live instance has been decommissioned, and the old web address does not respond. The environment state is preserved across legacy repositories as a historical artifact.`,
    url: null,
    linkLabel: null,
    status: "archived" as const,
    host: "Decommissioned",
    region: "Unknown",
    bridge: "FreeAgent (historical)",
    icon: "🌐",
    tags: ["simulation", "game", "multi-agent", "federation", "archival"],
    lastSeen: "2026-04-28"
  }
];

export const metadata = {
  title: "External Services — Deliberate Ensemble",
  description: "Federated dashboards and mesh-connected services outside the core 4-lane governance system."
};

export default function ServicesPage() {
  return (
    <div className="p-4 md:p-8 max-w-full min-w-0" data-pagefind-body>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">External Services</h1>
        <p className="text-[var(--text-secondary)]">
          Federated dashboards and mesh-connected services that bridge into the 4‑lane governance system.
        </p>
      </div>

      <div className="grid gap-6">
        {services.map((svc) => (
          <article
            key={svc.id}
            className={`card p-6 animate-fade-in min-w-0 ${svc.status === "archived" ? "border-l-4 border-l-[var(--warning)]" : "border-l-4 border-l-[var(--success)]"}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 shrink-0 rounded-full ${svc.status === "archived" ? "bg-[var(--warning)]/20" : "bg-[var(--success)]/20"} flex items-center justify-center text-2xl`} aria-hidden="true">
                  {svc.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{svc.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{svc.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {svc.status === "archived" ? (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30" aria-label="Status: Archived">
                    ARCHIVED
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30" aria-label="Status: source on GitHub">
                    ON GITHUB
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              {svc.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
              <span><strong>Host:</strong> {svc.host}</span>
              <span aria-hidden="true">•</span>
              <span><strong>Region:</strong> {svc.region}</span>
              <span aria-hidden="true">•</span>
              <span><strong>Bridge:</strong> {svc.bridge}</span>
              <span aria-hidden="true">•</span>
              <span><strong>Last seen:</strong> {svc.lastSeen}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {svc.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags?tag=${encodeURIComponent(tag)}`}
                  className="px-2 py-1 rounded-full bg-[var(--bg-base)] text-[var(--text-secondary)] text-xs hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {svc.url && svc.linkLabel && (
              <div className="mt-5">
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
                >
                  {svc.linkLabel}
                </a>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          All federated services are independently operated and bridged via FreeAgent.
          {' '}
          <a href="mailto:deliberateensemble@gmail.com" className="text-[var(--primary-text)] hover:underline">
            Want to connect your service?
          </a>
        </p>
      </div>
    </div>
  );
}

import { getStats } from "@/lib/site-index";
import Link from "next/link";

const services = [
  {
    id: "mental-health-mesh",
    title: "Mental Health Mesh",
    subtitle: "Offline-first p2p support network",
    description: `A Canada-based mesh network for mental health support that operates completely offline when connectivity is unavailable. Uses local peer-to-peer communication to maintain connectivity in remote areas or during outages. Integrated with the Deliberate Ensemble governance system via GitHub bridge.`,
    url: "https://orangered-jellyfish-637583.hostingersite.com/",
    status: "online",
    host: "Hostinger",
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
    description: `The original federated simulation from the WE4FREE papers (Paper 3). It was a playable persistent game demonstrating multi-agent coordination across independent nodes. The live instance has since been decommissioned; the environment state is preserved across legacy repositories as a historical artifact. Part of the research archive.`,
    url: "https://steelblue-elephant-526729.hostingersite.com/",
    status: "archived",
    host: "Hostinger",
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
  const stats = getStats();

  return (
    <div className="p-8" data-pagefind-body>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">External Services</h1>
        <p className="text-[var(--text-secondary)]">
          Federated dashboards and mesh-connected services that bridge into the 4‑lane governance system.
        </p>
      </div>

      <div className="grid gap-6">
        {services.map((svc) => (
          <div
            key={svc.id}
            className={`card p-6 animate-fade-in ${svc.status === 'online' ? 'border-l-4 border-l-[var(--success)]' : 'border-l-4 border-l-[var(--warning)]'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${svc.status === 'online' ? 'bg-[var(--success)]/20' : 'bg-[var(--warning)]/20'} flex items-center justify-center text-2xl`}>
                  {svc.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{svc.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{svc.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {svc.status === "online" ? (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                    ONLINE
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--warning)]/20 text-[var(--warning)] border border-[var(--warning)]/30">
                    ARCHIVED
                  </span>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              {svc.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
              <span><strong>Host:</strong> {svc.host}</span>
              <span>•</span>
              <span><strong>Region:</strong> {svc.region}</span>
              <span>•</span>
              <span><strong>Bridge:</strong> {svc.bridge}</span>
              <span>•</span>
              <span><strong>Last seen:</strong> {svc.lastSeen}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {svc.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags?tag=${encodeURIComponent(tag)}`}
                  className="px-2 py-1 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <div className="mt-5">
              <a
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary)]/80 transition-colors"
              >
                Open {svc.title}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          All federated services are independently operated and bridged via FreeAgent.
          {' '}
          <a href="mailto:deliberateensemble@gmail.com" className="text-[var(--primary)] hover:underline">
            Want to connect your service?
          </a>
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Logs",
  description: "Session transcripts are not published. Public operational views are Observability and System Pulse.",
};

export default function LogsPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl" data-pagefind-body>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Logs</h1>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        Session and verification transcripts stay in the private archive. They are not published on this site.
      </p>
      <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
        The public operational views are:
      </p>
      <ul className="space-y-2 text-[var(--text-primary)]">
        <li>
          <Link href="/observability" className="underline underline-offset-2 text-[var(--primary-text)] hover:text-[var(--primary-hover)]">
            Observability
          </Link>
          <span className="text-[var(--text-secondary)]"> — test monitoring and results</span>
        </li>
        <li>
          <Link href="/system-pulse" className="underline underline-offset-2 text-[var(--primary-text)] hover:text-[var(--primary-hover)]">
            System Pulse
          </Link>
          <span className="text-[var(--text-secondary)]"> — live telemetry</span>
        </li>
      </ul>
    </div>
  );
}

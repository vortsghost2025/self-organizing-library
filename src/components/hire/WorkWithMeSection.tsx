import Link from "next/link";
import { CONTACT_EMAIL, KOFI_URL, LINKEDIN_URL, paidOffers } from "@/lib/client-work";

interface WorkWithMeSectionProps {
  heading?: "h1" | "h2";
}

const linkClass =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]";

export function WorkWithMeSection({ heading = "h2" }: WorkWithMeSectionProps) {
  const Heading = heading;

  return (
    <section className="card p-5 md:p-8 space-y-6" aria-labelledby="work-with-me-heading">
      <div className="space-y-3 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary-text)]">
          Work with me
        </p>
        <Heading id="work-with-me-heading" className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Hire me
        </Heading>
        <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
          I build small-business websites and custom tools. This site stays a research archive.
          Paid work is simple: tell me what you need, I build it, and you pay on Ko-fi.
          Custom builds are welcome, and monthly care plans are available if you want
          someone to keep a site or an automation running.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-3 list-none p-0 m-0">
        {paidOffers.map((offer) => (
          <li key={offer.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-hover)] p-4 flex flex-col gap-3 min-w-0">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{offer.title}</h3>
              <p className="mt-1 text-base font-bold text-[var(--text-primary)]">{offer.price}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{offer.summary}</p>
            </div>
            <a
              href={offer.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} mt-auto bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]`}
            >
              Order on Ko-fi
              <span className="sr-only">: {offer.title}, {offer.price}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]`}
        >
          Support on Ko-fi
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className={`${linkClass} border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)]`}
        >
          Email {CONTACT_EMAIL}
        </a>
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)]`}
        >
          LinkedIn
        </a>
        {heading === "h2" && (
          <Link
            href="/hire"
            className={`${linkClass} border border-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary)]/15`}
          >
            Full services and project work
          </Link>
        )}
      </div>
    </section>
  );
}

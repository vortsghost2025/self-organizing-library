import { clientProjects } from "@/lib/client-work";

interface ClientWorkSectionProps {
  heading?: "h2" | "h3";
  compact?: boolean;
}

export function ClientWorkSection({ heading = "h2", compact = false }: ClientWorkSectionProps) {
  const Heading = heading;

  return (
    <section className="space-y-4" aria-labelledby="client-work-heading">
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary-text)]">
          Portfolio
        </p>
        <Heading id="client-work-heading" className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
          Client and project work
        </Heading>
        <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
          Live sites you can open. Each one has a Ko-fi link if you want something in the same spirit.
        </p>
      </div>

      <ul className={`grid gap-4 list-none p-0 m-0 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2"}`}>
        {clientProjects.map((project) => (
          <li key={project.url} className="card p-5 flex flex-col gap-3 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{project.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{project.summary}</p>
            <div className="mt-auto flex flex-col items-start gap-2 pt-1">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[var(--primary-text)] underline underline-offset-2 hover:text-[var(--primary-hover)] break-all"
              >
                Visit {project.title}
              </a>
              <a
                href={project.gigUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
              >
                Get one like this
                <span className="sr-only"> on Ko-fi, similar to {project.title}</span>
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

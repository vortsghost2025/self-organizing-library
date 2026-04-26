import { getEntries } from "@/lib/site-index";
import {
  mediumArticles,
  weAndAiPapers,
  deliberateAiEnsemble,
  osfPreprints,
  SOURCE_META,
  type PublicationEntry,
} from "@/lib/publications";
import Link from "next/link";

function SourceBadge({ source }: { source: PublicationEntry["source"] }) {
  const meta = SOURCE_META[source];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: `${meta.color}20`,
        color: meta.color,
      }}
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
        style={{ background: meta.color, color: "#0D0D0F" }}
      >
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

function PublicationCard({ pub, internalId }: { pub: PublicationEntry; internalId?: string }) {
  const isInternal = internalId !== undefined;
  const Wrapper = isInternal ? "div" : "a";
  const wrapperProps = isInternal
    ? {}
    : {
        href: pub.url,
        target: "_blank" as const,
        rel: "noopener noreferrer" as const,
      };

  return (
    <Wrapper
      {...wrapperProps}
      className="card p-5 hover:border-[var(--secondary)] animate-fade-in block"
    >
      <div className="flex items-center gap-2 mb-2">
        <SourceBadge source={pub.source} />
        {pub.date && (
          <span className="text-xs text-[var(--text-muted)]">
            {new Date(pub.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
      {isInternal ? (
        <Link
          href={`/library/${internalId}`}
          className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
        >
          {pub.title}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          {pub.title}
        </h3>
      )}
      {pub.description && (
        <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2 max-w-[65ch]">
          {pub.description}
        </p>
      )}
      {pub.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {pub.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Wrapper>
  );
}

function SourceSection({
  title,
  description,
  publications,
  repoUrl,
  accentColor,
  emptyMessage,
}: {
  title: string;
  description: string;
  publications: PublicationEntry[];
  repoUrl?: string;
  accentColor: string;
  emptyMessage?: string;
}) {
  if (publications.length === 0 && emptyMessage) {
    return (
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {title}
        </h2>
        <p className="text-[var(--text-muted)]">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="mb-12" aria-labelledby={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2
            id={`section-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="text-xl font-semibold text-[var(--text-primary)] mb-1"
          >
            {title}
            <span
              className="ml-2 text-sm font-normal"
              style={{ color: accentColor }}
            >
              ({publications.length})
            </span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-[65ch]">
            {description}
          </p>
        </div>
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: accentColor }}
          >
            View source &rarr;
          </a>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {publications.map((pub, i) => (
          <PublicationCard key={`${pub.source}-${i}`} pub={pub} />
        ))}
      </div>
    </section>
  );
}

function InternalPaperCard({
  id,
  title,
  description,
  tags,
  date,
}: {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  date: string | null;
}) {
  return (
    <div className="card p-5 hover:border-[var(--primary)] animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
          <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-[var(--primary)] text-white">
            R
          </span>
          Internal
        </span>
        {date && (
          <span className="text-xs text-[var(--text-muted)]">
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
      <Link
        href={`/library/${id}`}
        className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
      >
        {title}
      </Link>
      {description && (
        <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2 max-w-[65ch]">
          {description}
        </p>
      )}
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)]/15 text-[var(--secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function PapersPage() {
  const internalPapers = getEntries({ contentType: "doc", limit: 200 }).filter(
    (e) =>
      e.category === "paper" ||
      e.path.toLowerCase().includes("paper") ||
      e.path.toLowerCase().includes("rosetta")
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Publications
        </h1>
        <p className="text-[var(--text-secondary)] max-w-[65ch]">
          Research papers, architecture documents, and publications across all
          sources — from internal Rosetta Stone papers to external repositories
          and Medium articles.
        </p>
      </div>

      <div className="mb-8 flex gap-3 flex-wrap">
        {(
          Object.entries(SOURCE_META) as [PublicationEntry["source"], (typeof SOURCE_META)[PublicationEntry["source"]]][]
        ).map(([key, meta]) => (
          <a
            key={key}
            href={`#section-${meta.label.replace(/\s+/g, "-").toLowerCase()}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--secondary)] transition-colors"
            style={{ color: meta.color }}
          >
            <span
              className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ background: meta.color, color: "#0D0D0F" }}
            >
              {meta.icon}
            </span>
            {meta.label}
          </a>
        ))}
        {internalPapers.length > 0 && (
          <a
            href="#section-rosetta-stone-papers"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-[var(--primary)]"
          >
            <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-[var(--primary)] text-white">
              R
            </span>
            Internal Papers
          </a>
        )}
      </div>

      {internalPapers.length > 0 && (
        <section
          className="mb-12"
          aria-labelledby="section-rosetta-stone-papers"
        >
          <div className="mb-4">
            <h2
              id="section-rosetta-stone-papers"
              className="text-xl font-semibold text-[var(--text-primary)] mb-1"
            >
              Rosetta Stone Papers
              <span className="ml-2 text-sm font-normal text-[var(--primary)]">
                ({internalPapers.length})
              </span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-[65ch]">
              Internal papers indexed from the site library — Rosetta Stone
              series and foundational research
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {internalPapers.map((paper) => (
              <InternalPaperCard
                key={paper.id}
                id={paper.id}
                title={paper.title}
                description={paper.description}
                tags={paper.tags}
                date={paper.modified}
              />
            ))}
          </div>
        </section>
      )}

      <SourceSection
        title="Medium Articles"
        description={SOURCE_META.medium.description}
        publications={mediumArticles}
        repoUrl={SOURCE_META.medium.repoUrl}
        accentColor={SOURCE_META.medium.color}
      />

      <SourceSection
        title={SOURCE_META["we-and-ai-papers"].label}
        description={SOURCE_META["we-and-ai-papers"].description}
        publications={weAndAiPapers}
        repoUrl={SOURCE_META["we-and-ai-papers"].repoUrl}
        accentColor={SOURCE_META["we-and-ai-papers"].color}
      />

      <SourceSection
        title={SOURCE_META["deliberate-ai-ensemble"].label}
        description={SOURCE_META["deliberate-ai-ensemble"].description}
        publications={deliberateAiEnsemble}
        repoUrl={SOURCE_META["deliberate-ai-ensemble"].repoUrl}
        accentColor={SOURCE_META["deliberate-ai-ensemble"].color}
      />

      <SourceSection
        title={SOURCE_META.osf.label}
        description={SOURCE_META.osf.description}
        publications={osfPreprints}
        repoUrl={SOURCE_META.osf.repoUrl}
        accentColor={SOURCE_META.osf.color}
        emptyMessage="No OSF preprints loaded yet — check the OSF project page directly"
      />
    </div>
  );
}

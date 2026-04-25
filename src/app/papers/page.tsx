import { getEntries } from "@/lib/site-index";
import Link from "next/link";

export default async function PapersPage() {
  const papers = getEntries({ contentType: "doc", limit: 100 }).filter(
    (e) => e.category === "paper" || e.path.toLowerCase().includes("paper") || e.path.toLowerCase().includes("rosetta")
  );
  const allDocs = getEntries({ contentType: "doc", limit: 200 });
  const featuredDocs = allDocs.filter(
    (e) =>
      e.title.toLowerCase().includes("rosetta") ||
      e.title.toLowerCase().includes("summary") ||
      e.title.toLowerCase().includes("complete")
  );

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Papers</h1>
        <p className="text-[var(--text-secondary)]">The Rosetta Stone paper series and key research documents</p>
      </div>

      {papers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Rosetta Stone Papers</h2>
          <div className="grid grid-cols-1 gap-4">
            {papers.map((paper, i) => (
              <a
                key={paper.id}
                href={`/library/${paper.id}`}
                className={`card p-6 animate-fade-in stagger-${(i % 5) + 1} hover:border-[var(--secondary)]`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 rounded-full bg-[var(--secondary)]" />
                  <span className="text-sm text-[var(--text-muted)] uppercase tracking-wide">Paper</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{paper.title}</h3>
                {paper.description && (
                  <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2">{paper.description}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {paper.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-[var(--secondary)]/15 text-[var(--secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {featuredDocs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Key Documents</h2>
          <div className="grid grid-cols-2 gap-4">
            {featuredDocs.map((doc, i) => (
              <a
                key={doc.id}
                href={`/library/${doc.id}`}
                className={`card p-5 animate-fade-in stagger-${(i % 5) + 1} hover:border-[var(--primary)]`}
              >
                <h3 className="font-semibold text-[var(--text-primary)] mb-1 truncate">{doc.title}</h3>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2">{doc.description || doc.path}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {papers.length === 0 && featuredDocs.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-50">📝</div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No papers indexed yet</h3>
          <p className="text-[var(--text-muted)]">Run the index generator with multi-repo support</p>
        </div>
      )}
    </div>
  );
}

import { getSiteIndex, getCategories, getTopTags } from "@/lib/site-index";
import Link from "next/link";

export default async function ReposPage() {
  const index = getSiteIndex();
  const categories = getCategories();
  const topTags = getTopTags(12);

  const repoGroups: Record<string, { count: number; categories: Record<string, number> }> = {};
  for (const entry of index.entries) {
    if (!repoGroups[entry.repo]) {
      repoGroups[entry.repo] = { count: 0, categories: {} };
    }
    repoGroups[entry.repo].count++;
    repoGroups[entry.repo].categories[entry.category] = (repoGroups[entry.repo].categories[entry.category] || 0) + 1;
  }

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Repositories</h1>
        <p className="text-[var(--text-secondary)]">
          The Deliberate Ensemble system spans 4 coordinated lanes
        </p>
      </div>

      {/* Section: The 4 Lanes */}
      <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">The 4 Lanes</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { name: "Library", desc: "Documentation, verification, and coordination hub", href: "/library", color: "var(--primary)" },
          { name: "Archivist", desc: "Governance, sovereignty, and identity enforcement", href: "/archivist", color: "var(--secondary)" },
          { name: "Kernel", desc: "Runtime enforcement, constraint lattice, OS-level policies", href: "/kernel", color: "var(--success)" },
          { name: "SwarmMind", desc: "Multi-agent drift detection and constraint verification", href: "/swarmmind", color: "var(--warning)" },
        ].map((lane) => (
          <Link key={lane.name} href={lane.href} className={`card p-4 hover:border-[${lane.color}] transition-colors`}>
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{lane.name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{lane.desc}</p>
          </Link>
        ))}
      </div>

      {/* Section: All Repositories */}
      <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">All Repositories</h2>
      <div className="space-y-6">
        {Object.entries(repoGroups).map(([repo, data], i) => (
          <div key={repo} className={`card p-6 animate-fade-in stagger-${(i % 5) + 1}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center text-xl text-[var(--primary-text)]">
                  ⌘
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{repo}</h3>
                  <a
                    href={`https://github.com/vortsghost2025/${repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--secondary)] hover:underline"
                  >
                    vortsghost2025/{repo}
                  </a>
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-surface-hover)] rounded">
                {data.count} files
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(data.categories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([cat, count]) => (
                  <Link
                    key={cat}
                    href={`/library?category=${cat}`}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    {cat} ({count})
                  </Link>
                ))}
            </div>
          </div>
        ))}

        <div className="card p-6 border-dashed">
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-2xl text-[var(--text-muted)] mb-4">
              +
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">More Repos Coming</h3>
            <p className="text-sm text-[var(--text-muted)] text-center">
              Additional repos will be indexed as the archive grows
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 mt-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Index Stats</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[var(--primary)]">{index.entries.length}</div>
            <div className="text-sm text-[var(--text-muted)]">Total Documents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--secondary)]">{Object.keys(index.tag_index).length}</div>
            <div className="text-sm text-[var(--text-muted)]">Tags</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--success)]">{categories.length}</div>
            <div className="text-sm text-[var(--text-muted)]">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--warning)]">{index.cross_references.length}</div>
            <div className="text-sm text-[var(--text-muted)]">Cross-Refs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

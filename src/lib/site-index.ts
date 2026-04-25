import siteIndex from '../../data/site-index.json';

export interface IndexEntry {
  id: string;
  repo: string;
  path: string;
  github_url: string;
  title: string;
  extension: string;
  content_type: string;
  category: string;
  breadcrumbs: string[];
  tags: string[];
  date: string | null;
  modified: string;
  size_bytes: number;
  description: string | null;
  content_snippet: string | null;
}

export interface CrossRef {
  source: string;
  target: string;
  type: string;
  label: string;
}

export interface RepoStats {
  total_files: number;
  total_size_bytes: number;
  by_content_type: Record<string, number>;
  by_category: Record<string, number>;
}

export interface SiteIndex {
  schema_version: string;
  generated_at: string;
  github_org: string;
  repo_roots: Record<string, string>;
  stats: {
    total_files: number;
    by_content_type: Record<string, number>;
    by_category: Record<string, number>;
    by_extension: Record<string, number>;
    total_size_bytes: number;
    by_repo: Record<string, RepoStats>;
  };
  tag_index: Record<string, string[]>;
  cross_references: CrossRef[];
  entries: IndexEntry[];
}

const index = siteIndex as SiteIndex;

export function getSiteIndex(): SiteIndex {
  return index;
}

export function getRepoRoots(): Record<string, string> {
  return index.repo_roots || {};
}

export function getRepoRoot(repoName: string): string | undefined {
  return index.repo_roots?.[repoName];
}

export function getRepos(): { name: string; fileCount: number; sizeBytes: number }[] {
  const byRepo = index.stats.by_repo || {};
  return Object.entries(byRepo).map(([name, rs]) => ({
    name,
    fileCount: rs.total_files,
    sizeBytes: rs.total_size_bytes,
  })).sort((a, b) => b.fileCount - a.fileCount);
}

export function getEntries(options?: {
  category?: string;
  contentType?: string;
  tag?: string;
  repo?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): IndexEntry[] {
  let filtered = index.entries;

  if (options?.category) {
    filtered = filtered.filter(e => e.category === options.category);
  }
  if (options?.contentType) {
    filtered = filtered.filter(e => e.content_type === options.contentType);
  }
  if (options?.repo) {
    filtered = filtered.filter(e => e.repo === options.repo);
  }
  if (options?.tag) {
    const tagIds = index.tag_index[options.tag] || [];
    const idSet = new Set(tagIds);
    filtered = filtered.filter(e => idSet.has(e.id));
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.path.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  filtered.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  return filtered.slice(offset, offset + limit);
}

export function getEntryById(id: string): IndexEntry | undefined {
  return index.entries.find(e => e.id === id);
}

export function getEntriesByTag(tag: string): IndexEntry[] {
  const ids = index.tag_index[tag] || [];
  const idSet = new Set(ids);
  return index.entries.filter(e => idSet.has(e.id));
}

export function getCategories(): { category: string; count: number }[] {
  return Object.entries(index.stats.by_category)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getTopTags(limit = 30): { tag: string; count: number }[] {
  return Object.entries(index.tag_index)
    .map(([tag, ids]) => ({ tag, count: ids.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getStats() {
  return {
    totalFiles: index.stats.total_files,
    totalSize: index.stats.total_size_bytes,
    docCount: index.stats.by_content_type.doc || 0,
    codeCount: index.stats.by_content_type.code || 0,
    dataCount: (index.stats.by_content_type.data || 0) + (index.stats.by_content_type.schema || 0),
    tagCount: Object.keys(index.tag_index).length,
    categoryCount: Object.keys(index.stats.by_category).length,
    crossRefCount: index.cross_references.length,
    repoCount: Object.keys(index.stats.by_repo || {}).length,
    generatedAt: index.generated_at,
  };
}

export function getGraphData() {
  const tagIndex = index.tag_index;
  const edges: { source: string; target: string; type: string }[] = [];

  for (const refs of index.cross_references) {
    edges.push({ source: refs.source, target: refs.target, type: refs.type });
  }

  for (const [tag, ids] of Object.entries(tagIndex)) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = i + 1; j < Math.min(ids.length, i + 4); j++) {
        edges.push({ source: ids[i], target: ids[j], type: 'shared-tag' });
      }
    }
  }

  const nodes = index.entries.map(e => ({
    id: e.id,
    title: e.title,
    type: e.content_type,
    category: e.category,
    repo: e.repo,
    connectionCount: edges.filter(edge => edge.source === e.id || edge.target === e.id).length,
    tags: e.tags,
  }));

  return { nodes, edges };
}

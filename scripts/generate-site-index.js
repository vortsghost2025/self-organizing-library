#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const REPO_NAME = 'self-organizing-library';
const GITHUB_BASE = `https://github.com/vortsghost2025/${REPO_NAME}/blob/main`;

const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', '.ruff_cache', '.identity', '.trust',
  '.memory', 'context-buffer', '.runtime', 'out', 'build', 'coverage',
  '.vercel', 'dist', '.cache'
]);

const EXCLUDE_PATTERNS = [
  /^node_modules$/,
  /^\.next$/,
  /^\.git$/,
  /^\.ruff_cache$/,
  /^\.identity$/,
  /^\.trust$/,
  /^\.memory$/,
  /^context-buffer$/,
  /^\.runtime$/,
  /^\.vercel$/,
  /^dist$/,
  /^\.cache$/,
];

const CONTENT_EXTENSIONS = new Set([
  '.md', '.mdx', '.txt', '.json', '.yaml', '.yml',
  '.js', '.ts', '.tsx', '.jsx', '.py', '.mjs'
]);

const SKIP_FILES = new Set([
  'package-lock.json', 'bun.lock', 'yarn.lock', 'pnpm-lock.yaml',
  'tsconfig.tsbuildinfo', 'next-env.d.ts', '.DS_Store',
  'nul', 'test-write-permission.txt'
]);

const SKIP_PATTERNS = [
  /\.tsbuildinfo$/,
  /^nul$/,
];

const CONTENT_TYPE_MAP = {
  '.md': 'doc', '.mdx': 'doc', '.txt': 'doc',
  '.json': 'data', '.yaml': 'config', '.yml': 'config',
  '.js': 'code', '.mjs': 'code', '.ts': 'code', '.tsx': 'code', '.jsx': 'code',
  '.py': 'code'
};

const CATEGORY_MAP = {
  'library/books': 'paper',
  'library/docs/papers': 'paper',
  'library/docs/specs': 'spec',
  'library/docs/verification': 'verification',
  'library/docs/failure-modes': 'failure-mode',
  'library/docs/attestation': 'attestation',
  'library/docs/archivist': 'governance',
  'library/docs/reflection': 'reflection',
  'library/docs/pending': 'pending',
  'schemas': 'schema',
  'scripts': 'script',
  'src/attestation': 'attestation',
  'src/audit': 'audit',
  'src/identity': 'identity',
  'src/lane': 'lane-protocol',
  'src/resilience': 'resilience',
  'src/swarmmind': 'swarmmind',
  'src/queue': 'queue',
  'src/usage': 'usage',
  'src/memory': 'memory',
  'src/db': 'database',
  'lanes': 'lane-protocol',
  'docs': 'docs',
  'tests': 'test',
  'verification': 'verification',
  'config': 'config',
  'data': 'data',
};

const TAG_EXTRACTION_PATTERNS = [
  /\b(NFM-\d{3})\b/g,
  /\b(Phase\s*\d+(?:\.\d+)?)/gi,
  /\b(Rosetta\s+Stone)\b/gi,
  /\b(Convergence\s+Gate)\b/gi,
  /\b(Identity\s+Enforcement)\b/gi,
  /\b(Failure\s+Mode)\b/gi,
  /\b(Lane\s+Relay)\b/gi,
  /\b(Constitutional\s+AI)\b/gi,
  /\b(Multi[- ]?Agent)\b/gi,
  /\b(CAISC\s*2026)\b/gi,
  /\b(Covenant)\b/gi,
  /\b(Governance)\b/gi,
  /\b(Attestation)\b/gi,
  /\b(Verification)\b/gi,
  /\b(Drift)\b/gi,
  /\b(Ensemble)\b/gi,
  /\b(Constraint\s+Lattice)\b/gi,
  /\b(Phenotype)\b/gi,
  /\b(Basin\s+Dynamics)\b/gi,
  /\b(WE4FREE)\b/gi,
];

function shouldExcludeDir(dirName) {
  return EXCLUDE_PATTERNS.some(p => p.test(dirName));
}

function shouldSkipFile(filePath, fileName) {
  if (SKIP_FILES.has(fileName)) return true;
  if (SKIP_PATTERNS.some(p => p.test(fileName))) return true;
  return false;
}

function getRelativePath(fullPath) {
  return path.relative(REPO_ROOT, fullPath).replace(/\\/g, '/');
}

function getContentType(ext) {
  return CONTENT_TYPE_MAP[ext] || 'unknown';
}

function getCategory(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  for (const [prefix, category] of Object.entries(CATEGORY_MAP)) {
    if (normalized.startsWith(prefix)) return category;
  }
  if (normalized.includes('/')) return 'misc';
  return 'root-doc';
}

function getBreadcrumbs(relativePath) {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  return parts.slice(0, -1).filter(p => p.length > 0);
}

function extractTitle(content, fileName) {
  const frontmatterTitle = content.match(/^---[\s\S]*?title:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (frontmatterTitle) return frontmatterTitle[1].trim();

  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim().replace(/[*_`\[\]]/g, '');

  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

function normalizeTag(tag) {
  if (/^NFM-\d{3}$/.test(tag)) return tag;
  if (/^CAISC\s*2026$/i.test(tag)) return 'CAISC 2026';
  if (/^WE4FREE$/i.test(tag)) return 'WE4FREE';
  if (/^constitutional\s+ai$/i.test(tag)) return 'Constitutional AI';
  return tag.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function extractTags(content) {
  const tags = new Set();
  for (const pattern of TAG_EXTRACTION_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      tags.add(normalizeTag(match[1].trim()));
    }
  }
  return Array.from(tags);
}

function extractDate(content, filePath) {
  const frontmatterDate = content.match(/^---[\s\S]*?date:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/);
  if (frontmatterDate) return frontmatterDate[1].trim();

  const dateInName = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateInName) return dateInName[1];

  return null;
}

function extractDescription(content) {
  const stripped = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  const firstParagraph = stripped.match(/^(.{80,300}?)(?:\n|$)/);
  if (firstParagraph) {
    return firstParagraph[1].replace(/[*_`\[\]()]/g, '').trim();
  }
  return null;
}

function extractFrontmatterTags(content) {
  const fmTags = content.match(/^---[\s\S]*?tags:\s*\[([^\]]+)\][\s\S]*?---/);
  if (fmTags) {
    return fmTags[1].split(',').map(t => t.trim().replace(/["']/g, '')).filter(Boolean);
  }

  const fmTagsYaml = content.match(/^---[\s\S]*?tags:\s*\n((?:\s+-\s+.+\n)+)[\s\S]*?---/);
  if (fmTagsYaml) {
    return fmTagsYaml[1].match(/-\s+(.+)/g)?.map(t => t.replace(/-\s+/, '').trim()) || [];
  }

  return [];
}

function computeId(relativePath) {
  return crypto.createHash('sha256').update(relativePath).digest('hex').slice(0, 16);
}

function walkDir(dir) {
  const entries = [];
  const queue = [dir];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    let items;
    try {
      items = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        if (!shouldExcludeDir(item.name)) {
          queue.push(fullPath);
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (CONTENT_EXTENSIONS.has(ext) && !shouldSkipFile(fullPath, item.name)) {
          entries.push(fullPath);
        }
      }
    }
  }

  return entries;
}

function processFile(fullPath) {
  const relativePath = getRelativePath(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const fileName = path.basename(fullPath);
  const stat = fs.statSync(fullPath);

  const entry = {
    id: computeId(relativePath),
    repo: REPO_NAME,
    path: relativePath,
    github_url: `${GITHUB_BASE}/${relativePath}`,
    title: fileName,
    extension: ext,
    content_type: getContentType(ext),
    category: getCategory(relativePath),
    breadcrumbs: getBreadcrumbs(relativePath),
    tags: [],
    date: null,
    modified: stat.mtime.toISOString(),
    size_bytes: stat.size,
    description: null
  };

  if (ext === '.md' || ext === '.mdx' || ext === '.txt') {
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      entry.title = extractTitle(content, fileName);
      entry.tags = [...new Set([...extractFrontmatterTags(content).map(normalizeTag), ...extractTags(content)])];
      entry.date = extractDate(content, relativePath);
      entry.description = extractDescription(content);
    } catch (e) {
      // skip content extraction on read error
    }
  }

  if (ext === '.json' && fileName !== 'package.json' && fileName !== 'tsconfig.json') {
    const relPath = relativePath.toLowerCase();
    if (relPath.includes('schema') || relPath.includes('schemas')) {
      entry.content_type = 'schema';
    } else if (relPath.includes('config') || relPath.includes('drizzle')) {
      entry.content_type = 'config';
    } else if (relPath.includes('test') || relPath.includes('spec')) {
      entry.content_type = 'test-data';
    }
  }

  return entry;
}

function buildRepoStats(entries) {
  const stats = {
    total_files: entries.length,
    by_content_type: {},
    by_category: {},
    by_extension: {},
    total_size_bytes: 0
  };

  for (const entry of entries) {
    stats.total_size_bytes += entry.size_bytes;
    stats.by_content_type[entry.content_type] = (stats.by_content_type[entry.content_type] || 0) + 1;
    stats.by_category[entry.category] = (stats.by_category[entry.category] || 0) + 1;
    stats.by_extension[entry.extension] = (stats.by_extension[entry.extension] || 0) + 1;
  }

  return stats;
}

function buildTagIndex(entries) {
  const tagIndex = {};
  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (!tagIndex[tag]) tagIndex[tag] = [];
      tagIndex[tag].push(entry.id);
    }
  }
  return tagIndex;
}

function buildCrossReferences(entries) {
  const refs = [];
  const entryMap = new Map(entries.map(e => [e.id, e]));
  const pathMap = new Map(entries.map(e => [e.path, e]));

  for (const entry of entries) {
    if (entry.content_type !== 'doc') continue;
    try {
      const fullPath = path.join(REPO_ROOT, entry.path);
      const content = fs.readFileSync(fullPath, 'utf-8');

      const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkPattern.exec(content)) !== null) {
        let linkTarget = match[2];
        if (linkTarget.startsWith('http')) continue;
        linkTarget = linkTarget.split('#')[0].split('?')[0];
        if (!linkTarget) continue;

        const sourceDir = path.dirname(fullPath);
        const resolvedPath = path.resolve(sourceDir, linkTarget);
        const relTarget = getRelativePath(resolvedPath);
        const targetEntry = pathMap.get(relTarget);
        if (targetEntry && targetEntry.id !== entry.id) {
          refs.push({
            source: entry.id,
            target: targetEntry.id,
            type: 'link',
            label: match[1].slice(0, 80)
          });
        }
      }
    } catch (e) {
      // skip
    }
  }

  return refs;
}

function main() {
  console.log(`Scanning ${REPO_ROOT}...`);
  const files = walkDir(REPO_ROOT);
  console.log(`Found ${files.length} content files`);

  const entries = [];
  for (const file of files) {
    try {
      entries.push(processFile(file));
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
    }
  }

  console.log(`Processed ${entries.length} entries`);
  console.log('Building cross-references...');
  const crossRefs = buildCrossReferences(entries);
  console.log(`Found ${crossRefs.length} cross-references`);

  const tagIndex = buildTagIndex(entries);
  const repoStats = buildRepoStats(entries);

  const index = {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    repo: REPO_NAME,
    github_org: 'vortsghost2025',
    github_url: `https://github.com/vortsghost2025/${REPO_NAME}`,
    stats: repoStats,
    tag_index: tagIndex,
    cross_references: crossRefs,
    entries: entries
  };

  const outputPath = path.join(REPO_ROOT, 'data', 'site-index.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Index written to ${outputPath}`);
  console.log(`  ${entries.length} entries`);
  console.log(`  ${Object.keys(tagIndex).length} unique tags`);
  console.log(`  ${crossRefs.length} cross-references`);
  console.log(`  ${repoStats.total_size_bytes.toLocaleString()} total bytes`);

  const summaryPath = path.join(REPO_ROOT, 'data', 'site-index-summary.json');
  const summary = {
    schema_version: '1.0',
    generated_at: index.generated_at,
    repo: REPO_NAME,
    stats: repoStats,
    tag_count: Object.keys(tagIndex).length,
    cross_ref_count: crossRefs.length,
    top_tags: Object.entries(tagIndex)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 30)
      .map(([tag, ids]) => ({ tag, count: ids.length })),
    category_breakdown: repoStats.by_category
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary written to ${summaryPath}`);
}

main();

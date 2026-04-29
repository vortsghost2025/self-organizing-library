#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPOS = [
  {
    name: 'self-organizing-library',
    root: 'S:/self-organizing-library',
    github: 'https://github.com/vortsghost2025/self-organizing-library/blob/main',
    categoryMap: {
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
  'docs': 'docs',
      'tests': 'test',
      'verification': 'verification',
      'config': 'config',
      'data': 'data',
    },
    maxDepth: Infinity,
    excludeDirs: new Set([
      '.kilo', '.kilocode', '.claude', '.cursor', '.aider-desk',
      'tmp', 'out',
    ]),
  },
  {
    name: 'Archivist-Agent',
    root: 'S:/Archivist-Agent',
    github: 'https://github.com/vortsghost2025/Archivist-Agent/blob/main',
    categoryMap: {
      'docs': 'docs',
      'docs/spec': 'spec',
    'docs/verification': 'verification',
    'papers': 'paper',
      'logs': 'log',
      'config': 'config',
      'projects': 'project',
      'COORDINATION': 'coordination',
      'context': 'context',
      'schemas': 'schema',
      'scripts': 'script',
      'src/attestation': 'attestation',
      'src/core': 'governance',
      'src/lane': 'lane-protocol',
      'src/orchestrator': 'governance',
      'src/monitoring': 'monitoring',
      'src/queue': 'queue',
      'src/memory': 'memory',
      'src/bridge': 'bridge',
      'src/tools': 'tool',
      'tests': 'test',
      'verification': 'verification',
      'data': 'data',
      'library': 'library',
    },
    maxDepth: Infinity,
    excludeDirs: new Set([
      '.overstory', '.kilo', '.kilocode', '.claude', '.cursor', '.aider-desk',
      '.pi', '.mulch', '.sapling', '.canopy', '.seeds', '.global',
      '.artifacts', '.compact-audit', '.test-trust', '.test-memory',
      '.test-identity', '.continuity_test', '.continuity_test2',
      '.continuity_test2b', '.continuity_test3', '.continuity_test4',
      '.lane-relay', 'backup_static_old', 'target', 'public_html',
    ]),
  },
  {
    name: 'SwarmMind-Self-Optimizing-Multi-Agent-AI-System',
    root: 'S:/SwarmMind',
    github: 'https://github.com/vortsghost2025/SwarmMind-Self-Optimizing-Multi-Agent-AI-System/blob/main',
    categoryMap: {
      'docs': 'docs',
      'src': 'code',
      'scripts': 'script',
      'tests': 'test',
    'config': 'config',
    'schemas': 'schema',
    'data': 'data',
  },
  maxDepth: Infinity,
  excludeDirs: new Set([
    '.kilo', '.kilocode', '.claude', '.cursor', '.aider-desk',
    '.pi', '.mulch', '.sapling', '.canopy', '.seeds',
    '.global', '.compact-audit', '.test-trust', '.test-memory',
    '.test-identity', '.continuity_test', '.continuity_test2',
    '.continuity_test2b', '.continuity_test3', '.continuity_test4',
    'worktrees', 'tmp',
  ]),
  },
  {
    name: 'kernel-lane',
    root: 'S:/kernel-lane',
    github: 'https://github.com/vortsghost2025/kernel-lane/blob/main',
    categoryMap: {
      'kernels': 'kernel',
      'docs': 'docs',
      'schemas': 'schema',
      'scripts': 'script',
    'src': 'code',
    'benchmarks': 'benchmark',
      'integration': 'integration',
      'config': 'config',
      'profiles': 'profile',
      'baselines': 'baseline',
    },
    maxDepth: Infinity,
  },
  {
    name: 'federation',
    root: 'S:/federation',
    github: 'https://github.com/vortsghost2025/federation/blob/main',
    categoryMap: {
      'docs': 'docs',
      'src': 'code',
      'scripts': 'script',
      'schemas': 'schema',
    'config': 'config',
    'data': 'data',
  },
  maxDepth: Infinity,
},
  {
    name: 'FreeAgent',
    root: 'S:/FreeAgent',
    github: 'https://github.com/vortsghost2025/FreeAgent/blob/main',
    categoryMap: {
      'docs': 'docs',
      'src': 'code',
      'scripts': 'script',
      'config': 'config',
    'schemas': 'schema',
    'tests': 'test',
      'data': 'data',
      'library': 'library',
      'verification': 'verification',
    },
    maxDepth: 3,
    extensionsOnly: ['.md', '.mdx', '.txt'],
    excludeDirs: new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.cache', '.vercel',
    'supreme-octo-computing-machine', 'context-buffer', '.identity', '.trust', '.memory', '.runtime']),
  },
  {
    name: 'papers',
    root: 'S:/papers',
    github: 'https://github.com/vortsghost2025/papers/blob/main',
    categoryMap: {
      'papers': 'paper',
    },
    maxDepth: 1,
    extensionsOnly: ['.pdf'],
    excludeDirs: new Set(['.git']),
  },
  {
    name: 'storytime',
    root: 'S:/storytime',
    github: 'https://github.com/vortsghost2025/storytime/blob/main',
    categoryMap: {
      'docs': 'docs',
      'src': 'code',
      'scripts': 'script',
      'tests': 'test',
      'test': 'test',
      'config': 'config',
    'data': 'data',
    'schemas': 'schema',
      'logs': 'log',
      'agents': 'agent',
      'templates': 'template',
    },
    maxDepth: Infinity,
    excludeDirs: new Set([
      '.overstory', '.kilo', '.kilocode', '.claude', '.cursor', '.aider-desk',
      '.pi', '.mulch', '.sapling', '.canopy', '.seeds', '.cline',
    ]),
  },
  {
    name: 'Deliberate-AI-Ensemble',
    root: 'S:/April152026mainreferencepoint',
    github: 'https://github.com/vortsghost2025/Deliberate-AI-Ensemble/blob/main',
    categoryMap: {
      'Deliberate-AI-Ensemble-main/Deliberate-AI-Ensemble-main/agents/architecture': 'architecture',
      'Deliberate-AI-Ensemble-main/Deliberate-AI-Ensemble-main/agents': 'agent',
      'Deliberate-AI-Ensemble-main/Deliberate-AI-Ensemble-main': 'governance',
      'we4free_aws_iac_bundles': 'iac',
      'WE4FREE_Sean_Infra_Replay_Constraints_Drift_Bundle': 'drift',
      'WE4FREE_Sean_Resilience_Code_Bundle': 'resilience',
      'resilience_bundle_preview': 'resilience',
      'papers-20260416T223833Z-3-001': 'paper',
      'git-20260416T223826Z-3-001': 'git-history',
    },
    maxDepth: 5,
    extensionsOnly: ['.md', '.mdx', '.txt', '.py', '.json', '.yaml', '.yml', '.js', '.ts', '.html'],
    excludeDirs: new Set([
      '__pycache__', '.git', 'node_modules', '.vscode', 'we4free_website',
      'connection_bridge', 'medical_data_poc', 'consensus_checker',
    ]),
  },
];

const DEFAULT_EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', '.ruff_cache', '.identity', '.trust',
  '.memory', 'context-buffer', '.runtime', 'out', 'build', 'coverage',
  '.vercel', 'dist', '.cache', 'target', '.turbo', '.astro', '.nuxt',
  '.svelte-kit', '.vuepress', '.docusaurus', '.terraform', '.tox',
  '__pycache__', '.pytest_cache', '.mypy_cache', '.venv', 'venv',
  '.pytest_cache', 'tmp', 'worktrees',
  'lanes', '.tmp',
]);

const DEFAULT_EXTENSIONS = new Set([
  '.md', '.mdx', '.txt', '.json', '.yaml', '.yml',
  '.js', '.ts', '.tsx', '.jsx', '.py', '.mjs', '.pdf'
]);

const SKIP_FILES = new Set([
  'package-lock.json', 'bun.lock', 'yarn.lock', 'pnpm-lock.yaml',
  'tsconfig.tsbuildinfo', 'next-env.d.ts', '.DS_Store',
  'nul', 'test-write-permission.txt'
]);

const CONTENT_TYPE_MAP = {
  '.md': 'doc', '.mdx': 'doc', '.txt': 'doc',
  '.json': 'data', '.yaml': 'config', '.yml': 'config',
  '.js': 'code', '.mjs': 'code', '.ts': 'code', '.tsx': 'code', '.jsx': 'code',
  '.py': 'code', '.pdf': 'paper'
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
  /\b(Kernel)\b/gi,
  /\b(SwarmMind)\b/gi,
  /\b(Archivist)\b/gi,
  /\b(Library)\b/gi,
  /\b(Federation)\b/gi,
  /\b(FreeAgent)\b/gi,
  /\b(Force\s+Atlas)/gi,
  /\b(Sigma\.js)\b/gi,
  /\b(Graphology)\b/gi,
];

function shouldExcludeDir(dirName, repoConfig) {
  if (repoConfig.excludeDirs && repoConfig.excludeDirs.has(dirName)) return true;
  return DEFAULT_EXCLUDE_DIRS.has(dirName);
}

function shouldSkipFile(fileName) {
  return SKIP_FILES.has(fileName);
}

function getRelativePath(fullPath, repoRoot) {
  return path.relative(repoRoot, fullPath).replace(/\\/g, '/');
}

function getContentType(ext) {
  return CONTENT_TYPE_MAP[ext] || 'unknown';
}

function getCategory(relativePath, categoryMap) {
  const normalized = relativePath.replace(/\\/g, '/');
  for (const [prefix, category] of Object.entries(categoryMap)) {
    if (normalized.startsWith(prefix)) return category;
  }
  if (normalized.includes('/')) {
    const topDir = normalized.split('/')[0];
    const dirMap = {
      'src': 'code',
      'src-tauri': 'code',
      'docs': 'docs',
      'scripts': 'script',
      'tests': 'test',
    'schemas': 'schema',
    'config': 'config',
      'data': 'data',
      'library': 'library',
      'papers': 'paper',
      'logs': 'log',
      'verification': 'verification',
      'projects': 'project',
      'context': 'context',
      'COORDINATION': 'coordination',
      'agents': 'agent',
      'medical': 'medical',
      'core': 'code',
      'utils': 'code',
      'tools': 'code',
      'bridge': 'code',
      'redis': 'infrastructure',
      'swarmmind-governance-extension': 'governance',
      'federation-game': 'game',
      'federationpublichtml': 'web',
      'WE4FREE': 'we4free',
      'we4free_global': 'we4free',
      'we4free_website': 'we4free',
      'DISTRIBUTED_MICROSERVICES_UNIVERSE': 'distributed',
      'distributed': 'distributed',
      'SESSION_RECORDS': 'log',
      'releases': 'release',
      'scratch': 'scratch',
      'public': 'web',
      'tmp': 'scratch',
      '_root': 'root-doc',
      '_extracted': 'data',
      'math': 'math',
      'intelligence': 'ai',
      'cockpit': 'ui',
      'cockpit-spine': 'ui',
      'who-project': 'project',
      'originals': 'data',
      'ci': 'infrastructure',
      'quantum_consciousness_networks': 'ai',
      'meta_narrative_synthesis_engines': 'ai',
      'reality_fabric_protectors': 'ai',
      'service_orchestration': 'infrastructure',
      'temporal_stability_fields': 'ai',
      'connection_bridge': 'infrastructure',
      'ensemble_storage': 'data',
      'state': 'code',
      'introspection': 'ai',
      'registry': 'infrastructure',
      'monitoring': 'monitoring',
      'ui': 'ui',
      'phase-6': 'phase-6',
      'uss-chaosbringer': 'game',
      'uss_chaosbringer': 'game',
      'agents-public': 'agent',
      'federation_saves': 'data',
      'cleanup-2026-02-22': 'scratch',
      'sensitive': 'sensitive',
      'AGENTS': 'agent',
      'AGENT_COORDINATION': 'coordination',
    };
    if (dirMap[topDir]) return dirMap[topDir];
    if (topDir.startsWith('.')) return 'config';
    return topDir;
  }
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

function extractContentSnippet(content, maxLen = 500) {
  const stripped = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .replace(/[*_~]/g, '')
    .trim();

  if (stripped.length <= maxLen) return stripped || null;
  const truncated = stripped.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.7 ? truncated.slice(0, lastSpace) : truncated) || null;
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

function computeId(repoName, relativePath) {
  return crypto.createHash('sha256').update(`${repoName}:${relativePath}`).digest('hex').slice(0, 16);
}

function walkDir(repoRoot, repoConfig) {
  const entries = [];
  const queue = [{ dir: repoRoot, depth: 0 }];

  const allowedExtensions = repoConfig.extensionsOnly
    ? new Set(repoConfig.extensionsOnly)
    : DEFAULT_EXTENSIONS;

  const maxDepth = repoConfig.maxDepth || Infinity;

  while (queue.length > 0) {
    const { dir, depth } = queue.shift();
    let items;
    try {
      items = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        if (!shouldExcludeDir(item.name, repoConfig) && depth < maxDepth) {
          queue.push({ dir: fullPath, depth: depth + 1 });
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (allowedExtensions.has(ext) && !shouldSkipFile(item.name)) {
          entries.push(fullPath);
        }
      }
    }
  }

  return entries;
}

function processFile(fullPath, repoConfig) {
  const relativePath = getRelativePath(fullPath, repoConfig.root);
  const ext = path.extname(fullPath).toLowerCase();
  const fileName = path.basename(fullPath);
  const stat = fs.statSync(fullPath);

  const entry = {
    id: computeId(repoConfig.name, relativePath),
    repo: repoConfig.name,
    path: relativePath,
    github_url: `${repoConfig.github}/${relativePath}`,
    title: fileName,
    extension: ext,
    content_type: getContentType(ext),
    category: getCategory(relativePath, repoConfig.categoryMap),
    breadcrumbs: getBreadcrumbs(relativePath),
    tags: [],
    date: null,
    modified: stat.mtime.toISOString(),
    size_bytes: stat.size,
    description: null,
    content_snippet: null
  };

  if (ext === '.md' || ext === '.mdx' || ext === '.txt') {
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      entry.title = extractTitle(content, fileName);
      entry.tags = [...new Set([...extractFrontmatterTags(content).map(normalizeTag), ...extractTags(content)])];
      entry.date = extractDate(content, relativePath);
      entry.description = extractDescription(content);
      entry.content_snippet = extractContentSnippet(content);
    } catch (e) {
      // skip content extraction on read error
    }
  }

  if (ext === '.pdf') {
    const nameNoExt = fileName.replace(/\.pdf\.pdf$/i, '').replace(/\.pdf$/i, '');
    const numPrefix = nameNoExt.match(/^(\d+)_/);
    const titlePart = numPrefix ? nameNoExt.slice(numPrefix[0].length) : nameNoExt;
    entry.title = titlePart.replace(/_/g, ' ').replace(/[-]/g, ' ').trim();
    entry.tags = extractTags(entry.title);
    entry.date = extractDate(entry.title, relativePath);
    entry.description = `PDF paper: ${entry.title}`;
    entry.content_snippet = null;
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
  const byRepo = {};
  for (const entry of entries) {
    if (!byRepo[entry.repo]) {
      byRepo[entry.repo] = { total_files: 0, total_size_bytes: 0, by_content_type: {}, by_category: {} };
    }
    const rs = byRepo[entry.repo];
    rs.total_files++;
    rs.total_size_bytes += entry.size_bytes;
    rs.by_content_type[entry.content_type] = (rs.by_content_type[entry.content_type] || 0) + 1;
    rs.by_category[entry.category] = (rs.by_category[entry.category] || 0) + 1;
  }

  const global = {
    total_files: entries.length,
    by_content_type: {},
    by_category: {},
    by_extension: {},
    total_size_bytes: 0,
    by_repo: byRepo
  };

  for (const entry of entries) {
    global.total_size_bytes += entry.size_bytes;
    global.by_content_type[entry.content_type] = (global.by_content_type[entry.content_type] || 0) + 1;
    global.by_category[entry.category] = (global.by_category[entry.category] || 0) + 1;
    global.by_extension[entry.extension] = (global.by_extension[entry.extension] || 0) + 1;
  }

  return global;
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

function buildCrossReferences(allEntries, repoConfigs) {
  const refs = [];
  const entryMap = new Map(allEntries.map(e => [e.id, e]));
  const pathMap = new Map();

  for (const entry of allEntries) {
    const key = `${entry.repo}:${entry.path}`;
    pathMap.set(key, entry);
  }

  const repoByName = new Map(repoConfigs.map(r => [r.name, r]));

  for (const entry of allEntries) {
    if (entry.content_type !== 'doc') continue;
    const repoConfig = repoByName.get(entry.repo);
    if (!repoConfig) continue;

    try {
      const fullPath = path.join(repoConfig.root, entry.path);
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

        for (const rc of repoConfigs) {
          const relTarget = getRelativePath(resolvedPath, rc.root);
          if (relTarget && !relTarget.startsWith('..') && !relTarget.startsWith('/')) {
            const targetKey = `${rc.name}:${relTarget}`;
            const targetEntry = pathMap.get(targetKey);
            if (targetEntry && targetEntry.id !== entry.id) {
              refs.push({
                source: entry.id,
                target: targetEntry.id,
                type: entry.repo === targetEntry.repo ? 'link' : 'cross-repo-link',
                label: match[1].slice(0, 80)
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      // skip
    }
  }

  return refs;
}

function main() {
  const allEntries = [];

  for (const repoConfig of REPOS) {
    console.log(`\nScanning ${repoConfig.name} (${repoConfig.root})...`);
    if (!fs.existsSync(repoConfig.root)) {
      console.log(`  SKIP — directory not found`);
      continue;
    }
    const files = walkDir(repoConfig.root, repoConfig);
    console.log(`  Found ${files.length} content files`);

    let count = 0;
    for (const file of files) {
      try {
        allEntries.push(processFile(file, repoConfig));
        count++;
      } catch (e) {
        console.error(`  Error processing ${file}: ${e.message}`);
      }
    }
    console.log(`  Processed ${count} entries`);
  }

  console.log(`\n--- Total: ${allEntries.length} entries across ${REPOS.length} repos ---`);

  console.log('Building cross-references...');
  const crossRefs = buildCrossReferences(allEntries, REPOS);
  console.log(`Found ${crossRefs.length} cross-references`);

  const tagIndex = buildTagIndex(allEntries);
  const repoStats = buildRepoStats(allEntries);

  const repoRoots = {};
  for (const rc of REPOS) {
    repoRoots[rc.name] = rc.root;
  }

  const index = {
    schema_version: '2.0',
    generated_at: new Date().toISOString(),
    github_org: 'vortsghost2025',
    repo_roots: repoRoots,
    stats: repoStats,
    tag_index: tagIndex,
    cross_references: crossRefs,
    entries: allEntries
  };

  const outputPath = path.join('S:/self-organizing-library', 'data', 'site-index.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`\nIndex written to ${outputPath}`);
  console.log(`  ${allEntries.length} entries`);
  console.log(`  ${Object.keys(tagIndex).length} unique tags`);
  console.log(`  ${crossRefs.length} cross-references`);
  console.log(`  ${repoStats.total_size_bytes.toLocaleString()} total bytes`);

  const summaryPath = path.join('S:/self-organizing-library', 'data', 'site-index-summary.json');
  const summary = {
    schema_version: '2.0',
    generated_at: index.generated_at,
    repo_count: REPOS.length,
    stats: {
      total_files: repoStats.total_files,
      total_size_bytes: repoStats.total_size_bytes,
      by_repo: Object.fromEntries(
        Object.entries(repoStats.by_repo).map(([name, rs]) => [name, { total_files: rs.total_files, total_size_bytes: rs.total_size_bytes }])
      ),
    },
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

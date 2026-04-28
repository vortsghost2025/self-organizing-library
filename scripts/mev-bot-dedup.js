const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXCLUDE_DIRS = new Set([
  'mev-swarm-temp', 'mev-swarm-temp-mirror.git',
  '.git', '.cache', '.ruff_cache', '.venv', 'venv', 'node_modules',
  'build', 'cache', '.clawhub', '.kilo', '.kilocode', '.lingma',
  '.locks', '.meta', '.prompts', '.vscode',
  'agent-results',
  'logs'
]);

const EXCLUDE_EXTENSIONS = new Set([
  '.pyc', '.pyo', '.exe', '.dll', '.so', '.o', '.obj',
  '.woff', '.woff2', '.ttf', '.eot', '.map'
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SOURCES = [
  { root: 'C:\\Users\\seand\\mev-swarm-temp', name: 'primary' },
  { root: 'C:\\mev-swarm-temp-local', name: 'local' },
  { root: 'C:\\temp-mev', name: 'temp-mev' },
];

const OUTPUT_DIR = 'C:\\mev-bot-clean';

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.has(dirName);
}

function shouldExcludeFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return EXCLUDE_EXTENSIONS.has(ext);
}

function isRecursiveCopyPath(fullPath, root) {
  const rel = path.relative(root, fullPath);
  const parts = rel.split(path.sep);
  return parts.some(p => p === 'mev-swarm-temp');
}

function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

function collectFiles(rootDir) {
  const files = [];
  const errors = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      errors.push({ dir, error: e.message });
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (shouldExcludeDir(entry.name)) continue;
        if (isRecursiveCopyPath(fullPath, rootDir)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        if (shouldExcludeFile(entry.name)) continue;
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size > MAX_FILE_SIZE) continue;
          if (stat.size === 0) continue;
        } catch (e) {
          continue;
        }
        const rel = path.relative(rootDir, fullPath);
        files.push({ fullPath, relPath: rel, source: rootDir });
      }
    }
  }

  walk(rootDir);
  return { files, errors };
}

console.log('=== MEV Bot Deduplication Script ===');
console.log('Start:', new Date().toISOString());

const allFiles = [];
let totalScanned = 0;

for (const source of SOURCES) {
  if (!fs.existsSync(source.root)) {
    console.log('SKIP (not found):', source.root);
    continue;
  }
  console.log('Scanning:', source.root);
  const { files, errors } = collectFiles(source.root);
  console.log('  Found:', files.length, 'files');
  if (errors.length > 0) {
    console.log('  Errors:', errors.length);
  }
  totalScanned += files.length;
  for (const f of files) {
    allFiles.push(f);
  }
}

console.log('\nTotal files to hash:', allFiles.length);

// Hash all files and build dedup map
const hashMap = new Map(); // hash -> { relPath, source, fullPath }
const duplicates = [];
let hashErrors = 0;

for (let i = 0; i < allFiles.length; i++) {
  const f = allFiles[i];
  const hash = hashFile(f.fullPath);
  if (!hash) {
    hashErrors++;
    continue;
  }

  if (hashMap.has(hash)) {
    const existing = hashMap.get(hash);
    duplicates.push({
      hash: hash.substring(0, 16),
      kept: existing.relPath,
      duplicate: f.relPath,
      duplicateSource: f.source
    });
  } else {
    hashMap.set(hash, f);
  }

  if ((i + 1) % 10000 === 0) {
    console.log('  Hashed:', i + 1, '/', allFiles.length);
  }
}

console.log('\n=== Results ===');
console.log('Unique files:', hashMap.size);
console.log('Duplicates removed:', duplicates.length);
console.log('Hash errors:', hashErrors);

// Determine best relPath for each unique file
// Prefer primary source, then local, then temp-mev
const sourcePriority = {
  'C:\\Users\\seand\\mev-swarm-temp': 0,
  'C:\\mev-swarm-temp-local': 1,
  'C:\\temp-mev': 2
};

// Copy unique files to output
console.log('\nCopying to:', OUTPUT_DIR);

let copied = 0;
let copyErrors = 0;

for (const [hash, f] of hashMap) {
  const destPath = path.join(OUTPUT_DIR, f.relPath);
  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(f.fullPath, destPath);
    copied++;
  } catch (e) {
    copyErrors++;
    if (copyErrors <= 5) {
      console.log('  Copy error:', f.relPath, e.message);
    }
  }
}

console.log('\nCopied:', copied);
console.log('Copy errors:', copyErrors);

// Write report
const report = {
  timestamp: new Date().toISOString(),
  totalScanned,
  uniqueFiles: hashMap.size,
  duplicatesRemoved: duplicates.length,
  hashErrors,
  copied,
  copyErrors,
  sources: SOURCES.map(s => s.root),
  excludeDirs: [...EXCLUDE_DIRS].sort(),
  sampleDuplicates: duplicates.slice(0, 50),
  directoryStructure: null
};

// Get directory structure of output
function getStructure(dir, prefix = '') {
  const result = {};
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        result[prefix + entry.name + '/'] = getStructure(
          path.join(dir, entry.name),
          prefix + '  '
        );
      }
    }
  } catch (e) {}
  return result;
}

if (fs.existsSync(OUTPUT_DIR)) {
  report.directoryStructure = getStructure(OUTPUT_DIR);
  
  // Count files per top-level dir
  const topDirs = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  
  const counts = {};
  for (const dir of topDirs) {
    let count = 0;
    function countFiles(d) {
      try {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) countFiles(path.join(d, e.name));
          else if (e.isFile()) count++;
        }
      } catch (err) {}
    }
    countFiles(path.join(OUTPUT_DIR, dir));
    counts[dir] = count;
  }
  report.fileCountsByDir = counts;
  
  const totalInOutput = Object.values(counts).reduce((a, b) => a + b, 0);
  report.totalFilesInOutput = totalInOutput;
}

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'dedup-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\nReport saved to:', path.join(OUTPUT_DIR, 'dedup-report.json'));
console.log('Done:', new Date().toISOString());

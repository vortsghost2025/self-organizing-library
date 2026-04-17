/**
 * Migration Scanner - Phase A
 * Scans projects, generates inventory, identifies duplicates
 * 
 * Usage: node scan-inventory.js
 * Output: S:\self-organizing-library\data\inventory.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================
// PROJECT PATHS TO SCAN
// NOTE: Canonical decisions are NOT made here.
// You must manually decide which path is canonical for duplicated projects.
// ============================================
const PROJECT_PATHS = [
  { path: 'C:\\Dev\\trading-bots\\kucoin-margin-bot', name: 'kucoin-margin-bot', source: 'C' },
  { path: 'S:\\kucoin-margin-bot', name: 'kucoin-margin-bot', source: 'S', duplicateCandidate: 'C:\\Dev\\trading-bots\\kucoin-margin-bot' },
  { path: 'C:\\autonomous-elasticsearch-evolution-agent', name: 'autonomous-elasticsearch-agent', source: 'C' },
  { path: 'S:\\federation', name: 'federation', source: 'S' },
  { path: 'S:\\Archivist-Agent', name: 'archivist-agent', source: 'S' },
  { path: 'S:\\self-organizing-library', name: 'self-organizing-library', source: 'S' },
];

// ============================================
// SENSITIVE FILE PATTERNS - NEVER AUTO-CLASSIFY
// ============================================
const SENSITIVE_PATTERNS = [
  /^\.env/,
  /key/i,
  /secret/i,
  /token/i,
  /credential/i,
  /password/i,
  /api_key/i,
  /private/i,
];

function isSensitive(fileName) {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(fileName));
}

// ============================================
// CLASSIFICATION RULES
// ============================================
function classifyFile(filePath, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, ext);
  const lowerName = fileName.toLowerCase();
  
  // SENSITIVE FILES - NEVER AUTO-CLASSIFY
  if (isSensitive(fileName)) {
    return 'sensitive';
  }
  
  // Code files
  if (['.py', '.js', '.ts', '.tsx', '.jsx', '.rs', '.go', '.java', '.c', '.cpp', '.h'].includes(ext)) {
    return 'code';
  }
  
  // Config files - but .env is sensitive
  if (['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg'].includes(ext)) {
    return 'config';
  }
  
  // Repo-specific docs
  if (lowerName === 'readme.md' || lowerName === 'readme') return 'repo-doc';
  if (lowerName === 'architecture.md' || lowerName === 'architecture') return 'repo-doc';
  if (lowerName.startsWith('deployment') && ext === '.md') return 'repo-doc';
  if (lowerName === 'contributing.md') return 'repo-doc';
  if (lowerName === 'license' || lowerName === 'license.md') return 'repo-doc';
  if (lowerName === 'changelog.md') return 'repo-doc';
  
  // Archive docs (session notes, planning, etc)
  if (lowerName.startsWith('session') && ext === '.md') return 'archive-doc';
  if (lowerName.startsWith('agent_') && ext === '.md') return 'archive-doc';
  if (lowerName.includes('summary') && ext === '.md') return 'archive-doc';
  if (lowerName.startsWith('phase') && ext === '.md') return 'archive-doc';
  if (lowerName.startsWith('checkpoint') && ext === '.md') return 'archive-doc';
  if (lowerName.includes('handoff') && ext === '.md') return 'archive-doc';
  
  // Logs and data
  if (ext === '.log') return 'archive-doc';
  if (ext === '.csv') return 'unknown'; // Manual review needed
  if (ext === '.txt' && !lowerName.includes('requirements')) return 'unknown'; // Manual review
  
  // Papers and media
  if (ext === '.pdf') return 'paper';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) return 'media';
  
  // Tests
  if (fileName.includes('test') || lowerName.startsWith('test')) return 'code';
  
  return 'unknown';
}

// ============================================
// CHECKSUM HELPER
// ============================================
function calculateChecksum(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

// ============================================
// SCANNER
// ============================================
function scanProject(projectInfo) {
  const inventory = [];
  const errors = [];
  
  function scanDir(dirPath, depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip node_modules, .git, etc
        if (['node_modules', '.git', '.venv', '__pycache__', '.pytest_cache', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          try {
            const stats = fs.statSync(fullPath);
            const classification = classifyFile(fullPath, entry.name);
            const ext = path.extname(entry.name).toLowerCase();
            
            // Only checksum files under 10MB
            let checksum = null;
            if (stats.size < 10 * 1024 * 1024) {
              checksum = calculateChecksum(fullPath);
            }
            
            inventory.push({
              path: fullPath,
              name: entry.name,
              ext: ext,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              classification: classification,
              checksum: checksum,
              project: projectInfo.name,
              source: projectInfo.source
            });
          } catch (e) {
            errors.push({ path: fullPath, error: e.message });
          }
        }
      }
    } catch (e) {
      errors.push({ path: dirPath, error: e.message });
    }
  }
  
  if (fs.existsSync(projectInfo.path)) {
    scanDir(projectInfo.path);
  } else {
    errors.push({ path: projectInfo.path, error: 'Path does not exist' });
  }
  
  return { inventory, errors, project: projectInfo };
}

// ============================================
// FIND DUPLICATES
// ============================================
function findDuplicates(inventories) {
  const allFiles = inventories.flatMap(i => i.inventory);
  const checksumMap = {};
  const duplicates = [];
  
  for (const file of allFiles) {
    if (!file.checksum) continue;
    
    if (!checksumMap[file.checksum]) {
      checksumMap[file.checksum] = [];
    }
    checksumMap[file.checksum].push(file);
  }
  
  for (const [checksum, files] of Object.entries(checksumMap)) {
    if (files.length > 1) {
      duplicates.push({
        checksum,
        files: files.map(f => ({
          path: f.path,
          project: f.project,
          classification: f.classification
        }))
      });
    }
  }
  
  return duplicates;
}

// ============================================
// MAIN
// ============================================
function run() {
  console.log('Scanning projects...\n');
  
  const inventories = [];
  
  for (const projectInfo of PROJECT_PATHS) {
    console.log(`Scanning: ${projectInfo.name} (${projectInfo.source})`);
    const result = scanProject(projectInfo);
    inventories.push(result);
    console.log(`  Found: ${result.inventory.length} files`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
    }
  }
  
  console.log('\nFinding duplicates...');
  const duplicates = findDuplicates(inventories);
  console.log(`Found: ${duplicates.length} duplicate sets`);
  
  // Summary
  const summary = {
    totalFiles: inventories.reduce((sum, i) => sum + i.inventory.length, 0),
    byClassification: {},
    byProject: {},
    duplicateCandidates: duplicates.length,
    sensitiveFiles: 0,
    unknownFiles: 0,
    scanDate: new Date().toISOString(),
    note: "Canonical decisions NOT made. Review duplicates and decide manually."
  };
  
  for (const inv of inventories) {
    summary.byProject[inv.project] = inv.inventory.length;
    
    for (const file of inv.inventory) {
      summary.byClassification[file.classification] = (summary.byClassification[file.classification] || 0) + 1;
      if (file.classification === 'sensitive') summary.sensitiveFiles++;
      if (file.classification === 'unknown') summary.unknownFiles++;
    }
  }
  
  // Output
  const output = {
    summary,
    inventories: inventories.map(i => ({
      project: i.project.name,
      path: i.project.path,
      duplicateCandidate: i.project.duplicateCandidate || null,
      files: i.inventory
    })),
    duplicates,
    errors: inventories.flatMap(i => i.errors),
    canonicalDecisionsNeeded: inventories
      .filter(i => i.project.duplicateCandidate)
      .map(i => ({
        project: i.project.name,
        paths: [
          i.project.path,
          i.project.duplicateCandidate
        ],
        decision: "PENDING - YOU MUST DECIDE WHICH IS CANONICAL"
      }))
  };
  
  // Ensure data directory exists
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // ALSO save to archive location (outside active project)
  const archiveDir = 'S:\\Archive\\manifests';
  if (!fs.existsSync(archiveDir)) {
    try {
      fs.mkdirSync(archiveDir, { recursive: true });
    } catch (e) {
      console.log('Note: Could not create archive directory (may not exist yet)');
    }
  }
  
  // Write output
  const dateStr = new Date().toISOString().slice(0, 10);
  const outputPath = path.join(dataDir, `inventory-${dateStr}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nInventory written to: ${outputPath}`);
  
  // Write to archive if possible
  try {
    const archivePath = path.join(archiveDir, `inventory-${dateStr}.json`);
    fs.writeFileSync(archivePath, JSON.stringify(output, null, 2));
    console.log(`Inventory also saved to: ${archivePath}`);
  } catch (e) {
    console.log('Note: Could not save to archive (will be created in Phase C)');
  }
  
  // Write summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total files: ${summary.totalFiles}`);
  console.log(`Sensitive files: ${summary.sensitiveFiles} (REQUIRES MANUAL REVIEW)`);
  console.log(`Unknown files: ${summary.unknownFiles} (REQUIRES MANUAL REVIEW)`);
  console.log(`Duplicate candidates: ${summary.duplicateCandidates}`);
  console.log('\nBy Classification:');
  for (const [cls, count] of Object.entries(summary.byClassification)) {
    const warning = (cls === 'sensitive' || cls === 'unknown') ? ' ⚠️' : '';
    console.log(`  ${cls}: ${count}${warning}`);
  }
  console.log('\nBy Project:');
  for (const [proj, count] of Object.entries(summary.byProject)) {
    console.log(`  ${proj}: ${count}`);
  }
  
  if (output.canonicalDecisionsNeeded.length > 0) {
    console.log('\n⚠️  CANONICAL DECISIONS NEEDED:');
    for (const decision of output.canonicalDecisionsNeeded) {
      console.log(`  ${decision.project}:`);
      decision.paths.forEach(p => console.log(`    - ${p}`));
      console.log(`    Status: ${decision.decision}`);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  run();
}

module.exports = { scanProject, findDuplicates, classifyFile };

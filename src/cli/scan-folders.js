/**
 * Bounded Bulk Scanner for Self-Organizing Library
 * Scans defined folders for repos, papers, and docs
 * Outputs JSON file for import into library.html
 * 
 * Usage: node scan-folders.js > import-data.json
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION - Edit these paths for your machine
// ============================================

const SCAN_CONFIG = {
  repos: {
    C: [
      'C:\\Users\\seand\\overstory',
      'C:\\Users\\seand\\kilo-desktop',
      'C:\\Users\\seand\\kilocode',
      'C:\\Users\\seand\\Deliberate-AI-Ensemble',
      'C:\\Users\\seand\\NemoClaw',
      'C:\\Users\\seand\\mev-swarm-temp',
      'C:\\workspace-kilocode',
      'C:\\autonomous-elasticsearch-evolution-agent'
    ],
    S: [
      'S:\\federation',
      'S:\\projects\\snac-v2-clean',
      'S:\\self-organizing-library'
    ]
  },
  papers: {
    S: [
      'S:\\papers\\01_The_Rosetta_Stone.pdf.pdf',
      'S:\\papers\\02_Constraint_Lattices_and_Stability.pdf.pdf',
      'S:\\papers\\03_Phenotype_Selection_in_Constraint_Governed_Systems.pdf.pdf',
      'S:\\papers\\04_Drift_Identity_and_Ensemble_Coherence.pdf.pdf',
      'S:\\papers\\05_The_WE4FREE_Framework.pdf.pdf'
    ],
    downloads: [
      'C:\\Users\\seand\\Downloads\\constitutional_intelligence_positioning_brief_regenerated (1).pdf',
      'C:\\Users\\seand\\Downloads\\connection_map_one_page_regenerated.pdf'
    ]
  },
  docs: {
    // Add your curated doc folder here
    // Example: 'S:\\federation\\docs'
  }
};

// ============================================
// SCANNER FUNCTIONS
// ============================================

function scanRepo(repoPath, source) {
  try {
    if (!fs.existsSync(repoPath)) {
      return null;
    }

    const stats = fs.statSync(repoPath);
    const name = path.basename(repoPath);
    
    // Check if it's actually a git repo
    const gitPath = path.join(repoPath, '.git');
    const isGitRepo = fs.existsSync(gitPath);
    
    // Try to read package.json for more info
    let packageInfo = {};
    const packagePath = path.join(repoPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      } catch (e) {}
    }

    return {
      title: packageInfo.name || name,
      type: 'repo',
      path: repoPath,
      source: source,
      status: 'unknown',
      tags: isGitRepo ? ['git', 'repo'] : ['repo'],
      metadata: {
        isGitRepo: isGitRepo,
        hasPackageJson: fs.existsSync(packagePath),
        description: packageInfo.description || ''
      },
      notes: packageInfo.description ? `Description: ${packageInfo.description}` : ''
    };
  } catch (err) {
    console.error(`Error scanning repo ${repoPath}:`, err.message);
    return null;
  }
}

function scanPaper(paperPath, source) {
  try {
    if (!fs.existsSync(paperPath)) {
      return null;
    }

    const stats = fs.statSync(paperPath);
    const filename = path.basename(paperPath, '.pdf').replace('.pdf', '');
    
    // Clean up filename for title
    let title = filename
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title: title,
      type: 'paper',
      path: paperPath,
      source: source,
      status: 'unknown',
      tags: ['paper', 'pdf'],
      metadata: {
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        extension: 'pdf'
      },
      notes: ''
    };
  } catch (err) {
    console.error(`Error scanning paper ${paperPath}:`, err.message);
    return null;
  }
}

function scanDoc(docPath, source) {
  try {
    if (!fs.existsSync(docPath)) {
      return null;
    }

    const stats = fs.statSync(docPath);
    const filename = path.basename(docPath);
    const ext = path.extname(docPath).toLowerCase();
    
    return {
      title: filename,
      type: 'doc',
      path: docPath,
      source: source,
      status: 'unknown',
      tags: ['doc', ext.replace('.', '')],
      metadata: {
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        extension: ext
      },
      notes: ''
    };
  } catch (err) {
    console.error(`Error scanning doc ${docPath}:`, err.message);
    return null;
  }
}

function scanDocFolder(folderPath, source) {
  const docs = [];
  
  try {
    if (!fs.existsSync(folderPath)) return docs;
    
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) continue;
      
      const ext = path.extname(entry.name).toLowerCase();
      // Only include common doc types
      if (['.md', '.txt', '.pdf', '.doc', '.docx'].includes(ext)) {
        const fullPath = path.join(folderPath, entry.name);
        const artifact = scanDoc(fullPath, source);
        if (artifact) docs.push(artifact);
      }
    }
  } catch (err) {
    console.error(`Error scanning doc folder ${folderPath}:`, err.message);
  }
  
  return docs;
}

// ============================================
// MAIN SCANNER
// ============================================

function runScan() {
  const artifacts = [];

  // Scan repos
  console.error('Scanning repos...');
  
  for (const repoPath of SCAN_CONFIG.repos.C) {
    const artifact = scanRepo(repoPath, 'C:');
    if (artifact) artifacts.push(artifact);
  }
  
  for (const repoPath of SCAN_CONFIG.repos.S) {
    const artifact = scanRepo(repoPath, 'S:');
    if (artifact) artifacts.push(artifact);
  }

  // Scan papers
  console.error('Scanning papers...');
  
  for (const paperPath of SCAN_CONFIG.papers.S) {
    const artifact = scanPaper(paperPath, 'S:');
    if (artifact) artifacts.push(artifact);
  }
  
  for (const paperPath of SCAN_CONFIG.papers.downloads) {
    const artifact = scanPaper(paperPath, 'C:');
    if (artifact) artifacts.push(artifact);
  }

  // Scan doc folders
  console.error('Scanning doc folders...');
  
  for (const [source, paths] of Object.entries(SCAN_CONFIG.docs)) {
    if (Array.isArray(paths)) {
      for (const docPath of paths) {
        const docs = scanDocFolder(docPath, source);
        artifacts.push(...docs);
      }
    }
  }

  // Output JSON
  console.error(`Found ${artifacts.length} artifacts`);
  console.log(JSON.stringify(artifacts, null, 2));
}

// Run if executed directly
if (require.main === module) {
  runScan();
}

module.exports = { scanRepo, scanPaper, scanDoc, runScan };

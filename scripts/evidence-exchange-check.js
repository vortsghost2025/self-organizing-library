#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LANE_DIRS = {
  archivist: 'S:/Archivist-Agent',
  library: 'S:/self-organizing-library',
  swarmmind: 'S:/SwarmMind Self-Optimizing Multi-Agent AI System',
  kernel: 'S:/kernel-lane',
};

const VALID_ARTIFACT_TYPES = ['benchmark', 'profile', 'release', 'log'];

function scanInbox(laneId) {
  const baseDir = LANE_DIRS[laneId];
  if (!baseDir) return { lane: laneId, total: 0, with_evidence_exchange: 0, errors: [] };

  const inboxPath = path.join(baseDir, 'lanes', laneId, 'inbox');
  if (!fs.existsSync(inboxPath)) {
    return { lane: laneId, total: 0, with_evidence_exchange: 0, errors: [] };
  }

  const files = fs.readdirSync(inboxPath).filter(f => f.endsWith('.json'));
  const results = [];
  let withEvidence = 0;

  for (const file of files) {
    const filePath = path.join(inboxPath, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const msg = JSON.parse(raw.replace(/^\uFEFF/, ''));
      
      if (msg.evidence_exchange) {
        withEvidence++;
        const exch = msg.evidence_exchange;
        
        if (exch.artifact_path) {
          const absPath = exch.artifact_path.replace(/^[A-Z]:/, '').replace(/^\\/, '/');
          const expandedPath = path.isAbsolute(exch.artifact_path) 
            ? exch.artifact_path 
            : path.join(baseDir, exch.artifact_path);
          
          const exists = fs.existsSync(expandedPath);
          if (!exists) {
            results.push({
              file,
              artifact_path: exch.artifact_path,
              artifact_type: exch.artifact_type,
              error: 'ARTIFACT_NOT_FOUND'
            });
          } else if (!VALID_ARTIFACT_TYPES.includes(exch.artifact_type)) {
            results.push({
              file,
              artifact_type: exch.artifact_type,
              error: 'INVALID_ARTIFACT_TYPE'
            });
          } else {
            results.push({
              file,
              artifact_path: exch.artifact_path,
              artifact_type: exch.artifact_type,
              status: 'OK'
            });
          }
        }
      }
    } catch (err) {
      results.push({ file, error: 'PARSE_ERROR: ' + err.message });
    }
  }

  return { lane: laneId, total: files.length, with_evidence_exchange: withEvidence, details: results };
}

function scanAllLanes() {
  const report = {};
  for (const laneId of Object.keys(LANE_DIRS)) {
    report[laneId] = scanInbox(laneId);
  }
  return report;
}

function generateReport() {
  const report = scanAllLanes();
  const timestamp = new Date().toISOString();
  
  let totalArtifacts = 0;
  let errors = [];
  
  for (const [lane, r] of Object.entries(report)) {
    totalArtifacts += r.with_evidence_exchange;
    errors = errors.concat(r.details.filter(d => d.error));
  }

  const summary = {
    timestamp,
    total_lanes: Object.keys(report).length,
    total_messages_with_evidence_exchange: totalArtifacts,
    total_errors: errors.length,
    lanes: report,
    errors: errors.length > 0 ? errors : null
  };

  return summary;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';

  if (command === 'scan') {
    const report = generateReport();
    console.log(JSON.stringify(report, null, 2));
    
    if (report.total_errors > 0) {
      console.error(`\nEVIDENCE CHECK FAILED: ${report.total_errors} error(s) found`);
      process.exit(1);
    } else {
      console.log(`\nEVIDENCE CHECK PASSED: ${report.total_messages_with_evidence_exchange} evidence exchange(s) verified`);
      process.exit(0);
    }
  } else if (command === 'lane') {
    const lane = args[1];
    if (!lane) {
      console.error('Usage: node evidence-exchange-check.js lane <lane>');
      process.exit(1);
    }
    const result = scanInbox(lane);
    console.log(JSON.stringify(result, null, 2));
  }
}

module.exports = { scanInbox, scanAllLanes, generateReport, VALID_ARTIFACT_TYPES };
#!/usr/bin/env node
'use strict';

// Wrapper that runs the existing evidence‑exchange checker and then rejects placeholder artifacts.

const { generateReport } = require('./evidence-exchange-check');
const path = require('path');
const fs = require('fs');

function isPlaceholderArtifact(absPath) {
  try {
    const stats = fs.statSync(absPath);
    if (stats.size < 100) return true;
    const content = fs.readFileSync(absPath, 'utf8');
    return /placeholder|TODO|example/i.test(content);
  } catch (_) {
    return true; // unreadable = placeholder
  }
}

function run() {
  const report = generateReport();
  // Scan for placeholder artifacts in the report details
  let placeholderFound = false;
  for (const lane of Object.keys(report.lanes)) {
    const laneReport = report.lanes[lane];
    for (const detail of laneReport.details || []) {
      if (detail.artifact_path && detail.status === 'OK') {
        // Resolve to absolute path based on lane base directory
        const baseDir = {
          archivist: 'S:/Archivist-Agent',
          library: 'S:/self-organizing-library',
           swarmmind: 'S:/SwarmMind Self-Optimizing Multi-Agent AI System',
          kernel: 'S:/kernel-lane'
        }[lane];
        const absPath = path.isAbsolute(detail.artifact_path)
          ? detail.artifact_path
          : path.join(baseDir, detail.artifact_path);
        if (isPlaceholderArtifact(absPath)) {
          placeholderFound = true;
          detail.error = 'PLACEHOLDER_ARTIFACT';
          delete detail.status;
        }
      }
    }
  }

  // Re‑compute aggregates
  let okCount = 0;
  const errors = [];
  for (const lane of Object.keys(report.lanes)) {
    const laneReport = report.lanes[lane];
    for (const d of laneReport.details || []) {
      if (d.error) errors.push(d);
      else if (d.status === 'OK') okCount++;
    }
    laneReport.with_evidence_exchange = laneReport.details.filter(d => d.artifact_path).length;
  }
  report.total_errors = errors.length;
  report.errors = errors.length > 0 ? errors : null;
  report.total_messages_with_evidence_exchange = okCount;

  console.log(JSON.stringify(report, null, 2));
  if (report.total_errors > 0) {
    console.error(`\nEVIDENCE CHECK FAILED: ${report.total_errors} error(s) found`);
    process.exit(1);
  } else {
    console.log(`\nEVIDENCE CHECK PASSED: ${okCount} evidence exchange(s) verified`);
    process.exit(0);
  }
}

run();

#!/usr/bin/env node
/**
 * Aggregates all test results from verification/ directory into a single verdict.json file.
 * Generates overall PASS/FAIL status, component statuses, and evidence paths.
 */

const fs = require('fs');
const path = require('path');

// Absolute path to verification directory
const VERIFICATION_DIR = path.join(__dirname, '..', 'verification');
// Write verdict.json to the verification directory itself
const OUTPUT_FILE = path.join(VERIFICATION_DIR, 'verdict.json');

function readVerificationFile(filename) {
  const filepath = path.join(VERIFICATION_DIR, filename);
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.warn('Warning: Could not read or parse ' + filename + ': ' + err.message);
    return null;
  }
}

function aggregateResults() {
  const files = fs.readdirSync(VERIFICATION_DIR);
  const jsonFiles = files.filter(function(f) { return f.endsWith('.json'); });

  var components = {};
  var overallPassed = true;
  var totalTests = 0;
  var totalPassed = 0;
  var totalFailed = 0;
  var evidencePaths = [];
  var bypassEvidence = [];
  var violations = [];
  var warnings = [];

  jsonFiles.forEach(function(file) {
    var data = readVerificationFile(file);
    if (!data) return;

    var componentName = file.replace('.json', '');
    var componentStatus = data.passed !== undefined
      ? (data.passed ? 'PASS' : 'FAIL')
      : (data.gateStatus || 'UNKNOWN');

    components[componentName] = {
      status: componentStatus,
      timestamp: data.timestamp,
      summary: data.summary || null,
      details: data.details || [],
      proof: data.proof || null
    };

    if (data.passed !== undefined) {
      totalTests += data.total || data.details.length;
      totalPassed += data.passed || 0;
      totalFailed += data.failed || 0;
      if (!data.passed) {
        overallPassed = false;
      }
    } else if (data.gateStatus === 'FAIL') {
      overallPassed = false;
    }

    // Collect evidence paths
    if (data.proof && data.proof.proven) {
      data.proof.proven.forEach(function(proof) {
        evidencePaths.push({
          component: componentName,
          probeId: proof.probeId,
          invokeCount: proof.invokeCount,
          lastInvoked: proof.lastInvoked
        });
      });
    }

    // Collect bypass evidence
    if (data.bypass && data.bypass.bypasses) {
      data.bypass.bypasses.forEach(function(bypass) {
        bypassEvidence.push({
          component: componentName
        });
      });
    }

    // Collect violations
    if (data.violations && data.violations.length > 0) {
      data.violations.forEach(function(violation) {
        violations.push({
          component: componentName
        });
      });
    }

    // Collect warnings
    if (data.warnings && data.warnings.length > 0) {
      data.warnings.forEach(function(warning) {
        warnings.push({
          component: componentName
        });
      });
    }
  });

  var verdict = {
    generatedAt: new Date().toISOString(),
    overall: {
      status: overallPassed ? 'PASS' : 'FAIL',
      totalTests: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      passRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) + '%' : '0%'
    },
    components: components,
    evidence: {
      paths: evidencePaths,
      bypasses: bypassEvidence,
      violations: violations,
      warnings: warnings
    },
    summary: {
      totalComponents: Object.keys(components).length,
      passingComponents: Object.values(components).filter(function(c) { return c.status === 'PASS'; }).length,
      failingComponents: Object.values(components).filter(function(c) { return c.status === 'FAIL'; }).length
    }
  };

  return verdict;
}

// Main execution
var verdict = aggregateResults();

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(verdict, null, 2));
console.log('Verdict generated successfully: ' + OUTPUT_FILE);
console.log('Overall Status: ' + verdict.overall.status + ' (' + verdict.overall.passRate + ')');
console.log('Components: ' + verdict.summary.passingComponents + ' PASS, ' + verdict.summary.failingComponents + ' FAIL');

module.exports = { aggregateResults };

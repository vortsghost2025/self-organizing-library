/**
 * analyze-usage.js - Run Usage Lane Analysis
 * 
 * This script runs the Usage Lane analysis and generates:
 * 1. Console output showing ACTIVE/DORMANT/DEAD files
 * 2. JSON report saved to verification/usage-report.json
 * 3. Markdown report saved to context-buffer/USAGE_LANE_REPORT_*.md
 * 
 * Owner: Library Lane
 * Created: 2026-04-20
 */

const { UsageLane } = require('../src/usage/UsageLane');
const fs = require('fs');
const path = require('path');

// ==============================================================================
// RUN ANALYSIS
// ==============================================================================

console.log('\n========================================');
console.log('USAGE LANE: Where is this actually used?');
console.log('========================================\n');

const usageLane = new UsageLane({
    projectRoot: path.join(__dirname, '..')
});

const results = usageLane.analyze();

// ==============================================================================
// DISPLAY RESULTS
// ==============================================================================

console.log('----------------------------------------');
console.log('RESULTS BY STATUS');
console.log('----------------------------------------\n');

console.log(`✅ ACTIVE (${results.active.length}):`);
if (results.active.length > 0) {
    results.active.slice(0, 10).forEach(f => console.log(`   ${f}`));
    if (results.active.length > 10) {
        console.log(`   ... and ${results.active.length - 10} more`);
    }
} else {
    console.log('   (none)');
}

console.log(`\n💤 DORMANT (${results.dormant.length}):`);
if (results.dormant.length > 0) {
    results.dormant.forEach(f => console.log(`   ${f}`));
} else {
    console.log('   (none)');
}

console.log(`\n💀 DEAD (${results.dead.length}):`);
if (results.dead.length > 0) {
    results.dead.forEach(f => console.log(`   ${f}`));
} else {
    console.log('   (none)');
}

// ==============================================================================
// CRITICAL FINDINGS
// ==============================================================================

const summary = usageLane.generateSummary();

console.log('\n----------------------------------------');
console.log('CRITICAL FINDINGS');
console.log('----------------------------------------\n');

if (summary.critical.length > 0) {
    summary.critical.forEach(c => {
        console.log(`⚠️  ${c.artifact}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Issue: ${c.issue}\n`);
    });
} else {
    console.log('No critical findings.\n');
}

// ==============================================================================
// RECOMMENDATIONS
// ==============================================================================

console.log('----------------------------------------');
console.log('RECOMMENDATIONS');
console.log('----------------------------------------\n');

summary.recommendations.forEach(r => {
    console.log(`[${r.priority}] ${r.action}`);
    console.log(`   ${r.description}\n`);
});

// ==============================================================================
// SAVE REPORTS
// ==============================================================================

// Save JSON report
const jsonReportPath = path.join(__dirname, '..', 'verification', 'usage-report.json');
const verificationDir = path.dirname(jsonReportPath);
if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
}

const fullReport = {
    timestamp: new Date().toISOString(),
    summary,
    results,
    reports: Object.fromEntries(usageLane.reports)
};

fs.writeFileSync(jsonReportPath, JSON.stringify(fullReport, null, 2));
console.log(`📄 JSON report: ${jsonReportPath}`);

// Save Markdown report
const mdReportPath = path.join(__dirname, '..', 'context-buffer', `USAGE_LANE_REPORT_${new Date().toISOString().split('T')[0]}.md`);

const mdContent = `# Usage Lane Report

Date: ${new Date().toISOString()}
Lane: usage (Authority 50)

## Summary

| Status | Count |
|--------|-------|
| ✅ ACTIVE | ${results.active.length} |
| 💤 DORMANT | ${results.dormant.length} |
| 💀 DEAD | ${results.dead.length} |

## Critical Findings

${summary.critical.length > 0 ? summary.critical.map(c => `
### ${c.artifact}
- **Status**: ${c.status}
- **Issue**: ${c.issue}
`).join('\n') : 'No critical findings.'}

## DORMANT Files (Not Called by Application)

${results.dormant.map(f => `- \`${f}\``).join('\n') || '(none)'}

## DEAD Files (Never Imported)

${results.dead.map(f => `- \`${f}\``).join('\n') || '(none)'}

## Recommendations

${summary.recommendations.map(r => `
### ${r.action} [${r.priority}]
${r.description}
`).join('\n') || 'No recommendations.'}

## Key Insight

The Usage Lane asks: **"Where is this actually used?"**

This is the question verification lanes don't ask. A file can:
- Exist ✅
- Pass tests ✅
- Be documented ✅
- But never be called at runtime ❌

The Usage Lane catches this.
`;

fs.writeFileSync(mdReportPath, mdContent);
console.log(`📄 Markdown report: ${mdReportPath}`);

// ==============================================================================
// EXIT
// ==============================================================================

console.log('\n========================================');
console.log('USAGE LANE ANALYSIS COMPLETE');
console.log('========================================\n');

process.exit(summary.critical.length > 0 ? 1 : 0);

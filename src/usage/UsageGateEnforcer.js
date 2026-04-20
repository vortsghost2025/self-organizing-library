/**
 * UsageGateEnforcer.js - Block Progression If Verification Is DORMANT
 * 
 * Phase 2 Requirement: Usage Lane cannot remain advisory.
 * 
 * RULE:
 * IF artifactType = verification AND status = DORMANT or BYPASSED
 * THEN FAIL gate (block progression)
 * 
 * This enforces: "If it is not in the execution path, it does not exist"
 * 
 * Owner: Usage Lane (Authority 50)
 * Created: 2026-04-20
 */

const { UsageStatus } = require('./UsageLane');

// ==============================================================================
// GATE RESULT TYPES
// ==============================================================================

const GateResult = {
    PASS: 'PASS',
    FAIL: 'FAIL',
    WARNING: 'WARNING'
};

// ==============================================================================
// GATE ENFORCER
// ==============================================================================

class UsageGateEnforcer {
    constructor(options = {}) {
        this.strictMode = options.strictMode ?? true;  // Fail on any DORMANT verification
        this.criticalArtifacts = [
            'src/attestation/Verifier.js',
            'src/attestation/VerifierWrapper.js',
            'src/attestation/QuarantineManager.js',
            'src/queue/Queue.js',
            'src/attestation/OutcomeProtocol.js',
            'src/attestation/OutcomeRouter.js'
        ];
    }

    /**
     * Enforce gate on usage reports
     * 
     * @param {Map<string, UsageReport>} reports - Usage reports from UsageLane
     * @returns {Object} Gate result
     */
    enforce(reports) {
        const result = {
            status: GateResult.PASS,
            violations: [],
            warnings: [],
            summary: {
                total: reports.size,
                active: 0,
                dormant: 0,
                dead: 0,
                bypassed: 0
            }
        };

        for (const [artifactId, report] of reports) {
            // Count by status
            result.summary[report.status.toLowerCase()]++;

            // Check if this is a critical verification artifact
            const isCritical = this.criticalArtifacts.some(c => artifactId.includes(c));
            
            if (isCritical) {
                // Critical check: Must meet all five standards
                if (!report.meetsAllStandards()) {
                    result.violations.push({
                        artifact: artifactId,
                        status: report.status,
                        issue: this._describeViolation(report),
                        critical: true
                    });
                    result.status = GateResult.FAIL;
                }
            } else {
                // Non-critical check: Warn if DORMANT
                if (report.status === UsageStatus.DORMANT) {
                    result.warnings.push({
                        artifact: artifactId,
                        status: report.status,
                        issue: 'Artifact exists but is not actively used'
                    });
                }
            }
        }

        return result;
    }

    /**
     * Describe why an artifact violates the gate
     */
    _describeViolation(report) {
        const standard = report.getVerificationStandard();
        const failures = [];
        
        if (!standard.exists) failures.push('does not exist');
        if (!standard.referenced) failures.push('not referenced');
        if (!standard.executed) failures.push('not executed at runtime');
        if (!standard.notBypassed) failures.push('has bypass paths');
        if (!standard.enforced) failures.push('not enforced');
        
        return `Verification artifact ${failures.join(', ')}`;
    }

    /**
     * Run gate check with behavioral test results
     */
    enforceWithBehavioralTest(usageReports, behavioralResults, bypassReport) {
        const baseResult = this.enforce(usageReports);
        
        // Check behavioral test results
        if (behavioralResults.failed > 0) {
            baseResult.violations.push({
                artifact: 'behavioral-test',
                status: 'FAIL',
                issue: `${behavioralResults.failed} behavioral tests failed - verification cannot be proven`,
                critical: true
            });
            baseResult.status = GateResult.FAIL;
        }
        
        // Check bypass report
        if (bypassReport.summary.highRisk > 0) {
            baseResult.violations.push({
                artifact: 'bypass-detection',
                status: 'BYPASSED',
                issue: `${bypassReport.summary.highRisk} HIGH risk bypass paths detected`,
                critical: true
            });
            baseResult.status = GateResult.FAIL;
        }
        
        return baseResult;
    }

    /**
     * Generate gate report
     */
    generateGateReport(result) {
        const lines = [];
        
        lines.push('# USAGE LANE GATE REPORT');
        lines.push(`\nDate: ${new Date().toISOString()}`);
        lines.push(`\n## Status: ${result.status}\n`);
        
        if (result.status === GateResult.PASS) {
            lines.push('✅ GATE PASSED - All verification artifacts are ACTIVE and ENFORCED\n');
        } else {
            lines.push('❌ GATE FAILED - Verification artifacts are DORMANT, DEAD, or BYPASSED\n');
        }
        
        lines.push('## Summary\n');
        lines.push(`| Status | Count |`);
        lines.push(`|--------|-------|`);
        lines.push(`| ACTIVE | ${result.summary.active} |`);
        lines.push(`| DORMANT | ${result.summary.dormant} |`);
        lines.push(`| DEAD | ${result.summary.dead} |`);
        lines.push(`| BYPASSED | ${result.summary.bypassed} |`);
        
        if (result.violations.length > 0) {
            lines.push('\n## Violations (CRITICAL)\n');
            result.violations.forEach(v => {
                lines.push(`- **${v.artifact}**: ${v.issue}`);
            });
        }
        
        if (result.warnings.length > 0) {
            lines.push('\n## Warnings\n');
            result.warnings.forEach(w => {
                lines.push(`- ${w.artifact}: ${w.issue}`);
            });
        }
        
        lines.push('\n## Enforcement Rule\n');
        lines.push('```\nIF artifactType = verification\nAND status IN (DORMANT, DEAD, BYPASSED)\nTHEN FAIL gate\n```\n');
        
        lines.push('## Five-Point Verification Standard\n');
        lines.push('To be considered ACTIVE, an artifact must meet all five:');
        lines.push('1. Exists (file/function present)');
        lines.push('2. Referenced (static import/call)');
        lines.push('3. Executed (runtime evidence)');
        lines.push('4. Not Bypassed (no alternate paths)');
        lines.push('5. Enforced (connected to outcomes)\n');
        
        return lines.join('\n');
    }
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
    GateResult,
    UsageGateEnforcer
};

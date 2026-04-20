/**
 * BypassDetector.js - Find Paths That Bypass Verification
 * 
 * Phase 2 Requirement: The Usage Lane cannot just detect DORMANT.
 * It must detect BYPASSED - artifacts that exist and are "called" but
 * have alternate paths that avoid enforcement.
 * 
 * Detection methods:
 * 1. Config flags that disable checks
 * 2. Alternate code paths that skip verification
 * 3. Missing calls in execution flow
 * 4. Environment-based bypasses
 * 
 * Owner: Usage Lane (Authority 50)
 * Created: 2026-04-20
 */

const fs = require('fs');
const path = require('path');

// ==============================================================================
// BYPASS TYPES
// ==============================================================================

const BypassType = {
    CONFIG_FLAG: 'CONFIG_FLAG',           // Config option disables check
    ALTERNATE_PATH: 'ALTERNATE_PATH',     // Code path that skips verification
    MISSING_CALL: 'MISSING_CALL',         // Expected call not present
    ENV_VAR: 'ENV_VAR',                   // Environment variable bypass
    FALLBACK: 'FALLBACK',                 // Fallback mode that bypasses
    MANUAL_OVERRIDE: 'MANUAL_OVERRIDE'    // Manual intervention path
};

// ==============================================================================
// BYPASS DETECTOR
// ==============================================================================

class BypassDetector {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.bypasses = [];  // Detected bypasses
    }

    /**
     * Scan for bypass paths
     */
    scan() {
        console.log('[BypassDetector] Scanning for bypass paths...\n');
        
        this.bypasses = [];
        
        // 1. Check for config flags
        this._detectConfigFlags();
        
        // 2. Check for alternate paths
        this._detectAlternatePaths();
        
        // 3. Check for env var bypasses
        this._detectEnvVarBypasses();
        
        // 4. Check for fallback modes
        this._detectFallbackModes();
        
        return this.bypasses;
    }

    /**
     * Detect config flags that bypass verification
     */
    _detectConfigFlags() {
        // Known bypass patterns to check
        const configPatterns = [
            { file: 'src/attestation/constants.js', pattern: /SKIP_VERIFICATION|BYPASS_|DISABLE_/g },
            { file: 'src/attestation/Verifier.js', pattern: /allowLegacy|skipVerify|bypass/g },
            { file: 'src/attestation/VerifierWrapper.js', pattern: /submitToRecovery.*false/g }
        ];
        
        for (const check of configPatterns) {
            const filePath = path.join(this.projectRoot, check.file);
            
            if (!fs.existsSync(filePath)) continue;
            
            const content = fs.readFileSync(filePath, 'utf8');
            const matches = content.match(check.pattern);
            
            if (matches) {
                this.bypasses.push({
                    type: BypassType.CONFIG_FLAG,
                    artifact: check.file,
                    bypass: matches.join(', '),
                    risk: 'HIGH',
                    description: `Config option that could bypass verification: ${matches.join(', ')}`
                });
            }
        }
        
        // Check if submitToRecovery can be disabled
        const verifierWrapperPath = path.join(this.projectRoot, 'src/attestation/VerifierWrapper.js');
        if (fs.existsSync(verifierWrapperPath)) {
            const content = fs.readFileSync(verifierWrapperPath, 'utf8');
            
            // Check for submitToRecovery: false option
            if (content.includes('this.submitToRecovery = options.submitToRecovery !== false')) {
                this.bypasses.push({
                    type: BypassType.CONFIG_FLAG,
                    artifact: 'src/attestation/VerifierWrapper.js',
                    bypass: 'submitToRecovery: false',
                    risk: 'MEDIUM',
                    description: 'Recovery engine can be disabled via constructor option'
                });
            }
        }
    }

    /**
     * Detect alternate code paths that bypass verification
     */
    _detectAlternatePaths() {
        // Check if there are paths that don't go through verification
        const entryPoints = [
            'src/app/api/',  // API routes
            'src/lib/db.ts'  // Database operations
        ];
        
        for (const entry of entryPoints) {
            const entryPath = path.join(this.projectRoot, entry);
            
            if (!fs.existsSync(entryPath)) continue;
            
            // For directories, scan files
            if (fs.statSync(entryPath).isDirectory()) {
                const files = this._findFiles(entryPath, ['.ts', '.js', '.tsx']);
                
                for (const file of files) {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Check if file handles document/artifact operations
                    if (content.includes('document') || content.includes('upload') || content.includes('save')) {
                        // Check if it imports verification
                        if (!content.includes('Verifier') && !content.includes('attestation')) {
                            this.bypasses.push({
                                type: BypassType.MISSING_CALL,
                                artifact: path.relative(this.projectRoot, file),
                                bypass: 'No verification import',
                                risk: 'HIGH',
                                description: 'Document-handling file does not import verification'
                            });
                        }
                    }
                }
            }
        }
    }

    /**
     * Detect environment variable bypasses
     */
    _detectEnvVarBypasses() {
        const envPatterns = [
            { pattern: /SKIP_VERIFICATION|BYPASS_|NO_VERIFY/g, risk: 'HIGH' },
            { pattern: /LANE_HMAC_SECRET/g, risk: 'MEDIUM' },  // Legacy fallback
            { pattern: /NODE_ENV.*test|NODE_ENV.*dev/g, risk: 'LOW' }
        ];
        
        const constantsPath = path.join(this.projectRoot, 'src/attestation/constants.js');
        if (fs.existsSync(constantsPath)) {
            const content = fs.readFileSync(constantsPath, 'utf8');
            
            // Check for HMAC secret (legacy bypass)
            if (content.includes('LANE_HMAC_SECRET')) {
                this.bypasses.push({
                    type: BypassType.ENV_VAR,
                    artifact: 'src/attestation/constants.js',
                    bypass: 'LANE_HMAC_SECRET',
                    risk: 'MEDIUM',
                    description: 'Legacy HMAC secret could allow fallback (deprecated but present)'
                });
            }
        }
    }

    /**
     * Detect fallback modes
     */
    _detectFallbackModes() {
        // Check Verifier for migration/dual-mode
        const verifierPath = path.join(this.projectRoot, 'src/attestation/Verifier.js');
        if (fs.existsSync(verifierPath)) {
            const content = fs.readFileSync(verifierPath, 'utf8');
            
            // Check if HMAC fallback is removed (good)
            if (!content.includes('verifyHMAC') && content.includes('HMAC fallback removed')) {
                // Good - no bypass
            } else if (content.includes('isHMACAccepted')) {
                this.bypasses.push({
                    type: BypassType.FALLBACK,
                    artifact: 'src/attestation/Verifier.js',
                    bypass: 'HMAC fallback',
                    risk: 'HIGH',
                    description: 'HMAC fallback mode present - could bypass JWS verification'
                });
            }
        }
        
        // Check for demo mode fallbacks
        const dbPath = path.join(this.projectRoot, 'src/lib/db.ts');
        if (fs.existsSync(dbPath)) {
            const content = fs.readFileSync(dbPath, 'utf8');
            
            if (content.includes('mock') || content.includes('fallback')) {
                this.bypasses.push({
                    type: BypassType.FALLBACK,
                    artifact: 'src/lib/db.ts',
                    bypass: 'Mock/fallback data',
                    risk: 'LOW',
                    description: 'Database has mock fallback mode (dev/demo only)'
                });
            }
        }
    }

    /**
     * Find files in directory
     */
    _findFiles(dir, extensions) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this._findFiles(fullPath, extensions));
            } else if (extensions.some(ext => item.endsWith(ext))) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    /**
     * Check if an artifact is bypassable
     */
    isBypassable(artifactId) {
        return this.bypasses.some(b => b.artifact === artifactId);
    }

    /**
     * Get bypasses for an artifact
     */
    getBypasses(artifactId) {
        return this.bypasses.filter(b => b.artifact === artifactId);
    }

    /**
     * Generate bypass report
     */
    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            bypasses: this.bypasses,
            summary: {
                total: this.bypasses.length,
                highRisk: this.bypasses.filter(b => b.risk === 'HIGH').length,
                mediumRisk: this.bypasses.filter(b => b.risk === 'MEDIUM').length,
                lowRisk: this.bypasses.filter(b => b.risk === 'LOW').length
            }
        };
    }
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
    BypassType,
    BypassDetector
};

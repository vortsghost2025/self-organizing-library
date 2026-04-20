/**
 * UsageLane.js - The "Where is this used?" Lane
 * 
 * Authority: 50 (observer, below Library's 60)
 * Purpose: Trace artifact usage through the system
 * Output: UsageReport (not Outcome - no accept/reject power)
 * 
 * This lane asks the question that verification lanes don't:
 * "Is this artifact actually used at runtime?"
 * 
 * Owner: Library Lane
 * Created: 2026-04-20
 */

const fs = require('fs');
const path = require('path');

// ==============================================================================
// USAGE STATUS ENUM
// ==============================================================================

const UsageStatus = {
    ACTIVE: 'ACTIVE',       // Has callers, reachable, no bypasses
    DORMANT: 'DORMANT',     // Has callers but rarely invoked
    DEAD: 'DEAD',           // No callers, unreachable
    BYPASSED: 'BYPASSED',   // Has callers but bypass paths exist
    SHADOW: 'SHADOW'        // Runtime differs from documentation
};

// ==============================================================================
// USAGE REPORT CLASS
// ==============================================================================

class UsageReport {
    constructor(options = {}) {
        this.artifactId = options.artifactId || null;
        this.artifactType = options.artifactType || 'unknown';
        
        // Phase 1: Static analysis
        this.isUsed = options.isUsed ?? false;
        this.isReachable = options.isReachable ?? false;
        
        // Phase 2: Runtime proof (CRITICAL)
        this.isExecuted = options.isExecuted ?? false;       // Proven at runtime?
        this.executionCount = options.executionCount || 0;   // How many times?
        this.lastExecuted = options.lastExecuted || null;    // When?
        
        // Phase 2: Bypass detection (CRITICAL)
        this.isBypassable = options.isBypassable ?? false;
        this.bypassPaths = options.bypassPaths || [];
        
        // Callers (from static analysis)
        this.callers = options.callers || [];
        
        // Runtime evidence
        this.runtimeEvidence = options.runtimeEvidence || {
            lastCalled: null,
            callCount: 0,
            errorCount: 0,
            avgExecutionTime: 0
        };
        
        this.status = options.status || UsageStatus.DEAD;
        this.confidence = options.confidence ?? 0;
        this.recommendation = options.recommendation || 'INVESTIGATE';
        this.timestamp = options.timestamp || new Date().toISOString();
    }

    /**
     * Five-point verification standard
     * All five must be true for "ACTIVE" status
     */
    getVerificationStandard() {
        return {
            exists: this.artifactId !== null,
            referenced: this.isUsed,
            executed: this.isExecuted,
            notBypassed: !this.isBypassable,
            enforced: this.callers.length > 0 && this.isExecuted
        };
    }

    /**
     * Check if artifact meets all five standards
     */
    meetsAllStandards() {
        const standard = this.getVerificationStandard();
        return Object.values(standard).every(v => v === true);
    }

    toJSON() {
        return {
            artifactId: this.artifactId,
            artifactType: this.artifactType,
            isUsed: this.isUsed,
            isReachable: this.isReachable,
            isExecuted: this.isExecuted,
            executionCount: this.executionCount,
            lastExecuted: this.lastExecuted,
            isBypassable: this.isBypassable,
            bypassPaths: this.bypassPaths,
            callers: this.callers,
            runtimeEvidence: this.runtimeEvidence,
            verificationStandard: this.getVerificationStandard(),
            status: this.status,
            confidence: this.confidence,
            recommendation: this.recommendation,
            timestamp: this.timestamp
        };
    }
}

// ==============================================================================
// STATIC USAGE TRACER
// ==============================================================================

class StaticUsageTracer {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.excludedDirs = options.excludedDirs || ['node_modules', '.git', 'dist', 'build', '.next'];
        this.fileExtensions = options.fileExtensions || ['.js', '.ts', '.tsx', '.jsx'];
        this.callGraph = new Map();  // artifactId -> callers
        this.exports = new Map();    // file -> exported items
        this.imports = new Map();    // file -> imported items
    }

    /**
     * Scan all files and build call graph
     */
    scan() {
        console.log('[UsageLane] Scanning project:', this.projectRoot);
        
        // Step 1: Find all files
        const files = this._findFiles(this.projectRoot);
        console.log(`[UsageLane] Found ${files.length} files`);
        
        // Step 2: Parse each file for imports/exports
        for (const file of files) {
            this._parseFile(file);
        }
        
        // Step 3: Build call graph
        this._buildCallGraph();
        
        return {
            files: files.length,
            exports: this.exports.size,
            imports: this.imports.size,
            callGraphSize: this.callGraph.size
        };
    }

    /**
     * Recursively find files
     */
    _findFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!this.excludedDirs.includes(item)) {
                    files.push(...this._findFiles(fullPath));
                }
            } else if (this.fileExtensions.some(ext => item.endsWith(ext))) {
                files.push(fullPath);
            }
        }
        
        return files;
    }

    /**
     * Parse a file for imports and exports
     */
    _parseFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.projectRoot, filePath);
            
            // Find imports (require and import statements)
            const importMatches = content.matchAll(
                /(?:require\(['"]([^'"]+)['"]\)|import\s+.*?from\s+['"]([^'"]+)['"])/g
            );
            
            const fileImports = [];
            for (const match of importMatches) {
                const importPath = match[1] || match[2];
                if (importPath && !importPath.startsWith('.')) {
                    fileImports.push(importPath);
                }
            }
            
            if (fileImports.length > 0) {
                this.imports.set(relativePath, fileImports);
            }
            
            // Find exports
            const exportMatches = content.matchAll(
                /(?:exports\.(\w+)|export\s+(?:const|function|class)\s+(\w+)|module\.exports\s*=)/g
            );
            
            const fileExports = [];
            for (const match of exportMatches) {
                const exportName = match[1] || match[2];
                if (exportName) {
                    fileExports.push(exportName);
                }
            }
            
            if (fileExports.length > 0 || content.includes('module.exports')) {
                this.exports.set(relativePath, fileExports);
            }
            
        } catch (err) {
            // Skip files we can't read
        }
    }

    /**
     * Build call graph from imports/exports
     */
    _buildCallGraph() {
        // For each file, find who imports it
        for (const [file, fileImports] of this.imports) {
            for (const importPath of fileImports) {
                // Find the file being imported
                const targetFile = this._resolveImportPath(importPath, file);
                if (targetFile) {
                    const callers = this.callGraph.get(targetFile) || [];
                    callers.push({
                        caller: file,
                        type: 'static',
                        line: null  // Would need more parsing
                    });
                    this.callGraph.set(targetFile, callers);
                }
            }
        }
    }

    /**
     * Resolve import path to actual file
     */
    _resolveImportPath(importPath, fromFile) {
        // Simplified - would need proper path resolution
        if (importPath.startsWith('.')) {
            const fromDir = path.dirname(fromFile);
            return path.normalize(path.join(fromDir, importPath));
        }
        return importPath;  // External module
    }

    /**
     * Check if a file is reachable from entry points
     */
    isReachable(artifactId, entryPoints = ['src/app/page.tsx', 'src/app/layout.tsx']) {
        // BFS from entry points
        const visited = new Set();
        const queue = [...entryPoints];
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current)) continue;
            visited.add(current);
            
            if (current === artifactId) return true;
            
            // Add files that current imports
            const imports = this.imports.get(current) || [];
            for (const imp of imports) {
                const resolved = this._resolveImportPath(imp, current);
                if (resolved && !visited.has(resolved)) {
                    queue.push(resolved);
                }
            }
        }
        
        return false;
    }

    /**
     * Generate usage report for an artifact
     */
    generateReport(artifactId) {
        const callers = this.callGraph.get(artifactId) || [];
        const reachable = this.isReachable(artifactId);
        
        let status = UsageStatus.DEAD;
        if (callers.length > 0 && reachable) {
            status = UsageStatus.ACTIVE;
        } else if (callers.length > 0 && !reachable) {
            status = UsageStatus.DORMANT;
        }
        
        return new UsageReport({
            artifactId,
            artifactType: 'file',
            isUsed: callers.length > 0,
            isReachable: reachable,
            isBypassable: false,  // Would need more analysis
            callers: callers,
            status,
            confidence: callers.length > 0 ? 0.7 : 0.9,
            recommendation: status === UsageStatus.DEAD ? 'INVESTIGATE' : 'KEEP'
        });
    }
}

// ==============================================================================
// USAGE LANE MAIN CLASS
// ==============================================================================

class UsageLane {
    constructor(options = {}) {
        this.tracer = new StaticUsageTracer(options);
        this.reports = new Map();
        this.authority = 50;
        this.laneId = 'usage';
    }

    /**
     * Analyze all artifacts in the project
     */
    analyze() {
        console.log('\n========================================');
        console.log('USAGE LANE ANALYSIS');
        console.log('Authority: 50 (Observer)');
        console.log('========================================\n');
        
        const scanResult = this.tracer.scan();
        console.log(`[UsageLane] Scan complete: ${scanResult.files} files\n`);
        
        // Analyze each exported file
        const results = {
            active: [],
            dormant: [],
            dead: [],
            bypassed: [],
            shadow: []
        };
        
        for (const [file] of this.tracer.exports) {
            const report = this.tracer.generateReport(file);
            this.reports.set(file, report);
            
            switch (report.status) {
                case UsageStatus.ACTIVE:
                    results.active.push(file);
                    break;
                case UsageStatus.DORMANT:
                    results.dormant.push(file);
                    break;
                case UsageStatus.DEAD:
                    results.dead.push(file);
                    break;
                case UsageStatus.BYPASSED:
                    results.bypassed.push(file);
                    break;
                case UsageStatus.SHADOW:
                    results.shadow.push(file);
                    break;
            }
        }
        
        return results;
    }

    /**
     * Get report for specific artifact
     */
    getReport(artifactId) {
        return this.reports.get(artifactId) || null;
    }

    /**
     * Generate summary report
     */
    generateSummary() {
        const summary = {
            timestamp: new Date().toISOString(),
            lane: this.laneId,
            authority: this.authority,
            total: this.reports.size,
            byStatus: {
                active: 0,
                dormant: 0,
                dead: 0,
                bypassed: 0,
                shadow: 0
            },
            critical: [],
            recommendations: []
        };
        
        for (const [id, report] of this.reports) {
            summary.byStatus[report.status.toLowerCase()]++;
            
            if (report.status === UsageStatus.DORMANT || report.status === UsageStatus.DEAD) {
                if (id.includes('attestation') || id.includes('queue') || id.includes('resilience')) {
                    summary.critical.push({
                        artifact: id,
                        status: report.status,
                        issue: 'Verification infrastructure not connected to application'
                    });
                }
            }
        }
        
        if (summary.critical.length > 0) {
            summary.recommendations.push({
                priority: 'HIGH',
                action: 'HOOK_UP_VERIFICATION',
                description: `${summary.critical.length} verification files are DORMANT. Connect to application.`
            });
        }
        
        return summary;
    }
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
    UsageStatus,
    UsageReport,
    StaticUsageTracer,
    UsageLane
};

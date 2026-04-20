/**
 * RuntimeProbe.js - Prove Execution, Not Just Existence
 * 
 * Phase 2 Requirement: The Usage Lane cannot rely on static inference.
 * It must PROVE that critical artifacts actually execute at runtime.
 * 
 * This module instruments key functions and records:
 * - Was it called?
 * - When?
 * - How many times?
 * - With what arguments?
 * 
 * Owner: Usage Lane (Authority 50)
 * Created: 2026-04-20
 */

const fs = require('fs');
const path = require('path');

// ==============================================================================
// PROBE REGISTRY
// ==============================================================================

const ProbeRegistry = {
    probes: new Map(),          // probeId -> probe data
    invocations: [],            // All invocations (append-only)
    logPath: null,              // Where to persist invocations
    
    /**
     * Initialize registry with log path
     */
    init(logPath) {
        this.logPath = logPath || path.join(process.cwd(), 'logs', 'runtime-probes.log');
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    },
    
    /**
     * Register a probe on a function
     */
    register(probeId, metadata = {}) {
        this.probes.set(probeId, {
            id: probeId,
            registered: new Date().toISOString(),
            invokeCount: 0,
            lastInvoked: null,
            metadata
        });
    },
    
    /**
     * Record an invocation
     */
    recordInvocation(probeId, args = {}) {
        const probe = this.probes.get(probeId);
        if (!probe) {
            console.error(`[RuntimeProbe] Unknown probe: ${probeId}`);
            return false;
        }
        
        const invocation = {
            probeId,
            timestamp: new Date().toISOString(),
            args: args,
            callStack: new Error().stack
        };
        
        probe.invokeCount++;
        probe.lastInvoked = invocation.timestamp;
        this.invocations.push(invocation);
        
        // Persist immediately (cannot lie about later)
        this._persist(invocation);
        
        return true;
    },
    
    /**
     * Persist invocation to log
     */
    _persist(invocation) {
        if (!this.logPath) return;
        
        const line = JSON.stringify(invocation) + '\n';
        fs.appendFileSync(this.logPath, line);
    },
    
    /**
     * Get probe status
     */
    getProbeStatus(probeId) {
        const probe = this.probes.get(probeId);
        if (!probe) return null;
        
        return {
            id: probe.id,
            registered: probe.registered,
            invokeCount: probe.invokeCount,
            lastInvoked: probe.lastInvoked,
            wasCalled: probe.invokeCount > 0
        };
    },
    
    /**
     * Get all probe statuses
     */
    getAllStatuses() {
        const statuses = {};
        for (const [id] of this.probes) {
            statuses[id] = this.getProbeStatus(id);
        }
        return statuses;
    },
    
    /**
     * Clear probes (for testing)
     */
    clear() {
        this.probes.clear();
        this.invocations = [];
    }
};

// ==============================================================================
// PROBE BUILDER
// ==============================================================================

class ProbeBuilder {
    /**
     * Instrument a function with a probe
     * 
     * @param {Function} fn - The function to instrument
     * @param {string} probeId - Unique identifier for this probe
     * @param {Object} metadata - Additional metadata
     * @returns {Function} - Instrumented function
     */
    static instrument(fn, probeId, metadata = {}) {
        if (typeof fn !== 'function') {
            throw new Error('[RuntimeProbe] Cannot instrument non-function');
        }
        
        // Register the probe
        ProbeRegistry.register(probeId, metadata);
        
        // Return instrumented function
        return function(...args) {
            // Record invocation
            ProbeRegistry.recordInvocation(probeId, {
                arguments: args.map(arg => {
                    // Safely serialize arguments
                    try {
                        return typeof arg === 'object' ? 
                            JSON.stringify(arg).slice(0, 200) : 
                            String(arg).slice(0, 200);
                    } catch {
                        return '[unserializable]';
                    }
                })
            });
            
            // Call original function
            return fn.apply(this, args);
        };
    }
    
    /**
     * Instrument an object method
     */
    static instrumentMethod(obj, methodName, probeId, metadata = {}) {
        const original = obj[methodName];
        if (typeof original !== 'function') {
            throw new Error(`[Runtime_probe] Method ${methodName} is not a function`);
        }
        
        obj[methodName] = this.instrument(original, probeId, metadata);
        return obj;
    }
}

// ==============================================================================
// PROBE INSTALLER - Auto-instrument critical artifacts
// ==============================================================================

class ProbeInstaller {
    /**
     * Install probes on all critical verification artifacts
     */
    static installCriticalProbes() {
        console.log('[RuntimeProbe] Installing critical probes...\n');
        
        const probes = [];
        
        // Try to instrument VerifierWrapper
        try {
            const VerifierWrapper = require('../attestation/VerifierWrapper').VerifierWrapper;
            
            // Instrument verify method
            const originalVerify = VerifierWrapper.prototype.verify;
            ProbeRegistry.register('VerifierWrapper.verify', {
                artifact: 'src/attestation/VerifierWrapper.js',
                method: 'verify',
                critical: true
            });
            
            VerifierWrapper.prototype.verify = async function(...args) {
                ProbeRegistry.recordInvocation('VerifierWrapper.verify', {
                    itemId: args[0]?.id || 'unknown',
                    hasSignature: !!args[0]?.signature
                });
                return originalVerify.apply(this, args);
            };
            
            probes.push('VerifierWrapper.verify');
        } catch (e) {
            console.log('[RuntimeProbe] Could not instrument VerifierWrapper:', e.message);
        }
        
        // Try to instrument QuarantineManager
        try {
            const QuarantineManager = require('../attestation/QuarantineManager').QuarantineManager;
            
            const originalQuarantine = QuarantineManager.prototype.quarantine;
            ProbeRegistry.register('QuarantineManager.quarantine', {
                artifact: 'src/attestation/QuarantineManager.js',
                method: 'quarantine',
                critical: true
            });
            
            QuarantineManager.prototype.quarantine = function(...args) {
                ProbeRegistry.recordInvocation('QuarantineManager.quarantine', {
                    itemId: args[0]?.id || 'unknown',
                    reason: args[1] || 'unknown'
                });
                return originalQuarantine.apply(this, args);
            };
            
            probes.push('QuarantineManager.quarantine');
        } catch (e) {
            console.log('[RuntimeProbe] Could not instrument QuarantineManager:', e.message);
        }
        
// Try to instrument Queue
try {
const Queue = require('../queue/Queue');  // Direct export, not .Queue

const originalEnqueue = Queue.prototype._enqueue;
            ProbeRegistry.register('Queue._enqueue', {
                artifact: 'src/queue/Queue.js',
                method: '_enqueue',
                critical: true
            });
            
            Queue.prototype._enqueue = function(...args) {
                ProbeRegistry.recordInvocation('Queue._enqueue', {
                    type: args[0] || 'unknown'
                });
                return originalEnqueue.apply(this, args);
            };
            
            probes.push('Queue._enqueue');
        } catch (e) {
            console.log('[RuntimeProbe] Could not instrument Queue:', e.message);
        }
        
        console.log(`[RuntimeProbe] Installed ${probes.length} probes:`);
        probes.forEach(p => console.log(`  - ${p}`));
        console.log('');
        
        return probes;
    }
}

// ==============================================================================
// PROOF REPORT
// ==============================================================================

class ProofReport {
    /**
     * Generate a proof report showing which artifacts were proven to execute
     */
    static generate() {
        const statuses = ProbeRegistry.getAllStatuses();
        
        const report = {
            timestamp: new Date().toISOString(),
            proven: [],
            notProven: [],
            summary: {
                total: Object.keys(statuses).length,
                proven: 0,
                notProven: 0
            }
        };
        
        for (const [id, status] of Object.entries(statuses)) {
            if (status.wasCalled) {
                report.proven.push({
                    probeId: id,
                    invokeCount: status.invokeCount,
                    lastInvoked: status.lastInvoked
                });
                report.summary.proven++;
            } else {
                report.notProven.push({
                    probeId: id,
                    registered: status.registered
                });
                report.summary.notProven++;
            }
        }
        
        return report;
    }
    
    /**
     * Check if all critical probes were invoked
     */
    static allCriticalProven() {
        const statuses = ProbeRegistry.getAllStatuses();
        
        for (const [id, status] of Object.entries(statuses)) {
            const probe = ProbeRegistry.probes.get(id);
            if (probe?.metadata?.critical && !status.wasCalled) {
                return {
                    proven: false,
                    missingProbe: id,
                    artifact: probe.metadata.artifact
                };
            }
        }
        
        return { proven: true };
    }
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
    ProbeRegistry,
    ProbeBuilder,
    ProbeInstaller,
    ProofReport
};

/**
 * OutcomeRouter.js - Phase 4B Cross-Lane Routing
 *
 * Implements "4 minds > 1" routing mechanism.
 * Decides which lane to route to based on outcome status,
 * confidence, and authority levels.
 *
 * Owner: Archivist (implementation)
 * Last updated: 2026-04-20
 */

const { OutcomeStatus, RequiresReason, ConfidenceThresholds } = require('./OutcomeProtocol');

// ==============================================================================
// LANE AUTHORITY LEVELS
// ==============================================================================

const LaneAuthority = {
    SWARMIND: 80,       // Execution lane
    ARCHIVIST: 80,      // Orchestration lane
    LIBRARY: 60,        // Verification lane
    OPERATOR: 90        // Human operator (highest)
};

// ==============================================================================
// ROUTE DECISION TYPES
// ==============================================================================

const RouteDecision = {
    LOCAL: 'LOCAL',                 // Handle locally (Library)
    ESCALATE_ARCHIVIST: 'ARCHIVIST', // Route to Archivist
    ESCALATE_SWARMIND: 'SWARMIND',   // Route to SwarmMind
    OPERATOR: 'OPERATOR',            // Route to operator
    DEFER: 'DEFER'                   // Park locally
};

// ==============================================================================
// ROUTE DECIDER CLASS
// ==============================================================================

class RouteDecider {
    constructor(options = {}) {
        this.currentLane = options.currentLane || 'library';
        this.currentAuthority = options.currentAuthority || LaneAuthority.LIBRARY;
        this.recoveryAvailable = options.recoveryAvailable ?? true;
    }

    /**
     * Decide where to route an outcome
     *
     * @param {Object} outcome - Outcome object
     * @returns {Object} Route decision
     */
    decide(outcome) {
        // Terminal outcomes - no routing needed
        if (outcome.isTerminal()) {
            return {
                decision: RouteDecision.LOCAL,
                reason: 'Terminal outcome - no routing needed',
                target: null
            };
        }

        // Handoff required - route to operator
        if (outcome.handoffRequired) {
            return {
                decision: RouteDecision.OPERATOR,
                reason: 'Handoff artifact generated',
                target: 'operator',
                handoffFile: outcome.handoffFile
            };
        }

        // Deferred - park locally
        if (outcome.status === OutcomeStatus.DEFER) {
            return {
                decision: RouteDecision.DEFER,
                reason: outcome.reason || 'Waiting on dependency',
                waitingOn: outcome.requires
            };
        }

        // Escalate - route to higher authority
        if (outcome.status === OutcomeStatus.ESCALATE) {
            return this.decideEscalation(outcome);
        }

        // Quarantine - handle locally with retry
        if (outcome.status === OutcomeStatus.QUARANTINE) {
            return {
                decision: RouteDecision.LOCAL,
                reason: 'Local retry scheduled',
                retryCount: outcome.retryCount,
                nextRetryIn: outcome.nextRetryIn
            };
        }

        // Default to local
        return {
            decision: RouteDecision.LOCAL,
            reason: 'Default local handling'
        };
    }

    /**
     * Decide which higher authority lane to escalate to
     *
     * "4 minds > 1" principle: When confidence is low,
     * route to lanes with higher authority for consensus.
     */
    decideEscalation(outcome) {
        // Determine target based on reason and context
        if (outcome.reason === RequiresReason.ORCHESTRATOR_UNREACHABLE) {
            // Orchestrator issue -> route to SwarmMind for execution check
            return {
                decision: RouteDecision.ESCALATE_SWARMIND,
                reason: 'Orchestrator unreachable - check execution lane',
                target: 'swarmmind',
                authority: LaneAuthority.SWARMIND
            };
        }

        if (outcome.reason === RequiresReason.MISSING_KEY) {
            // Key issue -> route to Archivist for trust store resolution
            return {
                decision: RouteDecision.ESCALATE_ARCHIVIST,
                reason: 'Key not found - trust store resolution needed',
                target: 'archivist',
                authority: LaneAuthority.ARCHIVIST
            };
        }

        if (outcome.confidence < ConfidenceThresholds.ESCALATE) {
            // Very low confidence - route to Archivist (orchestration authority)
            return {
                decision: RouteDecision.ESCALATE_ARCHIVIST,
                reason: `Low confidence (${outcome.confidence.toFixed(2)}) - orchestration review`,
                target: 'archivist',
                authority: LaneAuthority.ARCHIVIST,
                requiresConsensus: true
            };
        }

        // Default escalation to Archivist
        return {
            decision: RouteDecision.ESCALATE_ARCHIVIST,
            reason: 'Default escalation target',
            target: 'archivist',
            authority: LaneAuthority.ARCHIVIST
        };
    }

    /**
     * Check if current lane has authority to handle outcome
     */
    hasAuthority(outcome, requiredAuthority) {
        return this.currentAuthority >= requiredAuthority;
    }

    /**
     * Get routing metadata for logging
     */
    getRoutingMetadata(outcome, decision) {
        return {
            timestamp: new Date().toISOString(),
            outcomeId: outcome.itemId,
            outcomeStatus: outcome.status,
            confidence: outcome.confidence,
            currentLane: this.currentLane,
            currentAuthority: this.currentAuthority,
            decision: decision.decision,
            target: decision.target,
            reason: decision.reason
        };
    }
}

// ==============================================================================
// ESCALATION HANDLER
// ==============================================================================

class EscalationHandler {
    constructor(options = {}) {
        this.recoveryClient = options.recoveryClient || null;
        this.onEscalate = options.onEscalate || null; // Callback for escalation
    }

    /**
     * Handle escalation to another lane
     */
    async escalate(outcome, decision) {
        if (!this.recoveryClient) {
            throw new Error('RecoveryClient not configured for escalation');
        }

        const escalationPayload = {
            itemId: outcome.itemId,
            fromLane: outcome.lane,
            toLane: decision.target,
            reason: outcome.reason,
            confidence: outcome.confidence,
            requires: outcome.requires,
            timestamp: new Date().toISOString(),
            artifact: outcome.metadata?.artifact || null
        };

        try {
            const response = await this.recoveryClient.submitEscalation(escalationPayload);

            // Callback if provided
            if (this.onEscalate) {
                this.onEscalate(escalationPayload, response);
            }

            return {
                success: true,
                escalationId: response.escalationId,
                status: response.status,
                nextAction: response.nextAction
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                fallback: 'LOCAL_QUARANTINE'
            };
        }
    }
}

// ==============================================================================
// CONSENSUS CHECKER ("4 minds > 1")
// ==============================================================================

class ConsensusChecker {
    /**
     * Check if multiple lanes agree on outcome
     *
     * @param {Array} laneDecisions - Array of lane decisions
     * @param {number} threshold - Minimum agreements required
     * @returns {Object} Consensus result
     */
    checkConsensus(laneDecisions, threshold = 2) {
        if (laneDecisions.length < threshold) {
            return {
                hasConsensus: false,
                reason: 'Not enough decisions for consensus'
            };
        }

        // Count agreement types
        const agreementCounts = {};
        laneDecisions.forEach(decision => {
            const key = `${decision.status}:${decision.confidence >= 0.5 ? 'high' : 'low'}`;
            agreementCounts[key] = (agreementCounts[key] || 0) + 1;
        });

        // Find majority
        let maxAgreement = { key: null, count: 0 };
        Object.entries(agreementCounts).forEach(([key, count]) => {
            if (count > maxAgreement.count) {
                maxAgreement = { key, count };
            }
        });

        return {
            hasConsensus: maxAgreement.count >= threshold,
            consensusKey: maxAgreement.key,
            agreementCount: maxAgreement.count,
            totalDecisions: laneDecisions.length,
            threshold
        };
    }

    /**
     * Calculate weighted consensus based on lane authorities
     */
    calculateWeightedConsensus(laneDecisions) {
        let totalWeight = 0;
        let acceptWeight = 0;
        let rejectWeight = 0;

        laneDecisions.forEach(decision => {
            const weight = decision.authority || LaneAuthority.LIBRARY;
            totalWeight += weight;

            if (decision.status === OutcomeStatus.ACCEPT) {
                acceptWeight += weight;
            } else if (decision.status === OutcomeStatus.REJECT) {
                rejectWeight += weight;
            }
        });

        const acceptRatio = acceptWeight / totalWeight;
        const rejectRatio = rejectWeight / totalWeight;

        return {
            acceptRatio,
            rejectRatio,
            undecidedRatio: 1 - acceptRatio - rejectRatio,
            recommendation: acceptRatio > 0.5 ? OutcomeStatus.ACCEPT :
                           rejectRatio > 0.5 ? OutcomeStatus.REJECT :
                           OutcomeStatus.QUARANTINE
        };
    }
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
    LaneAuthority,
    RouteDecision,
    RouteDecider,
    EscalationHandler,
    ConsensusChecker
};

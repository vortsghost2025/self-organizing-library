/**
 * Canonical Governance Data Reader & Type Definitions
 *
 * Sourced directly from data/canonical-governance.json (ratified via Option C).
 * This module enforces strict separation between:
 * 1. Constitutional Lane Authority (CANONICAL_ARCHITECTURE.md §2.2 - 4 lanes)
 * 2. Phase-Completion Approval Weights (GOVERNANCE.md §12 - 5 verification participants)
 *
 * DO NOT combine or alias these two distinct semantic dimensions.
 */

import canonicalGovernanceData from "../../data/canonical-governance.json";

export type CoreLaneId = "archivist" | "swarmmind" | "kernel" | "library";
export type PhaseParticipant = "user" | "archivist" | "library" | "codex" | "swarmmind";

export interface BroadcastReference {
  task_id: string;
  authoritative_external_path: string;
  local_mirror_path: string;
  content_hash: string;
  signer: string;
  key_id: string;
}

export interface RatificationMetadata {
  task_id: string;
  proposal_doc_path: string;
  library_verification_path: string;
  library_key_id: string;
  original_broadcast: BroadcastReference;
  provenance_correction: BroadcastReference;
}

export interface CanonicalGovernance {
  schema_version: string;
  status: string;
  ratified_at: string;
  ratification: RatificationMetadata;
  constitutional_lane_authority: Record<CoreLaneId, number>;
  phase_completion_approval_weights: Record<PhaseParticipant, number>;
  semantic_definitions: {
    constitutional_lane_authority: string;
    phase_completion_approval_weights: string;
  };
  sources: {
    constitutional: string;
    phase_completion: string;
  };
  adjudicated_drift: Record<string, string>;
  historical_policy: {
    preserve_original_context: boolean;
    description: string;
  };
}

const governance: CanonicalGovernance = canonicalGovernanceData as CanonicalGovernance;

/**
 * Returns the complete ratified canonical governance data object.
 */
export function getCanonicalGovernance(): CanonicalGovernance {
  return governance;
}

/**
 * Returns the 4-lane constitutional authority map (Archivist=100, SwarmMind=80, Kernel=70, Library=60).
 * Use this for system architecture, lane hierarchy, and public governance presentation.
 */
export function getConstitutionalLaneAuthority(): Readonly<Record<CoreLaneId, number>> {
  return governance.constitutional_lane_authority;
}

/**
 * Returns the constitutional authority for a specific core lane.
 */
export function getLaneConstitutionalAuthority(lane: CoreLaneId): number {
  return governance.constitutional_lane_authority[lane];
}

/**
 * Returns the 5-participant phase completion approval weights (User=100, Archivist=90, Library=90, Codex=70, SwarmMind=80).
 * Use this ONLY for build-and-review phase gate verification.
 */
export function getPhaseCompletionApprovalWeights(): Readonly<Record<PhaseParticipant, number>> {
  return governance.phase_completion_approval_weights;
}

/**
 * Returns the phase completion approval weight for a specific participant.
 */
export function getParticipantPhaseCompletionWeight(participant: PhaseParticipant): number {
  return governance.phase_completion_approval_weights[participant];
}

/**
 * Returns the formal semantic definition for a governance dimension.
 */
export function getSemanticDefinition(
  dimension: "constitutional_lane_authority" | "phase_completion_approval_weights"
): string {
  return governance.semantic_definitions[dimension];
}

/**
 * Ordered list of core lanes by constitutional hierarchy (Archivist -> SwarmMind -> Kernel -> Library).
 */
export const CORE_LANES_HIERARCHY: readonly CoreLaneId[] = [
  "archivist",
  "swarmmind",
  "kernel",
  "library",
] as const;

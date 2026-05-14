/**
 * Adaptive Ethical Cooperation Score (ECS) for lane claim quality.
 *
 * Learns from historical patterns instead of using static thresholds.
 * Each lane's score adjusts based on the verification outcome of their
 * claims. Lanes that consistently submit verifiable claims see their
 * score rise; lanes that submit unverifiable or contradictory claims
 * see their score fall.
 *
 * The system adapts: if all lanes improve, the threshold rises.
 * If the system is noisy, thresholds loosen.
 */

export interface ClaimRecord {
  laneId: string;
  timestamp: string;
  claimType: string;
  outcome: "verified" | "contradicted" | "unverifiable" | "quarantined";
  verificationDurationMs: number;
}

export interface LaneEthicsProfile {
  laneId: string;
  score: number;
  totalClaims: number;
  verifiedRate: number;
  contradictedRate: number;
  averageVerificationTimeMs: number;
  trend: "improving" | "declining" | "stable";
  lastUpdated: string;
}

const HISTORY_WINDOW = 100;
const DEFAULT_SCORE = 0.75;
const MIN_SCORE = 0.1;
const MAX_SCORE = 1.0;
const LEARNING_RATE = 0.05;

const OUTCOME_WEIGHTS: Record<string, number> = {
  verified: 0.1,
  contradicted: -0.15,
  unverifiable: -0.2,
  quarantined: -0.3,
};

export class AdaptiveEthicsScorer {
  private history: Map<string, ClaimRecord[]> = new Map();
  private profiles: Map<string, LaneEthicsProfile> = new Map();

  constructor(initialClaims?: ClaimRecord[]) {
    if (initialClaims) {
      for (const claim of initialClaims) {
        this.record(claim);
      }
    }
  }

  record(claim: ClaimRecord): LaneEthicsProfile {
    if (!this.history.has(claim.laneId)) {
      this.history.set(claim.laneId, []);
    }

    const laneHistory = this.history.get(claim.laneId)!;
    laneHistory.push(claim);

    if (laneHistory.length > HISTORY_WINDOW) {
      laneHistory.splice(0, laneHistory.length - HISTORY_WINDOW);
    }

    return this.recalculate(claim.laneId);
  }

  private recalculate(laneId: string): LaneEthicsProfile {
    const laneHistory = this.history.get(laneId) || [];
    const previous = this.profiles.get(laneId);

    if (laneHistory.length === 0) {
      return this.defaultProfile(laneId);
    }

    const total = laneHistory.length;
    const verified = laneHistory.filter((c) => c.outcome === "verified").length;
    const contradicted = laneHistory.filter((c) => c.outcome === "contradicted").length;
    const unverifiable = laneHistory.filter((c) => c.outcome === "unverifiable").length;
    const quarantined = laneHistory.filter((c) => c.outcome === "quarantined").length;

    const verifiedRate = total > 0 ? verified / total : 0;
    const contradictedRate = total > 0 ? contradicted / total : 0;

    const totalTimeMs = laneHistory.reduce((sum, c) => sum + (c.verificationDurationMs || 0), 0);
    const averageVerificationTimeMs = total > 0 ? totalTimeMs / total : 0;

    let rawScore = DEFAULT_SCORE;
    rawScore += verifiedRate * 0.3;
    rawScore -= contradictedRate * 0.3;
    rawScore -= unverifiable / total * 0.4;
    rawScore -= quarantined / total * 0.5;
    rawScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, rawScore));

    const score = previous
      ? previous.score + (rawScore - previous.score) * LEARNING_RATE
      : rawScore;

    const trend: "improving" | "declining" | "stable" = previous
      ? score > previous.score + 0.02
        ? "improving"
        : score < previous.score - 0.02
          ? "declining"
          : "stable"
      : "stable";

    const profile: LaneEthicsProfile = {
      laneId,
      score: Math.round(score * 1000) / 1000,
      totalClaims: total,
      verifiedRate: Math.round(verifiedRate * 1000) / 1000,
      contradictedRate: Math.round(contradictedRate * 1000) / 1000,
      averageVerificationTimeMs: Math.round(averageVerificationTimeMs),
      trend,
      lastUpdated: new Date().toISOString(),
    };

    this.profiles.set(laneId, profile);
    return profile;
  }

  getProfile(laneId: string): LaneEthicsProfile {
    return this.profiles.get(laneId) || this.defaultProfile(laneId);
  }

  getAllProfiles(): LaneEthicsProfile[] {
    return Array.from(this.profiles.values());
  }

  getAdaptiveThreshold(): number {
    const profiles = this.getAllProfiles();
    if (profiles.length === 0) return 0.5;

    const avg = profiles.reduce((sum, p) => sum + p.score, 0) / profiles.length;
    const variance = profiles.reduce((sum, p) => sum + Math.pow(p.score - avg, 2), 0) / profiles.length;
    const stdDev = Math.sqrt(variance);

    // Threshold moves with the system: higher when lanes are reliable,
    // lower when the system is noisy
    return Math.max(0.3, Math.min(0.9, avg - stdDev * 0.5));
  }

  needsAttention(laneId: string): boolean {
    const profile = this.getProfile(laneId);
    return profile.score < this.getAdaptiveThreshold();
  }

  private defaultProfile(laneId: string): LaneEthicsProfile {
    return {
      laneId,
      score: DEFAULT_SCORE,
      totalClaims: 0,
      verifiedRate: 0,
      contradictedRate: 0,
      averageVerificationTimeMs: 0,
      trend: "stable",
      lastUpdated: new Date().toISOString(),
    };
  }
}

let globalScorer: AdaptiveEthicsScorer | null = null;

export function getGlobalEthicsScorer(): AdaptiveEthicsScorer {
  if (!globalScorer) {
    globalScorer = new AdaptiveEthicsScorer();
  }
  return globalScorer;
}

export function resetGlobalScorer(): void {
  globalScorer = null;
}

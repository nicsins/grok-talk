/**
 * Daily Challenge Module
 * Manages daily challenges and reward distribution
 */

export interface ChallengeStats {
  level: number;
  xp: number;
  lifetimeXp: number;
  fusionsPerformed: number;
  fireFusions: number;
}

export interface ClaimRewardResult {
  success: boolean;
  panda?: string;
  message?: string;
}

export class DailyChallenge {
  private stats: Partial<ChallengeStats> = {};
  private readonly XP_THRESHOLD = 500;
  private readonly FIRE_FUSION_GOAL = 3;

  updateProgress(stats: ChallengeStats): void {
    this.stats = { ...stats };
  }

  canClaim(): boolean {
    return (
      (this.stats.lifetimeXp || 0) >= this.XP_THRESHOLD &&
      (this.stats.fireFusions || 0) >= this.FIRE_FUSION_GOAL
    );
  }

  claimReward(): ClaimRewardResult {
    if (!this.canClaim()) {
      return {
        success: false,
        message: 'Challenge requirements not met'
      };
    }

    return {
      success: true,
      panda: 'Blaze Guardian'
    };
  }
}

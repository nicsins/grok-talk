/**
 * Fusion Engine Module
 * Core fusion mechanics and synergy calculations
 */

export interface PandaType {
  id?: string;
  name: string;
  rarity: string;
  element?: string;
  type?: string;
  power: number;
  level?: number;
  count?: number;
  emoji?: string;
  color?: string;
  desc?: string;
  image?: string;
}

export interface FusionResult {
  success: boolean;
  newPanda?: PandaType;
  xpGained?: number;
  synergy?: string;
}

export class FusionEngine {
  private synergies: Record<string, string[]> = {
    'Fire:Ice': 'Steam',
    'Ice:Fire': 'Steam',
    'Dark:Light': 'Eclipse',
    'Light:Dark': 'Eclipse',
    'Electric:Crystal': 'Plasma',
    'Crystal:Electric': 'Plasma'
  };

  fuse(panda1: PandaType, panda2: PandaType, mode: string = 'basic'): FusionResult {
    const avgPower = Math.floor((panda1.power + panda2.power) / 2);
    const synergy = this.getSynergy(panda1, panda2);
    
    const basePower = this.calculateBasePower(avgPower, mode);
    const xpGain = this.calculateXP(avgPower, mode);

    const newPanda: PandaType = {
      name: `${panda1.name} + ${panda2.name}`,
      type: synergy || panda1.type || 'Balanced',
      power: basePower,
      rarity: this.calculateRarity(panda1.rarity, panda2.rarity),
      element: synergy
    };

    return {
      success: true,
      newPanda,
      xpGained: xpGain,
      synergy
    };
  }

  private getSynergy(panda1: PandaType, panda2: PandaType): string | null {
    const key1 = `${panda1.type}:${panda2.type}`;
    const key2 = `${panda2.type}:${panda1.type}`;
    return this.synergies[key1] || this.synergies[key2] || null;
  }

  private calculateBasePower(avgPower: number, mode: string): number {
    const modeMultipliers: Record<string, number> = {
      'basic': 1.0,
      'advanced': 1.2,
      'ritual': 1.5
    };
    const multiplier = modeMultipliers[mode] || 1.0;
    return Math.floor(avgPower * (1 + multiplier));
  }

  private calculateXP(avgPower: number, mode: string): number {
    const baseXP = 100;
    const modeBonus: Record<string, number> = {
      'basic': 1.0,
      'advanced': 1.5,
      'ritual': 2.0
    };
    const bonus = modeBonus[mode] || 1.0;
    return Math.floor(baseXP * bonus + avgPower * 0.5);
  }

  private calculateRarity(rarity1: string, rarity2: string): string {
    const rarityRank: Record<string, number> = {
      'common': 1,
      'rare': 2,
      'epic': 3,
      'legendary': 4,
      'mythic': 5
    };
    const avg = (rarityRank[rarity1] || 1 + rarityRank[rarity2] || 1) / 2;
    if (avg >= 4) return 'legendary';
    if (avg >= 3) return 'epic';
    if (avg >= 2) return 'rare';
    return 'common';
  }
}

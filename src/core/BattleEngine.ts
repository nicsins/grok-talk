/**
 * Production-grade BattleEngine for the Arena
 * Handles combat simulation, damage calculation, XP rewards, and type advantages.
 * Phase 6 of TS migration.
 */

import type { Panda } from './GameState';

export interface BattleResult {
  winner: Panda;
  loser: Panda;
  damageDealt: number;
  xpGained: number;
  criticalHit: boolean;
  message: string;
}

export class BattleEngine {
  private static readonly TYPE_ADVANTAGE: Record<string, string[]> = {
    Fire: ['Wind', 'Earth'],
    Water: ['Fire', 'Lightning'],
    Earth: ['Water', 'Wind'],
    Wind: ['Earth', 'Lightning'],
    Lightning: ['Water', 'Fire'],
  };

  battle(challenger: Panda, opponent: Panda): BattleResult {
    const advantage = this.hasAdvantage(challenger, opponent) ? 1.35 : 1.0;
    const critical = Math.random() < 0.18;
    const baseDamage = Math.floor(challenger.power * 0.75 * advantage);
    const damage = critical ? Math.floor(baseDamage * 1.6) : baseDamage;

    const xp = Math.floor(35 + (opponent.power / 8) * (advantage > 1 ? 1.3 : 1));

    return {
      winner: challenger,
      loser: opponent,
      damageDealt: damage,
      xpGained: xp,
      criticalHit: critical,
      message: critical 
        ? `${challenger.name} landed a CRITICAL HIT!` 
        : `${challenger.name} wins the battle!`,
    };
  }

  private hasAdvantage(attacker: Panda, defender: Panda): boolean {
    const advantages = BattleEngine.TYPE_ADVANTAGE[attacker.element] || [];
    return advantages.includes(defender.element);
  }
}

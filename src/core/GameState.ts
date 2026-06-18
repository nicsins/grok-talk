/**
 * GameState Management Module
 * Handles game state persistence and schema versioning
 */

export interface GameStateType {
  level: number;
  xp: number;
  lifetimeEarnedXp: number;
  saveSchemaVersion: number;
  fireChallengeFusions: number;
  fusions: number;
  ritualFusionsCount: number;
  collectionCount: number;
  totalPower: number;
  collection: any[];
  recentFusions: any[];
  ep?: number;
  upgrades?: Record<string, number>;
  boosters?: Record<string, boolean>;
}

export class GameStateManager {
  private state: GameStateType;

  constructor(initialState?: Partial<GameStateType>) {
    this.state = {
      level: 0,
      xp: 0,
      lifetimeEarnedXp: 0,
      saveSchemaVersion: 2,
      fireChallengeFusions: 0,
      fusions: 0,
      ritualFusionsCount: 0,
      collectionCount: 0,
      totalPower: 0,
      collection: [],
      recentFusions: [],
      ep: 0,
      upgrades: {},
      boosters: {},
      ...initialState
    };
  }

  getState(): GameStateType {
    return this.state;
  }

  updateState(partial: Partial<GameStateType>): void {
    this.state = { ...this.state, ...partial };
  }

  migrateSchema(): void {
    if (this.state.saveSchemaVersion < 2) {
      this.state.saveSchemaVersion = 2;
      if (!('fireChallengeFusions' in this.state)) {
        this.state.fireChallengeFusions = 0;
      }
      if (!('lifetimeEarnedXp' in this.state) || this.state.lifetimeEarnedXp < 0) {
        const estimatedXp = Math.floor(
          (this.state.fusions || 0) * 95 + (this.state.level || 0) * 400
        );
        this.state.lifetimeEarnedXp = estimatedXp;
      }
    }
  }
}

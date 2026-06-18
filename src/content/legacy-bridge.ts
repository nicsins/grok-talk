/**
 * Legacy Bridge Module
 * Maintains compatibility with legacy panda definitions
 */

export interface PandaDefinition {
  id: string;
  name: string;
  emoji: string;
  type: string;
  power: number;
  rarity: string;
  color: string;
  image?: string;
}

const LEGACY_PANDAS: PandaDefinition[] = [
  { id: 'u1', name: 'Classic Panda', emoji: '🐼', type: 'Balanced', power: 12, rarity: 'common', color: '#64748b' },
  { id: 'u2', name: 'Inferno Panda', emoji: '🔥🐼', type: 'Fire', power: 18, rarity: 'rare', color: '#ff6b35' },
  { id: 'u3', name: 'Frostbite Panda', emoji: '❄️🐼', type: 'Ice', power: 15, rarity: 'rare', color: '#4dd0e1' },
  { id: 'u4', name: 'Thunder Panda', emoji: '⚡🐼', type: 'Electric', power: 19, rarity: 'rare', color: '#ffd54f' },
  { id: 'u5', name: 'Shadow Panda', emoji: '🌑🐼', type: 'Dark', power: 22, rarity: 'epic', color: '#37474f' },
  { id: 'u6', name: 'Golden Fortune', emoji: '✨🐼', type: 'Light', power: 27, rarity: 'legendary', color: '#ffeb3b' },
  { id: 'u7', name: 'Crystal Panda', emoji: '💎🐼', type: 'Crystal', power: 16, rarity: 'rare', color: '#b39ddb' },
  { id: 'u8', name: 'Steam Panda', emoji: '🌫️🐼', type: 'Steam', power: 32, rarity: 'epic', color: '#80deea' },
  { id: 'u9', name: 'Blaze Guardian', emoji: '🔥✨🐼', type: 'Fire', power: 50, rarity: 'mythic', color: '#ff6b6b' }
];

export function getLegacyPandas(): PandaDefinition[] {
  return [...LEGACY_PANDAS];
}

export const EXPANDED_INITIAL_POOL: PandaDefinition[] = LEGACY_PANDAS.slice(0, 3);

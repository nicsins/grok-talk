/**
 * Production content: Expanded Panda roster
 * Phase 7 — New Content
 */

import type { Panda } from '../core/GameState';

export const BASE_PANDAS: Omit<Panda, 'id' | 'count' | 'level'>[] = [
  // Original core
  { name: 'Ember Cub', rarity: 'Common', element: 'Fire', power: 85 },
  { name: 'Breeze Cub', rarity: 'Common', element: 'Wind', power: 80 },
  { name: 'Aqua Cub', rarity: 'Common', element: 'Water', power: 82 },
  { name: 'Terra Cub', rarity: 'Common', element: 'Earth', power: 88 },
  { name: 'Spark Cub', rarity: 'Common', element: 'Lightning', power: 79 },

  // New content — Rare tier
  { name: 'Inferno Guardian', rarity: 'Rare', element: 'Fire', power: 145 },
  { name: 'Cyclone Striker', rarity: 'Rare', element: 'Wind', power: 138 },
  { name: 'Tidal Warden', rarity: 'Rare', element: 'Water', power: 142 },
  { name: 'Mountain Titan', rarity: 'Rare', element: 'Earth', power: 151 },
  { name: 'Thunder Lord', rarity: 'Rare', element: 'Lightning', power: 140 },

  // New content — Epic tier
  { name: 'Blazing Phoenix Panda', rarity: 'Epic', element: 'Fire', power: 210 },
  { name: 'Storm Dragon Panda', rarity: 'Epic', element: 'Wind', power: 205 },
  { name: 'Abyssal Leviathan Panda', rarity: 'Epic', element: 'Water', power: 215 },
  { name: 'Ancient Golem Panda', rarity: 'Epic', element: 'Earth', power: 225 },
  { name: 'Void Lightning Panda', rarity: 'Epic', element: 'Lightning', power: 218 },

  // New content — Legendary
  { name: 'Solar Flare Overlord', rarity: 'Legendary', element: 'Fire', power: 310 },
  { name: 'Hurricane Sovereign', rarity: 'Legendary', element: 'Wind', power: 295 },
  { name: 'Oceanic Emperor', rarity: 'Legendary', element: 'Water', power: 305 },
  { name: 'Worldshaper Colossus', rarity: 'Legendary', element: 'Earth', power: 320 },
  { name: 'Celestial Storm King', rarity: 'Legendary', element: 'Lightning', power: 315 },

  // New content — Mythic (very rare)
  { name: 'Quantum Overlord Panda', rarity: 'Mythic', element: 'Lightning', power: 450 },
  { name: 'Eternal Flame Sovereign', rarity: 'Mythic', element: 'Fire', power: 440 },
];

export const NEW_DAILY_REWARDS = [
  'Blaze Guardian',
  'Tempest Warden',
  'Frostbite Sentinel',
  'Quake Master',
  'Aether Dragon',
];
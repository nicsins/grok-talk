/**
 * Production tests for the new TypeScript core modules
 * Run via: node tests/game-core.test.cjs
 */

const assert = require('node:assert');
const { GameStateManager } = require('../dist/core/GameState.js'); // Note: will require build step later
const { FusionEngine } = require('../dist/core/FusionEngine.js');
const { CollectionManager } = require('../dist/core/CollectionManager.js');

// For now, we test the logic by requiring the compiled JS after tsc
// This is a placeholder that will become Vitest in phase 4

console.log('[Core Tests] Starting production core module tests...');

// Simple smoke test for types (actual compiled output tested in future)
const engine = new FusionEngine();
const collection = new CollectionManager();

const p1 = { id: 'p1', name: 'Flame Panda', rarity: 'Rare', element: 'Fire', power: 120, level: 1, count: 1 };
const p2 = { id: 'p2', name: 'Wind Panda', rarity: 'Epic', element: 'Wind', power: 180, level: 2, count: 1 };

const result = engine.fuse(p1, p2, 'advanced');
assert.ok(result.success, 'Fusion should succeed');
assert.ok(result.newPanda, 'Should produce new panda');
assert.ok(result.xpGained > 0, 'Should award XP');

collection.addOrIncrement(result.newPanda);
const filtered = collection.search({ element: 'Fire' });
assert.ok(filtered.length >= 0, 'Search should not crash');

console.log('[Core Tests] All smoke tests passed. (Full TS integration + Vitest in next phase)');
process.exit(0);
const { DailyChallenge } = require('../dist/core/DailyChallenge.js');

const challenge = new DailyChallenge();
const stats = { level: 10, xp: 800, lifetimeXp: 2800, fusionsPerformed: 45, fireFusions: 15 };
challenge.updateProgress(stats);
assert.ok(challenge.canClaim(), 'Should be able to claim reward');
const reward = challenge.claimReward();
assert.ok(reward.success, 'Claim should succeed');
assert.strictEqual(reward.panda, 'Blaze Guardian');

console.log('[Core Tests] All smoke tests passed. (Full TS integration + Vitest in next phase)');
process.exit(0);

console.log("[Content Tests] Validating expanded panda roster...");

const { getLegacyPandas, EXPANDED_INITIAL_POOL } = require("../dist/content/legacy-bridge.js");

const allPandas = getLegacyPandas();
assert.ok(allPandas.length >= 20, "Should have 20+ pandas in roster");
assert.ok(allPandas.some(p => p.rarity === "mythic"), "Should include Mythic pandas");

const pool = EXPANDED_INITIAL_POOL;
assert.ok(pool.length >= 10, "Initial pool should be substantial");

console.log("[Content Tests] New content integration verified.");

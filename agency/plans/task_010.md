# Implementation Plan - Task 010: Gameplay Points & Arena Balance

- **Task ID**: task_010
- **Status**: Draft

## 1. System Design & State Changes
- **Daily Challenge Reward**:
  - The daily challenge reward panda `Blaze Guardian` must have its `image` property assigned upon creation using the `generateProceduralPandaImage` function so it renders immediately in the collection UI without needing a page refresh.
- **Arena Combat Difficulty Scaling**:
  - Scale opponent level `enemyLevel`, opponent max HP `enemyMax`, opponent damage `enemyBaseDamage`, and opponent power `enemyPower` dynamically based on the selected champion's level (`champion.level`) and power (`champion.power`), combined with the rival's difficulty rating (`rival.difficulty`).
  - Introduce random variance (+/- 15%) in the opponent's max HP, damage, and power to make combat outcomes dynamic and unpredictable.
- **Defeat Mechanism**:
  - With higher-difficulty rivals or unlucky RNG rolls, ensure the opponent can deal enough damage to overpower the player's champion, triggering the defeat flow, defeat logs, and defeat cinematics cleanly.

## 2. Code Changes Spec
- **Target Files**:
  - `app.js`: Update `claimDailyChallenge()` to assign the procedural image path to the reward panda.
  - `app.js`: Refactor `__createBattleMatch()` to scale opponent level, HP, power, and damage using the selected champion's level, power, and rival difficulty with variance.
- **Test files**:
  - `tests/mechanics.test.cjs`: Add `TEST 13` to cover dynamic combat scaling, defeat scenarios, and daily challenge XP/EP disbursements.

## 3. DOM & UI Spec
- No new UI elements are required. The layout and styles remain identical to preserve CSS flexibility. Emojis must remain eliminated from all text nodes and visual assets.

## 4. Test Specifications
- **Tests**:
  - Assert that `claimDailyChallenge()` awards 280 XP, 500 EP, and a Blaze Guardian panda with a valid non-empty `image` property.
  - Assert that `__createBattleMatch()` correctly scales the opponent's stats based on a high-level champion vs a low-level champion.
  - Assert that a simulated combat run can lead to a defeat under high-difficulty / unfavorable rolls.

# Implementation Plan: Add Combat Training Upgrade
- **Task ID**: task_002
- **Target Files**: 
  - [source.html](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/source.html)
  - [app.js](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/app.js)
  - [tests/mechanics.test.cjs](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/tests/mechanics.test.cjs)

## 1. System Design & State Changes

We will introduce a third upgrade option called **Battle Training** to the upgrades system. This upgrade will persistently increase player base damage in the Battle Arena.

### Game State Properties
- **State Property**: `gameState.upgrades.training`
- **Default Value**: `0`
- **Max Level**: `15`
- **Cost Formula**: `300 + level * 200` EP
- **Upgrade Effect**: `+5%` player damage per level

### Upgrades Schema Modification
We need to update the default `gameState` initialization and ensure that upgrades schema migrations safely inject `training: 0` if it is not present in the user's LocalStorage.

---

## 2. Code Changes Spec

### [app.js](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/app.js)

#### Default gameState Initialization
Update default `gameState` declaration (around line 38) to include `training: 0`.

```javascript
            upgrades: {
                efficiency: 0,
                stability: 0,
                training: 0
            },
```

#### loadGameState Migration Handling
Initialize `gameState.upgrades.training` in `loadGameState` if it is missing (around line 108):

```javascript
                if (!gameState.upgrades) {
                    gameState.upgrades = { efficiency: 0, stability: 0, training: 0 };
                } else {
                    if (gameState.upgrades.efficiency === undefined) gameState.upgrades.efficiency = 0;
                    if (gameState.upgrades.stability === undefined) gameState.upgrades.stability = 0;
                    if (gameState.upgrades.training === undefined) gameState.upgrades.training = 0;
                }
```

#### Arena Damage Formula Calculation
Modify `__createBattleMatch` (around line 1637) to scale player base damage based on the training level:

```javascript
            let playerBaseDamage = Math.max(16, Math.floor(championPower * 0.8) + 12 + playerLevel);
            const trainingLvl = (gameState.upgrades && gameState.upgrades.training) || 0;
            playerBaseDamage = Math.floor(playerBaseDamage * (1 + trainingLvl * 0.05));
```

#### Upgrades Shop Rendering (`renderUpgrades`)
Add the rendering logic for the "Battle Training" upgrade card inside `renderUpgrades` (around line 2814):

```javascript
            // 3. Battle Training
            const trainLvl = (gameState.upgrades && gameState.upgrades.training) || 0;
            const trainLvlEl = document.getElementById('upgrade-training-level');
            const trainValEl = document.getElementById('upgrade-training-value');
            const trainBarEl = document.getElementById('upgrade-training-bar');
            const trainBtn = document.getElementById('upgrade-training-btn');
            const trainSub = document.getElementById('upgrade-training-sub');
            
            if (trainLvlEl) trainLvlEl.innerText = `LVL ${trainLvl} / 15`;
            if (trainValEl) trainValEl.innerText = `+${trainLvl * 5}% DMG`;
            if (trainBarEl) trainBarEl.style.width = `${(trainLvl / 15) * 100}%`;
            
            if (trainLvl >= 15) {
                if (trainBtn) {
                    trainBtn.innerText = 'MAX LEVEL';
                    trainBtn.disabled = true;
                    trainBtn.className = 'px-4 py-2 text-xs rounded-xl bg-gray-800 text-gray-500 font-medium w-full xs:w-auto cursor-not-allowed';
                }
                if (trainSub) trainSub.innerText = 'Combat training complete.';
            } else {
                const nextCost = 300 + trainLvl * 200;
                if (trainBtn) {
                    trainBtn.innerText = `UPGRADE • ${nextCost} EP`;
                    trainBtn.disabled = gameState.ep < nextCost;
                    trainBtn.className = `px-4 py-2 text-xs rounded-xl font-medium w-full xs:w-auto ${gameState.ep >= nextCost ? 'bg-red-500 text-black hover:bg-red-400' : 'bg-red-500/10 text-red-400 opacity-60 cursor-not-allowed'}`;
                }
                if (trainSub) trainSub.innerText = `Next: +5% Player damage in arena`;
            }
```

#### Upgrade Purchase Logic (`buyUpgrade`)
Extend `buyUpgrade` to support the `'training'` type:

```javascript
            } else if (type === 'training') {
                cost = 300 + currentLvl * 200;
                maxLvl = 15;
            }
```

---

## 3. DOM & UI Spec

### [source.html](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/source.html)

#### Upgrades Card Grid Layout
We will update the upgrades page grid wrapper layout to accommodate 3 cards side-by-side on large screens:
- **Change**: Change class list from `grid-cols-1 md:grid-cols-2` to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

#### Battle Training Card HTML Markup
We will add the new upgrade card right after the Genetic Stability card (around line 557):

```html
                    <div class="cyber-card rounded-3xl p-6 border border-gray-700">
                        <div class="flex gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex-shrink-0 flex items-center justify-center">
                                <i class="fas fa-swords text-3xl text-black"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <div>
                                        <div class="font-bold">Battle Training</div>
                                        <div class="text-xs text-red-400" id="upgrade-training-level">LVL 0 / 15</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-red-400 font-mono text-sm" id="upgrade-training-value">+0%</div>
                                    </div>
                                </div>
                                <div class="mt-3 h-1.5 bg-gray-800 rounded">
                                    <div class="h-1.5 bg-red-400 rounded w-[0%]" id="upgrade-training-bar"></div>
                                </div>
                                <div class="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between text-xs mt-3">
                                    <button type="button" id="upgrade-training-btn" onclick="buyUpgrade('training')" class="px-4 py-2 text-xs rounded-xl bg-red-400/10 hover:bg-red-400/20 text-red-400 font-medium w-full xs:w-auto">UPGRADE • 300 EP</button>
                                    <span class="text-gray-500 text-xs self-center text-center xs:text-left" id="upgrade-training-sub">Next: +5% player damage in arena</span>
                                </div>
                            </div>
                        </div>
                    </div>
```

---

## 4. Test Specifications

### [tests/mechanics.test.cjs](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/tests/mechanics.test.cjs)

#### Stub ID Registrations
Register the new DOM stub elements at line 91+ to prevent runtime DOM exceptions during test compilation:
- `"upgrade-training-level"`
- `"upgrade-training-value"`
- `"upgrade-training-bar"`
- `"upgrade-training-btn"`
- `"upgrade-training-sub"`

#### Automated Test Verification Cases
Add these assertions to the test suite:

1. **Verify upgrade purchase mechanics**:
   - Starting at 1000 EP, verify purchasing Battle Training level 1 costs 300 EP and leaves 700 EP.
   - Verify purchasing Battle Training level 2 costs 500 EP and leaves 200 EP.
   - Attempting to buy level 3 with 200 EP (needs 700 EP) should fail.

2. **Verify Arena damage scaling**:
   - Verify `__createBattleMatch` at training level 0 matches base damage math.
   - Set training level to 3 (+15% DMG bonus), run `__createBattleMatch`, and assert that the player base damage is exactly equal to `Math.floor(baseDamage * 1.15)`.

#### Test Addition Snippet
Add this chunk inside the `runTests()` runner:

```javascript
    // -------------------- TEST 7: Battle Damage Scaling & Training Upgrade --------------------
    {
        const { read, gameState, documentStub } = runAppWithGameState({ ep: 1000 });
        const buyUpgrade = read("buyUpgrade");
        const __createBattleMatch = read("__createBattleMatch");

        // 1. Purchase checks
        buyUpgrade("training"); // lvl 0 -> 1: cost 300 EP
        assert.equal(gameState.upgrades.training, 1);
        assert.equal(gameState.ep, 700);

        buyUpgrade("training"); // lvl 1 -> 2: cost 500 EP
        assert.equal(gameState.upgrades.training, 2);
        assert.equal(gameState.ep, 200);

        buyUpgrade("training"); // lvl 2 -> 3: cost 700 EP (fails due to insufficient EP)
        assert.equal(gameState.upgrades.training, 2);
        assert.equal(gameState.ep, 200);

        // 2. Damage scaling check
        gameState.level = 5;
        gameState.upgrades.training = 0;
        const matchBase = __createBattleMatch();
        const dmgBase = matchBase.playerBaseDamage;

        gameState.upgrades.training = 3; // +15% damage bonus
        const matchUpgraded = __createBattleMatch();
        const dmgUpgraded = matchUpgraded.playerBaseDamage;

        assert.equal(dmgUpgraded, Math.floor(dmgBase * 1.15));
    }
```

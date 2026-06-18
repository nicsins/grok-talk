# Implementation Plan: EP-Based Panda Training System
- **Task ID**: task_004
- **Target Files**:
  - [app.js](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/app.js)
  - [tests/mechanics.test.cjs](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/tests/mechanics.test.cjs)

## 1. System Design & State Changes

We will introduce an individual training system allowing players to invest Energy Points (EP) to level up pandas in their collection, permanently increasing their power level.

### Game State Properties
- **Panda Level**: Each panda object in the collection array (`userPandas`) will have a `level` property (integer, starting at `1`, capping at `10`).
- **Startup Migration**: In `loadGameState()`, we will migrate existing saves by setting `level: 1` for any panda that does not already have a level property. We will also run a startup recalculation of `gameState.totalPower`.

### Training Cost Formula (Rarity-Based)
The training cost increases exponentially by `1.5x` per level, based on the panda's rarity:
- **Base Costs (`baseCost`)**:
  - `common`: 100 EP
  - `rare`: 150 EP
  - `epic`: 250 EP
  - `legendary`: 400 EP
  - `mythic`: 600 EP
- **Formula**: `cost = Math.floor(baseCost * Math.pow(1.5, currentLevel - 1))`
- **Max Level**: 10

### Power Gain Mutation (Rarity-Based)
Leveled pandas receive a flat power increase per level, matching their rarity:
- `common`: +3 Power per level
- `rare`: +5 Power per level
- `epic`: +8 Power per level
- `legendary`: +12 Power per level
- `mythic`: +18 Power per level

### Interlocking Mechanics & Synergies
1. **Fusion feed-forward**: Since fusions use the parent pandas' current powers (`basePower = Math.floor((pandaA.power + pandaB.power) / 2)`), training parent pandas directly increases the power of the offspring they produce.
2. **Arena scaling**: In `__createBattleMatch()`, player max health and damage are directly scaled from the champion's power. Leveled pandas chosen as champions will provide substantial benefits in combat.
3. **Total Power Recalculation**: Instead of a static value, we will introduce a function `recalculateTotalPower()` to set `gameState.totalPower = userPandas.reduce((sum, p) => sum + (p.power || 0), 0)`. This ensures that additions, fusions, and level-ups properly scale the player's reported total power.

---

## 2. Code Changes Spec

### [app.js](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/app.js)

#### 1. Default & Starter Panda Setup
Add `level: 1` to the starter panda in `userPandas` initialization (around line 63):
```javascript
        let userPandas = [
            { ...basePandas[0], id: 'u1', level: 1, acquired: new Date().toISOString().split('T')[0] }
        ];
```

#### 2. Saved Game State Migration & Initial Setup
Ensure every panda in `userPandas` has `level: 1` if it is undefined, and run the initial total power recalculation inside `loadGameState()` (around line 120):
```javascript
                // Migrate collection and set level default
                userPandas.forEach(p => {
                    if (p.level === undefined) p.level = 1;
                });
                recalculateTotalPower();
```

#### 3. Power and Cost Helper Functions
Define the following helpers for calculating the cost and power gains of training (place near other gameplay math helpers):
```javascript
        function getTrainingCost(rarity, currentLevel) {
            let baseCost = 100;
            switch (rarity) {
                case 'common': baseCost = 100; break;
                case 'rare': baseCost = 150; break;
                case 'epic': baseCost = 250; break;
                case 'legendary': baseCost = 400; break;
                case 'mythic': baseCost = 600; break;
            }
            return Math.floor(baseCost * Math.pow(1.5, currentLevel - 1));
        }

        function getPowerGainPerLevel(rarity) {
            switch (rarity) {
                case 'common': return 3;
                case 'rare': return 5;
                case 'epic': return 8;
                case 'legendary': return 12;
                case 'mythic': return 18;
                default: return 3;
            }
        }

        function recalculateTotalPower() {
            gameState.totalPower = userPandas.reduce((sum, p) => sum + (p.power || 0), 0);
        }
```

#### 4. Setting default levels for generated pandas
Add `level: 1` to new pandas created in:
- `createFusionResult` (inside the `newPanda` object declaration, around line 1180):
  ```javascript
                  level: 1,
                  acquired: new Date().toISOString().split('T')[0],
  ```
- `daily-challenge` reward claim (around line 1475):
  ```javascript
                  level: 1,
                  desc: "Rewarded for completing today's Inferno Fusion challenge. A loyal guardian of the flame.",
  ```
- Quantum Overlord Panda easter egg (around line 3255):
  ```javascript
                          level: 1,
                          desc: "The ultimate panda. Achieved only by true masters of the fusion arts.",
  ```
- Window debug helper `window.FusionPanda.addPanda` (around line 3334):
  ```javascript
                  const newP = {...basePandas[0], name: name || "Debug Panda", id: 'debug-' + Date.now(), rarity: 'legendary', power: 55, level: 1};
  ```

#### 5. Individual Panda Training Action (`trainPanda`)
Add the training execution function:
```javascript
        function trainPanda(index) {
            const panda = userPandas[index];
            if (!panda) return;
            
            const currentLevel = panda.level || 1;
            if (currentLevel >= 10) {
                showToast("This panda has reached max level!", "error");
                return;
            }
            
            const cost = getTrainingCost(panda.rarity, currentLevel);
            if (gameState.ep < cost) {
                showToast("Insufficient EP to train this panda!", "error");
                return;
            }
            
            // Deduct EP and mutate stats
            gameState.ep -= cost;
            panda.level = currentLevel + 1;
            const powerGain = getPowerGainPerLevel(panda.rarity);
            panda.power += powerGain;
            
            // Update and save state
            recalculateTotalPower();
            saveGameState();
            updateDashboard();
            renderCollection();
            
            // Update details modal elements inline
            const levelEl = document.getElementById('detail-panda-level');
            const costEl = document.getElementById('detail-panda-cost');
            const btnEl = document.getElementById('train-panda-btn');
            const powerValEl = document.getElementById('detail-panda-power-val');
            
            if (levelEl) levelEl.innerText = `LVL ${panda.level} / 10`;
            if (powerValEl) powerValEl.innerText = panda.power;
            
            if (costEl) {
                costEl.innerText = panda.level >= 10 ? 'MAXED' : getTrainingCost(panda.rarity, panda.level) + ' EP';
            }
            
            if (btnEl) {
                if (panda.level >= 10) {
                    btnEl.innerText = 'MAX LEVEL REACHED';
                    btnEl.disabled = true;
                    btnEl.className = 'w-full py-2.5 rounded-xl font-bold text-xs bg-gray-800 text-gray-500 cursor-not-allowed transition-all flex items-center justify-center gap-2';
                } else {
                    const nextCost = getTrainingCost(panda.rarity, panda.level);
                    btnEl.innerHTML = `<i class="fas fa-dumbbell"></i> <span>TRAIN PANDA</span>`;
                    btnEl.disabled = gameState.ep < nextCost;
                    if (gameState.ep >= nextCost) {
                        btnEl.className = 'w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center justify-center gap-2';
                    } else {
                        btnEl.className = 'w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400/10 text-amber-400 opacity-60 cursor-not-allowed transition-all flex items-center justify-center gap-2';
                    }
                }
            }
            
            showToast(`${panda.name} trained to LVL ${panda.level}! (+${powerGain} PWR)`, "success");
        }
```

---

## 3. DOM & UI Spec

### Details Modal Layout (`showPandaDetail`)
Inject a dedicated training card section between the stat grid and description in `showPandaDetail(index)`:
- Replace `panda.power` display in the stats block with a span ID to allow live updates:
  ```html
  <div class="text-5xl font-black text-emerald-400 mt-1" id="detail-panda-power-val">${panda.power}</div>
  ```
- Insert training UI container:
  ```html
  <!-- Training Section -->
  <div class="mt-6 border-t border-b border-gray-800 py-4">
      <div class="flex items-center justify-between">
          <div>
              <div class="text-xs text-gray-400">PANDA LEVEL</div>
              <div class="text-lg font-bold text-white" id="detail-panda-level">LVL ${panda.level || 1} / 10</div>
          </div>
          <div class="text-right">
              <div class="text-xs text-gray-400">TRAINING COST</div>
              <div class="text-lg font-mono font-bold text-amber-400" id="detail-panda-cost">
                  ${(panda.level || 1) >= 10 ? 'MAXED' : getTrainingCost(panda.rarity, panda.level || 1) + ' EP'}
              </div>
          </div>
      </div>
      <div class="mt-3">
          <button id="train-panda-btn" onclick="trainPanda(${index})" 
                  class="w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 
                  ${(panda.level || 1) >= 10 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 
                    (gameState.ep >= getTrainingCost(panda.rarity, panda.level || 1) ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-amber-400/10 text-amber-400 opacity-60 cursor-not-allowed')}"
                  ${(panda.level || 1) >= 10 || gameState.ep < getTrainingCost(panda.rarity, panda.level || 1) ? 'disabled' : ''}>
              <i class="fas fa-dumbbell"></i>
              <span>${(panda.level || 1) >= 10 ? 'MAX LEVEL REACHED' : 'TRAIN PANDA'}</span>
          </button>
      </div>
  </div>
  ```

### Collection Grid Cards (`renderCollection`)
Add the level indicator on each panda collection card (around line 324):
```javascript
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="text-6xl mb-3 transition-all group-hover:scale-110">${panda.emoji}</div>
                        <div class="flex flex-col items-end gap-y-1">
                            <div class="px-2.5 py-0.5 text-xs font-bold rounded-full" style="background: ${rarityColor}30; color: ${rarityColor}">
                                ${panda.rarity.toUpperCase()}
                            </div>
                            <div class="text-[10px] text-gray-400 font-bold">LVL ${panda.level || 1}</div>
                        </div>
                    </div>
```

### Fusion Slot Selector (`openPandaSelector`)
Show the level tag next to the rarity tag inside the selector grid (around line 814):
```javascript
                card.innerHTML = `
                    <div class="flex justify-between">
                        <div class="text-5xl mb-2">${panda.emoji}</div>
                        <div class="flex flex-col items-end gap-y-1">
                            <div class="px-2 py-0.5 text-xs font-bold rounded-full text-center" style="background: ${rarityColor}30; color: ${rarityColor}">
                                ${panda.rarity}
                            </div>
                            <div class="text-[10px] text-gray-400 font-bold">LVL ${panda.level || 1}</div>
                        </div>
                    </div>
```

---

## 4. Test Specifications

### [tests/mechanics.test.cjs](file:///C:/Users/Keith/Downloads/grok-talk-main/grok-talk-main/tests/mechanics.test.cjs)

#### Register DOM Stub Elements
Add the following IDs to `stubIds` inside `makeDomStub()` to prevent runtime selector exceptions during test execution:
- `"detail-panda-power-val"`
- `"detail-panda-level"`
- `"detail-panda-cost"`
- `"train-panda-btn"`

#### Test Addition Snippet
Add a new test suite block inside `runTests()` to verify the training mechanics:
```javascript
    // -------------------- TEST 8: EP-Based Panda Training System --------------------
    {
        const { read, gameState, userPandas } = runAppWithGameState({ ep: 1000 });
        const getTrainingCost = read("getTrainingCost");
        const getPowerGainPerLevel = read("getPowerGainPerLevel");
        const trainPanda = read("trainPanda");
        const recalculateTotalPower = read("recalculateTotalPower");

        // 1. Cost and Gain formula checks
        assert.equal(getTrainingCost("common", 1), 100);
        assert.equal(getTrainingCost("common", 2), 150);
        assert.equal(getTrainingCost("mythic", 1), 600);
        assert.equal(getPowerGainPerLevel("common"), 3);
        assert.equal(getPowerGainPerLevel("mythic"), 18);

        // 2. Setup user pandas for testing training
        const commonPanda = { id: 'u1', name: "Common Test", rarity: "common", power: 10, level: 1 };
        const mythicPanda = { id: 'u2', name: "Mythic Test", rarity: "mythic", power: 50, level: 1 };
        userPandas.length = 0;
        userPandas.push(commonPanda);
        userPandas.push(mythicPanda);

        // Recalculate totalPower initially
        recalculateTotalPower();
        assert.equal(gameState.totalPower, 60);

        // 3. Train common panda: level 1 -> 2 (costs 100 EP, power +3)
        trainPanda(0);
        assert.equal(commonPanda.level, 2);
        assert.equal(commonPanda.power, 13);
        assert.equal(gameState.ep, 900);
        assert.equal(gameState.totalPower, 63);

        // 4. Train mythic panda: level 1 -> 2 (costs 600 EP, power +18)
        trainPanda(1);
        assert.equal(mythicPanda.level, 2);
        assert.equal(mythicPanda.power, 68);
        assert.equal(gameState.ep, 300);
        assert.equal(gameState.totalPower, 81);

        // 5. Attempt training mythic panda again: level 2 -> 3 (costs 900 EP, fails due to lack of EP)
        trainPanda(1);
        assert.equal(mythicPanda.level, 2);
        assert.equal(mythicPanda.power, 68);
        assert.equal(gameState.ep, 300); // EP remains unchanged

        // 6. Max level cap check (level 10)
        commonPanda.level = 9;
        gameState.ep = 10000;
        
        trainPanda(0); // lvl 9 -> 10 (costs 100 * Math.pow(1.5, 8) = 2562 EP)
        assert.equal(commonPanda.level, 10);
        const epAfter10 = gameState.ep;

        trainPanda(0); // lvl 10 -> 11 (should fail, level stays 10, EP stays same)
        assert.equal(commonPanda.level, 10);
        assert.equal(gameState.ep, epAfter10);
    }
```

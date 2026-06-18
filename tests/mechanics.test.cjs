const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert");

const root = path.join(__dirname, "..");
const rawApp = fs.readFileSync(path.join(root, "app.js"), "utf8");
const appSrc = rawApp.replace(/\n\s*scheduleInit\(\);\s*$/, "\n");

function makeDomStub() {
    const el = (tag) => ({
        tag,
        className: "",
        classList: { 
            add() {}, 
            remove() {}, 
            contains() { return false; } 
        },
        style: {
            position: "",
            borderColor: "",
            boxShadow: "",
            setProperty(prop, val) {
                this[prop] = val;
            },
        },
        innerHTML: "",
        innerText: "",
        textContent: "",
        disabled: false,
        children: [],
        appendChild(c) {
            this.children.push(c);
            return c;
        },
        remove() {},
        setAttribute() {},
        removeAttribute() {},
        getAttribute() {
            return null;
        },
        closest() {
            return null;
        },
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        onclick: null,
        value: "",
    });

    const byId = new Map();
    const stubIds = [
        "detail-panda-card",
        "detail-panda-image-container",
        "fusion-flow-svg",
        "section-dashboard",
        "nav-dashboard",
        "collection-grid",
        "base-pandas-grid",
        "recent-fusions-list",
        "fuse-btn",
        "nav-level",
        "nav-level-compact",
        "dash-level",
        "dash-fusions",
        "dash-collection",
        "dash-power",
        "dash-xp-bar",
        "dash-xp",
        "collection-count",
        "daily-challenge-claim-btn",
        "daily-challenge-claim-label",
        "daily-challenge-reward-hint",
        "daily-challenge-fire-count",
        "daily-challenge-fire-bar",
        "toast-container",
        "mode-basic",
        "mode-advanced",
        "mode-ritual",
        "energy-cost",
        "slot-alpha",
        "slot-beta",
        "fusion-result-modal",
        "fusion-result-emoji",
        "fusion-result-name",
        "fusion-result-type",
        "fusion-result-power",
        "fusion-result-rarity",
        "fusion-result-rarity-text",
        "fusion-result-bonus",
        "evolve-btn",
        "codex-progress-text",
        "codex-progress-bar",
        "recent-codex",
        "codex-count",
        "codex-grid",
        "search-input",
        "filter-rarity",
        "codex-search",
        "codex-filter",
        "panda-selector-modal",
        "selector-grid",
        "upgrades-ep-balance",
        "upgrade-efficiency-level",
        "upgrade-stability-level",
        "upgrade-efficiency-value",
        "upgrade-stability-value",
        "upgrade-efficiency-bar",
        "upgrade-stability-bar",
        "upgrade-efficiency-btn",
        "upgrade-stability-btn",
        "upgrade-efficiency-sub",
        "upgrade-stability-sub",
        "upgrade-training-level",
        "upgrade-training-value",
        "upgrade-training-bar",
        "upgrade-training-btn",
        "upgrade-training-sub",
        "booster-blazing-btn",
        "booster-cryo-btn",
        "booster-lightning-btn",
        "dash-ep",
        "detail-panda-power-val",
        "detail-panda-level",
        "detail-panda-cost",
        "train-panda-btn",
        "section-arena",
        "battle-log",
        "battle-fighter-player",
        "battle-fighter-enemy",
        "battle-flash-player",
        "battle-flash-enemy",
        "battle-beam",
        "battle-attack-btn",
        "battle-special-btn",
        "battle-hp-player-bar",
        "battle-hp-player-text",
        "battle-hp-enemy-bar",
        "battle-hp-enemy-text",
        "battle-round",
        "battle-stage"
    ];
    for (const id of stubIds) {
        byId.set(id, el("div"));
    }

    return {
        documentElement: { style: { setProperty() {} } },
        body: {
            insertAdjacentHTML() {},
            appendChild() {},
            classList: { add() {}, remove() {} },
        },
        hidden: false,
        readyState: "complete",
        getElementById(id) {
            return byId.get(id) || null;
        },
        querySelectorAll() {
            return [];
        },
        querySelector() {
            return null;
        },
        addEventListener() {},
        createElement(t) {
            return el(t);
        },
    };
}

function runAppWithGameState(initial = {}) {
    const documentStub = makeDomStub();
    const sandbox = {
        console,
        localStorage: {
            _m: new Map(),
            getItem(k) {
                return this._m.has(k) ? this._m.get(k) : null;
            },
            setItem(k, v) {
                this._m.set(k, String(v));
            },
            removeItem(k) {
                this._m.delete(k);
            },
        },
        document: documentStub,
        window: {},
        tailwind: { config: {} },
        setTimeout,
        clearTimeout,
        Math,
        Date,
        JSON,
        navigator: { userAgent: "test" },
        performance: { now: () => 0 },
        requestAnimationFrame: (cb) => queueMicrotask(cb),
        showToast() {}
    };

    let timeoutSerial = 0;
    sandbox.setTimeout = (fn) => {
        queueMicrotask(() => {
            try {
                fn();
            } catch (_) {
                /* ignore UI updates on stubs */
            }
        });
        return ++timeoutSerial;
    };
    sandbox.clearTimeout = () => {};
    sandbox.window = sandbox;

    const ctx = vm.createContext(sandbox);
    vm.runInContext(appSrc + "\n;0", ctx, { filename: "app.js" });

    const read = (name) => vm.runInContext(name, ctx);
    const write = (name, val) => {
        vm.runInContext(`${name} = ${JSON.stringify(val)};`, ctx);
    };

    const gameState = read("gameState");
    Object.assign(gameState, initial);

    return {
        read,
        write,
        sandbox,
        ctx,
        get gameState() {
            return read("gameState");
        },
        get userPandas() {
            return read("userPandas");
        },
        documentStub
    };
}

async function runTests() {
    // -------------------- TEST 1: Fusion Synergy & Modes --------------------
    {
        const { read } = runAppWithGameState();
        const createFusionResult = read("createFusionResult");

        const firePanda = { name: "Inferno Panda", emoji: "🔥🐼", type: "Fire", power: 18, rarity: "rare" };
        const icePanda = { name: "Frostbite Panda", emoji: "❄️🐼", type: "Ice", power: 15, rarity: "rare" };
        
        // Steam synergy
        const resultSteam = createFusionResult(firePanda, icePanda, "basic");
        assert.equal(resultSteam.type, "Steam");
        assert.ok(resultSteam.power > 15);

        // Eclipse synergy
        const darkPanda = { name: "Shadow Panda", emoji: "🌑🐼", type: "Dark", power: 22, rarity: "epic" };
        const lightPanda = { name: "Golden Fortune", emoji: "✨🐼", type: "Light", power: 27, rarity: "legendary" };
        const resultEclipse = createFusionResult(darkPanda, lightPanda, "basic");
        assert.equal(resultEclipse.type, "Eclipse");

        // Plasma synergy
        const electricPanda = { name: "Thunder Panda", emoji: "⚡🐼", type: "Electric", power: 19, rarity: "rare" };
        const crystalPanda = { name: "Crystal Panda", emoji: "💎🐼", type: "Crystal", power: 16, rarity: "rare" };
        const resultPlasma = createFusionResult(electricPanda, crystalPanda, "basic");
        assert.equal(resultPlasma.type, "Plasma");

        // Ritual power scaling comparison
        const resultBasic = createFusionResult(firePanda, icePanda, "basic");
        const resultRitual = createFusionResult(firePanda, icePanda, "ritual");
        assert.ok(resultRitual.power > resultBasic.power, "Ritual mode fusions should yield higher average power");
    }

    // -------------------- TEST 2: Evolution Mechanics --------------------
    {
        const { read, sandbox } = runAppWithGameState();
        const evolveFusionResult = read("evolveFusionResult");
        
        const initialPanda = {
            name: "Steam Panda",
            emoji: "🌫️🔥",
            type: "Steam",
            power: 50,
            rarity: "epic",
            desc: "Original description"
        };
        sandbox.window.currentFusionResult = initialPanda;
        
        evolveFusionResult();
        
        const evolved = sandbox.window.currentFusionResult;
        // power avg math: Math.floor(50 * 1.28) + 12 = 64 + 12 = 76
        assert.equal(evolved.power, 76);
        assert.equal(evolved.rarity, "legendary");
        assert.ok(evolved.name.startsWith("Evolved "));
        assert.ok(evolved.emoji.endsWith("✨"));
    }

    // -------------------- TEST 3: Level Up & XP math --------------------
    {
        const { read, gameState, write } = runAppWithGameState({ xp: 9950, level: 5 });
        const performFusion = read("performFusion");
        const selectPandaForSlot = read("selectPandaForSlot");

        const pandaA = { id: 'u1', name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common", color: "#64748b" };
        const pandaB = { id: 'u2', name: "Classic Panda 2", emoji: "🐼", type: "Balanced", power: 12, rarity: "common", color: "#64748b" };
        
        selectPandaForSlot("alpha", pandaA);
        selectPandaForSlot("beta", pandaB);

        performFusion();
        
        // Wait for performFusion's microtask to resolve
        await new Promise(resolve => queueMicrotask(resolve));

        // Since performFusion adds random XP between 85 and 205 (or more under modes),
        // starting at 9900 XP guarantees crossing the 10000 XP mark.
        // Therefore, level should increment to 6, and XP should roll over.
        assert.equal(gameState.level, 6);
        assert.ok(gameState.xp < 10000);
    }

    // -------------------- TEST 4: Energy Cost Scaling --------------------
    {
        const { read, documentStub, write } = runAppWithGameState();
        const updateEnergyCost = read("updateEnergyCost");
        const selectPandaForSlot = read("selectPandaForSlot");

        const pandaA = { id: 'u1', name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 10, rarity: "common", color: "#64748b" };
        const pandaB = { id: 'u2', name: "Classic Panda 2", emoji: "🐼", type: "Balanced", power: 20, rarity: "common", color: "#64748b" };

        selectPandaForSlot("alpha", pandaA);
        selectPandaForSlot("beta", pandaB);

        // Power avg: (10 + 20) / 2 = 15.
        // Basic: base = 250. Final = Math.floor(250 + 15 * 1.8) = 250 + 27 = 277.
        write("currentFusionMode", "basic");
        updateEnergyCost();
        const costBasic = documentStub.getElementById("energy-cost").innerText;
        assert.equal(costBasic, "277 EP");

        // Advanced: base = 250 * 1.6 = 400. Final = Math.floor(400 + 15 * 1.8) = 400 + 27 = 427.
        write("currentFusionMode", "advanced");
        updateEnergyCost();
        const costAdvanced = documentStub.getElementById("energy-cost").innerText;
        assert.equal(costAdvanced, "427 EP");

        // Ritual: base = 250 * 2.8 = 700. Final = Math.floor(700 + 15 * 1.8) = 700 + 27 = 727.
        write("currentFusionMode", "ritual");
        updateEnergyCost();
        const costRitual = documentStub.getElementById("energy-cost").innerText;
        assert.equal(costRitual, "727 EP");
    }

    // -------------------- TEST 5: Schema Migration & Restoration --------------------
    {
        const { read, sandbox, gameState } = runAppWithGameState();
        const loadGameState = read("loadGameState");
        
        const oldState = {
            level: 3,
            fusions: 10,
            lifetimeEarnedXp: -1,
            collection: [
                { id: 'u1', name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common" }
            ]
        };
        sandbox.localStorage.setItem("fusionPandaMaster", JSON.stringify(oldState));
        
        loadGameState();
        
        const loadedState = read("gameState");
        // schema version should migrate to 2
        assert.equal(loadedState.saveSchemaVersion, 2);
        // fireChallengeFusions should be populated
        assert.ok(typeof loadedState.fireChallengeFusions === "number");
        // lifetimeEarnedXp should be estimated since it was missing
        // estimate: Math.floor(fusions * 95 + level * 400) = 10 * 95 + 3 * 400 = 950 + 1200 = 2150
        assert.equal(loadedState.lifetimeEarnedXp, 2150);
    }

    // -------------------- TEST 6: Upgrades Shop & Earning Mechanics --------------------
    {
        const { read, gameState, documentStub } = runAppWithGameState({ ep: 1000 });
        const buyUpgrade = read("buyUpgrade");
        const buyBooster = read("buyBooster");
        const renderUpgrades = read("renderUpgrades");

        // Buy Fusion Efficiency upgrade (level 0 -> level 1)
        // Cost: 250 + 0 * 150 = 250 EP. Remaining: 1000 - 250 = 750 EP.
        buyUpgrade("efficiency");
        assert.equal(gameState.upgrades.efficiency, 1);
        assert.equal(gameState.ep, 750);

        // Buy Genetic Stability upgrade (level 0 -> level 1)
        // Cost: 400 + 0 * 250 = 400 EP. Remaining: 750 - 400 = 350 EP.
        buyUpgrade("stability");
        assert.equal(gameState.upgrades.stability, 1);
        assert.equal(gameState.ep, 350);

        // Buy Blazing Catalyst booster
        // Cost: 450 EP. Insufficient EP (350 < 450). Should fail.
        buyBooster("blazing");
        assert.equal(gameState.boosters.blazing, false);
        assert.equal(gameState.ep, 350);

        // Add EP and buy Blazing Catalyst
        gameState.ep = 500;
        buyBooster("blazing");
        assert.equal(gameState.boosters.blazing, true);
        assert.equal(gameState.ep, 50);

        // Test rendering UI elements
        renderUpgrades();
        const balanceText = documentStub.getElementById("upgrades-ep-balance").innerText;
        assert.equal(balanceText, "50");
        const effLvlText = documentStub.getElementById("upgrade-efficiency-level").innerText;
        assert.equal(effLvlText, "LVL 1 / 25");
        const stabLvlText = documentStub.getElementById("upgrade-stability-level").innerText;
        assert.equal(stabLvlText, "LVL 1 / 15");
    }

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

    // -------------------- TEST 9: Red Panda Fusion Recipe --------------------
    {
        const { read } = runAppWithGameState();
        const createFusionResult = read("createFusionResult");

        const classicPanda = { name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common" };
        const infernoPanda = { name: "Inferno Panda", emoji: "🔥🐼", type: "Fire", power: 18, rarity: "rare" };

        const result = createFusionResult(classicPanda, infernoPanda, "basic");
        assert.equal(result.name, "Red Panda");
        assert.equal(result.rarity, "epic");
        assert.equal(result.type, "Balanced");
    }

    // -------------------- TEST 10: Base Pandas Image Property --------------------
    {
        const { read } = runAppWithGameState();
        const basePandas = read("basePandas");
        
        assert.ok(Array.isArray(basePandas), "basePandas should be an array");
        assert.equal(basePandas.length, 9, "There should be exactly 9 base pandas");
        
        basePandas.forEach(p => {
            assert.ok(p.image, `Base panda ${p.name} is missing the image property`);
            assert.ok(typeof p.image === "string", `Base panda ${p.name} image should be a string`);
            assert.ok(p.image.startsWith("assets/pandas/"), `Base panda ${p.name} image path should start with assets/pandas/`);
            assert.ok(p.image.endsWith(".jpg"), `Base panda ${p.name} image should be a .jpg file`);
        });
    }

    // -------------------- TEST 11: Static Card Art Generator & Migration --------------------
    {
        const { read, sandbox, gameState } = runAppWithGameState();
        const generateProceduralPandaImage = read("generateProceduralPandaImage");
        const createFusionResult = read("createFusionResult");
        const loadGameState = read("loadGameState");

        // 1. Assert generateProceduralPandaImage returns correct static path
        let imgResult = null;
        assert.doesNotThrow(() => {
            imgResult = generateProceduralPandaImage("🌋", "Steam", "#22d3ee", "epic");
        }, "generateProceduralPandaImage threw an error");
        assert.equal(imgResult, "assets/pandas/fusion_steam.jpg", "generateProceduralPandaImage should return mapped static path");

        const firePanda = { name: "Inferno Panda", emoji: "🔥🐼", type: "Fire", power: 18, rarity: "rare" };
        const icePanda = { name: "Frostbite Panda", emoji: "❄️🐼", type: "Ice", power: 15, rarity: "rare" };
        const result = createFusionResult(firePanda, icePanda, "basic");
        assert.equal(result.image, "assets/pandas/fusion_steam.jpg", "Fusion result should have the correct steam static image path");
        
        // 3. Test migration: mock a fusion in local storage with missing/null image, and verify loadGameState resolves image paths
        const oldState = {
            level: 3,
            fusions: 10,
            collection: [
                { id: 'f12345', name: "Steam Classic", emoji: "🌋", type: "Steam", power: 50, rarity: "epic", image: null },
                { id: 'f67890', name: "Red Fire Hybrid", emoji: "🔴🐼", type: "Balanced", power: 45, rarity: "epic", image: "null" },
                { id: 'u1', name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common", image: null }
            ]
        };
        sandbox.localStorage.setItem("fusionPandaMaster", JSON.stringify(oldState));
        
        loadGameState();
        
        const userPandas = read("userPandas");
        const migratedFusionNull = userPandas.find(p => p.id === 'f12345');
        const migratedFusionStrNull = userPandas.find(p => p.id === 'f67890');
        const restoredBase = userPandas.find(p => p.id === 'u1');

        assert.equal(migratedFusionNull.image, "assets/pandas/fusion_steam.jpg", "Missing fusion image (null) should be migrated");
        assert.equal(migratedFusionStrNull.image, "assets/pandas/fusion_bamboo.jpg", "Missing fusion image ('null' string) should be migrated");
        assert.equal(restoredBase.image, "assets/pandas/classic_panda.jpg", "Base panda image should be restored to static path");
    }

    // -------------------- TEST 12: Codex and Fusion Lab Visual Integrations --------------------
    {
        const { read, sandbox } = runAppWithGameState();
        const renderCodex = read("renderCodex");
        const selectPandaForSlot = read("selectPandaForSlot");
        const evolveFusionResult = read("evolveFusionResult");

        // 1. Test Codex rendering
        renderCodex();
        
        const container = sandbox.document.getElementById('codex-grid');
        assert.ok(container, "Codex container should exist");
        assert.ok(container.children.length > 0, "Codex cards should be rendered");
        
        // 2. Test Selection Slot UI updates with images
        const testPanda = { id: 'slot-p1', name: "Neon Spark", emoji: "⚡", type: "Electric", power: 30, rarity: "rare", color: "#eab308", image: "assets/pandas/thunder_panda.jpg" };
        selectPandaForSlot('alpha', testPanda);
        const slotEl = sandbox.document.getElementById('slot-alpha');
        assert.ok(slotEl.innerHTML.includes('<img src="assets/pandas/thunder_panda.jpg"'), "Slot should contain the selected panda's image");

        // 3. Test Evolve Result updates and image regeneration
        const originalFusion = {
            id: 'ev-1',
            name: "Steam Hybrid",
            emoji: "🌋",
            type: "Steam",
            power: 40,
            rarity: "rare",
            image: "assets/pandas/fusion_steam.jpg"
        };
        sandbox.window.currentFusionResult = originalFusion;
        
        evolveFusionResult();
        
        const evolvedPanda = sandbox.window.currentFusionResult;
        assert.equal(evolvedPanda.name, "Evolved Steam Hybrid");
        assert.equal(evolvedPanda.rarity, "epic");
        assert.equal(evolvedPanda.image, "assets/pandas/fusion_steam_evolved.jpg", "Evolved fusion should have evolved static image path");
    }

    // -------------------- TEST 13: Gameplay Points, Today's Challenge, and Arena Defeat Probability --------------------
    {
        const { read, write, gameState, userPandas } = runAppWithGameState({
            level: 1,
            xp: 9900,
            ep: 100,
            lifetimeEarnedXp: 500,
            fireChallengeFusions: 3
        });

        // 1. Claim Daily Challenge rewards
        const claimDailyChallenge = read("claimDailyChallenge");
        claimDailyChallenge();

        assert.equal(gameState.ep, 600, "Daily challenge should award +500 EP");
        // XP went from 9900 + 280 = 10180. Level up triggers: level becomes 2, XP becomes 180.
        assert.equal(gameState.level, 2, "Daily challenge XP reward should trigger account level up");
        assert.equal(gameState.xp, 180, "XP remainder after level up should be 180");
        assert.equal(gameState.lifetimeEarnedXp, 780, "Lifetime XP should be correctly incremented by 280");

        // Verify the rewarded Blaze Guardian panda exists and has its image property set
        const rewarded = userPandas.find(p => p.name === "Blaze Guardian");
        assert.ok(rewarded, "Blaze Guardian panda should be rewarded and added to collection");
        assert.equal(rewarded.type, "Fire");
        assert.ok(rewarded.image, "Rewarded panda should have a procedural image path defined");
        assert.ok(rewarded.image.includes("fusion_inferno.jpg"), "Procedural image path should map to inferno static asset");

        // 2. Arena Battle Opponent Scaling Test
        const __createBattleMatch = read("__createBattleMatch");

        // Test with a low-level champion
        const lowLvlChamp = { name: "Starter Classic", power: 12, level: 1 };
        const lowMatch = __createBattleMatch(lowLvlChamp, "void-howler");

        // Test with a high-level champion
        const highLvlChamp = { name: "Omega Plasma", power: 180, level: 10 };
        const highMatch = __createBattleMatch(highLvlChamp, "void-howler");

        // Asserts on difficulty scaling
        assert.ok(highMatch.enemyMax > lowMatch.enemyMax, "Opponent Max HP should scale higher for a stronger champion");
        assert.ok(highMatch.enemyBaseDamage > lowMatch.enemyBaseDamage, "Opponent base damage should scale higher for a stronger champion");
        assert.ok(highMatch.enemyLevel > lowMatch.enemyLevel, "Opponent level should scale based on champion level");

        // 3. Battle Defeat Scenario Test
        // Mock a battle where the player has low HP and the enemy deals high damage
        const weakChamp = { name: "Weak Champion", power: 10, level: 1 };
        const battle = __createBattleMatch(weakChamp, "nexus-bear"); // nexus-bear is HARD difficulty
        battle.playerCur = 5; // extremely low HP
        battle.playerBaseDamage = 0; // ensure player doesn't defeat the enemy
        battle.enemyCur = 100; // enemy has plenty of health
        battle.enemyBaseDamage = 30; // very high opponent damage
        
        write("__activeBattle", battle);
        
        const simulateBattleAttack = read("simulateBattleAttack");
        
        // Mock failure cinematics to prevent errors
        write("showInArenaFailureCinematic", () => {});
        write("showFailureCinematic", () => {});

        // Run attack simulation (will trigger player's turn, then enemy's turn resulting in player defeat)
        await simulateBattleAttack(null, false);

        const finalBattle = read("__activeBattle");
        assert.equal(finalBattle.playerCur, 0, "Player HP should be reduced to 0 upon defeat");
        assert.ok(finalBattle.ended, "Battle state should mark the combat as ended");
    }

    // -------------------- TEST 14: Fractal Moves Menu & Champion Themed Attacks --------------------
    {
        const { read, write, sandbox } = runAppWithGameState();
        const getChampionMoves = read("getChampionMoves");
        
        // 1. Assert moves generation for different types
        const fireMoves = getChampionMoves({ name: "Inferno Guardian", type: "Fire" });
        assert.ok(fireMoves.attacks.length === 3);
        assert.ok(fireMoves.specials.length === 3);
        assert.ok(fireMoves.attacks[0].startsWith("Inferno"), "Attack move name should prefix with champion first name");
        
        const iceMoves = getChampionMoves({ name: "Frostbite Golem", type: "Ice" });
        assert.ok(iceMoves.attacks[0].startsWith("Frostbite"));

        // 2. Battle Simulation with custom move
        const __createBattleMatch = read("__createBattleMatch");
        const weakChamp = { name: "Thunder Spark", power: 10, level: 1, type: "Electric", rarity: "rare" };
        const battle = __createBattleMatch(weakChamp, "void-howler");
        battle.playerCur = 100;
        battle.enemyCur = 100;
        battle.playerBaseDamage = 10;
        
        write("__activeBattle", battle);
        
        const simulateBattleAttack = read("simulateBattleAttack");
        
        // Run a custom attack
        const customMove = "Thunder Volt Strike";
        await simulateBattleAttack(null, false, customMove);
        
        const finalBattle = read("__activeBattle");
        assert.ok(finalBattle.enemyCur < 100, "Enemy HP should be reduced after custom attack");
        
        // Inspect battle log children in DOM stub
        const logContainer = sandbox.document.getElementById("battle-log");
        const loggedLine = logContainer.children.find(child => child.innerHTML.includes("Thunder Volt Strike"));
        assert.ok(loggedLine, "Combat log should contain the custom attack move name");
    }

    // -------------------- TEST 15: Holographic UI & Fusion Flows --------------------
    {
        const { read, write, sandbox, gameState } = runAppWithGameState();
        
        // 1. Setup Document / Element mocks
        sandbox.document.createElementNS = (ns, tag) => {
            return sandbox.document.createElement(tag);
        };
        
        const mockCore = sandbox.document.createElement('div');
        mockCore.parentElement = sandbox.document.createElement('div');
        sandbox.document.querySelector = (selector) => {
            if (selector.includes('animate-spin-slow')) {
                return mockCore;
            }
            return null;
        };
        
        const svg = sandbox.document.getElementById('fusion-flow-svg');
        const slotAlpha = sandbox.document.getElementById('slot-alpha');
        const slotBeta = sandbox.document.getElementById('slot-beta');
        
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 });
        slotAlpha.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
        slotBeta.getBoundingClientRect = () => ({ left: 500, top: 100, width: 200, height: 200 });
        mockCore.parentElement.getBoundingClientRect = () => ({ left: 380, top: 180, width: 40, height: 40 });
        
        // 2. Perform selection and assert SVG flow paths
        const selectPandaForSlot = read("selectPandaForSlot");
        const pandaA = { name: "Classic Panda", type: "Balanced", color: "#10b981", power: 12, rarity: "common", image: "assets/pandas/classic_panda.jpg" };
        const pandaB = { name: "Inferno Panda", type: "Fire", color: "#ef4444", power: 18, rarity: "rare", image: "assets/pandas/inferno_panda.jpg" };
        
        selectPandaForSlot('alpha', pandaA);
        selectPandaForSlot('beta', pandaB);
        
        assert.equal(svg.children.length, 4, "SVG overlay should contain exactly 4 connector paths (2 per slot)");
        
        // 3. Test training floating animation triggers
        const trainPanda = read("trainPanda");
        const userPandas = read("userPandas");
        
        gameState.ep = 1000;
        userPandas[0] = { name: "Classic Panda", rarity: "common", level: 1, power: 12, color: "#10b981", image: "assets/pandas/classic_panda.jpg" };
        
        const powerVal = sandbox.document.getElementById('detail-panda-power-val');
        powerVal.parentElement = sandbox.document.createElement('div');
        powerVal.innerText = "12";
        const detailCard = sandbox.document.getElementById('detail-panda-card');
        const imgContainer = sandbox.document.getElementById('detail-panda-image-container');
        
        trainPanda(0);
        
        const floatPwr = powerVal.parentElement.children.find(c => c.className.includes('float-up-stat'));
        assert.ok(floatPwr, "Floating power stat element should be appended to power container");
        assert.ok(floatPwr.innerText.includes("+3 PWR"), "Floating power stat should match common panda training gain (+3 PWR)");
        
        const floatLvl = imgContainer.children.find(c => c.className.includes('float-up-stat'));
        assert.ok(floatLvl, "Floating level up element should be appended to image container");
        assert.equal(floatLvl.innerText, "LVL UP!", "Floating level element text should be 'LVL UP!'");
    }

    // -------------------- TEST 16: Visual Emoji Elimination --------------------
    {
        const sourceHtmlPath = path.join(root, "source.html");
        const appJsPath = path.join(root, "app.js");
        
        const sourceHtml = fs.readFileSync(sourceHtmlPath, "utf8");
        const appJs = fs.readFileSync(appJsPath, "utf8");
        
        assert.ok(!sourceHtml.includes('<div class="text-6xl mb-3">🌋</div>'), "🌋 emoji should be eliminated from Today's Challenge in source.html");
        assert.ok(!appJs.includes('<span class="text-6xl">🏆</span>'), "🏆 emoji should be eliminated from level up modal in app.js");
        assert.ok(!appJs.includes('<span class="text-xs">🐼</span>'), "🐼 emoji badge should be eliminated from battle arena landing in app.js");
        assert.ok(!appJs.includes('<span class="text-xs">🔥</span>'), "🔥 emoji badge should be eliminated from battle arena landing in app.js");
    }

    // -------------------- TEST 17: Special Move Action Popups --------------------
    {
        const { read, write, sandbox } = runAppWithGameState();
        const __createBattleMatch = read("__createBattleMatch");
        const simulateBattleAttack = read("simulateBattleAttack");
        
        const weakChamp = { name: "Thunder Spark", power: 10, level: 1, type: "Electric", rarity: "rare", image: "assets/pandas/thunder_panda.jpg" };
        const battle = __createBattleMatch(weakChamp, "void-howler");
        battle.playerCur = 100;
        battle.enemyCur = 100;
        battle.playerBaseDamage = 10;
        
        write("__activeBattle", battle);
        
        const originalSetTimeout = sandbox.setTimeout;
        sandbox.setTimeout = (fn, delay) => {
            fn();
            return 1;
        };
        
        const stage = sandbox.document.getElementById('battle-stage');
        assert.ok(stage, "battle-stage should exist in mock DOM");
        stage.children = [];
        
        simulateBattleAttack(null, true, "Thunder Volt Strike");
        
        sandbox.setTimeout = originalSetTimeout;
        
        const popups = stage.children.filter(c => c.tag === 'div' && c.className.includes('special-clip-popup'));
        assert.ok(popups.length >= 1 && popups.length <= 5, "Special action popups length should be in range 1-5");
        
        const firstPopup = popups[0];
        assert.ok(firstPopup.style.clipPath.includes("polygon"), "Popup should have a clip-path polygon defined");
        assert.equal(firstPopup.style['--champion-color'], "#22d3ee", "Popup border color should match the rare champion color (#22d3ee)");
    }

    // -------------------- TEST 18: Comic Action Replay Popups --------------------
    {
        const { read, write, sandbox } = runAppWithGameState();
        const __createBattleMatch = read("__createBattleMatch");
        const simulateBattleAttack = read("simulateBattleAttack");
        
        const weakChamp = { name: "Inferno Spark", power: 10, level: 1, type: "Fire", rarity: "rare", image: "assets/pandas/inferno_panda.jpg" };
        const battle = __createBattleMatch(weakChamp, "void-howler");
        battle.playerCur = 100;
        battle.enemyCur = 100;
        battle.playerBaseDamage = 10;
        
        write("__activeBattle", battle);
        
        const originalSetTimeout = sandbox.setTimeout;
        sandbox.setTimeout = (fn, delay) => {
            fn();
            return 1;
        };
        
        const stage = sandbox.document.getElementById('battle-stage');
        stage.children = [];
        
        simulateBattleAttack(null, true, "Supernova Burst");
        
        sandbox.setTimeout = originalSetTimeout;
        
        const popups = stage.children.filter(c => c.tag === 'div' && c.className.includes('special-clip-popup'));
        assert.ok(popups.length >= 1 && popups.length <= 5, "Special action popups length should be in range 1-5");
        
        const impactPanel = popups.find(p => p.innerHTML.includes("IMPACT"));
        assert.ok(impactPanel, "Should find an IMPACT panel in the popup list");
        assert.ok(impactPanel.innerHTML.includes("spiked-burst-clip"), "IMPACT panel should contain spiked burst graphic element");
        assert.ok(impactPanel.innerHTML.includes("BOOM!") || impactPanel.innerHTML.includes("IGNITE!"), "IMPACT panel onomatopoeia should match Fire type step");
    }

    // -------------------- TEST 19: Uniqueness of Special Move Popups --------------------
    {
        const { read, write, sandbox } = runAppWithGameState();
        const __createBattleMatch = read("__createBattleMatch");
        const simulateBattleAttack = read("simulateBattleAttack");
        
        // Setup battle 1
        const champ1 = { name: "Thunder Spark", power: 10, level: 1, type: "Electric", rarity: "rare", image: "assets/pandas/thunder_panda.jpg" };
        const battle1 = __createBattleMatch(champ1, "void-howler");
        write("__activeBattle", battle1);
        
        const originalSetTimeout = sandbox.setTimeout;
        sandbox.setTimeout = (fn, delay) => { fn(); return 1; };
        
        const stage = sandbox.document.getElementById('battle-stage');
        stage.children = [];
        simulateBattleAttack(null, true, "Thunder Volt Strike");
        const popups1 = stage.children.filter(c => c.tag === 'div' && c.className.includes('special-clip-popup'));
        
        // Setup battle 2
        const champ2 = { name: "Inferno Spark", power: 10, level: 1, type: "Fire", rarity: "rare", image: "assets/pandas/inferno_panda.jpg" };
        const battle2 = __createBattleMatch(champ2, "void-howler");
        write("__activeBattle", battle2);
        
        stage.children = [];
        simulateBattleAttack(null, true, "Supernova Burst");
        const popups2 = stage.children.filter(c => c.tag === 'div' && c.className.includes('special-clip-popup'));
        
        sandbox.setTimeout = originalSetTimeout;
        
        // Assert that different special moves generate unique counts
        assert.notEqual(popups1.length, popups2.length, "Different special moves should generate different dynamic panel counts");
        
        // Assert that sizes/positions are unique
        const popup1 = popups1[0];
        const popup2 = popups2[0];
        assert.notEqual(popup1.style.width, popup2.style.width, "Popups from different moves should have unique widths");
        assert.notEqual(popup1.style.left, popup2.style.left, "Popups from different moves should have unique positioning coordinates");
    }

    process.stdout.write("mechanics ok\n");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});

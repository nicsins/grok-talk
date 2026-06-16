// Tailwind script
        function initTailwind() {
            document.documentElement.style.setProperty('--accent', '#00ff9d');
            
            tailwind.config = {
                theme: {
                    extend: {
                        screens: {
                            xs: "380px"
                        },
                        fontFamily: {
                            'grotesk': ['Space Grotesk', 'system-ui', 'sans-serif']
                        }
                    }
                }
            };
        }
        if (typeof tailwind !== "undefined") {
            initTailwind();
        }

        // Game State
        const DAILY_CHALLENGE_REWARD_XP_THRESHOLD = 500;

        let gameState = {
            level: 0,
            xp: 0,
            lifetimeEarnedXp: 0,
            saveSchemaVersion: 2,
            fireChallengeFusions: 0,
            fusions: 0,
            ritualFusionsCount: 0,
            collectionCount: 1,
            totalPower: 12,
            collection: [],
            recentFusions: []
        };

        // Base Pandas Data - now with FUSION BONUSES (attack/defense/speed/special/energy + element)
        // These are rendered on cards in lab/collection and evolve on fusion via elemental RPS
        const basePandas = [
            { id: 1, name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common", color: "#64748b", desc: "The original bamboo-loving legend. Reliable and steady in every fusion.", bonus: { attack: 10, defense: 10, speed: 8, special: 6, energy: 1.0, element: "Balanced" } },
            { id: 2, name: "Inferno Panda", emoji: "🔥🐼", type: "Fire", power: 18, rarity: "rare", color: "#f97316", desc: "Born in volcanic craters. Brings explosive energy to any fusion.", bonus: { attack: 20, defense: 7, speed: 11, special: 7, energy: 1.15, element: "Fire" } },
            { id: 3, name: "Frostbite Panda", emoji: "❄️🐼", type: "Ice", power: 15, rarity: "rare", color: "#67e8f9", desc: "From the eternal glaciers of the north. Slows enemies with icy aura.", bonus: { attack: 11, defense: 15, speed: 6, special: 10, energy: 1.05, element: "Ice" } },
            { id: 4, name: "Shadow Panda", emoji: "🌑🐼", type: "Dark", power: 22, rarity: "epic", color: "#6366f1", desc: "Master of stealth and illusion. Vanishes in plain sight.", bonus: { attack: 14, defense: 9, speed: 13, special: 12, energy: 0.95, element: "Dark" } },
            { id: 5, name: "Thunder Panda", emoji: "⚡🐼", type: "Electric", power: 19, rarity: "rare", color: "#eab308", desc: "Channeling the power of storms. Fast and shocking.", bonus: { attack: 13, defense: 8, speed: 16, special: 8, energy: 1.1, element: "Electric" } },
            { id: 6, name: "Golden Fortune", emoji: "✨🐼", type: "Light", power: 27, rarity: "legendary", color: "#fbbf24", desc: "Extremely rare. Brings incredible luck and prosperity.", bonus: { attack: 16, defense: 12, speed: 10, special: 14, energy: 1.2, element: "Light" } },
            { id: 7, name: "Mystic Panda", emoji: "🔮🐼", type: "Arcane", power: 24, rarity: "epic", color: "#c026ff", desc: "Wielder of ancient panda magic. Unpredictable and wise.", bonus: { attack: 15, defense: 11, speed: 9, special: 15, energy: 1.08, element: "Arcane" } },
            { id: 8, name: "Crystal Panda", emoji: "💎🐼", type: "Crystal", power: 16, rarity: "rare", color: "#67e8f9", desc: "Crystalline armor protects it from harm. Beautiful but deadly.", bonus: { attack: 12, defense: 17, speed: 5, special: 9, energy: 0.9, element: "Crystal" } }
        ];

        // User's unlocked pandas (new users start with one fair starter)
        let userPandas = [
            { ...basePandas[0], id: 'u1', acquired: new Date().toISOString().split('T')[0] }
        ];

        // ========== PLAYER AVATARS (new feature: consistent characters with outfit progression) ==========
        // Extended with dedicated BATTLE MOVES for arena playback system.
        // Each avatar has its own "agency" of themed attacks. Outcomes (hit/miss/block) drive specific generated clips.
        const PLAYER_AVATARS = [
            {
                id: 'fusion-panda',
                name: 'Fusion Panda',
                title: 'The Catalyst',
                color: '#22d3ee',
                element: 'Fusion',
                bio: 'The legendary red panda warrior of the Grok-Talk Arena. Master of energy combination and creation. His focused presence in the Fusion Lab channels raw potential into every hybrid, increasing overall power and unlocking surprising synergies. Use existing arena imagery as the core of his look.',
                bonuses: [
                    'Result power +12% to +28% (scales with level)',
                    'Chance for extra elemental synergy on any fusion'
                ],
                outfitStages: {
                    initiate: 'fusion-panda-lab.jpg',
                    adept: 'fusion-panda-base.jpg',
                    sovereign: 'fusion-panda-ascended.jpg'
                },
                stageLabels: {
                    initiate: 'Lab Initiate Harness',
                    adept: 'Armored Catalyst',
                    sovereign: 'Sovereign of Fusion'
                },
                levelThresholds: { initiate: 1, adept: 5, sovereign: 14 },
                specialThreshold: 10,
                // Battle agency moves: 4 signature attacks. Each produces hit/miss/block result clips for accurate log playback.
                moves: [
                    { id: 'fusion_beam', name: 'Fusion Beam', desc: 'Concentrated energy blast from the core.', type: 'ranged' },
                    { id: 'rift_slam', name: 'Rift Slam', desc: 'Teleports above foe for a devastating portal smash.', type: 'melee' },
                    { id: 'catalyst_surge', name: 'Catalyst Surge', desc: 'Channel massive fusion energy for AOE overload.', type: 'special' },
                    { id: 'synergy_pulse', name: 'Synergy Pulse', desc: 'Empowering wave that disrupts and damages.', type: 'ranged' }
                ],
                // Player deck of bonuses / tactic cards - rock-paper-scissors elemental system
                // Each card: category (attack/defense/block), element for RPS, speedMod (+ faster initiative/accuracy, - slower), specialCharge (energizes special meter), energyMult (damage mitigation or output modifier)
                tacticDeck: [
                    { id: 'core_overload', name: 'Core Overload', category: 'attack', element: 'Fusion', speedMod: 0, specialCharge: 4, energyMult: 1.1, bonusDesc: '+Attack, Fusion affinity' },
                    { id: 'shield_matrix', name: 'Shield Matrix', category: 'block', element: 'Crystal', speedMod: -1, specialCharge: 2, energyMult: 0.7, bonusDesc: '+Block, high mitigation' },
                    { id: 'speed_synapse', name: 'Speed Synapse', category: 'attack', element: 'Electric', speedMod: 2, specialCharge: 1, energyMult: 1.0, bonusDesc: '+Speed, higher hit chance' },
                    { id: 'ritual_focus', name: 'Ritual Focus', category: 'defense', element: 'Arcane', speedMod: 0, specialCharge: 5, energyMult: 0.85, bonusDesc: '+Special charge, good vs dark' }
                ]
            },
            {
                id: 'red-panda',
                name: 'Red Panda',
                title: 'The Emberheart',
                color: '#f97316',
                element: 'Fire / Primal',
                bio: 'A swift, instinct-driven explorer pulled straight from the arena cinematic replays. Brings raw primal fire, sharper crits and discovery luck. Develop this red panda to favor aggressive, high-variance fusion outcomes and fire-dominant hybrids.',
                bonuses: [
                    'Higher critical fusion chance',
                    'Fire-type and hybrid results gain extra power',
                    'Slightly improved rare outcome odds'
                ],
                outfitStages: {
                    initiate: 'red-panda-wildling.jpg',
                    adept: 'red-panda-base.jpg',
                    sovereign: 'red-panda-scout.jpg'
                },
                stageLabels: {
                    initiate: 'Wildling Initiate',
                    adept: 'Emberheart',
                    sovereign: 'Apex Scout'
                },
                levelThresholds: { initiate: 1, adept: 4, sovereign: 11 },
                specialThreshold: 10,
                // Red Panda agency moves — agile primal fire theme. Hit/Miss/Block outcomes for precise playback.
                moves: [
                    { id: 'ember_claw', name: 'Ember Claw Dash', desc: 'Blazing fast claw strike with trailing fire.', type: 'melee' },
                    { id: 'flame_tail', name: 'Flame Tail Whip', desc: 'Spinning tail lash that ignites the air.', type: 'ranged' },
                    { id: 'primal_pounce', name: 'Primal Pounce', desc: 'Explosive leap attack from the shadows.', type: 'melee' },
                    { id: 'wildfire_barrage', name: 'Wildfire Barrage', desc: 'Rapid multi-hit fire orb volley.', type: 'special' }
                ],
                tacticDeck: [
                    { id: 'wild_hunt', name: 'Wild Hunt', category: 'attack', element: 'Fire', speedMod: 2, specialCharge: 3, energyMult: 1.0, bonusDesc: '+Speed, aggressive fire' },
                    { id: 'ember_ward', name: 'Ember Ward', category: 'block', element: 'Crystal', speedMod: 0, specialCharge: 2, energyMult: 0.75, bonusDesc: '+Block, good mitigation' },
                    { id: 'primal_rage', name: 'Primal Rage', category: 'attack', element: 'Dark', speedMod: 1, specialCharge: 4, energyMult: 1.15, bonusDesc: '+Attack power, high charge' },
                    { id: 'scout_instinct', name: 'Scout Instinct', category: 'defense', element: 'Electric', speedMod: 3, specialCharge: 1, energyMult: 1.05, bonusDesc: '+Speed, evasive' }
                ]
            },
            {
                id: 'lich-queen',
                name: 'Lich Queen',
                title: 'The Veilweaver',
                color: '#a78bfa',
                element: 'Dark / Ritual',
                bio: 'Ancient sovereign who fused death, code and the original fusion protocol. Commands necrotic and ritual energies. Leveling the Lich Queen dramatically boosts ritual mode success rates and the chance of truly legendary or mythic panda discoveries.',
                bonuses: [
                    'Strong ritual mode bonuses (power + success)',
                    'Greatly increased chance of legendary & mythic results in ritual',
                    'Dark & Arcane results are empowered'
                ],
                outfitStages: {
                    initiate: 'lich-queen-acolyte.jpg',
                    adept: 'lich-queen-base.jpg',
                    sovereign: 'lich-queen-sovereign.jpg'
                },
                stageLabels: {
                    initiate: 'Veiled Acolyte',
                    adept: 'Royal Necromancer',
                    sovereign: 'Eternal Sovereign'
                },
                levelThresholds: { initiate: 1, adept: 6, sovereign: 15 },
                specialThreshold: 10,
                // Lich Queen agency — dark ritual and necrotic magic. Explicit hit/miss/block for accurate battle replay.
                moves: [
                    { id: 'necrotic_bolt', name: 'Necrotic Bolt', desc: 'Homing bolt of pure death energy.', type: 'ranged' },
                    { id: 'soul_siphon', name: 'Soul Siphon', desc: 'Drains life force in a direct tether.', type: 'melee' },
                    { id: 'shadow_bind', name: 'Shadow Bind', desc: 'Curses the foe, rooting and damaging over time.', type: 'special' },
                    { id: 'veil_ruin', name: 'Veil of Ruin', desc: 'Ultimate ritual that rends the veil itself.', type: 'special' }
                ],
                // Tactic deck for Lich Queen (rock-paper-scissors style deck, added for turn-based choice UI)
                tacticDeck: [
                    { id: 'necrotic_veil', name: 'Necrotic Veil', category: 'block', element: 'Dark', speedMod: -1, specialCharge: 3, energyMult: 0.6, bonusDesc: '+Block, dark mitigation' },
                    { id: 'death_ritual', name: 'Death Ritual', category: 'attack', element: 'Arcane', speedMod: 0, specialCharge: 5, energyMult: 1.2, bonusDesc: '+Special charge, ritual power' },
                    { id: 'soul_link', name: 'Soul Link', category: 'defense', element: 'Dark', speedMod: 1, specialCharge: 2, energyMult: 0.9, bonusDesc: '+Drain synergy' },
                    { id: 'shadow_step', name: 'Shadow Step', category: 'attack', element: 'Electric', speedMod: 3, specialCharge: 1, energyMult: 1.05, bonusDesc: '+Speed, evasive strike' }
                ]
            }
        ];

        // Default avatar progress (persisted)
        const DEFAULT_AVATAR_LEVELS = {
            'fusion-panda': 3,
            'red-panda': 1,
            'lich-queen': 1
        };

        // Current selected for fusion
        let selectedAlpha = null;
        let selectedBeta = null;
        let currentFusionMode = 'basic'; // basic | advanced | ritual

        function saveGameState() {
            localStorage.setItem('fusionPandaMaster', JSON.stringify({
                ...gameState,
                collection: userPandas,
                recentFusions: gameState.recentFusions
            }));
        }

        function loadGameState() {
            const saved = localStorage.getItem('fusionPandaMaster');
            if (saved) {
                const parsed = JSON.parse(saved);
                gameState = { ...gameState, ...parsed };
                if (parsed.collection) userPandas = parsed.collection;
                if (parsed.recentFusions) gameState.recentFusions = parsed.recentFusions;
                // Migrate old saves: ensure every panda has bonus for lab RPS evolution
                userPandas.forEach(p => {
                    if (!p.bonus) p.bonus = getDefaultBonus(p.type || 'Balanced');
                });
                if (typeof gameState.ritualFusionsCount !== "number" || gameState.ritualFusionsCount < 0) {
                    gameState.ritualFusionsCount = 0;
                }
                if (typeof gameState.lifetimeEarnedXp !== "number" || gameState.lifetimeEarnedXp < 0) {
                    const f = Math.max(0, Number(gameState.fusions) || 0);
                    const lvl = Math.max(0, Number(gameState.level) || 0);
                    gameState.lifetimeEarnedXp = Math.floor(f * 95 + lvl * 400);
                }
                if (typeof gameState.saveSchemaVersion !== "number" || gameState.saveSchemaVersion < 1) {
                    gameState.saveSchemaVersion = 2;
                }
                if (typeof gameState.fireChallengeFusions !== "number" || gameState.fireChallengeFusions < 0) {
                    gameState.fireChallengeFusions = 0;
                }
                if (typeof parsed.saveSchemaVersion === "undefined" || Number(parsed.saveSchemaVersion) < 2) {
                    const approxFire = Math.min(
                        3,
                        Math.floor(Math.max(0, Number(gameState.fusions) || 0) / 40),
                    );
                    gameState.fireChallengeFusions = approxFire;
                    gameState.saveSchemaVersion = 2;
                }
                // Avatar system (new)
                if (!gameState.selectedAvatarId || !PLAYER_AVATARS.some(a => a.id === gameState.selectedAvatarId)) {
                    gameState.selectedAvatarId = 'lich-queen';
                }
                if (!gameState.avatarLevels || typeof gameState.avatarLevels !== 'object') {
                    gameState.avatarLevels = { ...DEFAULT_AVATAR_LEVELS };
                } else {
                    // fill missing
                    PLAYER_AVATARS.forEach(av => {
                        if (typeof gameState.avatarLevels[av.id] !== 'number') {
                            gameState.avatarLevels[av.id] = DEFAULT_AVATAR_LEVELS[av.id] || 1;
                        }
                    });
                }
            } else {
                gameState.recentFusions = [];
                gameState.selectedAvatarId = 'lich-queen';
                gameState.avatarLevels = { ...DEFAULT_AVATAR_LEVELS };
                saveGameState();
            }
            
            // Update UI
            updateDashboard();
            renderCollection();
            renderBasePandas();
            renderRecentFusions();
        }

        function bumpLifetimeEarnedXp(amount) {
            const n = Math.max(0, Math.floor(Number(amount) || 0));
            if (!n) return;
            gameState.lifetimeEarnedXp = (Number(gameState.lifetimeEarnedXp) || 0) + n;
        }

        function syncDailyChallengeRewardUi() {
            const btn = document.getElementById("daily-challenge-claim-btn");
            const label = document.getElementById("daily-challenge-claim-label");
            const hint = document.getElementById("daily-challenge-reward-hint");
            if (!btn || !label) return;
            const earned = Math.max(0, Number(gameState.lifetimeEarnedXp) || 0);
            const fireN = Math.min(3, Math.max(0, Math.floor(Number(gameState.fireChallengeFusions) || 0)));
            const xpOk = earned >= DAILY_CHALLENGE_REWARD_XP_THRESHOLD;
            const fireOk = fireN >= 3;
            const ok = xpOk && fireOk;
            btn.disabled = !ok;
            btn.setAttribute("aria-disabled", ok ? "false" : "true");
            if (ok) {
                label.textContent = "CLAIM REWARD";
            } else if (!xpOk) {
                label.textContent = "EARN XP TO UNLOCK";
            } else {
                label.textContent = `FIRE ${fireN}/3`;
            }
            if (hint) {
                const leftXp = Math.max(0, DAILY_CHALLENGE_REWARD_XP_THRESHOLD - earned);
                const leftFire = Math.max(0, 3 - fireN);
                if (ok) {
                    hint.innerHTML = `<span class="text-emerald-400/90">Inferno protocol met — claim your reward.</span>`;
                } else {
                    hint.innerHTML = [
                        !xpOk
                            ? `Earn <span class="font-mono text-emerald-400/90">${DAILY_CHALLENGE_REWARD_XP_THRESHOLD}</span> lifetime XP (<span class="font-mono text-gray-300">${earned}</span> / ${DAILY_CHALLENGE_REWARD_XP_THRESHOLD}). <span class="font-mono text-amber-400/90">${leftXp}</span> XP to go.`
                            : `<span class="text-emerald-400/80">XP requirement met.</span>`,
                        !fireOk
                            ? ` Fuse until <span class="font-mono text-orange-300">3</span> fusion results include Fire (<span class="font-mono text-gray-300">${fireN}</span> / 3). <span class="font-mono text-amber-400/90">${leftFire}</span> to go.`
                            : "",
                    ].join("");
                }
            }
        }

        function updateDashboard() {
            // Update nav level
            document.getElementById('nav-level').innerText = gameState.level;
            const navLvCompact = document.getElementById("nav-level-compact");
            if (navLvCompact) navLvCompact.innerText = gameState.level;
            
            // Dashboard values
            document.getElementById('dash-level').innerText = gameState.level;
            document.getElementById('dash-fusions').innerText = gameState.fusions.toLocaleString();
            document.getElementById('dash-collection').innerText = userPandas.length;
            document.getElementById('dash-power').innerText = (gameState.totalPower / 1000).toFixed(1) + 'k';
            
            // XP bar
            const xpPercent = Math.min((gameState.xp / 10000) * 100, 100);
            document.getElementById('dash-xp-bar').style.width = xpPercent + '%';
            document.getElementById('dash-xp').innerText = `${gameState.xp.toLocaleString()} / 10,000`;
            
            // Update collection count in nav
            document.getElementById('collection-count').innerText = userPandas.length;

            syncDailyChallengeRewardUi();
            syncFireChallengeUi();

            // Keep director in sync (no-op if not on lab)
            if (typeof renderAvatarDirector === 'function') renderAvatarDirector();
        }

        function __resultCountsTowardFireChallenge(panda) {
            if (!panda) return false;
            const t = String(panda.type || "").toLowerCase();
            return t === "fire" || t.includes("fire");
        }

        function syncFireChallengeUi() {
            const countEl = document.getElementById("daily-challenge-fire-count");
            const barEl = document.getElementById("daily-challenge-fire-bar");
            if (!countEl || !barEl) return;
            const n = Math.min(3, Math.max(0, Math.floor(Number(gameState.fireChallengeFusions) || 0)));
            countEl.textContent = String(n);
            const pct = (n / 3) * 100;
            barEl.style.width = pct + "%";
        }

        function renderRecentFusions() {
            const container = document.getElementById('recent-fusions-list');
            container.innerHTML = '';
            
            if (!gameState.recentFusions || gameState.recentFusions.length === 0) {
                container.innerHTML = `<div class="text-xs text-gray-500 py-4 text-center">No recent fusions yet. Start fusing!</div>`;
                return;
            }
            
            gameState.recentFusions.slice(0, 3).forEach(fusion => {
                const el = document.createElement('div');
                el.className = `flex items-center gap-x-4 p-3 hover:bg-[#1a1f2e] rounded-2xl transition-colors cursor-pointer`;
                el.innerHTML = `
                    <div class="text-4xl flex-shrink-0">${fusion.emoji}</div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold">${fusion.name}</div>
                        <div class="text-xs text-gray-400 flex items-center gap-x-2">
                            <span>Power: <span class="font-mono text-emerald-400">${fusion.power}</span></span>
                            <span class="text-gray-600">•</span>
                            <span>${fusion.time}</span>
                        </div>
                    </div>
                    <div class="text-emerald-400">
                        <i class="fas fa-check-circle"></i>
                    </div>
                `;
                container.appendChild(el);
            });
        }

        function renderBasePandas() {
            const container = document.getElementById('base-pandas-grid');
            container.innerHTML = '';
            
            basePandas.forEach(panda => {
                const isUnlocked = userPandas.some(up => up.name === panda.name || (up.type === panda.type && up.rarity === panda.rarity));
                
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-2xl p-3 border border-gray-700 cursor-pointer flex flex-col items-center text-center ${!isUnlocked ? 'opacity-60' : ''}`;
                
                const b = panda.bonus || getDefaultBonus(panda.type);
                card.innerHTML = `
                    <div class="text-5xl mb-2 transition-transform">${panda.emoji}</div>
                    <div class="font-bold text-sm">${panda.name}</div>
                    <div class="text-[10px] mt-0.5 px-2.5 py-px rounded-full" style="background: ${panda.color}30; color: ${panda.color}">
                        ${panda.type}
                    </div>
                    <div class="mt-auto pt-2 text-xs flex items-center justify-center gap-x-1">
                        <span class="font-mono text-emerald-400">${panda.power}</span>
                        <span class="text-gray-500">PWR</span>
                    </div>
                    <!-- FUSION BONUSES rendered on every lab/collection card -->
                    <div class="mt-1.5 w-full text-[9px] bg-[#1a1f2e]/60 rounded-xl px-2 py-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5 font-mono text-gray-300">
                        <span title="Attack bonus">⚔️${b.attack}</span>
                        <span title="Defense bonus">🛡️${b.defense}</span>
                        <span title="Speed bonus">⚡${b.speed}</span>
                        <span title="Special bonus">✨${b.special}</span>
                        <span title="Energy mult (damage endurance)">🔋${b.energy.toFixed(1)}x</span>
                    </div>
                `;
                
                if (isUnlocked) {
                    card.onclick = () => quickSelectPanda(panda);
                } else {
                    card.onclick = () => showToast("This species hasn't been discovered yet!", "info");
                }
                
                container.appendChild(card);
            });
        }

        function quickSelectPanda(panda) {
            // Find if already in collection
            const found = userPandas.find(p => p.name === panda.name);
            if (!found) {
                showToast("You haven't unlocked this panda yet!", "error");
                return;
            }
            
            // Assign to first empty slot
            if (!selectedAlpha) {
                selectPandaForSlot('alpha', found);
            } else if (!selectedBeta) {
                selectPandaForSlot('beta', found);
            } else {
                // Replace alpha
                selectPandaForSlot('alpha', found);
            }
            
            showToast(`Added ${panda.name} to fusion slot`, "success");
        }

        function renderCollection(filteredPandas = null) {
            const container = document.getElementById('collection-grid');
            container.innerHTML = '';
            
            const pandasToShow = filteredPandas || userPandas;
            
            if (pandasToShow.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">No pandas found matching your search.</div>`;
                return;
            }
            
            pandasToShow.forEach((panda, index) => {
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-3xl p-4 border border-gray-700 cursor-pointer group`;
                
                const rarityColor = getRarityColor(panda.rarity);
                
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="text-6xl mb-3 transition-all group-hover:scale-110">${panda.emoji}</div>
                        <div class="px-2.5 py-0.5 text-xs font-bold rounded-full self-start" style="background: ${rarityColor}30; color: ${rarityColor}">
                            ${panda.rarity.toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="font-bold text-lg leading-none mb-1">${panda.name}</div>
                    <div class="flex items-center gap-x-2 text-xs">
                        <span class="px-2 py-px rounded" style="background: ${panda.color}25; color: ${panda.color}">${panda.type}</span>
                    </div>
                    
                    ${panda.mentorAvatar ? `
                    <div class="mt-1.5 flex items-center gap-x-1.5 text-[10px] text-gray-500">
                        <img src="${ (typeof getAvatarOutfitPath==='function' ? getAvatarOutfitPath(panda.mentorAvatar) : 'assets/avatars/fusion-panda-base.jpg') }" style="width:16px;height:16px;border-radius:9999px;object-fit:cover;border:1px solid #334155; flex-shrink:0">
                        <span>mentored by <span class="font-medium text-gray-400">${ (PLAYER_AVATARS.find(a=>a.id===panda.mentorAvatar)||{name:'Avatar'}).name }</span></span>
                    </div>` : ''}
                    
                    <!-- FUSION BONUSES on every card (evolves on fusion via elemental RPS) -->
                    ${(() => {
                        const b = panda.bonus || getDefaultBonus(panda.type);
                        return `
                        <div class="mt-2 w-full text-[9px] bg-[#1a1f2e]/60 rounded-xl px-2 py-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5 font-mono text-gray-300">
                            <span title="Attack">⚔️${b.attack}</span>
                            <span title="Defense">🛡️${b.defense}</span>
                            <span title="Speed">⚡${b.speed}</span>
                            <span title="Special">✨${b.special}</span>
                            <span title="Energy (endurance)">🔋${b.energy.toFixed(1)}x</span>
                        </div>`;
                    })()}
                    
                    <div class="mt-4 flex items-end justify-between">
                        <div>
                            <div class="text-xs text-gray-400">POWER</div>
                            <div class="font-black text-2xl text-white">${panda.power}</div>
                        </div>
                        
                        <div class="text-right">
                            <div onclick="event.stopImmediatePropagation(); showPandaDetail(${index});" 
                                 class="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl inline-block cursor-pointer">
                                <span class="text-emerald-400">DETAILS</span>
                            </div>
                        </div>
                    </div>
                `;
                
                card.onclick = () => showPandaDetail(index);
                container.appendChild(card);
            });
        }

        function getRarityColor(rarity) {
            switch(rarity) {
                case 'common': return '#64748b';
                case 'rare': return '#22d3ee';
                case 'epic': return '#c026ff';
                case 'legendary': return '#fbbf24';
                case 'mythic': return '#f43f5e';
                default: return '#64748b';
            }
        }

        function filterCollection() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const rarityFilter = document.getElementById('filter-rarity').value;
            
            let filtered = userPandas;
            
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(searchTerm) || 
                    p.type.toLowerCase().includes(searchTerm) ||
                    p.desc.toLowerCase().includes(searchTerm)
                );
            }
            
            if (rarityFilter) {
                filtered = filtered.filter(p => p.rarity === rarityFilter);
            }
            
            renderCollection(filtered);
        }

        // ==================== CODEX (BESTIARY) ====================
        let activeCodexTab = "bestiary";

        const CODEX_ACHIEVEMENTS = [
            { id: "first_fusion", title: "First Spark", desc: "Complete your first successful fusion in the lab.", check: (s) => s.fusions >= 1 },
            { id: "fusion_10", title: "Chain Reactor", desc: "Reach 10 total fusions on record.", check: (s) => s.fusions >= 10 },
            { id: "fusion_100", title: "Mass Synthesis", desc: "Reach 100 total fusions.", check: (s) => s.fusions >= 100 },
            { id: "col_5", title: "Keeper of Five", desc: "Hold at least 5 pandas in your collection.", check: (s, c) => c.length >= 5 },
            { id: "col_15", title: "Sanctuary", desc: "Expand your collection to 15+ unique pandas.", check: (s, c) => c.length >= 15 },
            { id: "level_20", title: "Ascension", desc: "Attain level 20 or higher.", check: (s) => s.level >= 20 },
            { id: "level_50", title: "Overclocked", desc: "Attain level 50 or higher.", check: (s) => s.level >= 50 },
            { id: "ritual_once", title: "Ritualist", desc: "Complete at least one Ritual-mode fusion.", check: (s) => (s.ritualFusionsCount || 0) >= 1 },
            { id: "mythic_owner", title: "Mythic Bond", desc: "Own a mythic-rarity panda in your collection.", check: (s, c) => c.some((p) => p.rarity === "mythic") },
            { id: "legendary_trio", title: "Trinity of Legends", desc: "Own 3+ legendary or mythic pandas at once.", check: (s, c) => c.filter((p) => p.rarity === "legendary" || p.rarity === "mythic").length >= 3 },
        ];

        const FUSION_TREE_RECIPES = [
            { a: "Classic Panda", b: "Inferno Panda", result: "Steam Panda", mode: "basic", extra: "Fire + Balanced" },
            { a: "Shadow Panda", b: "Mystic Panda", result: "Void Walker", mode: "basic", extra: "Dark + Arcane" },
            { a: "Golden Fortune", b: "Thunder Panda", result: "Solar Flare", mode: "ritual", extra: "Light + Electric" },
            { a: "Inferno Panda", b: "Mystic Panda", result: "Inferno Mystic", mode: "ritual", extra: "Fire + Arcane" },
            { a: "Frostbite Panda", b: "Golden Fortune", result: "Frost Eternal", mode: "ritual", extra: "Ice + Light" },
            { a: "Thunder Panda", b: "Crystal Panda", result: "Plasma Sovereign", mode: "basic", extra: "Electric + Crystal" },
        ];

        const CATALYSTS = [
            { id: "c1", name: "Neon Stabilizer", icon: "fa-atom", effect: "−5% base fusion XP variance", unlocked: (s) => s.level >= 5 },
            { id: "c2", name: "Bamboo Resonance Core", icon: "fa-seedling", effect: "Balanced + Hybrid outcomes slightly favor higher PWR", unlocked: (s) => s.fusions >= 25 },
            { id: "c3", name: "Ritual Ink", icon: "fa-scroll", effect: "Ritual fusions: +2% crit fusion chance (cosmetic: Protocol aura)", unlocked: (s) => (s.ritualFusionsCount || 0) >= 3 || s.fusions >= 80 },
            { id: "c4", name: "Panda Prismatic Array", icon: "fa-infinity", effect: "Unlocked: displays rare combo hints in the Fusion Tree", unlocked: (s) => s.fusions >= 200 },
        ];

        const CODEX_ALL_ENTRY_NAMES = [
            ...basePandas.map((p) => p.name),
            "Steam Panda",
            "Eclipse Guardian",
            "Solar Flare",
            "Void Walker",
            "Quantum Overlord",
            "Plasma Sovereign",
            "Inferno Mystic",
            "Frost Eternal",
            "Chaos Weaver",
            "Bamboo Titan",
            "Nebula Phantom",
            "Celestial Harmony",
        ];

        function switchCodexTab(tabId) {
            activeCodexTab = tabId;
            const tabs = {
                bestiary: "tab-bestiary",
                achievements: "tab-achievements",
                catalysts: "tab-catalysts",
                "fusion-tree": "tab-fusion-tree",
            };
            const activeClass = "px-6 py-3 text-sm font-bold cursor-pointer border-b-2 border-purple-400 text-purple-400";
            const idleClass = "px-6 py-3 text-sm font-bold cursor-pointer text-gray-400 hover:text-white";
            Object.keys(tabs).forEach((k) => {
                const el = document.getElementById(tabs[k]);
                if (el) el.className = k === tabId ? activeClass : idleClass;
            });
            document.querySelectorAll(".codex-subpanel").forEach((p) => p.classList.add("hidden"));
            const panel = document.getElementById("codex-panel-" + tabId);
            if (panel) panel.classList.remove("hidden");
            if (tabId === "bestiary") {
                filterCodex();
                updateRecentCodexStrip();
                updateCodexProgressBar();
            } else if (tabId === "achievements") {
                renderAchievements();
            } else if (tabId === "catalysts") {
                renderCatalysts();
            } else if (tabId === "fusion-tree") {
                renderFusionTree();
            }
        }

        function updateCodexProgressBar() {
            const total = Math.max(1, CODEX_ALL_ENTRY_NAMES.length);
            const found = new Set(
                userPandas.map((p) => p.name).filter((n) => CODEX_ALL_ENTRY_NAMES.includes(n)),
            );
            const pct = Math.round((found.size / total) * 100);
            const t = document.getElementById("codex-progress-text");
            const b = document.getElementById("codex-progress-bar");
            if (t) t.textContent = pct + "%";
            if (b) b.style.width = Math.min(100, pct) + "%";
        }

        function updateRecentCodexStrip() {
            const el = document.getElementById("recent-codex");
            if (!el) return;
            el.innerHTML = "";
            const names = new Set();
            const recent = [...userPandas].reverse().filter((p) => {
                if (names.has(p.name)) return false;
                names.add(p.name);
                return true;
            }).slice(0, 6);
            if (recent.length === 0) {
                el.innerHTML = "<div class=\"text-xs text-gray-500 py-2\">No discoveries yet — fuse in the lab!</div>";
                return;
            }
            recent.forEach((p) => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-700 bg-[#1a1f2e] hover:border-purple-400/50 text-left";
                chip.innerHTML = "<span class=\"text-2xl\">" + p.emoji + "</span><span class=\"text-xs font-semibold max-w-[7rem] truncate\">" + p.name + "</span>";
                el.appendChild(chip);
            });
        }

        function renderAchievements() {
            const root = document.getElementById("achievements-grid");
            if (!root) return;
            root.innerHTML = "";
            const unlockedN = CODEX_ACHIEVEMENTS.filter((a) => a.check(gameState, userPandas)).length;
            CODEX_ACHIEVEMENTS.forEach((a) => {
                const ok = a.check(gameState, userPandas);
                const card = document.createElement("div");
                card.className = "cyber-card rounded-2xl p-4 border " + (ok ? "border-emerald-500/60 bg-emerald-950/20" : "border-gray-700 opacity-80");
                card.innerHTML = "\n                    <div class=\"flex items-start gap-3\">\n                        <div class=\"text-2xl w-10 text-center\">" + (ok ? "🏆" : "🔒") + "</div>\n                        <div class=\"min-w-0 flex-1\">\n                            <div class=\"font-bold text-sm " + (ok ? "text-emerald-300" : "text-gray-300") + "\">" + a.title + "</div>\n                            <div class=\"text-xs text-gray-400 mt-1\">" + a.desc + "</div>\n                            <div class=\"text-[10px] mt-2 font-mono " + (ok ? "text-emerald-400" : "text-gray-600") + "\">" + (ok ? "UNLOCKED" : "IN PROGRESS") + "</div>\n                        </div>\n                    </div>\n                ";
                root.appendChild(card);
            });
            const h = document.querySelector("#codex-panel-achievements .section-header");
            if (h && h.parentElement) {
                const sub = h.parentElement.querySelector("p.text-gray-400");
                if (sub) sub.textContent = unlockedN + " / " + CODEX_ACHIEVEMENTS.length + " unlocked • Milestones across your fusion journey";
            }
        }

        function renderCatalysts() {
            const root = document.getElementById("catalysts-grid");
            if (!root) return;
            root.innerHTML = "";
            CATALYSTS.forEach((c) => {
                const on = c.unlocked(gameState);
                const row = document.createElement("div");
                row.className = "cyber-card rounded-2xl p-5 border " + (on ? "border-cyan-500/40" : "border-gray-800");
                row.innerHTML = "\n                    <div class=\"flex gap-4\">\n                        <div class=\"w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 flex items-center justify-center flex-shrink-0\">\n                            <i class=\"fas " + c.icon + " text-xl " + (on ? "text-cyan-300" : "text-gray-600") + "\"></i>\n                        </div>\n                        <div class=\"min-w-0 flex-1\">\n                            <div class=\"font-bold\">" + c.name + "</div>\n                            <div class=\"text-sm text-gray-400 mt-1\">" + c.effect + "</div>\n                            <div class=\"text-xs mt-2 " + (on ? "text-emerald-400" : "text-amber-500/80") + "\">" + (on ? "Active — your Protocol recognizes this catalyst." : "Locked — keep fusing to awaken.") + "</div>\n                        </div>\n                    </div>\n                ";
                root.appendChild(row);
            });
        }

        function collectionHasPandaName(name) {
            return userPandas.some((p) => p.name === name);
        }

        function renderFusionTree() {
            const root = document.getElementById("fusion-tree-root");
            if (!root) return;
            root.innerHTML = "";
            FUSION_TREE_RECIPES.forEach((r) => {
                const haveA = collectionHasPandaName(r.a);
                const haveB = collectionHasPandaName(r.b);
                const haveR = collectionHasPandaName(r.result);
                const row = document.createElement("div");
                row.className = "cyber-card rounded-2xl p-4 border border-gray-700 " + (haveR ? "ring-1 ring-emerald-500/30" : "");
                const dim = (ok) => (ok ? "" : "opacity-50 grayscale");
                row.innerHTML = "\n                    <div class=\"flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-sm\">\n                        <div class=\"text-center " + dim(haveA) + "\">\n                            <div class=\"text-3xl\">🐼</div>\n                            <div class=\"text-xs font-mono text-gray-400 max-w-[8rem] truncate\">" + r.a + "</div>\n                        </div>\n                        <div class=\"text-fuchsia-400 font-mono text-xs\">+</div>\n                        <div class=\"text-center " + dim(haveB) + "\">\n                            <div class=\"text-3xl\">🐼</div>\n                            <div class=\"text-xs font-mono text-gray-400 max-w-[8rem] truncate\">" + r.b + "</div>\n                        </div>\n                        <div class=\"text-cyan-400 font-mono text-sm\">&rarr;</div>\n                        <div class=\"text-center " + dim(haveR) + "\">\n                            <div class=\"text-3xl\">✨</div>\n                            <div class=\"text-xs font-bold " + (haveR ? "text-emerald-400" : "text-gray-500") + " max-w-[9rem]\">" + r.result + "</div>\n                        </div>\n                    </div>\n                    <div class=\"text-center text-[10px] text-gray-500 mt-2 font-mono\">" + r.mode.toUpperCase() + " &bull; " + (r.extra || "") + " &bull; parents: " + (haveA && haveB ? "ready" : "need both in collection to fuse") + "</div>\n                ";
                root.appendChild(row);
            });
        }

        function renderCodex(filteredEntries = null) {
            const container = document.getElementById('codex-grid');
            if (!container) return;
            container.innerHTML = '';
            
            // Base codex entries (all known species)
            const codexData = [
                ...basePandas,
                // Legendary Hybrids
                { id: 'leg1', name: "Steam Panda", emoji: "🌫️🔥", type: "Hybrid", power: 31, rarity: "epic", color: "#64748b", desc: "Born from the eternal love between Fire and Ice during the Great Shattering. Creates the Steam Valleys where all elements coexist peacefully." },
                { id: 'leg2', name: "Eclipse Guardian", emoji: "🌑☀️", type: "Hybrid", power: 45, rarity: "legendary", color: "#6366f1", desc: "The first successful Dark + Light fusion. It now guards the Veil Between Worlds and appears only during rare celestial alignments." },
                { id: 'leg3', name: "Solar Flare", emoji: "☀️⚡", type: "Hybrid", power: 42, rarity: "mythic", color: "#f59e0b", desc: "Created in a desperate Ritual during the Second Fracture. It is both the ultimate weapon and a warning of what happens when the Protocol is pushed too far." },
                { id: 'leg4', name: "Void Walker", emoji: "🕳️🐼", type: "Hybrid", power: 38, rarity: "legendary", color: "#4f46e5", desc: "The only known Dark + Mystic fusion. It walked through the code of the Master Protocol itself and now exists partially outside of reality." },
                { id: 'leg5', name: "Quantum Overlord", emoji: "👑🐼", type: "Mythic", power: 88, rarity: "mythic", color: "#f43f5e", desc: "The First Panda. The being who performed the very first fusion. Said to have become one with the Master Protocol itself." },
                // Expanded Lore Entries
                { id: 'leg6', name: "Plasma Sovereign", emoji: "⚡💎", type: "Hybrid", power: 51, rarity: "legendary", color: "#eab308", desc: "Electric + Crystal fusion born during the Lightning Eclipse. Commands storms of pure crystal energy that can rewrite local reality." },
                { id: 'leg7', name: "Inferno Mystic", emoji: "🔥🔮", type: "Hybrid", power: 47, rarity: "epic", color: "#f97316", desc: "Arcane + Fire fusion. The living embodiment of the first spell ever cast by a panda during the Age of Whispering Flames." },
                { id: 'leg8', name: "Frost Eternal", emoji: "❄️🌌", type: "Hybrid", power: 39, rarity: "legendary", color: "#67e8f9", desc: "Ice + Light fusion that froze time itself during the longest winter in recorded panda history. Still watches over the frozen peaks." },
                { id: 'leg9', name: "Chaos Weaver", emoji: "🌀🐼", type: "Hybrid", power: 62, rarity: "mythic", color: "#c026ff", desc: "The only successful 3-element fusion (Dark + Arcane + Electric). It weaves the threads of fate and can see possible futures." },
                { id: 'leg10', name: "Bamboo Titan", emoji: "🌿🐼", type: "Balanced", power: 55, rarity: "legendary", color: "#4ade80", desc: "The ancient guardian of the Eternal Grove. Said to be the original form of the First Panda before the first fusion ever occurred." },
                { id: 'leg11', name: "Nebula Phantom", emoji: "🌌🕳️", type: "Hybrid", power: 58, rarity: "mythic", color: "#6366f1", desc: "Dark + Crystal fusion that exists in multiple dimensions simultaneously. It is rarely seen in our reality but leaves trails of starlight." },
                { id: 'leg12', name: "Celestial Harmony", emoji: "✨🌈", type: "Hybrid", power: 49, rarity: "legendary", color: "#fbbf24", desc: "The ultimate Light + Electric + Arcane fusion. It sings the song of creation and can calm even the most unstable Ritual fusions." }
            ];
            
            const entriesToShow = filteredEntries || codexData;
            document.getElementById('codex-count').innerText = entriesToShow.length;
            
            entriesToShow.forEach((entry, index) => {
                const isUnlocked = userPandas.some(p => p.name === entry.name || (p.type === entry.type && p.rarity === entry.rarity));
                
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-3xl p-5 border border-gray-700 cursor-pointer group ${!isUnlocked ? 'opacity-75 grayscale-[0.3]' : ''}`;
                
                const rarityColor = getRarityColor(entry.rarity);
                
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <div class="text-6xl transition-transform group-hover:scale-110">${entry.emoji}</div>
                        <div class="px-3 py-1 text-xs font-bold rounded-full text-center" style="background: ${rarityColor}25; color: ${rarityColor}">
                            ${entry.rarity.toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="font-black text-xl mb-1">${entry.name}</div>
                    <div class="flex items-center gap-x-2 mb-3">
                        <span class="px-2.5 py-px text-xs rounded" style="background: ${entry.color}25; color: ${entry.color}">${entry.type}</span>
                        <span class="text-xs text-emerald-400 font-mono">${entry.power} PWR</span>
                    </div>
                    
                    <div class="text-xs text-gray-400 line-clamp-3 mb-4">
                        ${entry.desc.substring(0, 120)}${entry.desc.length > 120 ? '...' : ''}
                    </div>
                    
                    <div class="flex justify-between items-center text-xs">
                        <div class="${isUnlocked ? 'text-emerald-400' : 'text-gray-500'}">
                            <i class="fas ${isUnlocked ? 'fa-check-circle' : 'fa-lock'} mr-1"></i>
                            ${isUnlocked ? 'Discovered' : 'Locked'}
                        </div>
                        <div onclick="event.stopImmediatePropagation(); showCodexDetail(${index}, ${JSON.stringify(entry).replace(/"/g, '&quot;')});" 
                             class="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                            READ LORE
                        </div>
                    </div>
                `;
                
                card.onclick = () => showCodexDetail(index, entry);
                container.appendChild(card);
            });
            updateRecentCodexStrip();
            updateCodexProgressBar();
        }

        function filterCodex() {
            const searchTerm = document.getElementById('codex-search').value.toLowerCase();
            const typeFilter = document.getElementById('codex-filter').value;
            
            const codexData = [
                ...basePandas,
                { id: 'leg1', name: "Steam Panda", emoji: "🌫️🔥", type: "Hybrid", power: 31, rarity: "epic", color: "#64748b", desc: "Born from the eternal love between Fire and Ice during the Great Shattering." },
                { id: 'leg2', name: "Eclipse Guardian", emoji: "🌑☀️", type: "Hybrid", power: 45, rarity: "legendary", color: "#6366f1", desc: "The first successful Dark + Light fusion. Guardian of the Veil Between Worlds." },
                { id: 'leg3', name: "Solar Flare", emoji: "☀️⚡", type: "Hybrid", power: 42, rarity: "mythic", color: "#f59e0b", desc: "Born in a desperate Ritual during the Second Fracture." },
                { id: 'leg4', name: "Void Walker", emoji: "🕳️🐼", type: "Hybrid", power: 38, rarity: "legendary", color: "#4f46e5", desc: "The only known Dark + Mystic fusion that walked through the Master Protocol." },
                { id: 'leg5', name: "Quantum Overlord", emoji: "👑🐼", type: "Mythic", power: 88, rarity: "mythic", color: "#f43f5e", desc: "The First Panda who performed the very first fusion and became one with the Protocol." },
                { id: 'leg6', name: "Plasma Sovereign", emoji: "⚡💎", type: "Hybrid", power: 51, rarity: "legendary", color: "#eab308", desc: "Electric + Crystal fusion born during the Lightning Eclipse." },
                { id: 'leg7', name: "Inferno Mystic", emoji: "🔥🔮", type: "Hybrid", power: 47, rarity: "epic", color: "#f97316", desc: "Arcane + Fire fusion. Embodiment of the first spell ever cast." },
                { id: 'leg8', name: "Frost Eternal", emoji: "❄️🌌", type: "Hybrid", power: 39, rarity: "legendary", color: "#67e8f9", desc: "Ice + Light fusion that froze time during the longest winter." },
                { id: 'leg9', name: "Chaos Weaver", emoji: "🌀🐼", type: "Hybrid", power: 62, rarity: "mythic", color: "#c026ff", desc: "The only successful 3-element fusion. Weaves the threads of fate." },
                { id: 'leg10', name: "Bamboo Titan", emoji: "🌿🐼", type: "Balanced", power: 55, rarity: "legendary", color: "#4ade80", desc: "Ancient guardian of the Eternal Grove and original form of the First Panda." },
                { id: 'leg11', name: "Nebula Phantom", emoji: "🌌🕳️", type: "Hybrid", power: 58, rarity: "mythic", color: "#6366f1", desc: "Dark + Crystal fusion that exists in multiple dimensions." },
                { id: 'leg12', name: "Celestial Harmony", emoji: "✨🌈", type: "Hybrid", power: 49, rarity: "legendary", color: "#fbbf24", desc: "Ultimate Light + Electric + Arcane fusion that sings the song of creation." }
            ];
            
            let filtered = codexData;
            
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(searchTerm) || 
                    p.type.toLowerCase().includes(searchTerm) ||
                    p.desc.toLowerCase().includes(searchTerm)
                );
            }
            
            if (typeFilter) {
                filtered = filtered.filter(p => p.type === typeFilter);
            }
            
            renderCodex(filtered);
        }

        function showCodexDetail(index, entry) {
            const modalHTML = `
                <div onclick="this.remove()" class="fixed inset-0 bg-black/90 z-[130] flex items-center justify-center p-4">
                    <div onclick="event.stopImmediatePropagation()" class="cyber-card w-full max-w-2xl rounded-3xl overflow-hidden border border-purple-400/50">
                        <div class="px-8 pt-8 pb-6 relative bg-gradient-to-b from-[#0f1117] to-transparent">
                            <button onclick="event.target.closest('.fixed').remove()" class="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl">×</button>
                            
                            <div class="flex justify-center mb-4">
                                <div class="text-[140px]">${entry.emoji}</div>
                            </div>
                            
                            <div class="text-center">
                                <div class="inline-block px-5 py-1 rounded-full text-sm font-extrabold tracking-widest mb-3" 
                                     style="background: ${getRarityColor(entry.rarity)}30; color: ${getRarityColor(entry.rarity)}">
                                    ${entry.rarity.toUpperCase()} • ${entry.type}
                                </div>
                                
                                <div class="text-4xl font-black mb-2">${entry.name}</div>
                                <div class="text-2xl text-emerald-400 font-mono">${entry.power} POWER</div>
                            </div>
                        </div>
                        
                        <div class="px-8 pb-8">
                            <div class="text-sm text-gray-300 leading-relaxed mb-6">
                                ${entry.desc}
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 text-xs">
                                <div class="bg-[#1a1f2e] rounded-2xl p-4">
                                    <div class="text-purple-400 font-bold mb-1">ORIGIN</div>
                                    <div>The Great Shattering • Era of the First Masters</div>
                                </div>
                                <div class="bg-[#1a1f2e] rounded-2xl p-4">
                                    <div class="text-purple-400 font-bold mb-1">KNOWN FOR</div>
                                    <div>${entry.type === 'Hybrid' ? 'Legendary fusion synergy' : 'Foundational species of the Protocol'}</div>
                                </div>
                            </div>
                            
                            <div class="mt-6 text-center">
                                <button onclick="event.target.closest('.fixed').remove(); navigateTo('fusion-lab');" 
                                        class="px-8 py-3 rounded-2xl border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black transition-all text-sm font-bold">
                                    FUSE WITH THIS SPECIES
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        function showPandaDetail(index) {
            const panda = userPandas[index];
            const modalHTML = `
                <div onclick="this.remove()" class="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4">
                    <div onclick="event.stopImmediatePropagation()" class="cyber-card w-full max-w-lg rounded-3xl overflow-hidden border border-gray-700">
                        <div class="px-8 pt-8 pb-6 relative">
                            <button onclick="event.target.closest('.fixed').remove()" class="absolute top-6 right-6 text-gray-400 hover:text-white">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                            
                            <div class="flex justify-center">
                                <div class="text-[130px] transition-all">${panda.emoji}</div>
                            </div>
                            
                            <div class="text-center mt-1">
                                <div class="inline-block px-5 py-1 rounded-full text-xs font-extrabold tracking-widest mb-2" 
                                     style="background: ${getRarityColor(panda.rarity)}30; color: ${getRarityColor(panda.rarity)}">
                                    ${panda.rarity.toUpperCase()}
                                </div>
                                
                                <div class="text-4xl font-black">${panda.name}</div>
                                <div class="text-lg text-emerald-400 mt-1">${panda.type} TYPE</div>
                            </div>
                            
                            <div class="mt-8 grid grid-cols-2 gap-4">
                                <div class="bg-[#1a1f2e] rounded-2xl p-4 text-center">
                                    <div class="text-xs text-gray-400">ATTACK POWER</div>
                                    <div class="text-5xl font-black text-emerald-400 mt-1">${panda.power}</div>
                                </div>
                                <div class="bg-[#1a1f2e] rounded-2xl p-4 text-center">
                                    <div class="text-xs text-gray-400">SPECIAL</div>
                                    <div class="text-3xl mt-2 font-bold">${panda.type}</div>
                                    <div class="text-xs mt-1 text-gray-400">TRAIT</div>
                                </div>
                            </div>

                            <!-- BONUSES in detail (RPS-evolvable on fusion) -->
                            ${(() => {
                                const b = panda.bonus || getDefaultBonus(panda.type || 'Balanced');
                                return `
                                <div class="mt-6">
                                    <div class="text-xs uppercase tracking-widest text-gray-400 mb-2 px-1">FUSION BONUS ATTRIBUTES</div>
                                    <div class="grid grid-cols-5 gap-2 text-center text-xs">
                                        <div class="bg-[#1a1f2e] rounded-xl p-2"><div class="text-[10px] text-gray-400">ATK</div><div class="font-bold text-lg">${b.attack}</div></div>
                                        <div class="bg-[#1a1f2e] rounded-xl p-2"><div class="text-[10px] text-gray-400">DEF</div><div class="font-bold text-lg">${b.defense}</div></div>
                                        <div class="bg-[#1a1f2e] rounded-xl p-2"><div class="text-[10px] text-gray-400">SPD</div><div class="font-bold text-lg">${b.speed}</div></div>
                                        <div class="bg-[#1a1f2e] rounded-xl p-2"><div class="text-[10px] text-gray-400">SPEC</div><div class="font-bold text-lg">${b.special}</div></div>
                                        <div class="bg-[#1a1f2e] rounded-xl p-2"><div class="text-[10px] text-gray-400">NRG</div><div class="font-bold text-lg">${b.energy.toFixed(1)}x</div></div>
                                    </div>
                                    <div class="text-[10px] text-center mt-1 text-gray-500">Element: <span class="font-mono text-amber-300">${b.element}</span> (evolves via RPS on fusion)</div>
                                </div>`;
                            })()}
                            
                            <div class="mt-6 text-sm text-gray-300 leading-relaxed">
                                ${panda.desc}
                            </div>
                            
                            <div class="mt-6 text-xs flex items-center justify-between text-gray-500">
                                <div>Acquired: <span class="font-mono">${panda.acquired || 'Unknown'}</span></div>
                                <div class="flex items-center gap-x-1">
                                    <i class="fas fa-star text-amber-400"></i>
                                    <span>Fusion Master</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="px-8 py-5 border-t border-gray-700 bg-[#0f1117] flex gap-3">
                            <button onclick="event.target.closest('.fixed').remove(); quickSelectPandaFromDetail(${index});" 
                                    class="flex-1 py-3 rounded-2xl border border-emerald-400 text-emerald-400 font-bold text-sm flex items-center justify-center gap-x-2 hover:bg-emerald-400 hover:text-black transition-all">
                                <i class="fas fa-plus"></i> 
                                <span>ADD TO FUSION</span>
                            </button>
                            
                            <button onclick="event.target.closest('.fixed').remove()" 
                                    class="flex-1 py-3 rounded-2xl border border-gray-700 font-medium text-sm hover:bg-gray-800 transition-all">
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        function quickSelectPandaFromDetail(index) {
            const panda = userPandas[index];
            // Close detail modal first
            const detailModal = document.querySelector('.fixed.inset-0.bg-black\\/80');
            if (detailModal) detailModal.remove();
            
            // Select for fusion
            if (!selectedAlpha) {
                selectPandaForSlot('alpha', panda);
            } else if (!selectedBeta) {
                selectPandaForSlot('beta', panda);
            } else {
                selectPandaForSlot('alpha', panda);
            }
            
            navigateTo('fusion-lab');
            showToast(`Loaded ${panda.name} into fusion chamber`, "success");
        }

        function openPandaSelector(slot) {
            const modal = document.getElementById('panda-selector-modal');
            const grid = document.getElementById('selector-grid');
            grid.innerHTML = '';
            
            userPandas.forEach((panda, idx) => {
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-2xl p-4 border border-gray-700 cursor-pointer hover:border-emerald-400 flex flex-col`;
                
                const rarityColor = getRarityColor(panda.rarity);
                
                const b = panda.bonus || getDefaultBonus(panda.type);
                card.innerHTML = `
                    <div class="flex justify-between">
                        <div class="text-5xl mb-2">${panda.emoji}</div>
                        <div>
                            <div class="px-2 py-0.5 text-xs font-bold rounded-full text-center" style="background: ${rarityColor}30; color: ${rarityColor}">
                                ${panda.rarity}
                            </div>
                        </div>
                    </div>
                    <div class="font-bold">${panda.name}</div>
                    <div class="text-xs text-emerald-400">${panda.type}</div>
                    
                    <div class="mt-1 text-[9px] bg-[#1a1f2e]/50 rounded px-1.5 py-0.5 flex flex-wrap gap-1 font-mono text-gray-300">
                        <span>⚔️${b.attack}</span><span>🛡️${b.defense}</span><span>⚡${b.speed}</span><span>✨${b.special}</span><span>🔋${b.energy.toFixed(1)}x</span>
                    </div>
                    
                    <div class="mt-auto pt-2 flex justify-between items-center">
                        <div class="font-mono text-lg">${panda.power}</div>
                        <div class="text-xs px-2 py-px bg-white/10 rounded">PWR</div>
                    </div>
                `;
                
                card.onclick = () => {
                    selectPandaForSlot(slot, panda);
                    closePandaSelector();
                };
                
                grid.appendChild(card);
            });
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closePandaSelector() {
            const modal = document.getElementById('panda-selector-modal');
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }

        function selectPandaForSlot(slot, panda) {
            const slotEl = document.getElementById(`slot-${slot}`);
            
            if (slot === 'alpha') selectedAlpha = panda;
            else selectedBeta = panda;
            
            // Update slot UI
            const b = panda.bonus || getDefaultBonus(panda.type);
            slotEl.innerHTML = `
                <div class="p-5 w-full flex flex-col items-center justify-center text-center">
                    <div class="text-7xl mb-3 transition-all">${panda.emoji}</div>
                    <div class="font-black text-xl">${panda.name}</div>
                    <div class="flex items-center gap-x-2 mt-1">
                        <span class="px-3 py-px text-xs rounded-full" style="background: ${panda.color}25; color: ${panda.color}">${panda.type}</span>
                        <span class="font-mono text-xs text-emerald-400">${panda.power} PWR</span>
                    </div>
                    
                    <!-- Bonuses visible on lab fusion cards/slots -->
                    <div class="mt-1.5 text-[9px] bg-black/30 rounded px-2 py-0.5 flex gap-1 font-mono text-gray-300">
                        <span>⚔️${b.attack}</span><span>🛡️${b.defense}</span><span>⚡${b.speed}</span>
                        <span>✨${b.special}</span><span>🔋${b.energy.toFixed(1)}x</span>
                    </div>
                    
                    <div onclick="event.stopImmediatePropagation(); clearSlot('${slot}')" 
                         class="mt-3 text-xs flex items-center gap-x-1 text-red-400 hover:text-red-300 cursor-pointer">
                        <i class="fas fa-times"></i> <span>REMOVE</span>
                    </div>
                </div>
            `;
            
            slotEl.classList.add('active', 'border-solid');
            slotEl.style.borderColor = panda.color;
            
            // Enable fuse button if both selected
            updateFuseButton();
            updateEnergyCost();
        }

        function clearSlot(slot) {
            const slotEl = document.getElementById(`slot-${slot}`);
            
            if (slot === 'alpha') selectedAlpha = null;
            else selectedBeta = null;
            
            slotEl.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-plus text-4xl text-gray-600 mb-3"></i>
                    <div class="font-medium text-gray-400">Select Panda ${slot === 'alpha' ? 'A' : 'B'}</div>
                    <div class="text-xs text-gray-500 mt-1">Click to choose from collection</div>
                </div>
            `;
            
            slotEl.classList.remove('active');
            slotEl.style.borderColor = '';
            
            updateFuseButton();
            updateEnergyCost();
        }

        function updateFuseButton() {
            const btn = document.getElementById('fuse-btn');
            btn.disabled = !(selectedAlpha && selectedBeta);
            
            if (selectedAlpha && selectedBeta) {
                btn.classList.add('fusion-glow');
            } else {
                btn.classList.remove('fusion-glow');
            }
        }

        function setFusionMode(mode) {
            currentFusionMode = mode;

            const basic = document.getElementById("mode-basic");
            const advanced = document.getElementById("mode-advanced");
            const ritual = document.getElementById("mode-ritual");
            const resetInactive = (el, borderClass) => {
                if (!el) return;
                el.classList.remove(
                    "bg-emerald-500",
                    "bg-fuchsia-500",
                    "bg-amber-500",
                    "text-black",
                    "active-mode",
                );
                el.classList.add("bg-[#1a1f2e]", "border", borderClass);
            };

            resetInactive(basic, "border-emerald-400/40");
            resetInactive(advanced, "border-fuchsia-400/50");
            resetInactive(ritual, "border-amber-400/50");

            const active = document.getElementById(`mode-${mode}`);
            if (active) {
                active.classList.remove(
                    "bg-[#1a1f2e]",
                    "border",
                    "border-emerald-400/40",
                    "border-fuchsia-400/50",
                    "border-amber-400/50",
                );
                if (mode === "basic") {
                    active.classList.add("bg-emerald-500", "text-black");
                } else if (mode === "advanced") {
                    active.classList.add("bg-fuchsia-500", "text-black");
                } else if (mode === "ritual") {
                    active.classList.add("bg-amber-500", "text-black");
                }
            }

            updateEnergyCost();
        }

        function updateEnergyCost() {
            const costEl = document.getElementById('energy-cost');
            if (!costEl || !selectedAlpha || !selectedBeta) {
                if (costEl) costEl.innerText = '250 EP';
                return;
            }
            
            let baseCost = 250;
            const powerAvg = (selectedAlpha.power + selectedBeta.power) / 2;
            
            if (currentFusionMode === 'advanced') baseCost = Math.floor(baseCost * 1.6);
            if (currentFusionMode === 'ritual') baseCost = Math.floor(baseCost * 2.8);
            
            // Scale with power
            const finalCost = Math.floor(baseCost + (powerAvg * 1.8));
            costEl.innerText = `${finalCost} EP`;
            costEl.style.color = currentFusionMode === 'ritual' ? '#fbbf24' : '#10b981';
        }

        // ========== AVATAR HELPERS & RENDERERS (Player Avatars + Outfit Progression + Lab integration) ==========
        function getCurrentAvatar() {
            const id = gameState.selectedAvatarId || 'fusion-panda';
            return PLAYER_AVATARS.find(a => a.id === id) || PLAYER_AVATARS[0];
        }
        function getAvatarLevel(avatarId) {
            if (!gameState.avatarLevels) return 1;
            return gameState.avatarLevels[avatarId] || 1;
        }
        function getEquippedStage(avatarId) {
            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            if (!av) return 'adept';
            const lvl = getAvatarLevel(avatarId);
            if (lvl >= (av.levelThresholds.sovereign || 99)) return 'sovereign';
            if (lvl >= (av.levelThresholds.adept || 5)) return 'adept';
            return 'initiate';
        }
        function getAvatarOutfitPath(avatarId) {
            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            if (!av) return 'assets/avatars/fusion-panda-base.jpg';
            const stage = getEquippedStage(avatarId);
            const file = av.outfitStages[stage] || Object.values(av.outfitStages)[0];
            return `assets/avatars/${file}`;
        }
        function getAvatarBonus(avatarId) {
            const lvl = getAvatarLevel(avatarId);
            const powerMult = Math.min(0.28, 0.10 + Math.max(0, (lvl - 1)) * 0.014);
            const critExtra = Math.min(0.13, Math.max(0, (lvl - 1)) * 0.009);
            const ritualExtra = (avatarId === 'lich-queen') ? Math.min(0.38, Math.max(0, (lvl - 1)) * 0.022) : 0;
            return { powerMult, critExtra, ritualExtra };
        }
        function getStageLabel(avatarId, stage) {
            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            return (av && av.stageLabels && av.stageLabels[stage]) || stage;
        }

        // ===== BATTLE AVATAR MOVES & ATTACK LOG HELPERS (for accurate playback) =====
        function getAvatarMoves(avatarId) {
            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            return (av && av.moves) || [];
        }

        function getAvatarTactics(avatarId) {
            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            if (av && av.tacticDeck && av.tacticDeck.length >= 4) return av.tacticDeck;
            // Fallback generic cyber-tactics (4 cards) for any avatar without explicit deck
            return [
                { id: 'power_strike', name: 'Power Strike', category: 'attack', element: 'Fusion', speedMod: 1, specialCharge: 2, energyMult: 1.1, bonusDesc: '+Attack, general' },
                { id: 'iron_guard', name: 'Iron Guard', category: 'block', element: 'Crystal', speedMod: 0, specialCharge: 1, energyMult: 0.65, bonusDesc: '+Block, high mitigation' },
                { id: 'focus_chi', name: 'Focus Chi', category: 'defense', element: 'Arcane', speedMod: 0, specialCharge: 4, energyMult: 0.9, bonusDesc: '+Special charge' },
                { id: 'swift_dash', name: 'Swift Dash', category: 'attack', element: 'Electric', speedMod: 3, specialCharge: 1, energyMult: 1.0, bonusDesc: '+Speed, higher hit chance' }
            ];
        }

        function pickRandomMove(avatarId) {
            const moves = getAvatarMoves(avatarId);
            if (!moves.length) return { id: 'generic', name: 'Attack', desc: 'Basic strike' };
            return moves[Math.floor(Math.random() * moves.length)];
        }

        function determineOutcome(move, isSpecial = false) {
            // Weighted random outcome per move. Specials are riskier (more miss potential) but higher reward on hit.
            const roll = Math.random();
            let outcome;
            if (isSpecial) {
                if (roll < 0.55) outcome = 'hit';
                else if (roll < 0.80) outcome = 'miss';
                else outcome = 'block';
            } else {
                if (roll < 0.62) outcome = 'hit';
                else if (roll < 0.82) outcome = 'miss';
                else outcome = 'block';
            }
            // Damage modifier
            let dmgMod = 1.0;
            if (outcome === 'hit') dmgMod = isSpecial ? 1.45 : 1.0;
            else if (outcome === 'miss') dmgMod = 0;
            else if (outcome === 'block') dmgMod = isSpecial ? 0.25 : 0.4;
            return { outcome, dmgMod };
        }

        function getClipPath(avatarId, moveId, outcome) {
            // Predictable naming for the generated agency clips.
            const slug = avatarId; // fusion-panda, red-panda, lich-queen
            return `assets/arena/avatars/${slug}/${moveId}_${outcome}.mp4`;
        }

        // ========== LICH QUEEN AGENCY CLIP HELPER (Lich Queen Agency assistant) ==========
        // Dedicated helper for the 12 verified clips in assets/arena/avatars/lich-queen/.
        // Returns structured data for playback: video + poster (jpgs present unlike fusion-panda) + VFX metadata.
        // Use this (or extend general getClipPath) when implementing specific clip playback in battle log replay.
        // Verified: all 12 clips = 544x544 h264 24fps ~6.04s duration (see tool verification).
        //
        // NOTES FOR DARK/RITUAL VFX IN PLAYBACK (integration guidance):
        // - Theme: deep purple (#4c1d95 to #a78bfa), sickly green (#166534 accents), bone/obsidian blacks.
        // - Common overlays: swirling ritual circles (thin glowing lines), floating necrotic runes (faint glyphs that pulse and fade), drifting ash particles.
        // - Per-outcome:
        //   * hit: necrotic energy crackle + impact burst (green-purple splatter + bone shards fly out on hit target). Brief slow-mo on contact frame ~2.8s.
        //   * miss: veil fade + wisp dissipates into shadows. Add semi-transparent mirror-veil distortion on foe side + echo fade.
        //   * block: shadow-shield (concentric dark rings + ethereal bone barrier). Reduced particle density, heavy vignette + low rumble.
        // - Special for moves:
        //   * necrotic_bolt: homing green skull-trail or energy tether visible in clip + add extra particle overlay on player hand.
        //   * soul_siphon: tether beam (use existing battle-beam but recolor to #4ade80->#a78bfa). Drain HP particles from foe to player avatar (reverse of normal). Green glow on Lich Queen during siphon.
        //   * shadow_bind: root/vines of shadow (clip shows bind, enhance with persistent root decals on foe card for DoT turns).
        //   * veil_ruin: screen-wide ritual rupture (add screen shake + radial dark burst + temporary full-screen vignette on play). Highest intensity; use for special moves.
        // - Playback tips: preload poster as bg while video buffers. Autoplay muted or low vol. On end: hold last frame or crossfade to static jpg + trigger floating dmg / log line. Layer CSS filters (hue-rotate for ritual, contrast boost). Darken arena bg slightly during Lich Queen turns. Sync with __appendBattleLogLine and __spawnBattleFloatingDmg. For replay from attackLog: iterate and call getLichQueenClip(log.moveId, log.outcome) then render <video poster=... src=...> in a dedicated clip-viewer div inside battle-stage.
        // - Fallback: if !video or error, use reference_base.jpg or outcome jpg with CSS animated overlay (pulse runes).
        function getLichQueenClip(moveId, outcome) {
            const base = `assets/arena/avatars/lich-queen/${moveId}_${outcome}`;
            const validMoves = ['necrotic_bolt', 'soul_siphon', 'shadow_bind', 'veil_ruin'];
            const validOutcomes = ['hit', 'miss', 'block'];
            if (!validMoves.includes(moveId) || !validOutcomes.includes(outcome)) {
                console.warn('[LichQueenClip] Unknown move/outcome:', moveId, outcome);
            }
            return {
                video: `${base}.mp4`,
                poster: `${base}.jpg`,
                moveId: moveId,
                outcome: outcome,
                duration: 6.041667, // consistent across all verified clips
                vfx: {
                    theme: 'dark-ritual',
                    primaryColor: '#a78bfa', // matches avatar color
                    accent: outcome === 'hit' ? '#22ffaa' : (outcome === 'miss' ? '#7c3aed' : '#4ade80'),
                    particles: outcome === 'hit' ? 'necrotic-bolt-burst' : (outcome === 'miss' ? 'veil-dissipate' : 'shadow-shield'),
                    overlay: 'ritual-runes',
                    soundHint: 'low-drone + crackle + siphon-whoosh for soul_siphon'
                }
            };
        }

        // SAMPLE BATTLE LOGS (Lich Queen Agency - for testing playback + replay integration)
        // Use with recordAttackLog style or full battle.attackLog arrays. These demonstrate necrotic_bolt etc + outcomes.
        // To simulate replay: for each entry, const clip = getLichQueenClip(entry.moveId, entry.outcome); then play clip.video with VFX from clip.vfx
        const SAMPLE_LICH_QUEEN_BATTLE_LOG_1 = [ // Victory via strong ritual opener
            { turn: 1, actor: "Lich Queen", moveId: "necrotic_bolt", moveName: "Necrotic Bolt", outcome: "hit", damage: 31, isPlayer: true },
            { turn: 2, actor: "Void Howler", moveId: "generic", moveName: "VOID CRUSH", outcome: "hit", damage: 14, isPlayer: false },
            { turn: 3, actor: "Lich Queen", moveId: "soul_siphon", moveName: "Soul Siphon", outcome: "hit", damage: 42, isPlayer: true },
            { turn: 4, actor: "Lich Queen", moveId: "veil_ruin", moveName: "Veil of Ruin", outcome: "hit", damage: 67, isPlayer: true }
            // Final HP <=0 -> victory. Use showInArenaCinematic after.
        ];

        const SAMPLE_LICH_QUEEN_BATTLE_LOG_2 = [ // Risky special sequence, mixed outcomes, close defeat avoided
            { turn: 1, actor: "Lich Queen", moveId: "shadow_bind", moveName: "Shadow Bind", outcome: "block", damage: 9, isPlayer: true }, // partial block damage
            { turn: 2, actor: "Lich Queen", moveId: "necrotic_bolt", moveName: "Necrotic Bolt", outcome: "miss", damage: 0, isPlayer: true },
            { turn: 3, actor: "Lich Queen", moveId: "veil_ruin", moveName: "Veil of Ruin", outcome: "hit", damage: 55, isPlayer: true },
            { turn: 4, actor: "Chroma Lynx", moveId: "generic", moveName: "DARK PULSE", outcome: "hit", damage: 22, isPlayer: false },
            { turn: 5, actor: "Lich Queen", moveId: "soul_siphon", moveName: "Soul Siphon", outcome: "hit", damage: 38, isPlayer: true }
            // Ends in player victory despite early whiff. Good for testing miss VFX + recovery.
        ];

        // Fusion Panda Agency clip helper (dedicated subagent output)
        function getFusionPandaClip(moveId, outcome) {
            const clips = {
                'fusion_beam_hit': 'assets/arena/avatars/fusion-panda/fusion_beam_hit.mp4',
                'fusion_beam_miss': 'assets/arena/avatars/fusion-panda/fusion_beam_miss.mp4',
                'fusion_beam_block': 'assets/arena/avatars/fusion-panda/fusion_beam_block.mp4',
                'rift_slam_hit': 'assets/arena/avatars/fusion-panda/rift_slam_hit.mp4',
                'rift_slam_miss': 'assets/arena/avatars/fusion-panda/rift_slam_miss.mp4',
                'rift_slam_block': 'assets/arena/avatars/fusion-panda/rift_slam_block.mp4',
                'catalyst_surge_hit': 'assets/arena/avatars/fusion-panda/catalyst_surge_hit.mp4',
                'catalyst_surge_miss': 'assets/arena/avatars/fusion-panda/catalyst_surge_miss.mp4',
                'catalyst_surge_block': 'assets/arena/avatars/fusion-panda/catalyst_surge_block.mp4',
                'synergy_pulse_hit': 'assets/arena/avatars/fusion-panda/synergy_pulse_hit.mp4',
                'synergy_pulse_miss': 'assets/arena/avatars/fusion-panda/synergy_pulse_miss.mp4',
                'synergy_pulse_block': 'assets/arena/avatars/fusion-panda/synergy_pulse_block.mp4'
            };
            const key = `${moveId}_${outcome}`;
            return clips[key] || `assets/arena/avatars/fusion-panda/${moveId}_${outcome}.mp4`;
        }

        // Red Panda Agency clip helper (dedicated subagent output)
        function getRedPandaClip(moveId, outcome) {
            const validMoves = ['ember_claw', 'flame_tail', 'primal_pounce', 'wildfire_barrage'];
            const validOutcomes = ['hit', 'miss', 'block'];
            if (!validMoves.includes(moveId)) moveId = 'ember_claw';
            if (!validOutcomes.includes(outcome)) outcome = 'hit';
            return `assets/arena/avatars/red-panda/${moveId}_${outcome}.mp4`;
        }

        // Unified dispatcher for any player avatar's agency clips
        function getBattleClip(avatarId, moveId, outcome) {
            if (avatarId === 'fusion-panda') return getFusionPandaClip(moveId, outcome);
            if (avatarId === 'red-panda') return getRedPandaClip(moveId, outcome);
            if (avatarId === 'lich-queen') {
                const clip = getLichQueenClip(moveId, outcome);
                return clip.video || clip;
            }
            return getClipPath(avatarId, moveId, outcome);
        }

        // ===== ARENA ATTACK LOG PLAYBACK (strings agency clips together to exactly match the log) =====
        // Accurate demonstration of battle flow using the generated per-move hit/miss/block videos.
        let __playbackQueue = [];
        let __playbackIndex = 0;
        let __playbackVideoEl = null;
        let __playbackLogEl = null;
        let __playbackAvatar = null;

        function playAttackLogPlayback(attackLog, avatarId = null) {
            if (!attackLog || !attackLog.length) {
                showToast('No attack log to replay.', 'info');
                return;
            }
            const activeAvatar = avatarId || (gameState && gameState.selectedAvatarId) || 'fusion-panda';
            __playbackAvatar = activeAvatar;

            // Find or create playback UI (simple modal for clarity)
            let modal = document.getElementById('battle-playback-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'battle-playback-modal';
                modal.className = 'fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4';
                modal.innerHTML = `
                    <div class="max-w-4xl w-full cyber-card rounded-3xl overflow-hidden border border-red-500/50">
                        <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0f1117]">
                            <div>
                                <div class="text-xs tracking-[2px] text-red-400">AGENCY REPLAY</div>
                                <div class="text-2xl font-black">Accurate Battle Playback</div>
                            </div>
                            <button onclick="closeBattlePlayback()" class="text-2xl leading-none px-3 py-1 hover:text-red-400">&times;</button>
                        </div>
                        <div class="p-6 bg-black">
                            <div class="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative" id="playback-video-container">
                                <video id="playback-video" class="w-full h-full object-contain" playsinline></video>
                                <div id="playback-overlay" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div class="text-center text-white/60 text-sm">Loading agency clip...</div>
                                </div>
                            </div>
                            <div class="mt-4 text-xs text-gray-400" id="playback-status"></div>
                            <div class="mt-3 text-[10px] font-mono bg-[#11151f] p-3 rounded-xl max-h-32 overflow-auto" id="playback-log"></div>
                        </div>
                        <div class="px-6 py-4 border-t border-white/10 flex gap-2 bg-[#0f1117]">
                            <button onclick="playNextInLog()" class="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-sm font-bold">NEXT CLIP</button>
                            <button onclick="closeBattlePlayback()" class="px-4 py-2 rounded-xl border border-white/20 text-sm">CLOSE</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            __playbackQueue = attackLog.filter(e => e.isPlayer !== false); // focus player moves for demo; can include enemy if clips exist
            __playbackIndex = 0;
            __playbackVideoEl = document.getElementById('playback-video');
            __playbackLogEl = document.getElementById('playback-log');
            const container = document.getElementById('playback-video-container');
            const status = document.getElementById('playback-status');

            if (!__playbackVideoEl || !container || !status) return;

            __playbackLogEl.innerHTML = '';
            status.textContent = `Replaying ${__playbackQueue.length} player actions for ${activeAvatar} using agency clips.`;

            // Prepare first clip
            __playbackVideoEl.onended = playNextInLog;
            __playbackVideoEl.onerror = () => {
                status.textContent = 'Clip failed to load — using next.';
                setTimeout(playNextInLog, 400);
            };

            modal.classList.remove('hidden');
            modal.style.display = 'flex';

            playNextInLog(); // start
        }

        function playNextInLog() {
            const video = __playbackVideoEl;
            const logEl = __playbackLogEl;
            if (!video || !logEl || __playbackIndex >= __playbackQueue.length) {
                const status = document.getElementById('playback-status');
                if (status) status.textContent = 'Playback complete. All moves matched the attack log exactly.';
                return;
            }

            const entry = __playbackQueue[__playbackIndex];
            const activeA = __playbackAvatar || (gameState && gameState.selectedAvatarId) || 'fusion-panda';
            const clipSrc = getBattleClip( activeA , entry.moveId, entry.outcome );

            // Highlight in log
            const line = document.createElement('div');
            line.className = 'mb-0.5 text-emerald-300';
            line.innerHTML = `Turn ${entry.turn || (__playbackIndex+1)} • <span class="font-bold">${entry.moveName || entry.moveId}</span> → <span class="${entry.outcome==='hit'?'text-emerald-400':entry.outcome==='miss'?'text-amber-400':'text-sky-400'}">${entry.outcome.toUpperCase()}</span> ${entry.damage ? `(${entry.damage} DMG)` : ''}`;
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;

            video.src = clipSrc;
            video.play().catch(() => {
                // Fallback message
                const status = document.getElementById('playback-status');
                if (status) status.textContent = `Playing: ${entry.moveName} (${entry.outcome}) — (video may need user interaction)`;
            });

            __playbackIndex++;
        }

        function closeBattlePlayback() {
            const modal = document.getElementById('battle-playback-modal');
            if (modal) {
                const video = document.getElementById('playback-video');
                if (video) { video.pause(); video.src = ''; }
                modal.style.display = 'none';
            }
            __playbackQueue = [];
            __playbackIndex = 0;
        }

        // Expose for console / quick demo
        window.playAttackLogPlayback = playAttackLogPlayback;

        function recordAttackLog(battle, actor, move, outcome, damage, isPlayer) {
            if (!battle.attackLog) battle.attackLog = [];
            battle.attackLog.push({
                turn: battle.attackLog.length + 1,
                actor,
                moveId: move.id,
                moveName: move.name,
                outcome,
                damage: Math.max(0, Math.floor(damage)),
                isPlayer: !!isPlayer
            });
        }

        // ===== NEW: RESOLVE / EXECUTE WITH LIVE AGENCY VIDEO FOR PLAYER TURN =====
        // Resolves a specific move (or random) + outcome + dmg. Used by choice flow and simulate.
        function resolveBattleAction(avatarId, moveId, isSpecial = false) {
            const b = window.__activeBattle;
            const moves = getAvatarMoves(avatarId);
            let move = moveId ? moves.find(m => m.id === moveId) : null;
            if (!move) move = pickRandomMove(avatarId);

            // Full system: if selectedTactic present (from choice UI), use resolvePlayerTurn for RPS/element/speed/category/specialMeter/special spend
            const tactic = (b && b.selectedTactic) ? b.selectedTactic : null;
            if (b && tactic) {
                const isBlk = (move && move.id === 'block') || isSpecial === 'block';
                const res = resolvePlayerTurn(b, move, tactic, isBlk);
                // return shape compatible with callers (move, outcome, dmg, ...)
                return {
                    move,
                    outcome: res.outcome,
                    dmgMod: 1.0,
                    dmg: res.damage,
                    isSpecial: !!isSpecial || res.specialTriggered,
                    attackName: res.moveName || move.name,
                    elemMult: res.elemMult,
                    tacticName: res.tacticName,
                    specialTriggered: res.specialTriggered
                };
            }

            // Fallback legacy path (no tactic selected)
            const { outcome, dmgMod } = determineOutcome(move, isSpecial);
            const baseDmg = isSpecial
                ? Math.floor(Math.random() * 14) + (b ? b.playerBaseDamage + 12 : 18)
                : Math.floor(Math.random() * 10) + (b ? b.playerBaseDamage : 16);
            let dmg = Math.max(0, Math.floor(baseDmg * dmgMod));
            // light element fallback using getElementMultiplier if battle has elems
            if (b) {
                const em = getElementMultiplier(b.playerElement, b.enemyElement);
                dmg = Math.floor(dmg * em);
            }
            return {
                move,
                outcome,
                dmgMod,
                dmg,
                isSpecial: !!isSpecial,
                attackName: move.name || move.id
            };
        }

        // Apply the damage/result AFTER video (or immediately on fallback). Shows floating dmg, log (incl outcome), checks victory.
        function applyPlayerResult(resolved) {
            const b = window.__activeBattle;
            if (!b || b.ended) return false;
            const eCard = document.getElementById("battle-fighter-enemy");
            const pCard = document.getElementById("battle-fighter-player");
            const eFlash = document.getElementById("battle-flash-enemy");
            if (!eCard) return false;

            b.enemyCur = Math.max(0, b.enemyCur - resolved.dmg);
            __syncBattleHpBars();

            if (eCard) eCard.classList.add("battle-anim-shake");
            if (eFlash) eFlash.classList.add("battle-anim-flash--on", "battle-anim-flash--red");
            __spawnBattleFloatingDmg(eCard, resolved.dmg, resolved.isSpecial);

            const outcomeClass = resolved.outcome === 'hit' ? 'text-emerald-400' : (resolved.outcome === 'miss' ? 'text-amber-400' : 'text-sky-400');
            __appendBattleLogLine(
                resolved.isSpecial ? "text-fuchsia-300" : "text-emerald-300",
                `${__escapeBattleText(b.playerName)} used <span class="font-bold">${__escapeBattleText(resolved.attackName)}</span> <span class="text-white/60">→</span> <span class="font-mono ${outcomeClass}">${resolved.outcome.toUpperCase()}</span> <span class="font-mono">${resolved.dmg} DMG</span>`,
            );

            // Brief outcome badge overlay (cinematic result on video end)
            if (pCard) {
                const badge = document.createElement('div');
                badge.className = `battle-outcome-badge ${resolved.outcome==='hit' ? 'bg-emerald-500/90 text-white' : resolved.outcome==='miss' ? 'bg-amber-500/90 text-black' : 'bg-sky-400/90 text-black'}`;
                badge.textContent = resolved.outcome.toUpperCase();
                pCard.appendChild(badge);
                setTimeout(() => badge.remove(), 950);
            }

            // cleanup anims shortly
            setTimeout(() => {
                if (eCard) eCard.classList.remove("battle-anim-shake");
                if (eFlash) eFlash.classList.remove("battle-anim-flash--on", "battle-anim-flash--red");
                const beam = document.getElementById("battle-beam");
                if (beam) beam.classList.remove("battle-beam--to-enemy", "battle-beam--special");
                if (pCard) pCard.classList.remove("battle-anim-attack-left");
            }, 420);

            if (b.enemyCur <= 0) {
                b.ended = true;
                b.enemyCur = 0;
                __syncBattleHpBars();
                if (eCard) {
                    eCard.classList.add("battle-fighter--defeated");
                    eCard.setAttribute("aria-hidden", "true");
                }
                const stage = document.getElementById("battle-stage");
                if (stage) stage.classList.add("battle-stage--victory");
                __appendBattleLogLine(
                    "text-amber-300 font-bold border-t border-amber-500/20 pt-2 mt-1",
                    `🏆 VICTORY! ${__escapeBattleText(b.enemyName)} defeated! ${b.enemySubtitle ? '— ' + __escapeBattleText(b.enemySubtitle) : ''} +650 XP`,
                );
                showToast("Battle won! +650 XP earned", "success");
                bumpLifetimeEarnedXp(650);
                gameState.xp += 650;
                if (gameState.xp >= 10000) {
                    gameState.level++;
                    gameState.xp = gameState.xp % 10000;
                    setTimeout(showLevelUp, 1200);
                }
                saveGameState();
                updateDashboard();

                setTimeout(() => {
                    if (typeof window.showInArenaCinematic === 'function') {
                        window.showInArenaCinematic(b);
                    } else if (typeof window.showVictoryCinematic === 'function') {
                        window.showVictoryCinematic(b);
                    }
                }, 650);
                return true; // ended
            }
            return false;
        }

        // Enemy turn logic — ENHANCED for awesome "being attacked" moments.
        // Uses existing beams/shakes/floating-dmg + strong block shield visuals when player chose block/tactic defense.
        // Full RPS elem (via enemyRes) + mitigation bonuses from player's tactic choice applied inside resolveEnemyTurn.
        // Logs everything including enemy elem RPS + mitigation.
        function doEnemyTurn() {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            const pCard = document.getElementById("battle-fighter-player");
            const eCard = document.getElementById("battle-fighter-enemy");
            const pFlash = document.getElementById("battle-flash-player");
            const beam = document.getElementById("battle-beam");
            if (!pCard || !eCard) return;

            const roundEl = document.getElementById("battle-round");

            // Use full resolver (passes last player tactic for mitigation counters + RPS fairness)
            const playerTac = b.selectedTactic || (b.lastPlayerTactic) || null;
            const enemyRes = resolveEnemyTurn(b, playerTac);

            const enemyAttack = enemyRes.moveName || 'ENEMY STRIKE';
            let enemyDmg = enemyRes.damage || 0;

            const wasBlocking = !!b.playerIsBlocking || (playerTac && (playerTac.category === 'block' || playerTac.category === 'defense'));
            const strongMit = wasBlocking && enemyRes.mitApplied && enemyRes.mitApplied < 0.85;

            eCard.classList.add("battle-anim-attack-right");
            __resetBeam(beam);
            if (beam) {
                // Color beam by enemy element for awesome variety (reuse existing battle-beam styles)
                const eEl = (enemyRes.enemyElement || b.enemyElement || 'Dark').toLowerCase();
                let beamColor = "linear-gradient(90deg, #f43f5e, #a855f7, #10b981)"; // default red-purple
                if (eEl.includes('dark')) beamColor = "linear-gradient(90deg, #6366f1, #4c1d95, #a78bfa)";
                else if (eEl.includes('electric')) beamColor = "linear-gradient(90deg, #eab308, #f59e0b, #67e8f9)";
                else if (eEl.includes('crystal')) beamColor = "linear-gradient(90deg, #67e8f9, #0ea5e9, #64748b)";
                else if (eEl.includes('arcane')) beamColor = "linear-gradient(90deg, #c026ff, #7c3aed, #a78bfa)";
                else if (eEl.includes('fusion')) beamColor = "linear-gradient(90deg, #22d3ee, #10b981, #f43f5e)";
                beam.style.background = beamColor;
                beam.classList.add("battle-beam--to-player");
                if (strongMit) beam.style.opacity = '0.6'; // subdued on strong block
            }

            // Use setTimeout chain (keeps simple)
            setTimeout(() => {
                if (b.ended) return;
                // HP mutated inside resolver; sync
                __syncBattleHpBars();

                // AWESOME RECEIVING: stronger/more dramatic shake on player when attacked
                if (pCard) {
                    pCard.classList.add("battle-anim-shake");
                    if (strongMit) {
                        // lighter visual feedback on successful defense
                        pCard.style.filter = 'saturate(0.7) brightness(1.05)';
                    }
                }
                if (pFlash) pFlash.classList.add("battle-anim-flash--on", "battle-anim-flash--emerald");

                // Floating dmg: use existing, but slightly larger / colored hint on block mitigation
                __spawnBattleFloatingDmg(pCard, enemyDmg, false);
                if (enemyDmg > 0 && wasBlocking && pCard) {
                    const fd = pCard.querySelector('.battle-dmg:last-child');
                    if (fd) fd.style.color = '#67e8f9';
                }

                let logText = `${__escapeBattleText(b.enemyName)}: <span class="font-bold">${enemyAttack}</span> <span class="text-white/60">→</span> <span class="font-mono text-white">${enemyDmg} DMG</span>`;
                if (enemyRes && enemyRes.elemMult && enemyRes.elemMult !== 1.05) logText += ` <span class="text-[10px] text-amber-300">(${enemyRes.elemMult.toFixed(2)}x ${enemyRes.enemyElement || ''} RPS)</span>`;
                if (wasBlocking) logText += ' <span class="text-sky-400 text-[10px]">(MITIGATED by your ' + (playerTac ? playerTac.name : 'BLOCK') + ')</span>';
                if (enemyRes && enemyRes.tacticName) logText += ` <span class="text-[10px] text-gray-500">[${enemyRes.tacticName}]</span>`;
                __appendBattleLogLine("text-rose-300", logText);

                // BLOCK SHIELD VISUAL — enhanced + prominent when player chose block/tactic defense. Stays during the hit shake for "awesome being attacked" defense moment
                let shieldEl = null;
                if (wasBlocking && pCard) {
                    shieldEl = pCard.querySelector('.battle-block-shield');
                    if (!shieldEl) {
                        shieldEl = document.createElement('div');
                        shieldEl.className = 'battle-block-shield' + (strongMit ? ' battle-block-shield--strong' : '');
                        pCard.appendChild(shieldEl);
                    } else if (strongMit) {
                        shieldEl.classList.add('battle-block-shield--strong');
                    }
                }
                // NOTE (no enemy agency clips): For a simple future "defend" clip on enemy side, one could play a generic brace or {enemyId}_block.mp4 before the beam impact. Currently we enhance *receiving* (player side) via CSS animations + beams + shields for polish and "being attacked" awesomeness.

                setTimeout(() => {
                    if (eCard) eCard.classList.remove("battle-anim-attack-right");
                    if (pCard) {
                        pCard.classList.remove("battle-anim-shake");
                        pCard.style.filter = '';
                    }
                    if (pFlash) pFlash.classList.remove("battle-anim-flash--on", "battle-anim-flash--emerald");
                    if (beam) {
                        beam.classList.remove("battle-beam--to-player");
                        beam.style.opacity = '';
                    }
                    if (shieldEl) shieldEl.remove();
                    b.playerIsBlocking = false;

                    if (b.playerCur <= 0) {
                        b.ended = true;
                        b.playerCur = 0;
                        __syncBattleHpBars();
                        if (pCard) {
                            pCard.classList.add("battle-fighter--defeated");
                            pCard.setAttribute("aria-hidden", "true");
                        }
                        const stage = document.getElementById("battle-stage");
                        if (stage) stage.classList.add("battle-stage--defeat");
                        __appendBattleLogLine(
                            "text-rose-300 font-bold border-t border-rose-500/20 pt-2 mt-1",
                            `💀 DEFEAT! ${__escapeBattleText(b.playerName)} was overpowered by ${__escapeBattleText(b.enemyName)}! ${b.enemySubtitle ? '— ' + __escapeBattleText(b.enemySubtitle) : ''}`,
                        );
                        setTimeout(() => {
                            if (typeof window.showInArenaFailureCinematic === 'function') {
                                window.showInArenaFailureCinematic(b);
                            } else if (typeof window.showFailureCinematic === 'function') {
                                window.showFailureCinematic(b);
                            }
                        }, 600);
                        return;
                    }

                    // Next round re-enable (legacy + new flow)
                    b.round = (b.round || 1) + 1;
                    if (roundEl) roundEl.textContent = String(b.round);
                    const actionBtns = document.querySelectorAll('#battle-actions .battle-move-btn');
                    actionBtns.forEach(btn => { btn.disabled = false; });
                    if (typeof setBattleControlsEnabled === 'function') {
                        try { setBattleControlsEnabled(true); } catch(e){}
                    }
                    if (typeof clearBattleSelections === 'function' && window.__activeBattle && !window.__activeBattle.selectedMove) {
                        try { clearBattleSelections(); } catch(e){}
                    }
                }, 520);  // slightly extended for awesome impact feel
            }, 160);
        }

        // Play the agency video clip live in #player-action-video for the player's executed move.
        // On ended: apply result + proceed to enemy turn. Graceful fallback if no clip or play fails.
        function playPlayerAgencyVideo(avatarId, resolved) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;

            const pCard = document.getElementById("battle-fighter-player");
            const emojiEl = document.getElementById("battle-emoji-player");
            const videoEl = document.getElementById("player-action-video");
            const refImg = document.getElementById('player-avatar-ref');
            const beam = document.getElementById("battle-beam");

            if (!videoEl || !emojiEl || !pCard) {
                // Fallback: no video support — use classic immediate result + enemy
                const endedEarly = applyPlayerResult(resolved);
                if (!endedEarly) setTimeout(doEnemyTurn, 520);
                return;
            }

            // Prep cinematic: optional beam (visual cue), lunge hint (subtle while clip plays)
            pCard.classList.add("battle-anim-attack-left");
            __resetBeam(beam);
            if (beam) {
                beam.style.background = resolved.isSpecial
                    ? "linear-gradient(90deg, #a855f7, #e879f9, #f43f5e)"
                    : "linear-gradient(90deg, #10b981, #2dd4bf, #a855f7)";
                if (resolved.isSpecial) beam.classList.add("battle-beam--special");
                beam.classList.add("battle-beam--to-enemy");
            }

            // Contextually show video, hide emoji + static avatar ref image (update fighter to video)
            emojiEl.style.display = "none";
            if (refImg) refImg.style.display = 'none';
            videoEl.style.display = "block";
            videoEl.classList.add("playing");

            const clipSrc = getBattleClip(avatarId, resolved.move.id, resolved.outcome);
            videoEl.src = clipSrc;

            // Poster for avatars that have matching jpg (lich-queen, red-panda)
            if (avatarId === 'lich-queen' || avatarId === 'red-panda') {
                try {
                    const basePoster = clipSrc.replace(/\.mp4$/, '.jpg');
                    videoEl.poster = basePoster;
                } catch(e){}
            }
            videoEl.playbackRate = 1.2; // faster cinematic pace as requested

            let fellBack = false;
            const cleanupVideo = () => {
                videoEl.pause();
                videoEl.src = '';
                videoEl.style.display = 'none';
                videoEl.classList.remove("playing");
                // restore contextual: prefer avatar image (ref) if loaded, else emoji
                const hasRef = !!(refImg && refImg.getAttribute('src'));
                if (hasRef && refImg) { refImg.style.display = ''; if (emojiEl) emojiEl.style.display = 'none'; }
                else { if (emojiEl) emojiEl.style.display = ''; if (refImg) refImg.style.display = 'none'; }
            };

            const onVideoEnd = () => {
                if (fellBack) return;
                videoEl.removeEventListener('ended', onVideoEnd);
                videoEl.onerror = null;
                cleanupVideo();
                const victory = applyPlayerResult(resolved);
                if (!victory) {
                    // brief pause then enemy turn (plays along)
                    setTimeout(doEnemyTurn, 380);
                }
            };

            const doFallback = (reason) => {
                if (fellBack) return;
                fellBack = true;
                console.warn('[Battle] Agency video fallback:', reason, 'for', avatarId, resolved.move.id, resolved.outcome);
                cleanupVideo();
                const rImg = document.getElementById('player-avatar-ref');
                const eEl = document.getElementById("battle-emoji-player");
                const hasR = !!(rImg && rImg.getAttribute('src'));
                if (hasR && rImg) { rImg.style.display = ''; if (eEl) eEl.style.display = 'none'; }
                else { if (eEl) eEl.style.display = ''; if (rImg) rImg.style.display = 'none'; }
                const victory = applyPlayerResult(resolved);
                if (!victory) setTimeout(doEnemyTurn, 220);
            };

            videoEl.addEventListener('ended', onVideoEnd, { once: true });
            videoEl.onerror = () => doFallback('onerror (clip missing or load fail)');

            videoEl.play().catch((e) => doFallback('play() rejected: ' + (e && e.message || e)));
        }

        // Execute a chosen player move (from choice buttons): resolve then play video live, results on ended.
        function playerExecuteMove(moveId, isSpecial = false) {
            const b = window.__activeBattle;
            const logEl = document.getElementById("battle-log");
            if (!logEl || !b || b.ended) return;
            const actionBtns = document.querySelectorAll('#battle-actions .battle-move-btn');
            actionBtns.forEach(btn => { btn.disabled = true; });

            const activeAvatarId = (gameState && gameState.selectedAvatarId) || b.championAvatarId || 'fusion-panda';
            const resolved = resolveBattleAction(activeAvatarId, moveId, isSpecial);

            // Record immediately (for logs/replay even if video aborts)
            recordAttackLog(b, b.playerName, resolved.move, resolved.outcome, resolved.dmg, true);

            // Trigger live video play (on ended will show result + enemy)
            playPlayerAgencyVideo(activeAvatarId, resolved);
        }

        // Execute BLOCK choice (defend stance). Shows shield overlay, no agency clip (pure defense), proceeds to enemy turn.
        function playerExecuteBlock(element) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            const actionBtns = document.querySelectorAll('#battle-actions .battle-move-btn');
            actionBtns.forEach(btn => { btn.disabled = true; });

            b.playerIsBlocking = true;

            const pCard = document.getElementById("battle-fighter-player");
            if (pCard) {
                let shield = pCard.querySelector('.battle-block-shield');
                if (!shield) {
                    shield = document.createElement('div');
                    // Use strong visual for dedicated BLOCK choice
                    shield.className = 'battle-block-shield battle-block-shield--strong';
                    pCard.appendChild(shield);
                }
                // Auto fade the initial shield after a moment (re-added/enhanced + dramatic in enemy turn when hit while blocking)
                setTimeout(() => { if (shield && shield.parentNode) shield.parentNode.removeChild(shield); }, 1250);
            }

            __appendBattleLogLine("text-sky-300", `${__escapeBattleText(b.playerName)} chooses to BLOCK — bracing with defensive stance.`);

            // Short wind-up then enemy attacks (with mitigation + shield)
            setTimeout(() => {
                if (!b.ended) doEnemyTurn();
            }, 380);
        }

        // ===== NEW FULLY TURN-BASED EXECUTE + CHOICE WIRING (redesign per spec) =====
        // Uses gameState.selectedAvatarId -> full avatar (moves + tacticDeck)
        // Initializes in __create + start with specialMeter:0 , playerCurHp, enemyCurHp, currentTurn:1, selected*:null , isPlayerTurn:true , playerName from avatar.
        // Choice buttons: e.g. battle.selectedMove = move; battle.selectedTactic = tactic; (highlights)
        // executePlayerTurn() called by EXECUTE TURN: handles block special, resolve (using other agent mechanics + RPS + speed + energyMult + special bonus), play video (player-action-video), detailed log, specialMeter += tactic.specialCharge, auto resolveEnemy (with __battleWait), HP, win/loss, reset selections, inc turn.
        // Block: high mitigation + defensive clip (or fallback), treat as low/no dmg move, outcome block.
        // Special meter bonus if special move chosen + meter high.
        // Replay works on full enriched attackLog.

        function updateBattleSpecialMeterDisplay() {
            const b = window.__activeBattle;
            const el = document.getElementById('battle-special-meter');
            if (el && b) el.textContent = (b.specialMeter || 0);
            // Also sync the new UI bar/val if present (dual meter support)
            const valEl = document.getElementById('special-meter-val');
            const barEl = document.getElementById('special-meter-bar');
            if (b && valEl && barEl) {
                const max = b.maxSpecialMeter || 10;
                const cur = Math.max(0, Math.min(max, b.specialMeter || 0));
                valEl.textContent = `${cur}/${max}`;
                const pct = Math.round((cur / max) * 100);
                barEl.style.width = pct + '%';
                // AWESOME: special energized flash when meter fills (or hits high threshold)
                const prev = parseFloat(barEl.dataset.lastPct || '0');
                if (cur >= max || (cur >= Math.floor(max * 0.9) && cur > (prev / 100 * max))) {
                    barEl.classList.add('energized');
                    const meterWrap = barEl.parentElement;
                    if (meterWrap) {
                        meterWrap.classList.add('special-meter-energized');
                        // brief badge
                        let badge = meterWrap.querySelector('.special-energized-badge');
                        if (!badge) {
                            badge = document.createElement('div');
                            badge.className = 'special-energized-badge';
                            badge.textContent = 'ENERGIZED!';
                            meterWrap.appendChild(badge);
                        }
                        setTimeout(() => {
                            if (barEl) barEl.classList.remove('energized');
                            if (meterWrap) meterWrap.classList.remove('special-meter-energized');
                            if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
                        }, 1650);
                    }
                }
                barEl.dataset.lastPct = pct;
            }
        }

        // ===== LEGACY OLD IMPLEMENTATIONS (now delegated to the incredible new versions in the post-startDemoBattle section) =====
        // These shims prevent redeclaration errors and keep any stray calls working. All real logic + UI is in the beautiful new fns (updateExecuteBtn, select* , executePlayerTurn using the exact template grids).
        function clearBattleSelections() { if (typeof resetBattleSelections === 'function') resetBattleSelections(true); else { const b=window.__activeBattle; if(b){b.selectedAction=b.selectedMove=b.selectedTactic=null;} } }
        function updateExecuteEnabledState() { if (typeof updateExecuteBtn === 'function') updateExecuteBtn(); }
        function selectBattleMove(moveIdOrObj) { if (typeof window.selectBattleMove === 'function') return window.selectBattleMove(moveIdOrObj); /* fallback */ const b=window.__activeBattle; if(!b)return; const moves=(b.moves&&b.moves.length)?b.moves:getAvatarMoves(b.championAvatarId||'fusion-panda'); b.selectedMove = (typeof moveIdOrObj==='string' ? moves.find(m=>m.id===moveIdOrObj) : moveIdOrObj) || moveIdOrObj; if(typeof updateBattleSelectionsUI==='function')updateBattleSelectionsUI(); }
        function selectBattleTactic(tacticIdOrObj) { if (typeof window.selectBattleTactic === 'function') return window.selectBattleTactic(tacticIdOrObj); const b=window.__activeBattle; if(!b)return; b.selectedTactic=(typeof tacticIdOrObj==='string'?(b.tacticDeck||[]).find(t=>t.id===tacticIdOrObj):tacticIdOrObj)||tacticIdOrObj; if(typeof updateBattleSelectionsUI==='function')updateBattleSelectionsUI(); }
        function setBattleControlsEnabled(enabled) { if (typeof disableBattleUIForResolution === 'function') disableBattleUIForResolution(!enabled); }
        function resetBattleSelections(alsoClearAction) { if (typeof window.resetBattleSelections === 'function') window.resetBattleSelections(!!alsoClearAction); }
        async function executePlayerTurn() { if (typeof window.executePlayerTurn === 'function') return window.executePlayerTurn(); /* fallback toast */ showToast('Battle controls ready — use the EXECUTE button in arena.', 'info'); }

        // (Legacy resolvePlayerTurnWithTactic / playPlayerAction... / old helpers remain below for any internal calls; modern execute uses the primary resolvePlayerTurn + playPlayerActionVideoForTurn.)

        // Resolve incorporating tactic mechanics (RPS from other agent, speed, energyMult, special, block)
        function resolvePlayerTurnWithTactic(battle, avatarId, move, tactic) {
            const base = resolveBattleAction(avatarId, move.id, move.type === 'special');
            let outcome = base.outcome;
            let dmg = base.dmg;
            let specialGain = tactic.specialCharge || 0;
            let rpsNote = '';
            let specialNote = '';

            const rivalElem = getRivalElement(battle.enemyId);
            const rpsMult = getRpsMultiplier(tactic.element || 'Fusion', rivalElem);
            if (rpsMult > 1.05) rpsNote = 'RPS advantage';
            else if (rpsMult < 0.95) rpsNote = 'RPS disadvantage';

            if (tactic.category === 'block' || tactic.category === 'defense') {
                // Block: no damage move, outcome always "block" or high chance, defensive clip
                outcome = 'block';
                dmg = Math.max(0, Math.floor(dmg * 0.18));
                specialGain = Math.max(specialGain, 2);
            } else {
                // Apply tactic speedMod bias, energyMult, RPS
                let adjustedDmg = Math.floor(dmg * (tactic.energyMult || 1) * rpsMult);
                // speed affects outcome odds slightly (re-roll bias)
                if ((tactic.speedMod || 0) > 0 && outcome === 'miss' && Math.random() < 0.4) {
                    outcome = 'hit';
                    adjustedDmg = Math.floor(adjustedDmg * 0.7);
                }
                if ((tactic.speedMod || 0) < 0 && outcome === 'hit' && Math.random() < 0.25) {
                    outcome = 'block';
                }
                dmg = Math.max(0, adjustedDmg);

                // Special meter bonus if special move + meter high
                if (move.type === 'special' && (battle.specialMeter || 0) >= 5) {
                    dmg = Math.floor(dmg * 1.28);
                    specialNote = '+SPECIAL METER BONUS';
                }
            }

            return {
                move,
                outcome,
                damage: dmg,
                specialGain,
                rpsNote,
                specialNote,
                isBlockAction: (tactic.category === 'block' || tactic.category === 'defense')
            };
        }

        // Play video for the player action (block uses *_block clip via outcome). Uses existing player video elem.
        async function playPlayerActionVideoForTurn(avatarId, moveId, outcome, tactic) {
            const videoEl = document.getElementById('player-action-video');
            const emojiEl = document.getElementById('battle-emoji-player');
            const overlay = document.getElementById('battle-resolving-overlay');
            const pCard = document.getElementById('battle-fighter-player');

            if (!videoEl) {
                await __battleWait(1400);
                return;
            }

            // Determine clip move for video: for block use a suitable move's *_block clip (defensive agency feel, keeps using existing arena clips)
            let vidMoveId = moveId;
            let vidOutcome = outcome;
            if (!vidMoveId || vidMoveId === 'block' || outcome === 'block') {
                vidOutcome = 'block';
                const b = window.__activeBattle;
                const moves = (b && (b.moves || getAvatarMoves(b.championAvatarId))) || [];
                // Prefer a melee or first for visual "impact block"
                const pref = moves.find(m => m.type === 'melee') || moves.find(m => m.id && m.id.includes('slam')) || moves[0];
                vidMoveId = (pref && pref.id) || 'rift_slam';
            }

            const clipSrc = getBattleClip(avatarId, vidMoveId, vidOutcome);

            if (overlay) overlay.classList.remove('hidden');
            if (emojiEl) emojiEl.style.display = 'none';
            if (pCard) pCard.classList.add('battle-anim-attack-left'); // subtle while playing

            videoEl.style.display = 'block';
            videoEl.src = clipSrc;
            if (avatarId === 'lich-queen' || avatarId === 'red-panda') {
                try { videoEl.poster = clipSrc.replace(/\.mp4$/, '.jpg'); } catch(e){}
            }
            videoEl.playbackRate = 1.15;

            try {
                await videoEl.play();
                await new Promise(r => {
                    const done = () => { videoEl.removeEventListener('ended', done); r(); };
                    videoEl.addEventListener('ended', done, {once: true});
                    setTimeout(r, 6200); // safety max
                });
            } catch(e) {
                await __battleWait(1400);
            }

            videoEl.pause();
            videoEl.style.display = 'none';
            if (pCard) pCard.classList.remove('battle-anim-attack-left');
            if (emojiEl) emojiEl.style.display = '';
            if (overlay) overlay.classList.add('hidden');

            await __battleWait(120);
        }

        // Auto enemy after player (uses existing doEnemyTurn base but integrates mitigation from selectedTactic, and __battleWait)
        async function resolveEnemyTurnWithMitigation(battle, lastTactic) {
            // set block flag for the existing enemy logic if defensive tactic
            if (lastTactic && (lastTactic.category === 'block' || lastTactic.category === 'defense')) {
                battle.playerIsBlocking = true;
            }
            // delegate to *enhanced* doEnemyTurn (full RPS from enemy tactic sim using rival element + player choice bonuses for enemy dmg mitigation + awesome receiving anims + block shield)
            await __battleWait(120);
            doEnemyTurn();
            // the internal setTimeouts in doEnemyTurn drive the rest; give headroom for beam/shake/shield/floating dmg + logs
            await __battleWait(920);
        }

        // Initialize / wire the choice buttons in #battle-actions for the new flow.
        // Called from startDemoBattle after render.
        function initBattleChoicesAndControls() {
            const container = document.getElementById('battle-actions');
            const b = window.__activeBattle;
            if (!container || !b) return;

            const avatar = b.playerAvatar || getBattleAvatar(b);
            const moves = (avatar && avatar.moves) || getAvatarMoves(avatar.id);
            const tactics = (avatar && avatar.tacticDeck) || getAvatarTacticDeck(avatar);

            container.innerHTML = `
                <div class="text-xs uppercase tracking-widest text-emerald-400/80 mb-1">CHOOSE MOVE</div>
                <div id="battle-move-choices" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3"></div>

                <div class="text-xs uppercase tracking-widest text-amber-400/80 mb-1">CHOOSE TACTIC <span class="normal-case text-[10px] text-gray-500">(use Block for high mitigation)</span></div>
                <div id="battle-tactic-choices" class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4"></div>

                <div class="flex flex-wrap items-center justify-center gap-3">
                    <button id="battle-execute-btn" disabled
                        class="px-8 py-3 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-400 transition-colors rounded-2xl font-black flex items-center gap-x-2 min-w-[12rem] justify-center">
                        <span>EXECUTE TURN</span> <i class="fas fa-play" aria-hidden="true"></i>
                    </button>
                    <button type="button" onclick="if (window.__activeBattle && window.__activeBattle.attackLog && window.__activeBattle.attackLog.length) { const av = (gameState && gameState.selectedAvatarId) || window.__activeBattle.championAvatarId || 'fusion-panda'; playAttackLogPlayback(window.__activeBattle.attackLog, av); } else { showToast('Fight a battle first!', 'info'); }"
                        class="px-4 py-2.5 text-xs border border-cyan-400/70 text-cyan-300 hover:bg-cyan-500/10 rounded-2xl font-bold flex items-center gap-x-1.5">
                        <span>REPLAY FULL LOG</span> <i class="fas fa-film"></i>
                    </button>
                </div>
            `;

            const mCont = document.getElementById('battle-move-choices');
            if (mCont) {
                mCont.innerHTML = '';
                (moves || []).forEach(move => {
                    const btn = document.createElement('button');
                    btn.className = 'text-left p-2.5 rounded-2xl border border-gray-600 hover:border-emerald-400 bg-[#11151f] transition-all text-xs';
                    btn.dataset.moveId = move.id;
                    btn.innerHTML = `<div class="font-bold text-emerald-200">${__escapeBattleText(move.name)}</div><div class="text-[9px] text-gray-400 line-clamp-2">${__escapeBattleText(move.desc || '')}</div><div class="text-[8px] mt-0.5 opacity-70">${(move.type||'').toUpperCase()}</div>`;
                    btn.onclick = () => selectBattleMove(move);
                    mCont.appendChild(btn);
                });
            }

            const tCont = document.getElementById('battle-tactic-choices');
            if (tCont && tactics && tactics.length) {
                tCont.innerHTML = '';
                tactics.forEach(tac => {
                    const isBlk = tac.category === 'block';
                    const btn = document.createElement('button');
                    btn.className = `text-left p-2 rounded-2xl border ${isBlk ? 'border-sky-400/70 hover:border-sky-400' : 'border-gray-600 hover:border-amber-400'} bg-[#11151f] transition-all text-xs`;
                    btn.dataset.tacticId = tac.id;
                    btn.innerHTML = `<div class="font-bold ${isBlk ? 'text-sky-300' : 'text-amber-200'}">${__escapeBattleText(tac.name)}${isBlk ? ' <span class="text-[8px] align-super px-1 bg-sky-500/30 rounded">BLOCK</span>' : ''}</div><div class="text-[9px] text-gray-400">${__escapeBattleText(tac.bonusDesc || tac.element)}</div>`;
                    btn.onclick = () => selectBattleTactic(tac);
                    tCont.appendChild(btn);
                });
            }

            const execBtn = document.getElementById('battle-execute-btn');
            if (execBtn) {
                execBtn.onclick = () => { executePlayerTurn(); };
            }

            // initial state
            clearBattleSelections();
            updateBattleSpecialMeterDisplay();
            updateExecuteEnabledState();
        }

        function renderAvatarDirector() {
            const container = document.getElementById('avatar-director');
            if (!container) return;
            const av = getCurrentAvatar();
            const lvl = getAvatarLevel(av.id);
            const stage = getEquippedStage(av.id);
            const path = getAvatarOutfitPath(av.id);
            const bonus = getAvatarBonus(av.id);
            const bonusText = `+${Math.round(bonus.powerMult * 100)}% power${bonus.critExtra > 0.01 ? ' • +' + Math.round(bonus.critExtra*100) + '% crit' : ''}${bonus.ritualExtra > 0.01 ? ' • ritual boost' : ''}`;

            container.innerHTML = `
                <img src="${path}" alt="${av.name}">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-x-2">
                        <span class="font-bold" style="color:${av.color}">${av.name}</span>
                        <span class="text-[10px] px-1.5 py-px rounded bg-white/5 text-gray-400">LVL ${lvl}</span>
                        <span class="text-[10px] px-1.5 py-px rounded" style="background:${av.color}20; color:${av.color}">${getStageLabel(av.id, stage)}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-0.5 truncate">${av.title} • overseeing fusions</div>
                    <div class="director-bonus mt-0.5">${bonusText}</div>
                </div>
                <div class="text-right">
                    <div class="text-[10px] text-violet-400">MANAGE</div>
                    <i class="fas fa-chevron-right text-violet-400"></i>
                </div>
            `;

            // Also update the mini in upgrades section if present
            const mini = document.getElementById('upgrades-avatar-mini');
            if (mini) {
                mini.innerHTML = `<span style="color:${av.color}">${av.name}</span> • LVL <span class="font-mono">${lvl}</span> • ${getStageLabel(av.id, stage)} <span class="text-emerald-400 font-mono">+${Math.round(bonus.powerMult * 100)}%</span>`;
            }
        }

        function renderProfile() {
            // Hero
            const hero = document.getElementById('active-avatar-hero');
            if (hero) {
                const av = getCurrentAvatar();
                const lvl = getAvatarLevel(av.id);
                const stage = getEquippedStage(av.id);
                const path = getAvatarOutfitPath(av.id);
                const bonus = getAvatarBonus(av.id);
                const nextThreshold = Object.values(av.levelThresholds).find(t => t > lvl) || (lvl + 5);

                hero.innerHTML = `
                    <div class="flex flex-col md:flex-row gap-5 items-start">
                        <div class="flex-shrink-0">
                            <img src="${path}" alt="${av.name}" class="avatar-portrait large rounded-2xl border border-white/10" style="max-width: 260px; width:100%">
                            <div class="mt-2 flex gap-1.5">
                                ${Object.keys(av.outfitStages).map(st => {
                                    const isActive = st === stage;
                                    const unlocked = lvl >= (av.levelThresholds[st] || 1);
                                    return `<img src="assets/avatars/${av.outfitStages[st]}" class="outfit-thumb ${isActive ? 'active' : ''} ${!unlocked ? 'opacity-40' : ''}" onclick="previewOutfit('${av.id}', '${st}')" title="${getStageLabel(av.id, st)}${!unlocked ? ' (locked)' : ''}">`;
                                }).join('')}
                            </div>
                        </div>
                        <div class="flex-1 pt-1">
                            <div class="flex items-center gap-x-3 flex-wrap">
                                <span class="text-3xl font-black" style="color:${av.color}">${av.name}</span>
                                <span class="px-3 py-1 text-xs rounded-full font-bold" style="background:${av.color}15; color:${av.color}">${av.title}</span>
                                <span class="ml-auto text-xs px-2 py-1 bg-white/5 rounded">LEVEL <span class="font-mono text-lg align-middle">${lvl}</span></span>
                            </div>
                            <div class="mt-1 text-sm text-gray-400">${getStageLabel(av.id, stage)} — ${av.element} specialist</div>

                            <div class="mt-3 text-sm leading-snug text-gray-200">${av.bio}</div>

                            <div class="mt-3 text-xs">
                                <span class="font-semibold text-gray-300">CURRENT BONUSES</span><br>
                                ${av.bonuses.map(b => `• ${b}`).join('<br>')}
                                <div class="mt-1 text-emerald-400 font-mono">Active power multiplier: +${Math.round(bonus.powerMult*100)}%</div>
                            </div>

                            <div class="mt-4 flex flex-wrap gap-2">
                                <button onclick="developAvatar('${av.id}')" class="px-5 py-2 rounded-2xl bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black text-sm font-bold flex items-center gap-x-2 hover:brightness-105 active:scale-[0.985]">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>DEVELOP (LVL ${lvl} → ${lvl+1})</span>
                                </button>
                                <button onclick="navigateTo('upgrades')" class="px-4 py-2 rounded-2xl border border-white/20 text-xs hover:bg-white/5">OPEN UPGRADES</button>
                            </div>
                            <div class="text-[10px] text-gray-500 mt-2">Next outfit milestone at level ${nextThreshold}</div>
                        </div>
                    </div>
                `;
            }

            // Grid of 3 choice cards
            const grid = document.getElementById('avatar-grid');
            if (!grid) return;
            grid.innerHTML = '';

            PLAYER_AVATARS.forEach(av => {
                const lvl = getAvatarLevel(av.id);
                const isActive = (gameState.selectedAvatarId === av.id);
                const stage = getEquippedStage(av.id);
                const path = getAvatarOutfitPath(av.id);

                const card = document.createElement('div');
                card.className = `avatar-card cyber-card rounded-3xl p-4 border ${isActive ? 'active border-emerald-400' : 'border-gray-700'} cursor-pointer flex flex-col`;
                card.innerHTML = `
                    <div class="relative">
                        <img src="${path}" alt="${av.name}" class="avatar-portrait rounded-2xl mb-3">
                        ${isActive ? `<div class="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold bg-emerald-400 text-black rounded">ACTIVE</div>` : ''}
                    </div>
                    <div class="font-bold text-lg" style="color:${av.color}">${av.name}</div>
                    <div class="text-xs -mt-0.5 mb-2" style="color:${av.color}80">${av.title}</div>
                    <div class="flex items-center gap-x-2 text-xs mb-2">
                        <span class="px-2 py-px bg-white/5 rounded">LVL ${lvl}</span>
                        <span class="px-2 py-px rounded" style="background:${av.color}20; color:${av.color}">${getStageLabel(av.id, stage)}</span>
                    </div>
                    <div class="text-xs text-gray-400 line-clamp-3 flex-1">${av.bio.substring(0, 140)}...</div>
                    <div class="mt-3 flex gap-2">
                        <button onclick="event.stopImmediatePropagation(); selectAvatar('${av.id}');" class="flex-1 text-xs py-1.5 rounded-xl border ${isActive ? 'border-emerald-400 text-emerald-400' : 'border-gray-600 hover:border-gray-400'} font-medium">SELECT</button>
                        <button onclick="event.stopImmediatePropagation(); developAvatar('${av.id}');" class="flex-1 text-xs py-1.5 rounded-xl bg-white/5 hover:bg-white/10 font-medium">DEVELOP</button>
                    </div>
                `;
                card.onclick = () => selectAvatar(av.id);
                grid.appendChild(card);
            });
        }

        function previewOutfit(avatarId, stage) {
            // Temporarily swap hero image for preview (does not persist)
            const hero = document.getElementById('active-avatar-hero');
            if (!hero) return;
            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            if (!av) return;
            const img = hero.querySelector('img.avatar-portrait');
            if (img) {
                img.src = `assets/avatars/${av.outfitStages[stage]}`;
                img.style.outline = '2px dashed #64748b';
                setTimeout(() => { if (img) img.style.outline = ''; }, 1400);
            }
            // also toast
            showToast(`Preview: ${getStageLabel(avatarId, stage)}`, 'info');
        }

        function selectAvatar(avatarId) {
            if (!PLAYER_AVATARS.some(a => a.id === avatarId)) return;
            gameState.selectedAvatarId = avatarId;
            saveGameState();
            renderProfile();
            renderAvatarDirector();
            updateDashboard();
            showToast(`Now developing with ${getCurrentAvatar().name}`, 'success');
        }

        function developAvatar(avatarId) {
            if (!gameState.avatarLevels) gameState.avatarLevels = { ...DEFAULT_AVATAR_LEVELS };
            const current = getAvatarLevel(avatarId);
            gameState.avatarLevels[avatarId] = current + 1;
            saveGameState();

            const av = PLAYER_AVATARS.find(a => a.id === avatarId);
            const newStage = getEquippedStage(avatarId);
            const label = getStageLabel(avatarId, newStage);

            renderProfile();
            renderAvatarDirector();
            updateDashboard();

            showToast(`${av.name} developed to LVL ${current + 1}! ${newStage !== getEquippedStage(avatarId) ? '' : 'New outfit equipped: ' + label}`, 'success');
        }

        function performFusion() {
            if (!selectedAlpha || !selectedBeta) return;
            
            const btn = document.getElementById('fuse-btn');
            btn.disabled = true;
            btn.innerHTML = `<span>FUSING...</span> <i class="fas fa-spinner fa-spin ml-2"></i>`;
            
            // Simulate fusion delay (longer for ritual)
            const delay = currentFusionMode === 'ritual' ? 2450 : 1450;
            
            setTimeout(() => {
                const newPanda = createFusionResult(selectedAlpha, selectedBeta, currentFusionMode);
                
                // Show result modal
                showFusionResult(newPanda);
                
                // Reset slots
                resetFusionSlots();
                
                // Update stats with mode bonuses
                gameState.fusions++;
                if (currentFusionMode === "ritual") {
                    gameState.ritualFusionsCount = (gameState.ritualFusionsCount || 0) + 1;
                }
                if (__resultCountsTowardFireChallenge(newPanda)) {
                    gameState.fireChallengeFusions = Math.min(
                        3,
                        (Number(gameState.fireChallengeFusions) || 0) + 1,
                    );
                }
                let xpGain = Math.floor(Math.random() * 120) + 85;
                if (currentFusionMode === 'advanced') xpGain = Math.floor(xpGain * 1.4);
                if (currentFusionMode === 'ritual') xpGain = Math.floor(xpGain * 2.1);
                bumpLifetimeEarnedXp(xpGain);
                gameState.xp += xpGain;
                
                // Level up check
                if (gameState.xp >= 10000) {
                    gameState.level++;
                    gameState.xp = gameState.xp - 10000;
                    showLevelUp();
                }
                
                // Add to recent
                gameState.recentFusions.unshift({
                    name: newPanda.name,
                    emoji: newPanda.emoji,
                    power: newPanda.power,
                    time: "just now"
                });
                
                if (gameState.recentFusions.length > 5) gameState.recentFusions.pop();
                
                // Save
                saveGameState();
                updateDashboard();
                renderRecentFusions();
                
                // Re-enable button
                btn.innerHTML = `<span>FUSE</span> <i class="fas fa-bolt"></i>`;
                btn.disabled = true;
                
            }, delay);
        }

        function createFusionResult(pandaA, pandaB, mode = 'basic') {
            const types = [pandaA.type, pandaB.type];
            let hybridName = '';
            
            // === ADVANCED SYNERGY SYSTEM ===
            let synergyBonus = 0;
            let synergyName = '';
            let isCritical = false;
            
            // Elemental synergies
            if (types.includes('Fire') && types.includes('Ice')) {
                synergyName = 'Steam';
                synergyBonus = 25;
            } else if (types.includes('Dark') && types.includes('Light')) {
                synergyName = 'Eclipse';
                synergyBonus = 22;
            } else if (types.includes('Electric') && types.includes('Crystal')) {
                synergyName = 'Plasma';
                synergyBonus = 28;
            } else if (types.includes('Arcane') && types.includes('Fire')) {
                synergyName = 'Inferno Mystic';
                synergyBonus = 20;
            } else if (pandaA.type === pandaB.type && pandaA.type !== 'Hybrid') {
                synergyName = 'Pure';
                synergyBonus = 15; // Same type bonus
            } else if (['Fire', 'Ice', 'Electric', 'Dark'].includes(pandaA.type) && 
                       ['Ice', 'Fire', 'Crystal', 'Light'].includes(pandaB.type)) {
                synergyBonus = 12; // Opposites attract
            }
            
            // Generate name
            if (synergyName) {
                hybridName = synergyName;
            } else {
                const prefixes = ['Ultra', 'Mega', 'Neo', 'Quantum', 'Astral', 'Primal', 'Void', 'Nova', 'Eternal', 'Chaos'];
                hybridName = prefixes[Math.floor(Math.random() * prefixes.length)];
            }
            
            const fullName = `${hybridName} ${pandaA.name.split(' ').pop() || 'Panda'}`;
            
            // === POWER CALCULATION (Advanced Mechanics) ===
            let basePower = Math.floor((pandaA.power + pandaB.power) / 2);
            let bonus = Math.floor(Math.random() * 18) + 14;
            
            // Mode multipliers
            if (mode === 'advanced') {
                bonus += 22;
                basePower = Math.floor(basePower * 1.18);
            } else if (mode === 'ritual') {
                bonus += 48;
                basePower = Math.floor(basePower * 1.35);
            }
            
            // Apply synergy
            let finalPower = Math.floor(basePower + bonus + (synergyBonus * 0.8));

            // === PLAYER AVATAR BONUS (integrated into fusion card / lab system) ===
            const avatarBonus = getAvatarBonus(gameState.selectedAvatarId || 'fusion-panda');
            finalPower = Math.floor(finalPower * (1 + avatarBonus.powerMult));

            // Panda fusion card bonuses (RPS evolved) also leverage the result power
            const pA = pandaA.bonus || getDefaultBonus(pandaA.type);
            const pB = pandaB.bonus || getDefaultBonus(pandaB.type);
            const bonusAvg = (pA.attack + pA.defense + pB.attack + pB.defense) / 40;
            finalPower = Math.floor(finalPower * (0.92 + bonusAvg * 0.16));
            if (avatarBonus.critExtra > 0 && Math.random() < avatarBonus.critExtra) {
                // avatar granted extra crit
            }
            
            // === RARITY & CRITICAL SYSTEM ===
            let rarity = 'epic';
            let rand = Math.random();
            
            // Mode-based rarity chances
            if (mode === 'ritual') {
                if (rand > 0.72) rarity = 'mythic';
                else if (rand > 0.38) rarity = 'legendary';
                else rarity = 'epic';
            } else if (mode === 'advanced') {
                if (rand > 0.91) rarity = 'mythic';
                else if (rand > 0.58) rarity = 'legendary';
                else if (rand > 0.22) rarity = 'epic';
                else rarity = 'rare';
            } else {
                if (rand > 0.88) rarity = 'mythic';
                else if (rand > 0.65) rarity = 'legendary';
                else if (rand > 0.35) rarity = 'epic';
                else rarity = 'rare';
            }
            
            // Critical Fusion chance (extra visual + power)
            if (Math.random() < 0.18 || (mode === 'ritual' && Math.random() < 0.35)) {
                isCritical = true;
                rarity = (rarity === 'rare') ? 'epic' : (rarity === 'epic' ? 'legendary' : 'mythic');
            }

            // Lich Queen ritual bias (integrated upgrade to card / fusion system)
            const ab = getAvatarBonus(gameState.selectedAvatarId || 'fusion-panda');
            if ((gameState.selectedAvatarId === 'lich-queen') && mode === 'ritual' && Math.random() < (0.22 + ab.ritualExtra)) {
                if (rarity === 'epic') rarity = 'legendary';
                else if (rarity === 'legendary') rarity = 'mythic';
            }
            
            // === EMOJI & TYPE ===
            let emoji = '🐼';
            if (pandaA.emoji.includes('🔥') || pandaB.emoji.includes('🔥')) emoji = '🌋';
            else if (pandaA.emoji.includes('❄️') || pandaB.emoji.includes('❄️')) emoji = '🌨️';
            else if (pandaA.emoji.includes('⚡') || pandaB.emoji.includes('⚡')) emoji = '⚡';
            else if (pandaA.emoji.includes('🌑') || pandaB.emoji.includes('🌑')) emoji = '🌌';
            else if (pandaA.emoji.includes('✨') || pandaB.emoji.includes('✨')) emoji = '🌟';
            else emoji = pandaA.emoji + (pandaB.emoji.includes('🐼') ? '' : pandaB.emoji);
            
            let newType = 'Hybrid';
            if (synergyName) newType = synergyName;
            else if (types[0] !== types[1]) newType = `${types[0]}-${types[1]}`;
            
            // Final panda object
            const newPanda = {
                id: 'f' + Date.now(),
                name: fullName,
                emoji: emoji,
                type: newType,
                power: finalPower,
                rarity: rarity,
                color: getRarityColor(rarity),
                desc: `Advanced ${mode} fusion of ${pandaA.name} and ${pandaB.name}. ${synergyName ? 'Powerful ' + synergyName + ' synergy detected!' : ''} ${isCritical ? 'CRITICAL FUSION!' : ''}`,
                acquired: new Date().toISOString().split('T')[0],
                isCritical: isCritical,
                fusionMode: mode,
                mentorAvatar: gameState.selectedAvatarId || 'fusion-panda'
            };

            // === EVOLVE BONUSES via elemental RPS (winning element leverages attrs for merge evolution)
            // simple add/sub or exponential based on interaction "distance"
            const bA = pandaA.bonus || getDefaultBonus(pandaA.type);
            const bB = pandaB.bonus || getDefaultBonus(pandaB.type);
            newPanda.bonus = computeFusionBonus(bA, bB, newType);
            
            // Add to collection
            const exists = userPandas.some(p => p.name === newPanda.name);
            if (!exists) {
                userPandas.push(newPanda);
                gameState.collectionCount = userPandas.length;
            }
            
            // Store critical flag for modal
            window.lastFusionWasCritical = isCritical;
            
            return newPanda;
        }

        // ========== FUSION LAB CARD BONUSES + ELEMENTAL RPS EVOLUTION ==========
        // Bonuses rendered on every fusable card (base + user pandas in lab/collection)
        // On fusion: simple add/sub or exponential based on elemental RPS interaction (>3 elements, "distance" for expo)
        // Winning element leverages the attributes for the merged card's evolution
        const ELEMENT_RPS = {
            'Fire':      { beats: ['Ice', 'Dark'], mult: 1.25, expo: 1.15 },
            'Ice':       { beats: ['Electric', 'Crystal'], mult: 1.25, expo: 1.12 },
            'Electric':  { beats: ['Crystal', 'Arcane'], mult: 1.22, expo: 1.18 },
            'Dark':      { beats: ['Light', 'Arcane'], mult: 1.28, expo: 1.1 },
            'Light':     { beats: ['Dark', 'Fire'], mult: 1.22, expo: 1.14 },
            'Arcane':    { beats: ['Light', 'Ice'], mult: 1.25, expo: 1.16 },
            'Crystal':   { beats: ['Electric', 'Dark'], mult: 1.2, expo: 1.2 },
            'Fusion':    { beats: ['Balanced'], mult: 1.1, expo: 1.25 }, // versatile, high expo potential
            'Balanced':  { beats: [], mult: 1.0, expo: 1.0 },
            'Hybrid':    { beats: [], mult: 1.05, expo: 1.05 },
            'Steam':     { beats: ['Fire'], mult: 1.15, expo: 1.1 },
            'Eclipse':   { beats: ['Light'], mult: 1.18, expo: 1.12 },
            'Plasma':    { beats: ['Crystal'], mult: 1.2, expo: 1.15 },
            'Inferno Mystic': { beats: ['Arcane'], mult: 1.22, expo: 1.13 }
        };

        function getElementInteraction(e1, e2) {
            if (!e1 || !e2) return { winner: e1 || e2 || 'Balanced', mult: 1.0, expo: 1.0 };
            if (e1 === e2) return { winner: e1, mult: 1.05, expo: 1.02 };
            const i1 = ELEMENT_RPS[e1] || {};
            const i2 = ELEMENT_RPS[e2] || {};
            if (i1.beats && i1.beats.includes(e2)) return { winner: e1, mult: i1.mult || 1.25, expo: i1.expo || 1.15 };
            if (i2.beats && i2.beats.includes(e1)) return { winner: e2, mult: i2.mult || 1.25, expo: i2.expo || 1.15 };
            // "Distance" for non-direct: slight advantage + expo room
            return { winner: e1, mult: 1.08, expo: 1.08 };
        }

        function getDefaultBonus(type) {
            const base = { attack: 10, defense: 10, speed: 8, special: 6, energy: 1.0, element: type || 'Balanced' };
            if (type === 'Fire') return { ...base, attack: 20, defense: 7, speed: 11, special: 7, energy: 1.15, element: 'Fire' };
            if (type === 'Ice') return { ...base, attack: 11, defense: 15, speed: 6, special: 10, energy: 1.05, element: 'Ice' };
            if (type === 'Dark') return { ...base, attack: 14, defense: 9, speed: 13, special: 12, energy: 0.95, element: 'Dark' };
            if (type === 'Electric') return { ...base, attack: 13, defense: 8, speed: 16, special: 8, energy: 1.1, element: 'Electric' };
            if (type === 'Light') return { ...base, attack: 16, defense: 12, speed: 10, special: 14, energy: 1.2, element: 'Light' };
            if (type === 'Arcane') return { ...base, attack: 15, defense: 11, speed: 9, special: 15, energy: 1.08, element: 'Arcane' };
            if (type === 'Crystal') return { ...base, attack: 12, defense: 17, speed: 5, special: 9, energy: 0.9, element: 'Crystal' };
            return base;
        }

        function computeFusionBonus(b1, b2, resultElement) {
            const inter = getElementInteraction(b1.element || 'Balanced', b2.element || 'Balanced');
            const winElem = inter.winner;
            const m = inter.mult;
            const expo = inter.expo;

            // Leverage winning element for evolution of merging cards
            // Simple add for base, exponential on favored attrs or based on winElem "distance"/type
            let newB = {
                attack: Math.floor( (b1.attack || 10) + (b2.attack || 10) * (winElem === 'Fire' || winElem === 'Light' ? m : 1) ),
                defense: Math.floor( (b1.defense || 10) + (b2.defense || 10) * (winElem === 'Ice' || winElem === 'Crystal' ? m : 1) ),
                speed: Math.floor( (b1.speed || 8) + (b2.speed || 8) * (winElem === 'Electric' ? m : 1) ),
                special: Math.floor( (b1.special || 6) + (b2.special || 6) * (winElem === 'Arcane' || winElem === 'Dark' ? m : 1) ),
                energy: Math.max(0.6, Math.min(1.8, ((b1.energy || 1) + (b2.energy || 1)) / 2 * (winElem === 'Fusion' ? expo : 1) )),
                element: resultElement || winElem
            };

            // Exponential action for "distance" (non-direct beats) or specific winning elem
            if (winElem === 'Fusion' || (b1.element !== winElem && b2.element !== winElem)) {
                // expo boost on all for versatile winners or distant matchups
                newB.attack = Math.floor(newB.attack * expo);
                newB.defense = Math.floor(newB.defense * expo);
                newB.speed = Math.floor(newB.speed * expo);
                newB.special = Math.floor(newB.special * expo);
                newB.energy = Math.max(0.6, Math.min(1.8, newB.energy * expo));
            }

            // Simple add/sub for some cases, or based on mode synergy (already in power)
            // If same element, pure add with small bonus
            if (b1.element === b2.element) {
                newB.attack += 2;
                newB.defense += 2;
            }

            return newB;
        }

        function showFusionResult(newPanda) {
            const modal = document.getElementById('fusion-result-modal');
            
            document.getElementById('fusion-result-emoji').innerHTML = newPanda.emoji;
            document.getElementById('fusion-result-name').innerText = newPanda.name;
            document.getElementById('fusion-result-type').innerText = newPanda.type.toUpperCase();
            document.getElementById('fusion-result-power').innerText = newPanda.power;
            
            const rarityEl = document.getElementById('fusion-result-rarity');
            const rarityText = document.getElementById('fusion-result-rarity-text');
            const rarityColor = getRarityColor(newPanda.rarity);
            
            rarityEl.style.background = `${rarityColor}30`;
            rarityEl.style.color = rarityColor;
            rarityEl.innerText = newPanda.rarity.toUpperCase();
            rarityText.innerText = newPanda.rarity.toUpperCase();
            rarityText.style.color = rarityColor;
            
            // Dynamic bonus based on mode & critical
            let bonus = Math.floor(Math.random() * 25) + 12;
            if (newPanda.fusionMode === 'advanced') bonus += 18;
            if (newPanda.fusionMode === 'ritual') bonus += 35;
            if (newPanda.isCritical) bonus += 45;
            document.getElementById('fusion-result-bonus').innerText = `+${bonus}%`;
            
            // Critical fusion visual flair
            const emojiEl = document.getElementById('fusion-result-emoji');
            if (newPanda.isCritical) {
                emojiEl.style.animation = 'fusion-pulse 0.6s infinite';
                emojiEl.style.filter = 'drop-shadow(0 0 40px #fbbf24) drop-shadow(0 0 80px #f43f5e)';
                setTimeout(() => {
                    if (emojiEl) emojiEl.style.animation = '';
                }, 4200);
            } else {
                emojiEl.style.filter = '';
            }

            // Show evolved bonuses on fusion result (RPS leveraged from parents)
            if (newPanda.bonus) {
                const b = newPanda.bonus;
                const bonusEl = document.getElementById('fusion-result-bonus');
                if (bonusEl) {
                    bonusEl.innerHTML = `+${bonus}% <span class="text-[10px] block text-gray-400">EVOLVED: ⚔️${b.attack} 🛡️${b.defense} ⚡${b.speed} ✨${b.special} 🔋${b.energy.toFixed(1)}x (${b.element})</span>`;
                }
            }
            
            // Confetti explosion (more intense on critical/ritual)
            const particleCount = (newPanda.isCritical || newPanda.fusionMode === 'ritual') ? 110 : 65;
            createConfetti(particleCount);
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Store current panda for evolve button
            window.currentFusionResult = newPanda;
            
            // Show evolve button for powerful results
            const evolveBtn = document.getElementById('evolve-btn');
            if (evolveBtn) {
                if (newPanda.power > 55 || ['legendary', 'mythic'].includes(newPanda.rarity)) {
                    evolveBtn.classList.remove('hidden');
                } else {
                    evolveBtn.classList.add('hidden');
                }
            }
        }

        function createConfetti(count = 65) {
            const colors = ['#00ff9d', '#ff00aa', '#00f0ff', '#fbbf24', '#f43f5e'];
            const container = document.getElementById('fusion-result-modal');
            
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = '-20px';
                    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.width = (Math.random() * 9 + 5) + 'px';
                    particle.style.height = particle.style.width;
                    particle.style.opacity = Math.random() * 0.8 + 0.4;
                    
                    container.appendChild(particle);
                    
                    const fallDuration = Math.random() * 2800 + 1900;
                    const xDrift = (Math.random() - 0.5) * 180;
                    
                    particle.animate([
                        { 
                            transform: `translateY(0) rotate(0deg)`,
                            opacity: particle.style.opacity 
                        },
                        { 
                            transform: `translateY(520px) translateX(${xDrift}px) rotate(${Math.random() * 620 - 180}deg)`,
                            opacity: 0 
                        }
                    ], {
                        duration: fallDuration,
                        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
                    }).onfinish = () => particle.remove();
                }, i * 0.8);
            }
        }

        function addToCollectionAndClose() {
            const modal = document.getElementById('fusion-result-modal');
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            
            // Already added in createFusionResult
            renderCollection();
            updateDashboard();
            
            showToast("Panda added to your collection! 🐼", "success");
            
            // Bonus: small XP
            bumpLifetimeEarnedXp(35);
            gameState.xp += 35;
            if (gameState.xp >= 10000) {
                gameState.level++;
                gameState.xp -= 10000;
                showLevelUp();
            }
            saveGameState();
            updateDashboard();
        }

        function closeFusionModal() {
            const modal = document.getElementById('fusion-result-modal');
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            
            // Hide evolve button
            const evolveBtn = document.getElementById('evolve-btn');
            if (evolveBtn) evolveBtn.classList.add('hidden');
            
            // Clear any remaining particles
            const particles = modal.querySelectorAll('.particle');
            particles.forEach(p => p.remove());
        }

        function evolveFusionResult() {
            const current = window.currentFusionResult;
            if (!current) return;
            
            const modal = document.getElementById('fusion-result-modal');
            
            // Evolve: boost power + upgrade rarity
            current.power = Math.floor(current.power * 1.28) + 12;
            if (current.rarity === 'rare') current.rarity = 'epic';
            else if (current.rarity === 'epic') current.rarity = 'legendary';
            else if (current.rarity === 'legendary') current.rarity = 'mythic';
            
            current.name = 'Evolved ' + current.name;
            current.desc = 'Evolved form of the original fusion. Even more powerful!';
            current.emoji = current.emoji + '✨';
            
            // Update modal live
            document.getElementById('fusion-result-name').innerText = current.name;
            document.getElementById('fusion-result-power').innerText = current.power;
            document.getElementById('fusion-result-emoji').innerHTML = current.emoji;
            
            const rarityColor = getRarityColor(current.rarity);
            document.getElementById('fusion-result-rarity').innerText = current.rarity.toUpperCase();
            document.getElementById('fusion-result-rarity').style.background = `${rarityColor}30`;
            document.getElementById('fusion-result-rarity').style.color = rarityColor;
            document.getElementById('fusion-result-rarity-text').innerText = current.rarity.toUpperCase();
            document.getElementById('fusion-result-rarity-text').style.color = rarityColor;
            
            // Hide evolve button after use
            document.getElementById('evolve-btn').classList.add('hidden');
            
            // Extra confetti for evolution
            createConfetti(45);
            
            showToast("Panda evolved to new heights! +28% power", "success");
        }

        function resetFusionSlots() {
            const alphaSlot = document.getElementById('slot-alpha');
            const betaSlot = document.getElementById('slot-beta');
            
            alphaSlot.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-plus text-4xl text-gray-600 mb-3"></i>
                    <div class="font-medium text-gray-400">Select Panda A</div>
                    <div class="text-xs text-gray-500 mt-1">Click to choose from collection</div>
                </div>
            `;
            betaSlot.innerHTML = alphaSlot.innerHTML.replace('A', 'B');
            
            alphaSlot.classList.remove('active');
            betaSlot.classList.remove('active');
            alphaSlot.style.borderColor = '';
            betaSlot.style.borderColor = '';
            
            selectedAlpha = null;
            selectedBeta = null;
            
            document.getElementById('fuse-btn').disabled = true;
            document.getElementById('fuse-btn').classList.remove('fusion-glow');
        }

        function showLevelUp() {
            const levelUpHTML = `
                <div class="fixed inset-0 bg-black/90 z-[130] flex items-center justify-center" onclick="this.remove()">
                    <div class="text-center max-w-xs px-6" onclick="event.stopImmediatePropagation()">
                        <div class="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center mb-6 shadow-[0_0_80px_#fbbf24]">
                            <span class="text-6xl">🏆</span>
                        </div>
                        
                        <div class="text-5xl font-black mb-1">LEVEL UP!</div>
                        <div class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">${gameState.level}</div>
                        
                        <div class="mt-4 text-xl">You are now a <span class="font-bold text-amber-400">FUSION MASTER</span>!</div>
                        
                        <div class="mt-8">
                            <button onclick="event.target.closest('.fixed').remove()" 
                                    class="px-9 py-3.5 rounded-3xl bg-white text-black font-bold text-sm">AWESOME!</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', levelUpHTML);
            
            // Extra confetti
            setTimeout(() => {
                const container = document.querySelector('.fixed.inset-0.bg-black\\/90');
                if (container) {
                    for (let i = 0; i < 40; i++) {
                        setTimeout(() => {
                            const p = document.createElement('div');
                            p.className = 'particle';
                            p.style.left = Math.random() * 100 + '%';
                            p.style.background = ['#fbbf24', '#00ff9d', '#f43f5e'][Math.floor(Math.random()*3)];
                            p.style.top = Math.random() * 40 + '%';
                            container.appendChild(p);
                            
                            p.animate([
                                {transform: 'translateY(0) scale(1)', opacity: 0.9},
                                {transform: `translateY(${280 + Math.random()*120}px) scale(0.4)`, opacity: 0}
                            ], {
                                duration: 1600 + Math.random()*900,
                                easing: 'ease-out'
                            }).onfinish = () => p.remove();
                        }, i * 2);
                    }
                }
            }, 300);
        }

        function claimDailyChallenge() {
            const earned = Math.max(0, Number(gameState.lifetimeEarnedXp) || 0);
            if (earned < DAILY_CHALLENGE_REWARD_XP_THRESHOLD) {
                showToast("Earn more XP from fusions and battles to unlock this reward.", "info");
                return;
            }
            const fireN = Math.min(3, Math.max(0, Math.floor(Number(gameState.fireChallengeFusions) || 0)));
            if (fireN < 3) {
                showToast("Complete the Inferno challenge: fuse until you get 3 Fire-type results (progress on the card).", "info");
                return;
            }

            showToast("Daily Challenge Completed! +280 XP & 1 Rare Panda", "success");

            bumpLifetimeEarnedXp(280);
            gameState.xp += 280;
            if (gameState.xp >= 10000) {
                gameState.level++;
                gameState.xp -= 10000;
                setTimeout(showLevelUp, 800);
            }
            
            // Reward panda
            const rewardPanda = {
                id: 'daily-' + Date.now(),
                name: "Blaze Guardian",
                emoji: "🦍🔥",
                type: "Fire",
                power: 29,
                rarity: "rare",
                color: "#f97316",
                desc: "Rewarded for completing today's Inferno Fusion challenge. A loyal guardian of the flame.",
                acquired: new Date().toISOString().split('T')[0]
            };
            
            userPandas.push(rewardPanda);
            gameState.fusions += 5;
            gameState.fireChallengeFusions = 0;
            
            saveGameState();
            updateDashboard();
            renderCollection();
            
            // Show reward animation
            setTimeout(() => {
                const rewardModal = document.createElement('div');
                rewardModal.className = `fixed inset-0 z-[140] flex items-center justify-center bg-black/70`;
                rewardModal.innerHTML = `
                    <div class="cyber-card max-w-xs w-full mx-4 rounded-3xl p-8 text-center border border-amber-400">
                        <div class="text-7xl mb-4">🦍🔥</div>
                        <div class="font-black text-2xl">NEW PANDA UNLOCKED!</div>
                        <div class="mt-1 text-amber-400">Blaze Guardian</div>
                        
                        <div class="mt-6 text-xs px-6 py-4 bg-black/40 rounded-2xl text-left">
                            <div class="flex justify-between text-xs">
                                <span>Power</span> <span class="font-mono text-emerald-400">29</span>
                            </div>
                        </div>
                        
                        <button onclick="this.closest('.fixed').remove(); navigateTo('collection')" 
                                class="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-bold">VIEW IN COLLECTION</button>
                    </div>
                `;
                document.body.appendChild(rewardModal);
            }, 650);
        }

        function __battleWait(ms) {
            return new Promise((r) => setTimeout(r, ms));
        }

        function __resetBeam(el) {
            if (!el) return;
            el.classList.remove("battle-beam--to-enemy", "battle-beam--to-player", "battle-beam--special");
            void el.offsetWidth;
        }

        function __spawnBattleFloatingDmg(anchor, value, isSpecial) {
            if (!anchor) return;
            const el = document.createElement("div");
            el.className = "battle-dmg battle-dmg--float";
            el.style.color = isSpecial ? "#e879f9" : "#34d399";
            el.textContent = `-${value}`;
            anchor.appendChild(el);
            setTimeout(() => {
                el.remove();
            }, 1000);
        }

        function __syncBattleHpBars() {
            const b = window.__activeBattle;
            if (!b) return;
            // keep aliases in sync per init spec
            if (typeof b.playerCurHp === 'number') b.playerCurHp = b.playerCur;
            if (typeof b.enemyCurHp === 'number') b.enemyCurHp = b.enemyCur;
            const pBar = document.getElementById("battle-hp-player-bar");
            const pText = document.getElementById("battle-hp-player-text");
            const eBar = document.getElementById("battle-hp-enemy-bar");
            const eText = document.getElementById("battle-hp-enemy-text");
            const pPct = Math.max(0, (b.playerCur / b.playerMax) * 100);
            const ePct = Math.max(0, (b.enemyCur / b.enemyMax) * 100);
            if (pBar) pBar.style.width = pPct + "%";
            if (eBar) eBar.style.width = ePct + "%";
            if (pText) pText.textContent = `${Math.max(0, b.playerCur)} / ${b.playerMax} HP`;
            if (eText) eText.textContent = `${Math.max(0, b.enemyCur)} / ${b.enemyMax} HP`;
            // also refresh special meter display if present
            updateBattleSpecialMeterDisplay();
        }

        function __appendBattleLogLine(className, html) {
            const log = document.getElementById("battle-log");
            if (!log) return;
            const line = document.createElement("div");
            if (className) line.className = className;
            line.innerHTML = html;
            log.appendChild(line);
            log.scrollTop = log.scrollHeight;
        }

        function __escapeBattleText(value) {
            const div = document.createElement("div");
            div.textContent = String(value);
            return div.innerHTML;
        }

        // ========== BATTLE AVATAR INTEGRATION HELPERS (cohesive with PLAYER_AVATARS + tacticDeck + RPS for rivals) ==========
        function getBattleAvatar(battleOrId) {
            let id = null;
            if (typeof battleOrId === 'string') {
                id = battleOrId;
            } else if (battleOrId && typeof battleOrId === 'object') {
                id = battleOrId.championAvatarId || battleOrId.playerAvatarId ||
                     (battleOrId.championAvatar && battleOrId.championAvatar.id) ||
                     (battleOrId.championAvatarId);
            }
            if (!id) id = (gameState && gameState.selectedAvatarId) || 'fusion-panda';
            return PLAYER_AVATARS.find(a => a.id === id) || PLAYER_AVATARS[0];
        }
        function getAvatarTacticDeck(avatarOrBattle) {
            const av = getBattleAvatar(avatarOrBattle);
            return (av && av.tacticDeck) || [];
        }
        function getAvatarSpecialThreshold(avatarOrBattle) {
            const av = getBattleAvatar(avatarOrBattle);
            return (av && typeof av.specialThreshold === 'number') ? av.specialThreshold : 10;
        }
        function getRpsMultiplier(playerElement, enemyElement) {
            // Delegated to full elementAdvantage impl (0.7-1.5 range) for consistency with task spec
            return getElementMultiplier(playerElement, enemyElement);
        }
        function getRivalElement(rivalId) {
            if (!rivalId || typeof BATTLE_RIVALS === 'undefined') return 'Neutral';
            const r = BATTLE_RIVALS.find(x => x.id === rivalId);
            return (r && r.element) || 'Neutral';
        }

        // Runtime battle state snapshot helper. Focus is runtime (in-memory __activeBattle + attackLog for replays).
        // Suggestion for "save": call this on battle end and stash to gameState.lastBattleSnapshot then saveGameState();
        // or window.__battleHistory.unshift(capture...); persist via localStorage extension if wanted for logs across reloads.
        function captureBattleState() {
            const b = window.__activeBattle;
            if (!b) return null;
            const av = b.championAvatar || getBattleAvatar(b);
            return {
                avatarId: (av && av.id) || b.championAvatarId,
                avatarName: av ? av.name : null,
                enemy: b.enemyName,
                enemyElement: b.enemyElement,
                round: b.round,
                playerHp: b.playerCur,
                enemyHp: b.enemyCur,
                specialMeter: b.specialMeter,
                logLength: (b.attackLog || []).length,
                ended: !!b.ended,
                victory: b.enemyCur <= 0 && !b.playerCur <= 0,
                ts: Date.now()
            };
        }

        function normalizeElement(el) {
            if (!el) return 'Neutral';
            let s = String(el).split('/')[0].trim().toLowerCase();
            const map = { fusion: 'Fusion', fire: 'Fire', ice: 'Ice', electric: 'Electric', dark: 'Dark', arcane: 'Arcane', crystal: 'Crystal', light: 'Light' };
            if (map[s]) return map[s];
            return s.charAt(0).toUpperCase() + s.slice(1);
        }

        // elementAdvantage / getElementMultiplier per task spec: returns 0.7-1.5 multiplier for RPS feel
        // Balanced with some cycles + Fusion versatility + counters. Fun depth without extremes.
        function getElementMultiplier(playerElem, enemyElem) {
            const p = normalizeElement(playerElem);
            const e = normalizeElement(enemyElem);
            if (p === e || p === 'Neutral' || e === 'Neutral') return 1.05;

            // Advantage matrix (player elem -> enemy elem : mult). Clamped results 0.7-1.5
            const matrix = {
                'Fire':      { 'Ice': 1.45, 'Crystal': 1.35, 'Dark': 1.18, 'Light': 0.82 },
                'Ice':       { 'Electric': 1.42, 'Fire': 0.78, 'Arcane': 1.22 },
                'Electric':  { 'Crystal': 1.38, 'Ice': 0.85, 'Fusion': 0.9, 'Dark': 1.25 },
                'Dark':      { 'Light': 1.48, 'Arcane': 1.28, 'Fusion': 0.82, 'Crystal': 1.15 },
                'Arcane':    { 'Dark': 1.32, 'Crystal': 1.22, 'Light': 0.78, 'Fire': 1.12 },
                'Crystal':   { 'Electric': 0.72, 'Dark': 1.18, 'Fire': 0.8, 'Light': 1.15 },
                'Light':     { 'Dark': 1.48, 'Arcane': 1.2, 'Fusion': 0.85 },
                'Fusion':    { 'Fire': 1.22, 'Ice': 1.2, 'Electric': 1.18, 'Dark': 1.25, 'Light': 1.15, 'Crystal': 1.12, 'Arcane': 1.1 }
            };
            const row = matrix[p] || {};
            let mult = row[e];
            if (typeof mult !== 'number') mult = 1.0;
            // slight variance for fun but keep deterministic range
            return Math.max(0.7, Math.min(1.5, mult));
        }

        // Core: applies category (attack/defense/block match + counters), elemental (RPS), speed (hit/init), energyMult (output/taken), returns bonuses
        function applyTacticBonuses(tactic, enemyTactic, isAttacking, baseDamage, baseHitChance = 0.76, isDefending = false) {
            let dmgMult = 1.0;
            let hitChance = baseHitChance;
            let mitMult = 1.0; // <1 reduces incoming dmg
            let charge = 0;
            let energy = 1.0;
            if (!tactic) return { dmgMult: 1.0, hitChance, mitMult: 1.0, charge: 2, energy: 1.0, note: '' };

            charge = tactic.specialCharge || 2;
            energy = tactic.energyMult || 1.0;
            const cat = tactic.category || 'attack';
            const speed = tactic.speedMod || 0;

            // Speed affects hit chance / initiative feel
            hitChance = Math.max(0.38, Math.min(0.96, baseHitChance + (speed * 0.065)));

            // Category match bonus
            let catNote = '';
            if (isAttacking && cat === 'attack') {
                dmgMult *= 1.16;
                catNote = 'ATK+';
            } else if (isDefending && (cat === 'block' || cat === 'defense')) {
                mitMult *= 0.82;
                catNote = 'DEF+';
            }

            // RPS category counters (attack > defense, block > attack, defense > block)
            if (enemyTactic) {
                const ecat = enemyTactic.category || 'attack';
                if (cat === 'block' && ecat === 'attack') {
                    mitMult *= 0.62; // strong counter block
                    catNote += ' BLK-COUNTER';
                } else if (cat === 'attack' && ecat === 'defense') {
                    dmgMult *= 1.22;
                    catNote += ' ATK-COUNTER';
                } else if (cat === 'defense' && ecat === 'block') {
                    hitChance = Math.min(0.95, hitChance + 0.12);
                    catNote += ' DEF-COUNTER';
                }
            }

            // Pure energy: for attack boost output (or mitigation context)
            if (isAttacking) {
                dmgMult *= energy;
            } else if (isDefending) {
                mitMult *= energy;
            }

            let finalDmg = Math.max(1, Math.floor(baseDamage * dmgMult));
            return { dmgMult, hitChance, mitMult, charge, energy, note: catNote, finalDmg };
        }

        // Main resolver for player choice of move (or block) + tactic. Updates battle, returns rich result for log/video/outcome.
        function resolvePlayerTurn(battle, selectedMove, selectedTactic, isBlock = false) {
            if (!battle || battle.ended) return { outcome: 'none', damage: 0 };
            const avatarElem = battle.playerElement || 'Fusion';
            const tacticElem = selectedTactic ? selectedTactic.element : avatarElem;
            const enemyElem = battle.enemyElement || 'Dark';

            const elemMult = getElementMultiplier(tacticElem, enemyElem);

            // Energize meter every player turn (per spec)
            const charge = selectedTactic ? (selectedTactic.specialCharge || 2) : 2;
            battle.specialMeter = Math.min(battle.maxSpecialMeter || 12, (battle.specialMeter || 0) + charge);

            let baseDmg = 0;
            let moveName = 'BLOCK';
            let moveId = 'block';
            let isSpecialMove = false;
            if (!isBlock && selectedMove) {
                baseDmg = battle.playerBaseDamage || 18;
                moveName = selectedMove.name;
                moveId = selectedMove.id;
                if (selectedMove.type === 'special') {
                    baseDmg = Math.floor(baseDmg * 1.32);
                    isSpecialMove = true;
                }
            }

            // Apply tactic bonuses (no enemyTactic for player-first; enemy counters can be in other flow)
            const tRes = applyTacticBonuses(selectedTactic, null, !isBlock, baseDmg, 0.76, isBlock);

            let dmg = tRes.finalDmg || Math.floor(baseDmg * tRes.dmgMult);
            let hitChance = tRes.hitChance;

            // Special meter threshold spend (gated; use practical 8 to match UI/action + resolve bonuses)
            const threshold = 8;
            let specialTriggered = false;
            if (isSpecialMove && (battle.specialMeter || 0) >= threshold) {
                dmg = Math.floor(dmg * 1.32);
                battle.specialMeter = Math.max(0, (battle.specialMeter || 0) - threshold);
                specialTriggered = true;
            }

            // Final elem
            dmg = Math.floor(dmg * elemMult);

            // Outcome: block or roll hit using speed-adjusted chance
            let outcome = 'hit';
            let actualDmg = dmg;
            if (isBlock) {
                outcome = 'block';
                actualDmg = 0; // block itself doesn't dmg enemy; mitigation vs enemy later
            } else {
                if (Math.random() > hitChance) {
                    outcome = 'miss';
                    actualDmg = 0;
                } else {
                    actualDmg = Math.max(1, Math.floor(actualDmg * (0.88 + Math.random() * 0.24)));
                }
            }

            // Record + enrich
            const moveObj = isBlock ? { id: 'block', name: 'Block' } : (selectedMove || { id: moveId, name: moveName });
            recordAttackLog(battle, battle.playerName || 'You', moveObj, outcome, actualDmg, true);
            const last = battle.attackLog && battle.attackLog[battle.attackLog.length - 1];
            if (last) {
                last.elemMult = elemMult;
                last.tactic = selectedTactic ? selectedTactic.name : null;
                last.speedMod = selectedTactic ? selectedTactic.speedMod : 0;
                last.specialMeter = battle.specialMeter;
                last.specialTriggered = specialTriggered;
                last.category = selectedTactic ? selectedTactic.category : null;
            }

            if (actualDmg > 0) {
                battle.enemyCur = Math.max(0, battle.enemyCur - actualDmg);
            }

            return {
                outcome, damage: actualDmg, elemMult, tacticName: selectedTactic ? selectedTactic.name : '',
                hitChance, specialTriggered, isBlock, moveName, moveId, note: tRes.note || ''
            };
        }

        // Enemy simple AI: random move + FIXED RIVAL ELEMENT (for RPS) + small tactic simulation for fairness (biased by rival elem + difficulty).
        // Uses playerTacticForMitigation (from last player choice) to apply energyMult / category counters / block bonuses correctly to enemy dmg.
        function resolveEnemyTurn(battle, playerTacticForMitigation = null) {
            if (!battle || battle.ended) return { outcome: 'none', damage: 0 };

            const enemyElem = battle.enemyElement || 'Dark';
            const playerElem = battle.playerElement || 'Fusion';
            const diff = (battle.enemyDifficulty || '').toLowerCase();

            // Enhanced small enemy 'tactic' simulation (for fairness / RPS depth)
            // Uses rival's native element for authentic RPS vs player tactic/element. Categories randomized but difficulty-weighted.
            const catRoll = Math.random();
            let eCat = 'attack';
            let eSpeed = 1;
            let eEnergy = 1.06;
            if (diff.includes('hard')) { // hard rivals lean aggressive or tricky
                eCat = (catRoll < 0.55) ? 'attack' : (catRoll < 0.78 ? 'defense' : 'block');
                eSpeed = (eCat === 'attack') ? 2 : (eCat === 'block' ? -1 : 1);
            } else {
                eCat = (catRoll < 0.5) ? 'attack' : (catRoll < 0.78 ? 'defense' : 'block');
                eSpeed = (eCat === 'attack') ? 1 : (eCat === 'block' ? 0 : 2);
            }
            const enemyTactic = {
                id: 'e_' + eCat,
                category: eCat,
                element: enemyElem,   // KEY: rival's assigned element drives RPS against player's tactic/element
                speedMod: eSpeed,
                specialCharge: (eCat === 'defense' ? 3 : (eCat === 'block' ? 1 : 2)),
                energyMult: (eCat === 'attack' ? 1.09 : (eCat === 'block' ? 0.76 : 0.98))
            };

            // Random enemy attack flavor (for log/video compat)
            const enemyNames = ['Crush', 'Roar', 'Pulse', 'Tether', 'Slam', 'Bite'];
            const eName = enemyNames[Math.floor(Math.random() * enemyNames.length)];
            const enemyMove = { id: 'enemy-' + eName.toLowerCase(), name: eName };

            let baseDmg = battle.enemyBaseDamage || 11;
            const tRes = applyTacticBonuses(enemyTactic, playerTacticForMitigation, true, baseDmg, 0.71, false);

            let dmg = tRes.finalDmg || Math.floor(baseDmg * tRes.dmgMult);
            const elemMult = getElementMultiplier(enemyTactic.element, playerElem);  // RPS: enemy elem vs player
            dmg = Math.floor(dmg * elemMult);

            // Player mitigation from last chosen tactic (block/defense) — fully uses bonuses from player choice
            let mitApplied = 1.0;
            let mitNote = '';
            if (playerTacticForMitigation && (playerTacticForMitigation.category === 'block' || playerTacticForMitigation.category === 'defense')) {
                const mitRes = applyTacticBonuses(playerTacticForMitigation, enemyTactic, false, dmg, 1, true);
                dmg = Math.floor(dmg * mitRes.mitMult);
                mitApplied = mitRes.mitMult;
                mitNote = mitRes.note || '';
            }

            // Roll enemy hit (using its speed)
            let outcome = 'hit';
            let actualDmg = Math.max(0, Math.floor(dmg * (0.9 + Math.random() * 0.2)));
            if (Math.random() > tRes.hitChance) {
                outcome = 'miss';
                actualDmg = 0;
            }

            recordAttackLog(battle, battle.enemyName, enemyMove, outcome, actualDmg, false);
            const last = battle.attackLog[battle.attackLog.length - 1];
            if (last) {
                last.elemMult = elemMult;
                last.tactic = enemyTactic.category + ' (AI ' + enemyElem + ')';
                last.mitApplied = mitApplied;
                last.mitNote = mitNote;
            }

            if (actualDmg > 0) {
                battle.playerCur = Math.max(0, battle.playerCur - actualDmg);
            }

            return { outcome, damage: actualDmg, elemMult, tacticName: enemyTactic.category, mitApplied, enemyElement: enemyElem };
        }

        // Helper for enemy AI in choice paths
        function pickRandomEnemyTacticForRps(battle) {
            const e = battle.enemyElement || 'Dark';
            const pool = [
                { category: 'attack', element: e, speedMod: 1, specialCharge: 2, energyMult: 1.08 },
                { category: 'block', element: 'Crystal', speedMod: 0, specialCharge: 1, energyMult: 0.78 },
                { category: 'defense', element: 'Electric', speedMod: 2, specialCharge: 3, energyMult: 1.0 }
            ];
            return pool[Math.floor(Math.random() * pool.length)];
        }

        // === GROK-TALK BATTLE ARENA RIVALS ROSTER (themed opponents from new assets) ===
        // Inspired by the Fusion Panda cutscene prototype. Named rivals with art, lore snippets, and difficulty.
        // Each has dedicated victory (panda defeats foe) + failure (foe defeats panda) 10s cinematics.
        const BATTLE_RIVALS = [
            {
                id: 'void-howler',
                name: 'Void Howler',
                subtitle: 'Cyber Shadow Wolf • Intro Brute',
                desc: 'Relentless pack-hunter robot wolf. Exposes its core after the first barrage.',
                mechanic: 'Aggressive opener. Drops defense after initial lunges.',
                difficulty: 'INTRO',
                element: 'Dark',  // RPS: strong vs Light, weak to some Arcane/Fusion
                art: 'assets/arena/opponent-void-howler.jpg',
                video: 'assets/arena/fusion-panda-victory-void-howler.mp4',
                keyart: 'assets/arena/opponent-void-howler.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-void-howler.mp4'
            },
            {
                id: 'chroma-lynx',
                name: 'Chroma Lynx',
                subtitle: 'Refractive Data Stalker • Agile',
                desc: 'Lithe prismatic lynx that bends light and logits. Creates afterimage decoys.',
                mechanic: 'High mobility + split attacks. Punishes panic fusion.',
                difficulty: 'MEDIUM',
                element: 'Electric',  // RPS advantage vs Crystal/Ice
                art: 'assets/arena/opponent-chroma-lynx.jpg',
                video: 'assets/arena/fusion-panda-victory-chroma-lynx.mp4',
                keyart: 'assets/arena/opponent-chroma-lynx.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-chroma-lynx.mp4'
            },
            {
                id: 'prompt-colossus',
                name: 'Prompt Colossus',
                subtitle: 'Forgotten Weights Golem • Tank',
                desc: 'Towering construct of deprecated weights and dead training runs.',
                mechanic: 'Heavy tank. Precision joint shots bypass armor.',
                difficulty: 'HARD',
                element: 'Crystal',
                art: 'assets/arena/opponent-prompt-colossus.jpg',
                video: 'assets/arena/fusion-panda-victory-prompt-colossus.mp4',
                keyart: 'assets/arena/opponent-prompt-colossus.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-prompt-colossus.mp4'
            },
            {
                id: 'entropy-hare',
                name: 'Entropy Hare',
                subtitle: 'Probability Gambler • Trickster',
                desc: 'A blur of white fur and bad RNG. Constantly forces risky rolls.',
                mechanic: 'Evasive + backlash. Your big moves can backfire.',
                difficulty: 'HARD',
                element: 'Arcane',  // RPS: beats Dark, punished by Light/Electric
                art: 'assets/arena/opponent-entropy-hare.jpg',
                video: 'assets/arena/fusion-panda-victory-entropy-hare.mp4',
                keyart: 'assets/arena/opponent-entropy-hare.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-entropy-hare.mp4'
            },
            {
                id: 'fractal-fox',
                name: 'Fractal Fox',
                subtitle: 'Illusion Decoy Trickster • Agile',
                desc: 'Shifting probability fox that spawns fractal decoys and warps RNG. Hard to pin down the real one.',
                mechanic: 'Decoy swarms + misdirection. Punishes targeting the wrong clone.',
                difficulty: 'MEDIUM',
                element: 'Fusion',
                art: 'assets/arena/opponent-fractal-fox.jpg',
                video: 'assets/arena/fusion-panda-victory-fractal-fox.mp4',
                keyart: 'assets/arena/opponent-fractal-fox.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-fractal-fox.mp4'
            },
            {
                id: 'nexus-bear',
                name: 'Nexus Bear',
                subtitle: 'Gravity Data Tank • Heavy',
                desc: 'Massive armored ursine with nexus core that pulls foes in with data tethers and crushes.',
                mechanic: 'Pull + slam. Resists burst; wears you down with repeated tethers.',
                difficulty: 'HARD',
                element: 'Ice',  // Diversified for RPS variety (counters Electric/Arcane, great vs Fusion/Fire player tactics)
                art: 'assets/arena/opponent-nexus-bear.jpg',
                video: 'assets/arena/fusion-panda-victory-nexus-bear.mp4',
                keyart: 'assets/arena/opponent-nexus-bear.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-nexus-bear.mp4'
            }
        ];

        function __createBattleMatch(selectedChampion = null, specificRivalId = null) {
            const playerLevel = Math.max(0, Number(gameState.level) || 0);
            const activeAvatarId = (gameState && gameState.selectedAvatarId) || 'fusion-panda';
            const avatar = PLAYER_AVATARS.find(a => a.id === activeAvatarId) || PLAYER_AVATARS[0];
            // Use avatar primarily for battle (not collection pandas). Derive power from avatar level + player level for scaling.
            const avatarLvl = getAvatarLevel(activeAvatarId);
            const battlePower = Math.max(12, 10 + (avatarLvl * 4) + (playerLevel * 2));
            // fallback panda only for legacy power if absolutely needed (rare)
            const champion = selectedChampion || [...userPandas].sort((a, b) => (b.power || 0) - (a.power || 0))[0] || basePandas[0];
            const championPower = battlePower; // prioritize avatar-derived
            const enemyLevelFloor = Math.max(0, playerLevel - 1);
            const enemyLevelCeil = Math.max(enemyLevelFloor, playerLevel + (playerLevel < 3 ? 0 : 1));
            const enemyLevel = enemyLevelFloor + Math.floor(Math.random() * (enemyLevelCeil - enemyLevelFloor + 1));
            const playerMax = 120 + Math.floor(championPower * 2.2) + playerLevel * 9;
            const enemyMax = Math.max(72, Math.floor(playerMax * (playerLevel < 3 ? 0.55 : 0.72)));
            const playerBaseDamage = Math.max(16, Math.floor(championPower * 0.8) + 12 + playerLevel);
            const enemyBaseDamage = Math.max(7, Math.floor(playerBaseDamage * (playerLevel < 3 ? 0.48 : 0.64)));

            // Pick a named rival from the roster (using new Grok-generated arts + lore)
            let rival;
            if (specificRivalId) {
                rival = BATTLE_RIVALS.find(r => r.id === specificRivalId) || BATTLE_RIVALS[0];
            } else {
                rival = BATTLE_RIVALS[Math.floor(Math.random() * BATTLE_RIVALS.length)];
            }

            // Full avatar = PLAYER_AVATARS.find loaded here; store full + use moves/tacticDeck/color/element/specialThreshold
            return {
                playerCur: playerMax,
                playerMax,
                enemyCur: enemyMax,
                enemyMax,
                // aliases per spec
                playerCurHp: playerMax,
                enemyCurHp: enemyMax,
                round: 1,
                ended: false,
                // playerName from avatar for display (not panda)
                playerName: avatar.name,
                playerEmoji: '🐼', // legacy only; primary display uses portrait from getAvatarOutfitPath
                playerLevel,
                playerPower: battlePower,
                enemyId: rival.id,
                enemyName: rival.name,
                enemySubtitle: rival.subtitle,
                enemyDesc: rival.desc,
                enemyMechanic: rival.mechanic,
                enemyDifficulty: rival.difficulty,
                enemyArt: rival.art,
                enemyVideo: rival.video || null,
                enemyFailureVideo: rival.failureVideo || null,
                enemyKeyart: rival.keyart || rival.art,
                enemyLevel,
                enemyPower: Math.max(6, Math.floor(battlePower * (playerLevel < 3 ? 0.72 : 0.9))),
                enemyElement: rival.element || 'Neutral',
                playerBaseDamage,
                enemyBaseDamage,
                // Full avatar object per task (moves, tacticDeck, color, specialThreshold etc)
                championAvatar: avatar,
                championAvatarId: activeAvatarId,
                playerAvatar: avatar,
                playerColor: avatar.color,
                playerElement: avatar.element,
                tacticDeck: avatar.tacticDeck || [],
                moves: avatar.moves || [],
                specialThreshold: getAvatarSpecialThreshold(avatar),
                // Battle state per spec
                specialMeter: 0,
                currentTurn: 1,
                selectedMove: null,
                selectedTactic: null,
                isPlayerTurn: true,
                attackLog: [],
                // compat for older fields
                selectedAction: null,
                maxSpecialMeter: avatar.specialThreshold || 10
            };
        }

        function renderBattleChampionSelect() {
            const arenaSection = document.getElementById("section-arena");
            // Primary: use the 3 PLAYER_AVATARS (Fusion, Red, Lich) with base portraits, not collection pandas.
            // Selecting sets gameState.selectedAvatarId (cohesive with profile/avatars) and battle.championAvatar.
            const avatars = PLAYER_AVATARS;
            const currentId = (gameState && gameState.selectedAvatarId) || 'fusion-panda';
            arenaSection.innerHTML = `
                <div class="max-w-5xl mx-auto">
                    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-red-400">ARENA LOADOUT</div>
                            <div class="text-4xl font-black">Choose Your Champion Avatar</div>
                            <p class="text-sm text-gray-400 mt-2 max-w-xl">Pick from the 3 player avatars. Battle uses full avatar (moves + tacticDeck + color + element + specialThreshold). Portraits from assets/avatars/ .</p>
                        </div>
                        <button type="button" onclick="navigateTo('collection')" class="px-5 py-2 text-xs border border-gray-700 rounded-2xl hover:bg-[#1a1f2e] transition-colors">
                            VIEW COLLECTION
                        </button>
                    </div>

                    <!-- NEXT BATTLE quick start (uses currently selected avatar + random rival) -->
                    <div class="mb-6">
                        <button onclick="startQuickMatch()" 
                                class="w-full sm:w-auto mx-auto flex items-center justify-center gap-x-3 px-8 py-3.5 rounded-3xl font-bold text-base border-2 border-red-400 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all active:scale-[0.985]">
                            <i class="fas fa-bolt"></i>
                            <span>NEXT BATTLE — Current Avatar + Random Rival</span>
                            <i class="fas fa-swords"></i>
                        </button>
                        <p class="text-center text-[10px] text-gray-500 mt-1">Quick themed battle. Current avatar (${(PLAYER_AVATARS.find(a=>a.id===currentId)||{}).name || 'Fusion Panda'}) drives agency clips, RPS tactics &amp; portrait.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="battle-champion-grid">
                        ${avatars.map(av => {
                            const isSel = (av.id === currentId);
                            const imgSrc = (typeof getAvatarOutfitPath === 'function') ? getAvatarOutfitPath(av.id) : `assets/avatars/${av.outfitStages.adept || av.outfitStages.initiate || 'fusion-panda-base.jpg'}`;
                            return `
                                <button type="button"
                                        onclick="selectBattleChampion('${av.id}')"
                                        class="cyber-card text-left rounded-3xl p-5 border transition-all group ${isSel ? 'border-red-400 ring-2 ring-red-400/40' : 'border-gray-700 hover:border-red-400'}">
                                    <div class="flex items-start gap-4">
                                        <img src="${imgSrc}" alt="${av.name}" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover flex-shrink-0 border-2" style="border-color:${av.color};box-shadow:0 0 0 3px rgba(0,0,0,0.2)" />
                                        <div class="min-w-0 flex-1">
                                            <div class="font-black text-xl truncate" style="color:${av.color}">${__escapeBattleText(av.name)}</div>
                                            <div class="text-xs text-gray-400">${__escapeBattleText(av.title || '')} • ${__escapeBattleText(av.element || '')}</div>
                                            <div class="flex flex-wrap gap-2 mt-2 text-[10px] font-bold">
                                                <span class="px-2 py-0.5 rounded-full text-[9px]" style="background:${av.color}20;color:${av.color}">AVATAR</span>
                                                <span class="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 text-[9px]">THRESH ${av.specialThreshold || 10}</span>
                                            </div>
                                            <div class="text-xs text-gray-400 mt-2 line-clamp-2">${__escapeBattleText((av.bio || '').slice(0,90))}${av.bio && av.bio.length>90?'…':''}</div>
                                            <div class="mt-3 text-xs font-mono ${isSel ? 'text-red-300' : 'text-red-300/70'}">${isSel ? '★ CURRENT CHAMPION' : 'SELECT AS CHAMPION →'}</div>
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join("")}
                    </div>
                    <div class="mt-4 text-center">
                        <button onclick="startDemoBattle()" class="px-6 py-2 text-sm rounded-2xl border border-gray-700 hover:bg-[#1a1f2e]">FIGHT WITH CURRENT AVATAR</button>
                    </div>
                </div>
            `;
        }

        function selectBattleChampion(avatarId) {
            if (!avatarId || !PLAYER_AVATARS.some(a => a.id === avatarId)) return;
            gameState.selectedAvatarId = avatarId;
            saveGameState();
            // Update UI highlight by re-render (or could toggle class but re-render is simple + cohesive)
            // Then immediately start battle using this as champion (sets battle.championAvatar via create)
            startDemoBattle(null);
        }

        function renderBattleRivals() {
            const arenaSection = document.getElementById("section-arena");
            if (!arenaSection || typeof BATTLE_RIVALS === 'undefined') return;

            const rivalsHtml = BATTLE_RIVALS.map(r => `
                <div class="cyber-card rounded-3xl p-4 border border-gray-700 text-left">
                    <div class="flex gap-3">
                        <img src="${r.art}" alt="${r.name}" class="w-16 h-16 rounded-2xl object-cover border border-white/10 flex-shrink-0">
                        <div class="min-w-0 flex-1">
                            <div class="font-black">${r.name}</div>
                            <div class="text-[10px] text-red-300/80">${r.subtitle}</div>
                            <div class="mt-1 text-[10px] inline px-1.5 py-px rounded bg-red-500/20 text-red-300">${r.difficulty}</div>
                            <div class="text-xs text-zinc-400 mt-2 leading-snug">${r.desc}</div>
                            <div class="text-[10px] text-amber-300/80 mt-1">Mechanic: ${r.mechanic}</div>
                            ${r.video && r.failureVideo ? '<div class="text-[9px] text-cyan-400 mt-1">★ Dedicated victory + defeat cinematics</div>' : (r.video ? '<div class="text-[9px] text-cyan-400 mt-1">★ Dedicated cinematic on defeat</div>' : '<div class="text-[9px] text-violet-400/80 mt-1">Cutscene pending</div>')}
                        </div>
                    </div>
                </div>
            `).join('');

            arenaSection.innerHTML = `
                <div class="max-w-5xl mx-auto">
                    <div class="flex items-end justify-between mb-4">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-red-400">GROK-TALK BATTLE ARENA</div>
                            <div class="text-3xl font-black">Rivals Roster</div>
                        </div>
                        <button onclick="navigateTo('arena')" class="text-xs px-4 py-1.5 border border-gray-700 rounded-2xl hover:bg-[#1a1f2e]">BACK TO ARENA</button>
                    </div>
                    <p class="text-sm text-gray-400 mb-6 max-w-2xl">These are the signature foes the Fused Panda faces in the demo battles. Each brings unique art, difficulty, and mechanics. Victories (or defeats) against them trigger the matching Grok-powered cinematics (specific 10s cutscenes showing Fusion Panda defeating the rival, or the foe defeating Fusion Panda).</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${rivalsHtml}
                    </div>
                    <div class="mt-6 text-center">
                        <button onclick="renderBattleChampionSelect()" class="neon-button px-8 py-2 rounded-2xl text-sm font-bold">CHOOSE CHAMPION &amp; FIGHT</button>
                    </div>
                </div>
            `;
        }

        function renderBattleLanding() {
            const arenaSection = document.getElementById("section-arena");
            if (!arenaSection) return;
            if (window.__activeBattle) window.__activeBattle = null;
            arenaSection.innerHTML = `
                <div class="max-w-2xl mx-auto text-center py-12">
                    <div class="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(239,68,68,0.4)]">
                        <i class="fas fa-swords text-5xl text-white"></i>
                    </div>
                    
                    <h2 class="text-4xl font-black mb-3">Battle Arena</h2>
                    <p class="text-xl text-gray-400 max-w-md mx-auto">Real-time demo battles powered by dedicated avatar agencies (Fusion Panda, Red Panda, Lich Queen). Each attack move produces hit/miss/block clips. Full attack logs can be replayed by stringing the exact agency-generated 6s videos together for accurate battle flow.</p>
                    
                    <div class="mt-10 inline-flex items-center gap-x-2 px-6 py-3 bg-[#1a1f2e] rounded-3xl text-sm border border-gray-700">
                        <div class="flex -space-x-2">
                            <div class="w-7 h-7 bg-red-400 rounded-full flex items-center justify-center ring-2 ring-[#1a1f2e]"><span class="text-xs">🐼</span></div>
                            <div class="w-7 h-7 bg-orange-400 rounded-full flex items-center justify-center ring-2 ring-[#1a1f2e]"><span class="text-xs">🔥</span></div>
                        </div>
                        <span class="text-gray-400">6 signature rivals • Grok-powered cinematics live</span>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                        <button onclick="renderBattleChampionSelect()" 
                                class="neon-button px-8 py-3.5 rounded-3xl font-bold flex items-center gap-x-3 text-base">
                            <span>CHOOSE BATTLE PANDA</span>
                            <i class="fas fa-play"></i>
                        </button>

                        <button onclick="startQuickMatch()" 
                                class="px-6 py-3.5 rounded-3xl font-bold flex items-center gap-x-3 text-base border-2 border-red-400 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all">
                            <i class="fas fa-bolt"></i>
                            <span>NEW MATCH (Random)</span>
                        </button>
                    </div>

                    <button onclick="renderBattleRivals()" 
                            class="mt-3 text-xs px-4 py-2 rounded-2xl border border-gray-700 hover:border-red-400/60 text-red-300 flex items-center gap-x-2 mx-auto">
                        <i class="fas fa-users"></i>
                        <span>VIEW RIVALS ROSTER</span>
                    </button>

                    <div class="mt-4">
                        <button onclick="const av = (gameState && gameState.selectedAvatarId) || 'fusion-panda'; const sample = (av==='red-panda' ? (window.SAMPLE_REDPANDA || []) : (av==='lich-queen' ? SAMPLE_LICH_QUEEN_BATTLE_LOG_1 : (window.SAMPLE_FUSION || []))); if (!sample.length) { /* fallback use a simple one */ playAttackLogPlayback([{turn:1,moveId:'fusion_beam',moveName:'Fusion Beam',outcome:'hit',damage:18,isPlayer:true},{turn:2,moveId:'rift_slam',moveName:'Rift Slam',outcome:'hit',damage:22,isPlayer:true}], av); } else { playAttackLogPlayback(sample, av); }" class="text-xs px-3 py-1.5 rounded-xl border border-cyan-400/60 text-cyan-300 hover:bg-cyan-900/20">DEMO: Play sample agency replay for current avatar</button>
                    </div>
                </div>
            `;
        }

        function startQuickMatch() {
            // Quick match uses current selected avatar (from PLAYER_AVATARS) primarily; no collection panda needed
            const rival = BATTLE_RIVALS[Math.floor(Math.random() * BATTLE_RIVALS.length)];
            startDemoBattle(null, rival.id);
        }

        function startDemoBattle(championIndexOrNull = null, specificRivalId = null) {
            const arenaSection = document.getElementById("section-arena");
            // championIndex ignored; battle uses avatar from gameState.selectedAvatarId via __create + getBattleAvatar
            const battle = __createBattleMatch(null, specificRivalId);
            window.__activeBattle = battle;
            // Ensure full avatar loaded (already done in create, but set explicit)
            if (!battle.championAvatar) {
                battle.championAvatar = getBattleAvatar(battle);
            }
            battle.championAvatarId = battle.championAvatar.id;
            console.log('Started battle vs:', battle.enemyName, 'video will be:', battle.enemyVideo, 'failureVideo will be:', battle.enemyFailureVideo, 'using avatar agency:', battle.championAvatarId, 'avatar:', battle.championAvatar.name);
            const safePlayerName = __escapeBattleText(battle.playerName);
            const safeEnemyName = __escapeBattleText(battle.enemyName);

            // Prepare avatar data for dynamic choice UI (moves + tacticDeck) inside the template
            const activeAvatarId = battle.championAvatarId || (gameState && gameState.selectedAvatarId) || 'fusion-panda';
            const avatarForUI = PLAYER_AVATARS.find(a => a.id === activeAvatarId) || PLAYER_AVATARS[0];
            const moveList = getAvatarMoves(activeAvatarId);
            const tacticList = getAvatarTactics(activeAvatarId);
            const avatarColor = battle.playerColor || avatarForUI.color || '#22d3ee';

            arenaSection.innerHTML = `
                <div class="max-w-4xl mx-auto">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-red-400">LIVE ARENA</div>
                            <div class="text-2xl sm:text-4xl font-black">Epic Showdown</div>
                        </div>
                        <button type="button" onclick="renderBattleLanding()" class="w-full sm:w-auto px-5 py-2.5 text-xs border border-gray-700 rounded-2xl flex items-center justify-center gap-x-2 hover:bg-red-950/40 transition-colors">
                            <i class="fas fa-redo" aria-hidden="true"></i> <span>END BATTLE</span>
                        </button>
                    </div>
                    
                    <div id="battle-stage" class="battle-stage p-4 md:p-6 mb-6" role="img" aria-label="Battle arena, two fighters, animated attacks">
                    <div class="grid grid-cols-1 md:grid-cols-7 gap-3 md:gap-2 items-stretch min-h-[280px]">
                        <div id="battle-fighter-player" class="battle-fighter md:col-span-3 cyber-card rounded-3xl p-4 md:p-6 text-center border border-emerald-500/50 relative">
                            <div class="battle-anim-flash battle-anim-flash--emerald pointer-events-none" id="battle-flash-player" aria-hidden="true"></div>
                            <div class="text-xs mb-1 text-emerald-400">YOUR CHAMPION</div>
                            <div class="relative mb-2 min-h-[5rem] flex items-center justify-center" aria-hidden="true" id="player-fighter-visual">
                                <!-- Use base portrait from assets/avatars/ (via get) or agency reference; primary over emoji per spec. Video for action clips. -->
                                ${ (function(){ 
                                    const av = battle.championAvatar || PLAYER_AVATARS.find(a=>a.id=== (battle.championAvatarId||'fusion-panda')) || PLAYER_AVATARS[0];
                                    const portrait = (typeof getAvatarOutfitPath==='function' ? getAvatarOutfitPath(av.id) : `assets/avatars/${av.outfitStages ? (av.outfitStages.adept||av.outfitStages.initiate) : 'fusion-panda-base.jpg'}`);
                                    const col = battle.playerColor || av.color || '#22d3ee';
                                    return `<img src="${portrait}" alt="${av.name}" class="max-h-28 md:max-h-32 w-auto rounded-2xl object-cover shadow-lg border-2" style="border-color:${col}; max-width:78%;" />`;
                                })() }
                                <span class="battle-fighter__emoji text-6xl sm:text-8xl hidden" id="battle-emoji-player">${battle.playerEmoji}</span>
                                <video id="player-action-video" class="w-full h-auto max-h-40 rounded-xl absolute inset-0 hidden" muted playsinline></video>
                            </div>
                            <div class="font-black text-lg md:text-2xl" style="color:${battle.playerColor || '#22d3ee'}">${safePlayerName}</div>
                            <div class="text-xs sm:text-sm text-emerald-400/90 mb-3">LVL ${battle.playerLevel} · ${battle.playerPower} PWR <span class="text-[9px] opacity-70">(${ (battle.championAvatar ? battle.championAvatar.element : '') })</span></div>
                            <div class="mt-1 h-2.5 bg-gray-800/90 rounded-full overflow-hidden">
                                <div id="battle-hp-player-bar" class="h-2.5 bg-emerald-400 rounded-full transition-[width] duration-500 ease-out" style="width:100%"></div>
                            </div>
                            <div id="battle-hp-player-text" class="text-xs mt-1.5 text-gray-400 font-mono">${battle.playerCur} / ${battle.playerMax} HP</div>
                        </div>
                        
                        <div class="md:col-span-1 flex flex-col justify-center items-center gap-3 py-2 min-h-[100px]">
                            <div class="text-center">
                                <div class="text-red-500 text-4xl md:text-5xl font-black" aria-hidden="true">VS</div>
                                <div class="text-[10px] tracking-[0.2em] text-gray-500 mt-1">ROUND <span id="battle-round">1</span></div>
                            </div>
                            <div class="w-full max-w-[100px] px-1" aria-hidden="true">
                                <div id="battle-beam" class="battle-beam w-full"></div>
                            </div>
                            <p class="text-[9px] text-center text-gray-600 max-w-[7rem] leading-tight">Beams = fusion energy (demo)</p>
                        </div>
                        
                        <div id="battle-fighter-enemy" class="battle-fighter md:col-span-3 cyber-card rounded-3xl p-4 md:p-6 text-center border border-red-500/50 overflow-hidden">
                            <div class="battle-anim-flash battle-anim-flash--red pointer-events-none" id="battle-flash-enemy" aria-hidden="true"></div>
                            <div class="text-xs mb-1 text-red-400">RIVAL</div>
                            <div id="enemy-fighter-visual" class="mb-2 min-h-[5rem] flex items-center justify-center relative" aria-hidden="true" style="background: radial-gradient(circle at 50% 40%, rgba(0,0,0,0.1), transparent);">
                                ${battle.enemyArt ? `
                                    <img src="${battle.enemyArt}" alt="${safeEnemyName}" class="max-h-28 md:max-h-32 w-auto rounded-2xl object-cover shadow-lg border border-white/10" style="max-width: 70%;"/>
                                ` : `
                                    <span class="battle-fighter__emoji text-6xl sm:text-8xl" id="battle-emoji-enemy">${battle.enemyEmoji}</span>
                                `}
                                <!-- Reserved space for <video> agency clips on enemy side (play via future play logic) -->
                                <video id="enemy-action-video" class="hidden absolute inset-0 w-full h-full object-contain rounded-2xl" muted playsinline></video>
                            </div>
                            <div class="font-black text-lg md:text-2xl">${safeEnemyName}</div>
                            ${battle.enemySubtitle ? `<div class="text-[10px] text-red-300/80 -mt-0.5 mb-1">${__escapeBattleText(battle.enemySubtitle)}</div>` : ''}
                            <div class="text-xs sm:text-sm text-red-400/90 mb-1">LVL ${battle.enemyLevel} · ${battle.enemyPower} PWR</div>
                            ${battle.enemyDifficulty ? `<div class="inline-block mb-2 px-1.5 py-px text-[9px] font-bold rounded bg-red-500/20 text-red-300">${battle.enemyDifficulty}</div>` : ''}
                            ${battle.enemyMechanic ? `<div class="text-[10px] text-zinc-400 mb-1.5 leading-tight">${__escapeBattleText(battle.enemyMechanic)}</div>` : ''}
                            <div class="mt-1 h-2.5 bg-gray-800/90 rounded-full overflow-hidden">
                                <div id="battle-hp-enemy-bar" class="h-2.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-[width] duration-500 ease-out" style="width:100%"></div>
                            </div>
                            <div id="battle-hp-enemy-text" class="text-xs mt-1.5 text-gray-400 font-mono">${battle.enemyCur} / ${battle.enemyMax} HP</div>
                        </div>
                    </div>
                    </div>
                    
                    <div class="mt-2 cyber-card rounded-3xl p-4 text-sm">
                        <div class="flex items-center justify-between text-xs px-1 mb-2">
                            <div class="font-mono text-gray-400">COMBAT LOG</div>
                            <div class="font-mono text-emerald-500/90 text-[10px]">◇ ANIMATED</div>
                        </div>
                        <div class="space-y-1.5 text-xs font-mono bg-black/50 p-3 rounded-2xl max-h-36 overflow-y-auto" id="battle-log">
                            <div class="text-gray-500">Select an ACTION + TACTIC CARD, then hit EXECUTE TURN. Results drive avatar agency video playback.</div>
                        </div>
                    </div>
                    
                    <!-- INCREDIBLE BATTLE CONTROLS: Beautiful functional grids for Action (3 big buttons), Move selector (4 cards w/ type+desc), Tactic deck (4 cards w/ badge+stats+desc), big EXECUTE (selection gated), Special meter, RESOLVING overlay during video, avatar accent color, neon selected glow, mobile grids, cyber-card integration, rich tooltips + hovers. -->
                    <div id="battle-controls" class="mt-5 cyber-card rounded-3xl p-4 md:p-5 border border-white/10 relative" style="--accent:${avatarColor};">
                        <!-- Special Meter bar (0-10) -->
                        <div class="mb-4">
                            <div class="flex items-center justify-between mb-1 px-0.5">
                                <div class="uppercase tracking-[1.5px] text-[10px] font-mono flex items-center gap-1.5" style="color:#c026ff">
                                    <i class="fas fa-bolt"></i> SPECIAL METER
                                </div>
                                <div id="special-meter-val" class="font-mono text-xs text-fuchsia-300 tabular-nums">0/10</div>
                            </div>
                            <div class="h-3 bg-[#11151f] rounded-full overflow-hidden border border-white/10">
                                <div id="special-meter-bar" class="h-3 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-pink-500 transition-[width] duration-300" style="width:0%"></div>
                            </div>
                            <div class="text-[9px] text-gray-500 mt-0.5 px-0.5">Tactics charge it. Special gated at 8+ meter (spends on use for bonus dmg + RPS depth).</div>
                        </div>

                        <!-- CHOOSE ACTION: 3 BIG buttons Attack/Block/Special (Special disabled until meter high) -->
                        <div class="mb-4">
                            <div class="uppercase tracking-[1.5px] text-xs font-mono mb-2 px-0.5" style="color:var(--accent)">CHOOSE ACTION</div>
                            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                                <button id="action-attack" type="button" onclick="selectBattleAction('attack')" class="battle-action-btn text-emerald-300 border-emerald-500/30 hover:border-emerald-400 active:scale-[0.985] py-3 text-sm" title="Attack: Select one of your 4 signature moves to strike the rival.">
                                    <i class="fas fa-fist-raised"></i> <span class="font-extrabold tracking-[0.5px]">ATTACK</span>
                                </button>
                                <button id="action-block" type="button" onclick="selectBattleAction('block')" class="battle-action-btn text-sky-300 border-sky-500/30 hover:border-sky-400 active:scale-[0.985] py-3 text-sm" title="Block: Raise defenses. High incoming mitigation this turn. No move pick needed.">
                                    <i class="fas fa-shield-alt"></i> <span class="font-extrabold tracking-[0.5px]">BLOCK</span>
                                </button>
                                <button id="action-special" type="button" onclick="selectBattleAction('special')" class="battle-action-btn text-fuchsia-300 border-fuchsia-500/30 hover:border-fuchsia-400 active:scale-[0.985] py-3 text-sm" title="Special: Unleash powered version of a chosen move. Requires 8+ meter. Spends on EXECUTE for extra damage + full resolve bonuses.">
                                    <i class="fas fa-magic"></i> <span class="font-extrabold tracking-[0.5px]">SPECIAL</span>
                                </button>
                            </div>
                        </div>

                        <!-- MOVE SELECTOR: 4 cards from avatar.moves, clickable, shows type (melee/ranged/special), desc. Neon selected glow. Tooltips. -->
                        <div id="move-selector-area" class="mb-4">
                            <div class="uppercase tracking-[1.5px] text-xs font-mono text-cyan-400 mb-1.5 px-0.5">MOVE SELECTOR — 4 SIGNATURE MOVES</div>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                ${moveList.map(m => `
                                    <button id="move-${m.id}" type="button" onclick="selectBattleMove('${m.id}')" class="move-card cyber-card border-gray-700 text-left p-2.5 flex flex-col hover:border-cyan-400/60 active:scale-[0.985]" title="${__escapeBattleText(m.name)} (${m.type.toUpperCase()})\n${__escapeBattleText(m.desc)}">
                                        <div class="flex items-start justify-between gap-2">
                                            <div class="font-extrabold text-[13px] leading-tight tracking-[-0.1px] pr-1">${__escapeBattleText(m.name)}</div>
                                            <span class="move-type ${m.type} flex-shrink-0">${m.type}</span>
                                        </div>
                                        <div class="text-[10px] text-gray-400 mt-1 leading-snug line-clamp-2 flex-1">${__escapeBattleText(m.desc)}</div>
                                        <div class="text-[8px] text-gray-500 mt-1 opacity-70">Click to select</div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- TACTIC DECK: 4 cards from tacticDeck, shows category badge, element, SPD, CHG, energyMult, bonusDesc. Incredible hovers, neon select, full tooltips. -->
                        <div class="mb-4">
                            <div class="uppercase tracking-[1.5px] text-xs font-mono text-amber-400 mb-1.5 px-0.5">TACTIC DECK — CHOOSE 1 CARD</div>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                ${tacticList.map(t => `
                                    <button id="tactic-${t.id}" type="button" onclick="selectBattleTactic('${t.id}')" class="tactic-card cyber-card border-gray-700 text-left p-2.5 flex flex-col hover:border-amber-400/70 active:scale-[0.985]" title="Category: ${t.category} • Element: ${t.element}\nSPD ${t.speedMod >= 0 ? '+' : ''}${t.speedMod} • +${t.specialCharge} CHG • ×${t.energyMult} energy\n${__escapeBattleText(t.bonusDesc)}">
                                        <div class="flex items-center justify-between gap-1 mb-0.5">
                                            <div class="font-extrabold text-[12.5px] leading-none">${__escapeBattleText(t.name)}</div>
                                            <span class="cat-badge ${t.category} flex-shrink-0">${t.category}</span>
                                        </div>
                                        <div class="flex items-center gap-1 mb-1">
                                            <span class="text-[9px] px-1.5 py-px rounded bg-white/5 text-gray-300">${__escapeBattleText(t.element)}</span>
                                        </div>
                                        <div class="text-[9.5px] font-mono text-gray-300 flex flex-wrap gap-x-2 gap-y-0.5">
                                            <span>SPD${t.speedMod>=0?'+':''}${t.speedMod}</span>
                                            <span>+${t.specialCharge}CHG</span>
                                            <span>×${t.energyMult}</span>
                                        </div>
                                        <div class="text-[9px] leading-snug text-emerald-300/80 mt-1 pt-0.5 border-t border-white/10">${__escapeBattleText(t.bonusDesc)}</div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- EXECUTE big button (enabled ONLY on valid selections: action+move or block + tactic). Avatar accent neon when ready. -->
                        <div class="flex flex-col sm:flex-row items-stretch gap-2 mt-1">
                            <button id="battle-execute-btn" type="button" onclick="executePlayerTurn()" disabled
                                class="execute-turn-btn flex-1 bg-gray-800 border border-gray-700 text-gray-500 font-black uppercase tracking-[2.5px] flex items-center justify-center gap-x-2 py-3 disabled:opacity-60 rounded-2xl">
                                <i class="fas fa-play-circle text-lg"></i>
                                <span>EXECUTE TURN</span>
                            </button>
                            <button onclick="clearBattleSelections()" class="px-4 text-xs border border-white/20 hover:bg-white/5 rounded-2xl text-gray-400 flex-shrink-0 active:bg-white/10">CLEAR</button>
                            <button type="button" onclick="if (window.__activeBattle && window.__activeBattle.attackLog && window.__activeBattle.attackLog.length) { const av = (gameState && gameState.selectedAvatarId) || window.__activeBattle.championAvatarId || 'fusion-panda'; playAttackLogPlayback(window.__activeBattle.attackLog, av); } else { showToast('Fight a battle first to generate an attack log!', 'info'); }" class="px-3.5 text-xs border border-cyan-400/70 text-cyan-300 rounded-2xl hover:bg-cyan-500/10 flex items-center gap-x-1 flex-shrink-0 active:bg-cyan-500/20">
                                <i class="fas fa-film"></i> <span class="hidden sm:inline">REPLAY</span>
                            </button>
                        </div>

                        <!-- RESOLVING... overlay: shown + disables all during video playback. Per-turn reset after full round. -->
                        <div id="battle-resolving-overlay" class="hidden absolute inset-0 z-[30] bg-[#0a0c14]/95 backdrop-blur rounded-3xl flex items-center justify-center pointer-events-auto" style="border:1px solid rgba(255,255,255,0.06)">
                            <div class="text-center px-4">
                                <div class="uppercase tracking-[3.5px] text-amber-400 text-xs font-mono mb-1">AVATAR AGENCY</div>
                                <div class="font-black text-white text-2xl sm:text-3xl tracking-[-1.2px]">RESOLVING...</div>
                                <div class="mt-2 text-[10px] text-gray-400">Cinematic playing • Controls locked until round complete</div>
                            </div>
                        </div>
                    </div>

                    <div class="text-[10px] text-center text-gray-500 mt-1.5">Action → Move (or Block) → Tactic → EXECUTE. Neon glow on selections. Uses your avatar's color. Fully mobile responsive grids.</div>
                </div>
            `;
            __syncBattleHpBars();

            // Ensure base state for new turn-based flow (uses battle from outer scope in startDemoBattle)
            if (typeof battle !== 'undefined' && battle) {
                battle.specialMeter = (typeof battle.specialMeter === 'number') ? battle.specialMeter : 0;
                battle.selectedMove = battle.selectedMove || null;
                battle.selectedTactic = battle.selectedTactic || null;
                battle.selectedAction = battle.selectedAction || null;
            }
            // Wire beautiful new controls (no more legacy initBattleChoicesAndControls which targeted removed #battle-actions)
            try {
                updateSpecialMeterUI();
                updateBattleSelectionsUI();
                // Exec state + special gate already handled inside updateBattleSelectionsUI + selectBattleAction
                const specialBtn = document.getElementById('action-special');
                if (specialBtn && b) {
                    const cost = 8; // consistent with spend threshold in resolve (specialThreshold ~10, practical gate 8)
                    const meterOk = (b.specialMeter || 0) >= cost;
                    if (!meterOk) {
                        specialBtn.classList.add('opacity-40', 'cursor-not-allowed');
                        specialBtn.title = `Special requires ${cost}+ Special Meter (tactics charge it)`;
                    } else {
                        specialBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                        specialBtn.title = 'Unleash powered special (spends meter on execute for bonus dmg)';
                    }
                }
            } catch(e) { /* graceful */ }
        }

        async function simulateBattleAttack(element, isSpecial = false) {
            // Legacy path (used by fallback buttons): now delegates to resolve + live agency video flow for consistency.
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            if (element && element.disabled) return;

            // Disable legacy buttons if present
            const atkBtn = document.getElementById("battle-attack-btn");
            const spBtn = document.getElementById("battle-special-btn");
            if (atkBtn) atkBtn.disabled = true;
            if (spBtn) spBtn.disabled = true;

            const actionBtns = document.querySelectorAll('#battle-actions .battle-move-btn');
            actionBtns.forEach(btn => { btn.disabled = true; });

            const activeAvatarId = (gameState && gameState.selectedAvatarId) || b.championAvatarId || 'fusion-panda';
            const resolved = resolveBattleAction(activeAvatarId, null, isSpecial); // random move (keeps old behavior)

            recordAttackLog(b, b.playerName, resolved.move, resolved.outcome, resolved.dmg, true);

            // Use the new video play path (cinematic, waits for ended before result + enemy)
            playPlayerAgencyVideo(activeAvatarId, resolved);
            // Note: old awaits removed; flow now driven by video 'ended' or fallback inside playPlayerAgencyVideo.
        }

        // ============================================================
        // INCREDIBLE TURN-BASED BATTLE UI CONTROLS
        // Beautiful grids (action 3-btn, 4 move cards, 4 tactic cards), neon glow selected (cyber + avatar accent), 
        // EXECUTE only on full selections, Special disabled <5 meter, full tooltips, mobile grids,
        // RESOLVING overlay + disable during video, per-turn reset after player+enemy round.
        // Fully wired to the controls HTML in startDemoBattle.
        // ============================================================

        function updateSpecialMeterUI() {
            const b = window.__activeBattle;
            if (!b) return;
            const valEl = document.getElementById('special-meter-val');
            const barEl = document.getElementById('special-meter-bar');
            const max = b.maxSpecialMeter || 10;
            const meter = Math.max(0, Math.min(max, b.specialMeter || 0));
            if (valEl) valEl.textContent = `${meter}/${max}`;
            if (barEl) {
                const pct = Math.round((meter / max) * 100);
                barEl.style.width = pct + '%';
            }
        }

        function refreshSpecialActionState() {
            const b = window.__activeBattle;
            const specialBtn = document.getElementById('action-special');
            if (!b || !specialBtn) return;
            const meterOk = (b.specialMeter || 0) >= 5;
            specialBtn.disabled = !meterOk;
            if (!meterOk) {
                specialBtn.classList.add('opacity-40', 'cursor-not-allowed');
                specialBtn.title = 'Special requires 5+ Special Meter';
            } else {
                specialBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                specialBtn.title = 'Unleash a powered special (costs meter)';
            }
        }

        function updateBattleSelectionsUI() {
            const b = window.__activeBattle;
            if (!b) return;

            // Clear all previous selection highlights (neon glow reset)
            document.querySelectorAll('.battle-action-btn, .move-card, .tactic-card').forEach(el => {
                el.classList.remove('selected-neon', 'ring-2', 'ring-[#00ff9d]', 'border-[#00ff9d]', 'shadow-[0_0_15px_rgba(0,255,157,0.35)]');
                el.style.boxShadow = '';
                el.style.borderColor = '';
                el.classList.add('border-gray-700');
            });

            const accent = b.playerColor || '#22d3ee';

            // Highlight chosen action (big 3 buttons)
            if (b.selectedAction) {
                const actBtn = document.getElementById(`action-${b.selectedAction}`);
                if (actBtn) {
                    actBtn.classList.add('selected-neon', 'ring-2', 'ring-[#00ff9d]', 'border-[#00ff9d]');
                    actBtn.classList.remove('border-gray-700');
                    // Avatar accent subtle glow on the chosen action
                    actBtn.style.boxShadow = `0 0 0 1px #00ff9d, 0 0 14px ${accent}33`;
                }
            }

            // Highlight chosen move card (incredible neon + accent)
            if (b.selectedMove && b.selectedMove.id) {
                const moveCard = document.getElementById(`move-${b.selectedMove.id}`);
                if (moveCard) {
                    moveCard.classList.add('selected-neon', 'ring-2', 'ring-[#00ff9d]', 'border-[#00ff9d]');
                    moveCard.classList.remove('border-gray-700');
                    moveCard.style.boxShadow = `0 0 0 1px #00ff9d, 0 0 18px ${accent}40`;
                }
            }

            // Highlight chosen tactic card
            if (b.selectedTactic && b.selectedTactic.id) {
                const tacCard = document.getElementById(`tactic-${b.selectedTactic.id}`);
                if (tacCard) {
                    tacCard.classList.add('selected-neon', 'ring-2', 'ring-[#00ff9d]', 'border-[#00ff9d]');
                    tacCard.classList.remove('border-gray-700');
                    tacCard.style.boxShadow = `0 0 0 1px #00ff9d, 0 0 18px ${accent}40`;
                }
            }

            updateExecuteBtn();
            refreshSpecialActionState();
        }

        function updateExecuteBtn() {
            const b = window.__activeBattle;
            const btn = document.getElementById('battle-execute-btn');
            if (!btn || !b) return;
            const hasMoveOrBlock = !!b.selectedMove || b.selectedAction === 'block';
            const ready = hasMoveOrBlock && !!b.selectedTactic && !b.ended;
            btn.disabled = !ready;

            const accent = b.playerColor || '#22d3ee';
            if (ready) {
                // INCREDIBLE ready state: neon cyan + avatar color gradient + strong glow
                btn.style.background = `linear-gradient(to right, #00ff9d, ${accent})`;
                btn.style.color = '#0a0a0f';
                btn.style.borderColor = accent;
                btn.style.boxShadow = `0 0 0 1px #00ff9d, 0 0 28px ${accent}66, 0 10px 20px -5px rgba(0,0,0,0.6)`;
                btn.classList.add('neon-button');
            } else {
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.style.boxShadow = '';
                btn.classList.remove('neon-button');
            }
        }

        function selectBattleAction(action) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            if (action === 'special' && (b.specialMeter || 0) < 8) {
                showToast('Special Move requires at least 8 Special Meter (build via tactics)!', 'info');
                return;
            }

            b.selectedAction = action;

            if (action === 'block') {
                // Virtual block "move" — no move selector needed
                b.selectedMove = { id: 'block', name: 'Block', desc: 'Raise defenses this turn. Reduces incoming damage.', type: 'block' };
            } else {
                // For attack/special: clear stale block virtual move
                if (b.selectedMove && b.selectedMove.id === 'block') b.selectedMove = null;
            }

            // Show/hide visual cue on move selector area (Block disables move cards)
            const moveArea = document.getElementById('move-selector-area');
            if (moveArea) {
                if (action === 'block') {
                    moveArea.style.opacity = '0.4';
                    moveArea.style.pointerEvents = 'none';
                } else {
                    moveArea.style.opacity = '1';
                    moveArea.style.pointerEvents = 'auto';
                }
            }

            updateBattleSelectionsUI();
            updateExecuteBtn();
        }

        function selectBattleMove(moveId) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            const moves = (b.moves && b.moves.length) ? b.moves : getAvatarMoves(b.championAvatarId || activeAvatarId || 'fusion-panda');
            const move = moves.find(m => m.id === moveId);
            if (!move) return;

            b.selectedMove = move;

            // Auto-infer/set action if missing or was block
            if (!b.selectedAction || b.selectedAction === 'block') {
                b.selectedAction = (move.type === 'special') ? 'special' : 'attack';
            }

            // If user picked a special-type move while action=attack, optionally promote (user can still change action)
            if (move.type === 'special' && b.selectedAction === 'attack') {
                b.selectedAction = 'special';
            }

            // If Block was active and move picked, lift the disabled move area
            const moveArea = document.getElementById('move-selector-area');
            if (moveArea) {
                moveArea.style.opacity = '1';
                moveArea.style.pointerEvents = 'auto';
            }

            updateBattleSelectionsUI();
            updateExecuteBtn();
        }

        function selectBattleTactic(tacticId) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            const tactics = (b.tacticDeck && b.tacticDeck.length) ? b.tacticDeck : getAvatarTactics(b.championAvatarId || 'fusion-panda');
            const tactic = tactics.find(t => t.id === tacticId);
            if (!tactic) return;

            b.selectedTactic = tactic;

            updateBattleSelectionsUI();
            updateExecuteBtn();
        }

        function resetBattleSelections(full = true) {
            const b = window.__activeBattle;
            if (!b) return;
            b.selectedAction = null;
            b.selectedMove = null;
            b.selectedTactic = null;

            // Clear all visual selected states + restore areas
            document.querySelectorAll('.battle-action-btn, .move-card, .tactic-card').forEach(el => {
                el.classList.remove('selected-neon', 'ring-2', 'ring-[#00ff9d]', 'border-[#00ff9d]', 'shadow-[0_0_15px_rgba(0,255,157,0.35)]');
                el.style.boxShadow = '';
                el.style.borderColor = '';
                el.classList.add('border-gray-700');
            });

            const moveArea = document.getElementById('move-selector-area');
            if (moveArea) {
                moveArea.style.opacity = '1';
                moveArea.style.pointerEvents = 'auto';
            }

            updateExecuteBtn();
            refreshSpecialActionState();
        }

        // Used by execute + video flow: disable ALL choice UI + show incredible RESOLVING overlay
        function disableBattleUIForResolution(disabled) {
            const overlay = document.getElementById('battle-resolving-overlay');
            const controls = document.getElementById('battle-controls');
            const allInteractive = document.querySelectorAll('#battle-controls .battle-action-btn, #battle-controls .move-card, #battle-controls .tactic-card, #battle-execute-btn, #battle-controls button[onclick*="clearBattleSelections"]');

            if (overlay) {
                if (disabled) {
                    overlay.classList.remove('hidden');
                    overlay.style.display = 'flex';
                } else {
                    overlay.classList.add('hidden');
                    overlay.style.display = '';
                }
            }
            allInteractive.forEach(el => {
                el.disabled = !!disabled;
                if (disabled) {
                    el.style.pointerEvents = 'none';
                    el.style.opacity = (el.id === 'battle-execute-btn' ? '0.3' : '0.45');
                } else {
                    el.style.pointerEvents = '';
                    el.style.opacity = '';
                }
            });
            if (controls) controls.style.pointerEvents = disabled ? 'none' : '';
        }

        // Main wiring for the big EXECUTE TURN button. Full round: resolve + video (with overlay) + enemy + reset.
        async function executePlayerTurn() {
            const b = window.__activeBattle;
            const logEl = document.getElementById("battle-log");
            if (!b || b.ended || !logEl) return;

            const hasChoice = (b.selectedMove && b.selectedMove.id) || b.selectedAction === 'block';
            if (!hasChoice || !b.selectedTactic) {
                showToast('Choose an ACTION (Attack/Block/Special) + a TACTIC CARD first!', 'info');
                return;
            }

            const move = b.selectedMove || { id: 'block', name: 'Block', type: 'block' };
            const tactic = b.selectedTactic;
            const isSpecial = b.selectedAction === 'special';
            const isBlock = b.selectedAction === 'block' || move.id === 'block' || move.type === 'block';
            const activeAvatarId = b.championAvatarId || (gameState && gameState.selectedAvatarId) || 'fusion-panda';

            // === DISABLE + SHOW RESOLVING OVERLAY (during video) ===
            disableBattleUIForResolution(true);
            const execBtn = document.getElementById('battle-execute-btn');
            if (execBtn) execBtn.disabled = true;

            // Canonical resolve (charges meter from tactic, spends if special qualified, applies elem/RPS/speed/energyMult/block mit, mutates HP, records to attackLog for replay)
            const playerRes = resolvePlayerTurn(b, move, tactic, isBlock);

            const outcome = playerRes.outcome || 'hit';
            const dmg = playerRes.damage || 0;
            const attackName = isBlock ? 'BLOCK' : (playerRes.moveName || move.name || 'Attack');

            // === PLAY CINEMATIC VIDEO FOR PLAYER ACTION (the key "during video" phase) ===
            try {
                await playPlayerActionVideoForTurn(activeAvatarId, move.id || 'block', outcome, tactic);
            } catch (e) {
                await new Promise(r => setTimeout(r, 900));
            }

            // Visuals + on-screen log (resolver already handled damage + recordAttackLog)
            const pCard = document.getElementById("battle-fighter-player");
            const eCard = document.getElementById("battle-fighter-enemy");
            const pFlash = document.getElementById("battle-flash-player");
            const eFlash = document.getElementById("battle-flash-enemy");
            const beam = document.getElementById("battle-beam");

            if (pCard) pCard.classList.add("battle-anim-attack-left");
            if (beam) {
                __resetBeam(beam);
                if (isSpecial) {
                    beam.style.background = "linear-gradient(90deg, #a855f7, #e879f9, #f43f5e)";
                    beam.classList.add("battle-beam--special");
                } else if (isBlock) {
                    beam.style.background = "linear-gradient(90deg, #38bdf8, #64748b, #0ea5e9)";
                } else {
                    beam.style.background = "linear-gradient(90deg, #10b981, #2dd4bf, #a855f7)";
                }
                beam.classList.add("battle-beam--to-enemy");
            }
            await __battleWait(90);

            __syncBattleHpBars();
            if (eCard) {
                eCard.classList.add("battle-anim-shake");
                if (eFlash) eFlash.classList.add("battle-anim-flash--on", "battle-anim-flash--red");
                __spawnBattleFloatingDmg(eCard, dmg, isSpecial);
            }

            let logClass = isSpecial ? "text-fuchsia-300" : (isBlock ? "text-sky-300" : "text-emerald-300");
            let logHtml = `${__escapeBattleText(b.playerName)} used <span class="font-bold">${__escapeBattleText(attackName)}</span> <span class="text-white/60">→</span> <span class="font-mono">${dmg} DMG</span>`;
            if (playerRes && playerRes.elemMult && Math.abs(playerRes.elemMult - 1.05) > 0.02) logHtml += ` <span class="text-[10px] text-amber-300">(${playerRes.elemMult.toFixed(2)}x)</span>`;
            if (tactic) logHtml += ` <span class="text-[10px] text-gray-500">[${__escapeBattleText(tactic.name)}]</span>`;
            if (playerRes && playerRes.specialTriggered) logHtml += ' <span class="text-fuchsia-400 text-[10px]">★SPECIAL</span>';
            __appendBattleLogLine(logClass, logHtml);

            await __battleWait(420);
            if (pCard) pCard.classList.remove("battle-anim-attack-left");
            if (eCard) eCard.classList.remove("battle-anim-shake");
            if (eFlash) eFlash.classList.remove("battle-anim-flash--on", "battle-anim-flash--red");
            if (beam) beam.classList.remove("battle-beam--to-enemy", "battle-beam--special");

            // Victory?
            if (b.enemyCur <= 0) {
                b.ended = true;
                b.enemyCur = 0;
                __syncBattleHpBars();
                if (eCard) { eCard.classList.add("battle-fighter--defeated"); eCard.setAttribute("aria-hidden", "true"); }
                document.getElementById("battle-stage")?.classList.add("battle-stage--victory");
                __appendBattleLogLine("text-amber-300 font-bold border-t border-amber-500/20 pt-2 mt-1", `🏆 VICTORY! ${__escapeBattleText(b.enemyName)} defeated! +650 XP`);
                showToast("Battle won! +650 XP earned", "success");
                bumpLifetimeEarnedXp(650);
                gameState.xp += 650;
                if (gameState.xp >= 10000) { gameState.level++; gameState.xp %= 10000; setTimeout(showLevelUp, 1200); }
                saveGameState(); updateDashboard();
                disableBattleUIForResolution(false); // leave overlay off on end
                setTimeout(() => { if (typeof window.showInArenaCinematic === 'function') window.showInArenaCinematic(b); }, 650);
                return;
            }

            await __battleWait(280);

            // === ENEMY TURN (full round) ===
            const roundEl = document.getElementById("battle-round");
            const enemyRes = resolveEnemyTurn(b, tactic);
            const enemyDmg = enemyRes ? enemyRes.damage : 0;
            const enemyAttack = (enemyRes && enemyRes.moveName) || 'ENEMY STRIKE';

            if (eCard) eCard.classList.add("battle-anim-attack-right");
            if (beam) {
                __resetBeam(beam);
                beam.style.background = "linear-gradient(90deg, #f43f5e, #a855f7, #10b981)";
                beam.classList.add("battle-beam--to-player");
            }
            await __battleWait(80);

            __syncBattleHpBars();
            if (pCard) {
                pCard.classList.add("battle-anim-shake");
                if (pFlash) pFlash.classList.add("battle-anim-flash--on", "battle-anim-flash--emerald");
                __spawnBattleFloatingDmg(pCard, enemyDmg, false);
            }
            let eLog = `${__escapeBattleText(b.enemyName)}: <span class="font-bold">${__escapeBattleText(enemyAttack)}</span> <span class="text-white/60">→</span> <span class="font-mono text-white">${enemyDmg} DMG</span>`;
            if (enemyRes && enemyRes.elemMult && Math.abs(enemyRes.elemMult - 1.05) > 0.02) eLog += ` <span class="text-[10px] text-amber-300">(${enemyRes.elemMult.toFixed(2)}x)</span>`;
            __appendBattleLogLine("text-rose-300", eLog);

            await __battleWait(420);
            if (eCard) eCard.classList.remove("battle-anim-attack-right");
            if (pCard) pCard.classList.remove("battle-anim-shake");
            if (pFlash) pFlash.classList.remove("battle-anim-flash--on", "battle-anim-flash--emerald");
            if (beam) beam.classList.remove("battle-beam--to-player");

            // Defeat?
            if (b.playerCur <= 0) {
                b.ended = true;
                b.playerCur = 0;
                __syncBattleHpBars();
                if (pCard) { pCard.classList.add("battle-fighter--defeated"); pCard.setAttribute("aria-hidden", "true"); }
                document.getElementById("battle-stage")?.classList.add("battle-stage--defeat");
                __appendBattleLogLine("text-rose-300 font-bold border-t border-rose-500/20 pt-2 mt-1", `💀 DEFEAT! ${__escapeBattleText(b.playerName)} was overpowered by ${__escapeBattleText(b.enemyName)}.`);
                disableBattleUIForResolution(false);
                setTimeout(() => { if (typeof window.showInArenaFailureCinematic === 'function') window.showInArenaFailureCinematic(b); }, 650);
                return;
            }

            // === PER TURN RESET AFTER FULL ROUND ===
            b.round = (b.round || 1) + 1;
            if (roundEl) roundEl.textContent = String(b.round);

            resetBattleSelections(true);
            updateSpecialMeterUI();
            updateBattleSelectionsUI();
            updateExecuteBtn();
            refreshSpecialActionState();

            // Re-enable everything (overlay hidden)
            disableBattleUIForResolution(false);
        }

        // Compat shims for any lingering older calls (clear / enable)
        function clearBattleSelections() { resetBattleSelections(true); }
        function setBattleControlsEnabled(enabled) { disableBattleUIForResolution(!enabled); }

        // Legacy small update fn kept for any old references
        function updateExecuteEnabledState() { updateExecuteBtn(); }

        // ============================================================
        // End incredible battle choice controls
        // ============================================================

        // Grok-talk Battle Arena cinematic victory player
        // Uses the high-quality Fusion Panda victory cutscene + concept art generated for the arena.
        window.showVictoryCinematic = function showVictoryCinematic(battleData) {
            console.log('Victory cinematic for:', battleData ? battleData.enemyName : 'unknown', 'using video:', battleData ? battleData.enemyVideo : null);
            const enemyName = (battleData && battleData.enemyName) || 'Void Howler';
            const playerName = (battleData && battleData.playerName) || 'Fusion Panda';
            const enemyDiff = battleData && battleData.enemyDifficulty ? battleData.enemyDifficulty : '';
            const enemyMech = battleData && battleData.enemyMechanic ? battleData.enemyMechanic : '';
            const safeEnemyMech = typeof __escapeBattleText === 'function' ? __escapeBattleText(enemyMech) : enemyMech;

            const hasVideo = !!(battleData && battleData.enemyVideo);
            const videoSrc = hasVideo ? battleData.enemyVideo : null;
            const posterSrc = (battleData && battleData.enemyKeyart) || (battleData && battleData.enemyArt) || 'assets/arena/opponent-chroma-lynx.jpg';

            // Remove any existing cinematic
            const existing = document.getElementById('victory-cinematic-modal');
            if (existing) existing.remove();

            let modalPlayerHTML = '';
            if (hasVideo) {
                modalPlayerHTML = `
                    <video id="vc-video" class="w-full aspect-video bg-black" playsinline controls poster="${posterSrc}">
                        <source src="${videoSrc}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>

                    <div id="vc-overlay" class="hidden absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-8 pointer-events-none">
                        <div class="text-center">
                            <div class="inline-flex items-center gap-x-2 px-6 py-1.5 rounded-full bg-black/70 backdrop-blur border border-white/10 mb-2">
                                <i class="fas fa-trophy text-amber-400"></i>
                                <span class="font-semibold tracking-wider text-sm">${playerName.toUpperCase()} VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-400">${enemyName} defeated${enemyDiff ? ' • ' + enemyDiff : ''}</div>
                            ${enemyMech ? `<div class="text-[10px] text-amber-300/80 mt-0.5 max-w-xs mx-auto">${safeEnemyMech}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                modalPlayerHTML = `
                    <div class="relative w-full aspect-video bg-black overflow-hidden rounded-3xl" style="box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);">
                        <img src="${posterSrc}" alt="${enemyName}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div class="text-center px-6">
                                <div class="text-xs tracking-[2px] text-violet-400 mb-1">CUTSCENE PENDING</div>
                                <div class="font-semibold">No dedicated 10s victory cinematic yet for ${enemyName}</div>
                                <div class="text-xs text-zinc-400 mt-2">Ask Grok to generate one using the same detailed style</div>
                            </div>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-center">
                            <div class="inline-flex items-center gap-x-2 px-4 py-1 rounded-full bg-black/70 border border-white/10">
                                <i class="fas fa-trophy text-amber-400"></i>
                                <span class="font-semibold tracking-wider text-sm">${playerName.toUpperCase()} VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-300 mt-1">${enemyName} defeated</div>
                        </div>
                    </div>
                `;
            }

            const modal = document.createElement('div');
            modal.id = 'victory-cinematic-modal';
            modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4';
            modal.innerHTML = `
                <div class="w-full max-w-[1080px] mx-auto">
                    <div class="flex items-center justify-between mb-3 px-1">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-amber-400">GROK-TALK BATTLE ARENA</div>
                            <div class="text-2xl font-black tracking-tighter">${playerName} <span class="text-amber-400">WINS</span></div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="vc-replay" class="px-4 py-2 rounded-2xl border border-zinc-700 hover:border-amber-400/70 text-sm font-medium flex items-center gap-2">
                                <i class="fas fa-redo"></i> <span>REPLAY</span>
                            </button>
                            <button id="vc-close" class="px-4 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-medium">CLOSE</button>
                        </div>
                    </div>

                    <div class="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-black arena-glow" style="box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);">
                        ${modalPlayerHTML}
                    </div>

                    <div class="mt-3 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-4">
                        <span>10s cinematic • 720p • Grok Imagine + Video</span>
                        <span class="hidden sm:inline">Click video for fusion particles</span>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const video = modal.querySelector('#vc-video');
            const overlay = modal.querySelector('#vc-overlay');
            const closeBtn = modal.querySelector('#vc-close');
            const replayBtn = modal.querySelector('#vc-replay');

            function closeModal() {
                modal.remove();
                document.removeEventListener('keydown', onKey);
            }

            function onKey(e) {
                if (e.key === 'Escape') closeModal();
                if ((e.key === 'r' || e.key === 'R') && video) { video.currentTime = 0; video.play().catch(()=>{}); }
            }

            closeBtn.onclick = closeModal;
            modal.onclick = (e) => { if (e.target === modal) closeModal(); };

            if (replayBtn) {
                if (video) {
                    replayBtn.onclick = () => {
                        if (video) { video.currentTime = 0; video.play().catch(()=>{}); overlay && overlay.classList.add('hidden'); }
                    };
                } else {
                    replayBtn.innerHTML = '<i class="fas fa-star"></i> <span>CELEBRATE</span>';
                    replayBtn.onclick = () => {
                        // simple celebration particles on the still
                        const container = modal.querySelector('.relative.rounded-3xl') || modal;
                        for (let i = 0; i < 8; i++) {
                            const p = document.createElement('div');
                            p.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;pointer-events:none;z-index:20;';
                            p.style.left = (Math.random() * (container.clientWidth || 300)) + 'px';
                            p.style.top = ((container.clientHeight || 200) * (0.3 + Math.random() * 0.5)) + 'px';
                            container.appendChild(p);
                            setTimeout(() => {
                                p.style.transition = 'transform 800ms ease-out, opacity 800ms ease-out';
                                p.style.transform = `translateY(-${40 + Math.random()*30}px) scale(0.3)`;
                                p.style.opacity = '0';
                                setTimeout(() => p.remove(), 800);
                            }, 20);
                        }
                    };
                }
            }

            if (video) {
                video.onended = () => {
                    if (overlay) overlay.classList.remove('hidden');
                };

                // Easter egg particles on click (while playing)
                video.addEventListener('click', (ev) => {
                    if (video.paused) return;
                    if (typeof spawnFusionParticles === 'function') {
                        spawnFusionParticles(video.parentElement, 8);
                    }
                });

                // Auto play (may be blocked, user can click)
                setTimeout(() => {
                    video.play().catch(() => {});
                }, 150);
            }

            document.addEventListener('keydown', onKey, { once: false });

            // Simple fusion particle spawner (reused from prototype)
            function spawnFusionParticles(container, count = 6) {
                const rect = container.getBoundingClientRect();
                for (let i = 0; i < count; i++) {
                    const p = document.createElement('div');
                    p.style.position = 'absolute';
                    p.style.left = (Math.random() * rect.width) + 'px';
                    p.style.top = (rect.height * (0.2 + Math.random() * 0.6)) + 'px';
                    p.style.width = p.style.height = (3 + Math.random() * 5) + 'px';
                    p.style.borderRadius = '50%';
                    p.style.background = '#22d3ee';
                    p.style.boxShadow = '0 0 12px #22d3ee';
                    p.style.opacity = (0.5 + Math.random() * 0.5).toString();
                    p.style.pointerEvents = 'none';
                    p.style.zIndex = '10';
                    p.style.transition = 'transform 1.1s ease-out, opacity 1.1s ease-out';
                    container.appendChild(p);

                    // animate
                    requestAnimationFrame(() => {
                        p.style.transform = `translateY(-${60 + Math.random() * 50}px) scale(${0.2 + Math.random() * 0.3})`;
                        p.style.opacity = '0';
                    });
                    setTimeout(() => p.remove(), 1400);
                }
            }
        };

        // In-arena cinematic viewer (integrated into the battle stage instead of full overlay)
        // Dynamic poster per rival using the enemy's concept art.
        // Provides replay + quick actions while staying inside the Arena section.
        window.showInArenaCinematic = function showInArenaCinematic(battleData) {
            console.log('Victory cinematic for:', battleData ? battleData.enemyName : 'unknown', 'using video:', battleData ? battleData.enemyVideo : null);
            const arenaSection = document.getElementById("section-arena");
            if (!arenaSection) return;

            const enemyName = (battleData && battleData.enemyName) || 'Void Howler';
            const playerName = (battleData && battleData.playerName) || 'Fusion Panda';
            const enemyArt = (battleData && battleData.enemyArt) || 'assets/arena/opponent-chroma-lynx.jpg';
            const enemyDiff = (battleData && battleData.enemyDifficulty) || '';
            const enemyMech = (battleData && battleData.enemyMechanic) || '';

            const safeMech = typeof __escapeBattleText === 'function' ? __escapeBattleText(enemyMech) : enemyMech;
            const hasVideo = !!(battleData && battleData.enemyVideo);
            const videoSrc = hasVideo ? battleData.enemyVideo : null;
            const posterSrc = (battleData && battleData.enemyKeyart) || enemyArt;

            let cinematicPlayerHTML = '';
            if (hasVideo) {
                cinematicPlayerHTML = `
                    <video id="in-video" class="w-full aspect-video bg-black" playsinline controls poster="${posterSrc}">
                        <source src="${videoSrc}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div id="in-overlay" class="hidden absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-center pb-6 pointer-events-none">
                        <div class="text-center px-4">
                            <div class="inline-flex items-center gap-x-2 px-5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/10 mb-1">
                                <i class="fas fa-trophy text-amber-400"></i>
                                <span class="font-semibold tracking-wider text-sm">${playerName.toUpperCase()} VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-300">${enemyName} defeated</div>
                            ${safeMech ? `<div class="text-[10px] text-amber-300/80 mt-0.5 max-w-[280px] mx-auto">${safeMech}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                // No dedicated cutscene for this foe - show still + pending message (matching prototype behavior)
                cinematicPlayerHTML = `
                    <div class="relative w-full aspect-video bg-black overflow-hidden rounded" style="box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);">
                        <img src="${posterSrc}" alt="${enemyName} concept art" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div class="text-center px-6">
                                <div class="text-xs tracking-[2px] text-violet-400 mb-1">CUTSCENE PENDING</div>
                                <div class="font-semibold text-lg">No dedicated 10s victory cinematic yet for ${enemyName}</div>
                                <div class="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">Ask Grok to generate one using the same detailed style</div>
                            </div>
                        </div>
                        <!-- Victory banner always visible for no-video case -->
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-center">
                            <div class="inline-flex items-center gap-x-2 px-4 py-1 rounded-full bg-black/70 border border-white/10">
                                <i class="fas fa-trophy text-amber-400"></i>
                                <span class="font-semibold tracking-wider text-sm">${playerName.toUpperCase()} VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-300 mt-1">${enemyName} defeated</div>
                        </div>
                    </div>
                `;
            }

            arenaSection.innerHTML = `
                <div class="max-w-4xl mx-auto py-4">
                    <div class="flex items-center justify-between mb-3 px-1">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-amber-400">GROK-TALK BATTLE ARENA</div>
                            <div class="text-2xl font-black tracking-tighter">${playerName} <span class="text-amber-400">WINS</span></div>
                            <div class="text-xs text-zinc-400">${enemyName} ${enemyDiff ? '• ' + enemyDiff : ''}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button id="in-replay" class="px-4 py-2 text-sm rounded-2xl border border-amber-400/70 hover:bg-amber-500/10 flex items-center gap-2">
                                <i class="fas fa-redo"></i> <span>REPLAY</span>
                            </button>
                            <button onclick="startQuickMatch()" class="px-4 py-2 text-sm rounded-2xl border border-red-400 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-2">
                                <i class="fas fa-bolt"></i> <span>NEXT BATTLE</span>
                            </button>
                            <button onclick="renderBattleLanding()" class="px-4 py-2 text-sm rounded-2xl border border-gray-700 hover:bg-red-950/40 flex items-center gap-2">
                                <i class="fas fa-times"></i> <span>END BATTLE</span>
                            </button>
                            <button onclick="renderBattleChampionSelect()" class="px-4 py-2 text-sm rounded-2xl border border-gray-700 hover:bg-[#1a1f2e]">
                                CHOOSE CHAMPION
                            </button>
                        </div>
                    </div>

                    <div class="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-black" style="max-width: 100%;">
                        ${cinematicPlayerHTML}
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2 justify-center text-xs text-zinc-500">
                        <span>10s cinematic • 720p • Grok-powered</span>
                        <button onclick="if(window.__activeBattle &amp;&amp; window.showVictoryCinematic) window.showVictoryCinematic(window.__activeBattle)" class="underline hover:text-amber-400">Fullscreen cinematic</button>
                        <span class="hidden sm:inline">• Click video for particles</span>
                    </div>
                </div>
            `;

            const video = arenaSection.querySelector('#in-video');
            const overlay = arenaSection.querySelector('#in-overlay');
            const replayBtn = arenaSection.querySelector('#in-replay');
            const playerContainer = arenaSection.querySelector('.relative.rounded-3xl') || arenaSection.querySelector('.relative.w-full.aspect-video');

            if (replayBtn) {
                if (video) {
                    replayBtn.onclick = () => {
                        video.currentTime = 0;
                        video.play().catch(() => {});
                        if (overlay) overlay.classList.add('hidden');
                    };
                } else {
                    replayBtn.innerHTML = '<i class="fas fa-star"></i> <span>CELEBRATE</span>';
                    replayBtn.onclick = () => {
                        if (playerContainer) {
                            for (let i = 0; i < 8; i++) {
                                const p = document.createElement('div');
                                p.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;pointer-events:none;z-index:20;';
                                p.style.left = (Math.random() * playerContainer.clientWidth) + 'px';
                                p.style.top = (playerContainer.clientHeight * (0.4 + Math.random() * 0.4)) + 'px';
                                playerContainer.appendChild(p);
                                setTimeout(() => {
                                    p.style.transition = 'transform 800ms ease-out, opacity 800ms ease-out';
                                    p.style.transform = `translateY(-${40 + Math.random()*30}px) scale(0.3)`;
                                    p.style.opacity = '0';
                                    setTimeout(() => p.remove(), 800);
                                }, 20);
                            }
                        }
                    };
                }
            }

            if (video) {
                video.onended = () => {
                    if (overlay) overlay.classList.remove('hidden');
                };

                video.addEventListener('click', (ev) => {
                    if (video.paused) return;
                    if (typeof spawnFusionParticles === 'function') {
                        spawnFusionParticles(video.parentElement, 6);
                    } else {
                        const container = video.parentElement;
                        for (let i = 0; i < 6; i++) {
                            const p = document.createElement('div');
                            p.style.cssText = 'position:absolute;width:5px;height:5px;border-radius:50%;background:#22d3ee;box-shadow:0 0 10px #22d3ee;pointer-events:none;z-index:10;';
                            p.style.left = (Math.random() * container.clientWidth) + 'px';
                            p.style.top = (container.clientHeight * (0.3 + Math.random()*0.5)) + 'px';
                            container.appendChild(p);
                            setTimeout(() => {
                                p.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
                                p.style.transform = `translateY(-${50 + Math.random()*40}px) scale(0.2)`;
                                p.style.opacity = '0';
                                setTimeout(() => p.remove(), 900);
                            }, 10);
                        }
                    }
                });

                setTimeout(() => { video.play().catch(()=>{}); }, 200);
            } else if (playerContainer) {
                // For pending still: clicking the image spawns celebration particles
                playerContainer.style.cursor = 'pointer';
                playerContainer.addEventListener('click', () => {
                    for (let i = 0; i < 6; i++) {
                        const p = document.createElement('div');
                        p.style.cssText = 'position:absolute;width:5px;height:5px;border-radius:50%;background:#22d3ee;box-shadow:0 0 10px #22d3ee;pointer-events:none;z-index:10;';
                        p.style.left = (Math.random() * playerContainer.clientWidth) + 'px';
                        p.style.top = (playerContainer.clientHeight * (0.3 + Math.random()*0.5)) + 'px';
                        playerContainer.appendChild(p);
                        setTimeout(() => {
                            p.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
                            p.style.transform = `translateY(-${50 + Math.random()*40}px) scale(0.2)`;
                            p.style.opacity = '0';
                            setTimeout(() => p.remove(), 900);
                        }, 10);
                    }
                }, { once: false });
            }
        };

        // Grok-talk Battle Arena cinematic DEFEAT (failure / foe victory) player
        // Uses the high-quality foe-defeats-panda cutscene + concept art. Mirrors victory but with defeat theming.
        window.showFailureCinematic = function showFailureCinematic(battleData) {
            console.log('Failure cinematic for:', battleData ? battleData.enemyName : 'unknown', 'using failure video:', battleData ? battleData.enemyFailureVideo : null);
            const enemyName = (battleData && battleData.enemyName) || 'Void Howler';
            const playerName = (battleData && battleData.playerName) || 'Fusion Panda';
            const enemyDiff = battleData && battleData.enemyDifficulty ? battleData.enemyDifficulty : '';
            const enemyMech = battleData && battleData.enemyMechanic ? battleData.enemyMechanic : '';
            const safeEnemyMech = typeof __escapeBattleText === 'function' ? __escapeBattleText(enemyMech) : enemyMech;

            const hasVideo = !!(battleData && battleData.enemyFailureVideo);
            const videoSrc = hasVideo ? battleData.enemyFailureVideo : null;
            const posterSrc = (battleData && battleData.enemyKeyart) || (battleData && battleData.enemyArt) || 'assets/arena/opponent-chroma-lynx.jpg';

            let modalPlayerHTML = '';
            if (hasVideo) {
                modalPlayerHTML = `
                    <video id="fc-video" class="w-full aspect-video bg-black" playsinline controls poster="${posterSrc}">
                        <source src="${videoSrc}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>

                    <div id="fc-overlay" class="hidden absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-8 pointer-events-none">
                        <div class="text-center">
                            <div class="inline-flex items-center gap-x-2 px-6 py-1.5 rounded-full bg-black/70 backdrop-blur border border-white/10 mb-2">
                                <i class="fas fa-skull text-rose-400"></i>
                                <span class="font-semibold tracking-wider text-sm">FOE VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-400">${playerName} defeated${enemyDiff ? ' • ' + enemyDiff : ''}</div>
                            ${enemyMech ? `<div class="text-[10px] text-rose-300/80 mt-0.5 max-w-xs mx-auto">${safeEnemyMech}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                modalPlayerHTML = `
                    <div class="relative w-full aspect-video bg-black overflow-hidden rounded-3xl" style="box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);">
                        <img src="${posterSrc}" alt="${enemyName}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div class="text-center px-6">
                                <div class="text-xs tracking-[2px] text-violet-400 mb-1">CUTSCENE PENDING</div>
                                <div class="font-semibold">No dedicated 10s defeat cinematic yet for ${enemyName}</div>
                                <div class="text-xs text-zinc-400 mt-2">Ask Grok to generate one using the same detailed style</div>
                            </div>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-center">
                            <div class="inline-flex items-center gap-x-2 px-4 py-1 rounded-full bg-black/70 border border-white/10">
                                <i class="fas fa-skull text-rose-400"></i>
                                <span class="font-semibold tracking-wider text-sm">FOE VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-300 mt-1">${playerName} defeated</div>
                        </div>
                    </div>
                `;
            }

            const modal = document.createElement('div');
            modal.id = 'defeat-cinematic-modal';
            modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4';
            modal.innerHTML = `
                <div class="w-full max-w-[1080px] mx-auto">
                    <div class="flex items-center justify-between mb-3 px-1">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-rose-400">GROK-TALK BATTLE ARENA</div>
                            <div class="text-2xl font-black tracking-tighter">${playerName} <span class="text-rose-400">DEFEATED</span></div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="fc-replay" class="px-4 py-2 rounded-2xl border border-zinc-700 hover:border-rose-400/70 text-sm font-medium flex items-center gap-2">
                                <i class="fas fa-redo"></i> <span>REPLAY</span>
                            </button>
                            <button id="fc-close" class="px-4 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-medium">CLOSE</button>
                        </div>
                    </div>

                    <div class="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-black arena-glow" style="box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);">
                        ${modalPlayerHTML}
                    </div>

                    <div class="mt-3 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-4">
                        <span>10s cinematic • 720p • Grok Imagine + Video</span>
                        <span class="hidden sm:inline">Click video for defeat particles</span>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const video = modal.querySelector('#fc-video');
            const overlay = modal.querySelector('#fc-overlay');
            const closeBtn = modal.querySelector('#fc-close');
            const replayBtn = modal.querySelector('#fc-replay');

            function closeModal() {
                modal.remove();
                document.removeEventListener('keydown', onKey);
            }

            function onKey(e) {
                if (e.key === 'Escape') closeModal();
                if ((e.key === 'r' || e.key === 'R') && video) { video.currentTime = 0; video.play().catch(()=>{}); }
            }

            closeBtn.onclick = closeModal;
            modal.onclick = (e) => { if (e.target === modal) closeModal(); };

            if (replayBtn) {
                if (video) {
                    replayBtn.onclick = () => {
                        if (video) { video.currentTime = 0; video.play().catch(()=>{}); overlay && overlay.classList.add('hidden'); }
                    };
                } else {
                    replayBtn.innerHTML = '<i class="fas fa-star"></i> <span>MOURN</span>';
                    replayBtn.onclick = () => {
                        const container = modal.querySelector('.relative.rounded-3xl') || modal;
                        for (let i = 0; i < 8; i++) {
                            const p = document.createElement('div');
                            p.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;background:#f43f5e;box-shadow:0 0 8px #f43f5e;pointer-events:none;z-index:20;';
                            p.style.left = (Math.random() * (container.clientWidth || 300)) + 'px';
                            p.style.top = ((container.clientHeight || 200) * (0.3 + Math.random() * 0.5)) + 'px';
                            container.appendChild(p);
                            setTimeout(() => {
                                p.style.transition = 'transform 800ms ease-out, opacity 800ms ease-out';
                                p.style.transform = `translateY(-${40 + Math.random()*30}px) scale(0.3)`;
                                p.style.opacity = '0';
                                setTimeout(() => p.remove(), 800);
                            }, 20);
                        }
                    };
                }
            }

            if (video) {
                video.onended = () => {
                    if (overlay) overlay.classList.remove('hidden');
                };

                video.addEventListener('click', (ev) => {
                    if (video.paused) return;
                    if (typeof spawnFusionParticles === 'function') {
                        spawnFusionParticles(video.parentElement, 8);
                    }
                });

                setTimeout(() => {
                    video.play().catch(() => {});
                }, 150);
            }

            document.addEventListener('keydown', onKey, { once: false });

            function spawnDefeatParticles(container, count = 6) {
                const rect = container.getBoundingClientRect();
                for (let i = 0; i < count; i++) {
                    const p = document.createElement('div');
                    p.style.position = 'absolute';
                    p.style.left = (Math.random() * rect.width) + 'px';
                    p.style.top = (rect.height * (0.2 + Math.random() * 0.6)) + 'px';
                    p.style.width = p.style.height = (3 + Math.random() * 5) + 'px';
                    p.style.borderRadius = '50%';
                    p.style.background = '#f43f5e';
                    p.style.boxShadow = '0 0 12px #f43f5e';
                    p.style.opacity = (0.5 + Math.random() * 0.5).toString();
                    p.style.pointerEvents = 'none';
                    p.style.zIndex = '10';
                    p.style.transition = 'transform 1.1s ease-out, opacity 1.1s ease-out';
                    container.appendChild(p);

                    requestAnimationFrame(() => {
                        p.style.transform = `translateY(-${60 + Math.random() * 50}px) scale(${0.2 + Math.random() * 0.3})`;
                        p.style.opacity = '0';
                    });
                    setTimeout(() => p.remove(), 1400);
                }
            }
        };

        // In-arena failure cinematic viewer (integrated into the battle stage)
        // Dynamic poster per rival. REPLAY + NEXT BATTLE / END BATTLE / CHOOSE CHAMPION all wired (reuse existing fns).
        window.showInArenaFailureCinematic = function showInArenaFailureCinematic(battleData) {
            console.log('Failure cinematic for:', battleData ? battleData.enemyName : 'unknown', 'using failure video:', battleData ? battleData.enemyFailureVideo : null);
            const arenaSection = document.getElementById("section-arena");
            if (!arenaSection) return;

            const enemyName = (battleData && battleData.enemyName) || 'Void Howler';
            const playerName = (battleData && battleData.playerName) || 'Fusion Panda';
            const enemyArt = (battleData && battleData.enemyArt) || 'assets/arena/opponent-chroma-lynx.jpg';
            const enemyDiff = (battleData && battleData.enemyDifficulty) || '';
            const enemyMech = (battleData && battleData.enemyMechanic) || '';

            const safeMech = typeof __escapeBattleText === 'function' ? __escapeBattleText(enemyMech) : enemyMech;
            const hasVideo = !!(battleData && battleData.enemyFailureVideo);
            const videoSrc = hasVideo ? battleData.enemyFailureVideo : null;
            const posterSrc = (battleData && battleData.enemyKeyart) || enemyArt;

            let cinematicPlayerHTML = '';
            if (hasVideo) {
                cinematicPlayerHTML = `
                    <video id="in-fail-video" class="w-full aspect-video bg-black" playsinline controls poster="${posterSrc}">
                        <source src="${videoSrc}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div id="in-fail-overlay" class="hidden absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-center pb-6 pointer-events-none">
                        <div class="text-center px-4">
                            <div class="inline-flex items-center gap-x-2 px-5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/10 mb-1">
                                <i class="fas fa-skull text-rose-400"></i>
                                <span class="font-semibold tracking-wider text-sm">FOE VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-300">${playerName} defeated</div>
                            ${safeMech ? `<div class="text-[10px] text-rose-300/80 mt-0.5 max-w-[280px] mx-auto">${safeMech}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                cinematicPlayerHTML = `
                    <div class="relative w-full aspect-video bg-black overflow-hidden rounded" style="box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);">
                        <img src="${posterSrc}" alt="${enemyName} concept art" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div class="text-center px-6">
                                <div class="text-xs tracking-[2px] text-violet-400 mb-1">CUTSCENE PENDING</div>
                                <div class="font-semibold text-lg">No dedicated 10s defeat cinematic yet for ${enemyName}</div>
                                <div class="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">Ask Grok to generate one using the same detailed style</div>
                            </div>
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-center">
                            <div class="inline-flex items-center gap-x-2 px-4 py-1 rounded-full bg-black/70 border border-white/10">
                                <i class="fas fa-skull text-rose-400"></i>
                                <span class="font-semibold tracking-wider text-sm">FOE VICTORY</span>
                            </div>
                            <div class="text-xs text-zinc-300 mt-1">${playerName} defeated</div>
                        </div>
                    </div>
                `;
            }

            arenaSection.innerHTML = `
                <div class="max-w-4xl mx-auto py-4">
                    <div class="flex items-center justify-between mb-3 px-1">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-rose-400">GROK-TALK BATTLE ARENA</div>
                            <div class="text-2xl font-black tracking-tighter">${playerName} <span class="text-rose-400">DEFEATED</span></div>
                            <div class="text-xs text-zinc-400">${enemyName} ${enemyDiff ? '• ' + enemyDiff : ''}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button id="in-fail-replay" class="px-4 py-2 text-sm rounded-2xl border border-rose-400/70 hover:bg-rose-500/10 flex items-center gap-2">
                                <i class="fas fa-redo"></i> <span>REPLAY</span>
                            </button>
                            <button onclick="startQuickMatch()" class="px-4 py-2 text-sm rounded-2xl border border-red-400 bg-red-500/10 hover:bg-red-500/20 flex items-center gap-2">
                                <i class="fas fa-bolt"></i> <span>NEXT BATTLE</span>
                            </button>
                            <button onclick="renderBattleLanding()" class="px-4 py-2 text-sm rounded-2xl border border-gray-700 hover:bg-red-950/40 flex items-center gap-2">
                                <i class="fas fa-times"></i> <span>END BATTLE</span>
                            </button>
                            <button onclick="renderBattleChampionSelect()" class="px-4 py-2 text-sm rounded-2xl border border-gray-700 hover:bg-[#1a1f2e]">
                                CHOOSE CHAMPION
                            </button>
                        </div>
                    </div>

                    <div class="relative rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-black" style="max-width: 100%;">
                        ${cinematicPlayerHTML}
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2 justify-center text-xs text-zinc-500">
                        <span>10s cinematic • 720p • Grok-powered</span>
                        <button onclick="if(window.__activeBattle &amp;&amp; window.showFailureCinematic) window.showFailureCinematic(window.__activeBattle)" class="underline hover:text-rose-400">Fullscreen cinematic</button>
                        <span class="hidden sm:inline">• Click video for particles</span>
                    </div>
                </div>
            `;

            const video = arenaSection.querySelector('#in-fail-video');
            const overlay = arenaSection.querySelector('#in-fail-overlay');
            const replayBtn = arenaSection.querySelector('#in-fail-replay');
            const playerContainer = arenaSection.querySelector('.relative.rounded-3xl') || arenaSection.querySelector('.relative.w-full.aspect-video');

            if (replayBtn) {
                if (video) {
                    replayBtn.onclick = () => {
                        video.currentTime = 0;
                        video.play().catch(() => {});
                        if (overlay) overlay.classList.add('hidden');
                    };
                } else {
                    replayBtn.innerHTML = '<i class="fas fa-star"></i> <span>MOURN</span>';
                    replayBtn.onclick = () => {
                        if (playerContainer) {
                            for (let i = 0; i < 8; i++) {
                                const p = document.createElement('div');
                                p.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;background:#f43f5e;box-shadow:0 0 8px #f43f5e;pointer-events:none;z-index:20;';
                                p.style.left = (Math.random() * playerContainer.clientWidth) + 'px';
                                p.style.top = (playerContainer.clientHeight * (0.4 + Math.random() * 0.4)) + 'px';
                                playerContainer.appendChild(p);
                                setTimeout(() => {
                                    p.style.transition = 'transform 800ms ease-out, opacity 800ms ease-out';
                                    p.style.transform = `translateY(-${40 + Math.random()*30}px) scale(0.3)`;
                                    p.style.opacity = '0';
                                    setTimeout(() => p.remove(), 800);
                                }, 20);
                            }
                        }
                    };
                }
            }

            if (video) {
                video.onended = () => {
                    if (overlay) overlay.classList.remove('hidden');
                };

                video.addEventListener('click', (ev) => {
                    if (video.paused) return;
                    const container = video.parentElement;
                    for (let i = 0; i < 6; i++) {
                        const p = document.createElement('div');
                        p.style.cssText = 'position:absolute;width:5px;height:5px;border-radius:50%;background:#f43f5e;box-shadow:0 0 10px #f43f5e;pointer-events:none;z-index:10;';
                        p.style.left = (Math.random() * container.clientWidth) + 'px';
                        p.style.top = (container.clientHeight * (0.3 + Math.random()*0.5)) + 'px';
                        container.appendChild(p);
                        setTimeout(() => {
                            p.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
                            p.style.transform = `translateY(-${50 + Math.random()*40}px) scale(0.2)`;
                            p.style.opacity = '0';
                            setTimeout(() => p.remove(), 900);
                        }, 10);
                    }
                });

                setTimeout(() => { video.play().catch(()=>{}); }, 200);
            } else if (playerContainer) {
                playerContainer.style.cursor = 'pointer';
                playerContainer.addEventListener('click', () => {
                    for (let i = 0; i < 6; i++) {
                        const p = document.createElement('div');
                        p.style.cssText = 'position:absolute;width:5px;height:5px;border-radius:50%;background:#f43f5e;box-shadow:0 0 10px #f43f5e;pointer-events:none;z-index:10;';
                        p.style.left = (Math.random() * playerContainer.clientWidth) + 'px';
                        p.style.top = (playerContainer.clientHeight * (0.3 + Math.random()*0.5)) + 'px';
                        playerContainer.appendChild(p);
                        setTimeout(() => {
                            p.style.transition = 'transform 900ms ease-out, opacity 900ms ease-out';
                            p.style.transform = `translateY(-${50 + Math.random()*40}px) scale(0.2)`;
                            p.style.opacity = '0';
                            setTimeout(() => p.remove(), 900);
                        }, 10);
                    }
                }, { once: false });
            }
        };

        function navigateTo(section) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
            
            // Show target
            const target = document.getElementById('section-' + section);
            if (target) target.classList.remove('hidden');
            
            // Update desktop and mobile nav active states
            const activeIds = new Set([`nav-${section}`, `nav-mobile-${section}`]);
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                link.removeAttribute("aria-current");
                if (activeIds.has(link.id)) {
                    link.classList.add('active');
                    link.setAttribute("aria-current", "page");
                }
            });
            
            // Special actions per section
            if (section === 'collection') {
                renderCollection();
            }
            if (section === "codex") {
                switchCodexTab("bestiary");
            }
            if (section === 'profile') {
                renderProfile();
            }
            if (section === 'fusion-lab') {
                renderAvatarDirector();
            }
        }

        function showToast(message, type = "success") {
            const container = document.getElementById('toast-container');
            
            const toast = document.createElement('div');
            toast.className = `flex items-center gap-x-3 px-5 py-3.5 rounded-3xl shadow-2xl max-w-xs text-sm border ${type === 'success' ? 'bg-emerald-950 border-emerald-700 text-emerald-300' : type === 'error' ? 'bg-red-950 border-red-700 text-red-300' : 'bg-[#1a1f2e] border-gray-700 text-white'}`;
            
            let icon = 'fa-check-circle';
            if (type === 'error') icon = 'fa-exclamation-circle';
            if (type === 'info') icon = 'fa-info-circle';
            
            toast.innerHTML = `
                <i class="fas ${icon} text-xl"></i>
                <div>${message}</div>
            `;
            
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.transition = 'all 0.3s ease';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => toast.remove(), 300);
            }, 3100);
        }

        function showSettings() {
            const settingsHTML = `
                <div onclick="this.remove()" class="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-5">
                    <div onclick="event.stopImmediatePropagation()" class="cyber-card max-w-md w-full rounded-3xl border border-gray-700 overflow-hidden">
                        <div class="px-6 py-5 border-b border-gray-700 flex justify-between items-center">
                            <div class="font-bold text-xl">Master Settings</div>
                            <i class="fas fa-times text-xl cursor-pointer" onclick="event.target.closest('.fixed').remove()"></i>
                        </div>
                        
                        <div class="p-6 space-y-6 text-sm">
                            <div>
                                <div class="font-semibold mb-3 text-xs tracking-widest text-gray-400">ACCOUNT</div>
                                <div class="flex justify-between items-center py-2 border-b border-gray-800">
                                    <div>Display Name</div>
                                    <div class="font-mono text-emerald-400">Master_Zero</div>
                                </div>
                                <div class="flex justify-between items-center py-2 border-b border-gray-800">
                                    <div>Member Since</div>
                                    <div class="font-mono">Nov 2024</div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="font-semibold mb-3 text-xs tracking-widest text-gray-400">KEYBOARD</div>
                                <div class="text-xs text-gray-400 space-y-1 py-1">
                                    <div><span class="font-mono text-emerald-500/90">Esc</span> — close top dialog / overlay</div>
                                    <div><span class="font-mono text-emerald-500/90">⌘ + /</span> (Ctrl + /) — search collection</div>
                                    <div><span class="font-mono text-emerald-500/90">?</span> with body focus — go to Fusion Lab</div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="font-semibold mb-3 text-xs tracking-widest text-gray-400">PREFERENCES</div>
                                
                                <div class="flex items-center justify-between py-3">
                                    <div>Enable Fusion Animations</div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                
                                <div class="flex items-center justify-between py-3">
                                    <div>Sound Effects</div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                
                                <div class="flex items-center justify-between py-3">
                                    <div>Auto-save Collection</div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="pt-4 border-t border-gray-700 text-xs text-gray-500">
                                FusionPanda Master Webapp v4.2.1 • Built with ❤️ for the Panda Protocol<br>
                                Data stored locally in your browser
                            </div>
                        </div>
                        
                        <div class="px-6 py-4 bg-[#0f1117] flex justify-end gap-x-3">
                            <button onclick="event.target.closest('.fixed').remove()" class="px-6 py-2 text-sm rounded-2xl border border-gray-700">CLOSE</button>
                            <button onclick="resetAllData(); event.target.closest('.fixed').remove()" class="px-6 py-2 text-sm rounded-2xl bg-red-600 hover:bg-red-700 text-white">RESET ALL DATA</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', settingsHTML);
        }

        function resetAllData() {
            if (confirm("Are you sure you want to reset ALL progress? This cannot be undone.")) {
                localStorage.removeItem('fusionPandaMaster');
                location.reload();
            }
        }

        function closeTopModalOrOverlay() {
            const fusionResult = document.getElementById("fusion-result-modal");
            if (fusionResult && !fusionResult.classList.contains("hidden")) {
                closeFusionModal();
                return true;
            }
            const pandaSel = document.getElementById("panda-selector-modal");
            if (pandaSel && !pandaSel.classList.contains("hidden")) {
                closePandaSelector();
                return true;
            }
            const overlays = Array.from(document.querySelectorAll("body > div")).filter(
                (d) =>
                    d.classList &&
                    d.classList.contains("fixed") &&
                    d.classList.contains("inset-0") &&
                    d.id !== "fusion-result-modal" &&
                    d.id !== "panda-selector-modal" &&
                    !d.classList.contains("hidden") &&
                    window.getComputedStyle(d).display !== "none",
            );
            const top = overlays[overlays.length - 1];
            if (top) {
                top.remove();
                return true;
            }
            return false;
        }

        function wireNavLinkAccessibility() {
            document.querySelectorAll(".nav-link").forEach((el) => {
                el.setAttribute("role", "button");
                if (!el.hasAttribute("tabindex")) {
                    el.setAttribute("tabindex", "0");
                }
                el.addEventListener("keydown", (ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        el.click();
                    }
                });
            });
        }

        function initKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                if (e.key === "Escape") {
                    if (closeTopModalOrOverlay()) {
                        e.preventDefault();
                    }
                    return;
                }
                if (e.metaKey && e.key === "/") {
                    e.preventDefault();
                    const search = document.getElementById('search-input');
                    if (search) {
                        navigateTo('collection');
                        search.focus();
                    }
                }
                
                if (e.key === "?" && document.activeElement.tagName === "BODY") {
                    e.preventDefault();
                    navigateTo('fusion-lab');
                }
            });
            
            // Easter egg: Konami code for mega fusion
            let konami = '';
            const konamiCode = '38384040373937396665'; // up up down down left right left right b a
            document.addEventListener('keydown', function(e) {
                konami += e.keyCode;
                if (konami.length > 20) konami = konami.slice(-20);
                
                if (konami === konamiCode) {
                    konami = '';
                    showToast("🎉 KONAMI CODE ACTIVATED! +999 XP & Legendary Panda!", "success");
                    
                    const legendary = {
                        id: 'konami-' + Date.now(),
                        name: "Quantum Overlord Panda",
                        emoji: "👑🐼",
                        type: "Mythic Hybrid",
                        power: 88,
                        rarity: "mythic",
                        color: "#f43f5e",
                        desc: "The ultimate panda. Achieved only by true masters of the fusion arts.",
                        acquired: new Date().toISOString().split('T')[0]
                    };
                    
                    userPandas.push(legendary);
                    bumpLifetimeEarnedXp(999);
                    gameState.xp += 999;
                    if (gameState.xp >= 10000) {
                        gameState.level++;
                        gameState.xp -= 10000;
                    }
                    
                    saveGameState();
                    updateDashboard();
                    renderCollection();
                    
                    setTimeout(() => {
                        showPandaDetail(userPandas.length - 1);
                    }, 1200);
                }
            });
        }

        // Initialize everything
        function initializeApp() {
            loadGameState();
            
            // Set initial section to dashboard
            document.getElementById('section-dashboard').classList.remove('hidden');
            document.getElementById('nav-dashboard').classList.add('active');
            
            // Render initial collection (hidden)
            renderCollection();
            renderBasePandas();
            
            // Random tip toast after 6 seconds
            setTimeout(() => {
                if (!document.hidden) {
                    showToast("Pro tip: Use the Konami code ↑↑↓↓←→←→BA for a surprise! 🎮", "info");
                }
            }, 6500);
            
            wireNavLinkAccessibility();
            initKeyboardShortcuts();
            
            // Make sure fuse button starts disabled
            document.getElementById('fuse-btn').disabled = true;
            
            // Initialize advanced fusion mode
            setTimeout(() => {
                setFusionMode('basic');
            }, 300);

            // Player avatar system init (director in lab + ready for profile)
            setTimeout(() => {
                renderAvatarDirector();
            }, 420);
            
            // Easter egg hint in console
            console.log('%c[FusionPanda Master] Konami code enabled! Try ↑↑↓↓←→←→BA', 'color:#64748b');
            
            // Welcome message for first timers (if no save)
            if (!localStorage.getItem('fusionPandaMaster')) {
                setTimeout(() => {
                    showToast("Welcome to FusionPanda Master! Start by fusing your first pandas 🐼", "success");
                }, 1400);
            }
            
            // Demo: Pre-select two pandas in fusion lab for new users (optional)
            // Uncomment if wanted:
            // setTimeout(() => { if (userPandas.length > 1) { selectPandaForSlot('alpha', userPandas[0]); selectPandaForSlot('beta', userPandas[1]); } }, 800);
        }

        function scheduleInit() {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
            } else {
                initializeApp();
            }
        }
        scheduleInit();
        
        // Expose some functions for console debugging (fun)
        window.FusionPanda = {
            addPanda: (name) => {
                const newP = {...basePandas[0], name: name || "Debug Panda", id: 'debug-' + Date.now(), rarity: 'legendary', power: 55};
                newP.bonus = getDefaultBonus(newP.type || 'Balanced');
                userPandas.push(newP);
                renderCollection();
                console.log('%c[Panda added]', 'color:#00ff9d', newP);
            },
            levelUp: () => {
                gameState.level++;
                showLevelUp();
            },
            getCurrentAvatar: () => getCurrentAvatar(),
            develop: (id) => developAvatar(id || getCurrentAvatar().id),
            avatars: PLAYER_AVATARS
        };

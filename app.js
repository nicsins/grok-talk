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
            recentFusions: [],
            ep: 500,
            upgrades: {
                efficiency: 0,
                stability: 0,
                training: 0
            },
            boosters: {
                blazing: false,
                cryo: false,
                lightning: false
            }
        };

        // Base Pandas Data (Expanded with new production content)
        const basePandas = [
            { id: 1, name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common", color: "#64748b", desc: "The original bamboo-loving legend. Reliable and steady in every fusion.", image: "assets/pandas/classic_panda.jpg" },
            { id: 2, name: "Inferno Panda", emoji: "🔥🐼", type: "Fire", power: 18, rarity: "rare", color: "#f97316", desc: "Born in volcanic craters. Brings explosive energy to any fusion.", image: "assets/pandas/inferno_panda.jpg" },
            { id: 3, name: "Frostbite Panda", emoji: "❄️🐼", type: "Ice", power: 15, rarity: "rare", color: "#67e8f9", desc: "From the eternal glaciers of the north. Slows enemies with icy aura.", image: "assets/pandas/frostbite_panda.jpg" },
            { id: 4, name: "Shadow Panda", emoji: "🌑🐼", type: "Dark", power: 22, rarity: "epic", color: "#6366f1", desc: "Master of stealth and illusion. Vanishes in plain sight.", image: "assets/pandas/shadow_panda.jpg" },
            { id: 5, name: "Thunder Panda", emoji: "⚡🐼", type: "Electric", power: 19, rarity: "rare", color: "#eab308", desc: "Channeling the power of storms. Fast and shocking.", image: "assets/pandas/thunder_panda.jpg" },
            { id: 6, name: "Golden Fortune", emoji: "✨🐼", type: "Light", power: 27, rarity: "legendary", color: "#fbbf24", desc: "Extremely rare. Brings incredible luck and prosperity.", image: "assets/pandas/golden_fortune.jpg" },
            { id: 7, name: "Mystic Panda", emoji: "🔮🐼", type: "Arcane", power: 24, rarity: "epic", color: "#c026ff", desc: "Wielder of ancient panda magic. Unpredictable and wise.", image: "assets/pandas/mystic_panda.jpg" },
            { id: 8, name: "Crystal Panda", emoji: "💎🐼", type: "Crystal", power: 16, rarity: "rare", color: "#67e8f9", desc: "Crystalline armor protects it from harm. Beautiful but deadly.", image: "assets/pandas/crystal_panda.jpg" },
            { id: 9, name: "Red Panda", emoji: "🔴🐼", type: "Balanced", power: 25, rarity: "epic", color: "#ef4444", desc: "A charming, chestnut-colored climber with a ringed tail and playful spirit. Unlocks special elemental resonance.", image: "assets/pandas/red_panda.jpg" }

            // New production content integration (from expanded roster)
            { id: 9, name: "Ember Cub", emoji: "🔥🐼", type: "Fire", power: 85, rarity: "common", color: "#f97316", desc: "Newly discovered fire-type starter." },
            { id: 10, name: "Inferno Guardian", emoji: "🔥🛡️", type: "Fire", power: 145, rarity: "rare", color: "#f97316", desc: "Elite fire guardian from the new roster." },
            { id: 11, name: "Blazing Phoenix Panda", emoji: "🔥🦅", type: "Fire", power: 210, rarity: "epic", color: "#f97316", desc: "Mythic-level fire evolution." },
            { id: 12, name: "Cyclone Striker", emoji: "🌪️🐼", type: "Wind", power: 138, rarity: "rare", color: "#22c55e", desc: "New wind-type from expanded content." },
            { id: 13, name: "Storm Dragon Panda", emoji: "🐉💨", type: "Wind", power: 205, rarity: "epic", color: "#22c55e", desc: "High-tier wind evolution." },
            { id: 14, name: "Quantum Overlord Panda", emoji: "🌌🐼", type: "Lightning", power: 450, rarity: "mythic", color: "#a855f7", desc: "Mythic pinnacle — extremely rare." },
            { id: 15, name: "Eternal Flame Sovereign", emoji: "🔥👑", type: "Fire", power: 440, rarity: "mythic", color: "#f97316", desc: "The ultimate fire evolution." },
        ];

        // User's unlocked pandas (new users start with one fair starter)
        let userPandas = [
            { ...basePandas[0], id: 'u1', level: 1, acquired: new Date().toISOString().split('T')[0] }
        ];

        // Current selected for fusion
        let selectedAlpha = null;
        let selectedBeta = null;
        let currentFusionMode = 'basic'; // basic | advanced | ritual

        function saveGameState() {
            recalculateTotalPower();
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
                if (!gameState.upgrades) {
                    gameState.upgrades = { efficiency: 0, stability: 0, training: 0 };
                } else {
                    if (gameState.upgrades.efficiency === undefined) gameState.upgrades.efficiency = 0;
                    if (gameState.upgrades.stability === undefined) gameState.upgrades.stability = 0;
                    if (gameState.upgrades.training === undefined) gameState.upgrades.training = 0;
                }
                if (!gameState.boosters) {
                    gameState.boosters = { blazing: false, cryo: false, lightning: false };
                }
                if (typeof gameState.ep !== "number" || gameState.ep < 0) {
                    gameState.ep = 500;
                }
                // Migrate collection, set level default, restore static paths, and generate fusion art
                userPandas.forEach(p => {
                    if (p.level === undefined) p.level = 1;
                    
                    const baseMatch = basePandas.find(bp => bp.name === p.name);
                    if (baseMatch) {
                        p.image = baseMatch.image;
                    } else {
                        if (!p.image || p.image === 'null') {
                            p.image = generateProceduralPandaImage(p.emoji, p.type, p.color || getRarityColor(p.rarity), p.rarity);
                        }
                    }
                });
                recalculateTotalPower();
            } else {
                gameState.recentFusions = [];
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
            
            const epEl = document.getElementById('dash-ep');
            if (epEl) epEl.innerText = gameState.ep.toLocaleString();
            const balanceEl = document.getElementById('upgrades-ep-balance');
            if (balanceEl) balanceEl.innerText = gameState.ep.toLocaleString();
            
            // XP bar
            const xpPercent = Math.min((gameState.xp / 10000) * 100, 100);
            document.getElementById('dash-xp-bar').style.width = xpPercent + '%';
            document.getElementById('dash-xp').innerText = `${gameState.xp.toLocaleString()} / 10,000`;
            
            // Update collection count in nav
            document.getElementById('collection-count').innerText = userPandas.length;

            syncDailyChallengeRewardUi();
            syncFireChallengeUi();
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
                    <img src="${fusion.image || 'assets/pandas/fusion_celestial.jpg'}" alt="${fusion.name}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10 shadow-sm">
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
            if (!container) return;
            container.innerHTML = '';
            
            basePandas.forEach(panda => {
                const isUnlocked = userPandas.some(up => up.name === panda.name || (up.type === panda.type && up.rarity === panda.rarity));
                
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-2xl p-3 border border-gray-700 cursor-pointer ${panda.rarity === "mythic" ? "ring-2 ring-purple-400/70 shadow-\[0_0_20px_rgba(168,85,247,0.3)\]" : ""} flex flex-col items-center text-center ${!isUnlocked ? 'opacity-60' : ''}`;
                
                const visualHtml = `<img src="${panda.image}" alt="${panda.name}" class="w-12 h-12 rounded-xl object-cover mb-2 border border-white/10 transition-transform">`;
                
                card.innerHTML = `
                    ${visualHtml}
                    <div class="font-bold text-sm">${panda.name}</div>
                    <div class="text-[10px] mt-0.5 px-2.5 py-px rounded-full" style="background: ${panda.color}30; color: ${panda.color}">
                        ${panda.type}
                    </div>
                    <div class="mt-auto pt-2 text-xs flex items-center justify-center gap-x-1">
                        <span class="font-mono text-emerald-400">${panda.power}</span>
                        <span class="text-gray-500">PWR</span>
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
            if (!container) return;
            container.innerHTML = '';
            
            const pandasToShow = filteredPandas || userPandas;
            
            if (pandasToShow.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">No pandas found matching your search.</div>`;
                return;
            }
            
            pandasToShow.forEach((panda, index) => {
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-3xl p-4 border border-gray-700 cursor-pointer ${panda.rarity === "mythic" ? "ring-2 ring-purple-400/70 shadow-\[0_0_20px_rgba(168,85,247,0.3)\]" : ""} group`;
                
                const rarityColor = getRarityColor(panda.rarity);
                const visualHtml = `<img src="${panda.image}" alt="${panda.name}" class="w-16 h-16 rounded-2xl object-cover mb-3 border border-white/10 transition-all group-hover:scale-110">`;
                
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        ${visualHtml}
                        <div class="flex flex-col items-end gap-y-1">
                            <div class="px-2.5 py-0.5 text-xs font-bold rounded-full" style="background: ${rarityColor}30; color: ${rarityColor}">
                                ${rarityColor.toUpperCase()}
                            </div>
                            <div class="text-[10px] text-gray-400 font-bold">LVL ${panda.level || 1}</div>
                        </div>
                    </div>
                    
                    <div class="font-bold text-lg leading-none mb-1">${panda.name}</div>
                    <div class="flex items-center gap-x-2 text-xs">
                        <span class="px-2 py-px rounded" style="background: ${panda.color}25; color: ${panda.color}">${panda.type}</span>
                    </div>
                    
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

            // Holographic training animations and floating indicators
            if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
                // Holographic card flash
                const detailCard = document.getElementById('detail-panda-card');
                if (detailCard) {
                    detailCard.classList.remove('holographic-flash');
                    void detailCard.offsetWidth; // trigger reflow
                    detailCard.classList.add('holographic-flash');
                    setTimeout(() => {
                        if (detailCard) detailCard.classList.remove('holographic-flash');
                    }, 800);
                }

                // Floating indicator: +PWR
                if (powerValEl && powerValEl.parentElement) {
                    const parent = powerValEl.parentElement;
                    const originalPosition = parent.style.position;
                    parent.style.position = 'relative';
                    
                    const floatPwr = document.createElement('div');
                    floatPwr.className = 'float-up-stat text-amber-400 font-black text-2xl pointer-events-none';
                    floatPwr.style.left = '50%';
                    floatPwr.style.top = '40%';
                    floatPwr.innerText = `+${powerGain} PWR`;
                    parent.appendChild(floatPwr);
                    
                    setTimeout(() => {
                        if (floatPwr) floatPwr.remove();
                        if (parent && !parent.querySelector('.float-up-stat')) {
                            parent.style.position = originalPosition;
                        }
                    }, 1200);
                }

                // Floating indicator: LVL UP!
                const imgContainer = document.getElementById('detail-panda-image-container');
                if (imgContainer) {
                    const floatLvl = document.createElement('div');
                    floatLvl.className = 'float-up-stat text-emerald-400 font-extrabold text-3xl tracking-widest pointer-events-none drop-shadow-[0_4px_12px_rgba(16,185,129,0.6)]';
                    floatLvl.style.left = '50%';
                    floatLvl.style.top = '50%';
                    floatLvl.innerText = 'LVL UP!';
                    imgContainer.appendChild(floatLvl);
                    
                    setTimeout(() => {
                        if (floatLvl) floatLvl.remove();
                    }, 1200);
                }
            }
            
            showToast(`${panda.name} trained to LVL ${panda.level}! (+${powerGain} PWR)`, "success");
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
            { a: "Classic Panda", b: "Inferno Panda", result: "Red Panda", mode: "basic", extra: "Fire + Balanced" },
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
                chip.innerHTML = "<img src=\"" + p.image + "\" alt=\"" + p.name + "\" class=\"w-6 h-6 rounded-lg object-cover border border-white/10\"><span class=\"text-xs font-semibold max-w-[7rem] truncate\">" + p.name + "</span>";
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
            
            const entriesToShow = (filteredEntries || codexData).map(entry => {
                if (!entry.image) {
                    entry.image = generateProceduralPandaImage(entry.emoji, entry.type, entry.color || getRarityColor(entry.rarity), entry.rarity);
                }
                return entry;
            });
            document.getElementById('codex-count').innerText = entriesToShow.length;
            
            entriesToShow.forEach((entry, index) => {
                const isUnlocked = userPandas.some(p => p.name === entry.name || (p.type === entry.type && p.rarity === entry.rarity));
                
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-3xl p-5 border border-gray-700 cursor-pointer ${panda.rarity === "mythic" ? "ring-2 ring-purple-400/70 shadow-\[0_0_20px_rgba(168,85,247,0.3)\]" : ""} group ${!isUnlocked ? 'opacity-75 grayscale-[0.3]' : ''}`;
                
                const rarityColor = getRarityColor(entry.rarity);
                const visualHtml = entry.image 
                    ? `<img src="${entry.image}" alt="${entry.name}" class="w-16 h-16 rounded-2xl object-cover border border-white/10 transition-all group-hover:scale-110 shadow-md">`
                    : `<div class="text-6xl transition-transform group-hover:scale-110">${entry.emoji}</div>`;
                
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        ${visualHtml}
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
                    <div onclick="event.stopImmediatePropagation()" class="cyber-card w-full max-w-2xl rounded-3xl overflow-hidden border" style="border-color: ${entry.color || getRarityColor(entry.rarity)}80">
                        <div class="px-8 pt-8 pb-6 relative bg-gradient-to-b from-[#0f1117] to-transparent">
                            <button onclick="event.target.closest('.fixed').remove()" class="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl">×</button>
                            
                            <div class="flex justify-center mb-4">
                                <img src="${entry.image}" alt="${entry.name}" class="w-32 h-32 rounded-3xl object-cover border border-white/10 shadow-2xl transition-transform">
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
                    <div id="detail-panda-card" style="--champion-color: ${panda.color || getRarityColor(panda.rarity)}" onclick="event.stopImmediatePropagation()" class="cyber-card w-full max-w-lg rounded-3xl overflow-hidden border border-gray-700">
                        <div class="px-8 pt-8 pb-6 relative">
                            <button onclick="event.target.closest('.fixed').remove()" class="absolute top-6 right-6 text-gray-400 hover:text-white">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                            
                            <div id="detail-panda-image-container" class="flex justify-center relative">
                                <img src="${panda.image}" alt="${panda.name}" class="w-32 h-32 rounded-3xl object-cover border border-white/10 transition-all">
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
                                    <div class="text-5xl font-black text-emerald-400 mt-1" id="detail-panda-power-val">${panda.power}</div>
                                </div>
                                <div class="bg-[#1a1f2e] rounded-2xl p-4 text-center">
                                    <div class="text-xs text-gray-400">SPECIAL</div>
                                    <div class="text-3xl mt-2 font-bold">${panda.type}</div>
                                    <div class="text-xs mt-1 text-gray-400">TRAIT</div>
                                </div>
                            </div>
                            
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
            if (!grid) return;
            grid.innerHTML = '';
            
            userPandas.forEach((panda, idx) => {
                const card = document.createElement('div');
                card.className = `panda-card cyber-card rounded-2xl p-4 border border-gray-700 cursor-pointer ${panda.rarity === "mythic" ? "ring-2 ring-purple-400/70 shadow-\[0_0_20px_rgba(168,85,247,0.3)\]" : ""} hover:border-emerald-400 flex flex-col`;
                
                const rarityColor = getRarityColor(panda.rarity);
                const visualHtml = `<img src="${panda.image}" alt="${panda.name}" class="w-12 h-12 rounded-xl object-cover mb-2 border border-white/10">`;
                
                card.innerHTML = `
                    <div class="flex justify-between">
                        ${visualHtml}
                        <div class="flex flex-col items-end gap-y-1">
                            <div class="px-2 py-0.5 text-xs font-bold rounded-full text-center" style="background: ${rarityColor}30; color: ${rarityColor}">
                                ${panda.rarity}
                            </div>
                            <div class="text-[10px] text-gray-400 font-bold">LVL ${panda.level || 1}</div>
                        </div>
                    </div>
                    <div class="font-bold">${panda.name}</div>
                    <div class="text-xs text-emerald-400">${panda.type}</div>
                    
                    <div class="mt-auto pt-3 flex justify-between items-center">
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
            
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }

        function closePandaSelector() {
            const modal = document.getElementById('panda-selector-modal');
            if (modal) {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }
        }

        function selectPandaForSlot(slot, panda) {
            const slotEl = document.getElementById(`slot-${slot}`);
            
            if (slot === 'alpha') selectedAlpha = panda;
            else selectedBeta = panda;
            
            // Update slot UI
            slotEl.innerHTML = `
                <div class="p-5 w-full flex flex-col items-center justify-center text-center">
                    <img src="${panda.image}" alt="${panda.name}" class="w-20 h-20 rounded-2xl object-cover mb-3 border border-white/10 shadow-md">
                    <div class="font-black text-xl">${panda.name}</div>
                    <div class="flex items-center gap-x-2 mt-1">
                        <span class="px-3 py-px text-xs rounded-full" style="background: ${panda.color}25; color: ${panda.color}">${panda.type}</span>
                        <span class="font-mono text-xs text-emerald-400">${panda.power} PWR</span>
                    </div>
                    
                    <div onclick="event.stopImmediatePropagation(); clearSlot('${slot}')" 
                         class="mt-4 text-xs flex items-center gap-x-1 text-red-400 hover:text-red-300 cursor-pointer">
                        <i class="fas fa-times"></i> <span>REMOVE</span>
                    </div>
                </div>
            `;
            
            slotEl.classList.add('active', 'border-solid');
            slotEl.style.borderColor = panda.color;
            slotEl.style.boxShadow = `0 0 25px ${panda.color}40, inset 0 0 15px ${panda.color}20`;
            
            // Enable fuse button if both selected
            updateFuseButton();
            updateEnergyCost();
            updateFusionFlowPaths();
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
            slotEl.style.boxShadow = '';
            
            updateFuseButton();
            updateEnergyCost();
            updateFusionFlowPaths();
        }

        function updateFusionFlowPaths() {
            if (typeof document === 'undefined' || typeof document.createElementNS !== 'function') {
                return;
            }
            const svg = document.getElementById('fusion-flow-svg');
            if (!svg) return;
            svg.innerHTML = '';
            if (Array.isArray(svg.children)) {
                svg.children.length = 0;
            }
            
            const slotAlpha = document.getElementById('slot-alpha');
            const slotBeta = document.getElementById('slot-beta');
            const core = document.querySelector('#section-fusion-lab .animate-spin-slow')?.parentElement;
            
            if (!slotAlpha || !slotBeta || !core) return;
            if (typeof slotAlpha.getBoundingClientRect !== 'function') return;
            
            const svgRect = svg.getBoundingClientRect();
            if (svgRect.width === 0 || svgRect.height === 0) return;
            
            const getCenter = (el) => {
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left - svgRect.left + rect.width / 2,
                    y: rect.top - svgRect.top + rect.height / 2
                };
            };
            
            const coreCenter = getCenter(core);
            
            if (selectedAlpha) {
                const alphaCenter = getCenter(slotAlpha);
                drawPath(alphaCenter, coreCenter, selectedAlpha.color || '#10b981');
            }
            
            if (selectedBeta) {
                const betaCenter = getCenter(slotBeta);
                drawPath(betaCenter, coreCenter, selectedBeta.color || '#c026ff');
            }
            
            function drawPath(start, end, color) {
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                
                let pathD;
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal layout (desktop)
                    const cp1x = start.x + dx * 0.5;
                    const cp1y = start.y;
                    const cp2x = start.x + dx * 0.5;
                    const cp2y = end.y;
                    pathD = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
                } else {
                    // Vertical layout (mobile)
                    const cp1x = start.x;
                    const cp1y = start.y + dy * 0.5;
                    const cp2x = end.x;
                    const cp2y = start.y + dy * 0.5;
                    pathD = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
                }
                
                const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                baseLine.setAttribute('d', pathD);
                baseLine.setAttribute('stroke', color);
                baseLine.setAttribute('stroke-width', '4');
                baseLine.setAttribute('fill', 'none');
                baseLine.setAttribute('opacity', '0.25');
                baseLine.setAttribute('stroke-linecap', 'round');
                
                const activeLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                activeLine.setAttribute('d', pathD);
                activeLine.setAttribute('stroke', color);
                activeLine.setAttribute('stroke-width', '4');
                activeLine.setAttribute('fill', 'none');
                activeLine.setAttribute('stroke-linecap', 'round');
                activeLine.setAttribute('class', 'pulse-flow-line');
                activeLine.setAttribute('style', `filter: drop-shadow(0 0 6px ${color});`);
                
                svg.appendChild(baseLine);
                svg.appendChild(activeLine);
            }
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

            // Use rAF to avoid blocking the main thread (fixes INP 200ms issue on mode buttons)
            requestAnimationFrame(() => {
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
            });

            requestAnimationFrame(() => updateEnergyCost());
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
            let finalCost = Math.floor(baseCost + (powerAvg * 1.8));
            
            // Apply fusion efficiency upgrade reduction
            const efficiencyLvl = (gameState.upgrades && gameState.upgrades.efficiency) || 0;
            finalCost = Math.max(10, Math.floor(finalCost * (1 - efficiencyLvl * 0.02)));

            costEl.innerText = `${finalCost} EP`;
            costEl.style.color = currentFusionMode === 'ritual' ? '#fbbf24' : '#10b981';
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
                
                let epGain = 50;
                if (currentFusionMode === 'advanced') epGain = 100;
                if (currentFusionMode === 'ritual') epGain = 250;
                if (newPanda.isCritical) {
                    epGain += 100;
                    xpGain += 50;
                }

                // Apply Fusion Efficiency upgrade (+3% XP per level)
                const efficiencyLvl = (gameState.upgrades && gameState.upgrades.efficiency) || 0;
                xpGain = Math.floor(xpGain * (1 + efficiencyLvl * 0.03));
                
                // Apply Lightning Core booster (+12% XP)
                if (gameState.boosters && gameState.boosters.lightning) {
                    xpGain = Math.floor(xpGain * 1.12);
                }

                gameState.ep = (Number(gameState.ep) || 0) + epGain;
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
                    image: newPanda.image,
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

        function generateProceduralPandaImage(emoji, type, color, rarity) {
            const isEvolved = emoji && emoji.endsWith('✨');
            const cleanEmoji = emoji ? emoji.replace('✨', '') : '';
            const t = type ? type.toLowerCase() : '';
            
            let species = 'celestial'; // fallback
            
            if (t === 'steam') species = 'steam';
            else if (t === 'eclipse') species = 'eclipse';
            else if (t === 'plasma') species = 'plasma';
            else if (t === 'inferno mystic' || t === 'fire' || cleanEmoji.includes('🔥')) species = 'inferno';
            else if (t === 'dark' || cleanEmoji.includes('🕳️')) species = 'void';
            else if (t === 'light' || cleanEmoji.includes('☀️') || t === 'solar') species = 'solar';
            else if (t === 'mythic' || cleanEmoji.includes('👑')) species = 'quantum';
            else if (t === 'arcane' || cleanEmoji.includes('🔮') || cleanEmoji.includes('🌀')) species = 'chaos';
            else if (t === 'ice' || cleanEmoji.includes('❄️')) species = 'frost';
            else if (t === 'balanced' || cleanEmoji.includes('🌿') || cleanEmoji.includes('🌿🐼') || cleanEmoji.includes('🐼') || cleanEmoji.includes('🔴')) species = 'bamboo';
            else if (t === 'crystal' || cleanEmoji.includes('🌌') || cleanEmoji.includes('💎')) species = 'nebula';
            else if (t === 'hybrid' || cleanEmoji.includes('🌈')) species = 'celestial';
            
            const suffix = isEvolved ? '_evolved' : '';
            return `assets/pandas/fusion_${species}${suffix}.jpg`;
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
            
            let fullName = `${hybridName} ${pandaA.name.split(' ').pop() || 'Panda'}`;
            
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
            const finalPower = Math.floor(basePower + bonus + (synergyBonus * 0.8));
            
            // === RARITY & CRITICAL SYSTEM ===
            let rarity = 'epic';
            let rand = Math.random();
            
            const stabilityLvl = (gameState.upgrades && gameState.upgrades.stability) || 0;
            const rarityShift = stabilityLvl * 0.015;
            
            // Mode-based rarity chances
            if (mode === 'ritual') {
                if (rand > 0.68) rarity = 'mythic';
                else if (rand > 0.38) rarity = 'legendary';
                else rarity = 'epic';
            } else if (mode === 'advanced') {
                if (rand > 0.91 - rarityShift) rarity = 'mythic';
                else if (rand > 0.58 - rarityShift) rarity = 'legendary';
                else if (rand > 0.22 - rarityShift) rarity = 'epic';
                else rarity = 'rare';
            } else {
                if (rand > 0.88 - rarityShift) rarity = 'mythic';
                else if (rand > 0.65 - rarityShift) rarity = 'legendary';
                else if (rand > 0.35 - rarityShift) rarity = 'epic';
                else rarity = 'rare';
            }
            
            // Critical Fusion chance (extra visual + power)
            const critChance = 0.18 + stabilityLvl * 0.02;
            const ritualCritChance = 0.35 + stabilityLvl * 0.02;
            if (Math.random() < critChance || (mode === 'ritual' && Math.random() < ritualCritChance)) {
                isCritical = true;
                rarity = (rarity === 'rare') ? 'epic' : (rarity === 'epic' ? 'legendary' : 'mythic');
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
            
            // Intercept Classic + Inferno combo for Red Panda
            const isRedPandaCombo = (pandaA.name === "Classic Panda" && pandaB.name === "Inferno Panda") ||
                                    (pandaA.name === "Inferno Panda" && pandaB.name === "Classic Panda");
            if (isRedPandaCombo) {
                fullName = "Red Panda";
                emoji = "🔴🐼";
                newType = "Balanced";
                rarity = "epic";
            }
            
            // Apply Blazing Catalyst (+22% Fire power)
            if (gameState.boosters && gameState.boosters.blazing && (emoji.includes('🔥') || emoji === '🌋' || newType.toLowerCase().includes('fire'))) {
                finalPower = Math.floor(finalPower * 1.22);
            }
            // Apply Cryo Stabilizer (+18% Ice power)
            if (gameState.boosters && gameState.boosters.cryo && (emoji.includes('❄️') || emoji === '🌨️' || newType.toLowerCase().includes('ice'))) {
                finalPower = Math.floor(finalPower * 1.18);
            }
            
            // Final panda object
            const newPanda = {
                id: 'f' + Date.now(),
                name: fullName,
                emoji: emoji,
                image: generateProceduralPandaImage(emoji, newType, getRarityColor(rarity), rarity),
                type: newType,
                power: finalPower,
                rarity: rarity,
                color: getRarityColor(rarity),
                desc: `Advanced ${mode} fusion of ${pandaA.name} and ${pandaB.name}. ${synergyName ? 'Powerful ' + synergyName + ' synergy detected!' : ''} ${isCritical ? 'CRITICAL FUSION!' : ''}`,
                level: 1,
                acquired: new Date().toISOString().split('T')[0],
                isCritical: isCritical,
                fusionMode: mode
            };
            
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

        function showFusionResult(newPanda) {
            const modal = document.getElementById('fusion-result-modal');
            
            document.getElementById('fusion-result-emoji').innerHTML = `<img src="${newPanda.image}" alt="${newPanda.name}" class="w-32 h-32 rounded-3xl object-cover border border-white/10 shadow-2xl mx-auto">`;
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
            
            // Bonus: small XP & EP
            bumpLifetimeEarnedXp(35);
            gameState.xp += 35;
            gameState.ep = (Number(gameState.ep) || 0) + 15;
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
            
            // Regenerate evolved procedural image card art
            current.image = generateProceduralPandaImage(current.emoji, current.type, getRarityColor(current.rarity), current.rarity);
            
            // Update modal live
            document.getElementById('fusion-result-name').innerText = current.name;
            document.getElementById('fusion-result-power').innerText = current.power;
            document.getElementById('fusion-result-emoji').innerHTML = `<img src="${current.image}" alt="${current.name}" class="w-32 h-32 rounded-3xl object-cover border border-white/10 shadow-2xl mx-auto">`;
            
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
                            <i class="fas fa-trophy text-4xl text-black"></i>
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

            showToast("Daily Challenge Completed! +280 XP, +500 EP & 1 Rare Panda", "success");

            bumpLifetimeEarnedXp(280);
            gameState.xp += 280;
            gameState.ep = (Number(gameState.ep) || 0) + 500;
            if (gameState.xp >= 10000) {
                gameState.level++;
                gameState.xp -= 10000;
                setTimeout(showLevelUp, 800);
            }
            
            // Reward panda
            const rewardPanda = {
                id: 'daily-' + Date.now(),
                name: ["Blaze Guardian", "Tempest Warden", "Quantum Overlord Panda", "Eternal Flame Sovereign"][Math.floor(Math.random()*4)],
                emoji: "🦍🔥",
                type: "Fire",
                power: 29,
                rarity: "rare",
                color: "#f97316",
                level: 1,
                desc: "Rewarded for completing today's Inferno Fusion challenge. A loyal guardian of the flame.",
                image: generateProceduralPandaImage("🦍🔥", "Fire", "#f97316", "rare"),
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
                        <div class="mb-4">
                            <img src="${rewardPanda.image}" alt="${rewardPanda.name}" class="w-32 h-32 rounded-3xl object-cover border border-white/10 shadow-2xl mx-auto">
                        </div>
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
                art: 'assets/arena/opponent-nexus-bear.jpg',
                video: 'assets/arena/fusion-panda-victory-nexus-bear.mp4',
                keyart: 'assets/arena/opponent-nexus-bear.jpg',
                failureVideo: 'assets/arena/fusion-panda-defeat-nexus-bear.mp4'
            }
        ];

        function __createBattleMatch(selectedChampion = null, specificRivalId = null) {
            const playerLevel = Math.max(0, Number(gameState.level) || 0);
            const champion = selectedChampion || [...userPandas].sort((a, b) => (b.power || 0) - (a.power || 0))[0] || basePandas[0];
            const championPower = Math.max(1, Number(champion.power) || 1);
            const championLevel = Math.max(1, Number(champion.level) || 1);

            // Pick a named rival from the roster (using new Grok-generated arts + lore)
            let rival;
            if (specificRivalId) {
                rival = BATTLE_RIVALS.find(r => r.id === specificRivalId) || BATTLE_RIVALS[0];
            } else {
                rival = BATTLE_RIVALS[Math.floor(Math.random() * BATTLE_RIVALS.length)];
            }

            // Adjust difficulty scaling based on rival's difficulty tier
            let diffMult = 1.0;
            if (rival.difficulty === 'INTRO') {
                diffMult = 0.75;
            } else if (rival.difficulty === 'MEDIUM') {
                diffMult = 1.0;
            } else if (rival.difficulty === 'HARD') {
                diffMult = 1.25;
            }

            // Scale opponent level based on a combination of selected Champion's Level and Player Account Level
            const combinedLevel = Math.max(1, Math.floor((championLevel + playerLevel) / 2));
            const enemyLevelFloor = Math.max(1, combinedLevel - 1);
            const enemyLevelCeil = combinedLevel + (combinedLevel < 3 ? 0 : 1);
            const enemyLevel = enemyLevelFloor + Math.floor(Math.random() * (enemyLevelCeil - enemyLevelFloor + 1));

            const playerMax = 120 + Math.floor(championPower * 2.2) + playerLevel * 9;

            // Opponent HP scales with champion power, player account level, rival difficulty tier, and a random variance (+/- 15%)
            const hpVariance = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
            const enemyMax = Math.max(72, Math.floor(playerMax * (playerLevel < 3 ? 0.65 : 0.85) * diffMult * hpVariance));

            let playerBaseDamage = Math.max(16, Math.floor(championPower * 0.8) + 12 + playerLevel);
            const trainingLvl = (gameState.upgrades && gameState.upgrades.training) || 0;
            playerBaseDamage = Math.floor(playerBaseDamage * (1 + trainingLvl * 0.05));

            // Opponent damage scales with player base damage, rival difficulty tier, and a random variance (+/- 15%)
            const dmgVariance = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
            const enemyBaseDamage = Math.max(7, Math.floor(playerBaseDamage * (playerLevel < 3 ? 0.55 : 0.75) * diffMult * dmgVariance));

            return {
                playerCur: playerMax,
                playerMax,
                enemyCur: enemyMax,
                enemyMax,
                round: 1,
                ended: false,
                playerName: champion.name || "Classic Panda",
                playerEmoji: champion.emoji || "🐼",
                playerImage: champion.image || null,
                playerLevel,
                playerPower: championPower,
                playerType: champion.type || "Balanced",
                playerRarity: champion.rarity || "common",
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
                enemyPower: Math.max(6, Math.floor(championPower * (playerLevel < 3 ? 0.72 : 0.9) * diffMult * (0.9 + Math.random() * 0.2))),
                playerBaseDamage,
                enemyBaseDamage,
            };
        }

        function getChampionMoves(champion) {
            const t = String(champion.type || "").toLowerCase();
            const name = String(champion.name || "");
            
            let attacks = [];
            let specials = [];
            
            if (t.includes('steam')) {
                attacks = ["Scald Jet", "Pressure Slam", "Vapor Punch"];
                specials = ["Superheat Geyser", "Scalding Tempest", "Steam Core Eruption"];
            } else if (t.includes('eclipse')) {
                attacks = ["Twilight Cut", "Lunar Eclipse", "Corona Strike"];
                specials = ["Umbral Judgement", "Celestial Alignment", "Eclipse Oblivion"];
            } else if (t.includes('plasma')) {
                attacks = ["Plasma Spark", "Ion Strike", "Volt Claw"];
                specials = ["Plasma Vaporizer", "Lightning Storm", "Supercharge Eruption"];
            } else if (t.includes('inferno mystic') || t.includes('fire') || name.toLowerCase().includes('blaze')) {
                attacks = ["Flame Strike", "Ember Claw", "Volcanic Dash"];
                specials = ["Supernova Burst", "Hellfire Devastation", "Pyroclastic Surge"];
            } else if (t.includes('ice') || t.includes('frost')) {
                attacks = ["Frost Jab", "Icicle Pierce", "Glacial Sweep"];
                specials = ["Blizzard Storm", "Absolute Zero Blast", "Cryogenic Stasis"];
            } else if (t.includes('dark') || t.includes('void')) {
                attacks = ["Void Slash", "Shadow Strike", "Umbral Dagger"];
                specials = ["Abyssal Devour", "Black Hole Collapse", "Nightmare Nexus"];
            } else if (t.includes('light') || t.includes('solar')) {
                attacks = ["Sun Burst", "Radiant Lance", "Solar Blade"];
                specials = ["Supernova Radiance", "Daybreak Judgement", "Corona Overdrive"];
            } else if (t.includes('electric') || t.includes('thunder')) {
                attacks = ["Volt Spark", "Lightning Claw", "Tesla Strike"];
                specials = ["Thunderbolt Storm", "Plasma Burst", "Overcharge Discharge"];
            } else if (t.includes('arcane') || t.includes('chaos')) {
                attacks = ["Aether Bolt", "Mana Slash", "Chaos Shift"];
                specials = ["Runic Ruin", "Cosmic Singularity", "Chaotic Cataclysm"];
            } else if (t.includes('crystal') || t.includes('nebula')) {
                attacks = ["Quartz Spike", "Prism Shard", "Nebula Strike"];
                specials = ["Crystal Refraction", "Supernova Shatter", "Galactic Prism"];
            } else if (t.includes('hybrid') || t.includes('celestial')) {
                attacks = ["Cosmic Claw", "Stellar Strike", "Nebula Bash"];
                specials = ["Dimensional Rift", "Astral Convergence", "Celestial Fusion Beam"];
            } else if (t.includes('balanced') || t.includes('bamboo')) {
                attacks = ["Bamboo Slam", "Paw Strike", "Swift Kick"];
                specials = ["Panda Fury", "Nature Resonance", "Zen Focus Blast"];
            } else {
                attacks = ["Quick Attack", "Heavy Hit", "Struggle Strike"];
                specials = ["Ultimate Move", "Elemental Surge", "Signature Overload"];
            }
            
            // Customize the first move with the champion's name prefix for character identity
            const namePrefix = name.split(' ')[0] || "Panda";
            attacks[0] = `${namePrefix} ${attacks[0]}`;
            specials[0] = `${namePrefix} ${specials[0]}`;
            
            return { attacks, specials };
        }

        function toggleFractalMenu(type) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            
            const triggerBtn = document.getElementById(type === 'attack' ? "battle-attack-btn" : "battle-special-btn");
            if (triggerBtn && triggerBtn.disabled) return;

            const atkBranches = document.getElementById("attack-branches");
            const spBranches = document.getElementById("special-branches");
            if (!atkBranches || !spBranches) return;
            
            if (type === 'attack') {
                atkBranches.classList.toggle("hidden");
                atkBranches.classList.toggle("flex");
                spBranches.classList.add("hidden");
                spBranches.classList.remove("flex");
            } else {
                spBranches.classList.toggle("hidden");
                spBranches.classList.toggle("flex");
                atkBranches.classList.add("hidden");
                atkBranches.classList.remove("flex");
            }
        }

        function triggerFractalMove(btn, isSpecial, moveIndex) {
            const b = window.__activeBattle;
            if (!b || b.ended) return;
            
            const moves = getChampionMoves({
                name: b.playerName,
                type: b.playerType,
                rarity: b.playerRarity
            });
            const moveName = isSpecial ? moves.specials[moveIndex] : moves.attacks[moveIndex];
            
            simulateBattleAttack(btn, isSpecial, moveName);
            
            const atkBranches = document.getElementById("attack-branches");
            const spBranches = document.getElementById("special-branches");
            if (atkBranches) {
                atkBranches.classList.add("hidden");
                atkBranches.classList.remove("flex");
            }
            if (spBranches) {
                spBranches.classList.add("hidden");
                spBranches.classList.remove("flex");
            }
        }

        window.getChampionMoves = getChampionMoves;
        window.toggleFractalMenu = toggleFractalMenu;
        window.triggerFractalMove = triggerFractalMove;

        function renderBattleChampionSelect() {
            const arenaSection = document.getElementById("section-arena");
            const champions = userPandas.length > 0 ? userPandas : [{ ...basePandas[0], id: "starter-preview" }];
            const sortedChampions = champions
                .map((p, index) => ({ panda: p, index }))
                .sort((a, b) => (b.panda.power || 0) - (a.panda.power || 0));
            arenaSection.innerHTML = `
                <div class="max-w-5xl mx-auto">
                    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                        <div>
                            <div class="uppercase tracking-[3px] text-xs text-red-400">ARENA LOADOUT</div>
                            <div class="text-4xl font-black">Choose Your Panda</div>
                            <p class="text-sm text-gray-400 mt-2 max-w-xl">Pick a champion from your collection. HP, damage, and the opponent matchup scale from this panda and your current level.</p>
                        </div>
                        <button type="button" onclick="navigateTo('collection')" class="px-5 py-2 text-xs border border-gray-700 rounded-2xl hover:bg-[#1a1f2e] transition-colors">
                            VIEW COLLECTION
                        </button>
                    </div>

                    <!-- NEXT BATTLE quick start (random champion + random rival) -->
                    <div class="mb-6">
                        <button onclick="startQuickMatch()" 
                                class="w-full sm:w-auto mx-auto flex items-center justify-center gap-x-3 px-8 py-3.5 rounded-3xl font-bold text-base border-2 border-red-400 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all active:scale-[0.985]">
                            <i class="fas fa-bolt"></i>
                            <span>NEXT BATTLE — Random Champion + Random Rival</span>
                            <i class="fas fa-swords"></i>
                        </button>
                        <p class="text-center text-[10px] text-gray-500 mt-1">Quick themed battle with one of the signature Grok-powered rivals</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="battle-champion-grid">
                        ${sortedChampions.map(({ panda, index }) => {
                            const rarityColor = getRarityColor(panda.rarity || "common");
                            return `
                                <button type="button"
                                        onclick="startDemoBattle(${index})"
                                        class="cyber-card text-left rounded-3xl p-5 border border-gray-700 hover:border-red-400 transition-all group">
                                    <div class="flex items-start gap-4">
                                        <img src="${panda.image || 'assets/pandas/classic_panda.jpg'}" alt="${panda.name}" class="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-white/10 shadow-md transition-all group-hover:scale-110">
                                        <div class="min-w-0 flex-1">
                                            <div class="font-black text-xl truncate">${__escapeBattleText(panda.name || "Unknown Panda")}</div>
                                            <div class="flex flex-wrap gap-2 mt-2 text-[10px] font-bold">
                                                <span class="px-2.5 py-1 rounded-full" style="background:${rarityColor}25;color:${rarityColor}">${__escapeBattleText((panda.rarity || "common").toUpperCase())}</span>
                                                <span class="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300">${Number(panda.power) || 1} PWR</span>
                                            </div>
                                            <div class="text-xs text-gray-400 mt-3 line-clamp-2">${__escapeBattleText(panda.desc || "Ready for battle.")}</div>
                                            <div class="mt-4 text-xs text-red-300 font-mono">SELECT CHAMPION →</div>
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
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
                    <p class="text-xl text-gray-400 max-w-md mx-auto">Real-time demo battles with Grok-powered victory and defeat cinematics. Defeat rivals like the Void Howler (or get defeated) and claim (or lose) Fusion Panda glory.</p>
                    
                    <div class="mt-10 inline-flex items-center gap-x-2 px-6 py-3 bg-[#1a1f2e] rounded-3xl text-sm border border-gray-700">
                        <div class="flex -space-x-2">
                            <div class="w-7 h-7 bg-red-400 rounded-full flex items-center justify-center ring-2 ring-[#1a1f2e]"><i class="fas fa-paw text-xs text-black"></i></div>
                            <div class="w-7 h-7 bg-orange-400 rounded-full flex items-center justify-center ring-2 ring-[#1a1f2e]"><i class="fas fa-fire-alt text-xs text-black"></i></div>
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
                </div>
            `;
        }

        function startQuickMatch() {
            // Pick random champion from collection (or starter)
            const available = userPandas.length > 0 ? userPandas : [{ ...basePandas[0], id: "starter-preview" }];
            const champ = available[Math.floor(Math.random() * available.length)];
            let champIndex = userPandas.indexOf(champ);
            if (champIndex < 0) {
                // starter preview case - use 0 which will fallback inside
                champIndex = 0;
            }

            // Pick random rival
            const rival = BATTLE_RIVALS[Math.floor(Math.random() * BATTLE_RIVALS.length)];

            // Start directly with pre-chosen rival (themed like prototype NEW MATCH)
            startDemoBattle(champIndex, rival.id);
        }

        function startDemoBattle(championIndex = 0, specificRivalId = null) {
            const arenaSection = document.getElementById("section-arena");
            if (!arenaSection) return;
            const selectedChampion = userPandas[championIndex] || userPandas[0] || basePandas[0];
            const battle = __createBattleMatch(selectedChampion, specificRivalId);
            window.__activeBattle = battle;
            const moves = getChampionMoves(selectedChampion);
            console.log('Started battle vs:', battle.enemyName, 'video will be:', battle.enemyVideo, 'failureVideo will be:', battle.enemyFailureVideo);
            const safePlayerName = __escapeBattleText(battle.playerName);
            const safeEnemyName = __escapeBattleText(battle.enemyName);
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
                        <div id="battle-fighter-player" class="battle-fighter md:col-span-3 cyber-card rounded-3xl p-4 md:p-6 text-center border border-emerald-500/50">
                            <div class="battle-anim-flash battle-anim-flash--emerald pointer-events-none" id="battle-flash-player" aria-hidden="true"></div>
                            <div class="text-xs mb-1 text-emerald-400">YOUR CHAMPION</div>
                            <div class="mb-2 min-h-[5rem] flex items-center justify-center relative" aria-hidden="true" style="background: radial-gradient(circle at 50% 40%, rgba(0,0,0,0.1), transparent);">
                                <img src="${battle.playerImage || 'assets/pandas/classic_panda.jpg'}" alt="${safePlayerName}" class="max-h-28 md:max-h-32 w-auto rounded-2xl object-cover shadow-lg border border-white/10" style="max-width: 70%;" id="battle-image-player"/>
                            </div>
                            <div class="font-black text-lg md:text-2xl">${safePlayerName}</div>
                            <div class="text-xs sm:text-sm text-emerald-400/90 mb-3">LVL ${battle.playerLevel} · ${battle.playerPower} PWR</div>
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
                            <div class="mb-2 min-h-[5rem] flex items-center justify-center relative" aria-hidden="true" style="background: radial-gradient(circle at 50% 40%, rgba(0,0,0,0.1), transparent);">
                                <img src="${battle.enemyArt || 'assets/pandas/classic_panda.jpg'}" alt="${safeEnemyName}" class="max-h-28 md:max-h-32 w-auto rounded-2xl object-cover shadow-lg border border-white/10" style="max-width: 70%;"/>
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
                            <div class="text-gray-500">A level-matched foe enters range. Choose Attack or Special — moves play on the stage above.</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 relative select-none">
                        <!-- Attack Branching Container -->
                        <div class="fractal-menu-container relative text-red-500/50" id="attack-menu-container">
                            <button type="button" id="battle-attack-btn" onclick="toggleFractalMenu('attack')" class="parent-action-btn w-full sm:w-auto min-w-[11rem] px-6 py-3.5 text-sm bg-red-600 hover:bg-red-500 transition-all rounded-2xl font-bold flex items-center justify-center gap-x-2 relative z-20 shadow-lg border border-red-500/30">
                                <span>ATTACK</span> <i class="fas fa-fist-raised" aria-hidden="true"></i>
                            </button>
                            
                            <!-- Branching Nodes -->
                            <div class="fractal-branches hidden z-10 absolute left-1/2 -translate-x-1/2 bottom-0 w-max" id="attack-branches">
                                <div class="fractal-line fractal-line--left"></div>
                                <div class="fractal-line fractal-line--center"></div>
                                <div class="fractal-line fractal-line--right"></div>
                                
                                <button type="button" onclick="void triggerFractalMove(this, false, 0)" class="fractal-node fractal-node--left px-4 py-2 text-xs bg-slate-900/95 hover:bg-red-950/80 text-red-200 border border-red-500/50 rounded-xl font-bold transition-all shadow-md backdrop-blur-md">
                                    ${moves.attacks[0]}
                                </button>
                                <button type="button" onclick="void triggerFractalMove(this, false, 1)" class="fractal-node fractal-node--center px-4 py-2 text-xs bg-slate-900/95 hover:bg-red-950/80 text-red-200 border border-red-500/50 rounded-xl font-bold transition-all shadow-md backdrop-blur-md">
                                    ${moves.attacks[1]}
                                </button>
                                <button type="button" onclick="void triggerFractalMove(this, false, 2)" class="fractal-node fractal-node--right px-4 py-2 text-xs bg-slate-900/95 hover:bg-red-950/80 text-red-200 border border-red-500/50 rounded-xl font-bold transition-all shadow-md backdrop-blur-md">
                                    ${moves.attacks[2]}
                                </button>
                            </div>
                        </div>

                        <!-- Special Branching Container -->
                        <div class="fractal-menu-container relative text-fuchsia-500/50" id="special-menu-container" style="--champion-color: ${selectedChampion.color || '#d946ef'};">
                            <button type="button" id="battle-special-btn" onclick="toggleFractalMenu('special')" class="parent-action-btn w-full sm:w-auto min-w-[11rem] px-6 py-3.5 text-sm border border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/10 transition-all rounded-2xl font-bold flex items-center justify-center gap-x-2 relative z-20 shadow-lg backdrop-blur-md">
                                <span>SPECIAL</span> <i class="fas fa-magic" aria-hidden="true"></i>
                            </button>
                            
                            <!-- Branching Nodes -->
                            <div class="fractal-branches hidden z-10 absolute left-1/2 -translate-x-1/2 bottom-0 w-max" id="special-branches">
                                <div class="fractal-line fractal-line--left"></div>
                                <div class="fractal-line fractal-line--center"></div>
                                <div class="fractal-line fractal-line--right"></div>
                                
                                <button type="button" onclick="void triggerFractalMove(this, true, 0)" class="fractal-node fractal-node--left px-4 py-2 text-xs bg-slate-900/95 hover:bg-fuchsia-950/80 text-fuchsia-200 border border-fuchsia-500/50 rounded-xl font-bold transition-all shadow-md backdrop-blur-md">
                                    ${moves.specials[0]}
                                </button>
                                <button type="button" onclick="void triggerFractalMove(this, true, 1)" class="fractal-node fractal-node--center px-4 py-2 text-xs bg-slate-900/95 hover:bg-fuchsia-950/80 text-fuchsia-200 border border-fuchsia-500/50 rounded-xl font-bold transition-all shadow-md backdrop-blur-md">
                                    ${moves.specials[1]}
                                </button>
                                <button type="button" onclick="void triggerFractalMove(this, true, 2)" class="fractal-node fractal-node--right px-4 py-2 text-xs bg-slate-900/95 hover:bg-fuchsia-950/80 text-fuchsia-200 border border-fuchsia-500/50 rounded-xl font-bold transition-all shadow-md backdrop-blur-md">
                                    ${moves.specials[2]}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            __syncBattleHpBars();
        }

        function triggerSpecialActionClips(battle, attackName) {
            if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
                return;
            }
            const stage = document.getElementById('battle-stage');
            if (!stage) return;

            function getComicActionText(type, stepIndex) {
                const t = String(type || "").toLowerCase();
                if (t.includes('fire') || t.includes('inferno') || t.includes('blaze')) {
                    const words = ["FWOOSH!", "IGNITE!", "BOOM!", "KABOOM!", "BURN!"];
                    return words[stepIndex] || "BURN!";
                } else if (t.includes('ice') || t.includes('frost')) {
                    const words = ["SHIVER!", "FREEZE!", "CRACK!", "SHATTER!", "COLD!"];
                    return words[stepIndex] || "FREEZE!";
                } else if (t.includes('steam')) {
                    const words = ["HISS!", "SCALD!", "BOIL!", "STEAM!", "BURST!"];
                    return words[stepIndex] || "STEAM!";
                } else if (t.includes('plasma') || t.includes('electric') || t.includes('lightning') || t.includes('thunder')) {
                    const words = ["ZZZAP!", "SHOCK!", "CRACKLE!", "BOOM!", "BOLT!"];
                    return words[stepIndex] || "SHOCK!";
                } else if (t.includes('dark') || t.includes('void') || t.includes('eclipse')) {
                    const words = ["VOID!", "GRAVITY!", "CRUSH!", "OBLIVION!", "SHADOW!"];
                    return words[stepIndex] || "VOID!";
                } else if (t.includes('light') || t.includes('celestial') || t.includes('nebula') || t.includes('solar')) {
                    const words = ["FLASH!", "BEAM!", "GLARE!", "SUPERNOVA!", "RAY!"];
                    return words[stepIndex] || "FLASH!";
                } else {
                    const words = ["SLAM!", "CRASH!", "POW!", "WHACK!", "SMASH!"];
                    return words[stepIndex] || "SLAM!";
                }
            }

            function getComicActionIcon(type) {
                const t = String(type || "").toLowerCase();
                if (t.includes('fire') || t.includes('inferno') || t.includes('blaze')) {
                    return 'fa-solid fa-fire-flame-curved text-orange-500';
                } else if (t.includes('ice') || t.includes('frost')) {
                    return 'fa-solid fa-snowflake text-cyan-300';
                } else if (t.includes('steam')) {
                    return 'fa-solid fa-smog text-slate-300';
                } else if (t.includes('plasma') || t.includes('electric') || t.includes('lightning') || t.includes('thunder')) {
                    return 'fa-solid fa-bolt-lightning text-yellow-400';
                } else if (t.includes('dark') || t.includes('void') || t.includes('eclipse')) {
                    return 'fa-solid fa-circle-nodes text-purple-600';
                } else if (t.includes('light') || t.includes('celestial') || t.includes('nebula') || t.includes('solar')) {
                    return 'fa-solid fa-wand-magic-sparkles text-amber-300';
                } else {
                    return 'fa-solid fa-burst text-red-500';
                }
            }

            function getComicActionBg(type, championColor) {
                const t = String(type || "").toLowerCase();
                if (t.includes('fire') || t.includes('inferno') || t.includes('blaze')) {
                    return `radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, rgba(10, 10, 15, 0.95) 85%)`;
                } else if (t.includes('ice') || t.includes('frost')) {
                    return `radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(10, 10, 15, 0.95) 85%)`;
                } else if (t.includes('steam')) {
                    return `radial-gradient(circle, rgba(156, 163, 175, 0.35) 0%, rgba(10, 10, 15, 0.95) 85%)`;
                } else if (t.includes('plasma') || t.includes('electric') || t.includes('lightning') || t.includes('thunder')) {
                    return `radial-gradient(circle, rgba(234, 179, 8, 0.35) 0%, rgba(10, 10, 15, 0.95) 85%)`;
                } else if (t.includes('dark') || t.includes('void') || t.includes('eclipse')) {
                    return `radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, rgba(10, 10, 15, 0.95) 85%)`;
                } else if (t.includes('light') || t.includes('celestial') || t.includes('nebula') || t.includes('solar')) {
                    return `radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(10, 10, 15, 0.95) 85%)`;
                } else {
                    return `radial-gradient(circle, ${championColor}55 0%, rgba(10, 10, 15, 0.95) 85%)`;
                }
            }

            function getSeed(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash = str.charCodeAt(i) + ((hash << 5) - hash);
                }
                return Math.abs(hash);
            }

            const seed = getSeed(attackName + (battle.playerName || ""));
            const numPanels = 1 + (seed % 5);
            
            const shapePool = [
                { name: 'hexagon', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
                { name: 'rhombus', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
                { name: 'octagon', clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' },
                { name: 'trapezoid', clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' },
                { name: 'triangle', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
                { name: 'parallelogram', clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)' },
                { name: 'bevel', clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }
            ];

            const championColor = battle.playerRarity ? getRarityColor(battle.playerRarity) : '#d946ef';
            const championImage = battle.playerImage || 'assets/pandas/classic_panda.jpg';
            const actionIcon = getComicActionIcon(battle.playerType);
            const actionBg = getComicActionBg(battle.playerType, championColor);

            const impactIndex = numPanels >= 3 ? 2 : (numPanels - 1);

            for (let index = 0; index < numPanels; index++) {
                const pSeed = seed + index * 37;
                const shape = shapePool[pSeed % shapePool.length];
                
                const width = (110 + (pSeed % 51)) + 'px';
                const height = (100 + ((pSeed >> 2) % 51)) + 'px';
                
                const colWidth = 70 / numPanels;
                const baseLeft = 5 + (index * colWidth);
                const offsetLeft = (pSeed >> 4) % Math.max(5, Math.floor(colWidth - 5));
                const left = (baseLeft + offsetLeft) + '%';
                
                const top = (10 + ((pSeed >> 6) % 46)) + '%';
                const rotate = (-12 + ((pSeed >> 8) % 25)) + 'deg';
                const panClass = 'action-pan-' + (1 + ((pSeed >> 10) % 5));

                setTimeout(() => {
                    const popup = document.createElement('div');
                    popup.className = 'special-clip-popup absolute pointer-events-none comic-border bg-halftone';
                    popup.setAttribute('data-testid', 'special-popup');
                    popup.style.width = width;
                    popup.style.height = height;
                    popup.style.left = left;
                    popup.style.top = top;
                    popup.style.clipPath = shape.clipPath;
                    popup.style.setProperty('--champion-color', championColor);
                    popup.style.boxShadow = `0 0 25px ${championColor}A0`;
                    popup.style.transform = `scale(0) rotate(${rotate})`;
                    popup.style.transition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease';
                    popup.style.zIndex = '100';
                    popup.style.opacity = '0';
                    popup.style.background = '#0a0a0f';
                    popup.style.overflow = 'hidden';

                    let panelHTML = '';
                    const actionWord = getComicActionText(battle.playerType, index);
                    
                    if (index === impactIndex) {
                        panelHTML = `
                            <div class="relative w-full h-full flex items-center justify-center" style="background: ${actionBg}">
                                <div class="absolute inset-0 bg-halftone"></div>
                                <div class="spiked-burst-clip absolute w-[90%] h-[90%] flex items-center justify-center">
                                    <div class="font-comic text-2xl md:text-3xl font-black text-white tracking-wider transform -rotate-12">${actionWord}</div>
                                </div>
                                <div class="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[6px] font-mono tracking-widest text-yellow-400 bg-black border border-yellow-400/30">
                                    PANEL ${index + 1}: IMPACT
                                </div>
                            </div>
                        `;
                    } else {
                        let panelContent = '';
                        let panelTitle = '';
                        
                        if (index === 0) {
                            panelTitle = 'PANEL 1: CHARGE';
                            panelContent = `
                                <div class="relative w-full h-full flex items-center justify-center" style="background: ${actionBg}">
                                    <div class="absolute inset-0 bg-halftone opacity-45 pointer-events-none"></div>
                                    <!-- Rotating energy ring -->
                                    <div class="w-16 h-16 rounded-full border-4 border-dashed border-white/20 animate-spin absolute" style="animation-duration: 4s;"></div>
                                    <i class="${actionIcon} text-5xl animate-pulse filter drop-shadow-[0_0_15px_currentColor] z-10 ${panClass}"></i>
                                    <!-- Champion inset portrait -->
                                    <div class="absolute top-2 right-2 w-8 h-8 rounded-full border border-black/50 overflow-hidden z-20 shadow-md">
                                        <img src="${championImage}" class="w-full h-full object-cover">
                                    </div>
                                </div>
                            `;
                        } else if (index === 1) {
                            panelTitle = 'PANEL 2: UNLEASH';
                            panelContent = `
                                <div class="relative w-full h-full flex items-center justify-center" style="background: ${actionBg}">
                                    <!-- Comic speed lines repeating gradient -->
                                    <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 12px);"></div>
                                    <!-- Motion trails -->
                                    <i class="${actionIcon} text-3xl opacity-30 transform -translate-x-8 translate-y-1 scale-75 skew-x-12 absolute z-5"></i>
                                    <i class="${actionIcon} text-4xl opacity-60 transform -translate-x-4 scale-90 skew-x-12 absolute z-10"></i>
                                    <i class="${actionIcon} text-5xl transform translate-x-4 scale-100 skew-x-12 absolute z-20 filter drop-shadow-[0_0_10px_currentColor] ${panClass}"></i>
                                </div>
                            `;
                        } else if (index === 3 || (index > impactIndex && index < numPanels - 1)) {
                            panelTitle = `PANEL ${index + 1}: BURST`;
                            panelContent = `
                                <div class="relative w-full h-full flex items-center justify-center" style="background: ${actionBg}">
                                    <div class="absolute inset-0 bg-halftone opacity-45 pointer-events-none"></div>
                                    <!-- Concentric shockwaves -->
                                    <div class="w-20 h-20 rounded-full border border-white/20 absolute animate-ping" style="animation-duration: 1.5s;"></div>
                                    <i class="fa-solid fa-burst text-7xl text-orange-500 absolute opacity-50 z-5"></i>
                                    <i class="fa-solid fa-burst text-8xl text-red-600 absolute z-10 ${panClass}"></i>
                                    <i class="${actionIcon} text-3xl text-white absolute z-20 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"></i>
                                </div>
                            `;
                        } else {
                            panelTitle = `PANEL ${index + 1}: RESOLVE`;
                            panelContent = `
                                <div class="relative w-full h-full flex items-center justify-center flex-col" style="background: ${actionBg}">
                                    <div class="absolute inset-0 bg-halftone opacity-60 pointer-events-none"></div>
                                    <i class="${actionIcon} text-4xl opacity-50 transform rotate-12 z-10 ${panClass}"></i>
                                    <div class="mt-2 bg-emerald-500 text-black border border-black font-comic text-[8px] font-black px-1.5 py-0.5 rotate-3 z-20">
                                        STRIKE COMPLETE!
                                    </div>
                                </div>
                            `;
                        }

                        panelHTML = `
                            <div class="relative w-full h-full flex items-center justify-center">
                                ${panelContent}
                                
                                <div class="absolute inset-0 bg-scanlines pointer-events-none opacity-20 z-10"></div>
                                
                                <div class="absolute bottom-2 left-3 bg-yellow-400 text-black border-2 border-black font-comic text-[10px] font-black px-2 py-0.5 transform -rotate-3 z-20">
                                    ${actionWord}
                                </div>
                                
                                <div class="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[6px] font-mono tracking-widest text-white/90 bg-black/80 border border-white/10 z-20">
                                    ${panelTitle}
                                </div>
                                
                                <div class="absolute inset-0 bg-white opacity-0 animate-rapid-flash pointer-events-none z-30"></div>
                            </div>
                        `;
                    }

                    popup.innerHTML = panelHTML;
                    stage.appendChild(popup);

                    void popup.offsetWidth;
                    popup.style.transform = `scale(1) rotate(${rotate})`;
                    popup.style.opacity = '1';

                    setTimeout(() => {
                        if (popup && popup.parentElement) {
                            popup.style.transform = `scale(0) rotate(${rotate})`;
                            popup.style.opacity = '0';
                            setTimeout(() => {
                                if (popup && popup.parentElement) popup.remove();
                            }, 250);
                        }
                    }, 850);

                }, index * 80);
            }
        }

        async function simulateBattleAttack(element, isSpecial = false, customMoveName = null) {
            const b = window.__activeBattle;
            const log = document.getElementById("battle-log");
            if (!log || !b || b.ended) return;
            const pCard = document.getElementById("battle-fighter-player");
            const eCard = document.getElementById("battle-fighter-enemy");
            const pFlash = document.getElementById("battle-flash-player");
            const eFlash = document.getElementById("battle-flash-enemy");
            const beam = document.getElementById("battle-beam");
            const atkBtn = document.getElementById("battle-attack-btn");
            const spBtn = document.getElementById("battle-special-btn");
            if (!pCard || !eCard) return;
            if (element && element.disabled) return;
            if (atkBtn) atkBtn.disabled = true;
            if (spBtn) spBtn.disabled = true;
            const attackName = customMoveName || (isSpecial
                ? "SPECIAL SURGE"
                : "BASIC STRIKE");
            const dmg = isSpecial
                ? Math.floor(Math.random() * 14) + b.playerBaseDamage + 12
                : Math.floor(Math.random() * 10) + b.playerBaseDamage;
            if (isSpecial) {
                triggerSpecialActionClips(b, attackName);
            }
            pCard.classList.add("battle-anim-attack-left");
            __resetBeam(beam);
            if (beam) {
                if (isSpecial) {
                    beam.classList.add("battle-beam--special");
                    beam.style.background =
                        "linear-gradient(90deg, #a855f7, #e879f9, #f43f5e)";
                } else {
                    beam.style.background =
                        "linear-gradient(90deg, #10b981, #2dd4bf, #a855f7)";
                }
                beam.classList.add("battle-beam--to-enemy");
            }
            await __battleWait(120);
            b.enemyCur = Math.max(0, b.enemyCur - dmg);
            __syncBattleHpBars();
            eCard.classList.add("battle-anim-shake");
            if (eFlash) eFlash.classList.add("battle-anim-flash--on", "battle-anim-flash--red");
            __spawnBattleFloatingDmg(eCard, dmg, isSpecial);
            __appendBattleLogLine(
                isSpecial ? "text-fuchsia-300" : "text-emerald-300",
                `${__escapeBattleText(b.playerName)} used <span class="font-bold">${attackName}</span> <span class="text-white/60">→</span> <span class="font-mono">${dmg} DMG</span>`,
            );
            await __battleWait(450);
            pCard.classList.remove("battle-anim-attack-left");
            eCard.classList.remove("battle-anim-shake");
            if (eFlash) eFlash.classList.remove("battle-anim-flash--on", "battle-anim-flash--red");
            if (beam) {
                beam.classList.remove("battle-beam--to-enemy", "battle-beam--special");
            }
            if (b.enemyCur <= 0) {
                b.ended = true;
                b.enemyCur = 0;
                __syncBattleHpBars();
                eCard.classList.add("battle-fighter--defeated");
                eCard.setAttribute("aria-hidden", "true");
                document.getElementById("battle-stage")?.classList.add("battle-stage--victory");
                __appendBattleLogLine(
                    "text-amber-300 font-bold border-t border-amber-500/20 pt-2 mt-1",
                    `🏆 VICTORY! ${__escapeBattleText(b.enemyName)} defeated! ${b.enemySubtitle ? '— ' + __escapeBattleText(b.enemySubtitle) : ''} +650 XP & +350 EP`,
                );
                showToast("Battle won! +650 XP & +350 EP earned", "success");
                bumpLifetimeEarnedXp(650);
                gameState.xp += 650;
                gameState.ep = (Number(gameState.ep) || 0) + 350;
                if (gameState.xp >= 10000) {
                    gameState.level++;
                    gameState.xp = gameState.xp % 10000;
                    setTimeout(showLevelUp, 1200);
                }
                saveGameState();
                updateDashboard();

                console.log('Victory cinematic for:', b.enemyName, 'using video:', b.enemyVideo);

                // Grok-powered cinematic victory — now integrated into the main battle stage (in-arena viewer)
                // with dynamic rival poster + quick actions. Modal still available via "Fullscreen" button.
                const logEl = document.getElementById('battle-log');
                if (logEl && typeof window.showInArenaCinematic === 'function') {
                    const replayBtn = document.createElement('button');
                    replayBtn.className = 'mt-2 text-xs px-3 py-1 rounded-xl border border-amber-400/60 text-amber-300 hover:bg-amber-500/10';
                    replayBtn.innerHTML = '<i class="fas fa-play mr-1"></i> REPLAY CINEMATIC';
                    replayBtn.onclick = () => window.showInArenaCinematic(b);
                    logEl.appendChild(replayBtn);
                }

                setTimeout(() => {
                    if (typeof window.showInArenaCinematic === 'function') {
                        window.showInArenaCinematic(b);
                    } else if (typeof window.showVictoryCinematic === 'function') {
                        window.showVictoryCinematic(b); // fallback
                    }
                }, 700);
                return;
            }
            await __battleWait(380);
            const roundEl = document.getElementById("battle-round");
            const enemyAttacks = ["VOID CRUSH", "HELLFIRE ROAR", "DARK PULSE"];
            const enemyAttack = enemyAttacks[Math.floor(Math.random() * enemyAttacks.length)];
            const enemyDmg = Math.floor(Math.random() * 8) + b.enemyBaseDamage;
            eCard.classList.add("battle-anim-attack-right");
            __resetBeam(beam);
            if (beam) {
                beam.style.background = "linear-gradient(90deg, #f43f5e, #a855f7, #10b981)";
                beam.classList.add("battle-beam--to-player");
            }
            await __battleWait(120);
            b.playerCur = Math.max(0, b.playerCur - enemyDmg);
            __syncBattleHpBars();
            pCard.classList.add("battle-anim-shake");
            if (pFlash) pFlash.classList.add("battle-anim-flash--on", "battle-anim-flash--emerald");
            __spawnBattleFloatingDmg(pCard, enemyDmg, false);
            __appendBattleLogLine(
                "text-rose-300",
                `${__escapeBattleText(b.enemyName)}: <span class="font-bold">${enemyAttack}</span> <span class="text-white/60">→</span> <span class="font-mono text-white">${enemyDmg} DMG</span>`,
            );
            await __battleWait(450);
            eCard.classList.remove("battle-anim-attack-right");
            pCard.classList.remove("battle-anim-shake");
            if (pFlash) pFlash.classList.remove("battle-anim-flash--on", "battle-anim-flash--emerald");
            if (beam) {
                beam.classList.remove("battle-beam--to-player");
            }
            if (b.playerCur <= 0) {
                b.ended = true;
                b.playerCur = 0;
                __syncBattleHpBars();
                if (pCard) {
                    pCard.classList.add("battle-fighter--defeated");
                    pCard.setAttribute("aria-hidden", "true");
                }
                document.getElementById("battle-stage")?.classList.add("battle-stage--defeat");
                __appendBattleLogLine(
                    "text-rose-300 font-bold border-t border-rose-500/20 pt-2 mt-1",
                    `💀 DEFEAT! ${__escapeBattleText(b.playerName)} was overpowered by ${__escapeBattleText(b.enemyName)}! ${b.enemySubtitle ? '— ' + __escapeBattleText(b.enemySubtitle) : ''}`,
                );
                console.log('Defeat by foe from battle:', b.enemyName, 'using failure video:', b.enemyFailureVideo);

                // Grok-powered cinematic defeat (failure path) — in-arena viewer + replay
                const logEl = document.getElementById('battle-log');
                if (logEl && typeof window.showInArenaFailureCinematic === 'function') {
                    const replayBtn = document.createElement('button');
                    replayBtn.className = 'mt-2 text-xs px-3 py-1 rounded-xl border border-rose-400/60 text-rose-300 hover:bg-rose-500/10';
                    replayBtn.innerHTML = '<i class="fas fa-play mr-1"></i> REPLAY DEFEAT CINEMATIC';
                    replayBtn.onclick = () => window.showInArenaFailureCinematic(b);
                    logEl.appendChild(replayBtn);
                }

                setTimeout(() => {
                    if (typeof window.showInArenaFailureCinematic === 'function') {
                        window.showInArenaFailureCinematic(b);
                    } else if (typeof window.showFailureCinematic === 'function') {
                        window.showFailureCinematic(b); // fallback
                    }
                }, 700);
                return;
            }
            b.round += 1;
            if (roundEl) {
                roundEl.textContent = String(b.round);
            }
            if (!b.ended) {
                if (atkBtn) atkBtn.disabled = false;
                if (spBtn) spBtn.disabled = false;
            }
        }

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

        function renderUpgrades() {
            const balanceEl = document.getElementById('upgrades-ep-balance');
            if (balanceEl) balanceEl.innerText = gameState.ep.toLocaleString();
            
            // 1. Fusion Efficiency
            const effLvl = (gameState.upgrades && gameState.upgrades.efficiency) || 0;
            const effLvlEl = document.getElementById('upgrade-efficiency-level');
            const effValEl = document.getElementById('upgrade-efficiency-value');
            const effBarEl = document.getElementById('upgrade-efficiency-bar');
            const effBtn = document.getElementById('upgrade-efficiency-btn');
            const effSub = document.getElementById('upgrade-efficiency-sub');
            
            if (effLvlEl) effLvlEl.innerText = `LVL ${effLvl} / 25`;
            if (effValEl) effValEl.innerText = `+${effLvl * 3}% XP`;
            if (effBarEl) effBarEl.style.width = `${(effLvl / 25) * 100}%`;
            
            if (effLvl >= 25) {
                if (effBtn) {
                    effBtn.innerText = 'MAX LEVEL';
                    effBtn.disabled = true;
                    effBtn.className = 'px-4 py-2 text-xs rounded-xl bg-gray-800 text-gray-500 font-medium w-full xs:w-auto cursor-not-allowed';
                }
                if (effSub) effSub.innerText = 'Fully optimized.';
            } else {
                const nextCost = 250 + effLvl * 150;
                if (effBtn) {
                    effBtn.innerText = `UPGRADE • ${nextCost} EP`;
                    effBtn.disabled = gameState.ep < nextCost;
                    effBtn.className = `px-4 py-2 text-xs rounded-xl font-medium w-full xs:w-auto ${gameState.ep >= nextCost ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-emerald-500/10 text-emerald-400 opacity-60 cursor-not-allowed'}`;
                }
                if (effSub) effSub.innerText = `Next: +3% XP & -2% EP cost`;
            }
            
            // 2. Genetic Stability
            const stabLvl = (gameState.upgrades && gameState.upgrades.stability) || 0;
            const stabLvlEl = document.getElementById('upgrade-stability-level');
            const stabValEl = document.getElementById('upgrade-stability-value');
            const stabBarEl = document.getElementById('upgrade-stability-bar');
            const stabBtn = document.getElementById('upgrade-stability-btn');
            const stabSub = document.getElementById('upgrade-stability-sub');
            
            if (stabLvlEl) stabLvlEl.innerText = `LVL ${stabLvl} / 15`;
            if (stabValEl) stabValEl.innerText = `+${stabLvl * 2}% Crit`;
            if (stabBarEl) stabBarEl.style.width = `${(stabLvl / 15) * 100}%`;
            
            if (stabLvl >= 15) {
                if (stabBtn) {
                    stabBtn.innerText = 'MAX LEVEL';
                    stabBtn.disabled = true;
                    stabBtn.className = 'px-4 py-2 text-xs rounded-xl bg-gray-800 text-gray-500 font-medium w-full xs:w-auto cursor-not-allowed';
                }
                if (stabSub) stabSub.innerText = 'Genetic sequence finalized.';
            } else {
                const nextCost = 400 + stabLvl * 250;
                if (stabBtn) {
                    stabBtn.innerText = `UPGRADE • ${nextCost} EP`;
                    stabBtn.disabled = gameState.ep < nextCost;
                    stabBtn.className = `px-4 py-2 text-xs rounded-xl font-medium w-full xs:w-auto ${gameState.ep >= nextCost ? 'bg-fuchsia-500 text-black hover:bg-fuchsia-400' : 'bg-fuchsia-500/10 text-fuchsia-400 opacity-60 cursor-not-allowed'}`;
                }
                if (stabSub) stabSub.innerText = `Next: +2% crit & rarity roll +1.5%`;
            }
            
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
            
            // 4. Boosters
            const b = gameState.boosters || { blazing: false, cryo: false, lightning: false };
            
            const blazingBtn = document.getElementById('booster-blazing-btn');
            if (blazingBtn) {
                if (b.blazing) {
                    blazingBtn.innerText = 'ACTIVE';
                    blazingBtn.disabled = true;
                    blazingBtn.className = 'text-xs px-3 py-2 bg-gray-850 text-gray-500 font-bold rounded-xl w-full text-center cursor-not-allowed';
                } else {
                    blazingBtn.innerText = 'BUY • 450 EP';
                    blazingBtn.disabled = gameState.ep < 450;
                    blazingBtn.className = `text-xs px-3 py-2 font-bold rounded-xl w-full text-center ${gameState.ep >= 450 ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-amber-400/20 text-amber-300 opacity-60 cursor-not-allowed'}`;
                }
            }
            
            const cryoBtn = document.getElementById('booster-cryo-btn');
            if (cryoBtn) {
                if (b.cryo) {
                    cryoBtn.innerText = 'ACTIVE';
                    cryoBtn.disabled = true;
                    cryoBtn.className = 'text-xs px-3 py-2 bg-gray-850 text-gray-500 font-bold rounded-xl w-full text-center cursor-not-allowed';
                } else {
                    cryoBtn.innerText = 'BUY • 320 EP';
                    cryoBtn.disabled = gameState.ep < 320;
                    cryoBtn.className = `text-xs px-3 py-2 font-bold rounded-xl w-full text-center ${gameState.ep >= 320 ? 'bg-cyan-400 text-black hover:bg-cyan-300' : 'bg-cyan-400/20 text-cyan-300 opacity-60 cursor-not-allowed'}`;
                }
            }
            
            const lightningBtn = document.getElementById('booster-lightning-btn');
            if (lightningBtn) {
                if (b.lightning) {
                    lightningBtn.innerText = 'ACTIVE';
                    lightningBtn.disabled = true;
                    lightningBtn.className = 'text-xs px-3 py-2 bg-gray-850 text-gray-500 font-bold rounded-xl w-full text-center cursor-not-allowed';
                } else {
                    lightningBtn.innerText = 'BUY • 890 EP';
                    lightningBtn.disabled = gameState.ep < 890;
                    lightningBtn.className = `text-xs px-3 py-2 font-bold rounded-xl w-full text-center ${gameState.ep >= 890 ? 'bg-purple-400 text-black hover:bg-purple-300' : 'bg-purple-400/20 text-purple-300 opacity-60 cursor-not-allowed'}`;
                }
            }
        }

        function buyUpgrade(type) {
            if (!gameState.upgrades) {
                gameState.upgrades = { efficiency: 0, stability: 0, training: 0 };
            }
            const currentLvl = gameState.upgrades[type] || 0;
            let cost = 0;
            let maxLvl = 0;
            
            if (type === 'efficiency') {
                cost = 250 + currentLvl * 150;
                maxLvl = 25;
            } else if (type === 'stability') {
                cost = 400 + currentLvl * 250;
                maxLvl = 15;
            } else if (type === 'training') {
                cost = 300 + currentLvl * 200;
                maxLvl = 15;
            }
            
            if (currentLvl >= maxLvl) {
                showToast("Upgrade already at max level!", "error");
                return;
            }
            
            if (gameState.ep < cost) {
                showToast("Insufficient Energy Points (EP)!", "error");
                return;
            }
            
            gameState.ep -= cost;
            gameState.upgrades[type]++;
            
            saveGameState();
            const upgradeNames = {
                efficiency: 'Fusion Efficiency',
                stability: 'Genetic Stability',
                training: 'Battle Training'
            };
            const upgradeName = upgradeNames[type] || type;
            showToast(`Upgrade purchased successfully! ${upgradeName} is now level ${gameState.upgrades[type]}.`, "success");
            updateDashboard();
            renderUpgrades();
        }

        function buyBooster(type) {
            if (!gameState.boosters) {
                gameState.boosters = { blazing: false, cryo: false, lightning: false };
            }
            
            if (gameState.boosters[type]) {
                showToast("Booster already purchased and active!", "error");
                return;
            }
            
            let cost = 0;
            if (type === 'blazing') cost = 450;
            else if (type === 'cryo') cost = 320;
            else if (type === 'lightning') cost = 890;
            
            if (gameState.ep < cost) {
                showToast("Insufficient Energy Points (EP)!", "error");
                return;
            }
            
            gameState.ep -= cost;
            gameState.boosters[type] = true;
            
            saveGameState();
            showToast(`Booster ${type === 'blazing' ? 'Blazing Catalyst' : type === 'cryo' ? 'Cryo Stabilizer' : 'Lightning Core'} is now active!`, "success");
            updateDashboard();
            renderUpgrades();
        }

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
            if (section === 'fusion-lab') {
                setTimeout(updateFusionFlowPaths, 50);
            }
            if (section === 'collection') {
                renderCollection();
            }
            if (section === 'upgrades') {
                renderUpgrades();
            }
            if (section === "codex") {
                switchCodexTab("bestiary");
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
                        level: 1,
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
            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                window.addEventListener('resize', updateFusionFlowPaths);
            }
            
            // Make sure fuse button starts disabled
            document.getElementById('fuse-btn').disabled = true;
            
            // Initialize advanced fusion mode
            setTimeout(() => {
                setFusionMode('basic');
            }, 300);
            
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
                const newP = {...basePandas[0], name: name || "Debug Panda", id: 'debug-' + Date.now(), rarity: 'legendary', power: 55, level: 1};
                userPandas.push(newP);
                renderCollection();
                console.log('%c[Panda added]', 'color:#00ff9d', newP);
            },
            levelUp: () => {
                gameState.level++;
                showLevelUp();
            }
        };

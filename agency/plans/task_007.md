# Implementation Plan: Procedural Card Art Generator for Fusions
- **Task ID**: task_007
- **Target Files**: `app.js`, `tests/mechanics.test.cjs`

## 1. System Design & State Changes
- **Procedural Canvas Generator**: A new function `generateProceduralPandaImage(emoji, type, color, rarity)` will be implemented. It renders high-quality procedural digital card art for fusions on a 256x256 canvas and returns a base64 Data URL.
- **Headless Node Support**: The generator contains robust checks for headless environment (`typeof document === 'undefined'`) and stub/JSDOM canvas limitations (returns `null` safely without throwing exceptions).
- **Fusion Card Art Flow**:
  - During fusion result creation (`createFusionResult`), the generator is invoked.
  - The generated Data URL is assigned directly to the fusion panda's `image` property.
  - In UI views (`renderCollection`, `showPandaDetail`, etc.), the image is loaded as the source of an `<img>` tag, providing visual consistency.
- **State Migration**:
  - In `loadGameState`, existing collection objects are traversed.
  - For base species pandas, static image paths (e.g. `assets/pandas/classic_panda.jpg`) are restored to ensure consistency.
  - For custom fusion species with missing or null images, procedural card art is generated and saved back.

## 2. Code Changes Spec

### `app.js`
- **Changes**: Add the `generateProceduralPandaImage` function. Update `createFusionResult` and `loadGameState`.
- **Target Functions**:
  - **New Function**: `generateProceduralPandaImage(emoji, type, color, rarity)`
    - *Placement*: Defined immediately before `createFusionResult` (approx. line 1205).
    - *Implementation details*:
      ```javascript
      function generateProceduralPandaImage(emoji, type, color, rarity) {
          if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
              return null;
          }
          try {
              const canvas = document.createElement('canvas');
              if (!canvas || typeof canvas.getContext !== 'function') {
                  return null;
              }
              canvas.width = 256;
              canvas.height = 256;
              const ctx = canvas.getContext('2d');
              if (!ctx) return null;
              
              // Draw background radial gradient
              const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 150);
              grad.addColorStop(0, '#1a1d24');
              grad.addColorStop(1, '#0b0c10');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, 256, 256);
              
              // Draw background grid lines (cyber style)
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
              ctx.lineWidth = 1;
              for (let i = 16; i < 256; i += 16) {
                  ctx.beginPath();
                  ctx.moveTo(i, 0);
                  ctx.lineTo(i, 256);
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.moveTo(0, i);
                  ctx.lineTo(256, i);
                  ctx.stroke();
              }

              // Glow border using rarity/type color
              const themeColor = color || '#64748b';
              ctx.strokeStyle = themeColor + '55';
              ctx.lineWidth = 8;
              ctx.strokeRect(10, 10, 236, 236);
              
              // Solid border
              ctx.strokeStyle = themeColor;
              ctx.lineWidth = 2;
              ctx.strokeRect(14, 14, 228, 228);

              // Cyber-decors (circles)
              ctx.strokeStyle = themeColor + '33';
              ctx.beginPath();
              ctx.arc(128, 128, 80, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.arc(128, 128, 90, 0, Math.PI * 2);
              ctx.stroke();

              // Draw Type text at the top
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(type ? type.toUpperCase() : 'HYBRID', 128, 32);

              // Draw Rarity text at the bottom
              ctx.fillStyle = themeColor;
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText(rarity ? rarity.toUpperCase() : 'UNKNOWN', 128, 230);

              // Draw Central Emoji
              ctx.font = '80px sans-serif';
              ctx.textBaseline = 'middle';
              ctx.textAlign = 'center';
              ctx.fillText(emoji || '🐼', 128, 128);

              return canvas.toDataURL('image/jpeg', 0.85);
          } catch (e) {
              return null;
          }
      }
      ```
  - **Modify Function**: `createFusionResult(pandaA, pandaB, mode = 'basic')`
    - *Change*: Replace `image: null` (approx. line 1331) with:
      ```javascript
      image: generateProceduralPandaImage(emoji, newType, getRarityColor(rarity), rarity),
      ```
  - **Modify Function**: `loadGameState()`
    - *Change*: Replace migration loops (approx. lines 125-127) with:
      ```javascript
      // Migrate collection, set level default, restore static paths, and generate fusion art
      userPandas.forEach(p => {
          if (p.level === undefined) p.level = 1;
          
          const baseMatch = basePandas.find(bp => bp.name === p.name);
          if (baseMatch) {
              p.image = baseMatch.image;
          } else {
              if (!p.image) {
                  p.image = generateProceduralPandaImage(p.emoji, p.type, p.color || getRarityColor(p.rarity), p.rarity);
              }
          }
      });
      ```

## 3. DOM & UI Spec
- No direct DOM or HTML element additions are required, as `source.html` and the dynamic modal render functions (e.g. `renderCollection`, `showPandaDetail`) already check for a truthy `.image` and load it inside an `<img>` tag.

## 4. Test Specifications
- **Test File**: `tests/mechanics.test.cjs`
- **New Test Suite (TEST 11)**:
  - *Location*: Appended after `TEST 10` and before `process.stdout.write("mechanics ok\n");`.
  - *Implementation details*:
    ```javascript
    // -------------------- TEST 11: Procedural Card Art Generator --------------------
    {
        const { read, sandbox, gameState } = runAppWithGameState();
        const generateProceduralPandaImage = read("generateProceduralPandaImage");
        const createFusionResult = read("createFusionResult");
        const loadGameState = read("loadGameState");

        // 1. Assert generateProceduralPandaImage returns null in headless Node without throwing exceptions
        let imgResult = null;
        assert.doesNotThrow(() => {
            imgResult = generateProceduralPandaImage("🌋", "Steam", "#22d3ee", "epic");
        }, "generateProceduralPandaImage threw an error in headless Node");
        assert.equal(imgResult, null, "generateProceduralPandaImage should return null in headless Node environment");

        // 2. Assert createFusionResult generates a fusion with the image property (which will be null in headless Node)
        const classicPanda = { name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common" };
        const infernoPanda = { name: "Inferno Panda", emoji: "🔥🐼", type: "Fire", power: 18, rarity: "rare" };
        const result = createFusionResult(classicPanda, infernoPanda, "basic");
        assert.ok(Object.prototype.hasOwnProperty.call(result, "image"), "Fusion result should have an 'image' property");
        
        // 3. Test migration: mock a fusion in local storage with missing/null image, and verify loadGameState attempts to generate image
        let mockCanvasCalled = false;
        const originalCreateElement = sandbox.document.createElement;
        sandbox.document.createElement = function(tag) {
            if (tag === 'canvas') {
                mockCanvasCalled = true;
                return {
                    getContext: () => ({
                        createRadialGradient: () => ({ addColorStop() {} }),
                        fillRect() {},
                        strokeRect() {},
                        beginPath() {},
                        moveTo() {},
                        lineTo() {},
                        stroke() {},
                        arc() {},
                        fillText() {}
                    }),
                    toDataURL: () => "data:image/jpeg;base64,mockdata"
                };
            }
            return originalCreateElement.call(sandbox.document, tag);
        };

        const oldState = {
            level: 3,
            fusions: 10,
            collection: [
                { id: 'f12345', name: "Steam Classic", emoji: "🌋", type: "Steam", power: 50, rarity: "epic", image: null },
                { id: 'u1', name: "Classic Panda", emoji: "🐼", type: "Balanced", power: 12, rarity: "common", image: null }
            ]
        };
        sandbox.localStorage.setItem("fusionPandaMaster", JSON.stringify(oldState));
        
        loadGameState();
        
        const userPandas = read("userPandas");
        const migratedFusion = userPandas.find(p => p.id === 'f12345');
        const restoredBase = userPandas.find(p => p.id === 'u1');

        assert.ok(mockCanvasCalled, "Should have called canvas generator to migrate missing fusion image");
        assert.equal(migratedFusion.image, "data:image/jpeg;base64,mockdata", "Missing fusion image should be migrated");
        assert.equal(restoredBase.image, "assets/pandas/classic_panda.jpg", "Base panda image should be restored to static path");

        // Clean up mock
        sandbox.document.createElement = originalCreateElement;
    }
    ```

# Implementation Plan: Static Image Assets for Fusions and Evolutions
- **Task ID**: task_009
- **Target Files**: `app.js`, `tests/mechanics.test.cjs`, project assets (`assets/pandas/`)

## 1. System Design & State Changes
- **24 Static Image Assets**:
  - Generate 12 premium 3D cyber-neon character images for the legendary hybrid fusions.
  - Generate 12 premium evolved character images for their evolved forms.
  - Store these images in `assets/pandas/` named `fusion_steam.jpg`, `fusion_steam_evolved.jpg`, etc.
- **Fusion Image Mapping**:
  - Add a helper function `getFusionStaticImage(name, type, rarity, isEvolved)` in `app.js` to determine the correct asset path for any fusion or evolution, handling generic/procedural fusions by mapping them to their closest elemental archetype.
  - Integrate this function into `createFusionResult`, `evolveFusionResult`, and the state migration loop in `loadGameState` to fully replace the canvas-based procedural generator.
- **Emoji Elimination**:
  - Update all UI render functions (`renderCollection`, `renderBasePandas`, `openPandaSelector`, `showPandaDetail`, `showCodexDetail`, `showFusionResult`, `renderCodex`, and the Battle Arena fighter cards) to render *only* the `<img>` tag, completely removing the fallback emoji blocks.

## 2. Image Assets Spec
We will generate 24 files in `assets/pandas/`:
- `fusion_steam.jpg` / `fusion_steam_evolved.jpg`
- `fusion_eclipse.jpg` / `fusion_eclipse_evolved.jpg`
- `fusion_solar.jpg` / `fusion_solar_evolved.jpg`
- `fusion_void.jpg` / `fusion_void_evolved.jpg`
- `fusion_quantum.jpg` / `fusion_quantum_evolved.jpg`
- `fusion_plasma.jpg` / `fusion_plasma_evolved.jpg`
- `fusion_inferno.jpg` / `fusion_inferno_evolved.jpg`
- `fusion_frost.jpg` / `fusion_frost_evolved.jpg`
- `fusion_chaos.jpg` / `fusion_chaos_evolved.jpg`
- `fusion_bamboo.jpg` / `fusion_bamboo_evolved.jpg`
- `fusion_nebula.jpg` / `fusion_nebula_evolved.jpg`
- `fusion_celestial.jpg` / `fusion_celestial_evolved.jpg`

## 3. Code Changes Spec

### `app.js`
- Define `getFusionStaticImage(name, type, rarity, isEvolved)`.
- Update `createFusionResult` to set `image: getFusionStaticImage(...)`.
- Update `evolveFusionResult` to set `current.image = getFusionStaticImage(current.name, current.type, current.rarity, true)`.
- Update `loadGameState` migration to map fusions to their new static image paths.
- Clean up all template literals in render functions to remove the emoji-fallback ternary operators.

### `tests/mechanics.test.cjs`
- Update tests (TEST 11 & TEST 12) to assert that fusions match the static `assets/pandas/fusion_*.jpg` paths rather than dynamic base64 URLs.

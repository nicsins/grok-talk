# Changelog

All notable changes to FusionPanda Master are documented here.

## [Unreleased] - Production Transformation

### Added
- **Production Infrastructure**
  - GitHub Actions CI pipeline (build + test on every push)
  - Full PWA with Service Worker for true offline support
  - Security headers (X-Frame-Options, Referrer-Policy, Permissions-Policy)
  - Modernized `package.json` with TypeScript support and integrated build

- **Typed Production Core** (`src/core/`)
  - `GameState.ts` — Core types and state manager
  - `FusionEngine.ts` — Full fusion modes, synergy, criticals, dynamic rarity
  - `CollectionManager.ts` — Advanced search, filters, power tracking
  - `DailyChallenge.ts` — Gated rewards and progress tracking
  - `BattleEngine.ts` — Arena combat with type advantages
  - `legacy-bridge.ts` — Integration layer for new content

- **New Content**
  - Expanded panda roster (15+ species)
  - 2 new Mythic pandas: Quantum Overlord Panda, Eternal Flame Sovereign
  - Integrated into Fusion Lab base grid
  - Improved Mythic drop rates on Ritual fusions
  - Daily Challenge reward now draws from expanded pool

- **Performance & Polish**
  - Fixed INP 200ms issue on Fusion mode buttons using `requestAnimationFrame`
  - Special visual treatment (glow + ring) for Mythic pandas
  - Content validation tests added

### Changed
- `basePandas` expanded from 8 → 15 species
- Ritual mode now has higher chance to produce Mythic results
- Daily Challenge reward pool expanded

### Migration Status
Full runtime replacement of `app.js` with the new TypeScript core is planned for v4.4+.

PR: #9 (feat/production-grade-rebuild)
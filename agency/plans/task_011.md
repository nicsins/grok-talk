# Implementation Plan - Task 011: Arena Fractal Moves Menu

- **Task ID**: task_011
- **Status**: Draft

## 1. System Design & State Changes
- **Dynamic Move Generator**:
  - Add a helper function `getChampionMoves(champion)` in `app.js`.
  - It will return custom attack and special moves mapped specifically to the champion's `type` (e.g. Fire, Ice, Dark, Steam, Eclipse) and styled with their name.
- **Fractal Dispersing Menu**:
  - In the combat controller UI, replace the static Attack and Special buttons with expandable trigger buttons.
  - When Attack or Special is clicked, it toggles a class (`.active` or `.expanded`) on the container.
  - Sub-move nodes disperse radially or branch out using CSS absolute positioning and transforms with neon lines/borders.
  - Clicking a sub-move node triggers `simulateBattleAttack` passing the exact custom move name.
- **Combat Simulation Integration**:
  - Modify `simulateBattleAttack` signature to accept a `customMoveName` parameter, utilizing it in the combat log lines instead of picking a generic move name.

## 2. Code Changes Spec
- **Target Files**:
  - `app.js`: Implement `getChampionMoves(champion)`, update `startDemoBattle()` to render the branching menus, and adjust `simulateBattleAttack(element, isSpecial, customMoveName)` to use the custom name.
  - `styles.css`: Append classes for the branching menu, including fractal dispersal transitions (`scale(0) -> scale(1)`, radial offsets, glows, and line connections).
- **Test files**:
  - `tests/mechanics.test.cjs`: Add `TEST 14` to assert that custom champion moves are correctly generated and that simulating a combat action with a specific move registers correctly in the log.

## 3. DOM & UI Spec
- Selectors: `#battle-attack-btn`, `#battle-special-btn`, `.fractal-menu-container`, `.fractal-branch-node` elements.
- Emojis must remain eliminated from all text nodes and visual assets.

## 4. Test Specifications
- **Tests**:
  - Verify that `getChampionMoves()` generates 3 unique attacks and specials for champions based on element types.
  - Verify that combat simulation utilizing a chosen custom move registers its exact name in log output.

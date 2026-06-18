# Implementation Plan: Special Move Action Popups
- **Task ID**: task_014
- **Status**: Drafted by Architect

## 1. System Design & State Changes
When a player clicks a special move option in the Battle Arena:
- Intercept the action inside `simulateBattleAttack(element, isSpecial, customMoveName)`.
- If it is a special move (`isSpecial === true` or `customMoveName` is provided and selected from the special nodes), trigger a sequence of multiple overlay popup windows.
- Construct 5 distinct overlay pop-up elements inside the `#battle-stage` container:
  - Each popup will have a distinct polygon `clip-path` (hexagon, triangle, octagon, trapezoid, circle).
  - Each popup will contain the selected champion's image, styled with stop-motion steps-based panning animations to simulate a rapid, multi-angle action sequence.
  - The popups will be styled with the champion's HSL/rarity color borders and glows, custom scanline overlays, and flashing indicators.
  - The popups will be staggered and automatically cleaned up after 1 second, maintaining zero permanent state changes and minimal latency.

## 2. Target Files
- `styles.css`
- `app.js`
- `tests/mechanics.test.cjs`

## 3. Files to edit
- `styles.css`
- `app.js`
- `tests/mechanics.test.cjs`

## 4. Test Specifications
- **TEST 17**: Assert that executing a special move battle attack triggers the creation of the 5 visual action pop-up windows inside the mock `#battle-stage` and that they possess correct styles/classes.

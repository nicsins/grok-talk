# Implementation Plan: UI Holographic Enhancements
- **Task ID**: task_012
- **Status**: Drafted by Architect

## 1. System Design & State Changes
We are upgrading the visual feedback across three key views:
- **Fusion Lab**: Add pulsing neon energy flows from selected slots to the central fusion core using SVG paths.
- **Panda Detail/Training**: Add pop-out floating numbers representing increased stats (+PWR, LVL UP!) when training a panda, accompanied by a premium holographic flash effect.
- **Codex & Collection**: Apply type-color accent glows on interactive cards dynamically via CSS variables, and apply matching colors to the Codex Detail modal border.

## 2. Target Files
- `styles.css`
- `app.js`
- `source.html`
- `tests/mechanics.test.cjs`

## 3. Files to edit
- `styles.css`
- `app.js`
- `source.html`
- `tests/mechanics.test.cjs`

## 4. Test Specifications
- **TEST 15**: Assert that performing training spawns the `.float-up-stat` animation node, that selecting fusions renders the SVG flow paths, and that cards/modals correctly receive color accent variables.

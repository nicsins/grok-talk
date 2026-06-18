# Implementation Plan: Comic Action Replay Popups
- **Task ID**: task_015
- **Status**: Drafted by Architect

## 1. System Design & State Changes
We are upgrading the special move action popups to a full step-by-step comic strip sequence representation:
- **Halftone Dot Pattern**: Add a CSS halftone background pattern to the popup cards.
- **Dynamic Element-Based Onomatopoeias**: Generate specialized action text ("FWOOSH!", "ZZZAP!", "SHATTER!") dependent on the champion's elemental type.
- **Starburst Clip-Path Overlays**: Inject retro spiked action splash backgrounds on keyframes.
- **Thick Outlines & Borders**: Apply solid black comic borders with dynamic inner glow highlights.
- **Staggered Comic Strip Narrative**: Popups will render in sequence representing:
  - Panel 1: Charge up state
  - Panel 2: Unleash energy
  - Panel 3: Spiked impact starburst (halftone)
  - Panel 4: Critical blast
  - Panel 5: Special move result card

## 2. Target Files
- `styles.css`
- `app.js`
- `tests/mechanics.test.cjs`

## 3. Files to edit
- `styles.css`
- `app.js`
- `tests/mechanics.test.cjs`

## 4. Test Specifications
- **TEST 18**: Assert that the popped comic strip panels render the element-specific action onomatopoeia strings and apply the correct spiked starburst overlay nodes.

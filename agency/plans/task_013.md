# Implementation Plan: Visual Emoji Elimination Catch-Up
- **Task ID**: task_013
- **Status**: Drafted by Architect

## 1. System Design & State Changes
We are auditing the visual interface to eliminate the last few remaining raw emojis from the HTML markup and template layouts:
- **Dashboard Challenge Card**: Replace `🌋` with `<i class="fas fa-fire-alt text-6xl text-orange-500 animate-pulse mb-3"></i>`.
- **Level Up Modal**: Replace `🏆` with `<i class="fas fa-trophy text-4xl text-black"></i>`.
- **Arena Landing Badge**: Replace `🐼` with `<i class="fas fa-paw text-xs text-black"></i>` and `🔥` with `<i class="fas fa-fire text-xs text-black"></i>`.

## 2. Target Files
- `source.html`
- `app.js`
- `tests/mechanics.test.cjs`

## 3. Files to edit
- `source.html`
- `app.js`
- `tests/mechanics.test.cjs`

## 4. Test Specifications
- **TEST 16**: Assert that raw emojis (`🌋`, `🏆`, `🐼`, `🔥`) are no longer found in the visual HTML templates of the dashboard, level up dialogs, or landing headers.

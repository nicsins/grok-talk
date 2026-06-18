# Implementation Plan: Fusion Lab & Codex Image Integration
- **Task ID**: task_008
- **Target Files**: `app.js`, `tests/mechanics.test.cjs`

## 1. System Design & State Changes
- **Codex Dynamic Images**:
  - In `renderCodex`, map over the entries array (the base species plus hybrid lore entries).
  - For any entry lacking an `.image` property (primarily the custom/legendary hybrid species in the list), call `generateProceduralPandaImage` to dynamically create their card art.
- **UI Integration**:
  - **Codex Grid**: Replace the static emoji block with a responsive `<img src="${entry.image}" ...>` component when `image` is present.
  - **Codex Detail Modal**: Replace the large emoji header with the high-resolution character image card when `image` is present.
  - **Fusion Selection Slots**: Replace the emoji placeholder in `slot-alpha` and `slot-beta` with a formatted card art image when a panda is slotted.
  - **Fusion Result Modal**: Load the generated image in place of the emoji when showing the new fusion.
  - **Evolve Result Mutation**: Regenerate the procedural card art during `evolveFusionResult` (incorporating the new rarity, new color, and `✨` evolved suffix emoji) and refresh the result modal image display.

## 2. Code Changes Spec

### `app.js`
- **Modify `renderCodex`**:
  - Map `filteredEntries || codexData` to dynamically invoke `generateProceduralPandaImage` on entries without images.
  - Update card HTML generation to render `<img ...>` if `entry.image` is truthy, falling back to emoji.
- **Modify `showCodexDetail`**:
  - Render the entry's image in the details modal header, with fallback to emoji.
- **Modify `selectPandaForSlot`**:
  - Render the selected panda's image inside the slots rather than just the emoji.
- **Modify `showFusionResult`**:
  - Replace the innerHTML of `fusion-result-emoji` with the generated image if present.
- **Modify `evolveFusionResult`**:
  - Regenerate `current.image` using `generateProceduralPandaImage` with the new stats.
  - Update `fusion-result-emoji`'s innerHTML with the new evolved image.

### `tests/mechanics.test.cjs`
- Append **TEST 12: Codex and Fusion Lab Visual Integrations** to verify:
  1. `renderCodex` generates images for custom entries that lacked them.
  2. Evolving a fusion correctly updates the `.image` property with regenerated card art.

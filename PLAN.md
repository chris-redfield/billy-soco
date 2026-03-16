# Billy Soco - Game Plan

Based on the engine from `game-learning/` (The Dark Garden of Z).

## Phase 1: Character Setup (Current)

### 1.1 Sprite Selection Tool
- HTML tool that loads `assets/billy-sprite-sheet.jpeg` (1600x366)
- Allows selecting rectangular regions for each frame
- Workflow: select idle frames (N/S/E/W), then walk frames (3 per direction)
- Exports frame coordinates as JSON for use in the game

### 1.2 Minimal Game with Billy Soco
- Single block map (no procedural generation yet)
- Load Billy Soco character using extracted sprite coordinates
- Basic movement (WASD) with idle/walk animations per direction
- Simple flat ground (solid color or basic tile)

## Phase 2: Core Gameplay (Future)
- TBD - features to be figured out as we go

## Architecture
- Same vanilla JS + Canvas approach as game-learning
- Reuse engine core (game loop, input handling, rendering)
- New spritesheet system adapted for Billy Soco's frame layout
- Simplified world (single block to start)

## Files Structure
```
billy-soco/
├── assets/
│   └── billy-sprite-sheet.jpeg
├── tools/
│   └── sprite-selector.html    <-- Sprite selection tool
├── src/
│   ├── engine/
│   │   ├── game.js
│   │   └── input.js
│   ├── entities/
│   │   ├── spritesheet.js      <-- Billy-specific sprite loading
│   │   └── player.js
│   ├── world/
│   │   └── world.js            <-- Simplified single-block world
│   └── main.js
├── css/
│   └── style.css
├── index.html
└── PLAN.md
```

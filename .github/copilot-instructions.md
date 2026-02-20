# Copilot Instructions

## Project summary
- Phaser 3.80.1 brick-breaker (Arkanoid-style) for the itch.io jam "Balls, Bricks and Phasers" (deadline Feb 22, 2026).
- Core gameplay: paddle (player-controlled), balls (physics), destructible bricks, score/lives tracking, win/lose loop.
- Runs as static HTML + CDN Phaser (no build step). Uses ES6 modules (`import`/`export`) loaded by `<script type="module">`.
- Optional features: powerups, physics tweaks, visual effects, level progression—but **must remain a brick-breaker** in Phaser.

## Architecture & patterns

**Game structure:**
- `index.html` — entry point; links Phaser 3.80.1 from CDN, loads `src/main.js`.
- `src/main.js` — Phaser config (800×600, arcade physics, zero gravity) and game init.
- `src/scenes/GameScene.js` — main game scene; manages paddle, ball, bricks, state (score, lives, win/lose).
- `src/objects/Paddle.js`, `Ball.js` — reusable sprite classes extending `Phaser.Physics.Arcade.Sprite`.

**Code patterns:**
- All physics objects extend Phaser sprite classes; constructors call `scene.add.existing()` and `scene.physics.add.existing()` then configure body.
- Game state flags: `isGameOver`, `isWin` prevent updates during end-game; click/SPACE restarts via `scene.restart()`.
- Ball uses internal `"stuck"` data flag (`getData`/`setData`) to track launcher attachment (sticky to paddle until launch).
- Textures created dynamically in `createTextures()` via graphics (no image assets); reused on scene restart if already in cache.
- Collision callbacks (e.g., `onBallHitBrick`) handle gameplay logic; brick disabling auto-removes from active group.
- Paddle movement clamped with `Phaser.Math.Clamp()` and `body.updateFromGameObject()` to sync physics bounds.
- Ball angle on paddle hit uses linear interpolation (`Phaser.Math.Linear`) to spread shot angle based on hit position.

**Styling:**
- `styles/main.css` exists; check before adding styles to avoid duplication.
- Game colors: dark background (`#0f1626`), palette is teal paddle (`#5de4c7`), cream ball (`#f4f1de`), red-gradient bricks.

## Development workflow
- No build step; serve `index.html` directly in browser (e.g., Python `http.server`, VS Code Live Server).
- Hot reload: reload page in browser after code edits; ES6 modules fetched fresh (no bundler caching).
- Phaser runs in `AUTO` mode (WebGL fallback to Canvas).

## Key files to reference
- `src/scenes/GameScene.js` — state machine, physics collisions, UI updates, game loop logic.
- `src/objects/{Paddle,Ball}.js` — physics sprite subclasses; copy pattern for new game objects.
- `index.html` — Phaser version pinned here; update CDN link if upgrading.

## When adding features
- Keep the brick-breaker core intact.
- New objects (e.g., powerups, enemies) should follow the `Paddle`/`Ball` pattern: extend Phaser sprite, init in GameScene, add collisions/updates.
- Textures generated at runtime; optionally add static image assets and load via `scene.load` in `preload()` method.
- State updates must toggle `isGameOver`/`isWin` to prevent double-triggering; restart resets all flags in `create()`.

## Known dependencies & credits
- **Phaser 3.80.1** (MIT) — https://phaser.io
- No third-party assets currently; all graphics procedurally generated.

## Submission checklist (itch.io jam)
- Game is Phaser-based ✓
- Uses brick-breaker mechanics ✓
- Playable in browser (no build required) ✓
- Include credits for any AI assistance or external tools in itch.io submission page.

# Clicklands architecture

Clicklands is intentionally browser-native. It uses HTML, CSS, JavaScript modules, and
static assets without a framework, package manager, compiler, or build output.

## Runtime flow

1. `index.html` loads `app.js` as an ES module.
2. `app.js` clones the default player state and creates ephemeral runtime state.
3. The UI template module mounts the application markup once.
4. The controller caches important DOM elements and binds delegated events.
5. Render functions project state into the mounted DOM.
6. Resource and enemy timers maintain the interactive world.

## Module responsibilities

### `app.js`

The composition root and current feature controller. It owns browser events, rendering
coordination, world timers, gathering behavior, shops, equipment, and combat. New code
should use the modules below instead of adding static data or general-purpose helpers
directly to this file.

### `src/data/game-data.js`

The single source of truth for balance and authored content: shops, prices, recipes,
gear, default inventory, progression constants, spawn positions, and resource tables.
Changing balance should generally require edits only here.

### `src/core/state.js`

Creates independent player and runtime state. Player state is serializable; runtime
state contains maps, sets, DOM references, gestures, and timers and must never be saved.

### `src/core/progression.js`

Pure XP calculations with no DOM or game-state ownership. Pure functions are easy to
test and can later be shared with a server if authoritative progression is introduced.

### `src/core/utils.js`

Small general-purpose functions that do not depend on the browser UI or game state.

`src/core/economy.js` and `src/core/geometry.js` similarly contain pure currency and
hit-testing calculations.

### `src/ui/templates.js`

Creates the stable application DOM. It should contain markup structure, not gameplay
rules or event handling.

### `src/ui/graphics.js`

Pure SVG string factories shared by templates and dynamic world entities.

### `src/ui/dom.js`

Owns the mapping between template selectors and cached DOM references. This keeps DOM
structure changes localized and prevents selector strings from spreading across systems.

### `src/systems/spell-recognition.js`

Pure pointer-path analysis for circular staff gestures. Visual spellcasting remains in
the controller, while recognition can be tuned and tested without a browser UI.

### `src/styles/`

Styles are separated by responsibility while retaining their original cascade order:
theme/shell, world scenes, inventory, village/economy, responsive refinements, and
combat/dev tools. Root `styles.css` remains the stable HTML entry point and imports
these files in order. New rules should go into the narrowest relevant style module.

## State rules

- `state` is player-facing and must remain JSON-serializable.
- `runtime` is session-only and may contain maps, sets, timers, gestures, and nodes.
- Authored content and balance live in `game-data.js`, not in either state object.
- Render functions read state and update the DOM; event handlers mutate state and then
  call the smallest relevant render function.
- Only the theme is currently persisted. Adding saves should serialize `state`, never
  `runtime`, and must include a schema version and migration path.

## Adding a feature

1. Put authored items and tuning values in `src/data/game-data.js`.
2. Add serializable player fields to `defaultState` when needed.
3. Add temporary timers or interaction objects in `createRuntime()`.
4. Add stable markup to `src/ui/templates.js` and visuals to `styles.css`.
5. Keep calculations pure in `src/core/` where practical.
6. Wire browser events and feature coordination in `app.js`.
7. Syntax-check every JavaScript module and test the complete player flow in a browser.

## Future module boundaries

As individual systems grow, extract controller factories under `src/systems/` for
combat, gathering, economy, and crafting. Each factory should receive explicit
dependencies—state, runtime, UI references, and narrow callbacks—rather than importing
the controller or relying on new global variables. This avoids circular imports while
allowing each system to be tested independently.

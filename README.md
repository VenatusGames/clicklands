# Clicklands Online

A dependency-free browser RPG prototype. Gather resources, trade in Lakeshore Village,
equip gear, and fight slimes through gesture-based combat.

## Run locally

Serve this directory with any static HTTP server and open `index.html` through that
server. ES modules do not run reliably by opening the file directly from disk.

For example:

```text
python -m http.server 8765
```

Then visit `http://127.0.0.1:8765/`.

There is no install or build step.

## Project structure

```text
index.html                  Browser entry document
app.js                     Game controller and feature orchestration
styles.css                 Ordered compatibility entry point for visual modules
src/core/                  State factories and reusable calculations
src/data/game-data.js      Balance values, content, inventory, and spawn data
src/systems/               Isolated gameplay algorithms
src/styles/                Theme, world, UI, responsive, and combat CSS
src/ui/templates.js        Static application markup
src/ui/graphics.js         Reusable SVG factories
assets/                    Images and audio
docs/architecture.md       Detailed architecture and extension guide
```

## Validation

The automated tests use Node's built-in test runner and require no installed packages:

```text
npm test
```

Functional changes should also be tested through a local static server in a browser.

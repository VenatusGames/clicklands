import { EQUIPMENT_SLOT_LABELS, LOGO } from '../data/game-data.js';
import { bagSvg, chevronSvg, mapSvg } from './graphics.js';

export function mountApp() {
  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="launch-splash" data-splash>
      <button class="splash-enter" type="button" data-enter aria-label="Enter Clicklands Online">
        <span class="splash-content">
          <span class="splash-impact" aria-hidden="true"></span>
          <span class="splash-title">Clicklands Online</span>
          <img class="splash-logo" src="${LOGO}" alt="">
          <span class="splash-enter-label">Click to enter</span>
        </span>
      </button>
    </div>

    <main class="app-shell">
      ${sidebarMarkup()}
      ${hudMarkup()}
      <section class="world-host">
        ${lakesideMarkup()}
        ${lakeMarkup()}
        ${forestMarkup()}
        ${combatMarkup()}
        ${minesMarkup()}
        ${townMarkup()}
        ${lumbermillMarkup()}
        ${villageInteriorsMarkup()}
        ${villageShopMarkup()}
      </section>
      ${inventoryMarkup()}
      ${chatMarkup()}
      ${resourceHoverBarMarkup()}
      <div class="toast-stack" data-toasts aria-live="polite"></div>
    </main>
  `;
}

function sidebarMarkup() {
  return `
    <aside class="sidebar" aria-label="World navigation">
      <div class="brand">
        <img class="brand-logo" src="${LOGO}" alt="">
        <div class="brand-copy">
          <strong>Clicklands Online</strong>
          <span>Gather · Explore · Grow</span>
        </div>
      </div>

      <div class="sidebar-title">World</div>
      <nav class="nav-stack">
        <div class="area-row">
          <button class="nav-button" type="button" data-location="lakeside">
            <span class="nav-icon" aria-hidden="true">⌁</span>
            <span class="nav-copy">
              <span class="nav-name">Lakeside</span>
              <span class="nav-meta">Area map</span>
            </span>
          </button>
          <button class="area-toggle" type="button" data-area-toggle aria-label="Toggle Lakeside locations" aria-expanded="true">
            ${chevronSvg()}
          </button>
        </div>

        <div class="area-children" data-area-children>
          <button class="nav-button child" type="button" data-location="town">
            <span class="nav-icon" aria-hidden="true">⌂</span>
            <span class="nav-copy">
              <span class="nav-name">Lakeshore Village</span>
              <span class="nav-meta">Shops & services</span>
            </span>
          </button>
          <button class="nav-button child" type="button" data-location="forest">
            <span class="nav-icon" aria-hidden="true">♣</span>
            <span class="nav-copy">
              <span class="nav-name">Forest</span>
              <span class="nav-meta">Woodcutting</span>
            </span>
          </button>
          <button class="nav-button child" type="button" data-location="mines">
            <span class="nav-icon" aria-hidden="true">◆</span>
            <span class="nav-copy">
              <span class="nav-name">Mines</span>
              <span class="nav-meta">Mining</span>
            </span>
          </button>
          <button class="nav-button child" type="button" data-location="lake">
            <span class="nav-icon" aria-hidden="true">≈</span>
            <span class="nav-copy">
              <span class="nav-name">Lakeside Lake</span>
              <span class="nav-meta">Waterfront & fishing</span>
            </span>
          </button>
        </div>
      </nav>

      <section class="dev-tools" data-dev-tools>
        <button class="dev-tools-toggle" type="button" data-dev-tools-toggle aria-expanded="false">
          <span class="dev-tools-toggle-copy"><span aria-hidden="true">⚙</span><span>Dev Tools</span></span>
          <span class="dev-tools-chevron" aria-hidden="true">${chevronSvg()}</span>
        </button>
        <div class="dev-tools-panel" data-dev-tools-panel>
          <button class="dev-setting" type="button" data-free-shops-toggle aria-pressed="false">
            <span class="dev-setting-copy">
              <strong>Free Shops</strong>
              <small>All purchases cost 0 for testing</small>
            </span>
            <span class="dev-switch" aria-hidden="true"><span class="dev-switch-dot"></span></span>
          </button>
        </div>
      </section>

      <div class="sidebar-footer">
        <button class="theme-button" type="button" data-theme-toggle>
          <span class="theme-label"><span data-theme-icon>☀</span><span data-theme-label>Light mode</span></span>
          <span class="theme-switch" aria-hidden="true"><span class="theme-switch-dot"></span></span>
        </button>
      </div>
    </aside>
  `;
}

function hudMarkup() {
  return `
    <header class="top-hud">
      <div class="character-stack">
        <button class="character-bar" type="button" data-character-bar aria-expanded="false">
          <span class="character-avatar"><img src="${LOGO}" alt=""></span>
          <span class="character-main">
            <span class="character-row">
              <span class="username" data-username>Username</span>
              <span class="overall-level">Overall Level <strong data-overall-level>1</strong></span>
            </span>
            <span class="hud-health-block">
              <span class="xp-label-row health-label-row">
                <span class="xp-label">Health</span>
                <span class="xp-value health-value" data-player-health>100 / 100</span>
              </span>
              <span class="progress-track player-health-track">
                <span class="progress-fill player-health-fill" data-player-health-fill></span>
              </span>
            </span>

            <span class="xp-label-row">
              <span class="xp-label">Overall XP</span>
              <span class="xp-value" data-overall-xp>0 / 100 XP</span>
            </span>
            <span class="progress-track overall-progress-track"><span class="progress-fill overall-progress-fill" data-overall-fill></span></span>
          </span>
          <span class="character-chevron">${chevronSvg()}</span>
        </button>

        <div class="skills-drawer" data-skills-drawer>
          <div class="xp-menu-tabs" role="tablist" aria-label="XP categories">
            <button class="xp-menu-tab is-active" type="button" role="tab" aria-selected="true" data-xp-menu="skills">
              <span class="xp-menu-tab-icon" aria-hidden="true">✦</span>
              <span>Skill XP</span>
            </button>
            <button class="xp-menu-tab" type="button" role="tab" aria-selected="false" data-xp-menu="classes">
              <span class="xp-menu-tab-icon" aria-hidden="true">⚔</span>
              <span>Class XP</span>
            </button>
          </div>

          <section class="progression-section xp-menu-pane" data-xp-pane="skills" role="tabpanel">
            <div class="progression-section-head">
              <span>Skills</span>
              <small>Professions</small>
            </div>
            <div class="progression-grid">
              ${skillMarkup('woodcutting', '🪓', 'Woodcutting')}
              ${skillMarkup('mining', '⛏', 'Mining')}
              ${skillMarkup('foraging', '🍄', 'Foraging')}
              ${skillMarkup('fishing', '🎣', 'Fishing')}
              ${skillMarkup('alchemy', '⚗', 'Alchemy')}
              ${skillMarkup('enchanting', '✦', 'Enchanting')}
              ${skillMarkup('archeology', '🏺', 'Archeology')}
            </div>
          </section>

          <section class="progression-section xp-menu-pane class-levels-section" data-xp-pane="classes" role="tabpanel" hidden>
            <div class="progression-section-head">
              <span>Classes</span>
              <small>Combat progression</small>
            </div>
            <div class="progression-grid class-grid">
              ${classMarkup('swordsman', '⚔', 'Swordsman')}
              ${classMarkup('ranger', '🏹', 'Ranger')}
              ${classMarkup('wizard', '✧', 'Wizard')}
              ${classMarkup('priest', '✚', 'Priest')}
              ${classMarkup('bard', '♪', 'Bard')}
            </div>
          </section>
        </div>
      </div>

      <div class="wallet-hud" aria-label="Currency">
        <div class="currency-chip copper" title="Copper">
          <span class="coin-icon" aria-hidden="true"><span>C</span></span>
          <span class="currency-copy"><strong data-wallet-copper>0</strong><small>Copper</small></span>
        </div>
        <div class="currency-chip silver" title="Silver">
          <span class="coin-icon" aria-hidden="true"><span>S</span></span>
          <span class="currency-copy"><strong data-wallet-silver>0</strong><small>Silver</small></span>
        </div>
        <div class="currency-chip gold" title="Gold">
          <span class="coin-icon" aria-hidden="true"><span>G</span></span>
          <span class="currency-copy"><strong data-wallet-gold>0</strong><small>Gold</small></span>
        </div>
        <div class="currency-chip platinum" title="Platinum">
          <span class="coin-icon" aria-hidden="true"><span>P</span></span>
          <span class="currency-copy"><strong data-wallet-platinum>0</strong><small>Platinum</small></span>
        </div>
        <div class="currency-chip xelium" title="Xelium">
          <span class="xelium-stone" aria-hidden="true"></span>
          <span class="currency-copy"><strong data-wallet-xelium>0</strong><small>Xelium</small></span>
        </div>
      </div>

      <button class="inventory-button" type="button" data-inventory-toggle>
        ${bagSvg()}
        <span>Inventory</span>
      </button>
    </header>
  `;
}

function skillMarkup(key, icon, name) {
  return `
    <div class="skill-row" data-skill="${key}">
      <span class="skill-icon" aria-hidden="true">${icon}</span>
      <span class="skill-copy">
        <span class="skill-line">
          <span class="skill-name">${name}</span>
          <span class="skill-xp" data-skill-xp="${key}">0 / 100 XP</span>
        </span>
        <span class="progress-track"><span class="progress-fill" data-skill-fill="${key}"></span></span>
      </span>
      <span class="skill-level" data-skill-level="${key}">Level 1</span>
    </div>
  `;
}

function classMarkup(key, icon, name) {
  return `
    <div class="skill-row class-row" data-class="${key}">
      <span class="skill-icon class-icon" aria-hidden="true">${icon}</span>
      <span class="skill-copy">
        <span class="skill-line">
          <span class="skill-name">${name}</span>
          <span class="skill-xp" data-class-xp="${key}">0 / 100 XP</span>
        </span>
        <span class="progress-track"><span class="progress-fill class-progress-fill" data-class-fill="${key}"></span></span>
      </span>
      <span class="skill-level" data-class-level="${key}">Level 1</span>
    </div>
  `;
}

function lakesideMarkup() {
  return `
    <div class="world-view map-view" data-view="lakeside">
      <div class="map-card" data-map-card>
        <div class="map-head">
          <strong>Lakeside</strong>
          <span>Select a location to travel.</span>
        </div>
        <div class="map-art">
          ${mapSvg()}
        </div>
        <button class="map-node forest" type="button" data-location="forest">
          <span class="map-node-icon" aria-hidden="true">♣</span>
          <span><strong>Forest</strong><small>Oak, birch & apple trees</small></span>
        </button>
        <button class="map-node mines" type="button" data-location="mines">
          <span class="map-node-icon" aria-hidden="true">◆</span>
          <span><strong>Mines</strong><small>Ore veins & geodes</small></span>
        </button>
        <button class="map-node town" type="button" data-location="town">
          <span class="map-node-icon" aria-hidden="true">⌂</span>
          <span><strong>Lakeshore Village</strong><small>Trade, craft & explore</small></span>
        </button>
        <button class="map-node lake" type="button" data-location="lake">
          <span class="map-node-icon" aria-hidden="true">≈</span>
          <span><strong>Lakeside Lake</strong><small>Quiet water & fishing</small></span>
        </button>
      </div>
    </div>
  `;
}

function lakeMarkup() {
  return `
    <div class="world-view lake-view" data-view="lake">
      <div class="lake-sky" aria-hidden="true"></div>
      <div class="lake-distant-shore" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="lake-water" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="lake-shore" aria-hidden="true"></div>
      <div class="lake-reeds reeds-a" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="lake-reeds reeds-b" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="lake-dock" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="lake-location-card">
        <small>Lakeside</small>
        <strong>The Lake</strong>
        <span>Fishing and waterfront activities are coming soon.</span>
      </div>
    </div>
  `;
}

function forestMarkup() {
  return `
    <div class="world-view forest-view" data-view="forest">
      <div class="forest-horizon" aria-hidden="true"></div>
      <div class="forest-ground" aria-hidden="true"></div>
      <div class="forest-ground-detail" aria-hidden="true"></div>
      <div class="forest-enemy-stage" data-enemy-stage="forest"></div>
      <div class="forest-node-stage" data-forest-stage></div>
      <div class="forest-forage-stage" data-forage-stage="forest"></div>
    </div>
  `;
}


function combatMarkup() {
  return `
    <div class="world-view combat-view" data-view="combat">
      <button class="combat-exit" type="button" data-exit-combat>‹ Return</button>

      <div class="combat-no-weapon" data-combat-no-weapon hidden role="alert">
        <span aria-hidden="true">!</span>
        <strong>No weapon equipped!</strong>
      </div>

      <div class="combat-enemy-stage" data-combat-stage>
        <div class="combat-enemy-card" aria-live="polite">
          <div class="combat-slime combat-enemy-art green-slime" data-combat-enemy-target aria-label="Enemy combat target">
            <span class="combat-hammer-rings" data-combat-hammer-rings hidden aria-hidden="true">
              <span class="combat-hammer-target-ring">
                <span class="combat-hammer-release-label">RELEASE</span>
              </span>
              <span class="combat-hammer-moving-ring" data-combat-hammer-ring></span>
            </span>
            <span class="combat-slime-shadow" aria-hidden="true"></span>
            <span class="combat-slime-body" aria-hidden="true">
              <span class="combat-slime-shine"></span>
              <span class="combat-slime-eye eye-a"></span>
              <span class="combat-slime-eye eye-b"></span>
              <span class="combat-slime-mouth"></span>
            </span>
            <span class="combat-rat-body" aria-hidden="true">
              <i class="rat-ear ear-a"></i><i class="rat-ear ear-b"></i>
              <i class="rat-eye eye-a"></i><i class="rat-eye eye-b"></i><i class="rat-tail"></i>
            </span>
            <span class="combat-skeleton-body" aria-hidden="true">
              <i class="skeleton-skull"><b></b><b></b></i>
              <i class="skeleton-ribs"></i><i class="skeleton-arm arm-a"></i><i class="skeleton-arm arm-b"></i>
            </span>
          </div>
          <strong class="combat-enemy-title" data-combat-enemy-title>Slime</strong>
          <span class="combat-weapon-hint" data-combat-hint>Equip a weapon in Main Hand to attack.</span>
          <div class="combat-bow-charge" data-combat-bow-charge hidden>
            <div class="combat-bow-charge-line">
              <span>Draw</span>
              <strong data-combat-bow-charge-label>0%</strong>
            </div>
            <div class="combat-bow-charge-track">
              <span class="combat-bow-charge-fill" data-combat-bow-charge-fill></span>
            </div>
            <div class="combat-ammo-status">
              <span>Ammo</span>
              <strong><span aria-hidden="true">➶</span> <span data-combat-ammo-count>0</span></strong>
            </div>
          </div>
          <div class="combat-staff-guide" data-combat-staff-guide hidden>
            <span class="combat-spell-rune" data-combat-spell-rune aria-hidden="true">○</span>
            <span class="combat-spell-copy">
              <small>Spell gesture</small>
              <strong data-combat-spell-status>Draw a circle</strong>
            </span>
          </div>
          <div class="combat-hammer-guide" data-combat-hammer-guide hidden>
            <span class="combat-hammer-guide-icon" aria-hidden="true">🔨</span>
            <span class="combat-hammer-guide-copy">
              <small>Hammer timing</small>
              <strong data-combat-hammer-status>Hold to wind up</strong>
            </span>
          </div>
        </div>
      </div>

      <div class="combat-defeat-overlay" data-combat-defeat hidden>
        <div class="combat-defeat-card" role="dialog" aria-modal="true" aria-labelledby="combat-defeat-title">
          <span class="combat-defeat-kicker">Defeat</span>
          <strong id="combat-defeat-title" data-combat-defeat-title>Slime Defeated</strong>
          <span class="combat-defeat-subtitle">Loot collected</span>
          <div class="combat-defeat-loot" data-combat-defeat-loot></div>
          <button type="button" data-combat-defeat-return>Return to Forest</button>
        </div>
      </div>

      <div class="combat-health-dock">
        <section class="combat-health-panel player">
          <div class="combat-health-head">
            <span>You</span>
            <strong data-combat-player-health>100 / 100</strong>
          </div>
          <div class="combat-loadout" aria-label="Equipped combat gear">
            <div class="combat-loadout-slot">
              <small>Main Hand</small>
              <span><b data-combat-main-icon>◇</b><strong data-combat-main-hand>Empty</strong></span>
            </div>
            <div class="combat-loadout-slot">
              <small>Off Hand</small>
              <span><b data-combat-off-icon>◇</b><strong data-combat-off-hand>Empty</strong></span>
            </div>
          </div>
          <div class="combat-health-track">
            <span class="combat-health-fill player" data-combat-player-fill></span>
          </div>
        </section>

        <section class="combat-health-panel enemy">
          <div class="combat-health-head">
            <span data-combat-enemy-name>Slime</span>
            <strong data-combat-enemy-health>30 / 30</strong>
          </div>
          <div class="combat-health-track">
            <span class="combat-health-fill enemy" data-combat-enemy-fill></span>
          </div>
        </section>
      </div>
    </div>
  `;
}

function minesMarkup() {
  return `
    <div class="world-view mines-view" data-view="mines">
      <div class="cave-depth" aria-hidden="true"></div>
      <div class="cave-ceiling" aria-hidden="true"></div>
      <div class="cave-wall-layer cave-wall-left" aria-hidden="true"></div>
      <div class="cave-wall-layer cave-wall-right" aria-hidden="true"></div>
      <div class="cave-floor" aria-hidden="true"></div>
      <div class="cave-tunnel" aria-hidden="true"></div>
      <div class="cave-support support-a" aria-hidden="true"></div>
      <div class="cave-support support-b" aria-hidden="true"></div>
      <div class="cave-lantern lantern-a" aria-hidden="true"><span></span></div>
      <div class="cave-lantern lantern-b" aria-hidden="true"><span></span></div>
      <div class="cave-crystal crystal-a" aria-hidden="true"></div>
      <div class="cave-crystal crystal-b" aria-hidden="true"></div>
      <div class="cave-mist" aria-hidden="true"></div>
      <div class="mine-enemy-stage" data-enemy-stage="mines"></div>
      <div class="mine-node-stage" data-mine-stage></div>
      <div class="mine-forage-stage" data-forage-stage="mines"></div>
    </div>
  `;
}


function townMarkup() {
  const building = (key, icon, name, subtitle) => `
    <button class="town-building ${key}" type="button"
      data-town-building="${key}"
      data-building-name="${name}"
      data-building-note="${subtitle}">
      <span class="building-visual" aria-hidden="true">
        <span class="building-shadow"></span>
        <span class="building-body"></span>
        <span class="building-roof"></span>
        <span class="building-door"></span>
        <span class="building-window window-a"></span>
        <span class="building-window window-b"></span>
        <span class="building-detail">${icon}</span>
      </span>
      <span class="building-label">
        <strong>${name}</strong>
        <small>${subtitle}</small>
      </span>
    </button>`;

  return `
    <div class="world-view town-view" data-view="town">
      <div class="town-skyline" aria-hidden="true"></div>
      <div class="town-ground" aria-hidden="true"></div>
      <div class="town-road road-main" aria-hidden="true"></div>
      <div class="town-road road-cross" aria-hidden="true"></div>

      <div class="town-heading">
        <span class="town-kicker">Lakeside</span>
        <strong>Lakeshore Village</strong>
        <span>Local tradesfolk and a few questionable neighbors.</span>
      </div>

      <div class="town-square">
        ${building('lumbermill', '▤', 'Lumbermill', 'Woodworking & timber')}
        ${building('blacksmith', '⚒', 'Blacksmith', 'Tools, metal & repairs')}
        ${building('strange-shack', '✧', 'Strange Shack', 'Something feels off')}
        ${building('farmer', '♜', 'Farmer', 'Crops, food & produce')}
        ${building('craftsman', '⚒', 'Craftsman', 'Crafting & ranged gear')}
        ${building('foragers-hut', '❧', "Forager's Hut", 'Wild goods & supplies')}
      </div>

      <div class="town-lake-edge" aria-hidden="true"></div>
      <div class="town-foliage foliage-a" aria-hidden="true">♣ ♣ ♣</div>
      <div class="town-foliage foliage-b" aria-hidden="true">♣ ♣</div>
    </div>
  `;
}


function lumbermillMarkup() {
  return `
    <div class="world-view lumbermill-view" data-view="lumbermill">
      <div class="mill-wall" aria-hidden="true"></div>
      <div class="mill-beam beam-a" aria-hidden="true"></div>
      <div class="mill-beam beam-b" aria-hidden="true"></div>
      <div class="mill-window" aria-hidden="true"><span></span></div>
      <div class="mill-log-stack" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

      <button class="mill-back" type="button" data-location="town">‹ Lakeshore Village</button>
      <div class="mill-title"><span>Lumbermill</span><strong>Timber & Sawworks</strong></div>

      <div class="sawmill-station" data-sawmill-drop>
        <div class="sawmill-head">
          <span><small>Sawmill Table</small><strong data-sawmill-status>Drag a log stack here</strong></span>
          <span class="sawmill-busy-dot" aria-hidden="true"></span>
        </div>
        <div class="sawmill-machine" data-sawmill-machine>
          <div class="sawmill-bed"><span class="sawmill-belt"></span></div>
          <div class="saw-housing"><span class="saw-blade"></span></div>
          <div class="sawmill-input">DROP LOG STACK</div>
          <div class="sawmill-output" data-sawmill-output><span></span><span></span><span></span></div>
        </div>
        <div class="sawmill-progress"><span data-sawmill-fill></span></div>
        <div class="sawmill-hint">Choose a batch amount in Inventory, then drag Oak or Birch Wood here. Larger batches process sequentially.</div>
      </div>

      <button class="lumberjack-npc" type="button" data-lumberjack aria-label="Talk to Garrick the lumberjack">
        <span class="npc-shadow" aria-hidden="true"></span>
        <img class="npc-character-image lumberjack-character-image" src="assets/images/npcs/lumberjack.png" alt="" aria-hidden="true">
        <span class="npc-label"><strong>Garrick</strong><small>Lumberjack · Click to trade</small></span>
      </button>
      <div class="mill-counter" aria-hidden="true">
        <span class="counter-top"></span>
        <span class="counter-panel panel-a"></span><span class="counter-panel panel-b"></span><span class="counter-panel panel-c"></span>
        <span class="counter-sign">GARRICK'S TIMBER</span>
      </div>

      <aside class="lumber-shop" data-lumber-shop aria-label="Lumberjack shop">
        <div class="lumber-shop-head">
          <div><small>Garrick's Counter</small><strong>Lumberjack Shop</strong></div>
          <button type="button" data-lumber-shop-close aria-label="Close shop">×</button>
        </div>
        <div class="lumber-shop-body" data-lumber-shop-body></div>
      </aside>
    </div>
  `;
}

function villageInteriorsMarkup() {
  const npcArtwork = {
    blacksmith: { file: 'blacksmith.png', className: 'blacksmith-character-image' },
    'strange-shack': { file: 'wizard.png', className: 'wizard-character-image' },
    farmer: { file: 'farmer.png', className: 'farmer-character-image' },
    craftsman: { file: 'craftsman.png', className: 'craftsman-character-image' },
    'foragers-hut': { file: 'herbalist.png', className: 'herbalist-character-image' },
  };

  const interior = ({ key, title, subtitle, role, note, decor, shopKey = '' }) => {
    const artwork = npcArtwork[key];

    return `
      <div class="world-view village-interior ${key}-interior" data-view="${key}">
        <div class="interior-backdrop" aria-hidden="true"></div>
        <div class="interior-floor" aria-hidden="true"></div>
        <div class="interior-beams" aria-hidden="true"></div>
        ${key === 'blacksmith'
          ? `<div class="interior-decor forge-decor" aria-hidden="true">
              <img class="blacksmith-forge-art" src="assets/images/interiors/blacksmith-forge.png" alt="">
            </div>`
          : key === 'craftsman'
            ? `<div class="interior-decor craftsman-decor" aria-hidden="true">
                <div class="crafting-bench-station">
                  <span class="crafting-bench-top"></span>
                  <span class="crafting-bench-leg leg-a"></span>
                  <span class="crafting-bench-leg leg-b"></span>
                  <span class="crafting-bench-tools">⚒</span>
                  <span class="crafting-bench-label"><strong>Crafting Bench</strong><small>Coming later</small></span>
                </div>
              </div>`
            : `<div class="interior-decor ${decor}" aria-hidden="true">
                <span class="decor-main"></span><span class="decor-side"></span><span class="decor-small"></span>
              </div>`}
        <button class="mill-back interior-back" type="button" data-location="town">‹ Lakeshore Village</button>
        <div class="interior-title"><span>Lakeshore Village</span><strong>${title}</strong><small>${subtitle}</small></div>
        <button class="village-npc npc-${key}" type="button" data-building-npc data-npc-shop="${shopKey}" data-npc-title="${role}" data-npc-note="${note}">
          <span class="village-npc-shadow" aria-hidden="true"></span>
          <img class="village-npc-character-image ${artwork.className}" src="assets/images/npcs/${artwork.file}" alt="" aria-hidden="true">
          <span class="village-npc-label"><strong>${role}</strong><small>${shopKey ? 'Click to trade' : 'Click to talk'}</small></span>
        </button>
      </div>
    `;
  };

  return [
    interior({ key:'blacksmith', title:'Blacksmith', subtitle:'Forge, metalwork & repairs', role:'Blacksmith', note:'Weapons, armor, ore and mineral trading.', decor:'forge-decor', shopKey:'blacksmith' }),
    interior({ key:'strange-shack', title:'Strange Shack', subtitle:'Arcane clutter & stranger business', role:'Wizard', note:'Simple arcane implements and stranger business.', decor:'wizard-decor', shopKey:'strange-shack' }),
    interior({ key:'farmer', title:'Farmer', subtitle:'Crops, produce & farm goods', role:'Farmer', note:'Fresh food, wheat and simple farm clothing.', decor:'farm-decor', shopKey:'farmer' }),
    interior({ key:'craftsman', title:'Craftsman', subtitle:'Crafting, ranged gear & workshop goods', role:'Craftsman', note:'Starter ranged equipment and a crafting bench.', decor:'craftsman-decor', shopKey:'craftsman' }),
    interior({ key:'foragers-hut', title:"Forager's Hut", subtitle:'Wild herbs, fungi & gathered goods', role:'Herbalist', note:'Foraged goods, potions and trail snacks.', decor:'forager-decor', shopKey:'foragers-hut' }),
  ].join('');
}

function villageShopMarkup() {
  return `
    <aside class="village-shop" data-village-shop aria-label="Village shop">
      <div class="village-shop-head">
        <div><small data-village-shop-kicker>Shop</small><strong data-village-shop-title>Village Shop</strong></div>
        <button type="button" data-village-shop-close aria-label="Close shop">×</button>
      </div>
      <div class="village-shop-body" data-village-shop-body></div>
    </aside>
  `;
}

function resourceHoverBarMarkup() {
  return `
    <div class="resource-hover-bar" data-resource-hover-bar aria-hidden="true">
      <span class="resource-hover-line">
        <span class="resource-hover-name" data-resource-hover-name></span>
        <span class="resource-hover-meta" data-resource-hover-meta></span>
      </span>
      <span class="progress-track resource-hover-track">
        <span class="progress-fill resource-hover-fill" data-resource-hover-fill></span>
      </span>
    </div>
  `;
}

function inventoryMarkup() {
  return `
    <aside class="inventory-drawer" data-inventory-drawer aria-label="Inventory and equipment">
      <div class="drawer-head">
        <div><strong>Inventory</strong><span>Items · gear · equipment</span></div>
        <button class="icon-button" type="button" data-inventory-close aria-label="Close inventory">×</button>
      </div>
      <div class="drawer-tabs" role="tablist">
        <button class="drawer-tab" type="button" data-inventory-tab="items">Items</button>
        <button class="drawer-tab" type="button" data-inventory-tab="gear">Gear</button>
        <button class="drawer-tab" type="button" data-inventory-tab="equipment">Equipment</button>
      </div>
      <div class="drawer-body">
        <section class="drawer-pane" data-inventory-pane="items"></section>
        <section class="drawer-pane" data-inventory-pane="gear" hidden></section>
        <section class="drawer-pane" data-inventory-pane="equipment" hidden>${equipmentMarkup()}</section>
      </div>
    </aside>
  `;
}

function chatMarkup() {
  return `
    <section class="chat-panel" data-chat-panel aria-label="Player chat preview">
      <header class="chat-head">
        <span class="chat-status-dot" aria-hidden="true"></span>
        <div><strong>Player Chat</strong><small>Preview · messaging coming later</small></div>
        <button class="chat-close" type="button" data-chat-close aria-label="Close chat drawer">⌄</button>
      </header>
      <div class="chat-channels" role="tablist" aria-label="Chat channels">
        <button type="button" role="tab" aria-selected="true" class="is-active" data-chat-channel="global">Global</button>
        <button type="button" role="tab" aria-selected="false" data-chat-channel="local">Local</button>
        <button type="button" role="tab" aria-selected="false" data-chat-channel="trade">Trade</button>
        <button type="button" role="tab" aria-selected="false" data-chat-channel="party">Party</button>
      </div>
      <div class="chat-log" data-chat-log aria-live="polite">
        <div class="chat-system-message"><span>●</span><p><strong>Global Channel</strong><small>Messages from all players will appear here.</small></p></div>
      </div>
      <div class="chat-compose">
        <input type="text" placeholder="Chat is coming soon…" aria-label="Chat message" disabled>
        <button type="button" disabled aria-label="Send chat message">Send</button>
      </div>
    </section>
    <button class="chat-launcher" type="button" data-chat-open aria-label="Open player chat">
      <span class="chat-status-dot" aria-hidden="true"></span>
      <strong>Player Chat</strong>
      <small>Global</small>
    </button>
  `;
}

function equipmentMarkup() {
  const slot = (slotName, icon, name, compact = false) => `
    <button class="equipment-slot${compact ? ' is-compact' : ''}" type="button" data-equipment-slot="${slotName}" aria-label="${name}, empty">
      <span class="equipment-slot-icon" aria-hidden="true">${icon}</span>
      <span class="equipment-slot-copy">
        <span class="equipment-slot-name">${name}</span>
        <span class="equipment-slot-state">Empty</span>
      </span>
    </button>`;

  return `
    <div class="equipment-screen">
      <div class="equipment-header">
        <div>
          <span class="equipment-kicker">Loadout</span>
          <strong>Equipment</strong>
        </div>
        <span class="equipment-summary">18 slots</span>
      </div>

      <div class="equipment-groups">
        <section class="equipment-group">
          <div class="equipment-group-head"><span>Tools</span><span class="equipment-group-count">2</span></div>
          <div class="equipment-grid two-col">
            ${slot('axe', '<span class="gear-art gear-art-axe"></span>', 'Axe')}
            ${slot('pickaxe', '⛏', 'Pickaxe')}
          </div>
        </section>

        <section class="equipment-group">
          <div class="equipment-group-head"><span>Weapons</span><span class="equipment-group-count">3</span></div>
          <div class="equipment-grid three-col weapon-equipment-grid">
            ${slot('main-hand', '<span class="gear-art gear-art-sword"></span>', 'Main Hand')}
            ${slot('off-hand', '<span class="gear-art gear-art-shield"></span>', 'Off Hand')}
            ${slot('ammo', '➶', 'Ammo')}
          </div>
        </section>

        <section class="equipment-group equipment-group-wide">
          <div class="equipment-group-head"><span>Armor</span><span class="equipment-group-count">5</span></div>
          <div class="equipment-grid armor-grid">
            ${slot('helmet', '<span class="gear-art gear-art-chain-helmet"></span>', 'Helmet')}
            ${slot('chestplate', '<span class="gear-art gear-art-chain-chest"></span>', 'Chestplate')}
            ${slot('leggings', '<span class="gear-art gear-art-chain-legs"></span>', 'Leggings')}
            ${slot('boots', '<span class="gear-art gear-art-chain-boots"></span>', 'Boots')}
            ${slot('back', '◇', 'Back')}
          </div>
        </section>

        <section class="equipment-group">
          <div class="equipment-group-head"><span>Jewelry</span><span class="equipment-group-count">3</span></div>
          <div class="equipment-grid three-col">
            ${slot('necklace', '⌁', 'Necklace', true)}
            ${slot('ring-1', '○', 'Ring I', true)}
            ${slot('ring-2', '○', 'Ring II', true)}
          </div>
        </section>

        <section class="equipment-group equipment-group-wide">
          <div class="equipment-group-head"><span>Trinkets</span><span class="equipment-group-count">5</span></div>
          <div class="trinket-grid">
            ${slot('trinket-1', '✦', 'Trinket I', true)}
            ${slot('trinket-2', '✦', 'Trinket II', true)}
            ${slot('trinket-3', '✦', 'Trinket III', true)}
            ${slot('trinket-4', '✦', 'Trinket IV', true)}
            ${slot('trinket-5', '✦', 'Trinket V', true)}
          </div>
        </section>
      </div>
    </div>
  `;
}

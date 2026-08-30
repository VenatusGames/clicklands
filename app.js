(() => {
  const ENTER_SOUND = 'assets/sfx/CL-enter.wav';
  const LOGO = 'assets/images/CL-logo.png';
  const THEME_KEY = 'clicklands-theme';
  const OVERALL_XP_PER_SKILL_LEVEL = 25;
  const COIN_RATES = { copper: 1, silver: 100, gold: 10000, platinum: 1000000 };
  const BASIC_AXE_PRICE = 150;
  const LUMBER_SELL_PRICES = {
    oakWood: { name: 'Oak Wood', price: 12 },
    birchWood: { name: 'Birch Wood', price: 20 },
    acorns: { name: 'Acorn', price: 6 },
  };
  const SAWMILL_RECIPES = {
    oakWood: { name: 'Oak Wood', plankKey: 'oakPlanks', plankName: 'Oak Planks', duration: 3200, planks: 2, sawdust: 1 },
    birchWood: { name: 'Birch Wood', plankKey: 'birchPlanks', plankName: 'Birch Planks', duration: 5200, planks: 2, sawdust: 1 },
  };

  const defaultState = {
    theme: 'light',
    location: 'forest',
    lakesideExpanded: true,
    inventoryOpen: false,
    inventoryTab: 'items',
    skillsOpen: false,
    username: 'Username',
    inventory: {
      oakWood: 0,
      birchWood: 0,
      apples: 0,
      acorns: 0,
      stone: 0,
      coal: 0,
      ironOre: 0,
      goldOre: 0,
      silverOre: 0,
      quartz: 0,
      amethyst: 0,
      oakPlanks: 0,
      birchPlanks: 0,
      sawdust: 0,
      basicWoodcuttersAxe: 0,
    },
    wallet: { copper: 0, xelium: 0 },
    equipment: { axe: null },
    overall: { level: 1, xp: 0 },
    skills: {
      woodcutting: { level: 1, xp: 0 },
      mining: { level: 1, xp: 0 },
    },
  };

  const treeSlots = [
    { x: 10, y: 72 }, { x: 24, y: 84 }, { x: 39, y: 69 },
    { x: 53, y: 85 }, { x: 68, y: 72 }, { x: 83, y: 86 },
    { x: 94, y: 70 }, { x: 18, y: 61 }, { x: 47, y: 58 },
    { x: 76, y: 60 },
  ];

  const treeSizes = {
    small: { scale: .78, minLogs: 2, maxLogs: 4, hitsPerLog: 2, label: 'Small' },
    medium: { scale: 1, minLogs: 4, maxLogs: 7, hitsPerLog: 3, label: 'Medium' },
    large: { scale: 1.22, minLogs: 7, maxLogs: 11, hitsPerLog: 4, label: 'Large' },
  };

  const mineSlots = [
    { x: 14, y: 79, scale: .86 },
    { x: 31, y: 91, scale: 1.02 },
    { x: 49, y: 79, scale: .92 },
    { x: 67, y: 91, scale: 1.04 },
    { x: 85, y: 80, scale: .88 },
  ];

  const miningTypes = [
    { key: 'stone', name: 'Stone Deposit', itemName: 'Stone', weight: 52, minUnits: 5, maxUnits: 9, hitsPerUnit: 3, xp: 5, color: '#8c9591' },
    { key: 'coal', name: 'Coal Vein', itemName: 'Coal', weight: 26, minUnits: 4, maxUnits: 7, hitsPerUnit: 3, xp: 6, color: '#343a38' },
    { key: 'ironOre', name: 'Iron Vein', itemName: 'Iron Ore', weight: 12, minUnits: 3, maxUnits: 5, hitsPerUnit: 4, xp: 8, color: '#b56f53' },
    { key: 'goldOre', name: 'Gold Vein', itemName: 'Gold Ore', weight: 4, minUnits: 2, maxUnits: 4, hitsPerUnit: 5, xp: 12, color: '#d7b84d' },
    { key: 'geode', name: 'Geode', itemName: 'Geode', weight: 5, minUnits: 2, maxUnits: 4, hitsPerUnit: 4, xp: 10, color: '#8c73b8' },
    { key: 'silverOre', name: 'Silver Vein', itemName: 'Silver Ore', weight: 1, minUnits: 1, maxUnits: 3, hitsPerUnit: 6, xp: 18, color: '#d5dbe0' },
  ];

  const state = JSON.parse(JSON.stringify(defaultState));
  state.theme = loadThemePreference();

  const runtime = {
    trees: new Map(),
    occupiedSlots: new Set(),
    treeId: 0,
    mineNodes: new Map(),
    occupiedMineSlots: new Set(),
    mineNodeId: 0,
    hoverResource: null,
    entered: false,
    lumberShopOpen: false,
    sawmillJob: null,
    sawmillTimer: null,
    draggedItem: null,
  };

  mountApp();
  const ui = cacheUI();
  bindEvents();
  applyTheme();
  renderNavigation();
  renderHUD();
  renderInventory();
  renderDrawers();
  renderLumberShop();
  spawnInitialForest();
  spawnInitialMineNodes();

  function mountApp() {
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
          ${forestMarkup()}
          ${minesMarkup()}
          ${townMarkup()}
          ${lumbermillMarkup()}
        </section>
        ${inventoryMarkup()}
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
          </div>
        </nav>

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
              <span class="xp-label-row">
                <span class="xp-label">Overall XP</span>
                <span class="xp-value" data-overall-xp>0 / 100 XP</span>
              </span>
              <span class="progress-track overall-progress-track"><span class="progress-fill overall-progress-fill" data-overall-fill></span></span>
            </span>
            <span class="character-chevron">${chevronSvg()}</span>
          </button>

          <div class="skills-drawer" data-skills-drawer>
            ${skillMarkup('woodcutting', '🪓', 'Woodcutting')}
            ${skillMarkup('mining', '⛏', 'Mining')}
          </div>
        </div>

        <div class="wallet-hud" aria-label="Currency">
          <div class="currency-chip copper" title="Copper"><span class="coin-icon">C</span><strong data-wallet-copper>0</strong></div>
          <div class="currency-chip silver" title="Silver"><span class="coin-icon">S</span><strong data-wallet-silver>0</strong></div>
          <div class="currency-chip gold" title="Gold"><span class="coin-icon">G</span><strong data-wallet-gold>0</strong></div>
          <div class="currency-chip platinum" title="Platinum"><span class="coin-icon">P</span><strong data-wallet-platinum>0</strong></div>
          <div class="currency-chip xelium" title="Xelium"><span class="xelium-stone" aria-hidden="true"></span><strong data-wallet-xelium>0</strong></div>
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
        <div class="forest-node-stage" data-forest-stage></div>
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
        <div class="mine-node-stage" data-mine-stage></div>
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

        <button class="lumberjack-npc" type="button" data-lumberjack aria-label="Talk to the lumberjack">
          <span class="npc-shadow" aria-hidden="true"></span>
          <span class="npc-body" aria-hidden="true">
            <span class="npc-head"><span class="npc-hair"></span><span class="npc-beard"></span></span>
            <span class="npc-shirt"></span>
            <span class="npc-overalls"></span>
            <span class="npc-arm arm-left"></span><span class="npc-arm arm-right"></span>
            <span class="npc-leg leg-left"></span><span class="npc-leg leg-right"></span>
          </span>
          <span class="npc-label"><strong>Garrick</strong><small>Lumberjack · Click to trade</small></span>
        </button>

        <div class="sawmill-station" data-sawmill-drop>
          <div class="sawmill-head">
            <span><small>Sawmill Table</small><strong data-sawmill-status>Drag a log here</strong></span>
            <span class="sawmill-busy-dot" aria-hidden="true"></span>
          </div>
          <div class="sawmill-machine" data-sawmill-machine>
            <div class="sawmill-bed"><span class="sawmill-belt"></span></div>
            <div class="saw-housing"><span class="saw-blade"></span></div>
            <div class="sawmill-input">DROP LOG</div>
            <div class="sawmill-output" data-sawmill-output><span></span><span></span><span></span></div>
          </div>
          <div class="sawmill-progress"><span data-sawmill-fill></span></div>
          <div class="sawmill-hint">Drag Oak or Birch Wood from your inventory onto the table.</div>
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
          <div><strong>Inventory</strong><span>Items & equipment</span></div>
          <button class="icon-button" type="button" data-inventory-close aria-label="Close inventory">×</button>
        </div>
        <div class="drawer-tabs" role="tablist">
          <button class="drawer-tab" type="button" data-inventory-tab="items">Items</button>
          <button class="drawer-tab" type="button" data-inventory-tab="equipment">Equipment</button>
        </div>
        <div class="drawer-body">
          <section class="drawer-pane" data-inventory-pane="items"></section>
          <section class="drawer-pane" data-inventory-pane="equipment" hidden>${equipmentMarkup()}</section>
        </div>
      </aside>
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
          <span class="equipment-summary">17 slots</span>
        </div>

        <div class="equipment-groups">
          <section class="equipment-group">
            <div class="equipment-group-head"><span>Tools</span><span class="equipment-group-count">2</span></div>
            <div class="equipment-grid two-col">
              ${slot('axe', '🪓', 'Axe')}
              ${slot('pickaxe', '⛏', 'Pickaxe')}
            </div>
          </section>

          <section class="equipment-group">
            <div class="equipment-group-head"><span>Weapons</span><span class="equipment-group-count">2</span></div>
            <div class="equipment-grid two-col">
              ${slot('main-hand', '⚔', 'Main Hand')}
              ${slot('off-hand', '◈', 'Off Hand')}
            </div>
          </section>

          <section class="equipment-group equipment-group-wide">
            <div class="equipment-group-head"><span>Armor</span><span class="equipment-group-count">5</span></div>
            <div class="equipment-grid armor-grid">
              ${slot('helmet', '⬡', 'Helmet')}
              ${slot('chestplate', '▣', 'Chestplate')}
              ${slot('leggings', 'Ⅱ', 'Leggings')}
              ${slot('boots', '⌄', 'Boots')}
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

  function cacheUI() {
    return {
      splash: document.querySelector('[data-splash]'),
      enter: document.querySelector('[data-enter]'),
      themeToggle: document.querySelector('[data-theme-toggle]'),
      themeIcon: document.querySelector('[data-theme-icon]'),
      themeLabel: document.querySelector('[data-theme-label]'),
      areaToggle: document.querySelector('[data-area-toggle]'),
      areaChildren: document.querySelector('[data-area-children]'),
      characterBar: document.querySelector('[data-character-bar]'),
      skillsDrawer: document.querySelector('[data-skills-drawer]'),
      username: document.querySelector('[data-username]'),
      overallLevel: document.querySelector('[data-overall-level]'),
      overallXp: document.querySelector('[data-overall-xp]'),
      overallFill: document.querySelector('[data-overall-fill]'),
      inventoryToggle: document.querySelector('[data-inventory-toggle]'),
      inventoryDrawer: document.querySelector('[data-inventory-drawer]'),
      inventoryClose: document.querySelector('[data-inventory-close]'),
      itemPane: document.querySelector('[data-inventory-pane="items"]'),
      equipmentPane: document.querySelector('[data-inventory-pane="equipment"]'),
      forestStage: document.querySelector('[data-forest-stage]'),
      mineStage: document.querySelector('[data-mine-stage]'),
      toastStack: document.querySelector('[data-toasts]'),
      resourceHoverBar: document.querySelector('[data-resource-hover-bar]'),
      resourceHoverName: document.querySelector('[data-resource-hover-name]'),
      resourceHoverMeta: document.querySelector('[data-resource-hover-meta]'),
      resourceHoverFill: document.querySelector('[data-resource-hover-fill]'),
      mapCard: document.querySelector('[data-map-card]'),
      walletCopper: document.querySelector('[data-wallet-copper]'),
      walletSilver: document.querySelector('[data-wallet-silver]'),
      walletGold: document.querySelector('[data-wallet-gold]'),
      walletPlatinum: document.querySelector('[data-wallet-platinum]'),
      walletXelium: document.querySelector('[data-wallet-xelium]'),
      lumberShop: document.querySelector('[data-lumber-shop]'),
      lumberShopBody: document.querySelector('[data-lumber-shop-body]'),
      sawmillDrop: document.querySelector('[data-sawmill-drop]'),
      sawmillMachine: document.querySelector('[data-sawmill-machine]'),
      sawmillStatus: document.querySelector('[data-sawmill-status]'),
      sawmillFill: document.querySelector('[data-sawmill-fill]'),
      sawmillOutput: document.querySelector('[data-sawmill-output]'),
    };
  }

  function bindEvents() {
    const enterSound = new Audio(ENTER_SOUND);
    enterSound.preload = 'auto';
    enterSound.volume = .35;

    ui.enter.addEventListener('click', () => {
      if (runtime.entered) return;
      runtime.entered = true;
      try {
        enterSound.currentTime = 0;
        enterSound.play().catch(() => {});
      } catch (error) {
      }
      ui.splash.classList.add('is-leaving');
      window.setTimeout(() => ui.splash.remove(), 520);
    });

    document.addEventListener('click', (event) => {
      const locationButton = event.target.closest('[data-location]');
      if (locationButton) {
        setLocation(locationButton.dataset.location);
        return;
      }

      const building = event.target.closest('[data-town-building]');
      if (building) {
        if (building.dataset.townBuilding === 'lumbermill') {
          setLocation('lumbermill');
        } else {
          showToast(
            building.dataset.buildingName,
            `${building.dataset.buildingNote}. Building interactions will be added later.`,
            '⌂'
          );
        }
        return;
      }

      if (event.target.closest('[data-lumberjack]')) {
        runtime.lumberShopOpen = true;
        renderLumberShop();
        return;
      }

      if (event.target.closest('[data-lumber-shop-close]')) {
        runtime.lumberShopOpen = false;
        renderLumberShop();
        return;
      }

      const sellButton = event.target.closest('[data-sell-item]');
      if (sellButton) {
        sellLumberItem(sellButton.dataset.sellItem, sellButton.dataset.sellMode === 'all');
        return;
      }

      if (event.target.closest('[data-buy-basic-axe]')) {
        buyBasicAxe();
        return;
      }

      const equipButton = event.target.closest('[data-equip-item]');
      if (equipButton) {
        toggleEquipItem(equipButton.dataset.equipItem);
        return;
      }

      const tab = event.target.closest('[data-inventory-tab]');
      if (tab) {
        state.inventoryTab = tab.dataset.inventoryTab === 'equipment' ? 'equipment' : 'items';
        renderInventory();
            }
    });

    ui.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveThemePreference(state.theme);
      applyTheme();
    });

    ui.areaToggle.addEventListener('click', () => {
      state.lakesideExpanded = !state.lakesideExpanded;
      renderNavigation();
        });

    ui.characterBar.addEventListener('click', () => {
      state.skillsOpen = !state.skillsOpen;
      renderDrawers();
    });

    ui.inventoryToggle.addEventListener('click', () => {
      state.inventoryOpen = true;
      renderDrawers();
    });

    ui.inventoryClose.addEventListener('click', () => {
      state.inventoryOpen = false;
      renderDrawers();
      ui.inventoryToggle.focus();
    });

    document.addEventListener('dragstart', (event) => {
      const item = event.target.closest('[data-drag-item]');
      if (!item) return;
      const key = item.dataset.dragItem;
      if (!SAWMILL_RECIPES[key] || state.inventory[key] <= 0) {
        event.preventDefault();
        return;
      }
      runtime.draggedItem = key;
      item.classList.add('is-dragging');
      document.body.classList.add('is-dragging-log');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key);
    });

    document.addEventListener('dragend', (event) => {
      event.target.closest('[data-drag-item]')?.classList.remove('is-dragging');
      runtime.draggedItem = null;
      document.body.classList.remove('is-dragging-log');
      ui.sawmillDrop?.classList.remove('is-dragover');
    });

    ui.sawmillDrop?.addEventListener('dragover', (event) => {
      if (!runtime.draggedItem || !SAWMILL_RECIPES[runtime.draggedItem]) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      ui.sawmillDrop.classList.add('is-dragover');
    });

    ui.sawmillDrop?.addEventListener('dragleave', (event) => {
      if (!ui.sawmillDrop.contains(event.relatedTarget)) ui.sawmillDrop.classList.remove('is-dragover');
    });

    ui.sawmillDrop?.addEventListener('drop', (event) => {
      event.preventDefault();
      ui.sawmillDrop.classList.remove('is-dragover');
      const key = event.dataTransfer.getData('text/plain') || runtime.draggedItem;
      runtime.draggedItem = null;
      document.body.classList.remove('is-dragging-log');
      startSawmill(key);
    });

    window.addEventListener('resize', () => {
      if (runtime.hoverResource?.node) positionResourceHoverBar(runtime.hoverResource.node);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (state.inventoryOpen) {
        state.inventoryOpen = false;
        renderDrawers();
      } else if (state.skillsOpen) {
        state.skillsOpen = false;
        renderDrawers();
      }
    });

    if (window.matchMedia('(pointer:fine)').matches) {
      ui.mapCard.addEventListener('pointermove', (event) => {
        const rect = ui.mapCard.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 4;
        const y = ((event.clientY - rect.top) / rect.height - .5) * 4;
        ui.mapCard.style.transform = `perspective(900px) rotateX(${-y * .25}deg) rotateY(${x * .25}deg)`;
      });
      ui.mapCard.addEventListener('pointerleave', () => {
        ui.mapCard.style.transform = '';
      });
    }
  }

  function loadThemePreference() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (error) {
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function saveThemePreference(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
    }
  }

  function applyTheme() {
    document.body.classList.toggle('dark', state.theme === 'dark');
    ui.themeIcon.textContent = state.theme === 'dark' ? '☾' : '☀';
    ui.themeLabel.textContent = state.theme === 'dark' ? 'Dark mode' : 'Light mode';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', state.theme === 'dark' ? '#111a14' : '#dbe8df');
  }

  function renderNavigation() {
    document.querySelectorAll('[data-location]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.location === state.location);
    });

    document.querySelectorAll('[data-view]').forEach((view) => {
      view.classList.toggle('is-active', view.dataset.view === state.location);
    });

    ui.areaToggle.setAttribute('aria-expanded', String(state.lakesideExpanded));
    ui.areaChildren.classList.toggle('is-collapsed', !state.lakesideExpanded);
  }

  function setLocation(location) {
    if (!['lakeside', 'forest', 'mines', 'town', 'lumbermill'].includes(location)) return;
    hideResourceHoverBar();
    state.location = location;
    state.inventoryOpen = false;
    if (location !== 'lumbermill') runtime.lumberShopOpen = false;
    renderNavigation();
    renderLumberShop();
    renderDrawers();
    }

  function renderHUD() {
    ui.username.textContent = state.username;
    updateProgressUI(state.overall, ui.overallLevel, ui.overallXp, ui.overallFill, true);
    renderWallet();

    ['woodcutting', 'mining'].forEach((skill) => {
      const data = state.skills[skill];
      const levelNode = document.querySelector(`[data-skill-level="${skill}"]`);
      const xpNode = document.querySelector(`[data-skill-xp="${skill}"]`);
      const fillNode = document.querySelector(`[data-skill-fill="${skill}"]`);
      updateProgressUI(data, levelNode, xpNode, fillNode, false);
    });
  }

  function updateProgressUI(progress, levelNode, xpNode, fillNode, overall) {
    const needed = xpNeeded(progress.level);
    const percent = clamp((progress.xp / needed) * 100, 0, 100);
    levelNode.textContent = overall ? String(progress.level) : `Level ${progress.level}`;
    xpNode.textContent = `${overall ? formatXp(progress.xp) : progress.xp} / ${needed} XP`;

    if (overall) {
      fillNode.style.transform = `scaleX(${percent / 100})`;
    } else {
      fillNode.style.width = `${percent}%`;
    }
  }

  function renderDrawers() {
    ui.inventoryDrawer.classList.toggle('is-open', state.inventoryOpen);
    ui.characterBar.setAttribute('aria-expanded', String(state.skillsOpen));
    ui.skillsDrawer.classList.toggle('is-open', state.skillsOpen);
  }

  function renderInventory() {
    document.querySelectorAll('[data-inventory-tab]').forEach((tab) => {
      const active = tab.dataset.inventoryTab === state.inventoryTab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    ui.itemPane.hidden = state.inventoryTab !== 'items';
    ui.equipmentPane.hidden = state.inventoryTab !== 'equipment';
    ui.inventoryDrawer.classList.toggle('equipment-mode', state.inventoryTab === 'equipment');

    const items = [
      { key: 'oakWood', name: 'Oak Wood', icon: '<span class="mini-log"></span>', draggable: true },
      { key: 'birchWood', name: 'Birch Wood', icon: '<span class="mini-birch"></span>', draggable: true },
      { key: 'oakPlanks', name: 'Oak Planks', icon: '<span class="mini-plank oak"></span>' },
      { key: 'birchPlanks', name: 'Birch Planks', icon: '<span class="mini-plank birch"></span>' },
      { key: 'sawdust', name: 'Sawdust', icon: '<span class="mini-sawdust"></span>' },
      { key: 'basicWoodcuttersAxe', name: "Basic Woodcutter's Axe", icon: '<span aria-hidden="true">🪓</span>', equip: true },
      { key: 'apples', name: 'Apple', icon: '<span aria-hidden="true">🍎</span>' },
      { key: 'acorns', name: 'Acorn', icon: '<span aria-hidden="true">🌰</span>' },
      { key: 'stone', name: 'Stone', icon: '<span class="mini-ore stone" aria-hidden="true"></span>' },
      { key: 'coal', name: 'Coal', icon: '<span class="mini-ore coal" aria-hidden="true"></span>' },
      { key: 'ironOre', name: 'Iron Ore', icon: '<span class="mini-ore iron" aria-hidden="true"></span>' },
      { key: 'goldOre', name: 'Gold Ore', icon: '<span class="mini-ore gold" aria-hidden="true"></span>' },
      { key: 'silverOre', name: 'Silver Ore', icon: '<span class="mini-ore silver" aria-hidden="true"></span>' },
      { key: 'quartz', name: 'Quartz', icon: '<span class="mini-gem quartz" aria-hidden="true"></span>' },
      { key: 'amethyst', name: 'Amethyst', icon: '<span class="mini-gem amethyst" aria-hidden="true"></span>' },
    ].filter((item) => state.inventory[item.key] > 0);

    ui.itemPane.innerHTML = items.length
      ? `<div class="item-list">${items.map((item) => {
          const isEquipped = item.key === 'basicWoodcuttersAxe' && state.equipment.axe === item.key;
          const action = item.equip
            ? `<button class="item-action" type="button" data-equip-item="${item.key}">${isEquipped ? 'Unequip' : 'Equip'}</button>`
            : '';
          return `<div class="item-row${item.draggable ? ' is-draggable' : ''}" ${item.draggable ? `draggable="true" data-drag-item="${item.key}"` : ''}>
            <span class="item-icon">${item.icon}</span>
            <span class="item-name">${item.name}${isEquipped ? '<small>Equipped · +1 tree damage</small>' : ''}</span>
            <span class="item-actions"><span class="item-count">${state.inventory[item.key]}</span>${action}</span>
          </div>`;
        }).join('')}</div>`
      : '<div class="item-empty">No items yet.</div>';

    renderEquipment();
  }


  function coinBreakdown(totalCopper) {
    let remaining = Math.max(0, Math.floor(totalCopper));
    const platinum = Math.floor(remaining / COIN_RATES.platinum);
    remaining %= COIN_RATES.platinum;
    const gold = Math.floor(remaining / COIN_RATES.gold);
    remaining %= COIN_RATES.gold;
    const silver = Math.floor(remaining / COIN_RATES.silver);
    const copper = remaining % COIN_RATES.silver;
    return { copper, silver, gold, platinum };
  }

  function renderWallet() {
    const coins = coinBreakdown(state.wallet.copper);
    ui.walletCopper.textContent = coins.copper;
    ui.walletSilver.textContent = coins.silver;
    ui.walletGold.textContent = coins.gold;
    ui.walletPlatinum.textContent = coins.platinum;
    ui.walletXelium.textContent = state.wallet.xelium;
  }

  function formatCoinPrice(copperValue) {
    const coins = coinBreakdown(copperValue);
    return [
      coins.platinum ? `${coins.platinum} Platinum` : '',
      coins.gold ? `${coins.gold} Gold` : '',
      coins.silver ? `${coins.silver} Silver` : '',
      coins.copper ? `${coins.copper} Copper` : '',
    ].filter(Boolean).join(' ') || '0 Copper';
  }

  function renderLumberShop() {
    if (!ui.lumberShop || !ui.lumberShopBody) return;
    ui.lumberShop.classList.toggle('is-open', runtime.lumberShopOpen);
    if (!runtime.lumberShopOpen) return;

    const sellRows = Object.entries(LUMBER_SELL_PRICES).map(([key, item]) => {
      const count = state.inventory[key] || 0;
      return `
        <div class="shop-sell-row">
          <span class="shop-item-icon">${key === 'acorns' ? '🌰' : key === 'birchWood' ? '<span class="mini-birch"></span>' : '<span class="mini-log"></span>'}</span>
          <span class="shop-item-copy"><strong>${item.name}</strong><small>${item.price} Copper each · You have ${count}</small></span>
          <span class="shop-sell-actions">
            <button type="button" data-sell-item="${key}" data-sell-mode="one" ${count < 1 ? 'disabled' : ''}>Sell 1</button>
            <button type="button" data-sell-item="${key}" data-sell-mode="all" ${count < 1 ? 'disabled' : ''}>All</button>
          </span>
        </div>`;
    }).join('');

    const axeOwned = state.inventory.basicWoodcuttersAxe > 0;
    const affordable = state.wallet.copper >= BASIC_AXE_PRICE;
    ui.lumberShopBody.innerHTML = `
      <section class="shop-section">
        <div class="shop-section-head"><strong>Sell Timber</strong><span>Garrick buys logs & acorns</span></div>
        <div class="shop-sell-list">${sellRows}</div>
      </section>
      <section class="shop-section buy-section">
        <div class="shop-section-head"><strong>Tools</strong><span>Starter equipment</span></div>
        <div class="shop-product">
          <span class="shop-product-icon">🪓</span>
          <span class="shop-product-copy"><strong>Basic Woodcutter's Axe</strong><small>+1 damage to trees when equipped</small></span>
          <span class="shop-product-buy"><b>${formatCoinPrice(BASIC_AXE_PRICE)}</b><button type="button" data-buy-basic-axe ${axeOwned || !affordable ? 'disabled' : ''}>${axeOwned ? 'Owned' : affordable ? 'Buy' : 'Need coins'}</button></span>
        </div>
      </section>`;
  }

  function sellLumberItem(key, sellAll) {
    const listing = LUMBER_SELL_PRICES[key];
    if (!listing) return;
    const owned = state.inventory[key] || 0;
    if (owned <= 0) return;
    const amount = sellAll ? owned : 1;
    state.inventory[key] -= amount;
    const earned = amount * listing.price;
    state.wallet.copper += earned;
    renderWallet();
    renderInventory();
    renderLumberShop();
    showToast('Sold', `${amount} ${listing.name}${amount === 1 ? '' : ' items'} · +${formatCoinPrice(earned)}`, '¢');
  }

  function buyBasicAxe() {
    if (state.inventory.basicWoodcuttersAxe > 0) return;
    if (state.wallet.copper < BASIC_AXE_PRICE) {
      showToast('Not enough coins', `The axe costs ${formatCoinPrice(BASIC_AXE_PRICE)}.`, '¢');
      return;
    }
    state.wallet.copper -= BASIC_AXE_PRICE;
    state.inventory.basicWoodcuttersAxe = 1;
    renderWallet();
    renderInventory();
    renderLumberShop();
    showToast('Purchased', "Basic Woodcutter's Axe added to your inventory.", '🪓');
  }

  function toggleEquipItem(key) {
    if (key !== 'basicWoodcuttersAxe' || state.inventory[key] <= 0) return;
    state.equipment.axe = state.equipment.axe === key ? null : key;
    renderInventory();
    showToast(
      state.equipment.axe ? 'Axe equipped' : 'Axe unequipped',
      state.equipment.axe ? '+1 damage to every tree hit.' : 'Tree damage returned to normal.',
      '🪓'
    );
  }

  function renderEquipment() {
    const axeSlot = document.querySelector('[data-equipment-slot="axe"]');
    if (!axeSlot) return;
    const equipped = state.equipment.axe === 'basicWoodcuttersAxe';
    axeSlot.classList.toggle('is-equipped', equipped);
    axeSlot.setAttribute('aria-label', equipped ? "Axe, Basic Woodcutter's Axe equipped" : 'Axe, empty');
    const stateNode = axeSlot.querySelector('.equipment-slot-state');
    if (stateNode) stateNode.textContent = equipped ? "Basic Woodcutter's Axe · +1 dmg" : 'Empty';
  }

  function getTreeDamage() {
    return state.equipment.axe === 'basicWoodcuttersAxe' ? 2 : 1;
  }

  function startSawmill(key) {
    const recipe = SAWMILL_RECIPES[key];
    if (!recipe || state.location !== 'lumbermill') return;
    if (runtime.sawmillJob) {
      showToast('Sawmill busy', 'Wait for the current log to finish.', '⚙');
      return;
    }
    if ((state.inventory[key] || 0) <= 0) {
      showToast('No logs', `You do not have any ${recipe.name}.`, '▤');
      return;
    }

    state.inventory[key] -= 1;
    const startedAt = performance.now();
    runtime.sawmillJob = { key, recipe, startedAt, endsAt: startedAt + recipe.duration };
    renderInventory();
    renderLumberShop();
    ui.sawmillMachine.classList.add('is-running');
    ui.sawmillDrop.classList.add('is-processing');
    ui.sawmillStatus.textContent = `Cutting ${recipe.name}…`;
    updateSawmillProgress();
    runtime.sawmillTimer = window.setInterval(updateSawmillProgress, 80);
  }

  function updateSawmillProgress() {
    const job = runtime.sawmillJob;
    if (!job) {
      ui.sawmillFill.style.width = '0%';
      return;
    }
    const now = performance.now();
    const progress = clamp((now - job.startedAt) / job.recipe.duration, 0, 1);
    ui.sawmillFill.style.width = `${progress * 100}%`;
    if (progress >= 1) finishSawmill();
  }

  function finishSawmill() {
    const job = runtime.sawmillJob;
    if (!job) return;
    window.clearInterval(runtime.sawmillTimer);
    runtime.sawmillTimer = null;
    runtime.sawmillJob = null;

    state.inventory[job.recipe.plankKey] += job.recipe.planks;
    state.inventory.sawdust += job.recipe.sawdust;
    ui.sawmillMachine.classList.remove('is-running');
    ui.sawmillDrop.classList.remove('is-processing');
    ui.sawmillOutput.classList.remove('is-ejecting');
    void ui.sawmillOutput.offsetWidth;
    ui.sawmillOutput.classList.add('is-ejecting');
    ui.sawmillFill.style.width = '100%';
    ui.sawmillStatus.textContent = `${job.recipe.plankName} ready`;
    renderInventory();
    showToast('Sawmill finished', `+${job.recipe.planks} ${job.recipe.plankName} · +${job.recipe.sawdust} Sawdust`, '▤');

    window.setTimeout(() => {
      ui.sawmillOutput.classList.remove('is-ejecting');
      ui.sawmillFill.style.width = '0%';
      ui.sawmillStatus.textContent = 'Drag a log here';
    }, 1050);
  }

  function xpNeeded(level) {
    return 100 + ((level - 1) * 25);
  }

  function formatXp(value) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function gainSkillXp(skill, amount) {
    const skillData = state.skills[skill];
    const startFraction = skillData.xp / xpNeeded(skillData.level);
    const oldOverallLevel = state.overall.level;

    const skillLevelsGained = addXp(skillData, amount);
    const endFraction = skillData.xp / xpNeeded(skillData.level);

    // One complete skill level is still worth exactly 25 Overall XP.
    // Award that same value continuously as the skill bar advances.
    const overallProgress = skillLevelsGained + endFraction - startFraction;
    const overallXpAward = Math.max(0, overallProgress * OVERALL_XP_PER_SKILL_LEVEL);
    addXp(state.overall, overallXpAward);

    if (skillLevelsGained > 0) {
      showToast(
        'Level up',
        `${capitalize(skill)} reached level ${skillData.level}.`,
        skill === 'woodcutting' ? '🪓' : '⛏'
      );
    }

    if (state.overall.level > oldOverallLevel) {
      showToast('Overall level up', `Overall Level ${state.overall.level}`, '✦');
    }

    renderHUD();
  }

  function addXp(progress, amount) {
    const startingLevel = progress.level;
    progress.xp = Math.round((progress.xp + amount) * 1000000) / 1000000;
    let needed = xpNeeded(progress.level);

    while (progress.xp + 0.000001 >= needed) {
      progress.xp = Math.max(0, Math.round((progress.xp - needed) * 1000000) / 1000000);
      progress.level += 1;
      needed = xpNeeded(progress.level);
    }

    return progress.level - startingLevel;
  }


  function spawnInitialForest() {
    const count = Math.min(6, treeSlots.length);
    for (let i = 0; i < count; i += 1) spawnTree();
  }

  function spawnTree() {
    const slotIndex = getFreeSlot();
    if (slotIndex === null) return;
    runtime.occupiedSlots.add(slotIndex);

    const slot = treeSlots[slotIndex];
    const sizeKey = chooseSize();
    const size = treeSizes[sizeKey];
    const variant = chooseVariant();
    const y = clamp(slot.y + randomInt(-2, 2), 57, 89);
    const x = clamp(slot.x + randomInt(-3, 3), 6, 94);
    const depthScale = .9 + ((y - 57) / 32) * .14;
    const initialLogs = randomInt(size.minLogs, size.maxLogs);
    const renderScale = size.scale * depthScale;

    const tree = {
      id: ++runtime.treeId,
      slotIndex,
      x,
      y,
      variant,
      sizeKey,
      sizeLabel: size.label,
      hitsPerLog: size.hitsPerLog,
      hits: 0,
      logs: initialLogs,
      initialLogs,
      maxWork: initialLogs * size.hitsPerLog,
      alternate: false,
      renderScale,
    };

    runtime.trees.set(tree.id, tree);
    const node = createTreeNode(tree);
    tree.node = node;
    ui.forestStage.appendChild(node);
    window.setTimeout(() => node.classList.remove('is-spawning'), 460);
    updateTreeNode(tree);
  }

  function getFreeSlot() {
    const free = treeSlots.map((_, index) => index).filter((index) => !runtime.occupiedSlots.has(index));
    return free.length ? free[randomInt(0, free.length - 1)] : null;
  }

  function chooseSize() {
    const roll = Math.random();
    if (roll < .28) return 'small';
    if (roll < .78) return 'medium';
    return 'large';
  }

  function chooseVariant() {
    const roll = Math.random();
    if (roll < .07) return 'apple-oak';
    if (roll < .20) return 'birch';
    return 'oak';
  }

  function createTreeNode(tree) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `tree-node is-spawning ${tree.variant === 'birch' ? 'birch' : 'oak'}`;
    node.style.left = `${tree.x}%`;
    node.style.top = `${tree.y}%`;
    node.style.setProperty('--scale', tree.renderScale);
    node.style.setProperty('--bar-scale', 1 / tree.renderScale);
    node.style.zIndex = String(Math.round(tree.y * 10));
    node.setAttribute('aria-label', `Chop ${treeName(tree)}`);

    node.innerHTML = `
      <span class="tree-shell">${tree.variant === 'birch' ? birchSvg() : oakSvg(tree.variant === 'apple-oak')}</span>
      <span class="tree-tag">${treeName(tree)}</span>
    `;

    node.addEventListener('pointerenter', () => showTreeHoverBar(tree));
    node.addEventListener('pointermove', () => positionResourceHoverBar(node));
    node.addEventListener('pointerleave', () => hideResourceHoverBar(node));
    node.addEventListener('focus', () => showTreeHoverBar(tree));
    node.addEventListener('blur', () => hideResourceHoverBar(node));
    node.addEventListener('click', () => chopTree(tree));
    return node;
  }

  function setResourceHoverBar(node, name, meta, percent, key) {
    if (!node?.isConnected) return;

    runtime.hoverResource = { node, key };
    ui.resourceHoverName.textContent = name;
    ui.resourceHoverMeta.textContent = meta;
    ui.resourceHoverFill.style.width = `${clamp(percent, 0, 100)}%`;
    ui.resourceHoverBar.classList.add('is-visible');
    ui.resourceHoverBar.setAttribute('aria-hidden', 'false');
    positionResourceHoverBar(node);
  }

  function positionResourceHoverBar(node) {
    if (!node?.isConnected || runtime.hoverResource?.node !== node) return;

    const nodeRect = node.getBoundingClientRect();
    const hudRect = document.querySelector('.character-stack')?.getBoundingClientRect();
    const barRect = ui.resourceHoverBar.getBoundingClientRect();
    const safeTop = Math.max(12, (hudRect?.bottom || 0) + 10);
    const desiredTop = nodeRect.top - barRect.height - 9;
    const top = Math.max(safeTop, desiredTop);
    const half = barRect.width / 2;
    const left = clamp(nodeRect.left + (nodeRect.width / 2), half + 10, window.innerWidth - half - 10);

    ui.resourceHoverBar.style.left = `${left}px`;
    ui.resourceHoverBar.style.top = `${top}px`;
  }

  function hideResourceHoverBar(node) {
    if (node && runtime.hoverResource?.node !== node) return;
    runtime.hoverResource = null;
    ui.resourceHoverBar.classList.remove('is-visible');
    ui.resourceHoverBar.setAttribute('aria-hidden', 'true');
  }

  function showTreeHoverBar(tree) {
    if (!tree?.node?.isConnected || tree.node.disabled) return;
    const remainingWork = (tree.logs * tree.hitsPerLog) - tree.hits;
    const health = clamp((remainingWork / tree.maxWork) * 100, 0, 100);
    setResourceHoverBar(tree.node, treeName(tree), `${tree.logs} log${tree.logs === 1 ? '' : 's'}`, health, `tree:${tree.id}`);
  }

  function updateTreeNode(tree) {
    if (!tree?.node?.isConnected) return;
    const remainingWork = (tree.logs * tree.hitsPerLog) - tree.hits;
    const health = clamp((remainingWork / tree.maxWork) * 100, 0, 100);

    if (runtime.hoverResource?.key === `tree:${tree.id}`) {
      ui.resourceHoverName.textContent = treeName(tree);
      ui.resourceHoverMeta.textContent = `${tree.logs} log${tree.logs === 1 ? '' : 's'}`;
      ui.resourceHoverFill.style.width = `${health}%`;
      positionResourceHoverBar(tree.node);
    }
  }

  function chopTree(tree) {
    if (
      !runtime.trees.has(tree.id) ||
      tree.node.disabled ||
      tree.node.classList.contains('is-spawning')
    ) return;

    tree.alternate = !tree.alternate;
    pulseNode(tree.node, tree.alternate ? 'is-hit-left' : 'is-hit-right');
    createTreeChips(tree);

    const damage = getTreeDamage();
    tree.hits += damage;
    while (tree.logs > 0 && tree.hits >= tree.hitsPerLog) {
      tree.hits -= tree.hitsPerLog;
      harvestTreeLog(tree);
    }

    updateTreeNode(tree);
    if (tree.logs <= 0) depleteTree(tree);
  }

  function harvestTreeLog(tree) {
    tree.logs -= 1;
    const rewards = [];

    if (tree.variant === 'birch') {
      state.inventory.birchWood += 1;
      rewards.push('+1 Birch Wood');
      gainSkillXp('woodcutting', 7);
    } else {
      state.inventory.oakWood += 1;
      rewards.push('+1 Oak Wood');
      gainSkillXp('woodcutting', 5);

      if (tree.variant === 'apple-oak') {
        const appleCount = Math.random() < .3 ? 2 : 1;
        state.inventory.apples += appleCount;
        rewards.push(`+${appleCount} Apple${appleCount === 1 ? '' : 's'}`);
      } else {
        if (Math.random() < .13) {
          state.inventory.acorns += 1;
          rewards.push('+1 Acorn');
        }
        if (Math.random() < .018) {
          state.inventory.apples += 1;
          rewards.push('+1 Apple');
        }
      }
    }

    renderInventory();
    showLoot(tree.node, rewards.join(' · '));
  }

  function depleteTree(tree) {
    if (runtime.hoverResource?.node === tree.node) hideResourceHoverBar(tree.node);
    runtime.trees.delete(tree.id);
    runtime.occupiedSlots.delete(tree.slotIndex);
    tree.node.disabled = true;
    tree.node.classList.add('is-depleted');

    window.setTimeout(() => tree.node.remove(), 460);
    window.setTimeout(() => spawnTree(), randomInt(800, 1400));
  }

  function createTreeChips(tree) {
    for (let i = 0; i < 6; i += 1) {
      const chip = document.createElement('span');
      chip.className = 'tree-chip';
      chip.style.setProperty('--dx', `${randomInt(-76, 76)}px`);
      chip.style.setProperty('--dy', `${randomInt(-94, -36)}px`);
      chip.style.setProperty('--rot', `${randomInt(-240, 240)}deg`);
      tree.node.appendChild(chip);
      chip.addEventListener('animationend', () => chip.remove(), { once: true });
    }
  }

  function showMiningHoverBar(mineNode) {
    if (!mineNode?.node?.isConnected || mineNode.node.disabled) return;
    const remainingWork = (mineNode.units * mineNode.hitsPerUnit) - mineNode.hits;
    const health = clamp((remainingWork / mineNode.maxWork) * 100, 0, 100);
    setResourceHoverBar(
      mineNode.node,
      mineNode.type.name,
      `${mineNode.units} remaining`,
      health,
      `mine:${mineNode.id}`
    );
  }

  function updateMiningNode(mineNode) {
    if (!mineNode?.node?.isConnected) return;
    const remainingWork = (mineNode.units * mineNode.hitsPerUnit) - mineNode.hits;
    const health = clamp((remainingWork / mineNode.maxWork) * 100, 0, 100);

    if (runtime.hoverResource?.key === `mine:${mineNode.id}`) {
      ui.resourceHoverName.textContent = mineNode.type.name;
      ui.resourceHoverMeta.textContent = `${mineNode.units} remaining`;
      ui.resourceHoverFill.style.width = `${health}%`;
      positionResourceHoverBar(mineNode.node);
    }
  }

  function spawnInitialMineNodes() {
    const count = Math.min(5, mineSlots.length);
    for (let i = 0; i < count; i += 1) spawnMineNode();
  }

  function chooseMiningType() {
    const totalWeight = miningTypes.reduce((sum, type) => sum + type.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const type of miningTypes) {
      roll -= type.weight;
      if (roll < 0) return type;
    }

    return miningTypes[0];
  }

  function getFreeMineSlot() {
    const free = mineSlots
      .map((_, index) => index)
      .filter((index) => !runtime.occupiedMineSlots.has(index));
    return free.length ? free[randomInt(0, free.length - 1)] : null;
  }

  function spawnMineNode() {
    const slotIndex = getFreeMineSlot();
    if (slotIndex === null) return;

    runtime.occupiedMineSlots.add(slotIndex);
    const slot = mineSlots[slotIndex];
    const type = chooseMiningType();
    const units = randomInt(type.minUnits, type.maxUnits);
    const mineNode = {
      id: ++runtime.mineNodeId,
      slotIndex,
      type,
      units,
      initialUnits: units,
      hits: 0,
      hitsPerUnit: type.hitsPerUnit,
      maxWork: units * type.hitsPerUnit,
      alternate: false,
    };

    const node = document.createElement('button');
    node.type = 'button';
    node.className = `mine-node is-spawning mine-${type.key}`;
    node.style.left = `${slot.x}%`;
    node.style.top = `${slot.y}%`;
    node.style.setProperty('--mine-scale', slot.scale);
    node.style.setProperty('--ore-color', type.color);
    node.style.zIndex = String(Math.round(slot.y * 10));
    node.setAttribute('aria-label', `Mine ${type.name}`);
    node.innerHTML = `<span class="mine-node-shell">${oreNodeSvg(type.key)}</span>`;

    mineNode.node = node;
    runtime.mineNodes.set(mineNode.id, mineNode);
    ui.mineStage.appendChild(node);
    window.setTimeout(() => node.classList.remove('is-spawning'), 360);

    node.addEventListener('pointerenter', () => showMiningHoverBar(mineNode));
    node.addEventListener('pointermove', () => positionResourceHoverBar(node));
    node.addEventListener('pointerleave', () => hideResourceHoverBar(node));
    node.addEventListener('focus', () => showMiningHoverBar(mineNode));
    node.addEventListener('blur', () => hideResourceHoverBar(node));
    node.addEventListener('click', () => mineResourceNode(mineNode));
    updateMiningNode(mineNode);
  }

  function mineResourceNode(mineNode) {
    if (
      !runtime.mineNodes.has(mineNode.id) ||
      mineNode.node.disabled ||
      mineNode.node.classList.contains('is-spawning')
    ) return;

    mineNode.alternate = !mineNode.alternate;
    pulseNode(mineNode.node, mineNode.alternate ? 'is-hit-left' : 'is-hit-right');
    createRockChips(mineNode.node, mineNode.type.color);
    mineNode.hits += 1;

    if (mineNode.hits >= mineNode.hitsPerUnit) {
      mineNode.hits = 0;
      mineNode.units -= 1;
      awardMiningDrop(mineNode);
    }

    updateMiningNode(mineNode);
    if (mineNode.units <= 0) depleteMineNode(mineNode);
  }

  function awardMiningDrop(mineNode) {
    const { type } = mineNode;
    let lootText = '';

    if (type.key === 'geode') {
      const amethystDrop = Math.random() < .24;
      const inventoryKey = amethystDrop ? 'amethyst' : 'quartz';
      const itemName = amethystDrop ? 'Amethyst' : 'Quartz';
      state.inventory[inventoryKey] += 1;
      lootText = `+1 ${itemName}`;
    } else {
      state.inventory[type.key] += 1;
      lootText = `+1 ${type.itemName}`;
    }

    gainSkillXp('mining', type.xp);
    renderInventory();
    showLoot(mineNode.node, lootText);
  }

  function depleteMineNode(mineNode) {
    if (runtime.hoverResource?.node === mineNode.node) hideResourceHoverBar(mineNode.node);
    runtime.mineNodes.delete(mineNode.id);
    runtime.occupiedMineSlots.delete(mineNode.slotIndex);
    mineNode.node.disabled = true;
    mineNode.node.classList.add('is-depleted');

    window.setTimeout(() => mineNode.node.remove(), 460);
    window.setTimeout(() => spawnMineNode(), randomInt(900, 1500));
  }

  function createRockChips(node, color = '#858a85') {
    for (let i = 0; i < 7; i += 1) {
      const chip = document.createElement('span');
      chip.className = 'rock-chip';
      chip.style.background = color;
      chip.style.setProperty('--dx', `${randomInt(-78, 78)}px`);
      chip.style.setProperty('--dy', `${randomInt(-94, -35)}px`);
      chip.style.setProperty('--rot', `${randomInt(-240, 240)}deg`);
      node.appendChild(chip);
      chip.addEventListener('animationend', () => chip.remove(), { once: true });
    }
  }

  function pulseNode(node, className) {
    const other = className.includes('left') ? className.replace('left', 'right') : className.replace('right', 'left');
    node.classList.remove(other, className);
    void node.offsetWidth;
    node.classList.add(className);
    window.setTimeout(() => node.classList.remove(className), 200);
  }

  function showLoot(node, text) {
    const pop = document.createElement('span');
    pop.className = 'loot-pop';
    pop.textContent = text;
    node.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove(), { once: true });
  }

  function showToast(title, message, icon) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icon}</span>
      <span class="toast-copy"><strong>${title}</strong><span>${message}</span></span>
    `;
    ui.toastStack.appendChild(toast);
    window.setTimeout(() => toast.classList.add('is-leaving'), 2500);
    window.setTimeout(() => toast.remove(), 2800);
  }

  function treeName(tree) {
    if (tree.variant === 'birch') return `${tree.sizeLabel} Birch`;
    if (tree.variant === 'apple-oak') return `${tree.sizeLabel} Apple Oak`;
    return `${tree.sizeLabel} Oak`;
  }

  function oakSvg(withApples) {
    const apples = withApples ? `
      <g>
        <circle class="apple-fruit" cx="112" cy="146" r="10"/><circle class="apple-shine" cx="108" cy="142" r="3"/>
        <circle class="apple-fruit" cx="201" cy="109" r="10"/><circle class="apple-shine" cx="197" cy="105" r="3"/>
        <circle class="apple-fruit" cx="254" cy="164" r="10"/><circle class="apple-shine" cx="250" cy="160" r="3"/>
        <circle class="apple-fruit" cx="170" cy="208" r="10"/><circle class="apple-shine" cx="166" cy="204" r="3"/>
        <circle class="apple-fruit" cx="279" cy="225" r="9"/><circle class="apple-shine" cx="276" cy="222" r="2.7"/>
      </g>` : '';

    return `
      <svg class="tree-art" viewBox="0 0 360 520" aria-hidden="true">
        <ellipse fill="rgba(28,46,27,.17)" cx="180" cy="483" rx="88" ry="15"/>
        <path class="oak-trunk" d="M148 478C153 415 154 362 158 320C160 288 154 258 144 229C132 197 112 173 89 151C121 162 145 178 164 204C169 174 184 145 205 120C207 153 202 187 194 221C218 194 245 178 276 169C247 191 223 216 204 246C190 270 186 295 187 323C189 368 194 420 198 478Z"/>
        <path class="oak-trunk-light" d="M166 477C168 411 169 359 171 320C173 281 168 249 157 222C169 230 179 241 187 255C188 213 195 174 203 143C201 187 192 226 184 258C179 284 179 309 180 328C182 374 184 423 184 478Z"/>
        <path class="oak-bark" d="M165 401C158 365 162 332 160 303M186 390C191 348 186 316 190 280M173 288C169 269 171 250 178 229"/>
        <path class="oak-canopy" d="M57 236C31 216 25 181 42 153C28 122 39 87 67 72C72 39 100 19 132 24C150 2 187 -4 210 13C239 -1 276 13 285 44C317 48 337 75 331 104C354 121 359 155 343 178C360 204 350 239 324 254C321 286 293 307 263 304C244 329 208 336 181 320C154 338 117 329 103 302C78 302 58 281 57 257C49 251 49 243 57 236Z"/>
        <path class="oak-canopy-shadow" d="M48 168C63 204 96 226 132 226C112 244 98 263 103 302C78 302 58 281 57 257C49 251 49 243 57 236C31 216 25 181 42 153C43 158 45 163 48 168Z"/>
        <path class="oak-canopy-shadow" d="M211 315C244 306 269 284 280 257C299 264 314 262 324 254C321 286 293 307 263 304C244 329 208 336 181 320C192 319 202 317 211 315Z"/>
        <path class="oak-canopy-light" d="M91 85C112 47 154 35 188 48C163 57 145 76 136 101C119 92 104 87 91 85Z"/>
        <path class="oak-canopy-light" d="M204 44C231 21 266 31 280 57C252 52 229 60 211 78C211 65 209 54 204 44Z"/>
        ${apples}
      </svg>`;
  }

  function birchSvg() {
    return `
      <svg class="tree-art" viewBox="0 0 360 520" aria-hidden="true">
        <ellipse fill="rgba(28,46,27,.16)" cx="180" cy="483" rx="80" ry="14"/>
        <path class="birch-trunk" d="M156 478C160 419 160 371 160 328C160 288 155 250 149 218C145 196 135 174 120 151C143 166 158 181 169 203C171 169 180 135 194 104C198 144 195 183 188 221C204 197 226 181 252 171C228 193 210 218 197 249C187 273 184 297 185 328C187 373 190 422 194 478Z"/>
        <path class="birch-trunk-shadow" d="M178 478C177 412 176 363 177 324C178 279 174 247 166 221C173 229 180 239 186 251C187 211 189 170 193 130C196 173 192 215 185 251C180 281 181 319 182 348C183 394 185 438 186 478Z"/>
        <rect class="birch-mark" x="158" y="391" width="26" height="7" rx="3" transform="rotate(-6 171 394)"/>
        <rect class="birch-mark" x="164" y="345" width="18" height="6" rx="3" transform="rotate(8 173 348)"/>
        <rect class="birch-mark" x="151" y="299" width="29" height="7" rx="3" transform="rotate(-5 165 302)"/>
        <rect class="birch-mark" x="174" y="252" width="18" height="6" rx="3" transform="rotate(7 183 255)"/>
        <rect class="birch-mark" x="159" y="215" width="23" height="6" rx="3" transform="rotate(-8 170 218)"/>
        <path class="birch-canopy" d="M63 240C39 219 37 184 55 160C40 131 52 99 77 84C76 53 100 30 128 31C146 7 181 1 206 18C231 4 264 14 278 40C307 41 329 63 328 91C352 104 361 135 347 158C363 181 357 215 334 232C337 260 313 285 284 286C267 311 233 320 207 307C181 328 144 322 126 297C97 303 68 282 65 253C60 249 59 244 63 240Z"/>
        <path class="birch-canopy-shadow" d="M55 160C64 192 94 215 126 219C109 237 103 261 126 297C97 303 68 282 65 253C60 249 59 244 63 240C39 219 37 184 55 160Z"/>
        <path class="birch-canopy-light" d="M95 84C114 51 151 41 181 51C158 62 144 79 137 102C121 93 107 87 95 84Z"/>
      </svg>`;
  }

  function oreNodeSvg(typeKey) {
    const geodeCrystals = typeKey === 'geode' ? `
      <path d="M129 142L145 100L160 142Z" fill="#e3dcf1" opacity=".92"/>
      <path d="M155 145L174 91L189 145Z" fill="#a88ac8" opacity=".9"/>
      <path d="M181 148L197 111L209 148Z" fill="#d8c8ea" opacity=".85"/>` : '';

    return `
      <svg class="ore-node-art" viewBox="0 0 320 240" aria-hidden="true">
        <ellipse cx="160" cy="214" rx="108" ry="18" fill="rgba(0,0,0,.22)"/>
        <path d="M50 190L69 115L111 79L164 62L221 79L270 127L277 190L246 211H79Z" fill="#666d69"/>
        <path d="M69 115L111 79L142 91L116 134L50 190Z" fill="#858b87" opacity=".72"/>
        <path d="M164 62L221 79L198 120L142 91Z" fill="#929792" opacity=".58"/>
        <path d="M221 79L270 127L233 151L198 120Z" fill="#505753" opacity=".8"/>
        <path d="M116 134L142 91L198 120L174 164Z" fill="#747b76"/>
        <path d="M174 164L198 120L233 151L246 211L188 202Z" fill="#555c58"/>
        <path d="M116 134L174 164L188 202L79 211L50 190Z" fill="#636a66"/>
        <g class="ore-veins" fill="none" stroke="var(--ore-color)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M93 167L125 145L151 159L178 128"/>
          <path d="M192 174L216 153L238 163"/>
          <path d="M145 105L164 91L182 112"/>
        </g>
        ${geodeCrystals}
      </svg>`;
  }

  function mapSvg() {
    return `
      <svg viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="lake" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#91c8cc"/>
            <stop offset="1" stop-color="#5b98a1"/>
          </linearGradient>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#afc88a"/>
            <stop offset="1" stop-color="#759469"/>
          </linearGradient>
          <filter id="soft"><feGaussianBlur stdDeviation="1.5"/></filter>
        </defs>
        <rect width="1000" height="650" fill="url(#land)"/>
        <g opacity=".28" fill="none" stroke="#526f54" stroke-width="2">
          <path d="M-20 98C120 48 225 73 330 122S553 197 709 128S910 58 1030 95"/>
          <path d="M-40 145C126 95 259 125 364 172S587 236 744 171S921 111 1040 141"/>
          <path d="M-20 523C111 469 239 482 343 528S586 597 752 528S916 470 1030 510"/>
          <path d="M26 570C163 526 273 541 373 581S594 627 725 586S911 531 1008 560"/>
        </g>
        <path d="M295 268C351 221 432 216 494 245C557 274 636 264 682 310C728 356 694 425 628 449C561 474 489 442 422 462C354 481 279 455 259 396C240 338 249 307 295 268Z" fill="url(#lake)"/>
        <path d="M322 304C388 267 436 275 483 295" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="6" stroke-linecap="round"/>
        <path d="M520 425C570 414 610 391 630 365" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="5" stroke-linecap="round"/>
        <g fill="#3f7147" opacity=".9">
          ${forestMapTrees()}
        </g>
        <g fill="#726e63" opacity=".86">
          <path d="M708 154L773 54L836 157Z"/><path d="M773 54L798 112L753 113Z" fill="#d7d4c7" opacity=".7"/>
          <path d="M786 181L866 73L945 184Z"/><path d="M866 73L892 124L839 125Z" fill="#d7d4c7" opacity=".65"/>
          <path d="M646 194L706 103L764 196Z"/>
        </g>
        <path d="M227 225C342 219 438 239 523 287C604 334 678 322 795 278" fill="none" stroke="#806b4d" stroke-width="7" stroke-linecap="round" stroke-dasharray="4 14" opacity=".52"/>
        <path d="M485 468C571 502 677 491 782 431" fill="none" stroke="#806b4d" stroke-width="6" stroke-linecap="round" stroke-dasharray="4 14" opacity=".42"/>
        <path d="M632 447C694 470 741 487 820 503" fill="none" stroke="#806b4d" stroke-width="6" stroke-linecap="round" stroke-dasharray="4 14" opacity=".44"/>
        <g transform="translate(754 444)" opacity=".9">
          <rect x="0" y="30" width="44" height="34" rx="3" fill="#b88d5e"/>
          <path d="M-5 31L22 9L49 31Z" fill="#7a4e3a"/>
          <rect x="58" y="21" width="50" height="40" rx="3" fill="#c4a074"/>
          <path d="M53 23L83 -2L113 23Z" fill="#685048"/>
          <rect x="116" y="34" width="40" height="30" rx="3" fill="#9a7956"/>
          <path d="M112 35L136 15L160 35Z" fill="#5a4b42"/>
          <rect x="72" y="43" width="11" height="18" fill="#684631"/>
        </g>
        <g opacity=".22" filter="url(#soft)" fill="#223f2a">
          <ellipse cx="184" cy="222" rx="126" ry="53"/><ellipse cx="858" cy="196" rx="112" ry="46"/>
        </g>
      </svg>`;
  }

  function forestMapTrees() {
    const points = [
      [95,150],[130,192],[167,136],[204,176],[238,126],[112,258],[160,286],[215,250],
      [255,209],[89,342],[145,367],[215,340],[278,330],[160,444],[232,427],[93,465],
      [348,109],[391,137],[427,98],[466,132],[525,110],[575,148]
    ];
    return points.map(([x,y], i) => `<path d="M${x} ${y+40}L${x+18} ${y+7}L${x+10} ${y+9}L${x+25} ${y-18}L${x+40} ${y+9}L${x+32} ${y+7}L${x+50} ${y+40}Z" opacity="${.62 + (i%4)*.08}"/>`).join('');
  }

  function chevronSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9.5L12 15l5.5-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function bagSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.5h11l1.2 11H5.3l1.2-11Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 9V7a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
})();

(() => {
  const SAVE_KEY = 'clicklands-online-save-v2';
  const ENTER_SOUND = 'assets/sfx/CL-enter.wav';
  const LOGO = 'assets/images/CL-logo.png';
  const PROGRESSION_MODEL = 3;
  const OVERALL_XP_PER_SKILL_LEVEL = 25;

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
    },
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

  const state = loadState();
  const runtime = {
    trees: new Map(),
    occupiedSlots: new Set(),
    treeId: 0,
    rock: null,
    hoverNode: null,
    entered: false,
  };

  mountApp();
  const ui = cacheUI();
  bindEvents();
  applyTheme();
  renderNavigation();
  renderHUD();
  renderInventory();
  renderDrawers();
  spawnInitialForest();
  spawnRock();
  saveState();

  function loadState() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    } catch (error) {
      saved = {};
    }

    let oldTheme = null;
    let oldLocation = null;
    try {
      oldTheme = localStorage.getItem('clicklands-theme') || localStorage.getItem('cliquest-theme');
      oldLocation = localStorage.getItem('clicklands-location') || localStorage.getItem('cliquest-location');
    } catch (error) {
    }

    const merged = {
      ...defaultState,
      ...saved,
      inventory: { ...defaultState.inventory, ...(saved.inventory || {}) },
      overall: { ...defaultState.overall, ...(saved.overall || {}) },
      skills: {
        woodcutting: { ...defaultState.skills.woodcutting, ...(saved.skills?.woodcutting || {}) },
        mining: { ...defaultState.skills.mining, ...(saved.skills?.mining || {}) },
      },
    };

    if (!saved.theme && oldTheme === 'dark') merged.theme = 'dark';
    if (!saved.location && ['lakeside', 'forest', 'mines'].includes(oldLocation)) merged.location = oldLocation;

    if (saved.progressionModel !== PROGRESSION_MODEL) {
      const earnedSkillLevels =
        Math.max(0, merged.skills.woodcutting.level - 1) +
        Math.max(0, merged.skills.mining.level - 1);
      merged.overall = progressFromTotalXp(earnedSkillLevels * OVERALL_XP_PER_SKILL_LEVEL);
    }

    merged.inventoryOpen = false;
    merged.skillsOpen = false;
    return merged;
  }

  function saveState() {
    const save = {
      theme: state.theme,
      location: state.location,
      lakesideExpanded: state.lakesideExpanded,
      inventoryTab: state.inventoryTab,
      username: state.username,
      progressionModel: PROGRESSION_MODEL,
      inventory: state.inventory,
      overall: state.overall,
      skills: state.skills,
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (error) {
    }
  }

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
        </section>
        ${inventoryMarkup()}
        <div class="toast-stack" data-toasts aria-live="polite"></div>
      </main>

      <div class="resource-hover-bar" data-resource-hover-bar aria-hidden="true">
        <div class="resource-hover-line">
          <span class="resource-hover-name" data-resource-hover-name></span>
          <span class="resource-hover-meta" data-resource-hover-meta></span>
        </div>
        <span class="progress-track"><span class="progress-fill" data-resource-hover-fill></span></span>
      </div>
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
            <span><strong>Mines</strong><small>Mine stone deposits</small></span>
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
        <div data-forest-stage></div>
      </div>
    `;
  }

  function minesMarkup() {
    return `
      <div class="world-view mines-view" data-view="mines">
        <div class="cave-wall" aria-hidden="true"></div>
        <div class="cave-mouth" aria-hidden="true"></div>
        <div class="mine-track" aria-hidden="true"></div>
        <div data-rock-host></div>
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
    const slot = (cls, icon, name) => `
      <div class="gear-slot ${cls}">
        <span class="gear-slot-icon" aria-hidden="true">${icon}</span>
        <span><span class="gear-name">${name}</span><span class="gear-state">Empty</span></span>
      </div>`;

    return `
      <div class="equipment-layout">
        <div class="equipment-figure" aria-hidden="true">
          <svg viewBox="0 0 100 220">
            <circle class="equipment-figure-shape" cx="50" cy="28" r="20"/>
            <path class="equipment-figure-shape" d="M29 58C35 49 42 46 50 46C58 46 65 49 71 58L79 116L66 128L64 202H51L50 139L49 202H36L34 128L21 116Z"/>
          </svg>
        </div>
        ${slot('head', '◈', 'Head')}
        ${slot('main', '⚒', 'Main Hand')}
        ${slot('off', '◇', 'Off Hand')}
        ${slot('body', '⬡', 'Body')}
        ${slot('legs', 'Ⅱ', 'Legs')}
        ${slot('accessory', '✦', 'Accessory')}
        <div class="gear-note">Equipment slots are ready for future gear.</div>
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
      rockHost: document.querySelector('[data-rock-host]'),
      toastStack: document.querySelector('[data-toasts]'),
      mapCard: document.querySelector('[data-map-card]'),
      resourceHoverBar: document.querySelector('[data-resource-hover-bar]'),
      resourceHoverName: document.querySelector('[data-resource-hover-name]'),
      resourceHoverMeta: document.querySelector('[data-resource-hover-meta]'),
      resourceHoverFill: document.querySelector('[data-resource-hover-fill]'),
    };
  }

  function bindEvents() {
    const enterSound = new Audio(ENTER_SOUND);
    enterSound.preload = 'auto';
    enterSound.volume = .35;

    window.addEventListener('resize', () => {
      if (runtime.hoverNode?.isConnected) positionResourceBar(runtime.hoverNode);
    });

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

      const tab = event.target.closest('[data-inventory-tab]');
      if (tab) {
        state.inventoryTab = tab.dataset.inventoryTab === 'equipment' ? 'equipment' : 'items';
        renderInventory();
        saveState();
      }
    });

    ui.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      saveState();
    });

    ui.areaToggle.addEventListener('click', () => {
      state.lakesideExpanded = !state.lakesideExpanded;
      renderNavigation();
      saveState();
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
    if (!['lakeside', 'forest', 'mines'].includes(location)) return;
    state.location = location;
    state.inventoryOpen = false;
    renderNavigation();
    renderDrawers();
    saveState();
  }

  function renderHUD() {
    ui.username.textContent = state.username;
    updateProgressUI(state.overall, ui.overallLevel, ui.overallXp, ui.overallFill, true);

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
    xpNode.textContent = `${progress.xp} / ${needed} XP`;

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

    const items = [
      { key: 'oakWood', name: 'Oak Wood', icon: '<span class="mini-log"></span>' },
      { key: 'birchWood', name: 'Birch Wood', icon: '<span class="mini-birch"></span>' },
      { key: 'apples', name: 'Apple', icon: '<span aria-hidden="true">🍎</span>' },
      { key: 'acorns', name: 'Acorn', icon: '<span aria-hidden="true">🌰</span>' },
      { key: 'stone', name: 'Stone', icon: '<span aria-hidden="true">◆</span>' },
    ].filter((item) => state.inventory[item.key] > 0);

    ui.itemPane.innerHTML = items.length
      ? `<div class="item-list">${items.map((item) => `
          <div class="item-row">
            <span class="item-icon">${item.icon}</span>
            <span class="item-name">${item.name}</span>
            <span class="item-count">${state.inventory[item.key]}</span>
          </div>`).join('')}</div>`
      : '<div class="item-empty">No items yet.</div>';
  }

  function xpNeeded(level) {
    return 100 + ((level - 1) * 25);
  }

  function gainSkillXp(skill, amount) {
    const skillData = state.skills[skill];
    const skillLevelsGained = addXp(skillData, amount);

    if (skillLevelsGained > 0) {
      const oldOverallLevel = state.overall.level;
      addXp(state.overall, skillLevelsGained * OVERALL_XP_PER_SKILL_LEVEL);

      showToast(
        'Level up',
        `${capitalize(skill)} reached level ${skillData.level}. +${skillLevelsGained * OVERALL_XP_PER_SKILL_LEVEL} Overall XP.`,
        skill === 'woodcutting' ? '🪓' : '⛏'
      );

      if (state.overall.level > oldOverallLevel) {
        showToast('Overall level up', `Overall Level ${state.overall.level}`, '✦');
      }
    }

    renderHUD();
    saveState();
  }

  function addXp(progress, amount) {
    const startingLevel = progress.level;
    progress.xp += amount;
    let needed = xpNeeded(progress.level);

    while (progress.xp >= needed) {
      progress.xp -= needed;
      progress.level += 1;
      needed = xpNeeded(progress.level);
    }

    return progress.level - startingLevel;
  }

  function progressFromTotalXp(totalXp) {
    const progress = { level: 1, xp: Math.max(0, totalXp) };
    let needed = xpNeeded(progress.level);

    while (progress.xp >= needed) {
      progress.xp -= needed;
      progress.level += 1;
      needed = xpNeeded(progress.level);
    }

    return progress;
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
    node.className = `tree-node ${tree.variant === 'birch' ? 'birch' : 'oak'}`;
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

    node.addEventListener('pointerenter', () => showTreeResourceBar(tree));
    node.addEventListener('pointerleave', () => hideResourceBar(node));
    node.addEventListener('focus', () => showTreeResourceBar(tree));
    node.addEventListener('blur', () => hideResourceBar(node));
    node.addEventListener('click', () => chopTree(tree));
    return node;
  }

  function setResourceBarContent(name, meta, percent) {
    ui.resourceHoverName.textContent = name;
    ui.resourceHoverMeta.textContent = meta;
    ui.resourceHoverFill.style.width = `${clamp(percent, 0, 100)}%`;
  }

  function positionResourceBar(node) {
    const bar = ui.resourceHoverBar;
    if (!node?.isConnected || !bar) return;

    const nodeRect = node.getBoundingClientRect();
    const hudBottom = document.querySelector('.top-hud')?.getBoundingClientRect().bottom ?? 86;
    const safeTop = hudBottom + 10;
    const viewportPadding = 10;

    requestAnimationFrame(() => {
      if (runtime.hoverNode !== node || !node.isConnected) return;

      const barRect = bar.getBoundingClientRect();
      let left = nodeRect.left + (nodeRect.width / 2) - (barRect.width / 2);
      let top = nodeRect.top - barRect.height - 10;

      left = clamp(left, viewportPadding, window.innerWidth - barRect.width - viewportPadding);
      top = Math.max(safeTop, top);

      if (top + barRect.height > window.innerHeight - viewportPadding) {
        top = window.innerHeight - barRect.height - viewportPadding;
      }

      bar.style.left = `${Math.round(left)}px`;
      bar.style.top = `${Math.round(top)}px`;
    });
  }

  function showResourceBar(node, name, meta, percent) {
    runtime.hoverNode = node;
    setResourceBarContent(name, meta, percent);
    ui.resourceHoverBar.setAttribute('aria-hidden', 'false');
    ui.resourceHoverBar.classList.add('is-visible');
    positionResourceBar(node);
  }

  function hideResourceBar(node) {
    if (runtime.hoverNode !== node) return;
    runtime.hoverNode = null;
    ui.resourceHoverBar.classList.remove('is-visible');
    ui.resourceHoverBar.setAttribute('aria-hidden', 'true');
  }

  function showTreeResourceBar(tree) {
    if (!tree?.node?.isConnected) return;
    const remainingWork = (tree.logs * tree.hitsPerLog) - tree.hits;
    const health = clamp((remainingWork / tree.maxWork) * 100, 0, 100);
    showResourceBar(tree.node, treeName(tree), `${tree.logs} log${tree.logs === 1 ? '' : 's'}`, health);
  }

  function updateTreeNode(tree) {
    if (!tree.node?.isConnected) return;
    if (runtime.hoverNode === tree.node) showTreeResourceBar(tree);
  }

  function chopTree(tree) {
    if (!runtime.trees.has(tree.id) || tree.node.disabled) return;

    tree.alternate = !tree.alternate;
    pulseNode(tree.node, tree.alternate ? 'is-hit-left' : 'is-hit-right');
    createTreeChips(tree);

    tree.hits += 1;
    if (tree.hits >= tree.hitsPerLog) {
      tree.hits = 0;
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
    saveState();
    showLoot(tree.node, rewards.join(' · '));
  }

  function depleteTree(tree) {
    hideResourceBar(tree.node);
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

  function spawnRock() {
    const stoneCount = randomInt(8, 14);
    const rock = {
      stones: stoneCount,
      initialStones: stoneCount,
      hits: 0,
      hitsPerStone: 4,
      maxWork: stoneCount * 4,
      alternate: false,
    };
    runtime.rock = rock;

    ui.rockHost.innerHTML = `
      <button class="rock-node" type="button" data-rock aria-label="Mine stone deposit">
        <span class="rock-shell">${rockSvg()}</span>
      </button>
    `;

    rock.node = ui.rockHost.querySelector('[data-rock]');
    rock.node.addEventListener('pointerenter', showRockResourceBar);
    rock.node.addEventListener('pointerleave', () => hideResourceBar(rock.node));
    rock.node.addEventListener('focus', showRockResourceBar);
    rock.node.addEventListener('blur', () => hideResourceBar(rock.node));
    rock.node.addEventListener('click', mineRock);
    updateRockNode();
  }

  function mineRock() {
    const rock = runtime.rock;
    if (!rock || rock.node.disabled) return;

    rock.alternate = !rock.alternate;
    pulseNode(rock.node, rock.alternate ? 'is-hit-left' : 'is-hit-right');
    createRockChips(rock.node);
    rock.hits += 1;

    if (rock.hits >= rock.hitsPerStone) {
      rock.hits = 0;
      rock.stones -= 1;
      state.inventory.stone += 1;
      gainSkillXp('mining', 5);
      renderInventory();
      saveState();
      showLoot(rock.node, '+1 Stone');
    }

    updateRockNode();
    if (rock.stones <= 0) depleteRock();
  }

  function showRockResourceBar() {
    const rock = runtime.rock;
    if (!rock?.node?.isConnected) return;
    const remainingWork = (rock.stones * rock.hitsPerStone) - rock.hits;
    const health = clamp((remainingWork / rock.maxWork) * 100, 0, 100);
    showResourceBar(rock.node, 'Stone Deposit', `${rock.stones} stone`, health);
  }

  function updateRockNode() {
    const rock = runtime.rock;
    if (!rock?.node?.isConnected) return;
    if (runtime.hoverNode === rock.node) showRockResourceBar();
  }

  function depleteRock() {
    const rock = runtime.rock;
    hideResourceBar(rock.node);
    rock.node.disabled = true;
    rock.node.classList.add('is-depleted');
    window.setTimeout(() => {
      ui.rockHost.innerHTML = '';
      runtime.rock = null;
    }, 480);
    window.setTimeout(() => spawnRock(), 1300);
  }

  function createRockChips(node) {
    for (let i = 0; i < 7; i += 1) {
      const chip = document.createElement('span');
      chip.className = 'rock-chip';
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

  function rockSvg() {
    return `
      <svg class="rock-art" viewBox="0 0 320 240" aria-hidden="true">
        <ellipse cx="160" cy="214" rx="108" ry="18" fill="rgba(0,0,0,.18)"/>
        <path d="M50 190L69 115L111 79L164 62L221 79L270 127L277 190L246 211H79Z" fill="#777e79"/>
        <path d="M69 115L111 79L142 91L116 134L50 190Z" fill="#939894" opacity=".65"/>
        <path d="M164 62L221 79L198 120L142 91Z" fill="#a0a49f" opacity=".52"/>
        <path d="M221 79L270 127L233 151L198 120Z" fill="#626965" opacity=".72"/>
        <path d="M116 134L142 91L198 120L174 164Z" fill="#858c87"/>
        <path d="M174 164L198 120L233 151L246 211L188 202Z" fill="#676e6a"/>
        <path d="M116 134L174 164L188 202L79 211L50 190Z" fill="#737a75"/>
        <path d="M100 167L123 150M199 174L222 160M154 111L165 94" stroke="rgba(47,53,49,.5)" stroke-width="5" stroke-linecap="round"/>
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

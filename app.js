import {
  BASIC_AXE_PRICE, ENTER_SOUND, EQUIPMENT_SLOT_LABELS, GEAR_ITEMS,
  LUMBER_SELL_PRICES, OVERALL_XP_PER_SKILL_LEVEL, SAWMILL_RECIPES,
  SLIME_RANGER_XP, SLIME_SWORDSMAN_XP, SLIME_WIZARD_XP, THEME_KEY,
  VILLAGE_SHOPS, defaultState, forageSlots, forageTypes, mineSlots, miningTypes,
  slimeSlots, treeSizes, treeSlots,
} from './src/data/game-data.js';
import { createGameState, createRuntime } from './src/core/state.js';
import { addXp, formatXp, xpNeeded } from './src/core/progression.js';
import { capitalize, clamp, randomInt } from './src/core/utils.js';
import { mountApp } from './src/ui/templates.js';
import { cacheUI } from './src/ui/dom.js';
import { coinBreakdown, formatCoinPrice } from './src/core/economy.js';
import { pointInsideRect, segmentIntersectsRect } from './src/core/geometry.js';
import { analyzeStaffCircle } from './src/systems/spell-recognition.js';
import { birchSvg, oakSvg, oreNodeSvg } from './src/ui/graphics.js';

(() => {
  const state = createGameState(defaultState);
  state.theme = loadThemePreference();
  const runtime = createRuntime();

  mountApp();
  const ui = cacheUI();
  bindEvents();
  applyTheme();
  renderDevTools();
  renderNavigation();
  renderHUD();
  renderInventory();
  renderDrawers();
  renderLumberShop();
  renderVillageShop();
  updateHudSafeZone();
  initHudSafeZoneObserver();
  spawnInitialForest();
  spawnInitialMineNodes();
  startForageSpawner();
  startSlimeSpawner();

  function updateHudSafeZone() {
    if (!ui?.worldHost || !ui?.characterBar || !ui?.walletHud) return;

    const hostRect = ui.worldHost.getBoundingClientRect();
    const characterRect = ui.characterBar.getBoundingClientRect();
    const walletRect = ui.walletHud.getBoundingClientRect();

    const hudBottom = Math.max(characterRect.bottom, walletRect.bottom);
    const measuredSafeTop = Math.ceil(hudBottom - hostRect.top + 12);
    const safeTop = Math.max(88, measuredSafeTop);

    document.documentElement.style.setProperty('--hud-safe-top', `${safeTop}px`);
  }

  function initHudSafeZoneObserver() {
    window.requestAnimationFrame(updateHudSafeZone);

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => updateHudSafeZone());
      observer.observe(ui.characterBar);
      observer.observe(ui.walletHud);
      observer.observe(ui.worldHost);
      runtime.hudSafeZoneObserver = observer;
    }
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

      if (event.target.closest('[data-combat-defeat-return]')) {
        exitCombat();
        return;
      }

      if (event.target.closest('[data-exit-combat]')) {
        exitCombat();
        return;
      }

      const building = event.target.closest('[data-town-building]');
      if (building) {
        const destination = {
          lumbermill: 'lumbermill',
          blacksmith: 'blacksmith',
          'strange-shack': 'strange-shack',
          farmer: 'farmer',
          craftsman: 'craftsman',
          'foragers-hut': 'foragers-hut',
        }[building.dataset.townBuilding];
        if (destination) setLocation(destination);
        return;
      }

      const villageNpc = event.target.closest('[data-building-npc]');
      if (villageNpc) {
        const shopKey = villageNpc.dataset.npcShop;
        if (shopKey && VILLAGE_SHOPS[shopKey]) {
          runtime.villageShopOpen = shopKey;
          renderVillageShop();
        } else {
          showToast(villageNpc.dataset.npcTitle, villageNpc.dataset.npcNote, '⌂');
        }
        return;
      }

      if (event.target.closest('[data-village-shop-close]')) {
        runtime.villageShopOpen = null;
        renderVillageShop();
        return;
      }

      const villageSellButton = event.target.closest('[data-village-sell-item]');
      if (villageSellButton) {
        sellVillageShopItem(
          villageSellButton.dataset.villageSellItem,
          villageSellButton.dataset.sellMode === 'all'
        );
        return;
      }

      const villageBuyButton = event.target.closest('[data-village-buy-item]');
      if (villageBuyButton) {
        buyVillageShopItem(villageBuyButton.dataset.villageBuyItem);
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

      const equipmentSlot = event.target.closest('[data-equipment-slot]');
      if (equipmentSlot) {
        toggleEquipmentSlot(equipmentSlot.dataset.equipmentSlot);
        return;
      }

      const xpMenuTab = event.target.closest('[data-xp-menu]');
      if (xpMenuTab) {
        state.xpMenu = xpMenuTab.dataset.xpMenu === 'classes' ? 'classes' : 'skills';
        renderXpMenu();
        return;
      }

      const tab = event.target.closest('[data-inventory-tab]');
      if (tab) {
        state.inventoryTab = ['items', 'gear', 'equipment'].includes(tab.dataset.inventoryTab)
          ? tab.dataset.inventoryTab
          : 'items';
        renderInventory();
        return;
      }
    });

    ui.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveThemePreference(state.theme);
      applyTheme();
    });

    ui.devToolsToggle?.addEventListener('click', () => {
      state.devToolsOpen = !state.devToolsOpen;
      renderDevTools();
    });

    ui.freeShopsToggle?.addEventListener('click', () => {
      state.freeShops = !state.freeShops;
      renderDevTools();
      renderLumberShop();
      renderVillageShop();
      showToast(
        'Dev Tools',
        state.freeShops ? 'Free Shops enabled.' : 'Free Shops disabled.',
        '⚙'
      );
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

    ui.combatStage?.addEventListener('pointerdown', beginCombatInput);
    ui.combatStage?.addEventListener('pointermove', continueCombatInput);
    ui.combatStage?.addEventListener('pointerup', (event) => endCombatInput(event, true));
    ui.combatStage?.addEventListener('pointercancel', (event) => endCombatInput(event, false));
    ui.combatStage?.addEventListener('lostpointercapture', (event) => endCombatInput(event, false));

    document.addEventListener('dragstart', (event) => {
      const item = event.target.closest('[data-drag-item]');
      if (!item) return;
      const key = item.dataset.dragItem;
      if (!SAWMILL_RECIPES[key] || state.inventory[key] <= 0) {
        event.preventDefault();
        return;
      }
      const row = item.closest('.item-row');
      const amountInput = row?.querySelector(`[data-stack-amount="${key}"]`);
      const amount = clamp(parseInt(amountInput?.value || '1', 10) || 1, 1, state.inventory[key]);
      runtime.draggedItem = { key, amount };
      item.classList.add('is-dragging');
      document.body.classList.add('is-dragging-log');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ key, amount }));
    });

    document.addEventListener('dragend', (event) => {
      event.target.closest('[data-drag-item]')?.classList.remove('is-dragging');
      runtime.draggedItem = null;
      document.body.classList.remove('is-dragging-log');
      ui.sawmillDrop?.classList.remove('is-dragover');
    });

    ui.sawmillDrop?.addEventListener('dragover', (event) => {
      if (!runtime.draggedItem || !SAWMILL_RECIPES[runtime.draggedItem.key]) return;
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
      let payload = runtime.draggedItem;
      const raw = event.dataTransfer.getData('text/plain');
      if (raw) {
        try { payload = JSON.parse(raw); } catch (error) { payload = { key: raw, amount: 1 }; }
      }
      runtime.draggedItem = null;
      document.body.classList.remove('is-dragging-log');
      if (payload?.key) startSawmill(payload.key, payload.amount || 1);
    });

    document.addEventListener('input', (event) => {
      const input = event.target.closest('[data-stack-amount]');
      if (!input) return;
      const key = input.dataset.stackAmount;
      const max = Math.max(1, state.inventory[key] || 1);
      input.value = String(clamp(parseInt(input.value || '1', 10) || 1, 1, max));
    });

    window.addEventListener('resize', () => {
      updateHudSafeZone();
      if (runtime.hoverResource?.node) positionResourceHoverBar(runtime.hoverResource.node);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (runtime.villageShopOpen) {
        runtime.villageShopOpen = null;
        renderVillageShop();
      } else if (runtime.lumberShopOpen) {
        runtime.lumberShopOpen = false;
        renderLumberShop();
      } else if (state.inventoryOpen) {
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

  function renderDevTools() {
    if (!ui?.devToolsToggle || !ui?.freeShopsToggle) return;

    ui.devTools?.classList.toggle('is-open', state.devToolsOpen);
    ui.devToolsToggle.setAttribute('aria-expanded', String(state.devToolsOpen));
    ui.freeShopsToggle.classList.toggle('is-active', state.freeShops);
    ui.freeShopsToggle.setAttribute('aria-pressed', String(state.freeShops));
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
    renderCombat();
  }

  function setLocation(location) {
    if (!['lakeside', 'forest', 'mines', 'town', 'lumbermill', 'blacksmith', 'strange-shack', 'farmer', 'craftsman', 'foragers-hut'].includes(location)) return;
    hideResourceHoverBar();
    runtime.combat = null;
    state.location = location;
    state.inventoryOpen = false;
    if (location !== 'lumbermill') runtime.lumberShopOpen = false;
    runtime.villageShopOpen = null;
    renderNavigation();
    renderLumberShop();
    renderVillageShop();
    renderDrawers();
    if (location === 'forest' && runtime.forageNodes.size < 2) {
      scheduleNextForageSpawn(randomInt(1800, 6200));
    }
    if (location === 'forest' && runtime.slimeNodes.size === 0) {
      scheduleNextSlimeSpawn(randomInt(7000, 16000));
    }
    }


  function enterCombatWithSlime(slime) {
    if (!slime || !runtime.slimeNodes.has(slime.id)) return;

    if (slime.expireTimer) window.clearTimeout(slime.expireTimer);
    runtime.slimeNodes.delete(slime.id);
    runtime.occupiedSlimeSlots.delete(slime.slotIndex);

    if (slime.node?.isConnected) {
      slime.node.disabled = true;
      slime.node.classList.add('is-entering-combat');
      window.setTimeout(() => slime.node.remove(), 180);
    }

    runtime.combatReturnLocation = 'forest';
    runtime.combat = {
      type: 'slime',
      name: 'Slime',
      health: 30,
      maxHealth: 30,
      defeated: false,
      loot: [],
    };
    runtime.swordGesture = null;
    cancelStaffGesture(null, true);
    runtime.staffSpellInFlight = false;
    cancelHammerTiming(null, true);
    runtime.hammerSlamInFlight = false;
    ui.combatEnemyTarget?.classList.remove('is-defeated', 'is-sword-hit', 'is-bow-hit', 'is-fireball-hit', 'is-hammer-hit');

    state.inventoryOpen = false;
    runtime.lumberShopOpen = false;
    runtime.villageShopOpen = null;
    state.location = 'combat';

    renderNavigation();
    renderDrawers();
    renderLumberShop();
    renderVillageShop();
  }

  function exitCombat() {
    const returnLocation = runtime.combatReturnLocation || 'forest';
    runtime.swordGesture = null;
    cancelBowCharge();
    runtime.bowShotInFlight = false;
    cancelStaffGesture(null, true);
    runtime.staffSpellInFlight = false;
    cancelHammerTiming(null, true);
    runtime.hammerSlamInFlight = false;
    runtime.combat = null;
    setLocation(returnLocation);
  }

  function renderCombat() {
    if (!ui?.combatEnemyName) return;

    const combat = runtime.combat;
    const enemyName = combat?.name || 'Slime';
    const enemyHealth = combat?.health ?? 30;
    const enemyMaxHealth = combat?.maxHealth ?? 30;
    const enemyPercent = clamp((enemyHealth / enemyMaxHealth) * 100, 0, 100);

    const playerHealth = state.health.current;
    const playerMaxHealth = state.health.max;
    const playerPercent = clamp((playerHealth / playerMaxHealth) * 100, 0, 100);

    ui.combatEnemyTitle.textContent = enemyName;
    ui.combatEnemyName.textContent = enemyName;
    ui.combatEnemyHealth.textContent = `${enemyHealth} / ${enemyMaxHealth}`;
    ui.combatEnemyFill.style.width = `${enemyPercent}%`;

    ui.combatPlayerHealth.textContent = `${playerHealth} / ${playerMaxHealth}`;
    ui.combatPlayerFill.style.width = `${playerPercent}%`;

    const mainKey = state.equipment['main-hand'];
    const offKey = state.equipment['off-hand'];
    const mainGear = mainKey ? GEAR_ITEMS[mainKey] : null;
    const offGear = offKey ? GEAR_ITEMS[offKey] : null;

    if (ui.combatMainHand) ui.combatMainHand.textContent = mainGear?.shortName || mainGear?.name || 'Empty';
    if (ui.combatOffHand) ui.combatOffHand.textContent = offGear?.shortName || offGear?.name || 'Empty';
    if (ui.combatMainIcon) ui.combatMainIcon.innerHTML = mainGear?.icon || '◇';
    if (ui.combatOffIcon) ui.combatOffIcon.innerHTML = offGear?.icon || '◇';

    const swordReady = mainGear?.weaponType === 'sword' && !combat?.defeated;
    const bowEquipped = mainGear?.weaponType === 'bow';
    const staffEquipped = mainGear?.weaponType === 'staff';
    const hammerEquipped = mainGear?.weaponType === 'hammer';
    const arrowsLoaded = state.equipment.ammo === 'arrows' && state.inventory.arrows > 0;
    const bowReady = bowEquipped && arrowsLoaded && !combat?.defeated;
    const staffReady = staffEquipped && !combat?.defeated;
    const hammerReady = hammerEquipped && !combat?.defeated;

    ui.combatStage?.classList.toggle('sword-ready', Boolean(swordReady));
    ui.combatStage?.classList.toggle('bow-ready', Boolean(bowReady));
    ui.combatStage?.classList.toggle('staff-ready', Boolean(staffReady));
    ui.combatStage?.classList.toggle('hammer-ready', Boolean(hammerReady));

    if (ui.combatBowCharge) {
      ui.combatBowCharge.hidden = !bowEquipped || Boolean(combat?.defeated);
    }
    if (ui.combatAmmoCount) ui.combatAmmoCount.textContent = arrowsLoaded ? state.inventory.arrows : 0;

    if (ui.combatStaffGuide) {
      ui.combatStaffGuide.hidden = !staffEquipped || Boolean(combat?.defeated);
      ui.combatStaffGuide.classList.toggle('is-drawing', Boolean(runtime.staffGesture));
      ui.combatStaffGuide.classList.toggle('is-casting', Boolean(runtime.staffSpellInFlight));
    }

    if (staffEquipped && ui.combatSpellStatus && !runtime.staffGesture && !runtime.staffSpellInFlight) {
      ui.combatSpellStatus.textContent = 'Draw a circle';
      ui.combatStaffGuide?.classList.remove('is-confirmed', 'is-invalid');
    }

    if (ui.combatHammerGuide) {
      ui.combatHammerGuide.hidden = !hammerEquipped || Boolean(combat?.defeated);
      ui.combatHammerGuide.classList.toggle('is-active', Boolean(runtime.hammerCharge));
      ui.combatHammerGuide.classList.toggle('is-slamming', Boolean(runtime.hammerSlamInFlight));
    }

    if (ui.combatHammerRings) {
      ui.combatHammerRings.hidden = !runtime.hammerCharge || Boolean(combat?.defeated);
    }

    if (hammerEquipped && !runtime.hammerCharge && !runtime.hammerSlamInFlight && ui.combatHammerStatus) {
      ui.combatHammerStatus.textContent = 'Hold to wind up';
      ui.combatHammerGuide?.classList.remove('is-perfect', 'is-great', 'is-good', 'is-graze');
    }

    if (!runtime.bowCharge && ui.combatBowChargeFill) ui.combatBowChargeFill.style.width = '0%';
    if (!runtime.bowCharge && ui.combatBowChargeLabel) ui.combatBowChargeLabel.textContent = '0%';

    if (ui.combatHint) {
      if (combat?.defeated) {
        ui.combatHint.textContent = 'Enemy defeated.';
      } else if (swordReady) {
        ui.combatHint.textContent = `Hold the mouse button and swipe across the enemy · ${mainGear.damage} damage`;
      } else if (bowEquipped && !arrowsLoaded) {
        ui.combatHint.textContent = 'Load Arrows into the Ammo equipment slot to use the bow.';
      } else if (bowReady) {
        ui.combatHint.textContent = 'Hold the mouse button to draw the bow · release to fire.';
      } else if (staffReady) {
        ui.combatHint.textContent = 'Hold the mouse button and draw a circle · a recognized circle casts Fireball.';
      } else if (hammerReady) {
        ui.combatHint.textContent = 'Hold to wind up · release when the shrinking ring aligns with the target ring.';
      } else if (mainGear) {
        ui.combatHint.textContent = `${mainGear.shortName || mainGear.name} combat is not available yet.`;
      } else {
        ui.combatHint.textContent = 'Equip a weapon in Main Hand to attack.';
      }
    }

    if (ui.combatDefeat) {
      ui.combatDefeat.hidden = !combat?.defeated;
    }

    if (combat?.defeated && ui.combatDefeatTitle && ui.combatDefeatLoot) {
      ui.combatDefeatTitle.textContent = `${enemyName} Defeated`;
      ui.combatDefeatLoot.innerHTML = (combat.loot || []).map((drop) => `
        <div class="combat-loot-row">
          <span class="combat-loot-icon" aria-hidden="true">${drop.icon}</span>
          <span class="combat-loot-name">${drop.name}</span>
          <strong>+${drop.amount}</strong>
        </div>
      `).join('');
    }
  }

  function getMainHandGear() {
    const key = state.equipment['main-hand'];
    return key ? { key, ...GEAR_ITEMS[key] } : null;
  }

  function beginCombatInput(event) {
    if (event.button !== 0 || state.location !== 'combat' || runtime.combat?.defeated) return;
    const weapon = getMainHandGear();

    if (weapon?.weaponType === 'hammer') {
      beginHammerTiming(event, weapon);
      return;
    }

    if (weapon?.weaponType === 'staff') {
      beginStaffGesture(event, weapon);
      return;
    }

    if (weapon?.weaponType === 'bow') {
      beginBowCharge(event, weapon);
      return;
    }

    beginSwordSwipe(event);
  }

  function continueCombatInput(event) {
    const weapon = getMainHandGear();

    if (weapon?.weaponType === 'staff' && !runtime.combat?.defeated) {
      emitStaffCursorSpark(event);
    }

    if (runtime.hammerCharge) {
      if (runtime.hammerCharge.pointerId !== event.pointerId) return;
      if ((event.buttons & 1) === 0) endCombatInput(event, true);
      return;
    }

    if (runtime.staffGesture) {
      continueStaffGesture(event);
      return;
    }

    if (runtime.bowCharge) {
      if (runtime.bowCharge.pointerId !== event.pointerId) return;
      if ((event.buttons & 1) === 0) endCombatInput(event, true);
      return;
    }

    continueSwordSwipe(event);
  }

  function endCombatInput(event, shouldFire) {
    if (runtime.hammerCharge) {
      if (event?.pointerId != null && runtime.hammerCharge.pointerId !== event.pointerId) return;
      if (shouldFire) releaseHammerSlam(event);
      else cancelHammerTiming(event);
      return;
    }

    if (runtime.staffGesture) {
      if (event?.pointerId != null && runtime.staffGesture.pointerId !== event.pointerId) return;
      endStaffGesture(event, shouldFire);
      return;
    }

    if (runtime.bowCharge) {
      if (event?.pointerId != null && runtime.bowCharge.pointerId !== event.pointerId) return;
      if (shouldFire) releaseBowShot(event);
      else cancelBowCharge(event);
      return;
    }

    endSwordSwipe(event);
  }



  function beginHammerTiming(event, weapon) {
    if (
      runtime.hammerCharge ||
      runtime.hammerSlamInFlight ||
      runtime.combat?.defeated ||
      weapon?.weaponType !== 'hammer'
    ) return;

    runtime.hammerCharge = {
      pointerId: event.pointerId,
      weaponKey: weapon.key,
      startedAt: performance.now(),
      ringSize: weapon.ringStart || 330,
      quality: 'graze',
    };

    try { ui.combatStage.setPointerCapture(event.pointerId); } catch (error) {}

    ui.combatStage?.classList.add('is-hammer-charging');
    ui.combatHammerGuide?.classList.add('is-active');
    ui.combatHammerGuide?.classList.remove('is-perfect', 'is-great', 'is-good', 'is-graze');

    if (ui.combatHammerRings) {
      ui.combatHammerRings.hidden = false;
      ui.combatHammerRings.classList.remove('is-perfect', 'is-great', 'is-good', 'is-passed');
    }

    if (ui.combatHammerRing) {
      ui.combatHammerRing.style.width = `${weapon.ringStart || 330}px`;
      ui.combatHammerRing.style.height = `${weapon.ringStart || 330}px`;
    }

    updateHammerTiming();
    event.preventDefault();
  }

  function updateHammerTiming() {
    const charge = runtime.hammerCharge;
    if (!charge) return;

    const weapon = GEAR_ITEMS[charge.weaponKey];
    if (!weapon || weapon.weaponType !== 'hammer') {
      cancelHammerTiming();
      return;
    }

    const duration = Math.max(500, weapon.timingDuration || 1850);
    const progress = clamp((performance.now() - charge.startedAt) / duration, 0, 1);
    const start = weapon.ringStart || 330;
    const end = weapon.ringEnd || 54;
    const ringSize = start + ((end - start) * progress);

    charge.progress = progress;
    charge.ringSize = ringSize;

    const result = scoreHammerTiming(ringSize, weapon);
    charge.quality = result.quality;

    if (ui.combatHammerRing) {
      ui.combatHammerRing.style.width = `${ringSize}px`;
      ui.combatHammerRing.style.height = `${ringSize}px`;
    }

    if (ui.combatHammerStatus) {
      ui.combatHammerStatus.textContent =
        result.quality === 'perfect' ? 'PERFECT — release!' :
        result.quality === 'great' ? 'Great timing' :
        result.quality === 'good' ? 'Close…' :
        progress < .5 ? 'Hold…' : 'Release before it passes';
    }

    if (ui.combatHammerGuide) {
      ui.combatHammerGuide.classList.toggle('is-perfect', result.quality === 'perfect');
      ui.combatHammerGuide.classList.toggle('is-great', result.quality === 'great');
      ui.combatHammerGuide.classList.toggle('is-good', result.quality === 'good');
      ui.combatHammerGuide.classList.toggle('is-graze', result.quality === 'graze');
    }

    ui.combatHammerRings?.classList.toggle('is-perfect', result.quality === 'perfect');
    ui.combatHammerRings?.classList.toggle('is-great', result.quality === 'great');
    ui.combatHammerRings?.classList.toggle('is-good', result.quality === 'good');
    ui.combatHammerRings?.classList.toggle(
      'is-passed',
      ringSize < (weapon.ringTarget || 170) - 40
    );

    if (progress < 1) {
      runtime.hammerChargeFrame = requestAnimationFrame(updateHammerTiming);
    } else {
      runtime.hammerChargeFrame = null;
    }
  }

  function scoreHammerTiming(ringSize, weapon) {
    const target = weapon.ringTarget || 170;
    const difference = Math.abs(ringSize - target);

    if (difference <= 8) {
      return { quality: 'perfect', damage: weapon.perfectDamage || 20, difference };
    }

    if (difference <= 22) {
      return { quality: 'great', damage: weapon.greatDamage || 15, difference };
    }

    if (difference <= 40) {
      return { quality: 'good', damage: weapon.goodDamage || 10, difference };
    }

    return { quality: 'graze', damage: weapon.grazeDamage || 4, difference };
  }

  function releaseHammerSlam(event) {
    const charge = runtime.hammerCharge;
    if (!charge || runtime.hammerSlamInFlight || runtime.combat?.defeated) {
      cancelHammerTiming(event);
      return;
    }

    const weapon = GEAR_ITEMS[charge.weaponKey];
    if (!weapon || weapon.weaponType !== 'hammer') {
      cancelHammerTiming(event);
      return;
    }

    const result = scoreHammerTiming(charge.ringSize, weapon);
    cancelHammerTiming(event, false, true);

    runtime.hammerSlamInFlight = true;

    if (ui.combatHammerStatus) {
      ui.combatHammerStatus.textContent =
        result.quality === 'perfect' ? `Perfect · ${result.damage} damage` :
        result.quality === 'great' ? `Great · ${result.damage} damage` :
        result.quality === 'good' ? `Good · ${result.damage} damage` :
        `Glancing hit · ${result.damage} damage`;
    }

    ui.combatHammerGuide?.classList.add(`is-${result.quality}`, 'is-slamming');
    createHammerSlamEffect(result.damage, result.quality, { key: charge.weaponKey, ...weapon });
  }

  function cancelHammerTiming(event, immediate = false, preserveStatus = false) {
    const charge = runtime.hammerCharge;

    if (event?.pointerId != null && charge?.pointerId != null && charge.pointerId !== event.pointerId) return;

    if (runtime.hammerChargeFrame) cancelAnimationFrame(runtime.hammerChargeFrame);
    runtime.hammerChargeFrame = null;

    const pointerId = event?.pointerId ?? charge?.pointerId;
    if (pointerId != null) {
      try {
        if (ui?.combatStage?.hasPointerCapture(pointerId)) {
          ui.combatStage.releasePointerCapture(pointerId);
        }
      } catch (error) {}
    }

    runtime.hammerCharge = null;
    ui?.combatStage?.classList.remove('is-hammer-charging');

    if (ui?.combatHammerRings) {
      ui.combatHammerRings.classList.remove('is-perfect', 'is-great', 'is-good', 'is-passed');
      if (immediate || !preserveStatus) ui.combatHammerRings.hidden = true;
    }

    if (ui?.combatHammerRing) {
      ui.combatHammerRing.style.width = '';
      ui.combatHammerRing.style.height = '';
    }

    if (!preserveStatus && ui?.combatHammerGuide) {
      ui.combatHammerGuide.classList.remove('is-active', 'is-slamming', 'is-perfect', 'is-great', 'is-good', 'is-graze');
    }

    if (!preserveStatus && ui?.combatHammerStatus && getMainHandGear()?.weaponType === 'hammer') {
      ui.combatHammerStatus.textContent = 'Hold to wind up';
    }
  }

  function createHammerSlamEffect(damage, quality, weapon) {
    if (!ui.combatStage || !ui.combatEnemyTarget) {
      runtime.hammerSlamInFlight = false;
      return;
    }

    const stageRect = ui.combatStage.getBoundingClientRect();
    const targetRect = ui.combatEnemyTarget.getBoundingClientRect();
    const targetX = (targetRect.left + (targetRect.width * .5)) - stageRect.left;
    const targetY = (targetRect.top + (targetRect.height * .45)) - stageRect.top;

    const hammer = document.createElement('span');
    hammer.className = `combat-hammer-slam quality-${quality}`;
    hammer.textContent = '🔨';
    hammer.setAttribute('aria-hidden', 'true');
    hammer.style.left = `${targetX}px`;
    hammer.style.top = `${targetY}px`;
    ui.combatStage.appendChild(hammer);

    hammer.addEventListener('animationend', () => {
      hammer.remove();
      createHammerImpactEffect(quality);
      runtime.hammerSlamInFlight = false;
      strikeCombatEnemyWithHammer(damage, weapon, quality);
    }, { once: true });
  }

  function createHammerImpactEffect(quality) {
    if (!ui.combatEnemyTarget) return;

    const impact = document.createElement('span');
    impact.className = `combat-hammer-impact quality-${quality}`;
    impact.setAttribute('aria-hidden', 'true');
    ui.combatEnemyTarget.appendChild(impact);
    impact.addEventListener('animationend', () => impact.remove(), { once: true });
  }

  function strikeCombatEnemyWithHammer(damage, weapon, quality) {
    const combat = runtime.combat;
    if (!combat || combat.defeated || weapon?.weaponType !== 'hammer') return;

    combat.health = Math.max(0, combat.health - Math.max(1, damage || 1));

    ui.combatEnemyTarget?.classList.remove('is-hammer-hit');
    void ui.combatEnemyTarget?.offsetWidth;
    ui.combatEnemyTarget?.classList.add('is-hammer-hit');
    window.setTimeout(() => ui.combatEnemyTarget?.classList.remove('is-hammer-hit'), 260);

    ui.combatHammerGuide?.classList.remove('is-slamming');

    renderCombat();

    if (combat.health <= 0) {
      defeatCombatEnemy(weapon);
      return;
    }

    window.setTimeout(() => {
      if (
        getMainHandGear()?.weaponType === 'hammer' &&
        !runtime.hammerCharge &&
        !runtime.hammerSlamInFlight &&
        !runtime.combat?.defeated
      ) {
        ui.combatHammerGuide?.classList.remove('is-perfect', 'is-great', 'is-good', 'is-graze');
        if (ui.combatHammerStatus) ui.combatHammerStatus.textContent = 'Hold to wind up';
      }
    }, 520);
  }

  function beginStaffGesture(event, weapon) {
    if (
      runtime.staffGesture ||
      runtime.staffSpellInFlight ||
      runtime.combat?.defeated ||
      weapon?.weaponType !== 'staff'
    ) return;

    clearStaffTrail();

    const point = staffPointFromEvent(event);
    runtime.staffGesture = {
      pointerId: event.pointerId,
      weaponKey: weapon.key,
      points: [point],
      trailNodes: [],
      pathLength: 0,
      lastPoint: point,
      confirmed: false,
    };

    try { ui.combatStage.setPointerCapture(event.pointerId); } catch (error) {}

    ui.combatStage?.classList.add('is-staff-drawing');
    if (ui.combatSpellStatus) ui.combatSpellStatus.textContent = 'Drawing…';
    ui.combatStaffGuide?.classList.add('is-drawing');
    ui.combatStaffGuide?.classList.remove('is-confirmed', 'is-invalid');

    addStaffTrailSegment(point, point, runtime.staffGesture);
    emitStaffCursorSpark(event, true);
    event.preventDefault();
  }

  function continueStaffGesture(event) {
    const gesture = runtime.staffGesture;
    if (!gesture || gesture.pointerId !== event.pointerId || state.location !== 'combat') return;

    if ((event.buttons & 1) === 0) {
      endStaffGesture(event, true);
      return;
    }

    const point = staffPointFromEvent(event);
    const last = gesture.lastPoint;
    const distance = Math.hypot(point.x - last.x, point.y - last.y);

    if (distance < 3.5) return;

    gesture.pathLength += distance;
    gesture.points.push(point);
    if (gesture.points.length > 280) gesture.points.shift();

    addStaffTrailSegment(last, point, gesture);
    gesture.lastPoint = point;

    const circle = analyzeStaffCircle(gesture.points, gesture.pathLength);
    if (circle.accepted) {
      confirmStaffCircle(gesture, circle, event);
      return;
    }

    event.preventDefault();
  }

  function endStaffGesture(event, shouldCast) {
    const gesture = runtime.staffGesture;
    if (!gesture) return;

    if (event?.pointerId != null && gesture.pointerId !== event.pointerId) return;

    if (shouldCast) {
      const circle = analyzeStaffCircle(gesture.points, gesture.pathLength);
      if (circle.accepted) {
        confirmStaffCircle(gesture, circle, event);
        return;
      }
    }

    releaseStaffPointer(event, gesture);
    runtime.staffGesture = null;
    ui.combatStage?.classList.remove('is-staff-drawing');
    ui.combatStaffGuide?.classList.remove('is-drawing');
    ui.combatStaffGuide?.classList.add('is-invalid');
    if (ui.combatSpellStatus) ui.combatSpellStatus.textContent = 'No spell recognized';

    fadeStaffTrail(gesture.trailNodes);

    window.setTimeout(() => {
      if (getMainHandGear()?.weaponType === 'staff' && !runtime.staffGesture && !runtime.staffSpellInFlight) {
        ui.combatStaffGuide?.classList.remove('is-invalid');
        if (ui.combatSpellStatus) ui.combatSpellStatus.textContent = 'Draw a circle';
      }
    }, 520);
  }

  function cancelStaffGesture(event, immediate = false) {
    const gesture = runtime.staffGesture;

    if (gesture && event?.pointerId != null && gesture.pointerId !== event.pointerId) return;
    if (gesture) releaseStaffPointer(event, gesture);

    runtime.staffGesture = null;
    ui?.combatStage?.classList.remove('is-staff-drawing');

    if (gesture?.trailNodes?.length) {
      if (immediate) {
        gesture.trailNodes.forEach((node) => node.remove());
      } else {
        fadeStaffTrail(gesture.trailNodes);
      }
    }

    if (ui?.combatStaffGuide) {
      ui.combatStaffGuide.classList.remove('is-drawing', 'is-confirmed', 'is-invalid');
    }
  }

  function releaseStaffPointer(event, gesture) {
    const pointerId = event?.pointerId ?? gesture?.pointerId;
    if (pointerId == null) return;

    try {
      if (ui?.combatStage?.hasPointerCapture(pointerId)) {
        ui.combatStage.releasePointerCapture(pointerId);
      }
    } catch (error) {}
  }

  function staffPointFromEvent(event) {
    const rect = ui.combatStage.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }

  function addStaffTrailSegment(from, to, gesture) {
    if (!ui.combatStage || !gesture) return;

    const distance = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    const steps = Math.max(1, Math.ceil(distance / 7));

    for (let i = 0; i <= steps; i += 1) {
      if (gesture.trailNodes.length >= 420) break;
      const t = steps === 0 ? 1 : i / steps;
      const x = from.x + ((to.x - from.x) * t);
      const y = from.y + ((to.y - from.y) * t);

      const dot = document.createElement('span');
      dot.className = 'combat-spell-particle';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.setProperty('--spell-size', `${randomInt(4, 8)}px`);
      dot.style.setProperty('--spell-delay', `${randomInt(0, 45)}ms`);
      ui.combatStage.appendChild(dot);
      gesture.trailNodes.push(dot);
    }
  }

  function emitStaffCursorSpark(event, force = false) {
    if (!ui.combatStage || state.location !== 'combat' || runtime.combat?.defeated) return;
    if (getMainHandGear()?.weaponType !== 'staff') return;

    const now = performance.now();
    if (!force && now - runtime.staffCursorSparkAt < 28) return;
    runtime.staffCursorSparkAt = now;

    const point = staffPointFromEvent(event);
    const sparkCount = force ? 4 : 2;

    for (let i = 0; i < sparkCount; i += 1) {
      const spark = document.createElement('span');
      spark.className = 'staff-cursor-spark';
      spark.style.left = `${point.x}px`;
      spark.style.top = `${point.y}px`;
      spark.style.setProperty('--spark-x', `${randomInt(-18, 18)}px`);
      spark.style.setProperty('--spark-y', `${randomInt(-25, 5)}px`);
      spark.style.setProperty('--spark-size', `${randomInt(3, 7)}px`);
      ui.combatStage.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove(), { once: true });
    }
  }

  function confirmStaffCircle(gesture, circle, event) {
    if (!gesture || gesture.confirmed || runtime.staffSpellInFlight || runtime.combat?.defeated) return;

    gesture.confirmed = true;
    releaseStaffPointer(event, gesture);
    runtime.staffGesture = null;
    runtime.staffSpellInFlight = true;

    ui.combatStage?.classList.remove('is-staff-drawing');
    ui.combatStaffGuide?.classList.remove('is-drawing', 'is-invalid');
    ui.combatStaffGuide?.classList.add('is-confirmed', 'is-casting');
    if (ui.combatSpellStatus) ui.combatSpellStatus.textContent = 'Fireball';

    gesture.trailNodes.forEach((node, index) => {
      node.classList.add('is-confirmed');
      node.style.setProperty('--confirm-delay', `${Math.min(index * 2, 180)}ms`);
    });

    const weapon = { key: gesture.weaponKey, ...GEAR_ITEMS[gesture.weaponKey] };
    const origin = {
      x: circle.centerX,
      y: circle.centerY,
    };

    window.setTimeout(() => {
      createStaffFireballProjectile(origin, weapon);
    }, 230);

    window.setTimeout(() => {
      fadeStaffTrail(gesture.trailNodes);
    }, 360);
  }

  function createStaffFireballProjectile(origin, weapon) {
    if (!ui.combatStage || !ui.combatEnemyTarget || runtime.combat?.defeated) {
      runtime.staffSpellInFlight = false;
      renderCombat();
      return;
    }

    const stageRect = ui.combatStage.getBoundingClientRect();
    const targetRect = ui.combatEnemyTarget.getBoundingClientRect();

    const startX = clamp(origin?.x ?? stageRect.width * .28, 24, stageRect.width - 24);
    const startY = clamp(origin?.y ?? stageRect.height * .5, 24, stageRect.height - 24);
    const endX = (targetRect.left + (targetRect.width * .5)) - stageRect.left;
    const endY = (targetRect.top + (targetRect.height * .5)) - stageRect.top;

    const fireball = document.createElement('span');
    fireball.className = 'combat-fireball-projectile';
    fireball.style.left = `${startX}px`;
    fireball.style.top = `${startY}px`;
    fireball.style.setProperty('--fireball-dx', `${endX - startX}px`);
    fireball.style.setProperty('--fireball-dy', `${endY - startY}px`);
    ui.combatStage.appendChild(fireball);

    fireball.addEventListener('animationend', () => {
      fireball.remove();
      runtime.staffSpellInFlight = false;
      strikeCombatEnemyWithStaff(weapon);
    }, { once: true });
  }

  function strikeCombatEnemyWithStaff(weapon) {
    const combat = runtime.combat;
    if (!combat || combat.defeated || weapon?.weaponType !== 'staff') return;

    combat.health = Math.max(0, combat.health - Math.max(1, weapon.damage || 1));
    createFireballImpactEffect();

    ui.combatEnemyTarget?.classList.remove('is-fireball-hit');
    void ui.combatEnemyTarget?.offsetWidth;
    ui.combatEnemyTarget?.classList.add('is-fireball-hit');
    window.setTimeout(() => ui.combatEnemyTarget?.classList.remove('is-fireball-hit'), 260);

    ui.combatStaffGuide?.classList.remove('is-confirmed', 'is-casting');
    if (ui.combatSpellStatus) ui.combatSpellStatus.textContent = 'Draw a circle';

    renderCombat();
    if (combat.health <= 0) defeatCombatEnemy(weapon);
  }

  function createFireballImpactEffect() {
    if (!ui.combatEnemyTarget) return;

    const impact = document.createElement('span');
    impact.className = 'combat-fireball-impact';
    impact.setAttribute('aria-hidden', 'true');
    ui.combatEnemyTarget.appendChild(impact);
    impact.addEventListener('animationend', () => impact.remove(), { once: true });
  }

  function fadeStaffTrail(nodes) {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (!node?.isConnected) return;
      node.classList.add('is-fading');
      window.setTimeout(() => node.remove(), 360);
    });
  }

  function clearStaffTrail() {
    ui?.combatStage?.querySelectorAll('.combat-spell-particle').forEach((node) => node.remove());
  }

  function beginBowCharge(event, weapon) {
    if (runtime.bowShotInFlight || runtime.bowCharge) return;
    if (state.equipment.ammo !== 'arrows' || state.inventory.arrows <= 0) {
      renderCombat();
      return;
    }

    runtime.bowCharge = {
      pointerId: event.pointerId,
      startedAt: performance.now(),
      charge: 0,
      weaponKey: weapon.key,
    };

    try { ui.combatStage.setPointerCapture(event.pointerId); } catch (error) {}
    ui.combatStage.classList.add('is-bow-charging');
    updateBowCharge();
    event.preventDefault();
  }

  function updateBowCharge() {
    const charge = runtime.bowCharge;
    if (!charge) return;
    const weapon = GEAR_ITEMS[charge.weaponKey];
    if (!weapon) {
      cancelBowCharge();
      return;
    }

    charge.charge = clamp((performance.now() - charge.startedAt) / (weapon.chargeTime || 1200), 0, 1);
    const percent = Math.round(charge.charge * 100);
    if (ui.combatBowChargeFill) ui.combatBowChargeFill.style.width = `${percent}%`;
    if (ui.combatBowChargeLabel) ui.combatBowChargeLabel.textContent = `${percent}%`;

    if (charge.charge < 1) {
      runtime.bowChargeFrame = requestAnimationFrame(updateBowCharge);
    } else {
      runtime.bowChargeFrame = null;
      ui.combatStage?.classList.add('is-bow-fully-drawn');
    }
  }

  function cancelBowCharge(event) {
    if (event?.pointerId != null && runtime.bowCharge?.pointerId !== event.pointerId) return;
    if (runtime.bowChargeFrame) cancelAnimationFrame(runtime.bowChargeFrame);
    runtime.bowChargeFrame = null;

    if (event?.pointerId != null) {
      try {
        if (ui?.combatStage?.hasPointerCapture(event.pointerId)) ui.combatStage.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }

    runtime.bowCharge = null;
    ui?.combatStage?.classList.remove('is-bow-charging', 'is-bow-fully-drawn');
    if (ui?.combatBowChargeFill) ui.combatBowChargeFill.style.width = '0%';
    if (ui?.combatBowChargeLabel) ui.combatBowChargeLabel.textContent = '0%';
  }

  function releaseBowShot(event) {
    const charge = runtime.bowCharge;
    if (!charge || runtime.bowShotInFlight || runtime.combat?.defeated) {
      cancelBowCharge(event);
      return;
    }

    const weapon = GEAR_ITEMS[charge.weaponKey];
    const chargeAmount = clamp(charge.charge, 0, 1);
    cancelBowCharge(event);

    if (!weapon || state.equipment.ammo !== 'arrows' || state.inventory.arrows <= 0) {
      renderCombat();
      return;
    }

    const damage = Math.round((weapon.minDamage || 1) + ((weapon.maxDamage || weapon.minDamage || 1) - (weapon.minDamage || 1)) * chargeAmount);
    state.inventory.arrows -= 1;
    if (state.inventory.arrows <= 0) state.equipment.ammo = null;
    runtime.bowShotInFlight = true;

    renderInventory();
    renderCombat();
    createBowArrowProjectile(Math.max(1, damage), { key: charge.weaponKey, ...weapon });
  }

  function createBowArrowProjectile(damage, weapon) {
    if (!ui.combatStage || !ui.combatEnemyTarget) {
      runtime.bowShotInFlight = false;
      return;
    }

    const stageRect = ui.combatStage.getBoundingClientRect();
    const targetRect = ui.combatEnemyTarget.getBoundingClientRect();
    const startX = Math.max(34, stageRect.width * .16);
    const startY = Math.max(70, stageRect.height * .72);
    const endX = (targetRect.left + targetRect.width * .5) - stageRect.left;
    const endY = (targetRect.top + targetRect.height * .52) - stageRect.top;
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const arrow = document.createElement('span');
    arrow.className = 'combat-arrow-projectile';
    arrow.textContent = '➶';
    arrow.style.left = `${startX}px`;
    arrow.style.top = `${startY}px`;
    arrow.style.setProperty('--arrow-dx', `${dx}px`);
    arrow.style.setProperty('--arrow-dy', `${dy}px`);
    arrow.style.setProperty('--arrow-angle', `${angle}deg`);
    ui.combatStage.appendChild(arrow);

    arrow.addEventListener('animationend', () => {
      arrow.remove();
      runtime.bowShotInFlight = false;
      strikeCombatEnemyWithBow(damage, weapon);
    }, { once: true });
  }

  function strikeCombatEnemyWithBow(damage, weapon) {
    const combat = runtime.combat;
    if (!combat || combat.defeated || weapon?.weaponType !== 'bow') return;

    combat.health = Math.max(0, combat.health - Math.max(1, damage || 1));
    createBowImpactEffect();

    ui.combatEnemyTarget?.classList.remove('is-bow-hit');
    void ui.combatEnemyTarget?.offsetWidth;
    ui.combatEnemyTarget?.classList.add('is-bow-hit');
    window.setTimeout(() => ui.combatEnemyTarget?.classList.remove('is-bow-hit'), 190);

    renderCombat();
    if (combat.health <= 0) defeatCombatEnemy(weapon);
  }

  function createBowImpactEffect() {
    if (!ui.combatEnemyTarget) return;
    const impact = document.createElement('span');
    impact.className = 'combat-arrow-impact';
    impact.textContent = '➶';
    impact.setAttribute('aria-hidden', 'true');
    ui.combatEnemyTarget.appendChild(impact);
    impact.addEventListener('animationend', () => impact.remove(), { once: true });
  }

  function beginSwordSwipe(event) {
    if (event.button !== 0 || state.location !== 'combat' || runtime.combat?.defeated) return;
    const weapon = getMainHandGear();
    if (weapon?.weaponType !== 'sword') return;

    runtime.swordGesture = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      hitLocked: false,
      lastHitAt: 0,
    };

    try { ui.combatStage.setPointerCapture(event.pointerId); } catch (error) {}
    ui.combatStage.classList.add('is-swiping');
    event.preventDefault();
  }

  function continueSwordSwipe(event) {
    const swipe = runtime.swordGesture;
    if (!swipe || swipe.pointerId !== event.pointerId || state.location !== 'combat') return;
    if ((event.buttons & 1) === 0) {
      endSwordSwipe(event);
      return;
    }

    const x1 = swipe.lastX;
    const y1 = swipe.lastY;
    const x2 = event.clientX;
    const y2 = event.clientY;
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const targetRect = ui.combatEnemyTarget?.getBoundingClientRect();

    if (targetRect && distance >= 8) {
      const crossesEnemy = segmentIntersectsRect(x1, y1, x2, y2, targetRect);
      const currentInside = pointInsideRect(x2, y2, targetRect);
      const now = performance.now();

      if (crossesEnemy && !swipe.hitLocked && now - swipe.lastHitAt >= 140) {
        strikeCombatEnemyWithSword(x1, y1, x2, y2);
        swipe.hitLocked = true;
        swipe.lastHitAt = now;
      }

      if (!currentInside && !crossesEnemy) swipe.hitLocked = false;
    }

    swipe.lastX = x2;
    swipe.lastY = y2;
    event.preventDefault();
  }

  function endSwordSwipe(event) {
    if (!runtime.swordGesture) return;
    if (event?.pointerId != null && runtime.swordGesture.pointerId !== event.pointerId) return;

    if (event?.pointerId != null) {
      try {
        if (ui.combatStage?.hasPointerCapture(event.pointerId)) ui.combatStage.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }

    runtime.swordGesture = null;
    cancelBowCharge();
    runtime.bowShotInFlight = false;
    cancelHammerTiming();
    ui.combatStage?.classList.remove('is-swiping', 'is-bow-charging', 'is-bow-fully-drawn', 'is-hammer-charging');
  }

  function strikeCombatEnemyWithSword(x1, y1, x2, y2) {
    const combat = runtime.combat;
    const weapon = getMainHandGear();
    if (!combat || combat.defeated || weapon?.weaponType !== 'sword') return;

    combat.health = Math.max(0, combat.health - Math.max(1, weapon.damage || 1));
    createSwordSlashEffect(x1, y1, x2, y2);

    ui.combatEnemyTarget?.classList.remove('is-sword-hit');
    void ui.combatEnemyTarget?.offsetWidth;
    ui.combatEnemyTarget?.classList.add('is-sword-hit');
    window.setTimeout(() => ui.combatEnemyTarget?.classList.remove('is-sword-hit'), 180);

    renderCombat();
    if (combat.health <= 0) defeatCombatEnemy(weapon);
  }

  function createSwordSlashEffect(x1, y1, x2, y2) {
    if (!ui.combatStage) return;
    const stageRect = ui.combatStage.getBoundingClientRect();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = clamp(Math.hypot(dx, dy) * 1.35, 68, 210);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const slash = document.createElement('span');
    slash.className = 'sword-slash-effect';
    slash.style.left = `${((x1 + x2) / 2) - stageRect.left}px`;
    slash.style.top = `${((y1 + y2) / 2) - stageRect.top}px`;
    slash.style.width = `${length}px`;
    slash.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
    ui.combatStage.appendChild(slash);
    slash.addEventListener('animationend', () => slash.remove(), { once: true });
  }

  function defeatCombatEnemy(weapon) {
    const combat = runtime.combat;
    if (!combat || combat.defeated) return;

    combat.defeated = true;
    combat.health = 0;
    runtime.swordGesture = null;
    cancelStaffGesture(null, true);
    runtime.staffSpellInFlight = false;
    cancelHammerTiming(null, true);
    runtime.hammerSlamInFlight = false;
    ui.combatStage?.classList.remove('is-swiping', 'is-staff-drawing', 'is-hammer-charging');
    ui.combatEnemyTarget?.classList.add('is-defeated');

    const loot = rollSlimeLoot();
    combat.loot = loot;
    applyCombatLoot(loot);

    if (weapon?.weaponType === 'sword') {
      gainClassXp('swordsman', SLIME_SWORDSMAN_XP);
    } else if (weapon?.weaponType === 'bow') {
      gainClassXp('ranger', SLIME_RANGER_XP);
    } else if (weapon?.weaponType === 'staff') {
      gainClassXp('wizard', SLIME_WIZARD_XP);
    }

    renderCombat();
  }

  function rollSlimeLoot() {
    const loot = [
      { kind: 'coin', key: 'copper', name: 'Copper', icon: '¢', amount: randomInt(4, 12) },
      { kind: 'item', key: 'greenGoop', name: 'Green Goop', icon: '<span class="green-goop-icon"></span>', amount: randomInt(2, 6) },
    ];

    const oreRoll = Math.random();
    if (oreRoll < .05) {
      loot.push({ kind: 'item', key: 'ironOre', name: 'Iron Ore', icon: '<span class="mini-ore iron"></span>', amount: 1 });
    } else if (oreRoll < .23) {
      loot.push({ kind: 'item', key: 'coal', name: 'Coal', icon: '<span class="mini-ore coal"></span>', amount: 1 });
    }

    return loot;
  }

  function applyCombatLoot(loot) {
    loot.forEach((drop) => {
      if (drop.kind === 'coin') {
        state.wallet.copper += drop.amount;
      } else {
        state.inventory[drop.key] = (state.inventory[drop.key] || 0) + drop.amount;
      }
    });

    renderWallet();
    renderInventory();
  }

  function renderHUD() {
    ui.username.textContent = state.username;

    const healthPercent = clamp((state.health.current / state.health.max) * 100, 0, 100);
    ui.playerHealth.textContent = `${state.health.current} / ${state.health.max}`;
    ui.playerHealthFill.style.width = `${healthPercent}%`;

    updateProgressUI(state.overall, ui.overallLevel, ui.overallXp, ui.overallFill, true);
    renderWallet();
    renderCombat();

    Object.entries(state.skills).forEach(([skill, data]) => {
      const levelNode = document.querySelector(`[data-skill-level="${skill}"]`);
      const xpNode = document.querySelector(`[data-skill-xp="${skill}"]`);
      const fillNode = document.querySelector(`[data-skill-fill="${skill}"]`);
      if (levelNode && xpNode && fillNode) {
        updateProgressUI(data, levelNode, xpNode, fillNode, false);
      }
    });

    Object.entries(state.classes).forEach(([className, data]) => {
      const levelNode = document.querySelector(`[data-class-level="${className}"]`);
      const xpNode = document.querySelector(`[data-class-xp="${className}"]`);
      const fillNode = document.querySelector(`[data-class-fill="${className}"]`);
      if (levelNode && xpNode && fillNode) {
        updateProgressUI(data, levelNode, xpNode, fillNode, false);
      }
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
    renderXpMenu();
  }

  function renderXpMenu() {
    document.querySelectorAll('[data-xp-menu]').forEach((tab) => {
      const active = tab.dataset.xpMenu === state.xpMenu;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('[data-xp-pane]').forEach((pane) => {
      pane.hidden = pane.dataset.xpPane !== state.xpMenu;
    });
  }

  function renderInventory() {
    document.querySelectorAll('[data-inventory-tab]').forEach((tab) => {
      const active = tab.dataset.inventoryTab === state.inventoryTab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    ui.itemPane.hidden = state.inventoryTab !== 'items';
    ui.gearPane.hidden = state.inventoryTab !== 'gear';
    ui.equipmentPane.hidden = state.inventoryTab !== 'equipment';
    ui.inventoryDrawer.classList.toggle('equipment-mode', state.inventoryTab === 'equipment');

    const items = [
      { key: 'oakWood', name: 'Oak Wood', icon: '<span class="mini-log"></span>', draggable: true },
      { key: 'birchWood', name: 'Birch Wood', icon: '<span class="mini-birch"></span>', draggable: true },
      { key: 'oakPlanks', name: 'Oak Planks', icon: '<span class="mini-plank oak"></span>' },
      { key: 'birchPlanks', name: 'Birch Planks', icon: '<span class="mini-plank birch"></span>' },
      { key: 'sawdust', name: 'Sawdust', icon: '<span class="mini-sawdust"></span>' },
      { key: 'apples', name: 'Apple', icon: '<span aria-hidden="true">🍎</span>' },
      { key: 'bread', name: 'Bread', icon: '<span aria-hidden="true">🍞</span>' },
      { key: 'wheat', name: 'Wheat', icon: '<span aria-hidden="true">🌾</span>' },
      { key: 'smallHealthPotion', name: 'Small Health Potion', icon: '<span aria-hidden="true">🧪</span>' },
      { key: 'cookies', name: 'Cookie', icon: '<span aria-hidden="true">🍪</span>' },
      { key: 'arrows', name: 'Arrows', icon: '<span aria-hidden="true">➶</span>' },
      { key: 'greenGoop', name: 'Green Goop', icon: '<span class="green-goop-icon" aria-hidden="true"></span>' },
      { key: 'redMushroom', name: 'Red Mushroom', icon: '<span class="mushroom-icon red" aria-hidden="true">🍄</span>' },
      { key: 'brownMushroom', name: 'Brown Mushroom', icon: '<span class="mushroom-icon brown" aria-hidden="true">🍄</span>' },
      { key: 'whiteMushroom', name: 'White Mushroom', icon: '<span class="mushroom-icon white" aria-hidden="true">🍄</span>' },
      { key: 'onionGrass', name: 'Onion Grass', icon: '<span aria-hidden="true">🧅</span>' },
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
          const dragHandle = item.draggable
            ? `<span class="item-drag-zone" draggable="true" data-drag-item="${item.key}" title="Drag to the sawmill">
                <span class="item-icon">${item.icon}</span><span class="item-name">${item.name}</span>
              </span>`
            : `<span class="item-drag-zone item-static-zone"><span class="item-icon">${item.icon}</span><span class="item-name">${item.name}</span></span>`;
          const batch = item.draggable
            ? `<label class="stack-picker" title="Amount to process"><span>Batch</span><input type="number" min="1" max="${state.inventory[item.key]}" value="1" data-stack-amount="${item.key}"></label>`
            : '';
          return `<div class="item-row${item.draggable ? ' is-draggable' : ''}">
            ${dragHandle}
            <span class="item-actions">${batch}<span class="item-count">${state.inventory[item.key]}</span></span>
          </div>`;
        }).join('')}</div>`
      : '<div class="item-empty">No items yet.</div>';

    const gear = Object.entries(GEAR_ITEMS)
      .map(([key, item]) => ({ key, ...item, count: state.inventory[key] || 0 }))
      .filter((item) => item.count > 0);

    ui.gearPane.innerHTML = gear.length
      ? `<div class="gear-list">${gear.map((item) => {
          const equipped = state.equipment[item.slot] === item.key;
          return `<div class="gear-row${equipped ? ' is-equipped' : ''}">
            <span class="gear-icon">${item.icon}</span>
            <span class="gear-copy"><strong>${item.name}</strong><small>${item.bonus}</small></span>
            <span class="gear-actions"><span class="gear-slot-tag">${EQUIPMENT_SLOT_LABELS[item.slot]}</span><button type="button" data-equip-item="${item.key}">${equipped ? 'Unequip' : 'Equip'}</button></span>
          </div>`;
        }).join('')}</div>`
      : '<div class="item-empty">No gear yet.</div>';

    renderEquipment();
    renderCombat();
  }


  function renderWallet() {
    const coins = coinBreakdown(state.wallet.copper);
    ui.walletCopper.textContent = coins.copper;
    ui.walletSilver.textContent = coins.silver;
    ui.walletGold.textContent = coins.gold;
    ui.walletPlatinum.textContent = coins.platinum;
    ui.walletXelium.textContent = state.wallet.xelium;
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
    const affordable = state.freeShops || state.wallet.copper >= BASIC_AXE_PRICE;
    const axePriceLabel = state.freeShops ? 'FREE' : formatCoinPrice(BASIC_AXE_PRICE);
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
          <span class="shop-product-buy"><b class="${state.freeShops ? 'is-free' : ''}">${axePriceLabel}</b><button type="button" data-buy-basic-axe ${axeOwned || !affordable ? 'disabled' : ''}>${axeOwned ? 'Owned' : affordable ? 'Buy' : 'Need coins'}</button></span>
        </div>
      </section>`;
  }

  function renderVillageShop() {
    if (!ui.villageShop || !ui.villageShopBody) return;

    const shopKey = runtime.villageShopOpen;
    const shop = shopKey ? VILLAGE_SHOPS[shopKey] : null;
    const visible = Boolean(shop) && state.location === shopKey;

    ui.villageShop.classList.toggle('is-open', visible);
    if (!visible) return;

    ui.villageShopKicker.textContent = shop.kicker;
    ui.villageShopTitle.textContent = shop.title;

    const sellRows = Object.entries(shop.sell).map(([key, item]) => {
      const count = state.inventory[key] || 0;
      return `
        <div class="shop-sell-row">
          <span class="shop-item-icon">${item.icon}</span>
          <span class="shop-item-copy">
            <strong>${item.name}</strong>
            <small>${item.price} Copper each · You have ${count}</small>
          </span>
          <span class="shop-sell-actions">
            <button type="button" data-village-sell-item="${key}" data-sell-mode="one" ${count < 1 ? 'disabled' : ''}>Sell 1</button>
            <button type="button" data-village-sell-item="${key}" data-sell-mode="all" ${count < 1 ? 'disabled' : ''}>All</button>
          </span>
        </div>`;
    }).join('');

    const buyRows = Object.entries(shop.buy).map(([key, item]) => {
      const owned = state.inventory[key] || 0;
      const ownedUnique = item.unique && owned > 0;
      const affordable = state.freeShops || state.wallet.copper >= item.price;
      const priceLabel = state.freeShops ? 'FREE' : formatCoinPrice(item.price);
      const buttonText = ownedUnique ? 'Owned' : affordable ? 'Buy' : 'Need coins';

      return `
        <div class="shop-product">
          <span class="shop-product-icon">${item.icon}</span>
          <span class="shop-product-copy">
            <strong>${item.name}</strong>
            <small>${item.description}</small>
          </span>
          <span class="shop-product-buy">
            <b class="${state.freeShops ? 'is-free' : ''}">${priceLabel}</b>
            <button type="button" data-village-buy-item="${key}" ${ownedUnique || !affordable ? 'disabled' : ''}>${buttonText}</button>
          </span>
        </div>`;
    }).join('');

    const sellSection = Object.keys(shop.sell).length
      ? `<section class="shop-section">
          <div class="shop-section-head"><strong>${shop.sellHeading}</strong><span>${shop.sellNote}</span></div>
          <div class="shop-sell-list">${sellRows}</div>
        </section>`
      : '';

    const buySection = Object.keys(shop.buy).length
      ? `<section class="shop-section buy-section">
          <div class="shop-section-head"><strong>${shop.buyHeading}</strong><span>${shop.buyNote}</span></div>
          <div class="shop-product-list">${buyRows}</div>
        </section>`
      : '';

    ui.villageShopBody.innerHTML = `${sellSection}${buySection}`;
  }

  function sellVillageShopItem(key, sellAll) {
    const shop = runtime.villageShopOpen ? VILLAGE_SHOPS[runtime.villageShopOpen] : null;
    const listing = shop?.sell?.[key];
    if (!listing) return;

    const owned = state.inventory[key] || 0;
    if (owned <= 0) return;

    const amount = sellAll ? owned : 1;
    state.inventory[key] -= amount;
    const earned = amount * listing.price;
    state.wallet.copper += earned;

    renderWallet();
    renderInventory();
    renderVillageShop();
    showToast('Sold', `${amount} ${listing.name}${amount === 1 ? '' : ' items'} · +${formatCoinPrice(earned)}`, '¢');
  }

  function buyVillageShopItem(key) {
    const shop = runtime.villageShopOpen ? VILLAGE_SHOPS[runtime.villageShopOpen] : null;
    const listing = shop?.buy?.[key];
    if (!listing) return;

    if (listing.unique && (state.inventory[key] || 0) > 0) {
      showToast('Already owned', `${listing.name} is already in your Gear inventory.`, listing.icon);
      return;
    }

    if (!state.freeShops && state.wallet.copper < listing.price) {
      showToast('Not enough coins', `${listing.name} costs ${formatCoinPrice(listing.price)}.`, '¢');
      return;
    }

    if (!state.freeShops) state.wallet.copper -= listing.price;
    const amount = Math.max(1, listing.amount || 1);
    state.inventory[key] = (state.inventory[key] || 0) + amount;

    renderWallet();
    renderInventory();
    renderVillageShop();
    showToast(
      'Purchased',
      GEAR_ITEMS[key]
        ? `${listing.name} added to Gear.`
        : `${listing.amount && listing.amount > 1 ? `${listing.amount} ` : ''}${listing.name} added to your inventory.`,
      listing.icon
    );
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
    if (!state.freeShops && state.wallet.copper < BASIC_AXE_PRICE) {
      showToast('Not enough coins', `The axe costs ${formatCoinPrice(BASIC_AXE_PRICE)}.`, '¢');
      return;
    }
    if (!state.freeShops) state.wallet.copper -= BASIC_AXE_PRICE;
    state.inventory.basicWoodcuttersAxe = 1;
    renderWallet();
    renderInventory();
    renderLumberShop();
    showToast('Purchased', "Basic Woodcutter's Axe added to your inventory.", '🪓');
  }

  function toggleEquipItem(key) {
    const gear = GEAR_ITEMS[key];
    if (!gear || state.inventory[key] <= 0) return;
    const equipped = state.equipment[gear.slot] === key;
    state.equipment[gear.slot] = equipped ? null : key;
    renderInventory();
    showToast(
      equipped ? 'Gear unequipped' : 'Gear equipped',
      equipped ? `${gear.name} removed from ${EQUIPMENT_SLOT_LABELS[gear.slot]}.` : `${gear.name} equipped · ${gear.bonus}.`,
      gear.icon
    );
  }

  function toggleEquipmentSlot(slot) {
    if (!(slot in state.equipment)) return;

    if (slot === 'ammo') {
      if (state.equipment.ammo === 'arrows') {
        state.equipment.ammo = null;
        renderInventory();
        showToast('Ammo unloaded', 'Arrows removed from the Ammo slot.', '➶');
        return;
      }

      if (state.inventory.arrows <= 0) {
        showToast('No ammunition', 'You do not have any Arrows to load.', '➶');
        return;
      }

      state.equipment.ammo = 'arrows';
      renderInventory();
      showToast('Ammo loaded', `${state.inventory.arrows} Arrows loaded.`, '➶');
      return;
    }

    const equippedKey = state.equipment[slot];
    if (equippedKey) {
      const gear = GEAR_ITEMS[equippedKey];
      state.equipment[slot] = null;
      renderInventory();
      showToast('Slot cleared', `${gear?.name || 'Gear'} unequipped.`, gear?.icon || '◇');
      return;
    }

    const compatible = Object.entries(GEAR_ITEMS).find(([key, gear]) => gear.slot === slot && (state.inventory[key] || 0) > 0);
    if (!compatible) {
      showToast('No compatible gear', `You do not own gear for the ${EQUIPMENT_SLOT_LABELS[slot] || slot} slot yet.`, '◇');
      return;
    }

    const [key, gear] = compatible;
    state.equipment[slot] = key;
    renderInventory();
    showToast('Gear equipped', `${gear.name} equipped · ${gear.bonus}.`, gear.icon);
  }

  function renderEquipment() {
    document.querySelectorAll('[data-equipment-slot]').forEach((slotNode) => {
      const slot = slotNode.dataset.equipmentSlot;

      if (slot === 'ammo') {
        const arrowsLoaded = state.equipment.ammo === 'arrows' && state.inventory.arrows > 0;
        slotNode.classList.toggle('is-equipped', arrowsLoaded);
        slotNode.setAttribute('aria-label', arrowsLoaded
          ? `Ammo, ${state.inventory.arrows} Arrows loaded. Click to unload.`
          : 'Ammo, empty. Click to load Arrows.');
        const stateNode = slotNode.querySelector('.equipment-slot-state');
        if (stateNode) {
          stateNode.textContent = arrowsLoaded ? `Arrows ×${state.inventory.arrows}` : 'Empty';
          stateNode.title = arrowsLoaded ? `${state.inventory.arrows} Arrows ready for bows.` : '';
        }
        return;
      }

      const equippedKey = state.equipment[slot];
      const gear = equippedKey ? GEAR_ITEMS[equippedKey] : null;
      slotNode.classList.toggle('is-equipped', Boolean(gear));
      slotNode.setAttribute('aria-label', gear
        ? `${EQUIPMENT_SLOT_LABELS[slot]}, ${gear.name} equipped. Click to unequip.`
        : `${EQUIPMENT_SLOT_LABELS[slot]}, empty. Click to equip compatible gear.`);
      const stateNode = slotNode.querySelector('.equipment-slot-state');
      if (stateNode) {
        stateNode.textContent = gear ? gear.name : 'Empty';
        stateNode.title = gear ? `${gear.name} · ${gear.bonus}` : '';
      }
    });
  }

  function getTreeDamage() {
    return state.equipment.axe === 'basicWoodcuttersAxe' ? 2 : 1;
  }

  function startSawmill(key, requestedAmount = 1) {
    const recipe = SAWMILL_RECIPES[key];
    if (!recipe || state.location !== 'lumbermill') return;
    if (runtime.sawmillJob) {
      showToast('Sawmill busy', 'Wait for the current batch to finish.', '⚙');
      return;
    }
    const owned = state.inventory[key] || 0;
    if (owned <= 0) {
      showToast('No logs', `You do not have any ${recipe.name}.`, '▤');
      return;
    }

    const amount = clamp(parseInt(requestedAmount, 10) || 1, 1, owned);
    state.inventory[key] -= amount;
    const startedAt = performance.now();
    const duration = recipe.duration * amount;
    runtime.sawmillJob = { key, recipe, amount, startedAt, duration, endsAt: startedAt + duration };
    renderInventory();
    renderLumberShop();
    ui.sawmillMachine.classList.add('is-running');
    ui.sawmillDrop.classList.add('is-processing');
    ui.sawmillStatus.textContent = `Cutting ${amount} × ${recipe.name}…`;
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
    const progress = clamp((now - job.startedAt) / job.duration, 0, 1);
    ui.sawmillFill.style.width = `${progress * 100}%`;
    if (progress >= 1) finishSawmill();
  }

  function finishSawmill() {
    const job = runtime.sawmillJob;
    if (!job) return;
    window.clearInterval(runtime.sawmillTimer);
    runtime.sawmillTimer = null;
    runtime.sawmillJob = null;

    const plankOutput = job.recipe.planks * job.amount;
    const sawdustOutput = job.recipe.sawdust * job.amount;
    state.inventory[job.recipe.plankKey] += plankOutput;
    state.inventory.sawdust += sawdustOutput;
    ui.sawmillMachine.classList.remove('is-running');
    ui.sawmillDrop.classList.remove('is-processing');
    ui.sawmillOutput.classList.remove('is-ejecting');
    void ui.sawmillOutput.offsetWidth;
    ui.sawmillOutput.classList.add('is-ejecting');
    ui.sawmillFill.style.width = '100%';
    ui.sawmillStatus.textContent = `${job.recipe.plankName} ready`;
    renderInventory();
    showLoot(ui.sawmillOutput, job.recipe.plankName, plankOutput);
    showLoot(ui.sawmillOutput, 'Sawdust', sawdustOutput, 120);

    window.setTimeout(() => {
      ui.sawmillOutput.classList.remove('is-ejecting');
      ui.sawmillFill.style.width = '0%';
      ui.sawmillStatus.textContent = 'Drag a log stack here';
    }, 1050);
  }

  function gainSkillXp(skill, amount) {
    const skillData = state.skills[skill];
    const startFraction = skillData.xp / xpNeeded(skillData.level);

    const skillLevelsGained = addXp(skillData, amount);
    const endFraction = skillData.xp / xpNeeded(skillData.level);

    // One complete skill level is still worth exactly 25 Overall XP.
    // Award that same value continuously as the skill bar advances.
    const overallProgress = skillLevelsGained + endFraction - startFraction;
    const overallXpAward = Math.max(0, overallProgress * OVERALL_XP_PER_SKILL_LEVEL);
    addXp(state.overall, overallXpAward);

    // XP feedback stays in the HUD only; harvesting never creates XP pop-ups.
    renderHUD();
  }

  function gainClassXp(className, amount) {
    const classData = state.classes[className];
    if (!classData || amount <= 0) return;
    addXp(classData, amount);
    // Class XP is displayed quietly in the Class XP menu.
    renderHUD();
  }

  function spawnInitialForest() {
    const count = Math.min(6, treeSlots.length);
    for (let i = 0; i < count; i += 1) spawnTree();
  }

  function startForageSpawner() {
    scheduleNextForageSpawn(randomInt(2200, 6500));
  }

  function scheduleNextForageSpawn(delay = randomInt(3200, 12000)) {
    if (runtime.forageSpawnTimer) window.clearTimeout(runtime.forageSpawnTimer);

    runtime.forageSpawnTimer = window.setTimeout(() => {
      if (state.location === 'forest' && runtime.forageNodes.size < 4) {
        spawnForageNode();
      }

      // Every spawn uses a freshly randomized delay so mushrooms appear unpredictably.
      scheduleNextForageSpawn(randomInt(3200, 12000));
    }, delay);
  }

  function chooseForageType() {
    const totalWeight = forageTypes.reduce((sum, type) => sum + type.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const type of forageTypes) {
      roll -= type.weight;
      if (roll <= 0) return type;
    }
    return forageTypes[0];
  }

  function getFreeForageSlot() {
    const free = forageSlots
      .map((slot, index) => ({ slot, index }))
      .filter(({ index }) => !runtime.occupiedForageSlots.has(index))
      .filter(({ slot }) => {
        // Keep forageables out of the visual footprint of active tree trunks.
        return Array.from(runtime.trees.values()).every((tree) => {
          const horizontalDistance = Math.abs(slot.x - tree.x);
          return horizontalDistance >= 7.5;
        });
      });

    return free.length ? free[randomInt(0, free.length - 1)].index : null;
  }

  function spawnForageNode() {
    const slotIndex = getFreeForageSlot();
    if (slotIndex === null) return;

    const slot = forageSlots[slotIndex];
    const type = chooseForageType();
    const forage = {
      id: ++runtime.forageNodeId,
      slotIndex,
      type,
      harvested: false,
      expireTimer: null,
    };

    runtime.occupiedForageSlots.add(slotIndex);
    runtime.forageNodes.set(forage.id, forage);

    const node = document.createElement('button');
    node.type = 'button';
    node.className = `forest-forage-node forage-${type.className} is-spawning`;
    node.style.left = `${clamp(slot.x + randomInt(-1, 1), 4, 97)}%`;
    node.style.top = `${clamp(slot.y + randomInt(0, 1), 90, 96)}%`;
    node.style.setProperty('--forage-scale', String(slot.scale * (randomInt(94, 108) / 100)));
    node.style.zIndex = '10000';
    node.setAttribute('aria-label', `Harvest ${type.name}`);

    const forageArt = type.kind === 'grass'
      ? `<span class="forage-onion-art" aria-hidden="true">
          <span class="onion-bulb"></span>
          <span class="onion-blade blade-a"></span>
          <span class="onion-blade blade-b"></span>
          <span class="onion-blade blade-c"></span>
          <span class="onion-blade blade-d"></span>
        </span>`
      : `<span class="forage-mushroom-art" aria-hidden="true">
          <span class="forage-cap"><i></i><i></i><i></i></span>
          <span class="forage-stem"></span>
        </span>`;

    node.innerHTML = `
      <span class="forage-ground-shadow" aria-hidden="true"></span>
      ${forageArt}
      <span class="forage-name">${type.name}</span>
    `;

    forage.node = node;
    ui.forageStage.appendChild(node);
    window.setTimeout(() => node.classList.remove('is-spawning'), 280);

    node.addEventListener('click', () => harvestForageNode(forage));

    const lifetime = randomInt(8000, 14500);
    forage.expireTimer = window.setTimeout(() => expireForageNode(forage), lifetime);
  }

  function harvestForageNode(forage) {
    if (!forage || forage.harvested || !runtime.forageNodes.has(forage.id)) return;
    forage.harvested = true;
    if (forage.expireTimer) window.clearTimeout(forage.expireTimer);

    state.inventory[forage.type.key] = (state.inventory[forage.type.key] || 0) + 1;
    gainSkillXp('foraging', forage.type.xp);
    renderInventory();
    showLoot(forage.node, forage.type.name, 1);
    removeForageNode(forage, 'is-harvested');
  }

  function expireForageNode(forage) {
    if (!forage || forage.harvested || !runtime.forageNodes.has(forage.id)) return;
    removeForageNode(forage, 'is-expiring');
  }

  function removeForageNode(forage, animationClass) {
    runtime.forageNodes.delete(forage.id);
    runtime.occupiedForageSlots.delete(forage.slotIndex);
    if (!forage.node?.isConnected) return;

    forage.node.disabled = true;
    forage.node.classList.add(animationClass);
    window.setTimeout(() => forage.node.remove(), 320);
  }

  function startSlimeSpawner() {
    scheduleNextSlimeSpawn(randomInt(9000, 22000));
  }

  function scheduleNextSlimeSpawn(delay = randomInt(12000, 32000)) {
    if (runtime.slimeSpawnTimer) window.clearTimeout(runtime.slimeSpawnTimer);

    runtime.slimeSpawnTimer = window.setTimeout(() => {
      if (state.location === 'forest' && runtime.slimeNodes.size < 1) {
        spawnSlime();
      }
      scheduleNextSlimeSpawn(randomInt(12000, 32000));
    }, delay);
  }

  function getFreeSlimeSlot() {
    const free = slimeSlots
      .map((_, index) => index)
      .filter((index) => !runtime.occupiedSlimeSlots.has(index));
    return free.length ? free[randomInt(0, free.length - 1)] : null;
  }

  function spawnSlime() {
    const slotIndex = getFreeSlimeSlot();
    if (slotIndex === null) return;

    const slot = slimeSlots[slotIndex];
    const slime = {
      id: ++runtime.slimeNodeId,
      slotIndex,
      expireTimer: null,
    };

    runtime.occupiedSlimeSlots.add(slotIndex);
    runtime.slimeNodes.set(slime.id, slime);

    const lifetime = randomInt(11000, 18000);
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'forest-slime enemy-node is-spawning';
    node.setAttribute('aria-label', 'Fight Slime');
    node.style.left = `${clamp(slot.x + randomInt(-3, 3), 7, 93)}%`;
    node.style.top = `${clamp(slot.y + randomInt(-2, 2), 79, 93)}%`;
    node.style.setProperty('--slime-scale', String(slot.scale * (randomInt(92, 110) / 100)));
    node.style.setProperty('--slime-life', `${lifetime}ms`);
    node.innerHTML = `
      <span class="slime-shadow" aria-hidden="true"></span>
      <span class="slime-body" aria-hidden="true">
        <span class="slime-shine"></span>
        <span class="slime-eye eye-a"></span>
        <span class="slime-eye eye-b"></span>
        <span class="slime-mouth"></span>
      </span>
      <span class="slime-timer" aria-label="Slime remaining time">
        <span class="slime-timer-fill"></span>
      </span>
    `;

    slime.node = node;
    ui.slimeStage.appendChild(node);
    node.addEventListener('click', () => enterCombatWithSlime(slime));
    window.setTimeout(() => node.classList.remove('is-spawning'), 340);
    slime.expireTimer = window.setTimeout(() => despawnSlime(slime), lifetime);
  }

  function despawnSlime(slime) {
    if (!slime || !runtime.slimeNodes.has(slime.id)) return;
    runtime.slimeNodes.delete(slime.id);
    runtime.occupiedSlimeSlots.delete(slime.slotIndex);
    if (!slime.node?.isConnected) return;

    slime.node.classList.add('is-despawning');
    window.setTimeout(() => slime.node.remove(), 360);
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
    let lootDelay = 0;

    const addLootPopup = (name, amount = 1) => {
      showLoot(tree.node, name, amount, lootDelay);
      lootDelay += 110;
    };

    if (tree.variant === 'birch') {
      state.inventory.birchWood += 1;
      addLootPopup('Birch Wood');
      gainSkillXp('woodcutting', 7);
    } else {
      state.inventory.oakWood += 1;
      addLootPopup('Oak Wood');
      gainSkillXp('woodcutting', 5);

      if (tree.variant === 'apple-oak') {
        const appleCount = Math.random() < .3 ? 2 : 1;
        state.inventory.apples += appleCount;
        addLootPopup('Apple', appleCount);
      } else {
        if (Math.random() < .13) {
          state.inventory.acorns += 1;
          addLootPopup('Acorn');
        }
        if (Math.random() < .018) {
          state.inventory.apples += 1;
          addLootPopup('Apple');
        }
      }
    }

    renderInventory();
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
    let itemName = type.itemName;

    if (type.key === 'geode') {
      const amethystDrop = Math.random() < .24;
      const inventoryKey = amethystDrop ? 'amethyst' : 'quartz';
      itemName = amethystDrop ? 'Amethyst' : 'Quartz';
      state.inventory[inventoryKey] += 1;
    } else {
      state.inventory[type.key] += 1;
    }

    gainSkillXp('mining', type.xp);
    renderInventory();
    showLoot(mineNode.node, itemName, 1);
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

  function showLoot(node, itemName, amount = 1, delay = 0) {
    if (!node?.isConnected || !itemName || amount <= 0) return;

    const rect = node.getBoundingClientRect();
    const pop = document.createElement('span');
    pop.className = 'loot-pop';
    pop.style.left = `${clamp(rect.left + (rect.width / 2), 92, window.innerWidth - 92)}px`;
    pop.style.top = `${clamp(rect.top + (rect.height * .42), 92, window.innerHeight - 72)}px`;
    pop.style.setProperty('--loot-delay', `${Math.max(0, delay)}ms`);
    pop.innerHTML = `<span class="loot-name">${itemName}</span><span class="loot-amount">+${amount}</span>`;

    document.body.appendChild(pop);
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


})();

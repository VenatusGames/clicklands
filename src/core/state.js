export function createGameState(defaultState) {
  return JSON.parse(JSON.stringify(defaultState));
}

export function createRuntime() {
  return {
    trees: new Map(),
    occupiedSlots: new Set(),
    treeId: 0,
    mineNodes: new Map(),
    occupiedMineSlots: new Set(),
    mineNodeId: 0,
    forageNodes: new Map(),
    occupiedForageSlots: new Set(),
    forageNodeId: 0,
    forageSpawnTimers: { forest: null, mines: null },
    enemyNodes: new Map(),
    occupiedEnemySlots: new Set(),
    enemyNodeId: 0,
    enemySpawnTimers: { forest: null, mines: null },
    combat: null,
    combatReturnLocation: 'forest',
    swordGesture: null,
    bowCharge: null,
    bowChargeFrame: null,
    bowShotInFlight: false,
    staffGesture: null,
    staffSpellInFlight: false,
    staffCursorSparkAt: 0,
    hammerCharge: null,
    hammerChargeFrame: null,
    hammerSlamInFlight: false,
    hoverResource: null,
    entered: false,
    lumberShopOpen: false,
    villageShopOpen: null,
    sawmillJob: null,
    sawmillTimer: null,
    draggedItem: null,
    hudSafeZoneObserver: null,
  };
}

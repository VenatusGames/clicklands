import test from 'node:test';
import assert from 'node:assert/strict';

import { coinBreakdown, formatCoinPrice } from '../src/core/economy.js';
import { pointInsideRect, segmentIntersectsRect } from '../src/core/geometry.js';
import { addXp, xpNeeded } from '../src/core/progression.js';
import { createGameState, createRuntime } from '../src/core/state.js';
import { analyzeStaffCircle } from '../src/systems/spell-recognition.js';
import { ENEMY_TYPES, forageTypes } from '../src/data/game-data.js';

test('progression handles exact and multi-level XP gains', () => {
  assert.equal(xpNeeded(1), 100);
  assert.equal(xpNeeded(5), 200);

  const progress = { level: 1, xp: 0 };
  assert.equal(addXp(progress, 225), 2);
  assert.deepEqual(progress, { level: 3, xp: 0 });
});

test('currency uses one canonical copper value', () => {
  assert.deepEqual(coinBreakdown(1_020_304), {
    copper: 4,
    silver: 3,
    gold: 2,
    platinum: 1,
  });
  assert.equal(formatCoinPrice(12_345), '1 Gold 23 Silver 45 Copper');
});

test('combat geometry detects points and crossing swipes', () => {
  const rect = { left: 10, right: 30, top: 20, bottom: 40 };
  assert.equal(pointInsideRect(20, 30, rect), true);
  assert.equal(pointInsideRect(5, 30, rect), false);
  assert.equal(segmentIntersectsRect(0, 30, 50, 30, rect), true);
  assert.equal(segmentIntersectsRect(0, 0, 5, 5, rect), false);
});

test('state factories return independent player and runtime state', () => {
  const defaults = { inventory: { oakWood: 0 } };
  const first = createGameState(defaults);
  const second = createGameState(defaults);
  first.inventory.oakWood = 10;

  assert.equal(second.inventory.oakWood, 0);
  assert.ok(createRuntime().trees instanceof Map);
  assert.ok(createRuntime().occupiedSlots instanceof Set);
});

test('staff recognition accepts circles and rejects rectangles', () => {
  const circle = Array.from({ length: 81 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 80;
    return { x: 150 + Math.cos(angle) * 80, y: 150 + Math.sin(angle) * 80 };
  });

  const rectangle = [
    ...Array.from({ length: 21 }, (_, i) => ({ x: 70 + i * 8, y: 70 })),
    ...Array.from({ length: 21 }, (_, i) => ({ x: 230, y: 70 + i * 8 })),
    ...Array.from({ length: 21 }, (_, i) => ({ x: 230 - i * 8, y: 230 })),
    ...Array.from({ length: 21 }, (_, i) => ({ x: 70, y: 230 - i * 8 })),
  ];

  assert.equal(analyzeStaffCircle(circle).accepted, true);
  assert.equal(analyzeStaffCircle(rectangle).accepted, false);
});

test('every enemy has a valid variable-health range', () => {
  for (const enemy of Object.values(ENEMY_TYPES)) {
    assert.ok(enemy.minHealth > 0);
    assert.ok(enemy.maxHealth > enemy.minHealth);
    assert.ok(['forest', 'mines'].includes(enemy.location));
  }
  assert.ok(ENEMY_TYPES.blueSlime.weight < ENEMY_TYPES.greenSlime.weight);
  assert.ok(ENEMY_TYPES.skeleton.weight < ENEMY_TYPES.caveRat.weight);
});

test('mine forage table includes shared mushrooms and cave-only plants', () => {
  const mineForage = forageTypes.filter((type) => type.weights?.mines > 0).map((type) => type.key);
  assert.ok(mineForage.includes('redMushroom'));
  assert.ok(mineForage.includes('brownMushroom'));
  assert.ok(mineForage.includes('whiteMushroom'));
  assert.ok(mineForage.includes('caveLichen'));
  assert.ok(mineForage.includes('glowShroom'));
});

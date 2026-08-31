// Pure progression calculations. Rendering and state ownership stay with the game controller.
function xpNeeded(level) {
  return 100 + ((level - 1) * 25);
}

function formatXp(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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

export { xpNeeded, formatXp, addXp };

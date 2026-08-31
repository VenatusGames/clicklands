import { COIN_RATES } from '../data/game-data.js';

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

function formatCoinPrice(copperValue) {
  const coins = coinBreakdown(copperValue);
  return [
    coins.platinum ? `${coins.platinum} Platinum` : '',
    coins.gold ? `${coins.gold} Gold` : '',
    coins.silver ? `${coins.silver} Silver` : '',
    coins.copper ? `${coins.copper} Copper` : '',
  ].filter(Boolean).join(' ') || '0 Copper';
}

export { coinBreakdown, formatCoinPrice };

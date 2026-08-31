// Static balance, content, equipment, and world-spawn definitions.
const ENTER_SOUND = 'assets/sfx/CL-enter.wav';
const LOGO = 'assets/images/CL-logo.png';
const THEME_KEY = 'clicklands-theme';
const OVERALL_XP_PER_SKILL_LEVEL = 25;
const SLIME_SWORDSMAN_XP = 20;
const SLIME_RANGER_XP = 20;
const SLIME_WIZARD_XP = 20;
const COIN_RATES = { copper: 1, silver: 100, gold: 10000, platinum: 1000000 };
const BASIC_AXE_PRICE = 150;
const LUMBER_SELL_PRICES = {
  oakWood: { name: 'Oak Wood', price: 12 },
  birchWood: { name: 'Birch Wood', price: 20 },
  acorns: { name: 'Acorn', price: 6 },
};
const VILLAGE_SHOPS = {
  farmer: {
    kicker: "Farmer's Counter",
    title: "Farmer's Market",
    sellHeading: 'Sell Produce',
    sellNote: 'The farmer buys useful farm byproducts',
    buyHeading: 'Farm Goods',
    buyNote: 'Food, crops & simple clothing',
    sell: {
      apples: { name: 'Apple', price: 8, icon: '🍎' },
      sawdust: { name: 'Sawdust', price: 2, icon: '<span class="mini-sawdust"></span>' },
    },
    buy: {
      bread: { name: 'Bread', price: 25, icon: '🍞', description: 'A simple loaf of fresh bread.' },
      wheat: { name: 'Wheat', price: 8, icon: '🌾', description: 'A bundle of wheat.' },
      strawHat: { name: 'Straw Hat', price: 120, icon: '<span class="straw-hat-icon" aria-hidden="true"></span>', description: 'Straw hat with a red band · Helmet slot', unique: true },
    },
  },
  'foragers-hut': {
    kicker: "Herbalist's Counter",
    title: "Herbalist's Shop",
    sellHeading: 'Sell Foraged Goods',
    sellNote: 'Wild plants, fungi & acorns',
    buyHeading: 'Herbal Supplies',
    buyNote: 'Potions & trail snacks',
    sell: {
      acorns: { name: 'Acorn', price: 6, icon: '🌰' },
      redMushroom: { name: 'Red Mushroom', price: 12, icon: '🍄' },
      brownMushroom: { name: 'Brown Mushroom', price: 10, icon: '🍄' },
      whiteMushroom: { name: 'White Mushroom', price: 14, icon: '🍄' },
      onionGrass: { name: 'Onion Grass', price: 7, icon: '🧅' },
    },
    buy: {
      smallHealthPotion: { name: 'Small Health Potion', price: 45, icon: '🧪', description: 'A small restorative potion. Healing use comes later.' },
      cookies: { name: 'Cookie', price: 15, icon: '🍪', description: 'A sweet trail snack.' },
    },
  },
  craftsman: {
    kicker: "Craftsman's Counter",
    title: 'Craftsman Shop',
    sellHeading: '',
    sellNote: '',
    buyHeading: 'Ranged Supplies',
    buyNote: 'Starter ranged equipment & ammunition',
    sell: {},
    buy: {
      basicBow: { name: 'Basic Bow', price: 240, icon: '🏹', description: 'Starter bow · Main Hand', unique: true },
      arrows: { name: 'Arrows', price: 30, icon: '➶', description: 'Bundle of 20 arrows.', amount: 20 },
    },
  },
  'strange-shack': {
    kicker: "Wizard's Counter",
    title: 'Wizard Shop',
    sellHeading: '',
    sellNote: '',
    buyHeading: 'Arcane Implements',
    buyNote: 'Simple magical equipment',
    sell: {},
    buy: {
      basicMagicStaff: { name: 'Basic Magic Staff', price: 320, icon: '✦', description: 'Starter magic staff · Main Hand', unique: true },
    },
  },
  blacksmith: {
    kicker: "Blacksmith's Counter",
    title: 'Blacksmith Shop',
    sellHeading: 'Sell Ore & Minerals',
    sellNote: 'Stone, ore, coal, quartz & gems',
    buyHeading: 'Weapons & Armor',
    buyNote: 'Basic forged equipment',
    sell: {
      stone: { name: 'Stone', price: 4, icon: '<span class="mini-ore stone"></span>' },
      coal: { name: 'Coal', price: 7, icon: '<span class="mini-ore coal"></span>' },
      ironOre: { name: 'Iron Ore', price: 16, icon: '<span class="mini-ore iron"></span>' },
      goldOre: { name: 'Gold Ore', price: 42, icon: '<span class="mini-ore gold"></span>' },
      silverOre: { name: 'Silver Ore', price: 90, icon: '<span class="mini-ore silver"></span>' },
      quartz: { name: 'Quartz', price: 26, icon: '<span class="mini-gem quartz"></span>' },
      amethyst: { name: 'Amethyst', price: 72, icon: '<span class="mini-gem amethyst"></span>' },
    },
    buy: {
      basicSword: { name: 'Basic Sword', price: 250, icon: '⚔', description: 'Starter sword · Main Hand', unique: true },
      basicShield: { name: 'Basic Shield', price: 220, icon: '◈', description: 'Starter shield · Off Hand', unique: true },
      basicHammer: { name: 'Basic Battle Hammer', price: 180, icon: '🔨', description: 'Heavy timing weapon · Main Hand', unique: true },
      chainmailHelmet: { name: 'Chainmail Helmet', price: 300, icon: '⛓', description: 'Chainmail armor · Helmet slot', unique: true },
      chainmailChestplate: { name: 'Chainmail Chestplate', price: 500, icon: '⛓', description: 'Chainmail armor · Chestplate slot', unique: true },
      chainmailLeggings: { name: 'Chainmail Leggings', price: 400, icon: '⛓', description: 'Chainmail armor · Leggings slot', unique: true },
      chainmailBoots: { name: 'Chainmail Boots', price: 250, icon: '⛓', description: 'Chainmail armor · Boots slot', unique: true },
    },
  },
};
const SAWMILL_RECIPES = {
  oakWood: { name: 'Oak Wood', plankKey: 'oakPlanks', plankName: 'Oak Planks', duration: 3200, planks: 2, sawdust: 1 },
  birchWood: { name: 'Birch Wood', plankKey: 'birchPlanks', plankName: 'Birch Planks', duration: 5200, planks: 2, sawdust: 1 },
};
const GEAR_ITEMS = {
  basicWoodcuttersAxe: {
    name: "Basic Woodcutter's Axe",
    shortName: 'Basic Axe',
    slot: 'axe',
    icon: '🪓',
    bonus: '+1 tree damage',
  },
  strawHat: {
    name: 'Straw Hat',
    shortName: 'Straw Hat',
    slot: 'helmet',
    icon: '<span class="straw-hat-icon" aria-hidden="true"></span>',
    bonus: 'Cosmetic helmet · no stats yet',
  },
  basicBow: {
    name: 'Basic Bow',
    shortName: 'Basic Bow',
    slot: 'main-hand',
    icon: '🏹',
    weaponType: 'bow',
    ammoType: 'arrows',
    minDamage: 4,
    maxDamage: 12,
    chargeTime: 1200,
    bonus: 'Bow · hold to draw, release to fire · 4–12 damage',
  },
  basicMagicStaff: {
    name: 'Basic Magic Staff',
    shortName: 'Magic Staff',
    slot: 'main-hand',
    icon: '✦',
    weaponType: 'staff',
    spell: 'fireball',
    damage: 10,
    bonus: 'Staff · draw a circle to cast Fireball · 10 damage',
  },
  basicSword: {
    name: 'Basic Sword',
    shortName: 'Basic Sword',
    slot: 'main-hand',
    icon: '⚔',
    weaponType: 'sword',
    damage: 8,
    bonus: 'Sword · 8 combat damage per swipe',
  },
  basicShield: {
    name: 'Basic Shield',
    shortName: 'Basic Shield',
    slot: 'off-hand',
    icon: '◈',
    bonus: 'Starter shield · combat stats later',
  },
  basicHammer: {
    name: 'Basic Battle Hammer',
    shortName: 'Battle Hammer',
    slot: 'main-hand',
    icon: '🔨',
    weaponType: 'hammer',
    timingDuration: 1850,
    ringStart: 330,
    ringTarget: 170,
    ringEnd: 58,
    grazeDamage: 4,
    goodDamage: 10,
    greatDamage: 15,
    perfectDamage: 20,
    bonus: 'Hammer · hold and release when the timing rings align · 4–20 damage',
  },
  chainmailHelmet: {
    name: 'Chainmail Helmet',
    shortName: 'Chain Helm',
    slot: 'helmet',
    icon: '⛓',
    bonus: 'Chainmail armor · stats later',
  },
  chainmailChestplate: {
    name: 'Chainmail Chestplate',
    shortName: 'Chain Chest',
    slot: 'chestplate',
    icon: '⛓',
    bonus: 'Chainmail armor · stats later',
  },
  chainmailLeggings: {
    name: 'Chainmail Leggings',
    shortName: 'Chain Legs',
    slot: 'leggings',
    icon: '⛓',
    bonus: 'Chainmail armor · stats later',
  },
  chainmailBoots: {
    name: 'Chainmail Boots',
    shortName: 'Chain Boots',
    slot: 'boots',
    icon: '⛓',
    bonus: 'Chainmail armor · stats later',
  },
};
const EQUIPMENT_SLOT_LABELS = {
  axe: 'Axe', pickaxe: 'Pickaxe', helmet: 'Helmet', chestplate: 'Chestplate',
  leggings: 'Leggings', boots: 'Boots', back: 'Back', necklace: 'Necklace',
  'ring-1': 'Ring I', 'ring-2': 'Ring II', 'main-hand': 'Main Hand', 'off-hand': 'Off Hand', ammo: 'Ammo',
  'trinket-1': 'Trinket I', 'trinket-2': 'Trinket II', 'trinket-3': 'Trinket III',
  'trinket-4': 'Trinket IV', 'trinket-5': 'Trinket V',
};

const defaultState = {
  theme: 'light',
  location: 'forest',
  lakesideExpanded: true,
  inventoryOpen: false,
  inventoryTab: 'items',
  skillsOpen: false,
  xpMenu: 'skills',
  devToolsOpen: false,
  freeShops: false,
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
    redMushroom: 0,
    brownMushroom: 0,
    whiteMushroom: 0,
    onionGrass: 0,
    bread: 0,
    wheat: 0,
    smallHealthPotion: 0,
    cookies: 0,
    arrows: 0,
    greenGoop: 0,
    basicWoodcuttersAxe: 0,
    basicBow: 0,
    basicMagicStaff: 0,
    strawHat: 0,
    basicSword: 0,
    basicShield: 0,
    basicHammer: 0,
    chainmailHelmet: 0,
    chainmailChestplate: 0,
    chainmailLeggings: 0,
    chainmailBoots: 0,
  },
  wallet: { copper: 0, xelium: 0 },
  equipment: {
    axe: null, pickaxe: null, helmet: null, chestplate: null, leggings: null,
    boots: null, back: null, necklace: null, 'ring-1': null, 'ring-2': null,
    'main-hand': null, 'off-hand': null, ammo: null, 'trinket-1': null, 'trinket-2': null,
    'trinket-3': null, 'trinket-4': null, 'trinket-5': null,
  },
  health: { current: 100, max: 100 },
  overall: { level: 1, xp: 0 },
  skills: {
    woodcutting: { level: 1, xp: 0 },
    mining: { level: 1, xp: 0 },
    foraging: { level: 1, xp: 0 },
    fishing: { level: 1, xp: 0 },
    alchemy: { level: 1, xp: 0 },
    enchanting: { level: 1, xp: 0 },
    archeology: { level: 1, xp: 0 },
  },
  classes: {
    swordsman: { level: 1, xp: 0 },
    ranger: { level: 1, xp: 0 },
    wizard: { level: 1, xp: 0 },
    priest: { level: 1, xp: 0 },
    bard: { level: 1, xp: 0 },
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


const forageTypes = [
  { key: 'redMushroom', name: 'Red Mushroom', className: 'red', weight: 30, xp: 5, kind: 'mushroom' },
  { key: 'brownMushroom', name: 'Brown Mushroom', className: 'brown', weight: 35, xp: 5, kind: 'mushroom' },
  { key: 'whiteMushroom', name: 'White Mushroom', className: 'white', weight: 23, xp: 5, kind: 'mushroom' },
  { key: 'onionGrass', name: 'Onion Grass', className: 'onion-grass', weight: 24, xp: 5, kind: 'grass' },
];

const forageSlots = [
  { x: 7, y: 93, scale: .78 },
  { x: 16, y: 95, scale: .72 },
  { x: 27, y: 91, scale: .80 },
  { x: 37, y: 94, scale: .74 },
  { x: 47, y: 92, scale: .84 },
  { x: 58, y: 95, scale: .73 },
  { x: 68, y: 92, scale: .80 },
  { x: 78, y: 95, scale: .72 },
  { x: 88, y: 92, scale: .78 },
  { x: 96, y: 95, scale: .70 },
];

const slimeSlots = [
  { x: 13, y: 88, scale: .9 }, { x: 27, y: 86, scale: .82 }, { x: 42, y: 91, scale: .96 },
  { x: 57, y: 87, scale: .86 }, { x: 71, y: 91, scale: .94 }, { x: 86, y: 86, scale: .84 },
];

export {
  ENTER_SOUND,
  LOGO,
  THEME_KEY,
  OVERALL_XP_PER_SKILL_LEVEL,
  SLIME_SWORDSMAN_XP,
  SLIME_RANGER_XP,
  SLIME_WIZARD_XP,
  COIN_RATES,
  BASIC_AXE_PRICE,
  LUMBER_SELL_PRICES,
  VILLAGE_SHOPS,
  SAWMILL_RECIPES,
  GEAR_ITEMS,
  EQUIPMENT_SLOT_LABELS,
  defaultState,
  treeSlots,
  treeSizes,
  mineSlots,
  miningTypes,
  forageTypes,
  forageSlots,
  slimeSlots,
};

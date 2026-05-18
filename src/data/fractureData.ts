
export interface FractureTheme {
  id: string;
  name: string;
  desc: string;
  enemyHpMult: number;
  enemyAtkMult: number;
  enemyDefMult: number;
}

export interface FractureModifier {
  id: string;
  name: string;
  desc: string;
  enemyHpMult: number;
  enemyAtkMult: number;
  enemyDefMult: number;
  rewardMult: number;
}

export const THEMES: FractureTheme[] = [
  { id: 'data',       name: 'Data Realm',     desc: 'Corrupted data streams',     enemyHpMult: 1.0, enemyAtkMult: 1.0, enemyDefMult: 1.0 },
  { id: 'machine',    name: 'Machine World',  desc: 'Relentless automata',        enemyHpMult: 1.2, enemyAtkMult: 1.1, enemyDefMult: 0.8 },
  { id: 'void',       name: 'Void Space',     desc: 'Entropic anomalies',         enemyHpMult: 0.8, enemyAtkMult: 1.4, enemyDefMult: 1.0 },
  { id: 'crystal',    name: 'Crystal Cavern', desc: 'Living mineral constructs',  enemyHpMult: 1.5, enemyAtkMult: 0.7, enemyDefMult: 1.3 },
  { id: 'neon',       name: 'Neon Circuit',   desc: 'Pulse-wave sentinels',       enemyHpMult: 0.9, enemyAtkMult: 1.2, enemyDefMult: 1.1 },
  { id: 'ancient',    name: 'Ancient Ruins',  desc: 'Forgotten guardian cores',   enemyHpMult: 1.3, enemyAtkMult: 0.9, enemyDefMult: 1.2 },
];

export const MODIFIERS: FractureModifier[] = [
  { id: 'vampiric',   name: 'Vampiric',   desc: 'Enemies heal each hit',         enemyHpMult: 1.3, enemyAtkMult: 1.0, enemyDefMult: 1.0, rewardMult: 1.5 },
  { id: 'armored',    name: 'Armored',    desc: 'Enemies have tough plating',     enemyHpMult: 1.0, enemyAtkMult: 1.0, enemyDefMult: 2.0, rewardMult: 1.5 },
  { id: 'swift',      name: 'Swift',      desc: 'Enemies attack faster',          enemyHpMult: 1.0, enemyAtkMult: 1.5, enemyDefMult: 1.0, rewardMult: 1.5 },
  { id: 'volatile',   name: 'Volatile',   desc: 'Enemies explode on death',       enemyHpMult: 0.7, enemyAtkMult: 1.3, enemyDefMult: 0.7, rewardMult: 2.0 },
  { id: 'shielded',   name: 'Shielded',   desc: 'Enemies have energy barriers',   enemyHpMult: 1.5, enemyAtkMult: 0.8, enemyDefMult: 1.5, rewardMult: 1.5 },
  { id: 'toxic',      name: 'Toxic',      desc: 'Enemies deal poison damage',     enemyHpMult: 0.9, enemyAtkMult: 1.2, enemyDefMult: 1.0, rewardMult: 1.5 },
];

export interface FractureShopItem {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
  maxLevel: number;
  perLevel: number;
  bonusType: 'currencyGain' | 'fractureAtk' | 'fractureHp' | 'floorHeal' | 'deepStart' | 'rewardMult';
}

export const SHOP_ITEMS: FractureShopItem[] = [
  { id: 'currencyGain', name: 'Core Reservoir',    desc: '+10% fracture shards per level',   baseCost: 50,  costMult: 1.5, maxLevel: 30, perLevel: 0.10, bonusType: 'currencyGain' },
  { id: 'fractureAtk',  name: 'Assault Protocol',  desc: '+5% ATK in fractures per level',   baseCost: 50,  costMult: 1.5, maxLevel: 30, perLevel: 0.05, bonusType: 'fractureAtk' },
  { id: 'fractureHp',   name: 'Vitality Matrix',   desc: '+5% HP in fractures per level',    baseCost: 50,  costMult: 1.5, maxLevel: 30, perLevel: 0.05, bonusType: 'fractureHp' },
  { id: 'floorHeal',    name: 'Repair Node',       desc: 'Heal 5% HP after each floor per level', baseCost: 100, costMult: 2.0, maxLevel: 20, perLevel: 0.05, bonusType: 'floorHeal' },
  { id: 'deepStart',    name: 'Deep Link',         desc: 'Start 3 floors deeper per level',   baseCost: 200, costMult: 2.5, maxLevel: 5,  perLevel: 3,   bonusType: 'deepStart' },
  { id: 'rewardMult',   name: 'Reward Amplifier',  desc: '+10% all fracture rewards per level',baseCost: 150, costMult: 2.0, maxLevel: 20, perLevel: 0.10, bonusType: 'rewardMult' },
];

export const BASE_FLOORS = 10;
export const FLOORS_PER_TIER = 5;
export const BASE_CURRENCY_PER_FLOOR = 10;
export const ENEMY_SCALE_PER_FLOOR = 0.15;
export const BASE_ENEMY_HP = 5000;
export const BASE_ENEMY_ATK = 200;
export const BASE_ENEMY_DEF = 50;

export const ENEMY_NAMES: Record<string, string[]> = {
  data:    ['Corrupted Byte', 'Data Wraith', 'Null Pointer', 'Stack Overflow', 'Memory Leach'],
  machine: ['Sentry Mk.I', 'Drone Unit', 'Assembler Bot', 'Welder Arm', 'Core Guardian'],
  void:    ['Void Shade', 'Entropy Wisp', 'Null Beast', 'Rift Crawler', 'Abyss Watcher'],
  crystal: ['Crystal Hulk', 'Gem Sentinel', 'Quartz Shard', 'Mineral Golem', 'Ore Eater'],
  neon:    ['Pulse Drone', 'Neon Specter', 'Current Stalker', 'Signal Phantom', 'Wave Striker'],
  ancient: ['Ancient Warden', 'Rust Colossus', 'Tomb Keeper', 'Relic Guard', 'Time Warden'],
};

export function getShopCost(item: FractureShopItem, level: number): number {
  return Math.floor(item.baseCost * Math.pow(item.costMult, level));
}


export type AscensionCategory = 'power' | 'economy' | 'multiplier';

export interface AscensionUpgradeDef {
  id: string;
  name: string;
  category: AscensionCategory;
  desc: string;
  baseCost: number;
  costMult: number;
  maxLevel: number;
  perLevel: number; // bonus per level (as decimal, e.g. 0.10 = +10%)
  bonusType: 'atk' | 'hp' | 'def' | 'critChance' | 'critDmg' | 'xp' | 'frags' | 'shards' | 'drop' | 'yield' | 'allStats' | 'momentum' | 'limitBreak';
}

export const ascensionUpgrades: AscensionUpgradeDef[] = [
  // === POWER TREE ===
  { id: 'powerStrike',  name: 'Power Strike',  category: 'power', desc: '+10% ATK per level',       baseCost: 100,  costMult: 1.5,  maxLevel: 50, perLevel: 0.10, bonusType: 'atk' },
  { id: 'powerBulk',    name: 'Power Bulk',    category: 'power', desc: '+10% HP per level',        baseCost: 100,  costMult: 1.5,  maxLevel: 50, perLevel: 0.10, bonusType: 'hp' },
  { id: 'powerFortress',name: 'Power Fortress',category: 'power', desc: '+10% DEF per level',       baseCost: 100,  costMult: 1.5,  maxLevel: 50, perLevel: 0.10, bonusType: 'def' },
  { id: 'powerCrit',    name: 'Power Crit',    category: 'power', desc: '+0.5% crit chance per level',baseCost: 200,  costMult: 1.8,  maxLevel: 20, perLevel: 0.005, bonusType: 'critChance' },
  { id: 'powerFury',    name: 'Power Fury',    category: 'power', desc: '+5% crit damage per level',  baseCost: 200,  costMult: 1.8,  maxLevel: 30, perLevel: 0.05, bonusType: 'critDmg' },

  // === ECONOMY TREE ===
  { id: 'economyXP',    name: 'XP Boost',     category: 'economy', desc: '+10% XP per level',         baseCost: 100,  costMult: 1.5,  maxLevel: 50, perLevel: 0.10, bonusType: 'xp' },
  { id: 'economyFrags', name: 'Fragment Boost',category: 'economy', desc: '+10% skill fragments per level', baseCost: 100, costMult: 1.5, maxLevel: 50, perLevel: 0.10, bonusType: 'frags' },
  { id: 'economyShards',name: 'Shard Boost',   category: 'economy', desc: '+10% ascension shards per level', baseCost: 200, costMult: 2.0, maxLevel: 30, perLevel: 0.10, bonusType: 'shards' },
  { id: 'economyLoot',  name: 'Loot Boost',    category: 'economy', desc: '+2% drop rate per level',   baseCost: 150,  costMult: 1.6,  maxLevel: 30, perLevel: 0.02, bonusType: 'drop' },
  { id: 'economyYield', name: 'Yield Boost',   category: 'economy', desc: '+10% resource yield per level',baseCost: 100, costMult: 1.5, maxLevel: 50, perLevel: 0.10, bonusType: 'yield' },

  // === MULTIPLIER TREE ===
  { id: 'multAll',     name: 'All Stats',     category: 'multiplier', desc: '+5% all stats per level',    baseCost: 500,  costMult: 2.0,  maxLevel: 30, perLevel: 0.05, bonusType: 'allStats' },
  { id: 'multMomentum',name: 'Momentum',      category: 'multiplier', desc: '+5% momentum gain per level',baseCost: 300,  costMult: 1.8,  maxLevel: 30, perLevel: 0.05, bonusType: 'momentum' },
  { id: 'multLimit',   name: 'Limit Break',   category: 'multiplier', desc: '+5% limit break scaling per level',baseCost: 400, costMult: 2.0, maxLevel: 20, perLevel: 0.05, bonusType: 'limitBreak' },
];

export const ASCENSION_TIER_NAMES = ['Mortal', 'Transcendent', 'Cosmic', 'Divine', 'Infinite', 'Eternal'];

export const ASCENSION_TIERS = [
  { name: 'Mortal',       shardReq: 0,      bonus: 0 },
  { name: 'Transcendent', shardReq: 10_000,  bonus: 0.50 },
  { name: 'Cosmic',       shardReq: 100_000, bonus: 1.00 },
  { name: 'Divine',       shardReq: 1_000_000, bonus: 2.00 },
  { name: 'Infinite',     shardReq: 10_000_000, bonus: 5.00 },
  { name: 'Eternal',      shardReq: 100_000_000, bonus: 10.00 },
];

export const SHARD_RATE = 0.1; // shards per enemy level per kill

export function getAscensionCost(def: AscensionUpgradeDef, currentLevel: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costMult, currentLevel));
}

export function getAscensionTier(lifetimeShards: number): number {
  let tier = 0;
  for (let i = ASCENSION_TIERS.length - 1; i >= 0; i--) {
    if (lifetimeShards >= ASCENSION_TIERS[i].shardReq) {
      tier = i;
      break;
    }
  }
  return tier;
}

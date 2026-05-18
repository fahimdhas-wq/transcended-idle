/**
 * Loot Generator — Procedural item generation for scalability.
 *
 * Problem: Hardcoded item arrays limit endgame content.
 *
 * Solution: Generate items procedurally based on player level, rarity,
 * and other factors. AI can tune generation parameters.
 *
 * Usage:
 *   const loot = generateLoot({ level: 100, rarity: 'epic', count: 5 });
 */

import { Decimal } from '../../systems/decimal.js';

// ============================================================
// Types
// ============================================================

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface GeneratedItem {
  id: string;
  name: string;
  type: string;
  rarity: Rarity;
  level: number;
  stats: ItemStats;
  description: string;
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  hp?: number;
  critChance?: number;
  critDamage?: number;
  dropBonus?: number;
  fragmentBonus?: number;
}

export interface LootGenerationOptions {
  level: number;
  rarity?: Rarity;
  type?: string;
  seed?: number;
  count?: number;
  qualityBonus?: number;
}

// ============================================================
// Rarity Configuration
// ============================================================

const RARITY_CONFIG: Record<Rarity, { color: string; multiplier: number; statRange: [number, number] }> = {
  common: { color: '#9d9d9d', multiplier: 1, statRange: [1, 5] },
  uncommon: { color: '#1eff00', multiplier: 2, statRange: [5, 15] },
  rare: { color: '#0070dd', multiplier: 4, statRange: [15, 50] },
  epic: { color: '#a335ee', multiplier: 8, statRange: [50, 150] },
  legendary: { color: '#ff8000', multiplier: 16, statRange: [150, 500] },
  mythic: { color: '#e6cc80', multiplier: 32, statRange: [500, 2000] }
};

// ============================================================
// Item Type Configuration
// ============================================================

const ITEM_TYPES = [
  { id: 'weapon', name: 'Weapon', prefix: ['Plasma', 'Quantum', 'Nano', 'Void', 'Stellar', 'Cosmic'] },
  { id: 'armor', name: 'Armor', prefix: ['Reinforced', 'Energy', 'Nano', 'Void', 'Stellar', 'Cosmic'] },
  { id: 'module', name: 'Module', prefix: ['Core', 'Matrix', 'Node', 'Link', 'Stream', 'Pulse'] },
  { id: 'chip', name: 'Chip', prefix: ['Data', 'Logic', 'Neural', 'Quantum', 'Bio', 'Void'] },
  { id: 'drive', name: 'Drive', prefix: ['Flux', 'Flux', 'Phase', 'Quantum', 'Singularity', 'Infinite'] }
];

const STAT_SUFFIXES: Record<string, string[]> = {
  attack: ['Smasher', 'Crusher', 'Destroyer', 'Annihilator', 'Extinction'],
  defense: ['Shield', 'Barrier', 'Fortress', 'Bastion', 'Citadel'],
  hp: ['Vitality', 'Regeneration', 'Fortitude', 'Resilience', 'Immortal'],
  critChance: ['Precision', 'Targeting', 'Hunter', 'Eagle Eye', 'Perfect'],
  critDamage: ['Power', 'Might', 'Force', 'Wrath', 'Devastation'],
  dropBonus: ['Fortune', 'Prosperity', 'Abundance', 'Wealth', 'Golden'],
  fragmentBonus: ['Extraction', 'Harvesting', 'Collection', 'Gathering', 'Mastery']
};

// ============================================================
// Seeded RNG
// ============================================================

class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// ============================================================
// Stat Name Generation
// ============================================================

function getStatSuffix(statType: keyof ItemStats): string[] {
  return STAT_SUFFIXES[statType] || ['Enhancement'];
}

// ============================================================
// Rarity Selection
// ============================================================

export function rollRarity(
  baseChance: number = 0.7,
  qualityBonus: number = 0,
  rng?: SeededRNG
): Rarity {
  const roll = (rng?.next() ?? Math.random()) + qualityBonus / 100;

  if (roll > 0.98) return 'mythic';
  if (roll > 0.95) return 'legendary';
  if (roll > 0.85) return 'epic';
  if (roll > 0.70) return 'rare';
  if (roll > 0.50) return 'uncommon';
  return 'common';
}

// ============================================================
// Main Item Generator
// ============================================================

export function generateItem(options: LootGenerationOptions): GeneratedItem {
  const {
    level,
    rarity: forcedRarity,
    type: forcedType,
    seed = Date.now() + Math.random() * 10000,
    qualityBonus = 0
  } = options;

  const rng = new SeededRNG(seed);

  // Select type
  const typeConfig = forcedType
    ? ITEM_TYPES.find(t => t.id === forcedType) || ITEM_TYPES[0]
    : rng.pick(ITEM_TYPES);

  // Roll rarity
  const rarity = forcedRarity || rollRarity(0.7, qualityBonus, rng);
  const rarityConfig = RARITY_CONFIG[rarity];

  // Generate stats based on rarity
  const [minStat, maxStat] = rarityConfig.statRange;
  const levelMult = Math.pow(1.1, level);

  const stats: ItemStats = {};

  // Weapon types get attack and crit
  if (typeConfig.id === 'weapon') {
    stats.attack = Math.floor(rng.nextInt(minStat, maxStat) * levelMult);
    stats.critChance = Math.floor(rarityConfig.multiplier * rng.nextInt(1, 5));
    stats.critDamage = Math.floor(rarityConfig.multiplier * rng.nextInt(10, 30));
  }
  // Armor types get defense and HP
  else if (typeConfig.id === 'armor') {
    stats.defense = Math.floor(rng.nextInt(minStat, maxStat) * levelMult);
    stats.hp = Math.floor(rng.nextInt(minStat, maxStat) * levelMult * 10);
  }
  // Other types get random utility stats
  else {
    const possibleStats: (keyof ItemStats)[] = ['dropBonus', 'fragmentBonus', 'critChance', 'critDamage'];
    const numStats = Math.min(Math.floor(rng.next() * 3) + 1, possibleStats.length);

    for (let i = 0; i < numStats; i++) {
      const statType = rng.pick(possibleStats);
      possibleStats.splice(possibleStats.indexOf(statType), 1);

      if (statType === 'dropBonus' || statType === 'fragmentBonus') {
        stats[statType] = Math.floor(rarityConfig.multiplier * rng.nextInt(1, 10));
      } else {
        stats[statType] = Math.floor(rarityConfig.multiplier * rng.nextInt(5, 20));
      }
    }
  }

  // Generate name
  const prefix = rng.pick(typeConfig.prefix);
  const primaryStat = Object.keys(stats)[0];
  const suffix = primaryStat ? rng.pick(getStatSuffix(primaryStat as keyof ItemStats)) : 'Core';
  const name = `${prefix} ${typeConfig.name} ${suffix}`;

  // Generate description
  const description = generateDescription(typeConfig.name, stats, rarity);

  // Generate unique ID
  const id = `item_${typeConfig.id}_${rarity}_${level}_${seed}`;

  return {
    id,
    name,
    type: typeConfig.id,
    rarity,
    level,
    stats,
    description
  };
}

// ============================================================
// Description Generator
// ============================================================

function generateDescription(itemType: string, stats: ItemStats, rarity: Rarity): string {
  const parts: string[] = [];

  if (stats.attack) parts.push(`+${stats.attack} Attack Power`);
  if (stats.defense) parts.push(`+${stats.defense} Defense`);
  if (stats.hp) parts.push(`+${stats.hp} Max HP`);
  if (stats.critChance) parts.push(`+${stats.critChance}% Critical Chance`);
  if (stats.critDamage) parts.push(`+${stats.critDamage}% Critical Damage`);
  if (stats.dropBonus) parts.push(`+${stats.dropBonus}% Drop Rate`);
  if (stats.fragmentBonus) parts.push(`+${stats.fragmentBonus}% Fragment Gain`);

  const rarityText = {
    common: 'Standard issue',
    uncommon: 'Enhanced',
    rare: 'Superior',
    epic: 'Epic',
    legendary: 'Legendary',
    mythic: 'Mythic'
  }[rarity];

  return `${rarityText} ${itemType}. ${parts.join(', ')}.`;
}

// ============================================================
// Batch Loot Generation
// ============================================================

export function generateLoot(options: LootGenerationOptions): GeneratedItem[] {
  const { count = 1, seed: baseSeed = Date.now() } = options;

  const items: GeneratedItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(generateItem({
      ...options,
      seed: baseSeed + i
    }));
  }

  return items;
}

// ============================================================
// Loot Table (for specific drops)
// ============================================================

export interface LootTableEntry {
  itemId: string;
  weight: number;
  minLevel: number;
  maxLevel: number;
}

export function rollFromLootTable(
  table: LootTableEntry[],
  playerLevel: number,
  rng?: SeededRNG
): LootTableEntry | null {
  const validEntries = table.filter(
    e => playerLevel >= e.minLevel && playerLevel <= e.maxLevel
  );

  if (validEntries.length === 0) return null;

  const totalWeight = validEntries.reduce((sum, e) => sum + e.weight, 0);
  let roll = (rng?.next() ?? Math.random()) * totalWeight;

  for (const entry of validEntries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }

  return validEntries[validEntries.length - 1];
}

/**
 * Enemy Generator — Procedural enemy generation with seeded RNG.
 *
 * Problem: Hardcoded enemy arrays limit scalability and content variety.
 *
 * Solution: Generate enemies on-the-fly based on level with deterministic RNG.
 * Same seed + level = same enemy every time. Perfect for replay/debugging.
 *
 * Usage:
 *   const enemy = generateEnemy(playerLevel);
 *   const boss = generateEnemy(playerLevel, { isBoss: true, seed: 12345 });
 */

import { Decimal, type DecimalSource } from '../../systems/decimal.js';

// ============================================================
// Types
// ============================================================

export type EnemyType = 'spectral' | 'organic' | 'robotic' | 'cybernetic' | 'eldritch';

export interface GeneratedEnemy {
  id: string;
  name: string;
  level: Decimal;
  hp: Decimal;
  maxHp: Decimal;
  attack: Decimal;
  type: EnemyType;
  isBoss: boolean;
  zone: string;
}

export interface EnemyGeneratorOptions {
  /** Force this enemy type */
  type?: EnemyType;
  /** Boss enemy (higher stats, unique name) */
  isBoss?: boolean;
  /** Seed for deterministic RNG (default: random) */
  seed?: number;
  /** Zone override */
  zone?: string;
}

// ============================================================
// Scaling Constants (from enemies.json)
// ============================================================

const HP_EXP = 1.15;
const ATK_EXP = 1.12;
const XP_EXP = 1.08;

// ============================================================
// Seeded RNG
// ============================================================

class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 PRNG
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Random integer in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random element from array
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Random boolean with probability
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// ============================================================
// Name Generation
// ============================================================

const PREFIXES = [
  'Corrupted', 'Prime', 'Omega', 'Alpha', 'Delta', 'Nexus', 'Void', 'Stellar', 'Quantum', 'Prismatic',
  'Ancient', 'Cursed', 'Divine', 'Feral', 'Glorious', 'Hollow', 'Infinite', 'Jealous', 'Keen', 'Luminous'
];

const BASE_NAMES = [
  'Node', 'Drone', 'Walker', 'Seeker', 'Hunter', 'Guardian', 'Entity', 'Fragment', 'Signal', 'Echo',
  'Shard', 'Core', 'Prime', 'Swarm', 'Titan', 'Wraith', 'Construct', 'Spawn', 'Host', 'Vector'
];

const TITLES = [
  'of the Deep', 'of Light', 'of Shadow', 'the Endless', 'the Infinite', 'the First', 'the Last',
  'the Swift', 'the Mighty', 'the Forgotten', 'the Awakened', 'the Eternal', 'the Broken', 'the Ascended'
];

const BOSS_PREFIXES = [
  'Supreme', 'Arch', 'Proto', 'Omega', 'Prime', 'Neo', 'Ultra', 'Mega', 'Hyper', 'Omni'
];

const BOSS_SUFFIXES = [
  'Overlord', 'Master', 'Ruler', 'Sovereign', 'Commander', 'General', 'Champion', 'Warden', 'Sentinel', 'Paragon'
];

function generateEnemyName(rng: SeededRNG, isBoss: boolean, level: number): string {
  if (isBoss) {
    const prefix = rng.pick(BOSS_PREFIXES);
    const base = rng.pick(BASE_NAMES);
    const suffix = rng.pick(BOSS_SUFFIXES);
    return `${prefix} ${base} ${suffix}`;
  }

  const usePrefix = rng.chance(0.6);
  const useTitle = rng.chance(0.2);

  let name = rng.pick(BASE_NAMES);

  if (usePrefix) {
    name = `${rng.pick(PREFIXES)} ${name}`;
  }

  if (useTitle) {
    name = `${name} ${rng.pick(TITLES)}`;
  }

  return name;
}

// ============================================================
// Type Selection by Level
// ============================================================

const TYPE_BY_LEVEL: Array<{ types: EnemyType[]; minLevel: number }> = [
  { types: ['spectral', 'cybernetic'], minLevel: 1 },
  { types: ['organic', 'robotic'], minLevel: 50 },
  { types: ['cybernetic', 'eldritch'], minLevel: 200 },
  { types: ['eldritch', 'spectral'], minLevel: 500 },
  { types: ['spectral', 'organic', 'robotic', 'cybernetic', 'eldritch'], minLevel: 1000 }
];

function selectType(rng: SeededRNG, level: number, forcedType?: EnemyType): EnemyType {
  if (forcedType) return forcedType;

  for (const tier of TYPE_BY_LEVEL) {
    if (level >= tier.minLevel) {
      return rng.pick(tier.types);
    }
  }

  return rng.pick(TYPE_BY_LEVEL[0].types);
}

// ============================================================
// Stat Scaling
// ============================================================

function calculateEnemyHP(level: DecimalSource): Decimal {
  const lvl = level instanceof Decimal ? level : new Decimal(level);
  const growth = new Decimal(HP_EXP).pow(lvl.sub(1).max(0));
  return new Decimal(50).mul(growth);
}

function calculateEnemyAttack(level: DecimalSource): Decimal {
  const lvl = level instanceof Decimal ? level : new Decimal(level);
  const growth = new Decimal(ATK_EXP).pow(lvl.sub(1).max(0));
  return new Decimal(5).mul(growth);
}

// ============================================================
// Zone Selection
// ============================================================

const ZONES = [
  { id: 'neural_wastes', name: 'Neural Wastes', minLevel: 1, maxLevel: 50 },
  { id: 'crystal_valleys', name: 'Crystal Valleys', minLevel: 50, maxLevel: 200 },
  { id: 'void_depths', name: 'Void Depths', minLevel: 200, maxLevel: 500 },
  { id: 'singularity_core', name: 'Singularity Core', minLevel: 500, maxLevel: 1000 },
  { id: 'transcendence', name: 'Transcendence', minLevel: 1000, maxLevel: Infinity }
];

function getZone(level: number): string {
  for (const zone of ZONES) {
    if (level >= zone.minLevel && level < zone.maxLevel) {
      return zone.id;
    }
  }
  return 'transcendence';
}

// ============================================================
// Main Generator
// ============================================================

export function generateEnemy(
  playerLevel: number,
  options: EnemyGeneratorOptions = {}
): GeneratedEnemy {
  const {
    type: forcedType,
    isBoss = false,
    seed = Date.now() + Math.random() * 10000,
    zone: forcedZone
  } = options;

  const rng = new SeededRNG(seed);

  // Generate enemy level (player level ± 5 with variance)
  const levelVariance = Math.max(1, Math.floor(playerLevel * 0.1));
  const enemyLevel = Math.max(1, playerLevel + rng.nextInt(-levelVariance, levelVariance));

  // Select type
  const type = selectType(rng, enemyLevel, forcedType);

  // Calculate stats
  const hp = calculateEnemyHP(enemyLevel);
  const maxHp = hp;
  const attack = calculateEnemyAttack(enemyLevel);

  // Boss gets 5x HP and 2x attack
  const bossMultHp = isBoss ? 5 : 1;
  const bossMultAtk = isBoss ? 2 : 1;

  // Generate unique ID
  const id = `enemy_${type}_${enemyLevel}_${isBoss ? 'boss_' : ''}${seed}`;

  // Generate name
  const name = generateEnemyName(rng, isBoss, enemyLevel);

  // Get zone
  const zone = forcedZone || getZone(enemyLevel);

  return {
    id,
    name,
    level: new Decimal(enemyLevel),
    hp: hp.mul(bossMultHp),
    maxHp: maxHp.mul(bossMultHp),
    attack: attack.mul(bossMultAtk),
    type,
    isBoss,
    zone
  };
}

// ============================================================
// Batch Generation
// ============================================================

export function generateEnemyWave(
  playerLevel: number,
  count: number,
  options: Partial<EnemyGeneratorOptions> = {}
): GeneratedEnemy[] {
  const enemies: GeneratedEnemy[] = [];
  for (let i = 0; i < count; i++) {
    enemies.push(generateEnemy(playerLevel, {
      ...options,
      seed: options.seed ? options.seed + i : Date.now() + i
    }));
  }
  return enemies;
}

// ============================================================
// Difficulty Calculator
// ============================================================

export function calculateDifficultyMultiplier(level: number): number {
  // Returns how much stronger an enemy of this level is compared to level 1
  const hpGrowth = Math.pow(HP_EXP, level - 1);
  const atkGrowth = Math.pow(ATK_EXP, level - 1);
  return (hpGrowth + atkGrowth) / 2;
}

export function estimateTimeToKill(
  playerDPS: DecimalSource,
  enemyLevel: number
): number {
  const enemyHp = calculateEnemyHP(enemyLevel);
  const dps = playerDPS instanceof Decimal ? playerDPS : new Decimal(playerDPS);

  if (dps.lte(0)) return Infinity;
  return enemyHp.div(dps).toNumber();
}

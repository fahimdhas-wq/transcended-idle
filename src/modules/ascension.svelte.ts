
// ============================================================
// ASCENSION SYSTEM
// Multi-layered prestige replacing the Overclock mechanic.
// Spend Ascension Shards on permanent upgrades.
// ============================================================

import { Decimal } from '../systems/decimal.js';
import {
  ascensionUpgrades,
  TIER_REQUIREMENTS,
  TIER_SHARD_MULTIPLIERS,
  type AscensionTier,
  type AscensionUpgradeDef
} from '../data/ascensionUpgrades.js';

// ============================================================
// STATE
// ============================================================

export interface AscensionState {
  shards: number;
  ascensionCount: number;
  currentTier: AscensionTier;
  upgradeLevels: Record<string, number>; // upgrade id -> level
  totalShardsEarned: number;
  lastAscensionTime: number;
  ascensionUnlocked: boolean;
  pendingShards: number; // Shards earned this run, awarded on ascension
}

export const ascensionState: AscensionState = $state({
  shards: 0,
  ascensionCount: 0,
  currentTier: 0 as AscensionTier,
  upgradeLevels: {},
  totalShardsEarned: 0,
  lastAscensionTime: 0,
  ascensionUnlocked: false,
  pendingShards: 0
});

// ============================================================
// TIER CALCULATION
// ============================================================

export function calculateTier(count: number): AscensionTier {
  if (count >= 50) return 5;
  if (count >= 25) return 4;
  if (count >= 10) return 3;
  if (count >= 5) return 2;
  if (count >= 1) return 1;
  return 0;
}

export function updateTier(): void {
  ascensionState.currentTier = calculateTier(ascensionState.ascensionCount);
}

// ============================================================
// SHARD EARNING
// Shards are earned passively and when breaking level walls.
// ============================================================

const LEVEL_WALLS = [
  1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e15, 1e18
];

export function calculateShardGain(currentLevel: Decimal, maxLevelThisRun: Decimal): number {
  // Earn shards when crossing level walls
  let shards = 0;

  for (const wall of LEVEL_WALLS) {
    const wallDec = new Decimal(wall);
    if (currentLevel.lt(wallDec) && maxLevelThisRun.gte(wallDec)) {
      // Crossed this wall
      const tierMult = TIER_SHARD_MULTIPLIERS[ascensionState.currentTier];
      shards += Math.floor(wall * 0.001 * tierMult);
    }
  }

  return shards;
}

// Track max level reached this run
let _maxLevelThisRun = new Decimal(0);

export function trackLevelProgress(level: Decimal): void {
  if (level.gt(_maxLevelThisRun)) {
    _maxLevelThisRun = level;

    // Check for shard gains
    const gained = calculateShardGain(new Decimal(0), _maxLevelThisRun);
    if (gained > 0) {
      ascensionState.pendingShards += gained;
      ascensionState.totalShardsEarned += gained;
    }
  }
}

// ============================================================
// UPGRADE SYSTEM
// ============================================================

export function getUpgradeLevel(id: string): number {
  return ascensionState.upgradeLevels[id] || 0;
}

export function canBuyUpgrade(id: string): boolean {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return false;

  const currentLevel = getUpgradeLevel(id);
  if (currentLevel >= def.maxLevel) return false;

  // Check tier requirement
  if (def.tierRequired > ascensionState.currentTier) return false;

  const cost = calculateUpgradeCost(def, currentLevel);
  return ascensionState.shards >= cost;
}

export function buyUpgrade(id: string, count: number = 1): boolean {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return false;

  let currentLevel = getUpgradeLevel(id);
  let totalCost = 0;

  // Calculate total cost for 'count' levels
  for (let i = 0; i < count && currentLevel < def.maxLevel; i++) {
    totalCost += calculateUpgradeCost(def, currentLevel);
    currentLevel++;
  }

  if (ascensionState.shards < totalCost) return false;

  // Apply upgrade
  ascensionState.shards -= totalCost;
  ascensionState.upgradeLevels[id] = getUpgradeLevel(id) + count;

  return true;
}

export function calculateUpgradeCost(def: AscensionUpgradeDef, currentLevel: number): number {
  if (currentLevel >= def.maxLevel) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costScaling, currentLevel));
}

// ============================================================
// ASCENSION (THE RESET)
// ============================================================

export const ASCENSION_LEVEL_REQUIREMENT = new Decimal(1e6); // Level 1,000,000

export function isAscensionAvailable(): boolean {
  return ascensionState.ascensionUnlocked;
}

export function canAscend(): boolean {
  // Can ascend if level >= 1,000,000
  // For now, make it available after first ascension
  return ascensionState.ascensionCount > 0;
  // In the future: return characterLevel.gte(ASCENSION_LEVEL_REQUIREMENT);
}

export function getAscensionShardCost(): number {
  // Cost increases each ascension: base 1000, +500 per ascension
  const baseCost = 1000;
  const ascensionBonus = ascensionState.ascensionCount * 500;

  // Prestige acceleration reduces cost
  const accelerationLevel = getUpgradeLevel('prestige_acceleration');
  const discount = 1 - (accelerationLevel * 0.10);

  return Math.floor((baseCost + ascensionBonus) * Math.max(0.1, discount));
}

export function performAscension(): {
  shardsGained: number;
  upgradesKept: string[];
} {
  // Calculate shards earned
  const baseShards = Math.floor(
    Math.log10(_maxLevelThisRun.toNumber()) * 10 *
    TIER_SHARD_MULTIPLIERS[ascensionState.currentTier]
  );

  const shardGain = baseShards + ascensionState.pendingShards;

  // Upgrade retention: some upgrades persist through ascension
  const upgradesKept: string[] = [];

  // All upgrades are permanent in the new system
  ascensionUpgrades.forEach(def => {
    upgradesKept.push(def.id);
  });

  // Award shards
  ascensionState.shards += shardGain;
  ascensionState.totalShardsEarned += shardGain;
  ascensionState.pendingShards = 0;

  // Increment ascension count
  ascensionState.ascensionCount++;
  updateTier();

  // Unlock ascension if first time
  if (ascensionState.ascensionCount === 1) {
    ascensionState.ascensionUnlocked = true;
  }

  // Reset max level tracking
  _maxLevelThisRun = new Decimal(0);
  ascensionState.lastAscensionTime = Date.now();

  return { shardsGained: shardGain, upgradesKept };
}

// ============================================================
// MULTIPLIER CALCULATIONS
// Used throughout the game for stat bonuses
// ============================================================

export function getAscensionAtkBonus(): number {
  let bonus = 0;

  // Essence Resonance
  bonus += getUpgradeLevel('essence_resonance') * 0.5;

  // Exponential Growth (all stats)
  bonus += getUpgradeLevel('exponential_growth') * 0.05;

  return bonus;
}

export function getAscensionHpBonus(): number {
  let bonus = 0;

  // Vitality Core
  bonus += getUpgradeLevel('vitality_core') * 0.5;

  // Exponential Growth
  bonus += getUpgradeLevel('exponential_growth') * 0.05;

  return bonus;
}

export function getAscensionDefBonus(): number {
  let bonus = 0;

  // Exponential Growth
  bonus += getUpgradeLevel('exponential_growth') * 0.05;

  return bonus;
}

export function getAscensionCritBonus(): number {
  return getUpgradeLevel('crit_mastery') * 0.05;
}

export function getAscensionXpBonus(): number {
  return getUpgradeLevel('xp_acceleration') * 0.20;
}

export function getAscensionFragmentBonus(): number {
  return getUpgradeLevel('fragment_adept') * 0.25;
}

export function getAscensionDropBonus(): number {
  return getUpgradeLevel('drop_enhancement') * 0.10;
}

export function getAscensionMomentumBonus(): number {
  return getUpgradeLevel('momentum_amplifier') * 0.25;
}

export function getAscensionMomentumDecayReduction(): number {
  return getUpgradeLevel('momentum_mastery') * 0.15;
}

export function getAscensionOfflineBonus(): number {
  return getUpgradeLevel('time_warp') * 0.25;
}

export function getAscensionSoulBonus(): number {
  return getUpgradeLevel('soul_extraction') * 0.10;
}

export function getAscensionShardGainBonus(): number {
  return getUpgradeLevel('infinite_potential') * 0.10;
}

export function getQuickStartBonus(): number {
  return getUpgradeLevel('quick_start') * 100;
}

export function getResourceMemoryBonus(): number {
  return getUpgradeLevel('resource_memory') * 20;
}

export function getKnowledgeVaultBonus(): number {
  return getUpgradeLevel('knowledge_vault') * 20;
}

export function getBestiaryRetentionBonus(): number {
  return getUpgradeLevel('bestiary_retention') * 20;
}

export function getChainAscensionBonus(): number {
  return getUpgradeLevel('chain_ascension');
}

export function getAscensionTotalBonus(): number {
  // Combined bonus for display purposes
  return (
    getAscensionAtkBonus() +
    getAscensionHpBonus() +
    getAscensionDefBonus()
  );
}

// ============================================================
// UI HELPERS
// ============================================================

export function getUpgradeProgress(id: string): {
  current: number;
  max: number;
  percentage: number;
  isMaxed: boolean;
} {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return { current: 0, max: 0, percentage: 0, isMaxed: false };

  const current = getUpgradeLevel(id);
  const isMaxed = current >= def.maxLevel;
  const percentage = def.maxLevel > 0 ? Math.floor((current / def.maxLevel) * 100) : 0;

  return { current, max: def.maxLevel, percentage, isMaxed };
}

export function getAffordableLevelCount(id: string): number {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return 0;

  const currentLevel = getUpgradeLevel(id);
  let count = 0;
  let totalCost = 0;

  while (currentLevel + count < def.maxLevel) {
    const nextCost = calculateUpgradeCost(def, currentLevel + count);
    if (ascensionState.shards < totalCost + nextCost) break;
    totalCost += nextCost;
    count++;
  }

  return count;
}

export function getNextUpgradeCost(id: string): number {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return Infinity;

  const currentLevel = getUpgradeLevel(id);
  if (currentLevel >= def.maxLevel) return Infinity;

  return calculateUpgradeCost(def, currentLevel);
}

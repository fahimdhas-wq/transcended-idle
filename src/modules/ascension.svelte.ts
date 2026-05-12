
// ============================================================
// ASCENSION SYSTEM
// ============================================================

import { Decimal } from '../systems/decimal.js';
import { character, resetCharacter } from './character.svelte.js';
import { miningState } from './mining.svelte.js';
import { forestryState } from './forestry.svelte.js';
import { bestiaryState } from './bestiary.svelte.js';
import { skillsState, SKILL_BASE_COSTS } from './skills.svelte.js';
import { flushStatCache } from './combat.svelte.js';
import { ALL_MINING_IDS, ALL_FORESTRY_IDS } from '../systems/resourceArray.js';
import {
  ascensionUpgrades,
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
  upgradeLevels: Record<string, number>;
  totalShardsEarned: number;
  lastAscensionTime: number;
  ascensionUnlocked: boolean;
  pendingShards: number;
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
  if (count >= 5)  return 2;
  if (count >= 1)  return 1;
  return 0;
}

export function updateTier(): void {
  ascensionState.currentTier = calculateTier(ascensionState.ascensionCount);
}

// ============================================================
// SHARD EARNING — level wall bonuses during a run
// ============================================================

const LEVEL_WALLS = [
  1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e15, 1e18
];

export function calculateShardGain(prevMax: Decimal, newMax: Decimal): number {
  let shards = 0;
  const tierMult = TIER_SHARD_MULTIPLIERS[ascensionState.currentTier];
  for (const wall of LEVEL_WALLS) {
    const wallDec = new Decimal(wall);
    if (prevMax.lt(wallDec) && newMax.gte(wallDec)) {
      shards += Math.floor(wall * 0.001 * tierMult);
    }
  }
  return shards;
}

let _maxLevelThisRun = new Decimal(0);

// Called from game loop whenever levels are gained
export function trackLevelProgress(level: Decimal): void {
  if (level.gt(_maxLevelThisRun)) {
    const prevMax = _maxLevelThisRun;
    _maxLevelThisRun = level;
    const gained = calculateShardGain(prevMax, level);
    if (gained > 0) {
      ascensionState.pendingShards += gained;
    }
  }
}

// Returns total shards that would be earned if ascending right now
export function getProjectedShards(): number {
  // Start from whatever level the player is already at (handles post-reload state)
  const currentLevel = character.level;
  const log = currentLevel.log10();
  const base = isFinite(log) && log > 0
    ? Math.floor(log * 10 * TIER_SHARD_MULTIPLIERS[ascensionState.currentTier])
    : 0;
  return base + ascensionState.pendingShards;
}

// ============================================================
// UPGRADE SYSTEM
// ============================================================

export function getUpgradeLevel(id: string): number {
  return ascensionState.upgradeLevels[id] || 0;
}

export function calculateUpgradeCost(def: AscensionUpgradeDef, currentLevel: number): number {
  if (currentLevel >= def.maxLevel) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costScaling, currentLevel));
}

export function canBuyUpgrade(id: string): boolean {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return false;
  const currentLevel = getUpgradeLevel(id);
  if (currentLevel >= def.maxLevel) return false;
  if (def.tierRequired > ascensionState.currentTier) return false;
  return ascensionState.shards >= calculateUpgradeCost(def, currentLevel);
}

export function buyUpgrade(id: string, count: number = 1): boolean {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return false;

  let currentLevel = getUpgradeLevel(id);
  let totalCost = 0;
  let levelsToBuy = 0;

  for (let i = 0; i < count && currentLevel + levelsToBuy < def.maxLevel; i++) {
    totalCost += calculateUpgradeCost(def, currentLevel + levelsToBuy);
    levelsToBuy++;
  }

  if (levelsToBuy === 0 || ascensionState.shards < totalCost) return false;

  ascensionState.shards -= totalCost;
  ascensionState.upgradeLevels[id] = currentLevel + levelsToBuy;
  return true;
}

// ============================================================
// ASCENSION GATE
// ============================================================

export const ASCENSION_LEVEL_REQUIREMENT = new Decimal(1e6);

export function canAscend(): boolean {
  return character.level.gte(ASCENSION_LEVEL_REQUIREMENT);
}

export function isAscensionAvailable(): boolean {
  return canAscend();
}

// ============================================================
// PERFORM ASCENSION — resets character, awards shards, applies retention
// ============================================================

export function performAscension(): { shardsGained: number; upgradesKept: string[] } {
  const maxLevel = _maxLevelThisRun.gt(0) ? _maxLevelThisRun : character.level;
  const logLevel = maxLevel.log10();
  const baseShards = isFinite(logLevel) && logLevel > 0
    ? Math.floor(logLevel * 10 * TIER_SHARD_MULTIPLIERS[ascensionState.currentTier])
    : 0;
  const shardGain = baseShards + ascensionState.pendingShards;

  // Read retention percentages from upgrades
  const resourceRetention = getUpgradeLevel('resource_memory') * 0.20;
  const bestiaryRetention = getUpgradeLevel('bestiary_retention') * 0.20;
  const knowledgeRetention = getUpgradeLevel('knowledge_vault') * 0.20;

  // Snapshot values to retain
  const retainedDataFrags = bestiaryState.dataFragments.mul(bestiaryRetention);
  const retainedSouls     = bestiaryState.souls.mul(bestiaryRetention);
  const retainedDna       = forestryState.dnaFragments.mul(resourceRetention);
  const retainedMining: Record<string, number> = {};
  const retainedForestry: Record<string, number> = {};

  if (resourceRetention > 0) {
    ALL_MINING_IDS.forEach(id => {
      retainedMining[id] = miningState.resources.getRaw(id) * resourceRetention;
    });
    ALL_FORESTRY_IDS.forEach(id => {
      retainedForestry[id] = forestryState.resources.getRaw(id) * resourceRetention;
    });
  }

  // Snapshot retained skill tiers
  const retainedSkillTiers = knowledgeRetention > 0
    ? skillsState.skills.map(s => Math.floor(s.tierIndex * knowledgeRetention))
    : null;

  // ── RESET ──────────────────────────────────────────────────

  // Character
  resetCharacter();

  // Mining
  miningState.sharpness      = 0;
  miningState.discovery      = 0;
  miningState.sensors        = 0;
  miningState.overclockPower = 0;
  miningState.efficiency     = 0;
  miningState.extraction     = 0;
  miningState.drones         = 0;
  miningState.autoExtractors = 0;
  miningState.toolTier       = 1;
  miningState.toolName       = 'Advanced Extraction Tool';
  miningState.maxEnergy      = 100;
  miningState.energy         = 100;
  ALL_MINING_IDS.forEach(id => miningState.resources.set(id, 0));

  // Forestry
  forestryState.chainsawFuel    = 0;
  forestryState.reforestation   = 0;
  forestryState.ancientSaplings = 0;
  forestryState.mutationPower   = 0;
  forestryState.overclockPower  = 0;
  forestryState.efficiency      = 0;
  forestryState.growthChambers  = 1;
  forestryState.toolTier        = 1;
  forestryState.toolName        = 'Bio-Harvesting Tool';
  forestryState.maxEnergy       = 100;
  forestryState.energy          = 100;
  forestryState.dnaFragments    = new Decimal(0);
  ALL_FORESTRY_IDS.forEach(id => forestryState.resources.set(id, 0));

  // Bestiary upgrades (keep entries/kills, reset upgrades)
  bestiaryState.anatomy         = 1;
  bestiaryState.huntersGreed    = 0;
  bestiaryState.soulExtraction  = 1;
  bestiaryState.dataFragments   = new Decimal(0);
  bestiaryState.souls           = new Decimal(0);

  // Skills
  skillsState.skills.forEach((skill, i) => {
    const baseCost = SKILL_BASE_COSTS[skill.id] ?? 30;
    const targetTier = retainedSkillTiers ? retainedSkillTiers[i] : 0;
    skill.tierIndex = targetTier;
    skill.fragments = new Decimal(0);
    skill.fragmentsNeeded = new Decimal(baseCost)
      .mul(new Decimal(2.5).pow(targetTier))
      .floor();
  });

  // ── RESTORE RETAINED VALUES ──────────────────────────────

  bestiaryState.dataFragments = retainedDataFrags;
  bestiaryState.souls         = retainedSouls;
  forestryState.dnaFragments  = retainedDna;

  if (resourceRetention > 0) {
    ALL_MINING_IDS.forEach(id => {
      if (retainedMining[id] > 0) miningState.resources.set(id, retainedMining[id]);
    });
    ALL_FORESTRY_IDS.forEach(id => {
      if (retainedForestry[id] > 0) forestryState.resources.set(id, retainedForestry[id]);
    });
  }

  // ── UPDATE ASCENSION STATE ───────────────────────────────

  ascensionState.shards           += shardGain;
  ascensionState.totalShardsEarned += shardGain;
  ascensionState.pendingShards     = 0;
  ascensionState.ascensionCount++;
  ascensionState.ascensionUnlocked = true;
  updateTier();

  _maxLevelThisRun               = new Decimal(0);
  ascensionState.lastAscensionTime = Date.now();

  flushStatCache();

  return { shardsGained: shardGain, upgradesKept: ascensionUpgrades.map(u => u.id) };
}

// ============================================================
// MULTIPLIER HELPERS — used in combat/reward systems
// ============================================================

export function getAscensionAtkBonus(): number {
  return getUpgradeLevel('essence_resonance') * 0.5
       + getUpgradeLevel('exponential_growth') * 0.05;
}

export function getAscensionHpBonus(): number {
  return getUpgradeLevel('vitality_core') * 0.5
       + getUpgradeLevel('exponential_growth') * 0.05;
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

export function getAscensionOfflineBonus(): number {
  return getUpgradeLevel('time_warp') * 0.25;
}

export function getUpgradeProgress(id: string): {
  current: number; max: number; percentage: number; isMaxed: boolean;
} {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return { current: 0, max: 0, percentage: 0, isMaxed: false };
  const current = getUpgradeLevel(id);
  const isMaxed = current >= def.maxLevel;
  return {
    current,
    max: def.maxLevel,
    percentage: def.maxLevel > 0 ? Math.floor((current / def.maxLevel) * 100) : 0,
    isMaxed
  };
}

export function getAffordableLevelCount(id: string): number {
  const def = ascensionUpgrades.find(u => u.id === id);
  if (!def) return 0;
  let currentLevel = getUpgradeLevel(id);
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
  return calculateUpgradeCost(def, getUpgradeLevel(id));
}

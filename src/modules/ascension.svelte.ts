
import { Decimal, type DecimalSource } from '../systems/decimal.js';
import { ascensionUpgrades, getAscensionCost, getAscensionTier, SHARD_RATE, ASCENSION_TIERS, type AscensionUpgradeDef } from '../data/ascensionUpgrades.js';
import { trackAscensionShards } from './dailyChallenge.svelte.js';

export interface AscensionState {
  shards: number;
  lifetimeShards: number;
  upgradeLevels: Record<string, number>;
}

export const ascensionState: AscensionState = $state({
  shards: 0,
  lifetimeShards: 0,
  upgradeLevels: {},
});

export function getTier(): number {
  return getAscensionTier(ascensionState.lifetimeShards);
}

export function getTierName(): string {
  return ASCENSION_TIERS[getTier()].name;
}

export function getTierBonus(): number {
  return ASCENSION_TIERS[getTier()].bonus;
}

export function addAscensionShards(enemyLevel: DecimalSource, kills: DecimalSource): void {
  const levelNum = enemyLevel instanceof Decimal ? enemyLevel.toNumber() : Number(enemyLevel);
  const killsNum = kills instanceof Decimal ? kills.toNumber() : Number(kills);
  if (!isFinite(levelNum) || !isFinite(killsNum) || killsNum <= 0) return;

  const shardMult = 1 + ((ascensionState.upgradeLevels['economyShards'] || 0) * 0.10);
  const gained = Math.max(0, Math.floor(levelNum * SHARD_RATE * killsNum * shardMult));

  if (gained > 0) {
    ascensionState.shards += gained;
    ascensionState.lifetimeShards += gained;
    trackAscensionShards(gained);
  }
}

export function getUpgradeLevel(id: string): number {
  return ascensionState.upgradeLevels[id] || 0;
}

export function getUpgradeCost(def: AscensionUpgradeDef): number {
  return getAscensionCost(def, getUpgradeLevel(def.id));
}

export function canBuyUpgrade(def: AscensionUpgradeDef): boolean {
  return getUpgradeLevel(def.id) < def.maxLevel && ascensionState.shards >= getUpgradeCost(def);
}

export function buyUpgrade(def: AscensionUpgradeDef, count: number = 1): number {
  let bought = 0;
  for (let i = 0; i < count; i++) {
    if (!canBuyUpgrade(def)) break;
    const cost = getUpgradeCost(def);
    ascensionState.shards -= cost;
    ascensionState.upgradeLevels[def.id] = (ascensionState.upgradeLevels[def.id] || 0) + 1;
    bought++;
  }
  return bought;
}

export function getAscensionBonus(type: string): number {
  let total = 0;
  for (const def of ascensionUpgrades) {
    if (def.bonusType === type) {
      total += (ascensionState.upgradeLevels[def.id] || 0) * def.perLevel;
    }
  }
  return total;
}

export const ASCENSION_LEVEL_REQUIREMENT = 100000;

// Combined all-stats bonus from multAll tree + tier bonus
export function getAllStatsBonus(): number {
  return getAscensionBonus('allStats') + getTierBonus();
}

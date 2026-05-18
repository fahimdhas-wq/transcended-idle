
import { Decimal } from '../systems/decimal.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getAscensionTier } from '../data/ascensionUpgrades.js';
import { ascensionState } from './ascension.svelte.js';
import { miningState } from './mining.svelte.js';
import { forestryState } from './forestry.svelte.js';
import { bestiaryState } from './bestiary.svelte.js';
import { RIFT_DEFS, type RiftDef } from '../data/riftData.js';

export interface RiftState {
  unlocked: boolean;
  completions: Record<string, number>;
  lastActivation: Record<string, number>;
}

export const riftState: RiftState = $state({
  unlocked: false,
  completions: {},
  lastActivation: {},
});

export function isRiftUnlocked(): boolean {
  return getAscensionTier(ascensionState.lifetimeShards) >= 2;
}

export function getRiftCompletions(id: string): number {
  return riftState.completions[id] || 0;
}

export function getRiftCooldownEnd(id: string): number {
  const last = riftState.lastActivation[id] || 0;
  const def = RIFT_DEFS.find(r => r.id === id);
  if (!def) return 0;
  return last + def.cooldownMs;
}

export function isRiftOnCooldown(id: string): boolean {
  return Date.now() < getRiftCooldownEnd(id);
}

export function getRiftTimeRemaining(id: string): number {
  const end = getRiftCooldownEnd(id);
  return Math.max(0, end - Date.now());
}

export function canActivateRift(def: RiftDef): string | null {
  if (isRiftOnCooldown(def.id)) return 'On cooldown';
  const cost = def.resourceCost;

  if (cost.miningEnergy && miningState.energy < cost.miningEnergy) {
    return 'Not enough mining energy';
  }
  if (cost.forestryEnergy && forestryState.energy < cost.forestryEnergy) {
    return 'Not enough forestry energy';
  }
  if (cost.dataFragments && bestiaryState.dataFragments.lt(cost.dataFragments)) {
    return 'Not enough data fragments';
  }
  if (cost.dnaFragments && forestryState.dnaFragments.lt(cost.dnaFragments)) {
    return 'Not enough DNA fragments';
  }
  if (cost.miningResource && !miningState.resources.gte(cost.miningResource.id, cost.miningResource.amount)) {
    return `Not enough ${cost.miningResource.id}`;
  }
  if (cost.forestryResource && !forestryState.resources.gte(cost.forestryResource.id, cost.forestryResource.amount)) {
    return `Not enough ${cost.forestryResource.id}`;
  }

  return null;
}

export function activateRift(def: RiftDef): boolean {
  const block = canActivateRift(def);
  if (block) return false;

  const cost = def.resourceCost;

  if (cost.miningEnergy) miningState.energy -= cost.miningEnergy;
  if (cost.forestryEnergy) forestryState.energy -= cost.forestryEnergy;
  if (cost.dataFragments) bestiaryState.dataFragments = bestiaryState.dataFragments.sub(cost.dataFragments);
  if (cost.dnaFragments) forestryState.dnaFragments = forestryState.dnaFragments.sub(cost.dnaFragments);
  if (cost.miningResource) miningState.resources.sub(cost.miningResource.id, cost.miningResource.amount);
  if (cost.forestryResource) forestryState.resources.sub(cost.forestryResource.id, cost.forestryResource.amount);

  riftState.completions[def.id] = (riftState.completions[def.id] || 0) + 1;
  riftState.lastActivation[def.id] = Date.now();

  addLog(`[RIFT] ${def.name} activated — ${def.effect}`, 'awakening');

  return true;
}

export function getRiftTotalBonus(type: string): number {
  let total = 0;
  for (const def of RIFT_DEFS) {
    if (def.bonus.type === type) {
      total += (riftState.completions[def.id] || 0) * def.bonus.perLevel;
    }
  }
  return total;
}

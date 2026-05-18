
import { Decimal } from '../systems/decimal.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { miningState } from './mining.svelte.js';
import { forestryState } from './forestry.svelte.js';
import { character } from './character.svelte.js';
import { getTotalTicks } from '../core/tickState.js';
import { GATHERING_CONSTANTS } from '../data/gatheringConfig.js';

export interface ActivePlayState {
  powerActive: boolean;
  powerEndTick: number;
  boostActive: boolean;
  boostEndTick: number;
  collectCooldownEnd: number;
}

export const activePlayState: ActivePlayState = $state({
  powerActive: false,
  powerEndTick: 0,
  boostActive: false,
  boostEndTick: 0,
  collectCooldownEnd: 0,
});

const POWER_DURATION_TICKS = 100;
const BOOST_DURATION_TICKS = 300;
const COLLECT_COOLDOWN_MS = 30000;
const POWER_ENERGY_COST = 200;
const BOOST_ENERGY_COST = 150;

export function canUsePower(): string | null {
  if (activePlayState.powerActive) return 'Already active';
  if (miningState.energy < POWER_ENERGY_COST) return 'Not enough mining energy';
  return null;
}

export function canUseBoost(): string | null {
  if (activePlayState.boostActive) return 'Already active';
  if (forestryState.energy < BOOST_ENERGY_COST) return 'Not enough forestry energy';
  return null;
}

export function canUseCollect(): string | null {
  if (Date.now() < activePlayState.collectCooldownEnd) return 'On cooldown';
  return null;
}

export function activatePower(): boolean {
  if (canUsePower()) return false;
  miningState.energy -= POWER_ENERGY_COST;
  activePlayState.powerActive = true;
  activePlayState.powerEndTick = getTotalTicks() + POWER_DURATION_TICKS;
  addLog('[ACTIVE] Power Surge activated — +100% ATK for 10s', 'awakening');
  return true;
}

export function activateBoost(): boolean {
  if (canUseBoost()) return false;
  forestryState.energy -= BOOST_ENERGY_COST;
  activePlayState.boostActive = true;
  activePlayState.boostEndTick = getTotalTicks() + BOOST_DURATION_TICKS;
  addLog('[ACTIVE] Boost activated — +200% XP for 30s', 'awakening');
  return true;
}

export function activateCollect(): boolean {
  if (canUseCollect()) return false;
  activePlayState.collectCooldownEnd = Date.now() + COLLECT_COOLDOWN_MS;
  miningState.miningProgress = GATHERING_CONSTANTS.PROGRESS_THRESHOLD;
  forestryState.growthProgress = GATHERING_CONSTANTS.PROGRESS_THRESHOLD;
  addLog('[ACTIVE] Collect activated — resources gathered instantly', 'system');
  return true;
}

export function tickActivePlay(ticks: number): void {
  const tick = getTotalTicks();
  if (activePlayState.powerActive && tick >= activePlayState.powerEndTick) {
    activePlayState.powerActive = false;
  }
  if (activePlayState.boostActive && tick >= activePlayState.boostEndTick) {
    activePlayState.boostActive = false;
  }
}

export function getPowerAtkMult(): number {
  return activePlayState.powerActive ? 2.0 : 1;
}

export function getBoostXpMult(): number {
  return activePlayState.boostActive ? 3.0 : 1;
}



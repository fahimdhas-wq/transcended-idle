
import { Decimal } from '../systems/decimal.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getAscensionTier } from '../data/ascensionUpgrades.js';
import { ascensionState } from './ascension.svelte.js';
import { character } from './character.svelte.js';
import { PARADOX_DEFS, type ParadoxDef } from '../data/paradoxData.js';
import { getTotalTicks } from '../core/tickState.js';

export interface ParadoxState {
  unlocked: boolean;
  activeId: string | null;
  startKills: Decimal;
  startTick: number;
  progressKills: number;
  completions: Record<string, number>;
  cooldownEnd: number;
}

export const paradoxState: ParadoxState = $state({
  unlocked: false,
  activeId: null,
  startKills: Decimal.ZERO,
  startTick: 0,
  progressKills: 0,
  completions: {},
  cooldownEnd: 0,
});

export function isParadoxUnlocked(): boolean {
  return getAscensionTier(ascensionState.lifetimeShards) >= 3;
}

export function getActiveParadox(): ParadoxDef | null {
  if (!paradoxState.activeId) return null;
  return PARADOX_DEFS.find(d => d.id === paradoxState.activeId) || null;
}

export function getParadoxCompletions(id: string): number {
  return paradoxState.completions[id] || 0;
}

export function canStartParadox(id: string): string | null {
  if (paradoxState.activeId) return 'A paradox is already active';
  if (Date.now() < paradoxState.cooldownEnd) return 'On cooldown';
  const def = PARADOX_DEFS.find(d => d.id === id);
  if (!def) return 'Unknown paradox';
  return null;
}

export function startParadox(id: string): boolean {
  const block = canStartParadox(id);
  if (block) return false;

  paradoxState.activeId = id;
  paradoxState.startKills = character.kills;
  paradoxState.progressKills = 0;
  paradoxState.startTick = getTotalTicks();

  addLog(`[PARADOX] ${PARADOX_DEFS.find(d => d.id === id)?.name} started!`, 'awakening');
  return true;
}

export function cancelParadox(): void {
  if (!paradoxState.activeId) return;
  const def = getActiveParadox();
  paradoxState.activeId = null;
  if (def) {
    addLog(`[PARADOX] ${def.name} cancelled`, 'system');
  }
}

export function tickParadox(ticks: number): void {
  if (!paradoxState.activeId) return;
  const def = getActiveParadox();
  if (!def) { paradoxState.activeId = null; return; }

  const killsSinceStart = character.kills.sub(paradoxState.startKills).toNumber();
  paradoxState.progressKills = Math.max(0, Math.floor(killsSinceStart));

  if (paradoxState.progressKills >= def.targetKills) {
    const ascShards = Math.floor(def.rewardAscShards * (1 + getAscensionTier(ascensionState.lifetimeShards) * 0.5));
    ascensionState.shards += ascShards;
    ascensionState.lifetimeShards += ascShards;

    paradoxState.completions[def.id] = (paradoxState.completions[def.id] || 0) + 1;
    paradoxState.activeId = null;
    paradoxState.cooldownEnd = Date.now() + def.cooldownMs;

    addLog(`[PARADOX] ${def.name} completed! +${ascShards} ascension shards, +${(def.rewardAllStats * 100).toFixed(1)}% all stats`, 'awakening');
  }
}

export function getParadoxAtkMult(): number {
  const def = getActiveParadox();
  if (!def) return 1;

  if (def.id === 'chaos') {
    const t = Math.floor(getTotalTicks() / 100) % 4;
    const vals = [1.5, 0.5, 2.0, 0.8];
    return vals[t];
  }
  return def.playerAtkMult;
}

export function getParadoxHpMult(): number {
  const def = getActiveParadox();
  if (!def) return 1;

  if (def.id === 'chaos') {
    const t = Math.floor(getTotalTicks() / 100) % 4;
    const vals = [0.5, 1.5, 0.3, 2.0];
    return vals[t];
  }
  return def.playerHpMult;
}

export function getParadoxXpMult(): number {
  const def = getActiveParadox();
  if (!def) return 1;

  if (def.id === 'chaos') {
    const t = Math.floor(getTotalTicks() / 100) % 4;
    const vals = [1.5, 3.0, 0.5, 2.0];
    return vals[t];
  }
  return def.xpMult;
}

export function getParadoxAllStatsBonus(): number {
  let total = 0;
  for (const def of PARADOX_DEFS) {
    total += (paradoxState.completions[def.id] || 0) * def.rewardAllStats;
  }
  return total;
}

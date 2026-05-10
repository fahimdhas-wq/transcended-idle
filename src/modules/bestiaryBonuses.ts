
import { bestiaryState } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { mobs, type MobType } from '../data/mobs.js';

export function getDamageMultiplier(): number {
  return 1 + bestiaryState.anatomy * 0.1;
}

export function getGlobalStatBoost(): number {
  return bestiaryState.cachedBoost || 0;
}

export function getSoulMult(): Decimal {
  return new Decimal(1).add(bestiaryState.souls.mul(bestiaryState.soulExtraction).mul(0.01));
}

export function getSpeciesDamageBonus(mobId: string): number {
  const entry = bestiaryState.entries[mobId];
  if (!entry) return 1;

  let bonus = 1;
  if (entry.kills.gte(10)) bonus += 0.1;
  if (entry.kills.gte(100)) bonus += 0.2;
  if (entry.kills.gte(500)) bonus += 0.5;
  if (entry.kills.gte(1000)) bonus += 1.0;
  if (entry.kills.gte(5000)) bonus += 2.0;
  return bonus;
}

export function getSpeciesDropBonus(mobId: string): number {
  const entry = bestiaryState.entries[mobId];
  if (!entry) return 0;
  if (entry.stage === 'Known') return 0.02;
  if (entry.stage === 'Mastered') return 0.05;
  if (entry.stage === 'Exalted') return 0.10;
  if (entry.stage === 'Transcendent') return 0.20;
  if (entry.stage === 'Omniscient') return 0.50;
  return 0;
}

function getTypedMilestoneBonus(type: MobType): number {
  let totalBonus = 0;
  let count = 0;

  Object.values(bestiaryState.entries).forEach(entry => {
    // We need to look up the mob type from the mobs array definition
    const mobDef = mobs.find(m => m.id === entry.id);
    if (!mobDef || mobDef.type !== type) return;
    
    count++;
    let bonus = 0;
    if (entry.kills.gte(100)) bonus += 0.25;
    if (entry.kills.gte(1000)) bonus += 0.75;
    totalBonus += bonus;
  });

  return count > 0 ? 1 + (totalBonus / count) : 1;
}

export function getMiningSpeedBonus(): number {
  return getTypedMilestoneBonus('spectral');
}

export function getForestrySpeedBonus(): number {
  return getTypedMilestoneBonus('organic');
}

export function getForestryYieldBonus(): number {
  return getTypedMilestoneBonus('organic');
}

export function getEnergyEfficiencyBonus(): number {
  return getTypedMilestoneBonus('robotic');
}

export function getQuality(): number {
  return bestiaryState.huntersGreed || 0;
}


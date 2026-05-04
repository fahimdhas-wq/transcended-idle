import { bestiaryState } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';

export function getDamageMultiplier() {
  return 1 + (bestiaryState.anatomy * 0.1);
}

export function getGlobalStatBoost() {
  return bestiaryState.cachedBoost || 0;
}

export function getSoulMult() {
  return new Decimal(1).add(bestiaryState.souls.mul(bestiaryState.soulExtraction).mul(0.01));
}

export function getSpeciesDamageBonus(mobId) {
  const entry = bestiaryState.entries[mobId];
  if (!entry) return 1;
  let bonus = 1;
  if (entry.kills >= 10) bonus += 0.1;
  if (entry.kills >= 100) bonus += 0.2;
  if (entry.kills >= 500) bonus += 0.5;
  if (entry.kills >= 1000) bonus += 1.0;
  if (entry.kills >= 5000) bonus += 2.0;
  return bonus;
}

export function getSpeciesDropBonus(mobId) {
  const entry = bestiaryState.entries[mobId];
  if (!entry) return 0;
  if (entry.stage === 'Known') return 0.02;
  if (entry.stage === 'Mastered') return 0.05;
  if (entry.stage === 'Exalted') return 0.10;
  if (entry.stage === 'Transcendent') return 0.20;
  if (entry.stage === 'Omniscient') return 0.50;
  return 0;
}

export function getMiningSpeedBonus() {
  let bonus = 1;
  Object.values(bestiaryState.entries).forEach(e => {
    if (e.type === 'spectral') {
      if (e.kills >= 100) bonus += 0.25;
      if (e.kills >= 1000) bonus += 0.75;
    }
  });
  return bonus;
}

export function getForestrySpeedBonus() {
  let bonus = 1;
  Object.values(bestiaryState.entries).forEach(e => {
    if (e.type === 'organic') {
      if (e.kills >= 100) bonus += 0.25;
      if (e.kills >= 1000) bonus += 0.75;
    }
  });
  return bonus;
}

export function getForestryYieldBonus() {
  let bonus = 1;
  Object.values(bestiaryState.entries).forEach(e => {
    if (e.type === 'organic') {
      if (e.kills >= 100) bonus += 0.25;
      if (e.kills >= 1000) bonus += 0.75;
    }
  });
  return bonus;
}

export function getEnergyEfficiencyBonus() {
  let bonus = 1;
  Object.values(bestiaryState.entries).forEach(e => {
    if (e.type === 'robotic') {
      if (e.kills >= 100) bonus += 0.25;
      if (e.kills >= 1000) bonus += 0.75;
    }
  });
  return bonus;
}

export function getQuality() {
  return 0;
}

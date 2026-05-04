import { mobs } from '../data/mobs.js';
import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal } from '../systems/decimal.js';

export const bestiaryState = $state({
  entries: {},
  dataFragments: new Decimal(0),
  totalKills: new Decimal(0),
  souls: new Decimal(0),
  
  // New Upgrades
  anatomy: 1,         // Damage multiplier
  huntersGreed: 0,    // Quality stat
  soulExtraction: 1,  // Permanent stat boost per soul
  cachedBoost: 0      // Optimized cache
});

// Initialize bestiary
mobs.forEach(mob => {
  bestiaryState.entries[mob.id] = {
    id: mob.id,
    name: mob.name,
    type: mob.type,
    kills: 0, // Using standard number for kills, capped at 1e15
    stage: 'Unknown'
  };
});

// Callback for DNA gain to avoid circular dependency
let dnaGainCallback = null;
export function setDnaGainCallback(cb) { dnaGainCallback = cb; }

export function recordKill(mob, count = 1) {
  if (!bestiaryState.entries[mob.id]) {
    bestiaryState.entries[mob.id] = {
      id: mob.id,
      name: mob.name,
      type: mob.type,
      kills: 0,
      stage: 'Unknown'
    };
  }
  
  const entry = bestiaryState.entries[mob.id];
  const countDec = new Decimal(count);
  const oldTotal = bestiaryState.totalKills;
  
  // Safe kill counting
  const safeCount = Math.min(countDec.toNumber(), 1e15);
  entry.kills = Math.min(entry.kills + safeCount, 1e15);
  bestiaryState.totalKills = bestiaryState.totalKills.add(countDec);

  // Optimized Soul Extraction - O(1) instead of loop
  const totalSoulsPotential = bestiaryState.totalKills.div(100).floor();
  const oldSoulsPotential = oldTotal.div(100).floor();
  const soulsGained = totalSoulsPotential.sub(oldSoulsPotential);

  if (soulsGained.gt(0)) {
    bestiaryState.souls = bestiaryState.souls.add(soulsGained);
  }
  
  // Update stage based on kills
  if (entry.kills >= 10000) entry.stage = 'Omniscient';
  else if (entry.kills >= 5000) entry.stage = 'Transcendent';
  else if (entry.kills >= 1000) entry.stage = 'Exalted';
  else if (entry.kills >= 500) entry.stage = 'Mastered';
  else if (entry.kills >= 100) entry.stage = 'Known';

  // Update cache if milestone hit
  const previousKills = entry.kills - safeCount;
  const milestones = [100, 1000];
  if (milestones.some(m => entry.kills >= m && previousKills < m)) {
    updateGlobalBoost();
  }
  
  // Fragments scaling
  const fragMult = 1 + (entry.kills / 1000);
  if (Math.random() < 0.15) {
    const fragGain = countDec.mul(fragMult).mul(0.2).ceil();
    bestiaryState.dataFragments = bestiaryState.dataFragments.add(fragGain);
  }
  if (Math.random() < 0.08 && dnaGainCallback) {
    const dnaGain = countDec.mul(fragMult).mul(0.1).ceil();
    dnaGainCallback(dnaGain);
  }
}

export function buyBestiaryUpgrade(type, amount = 1) {
  const getCost = (lv) => {
    if (type === 'anatomy') return lv * 500;
    if (type === 'huntersGreed') return (lv + 1) * 1000;
    if (type === 'soulExtraction') return lv * 2500;
    return Infinity;
  };
  
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    totalCost = totalCost.add(getCost(bestiaryState[type] + i));
  }

  if (bestiaryState.dataFragments.gte(totalCost)) {
    bestiaryState.dataFragments = bestiaryState.dataFragments.sub(totalCost);
    bestiaryState[type] += amount;
    
    // Immediate effect application
    if (type === 'anatomy') {
      updateGlobalBoost();
    }
    addLog(`[BESTIARY] Upgraded ${type} x${amount}!`, "system");
  } else {
    addLog(`[BESTIARY] Need ${formatNumber(totalCost)} Data for x${amount} ${type}.`, "system");
  }
}

export function updateGlobalBoost() {
  let boost = 0;
  Object.values(bestiaryState.entries).forEach(e => {
    if (e.kills >= 100) boost += 0.02;
    if (e.kills >= 1000) boost += 0.10;
  });
  bestiaryState.cachedBoost = boost;
}

// Initialize cache on load
updateGlobalBoost();

export function autoUpgradeBestiary() {
  const bulk = 1000;
  ['anatomy', 'huntersGreed', 'soulExtraction'].forEach(t => buyBestiaryUpgrade(t, bulk));
}

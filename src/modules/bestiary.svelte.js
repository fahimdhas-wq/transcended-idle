// src/modules/bestiary.svelte.js
import { mobs } from '../data/mobs.js';
import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal } from '../systems/decimal.js';

const BESTIARY_CONSTANTS = {
  SOUL_KILL_RATIO: 100,
  FRAGMENT_DROP_CHANCE: 0.15, // Unified chance
  STAGE_THRESHOLDS: {
    KNOWN: 100,
    MASTERED: 500,
    EXALTED: 1000,
    TRANSCENDENT: 5000,
    OMNISCIENT: 10000
  }
};

export const bestiaryState = $state({
  entries: {},
  dataFragments: new Decimal(0),
  totalKills: new Decimal(0),
  souls: new Decimal(0),
  
  anatomy: 1,
  huntersGreed: 0,
  soulExtraction: 1,
  cachedBoost: 0
});

// Initialize with Decimal
mobs.forEach(mob => {
  bestiaryState.entries[mob.id] = {
    id: mob.id,
    name: mob.name,
    type: mob.type,
    kills: new Decimal(0), // FIXED: Use Decimal throughout
    stage: 'Unknown'
  };
});

let dnaGainCallback = null;
export function setDnaGainCallback(cb) { dnaGainCallback = cb; }

export function recordKill(mob, count = 1) {
  if (!bestiaryState.entries[mob.id]) {
    bestiaryState.entries[mob.id] = {
      id: mob.id,
      name: mob.name,
      type: mob.type,
      kills: new Decimal(0),
      stage: 'Unknown'
    };
  }
  
  const entry = bestiaryState.entries[mob.id];
  const countDec = new Decimal(count);
  const oldTotal = bestiaryState.totalKills;
  
  // FIXED: Full Decimal support
  entry.kills = entry.kills.add(countDec);
  bestiaryState.totalKills = bestiaryState.totalKills.add(countDec);

  // Optimized Soul Extraction
  const totalSoulsPotential = bestiaryState.totalKills.div(BESTIARY_CONSTANTS.SOUL_KILL_RATIO).floor();
  const oldSoulsPotential = oldTotal.div(BESTIARY_CONSTANTS.SOUL_KILL_RATIO).floor();
  const soulsGained = totalSoulsPotential.sub(oldSoulsPotential);

  if (soulsGained.gt(0)) {
    bestiaryState.souls = bestiaryState.souls.add(soulsGained);
  }
  
  // Update stage based on kills - FIXED: Use Decimal comparisons
  const killsNum = entry.kills.toNumber(); // Safe for display purposes
  if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.OMNISCIENT) entry.stage = 'Omniscient';
  else if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.TRANSCENDENT) entry.stage = 'Transcendent';
  else if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.EXALTED) entry.stage = 'Exalted';
  else if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.MASTERED) entry.stage = 'Mastered';
  else if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.KNOWN) entry.stage = 'Known';

  // Check milestones
  const previousKills = entry.kills.sub(countDec).toNumber();
  const milestones = [
    BESTIARY_CONSTANTS.STAGE_THRESHOLDS.KNOWN, 
    BESTIARY_CONSTANTS.STAGE_THRESHOLDS.MASTERED
  ];
  if (milestones.some(m => killsNum >= m && previousKills < m)) {
    updateGlobalBoost();
  }
  
  // Fragments scaling - SIGNIFICANTLY BOOSTED for 1M/s target at max
  const fragMult = new Decimal(1).add(Math.min(killsNum, 1000000000) / 1000); 
  
  if (Math.random() < BESTIARY_CONSTANTS.FRAGMENT_DROP_CHANCE) {
    // Scaling heavily with character level and bestiary anatomy
    const baseGain = countDec.mul(fragMult).mul(0.5);
    const bonusGain = character.level.div(100).add(1).mul(bestiaryState.anatomy);
    const gain = baseGain.mul(bonusGain).ceil();
    
    bestiaryState.dataFragments = bestiaryState.dataFragments.add(gain);
    if (dnaGainCallback) dnaGainCallback(gain);
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
    
    if (type === 'anatomy') {
      updateGlobalBoost();
    }
    if (type === 'huntersGreed') {
      character.quality = bestiaryState.huntersGreed;
      if (character.stats) character.stats.quality = bestiaryState.huntersGreed;
    }
    addLog(`[BESTIARY] Upgraded ${type} x${amount}!`, "system");
  }
}

export function updateGlobalBoost() {
  let boost = 0;
  Object.values(bestiaryState.entries).forEach(e => {
    const kills = e.kills instanceof Decimal ? e.kills.toNumber() : e.kills;
    if (kills >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.KNOWN) boost += 0.02;
    if (kills >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.MASTERED) boost += 0.10;
  });
  bestiaryState.cachedBoost = boost;
}

updateGlobalBoost();

export function autoUpgradeBestiary() {
  const bulk = 1000;
  ['anatomy', 'huntersGreed', 'soulExtraction'].forEach(t => buyBestiaryUpgrade(t, bulk));
}
import { mobs, type MobDefinition, type MobType } from '../data/mobs.js';
import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { Decimal, type DecimalSource } from '../systems/decimal.js';

export type BestiaryStage = 'Unknown' | 'Known' | 'Mastered' | 'Exalted' | 'Transcendent' | 'Omniscient';
export type BestiaryUpgradeType = 'anatomy' | 'huntersGreed' | 'soulExtraction';

export interface BestiaryEntry {
  id: string;
  name: string;
  type: MobType;
  kills: Decimal;
  stage: BestiaryStage;
}

export interface BestiaryState {
  entries: Record<string, BestiaryEntry>;
  dataFragments: Decimal;
  totalKills: Decimal;
  souls: Decimal;
  anatomy: number;
  huntersGreed: number;
  soulExtraction: number;
  cachedBoost: number;
}

let dnaGainCallback: ((amount: Decimal) => void) | null = null;

const BESTIARY_CONSTANTS = {
  SOUL_KILL_RATIO: 100,
  FRAGMENT_DROP_CHANCE: 0.15,
  STAGE_THRESHOLDS: {
    KNOWN: 100,
    MASTERED: 500,
    EXALTED: 1000,
    TRANSCENDENT: 5000,
    OMNISCIENT: 10000
  }
};

export const bestiaryState: BestiaryState = $state({
  entries: {},
  dataFragments: new Decimal(0),
  totalKills: new Decimal(0),
  souls: new Decimal(0),
  anatomy: 1,
  huntersGreed: 0,
  soulExtraction: 1,
  cachedBoost: 0
});

mobs.forEach(mob => {
  bestiaryState.entries[mob.id] = createEntry(mob);
});

export function setDnaGainCallback(cb: (amount: Decimal) => void): void {
  dnaGainCallback = cb;
}

function createEntry(mob: MobDefinition): BestiaryEntry {
  return {
    id: mob.id,
    name: mob.name,
    type: mob.type,
    kills: new Decimal(0),
    stage: 'Unknown'
  };
}

function stageForKills(killsNum: number): BestiaryStage {
  if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.OMNISCIENT) return 'Omniscient';
  if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.TRANSCENDENT) return 'Transcendent';
  if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.EXALTED) return 'Exalted';
  if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.MASTERED) return 'Mastered';
  if (killsNum >= BESTIARY_CONSTANTS.STAGE_THRESHOLDS.KNOWN) return 'Known';
  return 'Unknown';
}

export function recordKill(mob: MobDefinition, count: DecimalSource = 1): void {
  if (!bestiaryState.entries[mob.id]) {
    bestiaryState.entries[mob.id] = createEntry(mob);
  }

  const entry = bestiaryState.entries[mob.id];
  const countDec = new Decimal(count);
  const oldTotal = bestiaryState.totalKills;

  entry.kills = entry.kills.add(countDec);
  bestiaryState.totalKills = bestiaryState.totalKills.add(countDec);

  const totalSoulsPotential = bestiaryState.totalKills.div(BESTIARY_CONSTANTS.SOUL_KILL_RATIO).floor();
  const oldSoulsPotential = oldTotal.div(BESTIARY_CONSTANTS.SOUL_KILL_RATIO).floor();
  const soulsGained = totalSoulsPotential.sub(oldSoulsPotential);

  if (soulsGained.gt(0)) {
    bestiaryState.souls = bestiaryState.souls.add(soulsGained);
  }

  const killsNum = entry.kills.toNumber();
  entry.stage = stageForKills(killsNum);

  const previousKills = entry.kills.sub(countDec).toNumber();
  const milestones = [
    BESTIARY_CONSTANTS.STAGE_THRESHOLDS.KNOWN,
    BESTIARY_CONSTANTS.STAGE_THRESHOLDS.MASTERED
  ];
  if (milestones.some(m => killsNum >= m && previousKills < m)) {
    updateGlobalBoost();
  }

  const fragMult = new Decimal(1).add(Math.min(killsNum, 1000000000) / 1000);

  if (Math.random() < BESTIARY_CONSTANTS.FRAGMENT_DROP_CHANCE) {
    const baseGain = countDec.mul(fragMult).mul(0.5);
    const bonusGain = character.level.div(100).add(1).mul(bestiaryState.anatomy);
    const gain = baseGain.mul(bonusGain).ceil();

    bestiaryState.dataFragments = bestiaryState.dataFragments.add(gain);
    if (dnaGainCallback) dnaGainCallback(gain);
  }
}

import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import { getAffordableAmount } from '../utils/adjustUpgradeAmount.js';

export function buyBestiaryUpgrade(type: BestiaryUpgradeType, amount: number | 'max' = 1, skipUpdate = false): number {
  let formula: CostFormula;

  if (type === 'anatomy')           formula = { type: 'linear', base: 0, gain: 500 };
  else if (type === 'huntersGreed')  formula = { type: 'linear', base: 1000, gain: 1000 };
  else if (type === 'soulExtraction') formula = { type: 'linear', base: 0, gain: 2500 };
  else return 0;

  const currentLv = Number(bestiaryState[type]);
  let count = 0;
  if (amount === 'max') {
    count = maxAffordable(bestiaryState.dataFragments, currentLv, formula).toNumber();
  } else {
    // Dynamically adjust the requested amount if it's too expensive
    count = getAffordableAmount(bestiaryState.dataFragments, currentLv, formula, amount);
  }

  if (count <= 0) return 0;
  const totalCost = calculateBulkCost(formula, currentLv, count);

  // Already checked via getAffordableAmount
  if (bestiaryState.dataFragments.gte(totalCost)) {
    bestiaryState.dataFragments = bestiaryState.dataFragments.sub(totalCost);
    bestiaryState[type] += count;

    // Skip individual updates during batch operations
    if (!skipUpdate) {
      if (type === 'anatomy') {
        updateGlobalBoost();
      }
      if (type === 'huntersGreed') {
        character.quality = bestiaryState.huntersGreed;
        character.stats.quality = bestiaryState.huntersGreed;
      }
      addLog(`[BESTIARY] Upgraded ${type} x${count}!`, 'system');
    }
    return count;
  }
  return 0;
}

export function updateGlobalBoost(): void {
  let boost = 0;
  Object.values(bestiaryState.entries).forEach(e => {
    if (e.kills.gte(BESTIARY_CONSTANTS.STAGE_THRESHOLDS.KNOWN)) boost += 0.02;
    if (e.kills.gte(BESTIARY_CONSTANTS.STAGE_THRESHOLDS.MASTERED)) boost += 0.10;
  });
  bestiaryState.cachedBoost = boost;
}

updateGlobalBoost();


import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getForestryYieldBonus, getForestrySpeedBonus, getEnergyEfficiencyBonus } from './bestiaryBonuses.js';
import { bestiaryState, setDnaGainCallback } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { GATHERING_CONSTANTS, makeTools, type GatheringTool } from '../data/gatheringConfig.js';

export type ForestryUpgradeType =
  | 'chainsawFuel'
  | 'reforestation'
  | 'ancientSaplings'
  | 'mutationPower'
  | 'overclockPower'
  | 'efficiency';

export interface ForestryState {
  unlocked: boolean;
  autoRefine: Record<string, boolean>;
  toolTier: number;
  toolName: string;
  dnaFragments: Decimal;
  growthProgress: number;
  harvestRate: number;
  dnaRate: number;
  growthChambers: number;
  mutationChance: number;
  reforestation: number;
  energy: number;
  maxEnergy: number;
  isOverclocked: boolean;
  overclockTicks: number;
  chainsawFuel: number;
  ancientSaplings: number;
  mutationPower: number;
  overclockPower: number;
  efficiency: number;
  resources: Record<string, Decimal>;
}

export const bioTools = makeTools([
  'Bio-Harvesting Tool',
  'Nano Harvester',
  'Molecular Extractor',
  'DNA Synthesizer',
  'Quantum Bio Reaper',
  'Cellular Architect',
  'Organoid Forge',
  'Bio-Sphere Siphon',
  'Genetic Overlord',
  'Life-Stream Extractor'
]);

export const forestryState: ForestryState = $state({
  unlocked: false,
  autoRefine: {},
  toolTier: 1,
  toolName: 'Bio-Harvesting Tool',
  dnaFragments: new Decimal(0),
  growthProgress: 0,
  harvestRate: 0, 
  dnaRate: 0,
  growthChambers: 1,
  mutationChance: 0.05,
  reforestation: 0,
  
  energy: 100,
  maxEnergy: 100,
  isOverclocked: false,
  overclockTicks: 0,

  chainsawFuel: 0,
  ancientSaplings: 0,
  mutationPower: 0,
  overclockPower: 0,
  efficiency: 0,

  resources: {
    biomass: new Decimal(0), oakron: new Decimal(0), birchon: new Decimal(0),
    pynex: new Decimal(0), willix: new Decimal(0), mahorix: new Decimal(0),
    tecron: new Decimal(0), ironwood: new Decimal(0), darkwood: new Decimal(0),
    voidwood: new Decimal(0),
    biofiber: new Decimal(0), reinforcedFiber: new Decimal(0), lightPanel: new Decimal(0),
    resinGel: new Decimal(0), flexFiber: new Decimal(0), denseCore: new Decimal(0),
    armorFiber: new Decimal(0), darkMatterFiber: new Decimal(0), crystalGrowth: new Decimal(0),
    spiritFlux: new Decimal(0),
    bioCore: new Decimal(0), terraCore: new Decimal(0), photonBark: new Decimal(0),
    cryoCore: new Decimal(0), psiCore: new Decimal(0), royalMatrix: new Decimal(0),
    guardianCore: new Decimal(0), shadowCore: new Decimal(0), lumenCore: new Decimal(0),
    etherealCore: new Decimal(0)
  }
});

let _dnaAccum = 0;
let _dnaRateTimer = 0;
const DNA_RATE_WINDOW = 5000;
const FORESTRY_CONSTANTS = { REFINE_RATIO: 50, OVERCLOCK_DURATION: 600 };

setDnaGainCallback((amount: Decimal) => {
  forestryState.dnaFragments = forestryState.dnaFragments.add(amount);
});

export function checkForestryUnlock(): void {
  const isEligible = character.level.gte(200);
  if (isEligible && !forestryState.unlocked) {
    forestryState.unlocked = true;
    forestryState.toolTier = 1;
    forestryState.toolName = bioTools[0].name;
    addLog(`[SYSTEM] Bio Harvester Online.`, 'system');
  }
}

export function performForestryTick(ticks: number): void {
  checkForestryUnlock();
  if (!forestryState.unlocked) return;

  const tool = bioTools[Math.max(0, forestryState.toolTier - 1)];
  const speedBonus = getForestrySpeedBonus();
  const energyEff = getEnergyEfficiencyBonus();
  
  let activeSpeed =
    (GATHERING_CONSTANTS.BASE_RATE + forestryState.growthChambers * GATHERING_CONSTANTS.AUTOMATION_BONUS) *
    tool.speed *
    (forestryState.chainsawFuel + 1) *
    (forestryState.reforestation + 1) *
    speedBonus * 2;

  if (forestryState.isOverclocked) {
    const ocMult = GATHERING_CONSTANTS.OVERCLOCK_BASE_MULT +
                   (forestryState.overclockPower + 1) * GATHERING_CONSTANTS.OVERCLOCK_POWER_BONUS;
    activeSpeed *= ocMult;
    forestryState.overclockTicks -= ticks;
    if (forestryState.overclockTicks <= 0) forestryState.isOverclocked = false;
  }

  const effReduction = 1 / (1 + forestryState.efficiency * 0.1);
  const speedLog = Math.max(1, Math.log10(activeSpeed + 1));
  const actualCostPerTick = GATHERING_CONSTANTS.BASE_ENERGY_COST * speedLog * speedLog * effReduction;

  const toolTierMult = forestryState.toolTier;
  const regenPerTick =
    (forestryState.maxEnergy * GATHERING_CONSTANTS.BASE_REGEN_RATE * toolTierMult +
     forestryState.growthChambers * forestryState.maxEnergy * GATHERING_CONSTANTS.AUTOMATION_REGEN * toolTierMult) *
    energyEff;

  let yieldMult = 1.0;
  if (!forestryState.isOverclocked) {
    const totalCost = actualCostPerTick * ticks;
    const totalAvail = forestryState.energy + regenPerTick * ticks;
    if (totalCost > 0) {
      if (totalAvail < totalCost) {
        yieldMult = Math.max(0, totalAvail / totalCost);
        forestryState.energy = 0;
      } else {
        forestryState.energy = Math.max(0, Math.min(forestryState.maxEnergy, totalAvail - totalCost));
      }
    } else {
      forestryState.energy = Math.max(0, Math.min(forestryState.maxEnergy, forestryState.energy + regenPerTick * ticks));
    }
  } else {
    forestryState.energy = Math.max(0, Math.min(forestryState.maxEnergy, forestryState.energy + regenPerTick * ticks));
  }

  if (yieldMult > 0) {
    const progressGain = activeSpeed * GATHERING_CONSTANTS.TICK_RATE * yieldMult * ticks;
    forestryState.harvestRate = (progressGain / ticks) * 10 / GATHERING_CONSTANTS.PROGRESS_THRESHOLD;
    forestryState.growthProgress += progressGain;

    if (forestryState.growthProgress >= GATHERING_CONSTANTS.PROGRESS_THRESHOLD) {
      const harvests = Math.floor(forestryState.growthProgress / GATHERING_CONSTANTS.PROGRESS_THRESHOLD);
      forestryState.growthProgress %= GATHERING_CONSTANTS.PROGRESS_THRESHOLD;
      if (harvests > 0) {
        const activeYield = tool.yield * (1 + forestryState.chainsawFuel * 0.1) + forestryState.growthChambers * 5;
        executeHarvest(tool, activeYield * harvests);
      }
    }
  } else {
    forestryState.harvestRate = 0;
  }

  const elapsedMs = ticks * GATHERING_CONSTANTS.TICK_RATE * 1000;
  _dnaRateTimer += elapsedMs;
  if (_dnaRateTimer >= DNA_RATE_WINDOW && _dnaAccum > 0) {
    forestryState.dnaRate = _dnaAccum / (_dnaRateTimer / 1000);
    _dnaAccum = 0;
    _dnaRateTimer = 0;
  } else if (_dnaRateTimer >= DNA_RATE_WINDOW * 3) {
    forestryState.dnaRate = 0;
    _dnaAccum = 0;
    _dnaRateTimer = 0;
  }
}

function executeHarvest(tool: GatheringTool, amount: number): void {
  const critChance = GATHERING_CONSTANTS.CRIT_CHANCE_BASE +
                     (tool.luck / 1000) * GATHERING_CONSTANTS.CRIT_CHANCE_PER_LUCK;
  let critMult = 1;
  if (Math.random() < critChance) {
    critMult = GATHERING_CONSTANTS.CRIT_MULTIPLIER;
    addLog(`[FORESTRY] MUTATION CLUSTER! ${GATHERING_CONSTANTS.CRIT_MULTIPLIER}x Resources!`, 'loot');
  }

  const maxTier = Math.max(1, Math.min(10, forestryState.ancientSaplings + 1));
  const availableTiers = [
    'biomass','oakron','birchon','pynex','willix',
    'mahorix','tecron','ironwood','darkwood','voidwood'
  ].slice(0, maxTier);

  const yieldMult = new Decimal(10).pow(
    (tool.tier - 1) * GATHERING_CONSTANTS.YIELD_TIER_STEP + GATHERING_CONSTANTS.YIELD_BASE_EXPONENT
  );
  const totalAmount = new Decimal(amount).mul(critMult).mul(yieldMult);

  const amountPerTier = totalAmount.div(availableTiers.length).floor();
  const remainder = totalAmount.mod(availableTiers.length).toNumber();

  availableTiers.forEach((id, index) => {
    let finalAmount = amountPerTier;
    if (index < remainder) finalAmount = finalAmount.add(1);
    if (finalAmount.gt(0)) {
      forestryState.resources[id] = (forestryState.resources[id] || new Decimal(0)).add(finalAmount);
      handleBioRefining(id);
    }
  });

  if (Math.random() < GATHERING_CONSTANTS.FRAG_DROP_CHANCE) {
    const fragGain = new Decimal(Math.pow(tool.tier, GATHERING_CONSTANTS.FRAG_TIER_POWER))
      .mul(forestryState.chainsawFuel + 1)
      .mul(forestryState.reforestation + 1)
      .mul(10)
      .ceil();
    forestryState.dnaFragments = forestryState.dnaFragments.add(fragGain);
    bestiaryState.dataFragments = bestiaryState.dataFragments.add(fragGain);
    _dnaAccum += fragGain.toNumber();
  }
}


const BIO_REFINE_MAP: Record<string, string> = {
  biomass: 'biofiber', oakron: 'reinforcedFiber', birchon: 'lightPanel',
  pynex: 'resinGel', willix: 'flexFiber', mahorix: 'denseCore',
  tecron: 'armorFiber', ironwood: 'darkMatterFiber', darkwood: 'crystalGrowth',
  voidwood: 'spiritFlux',
  biofiber: 'bioCore', reinforcedFiber: 'terraCore', lightPanel: 'photonBark',
  resinGel: 'cryoCore', flexFiber: 'psiCore', denseCore: 'royalMatrix',
  armorFiber: 'guardianCore', darkMatterFiber: 'shadowCore', crystalGrowth: 'lumenCore',
  spiritFlux: 'etherealCore'
};

function handleBioRefining(id: string): void {
  const target = BIO_REFINE_MAP[id];
  if (target && forestryState.autoRefine[id] && forestryState.resources[id] && forestryState.resources[id].gte(FORESTRY_CONSTANTS.REFINE_RATIO)) {
    const count = forestryState.resources[id].div(FORESTRY_CONSTANTS.REFINE_RATIO).floor();
    forestryState.resources[target] = (forestryState.resources[target] || new Decimal(0)).add(count);
    forestryState.resources[id] = forestryState.resources[id].sub(count.mul(FORESTRY_CONSTANTS.REFINE_RATIO));
    handleBioRefining(target);
  }
}

import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { maxAffordable } from '../utils/maxAffordable.js';
import { getAffordableAmount } from '../utils/adjustUpgradeAmount.js';


export function buyForestryUpgrade(type: ForestryUpgradeType, amount: number | 'max' = 1): void {
  let formula: CostFormula;

  if (type === 'chainsawFuel')    formula = { type: 'linear', base: 0, gain: 500 };
  else if (type === 'reforestation')   formula = { type: 'linear', base: 0, gain: 200 };
  else if (type === 'ancientSaplings') formula = { type: 'geometric', base: 100, multiplier: 10 };
  else if (type === 'mutationPower')   formula = { type: 'linear', base: 1500, gain: 1500 };
  else if (type === 'overclockPower')  formula = { type: 'linear', base: 2000, gain: 2000 };
  else if (type === 'efficiency')      formula = { type: 'linear', base: 1000, gain: 1000 };
  else return;

  const currentLv = (forestryState[type] || 0);
  let count = 0;

  if (amount === 'max') {
    count = maxAffordable(forestryState.dnaFragments, currentLv, formula).toNumber();
  } else {
    // Dynamically adjust the requested amount if it's too expensive
    count = getAffordableAmount(forestryState.dnaFragments, currentLv, formula, amount);
  }

  if (type === 'ancientSaplings') {
    count = Math.min(count, 10 - currentLv);
  }

  if (count <= 0) return;
  const totalCost = calculateBulkCost(formula, currentLv, count);

  // Already checked via getAffordableAmount
  if (forestryState.dnaFragments.gte(totalCost)) {
    forestryState.dnaFragments = forestryState.dnaFragments.sub(totalCost);
    forestryState[type] += count;
    addLog(`[FORESTRY] Upgrade complete: ${type} x${count}.`, 'system');
  }
}

export function upgradeBioTool(): void {
  if (forestryState.toolTier >= bioTools.length) return;
  const next = bioTools[forestryState.toolTier];
  if (forestryState.dnaFragments.gte(next.dataCost)) {
    forestryState.dnaFragments = forestryState.dnaFragments.sub(next.dataCost);
    forestryState.toolTier++;
    forestryState.toolName = next.name;
    addLog(`[FORESTRY] Tool upgraded to ${next.name}!`, 'system');
  }
}

export function addGrowthChamber(amount: number | 'max' = 1): void {
  const getCost = (lv: number): Decimal => new Decimal(Math.floor(Math.pow(lv, 1.5) * 50));
  
  const currentLv = forestryState.growthChambers - 1;
  let count = 0;
  if (amount === 'max') {
    count = maxAffordable(forestryState.resources.biofiber || new Decimal(0), currentLv, getCost).toNumber();
  } else {
    count = amount;
  }

  if (count <= 0) return;
  const totalCost = calculateBulkCost(getCost, currentLv, count);

  if (forestryState.resources.biofiber && forestryState.resources.biofiber.gte(totalCost)) {
    forestryState.resources.biofiber = forestryState.resources.biofiber.sub(totalCost);
    forestryState.growthChambers += count;
    addLog(`[FORESTRY] Built ${count} Chambers.`, 'system');
  }
}

export function upgradeMutationChance(amount: number | 'max' = 1): void {
  const currentLv = (forestryState.mutationChance / 0.01) - 1;
  const formula: CostFormula = { type: 'linear', base: 0, gain: 500 };

  let count = 0;
  if (amount === 'max') {
    count = maxAffordable(forestryState.resources.resinGel || new Decimal(0), currentLv, formula).toNumber();
  } else {
    count = amount;
  }

  if (count <= 0) return;
  const totalCost = calculateBulkCost(formula, currentLv, count);

  if (forestryState.resources.resinGel && forestryState.resources.resinGel.gte(totalCost)) {
    forestryState.resources.resinGel = forestryState.resources.resinGel.sub(totalCost);
    forestryState.mutationChance += (0.01 * count);
    addLog(`[FORESTRY] Mutation chance increased by ${Math.floor(count)}%.`, 'system');
  }
}

export function upgradeForestryEnergy(amount: number | 'max' = 1): void {
  const currentLv = (forestryState.maxEnergy - 100) / 100;
  const formula: CostFormula = { type: 'linear', base: (currentLv + 1) * 25, gain: 25 };

  let count = 0;
  if (amount === 'max') {
    count = maxAffordable(forestryState.resources.reinforcedFiber || new Decimal(0), 0, formula).toNumber();
  } else {
    count = amount;
  }

  if (count <= 0) return;
  const totalCost = calculateBulkCost(formula, 0, count);

  if (forestryState.resources.reinforcedFiber && forestryState.resources.reinforcedFiber.gte(totalCost)) {
    forestryState.resources.reinforcedFiber = forestryState.resources.reinforcedFiber.sub(totalCost);
    forestryState.maxEnergy += (100 * count);
    forestryState.energy = forestryState.maxEnergy;
    addLog(`[FORESTRY] Nutrient capacity expanded.`, 'system');
  }
}

export function triggerForestryOverclock(): void {
  const cost = new Decimal(25);
  if (forestryState.resources.reinforcedFiber && forestryState.resources.reinforcedFiber.gte(cost) && !forestryState.isOverclocked) {
    forestryState.resources.reinforcedFiber = forestryState.resources.reinforcedFiber.sub(cost);
    forestryState.isOverclocked = true;
    forestryState.overclockTicks = FORESTRY_CONSTANTS.OVERCLOCK_DURATION;
    addLog(`[FORESTRY] Growth Surge active!`, 'system');
  }
}

export function refineBioSingle(id: string): void {
  const target = BIO_REFINE_MAP[id];
  if (target && forestryState.resources[id] && forestryState.resources[id].gte(25)) {
    forestryState.resources[target] = (forestryState.resources[target] || new Decimal(0)).add(1);
    forestryState.resources[id] = forestryState.resources[id].sub(25);
  }
}


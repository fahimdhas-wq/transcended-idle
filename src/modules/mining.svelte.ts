import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getMiningSpeedBonus, getEnergyEfficiencyBonus } from './bestiaryBonuses.js';
import { bestiaryState } from './bestiary.svelte.js';
import { getAffordableAmount } from '../utils/adjustUpgradeAmount.js';
import { Decimal } from '../systems/decimal.js';
import { calculateBulkCost, type CostFormula } from '../utils/bulkCost.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { GATHERING_CONSTANTS, makeTools, type GatheringTool } from '../data/gatheringConfig.js';
import { maxAffordable } from '../utils/maxAffordable.js';

export type MiningUpgradeType = 'sharpness' | 'discovery' | 'sensors' | 'overclockPower' | 'efficiency' | 'extraction';
export type MiningAutomationType = 'drone' | 'extractor';

export interface MiningState {
  unlocked: boolean;
  autoRefine: Record<string, boolean>;
  toolTier: number;
  toolName: string;
  energy: number;
  maxEnergy: number;
  drones: number;
  autoExtractors: number;
  isOverclocked: boolean;
  overclockTicks: number;
  miningProgress: number;
  minesPerSecond: number;
  dataRate: number;
  sharpness: number;
  discovery: number;
  sensors: number;
  overclockPower: number;
  efficiency: number;
  extraction: number;
  resources: Record<string, Decimal>;
}

export const tools = makeTools([
  'Advanced Extraction Tool',
  'Laser Drill',
  'Plasma Extractor',
  'Quantum Drill',
  'Singularity Harvester',
  'Void Reaver',
  'Cosmic Bore',
  'Neutron Star Drill',
  'Event Horizon Siphon',
  'Omni-Core Extractor'
]);

export const miningState: MiningState = $state({
  unlocked: false,
  autoRefine: {},
  toolTier: 1,
  toolName: 'Advanced Extraction Tool',
  energy: 100,
  maxEnergy: 100,
  drones: 0,
  autoExtractors: 0,
  isOverclocked: false,
  overclockTicks: 0,
  miningProgress: 0,
  minesPerSecond: 0,
  dataRate: 0,
  
  sharpness: 0,
  discovery: 0,
  sensors: 0,
  overclockPower: 0,
  efficiency: 0,
  extraction: 0,
  
  resources: {
    ferrite: new Decimal(0), carbite: new Decimal(0), cuprite: new Decimal(0),
    argentite: new Decimal(0), aurite: new Decimal(0), crystite: new Decimal(0),
    verdite: new Decimal(0), obsidite: new Decimal(0), neutrite: new Decimal(0),
    voidite: new Decimal(0),
    alloyX: new Decimal(0), fuelX: new Decimal(0), conduitX: new Decimal(0),
    lumenAlloy: new Decimal(0), solarAlloy: new Decimal(0), phaseCrystal: new Decimal(0),
    quantumCrystal: new Decimal(0), darkAlloy: new Decimal(0), denseMatter: new Decimal(0),
    exoticMatter: new Decimal(0),
    titanCore: new Decimal(0), fusionCore: new Decimal(0), plasmaCoil: new Decimal(0),
    photonCore: new Decimal(0), stellarCore: new Decimal(0), prismCore: new Decimal(0),
    entropyCore: new Decimal(0), voidCore: new Decimal(0), singularityCore: new Decimal(0),
    cosmicCore: new Decimal(0)
  }
});

let _dataAccum = 0;
let _dataRateTimer = 0;
const DATA_RATE_WINDOW = 5000;
const MINING_CONSTANTS = { REFINE_RATIO: 50, OVERCLOCK_DURATION: 600 };

const oreTiers: Array<{ id: string; tier: number }> = [
  { id: 'ferrite', tier: 1 }, { id: 'carbite', tier: 2 }, { id: 'cuprite', tier: 3 },
  { id: 'argentite', tier: 4 }, { id: 'aurite', tier: 5 }, { id: 'crystite', tier: 6 },
  { id: 'verdite', tier: 7 }, { id: 'obsidite', tier: 8 }, { id: 'neutrite', tier: 9 },
  { id: 'voidite', tier: 10 }
];

export function checkMiningUnlock(): void {
  const isEligible = character.level.gte(100);
  if (isEligible && !miningState.unlocked) {
    miningState.unlocked = true;
    miningState.toolTier = 1;
    miningState.toolName = tools[0].name;
    addLog(`[SYSTEM] Mining Rig Online.`, 'system');
  }
}

export function performMiningTick(ticks: number): void {
  checkMiningUnlock();
  if (!miningState.unlocked) return;

  const tool = tools[Math.max(0, miningState.toolTier - 1)];
  const bestiarySpeed = getMiningSpeedBonus();
  const energyEff = getEnergyEfficiencyBonus();
  
  let activeSpeed =
    (GATHERING_CONSTANTS.BASE_RATE + miningState.drones * GATHERING_CONSTANTS.AUTOMATION_BONUS) *
    tool.speed *
    (miningState.sharpness + 1) *
    (miningState.extraction + 1) *
    bestiarySpeed * 2;

  if (miningState.isOverclocked) {
    const ocMult = GATHERING_CONSTANTS.OVERCLOCK_BASE_MULT +
                   (miningState.overclockPower + 1) * GATHERING_CONSTANTS.OVERCLOCK_POWER_BONUS;
    activeSpeed *= ocMult;
    miningState.overclockTicks -= ticks;
    if (miningState.overclockTicks <= 0) miningState.isOverclocked = false;
  }

  const effReduction = 1 / (1 + miningState.efficiency * 0.1);
  const speedLog = Math.max(1, Math.log10(activeSpeed + 1));
  const actualCostPerTick = GATHERING_CONSTANTS.BASE_ENERGY_COST * speedLog * speedLog * effReduction;

  const toolTierMult = miningState.toolTier;
  const regenPerTick =
    (miningState.maxEnergy * GATHERING_CONSTANTS.BASE_REGEN_RATE * toolTierMult +
     miningState.drones * miningState.maxEnergy * GATHERING_CONSTANTS.AUTOMATION_REGEN * toolTierMult) *
    energyEff;

  let yieldMult = 1.0;
  if (!miningState.isOverclocked) {
    const totalCost = actualCostPerTick * ticks;
    const totalAvail = miningState.energy + regenPerTick * ticks;
    if (totalCost > 0) {
      if (totalAvail < totalCost) {
        yieldMult = Math.max(0, totalAvail / totalCost);
        miningState.energy = 0;
      } else {
        miningState.energy = Math.max(0, Math.min(miningState.maxEnergy, totalAvail - totalCost));
      }
    } else {
      miningState.energy = Math.max(0, Math.min(miningState.maxEnergy, miningState.energy + regenPerTick * ticks));
    }
  } else {
    miningState.energy = Math.max(0, Math.min(miningState.maxEnergy, miningState.energy + regenPerTick * ticks));
  }

  if (yieldMult > 0) {
    const progressGain = activeSpeed * GATHERING_CONSTANTS.TICK_RATE * yieldMult * ticks;
    miningState.minesPerSecond = (progressGain / ticks) * 10 / GATHERING_CONSTANTS.PROGRESS_THRESHOLD;
    miningState.miningProgress += progressGain;

    if (miningState.miningProgress >= GATHERING_CONSTANTS.PROGRESS_THRESHOLD) {
      const totalMines = Math.floor(miningState.miningProgress / GATHERING_CONSTANTS.PROGRESS_THRESHOLD);
      miningState.miningProgress %= GATHERING_CONSTANTS.PROGRESS_THRESHOLD;
      if (totalMines > 0) {
        const activeYield = tool.yield * (1 + miningState.sensors * 0.1) + miningState.autoExtractors * 5;
        executeMine(activeYield * totalMines, tool.luck, tool.tier);
      }
    }
  } else {
    miningState.minesPerSecond = 0;
  }

  const elapsedMs = ticks * GATHERING_CONSTANTS.TICK_RATE * 1000;
  _dataRateTimer += elapsedMs;
  if (_dataRateTimer >= DATA_RATE_WINDOW && _dataAccum > 0) {
    miningState.dataRate = _dataAccum / (_dataRateTimer / 1000);
    _dataAccum = 0;
    _dataRateTimer = 0;
  } else if (_dataRateTimer >= DATA_RATE_WINDOW * 3) {
    miningState.dataRate = 0;
    _dataAccum = 0;
    _dataRateTimer = 0;
  }
}

function executeMine(amount: number, luck: number, tier: number): void {
  const critChance = GATHERING_CONSTANTS.CRIT_CHANCE_BASE +
                     miningState.sensors * GATHERING_CONSTANTS.CRIT_CHANCE_PER_LUCK;
  let critMult = 1;
  if (Math.random() < critChance) {
    critMult = GATHERING_CONSTANTS.CRIT_MULTIPLIER;
    addLog(`[MINING] CRITICAL RESONANCE! ${GATHERING_CONSTANTS.CRIT_MULTIPLIER}x Resources!`, 'system');
  }

  const availableOres = oreTiers.filter(o => o.tier <= miningState.discovery + 1);
  if (availableOres.length === 0) return;

  const yieldMult = new Decimal(10).pow(
    (tier - 1) * GATHERING_CONSTANTS.YIELD_TIER_STEP + GATHERING_CONSTANTS.YIELD_BASE_EXPONENT
  );
  const totalAmount = new Decimal(amount).mul(critMult).mul(yieldMult);

  const amountPerOre = totalAmount.div(availableOres.length).floor();
  const remainder = totalAmount.mod(availableOres.length).toNumber();

  availableOres.forEach((ore, index) => {
    let finalAmount = amountPerOre;
    if (index < remainder) finalAmount = finalAmount.add(1);
    if (finalAmount.gt(0)) {
      miningState.resources[ore.id] = miningState.resources[ore.id].add(finalAmount);
      handleRefining(ore.id);
    }
  });

  if (Math.random() < GATHERING_CONSTANTS.FRAG_DROP_CHANCE) {
    const fragGain = new Decimal(Math.pow(tier, GATHERING_CONSTANTS.FRAG_TIER_POWER))
      .mul(miningState.sharpness + 1)
      .mul(miningState.extraction + 1)
      .mul(10)
      .ceil();
    bestiaryState.dataFragments = bestiaryState.dataFragments.add(fragGain);
    _dataAccum += fragGain.toNumber();
  }
}


const REFINE_MAP: Record<string, string> = {
  ferrite: 'alloyX', carbite: 'fuelX', cuprite: 'conduitX',
  argentite: 'lumenAlloy', aurite: 'solarAlloy', crystite: 'phaseCrystal',
  verdite: 'quantumCrystal', obsidite: 'darkAlloy', neutrite: 'denseMatter',
  voidite: 'exoticMatter',
  alloyX: 'titanCore', fuelX: 'fusionCore', conduitX: 'plasmaCoil',
  lumenAlloy: 'photonCore', solarAlloy: 'stellarCore', phaseCrystal: 'prismCore',
  quantumCrystal: 'entropyCore', darkAlloy: 'voidCore', denseMatter: 'singularityCore',
  exoticMatter: 'cosmicCore'
};

function handleRefining(id: string): void {
  const target = REFINE_MAP[id];
  if (target && miningState.autoRefine[id] && miningState.resources[id].gte(MINING_CONSTANTS.REFINE_RATIO)) {
    const count = miningState.resources[id].div(MINING_CONSTANTS.REFINE_RATIO).floor();
    miningState.resources[target] = miningState.resources[target].add(count);
    miningState.resources[id] = miningState.resources[id].sub(count.mul(MINING_CONSTANTS.REFINE_RATIO));
    handleRefining(target);
  }
}

export function buyMiningUpgrade(type: MiningUpgradeType, amount: number | 'max' = 1): void {
  let formula: CostFormula;
  
  if (type === 'sharpness')      formula = { type: 'linear', base: 0, gain: 1000 };
  else if (type === 'extraction') formula = { type: 'linear', base: 0, gain: 200 };
  else if (type === 'discovery')  formula = { type: 'geometric', base: 500, multiplier: 10 };
  else if (type === 'sensors')    formula = { type: 'linear', base: 2000, gain: 2000 };
  else if (type === 'overclockPower') formula = { type: 'linear', base: 2500, gain: 2500 };
  else if (type === 'efficiency') formula = { type: 'linear', base: 1500, gain: 1500 };
  else return;

  const currentLv = Number(miningState[type] || 0);
  let count = 0;

  if (amount === 'max') {
    count = maxAffordable(bestiaryState.dataFragments, currentLv, formula).toNumber();
  } else {
    // Dynamically adjust the requested amount if it's too expensive
    count = getAffordableAmount(bestiaryState.dataFragments, currentLv, formula, amount);
  }
  
  if (type === 'discovery') {
    count = Math.min(count, 10 - currentLv);
  }

  if (count <= 0) return;

  const totalCost = calculateBulkCost(formula, currentLv, count);

  // We already checked affordability via getAffordableAmount, but keeping the check for safety
  if (bestiaryState.dataFragments.gte(totalCost)) {
    bestiaryState.dataFragments = bestiaryState.dataFragments.sub(totalCost);
    miningState[type] += count;
    addLog(`[MINING] Upgraded ${type} x${count}.`, 'system');
  }
}

export function upgradeTool(): void {
  if (miningState.toolTier >= tools.length) return;
  const next = tools[miningState.toolTier];
  if (bestiaryState.dataFragments.gte(next.dataCost)) {
    bestiaryState.dataFragments = bestiaryState.dataFragments.sub(next.dataCost);
    miningState.toolTier++;
    miningState.toolName = next.name;
    addLog(`[MINING] Tool upgraded to ${next.name}!`, 'system');
  }
}

export function upgradeEnergy(amount: number | 'max' = 1): void {
  const currentLv = (miningState.maxEnergy - 100) / 100;
  const formula: CostFormula = { type: 'linear', base: (currentLv + 1) * 25, gain: 25 };

  let count = 0;
  if (amount === 'max') {
    count = maxAffordable(miningState.resources.fuelX, 0, formula).toNumber();
  } else {
    count = amount;
  }

  if (count <= 0) return;
  const totalCost = calculateBulkCost(formula, 0, count);

  if (miningState.resources.fuelX.gte(totalCost)) {
    miningState.resources.fuelX = miningState.resources.fuelX.sub(totalCost);
    miningState.maxEnergy += (100 * count);
    miningState.energy = miningState.maxEnergy;
    addLog(`[MINING] Energy expanded.`, 'system');
  }
}

export function upgradeAutomation(type: MiningAutomationType, amount: number | 'max' = 1): void {
  const isDrone = type === 'drone';
  const currentLv = isDrone ? miningState.drones : miningState.autoExtractors;
  const formula: CostFormula = { type: 'linear', base: 0, gain: isDrone ? 50 : 100 };
  
  let count = 0;
  if (amount === 'max') {
    count = maxAffordable(miningState.resources.alloyX, currentLv, formula).toNumber();
  } else {
    count = amount;
  }

  if (count <= 0) return;
  const totalCost = calculateBulkCost(formula, currentLv, count);

  if (miningState.resources.alloyX.gte(totalCost)) {
    miningState.resources.alloyX = miningState.resources.alloyX.sub(totalCost);
    if (isDrone) miningState.drones += count;
    else miningState.autoExtractors += count;
    addLog(`[MINING] Purchased ${count} ${type}(s).`, 'system');
  }
}

export function triggerOverclock(): void {
  const cost = new Decimal(25);
  if (miningState.resources.fuelX.gte(cost) && !miningState.isOverclocked) {
    miningState.resources.fuelX = miningState.resources.fuelX.sub(cost);
    miningState.isOverclocked = true;
    miningState.overclockTicks = MINING_CONSTANTS.OVERCLOCK_DURATION;
    addLog(`[MINING] Overclock active!`, 'system');
  }
}

export function refineSingle(id: string): void {
  const target = REFINE_MAP[id];
  if (target && miningState.resources[id].gte(50)) {
    miningState.resources[target] = miningState.resources[target].add(1);
    miningState.resources[id] = miningState.resources[id].sub(50);
  }
}


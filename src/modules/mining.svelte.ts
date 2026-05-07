import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getMiningSpeedBonus, getEnergyEfficiencyBonus } from './bestiaryBonuses.js';
import { bestiaryState } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';

export interface MiningTool {
  tier: number;
  name: string;
  speed: number;
  yield: number;
  luck: number;
  dataCost: number;
}

export type MiningUpgradeType = 'sharpness' | 'discovery' | 'sensors' | 'overclockPower' | 'efficiency';
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
  sharpness: number;
  discovery: number;
  sensors: number;
  overclockPower: number;
  efficiency: number;
  resources: Record<string, Decimal>;
}

// Constants
const MINING_CONSTANTS = {
  BASE_ENERGY_COST: 0.05,
  BASE_REGEN_RATE: 0.01,
  DRONE_REGEN_BONUS: 0.002,
  SPEED_CAP: 1000000,
  TICK_RATE: 0.1, // Matches Forestry
  BASE_MINING_RATE: 2, // Matches Forestry
  DRONE_BONUS: 1, // Matches Forestry Chamber Bonus
  AWAKENING_CHANCE_BASE: 0.001,
  AWAKENING_CHANCE_PER_SENSOR: 0.0005,
  AWAKENING_MULTIPLIER: 100,
  REFINE_RATIO: 25,
  OVERCLOCK_DURATION: 1200,
  OVERCLOCK_BASE_MULTIPLIER: 3,
  OVERCLOCK_POWER_BONUS: 0.5
};

export const tools: MiningTool[] = [
  { tier: 1, name: 'Advanced Extraction Tool', speed: 2, yield: 2, luck: 2, dataCost: 0 },
  { tier: 2, name: 'Laser Drill', speed: 10, yield: 10, luck: 4, dataCost: 50 },
  { tier: 3, name: 'Plasma Extractor', speed: 40, yield: 35, luck: 8, dataCost: 250 },
  { tier: 4, name: 'Quantum Drill', speed: 150, yield: 120, luck: 15, dataCost: 1000 },
  { tier: 5, name: 'Singularity Harvester', speed: 600, yield: 500, luck: 30, dataCost: 5000 },
  { tier: 6, name: 'Void Reaver', speed: 2500, yield: 2000, luck: 60, dataCost: 25000 },
  { tier: 7, name: 'Cosmic Bore', speed: 10000, yield: 8000, luck: 120, dataCost: 100000 },
  { tier: 8, name: 'Neutron Star Drill', speed: 50000, yield: 40000, luck: 250, dataCost: 500000 },
  { tier: 9, name: 'Event Horizon Siphon', speed: 250000, yield: 200000, luck: 500, dataCost: 2500000 },
  { tier: 10, name: 'Omni-Core Extractor', speed: 1000000, yield: 800000, luck: 1000, dataCost: 10000000 }
];

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
  
  // Calibration levels start at 0 (UI shows Lv.0). Tick math offsets keep base behavior identical.
  sharpness: 0,
  discovery: 0,
  sensors: 0,
  overclockPower: 0,
  efficiency: 0,
  
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

  const energyEff = getEnergyEfficiencyBonus();
  const tool = tools[Math.max(0, miningState.toolTier - 1)];
  const bestiarySpeed = getMiningSpeedBonus();
  
  // Normalized speed calculation
  let activeSpeed = (MINING_CONSTANTS.BASE_MINING_RATE + 
                    (miningState.drones * MINING_CONSTANTS.DRONE_BONUS)) * 
                    tool.speed * 
                    (miningState.sharpness + 1) * 
                    bestiarySpeed * 2;

  // Overclock effect
  if (miningState.isOverclocked) {
    const overclockMult = MINING_CONSTANTS.OVERCLOCK_BASE_MULTIPLIER + 
                          ((miningState.overclockPower + 1) * MINING_CONSTANTS.OVERCLOCK_POWER_BONUS);
    activeSpeed *= overclockMult;
    miningState.overclockTicks -= ticks;
    if (miningState.overclockTicks <= 0) {
      miningState.isOverclocked = false;
    }
  }

  // Energy Consumption & Yield Scaling
  const effReduction = 1 / (1 + (miningState.efficiency * 0.1));

  // FIXED: energy must scale sublinearly with speed to avoid a hard cap at high tiers.
  // This prevents yield stalling due to insufficient maxEnergy.
  const speedLog = Math.max(1, Math.log10(activeSpeed + 1));
  const actualCostPerTick = (MINING_CONSTANTS.BASE_ENERGY_COST * speedLog * speedLog) * effReduction;

  // Regen scales with tool tier so capacity upgrades can keep up with speed scaling.
  const toolTierMult = miningState.toolTier;
  const regenPerTick =
    (miningState.maxEnergy * MINING_CONSTANTS.BASE_REGEN_RATE * toolTierMult +
      miningState.drones * (miningState.maxEnergy * MINING_CONSTANTS.DRONE_REGEN_BONUS * toolTierMult)) *
    energyEff;
  
  let yieldMult = 1.0;
  
  if (!miningState.isOverclocked) {
    const totalPotentialCost = actualCostPerTick * ticks;
    const totalAvailableEnergy = miningState.energy + (regenPerTick * ticks);

    if (totalPotentialCost > 0) {
      if (totalAvailableEnergy < totalPotentialCost) {
        yieldMult = Math.max(0, totalAvailableEnergy / totalPotentialCost);
        miningState.energy = 0;
      } else {
        miningState.energy = Math.max(
          0,
          Math.min(miningState.maxEnergy, totalAvailableEnergy - totalPotentialCost)
        );
        yieldMult = 1.0;
      }
    } else {
      miningState.energy = Math.max(
        0,
        Math.min(miningState.maxEnergy, miningState.energy + (regenPerTick * ticks))
      );
      yieldMult = 1.0;
    }
  } else {
    miningState.energy = Math.max(
      0,
      Math.min(miningState.maxEnergy, miningState.energy + (regenPerTick * ticks))
    );
    yieldMult = 1.0;
  }

  // Mining Execution
  if (yieldMult > 0) {
    const progressGain = (activeSpeed * MINING_CONSTANTS.TICK_RATE * yieldMult) * ticks;
    
    // Calculate display rate: completions per second
    // Since progressGain is per 'ticks' interval, we divide by ticks and multiply by 10 (100ms ticks -> 1s)
    // Then divide by threshold (100) to get "full mines per second"
    miningState.minesPerSecond = (progressGain / ticks) * 10 / 100;

    miningState.miningProgress += progressGain + (Math.random() * 0.1);
    
    if (miningState.miningProgress >= 100) {
      const totalMines = Math.floor(miningState.miningProgress / 100);
      miningState.miningProgress %= 100;
      
      if (totalMines > 0) {
        let activeYield = tool.yield * (1 + (miningState.sensors * 0.1)) + (miningState.autoExtractors * 5);
        executeMine(activeYield * totalMines, tool.luck);
      }
    }
  } else {
    miningState.minesPerSecond = 0;
  }
}

function executeMine(amount: number, luck: number): void {
  const awakenChance = MINING_CONSTANTS.AWAKENING_CHANCE_BASE + 
                      (miningState.sensors * MINING_CONSTANTS.AWAKENING_CHANCE_PER_SENSOR);
  let resonanceMult = 1;
  
  if (Math.random() < awakenChance) {
    resonanceMult = MINING_CONSTANTS.AWAKENING_MULTIPLIER;
    addLog(`[MINING] CRITICAL RESONANCE! ${MINING_CONSTANTS.AWAKENING_MULTIPLIER}x Resources!`, 'system');
  }

  const availableOres = oreTiers.filter(o => o.tier <= (miningState.discovery + 1));
  if (availableOres.length === 0) return;

  // Scaling to 1A (10^33) per second at Tier 10.
  // 1A = 10^33. At ~8 completions/s, target is ~10^32 per completion.
  const harvestMultiplier = miningState.toolTier * 1e31; 
  const totalAmount = new Decimal(amount).mul(resonanceMult).mul(harvestMultiplier);
  
  if (totalAmount.gt(1000000)) {
     addLog(`[MINING] Massive Harvest! ${formatNumber(totalAmount)} resources collected.`, 'loot');
  }

  // Distribution logic
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

export function buyMiningUpgrade(type: MiningUpgradeType, amount: number = 1): void {
  const getCost = (lv: number): Decimal => {
    if (type === 'sharpness') return new Decimal(lv).mul(1000);
    if (type === 'discovery') return new Decimal(10).pow(lv).mul(500);
    if (type === 'sensors') return new Decimal(lv + 1).mul(2000);
    if (type === 'overclockPower') return new Decimal(lv + 1).mul(2500);
    if (type === 'efficiency') return new Decimal(lv + 1).mul(1500);
    return new Decimal(Infinity);
  };

  let totalCost = new Decimal(0);
  let count = 0;
  for (let i = 0; i < amount; i++) {
    const nextLv = (miningState[type] || 0) + i;
    if (type === 'discovery' && nextLv >= 10) break;
    totalCost = totalCost.add(getCost(nextLv));
    count++;
  }

  if (bestiaryState.dataFragments.gte(totalCost) && count > 0) {
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

export function upgradeEnergy(amount: number = 1): void {
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const currentMax = miningState.maxEnergy + (i * 100);
    totalCost = totalCost.add(new Decimal((currentMax / 100) * 25));
  }
  if (miningState.resources.fuelX.gte(totalCost)) {
    miningState.resources.fuelX = miningState.resources.fuelX.sub(totalCost);
    miningState.maxEnergy += (100 * amount);
    miningState.energy = miningState.maxEnergy;
    addLog(`[MINING] Energy expanded.`, 'system');
  }
}

export function upgradeAutomation(type: MiningAutomationType, amount: number = 1): void {
  const isDrone = type === 'drone';
  const getCost = (lv: number): Decimal => new Decimal(lv).mul(isDrone ? 50 : 100);
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const lv = (isDrone ? miningState.drones : miningState.autoExtractors) + i;
    totalCost = totalCost.add(getCost(lv));
  }
  if (miningState.resources.alloyX.gte(totalCost)) {
    miningState.resources.alloyX = miningState.resources.alloyX.sub(totalCost);
    if (isDrone) miningState.drones += amount;
    else miningState.autoExtractors += amount;
    addLog(`[MINING] Purchased ${amount} ${type}(s).`, 'system');
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

export function autoUpgradeMining(): void {
  if (!miningState.unlocked) return;
  const bulk = 1000;
  (['sharpness', 'discovery', 'sensors', 'overclockPower', 'efficiency'] as MiningUpgradeType[]).forEach(t => buyMiningUpgrade(t, bulk));
  upgradeTool();
}

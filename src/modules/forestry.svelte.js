import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getForestryYieldBonus, getForestrySpeedBonus, getEnergyEfficiencyBonus } from './bestiaryBonuses.js';
import { bestiaryState, setDnaGainCallback } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';

// Constants
const FORESTRY_CONSTANTS = {
  BASE_GROWTH_RATE: 2,
  CHAMBER_BONUS: 1,
  GROWTH_TICK_RATE: 0.1,
  GROWTH_THRESHOLD: 100,
  MUTATION_BASE_MULTIPLIER: 3,
  MUTATION_POWER_BONUS: 0.5,
  REFINE_RATIO: 25,
  FRAGMENT_DROP_CHANCE: 0.15, // Unified chance
  MAX_GROWTH_PER_TICK: 1000,
  BASE_ENERGY_COST: 0.05,
  BASE_REGEN_RATE: 0.01,
  CHAMBER_REGEN_BONUS: 0.002,
  OVERCLOCK_DURATION: 1200,
  OVERCLOCK_BASE_MULTIPLIER: 3,
  OVERCLOCK_POWER_BONUS: 0.5
};

export const forestryState = $state({
  unlocked: false,
  autoRefine: {},
  toolTier: 1,
  toolName: 'Bio-Harvesting Tool',
  dnaFragments: new Decimal(0),
  growthProgress: 0,
  harvestRate: 0, 
  growthChambers: 1,
  mutationChance: 0.05,
  reforestation: 0,
  
  energy: 100,
  maxEnergy: 100,
  isOverclocked: false,
  overclockTicks: 0,

  // Calibration levels start at 0 (UI shows Lv.0).
  // Tick math offsets keep base behavior identical.
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

setDnaGainCallback((amount) => {
  forestryState.dnaFragments = forestryState.dnaFragments.add(amount);
});

export const bioTools = [
  { tier: 1, name: 'Bio-Harvesting Tool', speed: 2, yield: 2, luck: 2, dataCost: 0 },
  { tier: 2, name: 'Nano Harvester', speed: 10, yield: 10, luck: 4, dataCost: 50 },
  { tier: 3, name: 'Molecular Extractor', speed: 40, yield: 35, luck: 8, dataCost: 250 },
  { tier: 4, name: 'DNA Synthesizer', speed: 150, yield: 120, luck: 15, dataCost: 1000 },
  { tier: 5, name: 'Quantum Bio Reaper', speed: 600, yield: 500, luck: 30, dataCost: 5000 },
  { tier: 6, name: 'Cellular Architect', speed: 2500, yield: 2000, luck: 60, dataCost: 25000 },
  { tier: 7, name: 'Organoid Forge', speed: 10000, yield: 8000, luck: 120, dataCost: 100000 },
  { tier: 8, name: 'Bio-Sphere Siphon', speed: 50000, yield: 40000, luck: 250, dataCost: 500000 },
  { tier: 9, name: 'Genetic Overlord', speed: 250000, yield: 200000, luck: 500, dataCost: 2500000 },
  { tier: 10, name: 'Life-Stream Extractor', speed: 1000000, yield: 800000, luck: 1000, dataCost: 10000000 }
];

export function checkForestryUnlock() {
  const isEligible = character.level.gte(200);
  if (isEligible && !forestryState.unlocked) {
    forestryState.unlocked = true;
    forestryState.toolTier = 1;
    forestryState.toolName = bioTools[0].name;
    addLog(`[SYSTEM] Bio Harvester Online.`, 'system');
  }
}

export function performForestryTick(ticks) {
  checkForestryUnlock();
  if (!forestryState.unlocked) return;

  const energyEff = getEnergyEfficiencyBonus();
  const tool = bioTools[Math.max(0, forestryState.toolTier - 1)];
  const speedBonus = getForestrySpeedBonus();
  
  let activeSpeed = (FORESTRY_CONSTANTS.BASE_GROWTH_RATE + 
                    (forestryState.growthChambers * FORESTRY_CONSTANTS.CHAMBER_BONUS)) * 
                    tool.speed * 
                    (forestryState.chainsawFuel + 1) * 
                    (forestryState.reforestation + 1) * 
                    speedBonus * 2;

  // Overclock effect
  if (forestryState.isOverclocked) {
    const overclockMult = FORESTRY_CONSTANTS.OVERCLOCK_BASE_MULTIPLIER + 
                          ((forestryState.overclockPower + 1) * FORESTRY_CONSTANTS.OVERCLOCK_POWER_BONUS);
    activeSpeed *= overclockMult;
    forestryState.overclockTicks -= ticks;
    if (forestryState.overclockTicks <= 0) {
      forestryState.isOverclocked = false;
    }
  }

  // Energy Consumption & Yield Scaling
  // Keep energy cost behavior aligned with legacy formula.
  // Calibration level starts at 0, so efficiency=0 should mean “no reduction”.
  const effReduction = 1 / (1 + (forestryState.efficiency * 0.1));
  const actualCostPerTick = (FORESTRY_CONSTANTS.BASE_ENERGY_COST * activeSpeed) * effReduction;
  const regenPerTick = (forestryState.maxEnergy * FORESTRY_CONSTANTS.BASE_REGEN_RATE + 
                        forestryState.growthChambers * (forestryState.maxEnergy * FORESTRY_CONSTANTS.CHAMBER_REGEN_BONUS)) * energyEff;
  
  let yieldMult = 1.0;
  
  if (!forestryState.isOverclocked) {
    const totalPotentialCost = actualCostPerTick * ticks;
    const totalAvailableEnergy = forestryState.energy + (regenPerTick * ticks);

    if (totalPotentialCost > 0) {
      if (totalAvailableEnergy < totalPotentialCost) {
        yieldMult = Math.max(0, totalAvailableEnergy / totalPotentialCost);
        forestryState.energy = 0;
      } else {
        forestryState.energy = Math.min(forestryState.maxEnergy, totalAvailableEnergy - totalPotentialCost);
        yieldMult = 1.0;
      }
    } else {
      forestryState.energy = Math.min(forestryState.maxEnergy, forestryState.energy + (regenPerTick * ticks));
      yieldMult = 1.0;
    }
  } else {
    forestryState.energy = Math.min(forestryState.maxEnergy, forestryState.energy + (regenPerTick * ticks));
    yieldMult = 1.0;
  }

  // Growth Execution
  if (yieldMult > 0) {
    const progressGain = Math.min(
      (activeSpeed * FORESTRY_CONSTANTS.GROWTH_TICK_RATE * yieldMult) * ticks,
      FORESTRY_CONSTANTS.MAX_GROWTH_PER_TICK * ticks
    );
    
    forestryState.harvestRate = (progressGain / ticks) * 10;
    forestryState.growthProgress += progressGain;
    
    if (forestryState.growthProgress >= FORESTRY_CONSTANTS.GROWTH_THRESHOLD) {
      const harvests = Math.floor(forestryState.growthProgress / FORESTRY_CONSTANTS.GROWTH_THRESHOLD);
      forestryState.growthProgress %= FORESTRY_CONSTANTS.GROWTH_THRESHOLD;
      executeHarvest(tool, harvests);
    }
  } else {
    forestryState.harvestRate = 0;
  }
}

function executeHarvest(tool, count = 1) {
  const yieldBonus = getForestryYieldBonus();
  
  const tiers = [
    'biomass', 'oakron', 'birchon', 'pynex', 'willix', 'mahorix', 'tecron', 'ironwood',
    'darkwood', 'voidwood'
  ];
  const maxTier = Math.max(1, Math.min(tiers.length, forestryState.ancientSaplings + 1));
  const availableTiers = tiers.slice(0, maxTier);

  const isMutated = Math.random() < (forestryState.mutationChance + (tool.luck / 1000));
  let mutationMult = 1;
  if (isMutated) {
    mutationMult = FORESTRY_CONSTANTS.MUTATION_BASE_MULTIPLIER + 
                   (forestryState.mutationPower * FORESTRY_CONSTANTS.MUTATION_POWER_BONUS);
    addLog(`[FORESTRY] Mutation Cluster harvested!`, 'loot');
  }

  const harvestMultiplier = tool.tier * 100000;
  const totalBaseAmount = new Decimal(tool.yield).mul(yieldBonus).mul(count).mul(mutationMult).mul(harvestMultiplier);
  
  if (totalBaseAmount.gt(1000000)) {
     addLog(`[FORESTRY] Massive Harvest! ${formatNumber(totalBaseAmount)} resources collected.`, 'loot');
  }

  const amountPerTier = totalBaseAmount.div(availableTiers.length).floor();
  const remainder = totalBaseAmount.mod(availableTiers.length).toNumber();

  availableTiers.forEach((oreId, index) => {
    let finalAmount = amountPerTier;
    if (index < remainder) finalAmount = finalAmount.add(1);
    
    if (finalAmount.gt(0)) {
      forestryState.resources[oreId] = (forestryState.resources[oreId] || new Decimal(0)).add(finalAmount);
      handleBioRefining(oreId);
    }
  });
  
  const expectedGain = count * FORESTRY_CONSTANTS.FRAGMENT_DROP_CHANCE;
  const actualDrops = Math.floor(expectedGain) + (Math.random() < (expectedGain % 1) ? 1 : 0);
  
  if (actualDrops > 0) {
    const tierMult = Math.pow(tool.tier, 4); 
    const efficiencyMult = (forestryState.chainsawFuel * forestryState.reforestation);
    const gain = new Decimal(actualDrops).mul(tierMult).mul(efficiencyMult).mul(10).ceil();
    
    forestryState.dnaFragments = forestryState.dnaFragments.add(gain);
    bestiaryState.dataFragments = bestiaryState.dataFragments.add(gain);
  }
}

const BIO_REFINE_MAP = {
  biomass: 'biofiber', oakron: 'reinforcedFiber', birchon: 'lightPanel',
  pynex: 'resinGel', willix: 'flexFiber', mahorix: 'denseCore',
  tecron: 'armorFiber', ironwood: 'darkMatterFiber', darkwood: 'crystalGrowth',
  voidwood: 'spiritFlux',
  biofiber: 'bioCore', reinforcedFiber: 'terraCore', lightPanel: 'photonBark',
  resinGel: 'cryoCore', flexFiber: 'psiCore', denseCore: 'royalMatrix',
  armorFiber: 'guardianCore', darkMatterFiber: 'shadowCore', crystalGrowth: 'lumenCore',
  spiritFlux: 'etherealCore'
};

function handleBioRefining(id) {
  const target = BIO_REFINE_MAP[id];
  if (target && forestryState.autoRefine[id] && forestryState.resources[id] && forestryState.resources[id].gte(FORESTRY_CONSTANTS.REFINE_RATIO)) {
    const count = forestryState.resources[id].div(FORESTRY_CONSTANTS.REFINE_RATIO).floor();
    forestryState.resources[target] = (forestryState.resources[target] || new Decimal(0)).add(count);
    forestryState.resources[id] = forestryState.resources[id].sub(count.mul(FORESTRY_CONSTANTS.REFINE_RATIO));
    handleBioRefining(target);
  }
}

export function buyForestryUpgrade(type, amount = 1) {
  const getCost = (lv) => {
    if (type === 'chainsawFuel') return new Decimal(lv).mul(500);
    if (type === 'reforestation') return new Decimal(lv).mul(200);
    if (type === 'ancientSaplings') return new Decimal(10).pow(lv).mul(100);
    if (type === 'mutationPower') return new Decimal(lv + 1).mul(1500);
    if (type === 'overclockPower') return new Decimal(lv + 1).mul(2000);
    if (type === 'efficiency') return new Decimal(lv + 1).mul(1000);
    return new Decimal(Infinity);
  };

  let totalCost = new Decimal(0);
  let count = 0;
  for (let i = 0; i < amount; i++) {
    const nextLv = (forestryState[type] || 0) + i;
    if (type === 'ancientSaplings' && nextLv >= 10) break;
    totalCost = totalCost.add(getCost(nextLv));
    count++;
  }

  if (forestryState.dnaFragments.gte(totalCost) && count > 0) {
    forestryState.dnaFragments = forestryState.dnaFragments.sub(totalCost);
    forestryState[type] += count;
    addLog(`[FORESTRY] Upgrade complete: ${type} x${count}.`, 'system');
  }
}

export function upgradeBioTool() {
  if (forestryState.toolTier >= bioTools.length) return;
  const next = bioTools[forestryState.toolTier];
  if (forestryState.dnaFragments.gte(next.dataCost)) {
    forestryState.dnaFragments = forestryState.dnaFragments.sub(next.dataCost);
    forestryState.toolTier++;
    forestryState.toolName = next.name;
    addLog(`[FORESTRY] Tool upgraded to ${next.name}!`, 'system');
  }
}

export function addGrowthChamber(amount = 1) {
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const lv = (forestryState.growthChambers - 1) + i; // Start from 0
    totalCost = totalCost.add(Math.floor(Math.pow(lv, 1.5) * 50));
  }
  if (forestryState.resources.biofiber && forestryState.resources.biofiber.gte(totalCost)) {
    forestryState.resources.biofiber = forestryState.resources.biofiber.sub(totalCost);
    forestryState.growthChambers += amount;
    addLog(`[FORESTRY] Built ${amount} Chambers.`, 'system');
  }
}

export function upgradeMutationChance(amount = 1) {
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const currentMut = (forestryState.mutationChance / 0.01) + (i - 1); // Start from 0
    totalCost = totalCost.add(Math.floor(currentMut * 500));
  }
  if (forestryState.resources.resinGel && forestryState.resources.resinGel.gte(totalCost)) {
    forestryState.resources.resinGel = forestryState.resources.resinGel.sub(totalCost);
    forestryState.mutationChance += (0.01 * amount);
    addLog(`[FORESTRY] Mutation chance increased.`, 'system');
  }
}

export function upgradeForestryEnergy(amount = 1) {
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const currentMax = forestryState.maxEnergy + (i * 100);
    totalCost = totalCost.add(new Decimal((currentMax / 100) * 25));
  }
  if (forestryState.resources.reinforcedFiber && forestryState.resources.reinforcedFiber.gte(totalCost)) {
    forestryState.resources.reinforcedFiber = forestryState.resources.reinforcedFiber.sub(totalCost);
    forestryState.maxEnergy += (100 * amount);
    forestryState.energy = forestryState.maxEnergy;
    addLog(`[FORESTRY] Nutrient capacity expanded.`, 'system');
  }
}

export function triggerForestryOverclock() {
  const cost = new Decimal(25);
  if (forestryState.resources.reinforcedFiber && forestryState.resources.reinforcedFiber.gte(cost) && !forestryState.isOverclocked) {
    forestryState.resources.reinforcedFiber = forestryState.resources.reinforcedFiber.sub(cost);
    forestryState.isOverclocked = true;
    forestryState.overclockTicks = FORESTRY_CONSTANTS.OVERCLOCK_DURATION;
    addLog(`[FORESTRY] Growth Surge active!`, 'system');
  }
}

export function refineBioSingle(id) {
  const target = BIO_REFINE_MAP[id];
  if (target && forestryState.resources[id] && forestryState.resources[id].gte(25)) {
    forestryState.resources[target] = (forestryState.resources[target] || new Decimal(0)).add(1);
    forestryState.resources[id] = forestryState.resources[id].sub(25);
  }
}

export function autoUpgradeForestry() {
  if (!forestryState.unlocked) return;
  const bulk = 1000;
  ['chainsawFuel', 'reforestation', 'ancientSaplings', 'mutationPower', 'overclockPower', 'efficiency'].forEach(t => buyForestryUpgrade(t, bulk));
  upgradeBioTool();
}

import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { getMiningSpeedBonus, getEnergyEfficiencyBonus } from './bestiaryBonuses.js';
import { bestiaryState } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';

export const tools = [
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

export const miningState = $state({
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
  
  // Upgrades
  sharpness: 1,      // Base speed multiplier
  discovery: 1,      // Unlocks higher tier ores (1-10)
  sensors: 0,        // Bonus to multi-mine & Awaken chance
  overclockPower: 1, // Multiplier for Overclock speed (Base 3x)
  efficiency: 0,     // Reduces energy cost per mine
  
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

const oreTiers = [
  { id: 'ferrite', tier: 1 }, { id: 'carbite', tier: 2 }, { id: 'cuprite', tier: 3 },
  { id: 'argentite', tier: 4 }, { id: 'aurite', tier: 5 }, { id: 'crystite', tier: 6 },
  { id: 'verdite', tier: 7 }, { id: 'obsidite', tier: 8 }, { id: 'neutrite', tier: 9 },
  { id: 'voidite', tier: 10 }
];

export function checkMiningUnlock() {
  const isEligible = character.level.gte(100);
  if (isEligible && !miningState.unlocked) {
    miningState.unlocked = true;
    miningState.toolTier = 1;
    miningState.toolName = tools[0].name;
    addLog(`[SYSTEM] Mining Rig Online.`, 'system');
  }
}

export function performMiningTick(ticks) {
  checkMiningUnlock();
  if (!miningState.unlocked) return;

  const energyEff = getEnergyEfficiencyBonus();
  const tool = tools[Math.max(0, miningState.toolTier - 1)];
  const bestiarySpeed = getMiningSpeedBonus();
  
  let activeSpeed = tool.speed * bestiarySpeed * miningState.sharpness;
  let activeYield = tool.yield * (1 + (miningState.sensors * 0.1));
  let activeLuck = tool.luck;

  // Overclock effect
  if (miningState.isOverclocked) {
    activeSpeed *= (3 + (miningState.overclockPower * 0.5));
    miningState.overclockTicks -= ticks;
    if (miningState.overclockTicks <= 0) miningState.isOverclocked = false;
  }

  // Automation bonuses
  activeSpeed += (miningState.drones * 2);
  activeYield += (miningState.autoExtractors * 5);

  // 3. Energy Consumption & Yield Scaling
  const effReduction = 1 / (1 + (miningState.efficiency * 0.1));
  const cappedSpeed = Math.min(activeSpeed, 1000000);
  const costPerTick = (0.05 * cappedSpeed) * effReduction;
  const regenPerTick = (miningState.maxEnergy * 0.01 + miningState.drones * (miningState.maxEnergy * 0.002)) * energyEff;
  
  let yieldMult = 1.0;
  
  if (!miningState.isOverclocked) {
    const totalPotentialCost = costPerTick * ticks;
    const totalAvailableEnergy = miningState.energy + (regenPerTick * ticks);

    if (totalPotentialCost > 0) {
      if (totalAvailableEnergy < totalPotentialCost) {
        // Not enough energy for full speed, mine at reduced capacity
        yieldMult = totalAvailableEnergy / totalPotentialCost;
        miningState.energy = 0;
      } else {
        // Sufficient energy
        miningState.energy = Math.min(miningState.maxEnergy, totalAvailableEnergy - totalPotentialCost);
        yieldMult = 1.0;
      }
    } else {
      // Free mining, just regen
      miningState.energy = Math.min(miningState.maxEnergy, miningState.energy + (regenPerTick * ticks));
      yieldMult = 1.0;
    }
  } else {
    // Overclocked: No energy cost, and we still regen energy
    miningState.energy = Math.min(miningState.maxEnergy, miningState.energy + (regenPerTick * ticks));
    yieldMult = 1.0;
  }

  // 4. Mining Execution
  if (yieldMult > 0) {
    const minesPerTick = 0.1 * activeSpeed * yieldMult;
    const totalMines = Math.floor(minesPerTick * ticks);
    const extraChance = (minesPerTick * ticks) - totalMines;
    
    let finalMines = totalMines;
    if (Math.random() < extraChance) finalMines++;

    if (finalMines > 0) {
      executeMine(activeYield * finalMines, activeLuck);
    }
  }
}

function executeMine(amount, luck) {
  const awakenChance = 0.001 + (miningState.sensors * 0.0005);
  let resonanceMult = 1;
  if (Math.random() < awakenChance) {
    resonanceMult = 100;
    addLog(`[MINING] CRITICAL RESONANCE! 100x Resources!`, 'system');
  }

  const availableOres = oreTiers.filter(o => o.tier <= miningState.discovery);
  if (availableOres.length === 0) return;

  const totalAmount = new Decimal(amount).mul(resonanceMult);
  
  if (totalAmount.lt(availableOres.length * 2)) {
    // Small amount, pick one to keep things simple
    const ore = availableOres[Math.floor(Math.random() * availableOres.length)];
    const finalAmount = totalAmount.ceil();
    miningState.resources[ore.id] = miningState.resources[ore.id].add(finalAmount);
    handleRefining(ore.id);
  } else {
    // Large amount, distribute across available ores for accuracy
    const amountPerOre = totalAmount.div(availableOres.length).floor();
    const remainder = totalAmount.mod(availableOres.length).toNumber();

    availableOres.forEach((ore, index) => {
      let finalOreAmount = amountPerOre;
      if (index < remainder) finalOreAmount = finalOreAmount.add(1);
      
      if (finalOreAmount.gt(0)) {
        miningState.resources[ore.id] = miningState.resources[ore.id].add(finalOreAmount);
        handleRefining(ore.id);
      }
    });
  }
}

function handleRefining(id) {
  const evolves = {
    ferrite: 'alloyX', carbite: 'fuelX', cuprite: 'conduitX',
    argentite: 'lumenAlloy', aurite: 'solarAlloy', crystite: 'phaseCrystal',
    verdite: 'quantumCrystal', obsidite: 'darkAlloy', neutrite: 'denseMatter',
    voidite: 'exoticMatter',
    alloyX: 'titanCore', fuelX: 'fusionCore', conduitX: 'plasmaCoil',
    lumenAlloy: 'photonCore', solarAlloy: 'stellarCore', phaseCrystal: 'prismCore',
    quantumCrystal: 'entropyCore', darkAlloy: 'voidCore', denseMatter: 'singularityCore',
    exoticMatter: 'cosmicCore'
  };

  const target = evolves[id];
  if (target && miningState.autoRefine[id] && miningState.resources[id].gte(25)) {
    const count = miningState.resources[id].div(25).floor();
    miningState.resources[target] = miningState.resources[target].add(count);
    miningState.resources[id] = miningState.resources[id].sub(count.mul(25));
    handleRefining(target); // Recursive for multi-tier auto
  }
}

export function buyMiningUpgrade(type, amount = 1) {
  const getCost = (lv) => {
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

export function upgradeTool() {
  if (miningState.toolTier >= tools.length) return;
  const next = tools[miningState.toolTier];
  if (bestiaryState.dataFragments.gte(next.dataCost)) {
    bestiaryState.dataFragments = bestiaryState.dataFragments.sub(next.dataCost);
    miningState.toolTier++;
    miningState.toolName = next.name;
    addLog(`[MINING] Tool upgraded to ${next.name}!`, 'system');
  }
}

export function upgradeEnergy(amount = 1) {
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

export function upgradeAutomation(type, amount = 1) {
  const isDrone = type === 'drone';
  const getCost = (lv) => new Decimal(lv + 1).mul(isDrone ? 50 : 100);
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

export function triggerOverclock() {
  const cost = new Decimal(25);
  if (miningState.resources.fuelX.gte(cost) && !miningState.isOverclocked) {
    miningState.resources.fuelX = miningState.resources.fuelX.sub(cost);
    miningState.isOverclocked = true;
    miningState.overclockTicks = 1200; // 2 minutes
    addLog(`[MINING] Overclock active!`, 'system');
  }
}

export function refineSingle(id) {
  const evolves = {
    ferrite: 'alloyX', carbite: 'fuelX', cuprite: 'conduitX',
    argentite: 'lumenAlloy', aurite: 'solarAlloy', crystite: 'phaseCrystal',
    verdite: 'quantumCrystal', obsidite: 'darkAlloy', neutrite: 'denseMatter',
    voidite: 'exoticMatter',
    alloyX: 'titanCore', fuelX: 'fusionCore', conduitX: 'plasmaCoil',
    lumenAlloy: 'photonCore', solarAlloy: 'stellarCore', phaseCrystal: 'prismCore',
    quantumCrystal: 'entropyCore', darkAlloy: 'voidCore', denseMatter: 'singularityCore',
    exoticMatter: 'cosmicCore'
  };
  const target = evolves[id];
  if (target && miningState.resources[id].gte(50)) {
    miningState.resources[target] = miningState.resources[target].add(1);
    miningState.resources[id] = miningState.resources[id].sub(50);
  }
}

export function autoUpgradeMining() {
  if (!miningState.unlocked) return;
  const bulk = 1000;
  ['sharpness', 'discovery', 'sensors', 'overclockPower', 'efficiency'].forEach(t => buyMiningUpgrade(t, bulk));
  upgradeTool();
}

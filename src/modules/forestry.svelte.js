import { character } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { 
  getForestryYieldBonus, 
  getForestrySpeedBonus 
} from './bestiaryBonuses.js';
import { setDnaGainCallback } from './bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';

export const forestryState = $state({
  unlocked: false,
  autoRefine: {},
  toolTier: 1,
  toolName: 'Bio-Harvesting Tool',
  dnaFragments: new Decimal(0),
  growthProgress: 0,
  growthChambers: 1,
  mutationChance: 0.05,
  reforestation: 1,
  
  // Upgrades
  chainsawFuel: 1,    // Speed multiplier
  ancientSaplings: 1, // Unlock tiers
  mutationPower: 0,   // Mutation yield multiplier
  overclockPower: 1,  // Speed during overclock
  efficiency: 0,      // Reduces DNA cost for certain actions (placeholder for future use)

  resources: {
    biomass: new Decimal(0), oakron: new Decimal(0), birchon: new Decimal(0),
    pynex: new Decimal(0), willix: new Decimal(0), mahorix: new Decimal(0),
    tecron: new Decimal(0), ebonex: new Decimal(0), crystalis: new Decimal(0),
    spirion: new Decimal(0),
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

// Register DNA gain callback to break circular dependency
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

  const tool = bioTools[Math.max(0, forestryState.toolTier - 1)];
  const speedBonus = getForestrySpeedBonus();
  
  // Growth rate calculation
  let growthRate = (2 + (forestryState.growthChambers * 1)) * tool.speed * forestryState.chainsawFuel * forestryState.reforestation * speedBonus * 2;
  
  // Add progress, but keep within reasonable bounds per tick to allow UI to catch up
  forestryState.growthProgress += (growthRate * 0.1) * ticks;
  
  if (forestryState.growthProgress >= 100) {
    const harvests = Math.floor(forestryState.growthProgress / 100);
    forestryState.growthProgress %= 100;
    executeHarvest(tool, harvests);
  }
}

function executeHarvest(tool, count = 1) {
  const yieldBonus = getForestryYieldBonus();
  
  const tiers = [
    'biomass', 'oakron', 'birchon', 'pynex', 'willix', 'mahorix', 'tecron', 'ebonex',
    'crystalis', 'spirion'
  ];
  const maxTier = Math.max(1, Math.min(tiers.length, forestryState.ancientSaplings));
  const availableTiers = tiers.slice(0, maxTier);

  // Mutation check
  const isMutated = Math.random() < (forestryState.mutationChance + (tool.luck / 1000));
  let mutationMult = 1;
  if (isMutated) {
    mutationMult = 3 + (forestryState.mutationPower * 0.5);
    addLog(`[FORESTRY] Mutation Cluster harvested!`, 'loot');
  }

  const totalBaseAmount = new Decimal(tool.yield).mul(yieldBonus).mul(count).mul(mutationMult);

  if (count < 10) {
    // Small amount of harvests, pick one random tier for simplicity
    const oreId = availableTiers[Math.floor(Math.random() * availableTiers.length)];
    const finalAmount = totalBaseAmount.ceil();
    forestryState.resources[oreId] = forestryState.resources[oreId].add(finalAmount);
    handleBioRefining(oreId);
  } else {
    // Large amount of harvests, distribute for accuracy
    const amountPerTier = totalBaseAmount.div(availableTiers.length).floor();
    const remainder = totalBaseAmount.mod(availableTiers.length).toNumber();

    availableTiers.forEach((oreId, index) => {
      let finalAmount = amountPerTier;
      if (index < remainder) finalAmount = finalAmount.add(1);
      
      if (finalAmount.gt(0)) {
        forestryState.resources[oreId] = forestryState.resources[oreId].add(finalAmount);
        handleBioRefining(oreId);
      }
    });
  }
  
  // DNA Gain - scale with count for bulk processing
  const dnaChance = 0.2;
  const expectedDna = count * dnaChance;
  const actualDna = Math.floor(expectedDna) + (Math.random() < (expectedDna % 1) ? 1 : 0);
  if (actualDna > 0) {
    forestryState.dnaFragments = forestryState.dnaFragments.add(new Decimal(actualDna).mul(tool.tier));
  }
}

function handleBioRefining(id) {
  const evolves = {
    biomass: 'biofiber', oakron: 'reinforcedFiber', birchon: 'lightPanel',
    pynex: 'resinGel', willix: 'flexFiber', mahorix: 'denseCore',
    tecron: 'armorFiber', ebonex: 'darkMatterFiber', crystalis: 'crystalGrowth',
    spirion: 'spiritFlux',
    biofiber: 'bioCore', reinforcedFiber: 'terraCore', lightPanel: 'photonBark',
    resinGel: 'cryoCore', flexFiber: 'psiCore', denseCore: 'royalMatrix',
    armorFiber: 'guardianCore', darkMatterFiber: 'shadowCore', crystalGrowth: 'lumenCore',
    spiritFlux: 'etherealCore'
  };

  const target = evolves[id];
  if (target && forestryState.autoRefine[id] && forestryState.resources[id].gte(25)) {
    const count = forestryState.resources[id].div(25).floor();
    forestryState.resources[target] = forestryState.resources[target].add(count);
    forestryState.resources[id] = forestryState.resources[id].sub(count.mul(25));
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
    const lv = forestryState.growthChambers + i;
    totalCost = totalCost.add(Math.floor(Math.pow(lv, 1.5) * 50));
  }
  if (forestryState.resources.biofiber.gte(totalCost)) {
    forestryState.resources.biofiber = forestryState.resources.biofiber.sub(totalCost);
    forestryState.growthChambers += amount;
    addLog(`[FORESTRY] Built ${amount} Chambers.`, 'system');
  }
}

export function upgradeMutationChance(amount = 1) {
  let totalCost = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    const currentMut = forestryState.mutationChance + (i * 0.01);
    totalCost = totalCost.add(Math.floor(currentMut * 500));
  }
  if (forestryState.resources.resinGel.gte(totalCost)) {
    forestryState.resources.resinGel = forestryState.resources.resinGel.sub(totalCost);
    forestryState.mutationChance += (0.01 * amount);
    addLog(`[FORESTRY] Mutation chance increased.`, 'system');
  }
}

export function refineBioSingle(id) {
  const evolves = {
    biomass: 'biofiber', oakron: 'reinforcedFiber', birchon: 'lightPanel',
    pynex: 'resinGel', willix: 'flexFiber', mahorix: 'denseCore',
    tecron: 'armorFiber', ebonex: 'darkMatterFiber', crystalis: 'crystalGrowth',
    spirion: 'spiritFlux',
    biofiber: 'bioCore', reinforcedFiber: 'terraCore', lightPanel: 'photonBark',
    resinGel: 'cryoCore', flexFiber: 'psiCore', denseCore: 'royalMatrix',
    armorFiber: 'guardianCore', darkMatterFiber: 'shadowCore', crystalGrowth: 'lumenCore',
    spiritFlux: 'etherealCore'
  };
  const target = evolves[id];
  if (target && forestryState.resources[id].gte(25)) {
    forestryState.resources[target] = forestryState.resources[target].add(1);
    forestryState.resources[id] = forestryState.resources[id].sub(25);
  }
}

export function autoUpgradeForestry() {
  if (!forestryState.unlocked) return;
  const bulk = 1000;
  ['chainsawFuel', 'reforestation', 'ancientSaplings', 'mutationPower', 'overclockPower', 'efficiency'].forEach(t => buyForestryUpgrade(t, bulk));
  upgradeBioTool();
}

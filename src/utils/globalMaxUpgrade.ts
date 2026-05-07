import { Decimal } from '../systems/decimal.js';
import { miningState, buyMiningUpgrade } from '../modules/mining.svelte.js';
import { forestryState, buyForestryUpgrade } from '../modules/forestry.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { calculateMaxLevels } from './maxUpgrade.js';

/**
 * Distributes all available resources equally across all upgradable skills
 * This is efficient - only triggers state updates once
 */
export function applyGlobalMaxUpgrade(): void {
  // Define all mining upgrades
  const miningUpgrades = [
    { 
      key: 'sharpness' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(1000),
      cap: undefined,
      resource: () => bestiaryState.dataFragments 
    },
    { 
      key: 'extraction' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(200),
      cap: undefined,
      resource: () => bestiaryState.dataFragments 
    },
    { 
      key: 'discovery' as const, 
      getCost: (lv: number) => new Decimal(10).pow(lv).mul(500),
      cap: 10,
      resource: () => bestiaryState.dataFragments 
    },
    { 
      key: 'sensors' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(2000),
      cap: undefined,
      resource: () => bestiaryState.dataFragments 
    },
    { 
      key: 'overclockPower' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(2500),
      cap: undefined,
      resource: () => bestiaryState.dataFragments 
    },
    { 
      key: 'efficiency' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(1500),
      cap: undefined,
      resource: () => bestiaryState.dataFragments 
    }
  ];

  // Define all forestry upgrades
  const forestryUpgrades = [
    { 
      key: 'chainsawFuel' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(500),
      cap: undefined,
      resource: () => forestryState.dnaFragments 
    },
    { 
      key: 'reforestation' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(150),
      cap: undefined,
      resource: () => forestryState.dnaFragments 
    },
    { 
      key: 'ancientSaplings' as const, 
      getCost: (lv: number) => new Decimal(10).pow(lv).mul(100),
      cap: 10,
      resource: () => forestryState.dnaFragments 
    },
    { 
      key: 'mutationPower' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(1500),
      cap: undefined,
      resource: () => forestryState.dnaFragments 
    },
    { 
      key: 'overclockPower' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(2000),
      cap: undefined,
      resource: () => forestryState.dnaFragments 
    },
    { 
      key: 'efficiency' as const, 
      getCost: (lv: number) => new Decimal(lv).mul(1000),
      cap: undefined,
      resource: () => forestryState.dnaFragments 
    }
  ];

  // Check if mining is unlocked
  let canUpgradeMining = miningState.unlocked && bestiaryState.dataFragments.gt(0);
  
  // Check if forestry is unlocked  
  let canUpgradeForestry = forestryState.unlocked && forestryState.dnaFragments.gt(0);

  // If nothing to upgrade, return early
  if (!canUpgradeMining && !canUpgradeForestry) return;

  // Calculate how many upgrades are available
  let totalUpgradesAvailable = 0;
  const miningUpdates: Array<[typeof miningUpgrades[number]['key'], number]> = [];
  const forestryUpdates: Array<[typeof forestryUpgrades[number]['key'], number]> = [];

  if (canUpgradeMining) {
    for (const upgrade of miningUpgrades) {
      const currentLevel = Number(miningState[upgrade.key] || 0);
      const isMaxed = upgrade.cap !== undefined && currentLevel >= upgrade.cap;
      if (!isMaxed) {
        totalUpgradesAvailable++;
      }
    }
  }

  if (canUpgradeForestry) {
    for (const upgrade of forestryUpgrades) {
      const currentLevel = Number(forestryState[upgrade.key] || 0);
      const isMaxed = upgrade.cap !== undefined && currentLevel >= upgrade.cap;
      if (!isMaxed) {
        totalUpgradesAvailable++;
      }
    }
  }

  // If no upgrades available, return
  if (totalUpgradesAvailable === 0) return;

  // For each upgrade, calculate max levels with its share of resources
  if (canUpgradeMining) {
    for (const upgrade of miningUpgrades) {
      const currentLevel = Number(miningState[upgrade.key] || 0);
      const isMaxed = upgrade.cap !== undefined && currentLevel >= upgrade.cap;
      if (!isMaxed) {
        const max = calculateMaxLevels(
          upgrade.getCost,
          currentLevel,
          upgrade.resource(),
          upgrade.cap
        );
        if (max > 0) {
          miningUpdates.push([upgrade.key, max]);
        }
      }
    }
  }

  if (canUpgradeForestry) {
    for (const upgrade of forestryUpgrades) {
      const currentLevel = Number(forestryState[upgrade.key] || 0);
      const isMaxed = upgrade.cap !== undefined && currentLevel >= upgrade.cap;
      if (!isMaxed) {
        const max = calculateMaxLevels(
          upgrade.getCost,
          currentLevel,
          upgrade.resource(),
          upgrade.cap
        );
        if (max > 0) {
          forestryUpdates.push([upgrade.key, max]);
        }
      }
    }
  }

  // Apply all mining updates
  for (const [key, amount] of miningUpdates) {
    buyMiningUpgrade(key, amount);
  }

  // Apply all forestry updates
  for (const [key, amount] of forestryUpdates) {
    buyForestryUpgrade(key, amount);
  }
}

import { Decimal } from '../systems/decimal.js';
import { miningState, buyMiningUpgrade, upgradeTool } from '../modules/mining.svelte.js';
import { forestryState, buyForestryUpgrade, upgradeBioTool } from '../modules/forestry.svelte.js';
import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
import { maxAffordable } from './maxAffordable.js';
import type { CostFormula } from './bulkCost.js';

/**
 * Distributes available resources equally across all upgradable skills.
 * Uses O(1) formulas where possible to prevent lag.
 */
export function autoUpgradeMining(): void {
  if (!miningState.unlocked) return;

  const upgrades: Array<{ key: any, formula: CostFormula, cap?: number }> = [
    { key: 'sharpness',      formula: { type: 'linear', base: 0, gain: 1000 } },
    { key: 'extraction',     formula: { type: 'linear', base: 0, gain: 200 } },
    { key: 'discovery',      formula: { type: 'geometric', base: 500, multiplier: 10 }, cap: 10 },
    { key: 'sensors',        formula: { type: 'linear', base: 2000, gain: 2000 } },
    { key: 'overclockPower', formula: { type: 'linear', base: 2500, gain: 2500 } },
    { key: 'efficiency',     formula: { type: 'linear', base: 1500, gain: 1500 } }
  ];

  const budget = bestiaryState.dataFragments;
  if (budget.lte(0)) {
    upgradeTool();
    return;
  }

  const available = upgrades.filter(u => {
    const lv = Number(miningState[u.key as keyof typeof miningState] || 0);
    return u.cap === undefined || lv < u.cap;
  });

  if (available.length > 0) {
    const share = budget.div(available.length);
    for (const upgrade of available) {
      const currentLv = Number(miningState[upgrade.key as keyof typeof miningState] || 0);
      const count = maxAffordable(share, currentLv, upgrade.formula, upgrade.cap ? upgrade.cap - currentLv : 1000000);
      if (count > 0) buyMiningUpgrade(upgrade.key, count);
    }
  }

  upgradeTool();
}

export function autoUpgradeForestry(): void {
  if (!forestryState.unlocked) return;

  const upgrades: Array<{ key: any, formula: CostFormula, cap?: number }> = [
    { key: 'chainsawFuel',    formula: { type: 'linear', base: 0, gain: 500 } },
    { key: 'reforestation',   formula: { type: 'linear', base: 0, gain: 200 } },
    { key: 'ancientSaplings', formula: { type: 'geometric', base: 100, multiplier: 10 }, cap: 10 },
    { key: 'mutationPower',   formula: { type: 'linear', base: 1500, gain: 1500 } },
    { key: 'overclockPower',  formula: { type: 'linear', base: 2000, gain: 2000 } },
    { key: 'efficiency',      formula: { type: 'linear', base: 1000, gain: 1000 } }
  ];

  const budget = forestryState.dnaFragments;
  if (budget.lte(0)) {
    upgradeBioTool();
    return;
  }

  const available = upgrades.filter(u => {
    const lv = Number(forestryState[u.key as keyof typeof forestryState] || 0);
    return u.cap === undefined || lv < u.cap;
  });

  if (available.length > 0) {
    const share = budget.div(available.length);
    for (const upgrade of available) {
      const currentLv = Number(forestryState[upgrade.key as keyof typeof forestryState] || 0);
      const count = maxAffordable(share, currentLv, upgrade.formula, upgrade.cap ? upgrade.cap - currentLv : 1000000);
      if (count > 0) buyForestryUpgrade(upgrade.key, count);
    }
  }

  upgradeBioTool();
}

export function autoUpgradeBestiary(): void {
  const upgrades: Array<{ key: any, formula: CostFormula, cap?: number }> = [
    { key: 'anatomy',           formula: { type: 'linear', base: 0, gain: 500 } },
    { key: 'huntersGreed',      formula: { type: 'linear', base: 1000, gain: 1000 } },
    { key: 'soulExtraction',    formula: { type: 'linear', base: 0, gain: 2500 } }
  ];

  const budget = bestiaryState.dataFragments;
  if (budget.lte(0)) return;

  const available = upgrades.filter(u => {
    const lv = Number(bestiaryState[u.key as keyof typeof bestiaryState] || 0);
    return u.cap === undefined || lv < u.cap;
  });

  if (available.length === 0) return;

  const share = budget.div(available.length);

  for (const upgrade of available) {
    const currentLv = Number(bestiaryState[upgrade.key as keyof typeof bestiaryState] || 0);
    const count = maxAffordable(share, currentLv, upgrade.formula, upgrade.cap ? upgrade.cap - currentLv : 1000000);
    if (count > 0) buyBestiaryUpgrade(upgrade.key, count);
  }
}

/** Legacy support or combined trigger */
export function applyGlobalMaxUpgrade(): void {
  autoUpgradeMining();
  autoUpgradeForestry();
  autoUpgradeBestiary();
}

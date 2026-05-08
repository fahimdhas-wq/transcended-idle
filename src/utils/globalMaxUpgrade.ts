import { Decimal } from '../systems/decimal.js';
import { miningState, buyMiningUpgrade, upgradeTool } from '../modules/mining.svelte.js';
import { forestryState, buyForestryUpgrade, upgradeBioTool } from '../modules/forestry.svelte.js';
import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
import { maxAffordable } from './maxAffordable.js';
import type { CostFormula } from './bulkCost.js';

/**
 * Floors a count to the nearest clean power-of-10 step.
 * 1–9   => 1
 * 10–99  => 10
 * 100–999 => 100
 * etc.
 * Minimum return value: 1
 */
function floorToCleanAmount(n: number): number {
  if (n <= 0) return 0;
  if (n < 10) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.max(1, Math.floor(n / mag) * mag);
}

/**
 * Given a shared budget split equally among `count` upgrades,
 * compute the per-slot max affordable, then floor to a clean amount.
 * Returns 0 if unaffordable.
 */
function equalShare(
  budget: Decimal,
  slots: number,
  currentLv: number,
  formula: CostFormula,
  cap?: number
): number {
  if (slots <= 0) return 0;
  const share = budget.div(slots);
  const raw = maxAffordable(share, currentLv, formula).toNumber();
  const capped = cap !== undefined ? Math.min(raw, cap - currentLv) : raw;
  return floorToCleanAmount(Math.floor(capped));
}

export function autoUpgradeMining(): void {
  if (!miningState.unlocked) return;

  const data = bestiaryState.dataFragments;
  if (data.lte(0)) { upgradeTool(); return; }

  type MEntry = { key: 'sharpness' | 'extraction' | 'discovery' | 'sensors' | 'overclockPower' | 'efficiency'; formula: CostFormula; cap?: number };

  const upgrades: MEntry[] = [
    { key: 'sharpness',      formula: { type: 'linear',    base: 0,   gain: 1000 } },
    { key: 'extraction',     formula: { type: 'linear',    base: 0,   gain: 200  } },
    { key: 'discovery',      formula: { type: 'geometric', base: 500, multiplier: 10 }, cap: 10 },
    { key: 'sensors',        formula: { type: 'linear',    base: 2000, gain: 2000 } },
    { key: 'overclockPower', formula: { type: 'linear',    base: 2500, gain: 2500 } },
    { key: 'efficiency',     formula: { type: 'linear',    base: 1500, gain: 1500 } },
  ];

  const active = upgrades.filter(u => {
    const lv = Number(miningState[u.key] || 0);
    return u.cap === undefined || lv < u.cap;
  });

  if (active.length > 0) {
    const slots = active.length;
    for (const u of active) {
      const lv = Number(miningState[u.key] || 0);
      const count = equalShare(data, slots, lv, u.formula, u.cap);
      if (count > 0) buyMiningUpgrade(u.key, count);
    }
  }

  upgradeTool();
}

export function autoUpgradeForestry(): void {
  if (!forestryState.unlocked) return;

  const dna = forestryState.dnaFragments;
  if (dna.lte(0)) { upgradeBioTool(); return; }

  type FEntry = { key: 'chainsawFuel' | 'reforestation' | 'ancientSaplings' | 'mutationPower' | 'overclockPower' | 'efficiency'; formula: CostFormula; cap?: number };

  const upgrades: FEntry[] = [
    { key: 'chainsawFuel',    formula: { type: 'linear',    base: 0,   gain: 500  } },
    { key: 'reforestation',   formula: { type: 'linear',    base: 0,   gain: 200  } },
    { key: 'ancientSaplings', formula: { type: 'geometric', base: 100, multiplier: 10 }, cap: 10 },
    { key: 'mutationPower',   formula: { type: 'linear',    base: 1500, gain: 1500 } },
    { key: 'overclockPower',  formula: { type: 'linear',    base: 2000, gain: 2000 } },
    { key: 'efficiency',      formula: { type: 'linear',    base: 1000, gain: 1000 } },
  ];

  const active = upgrades.filter(u => {
    const lv = Number(forestryState[u.key as keyof typeof forestryState] || 0);
    return u.cap === undefined || (lv as number) < u.cap;
  });

  if (active.length > 0) {
    const slots = active.length;
    for (const u of active) {
      const lv = Number(forestryState[u.key as keyof typeof forestryState] || 0);
      const count = equalShare(dna, slots, lv, u.formula, u.cap);
      if (count > 0) buyForestryUpgrade(u.key, count);
    }
  }

  upgradeBioTool();
}

export function autoUpgradeBestiary(): void {
  const data = bestiaryState.dataFragments;
  if (data.lte(0)) return;

  type BEntry = { key: 'anatomy' | 'huntersGreed' | 'soulExtraction'; formula: CostFormula };

  const upgrades: BEntry[] = [
    { key: 'anatomy',         formula: { type: 'linear', base: 0,    gain: 500  } },
    { key: 'huntersGreed',    formula: { type: 'linear', base: 1000, gain: 1000 } },
    { key: 'soulExtraction',  formula: { type: 'linear', base: 0,    gain: 2500 } },
  ];

  const active = upgrades.filter(() => true); // no cap on bestiary
  const slots = active.length;

  for (const u of active) {
    const lv = Number(bestiaryState[u.key] || 0);
    const count = equalShare(data, slots, lv, u.formula);
    if (count > 0) buyBestiaryUpgrade(u.key, count);
  }
}

export function applyGlobalMaxUpgrade(): void {
  autoUpgradeMining();
  autoUpgradeForestry();
  autoUpgradeBestiary();
}

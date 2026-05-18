
import { Decimal } from '../systems/decimal.js';
import { character } from '../modules/character.svelte.js';
import { miningState, tools, buyMiningUpgrade, upgradeEnergy, upgradeAutomation } from '../modules/mining.svelte.js';
import { forestryState, bioTools, buyForestryUpgrade, addGrowthChamber, upgradeForestryEnergy } from '../modules/forestry.svelte.js';
import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
import { invalidateBulkCostCache, calculateBulkCost, type CostFormula } from './bulkCost.js';
import { maxAffordable } from './maxAffordable.js';

/**
 * Throttle: minimum ms between auto-upgrade executions
 */
const AUTO_MIN_INTERVAL_MS = 250;
let _lastMiningAuto = 0;
let _lastForestryAuto = 0;
let _lastBestiaryAuto = 0;

/**
 * Clamps a count to MAX_UPGRADE_COUNT and floors to nearest clean step.
 */
function floorToCleanAmount(n: number): number {
  if (n <= 0) return 0;
  if (n < 10) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.max(1, Math.floor(n / mag) * mag);
}

function _getForestryFormula(type: string): CostFormula {
  switch (type) {
    case 'chainsawFuel':    return { type: 'linear', base: 0, gain: 500 };
    case 'reforestation':   return { type: 'linear', base: 0, gain: 200 };
    case 'ancientSaplings': return { type: 'geometric', base: 100, multiplier: 10 };
    case 'mutationPower':   return { type: 'linear', base: 1500, gain: 1500 };
    case 'efficiency':      return { type: 'linear', base: 1000, gain: 1000 };
    default:                return { type: 'linear', base: 0, gain: 500 };
  }
}

function _getMiningFormula(type: string): CostFormula {
  switch (type) {
    case 'sharpness':      return { type: 'linear', base: 0, gain: 1000 };
    case 'extraction':     return { type: 'linear', base: 0, gain: 200 };
    case 'discovery':      return { type: 'geometric', base: 500, multiplier: 10 };
    case 'sensors':        return { type: 'linear', base: 2000, gain: 2000 };
    case 'efficiency':     return { type: 'linear', base: 1500, gain: 1500 };
    default:               return { type: 'linear', base: 0, gain: 1000 };
  }
}

export function autoUpgradeMining(): void {
  if (!miningState.unlocked) return;

  const now = performance.now();
  if (now - _lastMiningAuto < AUTO_MIN_INTERVAL_MS) return;
  _lastMiningAuto = now;

  // Priority: cap-limited Discovery FIRST, then everything else
  const priorityUpgrades: Array<{ type: 'sharpness' | 'extraction' | 'discovery' | 'sensors' | 'efficiency'; cap?: number; priority: number }> = [
    { type: 'discovery',       cap: 10, priority: 1 },
    { type: 'sharpness',       priority: 2 },
    { type: 'extraction',      priority: 3 },
    { type: 'sensors',         priority: 4 },
    { type: 'efficiency',       priority: 5 },
  ];

  // Sort by priority
  priorityUpgrades.sort((a, b) => a.priority - b.priority);

  // Process upgrades using microtask batching to avoid blocking
  queueMicrotask(() => {
    for (const u of priorityUpgrades) {
      const currentLv = Number(miningState[u.type] || 0);
      // Skip if at cap
      if (u.cap !== undefined && currentLv >= u.cap) continue;

      const formula = _getMiningFormula(u.type);
      const maxBuy = u.cap !== undefined ? u.cap - currentLv : 1000000000000;

      // Calculate max affordable WITHOUT buying
      const initialCount = maxAffordable(bestiaryState.dataFragments, currentLv, formula, maxBuy).toNumber();
      const count = floorToCleanAmount(initialCount);

      if (count > 0) {
        buyMiningUpgrade(u.type, count, true);
      }
    }

    // Handle energy upgrade
    upgradeEnergy('max');

    // Handle drone/automation upgrades
    upgradeAutomation('drone', 'max');
    upgradeAutomation('extractor', 'max');

    // Handle tool upgrade
    if (miningState.toolTier < tools.length) {
      const next = tools[miningState.toolTier];
      if (bestiaryState.dataFragments.gte(next.dataCost)) {
        bestiaryState.dataFragments = bestiaryState.dataFragments.sub(next.dataCost);
        miningState.toolTier++;
        miningState.toolName = next.name;
      }
    }

    invalidateBulkCostCache();
  });
}

function autoUpgradeTool(): void {
  if (miningState.toolTier >= tools.length) return;
  const next = tools[miningState.toolTier];
  if (bestiaryState.dataFragments.gte(next.dataCost)) {
    bestiaryState.dataFragments = bestiaryState.dataFragments.sub(next.dataCost);
    miningState.toolTier++;
    miningState.toolName = next.name;
  }
}

export function autoUpgradeForestry(): void {
  if (!forestryState.unlocked) return;

  const now = performance.now();
  if (now - _lastForestryAuto < AUTO_MIN_INTERVAL_MS) return;
  _lastForestryAuto = now;

  // Priority 1: Cap-limited upgrades FIRST (Ancient Saplings, Discovery)
  // These only go to 10 max, so we skip gracefully when at cap
  const priorityUpgrades: Array<{ type: 'chainsawFuel' | 'reforestation' | 'ancientSaplings' | 'mutationPower' | 'efficiency'; cap?: number; priority?: number }> = [
    { type: 'ancientSaplings', cap: 10, priority: 1 },
    { type: 'chainsawFuel',    priority: 2 },
    { type: 'reforestation',   priority: 3 },
    { type: 'mutationPower',   priority: 4 },
    { type: 'efficiency',      priority: 5 },
  ];

  // Sort by priority
  priorityUpgrades.sort((a, b) => (a.priority || 99) - (b.priority || 99));

  // Process upgrades using microtask batching to avoid blocking
  queueMicrotask(() => {
    for (const u of priorityUpgrades) {
      const currentLv = Number(forestryState[u.type] || 0);
      // Skip if at cap
      if (u.cap !== undefined && currentLv >= u.cap) continue;

      const formula = _getForestryFormula(u.type);
      const maxBuy = u.cap !== undefined ? u.cap - currentLv : 1000000000000;

      // Calculate max affordable WITHOUT buying
      const initialCount = maxAffordable(forestryState.dnaFragments, currentLv, formula, maxBuy).toNumber();
      const count = floorToCleanAmount(initialCount);

      if (count > 0) {
        buyForestryUpgrade(u.type, count, true);
      }
    }

    // Handle growth chambers
    addGrowthChamber('max');

    // Handle energy upgrade
    upgradeForestryEnergy('max');

    // Handle bio tool upgrade
    if (forestryState.toolTier < bioTools.length) {
      const next = bioTools[forestryState.toolTier];
      if (forestryState.dnaFragments.gte(next.dataCost)) {
        forestryState.dnaFragments = forestryState.dnaFragments.sub(next.dataCost);
        forestryState.toolTier++;
        forestryState.toolName = next.name;
      }
    }

    invalidateBulkCostCache();
  });
}

function autoUpgradeBioTool(): void {
  if (forestryState.toolTier >= bioTools.length) return;
  const next = bioTools[forestryState.toolTier];
  if (forestryState.dnaFragments.gte(next.dataCost)) {
    forestryState.dnaFragments = forestryState.dnaFragments.sub(next.dataCost);
    forestryState.toolTier++;
    forestryState.toolName = next.name;
  }
}

export function autoUpgradeBestiary(): void {
  const now = performance.now();
  if (now - _lastBestiaryAuto < AUTO_MIN_INTERVAL_MS) return;
  _lastBestiaryAuto = now;

  const upgrades: Array<'anatomy' | 'huntersGreed' | 'soulExtraction'> = ['anatomy', 'huntersGreed', 'soulExtraction'];

  for (const u of upgrades) {
    const initialCount = buyBestiaryUpgrade(u, 'max');
    const count = floorToCleanAmount(initialCount);

    if (count > 0) {
      buyBestiaryUpgrade(u, count);
    }
  }
}

export function applyGlobalMaxUpgrade(): void {
  autoUpgradeMining();
  autoUpgradeForestry();
  autoUpgradeBestiary();
}


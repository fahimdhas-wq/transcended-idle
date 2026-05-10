import { Decimal } from '../systems/decimal.js';
import { character } from '../modules/character.svelte.js';
import { miningState, tools, buyMiningUpgrade, upgradeEnergy, upgradeAutomation } from '../modules/mining.svelte.js';
import { forestryState, bioTools, buyForestryUpgrade, addGrowthChamber, upgradeForestryEnergy } from '../modules/forestry.svelte.js';
import { bestiaryState, buyBestiaryUpgrade } from '../modules/bestiary.svelte.js';
import { invalidateBulkCostCache } from './bulkCost.js';

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

export function autoUpgradeMining(): void {
  if (!miningState.unlocked) return;

  const now = performance.now();
  if (now - _lastMiningAuto < AUTO_MIN_INTERVAL_MS) return;
  _lastMiningAuto = now;

  const upgrades: Array<{ type: 'sharpness' | 'extraction' | 'discovery' | 'sensors' | 'overclockPower' | 'efficiency'; cap?: number }> = [
    { type: 'sharpness',       cap: undefined },
    { type: 'extraction',      cap: undefined },
    { type: 'discovery',       cap: 10 },
    { type: 'sensors',         cap: undefined },
    { type: 'overclockPower',  cap: undefined },
    { type: 'efficiency',      cap: undefined },
  ];

  for (const u of upgrades) {
    const currentLv = Number(miningState[u.type] || 0);
    if (u.cap !== undefined && currentLv >= u.cap) continue;

    // Calculate max affordable with a clean count
    const initialCount = buyMiningUpgrade(u.type, 'max');
    const count = floorToCleanAmount(initialCount);

    if (count > 0) {
      buyMiningUpgrade(u.type, count);
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

  const upgrades: Array<{ type: 'chainsawFuel' | 'reforestation' | 'ancientSaplings' | 'mutationPower' | 'overclockPower' | 'efficiency'; cap?: number }> = [
    { type: 'chainsawFuel',    cap: undefined },
    { type: 'reforestation',   cap: undefined },
    { type: 'ancientSaplings', cap: 10 },
    { type: 'mutationPower',   cap: undefined },
    { type: 'overclockPower',  cap: undefined },
    { type: 'efficiency',      cap: undefined },
  ];

  for (const u of upgrades) {
    const currentLv = Number(forestryState[u.type] || 0);
    if (u.cap !== undefined && currentLv >= u.cap) continue;

    // Only call once - 'max' already calculates the affordable count
    buyForestryUpgrade(u.type, 'max');
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

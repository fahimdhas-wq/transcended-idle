/**
 * Economy Formulas — Centralized cost and progression calculations.
 *
 * Covers:
 * - Upgrade cost formulas (linear, geometric, polynomial)
 * - Mining/Forestry yield calculations
 * - Tool progression
 * - Resource refinement chains
 */

import { Decimal, type DecimalSource } from '../../systems/decimal.js';
import { memoize } from './memo.js';

// ============================================================
// Cost Formula Types
// ============================================================

export type CostFormulaType = 'linear' | 'geometric' | 'polynomial' | 'exponential';

export interface LinearCostFormula {
  type: 'linear';
  base: number;
  gain: number;
}

export interface GeometricCostFormula {
  type: 'geometric';
  base: number;
  multiplier: number;
}

export interface PolynomialCostFormula {
  type: 'polynomial';
  base: number;
  power: number;
}

export interface ExponentialCostFormula {
  type: 'exponential';
  base: number;
  growth: number;
}

export type CostFormula =
  | LinearCostFormula
  | GeometricCostFormula
  | PolynomialCostFormula
  | ExponentialCostFormula;

// ============================================================
// Single Purchase Cost
// ============================================================

export function calculateSingleCost(
  formula: CostFormula,
  currentLevel: number
): Decimal {
  switch (formula.type) {
    case 'linear':
      return new Decimal(formula.base + currentLevel * formula.gain);

    case 'geometric':
      return new Decimal(formula.base * Math.pow(formula.multiplier, currentLevel));

    case 'polynomial':
      return new Decimal(formula.base * Math.pow(currentLevel + 1, formula.power));

    case 'exponential':
      return new Decimal(formula.base * Math.pow(1 + formula.growth, currentLevel));

    default:
      return new Decimal(0);
  }
}

// ============================================================
// Bulk Purchase Cost (sum of multiple purchases)
// ============================================================

export function calculateBulkCost(
  formula: CostFormula,
  currentLevel: number,
  count: number
): Decimal {
  if (count <= 0) return new Decimal(0);
  if (count === 1) return calculateSingleCost(formula, currentLevel);

  switch (formula.type) {
    case 'linear': {
      // Sum of arithmetic series: base + (base+gain) + ... + (base + (n-1)*gain)
      // = n*base + gain * n*(n-1)/2
      const n = count;
      return new Decimal(n * formula.base + formula.gain * (n * (n - 1)) / 2);
    }

    case 'geometric': {
      // Sum of geometric series: base * (1 + m + m^2 + ... + m^(n-1))
      // = base * (m^n - 1) / (m - 1)
      const m = formula.multiplier;
      return new Decimal(formula.base * (Math.pow(m, count) - 1) / (m - 1));
    }

    case 'polynomial': {
      // Sum of polynomial: base * sum((i+1)^power) for i=0 to n-1
      // Approximate with integral for large n
      let total = new Decimal(0);
      for (let i = 0; i < count; i++) {
        total = total.add(new Decimal(formula.base * Math.pow(currentLevel + i + 1, formula.power)));
      }
      return total;
    }

    case 'exponential': {
      const g = formula.growth;
      return new Decimal(formula.base * (Math.pow(1 + g, count) - 1) / g);
    }

    default:
      return new Decimal(0);
  }
}

// ============================================================
// Max Affordable Purchases
// ============================================================

export function calculateMaxAffordable(
  currency: DecimalSource,
  currentLevel: number,
  formula: CostFormula,
  maxPurchases: number = 1000000
): number {
  const budget = currency instanceof Decimal ? currency : new Decimal(currency);

  if (budget.lte(0)) return 0;

  let low = 0;
  let high = Math.min(maxPurchases, 1000000);

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const cost = calculateBulkCost(formula, currentLevel, mid);
    if (cost.lte(budget)) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

// ============================================================
// Gathering Formulas (Mining & Forestry)
// ============================================================

export interface GatheringConfig {
  baseRate: number;
  baseEnergyCost: number;
  progressThreshold: number;
  tickRate: number;
  critChanceBase: number;
  critChancePerLuck: number;
  critMultiplier: number;
  fragDropChance: number;
  fragTierPower: number;
  yieldTierStep: number;
  yieldBaseExponent: number;
  automationBonus: number;
  automationRegen: number;
  overclockBaseMult: number;
  overclockPowerBonus: number;
  baseRegenRate: number;
}

export const DEFAULT_GATHERING_CONFIG: GatheringConfig = {
  baseRate: 0.001,
  baseEnergyCost: 0.002,
  progressThreshold: 1000,
  tickRate: 0.1, // seconds
  critChanceBase: 0.01,
  critChancePerLuck: 0.001,
  critMultiplier: 3,
  fragDropChance: 0.01,
  fragTierPower: 1.5,
  yieldTierStep: 2,
  yieldBaseExponent: 0,
  automationBonus: 0.1,
  automationRegen: 0.01,
  overclockBaseMult: 2,
  overclockPowerBonus: 0.5,
  baseRegenRate: 0.001
};

export function calculateGatheringSpeed(
  baseRate: number,
  automationLevel: number,
  toolSpeed: number,
  upgradeLevel1: number,
  upgradeLevel2: number,
  bestiaryBonus: number,
  challengeBonus: number = 1
): number {
  const automationMult = 1 + automationLevel * DEFAULT_GATHERING_CONFIG.automationBonus;
  const upgradeMult = (upgradeLevel1 + 1) * (upgradeLevel2 + 1);

  return baseRate * automationMult * toolSpeed * upgradeMult * bestiaryBonus * 2 * challengeBonus;
}

export function calculateOverclockMultiplier(
  overclockLevel: number
): number {
  return DEFAULT_GATHERING_CONFIG.overclockBaseMult +
         (overclockLevel + 1) * DEFAULT_GATHERING_CONFIG.overclockPowerBonus;
}

export function calculateEnergyCost(
  speed: number,
  efficiency: number
): number {
  const speedLog = Math.max(1, Math.log10(speed + 1));
  const effReduction = 1 / (1 + efficiency * 0.1);
  return DEFAULT_GATHERING_CONFIG.baseEnergyCost * speedLog * speedLog * effReduction;
}

export function calculateEnergyRegen(
  maxEnergy: number,
  toolTier: number,
  automationLevel: number,
  efficiency: number
): number {
  const tierMult = toolTier;
  const baseRegen = maxEnergy * DEFAULT_GATHERING_CONFIG.baseRegenRate * tierMult;
  const autoRegen = automationLevel * maxEnergy * DEFAULT_GATHERING_CONFIG.automationRegen * tierMult;
  return (baseRegen + autoRegen) * efficiency;
}

export function calculateYield(
  baseYield: number,
  upgradeLevel: number,
  automationLevel: number
): number {
  return baseYield * (1 + upgradeLevel * 0.1) + automationLevel * 5;
}

export function calculateCritChance(
  baseLuck: number,
  upgradeLevel: number
): number {
  return DEFAULT_GATHERING_CONFIG.critChanceBase +
         (baseLuck + upgradeLevel) * DEFAULT_GATHERING_CONFIG.critChancePerLuck;
}

export function calculateResourceYield(
  tier: number,
  amount: number,
  isCritical: boolean,
  luck: number
): number {
  const yieldMult = Math.pow(10, (tier - 1) * DEFAULT_GATHERING_CONFIG.yieldTierStep + DEFAULT_GATHERING_CONFIG.yieldBaseExponent);
  const critMult = isCritical ? DEFAULT_GATHERING_CONFIG.critMultiplier : 1;
  return amount * critMult * yieldMult;
}

export function calculateFragmentDrop(
  tier: number,
  upgradeLevel1: number,
  upgradeLevel2: number
): Decimal {
  const base = Math.pow(tier, DEFAULT_GATHERING_CONFIG.fragTierPower);
  return new Decimal(base)
    .mul(upgradeLevel1 + 1)
    .mul(upgradeLevel2 + 1)
    .mul(10)
    .ceil();
}

// ============================================================
// Tool Progression
// ============================================================

export interface ToolDefinition {
  name: string;
  speed: number;
  yield: number;
  luck: number;
  tier: number;
  dataCost: DecimalSource;
}

export function calculateNextToolCost(
  currentToolIndex: number,
  toolDefinitions: ToolDefinition[]
): Decimal {
  if (currentToolIndex >= toolDefinitions.length - 1) {
    return new Decimal(Infinity); // Max tier
  }

  const nextTool = toolDefinitions[currentToolIndex + 1];
  return nextTool.dataCost instanceof Decimal ? nextTool.dataCost : new Decimal(nextTool.dataCost);
}

export function canAffordTool(
  currentToolIndex: number,
  currency: DecimalSource,
  toolDefinitions: ToolDefinition[]
): boolean {
  const cost = calculateNextToolCost(currentToolIndex, toolDefinitions);
  const budget = currency instanceof Decimal ? currency : new Decimal(currency);
  return budget.gte(cost);
}

// ============================================================
// Refinement Formulas
// ============================================================

export interface RefineChain {
  input: string;
  output: string;
  ratio: number;
}

export function calculateRefinementOutput(
  inputAmount: number,
  ratio: number
): number {
  return Math.floor(inputAmount / ratio);
}

export function processRefineChain(
  resourceAmount: number,
  chain: RefineChain[],
  autoRefineEnabled: Set<string>
): Map<string, number> {
  const result = new Map<string, number>();

  for (const step of chain) {
    if (!autoRefineEnabled.has(step.input)) continue;

    const output = calculateRefinementOutput(resourceAmount, step.ratio);
    if (output > 0) {
      result.set(step.output, output);
    }
  }

  return result;
}

// ============================================================
// Cached Upgrade Costs (for UI)
// ============================================================

export function getCachedUpgradeCost(
  key: string,
  currentLevel: number,
  formula: CostFormula,
  count: number,
  deps: unknown[]
): Decimal {
  return memoize(
    `upgrade_${key}_${currentLevel}_${count}`,
    deps,
    () => calculateBulkCost(formula, currentLevel, count)
  );
}

export function getCachedBulkInfo(
  currency: DecimalSource,
  currentLevel: number,
  formula: CostFormula,
  maxBuy: number = 1000000000000
): {
  maxAffordable: number;
  totalCost: Decimal;
  remainingCurrency: Decimal;
} {
  const budget = currency instanceof Decimal ? currency : new Decimal(currency);
  const maxAffordable = calculateMaxAffordable(budget, currentLevel, formula, maxBuy);
  const totalCost = calculateBulkCost(formula, currentLevel, maxAffordable);

  return {
    maxAffordable,
    totalCost,
    remainingCurrency: budget.sub(totalCost)
  };
}

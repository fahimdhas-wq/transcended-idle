/**
 * maxAffordable.ts
 * 
 * Calculates how many upgrades you can afford given a budget.
 * Uses mathematical formulas (O(1) - constant time) instead of binary search
 * to handle huge budgets (1A+) without freezing the game.
 * 
 * Cost Formulas:
 * - Linear:   cost(L,k) = k*base + gain*(k*L + k*(k-1)/2)
 * - Geometric: cost(L,k) = base * r^L * (r^k - 1) / (r - 1)
 * 
 * Where L = current level, k = number to buy, r = multiplier
 */

import { Decimal } from '../systems/decimal';
import { calculateBulkCost, type CostFormula } from './bulkCost';

/**
 * Solves quadratic equation: a*k^2 + b*k + c = 0
 * Returns the positive root (k value that solves the equation)
 * 
 * Formula: k = (-b ± sqrt(b² - 4ac)) / 2a
 * We take the positive root since k (count) must be >= 0
 */
function solveQuadratic(a: number, b: number, c: number): number {
  if (a === 0) return b === 0 ? 0 : -c / b;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return 0;
  const sqrtD = Math.sqrt(discriminant);
  const x1 = (-b + sqrtD) / (2 * a);
  const x2 = (-b - sqrtD) / (2 * a);
  return Math.max(0, Math.max(x1, x2));
}

/**
 * Type guards to check what kind of formula we're dealing with
 * This lets us use the fast O(1) formula solutions instead of binary search
 */
function isLinearFormula(formula: CostFormula): formula is { type: 'linear'; base: number; gain: number } {
  return typeof formula !== 'function' && formula.type === 'linear';
}

function isGeometricFormula(formula: CostFormula): formula is { type: 'geometric'; base: number; multiplier: number } {
  return typeof formula !== 'function' && formula.type === 'geometric';
}

/**
 * Main function: finds maximum affordable upgrades
 * 
 * Algorithm:
 * 1. If linear formula: use quadratic solution (O(1))
 * 2. If geometric formula (r > 1): use logarithmic solution (O(1))
 * 3. If geometric formula (r = 1): use simple division
 * 4. Otherwise: fallback to binary search (O(log n))
 * 
 * @param budget - Total resources available (e.g., dataFragments)
 * @param currentLv - Current upgrade level
 * @param formula - Cost formula (linear or geometric)
 * @param maxCount - Maximum allowed purchases (capped at 10 for some upgrades)
 * @returns Maximum number affordable as Decimal
 */
export function maxAffordable(
  budget: Decimal,
  currentLv: number,
  formula: CostFormula,
  maxCount: number = 10000
): Decimal {
  const SEARCH_CAP = 1000000000;
  const effectiveMax = Math.min(maxCount, SEARCH_CAP);

  if (budget.m === 0) return Decimal.ZERO;

  // =========================================================================
  // LINEAR FORMULA: O(1) Quadratic Solution
  // =========================================================================
  // Cost formula: sum_{i=L}^{L+k-1} (base + gain*i)
  //            = k*base + gain * (k*L + k*(k-1)/2)
  //            = (gain/2) * k² + (base + gain*(L-0.5)) * k
  // 
  // This is a quadratic: a*k² + b*k = budget
  // Where: a = gain/2, b = base + gain*(L-0.5)
  // 
  // Solving: k = (-b + sqrt(b² + 4*a*budget)) / (2*a)
  // =========================================================================
  if (isLinearFormula(formula)) {
    const base = Number(formula.base);
    const gain = Number(formula.gain);
    if (gain === 0) return Decimal.ZERO;
    const L = currentLv;

    const a = gain / 2;
    const b = base + gain * (L - 0.5);
    const B = budget.m * Math.pow(10, budget.e); // Convert Decimal to regular number

    const k = solveQuadratic(a, b, -B);
    const result = Math.min(Math.floor(k), effectiveMax);
    return new Decimal(Math.max(0, result));
  }

  // =========================================================================
  // GEOMETRIC FORMULA: O(1) Logarithmic Solution
  // =========================================================================
  // Cost formula: sum_{i=L}^{L+k-1} (base * r^i)
  //            = base * r^L * (r^k - 1) / (r - 1)
  // 
  // Rearranging for k:
  //   budget = base * r^L * (r^k - 1) / (r - 1)
  //   budget * (r - 1) / (base * r^L) + 1 = r^k
  //   k = log_r(term)
  //   k = log(term) / log(r)
  // =========================================================================
  if (isGeometricFormula(formula)) {
    const base = Number(formula.base);
    const r = Number(formula.multiplier);
    const L = currentLv;

    // Special case: r = 1 means linear (constant cost per level)
    if (r === 1) {
      const perUnit = base * (L + 1);
      if (perUnit === 0) return Decimal.ZERO;
      const budgetNum = budget.m * Math.pow(10, budget.e);
      const result = Math.min(Math.floor(budgetNum / perUnit), effectiveMax);
      return new Decimal(Math.max(0, result));
    }

    // Normal case: r > 1 (exponentially increasing cost)
    const budgetNum = budget.m * Math.pow(10, budget.e);
    const baseNum = base;
    const rL = Math.pow(r, L);
    const term = budgetNum * (r - 1) / (baseNum * rL) + 1;

    if (term <= 0) return Decimal.ZERO;

    const k = Math.log(term) / Math.log(r);
    const result = Math.min(Math.floor(k), effectiveMax);
    return new Decimal(Math.max(0, result));
  }

  // =========================================================================
  // FALLBACK: Binary Search (O(log n))
  // =========================================================================
  // For custom function formulas, we can't use O(1) math solutions
  // Binary search is still fast enough but slower for huge budgets
  // =========================================================================
  let low = Decimal.ZERO;
  let high = new Decimal(effectiveMax);
  let affordable = Decimal.ZERO;

  while (low.lte(high)) {
    const mid = low.add(high).div(2).floor();
    if (mid.lte(0)) {
      low = Decimal.ONE;
      if (low.gt(high)) break;
      continue;
    }
    const count = mid.toNumber();
    const cost = calculateBulkCost(formula, currentLv, count);
    if (cost.lte(budget)) {
      affordable = mid;
      low = mid.add(1);
    } else {
      high = mid.sub(1);
    }
  }
  return affordable;
}
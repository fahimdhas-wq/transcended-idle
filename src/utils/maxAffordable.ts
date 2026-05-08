import type { Decimal } from '../systems/decimal';
import { calculateBulkCost, type CostFormula } from './bulkCost';

/**
 * Calculates the maximum affordable number of upgrades using a binary search.
 * @param budget The total resource available.
 * @param currentLv The current level of the upgrade.
 * @param formula A function or formula object that returns the cost for a given level.
 * @param cap The maximum number of levels to check (performance cap).
 * @returns The maximum number of levels that can be afforded.
 */
export function maxAffordable(
  budget: Decimal,
  currentLv: number,
  formula: CostFormula,
  cap = 10000000
): number {
  let low = 0;
  let high = cap;
  let affordable = 0;

  // If budget is 0, we can afford 0
  if (budget.m === 0) return 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid === 0) {
      low = 1;
      continue;
    }
    const cost = calculateBulkCost(formula, currentLv, mid);
    if (cost.lte(budget)) {
      affordable = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return affordable;
}

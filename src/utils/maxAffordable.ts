import { Decimal } from '../systems/decimal';
import { calculateBulkCost, type CostFormula } from './bulkCost';

/**
 * Calculates the maximum affordable number of upgrades using a binary search.
 * @param budget The total resource available.
 * @param currentLv The current level of the upgrade.
 * @param formula A function or formula object that returns the cost for a given level.
 * @returns The maximum number of levels that can be afforded as a Decimal.
 */
export function maxAffordable(
  budget: Decimal,
  currentLv: number,
  formula: CostFormula
): Decimal {
  let low = new Decimal(0);
  let high = new Decimal(1000000000000); // Start with a sufficiently large initial guess
  let affordable = new Decimal(0);

  // If budget is 0, we can afford 0
  if (budget.m === 0) return new Decimal(0);

  while (low.lte(high)) {
    const mid = low.add(high).div(2).floor();
    if (mid.lte(0)) {
      low = new Decimal(1);
      continue;
    }
    const cost = calculateBulkCost(formula, currentLv, mid.toNumber());
    if (cost.lte(budget)) {
      affordable = mid;
      low = mid.add(1);
    } else {
      high = mid.sub(1);
    }
  }
  return affordable;
}

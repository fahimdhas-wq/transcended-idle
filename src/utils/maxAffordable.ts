
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
  formula: CostFormula,
  maxCount: number = 1000000000000
): Decimal {
  let low = Decimal.ZERO;
  let high = new Decimal(maxCount); 
  let affordable = Decimal.ZERO;

  // If budget is 0, we can afford 0
  if (budget.m === 0) return Decimal.ZERO;

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


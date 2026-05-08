import type { Decimal } from '../systems/decimal';
import { calculateBulkCost, type CostFormula } from './bulkCost';
import { maxAffordable } from './maxAffordable';

/**
 * Adjusts the requested upgrade count to the largest amount that can be afforded.
 */
export function getAffordableAmount(
  budget: Decimal,
  currentLv: number,
  formula: CostFormula,
  requestedCount: number
): number {
  const cost = calculateBulkCost(formula, currentLv, requestedCount);
  if (budget.gte(cost)) {
    return requestedCount;
  }
  
  // If we can't afford requestedCount, return the absolute max affordable
  return maxAffordable(budget, currentLv, formula);
}

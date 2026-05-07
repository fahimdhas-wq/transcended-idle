
import type { Decimal } from '../systems/decimal';
import { calculateBulkCost } from './bulkCost';

/**
 * Calculates the maximum affordable number of upgrades using a binary search.
 * @param budget The total resource available.
 * @param currentLv The current level of the upgrade.
 * @param costFn A function that returns the cost for a given level.
 * @param cap The maximum number of levels to check (performance cap).
 * @returns The maximum number of levels that can be afforded.
 */
export function maxAffordable(
  budget: Decimal,
  currentLv: number,
  costFn: (lv: number) => Decimal,
  cap = 100000
): number {
  let low = 0;
  let high = cap;
  let affordable = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid === 0) {
      low = 1;
      continue;
    }
    const cost = calculateBulkCost(costFn, currentLv, mid);
    if (cost.lte(budget)) {
      affordable = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return affordable;
}

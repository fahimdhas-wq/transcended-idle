import { Decimal } from '../systems/decimal.js';

/**
 * Calculate total cost for buying N levels of an upgrade
 * @param {Function} baseCostFn - Function that takes level and returns cost
 * @param {number} currentLevel - Current level
 * @param {number} amount - How many levels to buy
 * @returns {Decimal} Total cost
 */
export function calculateBulkCost(baseCostFn, currentLevel, amount) {
  let total = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    total = total.add(baseCostFn(currentLevel + i));
  }
  return total;
}

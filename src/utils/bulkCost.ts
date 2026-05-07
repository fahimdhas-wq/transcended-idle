import { Decimal } from '../systems/decimal.js';

export function calculateBulkCost(
  baseCostFn: (level: number) => number | Decimal,
  currentLevel: number,
  amount: number
): Decimal {
  let total = new Decimal(0);
  for (let i = 0; i < amount; i++) {
    total = total.add(baseCostFn(currentLevel + i));
  }
  return total;
}

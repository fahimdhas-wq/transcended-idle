import { Decimal } from '../systems/decimal.js';

export function calculateBulkCost(
  baseCostFn: (level: number) => number | Decimal,
  currentLevel: number,
  amount: number
): Decimal {
  if (amount <= 0) return new Decimal(0);
  
  // Safety cap to prevent infinite loops or extreme hangs
  const safeAmount = Math.min(amount, 1000000);
  
  let total = new Decimal(0);
  
  // Optimization: If the amount is very large, we might want to use a formula.
  // But since cost functions are passed as black-box callbacks, we can only loop.
  // We'll use a slightly more efficient loop for Decimal addition.
  
  for (let i = 0; i < safeAmount; i++) {
    const cost = baseCostFn(currentLevel + i);
    total = total.add(cost);
    
    // If cost becomes Infinity, we can stop
    if (total.e >= 1000000) break;
  }
  
  return total;
}

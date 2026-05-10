
import { Decimal } from '../systems/decimal.js';

export function calculateMaxLevels(
  baseCostFn: (level: number) => Decimal,
  currentLevel: number,
  availableCurrency: Decimal,
  cap?: number
): number {
  let canAfford = 0;
  let remaining = availableCurrency;
  let current = currentLevel;

  while (cap === undefined || current < cap) {
    const cost = baseCostFn(current);
    if (remaining.gte(cost)) {
      remaining = remaining.sub(cost);
      canAfford++;
      current++;
    } else {
      break;
    }
  }

  return canAfford;
}


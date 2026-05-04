import { Decimal } from './decimal.js';
import { formatValue } from './formatValue.js';

/**
 * Robust number formatter for extreme RPG scales.
 * Now uses the universal formatValue utility.
 */
export function formatNumber(num) {
  return formatValue(num);
}

export function isLevelZZ(level) {
  const d = new Decimal(level);
  return d.e >= 6; // Roughly 1M
}

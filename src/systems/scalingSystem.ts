
import { Decimal, type DecimalSource } from './decimal.js';
import { formatValue } from './formatValue.js';

export function formatNumber(num: DecimalSource | null | undefined): string {
  return formatValue(num);
}

export function isLevelZZ(level: DecimalSource): boolean {
  const d = new Decimal(level);
  return d.e >= 6;
}


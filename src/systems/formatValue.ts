
import { Decimal, type DecimalSource } from './decimal.js';

// Suffixes: '', k, m, b, t, then A-Z, Aa-Zz, ...
// k=1e3, m=1e6, b=1e9, t=1e12, A=1e15, B=1e18, C=1e21 ...
const NAMED_SUFFIXES = ['', 'k', 'm', 'b', 't'];

export function getSuffixForExponent(exponent: number): string {
  const tier = Math.floor(exponent / 3);
  if (tier < NAMED_SUFFIXES.length) return NAMED_SUFFIXES[tier];

  // tier 5 => 'A' (1e15), tier 6 => 'B' (1e18), ...
  const idx = tier - NAMED_SUFFIXES.length; // 0-based index into alphabetic range
  if (idx < 0) return '';

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const len = ALPHA.length; // 26

  if (idx < len) return ALPHA[idx]; // A-Z (1e15 to 1e90)

  // double letter: AA, AB, ..., AZ, BA, ...
  const di = idx - len;
  const first = ALPHA[Math.floor(di / len) % len];
  const second = ALPHA[di % len];
  const suffix = first + second;
  if (suffix.length > 3) return 'INF';
  return suffix;
}

export function formatValue(val: DecimalSource | null | undefined): string {
  if (val === undefined || val === null) return '0';

  // Fast path: skip wrapping when val is already a Decimal
  const d = val instanceof Decimal ? val : new Decimal(val);
  if (d.m === 0) return '0';

  const isNeg = d.m < 0;
  const m = isNeg ? -d.m : d.m;
  const e = d.e;

  if (e < 3) {
    const num = m * Math.pow(10, e);
    const str = num < 10
      ? num.toFixed(2).replace(/\.?0+$/, '')
      : num < 100
        ? num.toFixed(1).replace(/\.0$/, '')
        : Math.floor(num).toString();
    return isNeg ? '-' + str : str;
  }

  const suffix = getSuffixForExponent(e);
  if (suffix === 'INF') return isNeg ? '-INF' : 'INF';

  const tier = Math.floor(e / 3);
  const displayE = tier * 3;
  const displayMantissa = m * Math.pow(10, e - displayE);

  let str: string;
  if (displayMantissa >= 100) {
    str = Math.floor(displayMantissa).toString();
  } else if (displayMantissa >= 10) {
    str = displayMantissa.toFixed(1).replace(/\.0$/, '');
  } else {
    str = displayMantissa.toFixed(2).replace(/\.?0+$/, '');
  }

  return (isNeg ? '-' : '') + str + suffix;
}


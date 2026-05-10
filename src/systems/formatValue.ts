
import { Decimal, type DecimalSource } from './decimal.js';

// Suffixes: '', K, M, B, T, then a-z, aa-az, ba-bz, ...
// K=1e3, M=1e6, B=1e9, T=1e12, a=1e15, b=1e18, c=1e21 ...
const NAMED_SUFFIXES = ['', 'K', 'M', 'B', 'T'];

export function getSuffixForExponent(exponent: number): string {
  const tier = Math.floor(exponent / 3);
  if (tier < NAMED_SUFFIXES.length) return NAMED_SUFFIXES[tier];

  // tier 5 => 'a' (1e15), tier 6 => 'b' (1e18), ...
  const idx = tier - NAMED_SUFFIXES.length; // 0-based index into alphabetic range
  if (idx < 0) return '';

  const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
  const len = ALPHA.length; // 26

  if (idx < len) return ALPHA[idx]; // a-z (1e15 to 1e90)

  // double letter: aa, ab, ..., az, ba, ...
  const di = idx - len;
  const first = ALPHA[Math.floor(di / len) % len];
  const second = ALPHA[di % len];
  const suffix = first + second;
  if (suffix.length > 3) return 'INF';
  return suffix;
}

export function formatValue(val: DecimalSource | null | undefined): string {
  if (val === undefined || val === null) return '0';
  const d = new Decimal(val);
  if (d.m === 0) return '0';

  const isNeg = d.m < 0;
  const abs = isNeg ? new Decimal(-d.m, d.e) : d;

  if (abs.e < 3) {
    const num = abs.toNumber();
    const str = num < 10
      ? num.toFixed(2).replace(/\.?0+$/, '')
      : num < 100
        ? num.toFixed(1).replace(/\.0$/, '')
        : Math.floor(num).toString();
    return isNeg ? '-' + str : str;
  }

  const suffix = getSuffixForExponent(abs.e);
  if (suffix === 'INF') return isNeg ? '-INF' : 'INF';

  const tier = Math.floor(abs.e / 3);
  const displayE = tier * 3;
  const displayMantissa = abs.m * Math.pow(10, abs.e - displayE);

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


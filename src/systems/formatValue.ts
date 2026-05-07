import { Decimal, type DecimalSource } from './decimal.js';

const STANDARD_SUFFIXES: string[] = ['', 'K', 'M', 'B', 'T'];

export function getSuffixForExponent(exponent: number): string {
  const suffixIndex = Math.floor(exponent / 3);
  if (suffixIndex < STANDARD_SUFFIXES.length) {
    return STANDARD_SUFFIXES[suffixIndex];
  }

  let i = suffixIndex - STANDARD_SUFFIXES.length;
  let suffix = '';
  while (i >= 0) {
    suffix = String.fromCharCode(65 + (i % 26)) + suffix;
    i = Math.floor(i / 26) - 1;
  }
  if (suffix.length > 27) return 'INFINITE';
  return suffix;
}

export function formatValue(val: DecimalSource | null | undefined): string {
  if (val === undefined || val === null) return '0';
  const d = new Decimal(val);
  if (d.e < 3) {
    const num = d.toNumber();
    return num.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  const suffix = getSuffixForExponent(d.e);
  if (suffix === 'INFINITE') return 'INFINITE';
  const displayVal = d.m * Math.pow(10, d.e % 3);
  return displayVal.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + suffix;
}

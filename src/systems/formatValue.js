import { Decimal } from './decimal.js';

const STANDARD_SUFFIXES = [
  "", "K", "M"
];

/**
 * Formats a Decimal object or number into a readable string with suffixes.
 * Uses K, M, B, T etc. then transitions to A, B, C... AA, AB... up to 27 Z's.
 */
export function getSuffixForExponent(exponent) {
  const suffixIndex = Math.floor(exponent / 3);
  if (suffixIndex < STANDARD_SUFFIXES.length) {
    return STANDARD_SUFFIXES[suffixIndex];
  }
  
  let i = suffixIndex - STANDARD_SUFFIXES.length;
  let letterCount = 0;
  let suffix = '';
  
  while (i >= 0) {
    suffix = String.fromCharCode(65 + (i % 26)) + suffix;
    i = Math.floor(i / 26) - 1;
    letterCount++;
  }
  
  if (letterCount > 27) {
    return "INFINITE";
  }
  
  return suffix;
}

export function formatValue(val) {
  if (val === undefined || val === null) return "0";
  
  const d = new Decimal(val);
  
  if (d.e < 3) {
    const num = d.toNumber();
    return (num < 0 ? Math.ceil(num) : Math.floor(num)).toString();
  }

  const suffix = getSuffixForExponent(d.e);
  
  if (suffix === "INFINITE") {
    return "INFINITE";
  }

  const displayVal = d.m * Math.pow(10, d.e % 3);
  return displayVal.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + suffix;
}
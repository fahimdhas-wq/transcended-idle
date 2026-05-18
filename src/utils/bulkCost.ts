
import { Decimal, type DecimalSource } from '../systems/decimal.js';

export type CostFormula =
  | { type: 'linear'; base: DecimalSource; gain: DecimalSource }
  | { type: 'geometric'; base: DecimalSource; multiplier: DecimalSource }
  | ((level: number) => number | Decimal);

// Memoization cache: key = `fnName|currentLevel|amount`
const _cache = new Map<string, Decimal>();
const MAX_CACHE_SIZE = 512;

function evictIfNeeded(): void {
  if (_cache.size > MAX_CACHE_SIZE) {
    // Delete oldest quarter
    const keys = _cache.keys();
    for (let i = 0; i < MAX_CACHE_SIZE / 4; i++) {
      const k = keys.next().value;
      if (k !== undefined) _cache.delete(k);
    }
  }
}

/**
 * Calculates the total cost for multiple upgrades.
 * Uses closed-form formulas for linear and geometric costs to prevent UI lag.
 */
export function calculateBulkCost(
  formula: CostFormula,
  currentLevel: number,
  amount: number
): Decimal {
  if (amount <= 0) return Decimal.ZERO;

  // 1. Optimized Formulas
  if (typeof formula !== 'function') {
    if (formula.type === 'linear') {
      // cost(L) = base + gain * L
      // Sum_{i=L}^{L+k-1} (base + gain * i) = k*base + gain * (k*L + k*(k-1)/2)
      const L = new Decimal(currentLevel);
      const k = new Decimal(amount);
      const base = new Decimal(formula.base);
      const gain = new Decimal(formula.gain);

      const term1 = k.mul(base);
      const term2 = gain.mul(k.mul(L).add(k.mul(k.sub(1)).div(2)));
      return term1.add(term2);
    }

    if (formula.type === 'geometric') {
      // cost(L) = base * multiplier ^ L
      // Sum_{i=L}^{L+k-1} (base * r^i) = base * r^L * (r^k - 1) / (r - 1)
      const base = new Decimal(formula.base);
      const r = new Decimal(formula.multiplier);
      const n = amount;
      const L = currentLevel;

      if (r.m === 1 && r.e === 0) return base.mul(n);

      const term1 = base.mul(r.pow(L));
      const term2 = r.pow(n).sub(1);
      const term3 = r.sub(1);
      return term1.mul(term2).div(term3);
    }
  }

  // 2. Fallback to Loop (Memoized)
  const baseCostFn = formula as (level: number) => number | Decimal;
  const cacheKey = `${baseCostFn.name || 'anon'}|${currentLevel}|${amount}`;
  const cached = _cache.get(cacheKey);
  if (cached) return cached;

  let total = Decimal.ZERO;
  const cap = Math.min(amount, 100_000); // safety cap
  for (let i = 0; i < cap; i++) {
    const cost = baseCostFn(currentLevel + i);
    total = total.add(cost);
    if (total.e >= 1000000) break; // Break if too large
  }

  evictIfNeeded();
  _cache.set(cacheKey, total);
  return total;
}

/** Call this whenever a purchase is made to invalidate stale cache entries. */
export function invalidateBulkCostCache(): void {
  _cache.clear();
}


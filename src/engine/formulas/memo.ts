/**
 * Memoization Utilities — Cache expensive calculations.
 *
 * Problem: Combat stats, damage formulas, upgrade costs are recalculated
 * every tick, every render, every UI access.
 *
 * Solution: Memoize with dependency tracking. Only recalculate when
 * inputs change.
 *
 * Usage:
 *   const damage = memo('damage', [atk, critMult, multipliers], () => calculate(atk, critMult, multipliers));
 */

import { Decimal, type DecimalSource } from '../../systems/decimal.js';

// ============================================================
// Cache Entry
// ============================================================

interface CacheEntry<T> {
  value: T;
  dependencies: unknown[];
  createdAt: number;
}

// ============================================================
// Map Cache with CacheEntry values
// ============================================================

class FormulaCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private accessOrder: string[] = [];

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry<any> | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      this.touch(key);
    }
    return entry;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, entry: CacheEntry<any>): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift();
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }

    this.cache.set(key, entry);
    this.touch(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) this.accessOrder.splice(idx, 1);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private touch(key: string): void {
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
    this.accessOrder.push(key);
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================
// Dependency Comparator
// ============================================================

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

// ============================================================
// Memoization Options
// ============================================================

export interface MemoOptions {
  /** TTL in ms (default: no expiry) */
  ttl?: number;
  /** Log cache hits/misses (default: false) */
  debug?: boolean;
}

// ============================================================
// Global Formula Cache
// ============================================================

export const formulaCache = new FormulaCache(10000);

export function memoize<T>(
  key: string,
  deps: unknown[],
  factory: () => T,
  options: MemoOptions = {}
): T {
  const existing = formulaCache.get(key);

  if (existing && depsEqual(existing.dependencies, deps)) {
    if (!options.ttl || Date.now() - existing.createdAt <= options.ttl) {
      if (options.debug) {
        console.log(`[Memo] Hit: ${key}`);
      }
      return existing.value;
    }
  }

  if (options.debug) {
    console.log(`[Memo] Miss: ${key}`);
  }

  const value = factory();
  const depsCopy = [...deps];
  formulaCache.set(key, {
    value,
    dependencies: depsCopy,
    createdAt: Date.now()
  });

  return value;
}

// ============================================================
// Specialized Memoizers
// ============================================================

export function memoDecimal(
  key: string,
  deps: unknown[],
  factory: () => Decimal
): Decimal {
  return memoize(key, deps, factory);
}

export function memoNumber(
  key: string,
  deps: unknown[],
  factory: () => number
): number {
  return memoize(key, deps, factory);
}

export function memoBoolean(
  key: string,
  deps: unknown[],
  factory: () => boolean
): boolean {
  return memoize(key, deps, factory);
}

// ============================================================
// Cache Invalidation
// ============================================================

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    formulaCache.clear();
    return;
  }
  // Partial match invalidation not implemented yet
  formulaCache.clear();
}

// ============================================================
// Cache Stats
// ============================================================

export function getCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: formulaCache.size,
    maxSize: 10000
  };
}

// ============================================================
// Utility: Serialize Dependencies for Cache Key
// ============================================================

export function serializeDeps(deps: unknown[]): string {
  return deps.map(d => {
    if (d === null) return 'null';
    if (d === undefined) return 'undefined';
    if (d instanceof Decimal) return `D:${d.m},${d.e}`;
    if (typeof d === 'object') return JSON.stringify(d);
    return String(d);
  }).join('|');
}

export function createCacheKey(prefix: string, ...parts: unknown[]): string {
  return `${prefix}:${serializeDeps(parts)}`;
}

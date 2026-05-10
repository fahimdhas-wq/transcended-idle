// ============================================================
// TYPED ARRAY RESOURCE SYSTEM
// Flat Float64Array for high-performance resource storage
// Eliminates Decimal object churn in hot paths
// ============================================================

import { Decimal } from './decimal.js';

// ============================================================
// RESOURCE ID REGISTRY
// Maps resource ID strings to typed array indices
// ============================================================

export const FORESTRY_BASIC_IDS = ['biomass', 'oakron', 'birchon', 'pynex', 'willix', 'mahorix', 'tecron', 'ironwood', 'darkwood', 'voidwood'] as const;
export const FORESTRY_REFINED_IDS = ['biofiber', 'reinforcedFiber', 'lightPanel', 'resinGel', 'flexFiber', 'denseCore', 'armorFiber', 'darkMatterFiber', 'crystalGrowth', 'spiritFlux'] as const;
export const FORESTRY_ADVANCED_IDS = ['bioCore', 'terraCore', 'photonBark', 'cryoCore', 'psiCore', 'royalMatrix', 'guardianCore', 'shadowCore', 'lumenCore', 'etherealCore'] as const;

export const MINING_BASIC_IDS = ['ferrite', 'carbite', 'cuprite', 'argentite', 'aurite', 'crystite', 'verdite', 'obsidite', 'neutrite', 'voidite'] as const;
export const MINING_REFINED_IDS = ['alloyX', 'fuelX', 'conduitX', 'lumenAlloy', 'solarAlloy', 'phaseCrystal', 'quantumCrystal', 'darkAlloy', 'denseMatter', 'exoticMatter'] as const;
export const MINING_ADVANCED_IDS = ['titanCore', 'fusionCore', 'plasmaCoil', 'photonCore', 'stellarCore', 'prismCore', 'entropyCore', 'voidCore', 'singularityCore', 'cosmicCore'] as const;

export const ALL_FORESTRY_IDS = [...FORESTRY_BASIC_IDS, ...FORESTRY_REFINED_IDS, ...FORESTRY_ADVANCED_IDS] as const;
export const ALL_MINING_IDS = [...MINING_BASIC_IDS, ...MINING_REFINED_IDS, ...MINING_ADVANCED_IDS] as const;

// Create index maps for O(1) lookups
export function createResourceIndexMap(ids: readonly string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < ids.length; i++) {
    map[ids[i]] = i;
  }
  return map;
}

export const FORESTRY_INDEX_MAP = createResourceIndexMap(ALL_FORESTRY_IDS);
export const MINING_INDEX_MAP = createResourceIndexMap(ALL_MINING_IDS);

// ============================================================
// RESOURCE ARRAY CLASS
// Uses Float64Array with Decimal conversion on boundary
// ============================================================

export class ResourceArray {
  private data: Float64Array;
  private count: number;
  readonly ids: readonly string[];
  readonly indexMap: Record<string, number>;

  constructor(ids: readonly string[], indexMap: Record<string, number>) {
    this.ids = ids;
    this.indexMap = indexMap;
    this.count = ids.length;
    this.data = new Float64Array(this.count);
  }

  // Get raw float value (for hot path calculations)
  getRaw(id: string): number {
    const idx = this.indexMap[id];
    if (idx === undefined || this.data === undefined) return 0;
    const val = this.data[idx];
    return typeof val === 'number' ? val : 0;
  }

  // Set raw float value
  setRaw(id: string, value: number): void {
    const idx = this.indexMap[id];
    if (idx === undefined || this.data === undefined) return;
    this.data[idx] = Math.max(0, value);
  }

  // Get as Decimal (for UI/display)
  get(id: string): Decimal {
    return new Decimal(this.getRaw(id));
  }

  // Add value (returns new Decimal for chaining, but we work in-place)
  add(id: string, amount: number | Decimal): void {
    const idx = this.indexMap[id];
    if (idx === undefined) return;
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    this.data[idx] = Math.max(0, this.data[idx] + value);
  }

  // Subtract value
  sub(id: string, amount: number | Decimal): void {
    const idx = this.indexMap[id];
    if (idx === undefined) return;
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    this.data[idx] = Math.max(0, this.data[idx] - value);
  }

  // Check if gte (greater than or equal) - optimized for hot path
  gte(id: string, amount: number | Decimal): boolean {
    const idx = this.indexMap[id];
    if (idx === undefined) return false;
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    return this.data[idx] >= value;
  }

  // Check if gt (greater than)
  gt(id: string, amount: number | Decimal): boolean {
    const idx = this.indexMap[id];
    if (idx === undefined) return false;
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    return this.data[idx] > value;
  }

  // Check if lte (less than or equal)
  lte(id: string, amount: number | Decimal): boolean {
    const idx = this.indexMap[id];
    if (idx === undefined) return false;
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    return this.data[idx] <= value;
  }

  // Floor division for refining
  floorDiv(id: string, divisor: number): number {
    const idx = this.indexMap[id];
    if (idx === undefined) return 0;
    return Math.floor(this.data[idx] / divisor);
  }

  // Get all values as Decimal record (for compatibility)
  toRecord(): Record<string, Decimal> {
    const result: Record<string, Decimal> = {};
    for (const id of this.ids) {
      result[id] = new Decimal(this.data[this.indexMap[id]]);
    }
    return result;
  }

  // Set all values from Decimal record (for save/load)
  fromRecord(record: Record<string, Decimal>): void {
    for (const id of this.ids) {
      const idx = this.indexMap[id];
      if (idx !== undefined && record[id]) {
        this.data[idx] = record[id].toNumber();
      }
    }
  }

  // Reset all values to 0
  reset(): void {
    this.data.fill(0);
  }

  // Get count for iteration
  get length(): number {
    return this.count;
  }

  // Get underlying Float64Array for bulk operations
  getBuffer(): Float64Array {
    return this.data;
  }
}

// ============================================================
// BULK OPERATIONS FOR HOT PATHS
// ============================================================

export function bulkAddToArray(arr: ResourceArray, entries: Array<[string, number]>): void {
  for (const [id, amount] of entries) {
    arr.add(id, amount);
  }
}

export function bulkSubFromArray(arr: ResourceArray, entries: Array<[string, number]>): void {
  for (const [id, amount] of entries) {
    arr.sub(id, amount);
  }
}

// Check all conditions in one pass (for batch affordability checks)
export function bulkCheckGte(arr: ResourceArray, conditions: Array<[string, number | Decimal]>): boolean {
  for (const [id, amount] of conditions) {
    if (!arr.gte(id, amount)) return false;
  }
  return true;
}

// ============================================================
// SERIALIZATION FOR SAVE/LOAD
// ============================================================

export interface SerializedResourceArray {
  ids: string[];
  values: number[];
}

export function serializeResourceArray(arr: ResourceArray): SerializedResourceArray {
  return {
    ids: [...arr.ids],
    values: Array.from(arr.getBuffer())
  };
}

export function deserializeResourceArray(data: SerializedResourceArray, arr: ResourceArray): void {
  for (let i = 0; i < data.ids.length && i < arr.length; i++) {
    const id = data.ids[i];
    const idx = arr.indexMap[id];
    if (idx !== undefined && idx < data.values.length) {
      arr.setRaw(id, data.values[idx]);
    }
  }
}
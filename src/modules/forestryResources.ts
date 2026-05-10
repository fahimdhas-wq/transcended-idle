// ============================================================
// FORESTRY RESOURCE STORE
// Wraps ResourceArray with Record<string, Decimal> interface
// for backward compatibility while using typed array internally
// ============================================================

import { Decimal } from '../systems/decimal.js';
import {
  ResourceArray,
  FORESTRY_INDEX_MAP,
  ALL_FORESTRY_IDS,
  type SerializedResourceArray
} from '../systems/resourceArray.js';

// Create the typed array for forestry resources
const forestryResourceArray = new ResourceArray(ALL_FORESTRY_IDS, FORESTRY_INDEX_MAP);

// ============================================================
// RECORD WRAPPER
// Provides Record<string, Decimal> interface for backward compat
// ============================================================

class ForestryResourceRecord {
  // Direct typed array access for hot paths
  readonly array = forestryResourceArray;

  get(id: string): Decimal {
    return new Decimal(forestryResourceArray.getRaw(id));
  }

  set(id: string, value: Decimal | number): void {
    if (value instanceof Decimal) {
      forestryResourceArray.setRaw(id, value.toNumber());
    } else {
      forestryResourceArray.setRaw(id, value);
    }
  }

  add(id: string, amount: Decimal | number): void {
    forestryResourceArray.add(id, amount);
  }

  sub(id: string, amount: Decimal | number): void {
    forestryResourceArray.sub(id, amount);
  }

  // Get raw number for hot path calculations
  getRaw(id: string): number {
    return forestryResourceArray.getRaw(id);
  }

  gte(id: string, amount: Decimal | number): boolean {
    return forestryResourceArray.gte(id, amount);
  }

  gt(id: string, amount: Decimal | number): boolean {
    return forestryResourceArray.gt(id, amount);
  }

  lte(id: string, amount: Decimal | number): boolean {
    return forestryResourceArray.lte(id, amount);
  }

  floorDiv(id: string, divisor: number): number {
    return forestryResourceArray.floorDiv(id, divisor);
  }

  has(id: string): boolean {
    return FORESTRY_INDEX_MAP[id] !== undefined;
  }

  // Convert to Decimal record for legacy code
  toRecord(): Record<string, Decimal> {
    return forestryResourceArray.toRecord();
  }

  // Load from Decimal record (for save compatibility)
  fromRecord(record: Record<string, Decimal>): void {
    forestryResourceArray.fromRecord(record);
  }

  // Serialization for efficient save/load
  serialize(): SerializedResourceArray {
    return {
      ids: [...ALL_FORESTRY_IDS],
      values: Array.from(forestryResourceArray.getBuffer())
    };
  }

  deserialize(data: SerializedResourceArray): void {
    forestryResourceArray.fromRecord(
      Object.fromEntries(
        data.ids.map((id, i) => [id, new Decimal(data.values[i] ?? 0)])
      )
    );
  }
}

// Export singleton instance
export const forestryResources = new ForestryResourceRecord();

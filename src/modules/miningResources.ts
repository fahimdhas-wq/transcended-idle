// ============================================================
// MINING RESOURCE STORE
// Wraps ResourceArray with Record<string, Decimal> interface
// for backward compatibility while using typed array internally
// ============================================================

import { Decimal } from '../systems/decimal.js';
import {
  ResourceArray,
  MINING_INDEX_MAP,
  ALL_MINING_IDS,
  type SerializedResourceArray
} from '../systems/resourceArray.js';

// Create the typed array for mining resources
const miningResourceArray = new ResourceArray(ALL_MINING_IDS, MINING_INDEX_MAP);

// ============================================================
// RECORD WRAPPER
// Provides Record<string, Decimal> interface for backward compat
// ============================================================

class MiningResourceRecord {
  // Direct typed array access for hot paths
  readonly array = miningResourceArray;

  get(id: string): Decimal {
    return new Decimal(miningResourceArray.getRaw(id));
  }

  set(id: string, value: Decimal | number): void {
    if (value instanceof Decimal) {
      miningResourceArray.setRaw(id, value.toNumber());
    } else {
      miningResourceArray.setRaw(id, value);
    }
  }

  add(id: string, amount: Decimal | number): void {
    miningResourceArray.add(id, amount);
  }

  sub(id: string, amount: Decimal | number): void {
    miningResourceArray.sub(id, amount);
  }

  // Get raw number for hot path calculations
  getRaw(id: string): number {
    return miningResourceArray.getRaw(id);
  }

  gte(id: string, amount: Decimal | number): boolean {
    return miningResourceArray.gte(id, amount);
  }

  gt(id: string, amount: Decimal | number): boolean {
    return miningResourceArray.gt(id, amount);
  }

  lte(id: string, amount: Decimal | number): boolean {
    return miningResourceArray.lte(id, amount);
  }

  floorDiv(id: string, divisor: number): number {
    return miningResourceArray.floorDiv(id, divisor);
  }

  has(id: string): boolean {
    return MINING_INDEX_MAP[id] !== undefined;
  }

  // Convert to Decimal record for legacy code
  toRecord(): Record<string, Decimal> {
    return miningResourceArray.toRecord();
  }

  // Load from Decimal record (for save compatibility)
  fromRecord(record: Record<string, Decimal>): void {
    miningResourceArray.fromRecord(record);
  }

  // Serialization for efficient save/load
  serialize(): SerializedResourceArray {
    return {
      ids: [...ALL_MINING_IDS],
      values: Array.from(miningResourceArray.getBuffer())
    };
  }

  deserialize(data: SerializedResourceArray): void {
    miningResourceArray.fromRecord(
      Object.fromEntries(
        data.ids.map((id, i) => [id, new Decimal(data.values[i] ?? 0)])
      )
    );
  }
}

// Export singleton instance
export const miningResources = new MiningResourceRecord();
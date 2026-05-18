/**
 * Snapshot Manager — Decouples simulation tick rate from UI update rate.
 *
 * Problem: If simulation runs at 20 TPS and UI reads state directly,
 * every reactive state write triggers a re-render (60+ FPS).
 *
 * Solution: Simulation mutates state. UI reads snapshots updated at 10 FPS.
 * This is the core of the "engine + UI frontend" architecture.
 *
 * Usage:
 *   const miningSnapshot = snapshotManager.register('mining', () => ({
 *     energy: miningState.energy,
 *     progress: miningState.miningProgress,
 *     ...
 *   }), 100); // 100ms throttle = 10 FPS
 *
 *   // In UI
 *   const snap = snapshotManager.get('mining');
 */

import { eventBus } from '../events/EventBus.js';
import type { GameEvent } from '../events/EventBus.js';

// ============================================================
// Snapshot Types
// ============================================================

export interface SnapshotConfig<T> {
  key: string;
  getter: () => T;
  throttleMs: number;
}

interface SnapshotEntry<T> {
  config: SnapshotConfig<T>;
  value: T;
  lastUpdate: number;
}

// ============================================================
// Snapshot Manager
// ============================================================

class SnapshotManagerImpl {
  private snapshots = new Map<string, SnapshotEntry<any>>();
  private updateCallbacks: Array<(key: string) => void> = [];
  private frameRequested = false;

  /**
   * Register a snapshot to track.
   * @param config Snapshot configuration
   * @returns The initial snapshot value
   */
  register<T>(config: SnapshotConfig<T>): T {
    const entry: SnapshotEntry<T> = {
      config,
      value: config.getter(),
      lastUpdate: 0
    };
    this.snapshots.set(config.key, entry);
    return entry.value;
  }

  /**
   * Get a snapshot value.
   * Returns the last snapshot, which may be stale if throttle hasn't elapsed.
   */
  get<T>(key: string): T | undefined {
    return this.snapshots.get(key)?.value;
  }

  /**
   * Get all registered snapshot keys.
   */
  getKeys(): string[] {
    return Array.from(this.snapshots.keys());
  }

  /**
   * Force update a snapshot immediately (bypasses throttle).
   */
  forceUpdate(key: string): void {
    const entry = this.snapshots.get(key);
    if (entry) {
      entry.value = entry.config.getter();
      entry.lastUpdate = Date.now();
      this.notifyUpdate(key);
    }
  }

  /**
   * Force update all snapshots immediately.
   */
  forceUpdateAll(): void {
    const now = Date.now();
    for (const [key, entry] of this.snapshots) {
      entry.value = entry.config.getter();
      entry.lastUpdate = now;
    }
    for (const key of this.snapshots.keys()) {
      this.notifyUpdate(key);
    }
  }

  /**
   * Update all snapshots that have exceeded their throttle interval.
   * Call this from your game loop at ~60 FPS.
   * @param now performance.now() value
   */
  update(now: number): void {
    let hasUpdates = false;

    for (const [key, entry] of this.snapshots) {
      if (now - entry.lastUpdate >= entry.config.throttleMs) {
        entry.value = entry.config.getter();
        entry.lastUpdate = now;
        hasUpdates = true;
        this.notifyUpdate(key);
      }
    }
  }

  /**
   * Request a frame to update snapshots.
   * Schedules update on next animation frame.
   */
  requestUpdate(): void {
    if (this.frameRequested) return;
    this.frameRequested = true;

    requestAnimationFrame((now) => {
      this.frameRequested = false;
      this.update(now);
    });
  }

  /**
   * Subscribe to snapshot updates.
   * Useful for UI components that need to know when to re-render.
   */
  onUpdate(callback: (key: string) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index !== -1) this.updateCallbacks.splice(index, 1);
    };
  }

  private notifyUpdate(key: string): void {
    for (const callback of this.updateCallbacks) {
      try {
        callback(key);
      } catch (e) {
        console.error('[SnapshotManager] Update callback error:', e);
      }
    }
  }

  /**
   * Unregister a snapshot.
   */
  unregister(key: string): void {
    this.snapshots.delete(key);
  }

  /**
   * Unregister all snapshots.
   */
  clear(): void {
    this.snapshots.clear();
    this.updateCallbacks = [];
  }

  /**
   * Get snapshot stats for debugging.
   */
  getStats(): Array<{ key: string; throttle: number; lastUpdate: number; age: number }> {
    const now = Date.now();
    return Array.from(this.snapshots.entries()).map(([key, entry]) => ({
      key,
      throttle: entry.config.throttleMs,
      lastUpdate: entry.lastUpdate,
      age: now - entry.lastUpdate
    }));
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const snapshotManager = new SnapshotManagerImpl();

// ============================================================
// Convenience Hooks for Svelte 5
// ============================================================

/**
 * Creates a reactive Svelte 5 store that reads from a snapshot.
 * Updates at the snapshot's throttle rate, not at simulation rate.
 *
 * Usage in Svelte component:
 *   const { value, forceUpdate } = useSnapshot('mining');
 */
export function useSnapshot<T>(
  key: string,
  options?: { defaultValue: T }
): { value: T; forceUpdate: () => void } {
  // Use provided default or undefined
  let initialValue = options?.defaultValue as T | undefined;

  // Try to get initial value from snapshot
  const snap = snapshotManager.get<T>(key);
  if (snap !== undefined) {
    initialValue = snap;
  }

  let value = $state(initialValue as T);

  // Subscribe to updates
  const unsubscribe = snapshotManager.onUpdate((updatedKey) => {
    if (updatedKey === key) {
      const newValue = snapshotManager.get<T>(key);
      if (newValue !== undefined) {
        value = newValue;
      }
    }
  });

  return {
    get value() { return value; },
    forceUpdate: () => snapshotManager.forceUpdate(key)
  };
}

/**
 * Creates a derived snapshot that combines multiple snapshots.
 *
 * Usage:
 *   const combined = useDerivedSnapshot(
 *     ['mining', 'forestry'],
 *     (mining, forestry) => ({
 *       totalEnergy: mining.energy + forestry.energy,
 *       totalProgress: mining.progress + forestry.progress
 *     })
 *   );
 */
export function useDerivedSnapshot<T>(
  sourceKeys: string[],
  derive: (...sources: any[]) => T,
  options?: { defaultValue: T }
): { value: T; forceUpdate: () => void } {
  // Use provided default or undefined
  let initialValue = options?.defaultValue as T | undefined;

  // Try to get initial value from snapshot
  const sources = sourceKeys.map(key => snapshotManager.get(key));
  if (sources.every(s => s !== undefined)) {
    initialValue = derive(...sources);
  }

  let value = $state(initialValue as T);

  const update = () => {
    const src = sourceKeys.map(key => snapshotManager.get(key));
    if (src.every(s => s !== undefined)) {
      value = derive(...src);
    }
  };

  const unsubscribe = snapshotManager.onUpdate((key) => {
    if (sourceKeys.includes(key)) {
      update();
    }
  });

  return {
    get value() { return value; },
    forceUpdate: () => sourceKeys.forEach(key => snapshotManager.forceUpdate(key))
  };
}

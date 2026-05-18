/**
 * Mining Panel Store — Passive Svelte store using engine snapshots.
 *
 * Demonstrates Phase 7: Passive UI presentation layer.
 *
 * Before (bad): UI mutates state directly
 *   onclick={() => buyUpgrade('sharpness')}
 *   if (miningState.energy < cost) return
 *
 * After (good): UI reads snapshots, sends commands
 *   onclick={() => dispatch({ type: 'BUY_MINING_UPGRADE', ... })}
 *   const snapshot = miningStore.snapshot;
 */

import { snapshotManager, dispatch, type GameCommand } from '../engine/index.js';
import { miningState } from '../modules/mining.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';

// ============================================================
// Mining Snapshot (updated at 10 FPS)
// ============================================================

interface MiningSnapshot {
  unlocked: boolean;
  toolTier: number;
  toolName: string;
  energy: number;
  maxEnergy: number;
  miningProgress: number;
  minesPerSecond: number;
  dataRate: number;
  isOverclocked: boolean;
  overclockTicks: number;

  // Upgrade levels
  sharpness: number;
  extraction: number;
  discovery: number;
  sensors: number;
  overclockPower: number;
  efficiency: number;

  // Automation
  drones: number;
  autoExtractors: number;
}

let miningSnapshot = $state<MiningSnapshot>({
  unlocked: false,
  toolTier: 1,
  toolName: 'Advanced Extraction Tool',
  energy: 100,
  maxEnergy: 100,
  miningProgress: 0,
  minesPerSecond: 0,
  dataRate: 0,
  isOverclocked: false,
  overclockTicks: 0,
  sharpness: 0,
  extraction: 0,
  discovery: 0,
  sensors: 0,
  overclockPower: 0,
  efficiency: 0,
  drones: 0,
  autoExtractors: 0,
});

// ============================================================
// Register Snapshot with Engine
// ============================================================

snapshotManager.register({
  key: 'mining',
  throttleMs: 100, // 10 FPS
  getter: () => ({
    unlocked: miningState.unlocked,
    toolTier: miningState.toolTier,
    toolName: miningState.toolName,
    energy: miningState.energy,
    maxEnergy: miningState.maxEnergy,
    miningProgress: miningState.miningProgress,
    minesPerSecond: miningState.minesPerSecond,
    dataRate: miningState.dataRate,
    isOverclocked: miningState.isOverclocked,
    overclockTicks: miningState.overclockTicks,
    sharpness: miningState.sharpness,
    extraction: miningState.extraction,
    discovery: miningState.discovery,
    sensors: miningState.sensors,
    overclockPower: miningState.overclockPower,
    efficiency: miningState.efficiency,
    drones: miningState.drones,
    autoExtractors: miningState.autoExtractors,
  })
});

// ============================================================
// Mining Store — UI reads from here, not from miningState
// ============================================================

export const miningStore = {
  get snapshot() {
    // Try to get from engine snapshot first
    const engineSnapshot = snapshotManager.get<MiningSnapshot>('mining');
    if (engineSnapshot) {
      return engineSnapshot;
    }
    // Fallback to local snapshot
    return miningSnapshot;
  },

  // Computed values (derived from snapshot, not live state)
  get energyPercent(): number {
    const s = this.snapshot;
    return s.maxEnergy > 0 ? Math.min(100, (s.energy / s.maxEnergy) * 100) : 0;
  },

  get progressPercent(): number {
    return (this.snapshot.miningProgress / 1000) * 100;
  },

  // Action methods (send commands, don't mutate directly)
  buyUpgrade(type: string, count: number | 'max' = 1): void {
    dispatch({ type: 'BUY_MINING_UPGRADE', upgradeType: type, count } as GameCommand);
  },

  upgradeTool(): void {
    dispatch({ type: 'UPGRADE_MINING_TOOL' } as GameCommand);
  },

  triggerOverclock(): void {
    dispatch({ type: 'TRIGGER_MINING_OVERCLOCK' } as GameCommand);
  },

  upgradeEnergy(amount: number | 'max' = 1): void {
    dispatch({ type: 'UPGRADE_MINING_ENERGY', amount } as GameCommand);
  },

  buyAutomation(type: 'drone' | 'extractor', count: number | 'max' = 1): void {
    dispatch({ type: 'BUY_MINING_AUTOMATION', automationType: type, count } as GameCommand);
  },

  toggleAutoRefine(resourceId: string, enabled: boolean): void {
    dispatch({ type: 'TOGGLE_MINING_AUTO_REFINE', resourceId, enabled } as GameCommand);
  },

  // Force refresh snapshot (rarely needed)
  refresh(): void {
    snapshotManager.forceUpdate('mining');
  }
};

// ============================================================
// Data Fragments Store (bestiary currency for mining)
// ============================================================

interface DataFragmentSnapshot {
  fragments: string; // Formatted string
  raw: Decimal;
}

let dataFragmentSnapshot = $state<DataFragmentSnapshot>({
  fragments: '0',
  raw: new Decimal(0)
});

snapshotManager.register({
  key: 'dataFragments',
  throttleMs: 100,
  getter: () => ({
    fragments: bestiaryState.dataFragments.toString(),
    raw: bestiaryState.dataFragments
  })
});

export const dataFragmentStore = {
  get snapshot() {
    const snap = snapshotManager.get<DataFragmentSnapshot>('dataFragments');
    return snap || dataFragmentSnapshot;
  },

  get raw(): Decimal {
    return this.snapshot.raw;
  }
};

// ============================================================
// Dev Tools (optional, in development mode)
// ============================================================

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).miningStore = miningStore;
  (window as any).refreshMiningSnapshot = () => miningStore.refresh();
}
/**
 * Forestry Panel Store — Passive Svelte store using engine snapshots.
 *
 * Demonstrates Phase 7: Passive UI presentation layer.
 *
 * UI reads from snapshots (10 FPS), never from live state.
 * Actions go through command dispatcher.
 */

import { snapshotManager, dispatch, type GameCommand } from '../engine/index.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { Decimal } from '../systems/decimal.js';

// ============================================================
// Forestry Snapshot (updated at 10 FPS)
// ============================================================

interface ForestrySnapshot {
  unlocked: boolean;
  toolTier: number;
  toolName: string;
  energy: number;
  maxEnergy: number;
  growthProgress: number;
  harvestRate: number;
  dnaRate: number;

  // Upgrade levels
  chainsawFuel: number;
  reforestation: number;
  ancientSaplings: number;
  mutationPower: number;
  efficiency: number;

  // Automation
  growthChambers: number;
  mutationChance: number;
}

let forestrySnapshot = $state<ForestrySnapshot>({
  unlocked: false,
  toolTier: 1,
  toolName: 'Bio-Harvesting Tool',
  energy: 100,
  maxEnergy: 100,
  growthProgress: 0,
  harvestRate: 0,
  dnaRate: 0,
  chainsawFuel: 0,
  reforestation: 0,
  ancientSaplings: 0,
  mutationPower: 0,
  efficiency: 0,
  growthChambers: 1,
  mutationChance: 0.05,
});

// ============================================================
// Register Snapshot with Engine
// ============================================================

snapshotManager.register({
  key: 'forestry',
  throttleMs: 100, // 10 FPS
  getter: () => ({
    unlocked: forestryState.unlocked,
    toolTier: forestryState.toolTier,
    toolName: forestryState.toolName,
    energy: forestryState.energy,
    maxEnergy: forestryState.maxEnergy,
    growthProgress: forestryState.growthProgress,
    harvestRate: forestryState.harvestRate,
    dnaRate: forestryState.dnaRate,
    chainsawFuel: forestryState.chainsawFuel,
    reforestation: forestryState.reforestation,
    ancientSaplings: forestryState.ancientSaplings,
    mutationPower: forestryState.mutationPower,
    efficiency: forestryState.efficiency,
    growthChambers: forestryState.growthChambers,
    mutationChance: forestryState.mutationChance,
  })
});

// ============================================================
// Forestry Store — UI reads from here, not from forestryState
// ============================================================

export const forestryStore = {
  get snapshot() {
    const engineSnapshot = snapshotManager.get<ForestrySnapshot>('forestry');
    if (engineSnapshot) {
      return engineSnapshot;
    }
    return forestrySnapshot;
  },

  // Computed values
  get energyPercent(): number {
    const s = this.snapshot;
    return s.maxEnergy > 0 ? Math.min(100, (s.energy / s.maxEnergy) * 100) : 0;
  },

  get progressPercent(): number {
    return (this.snapshot.growthProgress / 1000) * 100;
  },

  // Action methods (via command dispatcher)
  buyUpgrade(type: string, count: number | 'max' = 1): void {
    dispatch({ type: 'BUY_FORESTRY_UPGRADE', upgradeType: type, count } as GameCommand);
  },

  upgradeTool(): void {
    dispatch({ type: 'UPGRADE_FORESTRY_TOOL' } as GameCommand);
  },

  upgradeEnergy(amount: number | 'max' = 1): void {
    dispatch({ type: 'UPGRADE_FORESTRY_ENERGY', amount } as GameCommand);
  },

  addGrowthChamber(amount: number | 'max' = 1): void {
    dispatch({ type: 'ADD_GROWTH_CHAMBER', amount } as GameCommand);
  },

  upgradeMutationChance(amount: number | 'max' = 1): void {
    dispatch({ type: 'UPGRADE_MUTATION_CHANCE', amount } as GameCommand);
  },

  toggleAutoRefine(resourceId: string, enabled: boolean): void {
    dispatch({ type: 'TOGGLE_FORESTRY_AUTO_REFINE', resourceId, enabled } as GameCommand);
  },

  refresh(): void {
    snapshotManager.forceUpdate('forestry');
  }
};

// ============================================================
// DNA Fragments Store
// ============================================================

interface DnaFragmentSnapshot {
  fragments: string;
  raw: Decimal;
}

let dnaFragmentSnapshot = $state<DnaFragmentSnapshot>({
  fragments: '0',
  raw: new Decimal(0)
});

snapshotManager.register({
  key: 'dnaFragments',
  throttleMs: 100,
  getter: () => ({
    fragments: forestryState.dnaFragments.toString(),
    raw: forestryState.dnaFragments
  })
});

export const dnaFragmentStore = {
  get snapshot() {
    const snap = snapshotManager.get<DnaFragmentSnapshot>('dnaFragments');
    return snap || dnaFragmentSnapshot;
  },

  get raw(): Decimal {
    return this.snapshot.raw;
  }
};

// ============================================================
// Dev Tools
// ============================================================

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).forestryStore = forestryStore;
  (window as any).refreshForestrySnapshot = () => forestryStore.refresh();
}

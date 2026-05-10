// ============================================================
// FORESTRY WORKER BRIDGE
// Main thread interface for Forestry worker communication
// ============================================================

import { forestryResources } from '../modules/forestryResources.js';
import { forestryState } from '../modules/forestry.svelte.js';
import type { ForestryWorkerState } from './forestryWorker.js';

// Worker instance
let forestryWorker: Worker | null = null;
let isConnected = false;

// Callbacks
type ForestryUpdateCallback = (state: ForestryWorkerState) => void;
let onStateUpdate: ForestryUpdateCallback | null = null;

// ============================================================
// INITIALIZATION
// ============================================================

export function initForestryWorker(): Promise<boolean> {
  return new Promise((resolve) => {
    if (isConnected) {
      resolve(true);
      return;
    }

    try {
      forestryWorker = new Worker(
        new URL('./simulation.worker.ts', import.meta.url),
        { type: 'module' }
      );

      forestryWorker.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'loaded':
            isConnected = true;
            // Initialize forestry in worker with current state
            sendForestryState();
            forestryWorker?.postMessage({ type: 'forestryInit', payload: {} });
            break;

          case 'forestryReady':
            resolve(payload.success);
            break;

          case 'forestryStateUpdate':
            // Apply state updates from worker to main thread
            applyWorkerState(payload.state);
            if (onStateUpdate) {
              onStateUpdate(payload.state);
            }
            break;

          case 'forestrySyncComplete':
            console.log('[FORESTRY] Sync complete');
            break;
        }
      };

      forestryWorker.onerror = (e) => {
        console.error('[FORESTRY WORKER] Error:', e);
        isConnected = false;
        resolve(false);
      };
    } catch (e) {
      console.error('[FORESTRY WORKER] Failed to create worker:', e);
      resolve(false);
    }
  });
}

// ============================================================
// STATE SYNC
// ============================================================

function sendForestryState(): void {
  if (!forestryWorker || !isConnected) return;

  const state: ForestryWorkerState = {
    unlocked: forestryState.unlocked,
    toolTier: forestryState.toolTier,
    growthChambers: forestryState.growthChambers,
    mutationChance: forestryState.mutationChance,
    reforestation: forestryState.reforestation,
    energy: forestryState.energy,
    maxEnergy: forestryState.maxEnergy,
    isOverclocked: forestryState.isOverclocked,
    overclockTicks: forestryState.overclockTicks,
    chainsawFuel: forestryState.chainsawFuel,
    ancientSaplings: forestryState.ancientSaplings,
    mutationPower: forestryState.mutationPower,
    overclockPower: forestryState.overclockPower,
    efficiency: forestryState.efficiency,
    resources: forestryResources.serialize(),
    autoRefine: forestryState.autoRefine
  };

  forestryWorker.postMessage({ type: 'forestrySync', payload: { state } });
}

function applyWorkerState(state: ForestryWorkerState): void {
  // Apply state from worker to main thread forestry state
  forestryState.unlocked = state.unlocked;
  forestryState.toolTier = state.toolTier;
  forestryState.growthChambers = state.growthChambers;
  forestryState.mutationChance = state.mutationChance;
  forestryState.reforestation = state.reforestation;
  forestryState.energy = state.energy;
  forestryState.maxEnergy = state.maxEnergy;
  forestryState.isOverclocked = state.isOverclocked;
  forestryState.overclockTicks = state.overclockTicks;
  forestryState.chainsawFuel = state.chainsawFuel;
  forestryState.ancientSaplings = state.ancientSaplings;
  forestryState.mutationPower = state.mutationPower;
  forestryState.overclockPower = state.overclockPower;
  forestryState.efficiency = state.efficiency;

  // Apply resources
  forestryResources.deserialize(state.resources);

  // Auto-refine settings should persist (don't overwrite)
}

// ============================================================
// TICK PROCESSING
// ============================================================

export function tickForestryInWorker(ticks: number, playerLevel: number, speedBonus?: number, energyEff?: number): void {
  if (!forestryWorker || !isConnected) return;

  forestryWorker.postMessage({
    type: 'forestryTick',
    payload: {
      ticks,
      playerLevel,
      speedBonus,
      energyEff
    }
  });
}

// ============================================================
// UTILITIES
// ============================================================

export function isForestryWorkerConnected(): boolean {
  return isConnected;
}

export function onForestryWorkerUpdate(callback: ForestryUpdateCallback): void {
  onStateUpdate = callback;
}

export function disconnectForestryWorker(): void {
  if (forestryWorker) {
    forestryWorker.terminate();
    forestryWorker = null;
    isConnected = false;
  }
}

// ============================================================
// FALLBACK MODE
// Main thread simulation (used when worker fails)
// ============================================================

export function useMainThreadFallback(): void {
  isConnected = false;
  forestryWorker = null;
  console.log('[FORESTRY] Falling back to main thread simulation');
}

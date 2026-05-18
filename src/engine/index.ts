/**
 * Engine Index — Re-exports for convenient access.
 *
 * Usage:
 *   import { engine, eventBus, dispatch } from '../engine/index.js';
 *   import { eventBus, type GameEvent } from '../engine/index.js';
 */

export { engine, startEngine, stopEngine } from './Engine.js';
export { eventBus, on, once, off, emit, emitDeferred, type GameEvent } from './events/EventBus.js';
export {
  commandDispatcher,
  dispatch,
  validate,
  type GameCommand
} from './commands/GameCommands.js';
export {
  scheduler,
  startScheduler,
  stopScheduler,
  pauseScheduler,
  resumeScheduler,
  type TickSchedulerConfig
} from './simulation/TickScheduler.js';
export {
  snapshotManager,
  useSnapshot,
  useDerivedSnapshot,
  type SnapshotConfig
} from './snapshots/SnapshotManager.js';
export {
  saveManager,
  type SaveData,
  type BackupMetadata
} from './persistence/SaveManager.js';
export { CURRENT_VERSION } from './persistence/SaveManager.js';
export * from './formulas/index.js';
export * from './generators/index.js';

// WASM Bridge — lazily imported, falls back to JS if WASM unavailable
export { engine as wasmEngine } from './bridge.js';
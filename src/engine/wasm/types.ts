/**
 * WASM Module Types
 *
 * These types mirror the exported functions from the Rust WASM module.
 * The actual WASM module is built via wasm-pack.
 */

export interface WasmModule {
  // Module initialization
  default: () => Promise<void>;

  // Core engine control
  start_engine: () => void;
  stop_engine: () => void;
  pause_engine: () => void;
  resume_engine: () => void;
  set_time_scale: (scale: number) => void;

  // Command dispatch
  dispatch: (type: string, payload: string) => string;
  validate: (type: string, payload: string) => string;

  // State access
  get_snapshot: () => string;
  get_character: () => string;
  get_combat: () => string;
  get_ascension: () => string;

  // Persistence
  save_game: () => boolean;
  load_game: () => boolean;
  has_save: () => boolean;
  get_save_info: () => string;
  delete_save: () => void;

  // Offline progress
  compute_offline_progress: (seconds: number) => string;

  // Decimal (opaque to TS)
  Decimal: {
    new: (m: number, e: number) => WasmDecimal;
    from: (value: number | string) => WasmDecimal;
  };
}

export interface WasmDecimal {
  m: number;
  e: number;
  to_number: () => number;
  to_string: () => string;
}

// Extend Window for global access
declare global {
  interface Window {
    __wasmEngine: WasmModule;
    __wasmDecimal: WasmModule['Decimal'];
    __wasmInitialized: boolean;
  }
}
/**
 * Engine Bridge — "Transport Only" Layer
 *
 * Rules:
 * - TS = message bus + serialization only
 * - Rust = logic + truth + computation only
 * - No parallel computation in TS
 * - No mirrored logic systems
 *
 * This file must NOT contain:
 * - Game logic
 * - Fallback implementations
 * - Command handlers
 * - Decimal operations
 * - Test/benchmark code
 *
 * API Surface:
 *   init()        → initialize WASM
 *   send(cmd)     → send command to Rust
 *   getSnapshot() → get game state snapshot
 */

import type { WasmModule } from './wasm/types.js';

// ============ Command Schema ============

export interface Command {
  type: string;
  payload: Record<string, unknown>;
  contextId?: string;
}

// ============ Snapshot (Read-only) ============

export interface Snapshot {
  tick: number;
  timestamp: number;
  character: Record<string, unknown>;
  combat: Record<string, unknown>;
  ascension: Record<string, unknown>;
  mining: Record<string, unknown>;
  forestry: Record<string, unknown>;
  bestiary: Record<string, unknown>;
  skills: Record<string, unknown>;
  matrix: Record<string, unknown>;
  dailyChallenge: Record<string, unknown>;
}

// ============ Bridge Implementation ============

class EngineBridge {
  private wasm: WasmModule | null = null;
  private ready = false;
  private wasmAvailable = false;

  /**
   * Initialize WASM module.
   * Falls back gracefully if WASM is not available.
   */
  async init(): Promise<boolean> {
    if (this.ready) return true;

    try {
      // Use @vite-ignore to allow dynamic import that may not exist at build time
      // @ts-expect-error - wasmStub may not exist in all environments
      const module = await import('./wasmStub.js');
      await module.default();
      this.wasm = module as unknown as WasmModule;
      this.wasmAvailable = true;
      this.ready = true;
      console.log('[Bridge] WASM ready');
      return true;
    } catch (e) {
      // WASM not available — game runs in JS-only mode
      console.warn('[Bridge] WASM unavailable, running in JS-only mode:', e);
      this.wasmAvailable = false;
      this.ready = true;
      return true;
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  isWasmAvailable(): boolean {
    return this.wasmAvailable;
  }

  // ============ Commands (transport only) ============
  // All command logic lives in Rust, not here.

  send(command: Command): { success: boolean; message?: string; data?: unknown } {
    if (!this.wasmAvailable || !this.wasm) {
      return { success: false, message: 'WASM engine not available' };
    }

    try {
      const result = this.wasm.dispatch(
        JSON.stringify(command.type),
        JSON.stringify(command.payload)
      );
      return JSON.parse(result);
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  validate(command: Command): { success: boolean; message?: string } {
    if (!this.wasmAvailable || !this.wasm) {
      return { success: false, message: 'WASM engine not available' };
    }

    try {
      const result = this.wasm.validate(
        JSON.stringify(command.type),
        JSON.stringify(command.payload)
      );
      return JSON.parse(result);
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  // ============ Snapshot (read-only) ============
  // Snapshot is updated by Rust engine tick loop.

  getSnapshot(): Snapshot | null {
    if (!this.wasmAvailable || !this.wasm) return null;

    try {
      const json = this.wasm.get_snapshot();
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }

  // ============ Persistence ============

  save(): boolean {
    if (!this.wasmAvailable || !this.wasm) return false;
    return this.wasm.save_game();
  }

  load(): boolean {
    if (!this.wasmAvailable || !this.wasm) return false;
    return this.wasm.load_game();
  }

  hasSave(): boolean {
    if (!this.wasmAvailable || !this.wasm) return false;
    return this.wasm.has_save();
  }

  getSaveInfo(): { exists: boolean; version?: number; timestamp?: number } | null {
    if (!this.wasmAvailable || !this.wasm) return null;
    try {
      const info = this.wasm.get_save_info();
      return info ? JSON.parse(info) : null;
    } catch {
      return null;
    }
  }

  deleteSave(): void {
    if (!this.wasmAvailable || !this.wasm) return;
    this.wasm.delete_save();
  }

  // ============ Engine Control ============

  start(): void {
    if (!this.wasmAvailable || !this.wasm) return;
    this.wasm.start_engine();
  }

  stop(): void {
    if (!this.wasmAvailable || !this.wasm) return;
    this.wasm.stop_engine();
  }

  pause(): void {
    if (!this.wasmAvailable || !this.wasm) return;
    this.wasm.pause_engine();
  }

  resume(): void {
    if (!this.wasmAvailable || !this.wasm) return;
    this.wasm.resume_engine();
  }

  setTimeScale(scale: number): void {
    if (!this.wasmAvailable || !this.wasm) return;
    this.wasm.set_time_scale(scale);
  }

  getOfflineProgress(seconds: number): Snapshot | null {
    if (!this.wasmAvailable || !this.wasm) return null;
    try {
      const json = this.wasm.compute_offline_progress(seconds);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }
}

// ============ Singleton ============

export const engine = new EngineBridge();

// Named exports for convenience
export const init = () => engine.init();
export const send = (type: string, payload: Record<string, unknown> = {}, contextId?: string) =>
  engine.send({ type, payload, contextId });
export const getSnapshot = () => engine.getSnapshot();
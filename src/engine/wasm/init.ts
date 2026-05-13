/**
 * WASM Module Initializer
 *
 * Handles lazy loading of the WASM engine module.
 * This is the only WASM-related code in the TS layer.
 */

const WASM_PATH = '../../dist/engine/idle_engine.js';

let wasmPromise: Promise<boolean> | null = null;

/**
 * Initialize WASM module.
 * Returns true if WASM was loaded, false otherwise.
 */
export async function init(): Promise<boolean> {
  if (wasmPromise) return wasmPromise;

  wasmPromise = (async () => {
    try {
      const module = await import(WASM_PATH);
      await module.default();

      // Register global reference
      (window as unknown as Record<string, unknown>).__wasmEngine = module;
      (window as unknown as Record<string, unknown>).__wasmInitialized = true;

      console.log('[WASM] Module loaded');
      return true;
    } catch (e) {
      console.warn('[WASM] Not available, using JS-only mode');
      return false;
    }
  })();

  return wasmPromise;
}

/**
 * Check if WASM is loaded
 */
export function isLoaded(): boolean {
  return (window as unknown as Record<string, unknown>).__wasmInitialized === true;
}

/**
 * Preload WASM in background
 */
export function preload(): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => init());
  } else {
    setTimeout(() => init(), 100);
  }
}
import { Decimal } from '../systems/decimal.js';
import type { GameSnapshot, WorkerMessage, WorkerResponse } from './types.js';

let worker: Worker | null = null;
let onSnapshot: ((s: GameSnapshot) => void) | null = null;
let isProcessing = false;

export async function initWorker(): Promise<void> {
  worker = new Worker(new URL('./game.worker.ts', import.meta.url), { type: 'module' });
  
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const { type, payload } = e.data;
    
    switch (type) {
      case 'READY':
        console.log('[OfflineWorker] Ready');
        break;
        
      case 'SNAPSHOT':
        if (onSnapshot) {
          onSnapshot(payload as GameSnapshot);
        }
        isProcessing = false;
        break;
    }
  };
  
  worker.onerror = (e) => {
    console.error('[OfflineWorker] Error:', e);
    isProcessing = false;
  };
}

export async function processOfflineBatch(ms: number, snapshot: GameSnapshot, callback: (result: GameSnapshot) => void): Promise<void> {
  if (!worker) {
    await initWorker();
  }
  
  if (!worker) {
    console.error('[OfflineWorker] Failed to initialize');
    return;
  }
  
  onSnapshot = callback;
  worker.postMessage({ type: 'LOAD', payload: snapshot });
  worker.postMessage({ type: 'SKIP_TIME', payload: Math.floor(ms / (24 * 3600 * 1000)) });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

export function isWorkerActive(): boolean {
  return worker !== null && isProcessing;
}
import type { Decimal } from '../systems/decimal.js';

export interface Toast {
  message: string;
  type: string;
  id: number;
}

export interface OfflineSummary {
  seconds: number;
  kills: Decimal;
  levels: Decimal;
  efficiency: number;
}

export interface UIStore {
  buyAmount: number;
  toast: Toast | null;
  offlineSummary: OfflineSummary | null;
}

export const uiStore: UIStore = $state({
  buyAmount: 1,
  toast: null,
  offlineSummary: null
});

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string, type: string = 'info'): void {
  if (toastTimer) clearTimeout(toastTimer);
  uiStore.toast = { message, type, id: Date.now() };
  toastTimer = setTimeout(() => {
    uiStore.toast = null;
  }, 2500);
}

export function showOfflineSummary(summary: OfflineSummary): void {
  uiStore.offlineSummary = summary;
}

export function dismissOfflineSummary(): void {
  uiStore.offlineSummary = null;
}

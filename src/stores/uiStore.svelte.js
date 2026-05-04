// Shared UI state across all panels
export const uiStore = $state({
  buyAmount: 1,
  toast: null,
  offlineSummary: null
});

let toastTimer = null;

export function showToast(message, type = 'info') {
  if (toastTimer) clearTimeout(toastTimer);
  uiStore.toast = { message, type, id: Date.now() };
  toastTimer = setTimeout(() => { uiStore.toast = null; }, 2500);
}

export function showOfflineSummary(summary) {
  uiStore.offlineSummary = summary;
}

export function dismissOfflineSummary() {
  uiStore.offlineSummary = null;
}

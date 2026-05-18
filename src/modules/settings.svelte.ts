
const SETTINGS_KEY = 'cyber_idle_settings_v1';

export type Theme = 'dark' | 'light' | 'cyber';

export interface Settings {
  theme: Theme;
  sound: boolean;
  offlineEfficiency: number;
  animations: boolean;
}

export const settingsState: Settings = $state({
  theme: 'dark',
  sound: true,
  offlineEfficiency: 1.0,
  animations: true,
});

export function loadSettings(): void {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.theme === 'string' && ['dark', 'light', 'cyber'].includes(parsed.theme)) {
      settingsState.theme = parsed.theme;
    }
    if (typeof parsed.sound === 'boolean') settingsState.sound = parsed.sound;
    if (typeof parsed.offlineEfficiency === 'number') {
      settingsState.offlineEfficiency = Math.max(0.1, Math.min(1.0, parsed.offlineEfficiency));
    }
    if (typeof parsed.animations === 'boolean') settingsState.animations = parsed.animations;
  } catch {}
}

export function saveSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      theme: settingsState.theme,
      sound: settingsState.sound,
      offlineEfficiency: settingsState.offlineEfficiency,
      animations: settingsState.animations,
    }));
  } catch {}
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  if (theme !== 'dark') {
    root.setAttribute('data-theme', theme);
  }
}

export function setTheme(theme: Theme): void {
  settingsState.theme = theme;
  applyTheme(theme);
  saveSettings();
}

export function setSound(enabled: boolean): void {
  settingsState.sound = enabled;
  saveSettings();
}

export function setAnimations(enabled: boolean): void {
  settingsState.animations = enabled;
  const root = document.documentElement;
  if (enabled) {
    root.style.removeProperty('--fast');
    root.style.removeProperty('--normal');
  } else {
    root.style.setProperty('--fast', '0s');
    root.style.setProperty('--normal', '0s');
  }
  saveSettings();
}

export function setOfflineEfficiency(value: number): void {
  settingsState.offlineEfficiency = Math.max(0.1, Math.min(1.0, value));
  saveSettings();
}


import { character } from '../modules/character.svelte.js';
import { inventory, rebuildInventoryMap } from '../modules/inventory.svelte.js';
import { skillsState } from '../modules/skills.svelte.js';
import { miningState } from '../modules/mining.svelte.js';
import { flushStatCache } from '../modules/combat.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { bestiaryState, updateGlobalBoost } from '../modules/bestiary.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { gameConfig } from '../data/config.js';
import { Decimal } from '../systems/decimal.js';
import { dailyChallengeState, checkAndRotateChallenge } from '../modules/dailyChallenge.svelte.js';

const SAVE_KEY = 'cyber_idle_save_v3';
let isWiping = false;

type MutableRecord = Record<string, unknown>;

export interface SaveData {
  character?: unknown;
  inventory?: unknown;
  skills?: unknown;
  mining?: unknown;
  forestry?: unknown;
  bestiary?: unknown;
  dailyChallenge?: unknown;
  lastSaved?: unknown;
}

function isRecord(value: unknown): value is MutableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDecimalLike(value: unknown): value is { m: unknown; e: unknown } {
  return isRecord(value) && 'm' in value && 'e' in value;
}

function finiteNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function safeMerge(state: MutableRecord, savedData: unknown): void {
  if (!isRecord(savedData)) return;

  Object.entries(savedData).forEach(([key, savedValue]) => {
    const currentValue = state[key];

    if (isDecimalLike(savedValue)) {
      const m = finiteNumber(savedValue.m);
      const e = finiteNumber(savedValue.e);
      if (m !== null && e !== null) {
        state[key] = typeof currentValue === 'number'
          ? m * Math.pow(10, e)
          : new Decimal(m, e);
      } else {
        console.warn(`Invalid Decimal for ${key}, using default`);
        state[key] = currentValue instanceof Decimal ? new Decimal(0) : 0;
      }
      return;
    }

    if (currentValue instanceof Decimal) {
      state[key] = new Decimal(savedValue as number | string | Decimal | { m: number; e: number });
      return;
    }

    if (isRecord(currentValue) && isRecord(savedValue)) {
      safeMerge(currentValue, savedValue);
      return;
    }

    if (typeof currentValue === 'number') {
      const num = finiteNumber(savedValue);
      state[key] = num ?? 0;
      return;
    }

    state[key] = savedValue;
  });
}

function parseSave(raw: string): SaveData | null {
  const parsed: unknown = JSON.parse(raw);
  return isRecord(parsed) ? parsed : null;
}

export const saveSystem = {
  save(): void {
    if (isWiping) return;
    try {
      const data: SaveData = {
        character,
        inventory,
        skills: skillsState.skills,
        mining: miningState,
        forestry: forestryState,
        bestiary: bestiaryState,
        dailyChallenge: dailyChallengeState,
        lastSaved: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  load(): number {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return 0;

    try {
      const data = parseSave(saved);
      if (!data) return 0;

      safeMerge(character as unknown as MutableRecord, data.character);
      safeMerge(inventory as unknown as MutableRecord, data.inventory);

      if (!isRecord(miningState.autoRefine)) {
        miningState.autoRefine = {};
      }
      if (!isRecord(forestryState.autoRefine)) {
        forestryState.autoRefine = {};
      }

      safeMerge(miningState as unknown as MutableRecord, data.mining);
      safeMerge(forestryState as unknown as MutableRecord, data.forestry);
      safeMerge(bestiaryState as unknown as MutableRecord, data.bestiary);

      if (data.dailyChallenge) {
        safeMerge(dailyChallengeState as unknown as MutableRecord, data.dailyChallenge);
      }
      checkAndRotateChallenge();

      rebuildInventoryMap();
      updateGlobalBoost();

      if (Array.isArray(data.skills)) {
        data.skills.forEach(savedSkill => {
          if (!isRecord(savedSkill) || typeof savedSkill.id !== 'string') return;
          const skill = skillsState.skills.find(s => s.id === savedSkill.id);
          if (skill) safeMerge(skill as unknown as MutableRecord, savedSkill);
        });
      }
      flushStatCache();

      const lastSaved = finiteNumber(data.lastSaved) ?? Date.now();
      const offlineMs = Date.now() - lastSaved;

      character.offlineSettings.maxSeconds = 2592000;
      character.offlineSettings.efficiency = character.offlineSettings.efficiency || 1.0;

      if (offlineMs > 60000) {
        addLog(`[SYSTEM] Offline for ${Math.floor(offlineMs / 60000)}min - progress calculated.`, 'system');
      }
      return offlineMs;
    } catch (e) {
      console.error('Save load failed', e);
      return 0;
    }
  },

  wipeSave(): void {
    isWiping = true;
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => saveSystem.save());
  window.addEventListener('visibilitychange', () => {
    if (document.hidden) saveSystem.save();
  });
}

setInterval(() => saveSystem.save(), gameConfig.saveInterval);


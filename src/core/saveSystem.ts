
import { character } from '../modules/character.svelte.js';
import { inventory, rebuildInventoryMap } from '../modules/inventory.svelte.js';
import { skillsState } from '../modules/skills.svelte.js';
import { miningState } from '../modules/mining.svelte.js';
import { flushStatCache } from '../modules/combat.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { bestiaryState, updateGlobalBoost } from '../modules/bestiary.svelte.js';
import { ascensionState } from '../modules/ascension.svelte.js';
import { getAscensionTier } from '../data/ascensionUpgrades.js';
import { fractureState } from '../modules/fracture.svelte.js';
import { riftState } from '../modules/rift.svelte.js';
import { paradoxState } from '../modules/paradox.svelte.js';
import { activePlayState } from '../modules/activePlay.svelte.js';
import { proceduralState } from '../modules/procedural.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { gameConfig } from '../data/config.js';
import { Decimal } from '../systems/decimal.js';
import { dailyChallengeState, checkAndRotateChallenge } from '../modules/dailyChallenge.svelte.js';

const SLOT_COUNT = 5;
const SLOT_PREFIX = 'cyber_idle_save_slot_';
const OLD_SAVE_KEY = 'cyber_idle_save_v3';
const ACTIVE_SLOT_KEY = 'cyber_idle_active_slot';
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
  ascension?: unknown;
  fracture?: unknown;
  rift?: unknown;
  paradox?: unknown;
  activePlay?: unknown;
  procedural?: unknown;
  lastSaved?: unknown;
  slotMeta?: {
    level: number;
    kills: number;
    totalPlayTime: number;
    ascensionTier: number;
    lastSaved: number;
  };
}

export interface SlotInfo {
  saved: boolean;
  level: number;
  kills: number;
  totalPlayTime: number;
  lastSaved: number;
  ascensionTier: number;
}

let currentSlot = 0;

function getSlotKey(slot: number): string {
  return `${SLOT_PREFIX}${slot}`;
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
        if (currentValue instanceof Decimal && currentValue.m === m && currentValue.e === e) return;
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
      if (currentValue === savedValue) return;
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

function readActiveSlot(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_SLOT_KEY);
    if (raw !== null) {
      const slot = parseInt(raw, 10);
      if (slot >= 0 && slot < SLOT_COUNT) return slot;
    }
  } catch {}
  return 0;
}

function writeActiveSlot(slot: number): void {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, String(slot));
  } catch {}
}

function migrateOldSave(): void {
  try {
    const oldData = localStorage.getItem(OLD_SAVE_KEY);
    if (oldData) {
      const slot0Key = getSlotKey(0);
      if (!localStorage.getItem(slot0Key)) {
        localStorage.setItem(slot0Key, oldData);
        console.log('[SAVE] Migrated old save to slot 0');
      }
    }
  } catch {}
}

function updateSlotMeta(): void {
  try {
    const raw = localStorage.getItem(getSlotKey(currentSlot));
    if (!raw) return;
    const data = parseSave(raw);
    if (!data) return;
    data.slotMeta = {
      level: character.level.toNumber() || 0,
      kills: character.kills.toNumber() || 0,
      totalPlayTime: character.totalPlayTime || 0,
      ascensionTier: getAscensionTier(ascensionState?.lifetimeShards ?? 0),
      lastSaved: Date.now(),
    };
    localStorage.setItem(getSlotKey(currentSlot), JSON.stringify(data));
  } catch {}
}

export const saveSystem = {
  get SLOT_COUNT(): number { return SLOT_COUNT; },

  getCurrentSlot(): number {
    return currentSlot;
  },

  getSlotStorageKey(slot?: number): string {
    return getSlotKey(slot !== undefined ? slot : currentSlot);
  },

  setCurrentSlot(slot: number): void {
    if (slot >= 0 && slot < SLOT_COUNT) {
      currentSlot = slot;
      writeActiveSlot(slot);
    }
  },

  hasSlotData(slot: number): boolean {
    try {
      return localStorage.getItem(getSlotKey(slot)) !== null;
    } catch {
      return false;
    }
  },

  getSlotInfo(slot: number): SlotInfo | null {
    try {
      const raw = localStorage.getItem(getSlotKey(slot));
      if (!raw) return null;
      const data = parseSave(raw);
      if (!data) return null;
      if (data.slotMeta) {
        return {
          saved: true,
          level: data.slotMeta.level ?? 0,
          kills: data.slotMeta.kills ?? 0,
          totalPlayTime: data.slotMeta.totalPlayTime ?? 0,
          lastSaved: data.slotMeta.lastSaved ?? 0,
          ascensionTier: data.slotMeta.ascensionTier ?? 0,
        };
      }
      return { saved: true, level: 0, kills: 0, totalPlayTime: 0, lastSaved: 0, ascensionTier: 0 };
    } catch {
      return null;
    }
  },

  getAllSlots(): SlotInfo[] {
    const slots: SlotInfo[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const info = this.getSlotInfo(i);
      slots.push(info ?? { saved: false, level: 0, kills: 0, totalPlayTime: 0, lastSaved: 0, ascensionTier: 0 });
    }
    return slots;
  },

  save(slot?: number): void {
    if (isWiping) return;
    const targetSlot = slot !== undefined ? slot : currentSlot;
    try {
      const data: SaveData = {
        character,
        inventory,
        skills: skillsState.skills,
        mining: miningState,
        forestry: forestryState,
        bestiary: bestiaryState,
        dailyChallenge: dailyChallengeState,
        ascension: ascensionState,
        fracture: fractureState,
        rift: riftState,
        paradox: paradoxState,
        activePlay: activePlayState,
        procedural: proceduralState,
        lastSaved: Date.now(),
        slotMeta: {
          level: character.level.toNumber() || 0,
          kills: character.kills.toNumber() || 0,
          totalPlayTime: character.totalPlayTime || 0,
      ascensionTier: getAscensionTier(ascensionState?.lifetimeShards ?? 0),
          lastSaved: Date.now(),
        },
      };
      localStorage.setItem(getSlotKey(targetSlot), JSON.stringify(data));
      this.setCurrentSlot(targetSlot);
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  loadFromSlot(slot: number): number {
    this.setCurrentSlot(slot);
    return this.load();
  },

  load(): number {
    migrateOldSave();
    const saved = localStorage.getItem(getSlotKey(currentSlot));
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

      // Ensure bestiary entry kills are Decimal after merge (JSON flattens via valueOf)
      Object.values(bestiaryState.entries).forEach(e => {
        const kills = e.kills;
        if (typeof kills === 'number') {
          (e as { kills: Decimal }).kills = new Decimal(kills);
        } else if (kills !== null && typeof kills === 'object' && 'm' in kills && 'e' in kills) {
          (e as { kills: Decimal }).kills = new Decimal(kills as { m: number; e: number });
        } else if (typeof kills !== 'object' || !('_decimal' in (kills as object))) {
          (e as { kills: Decimal }).kills = Decimal.ZERO;
        }
      });

      if (data.ascension) {
        safeMerge(ascensionState as unknown as MutableRecord, data.ascension);
      }

      if (data.fracture) {
        safeMerge(fractureState as unknown as MutableRecord, data.fracture);
      }

      if (data.rift) {
        safeMerge(riftState as unknown as MutableRecord, data.rift);
      }

      if (data.paradox) {
        safeMerge(paradoxState as unknown as MutableRecord, data.paradox);
      }

      if (data.activePlay) {
        safeMerge(activePlayState as unknown as MutableRecord, data.activePlay);
      }

      if (data.procedural) {
        safeMerge(proceduralState as unknown as MutableRecord, data.procedural);
      }

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

  wipeSave(slot?: number): void {
    const targetSlot = slot !== undefined ? slot : currentSlot;
    isWiping = true;
    localStorage.removeItem(getSlotKey(targetSlot));
    if (targetSlot === currentSlot) {
      window.location.reload();
    }
  },

  clearSlotData(slot: number): void {
    localStorage.removeItem(getSlotKey(slot));
  },

  wipeAllAndReload(): void {
    isWiping = true;
    for (let i = 0; i < SLOT_COUNT; i++) {
      localStorage.removeItem(getSlotKey(i));
    }
    window.location.reload();
  },
};

function autoSave(): void {
  saveSystem.save();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => autoSave());
  window.addEventListener('visibilitychange', () => {
    if (document.hidden) autoSave();
  });
}

setInterval(() => autoSave(), gameConfig.saveInterval);

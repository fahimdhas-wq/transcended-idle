import { character } from '../modules/character.svelte.js';
import { inventory, rebuildInventoryMap } from '../modules/inventory.svelte.js';
import { skillsState } from '../modules/skills.svelte.js';
import { miningState } from '../modules/mining.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { bestiaryState, updateGlobalBoost } from '../modules/bestiary.svelte.js';
import { overclockState } from '../modules/overclock.svelte.js';
import { matrixState } from '../modules/matrix.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { gameConfig } from '../data/config.js';
import { Decimal } from '../systems/decimal.js';

const SAVE_KEY = 'cyber_idle_save_v3';
let isWiping = false;

export const saveSystem = {
  save() {
    if (isWiping) return;
    try {
      const data = {
        character: character,
        inventory: inventory,
        skills: skillsState.skills,
        mining: miningState,
        forestry: forestryState,
        bestiary: bestiaryState,
        overclock: overclockState,
        matrix: matrixState,
        lastSaved: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  load() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return 0;

    try {
      const data = JSON.parse(saved);

      const safeMerge = (state, savedData) => {
        if (!savedData) return;
        Object.keys(savedData).forEach(key => {
          if (savedData[key] !== null && typeof savedData[key] === 'object') {
            if ('m' in savedData[key] && 'e' in savedData[key]) {
              // Validate Decimal values - FIXED
              const m = Number(savedData[key].m);
              const e = Number(savedData[key].e);
              if (!isNaN(m) && isFinite(m) && !isNaN(e) && isFinite(e)) {
                // Respect original type: if state was a number, keep it as a number
                if (typeof state[key] === 'number') {
                  state[key] = m * Math.pow(10, e);
                } else {
                  state[key] = new Decimal(m, e);
                }
              } else {
                console.warn(`Invalid Decimal for ${key}, using default`);
                state[key] = state[key] instanceof Decimal ? new Decimal(0) : 0;
              }
            } else if (state[key] && typeof state[key].add === 'function') {
              state[key] = new Decimal(savedData[key]);
            } else if (state[key] && typeof state[key] === 'object') {
              safeMerge(state[key], savedData[key]);
            } else {
              state[key] = savedData[key];
            }
          } else {
            if (state[key] && typeof state[key].add === 'function') {
              state[key] = new Decimal(savedData[key]);
            } else {
              if (typeof state[key] === 'number' && (savedData[key] === null || savedData[key] === undefined || isNaN(savedData[key]))) {
                state[key] = 0;
              } else {
                state[key] = savedData[key];
              }
            }
          }
        });
      };

      safeMerge(character, data.character);
      safeMerge(inventory, data.inventory);
      
      // FIXED: Proper autoRefine initialization
      if (!miningState.autoRefine || typeof miningState.autoRefine !== 'object') {
        miningState.autoRefine = {};
      }
      if (!forestryState.autoRefine || typeof forestryState.autoRefine !== 'object') {
        forestryState.autoRefine = {};
      }

      safeMerge(miningState, data.mining);
      safeMerge(forestryState, data.forestry);
      safeMerge(bestiaryState, data.bestiary);
      safeMerge(overclockState, data.overclock);
      safeMerge(matrixState, data.matrix);
      
      rebuildInventoryMap();
      updateGlobalBoost();

      if (Array.isArray(data.skills)) {
        data.skills.forEach(savedSkill => {
          const skill = skillsState.skills.find(s => s.id === savedSkill.id);
          if (skill) {
            Object.keys(savedSkill).forEach(k => {
              if (skill[k] && typeof skill[k].add === 'function') {
                skill[k] = new Decimal(savedSkill[k]);
              } else {
                skill[k] = savedSkill[k];
              }
            });
          }
        });
      }

      const offlineMs = Date.now() - data.lastSaved;

      character.offlineSettings.maxSeconds = 2592000;
      character.offlineSettings.efficiency = character.offlineSettings.efficiency || 1.0;

      if (overclockState.coreThreads.lt(2) && overclockState.timesOverclocked === 0) {
        overclockState.coreThreads = new Decimal(2);
      }

      if (offlineMs > 60000) {
        addLog(`[SYSTEM] Offline for ${Math.floor(offlineMs / 60000)}min — progress calculated.`, 'system');
      }
      return offlineMs;
    } catch (e) {
      console.error('Save load failed', e);
      return 0;
    }
  },

  // NEW: Explicit wipe function for the System Tab
  wipeSave() {
    isWiping = true;
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }
};

// Auto-save on window close or tab hide
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => saveSystem.save());
  window.addEventListener('visibilitychange', () => { if (document.hidden) saveSystem.save(); });
}

setInterval(() => saveSystem.save(), gameConfig.saveInterval);


import { character, safeKills, applyMomentumSoftcap, applyOverchargeSoftcap, updateDerivedStats } from '../modules/character.svelte.js';
import { getAscensionBonus } from '../modules/ascension.svelte.js';
import { performCombatTick, combatState, getEffectiveCombatStats, flushStatCache } from '../modules/combat.svelte.js';
import { getOmniMult, upgradeAllSkills } from '../modules/skills.svelte.js';
import { saveSystem } from './saveSystem.js';
import { checkAchievements } from '../systems/achievementSystem.svelte.js';
import { performMiningTick } from '../modules/mining.svelte.js';
import { performForestryTick } from '../modules/forestry.svelte.js';
import { flushInventoryUpdates } from '../modules/inventory.svelte.js';
import { autoUpgradeMining, autoUpgradeForestry, autoUpgradeBestiary } from '../utils/globalMaxUpgrade.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { miningResources } from '../modules/miningResources.js';
import { forestryResources } from '../modules/forestryResources.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { Decimal } from '../systems/decimal.js';
import { showOfflineSummary } from '../stores/uiStore.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { gameConfig } from '../data/config.js';
import { processOfflineProgress as precisionOfflineProcess } from './offlineEngine.svelte.js';
import { tickParadox } from '../modules/paradox.svelte.js';
import { tickActivePlay } from '../modules/activePlay.svelte.js';
import {
  checkAndRotateChallenge,
  checkRotationTick,
  trackKillBatch,
  trackLevelUp,
  trackCrit,
  checkChallengeCompletion,
  isChallengeComplete,
  claimDailyReward,
  dailyChallengeState,
  rotateToNewChallenge,
  getTodayString
} from '../modules/dailyChallenge.svelte.js';
import { getTotalTicks, incrementTotalTicks, addTotalTicks } from './tickState.js';

// ============================================================
// FORESTRY UI SNAPSHOT — Decouples simulation from rendering
// Updated at 10 FPS regardless of tick rate
// ============================================================
let forestrySnapshot = $state({
  harvestRate: 0,
  dnaFragments: Decimal.ZERO,
  growthProgress: 0,
  energy: 0,
  maxEnergy: 100,
  unlocked: false,
});

export function getForestrySnapshot() {
  return forestrySnapshot;
}

let lastTick = performance.now();
let lastForestryUIUpdate = 0;
const FORESTRY_UI_THROTTLE = 100; // 10 FPS for Forestry panel

// Kept for backward compatibility: avoid removing export entirely.
export const gameLoop = $state({});

let accumulatedTime = 0;
const tickRate = gameConfig.baseTickRate; // ms per tick (single source of truth)
let achCheckCounter = 0;
let challengeCheckCounter = 0;
let tickIntervalId: ReturnType<typeof setInterval> | null = null;

export { getTotalTicks };

export { precisionOfflineProcess };

/**
 * Tab Visibility Handler
 */
if (typeof document !== 'undefined') {
  let hiddenTime = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenTime = performance.now();
      if (tickIntervalId !== null) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
    } else {
      const elapsed = performance.now() - hiddenTime;
      const doProcess = () => {
        precisionOfflineProcess(elapsed);
        lastTick = performance.now();
        accumulatedTime = 0;
        if (tickIntervalId === null) {
          tickIntervalId = setInterval(tickLoop, tickRate);
        }
      };
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(doProcess, { timeout: 1000 });
      } else {
        setTimeout(doProcess, 16);
      }
    }
  });
}

function tickLoop(): void {
  gameTick();
}

// ============================================================
// SNAPSHOT UPDATE — Called at 10 FPS to decouple UI from ticks
// ============================================================
function updateSnapshots(now: number): void {
  // Forestry snapshot at 10 FPS
  if (now - lastForestryUIUpdate >= FORESTRY_UI_THROTTLE) {
    lastForestryUIUpdate = now;
    forestrySnapshot.harvestRate = forestryState.harvestRate;
    forestrySnapshot.dnaFragments = forestryState.dnaFragments;
    forestrySnapshot.growthProgress = forestryState.growthProgress;
    forestrySnapshot.energy = forestryState.energy;
    forestrySnapshot.maxEnergy = forestryState.maxEnergy;
    forestrySnapshot.unlocked = forestryState.unlocked;
  }
}

export function gameTick(): void {
  const now = performance.now();
  const dt = Math.min(now - lastTick, tickRate * 2);
  lastTick = now;

  // Update snapshots before tick processing
  updateSnapshots(now);

  // Check for daily challenge rotation (every ~60 seconds)
  checkRotationTick(now);

  accumulatedTime += dt;

  // Track total playtime (convert ms to seconds)
  character.totalPlayTime += dt / 1000;

  let ticksToProcess = Math.floor(accumulatedTime / tickRate);
  const maxTicksPerFrame = 2000;
  
  if (ticksToProcess > maxTicksPerFrame) {
    ticksToProcess = maxTicksPerFrame;
  }

  if (ticksToProcess > 0) {
    addTotalTicks(ticksToProcess);
    
    const dNum = ticksToProcess;
    
    // ---- Momentum (float) ----
    const ascMomentum = 1 + getAscensionBonus('momentum');
    character.momentum += 0.01 * dNum * ascMomentum;
    
    if (character.kills.gt(0)) {
      const k = safeKills();
      character.momentum += k * 0.0001 * dNum * ascMomentum;
    }
    character.momentum = applyMomentumSoftcap(character.momentum);

    // ---- Overcharge (float) ----
    if (character.xp.gte(character.xpNeeded)) {
      character.overcharge += 0.05 * dNum;
    }
    character.overcharge = applyOverchargeSoftcap(character.overcharge);

    // ---- Level processing ----
    const levelsGained = rewardSystem.processLevelUps();
    for (let i = 0; i < levelsGained; i++) {
      trackLevelUp();
    }

    // Stats synchronization
    const stats = getEffectiveCombatStats();
    if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;
    if (character.stats.defense.lt(0)) character.stats.defense = Decimal.ZERO;
    if (character.stats.hp.lt(0)) character.stats.hp = Decimal.ZERO;
    
    // Combat
    performCombatTick(ticksToProcess);
    flushInventoryUpdates();

    // Daily Challenge tracking
    const combatKills = combatState.kills;
    if (combatKills > 0) {
      trackKillBatch(combatKills);
      combatState.kills = 0;
    }
    if (combatState.lastHitCrit) {
      trackCrit();
      combatState.lastHitCrit = false;
    }

    // Mining & Forestry
    performMiningTick(ticksToProcess);
    performForestryTick(ticksToProcess);

    // Paradox & Active Play ticks
    tickParadox(ticksToProcess);
    tickActivePlay(ticksToProcess);

    if (achCheckCounter >= 50) {
      achCheckCounter = 0;
      checkAchievements();
    }

    challengeCheckCounter += ticksToProcess;
    if (challengeCheckCounter >= 50) {
      challengeCheckCounter = 0;
      checkChallengeCompletion();
      if (dailyChallengeState.completedToday && !dailyChallengeState.claimedReward) {
        const reward = claimDailyReward();
        if (reward) {
          addLog(`[DAILY] Auto-claimed ${reward.shards} Shards!`, 'awakening');
        }
      }
    }

    accumulatedTime -= ticksToProcess * tickRate;
  }
}

export function skipTime(days: number = 1): string {
  flushStatCache();
  updateDerivedStats();

  const BATCH_MS = Math.min(days, 30) * 24 * 3600 * 1000;

  precisionOfflineProcess(BATCH_MS);

  dailyChallengeState.consecutiveDays = Math.min(dailyChallengeState.consecutiveDays + Math.min(days, 10000), 9999);
  if (dailyChallengeState.consecutiveDays > dailyChallengeState.bestStreak) {
    dailyChallengeState.bestStreak = dailyChallengeState.consecutiveDays;
  }

  return `[DEV] ${days}d. Lv:${character.level} Kills:${character.kills}`;
}

export function startGameLoop(): void {
  const offlineMs = saveSystem.load();
  if (offlineMs > 0) {
    // Cap total offline accumulation to 30 days
    accumulatedTime += Math.min(offlineMs, 30 * 24 * 3600 * 1000);
  }

  // Initialize daily challenge rotation
  checkAndRotateChallenge();

  // Initialize login tracking
  const now = Date.now();
  if (character.firstLoginTime === 0) {
    character.firstLoginTime = now;
    character.dailyLogins = 1;
    addLog('[SYSTEM] Welcome, Player. Your journey begins.', 'system');
  } else {
    character.dailyLogins++;
  }
  character.lastLoginTime = now;

  // Update total playtime tracking
  let lastSave = 0;
  try {
    const saveData = localStorage.getItem(saveSystem.getSlotStorageKey());
    if (saveData) {
      const parsed = JSON.parse(saveData);
      lastSave = parsed.character?.totalPlayTime || 0;
    }
  } catch (e) {}

  // Add time since last save to total playtime
  if (lastSave > 0 && character.totalPlayTime >= lastSave) {
    // Playtime is tracked correctly
  } else if (lastSave > character.totalPlayTime) {
    character.totalPlayTime = lastSave;
  }

  lastTick = performance.now();

  // Dev commands — only in development mode
  if (import.meta.env.DEV) {
    window.skipTime = skipTime;

    // skipDays(n) — skip n days for daily challenge testing
    window.skipDays = (n: number = 1) => {
      // Simulate each day
      for (let i = 0; i < n; i++) {
        // Move challenge start time back by 24 hours
        dailyChallengeState.challengeStartTime -= 24 * 60 * 60 * 1000;
        checkAndRotateChallenge();
        if (isChallengeComplete() && !dailyChallengeState.claimedReward && dailyChallengeState.completedToday) {
          const reward = claimDailyReward();
          if (reward) {
            addLog(`[DAILY] Auto-claimed ${reward.shards} Shards!`, 'awakening');
          }
        }
      }
      return `[DEV] Skipped ${n} day(s). Challenge rotated.`;
    };

    // maxSkills() — bypasses fragment cost, directly maxes all skills
    window.maxSkills = () => {
      const HUGE = new Decimal(1, 300);
      character.skillFragments = character.skillFragments.add(HUGE);
      const result = upgradeAllSkills();
      console.log('%c[DEV] maxSkills:', 'color: #0f0', result);
      return result;
    };

    // addFragments(n) — add n skill fragments (default 1e10)
    window.addFragments = (n = 1e10) => {
      character.skillFragments = character.skillFragments.add(n);
      return `[DEV] Added ${n} Skill Fragments. Total: ${character.skillFragments.toString()}`;
    };

    // addData(n) — add n Data Fragments (mining/bestiary currency)
    window.addData = (n = 1e10) => {
      bestiaryState.dataFragments = bestiaryState.dataFragments.add(n);
      return `[DEV] Added ${n} Data Fragments. Total: ${bestiaryState.dataFragments.toString()}`;
    };

    // addDna(n) — add n DNA Fragments (forestry currency)
    window.addDna = (n = 1e10) => {
      forestryState.dnaFragments = forestryState.dnaFragments.add(n);
      return `[DEV] Added ${n} DNA Fragments. Total: ${forestryState.dnaFragments.toString()}`;
    };

    // level — prints current character level
    (window as any).level = () => {
      return `[DEV] Level: ${character.level}`;
    };

    // simulate(days) — process N days of offline rewards (applied)
    (window as any).simulate = (days = 30) => {
      flushStatCache();
      updateDerivedStats();

      const ms = Math.min(days, 30) * 24 * 3600 * 1000;
      precisionOfflineProcess(ms);

      return `[DEV] Simulated ${days}d. Level: ${character.level} Kills: ${character.kills} Fragments: ${character.skillFragments}`;
    };

    console.log(
      '%c[DEV] Commands: level() | skipTime(days) | skipDays(n) | maxSkills() | addFragments(n) | addData(n) | addDna(n) | simulate(days)',
      'color: #00ff00; font-weight: bold;'
    );
  }

  tickIntervalId = setInterval(tickLoop, tickRate);
}


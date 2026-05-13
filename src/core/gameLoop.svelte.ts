
import { character, safeKills, applyMomentumSoftcap, applyOverchargeSoftcap, updateDerivedStats } from '../modules/character.svelte.js';
import { performCombatTick, combatState, getEffectiveCombatStats, flushStatCache } from '../modules/combat.svelte.js';
import { getOmniMult, upgradeAllSkills } from '../modules/skills.svelte.js';
import { matrixState } from '../modules/matrix.svelte.js';
import { doOverclock, LEVEL_REQ } from '../modules/overclock.svelte.js';
import { saveSystem } from './saveSystem.js';
import { checkAchievements } from '../systems/achievementSystem.svelte.js';
import { performMiningTick } from '../modules/mining.svelte.js';
import { performForestryTick } from '../modules/forestry.svelte.js';
import { flushInventoryUpdates } from '../modules/inventory.svelte.js';
import { autoUpgradeMining, autoUpgradeForestry, autoUpgradeBestiary } from '../utils/globalMaxUpgrade.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { aiSystem } from '../systems/aiSystem.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { Decimal } from '../systems/decimal.js';
import { showOfflineSummary } from '../stores/uiStore.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { gameConfig } from '../data/config.js';
import { mobs } from '../data/mobs.js';
import {
  checkAndRotateChallenge,
  checkRotationTick,
  trackKill,
  trackLevelUp,
  trackCrit,
  checkChallengeCompletion,
  isChallengeComplete,
  claimDailyReward,
  dailyChallengeState
} from '../modules/dailyChallenge.svelte.js';
import { trackLevelProgress } from '../modules/ascension.svelte.js';

import { getTotalTicks, incrementTotalTicks, addTotalTicks } from './tickState.js';

// ============================================================
// ENGINE INTEGRATION — Phase 3 of Architecture Refactor
// Replaces direct RAF loop with TickScheduler + SnapshotManager
// ============================================================

import { scheduler, snapshotManager } from '../engine/index.js';
import { eventBus } from '../engine/events/EventBus.js';
import type { GameEvent } from '../engine/events/EventBus.js';

// ============================================================
// FORESTRY UI SNAPSHOT — Decouples simulation from rendering
// Updated at 10 FPS regardless of tick rate
// ============================================================
let forestrySnapshot = $state({
  harvestRate: 0,
  dnaFragments: new Decimal(0),
  growthProgress: 0,
  energy: 0,
  maxEnergy: 100,
  unlocked: false,
});

export function getForestrySnapshot() {
  return forestrySnapshot;
}

// Kept for backward compatibility: avoid removing export entirely.
export const gameLoop = $state({});

let lastForestryUIUpdate = 0;
const FORESTRY_UI_THROTTLE = 100; // 10 FPS for Forestry panel

export { getTotalTicks };

// ============================================================
// SNAPSHOT UPDATE — Updated at 10 FPS
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

// ============================================================
// CORE SIMULATION TICK — The hot path
// This is called by the scheduler at 20 TPS
// ============================================================
function processSimulationTick(ticks: number): void {
  const dNum = ticks;

  // ---- Momentum (float) ----
  character.momentum += 0.01 * dNum;

  if (character.kills.gt(0)) {
    const k = safeKills();
    character.momentum += k * 0.0001 * dNum;
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
  if (levelsGained > 0) {
    trackLevelProgress(character.level);
    // Emit event for listeners
    eventBus.emit({ type: 'LEVEL_UP', level: character.level, levelsGained } as GameEvent);
  }

  // Stats synchronization
  const stats = getEffectiveCombatStats();
  if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;
  if (character.stats.defense.lt(0)) character.stats.defense = new Decimal(0);
  if (character.stats.hp.lt(0)) character.stats.hp = new Decimal(0);

  // ---- Combat ----
  performCombatTick(ticks);
  flushInventoryUpdates();

  // ---- Daily Challenge tracking ----
  const combatKills = combatState.kills;
  if (combatKills > 0) {
    for (let i = 0; i < combatKills; i++) {
      trackKill();
    }
    combatState.kills = 0;
  }
  if (combatState.lastHitCrit) {
    trackCrit();
    combatState.lastHitCrit = false;
  }

  // ---- Mining & Forestry ----
  performMiningTick(ticks);
  performForestryTick(ticks);
}

// ============================================================
// THROTTLED OPERATIONS — Run every N ticks
// ============================================================
function processThrottledOperations(): void {
  // Achievement check
  if (matrixState.autoAchieve) {
    checkAchievements();
  } else {
    // Still check periodically if auto-achieve is off
    const tickCount = scheduler.getTickCount();
    if (tickCount % 50 === 0) {
      checkAchievements();
    }
  }

  // Automation (runs every throttled check)
  if (matrixState.autoSkill) upgradeAllSkills();
  if (matrixState.autoMining) autoUpgradeMining();
  if (matrixState.autoForestry) autoUpgradeForestry();
  if (matrixState.autoBestiary) autoUpgradeBestiary();

  if (matrixState.autoOverclock) {
    const target = new Decimal(matrixState.targetOverclockLevel);
    if (target.gte(LEVEL_REQ) && character.level.gte(target)) {
      doOverclock();
    }
  }

  // Daily challenge check
  checkChallengeCompletion();
  if (dailyChallengeState.completedToday && !dailyChallengeState.claimedReward) {
    const reward = claimDailyReward();
    if (reward) {
      addLog(`[DAILY] Auto-claimed ${reward.shards} Shards!`, 'awakening');
    }
  }
}

// ============================================================
// OFFLINE PROCESSING — Fast-forward simulation
// ============================================================
export function processOfflineProgress(ms: number): void {
  if (ms < 1000) return;

  flushStatCache();
  updateDerivedStats();

  const MONTH_IN_SECONDS = 30 * 24 * 3600;

  // FIXED: Use actual tick rate from config
  const tickRateVal = gameConfig.baseTickRate / 1000; // Convert ms to seconds (match gameTick)
  const totalSeconds = Math.min(ms / 1000, MONTH_IN_SECONDS);
  const efficiency = character.offlineSettings.efficiency;
  const effectiveTime = totalSeconds * efficiency;
  const ticks = effectiveTime / tickRateVal; // ticks to apply across combat/mining/forestry

  const preLevel = new Decimal(character.level);
  const preKills = new Decimal(character.kills);

  const stats = getEffectiveCombatStats();

  // FIXED: Calculate scaled enemy stats based on player level progression during offline
  // Since enemy level scales with player level and enemies are killed in batches,
  // we need to account for the fact that player level increases over time during offline.
  // Use current player level as base (simplified - enemy level ~ player level)
  const playerLevelDec = new Decimal(character.level);
  const enemyLvl = playerLevelDec.add(Math.floor(Math.random() * 3) - 1).max(1);
  const mobData = mobs[Math.floor(Math.random() * mobs.length)];

  const enemyGrowth = new Decimal(1.15).pow(enemyLvl.sub(1).max(0));
  const enemyMaxHp = new Decimal(50).mul(enemyGrowth);
  const enemyAttack = new Decimal(5).mul(enemyGrowth);

  // FIXED: Calculate kills based purely on player attack vs enemy HP
  // Skills work based on rank only, always active, no cooldowns
  const ticksPerKill = Math.max(1, enemyMaxHp.div(stats.atk).toNumber());

  const totalKills = new Decimal(Math.floor(ticks / ticksPerKill));

  if (totalKills.gt(0)) {
    rewardSystem.grantRewards({ id: mobData.id, name: mobData.name, type: mobData.type, level: enemyLvl, maxHp: enemyMaxHp, hp: enemyMaxHp, attack: enemyAttack }, totalKills);
  }
  flushInventoryUpdates();

  performMiningTick(ticks);
  performForestryTick(ticks);

  const killsNum = totalKills.toNumber();
  character.momentum = applyMomentumSoftcap(character.momentum + (0.01 + (killsNum * 0.0001)) * ticks);

  if (character.xp.gte(character.xpNeeded)) {
    character.overcharge = applyOverchargeSoftcap(character.overcharge + (0.05 * ticks));
  }

  let batchPasses = 0;
  while (character.xp.gte(character.xpNeeded) && batchPasses++ < 20) {
    rewardSystem.batchLevelUps();
  }

  if (matrixState.autoSkill) upgradeAllSkills();
  if (matrixState.autoMining) autoUpgradeMining();
  if (matrixState.autoForestry) autoUpgradeForestry();
  if (matrixState.autoBestiary) autoUpgradeBestiary();

  updateDerivedStats();

  character.offlineSettings.lastSummary = {
    seconds: totalSeconds,
    levels: character.level.sub(preLevel),
    kills: character.kills.sub(preKills),
    efficiency: efficiency * 100
  };

  if (totalSeconds > 60) {
    showOfflineSummary({
      seconds: totalSeconds,
      kills: character.kills.sub(preKills),
      levels: character.level.sub(preLevel),
      efficiency: efficiency
    });
  }

  console.log(`[OFFLINE] Processed ${totalSeconds.toFixed(1)}s — Level: ${character.level.toString()}, Kills: ${character.kills.toString()}`);
}

// ============================================================
// LEGACY GAME TICK — Kept for dev commands and manual control
// New code should use scheduler.start() instead
// ============================================================
let legacyLastTick = performance.now();
let legacyAccumulatedTime = 0;
let challengeCheckCounter = 0;

export function gameTick(now: number): number | void {
  const dt = now - legacyLastTick;
  legacyLastTick = now;

  if (dt > 5000) {
    processOfflineProgress(dt);
    return requestAnimationFrame(gameTick);
  }

  // Update snapshots at 10 FPS
  updateSnapshots(now);

  // Check for daily challenge rotation (every ~60 seconds)
  checkRotationTick(now);

  // Track total playtime (convert ms to seconds)
  character.totalPlayTime += dt / 1000;

  legacyAccumulatedTime += dt;

  let ticksToProcess = Math.floor(legacyAccumulatedTime / gameConfig.baseTickRate);
  const maxTicksPerFrame = 2000;

  if (ticksToProcess > maxTicksPerFrame) {
    ticksToProcess = maxTicksPerFrame;
  }

  if (ticksToProcess > 0) {
    addTotalTicks(ticksToProcess);
    processSimulationTick(ticksToProcess);
    legacyAccumulatedTime -= ticksToProcess * gameConfig.baseTickRate;
  }

  // Throttled operations every 50 ticks
  challengeCheckCounter += ticksToProcess;
  if (challengeCheckCounter >= 50) {
    challengeCheckCounter = 0;
    processThrottledOperations();
  }

  requestAnimationFrame(gameTick);
}

export function skipTime(days: number = 1): string {
  flushStatCache(); // Ensure latest skills/threads are used
  updateDerivedStats();
  const ms = days * 86400 * 1000;
  processOfflineProgress(ms);

  // Process daily challenge rotation for each day skipped
  // Need to simulate each day separately by adjusting challengeStartTime
  for (let i = 0; i < days; i++) {
    // Rotate challenge by simulating time passage
    if (dailyChallengeState.activeChallenge) {
      dailyChallengeState.challengeStartTime -= 24 * 60 * 60 * 1000; // Go back 24 hours
      checkAndRotateChallenge();
    }

    // Process completion and auto-claim
    checkChallengeCompletion();
    if (isChallengeComplete() && !dailyChallengeState.claimedReward && dailyChallengeState.completedToday) {
      const reward = claimDailyReward();
      if (reward) {
        addLog(`[DAILY] Auto-claimed ${reward.shards} Shards!`, 'awakening');
      }
    }
  }

  return `[DEV] Simulated ${days} day(s). Level: ${character.level.toString()} | Kills: ${character.kills.toString()}`;
}

// ============================================================
// START GAME LOOP — Legacy entry point (kept for compatibility)
// New code should use: scheduler.start()
// ============================================================
export function startGameLoop(): void {
  const offlineMs = saveSystem.load();
  if (offlineMs > 0) {
    // Cap total offline accumulation to 30 days
    legacyAccumulatedTime += Math.min(offlineMs, 30 * 24 * 3600 * 1000);
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
    const saveData = localStorage.getItem('cyber_idle_save_v3');
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

  legacyLastTick = performance.now();

  // ============================================================
  // REGISTER ENGINE SUBSYSTEMS — Phase 3 Integration
  // ============================================================

  // Register tick callback for simulation
  scheduler.onTick((ticks) => {
    addTotalTicks(ticks);
    processSimulationTick(ticks);
  });

  // Register throttled operations (every 50 ticks)
  scheduler.onTick(() => {
    const tickCount = scheduler.getTickCount();
    if (tickCount % 50 === 0) {
      processThrottledOperations();
    }
  });

  // Register frame callback for snapshots
  scheduler.onFrame((now) => {
    updateSnapshots(now);
  });

  // Register offline processing
  scheduler.onOffline((ms) => {
    processOfflineProgress(ms);
  });

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

    // engineStats — debug engine state
    window.engineStats = () => {
      const stats = {
        tickCount: scheduler.getTickCount(),
        tps: scheduler.getTPS(),
        registeredEvents: eventBus.getRegisteredEvents(),
        eventCounts: {} as Record<string, number>
      };
      for (const eventType of stats.registeredEvents) {
        stats.eventCounts[eventType] = eventBus.listenerCount(eventType);
      }
      console.table(stats);
      return stats;
    };

    console.log(
      '%c[DEV] Commands: skipTime(days) | maxSkills() | addFragments(n) | addData(n) | addDna(n) | engineStats()',
      'color: #00ff00; font-weight: bold;'
    );
  }

  // Start the scheduler
  scheduler.start();

  console.log('[GameLoop] Started with engine integration');
}

// ============================================================
// EVENT BUS INTEGRATION — Systems can now subscribe to events
// ============================================================

// Example: Log all kills for debugging
eventBus.on('ENEMY_KILLED', (e) => {
  if (import.meta.env.DEV && e.isInstakill) {
    console.log(`[DEBUG] Instakill: ${e.kills} kills`);
  }
});

// Example: Track level ups
eventBus.on('LEVEL_UP', (e) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] Level up: ${e.level} (+${e.levelsGained})`);
  }
});

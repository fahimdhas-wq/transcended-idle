
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

import { getTotalTicks, incrementTotalTicks, addTotalTicks } from './tickState.js';

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

let lastTick = performance.now();
let lastForestryUIUpdate = 0;
const FORESTRY_UI_THROTTLE = 100; // 10 FPS for Forestry panel

// Kept for backward compatibility: avoid removing export entirely.
export const gameLoop = $state({});

let accumulatedTime = 0;
const tickRate = gameConfig.baseTickRate; // ms per tick (single source of truth)
let achCheckCounter = 0;

export { getTotalTicks };

/**
 * Core Offline Projection Engine
 * Calculates progress using pure math instead of loops.
 */
export function processOfflineProgress(ms: number): void {
  if (ms < 1000) return;

  flushStatCache();
  updateDerivedStats();

  const MONTH_IN_SECONDS = 30 * 24 * 3600;

  // FIXED: Use actual tick rate from config
  const tickRateVal = tickRate / 1000; // Convert ms to seconds (match gameTick)
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

/**
 * Tab Visibility Handler
 */
if (typeof document !== 'undefined') {
  let hiddenTime = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenTime = performance.now();
    } else {
      const elapsed = performance.now() - hiddenTime;
      // Defer offline processing using requestIdleCallback to avoid blocking
      const doProcess = () => {
        processOfflineProgress(elapsed);
        lastTick = performance.now();
      };
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(doProcess, { timeout: 1000 });
      } else {
        setTimeout(doProcess, 16);
      }
    }
  });
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

export function gameTick(now: number): number | void {
  const dt = now - lastTick;
  lastTick = now;

  if (dt > 5000) {
    processOfflineProgress(dt);
    return requestAnimationFrame(gameTick);
  }

  // Update snapshots before tick processing
  updateSnapshots(now);

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
    rewardSystem.processLevelUps();

    // Stats synchronization
    const stats = getEffectiveCombatStats();
    if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;
    if (character.stats.defense.lt(0)) character.stats.defense = new Decimal(0);
    if (character.stats.hp.lt(0)) character.stats.hp = new Decimal(0);
    
    // Combat
    performCombatTick(ticksToProcess);
    flushInventoryUpdates();

    // Mining & Forestry
    performMiningTick(ticksToProcess);
    performForestryTick(ticksToProcess);

    // Achievement check every ~50 ticks
    achCheckCounter += ticksToProcess;
    // Automation Check (Auto-Matrix)
    if (matrixState.autoAchieve && achCheckCounter >= 10) checkAchievements();
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

    if (achCheckCounter >= 50) {
      achCheckCounter = 0;
      checkAchievements(); // Redundant if Auto-Matrix is on, but necessary if off
    }

    accumulatedTime -= ticksToProcess * tickRate;
  }

  requestAnimationFrame(gameTick);
}

export function skipTime(days: number = 1): string {
  flushStatCache(); // Ensure latest skills/threads are used
  updateDerivedStats();
  const ms = days * 86400 * 1000;
  processOfflineProgress(ms);
  return `[DEV] Simulated ${days} day(s). Level: ${character.level.toString()} | Kills: ${character.kills.toString()}`;
}

export function startGameLoop(): void {
  const offlineMs = saveSystem.load();
  if (offlineMs > 0) {
    // Cap total offline accumulation to 30 days
    accumulatedTime += Math.min(offlineMs, 30 * 24 * 3600 * 1000);
  }

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

  lastTick = performance.now();

  // Dev commands — only in development mode
  if (import.meta.env.DEV) {
    window.skipTime = skipTime;

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

    console.log(
      '%c[DEV] Commands: skipTime(days) | maxSkills() | addFragments(n) | addData(n) | addDna(n)',
      'color: #00ff00; font-weight: bold;'
    );
  }

  requestAnimationFrame(gameTick);
}


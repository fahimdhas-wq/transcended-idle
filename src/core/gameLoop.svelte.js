import { character, safeKills, applyMomentumSoftcap, applyOverchargeSoftcap, updateDerivedStats } from '../modules/character.svelte.js';
import { performCombatTick, combatState, getEffectiveCombatStats, flushStatCache } from '../modules/combat.svelte.js';
import { getOmniMult, upgradeAllSkills } from '../modules/skills.svelte.js';
import { matrixState } from '../modules/matrix.svelte.js';
import { doOverclock, LEVEL_REQ } from '../modules/overclock.svelte.js';
import { saveSystem } from './saveSystem.js';
import { checkAchievements } from '../systems/achievementSystem.svelte.js';
import { performMiningTick, autoUpgradeMining } from '../modules/mining.svelte.js';
import { performForestryTick, autoUpgradeForestry } from '../modules/forestry.svelte.js';
import { autoUpgradeBestiary } from '../modules/bestiary.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { aiSystem } from '../systems/aiSystem.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { Decimal } from '../systems/decimal.js';
import { showOfflineSummary } from '../stores/uiStore.svelte.js';
import { gameConfig } from '../data/config.js';

let lastTick = performance.now();

export const gameLoop = $state({
  totalGameTicks: 0
});

let accumulatedTime = 0;
const tickRate = gameConfig.baseTickRate; // ms per tick (single source of truth)
let achCheckCounter = 0;

/**
 * Core Offline Projection Engine
 * Calculates progress using pure math instead of loops.
 */
export function processOfflineProgress(ms) {
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
  const enemy = aiSystem.generateEnemy(character);
  
  const ticksPerKill = Decimal.max(1, enemy.maxHp.div(stats.atk)).toNumber();
  const totalKills = new Decimal(Math.floor(ticks / ticksPerKill));

  if (totalKills.gt(0)) {
    rewardSystem.grantRewards(enemy, totalKills);
  }
  
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
      processOfflineProgress(elapsed);
      lastTick = performance.now(); // Reset loop anchor
    }
  });
}

export function gameTick(now) {
  const dt = now - lastTick;
  lastTick = now;

  if (dt > 5000) {
    processOfflineProgress(dt);
    return requestAnimationFrame(gameTick);
  }

  accumulatedTime += dt;

  let ticksToProcess = Math.floor(accumulatedTime / tickRate);
  const maxTicksPerFrame = 2000;
  
  if (ticksToProcess > maxTicksPerFrame) {
    ticksToProcess = maxTicksPerFrame;
  }

  if (ticksToProcess > 0) {
    gameLoop.totalGameTicks += ticksToProcess;
    
    const dNum = ticksToProcess;
    
    // ---- XP (Decimal, batched) ----
    if (!character.totalXp || character.totalXp.m === 0) {
      const constant = 2.4;
      const baseReq = 100;
      character.totalXp = character.level.pow(constant).sub(1).mul(baseReq / constant).add(character.xp);
    }
    let xpGain = new Decimal(dNum);
    character.xp = character.xp.add(xpGain);
    character.totalXp = character.totalXp.add(xpGain);
    
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

export function skipTime(days = 1) {
  flushStatCache(); // Ensure latest skills/threads are used
  updateDerivedStats();
  const ms = days * 86400 * 1000;
  processOfflineProgress(ms);
  return `[DEV] Simulated ${days} day(s). Level: ${character.level.toString()} | Kills: ${character.kills.toString()}`;
}

export function startGameLoop() {
  const offlineMs = saveSystem.load();
  if (offlineMs > 0) {
    // Cap total offline accumulation to 30 days
    accumulatedTime += Math.min(offlineMs, 30 * 24 * 3600 * 1000);
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

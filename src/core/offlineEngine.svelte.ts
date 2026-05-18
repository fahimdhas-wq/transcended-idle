
import { character, updateDerivedStats, applyMomentumSoftcap, applyOverchargeSoftcap, safeKills } from '../modules/character.svelte.js';
import { combatState, getEffectiveCombatStats, flushStatCache } from '../modules/combat.svelte.js';
import { performMiningTick } from '../modules/mining.svelte.js';
import { performForestryTick } from '../modules/forestry.svelte.js';
import { flushInventoryUpdates } from '../modules/inventory.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { miningResources } from '../modules/miningResources.js';
import { forestryResources } from '../modules/forestryResources.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { Decimal } from '../systems/decimal.js';
import { showOfflineSummary } from '../stores/uiStore.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { mobs } from '../data/mobs.js';
import {
  trackKill,
  trackCrit,
  trackLevelUp,
} from '../modules/dailyChallenge.svelte.js';
import { skillsState } from '../modules/skills.svelte.js';
import { getAscensionBonus } from '../modules/ascension.svelte.js';
import {
  checkAchievements,
} from '../systems/achievementSystem.svelte.js';
import { getSpeciesDamageBonus } from '../modules/bestiaryBonuses.js';
import { getTotalTicks } from './tickState.js';

export interface OfflineSnapshot {
  kills: Decimal;
  levels: Decimal;
  efficiency: number;
}

/**
 * Phase-based combat simulation.
 * Instead of looping enemy-by-enemy, calculate expected kills from average DPS
 * against average enemy HP, then grant rewards in one bulk call.
 */
function processOfflineCombat(ticks: number): void {
  const stats = getEffectiveCombatStats();

  // Regen baseline for the full duration
  character.stats.hp = character.stats.hp.add(stats.regenHp.mul(ticks));
  character.stats.defense = character.stats.defense.add(stats.regenDef.mul(ticks));
  if (character.stats.hp.gt(stats.hp)) character.stats.hp = stats.hp;
  if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;

  // Probabilistic crit tracking for daily challenge
  const expectedCrits = ticks * stats.critChance;
  if (expectedCrits >= 1) {
    for (let i = 0; i < Math.floor(expectedCrits); i++) {
      combatState.lastHitCrit = true;
    }
  }

  // ----- Phase-based combat -----
  // Average enemy at character level: HP = 50 * GROWTH_BASE^(level-1), ATK similar
  // We compute avg DPS, estimate ticks-per-kill, and compute total kills in batch.
  const enemyLevel = character.level;
  const growth = Decimal.GROWTH_BASE.pow(enemyLevel.sub(1).max(0));
  const avgEnemyHp = Decimal.FIFTY.mul(growth);
  const avgEnemyAtk = Decimal.FIVE.mul(growth);
  const avgSpeciesBonus = getSpeciesDamageBonus('') || 1;

  const effectiveAtk = stats.atk.mul(avgSpeciesBonus);
  if (effectiveAtk.lte(0)) return;

  // Calculate ticks to kill one average enemy
  const ticksPerKill = Math.max(1, avgEnemyHp.div(effectiveAtk).toNumber());

  // Total kills in the offline period
  const totalKills = Math.floor(ticks / ticksPerKill);
  if (totalKills <= 0) {
    // Even partial damage — account for possible regen
    return;
  }

  // ----- Cleave EV calculation -----
  const cleaveSkill = skillsState.skills.find(s => s.id === 'cleave');
  let cleaveMultiplier = 1;
  if (cleaveSkill && cleaveSkill.tierIndex > 0) {
    const baseCleaveAmounts = [0, 2, 5, 12, 25, 50, 100, 250];
    let cleaveKills: number;
    if (cleaveSkill.tierIndex < baseCleaveAmounts.length) {
      cleaveKills = baseCleaveAmounts[cleaveSkill.tierIndex];
    } else {
      cleaveKills = 250 * Math.pow(2, cleaveSkill.tierIndex - 7);
    }
    const sealMult = Math.pow(10, character.seals || 0);
    const activateChance = cleaveSkill.tierIndex >= 21 ? 1.0 : 0.4;
    // EV: each kill has activateChance to add cleaveKills × sealMult extra kills
    cleaveMultiplier = 1 + activateChance * cleaveKills * sealMult;
  }

  const effectiveKills = Math.round(totalKills * cleaveMultiplier);
  if (effectiveKills <= 0) return;

  // Use a random mob for species tracking — average across all types
  const mobData = mobs[Math.floor(Math.random() * mobs.length)];

  // Grant all rewards in one bulk call — this does XP, loot, fragments, shards
  rewardSystem.grantRewards({
    id: mobData.id,
    name: mobData.name,
    type: mobData.type as any,
    level: enemyLevel,
    maxHp: avgEnemyHp,
    hp: avgEnemyHp,
    attack: avgEnemyAtk,
  }, new Decimal(effectiveKills));

  combatState.kills += effectiveKills;

  // Downtime from player taking damage during combat ticks:
  // If enemy would kill the player, each death costs a fraction of XP
  // For precision, calculate expected HP consumption and verge count
  const avgDmgPerTick = avgEnemyAtk;
  const totalDefense = character.stats.defense.toNumber();
  const ticksUntilDeath = totalDefense > 0
    ? Math.max(1, totalDefense / avgDmgPerTick.toNumber())
    : 1;

  // Regeneration should keep us alive if ticksUntilDeath > ticksPerKill * some margin
  // For simplicity: if instakill (DPS > enemy HP), no damage taken
  // If not instakill, we may take some damage but the existing live code handles this
}

export function processOfflineProgress(ms: number): void {
  if (ms < 1000) return;

  flushStatCache();
  updateDerivedStats();

  const MONTH_IN_SECONDS = 30 * 24 * 3600;
  const tickRateVal = 0.1; // 100ms = 0.1s per tick
  const totalSeconds = Math.min(ms / 1000, MONTH_IN_SECONDS);
  const efficiency = character.offlineSettings.efficiency;
  const effectiveTime = totalSeconds * efficiency;
  const ticks = Math.floor(effectiveTime / tickRateVal);
  if (ticks <= 0) return;

  const preLevel = new Decimal(character.level);
  const preKills = new Decimal(character.kills);
  const preXp = new Decimal(character.totalXp);
  const preFrags = new Decimal(character.skillFragments);
  const preData = new Decimal(bestiaryState.dataFragments);
  const preDna = new Decimal(forestryState.dnaFragments);

  const preMiningBuf = Float64Array.from(miningResources.array.getBuffer());
  const preForestryBuf = Float64Array.from(forestryResources.array.getBuffer());

  // ----- Phase-based combat -----
  processOfflineCombat(ticks);
  flushInventoryUpdates();

  // Track kills for daily challenge
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

  // ----- Energy-aware mining & forestry -----
  performMiningTick(ticks);
  performForestryTick(ticks);

  // ----- Momentum & overcharge -----
  const killsNum = character.kills.sub(preKills).toNumber();
  const ascMomentum = 1 + getAscensionBonus('momentum');
  character.momentum = applyMomentumSoftcap(character.momentum + (0.01 + killsNum * 0.0001) * ticks * ascMomentum);

  if (character.xp.gte(character.xpNeeded)) {
    character.overcharge = applyOverchargeSoftcap(character.overcharge + 0.05 * ticks);
  }

  // ----- Binary search level-ups -----
  let levelsGained = 0;
  let batchSafety = 0;
  while (character.xp.gte(character.xpNeeded) && batchSafety < 200) {
    batchSafety++;
    levelsGained += rewardSystem.batchLevelUps();
  }
  for (let i = 0; i < levelsGained; i++) {
    trackLevelUp();
  }

  updateDerivedStats();

  // ----- Achievement check -----
  checkAchievements();

  // Build offline summary
  character.offlineSettings.lastSummary = {
    seconds: totalSeconds,
    levels: character.level.sub(preLevel),
    kills: character.kills.sub(preKills),
    efficiency: efficiency * 100,
  };

  if (totalSeconds > 60) {
    const postMiningBuf = miningResources.array.getBuffer();
    const postForestryBuf = forestryResources.array.getBuffer();
    let miningSum = 0;
    for (let i = 0; i < postMiningBuf.length; i++) miningSum += postMiningBuf[i] - preMiningBuf[i];
    let forestrySum = 0;
    for (let i = 0; i < postForestryBuf.length; i++) forestrySum += postForestryBuf[i] - preForestryBuf[i];

    showOfflineSummary({
      seconds: totalSeconds,
      kills: character.kills.sub(preKills),
      levels: character.level.sub(preLevel),
      efficiency: efficiency,
      xpGained: character.totalXp.sub(preXp),
      fragmentsGained: character.skillFragments.sub(preFrags),
      dataFragments: bestiaryState.dataFragments.sub(preData),
      dnaFragments: forestryState.dnaFragments.sub(preDna),
      miningGained: new Decimal(miningSum),
      forestryGained: new Decimal(forestrySum),
    });
  }

  console.log(`[OFFLINE] Processed ${totalSeconds.toFixed(1)}s — Level: ${character.level.toString()}, Kills: ${character.kills.toString()}, Ticks: ${ticks}`);
}

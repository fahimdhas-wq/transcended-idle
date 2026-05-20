import { Decimal } from '../systems/decimal.js';
import { character, updateDerivedStats, applyMomentumSoftcap, applyOverchargeSoftcap } from '../modules/character.svelte.js';
import { combatState, getEffectiveCombatStats, flushStatCache } from '../modules/combat.svelte.js';
import { performMiningTick } from '../modules/mining.svelte.js';
import { performForestryTick } from '../modules/forestry.svelte.js';
import { flushInventoryUpdates } from '../modules/inventory.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { miningResources } from '../modules/miningResources.js';
import { forestryResources } from '../modules/forestryResources.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { showOfflineSummary } from '../stores/uiStore.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { mobs } from '../data/mobs.js';
import { trackKillBatch, trackCrit, trackLevelUp } from '../modules/dailyChallenge.svelte.js';
import { skillsState } from '../modules/skills.svelte.js';
import { getAscensionBonus } from '../modules/ascension.svelte.js';
import { checkAchievements } from '../systems/achievementSystem.svelte.js';
import { getSpeciesDamageBonus } from '../modules/bestiaryBonuses.js';
import { getTotalTicks } from './tickState.js';

let worker: Worker | null = null;
let useWorker = false;

export async function initOfflineWorker(): Promise<void> {
  try {
    worker = new Worker(new URL('../workers/offline.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onerror = (e) => {
      console.warn('[OfflineWorker] Failed, using main thread:', e.message);
      useWorker = false;
      worker = null;
    };
    
    useWorker = true;
    console.log('[Offline] Using worker for batch processing');
  } catch (e) {
    console.warn('[OfflineWorker] Not available, using main thread');
    useWorker = false;
  }
}

export function terminateOfflineWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    useWorker = false;
  }
}

export interface OfflineSnapshot {
  kills: Decimal;
  levels: Decimal;
  efficiency: number;
}

function processOfflineCombat(ticks: number): void {
  const stats = getEffectiveCombatStats();

  character.stats.hp = character.stats.hp.add(stats.regenHp.mul(ticks));
  if (character.stats.hp.gt(stats.hp)) character.stats.hp = stats.hp;
  character.stats.defense = character.stats.defense.add(stats.regenDef.mul(ticks));
  if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;

  const expectedCrits = ticks * stats.critChance;
  if (expectedCrits >= 1) {
    for (let i = 0; i < Math.floor(expectedCrits); i++) {
      combatState.lastHitCrit = true;
    }
  }

  const enemyLevel = character.level;
  const growth = Decimal.GROWTH_BASE.pow(enemyLevel.sub(1).max(0));
  const avgEnemyHp = Decimal.FIFTY.mul(growth);
  const avgEnemyAtk = Decimal.FIVE.mul(growth);

  const effectiveAtk = stats.atk.mul(getSpeciesDamageBonus('') || 1);
  if (effectiveAtk.lte(0)) return;

  const ticksPerKill = Math.max(1, avgEnemyHp.div(effectiveAtk).toNumber());
  const totalKills = Math.floor(ticks / ticksPerKill);
  if (totalKills <= 0) return;

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
    cleaveMultiplier = 1 + activateChance * cleaveKills * sealMult;
  }

  const effectiveKills = Math.round(totalKills * cleaveMultiplier);
  if (effectiveKills <= 0) return;

  const mobData = mobs[Math.floor(Math.random() * mobs.length)];

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
}

export function processOfflineProgress(ms: number): void {
  if (ms < 1000) return;

  flushStatCache();
  updateDerivedStats();

  const MONTH_IN_SECONDS = 30 * 24 * 3600;
  const tickRateVal = 0.1;
  const totalSeconds = Math.min(ms / 1000, MONTH_IN_SECONDS);
  const efficiency = character.offlineSettings.efficiency;
  const effectiveTime = totalSeconds * efficiency;
  const ticks = Math.floor(effectiveTime / tickRateVal);
  if (ticks <= 0) return;

  const preLevel = new Decimal(character.level);
  const preKills = new Decimal(character.kills);
  const preXp = new Decimal(character.xp);
  const preFrags = new Decimal(character.skillFragments);
  const preData = new Decimal(bestiaryState.dataFragments);
  const preDna = new Decimal(forestryState.dnaFragments);

  const preMiningBuf = Float64Array.from(miningResources.array.getBuffer());
  const preForestryBuf = Float64Array.from(forestryResources.array.getBuffer());

  processOfflineCombat(ticks);
  flushInventoryUpdates();

  const combatKills = combatState.kills;
  if (combatKills > 0) {
    trackKillBatch(combatKills);
    combatState.kills = 0;
  }
  if (combatState.lastHitCrit) {
    trackCrit();
    combatState.lastHitCrit = false;
  }

  performMiningTick(ticks);
  performForestryTick(ticks);

  const killsNum = character.kills.sub(preKills).toNumber();
  const ascMomentum = 1 + getAscensionBonus('momentum');
  character.momentum = applyMomentumSoftcap(character.momentum + (0.01 + killsNum * 0.0001) * ticks * ascMomentum);

  if (character.xp.gte(character.xpNeeded)) {
    character.overcharge = applyOverchargeSoftcap(character.overcharge + 0.05 * ticks);
  }

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
  checkAchievements();

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
      xpGained: character.xp.sub(preXp),
      fragmentsGained: character.skillFragments.sub(preFrags),
      dataFragments: bestiaryState.dataFragments.sub(preData),
      dnaFragments: forestryState.dnaFragments.sub(preDna),
      miningGained: new Decimal(miningSum),
      forestryGained: new Decimal(forestrySum),
    });
  }

  console.log(`[OFFLINE] Processed ${totalSeconds.toFixed(1)}s — Level: ${character.level.toString()}, Kills: ${character.kills.toString()}, Ticks: ${ticks}`);
}
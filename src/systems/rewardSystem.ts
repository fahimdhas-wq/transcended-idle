import {
  character,
  updateDerivedStats,
  applyMomentumSoftcap,
  applyOverchargeSoftcap,
  safeKills,
  getXpNeededForLevel,
  XP_COST_EXP_BASE,
  XP_COST_POLY_POWER
} from '../modules/character.svelte.js';
import { addLog, incrementKills } from '../ui/LogPanelState.svelte.js';
import { addItem } from '../modules/inventory.svelte.js';
import { itemRarities, itemNames } from '../data/items.js';
import { skillsState, getOmniMult } from '../modules/skills.svelte.js';
import { recordKill } from '../modules/bestiary.svelte.js';
import { getSpeciesDropBonus, getQuality } from '../modules/bestiaryBonuses.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal, type DecimalSource } from '../systems/decimal.js';
import { getEffectiveCombatStats } from '../modules/combat.svelte.js';
import { LEVEL_WALL } from '../modules/overclock.svelte.js';
import type { Enemy } from './aiSystem.js';

const XP_REWARD_EXP_BASE = 1.08;
const MAX_BATCH_LEVELS = 100000;
const EXACT_BATCH_SUM_LIMIT = 256;
const MAX_SAFE_LEVEL_NUM = 1e9;

function getSafeLevelNumber(level: DecimalSource): number {
  const levelDec = level instanceof Decimal ? level : new Decimal(level || 1);
  const rawLevelNum = levelDec.toNumber();
  return isFinite(rawLevelNum)
    ? Math.min(Math.max(1, rawLevelNum), MAX_SAFE_LEVEL_NUM)
    : MAX_SAFE_LEVEL_NUM;
}

function getGeometricWeightedIndex(count: number): number {
  if (count <= 1) return 0;

  const g = XP_COST_EXP_BASE;
  const invPow = Math.pow(g, -count);
  const denom = (g - 1) * (1 - invPow);
  const numerator = (count * (g - 1)) - g + (g * invPow);
  const weighted = numerator / denom;

  return isFinite(weighted)
    ? Math.min(Math.max(0, weighted), count - 1)
    : count - 1;
}

function exactCostForLevels(startLevel: Decimal, count: number): Decimal {
  let total = new Decimal(0);
  for (let i = 0; i < count; i++) {
    total = total.add(getXpNeededForLevel(startLevel.add(i)));
  }
  return total;
}

function estimatedCostForLevels(startLevel: Decimal, count: number): Decimal {
  if (count <= 0) return new Decimal(0);
  if (count <= EXACT_BATCH_SUM_LIMIT) return exactCostForLevels(startLevel, count);

  const startCost = getXpNeededForLevel(startLevel);
  const startLevelNum = getSafeLevelNumber(startLevel);
  const weightedLevelNum = Math.min(
    MAX_SAFE_LEVEL_NUM,
    startLevelNum + getGeometricWeightedIndex(count)
  );
  const startPoly = Math.max(1, Math.pow(startLevelNum, XP_COST_POLY_POWER));
  const weightedPoly = Math.max(1, Math.pow(weightedLevelNum, XP_COST_POLY_POWER));
  const polyRatio = weightedPoly / startPoly;
  const geomSum = new Decimal(XP_COST_EXP_BASE).pow(count).sub(1).div(XP_COST_EXP_BASE - 1);

  return startCost.mul(geomSum).mul(polyRatio);
}

export const rewardSystem = {
  grantRewards(enemy: Enemy | null, multiplier: DecimalSource = 1): void {
    if (!enemy) return;
    
    // --- KILLS ---
    let killsInThisEvent = new Decimal(1);

    const cleaveSkill = skillsState.skills.find(s => s.id === 'cleave');
    if (cleaveSkill && cleaveSkill.tierIndex > 0 && Math.random() < 0.4) {
      const cleaveAmounts = [0, 2, 5, 12, 25, 50, 100, 250];
      const extra = new Decimal(cleaveAmounts[Math.min(cleaveSkill.tierIndex, cleaveAmounts.length - 1)]);
      killsInThisEvent = killsInThisEvent.add(extra);
    }

    const totalKills = killsInThisEvent.mul(multiplier);
    character.kills = character.kills.add(totalKills);
    recordKill(enemy, totalKills);

    incrementKills(totalKills.toNumber());

    // --- XP CALCULATION ---
    let xpMult = new Decimal(1);
    const xpSkill = skillsState.skills.find(s => s.id === 'xp_boost');
    if (xpSkill && xpSkill.tierIndex > 0) xpMult = xpMult.add(0.2 * xpSkill.tierIndex);

    const enemyLvl = enemy.level instanceof Decimal ? enemy.level : new Decimal(enemy.level || 1);

    const sealMult = new Decimal(10).pow(character.seals || 0);
    const omni = getOmniMult();
    
    // Combat XP grows slower than level costs so progression systems matter.
    const xpGrowth = new Decimal(XP_REWARD_EXP_BASE).pow(enemyLvl.sub(1).max(0));
    const baseExp = new Decimal(10).mul(xpGrowth);
    
    let xpGain = baseExp.mul(totalKills).mul(xpMult).mul(sealMult).mul(omni);
    
    if (!character.totalXp || character.totalXp.m === 0) {
      character.totalXp = character.xp; // Fallback, totalXp is deprecated
    }

    character.xp = character.xp.add(xpGain).max(0);
    character.totalXp = character.totalXp.add(xpGain).max(0);

    this.processLevelUps();
    this._doLoot(enemy, totalKills);
    this._doFragments(totalKills);
  },

  _doFragments(totalKills: Decimal): void {
    const baseFrag = new Decimal(character.level.div(200).add(0.1)).mul(1 + (character.seals || 0));
    let fragGain = baseFrag.mul(totalKills);

    // Data Siphon Skill
    const siphon = skillsState.skills.find(s => s.id === 'data_siphon');
    if (siphon && siphon.tierIndex > 0) {
      const siphonMult = new Decimal(2).pow(siphon.tierIndex).mul(5);
      fragGain = fragGain.add(siphonMult.mul(totalKills));
    }

    character.skillFragments = character.skillFragments.add(fragGain);
    character.totalFragments = character.totalFragments.add(fragGain);
  },

  _doLoot(enemy: Enemy, totalKills: Decimal): void {
    const bestiaryDropBonus = getSpeciesDropBonus(enemy.id);
    const quality = getQuality();
    const lootBoost = (skillsState.skills.find(s => s.id === 'loot_boost')?.tierIndex || 0) * 0.15;
    const dropChance = Math.min(0.98, 0.7 + ((character.seals || 0) * 0.05) + (character.dropBonus || 0) + lootBoost + bestiaryDropBonus);

    const killsNum = totalKills.toNumber();
    const safeKillsForLoot = isFinite(killsNum) ? killsNum : 1e9;

    if (quality >= 100) {
      const name = itemNames[Math.floor(Math.random() * itemNames.length)];
      itemRarities.forEach(rarity => {
        addItem(name, rarity, safeKillsForLoot);
        character.totalDrops = (character.totalDrops || 0) + safeKillsForLoot;
      });
    } else {
      let dropCount = Math.floor(safeKillsForLoot * dropChance);

      // FIXED: death paths that grant fractional "kills" (e.g. grantRewards(enemy, 0.1))
      // would otherwise always truncate to 0 drops.
      if (dropCount <= 0 && safeKillsForLoot > 0) dropCount = 1;

      if (dropCount > 0) {
        let rIdx = 0;
        const upgradeChance = 0.45 + (quality / 200) + (lootBoost / 2);
        while (Math.random() < upgradeChance && rIdx < itemRarities.length - 1) rIdx++;
        
        const name = itemNames[Math.floor(Math.random() * itemNames.length)];
        
        // When a higher rarity is rolled, drop ALL lower rarities of that same item as well
        for (let i = 0; i <= rIdx; i++) {
          const rarity = itemRarities[i];
          addItem(name, rarity, dropCount);
          character.totalDrops = (character.totalDrops || 0) + dropCount;
        }

        if (rIdx >= 3) {
          const rarity = itemRarities[rIdx];
          addLog(`[LOOT] ${name} (${rarity}) x${formatNumber(dropCount)} (+ tiers)`, 'loot');
        }
      }
    }
  },

  /**
   * Batch level-up for offline / skipTime.
   * XP costs are exponential plus a polynomial factor, so use the old
   * geometric result as an upper bound and refine it with binary search.
   */
  batchLevelUps(): number {
    if (!character.xp.gte(character.xpNeeded)) return 0;
    if (character.level.gte(LEVEL_WALL)) {
      character.xp = new Decimal(0);
      return 0;
    }

    const availableXP = new Decimal(character.xp);
    // Current level cost gives the geometric estimate a practical upper bound.
    const C = character.xpNeeded;
    const g = XP_COST_EXP_BASE;
    const logG = Math.log10(g);

    // ratio = 1 + X * (g-1) / C
    const ratio = availableXP.mul(g - 1).div(C).add(1);
    const log10Ratio = ratio.log10();

    if (!isFinite(log10Ratio) || log10Ratio <= 0) {
      // Edge case – do a single level up
      character.xp = character.xp.sub(C).max(0);
      character.level = character.level.add(1);
      updateDerivedStats();
      return 1;
    }

    let n = Math.floor(log10Ratio / logG);
    if (n < 1) n = 1;
    if (n > MAX_BATCH_LEVELS) n = MAX_BATCH_LEVELS;

    // Clamp to the level wall
    const roomToWall = LEVEL_WALL.sub(character.level).toNumber();
    if (isFinite(roomToWall) && n > roomToWall) n = Math.max(0, Math.floor(roomToWall));

    if (n <= 0) {
      character.xp = new Decimal(0); // Drain XP at wall
      return 0;
    }

    const startLevel = new Decimal(character.level);
    let lo = 0;
    let hi = n;

    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (estimatedCostForLevels(startLevel, mid).lte(availableXP)) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    if (lo <= 0) {
      character.xp = character.xp.sub(character.xpNeeded).max(0);
      character.level = character.level.add(1);
      updateDerivedStats();
      return 1;
    }

    n = lo;

    const xpConsumed = estimatedCostForLevels(startLevel, n);
    character.xp = character.xp.sub(xpConsumed).max(0);
    character.level = character.level.add(n);
    updateDerivedStats();
    return n;
  },

  processLevelUps(): void {
    let levelsGainedNum = 0;
    while (character.xp.gte(character.xpNeeded) && levelsGainedNum < 10000) {
      // Hard wall at 1ZZZ — must Overclock to continue
      if (character.level.gte(LEVEL_WALL)) {
        character.xp = new Decimal(0); // Drain excess XP so it doesn't pile up
        break;
      }
      character.xp = character.xp.sub(character.xpNeeded);
      character.level = character.level.add(1);
      updateDerivedStats(); // Updates xpNeeded and base stats for next iteration
      levelsGainedNum++;
    }
    
    if (levelsGainedNum > 0) {
      character.momentum *= 0.35;
      character.overcharge = 0;
      character.skillFragments = character.skillFragments.add(levelsGainedNum);
      
      const stats = getEffectiveCombatStats();
      character.stats.hp = stats.hp; // Heal to full on level up
      character.stats.defense = stats.def;
      addLog(`[LVL] Reached Level ${formatNumber(character.level)} (+${formatNumber(levelsGainedNum)})`, 'system');
    }
  }
};

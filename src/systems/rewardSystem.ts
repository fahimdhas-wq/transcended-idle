
import {
  character,
  updateDerivedStats,
  applyMomentumSoftcap,
  applyOverchargeSoftcap,
  safeKills,
  getXpNeededForLevel,
  STAT_GROWTH_BASE,
  XP_REWARD_BASE,
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
import { addAscensionShards } from '../modules/ascension.svelte.js';
import type { Enemy } from './aiSystem.js';
import { getXpMultiplier, getFragmentMultiplier, getDropRateMultiplier, trackFragments } from '../modules/dailyChallenge.svelte.js';
import { getRiftTotalBonus } from '../modules/rift.svelte.js';
import { getParadoxXpMult } from '../modules/paradox.svelte.js';
import { getBoostXpMult } from '../modules/activePlay.svelte.js';

const MAX_BATCH_LEVELS = 100000;
const EXACT_BATCH_SUM_LIMIT = 256;
const MAX_SAFE_LEVEL_NUM = 1e9;

function exactCostForLevels(startLevel: Decimal, count: number): Decimal {
    let total = Decimal.ZERO;
  for (let i = 0; i < count; i++) {
    total = total.add(getXpNeededForLevel(startLevel.add(i)));
  }
  return total;
}

function costForLevels(startLevel: Decimal, count: number): Decimal {
  if (count <= 0) return Decimal.ZERO;
  if (count <= EXACT_BATCH_SUM_LIMIT) return exactCostForLevels(startLevel, count);

  const startCost = getXpNeededForLevel(startLevel);
  const r = new Decimal(STAT_GROWTH_BASE);
  const geomSum = r.pow(count).sub(1).div(r.sub(1));
  return startCost.mul(geomSum);
}

export const rewardSystem = {
  grantRewards(enemy: Enemy | null, multiplier: DecimalSource = 1): void {
    if (!enemy) return;
    
    // --- KILLS ---
    let killsInThisEvent = Decimal.ONE;

    const cleaveSkill = skillsState.skills.find(s => s.id === 'cleave');
    if (cleaveSkill && cleaveSkill.tierIndex > 0) {
      const sealMult = Decimal.TEN.pow(character.seals || 0);
      const activateChance = cleaveSkill.tierIndex >= 21 ? 1.0 : 0.4;
      if (Math.random() < activateChance) {
        const baseCleaveAmounts = [0, 2, 5, 12, 25, 50, 100, 250];
        let extraKills: Decimal;
        if (cleaveSkill.tierIndex < baseCleaveAmounts.length) {
          extraKills = new Decimal(baseCleaveAmounts[cleaveSkill.tierIndex]);
        } else {
          extraKills = new Decimal(250).mul(Decimal.TWO.pow(cleaveSkill.tierIndex - 7));
        }
        extraKills = extraKills.mul(sealMult);
        killsInThisEvent = killsInThisEvent.add(extraKills);
      }
    }

    const totalKills = killsInThisEvent.mul(multiplier);
    character.kills = character.kills.add(totalKills);
    recordKill(enemy, totalKills);
    addAscensionShards(enemy.level, totalKills);

    incrementKills(totalKills.toNumber());

    // --- XP CALCULATION ---
    let xpMult = Decimal.ONE;
    const xpSkill = skillsState.skills.find(s => s.id === 'xp_boost');
    if (xpSkill && xpSkill.tierIndex > 0) {
      xpMult = xpMult.add(0.5 * Math.pow(2, xpSkill.tierIndex - 1));
    }

    const enemyLvl = enemy.level instanceof Decimal ? enemy.level : new Decimal(enemy.level || 1);

    const sealMult = Decimal.TEN.pow(character.seals || 0);
    const omni = getOmniMult();
    
    const baseExp = XP_REWARD_BASE.mul(new Decimal(STAT_GROWTH_BASE).pow(enemyLvl.sub(1).max(0)));
    
let xpGain = baseExp.mul(totalKills).mul(xpMult).mul(sealMult).mul(omni).mul(getXpMultiplier()).mul(1 + getRiftTotalBonus('xp')).mul(getParadoxXpMult()).mul(getBoostXpMult());

    character.xp = character.xp.add(xpGain).max(0);

    let fragGain = character.level.div(200).add(0.1).mul(1 + (character.seals || 0)).mul(getFragmentMultiplier()).mul(totalKills);
    const siphon = skillsState.skills.find(s => s.id === 'data_siphon');
    if (siphon && siphon.tierIndex > 0) {
      const siphonMult = new Decimal(25).mul(Decimal.TWO.pow(siphon.tierIndex - 1)).mul(totalKills).mul(sealMult);
      fragGain = fragGain.add(siphonMult);
    }
    character.skillFragments = character.skillFragments.add(fragGain);
    character.totalFragments = character.totalFragments.add(fragGain);
    trackFragments(fragGain);

    this.processLevelUps();
    this._doLoot(enemy, totalKills);
  },

  _doLoot(enemy: Enemy, totalKills: Decimal): void {
    const bestiaryDropBonus = getSpeciesDropBonus(enemy.id);
    const quality = getQuality();
    // Deep Scan Skill — doubles each tier
    const lootSkill = skillsState.skills.find(s => s.id === 'loot_boost');
    const lootBoost = lootSkill && lootSkill.tierIndex > 0 ? 0.15 * Math.pow(2, lootSkill.tierIndex - 1) : 0;
    const dropChance = Math.min(0.98, 0.7 + ((character.seals || 0) * 0.05) + (character.dropBonus || 0) + lootBoost + bestiaryDropBonus) * getDropRateMultiplier();

    // Cap kills to prevent Number overflow
    const MAX_KILLS_FOR_LOOT = 1e9;
    const killsNum = Math.min(totalKills.toNumber(), MAX_KILLS_FOR_LOOT);
    const safeKillsForLoot = isFinite(killsNum) ? killsNum : MAX_KILLS_FOR_LOOT;

    if (quality >= 100) {
      const name = itemNames[Math.floor(Math.random() * itemNames.length)];
      itemRarities.forEach(rarity => {
        addItem(name, rarity, safeKillsForLoot);
        character.totalDrops = (character.totalDrops || 0) + safeKillsForLoot;
      });
    } else {
      let baseDrops = Math.floor(safeKillsForLoot * dropChance);
      let dropCount = baseDrops;

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
   * XP cost is pure exponential: 100 * 1.15^(level-1).
   * Closed-form solution using geometric series.
   */
  batchLevelUps(): number {
    if (!character.xp.gte(character.xpNeeded)) return 0;

    const C = character.xpNeeded;
    const X = character.xp;
    const r = STAT_GROWTH_BASE;

    // n = floor(log_r(1 + X * (r-1) / C))
    const inner = X.mul(r - 1).div(C).add(1);
    const logR = Math.log10(r);
    const logInner = inner.log10();

    if (!isFinite(logInner) || logInner <= 0) {
      character.xp = character.xp.sub(C).max(0);
      character.level = character.level.add(1);
      updateDerivedStats();
      return 1;
    }

    let n = Math.floor(logInner / logR);
    if (n < 1) n = 1;
    if (n > MAX_BATCH_LEVELS) n = MAX_BATCH_LEVELS;

    const startLevel = character.level;
    const xpConsumed = costForLevels(startLevel, n);
    if (xpConsumed.gt(X)) n = Math.max(0, n - 1);
    if (n <= 0) {
      character.xp = character.xp.sub(C).max(0);
      character.level = character.level.add(1);
      updateDerivedStats();
      return 1;
    }

    const finalCost = costForLevels(startLevel, n);
    character.xp = character.xp.sub(finalCost).max(0);
    character.level = character.level.add(n);
    updateDerivedStats();
    return n;
  },

  processLevelUps(): number {
    let levelsGainedNum = 0;
    while (character.xp.gte(character.xpNeeded)) {
      character.xp = character.xp.sub(character.xpNeeded);
      character.level = character.level.add(1);
      updateDerivedStats(); // Updates xpNeeded and base stats for next iteration
      levelsGainedNum++;
    }

    if (levelsGainedNum > 0) {
      character.overcharge = 0;
      character.skillFragments = character.skillFragments.add(levelsGainedNum);

      const stats = getEffectiveCombatStats();
      character.stats.hp = stats.hp; // Heal to full on level up
      character.stats.defense = stats.def;
      addLog(`[LVL] Reached Level ${formatNumber(character.level)} (+${formatNumber(levelsGainedNum)})`, 'system');
    }
    return levelsGainedNum;
  }
};


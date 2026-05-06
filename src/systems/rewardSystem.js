import { character, updateDerivedStats, applyMomentumSoftcap, applyOverchargeSoftcap, safeKills } from '../modules/character.svelte.js';
import { addLog, incrementKills } from '../ui/LogPanelState.svelte.js';
import { addItem } from '../modules/inventory.svelte.js';
import { itemRarities, itemNames } from '../data/items.js';
import { skillsState, getOmniMult } from '../modules/skills.svelte.js';
import { recordKill } from '../modules/bestiary.svelte.js';
import { getSpeciesDropBonus, getQuality } from '../modules/bestiaryBonuses.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { Decimal } from '../systems/decimal.js';
import { getEffectiveCombatStats } from '../modules/combat.svelte.js';
import { showToast } from '../stores/uiStore.svelte.js';
import { LEVEL_WALL } from '../modules/overclock.svelte.js';

export const rewardSystem = {
  grantRewards(enemy, multiplier = 1) {
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
    
    // XP scales identically to Player level requirements
    const xpGrowth = new Decimal(1.15).pow(enemyLvl.sub(1).max(0));
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

  _doFragments(totalKills) {
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

  _doLoot(enemy, totalKills) {
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
      const dropCount = Math.floor(safeKillsForLoot * dropChance);
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
          if (rIdx >= 4) showToast(`✦ MYTHIC DROP: ${name}!`, 'loot');
          else showToast(`★ ${rarity}: ${name}`, 'loot');
        }
      }
    }
  },

  /**
   * O(1) batch level-up using geometric series math.
   * Unlike processLevelUps(), this has NO iteration cap.
   * For offline / skipTime use only.
   *
   * Math: sum of XP from level L over n levels:
   *   XP_used = C * (1.15^n - 1) / 0.15
   * Solving for n given available XP X:
   *   n = floor( log_1.15(1 + X * 0.15 / C) )
   */
  batchLevelUps() {
    if (!character.xp.gte(character.xpNeeded)) return 0;
    if (character.level.gte(LEVEL_WALL)) {
      character.xp = new Decimal(0);
      return 0;
    }

    const X = character.xp;
    const C = character.xpNeeded;
    const g = 1.15;
    const logG = Math.log10(g);

    // ratio = 1 + X * (g-1) / C
    const ratio = X.mul(g - 1).div(C).add(1);
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

    // Clamp to the level wall
    const roomToWall = LEVEL_WALL.sub(character.level).toNumber();
    if (isFinite(roomToWall) && n > roomToWall) n = Math.max(0, Math.floor(roomToWall));

    if (n <= 0) {
      character.xp = new Decimal(0); // Drain XP at wall
      return 0;
    }

    // XP consumed = C * (g^n - 1) / (g - 1)
    const xpConsumed = new Decimal(g).pow(n).sub(1).mul(C).div(g - 1);
    character.xp = character.xp.sub(xpConsumed).max(0);
    character.level = character.level.add(n);
    updateDerivedStats();
    return n;
  },

  processLevelUps() {
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

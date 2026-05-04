import { character } from './character.svelte.js';
import { aiSystem } from '../systems/aiSystem.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { skillsState, getOmniMult } from './skills.svelte.js';
import { getOverclockMultiplier } from './overclock.svelte.js';
import { 
  getSpeciesDamageBonus, 
  getGlobalStatBoost, 
  getDamageMultiplier, 
  getSoulMult 
} from './bestiaryBonuses.js';
import { getAchievementMult, achievementDefs, achievementState } from '../systems/achievementSystem.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { gameLoop } from '../core/gameLoop.svelte.js';

export const combatState = $state({
  enemy: null,
  isFighting: false,
  combatStartTick: 0
});

export function spawnEnemy() {
  combatState.enemy = aiSystem.generateEnemy(character);
  combatState.isFighting = true;
  combatState.combatStartTick = gameLoop.totalGameTicks;
}

// Cache for getEffectiveCombatStats (expires each game tick)
let cachedStats = null;
let cacheTickId = -1;

/** Force-invalidates the stat cache so the next call recalculates fresh. */
export function flushStatCache() {
  cachedStats = null;
  cacheTickId = -1;
}

/**
 * NEW: Unified Stat Engine
 * Calculates all effective stats for combat in one pass.
 * Converts burst skills into per-tick averages for stability and offline parity.
 */
export function getEffectiveCombatStats() {
  // Return cached if still valid for this tick
  if (cachedStats && cacheTickId === gameLoop.totalGameTicks) {
    return cachedStats;
  }

  const sealMult = new Decimal(10).pow(character.seals || 0);
  const omniMult = getOmniMult();
  const soulMult = getSoulMult();
  const awakenMult = new Decimal(1.5).pow(character.awakeningStage || 0);
  const bestiaryBoost = new Decimal(getGlobalStatBoost()).add(1);
  const overclockMult = getOverclockMultiplier();

  // Base Multiplier (applied to most stats)
  const baseMult = sealMult.mul(omniMult).mul(soulMult).mul(awakenMult).mul(bestiaryBoost).mul(overclockMult);
  
  // Specific Stat Multipliers
  const atkMult = baseMult.mul(getAchievementMult('atk')).mul(getDamageMultiplier());
  const hpMult  = baseMult.mul(getAchievementMult('hp'));
  const regMult = baseMult.mul(getAchievementMult('regen'));

  // Core Stats
  let finalAtk = character.stats.attack.mul(atkMult);
  let finalMaxHp = character.stats.maxHp.mul(hpMult);
  let finalMaxDef = character.stats.maxDefense.mul(hpMult);
  let finalRegHp = character.stats.regenHp.mul(regMult);
  let finalRegDef = character.stats.regenDef.mul(regMult);

  let finalCritChance = Math.min(1.0, (character.stats.critChance || 0) + getAchievementCritBonus());
  let finalCritMult = new Decimal(2); // Base 2x
  let finalSkipChance = Math.min(1.0, character.stats.skipDamageChance || 0);

  // Skill Stat Conversions (Converting "on-use" to "per-tick")
  skillsState.skills.forEach(skill => {
    if (skill.tierIndex <= 0) return;
    const tierPower = new Decimal(2).pow(skill.tierIndex);

    if (skill.id === 'emp_strike') {
      // 3x ATK per "activation". Assuming activate every tick if autoCast.
      finalAtk = finalAtk.add(character.stats.attack.mul(3).mul(tierPower).mul(atkMult));
    } else if (skill.id === 'chain_hack') {
      // 2x ATK for 3 ticks = 6x ATK total per activation.
      finalAtk = finalAtk.add(character.stats.attack.mul(6).mul(tierPower).mul(atkMult));
    } else if (skill.id === 'overclock') {
      finalAtk = finalAtk.mul(tierPower.mul(1.5));
    } else if (skill.id === 'nano_repair') {
      // 20% Max HP/SH per activation.
      finalRegHp = finalRegHp.add(finalMaxHp.mul(0.2).mul(tierPower));
      finalRegDef = finalRegDef.add(finalMaxDef.mul(0.2).mul(tierPower));
    } else if (skill.id === 'shield_surge') {
      // 30% Max SH per activation + 1% skip per tier.
      finalRegDef = finalRegDef.add(finalMaxDef.mul(0.3).mul(tierPower));
      finalSkipChance = Math.min(1.0, finalSkipChance + (0.01 * skill.tierIndex));
    } else if (skill.id === 'crit_surge') {
      finalCritMult = finalCritMult.add(new Decimal(0.5).mul(skill.tierIndex));
    }
  });

  // Limit Break Logic
  if (!character.statsUnlocked && finalCritChance >= 1.0) {
    character.statsUnlocked = true;
    addLog("[SYSTEM] LIMIT BREAK: Skip Damage Chance unlocked!", "awakening");
  }

  // Final average damage per tick (including crit)
  const avgDmgPerTick = finalAtk.mul(new Decimal(1 - finalCritChance).add(new Decimal(finalCritChance).mul(finalCritMult)));

  const result = {
    atk: avgDmgPerTick,
    hp: finalMaxHp,
    def: finalMaxDef,
    regenHp: finalRegHp,
    regenDef: finalRegDef,
    critChance: finalCritChance,
    skipChance: finalSkipChance
  };

  // Cache result for this tick
  cachedStats = result;
  cacheTickId = gameLoop.totalGameTicks;

  return result;
}

function getAchievementCritBonus() {
  let bonus = 0;
  achievementDefs.forEach(ach => {
    if (achievementState.unlocked[ach.id] && ach.bonus.crit) {
      bonus += ach.bonus.crit;
    }
  });
  return bonus;
}

export function performCombatTick(ticks = 1) {
  let ticksRemaining = ticks;
  let safetyLoop = 0;

  const stats = getEffectiveCombatStats();

  while (ticksRemaining > 0 && safetyLoop < 50) {
    safetyLoop++;

    if (!combatState.isFighting || !combatState.enemy) {
      spawnEnemy();
      if (!combatState.enemy) break;
    }

    const enemy = combatState.enemy;
    const currentDmg = stats.atk.mul(getSpeciesDamageBonus(enemy.id));

    if (currentDmg.lte(0)) {
        // Apply passive regen even if stuck
        character.stats.hp = character.stats.hp.add(stats.regenHp.mul(ticksRemaining));
        if (character.stats.hp.gt(stats.hp)) character.stats.hp = stats.hp;
        character.stats.defense = character.stats.defense.add(stats.regenDef.mul(ticksRemaining));
        if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;
        
        ticksRemaining = 0;
        break;
    }

    // --- INSTAKILL PATH ---
    if (currentDmg.gte(enemy.hp)) {
      const ticksPerKill = Math.max(0.01, enemy.hp.div(currentDmg).toNumber());
      const possibleKills = Math.floor(ticksRemaining / ticksPerKill);
      
      if (possibleKills >= 1) {
          const timeUsed = possibleKills * ticksPerKill;

          character.stats.hp = character.stats.hp.add(stats.regenHp.mul(timeUsed));
          if (character.stats.hp.gt(stats.hp)) character.stats.hp = stats.hp;
          character.stats.defense = character.stats.defense.add(stats.regenDef.mul(timeUsed));
          if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;

          rewardSystem.grantRewards(enemy, new Decimal(possibleKills));
          
          ticksRemaining = 0;
          combatState.isFighting = false;
          combatState.enemy = null;
          break;
      } else {
          enemy.hp = new Decimal(0);
      }
    }

    // --- NORMAL COMBAT PATH ---
    const ticksToKill = enemy.hp.div(currentDmg).toNumber();
    const ticksUsed = Math.min(ticksRemaining, ticksToKill);
    
    character.stats.hp = character.stats.hp.add(stats.regenHp.mul(ticksUsed));
    if (character.stats.hp.gt(stats.hp)) character.stats.hp = stats.hp;
    character.stats.defense = character.stats.defense.add(stats.regenDef.mul(ticksUsed));
    if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;

    enemy.hp = enemy.hp.sub(currentDmg.mul(ticksUsed));
    ticksRemaining -= ticksUsed;

    if (enemy.hp.lte(0)) {
      rewardSystem.grantRewards(enemy);
      combatState.isFighting = false;
      combatState.enemy = null;
    } else {
      const isSkipped = Math.random() < stats.skipChance;
      const enemyDmg = isSkipped ? new Decimal(0) : enemy.attack.mul(ticksUsed);

      if (character.stats.defense.gte(enemyDmg)) {
        character.stats.defense = character.stats.defense.sub(enemyDmg);
      } else {
        const rem = enemyDmg.sub(character.stats.defense);
        character.stats.defense = new Decimal(0);
        character.stats.hp = character.stats.hp.sub(rem);
      }
      
      if (character.stats.defense.lt(0)) character.stats.defense = new Decimal(0);
      if (character.stats.hp.lt(0)) character.stats.hp = new Decimal(0);

      if (character.stats.hp.lte(0)) {
        character.stats.hp = character.stats.maxHp;
        character.vergeCount++;
        addLog(`[SURGE] Defeated! Gained partial XP...`, 'awakening');
        rewardSystem.grantRewards(enemy, 0.1);
        combatState.isFighting = false;
        combatState.enemy = null;
      }
    }

    if (ticksRemaining < 0.001) ticksRemaining = 0;
  }
}

// Deprecated functions for cleanup (to be removed once UI is updated if needed)
export function getGlobalStatMult(type) {
    const s = getEffectiveCombatStats();
    if (type === 'atk') return s.atk.div(character.stats.attack);
    if (type === 'hp') return s.hp.div(character.stats.maxHp);
    if (type === 'regen') return s.regenHp.div(character.stats.regenHp);
    return new Decimal(1);
}
export function getGlobalCritChance() { return getEffectiveCombatStats().critChance; }

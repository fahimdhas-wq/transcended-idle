
import { character } from './character.svelte.js';
import { getAscensionBonus, getAllStatsBonus } from './ascension.svelte.js';
import { getRiftTotalBonus } from './rift.svelte.js';
import { getParadoxAtkMult, getParadoxHpMult, getParadoxAllStatsBonus } from './paradox.svelte.js';
import { getPowerAtkMult } from './activePlay.svelte.js';
import { generateProceduralEnemy, recordProceduralKill } from './procedural.svelte.js';
import { aiSystem } from '../systems/aiSystem.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { skillsState, getOmniMult, setFlushCacheCallback } from './skills.svelte.js';
import { 
  getSpeciesDamageBonus, 
  getGlobalStatBoost, 
  getDamageMultiplier, 
  getSoulMult 
} from './bestiaryBonuses.js';
import { getAchievementMult, achievementDefs, achievementState } from '../systems/achievementSystem.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { formatNumber } from '../systems/scalingSystem.js';
import { getTotalTicks } from '../core/tickState.js';
import type { Enemy } from '../systems/aiSystem.js';

export interface CombatStats {
  atk: Decimal;
  hp: Decimal;
  def: Decimal;
  regenHp: Decimal;
  regenDef: Decimal;
  critChance: number;
  skipChance: number;
}

export interface CombatState {
  enemy: Enemy | null;
  isFighting: boolean;
  combatStartTick: number;
  kills: number;          // Kill counter for daily challenge
  lastHitCrit: boolean;   // Flag for crit tracking
}

export const combatState: CombatState = $state({
  enemy: null,
  isFighting: false,
  combatStartTick: 0,
  kills: 0,
  lastHitCrit: false
});

// Register callback to break circular dep: skills → combat → skills
setFlushCacheCallback(flushStatCache);

export function spawnEnemy(): void {
  const procedural = Math.random() < 0.1;
  if (procedural) {
    const procEnemy = generateProceduralEnemy(character.level);
    if (procEnemy) {
      combatState.enemy = procEnemy;
      combatState.isFighting = true;
      combatState.combatStartTick = getTotalTicks();
      return;
    }
  }
  combatState.enemy = aiSystem.generateEnemy(character);
  combatState.isFighting = true;
  combatState.combatStartTick = getTotalTicks();
}

// Cache for getEffectiveCombatStats (expires each game tick)
let cachedStats: CombatStats | null = null;
let cacheTickId = -1;

/** Force-invalidates the stat cache so the next call recalculates fresh. */
export function flushStatCache(): void {
  cachedStats = null;
  cacheTickId = -1;
}

/**
 * NEW: Unified Stat Engine
 * Calculates all effective stats for combat in one pass.
 * Converts burst skills into per-tick averages for stability and offline parity.
 */
export function getEffectiveCombatStats(): CombatStats {
  // Return cached if still valid for this tick
  if (cachedStats && cacheTickId === getTotalTicks()) {
    return cachedStats;
  }

  const sealMult = Decimal.TEN.pow(character.seals || 0);
  const omniMult = getOmniMult();
  const soulMult = getSoulMult();
  const bestiaryBoost = new Decimal(getGlobalStatBoost()).add(1);

  // Base Multiplier (applied to most stats)
  const baseMult = sealMult.mul(omniMult).mul(soulMult).mul(bestiaryBoost);
  
  // Specific Stat Multipliers
  const atkMult = baseMult.mul(getAchievementMult('atk')).mul(getDamageMultiplier());
  const hpMult  = baseMult.mul(getAchievementMult('hp'));
  const regMult = baseMult.mul(getAchievementMult('regen'));

  // Ascension stat bonuses
  const paradoxAll = getParadoxAllStatsBonus();
  const ascAll = getAllStatsBonus() + paradoxAll;
  const ascAtk = getAscensionBonus('atk') + ascAll;
  const ascHp = getAscensionBonus('hp') + ascAll;
  const ascDef = getAscensionBonus('def') + ascAll;
  const ascCrit = getAscensionBonus('critChance');
  const ascCritDmg = getAscensionBonus('critDmg');

  // Rift bonuses
  const riftAll = getRiftTotalBonus('allStats');
  const riftAtk = getRiftTotalBonus('atk');
  const riftHp = getRiftTotalBonus('hp');
  const riftCritDmg = getRiftTotalBonus('critDmg');

  // Paradox bonuses
  const paradoxAtk = getParadoxAtkMult();
  const paradoxHp = getParadoxHpMult();

  // Active Play bonus
  const powerAtk = getPowerAtkMult();

  // Core Stats
  let finalAtk = character.stats.attack.mul(atkMult).mul(1 + ascAtk + riftAll + riftAtk).mul(paradoxAtk).mul(powerAtk);
  let finalMaxHp = character.stats.maxHp.mul(hpMult).mul(1 + ascHp + riftAll + riftHp).mul(paradoxHp);
  let finalMaxDef = character.stats.maxDefense.mul(hpMult).mul(1 + ascDef + riftAll);
  let finalRegHp = character.stats.regenHp.mul(regMult);
  let finalRegDef = character.stats.regenDef.mul(regMult);

  let finalCritChance = Math.min(1.0, (character.stats.critChance || 0) + getAchievementCritBonus() + ascCrit);
  let finalCritMult = Decimal.TWO.mul(1 + ascCritDmg + riftCritDmg); // Base 2x × ascension + rift crit damage
  let finalSkipChance = Math.min(1.0, character.stats.skipDamageChance || 0);

  // Skill Stat Conversions (Converting "on-use" to "per-tick")
  skillsState.skills.forEach(skill => {
    if (skill.tierIndex <= 0) return;
    const tierPower = Decimal.TWO.pow(skill.tierIndex - 1); // 1, 2, 4, 8... for tier 1, 2, 3...

    if (skill.id === 'emp_strike') {
      // 3x ATK per "activation". Assuming activate every tick if autoCast.
      finalAtk = finalAtk.add(character.stats.attack.mul(3).mul(tierPower).mul(atkMult));
    } else if (skill.id === 'chain_hack') {
      // 2x ATK for 3 ticks = 6x ATK total per activation.
      finalAtk = finalAtk.add(character.stats.attack.mul(6).mul(tierPower).mul(atkMult));
    } else if (skill.id === 'nano_repair') {
      // 20% Max HP/SH per activation.
      finalRegHp = finalRegHp.add(finalMaxHp.mul(0.2).mul(tierPower));
      finalRegDef = finalRegDef.add(finalMaxDef.mul(0.2).mul(tierPower));
    } else if (skill.id === 'shield_surge') {
      // 30% Max SH per activation + 1% skip per tier.
      finalRegDef = finalRegDef.add(finalMaxDef.mul(0.3).mul(tierPower));
      finalSkipChance = Math.min(1.0, finalSkipChance + (0.01 * skill.tierIndex));
    } else if (skill.id === 'crit_surge') {
      finalCritMult = finalCritMult.add(Decimal.ZERO_POINT_FIVE.mul(tierPower));
    }
  });

  // Level-based damage multiplier — kills speed up at high levels
  const levelDmgMult = character.level.pow(0.5).max(1);
  finalAtk = finalAtk.mul(levelDmgMult);
  finalRegHp = finalRegHp.mul(levelDmgMult);
  finalRegDef = finalRegDef.mul(levelDmgMult);

  // Limit Break Logic
  if (!character.statsUnlocked && finalCritChance >= 1.0) {
    character.statsUnlocked = true;
    addLog("[SYSTEM] LIMIT BREAK: Skip Damage Chance unlocked!", "awakening");
  }

  // Final average damage per tick (including crit)
  const critAvgMult = 1 - finalCritChance + finalCritChance * finalCritMult.toNumber();
  const avgDmgPerTick = finalAtk.mul(critAvgMult);

  const result: CombatStats = {
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
  cacheTickId = getTotalTicks();

  return result;
}

function getAchievementCritBonus(): number {
  let bonus = 0;
  achievementDefs.forEach(ach => {
    if (achievementState.unlocked[ach.id] && ach.bonus.crit) {
      bonus += ach.bonus.crit;
    }
  });
  return bonus;
}

export function performCombatTick(ticks: number = 1): void {
  let ticksRemaining = ticks;
  let safetyLoop = 0;

  const stats = getEffectiveCombatStats();

  // Probabilistic crit tracking for daily challenge
  const expectedCrits = ticks * stats.critChance;
  if (expectedCrits >= 1) {
    const critsToAdd = Math.floor(expectedCrits);
    for (let i = 0; i < critsToAdd; i++) {
      combatState.lastHitCrit = true;
    }
  } else if (Math.random() < expectedCrits) {
    combatState.lastHitCrit = true;
  }

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

          rewardSystem.grantRewards(enemy, Decimal.from(possibleKills));
          if (enemy.id.startsWith('proc_')) recordProceduralKill();
          combatState.kills += possibleKills;

          // FIXED: carry over remaining ticks instead of discarding
          ticksRemaining -= timeUsed;
          combatState.isFighting = false;
          combatState.enemy = null;
          break;
      } else {
          enemy.hp = Decimal.ZERO;
      }
    }

    // --- NORMAL COMBAT PATH ---
    const ticksToKill = enemy.hp.div(currentDmg).toNumber();
    const ticksUsed = Math.min(ticksRemaining, ticksToKill);
    
    character.stats.hp = character.stats.hp.add(stats.regenHp.mul(ticksUsed));
    if (character.stats.hp.gt(stats.hp)) character.stats.hp = stats.hp;
    character.stats.defense = character.stats.defense.add(stats.regenDef.mul(ticksUsed));
    if (character.stats.defense.gt(stats.def)) character.stats.defense = stats.def;

    // FIXED: avoid floating-point epsilon leaving enemy at ~1e-14 HP
    // When ticksUsed consumes the entire remaining HP, treat it as an exact kill.
    if (ticksUsed >= ticksToKill) {
      enemy.hp = Decimal.ZERO;
    } else {
      enemy.hp = enemy.hp.sub(currentDmg.mul(ticksUsed));
    }
    ticksRemaining -= ticksUsed;

    if (enemy.hp.lte(0)) {
      rewardSystem.grantRewards(enemy);
      if (enemy.id.startsWith('proc_')) recordProceduralKill();
      combatState.kills += 1;
      combatState.isFighting = false;
      combatState.enemy = null;
    } else {
      const isSkipped = Math.random() < stats.skipChance;
      const enemyDmg = isSkipped ? Decimal.ZERO : enemy.attack.mul(ticksUsed);

      if (character.stats.defense.gte(enemyDmg)) {
        character.stats.defense = character.stats.defense.sub(enemyDmg);
      } else {
        const rem = enemyDmg.sub(character.stats.defense);
        character.stats.defense = Decimal.ZERO;
        character.stats.hp = character.stats.hp.sub(rem);
      }
      
      if (character.stats.defense.lt(0)) character.stats.defense = Decimal.ZERO;
      if (character.stats.hp.lt(0)) character.stats.hp = Decimal.ZERO;

      if (character.stats.hp.lte(0)) {
        character.stats.hp = character.stats.maxHp;
        character.vergeCount++;
        addLog(`[SURGE] Defeated! Gained partial XP...`, 'awakening');
        rewardSystem.grantRewards(enemy, 0.1);
        if (enemy.id.startsWith('proc_')) recordProceduralKill();
        combatState.isFighting = false;
        combatState.enemy = null;
      }
    }

    if (ticksRemaining < 0.001) ticksRemaining = 0;
  }
}

// Deprecated functions for cleanup (to be removed once UI is updated if needed)
export function getGlobalStatMult(type: 'atk' | 'hp' | 'regen'): Decimal {
    const s = getEffectiveCombatStats();
    if (type === 'atk') return s.atk.div(character.stats.attack);
    if (type === 'hp') return s.hp.div(character.stats.maxHp);
    if (type === 'regen') return s.regenHp.div(character.stats.regenHp);
    return Decimal.ONE;
}
export function getGlobalCritChance(): number { return getEffectiveCombatStats().critChance; }


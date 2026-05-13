/**
 * Combat Formulas — Centralized damage and combat calculations.
 *
 * Previously scattered across:
 * - combat.svelte.ts (getEffectiveCombatStats)
 * - rewardSystem.ts (XP calculations)
 * - character.svelte.ts (base stats)
 *
 * Now centralized for:
 * - Single source of truth for balancing
 * - Caching opportunities
 * - Deterministic replay
 * - AI-assisted balance tuning
 */

import { Decimal, type DecimalSource } from '../../systems/decimal.js';
import { memoize } from './memo.js';

// ============================================================
// Type Definitions
// ============================================================

export interface DamageMultipliers {
  skill: DecimalSource;
  seal: DecimalSource;
  omni: DecimalSource;
  bestiary: DecimalSource;
  overclock: DecimalSource;
  achievement: DecimalSource;
  anatomy: DecimalSource;
  species: DecimalSource;
}

export interface CritInfo {
  chance: number;
  multiplier: DecimalSource;
}

export interface CombatStats {
  attack: Decimal;
  maxHp: Decimal;
  maxDefense: Decimal;
  regenHp: Decimal;
  regenDefense: Decimal;
  critChance: number;
  critMultiplier: Decimal;
  skipChance: number;
  effectiveDps: Decimal;
}

export interface XPResult {
  baseXP: Decimal;
  multiplier: Decimal;
  totalXP: Decimal;
}

// ============================================================
// XP Formulas
// ============================================================

const XP_EXP_BASE = 1.08; // Enemy XP grows at 8% per level

export function calculateEnemyXP(enemyLevel: DecimalSource): Decimal {
  const level = enemyLevel instanceof Decimal ? enemyLevel : new Decimal(enemyLevel);
  const growth = new Decimal(XP_EXP_BASE).pow(level.sub(1).max(0));
  return new Decimal(10).mul(growth);
}

export function calculateXPWithMultipliers(
  enemyLevel: DecimalSource,
  totalKills: DecimalSource,
  baseMultiplier: DecimalSource,
  skillBonus: DecimalSource, // from xp_boost skill (0.5 per tier)
  sealBonus: DecimalSource, // from seals
  omniBonus: DecimalSource, // from omni_stat skill
  challengeBonus: DecimalSource // from daily challenge
): XPResult {
  const level = enemyLevel instanceof Decimal ? enemyLevel : new Decimal(enemyLevel);
  const kills = totalKills instanceof Decimal ? totalKills : new Decimal(totalKills);

  const baseXP = calculateEnemyXP(level);
  const mult = new Decimal(1)
    .add(skillBonus)
    .mul(sealBonus)
    .mul(omniBonus)
    .mul(challengeBonus);

  const totalXP = baseXP.mul(kills).mul(baseMultiplier).mul(mult);

  return {
    baseXP,
    multiplier: mult,
    totalXP
  };
}

// ============================================================
// XP Needed for Level
// ============================================================

const XP_COST_EXP_BASE = 1.15;
const XP_COST_POLY_POWER = 0.8;
const XP_COST_BASE = new Decimal(100);
const MAX_SAFE_LEVEL = 1e9;

export function calculateXPNeededForLevel(level: DecimalSource): Decimal {
  const levelDec = level instanceof Decimal ? level : new Decimal(level || 1);
  const rawLevelNum = levelDec.toNumber();
  const levelNum = isFinite(rawLevelNum)
    ? Math.min(Math.max(1, rawLevelNum), MAX_SAFE_LEVEL)
    : MAX_SAFE_LEVEL;

  const expGrowth = new Decimal(XP_COST_EXP_BASE).pow(levelDec.sub(1).max(0));
  const polyGrowth = new Decimal(Math.max(1, Math.pow(levelNum, XP_COST_POLY_POWER)));
  return XP_COST_BASE.mul(expGrowth).mul(polyGrowth);
}

// ============================================================
// Combat Stats Formulas
// ============================================================

const BASE_HP = 100;
const BASE_DEFENSE = 50;
const BASE_ATTACK = 10;
const BASE_REGEN = 10;

export function calculateBaseStats(level: DecimalSource): {
  hp: Decimal;
  defense: Decimal;
  attack: Decimal;
  regenHp: Decimal;
  regenDef: Decimal;
} {
  const levelDec = level instanceof Decimal ? level : new Decimal(level);
  const growth = new Decimal(XP_COST_EXP_BASE).pow(levelDec.sub(1).max(0));

  return {
    hp: new Decimal(BASE_HP).mul(growth),
    defense: new Decimal(BASE_DEFENSE).mul(growth),
    attack: new Decimal(BASE_ATTACK).mul(growth),
    regenHp: new Decimal(BASE_REGEN).mul(growth),
    regenDef: new Decimal(BASE_REGEN).mul(growth)
  };
}

export function calculateCritChance(
  baseLevel: number,
  baseChance: number = 0.01,
  perLevelBonus: number = 0.005,
  skillBonus: number = 0,
  achievementBonus: number = 0
): number {
  const levelBonus = (baseLevel - 1) * perLevelBonus;
  return Math.min(1.0, baseChance + levelBonus + skillBonus + achievementBonus);
}

export function calculateCritMultiplier(
  baseMultiplier: DecimalSource = 2,
  skillBonus: number = 0 // from crit_surge skill (0.5 per tier)
): Decimal {
  return new Decimal(baseMultiplier).add(skillBonus * 0.5);
}

// ============================================================
// Damage Formulas
// ============================================================

export function calculateAverageDamage(
  attack: DecimalSource,
  critChance: number,
  critMultiplier: DecimalSource
): Decimal {
  const atk = attack instanceof Decimal ? attack : new Decimal(attack);
  const critMult = critMultiplier instanceof Decimal ? critMultiplier : new Decimal(critMultiplier);

  // Expected damage = attack * (1 - critChance) + attack * critChance * critMult
  // = attack * (1 - critChance + critChance * critMult)
  const expectedMult = 1 - critChance + critChance * critMult.toNumber();
  return atk.mul(expectedMult);
}

export function calculateEffectiveDPS(
  baseAttack: DecimalSource,
  multipliers: DamageMultipliers,
  critChance: number,
  critMultiplier: DecimalSource,
  skipChance: number = 0
): Decimal {
  const base = baseAttack instanceof Decimal ? baseAttack : new Decimal(baseAttack);
  const critMult = critMultiplier instanceof Decimal ? critMultiplier : new Decimal(critMultiplier);

  // Apply all multipliers
  const totalMult = new Decimal(1)
    .mul(multipliers.skill)
    .mul(multipliers.seal)
    .mul(multipliers.omni)
    .mul(multipliers.bestiary)
    .mul(multipliers.overclock)
    .mul(multipliers.achievement)
    .mul(new Decimal(1).add(multipliers.anatomy));

  let effectiveAttack = base.mul(totalMult);

  // Apply species bonus separately (not multiplicative)
  if (typeof multipliers.species === 'number' && multipliers.species !== 1) {
    effectiveAttack = effectiveAttack.mul(multipliers.species);
  } else if (multipliers.species instanceof Decimal || typeof multipliers.species === 'number') {
    const species = multipliers.species instanceof Decimal ? multipliers.species : new Decimal(multipliers.species);
    effectiveAttack = effectiveAttack.mul(species);
  }

  // Calculate average damage with crits
  const avgDmg = calculateAverageDamage(effectiveAttack, critChance, critMult);

  // Apply skip damage (assumes skip = instant kill on enemy)
  // In practice this just boosts effective DPS
  const skipBoost = 1 / (1 - skipChance);

  return avgDmg.mul(skipBoost);
}

export function calculateTicksToKill(
  enemyHP: DecimalSource,
  playerDPS: DecimalSource
): number {
  const hp = enemyHP instanceof Decimal ? enemyHP : new Decimal(enemyHP);
  const dps = playerDPS instanceof Decimal ? playerDPS : new Decimal(playerDPS);

  if (dps.lte(0)) return Infinity;
  return Math.max(0.01, hp.div(dps).toNumber());
}

// ============================================================
// Enemy Formulas
// ============================================================

const ENEMY_HP_EXP = 1.15;
const ENEMY_ATTACK_EXP = 1.12;

export function calculateEnemyHP(enemyLevel: DecimalSource): Decimal {
  const level = enemyLevel instanceof Decimal ? enemyLevel : new Decimal(enemyLevel);
  const growth = new Decimal(ENEMY_HP_EXP).pow(level.sub(1).max(0));
  return new Decimal(50).mul(growth);
}

export function calculateEnemyAttack(enemyLevel: DecimalSource): Decimal {
  const level = enemyLevel instanceof Decimal ? enemyLevel : new Decimal(enemyLevel);
  const growth = new Decimal(ENEMY_ATTACK_EXP).pow(level.sub(1).max(0));
  return new Decimal(5).mul(growth);
}

// ============================================================
// Damage Taken Formulas
// ============================================================

export function calculateDamageToPlayer(
  enemyAttack: DecimalSource,
  playerDefense: DecimalSource,
  skipChance: number = 0
): Decimal {
  const atk = enemyAttack instanceof Decimal ? enemyAttack : new Decimal(enemyAttack);
  const def = playerDefense instanceof Decimal ? playerDefense : new Decimal(playerDefense);

  // If skip is active, no damage
  if (Math.random() < skipChance) {
    return new Decimal(0);
  }

  // Damage reduced by defense
  if (def.gte(atk)) {
    return new Decimal(0);
  }

  return atk.sub(def);
}

// ============================================================
// Soul/Fragment Formulas
// ============================================================

export function calculateFragmentGain(
  playerLevel: DecimalSource,
  totalKills: DecimalSource,
  seals: number,
  skillMult: DecimalSource, // from data_siphon skill
  challengeMult: DecimalSource // from daily challenge
): Decimal {
  const level = playerLevel instanceof Decimal ? playerLevel : new Decimal(playerLevel);
  const kills = totalKills instanceof Decimal ? totalKills : new Decimal(totalKills);

  const base = level.div(200).add(0.1).mul(1 + seals);
  const mult = new Decimal(1).add(skillMult).mul(challengeMult);

  return base.mul(kills).mul(mult);
}

// ============================================================
// Momentum/Overcharge Formulas
// ============================================================

const MOMENTUM_CAP_SOFT = 100;
const OVERCHARGE_DECAY_RATE = 50;

export function applyMomentumSoftcap(momentum: number): number {
  if (momentum < MOMENTUM_CAP_SOFT) return momentum;
  return MOMENTUM_CAP_SOFT + Math.log10(momentum - MOMENTUM_CAP_SOFT + 1);
}

export function applyOverchargeSoftcap(overcharge: number): number {
  return overcharge / (1 + overcharge / OVERCHARGE_DECAY_RATE);
}

export function calculateMomentumGainPerTick(
  hasKills: boolean,
  killCount: number = 0
): number {
  const base = 0.01;
  const killBonus = hasKills ? Math.min(killCount, 1e6) * 0.0001 : 0;
  return base + killBonus;
}

// ============================================================
// Cached Combat Stats (for hot path)
// ============================================================

export function getCachedEffectiveStats(
  level: DecimalSource,
  sealMult: DecimalSource,
  omniMult: DecimalSource,
  soulMult: DecimalSource,
  bestiaryBoost: DecimalSource,
  overclockMult: DecimalSource,
  achievementMult: {
    atk?: DecimalSource;
    hp?: DecimalSource;
    regen?: DecimalSource;
  },
  skills: Array<{
    id: string;
    tierIndex: number;
  }>
): CombatStats {
  const key = `combat_${level}_${sealMult}_${omniMult}_${Date.now()}`; // Simple key, would improve with proper dep tracking

  const baseStats = calculateBaseStats(level);

  // Apply multipliers
  const atkMult = new Decimal(1).mul(sealMult).mul(omniMult).mul(soulMult).mul(bestiaryBoost).mul(overclockMult).mul(achievementMult.atk || 1);
  const hpMult = new Decimal(1).mul(sealMult).mul(omniMult).mul(soulMult).mul(bestiaryBoost).mul(overclockMult).mul(achievementMult.hp || 1);
  const regMult = new Decimal(1).mul(sealMult).mul(omniMult).mul(soulMult).mul(bestiaryBoost).mul(overclockMult).mul(achievementMult.regen || 1);

  let finalAttack = baseStats.attack.mul(atkMult);
  let finalMaxHp = baseStats.hp.mul(hpMult);
  let finalMaxDef = baseStats.defense.mul(hpMult);
  let finalRegHp = baseStats.regenHp.mul(regMult);
  let finalRegDef = baseStats.regenDef.mul(regMult);

  let finalCritChance = calculateCritChance(level instanceof Decimal ? level.toNumber() : (typeof level === 'number' ? level : Number(level)));
  let finalCritMult = calculateCritMultiplier();
  let finalSkipChance = 0;

  // Apply skill bonuses
  for (const skill of skills) {
    if (skill.tierIndex <= 0) continue;
    const tierPower = new Decimal(2).pow(skill.tierIndex);

    switch (skill.id) {
      case 'emp_strike':
        finalAttack = finalAttack.add(baseStats.attack.mul(3).mul(tierPower).mul(atkMult));
        break;
      case 'chain_hack':
        finalAttack = finalAttack.add(baseStats.attack.mul(6).mul(tierPower).mul(atkMult));
        break;
      case 'overclock':
        finalAttack = finalAttack.mul(tierPower.mul(1.5));
        break;
      case 'nano_repair':
        finalRegHp = finalRegHp.add(finalMaxHp.mul(0.2).mul(tierPower));
        finalRegDef = finalRegDef.add(finalMaxDef.mul(0.2).mul(tierPower));
        break;
      case 'shield_surge':
        finalRegDef = finalRegDef.add(finalMaxDef.mul(0.3).mul(tierPower));
        finalSkipChance = Math.min(1.0, finalSkipChance + (0.01 * skill.tierIndex));
        break;
      case 'crit_surge':
        finalCritMult = calculateCritMultiplier(2, skill.tierIndex);
        break;
    }
  }

  const effectiveDps = calculateEffectiveDPS(
    finalAttack,
    {
      skill: 1, seal: 1, omni: 1, bestiary: 1, overclock: 1,
      achievement: 1, anatomy: 0, species: 1
    },
    finalCritChance,
    finalCritMult,
    finalSkipChance
  );

  return {
    attack: finalAttack,
    maxHp: finalMaxHp,
    maxDefense: finalMaxDef,
    regenHp: finalRegHp,
    regenDefense: finalRegDef,
    critChance: finalCritChance,
    critMultiplier: finalCritMult,
    skipChance: finalSkipChance,
    effectiveDps
  };
}
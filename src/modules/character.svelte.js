import { Decimal } from '../systems/decimal.js';
import { getOverclockMultiplier } from './overclock.svelte.js';

const INITIAL_STATS = {
  hp: new Decimal(100),
  maxHp: new Decimal(100),
  defense: new Decimal(50),
  maxDefense: new Decimal(50),
  attack: new Decimal(10),
  regenHp: new Decimal(10),
  regenDef: new Decimal(10),
  critChance: 0.01,
  skipDamageChance: 0,
};

export const character = $state({
  stats: { ...INITIAL_STATS },
  level: new Decimal(1),
  xp: new Decimal(0),
  totalXp: new Decimal(0),
  xpNeeded: new Decimal(100),

  // Momentum and Overcharge system
  momentum: 0,
  overcharge: 0,

  awakeningStage: 0,
  skillFragments: new Decimal(0),
  kills: new Decimal(0),
  seals: 0,
  vergeCount: 0,
  totalDrops: 0,
  totalFragments: new Decimal(0),
  dropBonus: 0,
  quality: 0,
  statsUnlocked: false, // For tracking if the new stats are unlocked

  // Offline Progression Settings
  offlineSettings: {
    efficiency: 1.0,      // 100% base
    maxSeconds: 2592000,   // 30 day cap (30 * 24 * 3600)
    lastSummary: null     // Stores the results of the last offline period
  }
});

/**
 * Clamps character.kills.toNumber() to prevent overflow/precision loss in late game.
 * @returns {number} A safe number representation of kills.
 */
export function safeKills() {
  return Math.min(character.kills.toNumber(), 1e6); // Clamp at 1 million for calculations
}

/**
 * Applies a softcap to momentum to prevent infinite scaling.
 * @param {number} m - The current momentum value.
 * @returns {number} The softcapped momentum value.
 */
export function applyMomentumSoftcap(m) {
  if (m < 100) return m;
  return 100 + Math.log10(m - 99);
}

/**
 * Applies diminishing returns to overcharge to prevent exponential abuse.
 * @param {number} o - The current overcharge value.
 * @returns {number} The softcapped overcharge value.
 */
export function applyOverchargeSoftcap(o) {
  return o / (1 + o / 50);
}

/**
 * Caches heavy mathematical calculations to prevent frame lag.
 * Call this only when level changes.
 */
export function updateDerivedStats() {
  const l = character.level;
  
  // Standard Idle Game Exponential Scaling (Base = 1.15^Level)
  const growth = new Decimal(1.15).pow(l.sub(1).max(0));
  
  character.xpNeeded = new Decimal(100).mul(growth);
  
  character.stats.maxHp = new Decimal(100).mul(growth);
  character.stats.maxDefense = new Decimal(50).mul(growth);
  character.stats.attack = new Decimal(10).mul(growth);
  character.stats.regenHp = new Decimal(10).mul(growth);
  character.stats.regenDef = new Decimal(10).mul(growth);
  
  const lNum = isFinite(l.toNumber()) ? l.toNumber() : 1e9;
  character.stats.critChance = Math.min(1.0, 0.01 + (lNum * 0.005));
  
  if (character.statsUnlocked) {
    character.stats.skipDamageChance = Math.min(1.0, lNum * 0.001);
  } else {
    character.stats.skipDamageChance = 0;
  }
}

/** Returns effective XP with momentum/overcharge bonuses */
export function getEffectiveXP() {
  // Momentum and Overcharge are now numbers, so direct multiplication is fine.
  const baseMulti = (character.momentum + 1) * (character.overcharge + 1);
  return character.xp.mul(baseMulti).mul(getOverclockMultiplier()); 
}

export function resetCharacter() {
  character.stats = { ...INITIAL_STATS };
  character.level = new Decimal(1);
  character.xp = new Decimal(0);
  character.totalXp = new Decimal(0);
  character.momentum = 0; // Reset to number
  character.overcharge = 0; // Reset to number
  updateDerivedStats();
  character.awakeningStage = 0;
  character.skillFragments = new Decimal(0);
  character.statsUnlocked = false;
}


import { Decimal, type DecimalSource } from '../systems/decimal.js';

export interface CharacterStats {
  hp: Decimal;
  maxHp: Decimal;
  defense: Decimal;
  maxDefense: Decimal;
  attack: Decimal;
  regenHp: Decimal;
  regenDef: Decimal;
  critChance: number;
  skipDamageChance: number;
  quality: number;
}

export interface OfflineSettings {
  efficiency: number;
  maxSeconds: number;
  lastSummary: CharacterOfflineSummary | null;
}

export interface CharacterOfflineSummary {
  seconds: number;
  kills: Decimal;
  levels: Decimal;
  efficiency: number;
}

export interface Character {
  stats: CharacterStats;
  level: Decimal;
  xp: Decimal;
  xpNeeded: Decimal;
  momentum: number;
  overcharge: number;
  skillFragments: Decimal;
  kills: Decimal;
  seals: number;
  vergeCount: number;
  totalDrops: number;
  totalFragments: Decimal;
  dropBonus: number;
  quality: number;
  statsUnlocked: boolean;
  offlineSettings: OfflineSettings;
  firstLoginTime: number;
  lastLoginTime: number;
  dailyLogins: number;
  totalPlayTime: number;
}

const INITIAL_STATS: CharacterStats = {
  hp: Decimal.HUNDRED,
  maxHp: Decimal.HUNDRED,
  defense: Decimal.FIFTY,
  maxDefense: Decimal.FIFTY,
  attack: Decimal.TEN,
  regenHp: Decimal.TEN,
  regenDef: Decimal.TEN,
  critChance: 0.01,
  skipDamageChance: 0,
  quality: 0
};

export const STAT_GROWTH_BASE = 1.15;
export const XP_REWARD_BASE = Decimal.TEN;
export const XP_COST_BASE_DECIMAL = new Decimal(100);

const MAX_SAFE_LEVEL_NUM = 1e15;

export function getXpNeededForLevel(level: DecimalSource): Decimal {
  const levelDec = level instanceof Decimal ? level : new Decimal(level || 1);
  const growth = new Decimal(STAT_GROWTH_BASE).pow(levelDec.sub(1).max(0));
  return XP_COST_BASE_DECIMAL.mul(growth);
}

export const character: Character = $state({
  stats: { ...INITIAL_STATS },
  level: Decimal.ONE,
  xp: Decimal.ZERO,
  xpNeeded: Decimal.HUNDRED,
  momentum: 0,
  overcharge: 0,
  skillFragments: Decimal.ZERO,
  kills: Decimal.ZERO,
  seals: 0,
  vergeCount: 0,
  totalDrops: 0,
  totalFragments: Decimal.ZERO,
  dropBonus: 0,
  quality: 0,
  statsUnlocked: false,
  offlineSettings: {
    efficiency: 1.0,
    maxSeconds: 2592000,
    lastSummary: null
  },
  firstLoginTime: 0,
  lastLoginTime: 0,
  dailyLogins: 0,
  totalPlayTime: 0
});

export function safeKills(): number {
  return Math.min(character.kills.toNumber(), 1e6);
}

export function applyMomentumSoftcap(m: number): number {
  if (m < 100) return m;
  return 100 + Math.log10(m - 99);
}

export function applyOverchargeSoftcap(o: number): number {
  return o / (1 + o / 50);
}

export function updateDerivedStats(): void {
  const l = character.level;
  const lNum = isFinite(l.toNumber()) ? l.toNumber() : MAX_SAFE_LEVEL_NUM;

  const growth = Decimal.GROWTH_BASE.pow(l.sub(1).max(0));

  character.xpNeeded = getXpNeededForLevel(l);
  character.stats.maxHp = Decimal.HUNDRED.mul(growth);
  character.stats.maxDefense = Decimal.FIFTY.mul(growth);
  character.stats.attack = Decimal.TEN.mul(growth);
  character.stats.regenHp = Decimal.TEN.mul(growth);
  character.stats.regenDef = Decimal.TEN.mul(growth);

  character.stats.critChance = Math.min(1.0, 0.01 + lNum * 0.005);
  character.stats.skipDamageChance = character.statsUnlocked
    ? Math.min(1.0, lNum * 0.001)
    : 0;
}

export function getEffectiveXP(): Decimal {
  const baseMulti = (character.momentum + 1) * (character.overcharge + 1);
  return character.xp.mul(baseMulti);
}

export function resetCharacter(): void {
  character.stats = { ...INITIAL_STATS };
  character.level = Decimal.ONE;
  character.xp = Decimal.ZERO;
  character.kills = Decimal.ZERO;
  character.momentum = 0;
  character.overcharge = 0;
  character.skillFragments = Decimal.ZERO;
  character.statsUnlocked = false;
  updateDerivedStats();
}


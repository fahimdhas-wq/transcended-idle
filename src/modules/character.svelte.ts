import { Decimal, type DecimalSource } from '../systems/decimal.js';
import { getOverclockMultiplier } from './overclockState.svelte.js';

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
  awakeningPower: number;
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
  totalXp: Decimal;
  xpNeeded: Decimal;
  momentum: number;
  overcharge: number;
  awakeningStage: number;
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
}

const INITIAL_STATS: CharacterStats = {
  hp: new Decimal(100),
  maxHp: new Decimal(100),
  defense: new Decimal(50),
  maxDefense: new Decimal(50),
  attack: new Decimal(10),
  regenHp: new Decimal(10),
  regenDef: new Decimal(10),
  critChance: 0.01,
  skipDamageChance: 0,
  quality: 0,
  awakeningPower: 0
};

export const XP_COST_EXP_BASE = 1.15;
export const XP_COST_POLY_POWER = 0.8;

const XP_COST_BASE = new Decimal(100);
const MAX_SAFE_LEVEL_NUM = 1e9;

export function getXpNeededForLevel(level: DecimalSource): Decimal {
  const levelDec = level instanceof Decimal ? level : new Decimal(level || 1);
  const rawLevelNum = levelDec.toNumber();
  const levelNum = isFinite(rawLevelNum)
    ? Math.min(Math.max(1, rawLevelNum), MAX_SAFE_LEVEL_NUM)
    : MAX_SAFE_LEVEL_NUM;

  const expGrowth = new Decimal(XP_COST_EXP_BASE).pow(levelDec.sub(1).max(0));
  const polyGrowth = new Decimal(Math.max(1, Math.pow(levelNum, XP_COST_POLY_POWER)));
  return XP_COST_BASE.mul(expGrowth).mul(polyGrowth);
}

export const character: Character = $state({
  stats: { ...INITIAL_STATS },
  level: new Decimal(1),
  xp: new Decimal(0),
  totalXp: new Decimal(0),
  xpNeeded: new Decimal(100),
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
  statsUnlocked: false,
  offlineSettings: {
    efficiency: 1.0,
    maxSeconds: 2592000,
    lastSummary: null
  }
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

  const growth = new Decimal(XP_COST_EXP_BASE).pow(l.sub(1).max(0));

  character.xpNeeded = getXpNeededForLevel(l);
  character.stats.maxHp = new Decimal(100).mul(growth);
  character.stats.maxDefense = new Decimal(50).mul(growth);
  character.stats.attack = new Decimal(10).mul(growth);
  character.stats.regenHp = new Decimal(10).mul(growth);
  character.stats.regenDef = new Decimal(10).mul(growth);

  character.stats.critChance = Math.min(1.0, 0.01 + lNum * 0.005);
  character.stats.skipDamageChance = character.statsUnlocked
    ? Math.min(1.0, lNum * 0.001)
    : 0;
}

export function getEffectiveXP(): Decimal {
  const baseMulti = (character.momentum + 1) * (character.overcharge + 1);
  return character.xp.mul(baseMulti).mul(getOverclockMultiplier());
}

export function resetCharacter(): void {
  character.stats = { ...INITIAL_STATS };
  character.level = new Decimal(1);
  character.xp = new Decimal(0);
  character.totalXp = new Decimal(0);
  character.momentum = 0;
  character.overcharge = 0;
  character.awakeningStage = 0;
  character.skillFragments = new Decimal(0);
  character.statsUnlocked = false;
  updateDerivedStats();
}

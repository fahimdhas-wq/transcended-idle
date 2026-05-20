import { Decimal } from '../systems/decimal.js';

export type GameSnapshot = {
  tick: number;
  character: SerializableCharacter;
  combat: SerializableCombatState;
  skills: SerializableSkillsState;
  mining: SerializableMiningState;
  forestry: SerializableForestryState;
  bestiary: SerializableBestiaryState;
  dailyChallenge: SerializableDailyChallenge;
  ascension: SerializableAscension;
  paradox: SerializableParadox;
  rift: SerializableRift;
  fracture: SerializableFracture;
  procedural: SerializableProcedural;
  activePlay: SerializableActivePlay;
  inventory: SerializableInventory;
  logs: string[];
};

export interface SerializableCharacter {
  level: { m: number; e: number };
  xp: { m: number; e: number };
  xpNeeded: { m: number; e: number };
  kills: { m: number; e: number };
  seals: number;
  momentum: number;
  overcharge: number;
  skillFragments: { m: number; e: number };
  totalFragments: { m: number; e: number };
  dropBonus: number;
  quality: number;
  statsUnlocked: boolean;
  vergeCount: number;
  totalDrops: number;
  firstLoginTime: number;
  lastLoginTime: number;
  dailyLogins: number;
  totalPlayTime: number;
  stats: {
    hp: { m: number; e: number };
    maxHp: { m: number; e: number };
    defense: { m: number; e: number };
    maxDefense: { m: number; e: number };
    attack: { m: number; e: number };
    regenHp: { m: number; e: number };
    regenDef: { m: number; e: number };
    critChance: number;
    skipDamageChance: number;
    quality: number;
  };
}

export interface SerializableCombatState {
  kills: number;
  lastHitCrit: boolean;
}

export interface SerializableSkillsState {
  skills: Array<{
    id: string;
    tierIndex: number;
  }>;
}

export interface SerializableMiningState {
  unlocked: boolean;
  energy: number;
  maxEnergy: number;
  drones: number;
  autoExtractors: number;
  miningProgress: number;
  sharpness: number;
  extraction: number;
  discovery: number;
  sensors: number;
  efficiency: number;
  resourceLevels: Record<string, number>;
}

export interface SerializableForestryState {
  unlocked: boolean;
  energy: number;
  maxEnergy: number;
  growthChambers: number;
  mutationChance: number;
  reforestation: number;
  chainsawFuel: number;
  ancientSaplings: number;
  mutationPower: number;
  efficiency: number;
  growthProgress: number;
  resourceLevels: Record<string, number>;
}

export interface SerializableBestiaryState {
  dataFragments: { m: number; e: number };
  souls: { m: number; e: number };
  anatomy: number;
  huntersGreed: number;
  soulExtraction: number;
  entries: Record<string, { kills: { m: number; e: number }; stage: string }>;
}

export interface SerializableDailyChallenge {
  progress: { kills: number; levelsGained: number; critsLanded: number };
  completedToday: boolean;
  claimedReward: boolean;
}

export interface SerializableAscension {
  shards: number;
  lifetimeShards: number;
  upgradeLevels: Record<string, number>;
}

export interface SerializableParadox {
  activeId: string | null;
  progressKills: number;
  completions: Record<string, number>;
  cooldownEnd: number;
}

export interface SerializableRift {
  completions: Record<string, number>;
}

export interface SerializableFracture {
  currency: number;
  shopLevels: Record<string, number>;
  highestFloor: number;
}

export interface SerializableProcedural {
  totalProceduralKills: number;
}

export interface SerializableActivePlay {
  powerActive: boolean;
  powerEndTick: number;
  boostActive: boolean;
  boostEndTick: number;
  collectCooldownEnd: number;
}

export interface SerializableInventory {
  items: Array<{ name: string; rarity: string; count: number }>;
}

export interface WorkerMessage {
  type: string;
  payload?: unknown;
}

export interface WorkerResponse {
  type: string;
  payload?: unknown;
}
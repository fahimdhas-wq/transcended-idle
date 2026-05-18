
// src/systems/achievementSystem.svelte.js
import { character } from '../modules/character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { miningState } from '../modules/mining.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { skillsState } from '../modules/skills.svelte.js';

let lastCheckTime = 0;
const CHECK_THROTTLE = 1000; // Check achievements max once per second

export interface AchievementBonus {
  atk?: number;
  hp?: number;
  regen?: number;
  crit?: number;
  drop?: number;
  all?: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  req: () => boolean;
  bonus: AchievementBonus;
  bonusDesc: string;
}

export interface AchievementState {
  unlocked: Record<string, boolean>;
}

// Helper function to calculate days since first login
function getDaysSinceFirstLogin(): number {
  if (character.firstLoginTime <= 0) return 0;
  const msSinceFirstLogin = Date.now() - character.firstLoginTime;
  return Math.floor(msSinceFirstLogin / (24 * 60 * 60 * 1000));
}

// Rebalanced achievements - max ~2 years with maxed skills
export const achievementDefs: AchievementDef[] = [
  // === KILL ACHIEVEMENTS ===
  { id: 'first_blood',    name: 'First Blood',       desc: '1 kill',                req: () => character.kills.gte(1),         bonus: { atk: 0.10 },  bonusDesc: '+10% ATK' },
  { id: 'slayer_10',      name: 'Slayer',           desc: '10 kills',              req: () => character.kills.gte(10),        bonus: { atk: 0.10 },  bonusDesc: '+10% ATK' },
  { id: 'hunter_100',     name: 'Hunter',           desc: '100 kills',              req: () => character.kills.gte(100),       bonus: { atk: 0.15 },  bonusDesc: '+15% ATK' },
  { id: 'killer_1k',      name: 'Mass Killer',       desc: '1,000 kills',            req: () => character.kills.gte(1000),      bonus: { atk: 0.25 },  bonusDesc: '+25% ATK' },
  { id: 'genocide_10k',   name: 'Genocide',         desc: '10,000 kills',          req: () => character.kills.gte(10000),     bonus: { atk: 0.50 },  bonusDesc: '+50% ATK' },
  { id: 'extinction_100k', name: 'Extinction',       desc: '100,000 kills',         req: () => character.kills.gte(100000),   bonus: { atk: 1.00 },  bonusDesc: '+100% ATK' },
  { id: 'obliteration_1m', name: 'Obliteration',     desc: '1,000,000 kills',       req: () => character.kills.gte(1e6),      bonus: { atk: 2.50 },  bonusDesc: '+250% ATK' },
  { id: 'annihilation_10m', name: 'Annihilation',    desc: '10 Million kills',      req: () => character.kills.gte(1e7),      bonus: { atk: 5.00 },  bonusDesc: '+500% ATK' },
  { id: 'cataclysm_100m', name: 'Cataclysm',        desc: '100 Million kills',      req: () => character.kills.gte(1e8),      bonus: { all: 2.00 },  bonusDesc: '+200% All Stats' },
  { id: 'kills_1b',        name: 'Reaper of Stars',  desc: '1 Billion kills',       req: () => character.kills.gte(1e9),      bonus: { atk: 1000.0 }, bonusDesc: '+100,000% ATK' },
  { id: 'kills_10b',      name: 'Cosmic Executioner',desc: '10 Billion kills',      req: () => character.kills.gte(1e10),     bonus: { atk: 5000.0 }, bonusDesc: '+500,000% ATK' },
  { id: 'kills_100b',     name: 'Galaxy Annihilator',desc: '100 Billion kills',     req: () => character.kills.gte(1e11),     bonus: { atk: 25000.0 }, bonusDesc: '+2,500,000% ATK' },
  { id: 'kills_1t',       name: 'World Ender',       desc: '1 Trillion kills',      req: () => character.kills.gte(1e12),     bonus: { atk: 100000.0 }, bonusDesc: '+10,000,000% ATK' },
  { id: 'kills_10t',      name: 'Dimension Breaker',desc: '10 Trillion kills',     req: () => character.kills.gte(1e13),     bonus: { all: 100.0 }, bonusDesc: '+10,000% All Stats' },
  { id: 'kills_100t',     name: 'Reality Fracturer',desc: '100 Trillion kills',    req: () => character.kills.gte(1e14),     bonus: { all: 500.0 }, bonusDesc: '+50,000% All Stats' },
  { id: 'kills_1q',       name: 'Galaxy Ender',     desc: '1 Quadrillion kills',   req: () => character.kills.gte(1e15),     bonus: { all: 2500.0 }, bonusDesc: '+250,000% All Stats' },
  { id: 'kills_10q',     name: 'Universe Ender',   desc: '10 Quadrillion kills',  req: () => character.kills.gte(1e16),     bonus: { all: 10000.0 }, bonusDesc: '+1,000,000% All Stats' },
  { id: 'kills_100q',    name: 'Multiverse Slayer', desc: '100 Quadrillion kills', req: () => character.kills.gte(1e17),     bonus: { all: 50000.0 }, bonusDesc: '+5,000,000% All Stats' },
  { id: 'kills_1qi',     name: 'Omniversal Death',  desc: '1 Quintillion kills',  req: () => character.kills.gte(1e18),     bonus: { all: 250000.0 }, bonusDesc: '+25,000,000% All Stats' },

  // === LEVEL ACHIEVEMENTS ===
  { id: 'level_5',       name: 'Rookie',            desc: 'Reach Level 5',          req: () => character.level.gte(5),        bonus: { hp: 0.10 },  bonusDesc: '+10% HP' },
  { id: 'level_25',      name: 'Veteran',           desc: 'Reach Level 25',         req: () => character.level.gte(25),       bonus: { hp: 0.20 },  bonusDesc: '+20% HP' },
  { id: 'level_100',     name: 'Elite',             desc: 'Reach Level 100',        req: () => character.level.gte(100),      bonus: { hp: 0.50 },  bonusDesc: '+50% HP' },
  { id: 'level_500',     name: 'Transcendent',      desc: 'Reach Level 500',        req: () => character.level.gte(500),      bonus: { hp: 1.00 },  bonusDesc: '+100% HP' },
  { id: 'level_1k',      name: 'God Mode',          desc: 'Reach Level 1,000',      req: () => character.level.gte(1000),     bonus: { hp: 2.50 },  bonusDesc: '+250% HP' },
  { id: 'level_5k',      name: 'Universal Being',   desc: 'Reach Level 5,000',      req: () => character.level.gte(5000),     bonus: { hp: 5.00 },  bonusDesc: '+500% HP' },
  { id: 'level_10k',    name: 'Cosmic Entity',     desc: 'Reach Level 10,000',    req: () => character.level.gte(10000),    bonus: { all: 5.00 },  bonusDesc: '+500% All Stats' },
  { id: 'level_50k',     name: 'Dimensional Being', desc: 'Reach Level 50,000',    req: () => character.level.gte(50000),    bonus: { all: 25.0 },  bonusDesc: '+2500% All Stats' },
  { id: 'level_100k',   name: 'Reality Shaper',    desc: 'Reach Level 100,000',   req: () => character.level.gte(1e5),     bonus: { all: 100.0 },  bonusDesc: '+10,000% All Stats' },
  { id: 'level_500k',   name: 'Millionaire',       desc: 'Reach Level 500,000',   req: () => character.level.gte(5e5),    bonus: { all: 500.0 },  bonusDesc: '+50,000% All Stats' },
  { id: 'level_1m',      name: 'Omega Point',      desc: 'Reach Level 1,000,000', req: () => character.level.gte(1e6),   bonus: { all: 2500.0 }, bonusDesc: '+250,000% All Stats' },
  { id: 'level_5m',      name: 'Trans-Reality',    desc: 'Reach Level 5,000,000', req: () => character.level.gte(5e6),   bonus: { all: 10000.0 }, bonusDesc: '+1,000,000% All Stats' },
  { id: 'level_10m',    name: 'Infinity Bound',   desc: 'Reach Level 10,000,000',req: () => character.level.gte(1e7),   bonus: { all: 50000.0 }, bonusDesc: '+5,000,000% All Stats' },

  // === SURVIVAL ACHIEVEMENTS ===
  { id: 'survive_1',    name: 'Near Death',        desc: 'Survive Verge of Death',   req: () => character.vergeCount >= 1,   bonus: { regen: 0.20 }, bonusDesc: '+20% Regen' },
  { id: 'survive_10',   name: 'Unkillable',       desc: 'Survive Verge 10 times',   req: () => character.vergeCount >= 10,  bonus: { regen: 0.50 }, bonusDesc: '+50% Regen' },
  { id: 'survive_50',   name: 'Phoenix',          desc: 'Survive Verge 50 times',   req: () => character.vergeCount >= 50,  bonus: { regen: 1.00 }, bonusDesc: '+100% Regen' },

  // === SEAL ACHIEVEMENTS ===
  { id: 'seal_1',       name: 'Awakened',          desc: 'Break Seal 1',           req: () => character.seals >= 1,       bonus: { all: 0.50 },  bonusDesc: '+50% All Stats' },
  { id: 'seal_5',       name: 'Ascended',          desc: 'Break 5 Seals',           req: () => character.seals >= 5,       bonus: { all: 2.00 },  bonusDesc: '+200% All Stats' },
  { id: 'seal_10',      name: 'Divine',            desc: 'Break 10 Seals',          req: () => character.seals >= 10,      bonus: { all: 10.0 },  bonusDesc: '+1000% All Stats' },
  { id: 'seal_15',      name: 'Transcendent God',  desc: 'Break 15 Seals',          req: () => character.seals >= 15,      bonus: { all: 50.0 },  bonusDesc: '+5000% All Stats' },
  { id: 'seal_20',      name: 'Omniversal Being',  desc: 'Break 20 Seals',          req: () => character.seals >= 20,      bonus: { all: 250.0 }, bonusDesc: '+25,000% All Stats' },
  { id: 'seal_25',      name: 'Ultimate Entity',   desc: 'Break 25 Seals',          req: () => character.seals >= 25,      bonus: { all: 1000.0 }, bonusDesc: '+100,000% All Stats' },
  { id: 'seal_30',      name: 'Cosmic Lord',       desc: 'Break 30 Seals',          req: () => character.seals >= 30,      bonus: { all: 5000.0 }, bonusDesc: '+500,000% All Stats' },
  { id: 'seal_40',      name: 'Void Walker',       desc: 'Break 40 Seals',          req: () => character.seals >= 40,      bonus: { all: 25000.0 }, bonusDesc: '+2.5M% All Stats' },
  { id: 'seal_50',      name: 'Reality Shaper',    desc: 'Break 50 Seals',          req: () => character.seals >= 50,      bonus: { all: 100000.0 }, bonusDesc: '+10M% All Stats' },
  { id: 'seal_75',      name: 'Dimension Breaker', desc: 'Break 75 Seals',          req: () => character.seals >= 75,      bonus: { all: 1e6 }, bonusDesc: '+100M% All Stats' },
  { id: 'seal_100',     name: 'Omega Transcendent',desc: 'Break 100 Seals',         req: () => character.seals >= 100,     bonus: { all: 1e7 }, bonusDesc: '+1B% All Stats' },
  { id: 'seal_148',     name: 'AD Infinity',      desc: 'Break 148 Seals (AD)',     req: () => character.seals >= 148,    bonus: { all: 1e8 }, bonusDesc: '+10B% All Stats' },
  { id: 'seal_200',     name: 'BF Transcendent',  desc: 'Break All 277 Seals (BF)',  req: () => character.seals >= 277,    bonus: { all: 1e9 }, bonusDesc: '+100B% All Stats' },

  // === CRIT ACHIEVEMENTS ===
  { id: 'crit_10',      name: 'Sharp Eye',         desc: '10% Crit Chance',         req: () => (character.stats.critChance || 0) >= 0.10, bonus: { crit: 0.05 }, bonusDesc: '+5% Crit' },
  { id: 'crit_50',      name: 'Precision',         desc: '50% Crit Chance',         req: () => (character.stats.critChance || 0) >= 0.50, bonus: { crit: 0.10 }, bonusDesc: '+10% Crit' },
  { id: 'crit_100',    name: 'Full Auto Crit',   desc: '100% Crit Chance',        req: () => (character.stats.critChance || 0) >= 1.00, bonus: { crit: 0.20 }, bonusDesc: '+20% Crit Dmg' },

  // === LOOT ACHIEVEMENTS ===
  { id: 'loot_first',   name: 'Scavenger',         desc: 'Get 1 drop',              req: () => (character.totalDrops || 0) >= 1,    bonus: { drop: 0.10 }, bonusDesc: '+10% Drop Rate' },
  { id: 'loot_50',      name: 'Collector',         desc: 'Get 50 drops',            req: () => (character.totalDrops || 0) >= 50,   bonus: { drop: 0.20 }, bonusDesc: '+20% Drop Rate' },
  { id: 'loot_500',    name: 'Hoarder',           desc: 'Get 500 drops',           req: () => (character.totalDrops || 0) >= 500,  bonus: { drop: 0.50 }, bonusDesc: '+50% Drop Rate' },
  { id: 'loot_5k',     name: 'Treasure Hunter',   desc: 'Get 5,000 drops',        req: () => (character.totalDrops || 0) >= 5000, bonus: { drop: 1.00 }, bonusDesc: '+100% Drop Rate' },

  // === MINING ACHIEVEMENTS ===
  { id: 'mine_tier_5',   name: 'Deep Miner',       desc: 'Mining Tool Tier 5',     req: () => miningState.toolTier >= 5,  bonus: { atk: 0.25 }, bonusDesc: '+25% ATK' },
  { id: 'mine_tier_10',  name: 'Core Extractor',   desc: 'Mining Tool Tier 10',     req: () => miningState.toolTier >= 10, bonus: { all: 1.00 }, bonusDesc: '+100% All Stats' },
  { id: 'mine_fragments', name: 'Data Weaver',    desc: '1000 Data Fragments',     req: () => bestiaryState.dataFragments.gte(1000), bonus: { atk: 0.50 }, bonusDesc: '+50% ATK' },
  { id: 'data_tycoon',   name: 'Server Overlord',  desc: '1 Million Data Frags',   req: () => bestiaryState.dataFragments.gte(1e6),  bonus: { atk: 10.0 }, bonusDesc: '+1000% ATK' },
  { id: 'drone_fleet',   name: 'Industrialist',    desc: '25 Mining Drones',       req: () => miningState.drones >= 25,   bonus: { all: 5.0 },  bonusDesc: '+500% All Stats' },

  // === FORESTRY ACHIEVEMENTS ===
  { id: 'forest_tier_5',   name: 'Bio Engineer',   desc: 'Bio Tool Tier 5',         req: () => forestryState.toolTier >= 5,   bonus: { hp: 0.25 }, bonusDesc: '+25% HP' },
  { id: 'forest_tier_10',  name: 'Genetic Architect', desc: 'Bio Tool Tier 10',     req: () => forestryState.toolTier >= 10,  bonus: { all: 1.00 }, bonusDesc: '+100% All Stats' },
  { id: 'dna_fragments',   name: 'DNA Sculptor',   desc: '1000 DNA Fragments',     req: () => forestryState.dnaFragments.gte(1000), bonus: { hp: 0.50 }, bonusDesc: '+50% HP' },
  { id: 'dna_tycoon',      name: 'Genetic Prophet', desc: '1 Million DNA Frags',    req: () => forestryState.dnaFragments.gte(1e6),   bonus: { hp: 10.0 }, bonusDesc: '+1000% HP' },
  { id: 'chamber_master',  name: 'Arboretum',      desc: '25 Growth Chambers',      req: () => forestryState.growthChambers >= 25, bonus: { all: 5.0 }, bonusDesc: '+500% All Stats' },

  // === BESTIARY ACHIEVEMENTS ===
  { id: 'bestiary_10',  name: 'Zoologist',         desc: 'Master 10 species',       req: () => Object.values(bestiaryState.entries).filter(e => {
    const kills = e.kills instanceof Decimal ? e.kills.toNumber() : e.kills;
    return kills >= 500;
  }).length >= 10, bonus: { all: 0.50 }, bonusDesc: '+50% All Stats' },
  { id: 'bestiary_30',  name: 'Apex Predator',    desc: 'Master 30 species',       req: () => Object.values(bestiaryState.entries).filter(e => {
    const kills = e.kills instanceof Decimal ? e.kills.toNumber() : e.kills;
    return kills >= 500;
  }).length >= 30, bonus: { all: 1.50 }, bonusDesc: '+150% All Stats' },
  { id: 'souls_1k',     name: 'Soul Harvester',    desc: 'Collect 1,000 Souls',   req: () => bestiaryState.souls.gte(1000),   bonus: { all: 1.0 },  bonusDesc: '+100% All Stats' },
  { id: 'souls_1m',    name: 'Ghost in the Shell', desc: '1 Million Souls',       req: () => bestiaryState.souls.gte(1e6),     bonus: { all: 10.0 }, bonusDesc: '+1000% All Stats' },
  { id: 'souls_1b',    name: 'Underworld King',   desc: '1 Billion Souls',       req: () => bestiaryState.souls.gte(1e9),     bonus: { all: 500.0 }, bonusDesc: '+50,000% All Stats' },

  // === SKILL TIER ACHIEVEMENTS ===
  { id: 'skill_d',       name: 'Rank D Power',   desc: 'Any Skill at D Tier',    req: () => skillsState.skills.some(s => s.tierIndex >= 6), bonus: { atk: 0.50 }, bonusDesc: '+50% ATK' },
  { id: 'skill_c',       name: 'Rank C Power',   desc: 'Any Skill at C Tier',    req: () => skillsState.skills.some(s => s.tierIndex >= 9), bonus: { atk: 1.00 }, bonusDesc: '+100% ATK' },
  { id: 'skill_b',       name: 'Rank B Power',   desc: 'Any Skill at B Tier',    req: () => skillsState.skills.some(s => s.tierIndex >= 12), bonus: { atk: 2.00 }, bonusDesc: '+200% ATK' },
  { id: 'skill_a',       name: 'Rank A Power',   desc: 'Any Skill at A Tier',    req: () => skillsState.skills.some(s => s.tierIndex >= 15), bonus: { hp: 2.00 }, bonusDesc: '+200% HP' },
  { id: 'skill_s',       name: 'Rank S Power',   desc: 'Any Skill at S Tier',    req: () => skillsState.skills.some(s => s.tierIndex >= 18), bonus: { hp: 5.00 }, bonusDesc: '+500% HP' },
  { id: 'skill_ss',      name: 'Rank SS Power',  desc: 'Any Skill at SS Tier',   req: () => skillsState.skills.some(s => s.tierIndex >= 21), bonus: { all: 2.00 }, bonusDesc: '+200% All Stats' },
  { id: 'skill_ssr',     name: 'Golden Code',    desc: 'Any Skill at SSR Tier',  req: () => skillsState.skills.some(s => s.tierIndex >= 27), bonus: { all: 5.0 }, bonusDesc: '+500% All Stats' },
  { id: 'skill_ur',      name: 'Ultra Rare',     desc: 'Any Skill at UR Tier',  req: () => skillsState.skills.some(s => s.tierIndex >= 29), bonus: { all: 25.0 }, bonusDesc: '+2500% All Stats' },
  { id: 'skill_ex',      name: 'Broken Reality', desc: 'Any Skill at EX Tier',   req: () => skillsState.skills.some(s => s.tierIndex >= 32), bonus: { all: 100.0 }, bonusDesc: '+10,000% All Stats' },
  { id: 'skill_trans',   name: 'Transcendent',   desc: 'Any Skill: Transcendent',req: () => skillsState.skills.some(s => s.tierIndex >= 33), bonus: { all: 500.0 }, bonusDesc: '+50,000% All Stats' },
  { id: 'skill_ethereal', name: 'Ethereal Power', desc: 'Any Skill: Ethereal',  req: () => skillsState.skills.some(s => s.tierIndex >= 38), bonus: { all: 2500.0 }, bonusDesc: '+250,000% All Stats' },

  // === SKILL FRAGMENTS ACHIEVEMENT ===
  { id: 'skill_hoarder', name: 'Fragment Singularity', desc: '1e12 Skill Fragments', req: () => character.skillFragments.gte(1e12), bonus: { all: 100.0 }, bonusDesc: '+10,000% All Stats' },

  // === STAT POWER ACHIEVEMENTS ===
  { id: 'stat_e10',     name: 'Tenfold Power',   desc: 'Attack > 1e10',          req: () => character.stats.attack.e >= 10,   bonus: { atk: 10.0 }, bonusDesc: '+1000% ATK' },
  { id: 'stat_e20',     name: 'Hundredfold Power', desc: 'Attack > 1e20',         req: () => character.stats.attack.e >= 20,   bonus: { atk: 50.0 }, bonusDesc: '+5000% ATK' },
  { id: 'stat_e50',     name: 'Cosmic Power',   desc: 'Attack > 1e50',          req: () => character.stats.attack.e >= 50,   bonus: { all: 100.0 }, bonusDesc: '+10,000% All Stats' },
  { id: 'stat_e100',    name: 'Century Power',  desc: 'Attack > 1e100',          req: () => character.stats.attack.e >= 100,  bonus: { all: 500.0 }, bonusDesc: '+50,000% All Stats' },
  { id: 'stat_e200',    name: 'Quasar Strength',desc: 'Attack > 1e200',          req: () => character.stats.attack.e >= 200,  bonus: { all: 2500.0 }, bonusDesc: '+250,000% All Stats' },
  { id: 'stat_e500',    name: 'Universal Constant', desc: 'Attack > 1e500',      req: () => character.stats.attack.e >= 500,  bonus: { all: 10000.0 }, bonusDesc: '+1,000,000% All Stats' },

  // === RESOURCE ACHIEVEMENTS ===
  { id: 'perfect_hunter', name: 'Flawless Execution', desc: '100% Quality Stat',   req: () => (character.stats.quality || 0) >= 100, bonus: { drop: 0.50 }, bonusDesc: '+50% Drop Bonus' },

  // === NEW PLAYER / MILESTONE ACHIEVEMENTS ===
  { id: 'first_spawn', name: 'Digital Awakening', desc: 'First time spawning into the game', req: () => character.firstLoginTime > 0, bonus: { atk: 0.10 }, bonusDesc: '+10% ATK' },
  { id: 'daily_login', name: 'Dedicated', desc: 'Login for 1 day total', req: () => getDaysSinceFirstLogin() >= 1, bonus: { atk: 0.15 }, bonusDesc: '+15% ATK' },
  { id: 'daily_login_10', name: 'Committed', desc: 'Login for 10 days total', req: () => getDaysSinceFirstLogin() >= 10, bonus: { atk: 0.50 }, bonusDesc: '+50% ATK' },
  { id: 'daily_login_100', name: 'Veteran Player', desc: 'Login for 100 days total', req: () => getDaysSinceFirstLogin() >= 100, bonus: { hp: 1.00 }, bonusDesc: '+100% HP' },
  { id: 'daily_login_1000', name: 'Legendary Devotion', desc: 'Login for 1000 days total', req: () => getDaysSinceFirstLogin() >= 1000, bonus: { all: 10.0 }, bonusDesc: '+1000% All Stats' },

  // === PLAYTIME ACHIEVEMENTS ===
  { id: 'playtime_1h', name: 'Getting Started', desc: 'Play for 1 hour', req: () => character.totalPlayTime >= 3600, bonus: { atk: 0.10 }, bonusDesc: '+10% ATK' },
  { id: 'playtime_10h', name: 'Regular Player', desc: 'Play for 10 hours', req: () => character.totalPlayTime >= 36000, bonus: { atk: 0.25 }, bonusDesc: '+25% ATK' },
  { id: 'playtime_100h', name: 'Addicted', desc: 'Play for 100 hours', req: () => character.totalPlayTime >= 360000, bonus: { hp: 0.50 }, bonusDesc: '+50% HP' },
  { id: 'playtime_1000h', name: 'No Life', desc: 'Play for 1000 hours', req: () => character.totalPlayTime >= 3600000, bonus: { all: 2.00 }, bonusDesc: '+200% All Stats' },
];

export const achievementState: AchievementState = $state({
  unlocked: {}
});

// FIXED: Throttled check with error logging
export function checkAchievements(): void {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_THROTTLE) return;
  lastCheckTime = now;

  achievementDefs.forEach(ach => {
    if (!achievementState.unlocked[ach.id]) {
      try {
        const result = ach.req();
        if (result) {
          achievementState.unlocked[ach.id] = true;
          applyBonus(ach.bonus);
          addLog(`[ACH] ${ach.name} unlocked! ${ach.bonusDesc}`, 'awakening');
        }
      } catch (e) {
        console.error(`[Achievement Error] Failed to check "${ach.id}":`, e);
      }
    }
  });
}

export function getAchievementMult(statType: 'atk' | 'hp' | 'regen'): Decimal {
  let bonusTotal = 0;
  achievementDefs.forEach(ach => {
    if (achievementState.unlocked[ach.id]) {
      const b = ach.bonus;
      if (statType === 'atk' && b.atk) bonusTotal += b.atk;
      if (statType === 'hp' && b.hp) bonusTotal += b.hp;
      if (statType === 'regen' && b.regen) bonusTotal += b.regen;
      if (b.all) bonusTotal += b.all;
    }
  });
  return new Decimal(1 + bonusTotal);
}

function applyBonus(bonus: AchievementBonus): void {
  if (bonus.drop) character.dropBonus = Math.min(0.9, (character.dropBonus || 0) + bonus.drop);
}

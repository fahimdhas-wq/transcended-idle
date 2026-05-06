// src/systems/achievementSystem.svelte.js
import { character } from '../modules/character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { miningState } from '../modules/mining.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { skillsState } from '../modules/skills.svelte.js';
import { overclockState } from '../modules/overclock.svelte.js';

// Memoization cache
const reqCache = new Map();
let lastCheckTime = 0;
const CHECK_THROTTLE = 1000; // Check achievements max once per second

export const achievementDefs = [
  { id: 'first_blood',    name: 'First Blood',      desc: '1 kill',              req: () => character.kills.gte(1),       bonus: { atk: 0.10 },  bonusDesc: '+10% ATK' },
  { id: 'slayer_10',      name: 'Slayer',            desc: '10 kills',            req: () => character.kills.gte(10),      bonus: { atk: 0.10 },  bonusDesc: '+10% ATK' },
  { id: 'hunter_100',     name: 'Hunter',            desc: '100 kills',           req: () => character.kills.gte(100),     bonus: { atk: 0.15 },  bonusDesc: '+15% ATK' },
  { id: 'killer_1k',      name: 'Mass Killer',       desc: '1,000 kills',         req: () => character.kills.gte(1000),    bonus: { atk: 0.25 },  bonusDesc: '+25% ATK' },
  { id: 'genocide_10k',   name: 'Genocide',          desc: '10,000 kills',        req: () => character.kills.gte(10000),   bonus: { atk: 0.50 },  bonusDesc: '+50% ATK' },
  { id: 'extinction_100k',name: 'Extinction',        desc: '100,000 kills',       req: () => character.kills.gte(100000),  bonus: { atk: 1.00 },  bonusDesc: '+100% ATK' },
  { id: 'obliteration_1m',name: 'Obliteration',      desc: '1,000,000 kills',     req: () => character.kills.gte(1000000), bonus: { atk: 2.50 },  bonusDesc: '+250% ATK' },
  { id: 'annihilation_10m',name: 'Annihilation',     desc: '10M kills',           req: () => character.kills.gte(10000000), bonus: { atk: 5.00 }, bonusDesc: '+500% ATK' },
  { id: 'cataclysm_100m', name: 'Cataclysm',         desc: '100M kills',          req: () => character.kills.gte(100000000), bonus: { all: 2.00 }, bonusDesc: '+200% All Stats' },
  { id: 'level_5',        name: 'Rookie',            desc: 'Reach Level 5',       req: () => character.level.gte(5),       bonus: { hp: 0.10 },   bonusDesc: '+10% HP' },
  { id: 'level_25',       name: 'Veteran',           desc: 'Reach Level 25',      req: () => character.level.gte(25),      bonus: { hp: 0.20 },   bonusDesc: '+20% HP' },
  { id: 'level_100',      name: 'Elite',             desc: 'Reach Level 100',     req: () => character.level.gte(100),     bonus: { hp: 0.50 },   bonusDesc: '+50% HP' },
  { id: 'level_500',      name: 'Transcendent',      desc: 'Reach Level 500',     req: () => character.level.gte(500),     bonus: { hp: 1.00 },   bonusDesc: '+100% HP' },
  { id: 'level_1000',     name: 'God Mode',          desc: 'Reach Level 1000',    req: () => character.level.gte(1000),    bonus: { hp: 2.50 },   bonusDesc: '+250% HP' },
  { id: 'level_5000',     name: 'Universal Being',   desc: 'Reach Level 5000',    req: () => character.level.gte(5000),    bonus: { hp: 5.00 },   bonusDesc: '+500% HP' },
  { id: 'level_10000',    name: 'Cosmic Entity',     desc: 'Reach Level 10000',   req: () => character.level.gte(10000),   bonus: { all: 5.00 },  bonusDesc: '+500% All Stats' },
  { id: 'survive_1',      name: 'Near Death',        desc: 'Trigger Verge of Death once', req: () => character.vergeCount >= 1,  bonus: { regen: 0.20 }, bonusDesc: '+20% Regen' },
  { id: 'survive_10',     name: 'Unkillable',        desc: 'Trigger Verge 10 times',       req: () => character.vergeCount >= 10, bonus: { regen: 0.50 }, bonusDesc: '+50% Regen' },
  { id: 'survive_50',     name: 'Phoenix',           desc: 'Trigger Verge 50 times',       req: () => character.vergeCount >= 50, bonus: { regen: 1.00 }, bonusDesc: '+100% Regen' },
  { id: 'seal_1',         name: 'Awakened',          desc: 'Break Seal 1',        req: () => character.seals >= 1,       bonus: { all: 0.50 },  bonusDesc: '+50% All Stats' },
  { id: 'seal_3',         name: 'Ascended',          desc: 'Break 3 Seals',       req: () => character.seals >= 3,       bonus: { all: 1.00 },  bonusDesc: '+100% All Stats' },
  { id: 'seal_7',         name: 'Divine',            desc: 'Break all 7 Seals',   req: () => character.seals >= 7,       bonus: { all: 5.00 },  bonusDesc: '+500% All Stats' },
  { id: 'crit_10',        name: 'Sharp Eye',         desc: '10% Crit Chance',     req: () => (character.stats.critChance || 0) >= 0.10, bonus: { crit: 0.05 }, bonusDesc: '+5% Crit' },
  { id: 'crit_50',        name: 'Precision',         desc: '50% Crit Chance',     req: () => (character.stats.critChance || 0) >= 0.50, bonus: { crit: 0.10 }, bonusDesc: '+10% Crit' },
  { id: 'crit_100',       name: 'Full Auto Crit',    desc: '100% Crit Chance',    req: () => (character.stats.critChance || 0) >= 1.00, bonus: { crit: 0.20 }, bonusDesc: '+20% Crit Dmg' },
  { id: 'loot_first',     name: 'Scavenger',         desc: 'Get 1 drop',          req: () => (character.totalDrops || 0) >= 1,    bonus: { drop: 0.10 }, bonusDesc: '+10% Drop Rate' },
  { id: 'loot_50',        name: 'Collector',         desc: 'Get 50 drops',        req: () => (character.totalDrops || 0) >= 50,   bonus: { drop: 0.20 }, bonusDesc: '+20% Drop Rate' },
  { id: 'loot_500',       name: 'Hoarder',           desc: 'Get 500 drops',       req: () => (character.totalDrops || 0) >= 500,  bonus: { drop: 0.50 }, bonusDesc: '+50% Drop Rate' },
  { id: 'mine_tier_5',    name: 'Deep Miner',        desc: 'Mining Tool Tier 5',  req: () => miningState.toolTier >= 5,  bonus: { atk: 0.25 }, bonusDesc: '+25% ATK' },
  { id: 'mine_tier_10',   name: 'Core Extractor',    desc: 'Mining Tool Tier 10', req: () => miningState.toolTier >= 10, bonus: { all: 1.00 }, bonusDesc: '+100% All Stats' },
  { id: 'mine_fragments', name: 'Data Weaver',       desc: '1000 Data Fragments', req: () => bestiaryState.dataFragments.gte(1000), bonus: { atk: 0.50 }, bonusDesc: '+50% ATK' },
  { id: 'forest_tier_5',  name: 'Bio Engineer',      desc: 'Bio Tool Tier 5',     req: () => forestryState.toolTier >= 5,  bonus: { hp: 0.25 }, bonusDesc: '+25% HP' },
  { id: 'forest_tier_10', name: 'Genetic Architect', desc: 'Bio Tool Tier 10',    req: () => forestryState.toolTier >= 10, bonus: { all: 1.00 }, bonusDesc: '+100% All Stats' },
  { id: 'dna_fragments',  name: 'DNA Sculptor',      desc: '1000 DNA Fragments',  req: () => forestryState.dnaFragments.gte(1000), bonus: { hp: 0.50 }, bonusDesc: '+50% HP' },
  { id: 'bestiary_10',    name: 'Zoologist',         desc: 'Master 10 species',   req: () => Object.values(bestiaryState.entries).filter(e => {
    const kills = e.kills instanceof Decimal ? e.kills.toNumber() : e.kills;
    return kills >= 500;
  }).length >= 10, bonus: { all: 0.50 }, bonusDesc: '+50% All Stats' },
  { id: 'bestiary_30',    name: 'Apex Predator',     desc: 'Master 30 species',   req: () => Object.values(bestiaryState.entries).filter(e => {
    const kills = e.kills instanceof Decimal ? e.kills.toNumber() : e.kills;
    return kills >= 500;
  }).length >= 30, bonus: { all: 1.50 }, bonusDesc: '+150% All Stats' },
  { id: 'level_1m',       name: 'Millionaire',       desc: 'Reach Level 1,000,000', req: () => character.level.gte(1000000), bonus: { all: 10.0 }, bonusDesc: '+1000% All Stats' },
  { id: 'level_10m',      name: 'Trans-Reality',     desc: 'Reach Level 10,000,000', req: () => character.level.gte(10000000), bonus: { all: 50.0 }, bonusDesc: '+5000% All Stats' },
  { id: 'level_100m',     name: 'Omega Point',       desc: 'Reach Level 100,000,000', req: () => character.level.gte(100000000), bonus: { all: 500.0 }, bonusDesc: '+50,000% All Stats' },
  { id: 'kills_1b',       name: 'Reaper of Stars',   desc: '1 Billion Kills',     req: () => character.kills.gte(1000000000), bonus: { atk: 1000.0 }, bonusDesc: '+100,000% ATK' },
  { id: 'ore_hoarder',    name: 'Gems of Void',      desc: '1e15 Cosmic Cores',   req: () => miningState.resources.cosmicCore.gte(1e15), bonus: { all: 2.0 }, bonusDesc: '+200% All Stats' },
  { id: 'wood_hoarder',   name: 'Forest of Souls',   desc: '1e15 Ethereal Cores', req: () => forestryState.resources.etherealCore.gte(1e15), bonus: { all: 2.0 }, bonusDesc: '+200% All Stats' },
  { id: 'perfect_hunter', name: 'Flawless Execution', desc: '100% Quality Stat',     req: () => (character.stats.quality || 0) >= 100, bonus: { drop: 0.50 }, bonusDesc: '+50% Drop Bonus' },
  { id: 'awakening_5',    name: 'Metamorphosis',    desc: 'Awakening Stage 5',   req: () => character.awakeningStage >= 5,   bonus: { all: 2.0 },   bonusDesc: '+200% All Stats' },
  { id: 'awakening_25',   name: 'Divine Evolution', desc: 'Awakening Stage 25',  req: () => character.awakeningStage >= 25,  bonus: { all: 50.0 },  bonusDesc: '+5000% All Stats' },
  { id: 'awakening_100',  name: 'Omniversal Will',  desc: 'Awakening Stage 100', req: () => character.awakeningStage >= 100, bonus: { all: 1000.0 }, bonusDesc: '+100,000% All Stats' },
  { id: 'souls_1k',       name: 'Soul Harvester',   desc: 'Collect 1,000 Souls', req: () => bestiaryState.souls.gte(1000),   bonus: { all: 1.0 },   bonusDesc: '+100% All Stats' },
  { id: 'souls_1m',       name: 'Ghost in the Shell',desc: '1 Million Souls',    req: () => bestiaryState.souls.gte(1e6),    bonus: { all: 10.0 },  bonusDesc: '+1000% All Stats' },
  { id: 'souls_1b',       name: 'Underworld King',  desc: '1 Billion Souls',     req: () => bestiaryState.souls.gte(1e9),    bonus: { all: 500.0 }, bonusDesc: '+50,000% All Stats' },
  { id: 'skill_ssr',      name: 'Golden Code',      desc: 'Any Skill at SSR',    req: () => skillsState.skills.some(s => s.tierIndex >= 27), bonus: { all: 5.0 }, bonusDesc: '+500% All Stats' },
  { id: 'skill_ur',       name: 'Ultra Rare',       desc: 'Any Skill at UR',     req: () => skillsState.skills.some(s => s.tierIndex >= 29), bonus: { all: 25.0 }, bonusDesc: '+2500% All Stats' },
  { id: 'skill_ex',       name: 'Broken Reality',   desc: 'Any Skill at EX',     req: () => skillsState.skills.some(s => s.tierIndex >= 32), bonus: { all: 100.0 }, bonusDesc: '+10,000% All Stats' },
  { id: 'skill_trans',    name: 'The Final Tier',   desc: 'Skill: Transcendent', req: () => skillsState.skills.some(s => s.tierIndex >= 33), bonus: { all: 5000.0 }, bonusDesc: '+500,000% All Stats' },
  { id: 'data_tycoon',    name: 'Server Overlord',  desc: '1 Million Data Frags',req: () => bestiaryState.dataFragments.gte(1e6),  bonus: { atk: 10.0 }, bonusDesc: '+1000% ATK' },
  { id: 'dna_tycoon',     name: 'Genetic Prophet',  desc: '1 Million DNA Frags', req: () => forestryState.dnaFragments.gte(1e6),   bonus: { hp: 10.0 }, bonusDesc: '+1000% HP' },
  { id: 'skill_hoarder',  name: 'Fragment Singularity', desc: '1e12 Skill Frags', req: () => character.skillFragments.gte(1e12), bonus: { all: 100.0 }, bonusDesc: '+10,000% All Stats' },
  { id: 'drone_fleet',    name: 'Industrialist',    desc: '25 Mining Drones',    req: () => miningState.drones >= 25,        bonus: { all: 5.0 },   bonusDesc: '+500% All Stats' },
  { id: 'chamber_master', name: 'Arboretum',        desc: '25 Growth Chambers',  req: () => forestryState.growthChambers >= 25, bonus: { all: 5.0 },   bonusDesc: '+500% All Stats' },
  { id: 'stat_e100',      name: 'Century Power',    desc: 'Attack > 1e100',      req: () => character.stats.attack.e >= 100,  bonus: { atk: 100.0 }, bonusDesc: '+10,000% ATK' },
  { id: 'stat_e500',      name: 'Quasar Strength',  desc: 'Attack > 1e500',      req: () => character.stats.attack.e >= 500,  bonus: { all: 1000.0 }, bonusDesc: '+100,000% All Stats' },
  { id: 'stat_e1000',     name: 'Universal Constant',desc: 'HP > 1e1000',        req: () => character.stats.maxHp.e >= 1000,   bonus: { all: 10000.0 }, bonusDesc: '+1,000,000% All Stats' },
  { id: 'stat_e5000',     name: 'Singularity Force', desc: 'Attack > 1e5000',    req: () => character.stats.attack.e >= 5000,  bonus: { all: 50000.0 }, bonusDesc: '+5,000,000% All Stats' },
  { id: 'stat_e10000',    name: 'Omnipotence',      desc: 'Attack > 1e10000',    req: () => character.stats.attack.e >= 10000, bonus: { all: 500000.0 }, bonusDesc: '+50,000,000% All Stats' },
  { id: 'kills_1t',       name: 'World Ender',      desc: '1 Trillion Kills',    req: () => character.kills.gte(1e12),        bonus: { atk: 5000.0 }, bonusDesc: '+500,000% ATK' },
  { id: 'kills_1q',       name: 'Galaxy Ender',     desc: '1 Quadrillion Kills', req: () => character.kills.gte(1e15),        bonus: { atk: 50000.0 }, bonusDesc: '+5,000,000% ATK' },
  { id: 'kills_1qi',      name: 'Universe Ender',   desc: '1 Quintillion Kills', req: () => character.kills.gte(1e18),        bonus: { atk: 500000.0 }, bonusDesc: '+50,000,000% ATK' },
  { id: 'kills_googol',   name: 'Googol Deaths',    desc: '1e100 Kills',         req: () => character.kills.gte('1e100'),     bonus: { atk: 5000000.0 }, bonusDesc: '+500,000,000% ATK' },
  { id: 'levels_1b',      name: 'Infinity Bound',   desc: '1 Billion Levels',    req: () => character.level.gte(1e9),         bonus: { all: 250.0 }, bonusDesc: '+25,000% All Stats' },
  { id: 'levels_1t',      name: 'Beyond Infinity',  desc: '1 Trillion Levels',   req: () => character.level.gte(1e12),        bonus: { all: 25000.0 }, bonusDesc: '+2,500,000% All Stats' },
  { id: 'levels_1q',      name: 'The Source',       desc: '1 Quadrillion Levels',req: () => character.level.gte(1e15),        bonus: { all: 2500000.0 }, bonusDesc: '+250,000,000% All Stats' },
  { id: 'overclock_1',    name: 'First Ascension',  desc: 'Overclock Once',      req: () => overclockState.timesOverclocked >= 1, bonus: { all: 2.0 }, bonusDesc: '+200% All Stats' },
  { id: 'overclock_10',   name: 'Tenth Ascension',  desc: 'Overclock 10 Times',  req: () => overclockState.timesOverclocked >= 10, bonus: { all: 50.0 }, bonusDesc: '+5,000% All Stats' },
  { id: 'overclock_100',  name: 'Hundredth Ascension', desc: 'Overclock 100 Times',req: () => overclockState.timesOverclocked >= 100, bonus: { all: 5000.0 }, bonusDesc: '+500,000% All Stats' },
  { id: 'overclock_1000', name: 'Millennium Ascendant', desc: 'Overclock 1000 Times',req: () => overclockState.timesOverclocked >= 1000, bonus: { all: 100000.0 }, bonusDesc: '+10,000,000% All Stats' },
];

export const achievementState = $state({
  unlocked: {}
});

// FIXED: Throttled check with error logging
export function checkAchievements() {
  const now = Date.now();
  if (now - lastCheckTime < CHECK_THROTTLE) return;
  lastCheckTime = now;

  achievementDefs.forEach(ach => {
    if (!achievementState.unlocked[ach.id]) {
      try {
        // Check cache first
        const cacheKey = ach.id;
        const cached = reqCache.get(cacheKey);
        
        if (cached && (now - cached.time < 5000)) {
          if (cached.value) {
            achievementState.unlocked[ach.id] = true;
            applyBonus(ach.bonus);
            addLog(`[ACH] ${ach.name} unlocked! ${ach.bonusDesc}`, 'awakening');
            reqCache.delete(cacheKey);
          }
        } else {
          const result = ach.req();
          reqCache.set(cacheKey, { value: result, time: now });
          
          if (result) {
            achievementState.unlocked[ach.id] = true;
            applyBonus(ach.bonus);
            addLog(`[ACH] ${ach.name} unlocked! ${ach.bonusDesc}`, 'awakening');
            reqCache.delete(cacheKey);
          }
        }
      } catch (e) {
        console.error(`[Achievement Error] Failed to check "${ach.id}":`, e);
      }
    }
  });
}

export function getAchievementMult(statType) {
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

function applyBonus(bonus) {
  if (bonus.drop) character.dropBonus = Math.min(0.9, (character.dropBonus || 0) + bonus.drop);
}
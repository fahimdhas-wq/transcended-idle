
import { character } from './character.svelte.js';
import { Decimal } from '../systems/decimal.js';
import { flushStatCache } from './combat.svelte.js';

export interface Skill {
  id: string;
  name: string;
  description: string;
  tierIndex: number;
  fragments: Decimal;
  fragmentsNeeded: Decimal;
  cooldown: number;
  lastUsed: number;
  autoCast: boolean;
  poisonTicks?: number;
  poisonDmg?: Decimal;
}

export interface SkillsState {
  skills: Skill[];
}

export const tiers: string[] = [
  'F-', 'F', 'F+',
  'E-', 'E', 'E+',
  'D-', 'D', 'D+',
  'C-', 'C', 'C+',
  'B-', 'B', 'B+',
  'A-', 'A', 'A+',
  'S-', 'S', 'S+',
  'SS-', 'SS', 'SS+',
  'SSS-', 'SSS', 'SSS+',
  'SSR', 'SSR+',
  'UR', 'UR+', 'URR',
  'EX', 'EX+',
  'Transcendent', 'Transcendent+', 'Transcendent++', 'Transcendent+++', 'Transcendent EX',
  'Ethereal', 'Ethereal+', 'Ethereal++', 'Ethereal+++', 'Ethereal EX',
  'Cosmic', 'Cosmic+', 'Cosmic++', 'Cosmic+++', 'Cosmic EX',
  'Omni', 'Omni+', 'Omni++', 'Omni+++', 'Omni EX',
  'Singularity', 'Singularity+', 'Singularity++', 'Singularity+++', 'Singularity EX',
  'Continuum', 'Continuum+', 'Continuum++', 'Continuum+++', 'Continuum EX',
  'Paradox', 'Paradox+', 'Paradox++', 'Paradox+++', 'Paradox EX',
  'Reality', 'Reality+', 'Reality++', 'Reality+++', 'Reality EX',
  'Chronos', 'Chronos+', 'Chronos++', 'Chronos+++', 'Chronos EX',
  'Eternal', 'Eternal+', 'Eternal++', 'Eternal+++', 'Eternal EX',
  'Absolute', 'Absolute+', 'Absolute++', 'Absolute+++', 'Absolute EX',
  'Omega', 'Omega+', 'Omega++', 'Omega+++', 'Omega EX',
  'Zenith', 'Zenith+', 'Zenith++', 'Zenith+++', 'Zenith EX',
  'Apotheosis', 'Apotheosis+', 'Apotheosis++', 'Apotheosis+++', 'Apotheosis EX',
  'Infinite', 'Infinite+', 'Infinite++', 'Infinite+++', 'Infinite EX'
];

export const skillsState: SkillsState = $state({
  skills: [
    {
      id: 'emp_strike',
      name: 'EMP Strike',
      description: 'Unleashes a focused electromagnetic burst. Adds 3x ATK at tier 1, doubling each tier (Tier 1: 3x, Tier 10: 1,536x, Tier 50: 1.7e15x).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(30),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'nano_repair',
      name: 'Nano Repair',
      description: 'Deploys nanobots restoring 20% max HP+Shield at tier 1, doubling each tier (Tier 1: 20%, Tier 10: 10,240%, Tier 50: 1.1e16%).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(60),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'chain_hack',
      name: 'Chain Hack',
      description: 'Infects enemy code with poison. Adds 6x ATK at tier 1, doubling each tier (Tier 1: 6x, Tier 10: 3,072x, Tier 50: 3.4e15x).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(80),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true,
      poisonTicks: 0,
      poisonDmg: new Decimal(0)
    },
    {
      id: 'shield_surge',
      name: 'Shield Surge',
      description: 'Surges energy into shields, restoring 30% max Shield at tier 1, doubling each tier (Tier 1: 30%, Tier 10: 15,360%). Also grants +1% Skip Damage per tier.',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(40),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'data_siphon',
      name: 'Data Siphon',
      description: 'Siphons data from enemies. Grants 25 base fragments at tier 1, doubling each tier (Tier 1: 25, Tier 10: 12,800, Tier 50: 1.4e16).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(100),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'xp_boost',
      name: 'Neural Learning',
      description: 'Passively multiplies all XP earned. +50% bonus at tier 1 (1.5x), doubling bonus each tier (Tier 1: 1.5x, Tier 10: 257x, Tier 50: 2.8e14x).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(120),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'cleave',
      name: 'System Wipe',
      description: 'Chance to instantly kill +100 extra enemies per kill at tier 1, doubling each tier (Tier 1: 100, Tier 10: 51,200, Tier 50: 5.6e16).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(150),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'loot_boost',
      name: 'Deep Scan',
      description: 'Passively increases drop rates. +15% at tier 1, doubling each tier (Tier 1: +15%, Tier 10: +7,680%, Tier 50: +8.4e15%).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(180),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'crit_surge',
      name: 'Crit Surge',
      description: 'Permanently increases Critical Damage. +0.5x at tier 1 (2.5x total), doubling each tier (Tier 1: +0.5x, Tier 10: +256x, Tier 50: +2.8e14x). Base crit is 2x.',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(250),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'omni_stat',
      name: 'God Mode',
      description: 'Permanently multiplies ALL stats (HP, ATK, DEF, Regen, Skills). 1.2x at tier 1, doubling each tier (Tier 1: 1.2x, Tier 10: 614x, Tier 50: 6.8e14x). Extremely expensive.',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(500),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    }
  ]
});

// Base fragment costs per skill — used by ascension reset
export const SKILL_BASE_COSTS: Record<string, number> = {
  emp_strike:    30,
  overclock:     50,
  nano_repair:   60,
  chain_hack:    80,
  shield_surge:  40,
  data_siphon:   100,
  xp_boost:      120,
  cleave:        150,
  loot_boost:    180,
  crit_surge:    250,
  omni_stat:     500
};

export function getOmniMult(): Decimal {
  const omniSkill = skillsState.skills.find(s => s.id === 'omni_stat');
  if (omniSkill && omniSkill.tierIndex > 0) {
    return new Decimal(1.2).mul(Decimal.TWO.pow(omniSkill.tierIndex - 1));
  }
  return Decimal.ONE;
}

export function upgradeAllSkills(): string {
  let totalUpgrades = 0;
  // Batch upgrade all skills without triggering reactive updates mid-loop
  skillsState.skills.forEach(skill => {
    while (character.skillFragments.gte(skill.fragmentsNeeded) && skill.tierIndex < tiers.length - 1) {
      character.skillFragments = character.skillFragments.sub(skill.fragmentsNeeded);
      skill.tierIndex++;
      skill.fragmentsNeeded = skill.fragmentsNeeded.mul(2.5).floor();
      totalUpgrades++;
    }
  });
  // Only flush cache and trigger UI update once at the end
  if (totalUpgrades > 0) {
    flushStatCache();
  }
  return `System Overhaul: ${totalUpgrades} skill tiers purchased using available fragments.`;
}


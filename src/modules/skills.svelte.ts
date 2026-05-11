
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
      description: 'Unleashes a focused electromagnetic burst. Deals 3x ATK base damage, scaling by +50% per tier (Tier 1: 3x, Tier 10: 18x, Tier 50: 127.5x).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(30),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'overclock',
      name: 'Overclock',
      description: 'Overclocks your neural processor. Grants +25% damage multiplier per tier to all attacks (Tier 10: 2.5x total, Tier 50: 12.5x total).',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(50),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'nano_repair',
      name: 'Nano Repair',
      description: 'Deploys nanobots to restore 20% max HP and Shield instantly. Heals an additional +5% per tier (Tier 10: 70% combined, Tier 50: 270% combined).',
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
      description: "Infects the enemy's core code with poison. Deals 2x ATK base damage per tick, scaling by +30% per tier. Starts at 3 ticks, gains +1 tick every 5 tiers.",
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
      description: 'Surges excess energy into your shield matrix, regenerating 30% max Shield instantly. Gains +3% Skip Damage chance per tier (Tier 10: 60% skip, Tier 50: 180% skip).',
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
      description: 'Siphons data from the enemy. Grants 5x base Skill Fragments, with +1x bonus per tier (Tier 10: 15x, Tier 50: 55x fragments).',
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
      description: 'Passively increases XP gained from all sources by 20% per tier (Tier 10: 2x XP, Tier 50: 10x XP, Tier 100: 20x XP).',
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
      description: 'Passively grants a chance to instantly kill +100 additional enemies per tier when you get a kill.',
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
      description: 'Passively increases drop rates and rarity chances by 10% per tier (Tier 10: 100% bonus, Tier 50: 500% bonus). Higher tiers unlock rare item drops.',
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
      description: 'Permanently increases Critical Damage Multiplier by 0.5x per tier (Tier 10: 5x crits, Tier 50: 25x crits, Tier 100: 50x crits). Base crit damage is 2x.',
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
      description: 'Permanently multiplies ALL stats (HP, ATK, DEF, Regen) by 1.2x per tier. (Tier 10: 6.2x all stats, Tier 50: 9100x all stats, Tier 100: 82M x all stats). Extremely expensive.',
      tierIndex: 0,
      fragments: new Decimal(0),
      fragmentsNeeded: new Decimal(500),
      cooldown: 0,
      lastUsed: 0,
      autoCast: true
    }
  ]
});

export function getOmniMult(): Decimal {
  const omniSkill = skillsState.skills.find(s => s.id === 'omni_stat');
  if (omniSkill && omniSkill.tierIndex > 0) {
    return new Decimal(1.2).pow(omniSkill.tierIndex);
  }
  return new Decimal(1);
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


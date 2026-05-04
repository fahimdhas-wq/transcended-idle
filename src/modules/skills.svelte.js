import { character } from './character.svelte.js';

export const tiers = [
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
  'EX', 'Transcendent',
  'Ethereal', 'Cosmic', 'Omni', 'Singularity', 
  'Continuum', 'Paradox', 'Reality', 'Chronos', 
  'Eternal', 'Absolute', 'Omega', 'Zenith', 'Apotheosis', 'Infinite'
];

export const skillsState = $state({
  skills: [
    {
      id: 'emp_strike',
      name: 'EMP Strike',
      description: 'Unleashes a focused electromagnetic burst dealing 3× ATK bonus damage. Scales multiplicatively with tier.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 30,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'overclock',
      name: 'Overclock',
      description: 'Overclocks your neural processor, granting a massive multiplier to all damage output per tier.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 50,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'nano_repair',
      name: 'Nano Repair',
      description: 'Deploys nanobots to instantly restore 20% of max HP and Shield. Heals more at higher tiers.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 60,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'chain_hack',
      name: 'Chain Hack',
      description: 'Infects the enemy\'s core code, dealing 2× ATK as poison damage every tick for 3 ticks.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 80,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true,
      poisonTicks: 0,
      poisonDmg: 0
    },
    {
      id: 'shield_surge',
      name: 'Shield Surge',
      description: 'Surges excess energy into your shield matrix, regenerating 30% max Shield instantly and permanently boosting Skip Damage chance by 1% per tier.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 40,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'data_siphon',
      name: 'Data Siphon',
      description: 'Siphons data from the enemy. Each activation grants 5× normal Skill Fragments.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 100,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true
    },
    {
      id: 'xp_boost',
      name: 'Neural Learning',
      description: 'Passively increases XP gained from all sources by 20% per tier.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 120,
      cooldown: 0,
      lastUsed: 0,
      autoCast: true // Passive
    },
    {
      id: 'cleave',
      name: 'System Wipe',
      description: 'Passively grants a chance to instantly kill +1 additional enemy per tier when you get a kill.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 150,
      cooldown: 0,
      lastUsed: 0,
      autoCast: true // Passive
    },
    {
      id: 'loot_boost',
      name: 'Deep Scan',
      description: 'Passively increases drop rates and rarity chances of loot by 10% per tier.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 180,
      cooldown: 0,
      lastUsed: 0,
      autoCast: true // Passive
    },
    {
      id: 'crit_surge',
      name: 'Crit Surge',
      description: 'Permanently increases Critical Damage Multiplier by 0.5× per tier.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 250,
      cooldown: 0, // Auto-cast, no cooldown
      lastUsed: 0,
      autoCast: true // Passive effect, always active
    },
    {
      id: 'omni_stat',
      name: 'God Mode',
      description: 'Permanently multiplies ALL stats (HP, ATK, DEF, Regen) by 1.2× per tier. Extremely expensive to upgrade.',
      tierIndex: 0,
      fragments: 0,
      fragmentsNeeded: 500, // Very costly
      cooldown: 0,
      lastUsed: 0,
      autoCast: true // Passive
    }
  ]
});

import { Decimal } from '../systems/decimal.js';

export function getOmniMult() {
  const omniSkill = skillsState.skills.find(s => s.id === 'omni_stat');
  if (omniSkill && omniSkill.tierIndex > 0) {
    return new Decimal(1.2).pow(omniSkill.tierIndex);
  }
  return new Decimal(1);
}

export function upgradeAllSkills() {
  let totalUpgrades = 0;
  skillsState.skills.forEach(skill => {
    while (character.skillFragments.gte(skill.fragmentsNeeded) && skill.tierIndex < tiers.length - 1) {
      character.skillFragments = character.skillFragments.sub(skill.fragmentsNeeded);
      skill.tierIndex++;
      skill.fragmentsNeeded = Math.floor(skill.fragmentsNeeded * 2.5);
      totalUpgrades++;
    }
  });
  return `System Overhaul: ${totalUpgrades} skill tiers purchased using available fragments.`;
}

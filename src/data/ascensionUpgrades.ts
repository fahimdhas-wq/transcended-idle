
// ============================================================
// ASCENSION UPGRADE DEFINITIONS
// Spend Ascension Shards on permanent upgrades that persist
// through resets.
// ============================================================

export type AscensionTier = 0 | 1 | 2 | 3 | 4 | 5;

export const ASCENSION_TIER_NAMES: Record<AscensionTier, string> = {
  0: 'Mortal',
  1: 'Ascended',
  2: 'Transcended',
  3: 'Cosmic',
  4: 'Eternal',
  5: 'Infinite'
};

export const ASCENSION_TIER_UNLOCKS: Record<AscensionTier, string> = {
  0: 'Start as a Mortal',
  1: 'Unlocks +2 upgrade slots',
  2: 'Unlocks Fractures',
  3: 'Unlocks Rifts',
  4: 'Unlocks Paradox Challenges',
  5: 'Unlocks custom ascension path'
};

export const TIER_REQUIREMENTS: Record<AscensionTier, number> = {
  0: 0,
  1: 1,
  2: 5,
  3: 10,
  4: 25,
  5: 50
};

export const TIER_SHARD_MULTIPLIERS: Record<AscensionTier, number> = {
  0: 1,
  1: 1.5,
  2: 2.5,
  3: 5,
  4: 10,
  5: 25
};

export type UpgradeCategory = 'power' | 'economy' | 'multiplier';

export interface AscensionUpgradeDef {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  maxLevel: number;
  baseCost: number;
  costScaling: number; // multiplier per level
  effect: (level: number) => number;
  effectDesc: (level: number) => string;
  tierRequired: AscensionTier;
  icon: string;
}

export const ascensionUpgrades: AscensionUpgradeDef[] = [
  // ═══════════════════════════════════════════════════════════
  // POWER TREE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'essence_resonance',
    name: 'Essence Resonance',
    description: '+50% ATK per level per ascension',
    category: 'power',
    maxLevel: 10,
    baseCost: 50,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '⚔️',
    effect: (level) => level * 0.5,
    effectDesc: (level) => `+${(level * 50)}% ATK`
  },
  {
    id: 'vitality_core',
    name: 'Vitality Core',
    description: '+50% HP per level per ascension',
    category: 'power',
    maxLevel: 10,
    baseCost: 50,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '❤',
    effect: (level) => level * 0.5,
    effectDesc: (level) => `+${(level * 50)}% HP`
  },
  {
    id: 'momentum_mastery',
    name: 'Momentum Mastery',
    description: 'Momentum decays 15% slower per level',
    category: 'power',
    maxLevel: 5,
    baseCost: 75,
    costScaling: 2.5,
    tierRequired: 1,
    icon: '💨',
    effect: (level) => level * 0.15,
    effectDesc: (level) => `-${(level * 15)}% decay`
  },
  {
    id: 'fragment_adept',
    name: 'Fragment Adept',
    description: '+25% skill fragments per level',
    category: 'power',
    maxLevel: 10,
    baseCost: 60,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '💎',
    effect: (level) => level * 0.25,
    effectDesc: (level) => `+${(level * 25)}% fragments`
  },
  {
    id: 'soul_extraction',
    name: 'Soul Extraction',
    description: 'Souls from bestiary grant +10% stronger multiplier per level',
    category: 'power',
    maxLevel: 5,
    baseCost: 100,
    costScaling: 3.0,
    tierRequired: 1,
    icon: '👻',
    effect: (level) => level * 0.10,
    effectDesc: (level) => `+${(level * 10)}% soul power`
  },
  {
    id: 'crit_mastery',
    name: 'Critical Mastery',
    description: '+5% crit chance per level',
    category: 'power',
    maxLevel: 20,
    baseCost: 80,
    costScaling: 1.8,
    tierRequired: 2,
    icon: '🎯',
    effect: (level) => level * 0.05,
    effectDesc: (level) => `+${(level * 5)}% crit`
  },

  // ═══════════════════════════════════════════════════════════
  // ECONOMY TREE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'quick_start',
    name: 'Quick Start',
    description: 'Start with bonus gold after ascension',
    category: 'economy',
    maxLevel: 5,
    baseCost: 30,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '⚡',
    effect: (level) => level * 100,
    effectDesc: (level) => `+${level * 100}% starting gold`
  },
  {
    id: 'resource_memory',
    name: 'Resource Memory',
    description: 'Keep % of mining/forestry resources on ascension',
    category: 'economy',
    maxLevel: 5,
    baseCost: 40,
    costScaling: 2.5,
    tierRequired: 1,
    icon: '🗄️',
    effect: (level) => level * 20,
    effectDesc: (level) => `Keep ${level * 20}% resources`
  },
  {
    id: 'knowledge_vault',
    name: 'Knowledge Vault',
    description: 'Keep % of max skill tiers on ascension',
    category: 'economy',
    maxLevel: 5,
    baseCost: 50,
    costScaling: 2.5,
    tierRequired: 1,
    icon: '📚',
    effect: (level) => level * 20,
    effectDesc: (level) => `Keep ${level * 20}% skill tiers`
  },
  {
    id: 'bestiary_retention',
    name: 'Bestiary Retention',
    description: 'Keep % of soul fragments on ascension',
    category: 'economy',
    maxLevel: 5,
    baseCost: 45,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '📖',
    effect: (level) => level * 20,
    effectDesc: (level) => `Keep ${level * 20}% souls`
  },
  {
    id: 'drop_enhancement',
    name: 'Drop Enhancement',
    description: '+10% item drop rate per level',
    category: 'economy',
    maxLevel: 10,
    baseCost: 35,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '📦',
    effect: (level) => level * 0.10,
    effectDesc: (level) => `+${(level * 10)}% drops`
  },
  {
    id: 'time_warp',
    name: 'Time Warp',
    description: '+25% offline progress efficiency per level',
    category: 'economy',
    maxLevel: 5,
    baseCost: 60,
    costScaling: 2.5,
    tierRequired: 2,
    icon: '⏰',
    effect: (level) => level * 0.25,
    effectDesc: (level) => `+${(level * 25)}% offline`
  },

  // ═══════════════════════════════════════════════════════════
  // MULTIPLIER TREE
  // ═══════════════════════════════════════════════════════════
  {
    id: 'exponential_growth',
    name: 'Exponential Growth',
    description: '+5% to ALL multipliers per level',
    category: 'multiplier',
    maxLevel: 10,
    baseCost: 100,
    costScaling: 2.5,
    tierRequired: 0,
    icon: '📈',
    effect: (level) => level * 0.05,
    effectDesc: (level) => `+${(level * 5)}% all stats`
  },
  {
    id: 'chain_ascension',
    name: 'Chain Ascension',
    description: '+1 core thread per ascension level',
    category: 'multiplier',
    maxLevel: 3,
    baseCost: 200,
    costScaling: 3.0,
    tierRequired: 1,
    icon: '🔗',
    effect: (level) => level,
    effectDesc: (level) => `+${level} thread/ascension`
  },
  {
    id: 'prestige_acceleration',
    name: 'Prestige Acceleration',
    description: 'Ascension costs 10% less shards per level',
    category: 'multiplier',
    maxLevel: 5,
    baseCost: 150,
    costScaling: 2.0,
    tierRequired: 1,
    icon: '🚀',
    effect: (level) => level * 0.10,
    effectDesc: (level) => `-${(level * 10)}% shard cost`
  },
  {
    id: 'momentum_amplifier',
    name: 'Momentum Amplifier',
    description: '+25% momentum gain per level',
    category: 'multiplier',
    maxLevel: 10,
    baseCost: 70,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '🌪️',
    effect: (level) => level * 0.25,
    effectDesc: (level) => `+${(level * 25)}% momentum`
  },
  {
    id: 'xp_acceleration',
    name: 'XP Acceleration',
    description: '+20% XP gain per level',
    category: 'multiplier',
    maxLevel: 10,
    baseCost: 65,
    costScaling: 2.0,
    tierRequired: 0,
    icon: '⭐',
    effect: (level) => level * 0.20,
    effectDesc: (level) => `+${(level * 20)}% XP`
  },
  {
    id: 'infinite_potential',
    name: 'Infinite Potential',
    description: '+10% to ascension shard gain per level',
    category: 'multiplier',
    maxLevel: 5,
    baseCost: 180,
    costScaling: 3.0,
    tierRequired: 2,
    icon: '♾️',
    effect: (level) => level * 0.10,
    effectDesc: (level) => `+${(level * 10)}% shard gain`
  }
];

// Helper to get upgrades by category
export function getUpgradesByCategory(category: UpgradeCategory): AscensionUpgradeDef[] {
  return ascensionUpgrades.filter(u => u.category === category);
}

// Helper to get upgrades by tier
export function getUpgradesByTier(tier: AscensionTier): AscensionUpgradeDef[] {
  return ascensionUpgrades.filter(u => u.tierRequired <= tier);
}

// Calculate cost for buying levels
export function calculateUpgradeCost(def: AscensionUpgradeDef, currentLevel: number, levelsToBuy: number = 1): number {
  let totalCost = 0;
  for (let i = 0; i < levelsToBuy; i++) {
    const level = currentLevel + i;
    totalCost += Math.floor(def.baseCost * Math.pow(def.costScaling, level));
  }
  return totalCost;
}


// ============================================================
// DAILY CHALLENGE DEFINITIONS
// Challenges rotate every 24 hours (midnight UTC)
// ============================================================

export type ChallengeType =
  | 'xp_boost'
  | 'fragment_rush'
  | 'loot_frenzy'
  | 'mining_surge'
  | 'forestry_bloom'
  | 'crit_storm'
  | 'speed_demon'
  | 'resource_hunter'
  | 'killstreak';

export interface ChallengeReward {
  shards: number;
  badge: string;
}

export interface ChallengeDef {
  id: ChallengeType;
  name: string;
  description: string;
  icon: string;
  multiplier: number; // How much the bonus is (e.g., 2.0 = 2x)
  reward: ChallengeReward;
  checkComplete: (state: ChallengeProgress) => boolean;
  progress: (state: ChallengeProgress) => number;
  target: number; // Target value for completion
}

export interface ChallengeProgress {
  kills: number;
  levels: number;
  resources: number;
  fragments: number;
  crits: number;
  bosses: number;
}

export const challengeDefinitions: Record<ChallengeType, Omit<ChallengeDef, 'checkComplete' | 'progress'>> = {
  xp_boost: {
    id: 'xp_boost',
    name: 'Neural Optimization',
    description: 'XP gains are doubled today',
    icon: '⚡',
    multiplier: 2.0,
    target: 1,
    reward: { shards: 15, badge: 'Neural Optimizer' }
  },
  fragment_rush: {
    id: 'fragment_rush',
    name: 'Fragment Harvest',
    description: 'Earn 2x skill fragments',
    icon: '💎',
    multiplier: 2.0,
    target: 1,
    reward: { shards: 15, badge: 'Fragment Harvester' }
  },
  loot_frenzy: {
    id: 'loot_frenzy',
    name: 'Data Dump',
    description: 'Drop rates increased by 100%',
    icon: '📦',
    multiplier: 2.0,
    target: 1,
    reward: { shards: 20, badge: 'Data Hoarder' }
  },
  mining_surge: {
    id: 'mining_surge',
    name: 'Drill Master',
    description: 'Mining speed 3x faster',
    icon: '⛏️',
    multiplier: 3.0,
    target: 1,
    reward: { shards: 25, badge: 'Drill Master' }
  },
  forestry_bloom: {
    id: 'forestry_bloom',
    name: 'Bio Synthesis',
    description: 'Forestry growth 3x faster',
    icon: '🌲',
    multiplier: 3.0,
    target: 1,
    reward: { shards: 25, badge: 'Bio Engineer' }
  },
  crit_storm: {
    id: 'crit_storm',
    name: 'Critical Storm',
    description: 'Land 100 critical hits',
    icon: '🎯',
    multiplier: 1.5,
    target: 100,
    reward: { shards: 35, badge: 'Crit Master' }
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Velocity Rush',
    description: 'Reach level 100 in record time',
    icon: '🏃',
    multiplier: 2.0,
    target: 100,
    reward: { shards: 40, badge: 'Speed Demon' }
  },
  resource_hunter: {
    id: 'resource_hunter',
    name: 'Resource Tycoon',
    description: 'Mine 1 million resources',
    icon: '🗿',
    multiplier: 1.5,
    target: 1000000,
    reward: { shards: 30, badge: 'Resource Tycoon' }
  },
  killstreak: {
    id: 'killstreak',
    name: 'Murder Spree',
    description: 'Kill 1000 enemies in one session',
    icon: '☠️',
    multiplier: 1.5,
    target: 1000,
    reward: { shards: 35, badge: 'Murderer' }
  }
};

// All available challenge IDs for random selection
export const allChallengeIds: ChallengeType[] = Object.keys(challengeDefinitions) as ChallengeType[];

// Weekly challenges (stronger, rotate on Monday)
export interface WeeklyChallengeDef {
  id: string;
  name: string;
  description: string;
  requirement: (progress: ChallengeProgress) => boolean;
  reward: { shards: number; badge: string };
}

export const weeklyChallengeDefs: WeeklyChallengeDef[] = [
  {
    id: 'weekly_gauntlet',
    name: 'The Gauntlet',
    description: 'Reach level 10,000',
    requirement: (p) => p.levels >= 10000,
    reward: { shards: 200, badge: 'Gauntlet Champion' }
  },
  {
    id: 'weekly_killer',
    name: 'Serial Killer',
    description: 'Accumulate 100,000 kills',
    requirement: (p) => p.kills >= 100000,
    reward: { shards: 250, badge: 'Serial Killer' }
  },
  {
    id: 'weekly_fragments',
    name: 'Fragment Collector',
    description: 'Earn 1 billion skill fragments',
    requirement: (p) => p.fragments >= 1e9,
    reward: { shards: 300, badge: 'Fragment Lord' }
  }
];

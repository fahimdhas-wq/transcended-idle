
// ============================================================
// DAILY CHALLENGE MODULE
// ============================================================

import { Decimal } from '../systems/decimal.js';
import { allChallengeIds, challengeDefinitions, weeklyChallengeDefs, type ChallengeType } from '../data/challenges.js';

export interface DailyChallengeState {
  activeChallenge: ChallengeType | null;
  challengeStartTime: number;
  completedToday: boolean;
  claimedReward: boolean;
  totalShardsEarned: number;
  consecutiveDays: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompletionDate: string;
  progress: DailyChallengeProgress;
  lastLoginDate: string;
  // Weekly challenge
  activeWeeklyId: string | null;
  weeklyProgress: number;
  weeklyClaimed: boolean;
  weeklyStartDate: string;
}

export interface DailyChallengeProgress {
  kills: number;
  levelsGained: number;
  resourcesMined: number;
  fragmentsEarned: number;
  critsLanded: number;
  bossesKilled: number;
  ascensionShards: number;
  skillTiersUpgraded: number;
  gearCollected: number;
  cleanFights: number;
}

export interface DailyChallengeReward {
  shards: number;
  badge: string;
}

export const dailyChallengeState: DailyChallengeState = $state({
  activeChallenge: null,
  challengeStartTime: 0,
  completedToday: false,
  claimedReward: false,
  totalShardsEarned: 0,
  consecutiveDays: 0,
  bestStreak: 0,
  totalCompletions: 0,
  lastCompletionDate: '',
  progress: {
    kills: 0,
    levelsGained: 0,
    resourcesMined: 0,
    fragmentsEarned: 0,
    critsLanded: 0,
    bossesKilled: 0,
    ascensionShards: 0,
    skillTiersUpgraded: 0,
    gearCollected: 0,
    cleanFights: 0,
  },
  lastLoginDate: '',
  activeWeeklyId: null,
  weeklyProgress: 0,
  weeklyClaimed: false,
  weeklyStartDate: '',
});

const CHALLENGE_DURATION_MS = 24 * 60 * 60 * 1000;
const ROTATION_CHECK_INTERVAL = 60 * 1000;
const STREAK_BONUS_SHARDS = 5;

const PASSIVE_CHALLENGES = new Set<ChallengeType>([
  'xp_boost', 'fragment_rush', 'loot_frenzy', 'mining_surge', 'forestry_bloom'
]);

let lastRotationCheck = 0;

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getDaySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function selectDailyChallenge(): ChallengeType {
  // Pick a random challenge each day
  const index = Math.floor(Math.random() * allChallengeIds.length);
  return allChallengeIds[index];
}

export function rotateToNewChallenge(): void {
  dailyChallengeState.activeChallenge = selectDailyChallenge();
  dailyChallengeState.challengeStartTime = Date.now();
  dailyChallengeState.completedToday = false;
  dailyChallengeState.claimedReward = false;
  dailyChallengeState.progress = {
    kills: 0,
    levelsGained: 0,
    resourcesMined: 0,
    fragmentsEarned: 0,
    critsLanded: 0,
    bossesKilled: 0,
    ascensionShards: 0,
    skillTiersUpgraded: 0,
    gearCollected: 0,
    cleanFights: 0,
  };
  // Auto-complete passive challenges immediately on rotation
  checkChallengeCompletion();
}

export function checkAndRotateChallenge(): void {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  const timeSinceStart = dailyChallengeState.challengeStartTime > 0
    ? Date.now() - dailyChallengeState.challengeStartTime
    : 0;
  const hasExpired = timeSinceStart >= CHALLENGE_DURATION_MS;
  const challengeDateStr = dailyChallengeState.challengeStartTime > 0
    ? new Date(dailyChallengeState.challengeStartTime).toISOString().split('T')[0]
    : '';
  const isNewDay = challengeDateStr !== today;

  // Login streak — updates every new day regardless of challenge completion
  if (isNewDay && dailyChallengeState.lastLoginDate !== today) {
    if (dailyChallengeState.lastLoginDate === yesterday) {
      dailyChallengeState.consecutiveDays++;
    } else {
      dailyChallengeState.consecutiveDays = 1;
    }
    if (dailyChallengeState.consecutiveDays > dailyChallengeState.bestStreak) {
      dailyChallengeState.bestStreak = dailyChallengeState.consecutiveDays;
    }
    dailyChallengeState.lastLoginDate = today;
  }

  if (!dailyChallengeState.activeChallenge || hasExpired || isNewDay) {
    rotateToNewChallenge();
  }
}

export function checkRotationTick(now: number): void {
  if (now - lastRotationCheck >= ROTATION_CHECK_INTERVAL) {
    lastRotationCheck = now;
    checkAndRotateChallenge();
  }
}

// ============================================================
// TRACKING
// ============================================================

export function trackKill(): void {
  dailyChallengeState.progress.kills += 1;
  trackWeeklyProgress(1);
}

export function trackBossKill(): void {
  dailyChallengeState.progress.bossesKilled += 1;
}

export function trackAscensionShards(amount: number): void {
  dailyChallengeState.progress.ascensionShards += amount;
  trackWeeklyProgress(Math.floor(amount * 0.001));
}

export function trackSkillUpgrade(): void {
  dailyChallengeState.progress.skillTiersUpgraded += 1;
}

export function trackGearCollected(amount: number): void {
  dailyChallengeState.progress.gearCollected += amount;
}

export function trackCleanFight(): void {
  dailyChallengeState.progress.cleanFights += 1;
}

export function trackLevelUp(): void {
  dailyChallengeState.progress.levelsGained += 1;
}

export function trackCrit(): void {
  dailyChallengeState.progress.critsLanded += 1;
}

export function trackResources(amount: number): void {
  dailyChallengeState.progress.resourcesMined += amount;
}

export function trackFragments(amount: Decimal): void {
  dailyChallengeState.progress.fragmentsEarned += amount.toNumber();
}

// ============================================================
// COMPLETION — pure read, zero mutations
// ============================================================

export function isChallengeComplete(): boolean {
  if (!dailyChallengeState.activeChallenge) return false;
  if (dailyChallengeState.completedToday) return true;
  if (PASSIVE_CHALLENGES.has(dailyChallengeState.activeChallenge)) return true;

  const p = dailyChallengeState.progress;
  switch (dailyChallengeState.activeChallenge) {
    case 'crit_storm':      return p.critsLanded >= 100;
    case 'speed_demon':     return p.levelsGained >= 100;
    case 'resource_hunter': return p.resourcesMined >= 1000000;
    case 'killstreak':      return p.kills >= 1000;
    case 'boss_killer':     return p.bossesKilled >= 10;
    case 'ascension_farmer':return p.ascensionShards >= 100000;
    case 'skill_master':    return p.skillTiersUpgraded >= 20;
    case 'gear_collector':  return p.gearCollected >= 500;
    case 'no_damage':       return p.cleanFights >= 100;
    default:                return false;
  }
}

// ============================================================
// COMPLETION MUTATION — single source of truth, called from game loop only
// ============================================================

export function checkChallengeCompletion(): void {
  if (dailyChallengeState.completedToday) return;
  if (!isChallengeComplete()) return;

  const today = getTodayString();

  dailyChallengeState.completedToday = true;
  dailyChallengeState.lastCompletionDate = today;
  dailyChallengeState.totalCompletions++;
}

// ============================================================
// REWARDS
// ============================================================

function getCurrentProgress(): number {
  const p = dailyChallengeState.progress;
  switch (dailyChallengeState.activeChallenge) {
    case 'crit_storm':      return p.critsLanded;
    case 'speed_demon':     return p.levelsGained;
    case 'resource_hunter': return p.resourcesMined;
    case 'killstreak':      return p.kills;
    case 'boss_killer':     return p.bossesKilled;
    case 'ascension_farmer':return p.ascensionShards;
    case 'skill_master':    return p.skillTiersUpgraded;
    case 'gear_collector':  return p.gearCollected;
    case 'no_damage':       return p.cleanFights;
    default:                return 0;
  }
}

export function calculateOverageBonus(): number {
  if (!dailyChallengeState.activeChallenge) return 0;
  if (PASSIVE_CHALLENGES.has(dailyChallengeState.activeChallenge)) return 0;
  const def = challengeDefinitions[dailyChallengeState.activeChallenge];
  const progress = getCurrentProgress();
  if (progress <= def.target) return 0;
  const overageRatio = progress / def.target;
  // 2× target → +20% shards, 3× → +40%, 10× → +180%
  return Math.max(0, Math.floor((overageRatio - 1) * def.reward.shards * 0.2));
}

export function claimDailyReward(): DailyChallengeReward | null {
  if (!dailyChallengeState.activeChallenge) return null;
  if (!dailyChallengeState.completedToday) return null;
  if (dailyChallengeState.claimedReward) return null;

  const def = challengeDefinitions[dailyChallengeState.activeChallenge];

  // Base shard reward
  let shards = def.reward.shards;

  // Overage bonus: player exceeded the target — earn bonus shards
  shards += calculateOverageBonus();

  // Streak bonus: +5 per consecutive day
  shards += dailyChallengeState.consecutiveDays * STREAK_BONUS_SHARDS;

  dailyChallengeState.claimedReward = true;
  dailyChallengeState.totalShardsEarned += shards;

  return { shards, badge: def.reward.badge };
}

export function getEarnedShardsSoFar(): number {
  return dailyChallengeState.totalShardsEarned;
}

// ============================================================
// UI HELPERS
// ============================================================

export function getCurrentChallenge() {
  if (!dailyChallengeState.activeChallenge) return null;
  return challengeDefinitions[dailyChallengeState.activeChallenge];
}

export function getChallengeProgress(): { current: number; target: number; percentage: number } {
  if (!dailyChallengeState.activeChallenge) return { current: 0, target: 0, percentage: 0 };

  const def = challengeDefinitions[dailyChallengeState.activeChallenge];
  const p = dailyChallengeState.progress;
  let current = 0;

  if (PASSIVE_CHALLENGES.has(dailyChallengeState.activeChallenge)) {
    current = dailyChallengeState.completedToday ? 1 : 0;
  } else {
    switch (dailyChallengeState.activeChallenge) {
      case 'crit_storm':      current = p.critsLanded; break;
      case 'speed_demon':     current = p.levelsGained; break;
      case 'resource_hunter': current = p.resourcesMined; break;
      case 'killstreak':      current = p.kills; break;
      case 'boss_killer':     current = p.bossesKilled; break;
      case 'ascension_farmer':current = p.ascensionShards; break;
      case 'skill_master':    current = p.skillTiersUpgraded; break;
      case 'gear_collector':  current = p.gearCollected; break;
      case 'no_damage':       current = p.cleanFights; break;
    }
  }

  const target = def.target;
  const percentage = Math.min(100, Math.floor((current / Math.max(1, target)) * 100));
  return { current, target, percentage };
}

export function getTimeRemaining(): { hours: number; minutes: number; seconds: number; total: number } {
  if (!dailyChallengeState.challengeStartTime) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  const elapsed = Date.now() - dailyChallengeState.challengeStartTime;
  const remaining = Math.max(0, CHALLENGE_DURATION_MS - elapsed);
  return {
    hours:   Math.floor(remaining / (60 * 60 * 1000)),
    minutes: Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((remaining % (60 * 1000) / 1000)),
    total:   remaining
  };
}

export function isChallengeActive(): boolean {
  return !!dailyChallengeState.activeChallenge && !dailyChallengeState.claimedReward;
}

export function getStreakBonus(): number {
  return dailyChallengeState.consecutiveDays * STREAK_BONUS_SHARDS;
}

// ============================================================
// MULTIPLIERS
// Passive bonuses are active all day — no completedToday gate
// ============================================================

export function getXpMultiplier(): number {
  return dailyChallengeState.activeChallenge === 'xp_boost'
    ? challengeDefinitions.xp_boost.multiplier
    : 1;
}

export function getFragmentMultiplier(): number {
  return dailyChallengeState.activeChallenge === 'fragment_rush'
    ? challengeDefinitions.fragment_rush.multiplier
    : 1;
}

export function getDropRateMultiplier(): number {
  return dailyChallengeState.activeChallenge === 'loot_frenzy'
    ? challengeDefinitions.loot_frenzy.multiplier
    : 1;
}

export function getMiningSpeedMultiplier(): number {
  return dailyChallengeState.activeChallenge === 'mining_surge'
    ? challengeDefinitions.mining_surge.multiplier
    : 1;
}

export function getForestrySpeedMultiplier(): number {
  return dailyChallengeState.activeChallenge === 'forestry_bloom'
    ? challengeDefinitions.forestry_bloom.multiplier
    : 1;
}

// ─── WALKTHROUGH: multipliers are active ALL DAY, no completion gate ─────────

// If today is "Neural Optimization" → XP gains are 2× all day (already earned or not)
// If today is "Fragment Harvest" → fragment gains are 2× all day
// If today is "Data Dump" → drop rate is 2× all day
// If today is "Drill Master" → mining speed is 3× all day
// If today is "Bio Synthesis" → forestry speed is 3× all day

// ============================================================
// WEEKLY CHALLENGE
// ============================================================

const WEEK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getWeekId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function checkWeeklyRotation(): void {
  const weekId = getWeekId();
  if (dailyChallengeState.activeWeeklyId !== weekId) {
    const idx = Math.floor(Math.random() * weeklyChallengeDefs.length);
    dailyChallengeState.activeWeeklyId = weeklyChallengeDefs[idx].id;
    dailyChallengeState.weeklyProgress = 0;
    dailyChallengeState.weeklyClaimed = false;
    dailyChallengeState.weeklyStartDate = weekId;
  }
}

export function getWeeklyChallenge() {
  if (!dailyChallengeState.activeWeeklyId) return null;
  return weeklyChallengeDefs.find(w => w.id === dailyChallengeState.activeWeeklyId) || null;
}

export function isWeeklyComplete(): boolean {
  const def = getWeeklyChallenge();
  if (!def) return false;
  return dailyChallengeState.weeklyProgress >= def.reward.shards;
}

export function claimWeeklyReward(): number | null {
  if (dailyChallengeState.weeklyClaimed) return null;
  if (!isWeeklyComplete()) return null;
  dailyChallengeState.weeklyClaimed = true;
  const shards = dailyChallengeState.weeklyProgress;
  dailyChallengeState.totalShardsEarned += shards;
  return shards;
}

export function trackWeeklyProgress(amount: number): void {
  if (!dailyChallengeState.activeWeeklyId) return;
  if (dailyChallengeState.weeklyClaimed) return;
  dailyChallengeState.weeklyProgress += amount;
}


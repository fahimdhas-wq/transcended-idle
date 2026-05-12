
// ============================================================
// DAILY CHALLENGE MODULE
// Handles daily challenge state, rotation, tracking, and rewards
// ============================================================

import { Decimal } from '../systems/decimal.js';
import { allChallengeIds, challengeDefinitions, type ChallengeType } from '../data/challenges.js';

export interface DailyChallengeState {
  activeChallenge: ChallengeType | null;
  challengeStartTime: number;
  completedToday: boolean;
  claimedReward: boolean;
  totalShardsEarned: number;
  consecutiveDays: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompletionDate: string; // YYYY-MM-DD format
  progress: DailyChallengeProgress;
}

export interface DailyChallengeProgress {
  kills: number;
  levelsGained: number;
  resourcesMined: number;
  fragmentsEarned: number;
  critsLanded: number;
}

export interface DailyChallengeReward {
  shards: number;
  badge: string;
}

// State
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
    critsLanded: 0
  }
});

// Constants
const CHALLENGE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const ROTATION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const STREAK_BONUS_SHARDS = 5; // Bonus shards per consecutive day

// Track when we last checked for rotation
let lastRotationCheck = 0;

// ============================================================
// DAILY ROTATION
// ============================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getDaySeed(): number {
  const today = new Date();
  // Use date as seed for consistent daily rotation
  const dateNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return dateNum;
}

function selectDailyChallenge(): ChallengeType {
  // Deterministic selection based on day
  const seed = getDaySeed();
  const index = seed % allChallengeIds.length;
  return allChallengeIds[index];
}

function rotateToNewChallenge(): void {
  const yesterday = getYesterdayString();
  const today = getTodayString();
  const hadConsecutiveCompletion = dailyChallengeState.lastCompletionDate === yesterday && dailyChallengeState.completedToday;

  // Rotate to new challenge
  dailyChallengeState.activeChallenge = selectDailyChallenge();
  dailyChallengeState.challengeStartTime = Date.now();
  dailyChallengeState.completedToday = false;
  dailyChallengeState.claimedReward = false;
  dailyChallengeState.progress = {
    kills: 0,
    levelsGained: 0,
    resourcesMined: 0,
    fragmentsEarned: 0,
    critsLanded: 0
  };

  // Handle streak logic
  if (!hadConsecutiveCompletion) {
    // Streak broken - reset to 0
    dailyChallengeState.consecutiveDays = 0;
  }
  // If they had consecutive completion, consecutiveDays is preserved

  // Immediately complete passive challenges (no progress needed)
  const passiveChallenges = ['xp_boost', 'fragment_rush', 'loot_frenzy', 'mining_surge', 'forestry_bloom'];
  if (passiveChallenges.includes(dailyChallengeState.activeChallenge)) {
    if (dailyChallengeState.lastCompletionDate !== today) {
      if (dailyChallengeState.lastCompletionDate === yesterday) {
        dailyChallengeState.consecutiveDays++;
      } else {
        dailyChallengeState.consecutiveDays = 1;
      }
      if (dailyChallengeState.consecutiveDays > dailyChallengeState.bestStreak) {
        dailyChallengeState.bestStreak = dailyChallengeState.consecutiveDays;
      }
      dailyChallengeState.completedToday = true;
      dailyChallengeState.lastCompletionDate = today;
      dailyChallengeState.totalCompletions++;
    }
    console.log(`[DAILY] Passive challenge '${dailyChallengeState.activeChallenge}' auto-completed. completedToday=${dailyChallengeState.completedToday}, claimedReward=${dailyChallengeState.claimedReward}`);
  }
}

export function checkAndRotateChallenge(): void {
  const today = getTodayString();

  // Check if challenge needs rotation
  // Rotation happens when:
  // 1. No challenge is active (first time)
  // 2. It's a new day AND 24 hours have passed since challenge started
  // 3. The last completion date is NOT today (missed a day)

  const timeSinceStart = dailyChallengeState.challengeStartTime > 0
    ? Date.now() - dailyChallengeState.challengeStartTime
    : 0;
  const hasExpired = timeSinceStart >= CHALLENGE_DURATION_MS;
  const isNewDay = dailyChallengeState.lastCompletionDate !== today && dailyChallengeState.completedToday;
  const missedDay = dailyChallengeState.lastCompletionDate !== today && !dailyChallengeState.completedToday;

  // Rotate if no challenge OR (24h passed OR missed a day)
  if (dailyChallengeState.activeChallenge === null || hasExpired || missedDay) {
    rotateToNewChallenge();
  }
}

/**
 * Called periodically from game loop to check for rotation
 * @param now Current timestamp
 */
export function checkRotationTick(now: number): void {
  if (now - lastRotationCheck >= ROTATION_CHECK_INTERVAL) {
    lastRotationCheck = now;
    checkAndRotateChallenge();
  }
}

// ============================================================
// PROGRESS TRACKING
// Called from game loop and combat system
// ============================================================

export function trackKill(): void {
  dailyChallengeState.progress.kills += 1;
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
// COMPLETION CHECK
// ============================================================

export function isChallengeComplete(): boolean {
  if (!dailyChallengeState.activeChallenge) return false;
  if (dailyChallengeState.completedToday) return true;

  const p = dailyChallengeState.progress;

  switch (dailyChallengeState.activeChallenge) {
    case 'xp_boost':
    case 'fragment_rush':
    case 'loot_frenzy':
    case 'mining_surge':
    case 'forestry_bloom':
      // These are always active, ready to claim immediately
      // Mark as completed so claim works
      const today = getTodayString();
      const yesterday = getYesterdayString();
      if (dailyChallengeState.lastCompletionDate !== today) {
        if (dailyChallengeState.lastCompletionDate === yesterday) {
          dailyChallengeState.consecutiveDays++;
        } else {
          dailyChallengeState.consecutiveDays = 1;
        }
        if (dailyChallengeState.consecutiveDays > dailyChallengeState.bestStreak) {
          dailyChallengeState.bestStreak = dailyChallengeState.consecutiveDays;
        }
        dailyChallengeState.completedToday = true;
        dailyChallengeState.lastCompletionDate = today;
        dailyChallengeState.totalCompletions++;
      }
      return true;

    case 'crit_storm':
      return p.critsLanded >= 100;

    case 'speed_demon':
      return p.levelsGained >= 100;

    case 'resource_hunter':
      return p.resourcesMined >= 1000000;

    case 'killstreak':
      return p.kills >= 1000;

    default:
      return false;
  }
}

export function checkChallengeCompletion(): void {
  if (isChallengeComplete() && !dailyChallengeState.completedToday) {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    // Update streak
    if (dailyChallengeState.lastCompletionDate === yesterday) {
      // Consecutive day - increment streak
      dailyChallengeState.consecutiveDays++;
    } else if (dailyChallengeState.lastCompletionDate !== today) {
      // Streak broken - reset to 1
      dailyChallengeState.consecutiveDays = 1;
    }

    if (dailyChallengeState.consecutiveDays > dailyChallengeState.bestStreak) {
      dailyChallengeState.bestStreak = dailyChallengeState.consecutiveDays;
    }

    dailyChallengeState.completedToday = true;
    dailyChallengeState.lastCompletionDate = today;
    dailyChallengeState.totalCompletions++;
  }
}

// ============================================================
// REWARDS
// ============================================================

export function claimDailyReward(): DailyChallengeReward | null {
  console.log(`[CLAIM] Called: active=${dailyChallengeState.activeChallenge} completedToday=${dailyChallengeState.completedToday} claimedReward=${dailyChallengeState.claimedReward}`);
  if (!dailyChallengeState.activeChallenge) {
    console.log('[CLAIM] No active challenge');
    return null;
  }
  if (!dailyChallengeState.completedToday) {
    console.log('[CLAIM] Not completed today');
    return null;
  }
  if (dailyChallengeState.claimedReward) {
    console.log('[CLAIM] Already claimed');
    return null;
  }

  const def = challengeDefinitions[dailyChallengeState.activeChallenge];

  // Base reward
  let shards = def.reward.shards;

  // Streak bonus
  const streakBonus = dailyChallengeState.consecutiveDays * STREAK_BONUS_SHARDS;
  shards += streakBonus;

  dailyChallengeState.claimedReward = true;
  dailyChallengeState.totalShardsEarned += shards;

  console.log(`[CLAIM] SUCCESS: ${shards} shards, badge: ${def.reward.badge}`);
  return {
    shards,
    badge: def.reward.badge
  };
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
  if (!dailyChallengeState.activeChallenge) {
    return { current: 0, target: 0, percentage: 0 };
  }

  const def = challengeDefinitions[dailyChallengeState.activeChallenge];
  const p = dailyChallengeState.progress;
  let current = 0;

  switch (dailyChallengeState.activeChallenge) {
    case 'crit_storm':
      current = p.critsLanded;
      break;
    case 'speed_demon':
      current = p.levelsGained;
      break;
    case 'resource_hunter':
      current = p.resourcesMined;
      break;
    case 'killstreak':
      current = p.kills;
      break;
    default:
      // Passive challenges show as always at 100% if completed
      current = dailyChallengeState.completedToday ? 1 : 0;
  }

  const target = def.target;
  const percentage = Math.min(100, Math.floor((current / target) * 100));

  return { current, target, percentage };
}

export function getTimeRemaining(): { hours: number; minutes: number; seconds: number; total: number } {
  if (!dailyChallengeState.challengeStartTime) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const elapsed = Date.now() - dailyChallengeState.challengeStartTime;
  const remaining = Math.max(0, CHALLENGE_DURATION_MS - elapsed);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { hours, minutes, seconds, total: remaining };
}

export function isChallengeActive(): boolean {
  if (!dailyChallengeState.activeChallenge) return false;
  return !dailyChallengeState.claimedReward;
}

export function getStreakBonus(): number {
  return dailyChallengeState.consecutiveDays * STREAK_BONUS_SHARDS;
}

// ============================================================
// MULTIPLIERS
// Applied in game systems based on active challenge
// ============================================================

export function getXpMultiplier(): number {
  if (!dailyChallengeState.activeChallenge) return 1;
  if (!dailyChallengeState.completedToday) return 1;

  const def = challengeDefinitions[dailyChallengeState.activeChallenge];
  if (dailyChallengeState.activeChallenge === 'xp_boost') {
    return def.multiplier;
  }
  return 1;
}

export function getFragmentMultiplier(): number {
  if (!dailyChallengeState.activeChallenge) return 1;
  if (!dailyChallengeState.completedToday) return 1;

  if (dailyChallengeState.activeChallenge === 'fragment_rush') {
    return challengeDefinitions.fragment_rush.multiplier;
  }
  return 1;
}

export function getDropRateMultiplier(): number {
  if (!dailyChallengeState.activeChallenge) return 1;
  if (!dailyChallengeState.completedToday) return 1;

  if (dailyChallengeState.activeChallenge === 'loot_frenzy') {
    return challengeDefinitions.loot_frenzy.multiplier;
  }
  return 1;
}

export function getMiningSpeedMultiplier(): number {
  if (!dailyChallengeState.activeChallenge) return 1;
  if (!dailyChallengeState.completedToday) return 1;

  if (dailyChallengeState.activeChallenge === 'mining_surge') {
    return challengeDefinitions.mining_surge.multiplier;
  }
  return 1;
}

export function getForestrySpeedMultiplier(): number {
  if (!dailyChallengeState.activeChallenge) return 1;
  if (!dailyChallengeState.completedToday) return 1;

  if (dailyChallengeState.activeChallenge === 'forestry_bloom') {
    return challengeDefinitions.forestry_bloom.multiplier;
  }
  return 1;
}

# Plan: Daily Challenge Performance Fix + Overage Tier Rewards

## Issue 1: rAF Performance (116ms)

**Root cause:** The game loop calls `checkChallengeCompletion()` inside a `for (let i = 0; i < levelsGained; i++)` loop on **every combat tick**. With thousands of ticks per frame, that's thousands of repeated calls. Svelte 5 reactivity fires on every state write, causing cascading re-renders.

**Additionally:** `checkChallengeCompletion()` is called twice per tick (lines ~248 and ~277 in gameLoop).

**Fix:** Throttle challenge completion check to once per N ticks (N=50), and deduplicate the duplicate call.

---

## Issue 2: Duplicate Comments

`dailyChallenge.svelte.ts` has two identical comment blocks (lines ~304–318). Simply delete one.

---

## Issue 3: Overage Tier Rewards

**Design:**
- For active challenges (crit_storm, speed_demon, resource_hunter, killstreak): if the player exceeds the target, they earn **bonus shards** proportional to how far they exceeded
- Formula: `bonus = floor((progress / target - 1) * base_shards * 0.2)`
  - 2× target → +20% shards
  - 3× target → +40% shards
  - 10× target → +180% shards
- Overage only applies to active challenges (passive challenges have no target)
- No new fields needed — uses existing `def.reward.shards` and `def.multiplier`

**Reward structure:** `shards = base_shards + overage_bonus + streak_bonus`

**No code duplication:** Only `claimDailyReward()` changes. The completion mechanics are untouched.

---

## Changes (4 files)

### File 1: `src/core/gameLoop.svelte.ts`

**Remove duplicate `checkChallengeCompletion()` call:**
- Current: called at line ~248 (inside level-gained block) AND at line ~277 (combat tracking block)
- Fix: keep only the one at ~277 (after all tracking is done), remove the one inside the levels-gained block

**Throttle completion check:** Add a tick counter; only call `checkChallengeCompletion()` every 50 ticks.

```typescript
let challengeCheckCounter = 0;
// In gameTick, after combat/mining/forestry:
challengeCheckCounter += ticksToProcess;
if (challengeCheckCounter >= 50) {
  challengeCheckCounter = 0;
  checkChallengeCompletion();
  // auto-claim here too
  if (dailyChallengeState.completedToday && !dailyChallengeState.claimedReward) {
    const reward = claimDailyReward();
    if (reward) addLog(`[DAILY] Auto-claimed ${reward.shards} Shards!`, 'awakening');
  }
}
```

Also remove the existing inline auto-claim block (lines ~280–285) since it moves into the throttled section.

### File 2: `src/modules/dailyChallenge.svelte.ts`

**A. Remove duplicate comment block** (the two identical "WALKTHROUGH" blocks near the end — delete one)

**B. Modify `claimDailyReward()` to include overage bonus:**

```typescript
export function calculateOverageBonus(challenge: ChallengeType, progress: number): number {
  if (PASSIVE_CHALLENGES.has(challenge)) return 0;
  const def = challengeDefinitions[challenge];
  if (progress <= def.target) return 0;
  const overageRatio = progress / def.target; // e.g. 2.5 for 250% of target
  // bonus = floor((overageRatio - 1) * base_shards * 0.2)
  // 2× target → +20% shards, 3× → +40%, 10× → +180%
  return Math.max(0, Math.floor((overageRatio - 1) * def.reward.shards * 0.2));
}

export function claimDailyReward(): DailyChallengeReward | null {
  // ... existing null checks ...
  const def = challengeDefinitions[dailyChallengeState.activeChallenge];
  let shards = def.reward.shards;

  // Overage bonus (only for active challenges, only if exceeded target)
  shards += calculateOverageBonus(dailyChallengeState.activeChallenge, getCurrentProgress());

  // Streak bonus
  shards += dailyChallengeState.consecutiveDays * STREAK_BONUS_SHARDS;
  // ...
}

function getCurrentProgress(): number {
  const p = dailyChallengeState.progress;
  switch (dailyChallengeState.activeChallenge) {
    case 'crit_storm':      return p.critsLanded;
    case 'speed_demon':     return p.levelsGained;
    case 'resource_hunter': return p.resourcesMined;
    case 'killstreak':      return p.kills;
    default:                return 0;
  }
}
```

### File 3: `src/data/challenges.ts`

No changes needed — existing `reward.shards` and `multiplier` fields are sufficient.

### File 4: `src/systems/rewardSystem.ts`

No changes — overage is purely a reward-computation concern in `claimDailyReward()`, the reward system itself is untouched.

---

## Summary

| What | Where | Change |
|------|-------|--------|
| Remove duplicate comments | `dailyChallenge.svelte.ts` | Delete one of two identical blocks |
| Dedupe + throttle completion check | `gameLoop.svelte.ts` | One call every 50 ticks, remove duplicate |
| Add overage reward | `dailyChallenge.svelte.ts` | `claimDailyReward()` computes bonus, new `calculateOverageBonus()` |

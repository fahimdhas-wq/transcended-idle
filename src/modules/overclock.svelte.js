import { Decimal } from '../systems/decimal.js';

export const overclockState = $state({
  coreThreads: new Decimal(2), // 2 free starter threads (3x base multiplier)
  timesOverclocked: 0,
});

/**
 * Overclock becomes AVAILABLE (optional prestige) at this level.
 * Players can use it for a speed boost but are not forced to.
 */
export const LEVEL_REQ = new Decimal(1000);

/**
 * The HARD CAP. Level cannot grow beyond this without an Overclock.
 * 1ZZZ ≈ 10^54840 — effectively unreachable through normal play,
 * so the game flows freely until then.
 */
export const LEVEL_WALL = new Decimal(1, 54840); // 1ZZZ

/**
 * Global stat/XP multiplier from accumulated Core Threads.
 * Each thread adds +100% (i.e., 1 thread = 2x, 10 threads = 11x).
 */
export function getOverclockMultiplier() {
  return overclockState.coreThreads.add(1);
}

/**
 * Threads gained scale with log10 of current level.
 * This rewards going further before prestige.
 *   Level 1,000    → 3 threads
 *   Level 1M       → 6 threads
 *   Level 1ZZZ     → 54,840 threads
 */
export function getPendingThreads(characterLevel) {
  if (characterLevel.lt(LEVEL_REQ)) return new Decimal(0);
  const logLvl = characterLevel.log10();
  const safeLog = isFinite(logLvl) ? Math.max(3, Math.floor(logLvl)) : 3;
  return new Decimal(safeLog);
}

// Deferred import to avoid circular dependency
import { character, resetCharacter } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';

export function doOverclock() {
  if (character.level.lt(LEVEL_REQ)) return false;

  const threadsGained = getPendingThreads(character.level);
  overclockState.coreThreads = overclockState.coreThreads.add(threadsGained);
  overclockState.timesOverclocked += 1;

  resetCharacter();
  addLog(
    `[OVERCLOCK] +${threadsGained.toNumber()} Core Threads gained! Total: ${overclockState.coreThreads.toNumber()}x multiplier.`,
    'system'
  );
  return true;
}


import { Decimal } from '../systems/decimal.js';
import { character, resetCharacter } from './character.svelte.js';
import { addLog } from '../ui/LogPanelState.svelte.js';
import { overclockState } from './overclockState.svelte.js';

export const LEVEL_REQ: Decimal = new Decimal(1000);
export const LEVEL_WALL: Decimal = new Decimal(1, 54840);

export function getPendingThreads(characterLevel: Decimal): Decimal {
  if (characterLevel.lt(LEVEL_REQ)) return new Decimal(0);
  const logLvl = characterLevel.log10();
  const safeLog = isFinite(logLvl) ? Math.max(3, Math.floor(logLvl)) : 3;
  return new Decimal(safeLog);
}

export function doOverclock(): boolean {
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

export { overclockState };


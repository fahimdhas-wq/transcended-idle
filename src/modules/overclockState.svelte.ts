
import { Decimal } from '../systems/decimal.js';

export interface OverclockState {
  coreThreads: Decimal;
  timesOverclocked: number;
}

export const overclockState: OverclockState = $state({
  coreThreads: new Decimal(2),
  timesOverclocked: 0
});

export function getOverclockMultiplier(): Decimal {
  return overclockState.coreThreads.add(1);
}


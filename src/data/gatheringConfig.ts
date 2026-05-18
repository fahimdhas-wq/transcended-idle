
import type { Decimal } from '../systems/decimal.js';

export const GATHERING_CONSTANTS = {
  TICK_RATE:            0.1,
  PROGRESS_THRESHOLD:   100,
  BASE_RATE:            2,
  AUTOMATION_BONUS:     1,
  BASE_ENERGY_COST:     0.05,
  BASE_REGEN_RATE:      0.01,
  AUTOMATION_REGEN:     0.002,
  CRIT_CHANCE_BASE:     0.001,
  CRIT_CHANCE_PER_LUCK: 0.0005,
  CRIT_MULTIPLIER:      100,
  REFINE_RATIO:         25,
  FRAG_DROP_CHANCE:     0.15,
  FRAG_TIER_POWER:      4,
  YIELD_BASE_EXPONENT:  6,
  YIELD_TIER_STEP:      3,
} as const;

export interface GatheringTool {
  tier:     number;
  name:     string;
  speed:    number;
  yield:    number;
  luck:     number;
  dataCost: number;
}

const TOOL_SPEEDS  = [2, 10,  40,   150,    600,   2500,   10000,   50000,   250000,  1000000];
const TOOL_YIELDS  = [2, 10,  35,   120,    500,   2000,    8000,   40000,   200000,   800000];
const TOOL_LUCKS   = [2,  4,   8,    15,     30,     60,     120,     250,      500,     1000];
const TOOL_COSTS   = [0, 50, 250,  1000,   5000,  25000,  100000,  500000,  2500000, 10000000];

export function makeTools(names: readonly string[]): GatheringTool[] {
  return names.map((name, i) => ({
    tier:     i + 1,
    name,
    speed:    TOOL_SPEEDS[i],
    yield:    TOOL_YIELDS[i],
    luck:     TOOL_LUCKS[i],
    dataCost: TOOL_COSTS[i]
  }));
}


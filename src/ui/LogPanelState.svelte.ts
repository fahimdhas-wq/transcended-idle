
import { Decimal, type DecimalSource } from '../systems/decimal.js';

export interface LogEvent {
  message: string;
  type: string;
  ts: number;
}

export interface SummaryEntry {
  time: string;
  kills: number;
  loot: number;
  levels: number;
  verges: number;
}

export interface SummaryCounters {
  kills: number;
  loot: number;
  levels: number;
  verges: number;
}

export interface SummaryState {
  live: SummaryCounters;
  history: SummaryEntry[];
  events: LogEvent[];
}

class CircularBuffer<T> {
  private readonly size: number;
  private readonly buffer: Array<T | undefined>;
  private start = 0;
  private count = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array<T | undefined>(size);
  }

  push(item: T): void {
    const index = (this.start + this.count) % this.size;
    this.buffer[index] = item;

    if (this.count < this.size) {
      this.count++;
    } else {
      this.start = (this.start + 1) % this.size;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.buffer[(this.start + i) % this.size];
      if (item) result.push(item);
    }
    return result.reverse();
  }

  get length(): number {
    return this.count;
  }
}

const MAX_EVENTS = 30;
const eventBuffer = new CircularBuffer<LogEvent>(MAX_EVENTS);

export const summaryState: SummaryState = $state({
  live: { kills: 0, loot: 0, levels: 0, verges: 0 },
  history: [],
  events: []
});

let hotTally: SummaryCounters & { startTime: number } = {
  kills: 0,
  loot: 0,
  levels: 0,
  verges: 0,
  startTime: Date.now()
};

function syncEvents(): void {
  summaryState.events = eventBuffer.toArray();
}

export function addLog(message: string, type: string = 'normal'): void {
  if (type === 'spawn') return;
  if (type === 'loot') hotTally.loot++;
  if (type === 'system' && message.includes('Level')) hotTally.levels++;
  if (type === 'awakening' && message.includes('Verge')) {
    hotTally.verges++;
    hotTally.kills++;
  }

  const notable = type === 'loot' || type === 'awakening' || type === 'system';
  if (notable) {
    eventBuffer.push({ message, type, ts: Date.now() });
    syncEvents();
  }
}

export function incrementKills(amount: number = 1): void {
  hotTally.kills += amount;
}

// Single batched reactive update per second — replace the entire live object
// so Svelte only fires one signal instead of four separate property mutations.
let summaryInterval: ReturnType<typeof setInterval> | null = null;

function startSummaryInterval(): void {
  if (summaryInterval) return;
  summaryInterval = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    const now = Date.now();

    summaryState.live = {
      kills: hotTally.kills,
      loot: hotTally.loot,
      levels: hotTally.levels,
      verges: hotTally.verges,
    };

    if (now - hotTally.startTime >= 60000) {
      summaryState.history.unshift({
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        kills: hotTally.kills,
        loot: hotTally.loot,
        levels: hotTally.levels,
        verges: hotTally.verges
      });
      if (summaryState.history.length > 5) summaryState.history.pop();

      hotTally.kills = 0;
      hotTally.loot = 0;
      hotTally.levels = 0;
      hotTally.verges = 0;
      hotTally.startTime = now;

      summaryState.live = { kills: 0, loot: 0, levels: 0, verges: 0 };
    }
  }, 1000);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startSummaryInterval();
  });
  startSummaryInterval();
}


import { Decimal, type DecimalSource } from '../systems/decimal.js';

export interface LogEvent {
  message: string;
  type: string;
  ts: number;
}

export interface SummaryEntry {
  time: string;
  kills: Decimal;
  loot: Decimal;
  levels: Decimal;
  verges: Decimal;
}

export interface SummaryCounters {
  kills: Decimal;
  loot: Decimal;
  levels: Decimal;
  verges: Decimal;
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
  live: { kills: new Decimal(0), loot: new Decimal(0), levels: new Decimal(0), verges: new Decimal(0) },
  history: [],
  events: []
});

let hotTally: SummaryCounters & { startTime: number } = {
  kills: new Decimal(0),
  loot: new Decimal(0),
  levels: new Decimal(0),
  verges: new Decimal(0),
  startTime: Date.now()
};

function syncEvents(): void {
  summaryState.events = eventBuffer.toArray();
}

export function addLog(message: string, type: string = 'normal'): void {
  if (type === 'spawn') return;
  if (type === 'loot') hotTally.loot = hotTally.loot.add(1);
  if (type === 'system' && message.includes('Level')) hotTally.levels = hotTally.levels.add(1);
  if (type === 'awakening' && message.includes('Verge')) {
    hotTally.verges = hotTally.verges.add(1);
    hotTally.kills = hotTally.kills.add(1);
  }

  const notable = type === 'loot' || type === 'awakening' || type === 'system';
  if (notable) {
    eventBuffer.push({ message, type, ts: Date.now() });
    syncEvents();
  }
}

export function incrementKills(amount: DecimalSource = 1): void {
  hotTally.kills = hotTally.kills.add(amount);
}

setInterval(() => {
  const now = Date.now();
  summaryState.live.kills = hotTally.kills;
  summaryState.live.loot = hotTally.loot;
  summaryState.live.levels = hotTally.levels;
  summaryState.live.verges = hotTally.verges;

  if (now - hotTally.startTime >= 60000) {
    summaryState.history.unshift({
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      kills: hotTally.kills,
      loot: hotTally.loot,
      levels: hotTally.levels,
      verges: hotTally.verges
    });
    if (summaryState.history.length > 5) summaryState.history.pop();

    hotTally.kills = new Decimal(0);
    hotTally.loot = new Decimal(0);
    hotTally.levels = new Decimal(0);
    hotTally.verges = new Decimal(0);
    hotTally.startTime = now;

    summaryState.live.kills = new Decimal(0);
    summaryState.live.loot = new Decimal(0);
    summaryState.live.levels = new Decimal(0);
    summaryState.live.verges = new Decimal(0);
  }
}, 1000);

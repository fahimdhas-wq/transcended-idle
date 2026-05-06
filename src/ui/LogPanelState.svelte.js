// src/ui/LogPanelState.svelte.js
import { Decimal } from '../systems/decimal.js';

// FIXED: Circular buffer implementation
class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = new Array(size);
    this.start = 0;
    this.count = 0;
  }

  push(item) {
    const index = (this.start + this.count) % this.size;
    this.buffer[index] = item;
    
    if (this.count < this.size) {
      this.count++;
    } else {
      this.start = (this.start + 1) % this.size;
    }
  }

  toArray() {
    const result = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.buffer[(this.start + i) % this.size]);
    }
    return result.reverse(); // Newest first
  }

  get length() {
    return this.count;
  }
}

const MAX_EVENTS = 30;
const eventBuffer = new CircularBuffer(MAX_EVENTS);

export const summaryState = $state({
  live: { kills: new Decimal(0), loot: new Decimal(0), levels: new Decimal(0), verges: new Decimal(0) },
  history: [],
  get events() {
    return eventBuffer.toArray();
  }
});

let hotTally = {
  kills: new Decimal(0),
  loot:  new Decimal(0),
  levels: new Decimal(0),
  verges: new Decimal(0),
  startTime: Date.now()
};

export function addLog(message, type = 'normal') {
  if (type === 'spawn') return;
  if (type === 'loot')      hotTally.loot   = hotTally.loot.add(1);
  if (type === 'system' && message.includes('Level'))  hotTally.levels = hotTally.levels.add(1);
  if (type === 'awakening' && message.includes('Verge')) {
    hotTally.verges = hotTally.verges.add(1);
    hotTally.kills  = hotTally.kills.add(1);
  }

  const notable = type === 'loot' || type === 'awakening' || type === 'system';
  if (notable) {
    eventBuffer.push({ message, type, ts: Date.now() });
  }
}

export function incrementKills(amount = 1) {
  hotTally.kills = hotTally.kills.add(amount);
}

setInterval(() => {
  const now = Date.now();
  summaryState.live.kills  = hotTally.kills;
  summaryState.live.loot   = hotTally.loot;
  summaryState.live.levels = hotTally.levels;
  summaryState.live.verges = hotTally.verges;

  if (now - hotTally.startTime >= 60000) {
    summaryState.history.unshift({
      time:   new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      kills:  hotTally.kills,
      loot:   hotTally.loot,
      levels: hotTally.levels,
      verges: hotTally.verges
    });
    if (summaryState.history.length > 5) summaryState.history.pop();

    hotTally.kills  = new Decimal(0);
    hotTally.loot   = new Decimal(0);
    hotTally.levels = new Decimal(0);
    hotTally.verges = new Decimal(0);
    hotTally.startTime = now;

    summaryState.live.kills  = new Decimal(0);
    summaryState.live.loot   = new Decimal(0);
    summaryState.live.levels = new Decimal(0);
    summaryState.live.verges = new Decimal(0);
  }
}, 1000);
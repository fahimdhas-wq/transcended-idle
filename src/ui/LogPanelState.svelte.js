import { Decimal } from '../systems/decimal.js';

// Reactive summary state (updated 1/sec)
export const summaryState = $state({
  live: { kills: new Decimal(0), loot: new Decimal(0), levels: new Decimal(0), verges: new Decimal(0) },
  history: [],
  events: []   // individual notable events (Legendary drops, Level ups, Seal breaks, etc.)
});

// Fast non-reactive tally
let hotTally = {
  kills: new Decimal(0),
  loot:  new Decimal(0),
  levels: new Decimal(0),
  verges: new Decimal(0),
  startTime: Date.now()
};

const MAX_EVENTS = 30;

export function addLog(message, type = 'normal') {
  if (type === 'spawn') return;
  if (type === 'loot')      hotTally.loot   = hotTally.loot.add(1);
  if (type === 'system' && message.includes('Level'))  hotTally.levels = hotTally.levels.add(1);
  if (type === 'awakening' && message.includes('Verge')) {
    hotTally.verges = hotTally.verges.add(1);
    hotTally.kills  = hotTally.kills.add(1);
  }

  // Push notable events into the event feed
  const notable = type === 'loot' || type === 'awakening' || type === 'system';
  if (notable) {
    summaryState.events.unshift({ message, type, ts: Date.now() });
    if (summaryState.events.length > MAX_EVENTS) summaryState.events.pop();
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

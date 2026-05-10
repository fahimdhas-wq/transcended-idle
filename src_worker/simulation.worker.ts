
// ============================================================
// SIMULATION WORKER
// Off-main-thread game loop using Web Workers
// ============================================================

import { getEngine, initEngine } from './bridge';
import { WorkerForestrySimulator, type ForestryWorkerState } from './forestryWorker.js';

// Worker state
let isRunning = false;
let tickInterval: number | null = null;

// Fixed tick rate: 20 TPS (50ms per tick)
const TICK_RATE_MS = 50;
const MAX_TICKS_PER_FRAME = 100;

// Accumulated time
let accumulatedTime = 0;
let lastTickTime = 0;

// Forestry simulation
let forestrySim: WorkerForestrySimulator | null = null;

// ============================================================
// WORKER MESSAGES
// ============================================================

self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      await handleInit();
      break;

    case 'start':
      handleStart();
      break;

    case 'stop':
      handleStop();
      break;

    case 'tick':
      handleTick(payload.ticks);
      break;

    case 'aggregateStats':
      handleAggregateStats(payload);
      break;

    case 'buyUpgrade':
      handleBuyUpgrade(payload.id, payload.amount);
      break;

    case 'syncState':
      handleSyncState();
      break;

    case 'reset':
      handleReset();
      break;

    // Forestry messages
    case 'forestryInit':
      handleForestryInit(payload);
      break;

    case 'forestryTick':
      handleForestryTick(payload);
      break;

    case 'forestrySync':
      handleForestrySync(payload);
      break;
  }
};

// ============================================================
// HANDLERS
// ============================================================

async function handleInit(): Promise<void> {
  try {
    await initEngine();

    self.postMessage({ type: 'ready', payload: { success: true } });
  } catch (e) {
    console.error('[WORKER] Init failed:', e);
    self.postMessage({ type: 'ready', payload: { success: false, error: String(e) } });
  }
}

function handleStart(): void {
  if (isRunning) return;
  isRunning = true;
  lastTickTime = performance.now();
  accumulatedTime = 0;

  tickInterval = self.setInterval(() => {
    const now = performance.now();
    const dt = now - lastTickTime;
    lastTickTime = now;
    accumulatedTime += dt;

    const engine = getEngine();
    let ticksProcessed = 0;

    while (accumulatedTime >= TICK_RATE_MS && ticksProcessed < MAX_TICKS_PER_FRAME) {
      const result = engine.tick(1);
      accumulatedTime -= TICK_RATE_MS;
      ticksProcessed++;

      if (result === 2) {
        self.postMessage({ type: 'enemyKilled', payload: {} });
      }
    }

    if (accumulatedTime > 2000) {
      accumulatedTime = 2000;
    }

    if (ticksProcessed > 0) {
      const dirtyFlags = engine.getDirtyFlags();
      if (dirtyFlags !== 0) {
        self.postMessage({
          type: 'stateUpdate',
          payload: {
            dirtyFlags,
            gold: engine.getGold(),
            xp: engine.getXP(),
            level: engine.getLevel(),
            kills: engine.getKills(),
            momentum: engine.getMomentum(),
            overcharge: engine.getOvercharge(),
            enemyHP: engine.getEnemyHP(),
            enemyMaxHP: engine.getEnemyMaxHP(),
            tickCount: engine.getTickCount(),
          }
        });

        for (let i = 0; i < 16; i++) {
          if (dirtyFlags & (1 << i)) {
            engine.clearDirty(i);
          }
        }
      }
    }
  }, 5);
}

function handleStop(): void {
  if (tickInterval !== null) {
    self.clearInterval(tickInterval);
    tickInterval = null;
  }
  isRunning = false;
}

function handleTick(ticks: number): void {
  const engine = getEngine();
  engine.tick(ticks);
}

function handleAggregateStats(payload: {
  baseAtk: number;
  baseDef: number;
  baseHP: number;
  baseCrit: number;
  omniMult: number;
  soulMult: number;
  awakenMult: number;
  bestiaryMult: number;
  overclockMult: number;
  sealCount: number;
}): void {
  const engine = getEngine();
  engine.aggregateStats(
    payload.baseAtk, payload.baseDef, payload.baseHP, payload.baseCrit,
    payload.omniMult, payload.soulMult, payload.awakenMult,
    payload.bestiaryMult, payload.overclockMult, payload.sealCount
  );
}

function handleBuyUpgrade(id: number, amount: number): void {
  const engine = getEngine();
  const currentLevel = engine.getUpgradeLevel(id);
  const base = engine.getUpgradeCostBase(id);
  const gain = engine.getUpgradeCostGain(id);
  const costType = engine.getUpgradeCostType(id);

  // Calculate max affordable
  const gold = engine.getGold();
  let maxAffordable = 0;

  if (costType === 0) {
    maxAffordable = engine.calcMaxAffordableLinear(gold, currentLevel, base, gain);
  } else {
    // For geometric, use binary search approximation
    maxAffordable = Math.min(amount, Math.floor(Math.log(gold / base + 1) / Math.log(1.15) + 1));
  }

  const toBuy = Math.min(amount, maxAffordable);
  if (toBuy <= 0) {
    self.postMessage({ type: 'upgradeResult', payload: { id, amount: 0, success: false } });
    return;
  }

  // Calculate cost
  let cost = 0;
  if (costType === 0) {
    cost = engine.calcLinearCost(currentLevel, toBuy, base, gain);
  } else {
    cost = engine.calcGeometricCost(currentLevel, toBuy, base, 1.15);
  }

  // Apply
  if (cost <= gold) {
    engine.addGold(-cost);
    engine.setUpgradeLevel(id, currentLevel + toBuy);
    self.postMessage({ type: 'upgradeResult', payload: { id, amount: toBuy, success: true, cost } });
  } else {
    self.postMessage({ type: 'upgradeResult', payload: { id, amount: 0, success: false } });
  }
}

function handleSyncState(): void {
  const engine = getEngine();

  self.postMessage({
    type: 'fullState',
    payload: {
      gold: engine.getGold(),
      xp: engine.getXP(),
      level: engine.getLevel(),
      kills: engine.getKills(),
      momentum: engine.getMomentum(),
      overcharge: engine.getOvercharge(),
      tickCount: engine.getTickCount(),
      atk: engine.getAtk(),
      def: engine.getDef(),
      hp: engine.getHP(),
      crit: engine.getCrit(),
    }
  });
}

function handleReset(): void {
  const engine = getEngine();
  // Reset player state
  engine.setGold(0);
  engine.setXP(0);
  self.postMessage({ type: 'resetComplete', payload: {} });
}

// ============================================================
// FORESTRY WORKER HANDLERS
// ============================================================

function handleForestryInit(payload: { state?: ForestryWorkerState }): void {
  forestrySim = new WorkerForestrySimulator();
  if (payload.state) {
    forestrySim.loadState(payload.state);
  }
  self.postMessage({ type: 'forestryReady', payload: { success: true } });
}

function handleForestryTick(payload: {
  ticks: number;
  playerLevel: number;
  speedBonus?: number;
  energyEff?: number;
}): void {
  if (!forestrySim) {
    forestrySim = new WorkerForestrySimulator();
  }

  const result = forestrySim.tick(
    payload.ticks,
    payload.playerLevel,
    payload.speedBonus ?? 1,
    payload.energyEff ?? 1
  );

  // Report state update back to main thread
  self.postMessage({
    type: 'forestryStateUpdate',
    payload: {
      state: forestrySim.exportState(),
      harvested: result.harvested,
      harvestCount: result.harvestCount
    }
  });
}

function handleForestrySync(payload: { state: ForestryWorkerState }): void {
  if (forestrySim) {
    forestrySim.loadState(payload.state);
    self.postMessage({ type: 'forestrySyncComplete', payload: {} });
  }
}

// ============================================================
// BOOT
// ============================================================

console.log('[WORKER] Simulation worker loaded');
self.postMessage({ type: 'loaded', payload: {} });

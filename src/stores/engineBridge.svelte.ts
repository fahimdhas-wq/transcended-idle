
// ============================================================
// UI BRIDGE — Svelte reads from WASM via Engine
// Zero-copy UI updates
// ============================================================

import { getEngine, initEngine, formatNumber, formatBigInt } from '../../src_worker/bridge';

let rafId: number | null = null;
let lastUiUpdate = 0;
const UI_UPDATE_INTERVAL = 100; // 10 FPS for most UI, combat can be faster

// ============================================================
// STATE (local Svelte state, updated from WASM)
// ============================================================

export interface EngineState {
  gold: number;
  xp: number;
  level: number;
  kills: number;
  killsBigInt: bigint;
  momentum: number;
  overcharge: number;
  enemyHP: number;
  enemyMaxHP: number;
  enemyAtk: number;
  enemyDef: number;
  enemyLevel: number;
  isFighting: boolean;
  tickCount: number;
  tickCountBigInt: bigint;
  atk: number;
  def: number;
  hp: number;
  maxHP: number;
  crit: number;
  isReady: boolean;
}

let state: EngineState = $state({
  gold: 0,
  xp: 0,
  level: 1,
  kills: 0,
  killsBigInt: 0n,
  momentum: 0,
  overcharge: 0,
  enemyHP: 0,
  enemyMaxHP: 0,
  enemyAtk: 0,
  enemyDef: 0,
  enemyLevel: 0,
  isFighting: false,
  tickCount: 0,
  tickCountBigInt: 0n,
  atk: 0,
  def: 0,
  hp: 0,
  maxHP: 0,
  crit: 0.01,
  isReady: false,
});

// ============================================================
// INITIALIZATION
// ============================================================

export async function initUiBridge(): Promise<void> {
  await initEngine();
  const engine = getEngine();
  state.isReady = engine.isReady();

  if (state.isReady) {
    startRenderLoop();
  }
}

// ============================================================
// RENDER LOOP (reads from WASM memory every frame)
// ============================================================

function startRenderLoop(): void {
  const engine = getEngine();

  const render = (timestamp: number) => {
    if (!state.isReady) {
      rafId = requestAnimationFrame(render);
      return;
    }

    const now = performance.now();
    if (now - lastUiUpdate >= UI_UPDATE_INTERVAL) {
      lastUiUpdate = now;

      const dirtyFlags = engine.getDirtyFlags();

      // Gold
      if (dirtyFlags & 1) {
        const gold = engine.getGold();
        if (gold !== state.gold) state.gold = gold;
      }

      // XP
      if (dirtyFlags & 2) {
        const xp = engine.getXP();
        if (xp !== state.xp) state.xp = xp;
      }

      // Level
      if (dirtyFlags & 4) {
        const level = engine.getLevel();
        if (level !== state.level) state.level = level;
      }

      // Kills
      if (dirtyFlags & 8) {
        const kills = engine.getKills();
        state.killsBigInt = kills;
        state.kills = Number(kills);
      }

      // Stats
      if (dirtyFlags & 16) {
        state.momentum = engine.getMomentum();
        state.overcharge = engine.getOvercharge();
        state.atk = engine.getAtk();
        state.def = engine.getDef();
        state.hp = engine.getHP();
        state.maxHP = engine.getMaxHP();
        state.crit = engine.getCrit();
      }

      // Enemy
      if (dirtyFlags & 32) {
        state.enemyHP = engine.getEnemyHP();
        state.enemyMaxHP = engine.getEnemyMaxHP();
        state.enemyAtk = engine.getEnemyAtk();
        state.enemyDef = engine.getEnemyDef();
        state.enemyLevel = engine.getEnemyLevel();
        state.isFighting = engine.isCombatActive();
      }

      // Clear dirty flags
      if (dirtyFlags !== 0) {
        for (let i = 0; i < 16; i++) {
          if (dirtyFlags & (1 << i)) {
            engine.clearDirty(i);
          }
        }
      }

      // Always update tick count
      state.tickCountBigInt = engine.getTickCount();
      state.tickCount = Number(state.tickCountBigInt);
    }

    rafId = requestAnimationFrame(render);
  };

  rafId = requestAnimationFrame(render);
}

// ============================================================
// UI ACTIONS (send commands to WASM)
// ============================================================

export function uiBuyUpgrade(id: number, amount: number): boolean {
  const engine = getEngine();
  const currentLevel = engine.getUpgradeLevel(id);
  const base = engine.getUpgradeCostBase(id);
  const gain = engine.getUpgradeCostGain(id);
  const costType = engine.getUpgradeCostType(id);
  const gold = engine.getGold();

  let maxAffordable = 0;
  if (costType === 0) {
    maxAffordable = engine.calcMaxAffordableLinear(gold, currentLevel, base, gain);
  } else {
    maxAffordable = Math.min(amount, Math.floor(Math.log(gold / base + 1) / Math.log(1.15) + 1));
  }

  const toBuy = Math.min(amount, maxAffordable);
  if (toBuy <= 0) return false;

  let cost = 0;
  if (costType === 0) {
    cost = engine.calcLinearCost(currentLevel, toBuy, base, gain);
  } else {
    cost = engine.calcGeometricCost(currentLevel, toBuy, base, 1.15);
  }

  if (cost <= gold) {
    engine.addGold(-cost);
    engine.setUpgradeLevel(id, currentLevel + toBuy);
    return true;
  }
  return false;
}

export function uiCalcCost(id: number, level: number, amount: number, base: number, gain: number, type: number): number {
  const engine = getEngine();
  if (type === 0) {
    return engine.calcLinearCost(level, amount, base, gain);
  } else {
    return engine.calcGeometricCost(level, amount, base, 1.15);
  }
}

export function uiCalcMaxAffordable(budget: number, level: number, base: number, gain: number, type: number): number {
  const engine = getEngine();
  if (type === 0) {
    return engine.calcMaxAffordableLinear(budget, level, base, gain);
  } else {
    return Math.floor(Math.log(budget / base + 1) / Math.log(1.15) + 1);
  }
}

export function uiGetUpgradeLevel(id: number): number {
  return getEngine().getUpgradeLevel(id);
}

export function uiAggregateStats(stats: {
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
    stats.baseAtk, stats.baseDef, stats.baseHP, stats.baseCrit,
    stats.omniMult, stats.soulMult, stats.awakenMult,
    stats.bestiaryMult, stats.overclockMult, stats.sealCount
  );
}

export function uiSpawnEnemy(playerLevel: number): void {
  getEngine().spawnEnemy(playerLevel);
}

export function uiCombatTick(): number {
  return getEngine().combatTick();
}

// ============================================================
// FORMATTED GETTERS
// ============================================================

export function getGoldFormatted(): string {
  return formatNumber(state.gold);
}

export function getXPFormatted(): string {
  return formatNumber(state.xp);
}

export function getEnemyHPFormatted(): string {
  return formatNumber(state.enemyHP);
}

export function getEnemyMaxHPFormatted(): string {
  return formatNumber(state.enemyMaxHP);
}

export function getMomentumPercent(): number {
  return Math.min(100, Math.floor(state.momentum * 100));
}

export function getOverchargePercent(): number {
  return Math.min(100, Math.floor(state.overcharge * 100));
}

export function getEnemyHPPercent(): number {
  if (state.enemyMaxHP <= 0) return 0;
  return Math.min(100, Math.floor((state.enemyHP / state.enemyMaxHP) * 100));
}

// ============================================================
// STATE GETTER
// ============================================================

export function getEngineState(): EngineState {
  return state;
}

// ============================================================
// WORKER CONNECTION
// ============================================================

let simulationWorker: Worker | null = null;

export function connectToWorker(): void {
  try {
    simulationWorker = new Worker(
      new URL('../src_worker/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    simulationWorker.onmessage = (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'stateUpdate':
          if (payload.gold !== undefined) state.gold = payload.gold;
          if (payload.xp !== undefined) state.xp = payload.xp;
          if (payload.level !== undefined) state.level = payload.level;
          if (payload.kills !== undefined) {
            state.killsBigInt = payload.kills;
            state.kills = Number(payload.kills);
          }
          if (payload.momentum !== undefined) state.momentum = payload.momentum;
          if (payload.overcharge !== undefined) state.overcharge = payload.overcharge;
          if (payload.enemyHP !== undefined) state.enemyHP = payload.enemyHP;
          if (payload.enemyMaxHP !== undefined) state.enemyMaxHP = payload.enemyMaxHP;
          if (payload.tickCount !== undefined) {
            state.tickCountBigInt = payload.tickCount;
            state.tickCount = Number(payload.tickCount);
          }
          break;

        case 'enemyKilled':
          state.enemyHP = 0;
          break;

        case 'ready':
          if (payload.success) {
            state.isReady = true;
            console.log('[UI] Worker ready');
          }
          break;
      }
    };

    simulationWorker.postMessage({ type: 'init' });
  } catch (e) {
    console.error('[UI] Failed to connect to worker:', e);
    // Fallback: use direct WASM without worker
    initUiBridge();
  }
}

export function startSimulation(): void {
  simulationWorker?.postMessage({ type: 'start' });
}

export function stopSimulation(): void {
  simulationWorker?.postMessage({ type: 'stop' });
}

export function resetEngine(): void {
  if (simulationWorker) {
    simulationWorker.postMessage({ type: 'reset' });
  }
}

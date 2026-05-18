/**
 * Engine Core — Orchestrates all engine subsystems.
 *
 * This is the single entry point for starting/stopping the game.
 * The UI should only interact with Engine, never with subsystems directly.
 *
 * Usage:
 *   import { engine } from './Engine.ts';
 *
 *   // Start the game
 *   engine.start();
 *
 *   // Check game state
 *   const state = engine.getState();
 *
 *   // Save/load
 *   engine.save();
 *   engine.load();
 *
 *   // Dev tools
 *   engine.skipTime(days);
 */

import { eventBus, type GameEvent } from './events/EventBus.js';
import { commandDispatcher, dispatch, type GameCommand } from './commands/GameCommands.js';
import { scheduler } from './simulation/TickScheduler.js';
import { snapshotManager } from './snapshots/SnapshotManager.js';

// Import game systems for tick processing
import { performCombatTick } from '../modules/combat.svelte.js';
import { performMiningTick } from '../modules/mining.svelte.js';
import { performForestryTick } from '../modules/forestry.svelte.js';
import { rewardSystem } from '../systems/rewardSystem.js';
import { checkAchievements } from '../systems/achievementSystem.svelte.js';
import { addLog, incrementKills } from '../ui/LogPanelState.svelte.js';
import {
  checkAndRotateChallenge,
  checkChallengeCompletion,
  claimDailyReward,
  isChallengeComplete,
  dailyChallengeState
} from '../modules/dailyChallenge.svelte.js';
import {
  character,
  updateDerivedStats,
  applyMomentumSoftcap,
  applyOverchargeSoftcap,
  safeKills
} from '../modules/character.svelte.js';
import { combatState, flushStatCache, getEffectiveCombatStats } from '../modules/combat.svelte.js';
import { forestryState } from '../modules/forestry.svelte.js';
import { saveSystem } from '../core/saveSystem.js';
import { gameConfig } from '../data/config.js';
import { autoUpgradeMining, autoUpgradeForestry, autoUpgradeBestiary } from '../utils/globalMaxUpgrade.js';
import { matrixState } from '../modules/matrix.svelte.js';
import { doOverclock, LEVEL_REQ } from '../modules/overclock.svelte.js';
import { bestiaryState } from '../modules/bestiary.svelte.js';
import { Decimal } from '../systems/decimal.js';

// ============================================================
// Engine Class
// ============================================================

export class GameEngine {
  private initialized = false;
  private tickCallbacks: Array<(ticks: number) => void> = [];

  constructor() {
    // Bind methods
    this.tick = this.tick.bind(this);
  }

  /**
   * Initialize the engine and all subsystems.
   * Called once at game start.
   */
  init(): void {
    if (this.initialized) return;

    // Register snapshots for UI
    this.registerSnapshots();

    // Register tick callback for simulation
    scheduler.onTick(this.tick);

    // Set up snapshot updates
    scheduler.setSnapshotUpdate((now) => {
      snapshotManager.update(now);
    });

    this.initialized = true;
    console.log('[Engine] Initialized');
  }

  /**
   * Start the game loop.
   */
  start(): void {
    if (!this.initialized) {
      this.init();
    }

    // Load save data
    const offlineMs = saveSystem.load();
    if (offlineMs > 0) {
      console.log(`[Engine] Loaded save with ${(offlineMs / 1000).toFixed(1)}s offline`);
    }

    // Initialize daily challenge
    checkAndRotateChallenge();

    // Initialize login tracking
    const now = Date.now();
    if (character.firstLoginTime === 0) {
      character.firstLoginTime = now;
      character.dailyLogins = 1;
      addLog('[SYSTEM] Welcome, Player. Your journey begins.', 'system');
    } else {
      character.dailyLogins++;
    }
    character.lastLoginTime = now;

    // Start the scheduler
    scheduler.start();

    console.log('[Engine] Started');
  }

  /**
   * Stop the game loop.
   */
  stop(): void {
    scheduler.stop();
    console.log('[Engine] Stopped');
  }

  /**
   * Process a tick of game simulation.
   */
  private tick(ticks: number): void {
    // ---- Momentum & Overcharge ----
    character.momentum += 0.01 * ticks;
    if (character.kills.gt(0)) {
      character.momentum += safeKills() * 0.0001 * ticks;
    }
    character.momentum = applyMomentumSoftcap(character.momentum);

    if (character.xp.gte(character.xpNeeded)) {
      character.overcharge += 0.05 * ticks;
    }
    character.overcharge = applyOverchargeSoftcap(character.overcharge);

    // ---- Level processing ----
    const levelsGained = rewardSystem.processLevelUps();

    // ---- Combat ----
    performCombatTick(ticks);

    // ---- Daily Challenge tracking ----
    const combatKills = combatState.kills;
    if (combatKills > 0) {
      for (let i = 0; i < combatKills; i++) {
        eventBus.emit({ type: 'ENEMY_KILLED', enemy: null as any, kills: 1 });
      }
      combatState.kills = 0;
    }
    if (combatState.lastHitCrit) {
      combatState.lastHitCrit = false;
    }

    // ---- Mining & Forestry ----
    performMiningTick(ticks);
    performForestryTick(ticks);

    // ---- Automation ----
    if (matrixState.autoSkill) {
      // upgradeAllSkills(); // Can be expensive, throttled elsewhere
    }
    if (matrixState.autoMining) autoUpgradeMining();
    if (matrixState.autoForestry) autoUpgradeForestry();
    if (matrixState.autoBestiary) autoUpgradeBestiary();

    if (matrixState.autoOverclock) {
      const target = new Decimal(matrixState.targetOverclockLevel);
      if (target.gte(LEVEL_REQ) && character.level.gte(target)) {
        doOverclock();
      }
    }

    // ---- Throttled checks ----
    const tickCount = scheduler.getTickCount();
    if (tickCount % 50 === 0) {
      checkAchievements();
    }
    if (tickCount % 50 === 0) {
      checkChallengeCompletion();
      if (dailyChallengeState.completedToday && !dailyChallengeState.claimedReward) {
        const reward = claimDailyReward();
        if (reward) {
          addLog(`[DAILY] Auto-claimed ${reward.shards} Shards!`, 'awakening');
        }
      }
    }

    // Notify tick subscribers
    for (const callback of this.tickCallbacks) {
      callback(ticks);
    }
  }

  /**
   * Register snapshots for UI consumption.
   */
  private registerSnapshots(): void {
    // Mining snapshot - 10 FPS
    snapshotManager.register({
      key: 'mining',
      throttleMs: 100,
      getter: () => ({
        unlocked: true,
        energy: 0,
        maxEnergy: 100,
        miningProgress: 0,
        minesPerSecond: 0,
        dataRate: 0,
        isOverclocked: false,
        overclockTicks: 0
      })
    });

    // Forestry snapshot - 10 FPS
    snapshotManager.register({
      key: 'forestry',
      throttleMs: 100,
      getter: () => ({
        unlocked: true,
        energy: 0,
        maxEnergy: 100,
        growthProgress: 0,
        harvestRate: 0,
        dnaRate: 0,
        isOverclocked: false,
        overclockTicks: 0
      })
    });

    // Character snapshot - 10 FPS
    snapshotManager.register({
      key: 'character',
      throttleMs: 100,
      getter: () => ({
        level: character.level.toString(),
        xp: character.xp.toString(),
        xpNeeded: character.xpNeeded.toString(),
        kills: character.kills.toString(),
        momentum: character.momentum,
        overcharge: character.overcharge
      })
    });

    console.log('[Engine] Snapshots registered');
  }

  /**
   * Get a snapshot value.
   */
  getSnapshot<T>(key: string): T | undefined {
    return snapshotManager.get<T>(key);
  }

  /**
   * Force refresh a snapshot.
   */
  refreshSnapshot(key: string): void {
    snapshotManager.forceUpdate(key);
  }

  /**
   * Register a callback for tick events.
   */
  onTick(callback: (ticks: number) => void): () => void {
    this.tickCallbacks.push(callback);
    return () => {
      const index = this.tickCallbacks.indexOf(callback);
      if (index !== -1) this.tickCallbacks.splice(index, 1);
    };
  }

  /**
   * Get engine statistics.
   */
  getStats(): {
    tickCount: number;
    tps: number;
    registeredSnapshots: string[];
    registeredEvents: string[];
    commandHistoryLength: number;
  } {
    return {
      tickCount: scheduler.getTickCount(),
      tps: scheduler.getTPS(),
      registeredSnapshots: snapshotManager.getKeys(),
      registeredEvents: eventBus.getRegisteredEvents(),
      commandHistoryLength: commandDispatcher.getHistory().length
    };
  }

  /**
   * Skip time for testing/daily challenge.
   */
  skipTime(days: number): string {
    // Placeholder - actual implementation in gameLoop
    return `[Engine] Skipped ${days} day(s)`;
  }

  /**
   * Dispatch a command through the command system.
   */
  execute(command: GameCommand) {
    return dispatch(command);
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const engine = new GameEngine();

// Convenience exports
export const {
  start: startEngine,
  stop: stopEngine
} = engine;

export { eventBus } from './events/EventBus.js';
export { dispatch, validate } from './commands/GameCommands.js';
export { on, once, off, emit, emitDeferred } from './events/EventBus.js';

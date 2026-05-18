/**
 * Tick Scheduler — Fixed-rate simulation with variable rendering.
 *
 * Problem: requestAnimationFrame fires at display rate (60 FPS), but
 * game simulation should run at a fixed rate (20 TPS for idle games).
 * Variable timestep causes physics inconsistencies and makes
 * deterministic replay impossible.
 *
 * Solution:
 * - Simulation runs at fixed 20 TPS (50ms per tick)
 * - Rendering happens whenever there's time (60 FPS target)
 * - Batched ticks can catch up when tab is inactive
 *
 * Usage:
 *   const scheduler = new TickScheduler();
 *   scheduler.onTick((ticks) => { processSimulation(ticks); });
 *   scheduler.onFrame((delta) => { render(delta); });
 *   scheduler.start();
 */

import { eventBus } from '../events/EventBus.js';
import type { GameEvent } from '../events/EventBus.js';

// ============================================================
// Configuration
// ============================================================

export interface TickSchedulerConfig {
  /** Target ticks per second (default: 20) */
  tps: number;
  /** Maximum ticks to process per frame (prevents spiral of death) */
  maxTicksPerFrame: number;
  /** Maximum offline time to simulate in ms (default: 30 days) */
  maxOfflineMs: number;
  /** Throttle rate for UI snapshots in ms (default: 100 = 10 FPS) */
  snapshotThrottleMs: number;
  /** Interval for achievement checks in ticks (default: 50) */
  achievementInterval: number;
  /** Interval for daily challenge checks in ticks (default: 50) */
  challengeInterval: number;
}

const DEFAULT_CONFIG: TickSchedulerConfig = {
  tps: 20,
  maxTicksPerFrame: 2000,
  maxOfflineMs: 30 * 24 * 3600 * 1000, // 30 days
  snapshotThrottleMs: 100,
  achievementInterval: 50,
  challengeInterval: 50
};

// ============================================================
// Tick Scheduler
// ============================================================

export class TickScheduler {
  private config: TickSchedulerConfig;
  private tickRate: number; // ms per tick
  private accumulatedTime = 0;
  private lastTickTime = 0;
  private lastFrameTime = 0;
  private isRunning = false;
  private isPaused = false;

  // Counters for throttled operations
  private tickCount = 0;
  private achievementCounter = 0;
  private challengeCounter = 0;

  // Callbacks
  private tickCallbacks: Array<(ticks: number) => void> = [];
  private frameCallbacks: Array<(delta: number) => void> = [];
  private offlineCallbacks: Array<(ms: number) => void> = [];

  // Snapshot manager integration
  private snapshotUpdate: ((now: number) => void) | null = null;

  constructor(config: Partial<TickSchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tickRate = 1000 / this.config.tps;
  }

  /**
   * Register a callback for simulation ticks.
   * @param callback Called with number of ticks to process
   */
  onTick(callback: (ticks: number) => void): () => void {
    this.tickCallbacks.push(callback);
    return () => {
      const index = this.tickCallbacks.indexOf(callback);
      if (index !== -1) this.tickCallbacks.splice(index, 1);
    };
  }

  /**
   * Register a callback for rendering frames.
   * @param callback Called with delta time in ms
   */
  onFrame(callback: (delta: number) => void): () => void {
    this.frameCallbacks.push(callback);
    return () => {
      const index = this.frameCallbacks.indexOf(callback);
      if (index !== -1) this.frameCallbacks.splice(index, 1);
    };
  }

  /**
   * Register a callback for offline processing.
   * @param callback Called with elapsed time in ms
   */
  onOffline(callback: (ms: number) => void): () => void {
    this.offlineCallbacks.push(callback);
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index !== -1) this.offlineCallbacks.splice(index, 1);
    };
  }

  /**
   * Set the snapshot update function.
   * Should be SnapshotManager.update or equivalent.
   */
  setSnapshotUpdate(fn: (now: number) => void): void {
    this.snapshotUpdate = fn;
  }

  /**
   * Start the scheduler.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = performance.now();
    this.lastFrameTime = this.lastTickTime;
    this.tickLoop();
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    this.isRunning = false;
    eventBus.emit({ type: 'GAME_PAUSED' } as GameEvent);
  }

  /**
   * Pause the scheduler (simulation stops, frames continue).
   */
  pause(): void {
    this.isPaused = true;
    eventBus.emit({ type: 'GAME_PAUSED' } as GameEvent);
  }

  /**
   * Resume from pause.
   */
  resume(): void {
    this.isPaused = false;
    this.lastTickTime = performance.now();
    eventBus.emit({ type: 'GAME_RESUMED' } as GameEvent);
  }

  /**
   * Reset tick counters.
   */
  reset(): void {
    this.tickCount = 0;
    this.achievementCounter = 0;
    this.challengeCounter = 0;
    this.accumulatedTime = 0;
  }

  /**
   * Get current tick count.
   */
  getTickCount(): number {
    return this.tickCount;
  }

  /**
   * Get current TPS.
   */
  getTPS(): number {
    return this.config.tps;
  }

  /**
   * Force a tick (for testing).
   */
  forceTick(ticks: number = 1): void {
    this.processTicks(ticks);
  }

  private tickLoop(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Fire frame callbacks
    for (const callback of this.frameCallbacks) {
      try {
        callback(frameDelta);
      } catch (e) {
        console.error('[TickScheduler] Frame callback error:', e);
      }
    }

    // Process simulation ticks
    if (!this.isPaused) {
      this.update(now);
    }

    // Schedule next frame
    requestAnimationFrame(() => this.tickLoop());
  }

  private update(now: number): void {
    const dt = now - this.lastTickTime;
    this.lastTickTime = now;

    // Handle tab being inactive (large dt = offline)
    if (dt > 5000) {
      const offlineMs = Math.min(dt, this.config.maxOfflineMs);
      this.processOffline(offlineMs);
      this.accumulatedTime = 0;
      return;
    }

    // Update snapshots at throttle rate
    if (this.snapshotUpdate) {
      this.snapshotUpdate(now);
    }

    // Accumulate time for fixed-rate ticks
    this.accumulatedTime += dt;

    // Calculate ticks to process
    let ticksToProcess = Math.floor(this.accumulatedTime / this.tickRate);

    // Clamp to prevent spiral of death
    if (ticksToProcess > this.config.maxTicksPerFrame) {
      ticksToProcess = this.config.maxTicksPerFrame;
    }

    // Process ticks
    if (ticksToProcess > 0) {
      this.accumulatedTime -= ticksToProcess * this.tickRate;
      this.processTicks(ticksToProcess);
    }
  }

  private processTicks(ticks: number): void {
    // Increment counters
    this.tickCount += ticks;
    this.achievementCounter += ticks;
    this.challengeCounter += ticks;

    // Emit tick batch event
    eventBus.emit({ type: 'TICK_BATCH', ticks } as GameEvent);

    // Fire tick callbacks
    for (const callback of this.tickCallbacks) {
      try {
        callback(ticks);
      } catch (e) {
        console.error('[TickScheduler] Tick callback error:', e);
      }
    }

    // Throttled achievement check
    if (this.achievementCounter >= this.config.achievementInterval) {
      this.achievementCounter = 0;
      this.checkAchievements();
    }

    // Throttled challenge check
    if (this.challengeCounter >= this.config.challengeInterval) {
      this.challengeCounter = 0;
      this.checkChallenges();
    }
  }

  private processOffline(ms: number): void {
    console.log(`[TickScheduler] Processing ${(ms / 1000).toFixed(1)}s offline`);
    eventBus.emit({ type: 'GAME_PAUSED' } as GameEvent);

    for (const callback of this.offlineCallbacks) {
      try {
        callback(ms);
      } catch (e) {
        console.error('[TickScheduler] Offline callback error:', e);
      }
    }

    eventBus.emit({ type: 'GAME_RESUMED' } as GameEvent);
  }

  private checkAchievements(): void {
    // Placeholder - actual implementation in achievementSystem.svelte.ts
    // This just emits an event that systems can listen to
    // import { checkAchievements } from '../../systems/achievementSystem.svelte.js';
  }

  private checkChallenges(): void {
    // Placeholder - actual implementation in dailyChallenge.svelte.ts
    // import { checkChallengeCompletion, claimDailyReward } from '../../modules/dailyChallenge.svelte.js';
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const scheduler = new TickScheduler();

export const startScheduler = () => scheduler.start();
export const stopScheduler = () => scheduler.stop();
export const pauseScheduler = () => scheduler.pause();
export const resumeScheduler = () => scheduler.resume();
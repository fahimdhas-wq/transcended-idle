/**
 * Event Bus — Centralized pub/sub for decoupled system communication.
 *
 * Usage:
 *   eventBus.on('ENEMY_KILLED', handler);
 *   eventBus.emit({ type: 'ENEMY_KILLED', enemy, kills });
 *   eventBus.off('ENEMY_KILLED', handler);
 */

import type { DecimalSource } from '../../systems/decimal.js';

// ============================================================
// Enemy Type (minimal for event types)
// ============================================================

export interface EnemyRef {
  id: string;
  name?: string;
  level?: DecimalSource;
  hp?: DecimalSource;
  maxHp?: DecimalSource;
  attack?: DecimalSource;
  type?: string;
}

// ============================================================
// Event Types
// ============================================================

export type GameEvent =
  // Combat events
  | { type: 'ENEMY_KILLED'; enemy: EnemyRef; kills: DecimalSource; isInstakill?: boolean }
  | { type: 'ENEMY_SPAWNED'; enemy: EnemyRef }
  | { type: 'PLAYER_DEFEATED' }
  | { type: 'LIMIT_BREAK' }
  // Level & XP events
  | { type: 'LEVEL_UP'; level: DecimalSource; levelsGained: number }
  | { type: 'XP_GAINED'; amount: DecimalSource }
  | { type: 'MOMENTUM_CHANGED'; value: number }
  | { type: 'OVERCHARGE_CHANGED'; value: number }
  // Resource events
  | { type: 'RESOURCE_MINED'; resourceId: string; amount: number; isCritical?: boolean }
  | { type: 'RESOURCE_FORESTED'; resourceId: string; amount: number; isMutation?: boolean }
  | { type: 'FRAGMENT_GAINED'; fragmentType: 'data' | 'skill' | 'dna'; amount: DecimalSource }
  | { type: 'LOOT_DROPPED'; itemName: string; rarity: string; count: number }
  // Skill events
  | { type: 'SKILL_UPGRADED'; skillId: string; newTier: number }
  | { type: 'SKILLS_AUTOMATED'; totalUpgrades: number }
  // Upgrade events
  | { type: 'MINING_UPGRADED'; upgradeType: string; count: number }
  | { type: 'FORESTRY_UPGRADED'; upgradeType: string; count: number }
  | { type: 'TOOL_UPGRADED'; system: 'mining' | 'forestry'; newTier: number }
  | { type: 'OVERCLOCK_TRIGGERED'; system: 'mining' | 'forestry' }
  | { type: 'OVERCLOCK_ENDED'; system: 'mining' | 'forestry' }
  // Combat automation events
  | { type: 'BESTIARY_ENTRY_KILLED'; mobId: string; kills: DecimalSource }
  | { type: 'BESTIARY_STAGE_CHANGE'; mobId: string; oldStage: string; newStage: string }
  | { type: 'SOUL_COLLECTED'; amount: DecimalSource }
  // Daily challenge events
  | { type: 'DAILY_CHALLENGE_STARTED'; challenge: string }
  | { type: 'DAILY_CHALLENGE_COMPLETED'; challenge: string; shards: number }
  | { type: 'DAILY_CHALLENGE_CLAIMED'; shards: number }
  | { type: 'DAILY_CHALLENGE_ROTATED'; oldChallenge: string; newChallenge: string }
  // Ascension events
  | { type: 'ASCENSION_PRESTIGE'; oldLevel: DecimalSource; newLevel: number; bonus: number }
  // UI notification events
  | { type: 'LOG_MESSAGE'; message: string; category: 'system' | 'loot' | 'awakening' | 'combat' }
  | { type: 'TOAST_SHOWN'; message: string; toastType: string }
  // Save events
  | { type: 'SAVE_COMPLETED' }
  | { type: 'SAVE_FAILED'; error: string }
  | { type: 'LOAD_COMPLETED'; offlineMs: number }
  // Game state events
  | { type: 'GAME_PAUSED' }
  | { type: 'GAME_RESUMED' }
  | { type: 'TICK_BATCH'; ticks: number };

type EventHandler = (event: GameEvent) => void;

interface HandlerEntry {
  handler: EventHandler;
  once: boolean;
}

// ============================================================
// Event Bus Implementation
// ============================================================

class EventBusImpl {
  private handlers = new Map<string, HandlerEntry[]>();
  private eventQueue: GameEvent[] = [];
  private isEmitting = false;

  /**
   * Subscribe to an event type.
   * @param eventType The event type to listen for
   * @param handler Function called when event fires
   * @returns Unsubscribe function
   */
  on<T extends GameEvent['type']>(
    eventType: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): () => void {
    const entry: HandlerEntry = { handler: handler as EventHandler, once: false };
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(entry);
    this.handlers.set(eventType, handlers);

    // Return unsubscribe function
    return () => this.off(eventType, handler as EventHandler);
  }

  /**
   * Subscribe to an event type, but only fire once.
   * @param eventType The event type to listen for
   * @param handler Function called when event fires
   * @returns Unsubscribe function (no-op after first fire)
   */
  once<T extends GameEvent['type']>(
    eventType: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): () => void {
    const entry: HandlerEntry = { handler: handler as EventHandler, once: true };
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(entry);
    this.handlers.set(eventType, handlers);

    return () => this.off(eventType, handler as EventHandler);
  }

  /**
   * Unsubscribe from an event type.
   */
  off<T extends GameEvent['type']>(
    eventType: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    const index = handlers.findIndex(h => h.handler === handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    if (handlers.length === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Emit an event immediately.
   * Handlers are called synchronously in registration order.
   */
  emit<T extends GameEvent['type']>(event: Extract<GameEvent, { type: T }>): void {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.length === 0) return;

    // Process handlers, removing 'once' handlers after execution
    for (let i = handlers.length - 1; i >= 0; i--) {
      const entry = handlers[i];
      try {
        entry.handler(event);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event.type}:`, error);
      }

      if (entry.once) {
        handlers.splice(i, 1);
      }
    }

    if (handlers.length === 0) {
      this.handlers.delete(event.type);
    }
  }

  /**
   * Emit an event in the next microtask.
   * Useful for deferring UI updates until after current tick completes.
   */
  emitDeferred<T extends GameEvent['type']>(event: Extract<GameEvent, { type: T }>): void {
    this.eventQueue.push(event);

    if (!this.isEmitting) {
      this.isEmitting = true;
      Promise.resolve().then(() => {
        this.flushQueue();
        this.isEmitting = false;
      });
    }
  }

  private flushQueue(): void {
    const queue = this.eventQueue;
    this.eventQueue = [];

    for (const event of queue) {
      this.emit(event);
    }
  }

  /**
   * Remove all handlers for an event type.
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get count of handlers for an event type.
   * Useful for debugging.
   */
  listenerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * List all registered event types.
   * Useful for debugging.
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance
export const eventBus = new EventBusImpl();

// ============================================================
// Convenience Exports
// ============================================================

export const on = (eventBus.on).bind(eventBus);
export const once = (eventBus.once).bind(eventBus);
export const off = (eventBus.off).bind(eventBus);
export const emit = (eventBus.emit).bind(eventBus);
export const emitDeferred = (eventBus.emitDeferred).bind(eventBus);

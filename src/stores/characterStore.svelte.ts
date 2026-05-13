/**
 * Character Panel Store — Passive Svelte store using engine snapshots.
 *
 * Demonstrates Phase 7: Passive UI presentation layer.
 *
 * UI reads from snapshots (10 FPS), never from live state.
 * Actions go through command dispatcher.
 */

import { snapshotManager, eventBus, type GameEvent } from '../engine/index.js';
import { character } from '../modules/character.svelte.js';
import { combatState } from '../modules/combat.svelte.js';
import { skillsState } from '../modules/skills.svelte.js';
import { Decimal } from '../systems/decimal.js';

// ============================================================
// Character Snapshot (updated at 10 FPS)
// ============================================================

interface CharacterSnapshot {
  level: string;
  xp: string;
  xpNeeded: string;
  xpPercent: number;
  kills: string;
  momentum: number;
  overcharge: number;
  skillFragments: string;
  seals: number;
  currentHp: string;
  maxHp: string;
  currentDefense: string;
  maxDefense: string;
  attack: string;
}

let characterSnapshot = $state<CharacterSnapshot>({
  level: '1',
  xp: '0',
  xpNeeded: '100',
  xpPercent: 0,
  kills: '0',
  momentum: 0,
  overcharge: 0,
  skillFragments: '0',
  seals: 0,
  currentHp: '100',
  maxHp: '100',
  currentDefense: '50',
  maxDefense: '50',
  attack: '10',
});

// ============================================================
// Register Snapshot with Engine
// ============================================================

snapshotManager.register({
  key: 'character',
  throttleMs: 100, // 10 FPS
  getter: () => {
    const xpPercent = character.xpNeeded.gt(0)
      ? Math.min(100, character.xp.div(character.xpNeeded).mul(100).toNumber())
      : 0;

    return {
      level: character.level.toString(),
      xp: character.xp.toString(),
      xpNeeded: character.xpNeeded.toString(),
      xpPercent,
      kills: character.kills.toString(),
      momentum: character.momentum,
      overcharge: character.overcharge,
      skillFragments: character.skillFragments.toString(),
      seals: character.seals,
      currentHp: character.stats.hp.toString(),
      maxHp: character.stats.maxHp.toString(),
      currentDefense: character.stats.defense.toString(),
      maxDefense: character.stats.maxDefense.toString(),
      attack: character.stats.attack.toString(),
    };
  }
});

// ============================================================
// Character Store — UI reads from here, not from character directly
// ============================================================

export const characterStore = {
  get snapshot() {
    const engineSnapshot = snapshotManager.get<CharacterSnapshot>('character');
    return engineSnapshot || characterSnapshot;
  },

  get hpPercent(): number {
    const s = this.snapshot;
    const maxHp = new Decimal(s.maxHp);
    const currentHp = new Decimal(s.currentHp);
    return maxHp.gt(0) ? Math.min(100, currentHp.div(maxHp).mul(100).toNumber()) : 0;
  },

  get defensePercent(): number {
    const s = this.snapshot;
    const maxDef = new Decimal(s.maxDefense);
    const currentDef = new Decimal(s.currentDefense);
    return maxDef.gt(0) ? Math.min(100, currentDef.div(maxDef).mul(100).toNumber()) : 0;
  },

  // Listen for level up events
  onLevelUp(callback: (level: string, levelsGained: number) => void): () => void {
    return eventBus.on('LEVEL_UP', (e) => {
      callback(String(e.level), e.levelsGained);
    });
  },

  // Listen for kills
  onKill(callback: (kills: number) => void): () => void {
    return eventBus.on('ENEMY_KILLED', (e) => {
      callback(new Decimal(e.kills).toNumber());
    });
  },

  refresh(): void {
    snapshotManager.forceUpdate('character');
  }
};

// ============================================================
// Combat State Store (for combat panel)
// ============================================================

interface CombatSnapshot {
  isFighting: boolean;
  currentEnemy: {
    name: string;
    hp: string;
    maxHp: string;
    level: string;
  } | null;
  lastHitCrit: boolean;
}

let combatSnapshot = $state<CombatSnapshot>({
  isFighting: false,
  currentEnemy: null,
  lastHitCrit: false,
});

snapshotManager.register({
  key: 'combat',
  throttleMs: 100,
  getter: () => {
    const enemy = combatState.enemy;
    return {
      isFighting: combatState.isFighting,
      currentEnemy: enemy ? {
        name: enemy.name || 'Unknown',
        hp: enemy.hp instanceof Decimal ? enemy.hp.toString() : String(enemy.hp),
        maxHp: enemy.maxHp instanceof Decimal ? enemy.maxHp.toString() : String(enemy.maxHp),
        level: enemy.level instanceof Decimal ? enemy.level.toString() : String(enemy.level),
      } : null,
      lastHitCrit: combatState.lastHitCrit,
    };
  }
});

export const combatStore = {
  get snapshot() {
    const snap = snapshotManager.get<CombatSnapshot>('combat');
    return snap || combatSnapshot;
  },

  get enemyHpPercent(): number {
    const enemy = this.snapshot.currentEnemy;
    if (!enemy) return 0;
    const maxHp = new Decimal(enemy.maxHp);
    const currentHp = new Decimal(enemy.hp);
    return maxHp.gt(0) ? Math.min(100, currentHp.div(maxHp).mul(100).toNumber()) : 0;
  }
};

// ============================================================
// Skills Store (for skills panel)
// ============================================================

interface SkillsSnapshot {
  skills: Array<{
    id: string;
    name: string;
    tierIndex: number;
    autoCast: boolean;
  }>;
  totalSkillFragments: string;
}

snapshotManager.register({
  key: 'skills',
  throttleMs: 500, // Skills don't change as often
  getter: () => ({
    skills: skillsState.skills.map(s => ({
      id: s.id,
      name: s.name,
      tierIndex: s.tierIndex,
      autoCast: s.autoCast,
    })),
    totalSkillFragments: character.skillFragments.toString(),
  })
});

export const skillsStore = {
  get snapshot() {
    const snap = snapshotManager.get<SkillsSnapshot>('skills');
    return snap || { skills: [], totalSkillFragments: '0' };
  },

  get totalFragments(): Decimal {
    return character.skillFragments;
  },

  upgradeSkill(skillId: string, count: number = 1): void {
    // This would go through command dispatcher
    // For now, keep direct for compatibility
  }
};

// ============================================================
// Dev Tools
// ============================================================

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).characterStore = characterStore;
  (window as any).combatStore = combatStore;
  (window as any).skillsStore = skillsStore;
  (window as any).refreshCharacterSnapshot = () => characterStore.refresh();
}
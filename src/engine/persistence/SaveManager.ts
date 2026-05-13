/**
 * Save Manager — Migration-ready persistence with versioning.
 *
 * Problem: Most idle games corrupt saves when updating because:
 * - No version tracking
 * - No migration between versions
 * - No backup system
 * - No corruption recovery
 *
 * Solution:
 * - Versioned save format with checksum
 * - Sequential migrations (v1→v2→v3...)
 * - Auto-backup rotation (last 5 saves)
 * - Integrity validation
 * - Fallback to backups on corruption
 *
 * Usage:
 *   import { saveManager } from '../persistence/SaveManager.js';
 *
 *   // Save
 *   saveManager.save();
 *
 *   // Load (auto-migrates)
 *   const offlineMs = saveManager.load();
 *
 *   // Backup
 *   const backup = saveManager.createBackup();
 *   saveManager.restoreBackup(backup.id);
 */

import { eventBus } from '../events/EventBus.js';
import type { GameEvent } from '../events/EventBus.js';

// ============================================================
// Constants
// ============================================================

export const SAVE_KEY = 'cyber_idle_save_v4';
const BACKUP_PREFIX = 'cyber_idle_backup_v4_';
const MAX_BACKUPS = 5;
export const CURRENT_VERSION = 4;

// ============================================================
// Save Data Structure
// ============================================================

export interface SaveData {
  version: number;
  timestamp: number;
  checksum: string;
  data: {
    character?: unknown;
    inventory?: unknown;
    skills?: unknown;
    mining?: unknown;
    forestry?: unknown;
    bestiary?: unknown;
    overclock?: unknown;
    matrix?: unknown;
    dailyChallenge?: unknown;
    ascension?: unknown;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  version: number;
  size: number;
  checksum: string;
}

// ============================================================
// Checksum Utilities
// ============================================================

function computeChecksum(data: object): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex string
  const hex = (hash >>> 0).toString(16);
  return hex.padStart(8, '0');
}

function verifyChecksum(data: object, checksum: string): boolean {
  return computeChecksum(data) === checksum;
}

// ============================================================
// Migration Functions
// ============================================================

type MigrationFn = (data: SaveData) => SaveData;

const migrations: Record<number, MigrationFn> = {
  // v1 → v2
  1: (data) => {
    // Example: Rename field
    if (data.data.character) {
      const char = data.data.character as Record<string, unknown>;
      if ('oldField' in char) {
        char.newField = char.oldField;
        delete char.oldField;
      }
    }
    return { ...data, version: 2 };
  },

  // v2 → v3
  2: (data) => {
    // Example: Add new field with default
    if (data.data.character) {
      const char = data.data.character as Record<string, unknown>;
      if (!('newlyAddedField' in char)) {
        char.newlyAddedField = 0;
      }
    }
    return { ...data, version: 3 };
  },

  // v3 → v4
  3: (data) => {
    // Migrate to current format
    // Ensure all required fields exist
    if (data.data.character) {
      const char = data.data.character as Record<string, unknown>;
      // Add any v4-specific fields
      if (!('totalPlayTime' in char)) {
        char.totalPlayTime = 0;
      }
    }
    return { ...data, version: 4 };
  }
};

// Apply all migrations sequentially
function migrateData(data: SaveData): SaveData {
  if (data.version >= CURRENT_VERSION) {
    return data;
  }

  let current = data;
  for (let v = data.version; v < CURRENT_VERSION; v++) {
    if (migrations[v]) {
      current = migrations[v](current);
      console.log(`[SaveManager] Migrated from v${v} to v${v + 1}`);
    }
  }

  return current;
}

// ============================================================
// Save Manager Class
// ============================================================

class SaveManagerImpl {
  private saveInProgress = false;
  private loadInProgress = false;

  /**
   * Save current game state.
   */
  save(stateGetters: {
    character: () => unknown;
    inventory: () => unknown;
    skills: () => unknown;
    mining: () => unknown;
    forestry: () => unknown;
    bestiary: () => unknown;
    overclock: () => unknown;
    matrix: () => unknown;
    dailyChallenge: () => unknown;
    ascension: () => unknown;
  }): boolean {
    if (this.saveInProgress) {
      console.warn('[SaveManager] Save already in progress, skipping');
      return false;
    }

    this.saveInProgress = true;

    try {
      // Create backup before saving
      this.rotateBackups();

      const data = {
        character: stateGetters.character(),
        inventory: stateGetters.inventory(),
        skills: stateGetters.skills(),
        mining: stateGetters.mining(),
        forestry: stateGetters.forestry(),
        bestiary: stateGetters.bestiary(),
        overclock: stateGetters.overclock(),
        matrix: stateGetters.matrix(),
        dailyChallenge: stateGetters.dailyChallenge(),
        ascension: stateGetters.ascension()
      };

      const saveData: SaveData = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        checksum: '', // Will be computed after data
        data
      };

      // Compute checksum of actual data
      saveData.checksum = computeChecksum(data);

      const serialized = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, serialized);

      eventBus.emit({ type: 'SAVE_COMPLETED' } as GameEvent);
      console.log(`[SaveManager] Saved ${(serialized.length / 1024).toFixed(1)}KB`);

      return true;
    } catch (e) {
      console.error('[SaveManager] Save failed:', e);
      eventBus.emit({ type: 'SAVE_FAILED', error: String(e) } as GameEvent);
      return false;
    } finally {
      this.saveInProgress = false;
    }
  }

  /**
   * Load and migrate save data.
   * Returns offline time in ms.
   */
  load(): number {
    if (this.loadInProgress) {
      console.warn('[SaveManager] Load already in progress, skipping');
      return 0;
    }

    this.loadInProgress = true;

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        console.log('[SaveManager] No save found');
        return 0;
      }

      let parsed: SaveData;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.error('[SaveManager] Save file corrupted, trying backup...');
        return this.recoverFromBackup();
      }

      // Validate structure
      if (!this.validateSaveData(parsed)) {
        console.error('[SaveManager] Invalid save structure, trying backup...');
        return this.recoverFromBackup();
      }

      // Migrate if needed
      if (parsed.version < CURRENT_VERSION) {
        console.log(`[SaveManager] Migrating save from v${parsed.version} to v${CURRENT_VERSION}`);
        parsed = migrateData(parsed);
      }

      // Verify checksum
      if (parsed.checksum && !verifyChecksum(parsed.data, parsed.checksum)) {
        console.warn('[SaveManager] Checksum mismatch, save may be corrupted');
        // Continue anyway, some data might be salvageable
      }

      // Apply data to state (callers should implement this)
      const offlineMs = Date.now() - parsed.timestamp;

      eventBus.emit({ type: 'LOAD_COMPLETED', offlineMs } as GameEvent);
      console.log(`[SaveManager] Loaded v${parsed.version}, ${(offlineMs / 1000 / 60).toFixed(1)}min offline`);

      return offlineMs;
    } catch (e) {
      console.error('[SaveManager] Load failed:', e);
      return this.recoverFromBackup();
    } finally {
      this.loadInProgress = false;
    }
  }

  /**
   * Validate save data structure.
   */
  private validateSaveData(data: unknown): data is SaveData {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;

    if (typeof d.version !== 'number') return false;
    if (typeof d.timestamp !== 'number') return false;
    if (typeof d.data !== 'object') return false;

    return true;
  }

  /**
   * Create a backup of current save.
   */
  createBackup(): BackupMetadata | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const id = `backup_${Date.now()}`;
    const key = `${BACKUP_PREFIX}${id}`;

    try {
      localStorage.setItem(key, raw);
      const parsed: SaveData = JSON.parse(raw);
      return {
        id,
        timestamp: parsed.timestamp,
        version: parsed.version,
        size: raw.length,
        checksum: parsed.checksum
      };
    } catch (e) {
      console.error('[SaveManager] Backup failed:', e);
      return null;
    }
  }

  /**
   * Restore from a backup.
   */
  restoreBackup(backupId: string): boolean {
    const key = `${BACKUP_PREFIX}${backupId}`;
    const backup = localStorage.getItem(key);

    if (!backup) {
      console.error(`[SaveManager] Backup not found: ${backupId}`);
      return false;
    }

    try {
      localStorage.setItem(SAVE_KEY, backup);
      console.log(`[SaveManager] Restored backup: ${backupId}`);
      return true;
    } catch (e) {
      console.error('[SaveManager] Restore failed:', e);
      return false;
    }
  }

  /**
   * Rotate backups (keep last MAX_BACKUPS).
   */
  private rotateBackups(): void {
    // Get all backup keys
    const backupKeys: Array<{ key: string; timestamp: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            backupKeys.push({ key, timestamp: parsed.timestamp || 0 });
          } catch {
            // Invalid backup, remove it
            localStorage.removeItem(key);
          }
        }
      }
    }

    // Sort by timestamp (oldest first)
    backupKeys.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest backups to keep MAX_BACKUPS
    while (backupKeys.length >= MAX_BACKUPS) {
      const oldest = backupKeys.shift();
      if (oldest) {
        localStorage.removeItem(oldest.key);
        console.log(`[SaveManager] Removed old backup: ${oldest.key}`);
      }
    }

    // Create new backup
    this.createBackup();
  }

  /**
   * Get list of available backups.
   */
  getBackups(): BackupMetadata[] {
    const backups: BackupMetadata[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed: SaveData = JSON.parse(raw);
            backups.push({
              id: key.replace(BACKUP_PREFIX, ''),
              timestamp: parsed.timestamp,
              version: parsed.version,
              size: raw.length,
              checksum: parsed.checksum
            });
          } catch {
            // Skip invalid backups
          }
        }
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Recover from backup when main save is corrupted.
   */
  private recoverFromBackup(): number {
    const backups = this.getBackups();
    if (backups.length === 0) {
      console.error('[SaveManager] No backups available');
      return 0;
    }

    // Try most recent backup
    for (const backup of backups) {
      try {
        const key = `${BACKUP_PREFIX}${backup.id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (this.validateSaveData(parsed)) {
            localStorage.setItem(SAVE_KEY, raw);
            console.log(`[SaveManager] Recovered from backup: ${backup.id}`);
            return Date.now() - parsed.timestamp;
          }
        }
      } catch {
        // Try next backup
      }
    }

    console.error('[SaveManager] All backups corrupted');
    return 0;
  }

  /**
   * Delete all save data (wipe).
   */
  wipeAll(): void {
    localStorage.removeItem(SAVE_KEY);

    // Remove all backups
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(BACKUP_PREFIX) || key === SAVE_KEY)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('[SaveManager] All save data wiped');
  }

  /**
   * Get current save info.
   */
  getSaveInfo(): {
    exists: boolean;
    version: number | null;
    timestamp: number | null;
    size: number | null;
    checksum: string | null;
  } {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return { exists: false, version: null, timestamp: null, size: null, checksum: null };
    }

    try {
      const parsed: SaveData = JSON.parse(raw);
      return {
        exists: true,
        version: parsed.version,
        timestamp: parsed.timestamp,
        size: raw.length,
        checksum: parsed.checksum
      };
    } catch {
      return { exists: false, version: null, timestamp: null, size: null, checksum: null };
    }
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const saveManager = new SaveManagerImpl();
export const SAVE_KEY_EXPORT = SAVE_KEY;

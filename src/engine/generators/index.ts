/**
 * Generators Index — Procedural content generation.
 */

export {
  generateEnemy,
  generateEnemyWave,
  calculateDifficultyMultiplier,
  estimateTimeToKill,
  type EnemyType,
  type GeneratedEnemy,
  type EnemyGeneratorOptions
} from './EnemyGenerator.js';

export {
  generateItem,
  generateLoot,
  rollRarity,
  rollFromLootTable,
  type Rarity,
  type GeneratedItem,
  type ItemStats,
  type LootGenerationOptions,
  type LootTableEntry
} from './LootGenerator.js';

/**
 * Formulas Index — Re-exports for convenient access.
 */

// Re-export memo utilities
export {
  memoize,
  memoDecimal,
  memoNumber,
  memoBoolean,
  invalidateCache,
  getCacheStats,
  formulaCache
} from './memo.js';

// Re-export combat formulas
export {
  calculateEnemyXP,
  calculateXPWithMultipliers,
  calculateXPNeededForLevel,
  calculateBaseStats,
  calculateCritChance,
  calculateCritMultiplier,
  calculateAverageDamage,
  calculateEffectiveDPS,
  calculateTicksToKill,
  calculateEnemyHP,
  calculateEnemyAttack,
  calculateDamageToPlayer,
  calculateFragmentGain,
  applyMomentumSoftcap,
  applyOverchargeSoftcap,
  calculateMomentumGainPerTick,
  getCachedEffectiveStats,
  type DamageMultipliers,
  type CritInfo,
  type CombatStats,
  type XPResult
} from './combatFormulas.js';

// Re-export economy formulas
export {
  calculateSingleCost,
  calculateBulkCost,
  calculateMaxAffordable,
  calculateGatheringSpeed,
  calculateEnergyCost,
  calculateEnergyRegen,
  calculateYield,
  calculateCritChance as calculateGatheringCritChance,
  calculateResourceYield,
  calculateFragmentDrop,
  calculateNextToolCost,
  canAffordTool,
  calculateRefinementOutput,
  processRefineChain,
  getCachedUpgradeCost,
  getCachedBulkInfo,
  DEFAULT_GATHERING_CONFIG,
  type CostFormula,
  type GatheringConfig,
  type ToolDefinition
} from './economyFormulas.js';
